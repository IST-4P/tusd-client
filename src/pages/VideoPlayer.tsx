import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios";
import "../styles/VideoPlayer.css";

interface QualityLevel {
  height: number;
  bitrate: number;
  name: string;
}

function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackToken, setPlaybackToken] = useState<string>("");
  const [manifestUrl, setManifestUrl] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Fetch playback token and URLs from API
  useEffect(() => {
    const fetchPlaybackData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${apiBaseUrl}/media/playback?videoId=${id}`
        );
        const { manifestUrl, thumbnailUrl, playbackToken } = response.data.data;
        setManifestUrl(manifestUrl);
        setThumbnailUrl(thumbnailUrl);
        setPlaybackToken(playbackToken);
      } catch (err) {
        setError("Failed to fetch playback data");
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPlaybackData();
    }
  }, [id, apiBaseUrl]);

  useEffect(() => {
    if (!videoRef.current || !id || !manifestUrl || !playbackToken) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        xhrSetup: (xhr, url) => {
          xhr.setRequestHeader("Authorization", "Bearer " + playbackToken);
        },
      });

      hlsRef.current = hls;
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsLoading(false);

        // Extract quality levels
        const levels = data.levels.map((level, index) => ({
          height: level.height,
          bitrate: level.bitrate,
          name: `${level.height}p`,
        }));

        setQualities(levels);
        setCurrentQuality(-1); // -1 means auto
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Network error - cannot load video");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Media error - trying to recover");
              hls.recoverMediaError();
              break;
            default:
              setError("Fatal error - cannot play video");
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari native HLS support
      video.src = manifestUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
      });
    } else {
      setError("HLS is not supported in this browser");
      setIsLoading(false);
    }
  }, [id, manifestUrl, playbackToken]);

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.5;
        setIsMuted(false);
        setVolume(volume || 0.5);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, []);

  return (
    <div className="video-player-container">
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="video-content">
        <div className="video-wrapper" onClick={togglePlay}>
          <video
            ref={videoRef}
            poster={thumbnailUrl}
            className="video-element"
            playsInline
            autoPlay
            loop
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Your browser does not support the video tag.
          </video>

          {/* Volume Control - Top Right */}
          <div className="volume-control" onClick={(e) => e.stopPropagation()}>
            <button className="volume-button" onClick={toggleMute}>
              {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>

          {isLoading && (
            <div className="loading-overlay">
              <p>Loading video...</p>
            </div>
          )}
        </div>

        {/* Quality Buttons - Right Side */}
        {!isLoading && qualities.length > 0 && (
          <div className="quality-selector-side">
            <button
              className={`quality-btn ${currentQuality === -1 ? "active" : ""}`}
              onClick={() => handleQualityChange(-1)}
              title="Auto"
            >
              Auto
            </button>
            {qualities.map((quality, index) => (
              <button
                key={index}
                className={`quality-btn ${
                  currentQuality === index ? "active" : ""
                }`}
                onClick={() => handleQualityChange(index)}
                title={quality.name}
              >
                {quality.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Progress Bar - Bottom */}
      <div
        className="custom-progress-bar"
        ref={progressRef}
        onClick={handleProgressClick}
      >
        <div
          className="progress-filled"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

export default VideoPlayer;
