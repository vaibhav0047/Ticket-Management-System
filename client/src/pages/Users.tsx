import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import { useOrg } from "../context/OrgContext";


interface Member {

    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };

    department?: {
        _id: string;
        name: string;
    } | null;

    role: string;
    designation?: string;

}
const designationMap: any = {

    "Engineering Team": [
        "Engineering Manager",
        "Tech Lead",
        "Senior Software Engineer",
        "Software Engineer",
        "Backend Engineer",
        "Frontend Engineer",
        "Full Stack Developer",
        "QA Engineer",
        "DevOps Engineer"
    ],


    "Product Team": [
        "Product Manager",
        "Associate Product Manager",
        "Product Owner",
        "Business Analyst",
        "Product Analyst"
    ],


    "Support Team": [
        "Support Manager",
        "Customer Success Manager",
        "Support Engineer",
        "Technical Support Engineer"
    ],


    "Sales Team": [
        "Sales Manager",
        "Account Executive",
        "Business Development Executive",
        "Sales Associate"
    ],


    "Design Team": [
        "Design Lead",
        "UI Designer",
        "UX Designer",
        "Product Designer",
        "Visual Designer"
    ]

};
export default function Users() {
    const [currentUser] = useState(
        JSON.parse(
            localStorage.getItem("user") || "{}"
        )
    );
    const [members, setMembers] = useState<Member[]>([]);
    const { activeOrg } = useOrg();


    const myMembership =
        members.find(
            m => m.user._id === currentUser.id
        );


    const canEdit =
        [
            "owner",
            "org_admin"
        ].includes(myMembership?.role);
    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await api.get(
                `/orgs/${activeOrg?._id}/members`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setMembers(res.data.members || []);
        } catch (err) {
            console.error(err);
        }
    };
    const updateMember = async (
        id: string,
        role: string,
        designation: string
    ) => {
        try {

            const token = localStorage.getItem("token");


            await api.put(
                `/users/${id}`,
                {
                    role,
                    designation
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            fetchMembers();
        } catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        if (activeOrg?._id)
            fetchMembers();
    }, [activeOrg]);

    return (
        <div className="bg-slate-100 min-h-screen">
            <Navbar />
            <div className="ml-64 p-8">
                <Topbar />
                <h1 className="text-3xl font-bold mt-8 mb-6">
                    Organization Members
                </h1>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left">
                                    Name
                                </th>
                                <th className="p-4 text-left">
                                    Email
                                </th>
                                <th className="p-4 text-left">
                                    Department
                                </th>
                                <th className="p-4 text-left">
                                    Designation
                                </th>
                                <th className="p-4 text-left">
                                    Role
                                </th>
                                {
                                    canEdit && (
                                        <th className="p-4 text-left">
                                            Action
                                        </th>
                                    )
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {
                                members.map(member => (
                                    <MemberRow
                                        key={member._id}
                                        member={member}
                                        canEdit={canEdit}
                                        updateMember={updateMember}
                                    />
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
function MemberRow({
    member,
    canEdit,
    updateMember
}: {
    member: Member;
    canEdit: boolean;
    updateMember:
    (id: string, role: string, designation: string) => void;
}) {
    const [role, setRole] = useState(member.role);
    const [designation, setDesignation] =
        useState(member.designation || "");
    const availableDesignations =
        designationMap[
        member.department?.name || ""
        ] || [];

    return (
        <tr className="border-t hover:bg-gray-50">
            <td className="p-4 font-medium">
                {member.user.name}
            </td>
            <td className="p-4 text-gray-600">
                {member.user.email}
            </td>
            <td className="p-4">
                {
                    member.department?.name ||
                    "Not Assigned"
                }
            </td>
            <td className="p-4">

                {
                    canEdit ? (

                        <select
                            value={designation}
                            onChange={
                                e => setDesignation(e.target.value)
                            }
                            className="border rounded px-3 py-2"
                        >

                            <option value="">
                                Select Designation
                            </option>

                            {
                                availableDesignations.map(
                                    (title: string) => (
                                        <option
                                            key={title}
                                            value={title}
                                        >
                                            {title}
                                        </option>
                                    )
                                )

                            }

                        </select>

                    )

                        :

                        (

                            <span className="text-gray-700">
                                {
                                    member.designation ||
                                    "Not Assigned"
                                }
                            </span>

                        )

                }

            </td>
            <td className="p-4">

                {
                    canEdit ? (

                        <select
                            value={role}
                            onChange={
                                e => setRole(e.target.value)
                            }
                            className="border rounded px-3 py-2"
                        >

                            <option value="owner">
                                Owner
                            </option>

                            <option value="org_admin">
                                Admin
                            </option>

                            <option value="team_lead">
                                Team Lead
                            </option>

                            <option value="member">
                                Member
                            </option>

                            <option value="viewer">
                                Viewer
                            </option>

                        </select>

                    )

                        :

                        (

                            <span className="capitalize text-gray-700">
                                {member.role}
                            </span>

                        )

                }

            </td>
            {
                canEdit && (

                    <td className="p-4">

                        <button
                            onClick={() =>
                                updateMember(
                                    member._id,
                                    role,
                                    designation
                                )
                            }
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Save
                        </button>

                    </td>

                )
            }
        </tr>
    )
}