import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { ArchitectureModal } from './components/ArchitectureModal.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

import { Login } from './pages/Auth/Login.jsx';
import { Register } from './pages/Auth/Register.jsx';

import { Home } from './pages/Guest/Home.jsx';
import { GuesthouseSearch } from './pages/Guest/Search.jsx';
import { GuesthouseDetail } from './pages/Guest/GuesthouseDetail.jsx';
import { Booking } from './pages/Guest/Booking.jsx';
import { GuestBookings } from './pages/Guest/Reservations.jsx';

import { OwnerDashboard } from './pages/Owner/Dashboard.jsx';
import { GuesthouseManage } from './pages/Owner/GuesthouseManage.jsx';
import { RoomManage } from './pages/Owner/RoomManage.jsx';
import { StaffManage } from './pages/Owner/StaffManage.jsx';
import { RevenueReports } from './pages/Owner/RevenueReports.jsx';

import { ReceptionistDashboard } from './pages/Receptionist/Dashboard.jsx';
import { AdminDashboard } from './pages/Admin/Dashboard.jsx';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [archModalOpen, setArchModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenArchModal={() => setArchModalOpen(true)}
      />

      {/* Main Layout Container with Sidebar */}
      <div className="flex-1 flex w-full">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenArchModal={() => setArchModalOpen(true)}
        />

        <main className="flex-1 min-w-0 pb-12">
          <Routes>
            {/* Public / Guest Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<GuesthouseSearch />} />
            <Route path="/guesthouse/:id" element={<GuesthouseDetail />} />
            <Route path="/booking" element={<Booking />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Guest Reservations */}
            <Route
              path="/reservations"
              element={
                <ProtectedRoute allowedRoles={['GUEST', 'OWNER', 'RECEPTIONIST', 'ADMIN']}>
                  <GuestBookings />
                </ProtectedRoute>
              }
            />

            {/* Protected Owner Routes */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/guesthouse"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <GuesthouseManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/rooms"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <RoomManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/staff"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <StaffManage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/revenue"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <RevenueReports />
                </ProtectedRoute>
              }
            />

            {/* Protected Receptionist Route */}
            <Route
              path="/receptionist"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/search" replace />} />
          </Routes>
        </main>
      </div>

      <footer className="bg-stone-950 border-t border-stone-800 py-6 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Guesthouse Reservation Platform. All Rights Reserved.</p>
          <button
            onClick={() => setArchModalOpen(true)}
            className="text-amber-400 hover:underline font-semibold"
          >
            View Full-Stack API & Architecture Specs
          </button>
        </div>
      </footer>

      {/* Architecture Documentation Modal */}
      <ArchitectureModal
        isOpen={archModalOpen}
        onClose={() => setArchModalOpen(false)}
      />
    </div>
  );
}
