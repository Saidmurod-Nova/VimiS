import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AdminDashboard from "@/pages/admin/Dashboard";

export default function AdminRoute() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/" replace />;
}