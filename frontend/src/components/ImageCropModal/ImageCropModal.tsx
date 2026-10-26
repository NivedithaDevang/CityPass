import { useState } from "react";
import Cropper from "react-easy-crop";
import { RotateCcw, RotateCw, X } from "lucide-react";
import { getCroppedImg } from "../../types/cropImageHelper";
import type { Area } from "../../types/cropImageHelper";
import "./ImageCropModal.css";

interface ImageCropModalProps {
  imageSrc: string;
  title: string;
  aspect?: number;
  cropShape?: "rect" | "round";
  onCancel: () => void;
  onApply: (image: File) => void;
}

function ImageCropModal({
  imageSrc,
  title,
  aspect = 1,
  cropShape = "rect",
  onCancel,
  onApply,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;

    try {
      setSaving(true);
      setError("");
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        "cropped-image.webp",
        rotation,
      );
      onApply(croppedImage);
    } catch (cropError) {
      console.error("Failed to crop image:", cropError);
      setError("Could not crop this image. Please try another image.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="image-crop-backdrop" onClick={onCancel}>
      <section
        className="image-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="image-crop-header">
          <h2 id="image-crop-title">{title}</h2>
          <button type="button" onClick={onCancel} aria-label="Close crop dialog">
            <X size={18} />
          </button>
        </header>

        <div className="image-crop-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, croppedPixels) =>
              setCroppedAreaPixels(croppedPixels)
            }
          />
        </div>

        <div className="image-crop-controls">
          <div className="image-crop-rotate-controls">
            <button
              type="button"
              onClick={() => setRotation((current) => current - 90)}
              aria-label="Rotate image left"
            >
              <RotateCcw size={17} />
              Rotate left
            </button>
            <button
              type="button"
              onClick={() => setRotation((current) => current + 90)}
              aria-label="Rotate image right"
            >
              <RotateCw size={17} />
              Rotate right
            </button>
          </div>
          <label>
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          {error && <p className="image-crop-error" role="alert">{error}</p>}
        </div>

        <footer className="image-crop-footer">
          <button type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="image-crop-apply"
            onClick={() => void handleApply()}
            disabled={saving || !croppedAreaPixels}
          >
            {saving ? "Applying..." : "Apply crop"}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default ImageCropModal;
