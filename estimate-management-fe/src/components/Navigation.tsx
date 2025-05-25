import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navigation: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="bg-gray-800 text-white p-4 mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">Estimate Management</div>
        <div className="flex gap-4">
          <Link
            to="/"
            className={`px-3 py-2 rounded-md ${
              isHome ? "bg-gray-900" : "hover:bg-gray-700"
            }`}
          >
            Home
          </Link>
          {!isHome && location.pathname.includes("/estimate/") && (
            <span className="px-3 py-2 bg-gray-900 rounded-md">
              Current Estimate
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
