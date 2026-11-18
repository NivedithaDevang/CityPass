import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./Categories.css";
import {
  fetchAdminCategories,
  addCategory,
  updateCategory,
} from "../../../services/adminService";
import { FaImage } from "react-icons/fa6";

interface AdminCategory {
  id: number;
  name: string;
  image?: string | null;
  is_active: boolean | number;
}

interface CategoryApiResponse {
  id: number;
  name: string;
  image?: string | null;
  status?: string;
  is_active?: boolean | number;
}

const getCategoryStatus = (
  category: CategoryApiResponse
): "ACTIVE" | "INACTIVE" => {
  if (category.status !== undefined && category.status !== null) {
    return String(category.status).toUpperCase() === "ACTIVE"
      ? "ACTIVE"
      : "INACTIVE";
  }

  return category.is_active === true || Number(category.is_active) === 1
    ? "ACTIVE"
    : "INACTIVE";
};

function Categories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Category States
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  // Edit Category States
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null
  );
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryStatus, setEditCategoryStatus] = useState<
    "ACTIVE" | "INACTIVE"
  >("ACTIVE");
  const [editCategoryImage, setEditCategoryImage] = useState<File | null>(null);
  const [editCategoryImagePreview, setEditCategoryImagePreview] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Confirmation Modal State for Status Toggle
  const [statusConfirmCategory, setStatusConfirmCategory] = useState<{
    category: AdminCategory;
    targetStatus: "ACTIVE" | "INACTIVE";
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (editingCategory || statusConfirmCategory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [editingCategory, statusConfirmCategory]);

  // Revoke object URLs to prevent memory leaks
  useEffect(() => {
    if (!categoryImagePreview) return;
    return () => {
      if (categoryImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(categoryImagePreview);
      }
    };
  }, [categoryImagePreview]);

  useEffect(() => {
    if (!editCategoryImagePreview) return;
    return () => {
      if (editCategoryImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(editCategoryImagePreview);
      }
    };
  }, [editCategoryImagePreview]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAdminCategories();

      const list = Array.isArray(response)
        ? response
        : response?.categories ??
          response?.data?.categories ??
          response?.data ??
          [];

      if (!Array.isArray(list)) {
        throw new Error("Invalid categories response");
      }

      const formattedCategories: AdminCategory[] = list.map(
        (category: CategoryApiResponse) => ({
          ...category,
          is_active: category.is_active ?? getCategoryStatus(category) === "ACTIVE",
          status: getCategoryStatus(category),
        })
      );

      setCategories(formattedCategories);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [categories, search]);

  const getStatus = (category: AdminCategory): "ACTIVE" | "INACTIVE" => {
    return category.is_active === true || Number(category.is_active) === 1
      ? "ACTIVE"
      : "INACTIVE";
  };

  const handleCategoryImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Category image must be a JPG, PNG, or WEBP file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Category image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setError(null);
    setCategoryImage(file);
    setCategoryImagePreview(URL.createObjectURL(file));
  };

  const handleEditCategoryImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Category image must be a JPG, PNG, or WEBP file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Category image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setError(null);
    setEditCategoryImage(file);
    setEditCategoryImagePreview(URL.createObjectURL(file));
  };

  const handleAddCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setAddingCategory(true);
      setError(null);
      setSuccess(null);

      await addCategory(categoryName.trim(), categoryImage);

      setCategoryName("");
      setCategoryImage(null);
      setCategoryImagePreview("");
      setShowAddForm(false);
      await loadCategories();
      setSuccess("Category added successfully.");
    } catch (err: any) {
      console.error("Failed to add category:", err);
      setError(
        err?.response?.data?.message ||
          "Category already exists. Please add a new category."
      );
    } finally {
      setAddingCategory(false);
    }
  };

  const handleEditCategory = (category: AdminCategory) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryStatus(getStatus(category));
    setEditCategoryImage(null);
    setEditCategoryImagePreview(category.image || "");
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName("");
    setEditCategoryStatus("ACTIVE");
    setEditCategoryImage(null);
    setEditCategoryImagePreview("");
  };

  const handleSaveCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (!editCategoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSavingCategory(true);
      setError(null);
      setSuccess(null);

      const payload: {
        name: string;
        is_active: boolean;
        image?: File | null;
      } = {
        name: editCategoryName.trim(),
        is_active: editCategoryStatus === "ACTIVE",
      };

      if (editCategoryImage) {
        payload.image = editCategoryImage;
      }

      await updateCategory(editingCategory.id, payload);

      handleCancelEdit();
      await loadCategories();
      setSuccess("Category updated successfully.");
    } catch (err: any) {
      console.error("Failed to update category:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update category. Please try again."
      );
    } finally {
      setSavingCategory(false);
    }
  };

  // Open the Confirmation Popup for Status Update
  const promptStatusUpdate = (category: AdminCategory) => {
    const currentStatus = getStatus(category);
    const targetStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusConfirmCategory({ category, targetStatus });
  };

  // Execute Status Update after confirmation
  const executeStatusUpdate = async () => {
    if (!statusConfirmCategory) return;

    const { category, targetStatus } = statusConfirmCategory;

    try {
      setUpdatingStatus(true);
      setError(null);
      setSuccess(null);

      await updateCategory(category.id, {
        is_active: targetStatus === "ACTIVE",
      });

      setCategories((previous) =>
        previous.map((item) =>
          item.id === category.id
            ? {
                ...item,
                is_active: targetStatus === "ACTIVE" ? 1 : 0,
              }
            : item
        )
      );

      setSuccess(`Category marked as ${targetStatus}.`);
      setStatusConfirmCategory(null);
    } catch (err: any) {
      console.error("Failed to update category status:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update category status. Please try again."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="categories-container">
      <div className="categories-header">
        <div>
          <span className="categories-subtitle">CATEGORY MANAGEMENT</span>
          <h1>Categories</h1>
          <p>Add and manage categories available on CityPass.</p>
        </div>

        <button
          type="button"
          className="categories-add-btn"
          onClick={() => {
            setShowAddForm((previous) => !previous);
            setError(null);
            setSuccess(null);
          }}
        >
          {showAddForm ? "Close" : "+ Add Category"}
        </button>
      </div>

      {error && (
        <div className="categories-message categories-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="categories-message categories-success">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)}>
            Dismiss
          </button>
        </div>
      )}

      {showAddForm && (
        <form className="category-add-form" onSubmit={handleAddCategory}>
          <div className="category-form-group">
            <label htmlFor="category-name">Category Name</label>
            <input
              id="category-name"
              type="text"
              placeholder="Enter category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>

          <div className="category-form-group">
            <label htmlFor="categoryImage">Category Image</label>
            <input
              id="categoryImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCategoryImageChange}
            />
            {categoryImagePreview && (
              <div className="category-image-preview">
                <img src={categoryImagePreview} alt="Category preview" />
                <span>{categoryImage?.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryImage(null);
                    setCategoryImagePreview("");
                    const input = document.getElementById(
                      "categoryImage"
                    ) as HTMLInputElement | null;
                    if (input) input.value = "";
                  }}
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          <div className="category-form-actions">
            <button
              type="button"
              className="category-cancel-btn"
              onClick={() => {
                setShowAddForm(false);
                setCategoryName("");
                setCategoryImage(null);
                setCategoryImagePreview("");
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="category-save-btn"
              disabled={addingCategory}
            >
              {addingCategory ? "Adding..." : "Add Category"}
            </button>
          </div>
        </form>
      )}

      <div className="categories-toolbar">
        <input
          type="text"
          className="categories-search"
          placeholder="Search by category name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="categories-count">
          {filteredCategories.length}{" "}
          {filteredCategories.length === 1 ? "Category" : "Categories"}
        </div>
      </div>

      {loading ? (
        <div className="categories-placeholder">Loading categories...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="categories-placeholder">
          {categories.length === 0
            ? "No categories found."
            : "No categories match your search."}
        </div>
      ) : (
        <div className="categories-table-container">
          <table className="categories-table">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>ID</th>
                <th style={{ width: "80px" }}>Image</th>
                <th>Category Name</th>
                <th style={{ width: "120px" }}>Status</th>
                <th style={{ width: "220px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => {
                const status = getStatus(category);

                return (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="category-table-thumb"
                        />
                      ) : (
                        <div className="category-table-thumb-placeholder">
                          <FaImage />
                        </div>
                      )}
                    </td>
                    <td>{category.name}</td>
                    <td>
                      <span
                        className={`categories-status ${
                          status === "ACTIVE" ? "active" : "inactive"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="category-action-group">
                        <button
                          type="button"
                          className="categories-edit-btn"
                          onClick={() => handleEditCategory(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={
                            status === "ACTIVE"
                              ? "categories-deactivate-btn"
                              : "categories-activate-btn"
                          }
                          onClick={() => promptStatusUpdate(category)}
                        >
                          {status === "ACTIVE"
                            ? "Make Inactive"
                            : "Make Active"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Category Modal Popup */}
      {editingCategory && (
        <div
          className="category-modal-overlay"
          onClick={handleCancelEdit}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="category-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="category-modal-header">
              <h2>Edit Category: {editingCategory.name}</h2>
              <button
                type="button"
                className="category-modal-close"
                onClick={handleCancelEdit}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="category-form-group">
                <label htmlFor="edit-category-name">Category Name</label>
                <input
                  id="edit-category-name"
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="Category Name"
                  required
                />
              </div>

              <div className="category-form-group">
                <label htmlFor="editCategoryImage">Category Image</label>
                <input
                  id="editCategoryImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleEditCategoryImageChange}
                />
                {editCategoryImagePreview && (
                  <div className="category-image-preview">
                    <img
                      src={editCategoryImagePreview}
                      alt="Category preview"
                    />
                    <span>
                      {editCategoryImage
                        ? editCategoryImage.name
                        : "Current Image"}
                    </span>
                    {editCategoryImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditCategoryImage(null);
                          setEditCategoryImagePreview(
                            editingCategory.image || ""
                          );
                          const input = document.getElementById(
                            "editCategoryImage"
                          ) as HTMLInputElement | null;
                          if (input) input.value = "";
                        }}
                      >
                        Revert
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="category-form-group">
                <label htmlFor="edit-category-status">Status</label>
                <select
                  id="edit-category-status"
                  value={editCategoryStatus}
                  onChange={(e) =>
                    setEditCategoryStatus(
                      e.target.value as "ACTIVE" | "INACTIVE"
                    )
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="category-modal-actions">
                <button
                  type="button"
                  className="category-cancel-btn"
                  onClick={handleCancelEdit}
                  disabled={savingCategory}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="category-save-btn"
                  disabled={savingCategory}
                >
                  {savingCategory ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Make Active / Make Inactive */}
      {statusConfirmCategory && (
        <div
          className="category-modal-overlay"
          onClick={() => {
            if (!updatingStatus) setStatusConfirmCategory(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="category-modal-content"
            style={{ padding: "10px 20px 20px 20px", maxWidth: "420px", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="category-modal-header" style={{ justifyContent: "center" }}>
              <h2>
                {statusConfirmCategory.targetStatus === "INACTIVE"
                  ? "Deactivate Category"
                  : "Activate Category"}
              </h2>
            </div>

            <p style={{ margin: "1rem 0", color: "#475569", lineHeight: "1.5" }}>
              Are you sure you want to mark{" "}
              <strong>"{statusConfirmCategory.category.name}"</strong> as{" "}
              <strong
                style={{
                  color:
                    statusConfirmCategory.targetStatus === "ACTIVE"
                      ? "#15803d"
                      : "#b91c1c",
                }}
              >
                {statusConfirmCategory.targetStatus}
              </strong>
              ?
              {statusConfirmCategory.targetStatus === "INACTIVE"
                ? " Organisers will not be able to assign events to this category while it is inactive."
                : " This category will immediately become available for organisers and event listings."}
            </p>

            <div className="category-modal-actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="category-cancel-btn"
                onClick={() => setStatusConfirmCategory(null)}
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="category-save-btn"
                style={{
                  backgroundColor:
                    statusConfirmCategory.targetStatus === "INACTIVE"
                      ? "#dc2626"
                      : "#16a34a",
                }}
                onClick={executeStatusUpdate}
                disabled={updatingStatus}
              >
                {updatingStatus
                  ? "Updating..."
                  : statusConfirmCategory.targetStatus === "INACTIVE"
                  ? "Yes, Make Inactive"
                  : "Yes, Make Active"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;