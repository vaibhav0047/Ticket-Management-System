// pages/organization/AcceptInvite.tsx

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AcceptInvite() {
    const { token } = useParams();
    const [invite, setInvite] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState("");


    useEffect(() => {
        const fetchInvite = async () => {
            try {
                const res = await axios.get(`/api/invitations/${token}`);

                setInvite(res.data);
                setDepartments(res.data.departments || []);
                console.log(res.data);
            } catch (err: any) {
                console.error(err);
                setError(
                    err?.response?.data?.message || "Invalid or expired invitation"
                );
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchInvite();
    }, [token]);



    const handleAccept = async () => {

        const tokenValue = localStorage.getItem("token");


        if (!tokenValue) {

            localStorage.setItem(
                "inviteToken",
                token || ""
            );


            localStorage.setItem(
                "inviteDepartment",
                selectedDepartment
            );


            window.location.href = "/login";

            return;
        }


        setAccepting(true);


        try {
            console.log({
                token,
                selectedDepartment,
                tokenValue
            });

            await axios.post(
                `/api/invitations/accept/${token}`,
                {
                    departmentId: selectedDepartment
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${tokenValue}`
                    }
                }
            );


            window.location.href = "/dashboard";


        } catch (err: any) {

            console.error(err);

            alert(
                err.response?.data?.message ||
                "Failed to accept invitation"
            );


        } finally {

            setAccepting(false);

        }
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8 animate-pulse">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-gray-200 rounded-full" />
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto" />
                            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                        </div>
                        <div className="mt-6 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-5/6" />
                        </div>
                        <div className="mt-8 h-12 bg-gray-200 rounded-lg w-full" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !invite) {
        return (
            <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-gray-900">Invalid Invitation</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        {error || "This invitation link is invalid or has expired."}
                    </p>
                    <a
                        href="/"
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </a>
                </div>
            </div>
        );
    }

    // Success state
    return (
        <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Decorative header gradient */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

                <div className="p-8">
                    {/* Org avatar */}
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                            {invite.orgId?.name?.charAt(0)?.toUpperCase() || "O"}
                        </div>
                    </div>

                    {/* Invitation header */}
                    <div className="text-center mt-5">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Join {invite.orgId?.name}
                        </h1>
                        <p className="mt-1.5 text-sm text-gray-500">
                            You've been invited to join this organization
                        </p>
                    </div>

                    {/* Invitation details card */}
                    <div className="mt-6 bg-gray-50 rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Your role</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-200 capitalize">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {invite.role}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Organization</span>
                            <span className="text-sm font-medium text-gray-900">
                                {invite.orgId?.name}
                            </span>
                        </div>
                        {invite.expiresAt && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                <span className="text-sm text-gray-500">Expires</span>
                                <span className="text-sm text-gray-700">
                                    {new Date(invite.expiresAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Department
                        </label>

                        <select
                            value={selectedDepartment}
                            onChange={(e) =>
                                setSelectedDepartment(e.target.value)
                            }
                            className="
            w-full
            border
            border-gray-300
            rounded-lg
            px-3
            py-3
            text-sm
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
        "
                        >
                            <option value="">
                                Choose Department
                            </option>

                            {departments.map((dept: any) => (
                                <option
                                    key={dept._id}
                                    value={dept._id}
                                >
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>


                    {/* Action buttons */}
                    <div className="mt-6 space-y-3">
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {accepting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Accept Invitation
                                </>
                            )}
                        </button>
                        <a
                            href="/"
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline
                        </a>
                    </div>

                    {/* Footer */}
                    <p className="mt-6 text-xs text-center text-gray-400">
                        By accepting, you agree to the organization's terms and policies.
                    </p>
                </div>
            </div>
        </div>
    );
}