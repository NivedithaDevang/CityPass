import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { useUser } from "../../context/UserContext";
import Navbar from "../Navbar/Navbar";
import ConfirmationPopup from "../Terms/ConfirmationPopup";
import { DeactivateTerms as DeactivationTermsModal } from "../Terms/DeactivationTerms";
import { OrgTerms as OrganiserTermsModal } from "../Terms/OrganiserTerms";
import {
  FaPlus,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaBullhorn,
  FaUserSlash,
  FaChevronRight,
  FaCheck,
  FaXmark,
  FaClock,
  FaCircleXmark,
  FaRotateRight,
  FaPaperclip,
  FaFileLines,
} from "react-icons/fa6";
import "./SettingsView.css";
import { PASSWORD_RULES } from "../../config/passwordRules";

interface City {
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

interface OrganizerRequestStatus {
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string;
}

const calculateAge = (dobString: string): number => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
};

const formatDobForInput = (value: unknown): string => {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];

    const dmyMatch = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const day = String(parsedDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  return "";
};

const getMaxSelectableDob = (): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 16);
  return d.toISOString().split("T")[0];
};

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

const idProofOptions = [
  {
    value: "pan",
    label: "PAN Card",
    placeholder: "Enter 10-character PAN number",
  },
  {
    value: "aadhar",
    label: "Aadhaar Card",
    placeholder: "Enter 12-digit Aadhaar number",
  },
  {
    value: "passport",
    label: "Passport",
    placeholder: "Enter passport number",
  },
  {
    value: "driving_license",
    label: "Driving License",
    placeholder: "Enter driving license number",
  },
  {
    value: "voter_id",
    label: "Voter ID",
    placeholder: "Enter Voter ID number",
  },
];

interface StyledDropdownOption {
  value: string;
  label: string;
}

interface StyledDropdownProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: StyledDropdownOption[];
  onChange: (value: string) => void;
}

function StyledDropdown({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
}: StyledDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    const selectedIndex = options.findIndex((option) => option.value === value);
    optionRefs.current[selectedIndex >= 0 ? selectedIndex : 0]?.focus();

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, options, value]);

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    optionIndex: number
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = (optionIndex + 1) % options.length;
    }

    if (event.key === "ArrowUp") {
      nextIndex = (optionIndex - 1 + options.length) % options.length;
    }

    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      optionRefs.current[nextIndex]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className="city-dropdown" ref={dropdownRef}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className={`city-select ${selectedOption ? "has-value" : ""}`}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        aria-required="true"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !isOpen) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <span className="city-select-label">
          {selectedOption?.label || placeholder}
        </span>

        <FaChevronRight
          className={`city-select-chevron ${isOpen ? "open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={`${id}-options`}
          className="city-options"
          role="listbox"
          aria-label={label}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`city-option ${
                value === option.value ? "selected" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
            >
              <span>{option.label}</span>

              {value === option.value && (
                <span className="city-option-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type TabKey = "profile" | "password" | "organizer" | "deactivate";

const SLUG_TO_TAB: Record<string, TabKey> = {
  profile: "profile",
  "update-password": "password",
  password: "password",
  "change-password": "password",
  "host-an-event": "organizer",
  organizer: "organizer",
  deactivate: "deactivate",
};

const TAB_TO_SLUG: Record<TabKey, string> = {
  profile: "profile",
  password: "update-password",
  organizer: "host-an-event",
  deactivate: "deactivate",
};

function SettingsView() {
  const navigate = useNavigate();
  const { tabSlug } = useParams<{ tabSlug: string }>();
  const { user, setUser, clearUser } = useUser();

  const activeTab: TabKey = (tabSlug && SLUG_TO_TAB[tabSlug]) || "profile";

  const handleTabChange = (tab: TabKey) => {
    navigate(`/settings/${TAB_TO_SLUG[tab]}`);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const idFileInputRef = useRef<HTMLInputElement | null>(null);
  const cityDropdownRef = useRef<HTMLDivElement | null>(null);
  const cityDropdownButtonRef = useRef<HTMLButtonElement | null>(null);
  const cityOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile>(() => ({
    id: user ? Number(user.id) || 0 : 0,
    name: user?.name || "",
    email: user?.email || "",
    phone: (user as any)?.phone || "",
    city_id: (user as any)?.city_id ?? "",
    dob: formatDobForInput((user as any)?.dob),
    gender: (user as any)?.gender || "",
    profile_image: (user as any)?.profile_image || "",
  }));

  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(() => ({
    id: user ? Number(user.id) || 0 : 0,
    name: user?.name || "",
    email: user?.email || "",
    phone: (user as any)?.phone || "",
    city_id: (user as any)?.city_id ?? "",
    dob: formatDobForInput((user as any)?.dob),
    gender: (user as any)?.gender || "",
    profile_image: (user as any)?.profile_image || "",
  }));

  const [cities, setCities] = useState<City[]>([]);
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

  const allRulesPassed = PASSWORD_RULES.every((rule) => rule.check(newPassword));

  const [org, setOrg] = useState({
    fullName: user?.name || "",
    stageName: "",
    city: "",
    id_proof_type: "",
    id_proof: "",
    email: user?.email || "",
    phone: (user as any)?.phone || "",
    description: "",
    idproof_image: ""
  });

  const [idProofFile, setIdProofFile] = useState<File | null>(null);

  const [orgMessage, setOrgMessage] = useState("");
  const [orgError, setOrgError] = useState("");
  const [showOrgConfirmModal, setShowOrgConfirmModal] = useState(false);
  const [showOrgTermsModal, setShowOrgTermsModal] = useState(false);

  const [orgRequestStatus, setOrgRequestStatus] = useState<OrganizerRequestStatus>({
    status: "NONE",
  });
  const [isReapplying, setIsReapplying] = useState(false);

  const [showAlreadyRequestedModal, setShowAlreadyRequestedModal] = useState(false);

  const [deactivateReason, setDeactivateReason] = useState("");
  const [otherDeactivateReason, setOtherDeactivateReason] = useState("");
  const [showDeactivateTerms, setShowDeactivateTerms] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");
  const [showDeactivateConfirmModal, setShowDeactivateConfirmModal] = useState(false);
  const [showDeactivateTermsModal, setShowDeactivateTermsModal] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchCities();
    checkExistingOrganizerRequest();
  }, []);

  useEffect(() => {
    if (user) {
      setProfile((prev) => {
        const nextName = prev.name || user.name || "";
        const nextEmail = prev.email || user.email || "";
        const nextPhone = prev.phone || (user as any).phone || "";
        const nextDob = prev.dob || formatDobForInput((user as any).dob);
        const nextGender = prev.gender || (user as any).gender || "";
        const nextCityId = prev.city_id !== "" ? prev.city_id : ((user as any).city_id ?? "");
        const nextImage = prev.profile_image || (user as any).profile_image || "";

        const merged: UserProfile = {
          ...prev,
          id: prev.id || Number(user.id) || 0,
          name: nextName,
          email: nextEmail,
          phone: nextPhone,
          city_id: nextCityId,
          dob: nextDob,
          gender: nextGender,
          profile_image: nextImage,
        };

        if (!initialProfile) {
          setInitialProfile(merged);
        }

        return merged;
      });

      setOrg((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || (user as any).phone || "",
      }));
    }
  }, [user]);

  const checkExistingOrganizerRequest = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/v1/organiser-requests/status`,
        { withCredentials: true }
      );

      const data = response.data;
      const status = (data?.status || (data?.hasRequest ? "PENDING" : "NONE")).toUpperCase();

      setOrgRequestStatus({
        status: status as OrganizerRequestStatus["status"],
        rejection_reason: data?.rejection_reason || data?.reason || data?.comment || "",
      });
    } catch (error: any) {
      if (error.response?.status === 409) {
        setOrgRequestStatus({ status: "PENDING" });
      }
    }
  };

  useEffect(() => {
    if (!isCityDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!cityDropdownRef.current?.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    const selectedIndex = cities.findIndex(
      (city) => city.id === profile.city_id
    );

    cityOptionRefs.current[
      selectedIndex >= 0 ? selectedIndex + 1 : 0
    ]?.focus();

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isCityDropdownOpen, cities, profile.city_id]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/v1/users/userdetails`,
        { withCredentials: true }
      );

      const userData = response.data?.user || response.data;

      if (userData) {
        const rawDob =
          userData.dob ||
          userData.date_of_birth ||
          userData.birthDate ||
          userData.birth_date ||
          (user as any)?.dob ||
          "";

        const loadedProfile: UserProfile = {
          id: userData.id || 0,
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          city_id: userData.city_id ?? "",
          dob: formatDobForInput(rawDob),
          gender: userData.gender || "",
          profile_image: userData.profile_image || "",
        };

        setProfile(loadedProfile);
        setInitialProfile(loadedProfile);

        setUser({
          id: String(userData.id || user?.id || ""),
          name: userData.name || user?.name || "",
          email: userData.email || user?.email || "",
          role: userData.role || user?.role,
          phone: userData.phone ?? (user as any)?.phone,
          dob: userData.dob ?? (user as any)?.dob,
          city_id: userData.city_id ?? (user as any)?.city_id,
          gender: userData.gender ?? (user as any)?.gender,
          profile_image: userData.profile_image || null,
          status: userData.status || user?.status,
        } as any);
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

  const isProfileChanged = Boolean(
    selectedImage !== null ||
    (initialProfile && (
      profile.name.trim() !== initialProfile.name.trim() ||
      profile.email.trim().toLowerCase() !== initialProfile.email.trim().toLowerCase() ||
      profile.phone.trim() !== initialProfile.phone.trim() ||
      profile.city_id !== initialProfile.city_id ||
      profile.dob !== initialProfile.dob ||
      profile.gender !== initialProfile.gender
    ))
  );

  const getProfileImage = () => {
    if (imagePreview) return imagePreview;

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

  const handleCitySelect = (cityId: number | "") => {
    setProfile((prev) => ({ ...prev, city_id: cityId }));
    setIsCityDropdownOpen(false);
    setProfileMessage("");
    setProfileError("");
  };

  const handleCityOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    optionIndex: number
  ) => {
    const totalOptions = cities.length + 1;
    if (totalOptions <= 0) return;

    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = (optionIndex + 1) % totalOptions;
    }

    if (event.key === "ArrowUp") {
      nextIndex = (optionIndex - 1 + totalOptions) % totalOptions;
    }

    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = totalOptions - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      cityOptionRefs.current[nextIndex]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsCityDropdownOpen(false);
      cityDropdownButtonRef.current?.focus();
    }
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
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileError("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Profile image must be less than 5 MB.");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);

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

    const trimmedName = profile.name.trim();
    const trimmedEmail = profile.email.trim();
    const trimmedPhone = profile.phone.trim();

    if (!trimmedName) {
      setProfileError("Name is required.");
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
      setProfileError("Name can only contain letters and spaces.");
      return;
    }

    if (!trimmedEmail) {
      setProfileError("Email address is required.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setProfileError("Please enter a valid email address.");
      return;
    }

    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) {
      setProfileError("Phone number must be exactly 10 digits.");
      return;
    }

    if (profile.dob) {
      const age = calculateAge(profile.dob);
      if (age < 16) {
        setProfileError("You must be at least 16 years or older to register.");
        return;
      }
    }

    try {
      setLoading(true);
      const formData = new FormData();

      formData.append("name", trimmedName);
      formData.append("email", trimmedEmail.toLowerCase());
      formData.append("phone", trimmedPhone);
      formData.append(
        "city_id",
        profile.city_id === "" ? "" : String(profile.city_id)
      );
      formData.append("dob", profile.dob);

      if (profile.gender) formData.append("gender", profile.gender);
      if (selectedImage) formData.append("profile_image", selectedImage);

      const response = await axios.patch(
        `${API_BASE_URL}/v1/users/userdetails`,
        formData,
        { withCredentials: true }
      );

      const updatedUser = response.data.user || response.data;

      const savedProfile: UserProfile = {
        id: updatedUser.id,
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        city_id: updatedUser.city_id ?? "",
        dob: formatDobForInput(updatedUser.dob),
        gender: updatedUser.gender || "",
        profile_image: updatedUser.profile_image || "",
      };

      setProfile(savedProfile);
      setInitialProfile(savedProfile);

      setUser({
        id: String(updatedUser.id || user?.id || ""),
        name: updatedUser.name || user?.name || "",
        email: updatedUser.email || user?.email || "",
        role: updatedUser.role || user?.role,
        phone: updatedUser.phone ?? (user as any)?.phone,
        dob: updatedUser.dob ?? (user as any)?.dob,
        city_id: updatedUser.city_id ?? (user as any)?.city_id,
        gender: updatedUser.gender ?? (user as any)?.gender,
        profile_image: updatedUser.profile_image || null,
        status: updatedUser.status || user?.status,
      } as any);

      setSelectedImage(null);

      if (imagePreview) URL.revokeObjectURL(imagePreview);
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

    const failedRule = PASSWORD_RULES.find((rule) => !rule.check(newPassword));
    if (failedRule) {
      setPasswordError(failedRule.label);
      return;
    }

    try {
      setLoading(true);

      await axios.patch(
        `${API_BASE_URL}/v1/users/password`,
        { newPassword, confirmPassword },
        { withCredentials: true }
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

    if (name === "id_proof_type") {
      setOrg((prev) => ({
        ...prev,
        id_proof_type: value,
        id_proof: "",
      }));
      setIdProofFile(null);
    } else if (name === "id_proof") {
      setOrg((prev) => ({
        ...prev,
        id_proof: value.toUpperCase(),
      }));
    } else {
      setOrg((prev) => ({ ...prev, [name]: value }));
    }

    setOrgMessage("");
    setOrgError("");
  };

  const handleIdProofFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setOrgError("ID proof file size must be less than 10 MB.");
      return;
    }

    setIdProofFile(file);
    setOrgMessage("");
    setOrgError("");
  };

  const selectedIdProof = idProofOptions.find(
    (option) => option.value === org.id_proof_type
  );

  const validateIdProof = () => {
    const idProof = org.id_proof.trim().toUpperCase();

    switch (org.id_proof_type) {
      case "pan":
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(idProof)) {
          return "Enter a valid PAN number. Example: ABCDE1234F";
        }
        break;

      case "aadhar":
        if (!/^\d{12}$/.test(idProof)) {
          return "Aadhaar number must contain exactly 12 digits.";
        }
        break;

      case "passport":
        if (!/^[A-Z][0-9]{7}$/.test(idProof)) {
          return "Enter a valid passport number. Example: A1234567";
        }
        break;

      case "driving_license":
        if (!/^[A-Z0-9-]{8,20}$/.test(idProof)) {
          return "Enter a valid driving license number.";
        }
        break;

      case "voter_id":
        if (!/^[A-Z]{3}[0-9]{7}$/.test(idProof)) {
          return "Enter a valid Voter ID. Example: ABC1234567";
        }
        break;

      default:
        return "Please select an ID proof type.";
    }

    return "";
  };

  const handleOrganizerPreSubmit = (e: FormEvent) => {
    e.preventDefault();
    setOrgMessage("");
    setOrgError("");

    if (
      !org.fullName.trim() ||
      !org.stageName.trim() ||
      !org.city.trim() ||
      !org.id_proof_type.trim() ||
      !org.id_proof.trim() ||
      !org.email.trim() ||
      !org.phone.trim() ||
      !org.description.trim()
    ) {
      setOrgError("All fields are required. Please fill in every field.");
      return;
    }

    if (!/^\d{10}$/.test(org.phone.trim())) {
      setOrgError("Phone number must be exactly 10 digits.");
      return;
    }

    const idProofError = validateIdProof();
    if (idProofError) {
      setOrgError(idProofError);
      return;
    }

    if (!idProofFile) {
      setOrgError("Please upload a document file (image, PDF, or scan) of your ID proof.");
      return;
    }

    setShowOrgConfirmModal(true);
  };

  const executeOrganizerSubmit = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("full_name", org.fullName.trim());
      formData.append("organization_name", org.stageName.trim());
      formData.append("city", org.city.trim());
      formData.append("id_proof_type", org.id_proof_type);
      formData.append("id_proof", org.id_proof.trim().toUpperCase());
      formData.append("email", org.email.trim());
      formData.append("phone", org.phone.trim());
      formData.append("description", org.description.trim());
      formData.append("idproof_image", org.idproof_image);

      if (idProofFile) {
        formData.append("id_proof_file", idProofFile);
      }

      await axios.post(
        `${API_BASE_URL}/v1/organiser-requests`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setShowOrgConfirmModal(false);
      setOrgRequestStatus({ status: "PENDING" });
      setIsReapplying(false);
      setIdProofFile(null);
    } catch (error: any) {
      setShowOrgConfirmModal(false);

      const status = error.response?.status;
      const message = String(error.response?.data?.message || "").toLowerCase();

      if (
        status === 409 ||
        message.includes("already") ||
        message.includes("pending") ||
        message.includes("submitted") ||
        message.includes("exists")
      ) {
        setOrgRequestStatus({ status: "PENDING" });
      } else {
        setOrgError(
          error.response?.data?.message ||
            "Unable to submit organizer request. Please try again."
        );
      }
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

    if (value !== "Other") setOtherDeactivateReason("");
  };

  const handleDeactivatePreSubmit = () => {
    setDeactivateError("");

    if (!deactivateReason) {
      setDeactivateError("Please select a reason.");
      return;
    }

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
    }

    setShowDeactivateConfirmModal(true);
  };

  const executeDeactivate = async () => {
    const finalReason =
      deactivateReason === "Other"
        ? otherDeactivateReason.trim()
        : deactivateReason;

    try {
      setLoading(true);

      await axios.patch(
        `${API_BASE_URL}/v1/users/deactivate`,
        { reason: finalReason },
        { withCredentials: true }
      );

      setShowDeactivateConfirmModal(false);
      clearUser();
      navigate("/login");
    } catch (error: any) {
      setShowDeactivateConfirmModal(false);
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
          <p>Manage your account preferences and personal information</p>
        </div>

        <div className="settings-layout">
          <aside className="settings-nav">
            <button
              type="button"
              className={`setting-nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => handleTabChange("profile")}
            >
              <span className="nav-icon"><FaUser /></span>
              <div className="nav-info">
                <h3>Profile</h3>
                <p>Personal info &amp; contact details</p>
              </div>
              <FaChevronRight className="nav-arrow" />
            </button>

            <button
              type="button"
              className={`setting-nav-item ${activeTab === "password" ? "active" : ""}`}
              onClick={() => handleTabChange("password")}
            >
              <span className="nav-icon"><FaLock /></span>
              <div className="nav-info">
                <h3>Change Password</h3>
                <p>Security and authentication</p>
              </div>
              <FaChevronRight className="nav-arrow" />
            </button>

            <button
              type="button"
              className={`setting-nav-item ${activeTab === "organizer" ? "active" : ""}`}
              onClick={() => handleTabChange("organizer")}
            >
              <span className="nav-icon"><FaBullhorn /></span>
              <div className="nav-info">
                <h3>Host an Event</h3>
                <p>Become a verified organiser</p>
              </div>
              <FaChevronRight className="nav-arrow" />
            </button>

            <button
              type="button"
              className={`setting-nav-item danger ${activeTab === "deactivate" ? "active" : ""}`}
              onClick={() => handleTabChange("deactivate")}
            >
              <span className="nav-icon"><FaUserSlash /></span>
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
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      {getProfileImage() ? (
                        <img
                          src={getProfileImage()}
                          alt="Profile avatar"
                          className="avatar-img"
                        />
                      ) : (
                        <div className="default-avatar"><FaUser /></div>
                      )}

                      <button
                        type="button"
                        className="avatar-plus-btn"
                        onClick={(event) => {
                          event.stopPropagation();
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

                    <span className="avatar-caption">Click to update photo</span>
                  </div>

                  <div className="heading-copy">
                    <h2>My Profile</h2>
                    <p>Update your personal information and contact settings</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSave} noValidate>
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
                        name="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                        placeholder="Enter your email address"
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

                      <div className="city-dropdown" ref={cityDropdownRef}>
                        <button
                          ref={cityDropdownButtonRef}
                          id="city_id"
                          type="button"
                          className={`city-select ${
                            profile.city_id !== "" ? "has-value" : ""
                          }`}
                          role="combobox"
                          aria-label="City"
                          aria-haspopup="listbox"
                          aria-expanded={isCityDropdownOpen}
                          aria-controls="profile-city-options"
                          onClick={() => setIsCityDropdownOpen((open) => !open)}
                          onKeyDown={(event) => {
                            if (event.key === "ArrowDown" && !isCityDropdownOpen) {
                              event.preventDefault();
                              setIsCityDropdownOpen(true);
                            }
                          }}
                        >
                          <span className="city-select-label">
                            {cities.find((city) => city.id === profile.city_id)?.name ||
                              "Select your city"}
                          </span>

                          <FaChevronRight
                            className={`city-select-chevron ${
                              isCityDropdownOpen ? "open" : ""
                            }`}
                            aria-hidden="true"
                          />
                        </button>

                        {isCityDropdownOpen && (
                          <div
                            id="profile-city-options"
                            className="city-options"
                            role="listbox"
                            aria-label="Choose a city"
                          >
                            <button
                              type="button"
                              role="option"
                              aria-selected={profile.city_id === ""}
                              className={`city-option ${
                                profile.city_id === "" ? "selected" : ""
                              }`}
                              onClick={() => handleCitySelect("")}
                              onKeyDown={(event) => handleCityOptionKeyDown(event, 0)}
                              ref={(element) => {
                                cityOptionRefs.current[0] = element;
                              }}
                            >
                              <span>Select your city</span>
                              {profile.city_id === "" && (
                                <span className="city-option-check" aria-hidden="true">
                                  ✓
                                </span>
                              )}
                            </button>

                            {cities.map((city, index) => (
                              <button
                                key={city.id}
                                type="button"
                                role="option"
                                aria-selected={profile.city_id === city.id}
                                className={`city-option ${
                                  profile.city_id === city.id ? "selected" : ""
                                }`}
                                onClick={() => handleCitySelect(city.id)}
                                onKeyDown={(event) =>
                                  handleCityOptionKeyDown(event, index + 1)
                                }
                                ref={(element) => {
                                  cityOptionRefs.current[index + 1] = element;
                                }}
                              >
                                <span>{city.name}</span>
                                {profile.city_id === city.id && (
                                  <span className="city-option-check" aria-hidden="true">
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="dob">Date of Birth [DD-MM-YYYY]</label>
                      <input
                        id="dob"
                        type="date"
                        name="dob"
                        max={getMaxSelectableDob()}
                        value={profile.dob}
                        onChange={handleProfileChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Gender</label>
                      <div className="gender-pill-group">
                        {genderOptions.map((option) => (
                          <label
                            key={option.value}
                            className={`gender-pill ${
                              profile.gender === option.value ? "selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="gender"
                              value={option.value}
                              checked={profile.gender === option.value}
                              onChange={handleGenderChange}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {profileMessage && (
                    <p className="status-banner success">{profileMessage}</p>
                  )}

                  {profileError && (
                    <p className="status-banner error">{profileError}</p>
                  )}

                  <div className="action-row">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={loading || !isProfileChanged}
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
                  <p>Choose a secure password meeting all requirements below</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="narrow-form">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="input-with-action">
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="toggle-visibility-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {newPassword.length > 0 && (
                    <div className="password-rules-box">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = rule.check(newPassword);
                        return (
                          <div
                            key={rule.id || rule.label}
                            className={`rule-item ${passed ? "passed" : "unpassed"}`}
                          >
                            {passed ? (
                              <FaCheck className="rule-icon passed" />
                            ) : (
                              <FaXmark className="rule-icon unpassed" />
                            )}
                            <span>{rule.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="form-group form-group-spaced">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="input-with-action">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="toggle-visibility-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {passwordMessage && (
                    <p className="status-banner success">{passwordMessage}</p>
                  )}

                  {passwordError && (
                    <p className="status-banner error">{passwordError}</p>
                  )}

                  <div className="action-row password-action-row">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={loading || !allRulesPassed || !confirmPassword || newPassword !== confirmPassword}
                    >
                      {loading ? "Updating..." : "Update Password"}
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
                    Apply to become an approved organizer and host events on
                    CityPass
                  </p>
                </div>

                {/* 1. PENDING APPLICATION STATE */}
                {orgRequestStatus.status === "PENDING" && !isReapplying && (
                  <div className="org-status-card pending">
                    <div className="org-status-icon-wrapper pending">
                      <FaClock />
                    </div>

                    <h3 className="org-status-title pending">
                      Application Under Review
                    </h3>

                    <p className="org-status-desc">
                      You have submitted an organiser request. Your application is currently under review by our admin team. Kindly wait for approval or updates via your registered email.
                    </p>
                  </div>
                )}

                {/* 2. REJECTED APPLICATION STATE */}
                {orgRequestStatus.status === "REJECTED" && !isReapplying && (
                  <div className="org-status-card rejected">
                    <div className="org-status-icon-wrapper rejected">
                      <FaCircleXmark />
                    </div>

                    <h3 className="org-status-title rejected">
                      Application Rejected
                    </h3>

                    <p className="org-status-desc rejected">
                      Your organiser application was reviewed and could not be approved at this time.
                    </p>

                    <div className="org-reason-box">
                      <span className="org-reason-label">
                        Reason Provided by Admin
                      </span>
                      <p className="org-reason-text">
                        {orgRequestStatus.rejection_reason || "Incomplete or invalid details provided during submission."}
                      </p>
                    </div>

                    <div className="org-reapply-action">
                      <button
                        type="button"
                        className="primary-button org-reapply-btn"
                        onClick={() => setIsReapplying(true)}
                      >
                        <FaRotateRight /> Edit and Re-apply
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. APPROVED STATE */}
                {orgRequestStatus.status === "APPROVED" && (
                  <div className="org-status-card approved">
                    <div className="org-status-icon-wrapper approved">
                      <FaCheck />
                    </div>
                    <h3 className="org-status-title approved">
                      You are a Verified Organiser
                    </h3>
                    <p className="org-status-desc approved">
                      Your organiser account is active! You can now publish events directly to CityPass.
                    </p>
                  </div>
                )}

                {/* 4. DEFAULT FORM STATE */}
                {(orgRequestStatus.status === "NONE" || isReapplying) && (
                  <form
                    onSubmit={handleOrganizerPreSubmit}
                    className="org-form-grid"
                    noValidate
                  >
                    {isReapplying && (
                      <div className="org-revision-banner">
                        <span className="org-revision-text">
                          You are revising your application based on previous admin feedback.
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsReapplying(false)}
                          className="org-revision-toggle-btn"
                        >
                          View previous decision
                        </button>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={org.fullName}
                        onChange={handleOrgChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="stageName">Organisation Name *</label>
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
                      <label htmlFor="orgCity">City *</label>
                      <StyledDropdown
                        id="orgCity"
                        label="City"
                        value={org.city}
                        placeholder="Select city"
                        options={cities.map((city) => ({
                          value: city.name,
                          label: city.name,
                        }))}
                        onChange={(city) =>
                          handleOrgChange({
                            target: { name: "city", value: city },
                          } as ChangeEvent<HTMLSelectElement>)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="orgEmail">Email *</label>
                      <input
                        id="orgEmail"
                        type="email"
                        name="email"
                        value={org.email}
                        disabled
                        onChange={handleOrgChange}
                        placeholder="contact@yourstage.com"
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="orgPhone">Phone Number *</label>
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
                      <label htmlFor="id_proof_type">Valid ID Proof *</label>
                      <StyledDropdown
                        id="id_proof_type"
                        label="Valid ID Proof"
                        value={org.id_proof_type}
                        placeholder="Select ID proof"
                        options={idProofOptions}
                        onChange={(proofType) =>
                          handleOrgChange({
                            target: {
                              name: "id_proof_type",
                              value: proofType,
                            },
                          } as ChangeEvent<HTMLSelectElement>)
                        }
                      />
                    </div>

                    {org.id_proof_type && (
                      <>
                        <div className="form-group full-width">
                          <label htmlFor="id_proof">
                            {selectedIdProof?.label} Number *
                          </label>
                          <input
                            id="id_proof"
                            type="text"
                            name="id_proof"
                            value={org.id_proof}
                            onChange={handleOrgChange}
                            placeholder={
                              selectedIdProof?.placeholder || "Enter ID proof number"
                            }
                            maxLength={
                              org.id_proof_type === "aadhar"
                                ? 12
                                : org.id_proof_type === "pan"
                                ? 10
                                : 20
                            }
                            required
                          />
                        </div>

                        <div className="form-group full-width">
                          <label htmlFor="id_proof_file">
                            Upload {selectedIdProof?.label} Document (Image or PDF) *
                          </label>

                          <div
                            style={{
                              border: "1px dashed var(--border-color, #374151)",
                              borderRadius: "8px",
                              padding: "16px",
                              textAlign: "center",
                              background: "rgba(255, 255, 255, 0.02)",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "8px",
                            }}
                            onClick={() => idFileInputRef.current?.click()}
                          >
                            <input
                              ref={idFileInputRef}
                              id="id_proof_file"
                              type="file"
                              accept="image/*,application/pdf"
                              style={{ display: "none" }}
                              onChange={handleIdProofFileChange}
                            />

                            {idProofFile ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  color: "#3b82f6",
                                  fontWeight: 500,
                                }}
                              >
                                <FaFileLines size={20} />
                                <span>{idProofFile.name}</span>
                                <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                                  ({(idProofFile.size / (1024 * 1024)).toFixed(2)} MB)
                                </span>
                              </div>
                            ) : (
                              <>
                                <FaPaperclip size={22} style={{ color: "#9ca3af" }} />
                                <span style={{ fontSize: "0.9rem", color: "#d1d5db" }}>
                                  Click or tap to upload document
                                </span>
                                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                                  Supports JPG, PNG, WEBP, or PDF (Max 10 MB)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="form-group full-width">
                      <label htmlFor="orgDescription">Description *</label>
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
                        {loading ? "Submitting..." : isReapplying ? "Resubmit Application" : "Submit Application"}
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {activeTab === "deactivate" && (
              <section className="tab-pane">
                <div className="heading-copy">
                  <h2>Deactivate Account</h2>
                  <p>Temporarily suspend your CityPass access</p>
                </div>

                {!showDeactivateTerms ? (
                  <div className="deactivate-card">
                    <h3>Before you proceed</h3>
                    <p>
                      Deactivating your account will pause your CityPass access,
                      affect your active bookings, hide your profile, and log
                      you out across all devices.
                    </p>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => setShowDeactivateTerms(true)}
                    >
                      Continue to Deactivation
                    </button>
                  </div>
                ) : (
                  <div className="deactivate-card">
                    <div className="deactivate-reason-header">
                      <h3>Why are you leaving?</h3>
                      <p>
                        Please select the reason that best describes your decision.
                      </p>
                    </div>

                    <div className="deactivate-reasons">
                      {deactivateReasons.map((reason) => (
                        <label
                          key={reason}
                          className={`deactivate-reason-option ${
                            deactivateReason === reason ? "selected" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="deactivateReason"
                            value={reason}
                            checked={deactivateReason === reason}
                            onChange={handleDeactivateReasonChange}
                          />
                          <span className="custom-radio" />
                          <span className="reason-text">{reason}</span>
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
                          onChange={(event) => {
                            setOtherDeactivateReason(event.target.value);
                            setDeactivateError("");
                          }}
                          placeholder="Please explain why you want to deactivate your account..."
                          maxLength={300}
                          rows={7}
                        />
                        <div className="character-counter">
                          <span
                            className={
                              otherDeactivateReason.trim().length >= 300
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
                      <p className="status-banner error">{deactivateError}</p>
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
                        onClick={handleDeactivatePreSubmit}
                        disabled={
                          loading ||
                          !deactivateReason ||
                          (deactivateReason === "Other" &&
                            otherDeactivateReason.trim().length < 1)
                        }
                      >
                        Deactivate Account
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>

      <ConfirmationPopup
        isOpen={showOrgConfirmModal}
        title="Terms and Conditions to become an organiser"
        message="Are you sure you want to submit your form to become an organiser?"
        confirmText="Confirm & Submit"
        isLoading={loading}
        onConfirm={executeOrganizerSubmit}
        onClose={() => setShowOrgConfirmModal(false)}
        onViewTerms={() => setShowOrgTermsModal(true)}
      />

      <ConfirmationPopup
        isOpen={showAlreadyRequestedModal}
        title="Application Already Submitted"
        message="You have already submitted an organiser request. Your application is currently under review by our admin team. Kindly wait for approval or updates via your registered email."
        confirmText="Understood"
        isLoading={false}
        onConfirm={() => setShowAlreadyRequestedModal(false)}
        onClose={() => setShowAlreadyRequestedModal(false)}
        onViewTerms={() => {}}
      />

      <ConfirmationPopup
        isOpen={showDeactivateConfirmModal}
        title="Account Deactivation Terms"
        message="Are you sure you want to deactivate your account?"
        confirmText="Confirm Deactivation"
        danger={true}
        isLoading={loading}
        onConfirm={executeDeactivate}
        onClose={() => setShowDeactivateConfirmModal(false)}
        onViewTerms={() => setShowDeactivateTermsModal(true)}
      />

      <OrganiserTermsModal
        isOpen={showOrgTermsModal}
        onClose={() => setShowOrgTermsModal(false)}
      />
      <DeactivationTermsModal
        isOpen={showDeactivateTermsModal}
        onClose={() => setShowDeactivateTermsModal(false)}
      />
    </>
  );
}

export default SettingsView;