const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

require("dotenv").config();

const BACKUP_DIR = path.resolve(
  process.env.BACKUP_DIR || path.join(process.cwd(), "backups")
);

const BACKUP_RETENTION_DAYS = Number(
  process.env.BACKUP_RETENTION_DAYS || 7
);

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || "test";

function validateConfig() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (
    !Number.isInteger(BACKUP_RETENTION_DAYS) ||
    BACKUP_RETENTION_DAYS < 1
  ) {
    throw new Error("BACKUP_RETENTION_DAYS must be an integer >= 1");
  }
}

function createBackupDirectory() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const backupPath = path.join(BACKUP_DIR, timestamp);

  fs.mkdirSync(backupPath, {
    recursive: true,
    mode: 0o700,
  });

  return backupPath;
}

function createMongoConfig() {
  const configPath = path.join(
    os.tmpdir(),
    `mongodump-${process.pid}-${Date.now()}.conf`
  );

  const configContent = `uri: "${MONGODB_URI.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"\n`;

  fs.writeFileSync(configPath, configContent, {
    mode: 0o600,
  });

  fs.chmodSync(configPath, 0o600);

  return configPath;
}

function runMongoDump(configPath, backupPath) {
  return new Promise((resolve, reject) => {
    const args = [
      `--config=${configPath}`,
      `--db=${MONGODB_DATABASE}`,
      "--gzip",
      `--out=${backupPath}`,
    ];

    const child = spawn("mongodump", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(
        new Error(`Failed to start mongodump: ${error.message}`)
      );
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `mongodump failed with exit code ${code}: ${stderr.trim()}`
        )
      );
    });
  });
}

function removeOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return;
  }

  const cutoff =
    Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  for (const entry of fs.readdirSync(BACKUP_DIR, {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const backupPath = path.join(BACKUP_DIR, entry.name);
    const stats = fs.statSync(backupPath);

    if (stats.mtimeMs < cutoff) {
      fs.rmSync(backupPath, {
        recursive: true,
        force: true,
      });

      console.log(`Removed old backup: ${backupPath}`);
    }
  }
}

async function createBackup() {
  validateConfig();

  fs.mkdirSync(BACKUP_DIR, {
    recursive: true,
    mode: 0o700,
  });

  const backupPath = createBackupDirectory();
  const configPath = createMongoConfig();

  try {
    console.log(`Starting MongoDB backup: ${backupPath}`);

    await runMongoDump(configPath, backupPath);

    removeOldBackups();

    console.log(`MongoDB backup completed: ${backupPath}`);

    return backupPath;
  } finally {
    if (fs.existsSync(configPath)) {
      fs.rmSync(configPath, { force: true });
    }
  }
}

if (require.main === module) {
  createBackup()
    .then((backupPath) => {
      console.log(`Backup ready: ${backupPath}`);
    })
    .catch((error) => {
      console.error(`Backup failed: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  createBackup,
  removeOldBackups,
};