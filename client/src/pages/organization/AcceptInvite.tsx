// pages/organization/AcceptInvite.tsx

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";


export default function AcceptInvite() {


    const { token } = useParams();


    const [invite, setInvite] =
        useState<any>(null);



    useEffect(() => {


        const fetchInvite = async () => {

            try {

                const res =
                    await axios.get(
                        `/api/invitations/${token}`
                    );


                setInvite(res.data);


            } catch (error) {

                console.error(error);

                alert("Invalid invitation");

            }

        };


        if (token) {
            fetchInvite();
        }


    }, [token]);





    const handleAccept = async () => {


        try {


            const tokenValue =
                localStorage.getItem("token");



            // User not logged in
            if (!tokenValue) {


                localStorage.setItem(
                    "inviteToken",
                    token || ""
                );


                window.location.href =
                    "/login";


                return;

            }





            await axios.post(

                `/api/invitations/accept/${token}`,

                {},

                {
                    headers: {

                        Authorization:
                            `Bearer ${tokenValue}`

                    }
                }

            );



            // after joining go dashboard

            window.location.href =
                "/dashboard";



        } catch (error: any) {


            console.error(error);



            alert(

                error?.response?.data?.message ||

                "Failed to accept invitation"

            );


        }

    };






    if (!invite) {


        return (

            <div className="min-h-screen flex items-center justify-center">

                Loading invitation...

            </div>

        );

    }






    return (

        <div className="min-h-screen flex items-center justify-center">


            <div className="bg-white p-8 rounded-xl shadow">


                <h1 className="text-2xl font-bold">


                    Join {invite.orgId?.name}


                </h1>




                <p className="mt-2">


                    Role: {invite.role}


                </p>





                <button

                    onClick={handleAccept}

                    className="mt-5 bg-blue-600 text-white px-5 py-2 rounded"

                >

                    Accept Invitation


                </button>



            </div>


        </div>

    );

}