import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { useUser } from "../../context/UserContext";
import Navbar from "../Navbar/Navbar";
import {
  FaPlus,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaBullhorn,
  FaUserSlash,
  FaChevronRight,
} from "react-icons/fa6";
import "./SettingsView.css";

interface City {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  city_id: number | "";
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "";
  profile_image?: string;
}

const MAX_DOB = "2015-12-31";

const genderOptions = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
];

const deactivateReasons = [
  "Not using CityPass anymore",
  "Privacy concerns",
  "Too many notifications",
  "I found another platform",
  "I had a poor experience",
  "I am taking a break",
  "Creating another account",
  "Other",
];

function SettingsView() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    name: "",
    email: "",
    phone: "",
    city_id: "",
    dob: "",
    gender: "",
    profile_image: "",
  });

  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [org, setOrg] = useState({
    stageName: "",
    category: "",
    city: "",
    pan_card: "",
    email: user?.email || "",
    phone: user?.phone || "",
    description: "",
  });

  const [orgMessage, setOrgMessage] = useState("");
  const [orgError, setOrgError] = useState("");

  const [deactivateReason, setDeactivateReason] = useState("");
  const [otherDeactivateReason, setOtherDeactivateReason] = useState("");

  const [showDeactivateTerms, setShowDeactivateTerms] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchCities();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user) {
      setOrg((prev) => ({
        ...prev,
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/v1/users/userdetails`,
        {
          withCredentials: true,
        }
      );

      const userData = response.data?.user || response.data;

      if (userData) {
        setProfile({
          id: userData.id || 0,
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          city_id: userData.city_id ?? "",
          dob: userData.dob ? userData.dob.slice(0, 10) : "",
          gender: userData.gender || "",
          profile_image: userData.profile_image || "",
        });

        setUser({
          id: String(userData.id || user?.id || ""),
          name: userData.name || user?.name || "",
          email: userData.email || user?.email || "",
          role: userData.role || user?.role,
          phone: userData.phone ?? user?.phone,
          profile_image: userData.profile_image || null,
          status: userData.status || user?.status,
        });
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/cities`);

      const cityData =
        response.data?.cities ||
        response.data?.city ||
        response.data?.data ||
        [];

      setCities(Array.isArray(cityData) ? cityData : []);
    } catch (error) {
      console.error("Failed to load cities:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/categories`);

      const catData =
        response.data?.categories ||
        response.data?.category ||
        response.data?.data ||
        response.data ||
        [];

      setCategories(Array.isArray(catData) ? catData : []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  // Returns the actual profile image if available.
  // If no image exists, the JSX will show FaUser instead.
  const getProfileImage = () => {
    if (imagePreview) {
      return imagePreview;
    }

    if (profile.profile_image) {
      if (
        profile.profile_image.startsWith("http://") ||
        profile.profile_image.startsWith("https://")
      ) {
        return profile.profile_image;
      }

      return `${API_BASE_URL}${profile.profile_image}`;
    }

    return "";
  };

  const handleProfileChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: name === "city_id" ? (value ? Number(value) : "") : value,
    }));

    setProfileMessage("");
    setProfileError("");
  };

  const handleGenderChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({
      ...prev,
      gender: e.target.value as UserProfile["gender"],
    }));

    setProfileMessage("");
    setProfileError("");
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileError("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Profile image must be less than 5 MB.");
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);
    setProfileMessage("");
    setProfileError("");
  };

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (!profile.name.trim()) {
      setProfileError("Name is required.");
      return;
    }

    if (profile.phone && !/^\d{10}$/.test(profile.phone)) {
      setProfileError("Phone number must be exactly 10 digits.");
      return;
    }

    if (profile.dob && profile.dob > MAX_DOB) {
      setProfileError(
        "Date of birth must be 31 December 2015 or earlier."
      );
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", profile.name.trim());
      formData.append("phone", profile.phone.trim());

      formData.append(
        "city_id",
        profile.city_id === "" ? "" : String(profile.city_id)
      );

      formData.append("dob", profile.dob);

      if (profile.gender) {
        formData.append("gender", profile.gender);
      }

      if (selectedImage) {
        formData.append("profile_image", selectedImage);
      }

      const response = await axios.patch(
        `${API_BASE_URL}/v1/users/userdetails`,
        formData,
        {
          withCredentials: true,
        }
      );

      const updatedUser = response.data.user || response.data;

      setProfile({
        id: updatedUser.id,
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        city_id: updatedUser.city_id ?? "",
        dob: updatedUser.dob ? updatedUser.dob.slice(0, 10) : "",
        gender: updatedUser.gender || "",
        profile_image: updatedUser.profile_image || "",
      });

      setUser(updatedUser);

      setSelectedImage(null);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImagePreview("");

      setProfileMessage("Profile updated successfully.");
    } catch (error: any) {
      setProfileError(
        error.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!newPassword || !confirmPassword) {
      setPasswordError("Both password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

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

      setPasswordMessage("Password updated successfully.");
    } catch (error: any) {
      setPasswordError(
        error.response?.data?.message || "Unable to update password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setOrg((prev) => ({
      ...prev,
      [name]: name === "pan_card" ? value.toUpperCase() : value,
    }));

    setOrgMessage("");
    setOrgError("");
  };

  const handleOrganizerSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setOrgMessage("");
    setOrgError("");

    if (
      !org.stageName.trim() ||
      !org.category.trim() ||
      !org.city.trim() ||
      !org.pan_card.trim() ||
      !org.email.trim() ||
      !org.phone.trim() ||
      !org.description.trim()
    ) {
      setOrgError(
        "All fields are required. Please fill in every field."
      );
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!panRegex.test(org.pan_card.trim())) {
      setOrgError(
        "Invalid PAN format. Must be 10 characters (e.g., ABCDE1234F)."
      );
      return;
    }

    if (!/^\d{10}$/.test(org.phone.trim())) {
      setOrgError("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE_URL}/v1/organiser-requests`,
        {
          organization_name: org.stageName.trim(),
          category: org.category.trim(),
          city: org.city.trim(),
          pan_card: org.pan_card.trim().toUpperCase(),
          email: org.email.trim(),
          phone: org.phone.trim(),
          description: org.description.trim(),
        },
        {
          withCredentials: true,
        }
      );

      setOrgMessage("Organizer request submitted successfully!");

      setOrg({
        stageName: "",
        category: "",
        city: "",
        pan_card: "",
        email: user?.email || "",
        phone: user?.phone || "",
        description: "",
      });
    } catch (error: any) {
      setOrgError(
        error.response?.data?.message ||
          "Unable to submit organizer request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateReasonChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setDeactivateReason(value);
    setDeactivateError("");

    if (value !== "Other") {
      setOtherDeactivateReason("");
    }
  };

  const handleDeactivate = async () => {
    setDeactivateError("");

    if (!deactivateReason) {
      setDeactivateError("Please select a reason.");
      return;
    }

    let finalReason = deactivateReason;

    if (deactivateReason === "Other") {
      if (!otherDeactivateReason.trim()) {
        setDeactivateError(
          "Please tell us why you want to deactivate your account."
        );
        return;
      }

      if (otherDeactivateReason.trim().length > 300) {
        setDeactivateError(
          "Please provide maximum of 300 characters for your reason."
        );
        return;
      }

      finalReason = otherDeactivateReason.trim();
    }

    try {
      setLoading(true);

      await axios.patch(
        `${API_BASE_URL}/v1/users/deactivate`,
        {
          reason: finalReason,
        },
        {
          withCredentials: true,
        }
      );

      navigate("/login");
    } catch (error: any) {
      setDeactivateError(
        error.response?.data?.message || "Unable to deactivate account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>

          <p>
            Manage your account preferences and personal information
          </p>
        </div>

        <div className="settings-layout">
          <aside className="settings-nav">
            <button
              type="button"
              className={`nav-item ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <span className="nav-icon">
                <FaUser />
              </span>

              <div className="nav-info">
                <h3>Profile</h3>
                <p>Personal info & contact details</p>
              </div>

              <FaChevronRight className="nav-arrow" />
            </button>

            <button
              type="button"
              className={`nav-item ${
                activeTab === "password" ? "active" : ""
              }`}
              onClick={() => setActiveTab("password")}
            >
              <span className="nav-icon">
                <FaLock />
              </span>

              <div className="nav-info">
                <h3>Change Password</h3>
                <p>Security and authentication</p>
              </div>

              <FaChevronRight className="nav-arrow" />
            </button>

            <button
              type="button"
              className={`nav-item ${
                activeTab === "organizer" ? "active" : ""
              }`}
              onClick={() => setActiveTab("organizer")}
            >
              <span className="nav-icon">
                <FaBullhorn />
              </span>

              <div className="nav-info">
                <h3>Host an Event</h3>
                <p>Become a verified organiser</p>
              </div>

              <FaChevronRight className="nav-arrow" />
            </button>

            <button
              type="button"
              className={`nav-item danger ${
                activeTab === "deactivate" ? "active" : ""
              }`}
              onClick={() => setActiveTab("deactivate")}
            >
              <span className="nav-icon">
                <FaUserSlash />
              </span>

              <div className="nav-info">
                <h3>Deactivate Account</h3>
                <p>Pause or close your profile</p>
              </div>

              <FaChevronRight className="nav-arrow" />
            </button>
          </aside>

          <main className="settings-panel">
            {activeTab === "profile" && (
              <section className="tab-pane">
                <div className="profile-heading-block">
                  <div className="avatar-picker">
                    <div
                      className="avatar-circle"
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                    >
                      {getProfileImage() ? (
                        <img
                          src={getProfileImage()}
                          alt="Profile avatar"
                          className="avatar-img"
                        />
                      ) : (
                        <div className="default-avatar">
                          <FaUser />
                        </div>
                      )}

                      <button
                        type="button"
                        className="avatar-plus-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        aria-label="Upload profile photo"
                      >
                        <FaPlus />
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden-file-input"
                      onChange={handleImageChange}
                    />

                    <span className="avatar-caption">
                      Click to update photo
                    </span>
                  </div>

                  <div className="heading-copy">
                    <h2>My Profile</h2>

                    <p>
                      Update your personal information and contact settings
                    </p>
                  </div>
                </div>

                <form onSubmit={handleProfileSave}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="name">Full Name</label>

                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleProfileChange}
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>

                      <input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        title="Email cannot be changed"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>

                      <input
                        id="phone"
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                        maxLength={10}
                        placeholder="10-digit number"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="city_id">City</label>

                      <select
                        id="city_id"
                        name="city_id"
                        value={profile.city_id}
                        onChange={handleProfileChange}
                      >
                        <option value="">Select your city</option>

                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="dob">Date of Birth</label>

                      <input
                        id="dob"
                        type="date"
                        name="dob"
                        value={profile.dob}
                        onChange={handleProfileChange}
                        max={MAX_DOB}
                      />

                      <span className="field-hint">
                        Only dates up to 31 December 2015 are allowed.
                      </span>
                    </div>

                    <div className="form-group">
                      <label>Gender</label>

                      <div className="gender-pill-group">
                        {genderOptions.map((option) => (
                          <label
                            key={option.value}
                            className={`gender-pill ${
                              profile.gender === option.value
                                ? "selected"
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="gender"
                              value={option.value}
                              checked={
                                profile.gender === option.value
                              }
                              onChange={handleGenderChange}
                            />

                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {profileMessage && (
                    <p className="status-banner success">
                      {profileMessage}
                    </p>
                  )}

                  {profileError && (
                    <p className="status-banner error">
                      {profileError}
                    </p>
                  )}

                  <div className="action-row">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {activeTab === "password" && (
              <section className="tab-pane">
                <div className="heading-copy">
                  <h2>Change Password</h2>

                  <p>
                    Choose a secure password with at least 8 characters
                  </p>
                </div>

                <form
                  onSubmit={handlePasswordSubmit}
                  className="narrow-form"
                >
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>

                    <div className="input-with-action">
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(e.target.value)
                        }
                        placeholder="Enter new password"
                      />

                      <button
                        type="button"
                        className="toggle-visibility-btn"
                        onClick={() =>
                          setShowNewPassword(!showNewPassword)
                        }
                      >
                        {showNewPassword ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">
                      Confirm Password
                    </label>

                    <div className="input-with-action">
                      <input
                        id="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        placeholder="Confirm new password"
                      />

                      <button
                        type="button"
                        className="toggle-visibility-btn"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>
                    </div>
                  </div>

                  {passwordMessage && (
                    <p className="status-banner success">
                      {passwordMessage}
                    </p>
                  )}

                  {passwordError && (
                    <p className="status-banner error">
                      {passwordError}
                    </p>
                  )}

                  <div className="action-row">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={loading}
                    >
                      {loading
                        ? "Updating..."
                        : "Update Password"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {activeTab === "organizer" && (
              <section className="tab-pane">
                <div className="heading-copy">
                  <h2>Host an Event</h2>

                  <p>
                    Apply to become an approved organizer and host events
                    on CityPass
                  </p>
                </div>

                <form
                  onSubmit={handleOrganizerSubmit}
                  className="org-form-grid"
                >
                  <div className="form-group full-width">
                    <label htmlFor="stageName">
                      Stage Name *
                    </label>

                    <input
                      id="stageName"
                      type="text"
                      name="stageName"
                      value={org.stageName}
                      onChange={handleOrgChange}
                      placeholder="e.g. Acme Entertainment / The Acoustic Corner"
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="orgCategory">
                      Category *
                    </label>

                    <select
                      id="orgCategory"
                      name="category"
                      value={org.category}
                      onChange={handleOrgChange}
                      required
                    >
                      <option value="">Select category</option>

                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="orgCity">
                      City *
                    </label>

                    <select
                      id="orgCity"
                      name="city"
                      value={org.city}
                      onChange={handleOrgChange}
                      required
                    >
                      <option value="">Select city</option>

                      {cities.map((city) => (
                        <option key={city.id} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="orgEmail">
                      Contact Email *
                    </label>

                    <input
                      id="orgEmail"
                      type="email"
                      name="email"
                      value={org.email}
                      onChange={handleOrgChange}
                      placeholder="contact@yourstage.com"
                      maxLength={25}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="orgPhone">
                      Phone Number *
                    </label>

                    <input
                      id="orgPhone"
                      type="text"
                      name="phone"
                      value={org.phone}
                      onChange={handleOrgChange}
                      placeholder="10-digit contact number"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="pan_card">
                      PAN Card *
                    </label>

                    <input
                      id="pan_card"
                      type="text"
                      name="pan_card"
                      value={org.pan_card}
                      onChange={handleOrgChange}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      style={{
                        textTransform: "uppercase",
                      }}
                      required
                    />

                    <span className="field-hint">
                      10-character PAN format (5 uppercase letters, 4
                      digits, 1 uppercase letter)
                    </span>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="orgDescription">
                      Description *
                    </label>

                    <textarea
                      id="orgDescription"
                      name="description"
                      rows={4}
                      value={org.description}
                      onChange={handleOrgChange}
                      placeholder="Tell us about the events, performances, genres, and audience experiences you deliver..."
                      required
                    />
                  </div>

                  {orgMessage && (
                    <p className="status-banner success full-width">
                      {orgMessage}
                    </p>
                  )}

                  {orgError && (
                    <p className="status-banner error full-width">
                      {orgError}
                    </p>
                  )}

                  <div className="action-row full-width">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={loading}
                    >
                      {loading
                        ? "Submitting..."
                        : "Submit Application"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {activeTab === "deactivate" && (
              <section className="tab-pane">
                <div className="heading-copy">
                  <h2>Deactivate Account</h2>

                  <p>
                    Temporarily suspend your CityPass access
                  </p>
                </div>

                {!showDeactivateTerms ? (
                  <div className="deactivate-card">
                    <h3>Before you proceed</h3>

                    <p>
                      Deactivating your account will pause your CityPass
                      access, affect your active bookings, hide your
                      profile, and log you out across all devices.
                    </p>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() =>
                        setShowDeactivateTerms(true)
                      }
                    >
                      Continue to Deactivation
                    </button>
                  </div>
                ) : (
                  <div className="deactivate-card">
                    <div className="deactivate-reason-header">
                      <h3>Why are you leaving?</h3>

                      <p>
                        Please select the reason that best describes your
                        decision.
                      </p>
                    </div>

                    <div className="deactivate-reasons">
                      {deactivateReasons.map((reason) => (
                        <label
                          key={reason}
                          className={`deactivate-reason-option ${
                            deactivateReason === reason
                              ? "selected"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="deactivateReason"
                            value={reason}
                            checked={
                              deactivateReason === reason
                            }
                            onChange={
                              handleDeactivateReasonChange
                            }
                          />

                          <span className="custom-radio"></span>

                          <span className="reason-text">
                            {reason}
                          </span>
                        </label>
                      ))}
                    </div>

                    {deactivateReason === "Other" && (
                      <div className="other-reason-box">
                        <label htmlFor="otherDeactivateReason">
                          Tell us more
                        </label>

                        <textarea
                          id="otherDeactivateReason"
                          value={otherDeactivateReason}
                          onChange={(e) => {
                            setOtherDeactivateReason(
                              e.target.value
                            );
                            setDeactivateError("");
                          }}
                          placeholder="Please explain why you want to deactivate your account..."
                          maxLength={300}
                          rows={7}
                        />

                        <div className="character-counter">
                          <span
                            className={
                              otherDeactivateReason.trim()
                                .length >= 300
                                ? "valid"
                                : ""
                            }
                          >
                            {otherDeactivateReason.trim().length}
                          </span>
                          / 300 maximum characters
                        </div>
                      </div>
                    )}

                    {deactivateError && (
                      <p className="status-banner error">
                        {deactivateError}
                      </p>
                    )}

                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setShowDeactivateTerms(false);
                          setDeactivateReason("");
                          setOtherDeactivateReason("");
                          setDeactivateError("");
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={handleDeactivate}
                        disabled={
                          loading ||
                          !deactivateReason ||
                          (deactivateReason === "Other" &&
                            otherDeactivateReason.trim()
                              .length < 1)
                        }
                      >
                        {loading
                          ? "Deactivating..."
                          : "Deactivate Account"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default SettingsView;