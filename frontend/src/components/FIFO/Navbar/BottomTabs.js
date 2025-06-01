import React from "react";
import { FaClipboardList, FaFileAlt, FaBoxOpen, FaEllipsisH } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { label: "Pickslip", icon: <FaClipboardList />, to: "/pending-pickslip" },
  { label: "Receipt", icon: <FaFileAlt />, to: "/pending-receipts" },
  { label: "Holding", icon: <FaBoxOpen />, to: "/holding" },
  { label: "More", icon: <FaEllipsisH />, to: "/view" },
];

const BottomTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeIndex = tabs.findIndex((tab) => tab.to === location.pathname);
  const tabWidth = 100 / tabs.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 shadow-md md:hidden">
      {/* Top gradient line */}
      <div className="relative h-1">
        <div
          className="absolute top-0 h-1 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-in-out"
          style={{
            left: `calc(${tabWidth * activeIndex}% + ${(tabWidth - 2) / 2}%)`,
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.to)}
              className={`flex flex-col items-center text-sm px-2 pt-1 ${
                isActive ? "text-blue-600" : "text-gray-700"
              }`}
            >
              <span className="text-xl mb-1">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabs;
