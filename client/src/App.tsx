import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import DepartmentView from "./pages/DepartmentView";
import Integrations from "./pages/Integrations";
import CreateTicket from "./pages/CreateTicket";
import TicketDetails from "./pages/TicketDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyResetOtp from "./pages/VerifyResetOtp";
import ResetPassword from "./pages/ResetPassword";

import { OrgProvider } from "./context/OrgContext";
import CreateOrganization from "./pages/organization/CreateOrganization";
import AcceptInvite from "./pages/organization/AcceptInvite";
import ViewOrganization from "./pages/organization/ViewOrganization";


function App() {
  return (
    <OrgProvider>

      <BrowserRouter>

        <Routes>

          {/* Default */}
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />


          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />


          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <DepartmentView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            }
          />


          <Route
            path="/create-ticket"
            element={
              <ProtectedRoute>
                <CreateTicket />
              </ProtectedRoute>
            }
          />


          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />


          <Route
            path="/ticket/:id"
            element={
              <ProtectedRoute>
                <TicketDetails />
              </ProtectedRoute>
            }
          />


          <Route
            path="/verify-otp"
            element={<VerifyOtp />}
          />


          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />


          <Route
            path="/verify-reset-otp"
            element={<VerifyResetOtp />}
          />


          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
          <Route
            path="/organization/create"
            element={
              <ProtectedRoute>
                <CreateOrganization />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invite/:token"
            element={<AcceptInvite />}
          />
          <Route
            path="/organization/view"
            element={
              <ProtectedRoute>
                <ViewOrganization />
              </ProtectedRoute>
            }
          />

        </Routes>

      </BrowserRouter>

    </OrgProvider>
  );
}


export default App;