const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const User = require("./models/User");

async function test() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected");

    const user = await User.create({
      name: "Admin",
      email: "moderncomputerpointbagodar.edu@gmail.com",
      password: "123456",
      role: "admin",
    });

    console.log("User Created:");
    console.log(user);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
} // <--- यह ब्रैकेट बंद करना ज़रूरी था

test(); // <--- यह लाइन फ़ंक्शन को रन करेगी!
