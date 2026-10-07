import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicGalleryById } from "../../services/publicGalleryService";

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

function GalleryDetailPage() {
  const { id } = useParams();

  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGallery = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPublicGalleryById(id);
        setGallery(data.gallery);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load this gallery.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [id]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">Loading gallery...</p>
        </div>
      </section>
    );
  }

  if (error || !gallery) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-medium text-red-700">
            {error || "Gallery not found."}
          </p>

          <Link
            to="/gallery"
            className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Back to Gallery
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          to="/gallery"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Gallery
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Junior Champ&apos;s Play School
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          {gallery.title}
        </h1>

        {gallery.description && (
          <p className="mt-3 max-w-3xl text-slate-600">
            {gallery.description}
          </p>
        )}
      </div>

      {gallery.images?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">
            No images are available in this gallery.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.images.map((image) => (
            <figure
              key={image._id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={getImageUrl(image.url)}
                  alt={image.caption || gallery.title}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                />
              </div>

              {image.caption && (
                <figcaption className="p-4 text-sm text-slate-600">
                  {image.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

export default GalleryDetailPage;
