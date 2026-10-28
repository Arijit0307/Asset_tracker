
import { useEffect, useState } from "react";

import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} from "./assets/services/assetService.js";

const CATEGORIES = ["Laptop", "Monitor", "Mouse", "Keyboard"];

const STATUSES = ["Available", "Allocated", "Maintenance"];

const INITIAL_FORM = {
  name: "",
  category: "Laptop",
  status: "Available",
};

function App() {
  const [assets, setAssets] = useState([]);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Custom delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Fetch assets from backend
  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAssets();

      // Supports both an array and { assets: [...] } response
      const assetList = Array.isArray(response)
        ? response
        : response?.assets;

      if (!Array.isArray(assetList)) {
        throw new Error("Invalid assets response from server.");
      }

      setAssets(assetList);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load assets. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Update form fields
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingId(null);
  };

  // Add or update asset
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const assetName = formData.name.trim();

    if (!assetName) {
      setError("Please enter an asset name.");
      return;
    }

    const payload = {
      name: assetName,
      category: formData.category,
      status: formData.status,
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await updateAsset(editingId, payload);
        setMessage("Asset updated successfully!");
      } else {
        await createAsset(payload);
        setMessage("Asset added successfully!");
      }

      resetForm();
      await fetchAssets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save asset."
      );
    } finally {
      setSaving(false);
    }
  };

  // Select asset for editing
  const handleEdit = (asset) => {
    setFormData({
      name: asset.name || "",
      category: asset.category || "Laptop",
      status: asset.status || "Available",
    });

    setEditingId(asset.id);

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Open custom delete confirmation modal
  const handleDelete = (asset) => {
    setSelectedAsset(asset);
    setShowDeleteModal(true);

    setError("");
    setMessage("");
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (deleting) return;

    setShowDeleteModal(false);
    setSelectedAsset(null);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!selectedAsset || deleting) return;

    const assetId = selectedAsset.id;

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      await deleteAsset(assetId);

      setShowDeleteModal(false);
      setSelectedAsset(null);

      if (editingId === assetId) {
        resetForm();
      }

      setMessage("Asset deleted successfully!");

      await fetchAssets();
    } catch (err) {
      setShowDeleteModal(false);
      setSelectedAsset(null);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete asset."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Dashboard counts
  const totalAssets = assets.length;

  const availableAssets = assets.filter(
    (asset) => asset.status === "Available"
  ).length;

  const allocatedAssets = assets.filter(
    (asset) => asset.status === "Allocated"
  ).length;

  const maintenanceAssets = assets.filter(
    (asset) => asset.status === "Maintenance"
  ).length;

  // Search and filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = (asset.name || "")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      asset.category === categoryFilter;

    const matchesStatus =
      statusFilter === "All" ||
      asset.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Status badge style
  const getStatusClass = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-700";

      case "Allocated":
        return "bg-blue-100 text-blue-700";

      case "Maintenance":
        return "bg-orange-100 text-orange-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Internal Asset Tracker
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage and monitor your organization's IT assets.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAssets}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Assets"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="font-bold"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Dashboard */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Dashboard Overview
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              title="Total Assets"
              value={totalAssets}
              description="All registered assets"
              color="border-gray-400"
            />

            <DashboardCard
              title="Available"
              value={availableAssets}
              description="Ready to be assigned"
              color="border-green-500"
            />

            <DashboardCard
              title="Allocated"
              value={allocatedAssets}
              description="Currently assigned"
              color="border-blue-500"
            />

            <DashboardCard
              title="Maintenance"
              value={maintenanceAssets}
              description="Under maintenance"
              color="border-orange-500"
            />
          </div>
        </section>

        {/* Add / Edit Form */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId !== null ? "Edit Asset" : "Add New Asset"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {editingId !== null
                  ? "Update the selected asset details."
                  : "Enter the details to register a new asset."}
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="self-start rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Asset Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dell Laptop"
                  required
                  maxLength={150}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Asset"
                    : "Add Asset"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Clear Form
              </button>
            </div>
          </form>
        </section>

        {/* Assets Table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Asset Inventory
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {filteredAssets.length} of {totalAssets} assets displayed
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by asset name..."
                aria-label="Search assets by name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by category"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="All">All Categories</option>

                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="All">All Statuses</option>

                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading assets...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-700">
                No assets found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or filters, or add a new asset.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Asset Name</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-gray-500">
                        #{asset.id}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {asset.name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {asset.category}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            asset.status
                          )}`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(asset)}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(asset)}
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && selectedAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDeleteModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 001.7 3h16.96a2 2 0 001.7-3L13.7 3.86a2 2 0 00-3.4 0z"
                />
              </svg>
            </div>

            <h2
              id="delete-modal-title"
              className="text-center text-xl font-bold text-gray-800"
            >
              Delete Asset?
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {selectedAsset.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={closeDeleteModal}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dashboard card component
function DashboardCard({ title, value, description, color }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 border-l-4 bg-white p-5 shadow-sm ${color}`}
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>

      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>

      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  );
}

export default App;
