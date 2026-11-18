import { useEffect, useState } from "react";
import {
  fetchOrganiserProfile,
  updateOrganiserProfileDetails,
  getOrganiserErrorMessage,
} from "../../../services/organiserService";
import "../OrganiserHome/OrganiserHome.css"; 

export default function OrganiserProfile() {
  const [stageName, setStageName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await fetchOrganiserProfile();
        if (data) {
          setStageName(data.stage_name || "");
          setDescription(data.description || "");
        }
      } catch (err) {
        setError(getOrganiserErrorMessage(err, "Failed to load organiser profile."));
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      await updateOrganiserProfileDetails({
        stage_name: stageName,
        description,
      });
      setMessage("Organiser profile updated successfully!");
    } catch (err) {
      setError(getOrganiserErrorMessage(err, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="org-queue-card" style={{ padding: "2rem" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="org-queue-card" style={{ padding: "2rem", maxWidth: "650px" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>Organiser Profile</h2>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Update your organisation display name and public description.
      </p>

      {message && (
        <div style={{ color: "green", marginBottom: "1rem", fontWeight: 500 }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ color: "red", marginBottom: "1rem", fontWeight: 500 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.4rem" }}>
            Organisation / Stage Name *
          </label>
          <input
            type="text"
            required
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.4rem" }}>
            About / Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="org-btn-create-event"
          style={{ width: "fit-content", marginTop: "0.5rem" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}