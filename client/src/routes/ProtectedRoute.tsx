import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import AICopilotDrawer from "../components/AICopilotDrawer";

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" />;
    }

    return (
        <>
            {children}
            <AICopilotDrawer />
        </>
    );
}
