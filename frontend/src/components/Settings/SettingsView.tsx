import "./SettingsView.css";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Navbar from "../Navbar/Navbar";
import { IoPerson } from "react-icons/io5";
import { IoAdd } from "react-icons/io5";
import { IoIosArrowForward } from "react-icons/io";
import { FaLock } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/config";
import { getNumberErrors } from "../../config/numberCheck";

type ActiveTab = "profile" | "password" | "location" | "delete";

function SettingsView() {
  const { user, setUser, profileImage, setProfileImage } = useUser();
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

const [profile, setProfile] = useState({
    name : user?.name || "",
    email : user?.email || "",
    phone : "",
    dob : "",
    gender : ""
});
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [passwordMessage, setPasswordMessage] = useState("");
const [passwordSaving, setPasswordSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showReloginPopup, setShowReloginPopup] = useState(false);
  const [reloginLoading, setReloginLoading] = useState(false);
  const [showDeactivatePopup, setShowDeactivatePopup] = useState(false);
const [deactivating, setDeactivating] = useState(false);
  const phoneErrors = profile.phone ? getNumberErrors(profile.phone) : [];

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

    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = "";
  };


  // Fetching logged-in user's complete details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/v1/users/userdetails`,
          {
            withCredentials: true,
          }
        );

        const fetchedUser = response.data.user;

        setUser(fetchedUser);


setProfile({
        name : (fetchedUser.name || ""),
        email : (fetchedUser.email || ""),
        phone : (fetchedUser.phone || ""),
        dob : (fetchedUser.dob || ""),
        gender : (fetchedUser.gender || "")
});

      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [setUser]);

  const handleSaveProfile = async () => {
    const phoneErrors = getNumberErrors(profile.phone);
    if (profile.phone && phoneErrors.length > 0) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await axios.patch(
        `${API_BASE_URL}/v1/users/userdetails`,
        {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          dob: profile.dob ? profile.dob.split("T")[0] : null,
          gender: profile.gender || null,
        },
        {
          withCredentials: true,
        }
      );

      const updatedUser = response.data.user;

      setUser(updatedUser);

      setMessage("Profile updated successfully!");

    } catch (error: any) {
      console.error("Error updating profile:", error);

      if (error.response?.status === 404) {
        setMessage("This email is already registered.");
      } else {
        setMessage("Unable to update profile.");
      }
      setShowReloginPopup(true);

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


  //render code for showing profile
  const showProfile = () => {
    if (loading) {
      return <p>Loading profile...</p>;
    }

    return (
      <div className="panel-content">
        <div className="profile-heading">
          <h2>My Profile</h2>
          <button
            className="profile-photo-upload"
            type="button"
            onClick={() => profileImageInputRef.current?.click()}
            aria-label={profileImage ? "Change profile photo" : "Upload profile photo"}
          >
            {profileImage ? (
              <img src={profileImage} alt="" />
            ) : (
              <span>{(user?.name || "U").charAt(0).toUpperCase()}</span>
            )}
            <span className="profile-photo-plus" aria-hidden="true"><IoAdd /></span>
          </button>
          <input
            ref={profileImageInputRef}
            className="profile-image-input"
            type="file"
            accept="image/*"
            onChange={handleProfileImageChange}
          />
        </div>

        <p className="panel-subtitle">
          Manage your personal information
        </p>

        <div className="form-group">
          <label>Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({...profile, name: e.target.value})}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label>Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({...profile, email: e.target.value})}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({...profile, phone: e.target.value})}
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
            onChange={(e) => setProfile({...profile, dob: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Gender</label>
          <select
            value={profile.gender}
            onChange={(e) => setProfile({...profile, gender: e.target.value})}
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {message && (
          <p className="profile-message">
            {message}
          </p>
        )}

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
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    );
  };

  const handleChangePassword = async () => {
  if (!newPassword || !confirmPassword) {
    setPasswordMessage("Please enter both password fields.");
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

    setPasswordMessage("Password updated successfully!");

    setNewPassword("");
    setConfirmPassword("");

  } catch (error: any) {
    console.error("Error updating password:", error);

    setPasswordMessage(
      error.response?.data?.message ||
      "Unable to update password."
    );
  } finally {
    setPasswordSaving(false);
  }
};

  //render for updating password
  const changePassword = () => {
  return (
    <div className="panel-content">
      <h2>Change Password</h2>

      <p className="panel-subtitle">
        Update your account password
      </p>

      <div className="form-group">
        <label>New Password</label>

        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
      </div>

      <div className="form-group">
        <label>Confirm Password</label>

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
      </div>

      {passwordMessage && (
        <p className="profile-message">
          {passwordMessage}
        </p>
      )}

      <button
        className="save-btn"
        onClick={handleChangePassword}
        disabled={passwordSaving}
      >
        {passwordSaving ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
};


const handleDeactivateAccount = async () => {
  try {
    setDeactivating(true);

    await axios.put(
      `${API_BASE_URL}/v1/users/deactivate`,
      {},
      {
        withCredentials: true,
      }
    );

    // Remove logged-in user from context
    setUser(null);

    // Close popup
    setShowDeactivatePopup(false);

    // Go back to login page
    window.location.href = "/";

  } catch (error: any) {
    console.error("Error deactivating account:", error);

    alert(
      error.response?.data?.message ||
      "Unable to deactivate account."
    );
  } finally {
    setDeactivating(false);
  }
};


  //inactivating the account
const accountDelete = () => {
  return (
    <div className="panel-content">
      <h2>Deactivate Account</h2>

      <p className="panel-subtitle">
Take a temporary break from CityPass    
 </p>


      <button
        className="deactivate-btn"
        onClick={() => setShowDeactivatePopup(true)}
      >
        Deactivate Account
      </button>

      {showDeactivatePopup && (
        <div className="deactivate-overlay">
          <div className="deactivate-popup">

            <h2>Deactivate Account?</h2>

            <p>
              Are you sure you want to deactivate your account?
              You can reactivate it later by logging in again.
            </p>

            <div className="deactivate-actions">

              <button
                className="cancel-deactivate-btn"
                onClick={() => setShowDeactivatePopup(false)}
                disabled={deactivating}
              >
                Cancel
              </button>

              <button
                className="confirm-deactivate-btn"
                onClick={handleDeactivateAccount}
                disabled={deactivating}
              >
                {deactivating
                  ? "Deactivating..."
                  : "Deactivate"}
              </button>

            </div>

          </div>
        </div>
      )}
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

          {/* LEFT MENU of the settings*/}
          <div className="settings-container">

            <button
              className={`settings-item ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveTab("profile")}
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
              onClick={() => setActiveTab("password")}
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
              className={`settings-item delete-item ${
                activeTab === "delete" ? "active" : ""
              }`}
              onClick={() => setActiveTab("delete")}
            >
              <div className="settings-icon">
                <MdDeleteForever />
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

          {/* RIGHT PANEL */}
          <div className="settings-panel">

            {activeTab === "profile" && showProfile()}

            {activeTab === "password" && changePassword()}

            {activeTab === "delete" && accountDelete()}

          </div>

        </div>
      </div>
    </>
  );
}

export default SettingsView;