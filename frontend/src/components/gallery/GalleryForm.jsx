import { useRef, useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";

function GalleryForm({
  mode = "create",
  initialGallery = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = "",
}) {
  const [title, setTitle] = useState(initialGallery?.title || "");
  const [description, setDescription] = useState(
    initialGallery?.description || ""
  );
  const [status, setStatus] = useState(initialGallery?.status || "Active");
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);

    if (mode === "create") {
      setFiles(selected.slice(0, 20));
    } else {
      setFiles(selected);
    }

    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const submit = (event) => {
    event.preventDefault();

    if (!title.trim()) return;

    if (mode === "create") {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("status", status);

      files.forEach((file) => {
        formData.append("galleryImages", file);
      });

      onSubmit(formData);
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700">
          Gallery Title
        </label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          required
          placeholder="e.g. Annual Sports Day"
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Describe this gallery..."
          className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">
          Status
        </label>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {mode === "create" ? (
        <div>
          <label className="text-sm font-semibold text-slate-700">
            Gallery Images
          </label>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1.5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center hover:border-slate-400 hover:bg-slate-100"
          >
            <FiUpload size={24} className="text-slate-500" />
            <span className="mt-2 text-sm font-semibold text-slate-700">
              Choose images
            </span>
            <span className="mt-1 text-xs text-slate-500">
              Up to 20 images
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />

          {files.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="aspect-square w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/80 p-1.5 text-white hover:bg-slate-900"
                    aria-label={`Remove ${file.name}`}
                  >
                    <FiX size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              The first uploaded image will become the cover image.
            </p>
          )}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create Gallery"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default GalleryForm;
