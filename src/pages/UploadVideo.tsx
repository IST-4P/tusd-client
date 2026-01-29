import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as tus from "tus-js-client";
import {} from "tus-js-client";
import "../styles/UploadVideo.css";

interface UploadState {
  file: File | null;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  uploadUrl: string | null;
  errorMessage: string | null;
}

function UploadVideo() {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    progress: 0,
    status: "idle",
    uploadUrl: null,
    errorMessage: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<tus.Upload | null>(null);
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra xem file có phải là video không
      if (!file.type.startsWith("video/")) {
        alert("Vui lòng chọn file video!");
        return;
      }
      setUploadState({
        file,
        progress: 0,
        status: "idle",
        uploadUrl: null,
        errorMessage: null,
      });
    }
  };

  const uploadFile = async () => {
    if (!uploadState.file) return;

    try {
      const endpoint = import.meta.env.VITE_TUS_ENDPOINT;

      const upload = new tus.Upload(uploadState.file, {
        endpoint,
        metadata: {
          filename: uploadState.file.name,
          filetype: uploadState.file.type,
          productId: "35953483-bf35-447c-b8d8-27a81eee8d46",
        },
        onBeforeRequest: function (req) {
          // Lấy đối tượng XMLHttpRequest bên dưới
          var xhr = req.getUnderlyingObject();

          // Bật withCredentials để trình duyệt gửi cookie kèm request
          xhr.withCredentials = true;
        },
        retryDelays: [0, 1000, 3000, 5000],
        onProgress: (uploaded, total) => {
          const progress = Math.floor((uploaded / total) * 100);
          setUploadState((prev) => ({
            ...prev,
            progress,
            status: "uploading",
          }));
        },
        onSuccess: () => {
          setUploadState((prev) => ({
            ...prev,
            status: "success",
            uploadUrl: upload.url,
          }));
          console.log("Upload done!", upload.url);
        },
        onError: (error) => {
          setUploadState((prev) => ({
            ...prev,
            status: "error",
            errorMessage: error.message,
          }));
          console.error("Upload error:", error);
        },
      });

      uploadRef.current = upload;
      upload.start();
      setUploadState((prev) => ({ ...prev, status: "uploading" }));
    } catch (error) {
      setUploadState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  const cancelUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      setUploadState({
        file: null,
        progress: 0,
        status: "idle",
        uploadUrl: null,
        errorMessage: null,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const resetUpload = () => {
    setUploadState({
      file: null,
      progress: 0,
      status: "idle",
      uploadUrl: null,
      errorMessage: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogout = () => {
    // Có thể gọi API logout nếu cần
    navigate("/");
  };

  return (
    <div className="app-container">
      <button onClick={handleLogout} className="logout-btn">
        ← Quay lại đăng nhập
      </button>

      <div className="upload-card">
        <h1>📹 Upload Video</h1>
        <p className="subtitle">
          Upload video của bạn với tính năng tiếp tục upload
        </p>

        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            disabled={uploadState.status === "uploading"}
            className="file-input"
            id="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Chọn video để upload</span>
          </label>

          {uploadState.file && (
            <div className="file-info">
              <div className="file-details">
                <strong>📄 {uploadState.file.name}</strong>
                <span>
                  {(uploadState.file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              {uploadState.status === "idle" && (
                <div className="button-group">
                  <button onClick={uploadFile} className="btn btn-primary">
                    Bắt đầu Upload
                  </button>
                  <button onClick={resetUpload} className="btn btn-secondary">
                    Hủy
                  </button>
                </div>
              )}

              {uploadState.status === "uploading" && (
                <>
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                    <div className="progress-text">{uploadState.progress}%</div>
                  </div>
                  <button onClick={cancelUpload} className="btn btn-danger">
                    Hủy Upload
                  </button>
                </>
              )}

              {uploadState.status === "success" && (
                <div className="success-message">
                  <div className="status-icon">✅</div>
                  <p>Upload thành công!</p>
                  {uploadState.uploadUrl && (
                    <div className="upload-url">
                      <strong>URL:</strong> {uploadState.uploadUrl}
                    </div>
                  )}
                  <button onClick={resetUpload} className="btn btn-primary">
                    Upload video khác
                  </button>
                </div>
              )}

              {uploadState.status === "error" && (
                <div className="error-message">
                  <div className="status-icon">❌</div>
                  <p>Upload thất bại!</p>
                  {uploadState.errorMessage && (
                    <div className="error-details">
                      {uploadState.errorMessage}
                    </div>
                  )}
                  <div className="button-group">
                    <button onClick={uploadFile} className="btn btn-primary">
                      Thử lại
                    </button>
                    <button onClick={resetUpload} className="btn btn-secondary">
                      Chọn file khác
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadVideo;
