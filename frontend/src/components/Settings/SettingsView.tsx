import "./SettingsView.css";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { IoPerson } from "react-icons/io5";
import { RiCameraAiFill } from "react-icons/ri";
import { FaBullhorn } from "react-icons/fa6";
import { IoIosArrowForward } from "react-icons/io";
import { FaLock } from "react-icons/fa";
import { FaUserAltSlash } from "react-icons/fa";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/config";
import { getNumberErrors } from "../../config/numberCheck";
import { getPasswordErrors } from "../../config/passwordRules";
import { Terms } from "../Terms/DeactivationTerms";
import { Terms as OrganiserTerms } from "../Terms/OrganiserTerms";
import { type City } from "../../types/auth";

interface Category {
  id: number;
  name: string;
}

const TAB_SLUGS = {
  profile: "profile",
  password: "password",
  "host-an-event": "organiser_request",
  deactivate: "delete",
} as const;

type SlugKey = keyof typeof TAB_SLUGS;
type ActiveTab = (typeof TAB_SLUGS)[SlugKey];

const DEACTIVATE_REASONS = [
  "I don't use CityPass anymore",
  "I'm taking a break",
  "I'm not satisfied with the experience",
  "I'm having technical issues",
  "I'm concerned about privacy or security",
  "I'm not finding events I'm interested in",
  "I created this account by mistake",
  "Other",
];

function SettingsView() {
  const { tabSlug } = useParams<{ tabSlug: string }>();
  const navigate = useNavigate();

  const activeTab: ActiveTab =
    tabSlug && tabSlug in TAB_SLUGS
      ? TAB_SLUGS[tabSlug as SlugKey]
      : "profile";

  useEffect(() => {
    if (!tabSlug || !(tabSlug in TAB_SLUGS)) {
      navigate("/settings/profile", { replace: true });
    }
  }, [tabSlug, navigate]);

  const handleTabChange = (slug: SlugKey) => {
    navigate(`/settings/${slug}`);
  };

  const { user, setUser, profileImage, setProfileImage } = useUser();
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    dob: "",
    gender: "",
  });

  const [initialProfile, setInitialProfile] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Organiser Form State
  const [org, setOrg] = useState({
    organization_name: "",
    description: "",
    category: "",
    city: "",
    pan_card: "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Dynamic Options from Backend
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  const [showOrgConfirmPopup, setShowOrgConfirmPopup] = useState(false);
  const [showOrgTerms, setShowOrgTerms] = useState(false);
  const [orgSubmitting, setOrgSubmitting] = useState(false);
  const [orgMessage, setOrgMessage] = useState("");
  const [showOrgSuccessPopup, setShowOrgSuccessPopup] = useState(false);

  const [showProfileSuccessPopup, setShowProfileSuccessPopup] = useState(false);
  const [showPasswordSuccessPopup, setShowPasswordSuccessPopup] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showReloginPopup, setShowReloginPopup] = useState(false);
  const [reloginLoading, setReloginLoading] = useState(false);

  const [showDeactivatePopup, setShowDeactivatePopup] = useState(false);
  const [showDeactivateTerms, setShowDeactivateTerms] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateOtherText, setDeactivateOtherText] = useState("");
  const [deactivateError, setDeactivateError] = useState("");

  const phoneErrors = profile.phone ? getNumberErrors(profile.phone) : [];
  const passwordErrors = newPassword ? getPasswordErrors(newPassword) : [];

  const isProfileDirty =
    Boolean(avatarFile) ||
    profile.name !== initialProfile.name ||
    profile.email !== initialProfile.email ||
    profile.phone !== initialProfile.phone ||
    profile.dob !== initialProfile.dob ||
    profile.gender !== initialProfile.gender;

  // Fetch Cities and Categories from Backend
  useEffect(() => {
    if (activeTab === "organiser_request") {
      const fetchMetadata = async () => {
        try {
          setMetaLoading(true);
          const [citiesRes, categoriesRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/v1/cities`),
            axios.get(`${API_BASE_URL}/v1/categories`),
          ]);

          const cityList = citiesRes.data?.city || citiesRes.data?.cities || citiesRes.data || [];
          const categoryList =
            categoriesRes.data?.categories ||
            categoriesRes.data?.category ||
            categoriesRes.data ||
            [];

          setCities(Array.isArray(cityList) ? cityList : []);
          setCategories(Array.isArray(categoryList) ? categoryList : []);
        } catch (err) {
          console.error("Error fetching cities or categories:", err);
        } finally {
          setMetaLoading(false);
        }
      };

      fetchMetadata();
    }
  }, [activeTab]);

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Profile photos must be smaller than 5 MB.");
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleOrgChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setOrg((currentOrg) => ({ ...currentOrg, [name]: value }));
    setOrgMessage("");
  };

  const handleInitiateOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !org.organization_name.trim() ||
      !org.description.trim() ||
      !org.category.trim() ||
      !org.city.trim() ||
      !org.email.trim()
    ) {
      setOrgMessage("Please fill in all required fields.");
      return;
    }

    if (org.pan_card.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(org.pan_card.trim())) {
      setOrgMessage("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).");
      return;
    }

    setOrgMessage("");
    setShowOrgConfirmPopup(true);
  };

  const handleConfirmOrgSubmit = async () => {
    try {
      setOrgSubmitting(true);
      setOrgMessage("");

      await axios.post(
        `${API_BASE_URL}/v1/organiser-requests`,
        {
          organization_name: org.organization_name.trim(),
          description: org.description.trim(),
          category: org.category.trim(),
          city: org.city.trim(),
          pan_card: org.pan_card.trim().toUpperCase(),
          email: org.email.trim(),
          phone: org.phone.trim(),
        },
        {
          withCredentials: true,
        }
      );

      setShowOrgConfirmPopup(false);
      setShowOrgSuccessPopup(true);
      setOrg({
        organization_name: "",
        description: "",
        category: "",
        city: "",
        pan_card: "",
        email: user?.email || "",
        phone: user?.phone || "",
      });
    } catch (error: any) {
      console.error("Error submitting organiser request:", error);
      setShowOrgConfirmPopup(false);

      if (error?.response?.status === 401) {
        setShowReloginPopup(true);
        return;
      }

      setOrgMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to submit application. Please verify server connection."
      );
    } finally {
      setOrgSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/v1/users/userdetails`,
          { withCredentials: true }
        );

        const fetchedUser = response.data?.user || response.data;
        if (!fetchedUser) return;

        setUser(fetchedUser);

        if (fetchedUser.profile_image) {
          const fullImageUrl = fetchedUser.profile_image.startsWith("http")
            ? fetchedUser.profile_image
            : `${API_BASE_URL}${fetchedUser.profile_image}`;
          setProfileImage(fullImageUrl);
        }

        const loadedProfile = {
          name: fetchedUser.name || "",
          email: fetchedUser.email || "",
          phone: fetchedUser.phone || "",
          dob: fetchedUser.dob ? fetchedUser.dob.split("T")[0] : "",
          gender: fetchedUser.gender || "",
        };

        setProfile(loadedProfile);
        setInitialProfile(loadedProfile);

        // Pre-populate email and phone in the organiser form
        setOrg((prev) => ({
          ...prev,
          email: fetchedUser.email || prev.email,
          phone: fetchedUser.phone || prev.phone,
        }));
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setUser, setProfileImage]);

  const handleSaveProfile = async () => {
    const currentPhoneErrors = getNumberErrors(profile.phone);
    if (profile.phone && currentPhoneErrors.length > 0) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone || "");
      if (profile.dob) formData.append("dob", profile.dob.split("T")[0]);
      if (profile.gender) formData.append("gender", profile.gender);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await axios.patch(
        `${API_BASE_URL}/v1/users/userdetails`,
        formData,
        {
          withCredentials: true,
        }
      );

      const updatedUser = response.data.user;
      setUser(updatedUser);

      if (updatedUser?.profile_image) {
        const fullImageUrl = updatedUser.profile_image.startsWith("http")
          ? updatedUser.profile_image
          : `${API_BASE_URL}${updatedUser.profile_image}`;
        setProfileImage(fullImageUrl);
      }

      const updatedProfile = {
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        dob: updatedUser.dob ? updatedUser.dob.split("T")[0] : "",
        gender: updatedUser.gender || "",
      };

      setProfile(updatedProfile);
      setInitialProfile(updatedProfile);
      setAvatarFile(null);
      setShowProfileSuccessPopup(true);
    } catch (error: any) {
      console.error("Error updating profile:", error);

      if (error.response?.status === 409 || error.response?.status === 404) {
        setMessage(error.response?.data?.message || "This email is already registered.");
      } else {
        setMessage("Unable to update profile.");
      }
      if (error.response?.status === 401) {
        setShowReloginPopup(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRelogin = async () => {
    try {
      setReloginLoading(true);
      await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setShowReloginPopup(false);
      window.location.href = "/?login=true";
    }
  };

  const showProfile = () => {
    if (loading) {
      return <p>Loading profile...</p>;
    }

    const isSaveDisabled =
      saving ||
      !isProfileDirty ||
      !profile.name.trim() ||
      !profile.email.trim() ||
      phoneErrors.length > 0;

    return (
      <div className="panel-content">
        <div className="profile-heading">
          <div className="profile-heading-text">
            <h2>My Profile</h2>
            <p className="panel-subtitle">Manage your personal information</p>
          </div>

          <button
            className="profile-photo-upload"
            type="button"
            onClick={() => profileImageInputRef.current?.click()}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" />
            ) : (
              <span>{(user?.name || "U").charAt(0).toUpperCase()}</span>
            )}
            <span className="profile-photo-plus">
              <RiCameraAiFill />
            </span>
          </button>
          <input
            ref={profileImageInputRef}
            className="profile-image-input"
            type="file"
            accept="image/*"
            onChange={handleProfileImageChange}
            hidden
          />
        </div>

        <div className="form-group">
          <label>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="Enter your phone number"
          />
          {phoneErrors.length > 0 && (
            <span className="phone-error" role="alert">
              {phoneErrors[0]}
            </span>
          )}
        </div>

        <div className="form-group">
          <label>Date of Birth</label>
          <input
            type="date"
            value={profile.dob}
            onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Gender</label>
          <select
            value={profile.gender}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {message && <p className="profile-message">{message}</p>}

        {showReloginPopup && (
          <div className="relogin-overlay">
            <div className="relogin-popup" role="dialog" aria-modal="true">
              <h2>Session expired</h2>
              <p>Your session may have expired. Please log in again to update your profile.</p>
              <div className="relogin-actions">
                <button
                  className="cancel-deactivate-btn"
                  type="button"
                  onClick={() => setShowReloginPopup(false)}
                  disabled={reloginLoading}
                >
                  Cancel
                </button>
                <button
                  className="confirm-relogin-btn"
                  type="button"
                  onClick={handleRelogin}
                  disabled={reloginLoading}
                >
                  {reloginLoading ? "Logging out..." : "Log in again"}
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          className="save-btn"
          onClick={handleSaveProfile}
          disabled={isSaveDisabled}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    );
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setPasswordMessage("Please enter both password fields.");
      return;
    }

    if (passwordErrors.length > 0) {
      setPasswordMessage(passwordErrors.join(". "));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordMessage("");

      await axios.patch(
        `${API_BASE_URL}/v1/users/password`,
        {
          newPassword,
          confirmPassword,
        },
        {
          withCredentials: true,
        }
      );

      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSuccessPopup(true);
    } catch (error: any) {
      console.error("Error updating password:", error);
      setPasswordMessage(
        error.response?.data?.message || "Unable to update password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const changePassword = () => {
    const isUpdateDisabled =
      passwordSaving || !newPassword.trim() || passwordErrors.length > 0;

    return (
      <div className="panel-content">
        <h2>Change Password</h2>
        <p className="panel-subtitle">Update your account password</p>

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordMessage("");
            }}
            placeholder="Enter new password"
          />
          {newPassword && passwordErrors.length > 0 && (
            <div className="password-errors" role="alert" style={{ marginTop: "6px" }}>
              {passwordErrors.map((err) => (
                <div key={err} style={{ color: "#ef4444", fontSize: "0.85rem" }}>
                  {err}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordMessage("");
            }}
            placeholder="Confirm new password"
          />
        </div>

        {passwordMessage && <p className="profile-message">{passwordMessage}</p>}

        <button
          className="save-btn"
          onClick={handleChangePassword}
          disabled={isUpdateDisabled}
        >
          {passwordSaving ? "Updating..." : "Update Password"}
        </button>
      </div>
    );
  };

  const showOrganiserRequest = () => {
    const isOrgSubmitDisabled =
      orgSubmitting ||
      !org.organization_name.trim() ||
      !org.description.trim() ||
      !org.category.trim() ||
      !org.city.trim() ||
      !org.email.trim();

    return (
      <div className="panel-content">
        <h2>Become an Organiser</h2>
        <p className="panel-subtitle">
          Host and manage your events on CityPass
        </p>

        <form onSubmit={handleInitiateOrgSubmit}>
          <div className="form-group">
            <label>
              Organisation Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="organization_name"
              value={org.organization_name}
              onChange={handleOrgChange}
              placeholder="Enter your organisation name"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={org.category}
                onChange={handleOrgChange}
                required
                disabled={metaLoading}
              >
                <option value="">
                  {metaLoading ? "Loading categories..." : "Select category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                City / Location <span className="text-red-500">*</span>
              </label>
              <select
                name="city"
                value={org.city}
                onChange={handleOrgChange}
                required
                disabled={metaLoading}
              >
                <option value="">
                  {metaLoading ? "Loading cities..." : "Select city"}
                </option>
                {cities
                  .filter((c) => Boolean(c.is_active ?? true))
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label>
                Official Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={org.email}
                onChange={handleOrgChange}
                placeholder="contact@organisation.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={org.phone}
                onChange={handleOrgChange}
                placeholder="e.g. +91 9876543210"
              />
            </div>
          </div>

          <div className="form-group">
            <label>PAN Card / Tax ID</label>
            <input
              type="text"
              name="pan_card"
              value={org.pan_card}
              onChange={handleOrgChange}
              placeholder="e.g. ABCDE1234F"
              maxLength={10}
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <div className="form-group">
            <label>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={org.description}
              onChange={handleOrgChange}
              placeholder="Tell us about the types of events and activities you organise..."
              rows={4}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {orgMessage && <p className="profile-message">{orgMessage}</p>}

          <button
            type="submit"
            className="save-btn"
            disabled={isOrgSubmitDisabled}
            style={{ marginTop: "12px" }}
          >
            {orgSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        {showOrgConfirmPopup && (
          <div className="deactivate-overlay" role="dialog" aria-modal="true">
            <div className="deactivate-popup">
              <h2>Apply to Become an Organiser?</h2>
              <p>
                Platform administrators will review your organisation details.
                Once approved, you'll be granted permission to publish and host
                events on CityPass.
              </p>

              <div style={{ marginBottom: "22px" }}>
                <button
                  type="button"
                  onClick={() => setShowOrgTerms(true)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#5144ed",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  View Organiser Terms & Conditions
                </button>
              </div>

              <div className="deactivate-actions">
                <button
                  className="cancel-deactivate-btn"
                  type="button"
                  onClick={() => setShowOrgConfirmPopup(false)}
                  disabled={orgSubmitting}
                >
                  Cancel
                </button>

                <button
                  className="confirm-relogin-btn"
                  type="button"
                  onClick={handleConfirmOrgSubmit}
                  disabled={orgSubmitting}
                >
                  {orgSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </div>
        )}

        <OrganiserTerms
          isOpen={showOrgTerms}
          onClose={() => setShowOrgTerms(false)}
        />
      </div>
    );
  };

  const handleDeactivateAccount = async () => {
    try {
      setDeactivating(true);

      const finalReason =
        deactivateReason === "Other"
          ? `Other: ${deactivateOtherText.trim()}`
          : deactivateReason;

      await axios.put(
        `${API_BASE_URL}/v1/users/deactivate`,
        { reason: finalReason },
        {
          withCredentials: true,
        }
      );

      setUser(null);
      setShowDeactivatePopup(false);
      window.location.href = "/";
    } catch (error: any) {
      console.error("Error deactivating account:", error);
      alert(
        error.response?.data?.message || "Unable to deactivate account."
      );
    } finally {
      setDeactivating(false);
    }
  };

  const accountDelete = () => {
    const handleInitiateDeactivation = () => {
      if (!deactivateReason) {
        setDeactivateError("Please select a reason before continuing.");
        return;
      }
      if (deactivateReason === "Other" && !deactivateOtherText.trim()) {
        setDeactivateError("Please share your feedback in the box provided.");
        return;
      }
      setDeactivateError("");
      setShowDeactivatePopup(true);
    };

    return (
      <div className="panel-content deactivate-panel">
        <h2>Deactivate Account</h2>
        <p className="panel-subtitle">
          Before you deactivate, please tell us why you're leaving. Your feedback
          helps us improve CityPass and provide a better experience.
        </p>

        <div className="deactivate-feedback-section">
          <label className="feedback-section-title">
            Why are you deactivating your account? <span className="text-red-500">*</span>
          </label>

          <div className="deactivate-radio-group">
            {DEACTIVATE_REASONS.map((reason) => (
              <label
                key={reason}
                className={`deactivate-radio-card ${
                  deactivateReason === reason ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="deactivate_reason"
                  value={reason}
                  checked={deactivateReason === reason}
                  onChange={(e) => {
                    setDeactivateReason(e.target.value);
                    setDeactivateError("");
                  }}
                />
                <span className="radio-text">{reason}</span>
              </label>
            ))}
          </div>

          {deactivateReason === "Other" && (
            <div className="deactivate-other-wrapper">
              <textarea
                className="deactivate-other-textarea"
                placeholder="Tell us what went wrong or how we could improve..."
                maxLength={300}
                rows={4}
                value={deactivateOtherText}
                onChange={(e) => {
                  setDeactivateOtherText(e.target.value);
                  setDeactivateError("");
                }}
              />
              <div className="char-counter">
                {deactivateOtherText.length}/300 characters
              </div>
            </div>
          )}

          {deactivateError && (
            <p className="deactivate-inline-error">{deactivateError}</p>
          )}

          <div className="deactivate-action-container">
            <button
              type="button"
              className="deactivate-btn"
              onClick={handleInitiateDeactivation}
            >
              Deactivate Account
            </button>
          </div>
        </div>

        {showDeactivatePopup && (
          <div className="deactivate-overlay" role="dialog" aria-modal="true">
            <div className="deactivate-popup">
              <h2>Deactivate Account?</h2>
              <p>
                Are you sure you want to deactivate your account? You can
                reactivate it later anytime by logging in again.
              </p>

              <div style={{ marginBottom: "22px" }}>
                <button
                  type="button"
                  onClick={() => setShowDeactivateTerms(true)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#5144ed",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  View Deactivation Terms & Conditions
                </button>
              </div>

              <div className="deactivate-actions">
                <button
                  className="cancel-deactivate-btn"
                  type="button"
                  onClick={() => setShowDeactivatePopup(false)}
                  disabled={deactivating}
                >
                  Cancel
                </button>

                <button
                  className="confirm-deactivate-btn"
                  type="button"
                  onClick={handleDeactivateAccount}
                  disabled={deactivating}
                >
                  {deactivating ? "Deactivating..." : "Deactivate"}
                </button>
              </div>
            </div>
          </div>
        )}

        <Terms
          isOpen={showDeactivateTerms}
          onClose={() => setShowDeactivateTerms(false)}
        />
      </div>
    );
  };

  return (
    <>
      <Navbar />

      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences</p>
        </div>

        <div className="settings-layout">
          <div className="settings-container">
            <button
              className={`settings-item ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => handleTabChange("profile")}
            >
              <div className="settings-icon">
                <IoPerson />
              </div>

              <div className="settings-info">
                <h3>My Profile</h3>
                <p>Check your account details</p>
              </div>

              <span className="settings-arrow">
                <IoIosArrowForward />
              </span>
            </button>

            <button
              className={`settings-item ${
                activeTab === "password" ? "active" : ""
              }`}
              onClick={() => handleTabChange("password")}
            >
              <div className="settings-icon">
                <FaLock />
              </div>

              <div className="settings-info">
                <h3>Change Password</h3>
                <p>Update your account password</p>
              </div>

              <span className="settings-arrow">
                <IoIosArrowForward />
              </span>
            </button>

            <button
              className={`settings-item ${
                activeTab === "organiser_request" ? "active" : ""
              }`}
              onClick={() => handleTabChange("host-an-event")}
            >
              <div className="settings-icon">
                <FaBullhorn />
              </div>

              <div className="settings-info">
                <h3>Host an Event</h3>
                <p>Request to become organiser to host</p>
              </div>

              <span className="settings-arrow">
                <IoIosArrowForward />
              </span>
            </button>

            <button
              className={`settings-item delete-item ${
                activeTab === "delete" ? "active" : ""
              }`}
              onClick={() => handleTabChange("deactivate")}
            >
              <div className="settings-icon">
                <FaUserAltSlash />
              </div>

              <div className="settings-info">
                <h3>Deactivate Account</h3>
                <p>Your account will be set to inactive.</p>
              </div>

              <span className="settings-arrow">
                <IoIosArrowForward />
              </span>
            </button>
          </div>

          <div className="settings-panel">
            {activeTab === "profile" && showProfile()}
            {activeTab === "password" && changePassword()}
            {activeTab === "organiser_request" && showOrganiserRequest()}
            {activeTab === "delete" && accountDelete()}
          </div>
        </div>
      </div>

      {showProfileSuccessPopup && (
        <div className="org-success-overlay" role="dialog" aria-modal="true">
          <div className="org-success-popup">
            <h3>Profile Updated!</h3>
            <p>Your profile details have been saved successfully.</p>
            <button
              className="org-success-done-btn"
              onClick={() => setShowProfileSuccessPopup(false)}
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {showPasswordSuccessPopup && (
        <div className="org-success-overlay" role="dialog" aria-modal="true">
          <div className="org-success-popup">
            <h3>Password Updated!</h3>
            <p>Your password has been changed successfully.</p>
            <button
              className="org-success-done-btn"
              onClick={() => setShowPasswordSuccessPopup(false)}
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {showOrgSuccessPopup && (
        <div className="org-success-overlay" role="dialog" aria-modal="true">
          <div className="org-success-popup">
            <h3>Application Submitted!</h3>
            <p>
              Thank you for applying. Platform administrators review all
              organizer applications.
            </p>
            <button
              className="org-success-done-btn"
              onClick={() => {
                setShowOrgSuccessPopup(false);
                handleTabChange("profile");
              }}
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SettingsView;