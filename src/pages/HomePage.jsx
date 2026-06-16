import DesktopLayout from "../components/DesktopLayout.jsx";
import MobileLayout from "../components/MobileLayout.jsx";
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function HomePage() {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 900
  );
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/interaction/notifications`, {
          withCredentials: true,
        });
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        console.error("Error fetching notifications count:", err.message);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  return isMobile
    ? <MobileLayout unreadCount={unreadCount} />
    : <DesktopLayout unreadCount={unreadCount} />;
}

export default HomePage;