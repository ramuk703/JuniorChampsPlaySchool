import { useRef, useState } from "react";
import {
  FiCheckCircle,
  FiImage,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";

const getImageUrl = (url) => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `http://localhost:5000${url}`;
  }

  return `http://localhost:5000/${url}`;
};

function GalleryImageManager({
  gallery,
  onSetCover,
  onUpdateCaption,
  onDeleteImage,
  onAddImages,
  isBusy = false,
}) {
  const inputRef = useRef(null);
  const [captions, setCaptions] = useState({});

  const handleAddImages = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length) {
      onAddImages(files);
    }
  };

  const handleCaptionSave = (image) => {
    const caption = captions[image._id];

    if (caption === undefined) return;

    onUpdateCaption(image._id, caption);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Gallery Images</h3>
          <p className="mt-1 text-xs text-slate-500">
            Set a cover image, edit captions, or add more images.
          </p>
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <FiUpload size={16} />
          Add Images
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAddImages}
          className="hidden"
        />
      </div>

      {!gallery.images?.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <FiImage className="mx-auto text-slate-300" size={34} />
          <p className="mt-2 text-sm text-slate-500">
            No images in this gallery.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.images.map((image) => {
            const isCover = gallery.coverImage === image.url;
            const caption =
              captions[image._id] !== undefined
                ? captions[image._id]
                : image.caption || "";

            return (
              <div
                key={image._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={getImageUrl(image.url)}
                    alt={image.caption || gallery.title}
                    className="h-full w-full object-cover"
                  />

                  {isCover ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                      <FiCheckCircle size={13} />
                      Cover
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3 p-4">
                  <textarea
                    value={caption}
                    onChange={(event) =>
                      setCaptions((current) => ({
                        ...current,
                        [image._id]: event.target.value,
                      }))
                    }
                    maxLength={200}
                    rows={2}
                    placeholder="Image caption..."
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                  <div className="flex gap-2">
                    {!isCover ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onSetCover(image.url)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Set Cover
                      </button>
                    ) : null}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleCaptionSave(image)}
                      className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      Save Caption
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onDeleteImage(image)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label="Delete image"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GalleryImageManager;
