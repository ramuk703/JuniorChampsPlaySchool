import {
  FiEdit3,
  FiImage,
  FiTrash2,
} from "react-icons/fi";

import GalleryStatusBadge from "./GalleryStatusBadge";

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

function GalleryTable({
  galleries,
  loading,
  onEdit,
  onDelete,
  isDeleting,
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (!galleries.length) {
    return (
      <div className="p-10 text-center">
        <FiImage className="mx-auto text-slate-300" size={38} />
        <p className="mt-3 font-semibold text-slate-700">
          No galleries found
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Create your first gallery to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Gallery
            </th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Images
            </th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>
            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {galleries.map((gallery) => {
            const cover =
              gallery.coverImage || gallery.images?.[0]?.url || "";

            return (
              <tr key={gallery._id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <div className="flex min-w-[260px] items-center gap-3">
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {cover ? (
                        <img
                          src={getImageUrl(cover)}
                          alt={gallery.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <FiImage size={20} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {gallery.title}
                      </p>

                      {gallery.description ? (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {gallery.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {gallery.images?.length || 0}
                </td>

                <td className="px-5 py-4">
                  <GalleryStatusBadge status={gallery.status} />
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(gallery)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FiEdit3 size={14} />
                      Manage
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => onDelete(gallery)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default GalleryTable;
