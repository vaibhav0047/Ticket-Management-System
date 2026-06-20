import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

type Org = {
    _id: string;
    name: string;
    role: "owner" | "org_admin" | "department_manager" | "team_lead" | "member" | "viewer";
    department?: {
        _id: string;
        name: string;
    };
};

type OrgContextType = {
    orgs: Org[];
    activeOrg: Org | null;
    setActiveOrg: (org: Org) => void;
    loading: boolean;
};

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {

    const [orgs, setOrgs] = useState<Org[]>([]);
    const [activeOrg, setActiveOrg] = useState<Org | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchOrgs = async () => {

            try {

                const token = localStorage.getItem("token");

                const res = await axios.get(
                    "/api/orgs/my",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const organizations = res.data;

                setOrgs(organizations);

                if (organizations.length)
                    setActiveOrg(organizations[0]);

            } catch (err) {

                console.error("Org fetch failed:", err);

            } finally {

                setLoading(false);

            }

        };

        fetchOrgs();

    }, []);


    return (
        <OrgContext.Provider
            value={{
                orgs,
                activeOrg,
                setActiveOrg,
                loading
            }}
        >
            {children}
        </OrgContext.Provider>
    );

}


export function useOrg() {

    const context = useContext(OrgContext);

    if (!context) {

        throw new Error(
            "useOrg must be used inside OrgProvider"
        );

    }

    return context;

}