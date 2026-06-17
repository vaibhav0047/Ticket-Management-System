// pages/organization/AcceptInvite.tsx

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function AcceptInvite() {

    const { token } = useParams();
    const handleAccept = async () => {
        try {
            const tokenValue =
                localStorage.getItem("token");

            if (!tokenValue) {
                alert("Please login first");
                return;
            }

            await axios.post(
                `/api/invitations/accept/${token}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${tokenValue}`,
                    },
                }
            );

            alert("Successfully joined organization");

        } catch (error: any) {
            console.error(error);

            alert(
                error?.response?.data?.message ||
                "Failed to accept invitation"
            );
        }
    };
    const [invite, setInvite] =
        useState<any>(null);

    useEffect(() => {

        axios
            .get(`/api/invitations/${token}`)
            .then((res) =>
                setInvite(res.data)
            )
            .catch(() =>
                alert("Invalid invitation")
            );

    }, []);

    if (!invite)
        return <div>Loading...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center">

            <div className="bg-white p-8 rounded-xl shadow">

                <h1 className="text-2xl font-bold">
                    Join {invite.orgId.name}
                </h1>

                <p>
                    Role: {invite.role}
                </p>

                <button
                    onClick={handleAccept}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Accept Invitation
                </button>

            </div>

        </div>
    );
}