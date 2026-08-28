import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Components
import Navbar from "./components/Navbar.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { ArchitectureModal } from "./components/ArchitectureModal.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { NotificationToastContainer } from "./components/common/NotificationToastContainer.jsx";

// Authentication pages
import { Login } from "./pages/Auth/Login.jsx";
import { Register } from "./pages/Auth/Register.jsx";

// Profile
import { Profile } from "./pages/Profile/Profile.jsx";

// Guest pages
import { Home } from "./pages/Guest/Home.jsx";
import { Explore } from "./pages/Guest/Explore.jsx";
import { AboutUs } from "./pages/Guest/AboutUs.jsx";
import { Contact } from "./pages/Guest/Contact.jsx";
import { GuesthouseSearch } from "./pages/Guest/Search.jsx";
import { GuesthouseDetail } from "./pages/Guest/GuesthouseDetail.jsx";
import { Booking } from "./pages/Guest/Booking.jsx";
import { GuestBookings } from "./pages/Guest/Reservations.jsx";
import GuestDashboard from "./pages/Guest/Dashboard.jsx";
import { BookingDetail } from "./pages/Guest/BookingDetail.jsx";
import { WriteReview } from "./pages/Guest/WriteReview.jsx";

// Owner pages
import { OwnerDashboard } from "./pages/Owner/Dashboard.jsx";
import { GuesthouseManage } from "./pages/Owner/GuesthouseManage.jsx";
import { RoomManage } from "./pages/Owner/RoomManage.jsx";
import { StaffManage } from "./pages/Owner/StaffManage.jsx";
import { RevenueReports } from "./pages/Owner/RevenueReports.jsx";

// Receptionist
import { ReceptionistDashboard } from "./pages/Receptionist/Dashboard.jsx";

// Admin
import { AdminDashboard } from "./pages/Admin/Dashboard.jsx";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [archModalOpen, setArchModalOpen] = useState(false);
  const location = useLocation();

  const isDashboard = 
    location.pathname === '/guest/dashboard' ||
    location.pathname === '/guest/search' ||
    location.pathname === '/reservations' ||
    location.pathname === '/guest/reviews' ||
    location.pathname.startsWith('/reviews/');

  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col font-sans">

      {!isDashboard && (
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      <div className="flex-1 flex w-full">

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenArchModal={() => setArchModalOpen(true)}
        />

        <main className="flex-1 min-w-0">

          <Routes>

            <Route path="/" element={<Home />} />

            <Route path="/explore" element={<Explore />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />

            <Route path="/search" element={<GuesthouseSearch />} />

            <Route
              path="/guest/search"
              element={
                <ProtectedRoute allowedRoles={["GUEST"]}>
                  <GuesthouseSearch />
                </ProtectedRoute>
              }
            />

            <Route path="/guesthouse/:id" element={<GuesthouseDetail />} />
            <Route path="/guesthouses/:id" element={<GuesthouseDetail />} />

            <Route path="/booking/:guesthouseId/:roomId" element={<Booking />} />
            <Route path="/booking" element={<Booking />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/guest/dashboard"
              element={
                <ProtectedRoute allowedRoles={["GUEST"]}>
                  <GuestDashboard />
                </ProtectedRoute>
              }
            />

            {/* ✅ Reviews Route */}
            <Route
              path="/guest/reviews"
              element={
                <ProtectedRoute allowedRoles={["GUEST"]}>
                  <WriteReview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reviews/:id"
              element={
                <ProtectedRoute allowedRoles={["GUEST"]}>
                  <WriteReview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["GUEST", "OWNER", "RECEPTIONIST", "ADMIN"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reservations"
              element={
                <ProtectedRoute allowedRoles={["GUEST", "OWNER", "RECEPTIONIST", "ADMIN"]}>
                  <GuestBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reservations/:id"
              element={
                <ProtectedRoute allowedRoles={["GUEST", "OWNER", "RECEPTIONIST", "ADMIN"]}>
                  <BookingDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={["OWNER"]}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner/guesthouse"
              element={
                <ProtectedRoute allowedRoles={["OWNER"]}>
                  <GuesthouseManage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner/rooms"
              element={
                <ProtectedRoute allowedRoles={["OWNER"]}>
                  <RoomManage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner/staff"
              element={
                <ProtectedRoute allowedRoles={["OWNER"]}>
                  <StaffManage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner/revenue"
              element={
                <ProtectedRoute allowedRoles={["OWNER"]}>
                  <RevenueReports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/receptionist"
              element={
                <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </main>
      </div>

      {!isDashboard && (
        <footer className="border-t border-stone-200 bg-[#043658] py-8 text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold">© 2026 Guesthouse Platform.</p>
              <p className="mt-1 text-xs text-white/60">Discover and reserve verified guesthouses across Ethiopia.</p>
            </div>
            <button
              type="button"
              onClick={() => setArchModalOpen(true)}
              className="text-sm font-semibold text-[#FFC107] transition hover:text-white hover:underline"
            >
              View Full-Stack API & Architecture Specs
            </button>
          </div>
        </footer>
      )}

      <ArchitectureModal isOpen={archModalOpen} onClose={() => setArchModalOpen(false)} />
      <NotificationToastContainer />

    </div>
  );
}