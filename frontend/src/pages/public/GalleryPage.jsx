import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicGalleries } from "../../services/publicGalleryService";

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

function GalleryPage() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGalleries = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPublicGalleries({
          page: 1,
          limit: 12,
        });

        setGalleries(data.galleries || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load gallery right now.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadGalleries();
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">Loading gallery...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-medium text-red-700">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Junior Champ&apos;s Play School
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          Our Gallery
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Explore memorable moments and activities from our school.
        </p>
      </div>

      {galleries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">
            No gallery albums are available yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => {
            const image = gallery.coverImage || gallery.images?.[0]?.url;

            return (
              <Link
                key={gallery._id}
                to={`/gallery/${gallery._id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  {image ? (
                    <img
                      src={getImageUrl(image)}
                      alt={gallery.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {gallery.title}
                  </h2>

                  {gallery.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {gallery.description}
                    </p>
                  )}

                  <p className="mt-4 text-sm font-medium text-indigo-600">
                    View gallery →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default GalleryPage;
