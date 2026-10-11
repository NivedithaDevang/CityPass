import { useEffect, useMemo, useState } from "react";
import "./Categories.css";
import {
  fetchAdminCategories,
  addCategory,
  updateCategory,
} from "../../../services/adminService";

interface AdminCategory {
  id: number;
  name: string;
  is_active: boolean | number;
}

function Categories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryStatus, setEditCategoryStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [savingCategory, setSavingCategory] = useState(false);

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

      setCategories(list);
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

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setAddingCategory(true);
      setError(null);
      setSuccess(null);

      await addCategory(categoryName.trim());

      setCategoryName("");
      setShowAddForm(false);
      await loadCategories();
      setSuccess("Category added successfully.");
    } catch (err) {
      console.error("Failed to add category:", err);
      setError("Failed to add category. Please try again.");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleEditCategory = (category: AdminCategory) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryStatus(getStatus(category));
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditCategoryStatus("ACTIVE");
  };

  const handleSaveCategory = async () => {
    if (editingCategoryId === null) return;

    if (!editCategoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSavingCategory(true);
      setError(null);
      setSuccess(null);

      await updateCategory(editingCategoryId, {
        name: editCategoryName.trim(),
        is_active: editCategoryStatus === "ACTIVE",
      });

      setCategories((previous) =>
        previous.map((category) =>
          category.id === editingCategoryId
            ? {
                ...category,
                name: editCategoryName.trim(),
                is_active: editCategoryStatus === "ACTIVE" ? 1 : 0,
              }
            : category
        )
      );

      handleCancelEdit();
      setSuccess("Category updated successfully.");
    } catch (err) {
      console.error("Failed to update category:", err);
      setError("Failed to update category. Please try again.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleStatusUpdate = async (category: AdminCategory) => {
    try {
      setError(null);
      setSuccess(null);

      const currentStatus = getStatus(category);
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

      await updateCategory(category.id, {
        is_active: newStatus === "ACTIVE",
      });

      setCategories((previous) =>
        previous.map((item) =>
          item.id === category.id
            ? {
                ...item,
                is_active: newStatus === "ACTIVE" ? 1 : 0,
              }
            : item
        )
      );

      setSuccess(`Category marked as ${newStatus}.`);
    } catch (err) {
      console.error("Failed to update category status:", err);
      setError("Failed to update category status. Please try again.");
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
            />
          </div>

          <div className="category-form-actions">
            <button
              type="button"
              className="category-cancel-btn"
              onClick={() => {
                setShowAddForm(false);
                setCategoryName("");
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
                <th>ID</th>
                <th>Category Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => {
                const status = getStatus(category);
                const isEditing = editingCategoryId === category.id;

                return (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          className="category-edit-input"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                        />
                      ) : (
                        category.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className="category-edit-select"
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
                      ) : (
                        <span
                          className={`categories-status ${
                            status === "ACTIVE" ? "active" : "inactive"
                          }`}
                        >
                          {status}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="category-action-group">
                          <button
                            type="button"
                            className="category-save-btn"
                            disabled={savingCategory}
                            onClick={() => void handleSaveCategory()}
                          >
                            {savingCategory ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="category-cancel-btn"
                            disabled={savingCategory}
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
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
                            onClick={() => void handleStatusUpdate(category)}
                          >
                            {status === "ACTIVE"
                              ? "Make Inactive"
                              : "Make Active"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Categories;