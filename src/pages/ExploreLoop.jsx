import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaPlay,
  FaVolumeMute,
  FaVolumeUp,
  FaTrash,
  FaBookmark,
  FaRegBookmark,
} from "react-icons/fa";
import styles from "./ShowOneLoop.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const ExploreLoop = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [allLoops, setAllLoops] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const clickTimer = useRef(null);

  const touchStartY = useRef(0);
  const SWIPE_THRESHOLD = 50;

  // Derived state properties
  const currentLoop = allLoops?.[currentIndex] || null;
  const liked =
    currentLoop?.likes?.some(
      (id) => id.toString() === currentUser?._id?.toString(),
    ) || false;
  const likesCount = currentLoop?.likes?.length || 0;
  const saved =
    currentUser?.savedLoops?.some(
      (id) => id.toString() === currentLoop?._id?.toString(),
    ) || false;

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;

    // Swipe Up -> Next loop
    if (deltaY > SWIPE_THRESHOLD) {
      handleNext();
    }

    // Swipe Down -> Previous loop
    if (deltaY < -SWIPE_THRESHOLD) {
      handlePrev();
    }
  };

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        setLoading(true);
        const [userRes, loopsRes] = await Promise.all([
          axios.get(`${API_URL}/api/user/current`, { withCredentials: true }),
          axios.get(`${API_URL}/api/loop/explore/all`, { withCredentials: true }),
        ]);

        setCurrentUser(userRes.data.user);
        setAllLoops(loopsRes.data.loops || []);
        setCurrentIndex(0);
      } catch (error) {
        console.error("Failed to load explore loops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExploreData();
  }, []);

  const handleNext = () => {
    if (currentIndex >= allLoops.length - 1) return;
    setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    setCurrentIndex(currentIndex - 1);
  };

  const handleLike = async (e) => {
    if (e) e.stopPropagation();
    if (!currentLoop || !currentUser) return;

    // Optimistically toggle liked status in allLoops list
    const alreadyLiked = currentLoop.likes?.some(
      (id) => id.toString() === currentUser._id.toString(),
    );
    const updatedLikes = alreadyLiked
      ? currentLoop.likes.filter(
          (id) => id.toString() !== currentUser._id.toString(),
        )
      : [...(currentLoop.likes || []), currentUser._id];

    setAllLoops((prev) =>
      prev.map((l, idx) =>
        idx === currentIndex ? { ...l, likes: updatedLikes } : l,
      ),
    );

    try {
      await axios.post(
        `${API_URL}/api/loop/like/${currentLoop._id}`,
        {},
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Failed to like loop:", err);
      // Revert on failure
      setAllLoops((prev) =>
        prev.map((l, idx) =>
          idx === currentIndex ? { ...l, likes: currentLoop.likes } : l,
        ),
      );
    }
  };

  const handleSave = async (e) => {
    if (e) e.stopPropagation();
    if (!currentLoop || !currentUser) return;

    // Optimistically toggle saved status in currentUser
    const alreadySaved = currentUser.savedLoops?.some(
      (id) => id.toString() === currentLoop._id.toString(),
    );
    const updatedSavedLoops = alreadySaved
      ? currentUser.savedLoops.filter(
          (id) => id.toString() !== currentLoop._id.toString(),
        )
      : [...(currentUser.savedLoops || []), currentLoop._id];

    setCurrentUser((prev) => ({
      ...prev,
      savedLoops: updatedSavedLoops,
    }));

    try {
      await axios.post(
        `${API_URL}/api/loop/save/${currentLoop._id}`,
        {},
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Failed to save loop:", err);
      // Revert on failure
      setCurrentUser((prev) => ({
        ...prev,
        savedLoops: currentUser.savedLoops,
      }));
    }
  };

  const handleDelete = async () => {
    setShowConfirmDelete(false);
    try {
      setIsDeleting(true);
      await axios.post(
        `${API_URL}/api/loop/delete/${currentLoop._id}`,
        {},
        { withCredentials: true },
      );
      // Remove deleted loop from state
      setAllLoops((prev) => prev.filter((_, idx) => idx !== currentIndex));
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to delete loop:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDoubleClickLike = () => {
    setShowHeartPop(true);
    setTimeout(() => {
      setShowHeartPop(false);
    }, 800);

    const alreadyLiked = currentLoop?.likes?.some(
      (id) => id.toString() === currentUser?._id?.toString(),
    );
    if (!alreadyLiked) {
      handleLike();
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      handleDoubleClickLike();
    } else {
      clickTimer.current = setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          if (video.paused) {
            video.play().catch(() => {});
            setIsPaused(false);
          } else {
            video.pause();
            setIsPaused(true);
          }
        }
        clickTimer.current = null;
      }, 250);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>Loading explore loops...</span>
      </div>
    );
  }

  if (isDeleting) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>Deleting loop...</span>
      </div>
    );
  }

  if (allLoops.length === 0) {
    return (
      <div className={styles.loading}>
        <h2>No Loops Available</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: "8px 0 20px" }}>
          Check back later for new content from other users!
        </p>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          Go Back
        </button>
      </div>
    );
  }

  const isOwner = currentUser?._id?.toString() === currentLoop?.author?._id?.toString();

  return (
    <div
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Close Click Zone */}
      <div className={styles.closeZone} onClick={() => navigate(-1)} />

      {/* CLOSE BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className={styles.closeBtn}
        title="Close"
      >
        <IoClose />
      </button>

      {/* PLAYER COMPONENT */}
      <div className={styles.playerWrapper}>
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            src={currentLoop.mediaUrl}
            className={styles.videoMedia}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            onClick={handleVideoClick}
          />

          {isPaused && (
            <div className={styles.videoPlayOverlay} onClick={handleVideoClick}>
              <FaPlay size={20} />
            </div>
          )}

          {showHeartPop && (
            <div className={styles.heartOverlay}>
              <FaHeart className={styles.popHeartIcon} size={80} />
            </div>
          )}

          {/* Bottom Overlay Details inside the player */}
          <div className={styles.bottomMeta}>
            <div className={styles.authorSection}>
              <Link
                to={isOwner ? "/myInfo" : `/lookFor/${currentLoop?.author?._id}`}
                className={styles.authorLink}
              >
                <img
                  src={currentLoop.author?.profilePicture || "/insta.webp"}
                  alt={currentLoop.author?.username}
                  className={styles.avatar}
                />
                <span className={styles.username}>
                  {currentLoop.author?.username}
                </span>
              </Link>
            </div>
            {currentLoop.description && (
              <p className={styles.caption}>{currentLoop.description}</p>
            )}
          </div>

          {/* Side Actions list inside the video container */}
          <div className={styles.actionsColumn}>
            {/* Like Action */}
            <div className={styles.actionItem}>
              <button
                onClick={handleLike}
                className={`${styles.actionButton} ${liked ? styles.liked : ""}`}
              >
                {liked ? <FaHeart /> : <FaRegHeart />}
              </button>
              <span className={styles.actionText}>{likesCount}</span>
            </div>

            {/* Comment Action */}
            <div className={styles.actionItem}>
              <Link
                to={`/commentpage/${currentLoop._id}`}
                className={styles.actionButton}
              >
                <FaRegComment />
              </Link>
              <span className={styles.actionText}>
                {currentLoop.comments?.length || 0}
              </span>
            </div>

            {/* Save Action */}
            <div className={styles.actionItem}>
              <button
                onClick={handleSave}
                className={`${styles.actionButton} ${saved ? styles.saved : ""}`}
              >
                {saved ? <FaBookmark /> : <FaRegBookmark />}
              </button>
              <span className={styles.actionText}>
                {saved ? "Saved" : "Save"}
              </span>
            </div>

            {/* Mute Action */}
            <div className={styles.actionItem}>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={styles.actionButton}
              >
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
              <span className={styles.actionText}>
                {isMuted ? "Muted" : "Audio"}
              </span>
            </div>

            {/* Owner Delete Action */}
            {isOwner && (
              <div className={styles.actionItem}>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className={`${styles.actionButton} ${styles.deleteBtn}`}
                  title="Delete Loop"
                >
                  <FaTrash />
                </button>
                <span className={styles.actionText}>Delete</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {showConfirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete Loop?</h3>
            <p>Are you sure you want to delete this loop forever?</p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                className={styles.deleteConfirmBtn}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreLoop;
