import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import GalleryForm from "../../components/gallery/GalleryForm";
import GalleryImageManager from "../../components/gallery/GalleryImageManager";
import GalleryPagination from "../../components/gallery/GalleryPagination";
import GalleryTable from "../../components/gallery/GalleryTable";
import {
  addGalleryImages,
  createGallery,
  deleteGallery,
  deleteGalleryImage,
  getGalleryById,
  getGalleries,
  updateGallery,
  updateGalleryImage,
} from "../../services/galleryService";

function GalleryPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGalleryId, setSelectedGalleryId] = useState(null);
  const [formError, setFormError] = useState("");

  const galleriesQuery = useQuery({
    queryKey: ["galleries", { page, status }],
    queryFn: () => getGalleries({ page, limit: 10, status }),
  });

  const selectedGalleryQuery = useQuery({
    queryKey: ["gallery", selectedGalleryId],
    queryFn: () => getGalleryById(selectedGalleryId),
    enabled: Boolean(selectedGalleryId),
  });

  const invalidateGalleries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["galleries"] });

    if (selectedGalleryId) {
      await queryClient.invalidateQueries({
        queryKey: ["gallery", selectedGalleryId],
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: createGallery,
    onSuccess: async () => {
      setShowCreate(false);
      setFormError("");
      setPage(1);
      await invalidateGalleries();
    },
    onError: (error) => {
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Unable to create gallery.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateGallery(id, data),
    onSuccess: async () => {
      setFormError("");
      await invalidateGalleries();
    },
    onError: (error) => {
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Unable to update gallery.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGallery,
    onSuccess: async () => {
      if (selectedGalleryId) {
        setSelectedGalleryId(null);
      }

      await invalidateGalleries();
    },
    onError: (error) => {
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete gallery.",
      );
    },
  });

  const addImagesMutation = useMutation({
    mutationFn: ({ id, formData }) => addGalleryImages(id, formData),
    onSuccess: async () => {
      await invalidateGalleries();
    },
    onError: (error) => {
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Unable to add images.",
      );
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ galleryId, imageId, data }) =>
      updateGalleryImage(galleryId, imageId, data),
    onSuccess: async () => {
      await invalidateGalleries();
    },
    onError: (error) => {
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Unable to update image.",
      );
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ galleryId, imageId }) =>
      deleteGalleryImage(galleryId, imageId),
    onSuccess: async () => {
      await invalidateGalleries();
    },
    onError: (error) => {
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete image.",
      );
    },
  });

  const galleries = Array.isArray(galleriesQuery.data?.galleries)
    ? galleriesQuery.data.galleries
    : [];

  const pagination = galleriesQuery.data?.pagination || {};

  const handleDelete = (gallery) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${gallery.title}"?\n\nThis gallery will no longer appear publicly.`,
    );

    if (!confirmed) return;

    setFormError("");
    deleteMutation.mutate(gallery._id);
  };

  const handleCreate = (formData) => {
    setFormError("");
    createMutation.mutate(formData);
  };

  const handleUpdate = (data) => {
    if (!selectedGalleryId) return;

    setFormError("");
    updateMutation.mutate({
      id: selectedGalleryId,
      data,
    });
  };

  const handleSetCover = (coverImage) => {
    if (!selectedGalleryId) return;

    setFormError("");
    updateMutation.mutate({
      id: selectedGalleryId,
      data: { coverImage },
    });
  };

  const handleAddImages = (files) => {
    if (!selectedGalleryId) return;

    const formData = new FormData();

    files.slice(0, 20).forEach((file) => {
      formData.append("galleryImages", file);
    });

    setFormError("");
    addImagesMutation.mutate({
      id: selectedGalleryId,
      formData,
    });
  };

  const handleUpdateCaption = (imageId, caption) => {
    if (!selectedGalleryId) return;

    setFormError("");
    updateImageMutation.mutate({
      galleryId: selectedGalleryId,
      imageId,
      data: { caption },
    });
  };

  const handleDeleteImage = (image) => {
    if (!selectedGalleryId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this image?",
    );

    if (!confirmed) return;

    setFormError("");
    deleteImageMutation.mutate({
      galleryId: selectedGalleryId,
      imageId: image._id,
    });
  };

  const isBusy =
    updateMutation.isPending ||
    addImagesMutation.isPending ||
    updateImageMutation.isPending ||
    deleteImageMutation.isPending;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Content Management
          </p>

          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <FiImage size={27} />
            Gallery
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage school albums, photos, captions, and cover images.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setShowCreate(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <FiPlus size={17} />
          Create Gallery
        </button>
      </section>

      {formError ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <FiAlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{formError}</span>
          <button
            type="button"
            className="ml-auto"
            onClick={() => setFormError("")}
            aria-label="Dismiss error"
          >
            <FiX size={16} />
          </button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Gallery Directory
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {pagination.total || 0} gallery album
              {(pagination.total || 0) === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={() => galleriesQuery.refetch()}
              disabled={galleriesQuery.isFetching}
              title="Refresh galleries"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw
                size={17}
                className={galleriesQuery.isFetching ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {galleriesQuery.isError ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-700">
              Unable to load galleries
            </p>
            <p className="mt-1 text-sm text-red-600">
              {galleriesQuery.error?.response?.data?.message ||
                galleriesQuery.error?.message ||
                "Something went wrong."}
            </p>
          </div>
        ) : (
          <>
            <GalleryTable
              galleries={galleries}
              loading={galleriesQuery.isLoading}
              onEdit={(gallery) => {
                setFormError("");
                setSelectedGalleryId(gallery._id);
              }}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />

            <GalleryPagination
              page={Number(pagination.page || page)}
              pages={Number(pagination.pages || 1)}
              total={Number(pagination.total || 0)}
              limit={Number(pagination.limit || 10)}
              onPageChange={setPage}
              disabled={galleriesQuery.isFetching}
            />
          </>
        )}
      </section>

      {showCreate ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
          <div className="mx-auto my-8 max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Gallery
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add an album and upload its initial images.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>

            <GalleryForm
              mode="create"
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              isSubmitting={createMutation.isPending}
              error={createMutation.isError ? formError : ""}
            />
          </div>
        </div>
      ) : null}

      {selectedGalleryId ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
          <div className="mx-auto my-8 max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Gallery Management
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedGalleryQuery.data?.gallery?.title ||
                    "Manage Gallery"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGalleryId(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>

            {selectedGalleryQuery.isLoading ? (
              <div className="space-y-4">
                <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ) : selectedGalleryQuery.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                Unable to load gallery details.
              </div>
            ) : selectedGalleryQuery.data?.gallery ? (
              <div className="space-y-8">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-4 font-semibold text-slate-900">
                    Gallery Information
                  </h3>

                  <GalleryForm
                    mode="edit"
                    initialGallery={selectedGalleryQuery.data.gallery}
                    onSubmit={handleUpdate}
                    isSubmitting={updateMutation.isPending}
                    error={updateMutation.isError ? formError : ""}
                  />
                </div>

                <GalleryImageManager
                  gallery={selectedGalleryQuery.data.gallery}
                  onSetCover={handleSetCover}
                  onUpdateCaption={handleUpdateCaption}
                  onDeleteImage={handleDeleteImage}
                  onAddImages={handleAddImages}
                  isBusy={isBusy}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default GalleryPage;
