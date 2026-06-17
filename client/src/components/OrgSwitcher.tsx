import { useOrg } from "../context/OrgContext";


export default function OrgSwitcher() {

    const {
        orgs,
        activeOrg,
        setActiveOrg
    } = useOrg();


    const organizations = Array.isArray(orgs) ? orgs : [];


    return (

        <select
            value={activeOrg?._id || ""}
            onChange={(e) => {

                const selected = organizations.find(
                    org => org._id === e.target.value
                );

                if (selected) {
                    setActiveOrg(selected);
                }

            }}
            className="border rounded-lg px-3 py-2 bg-white"
        >

            {
                organizations.map(org => (

                    <option
                        key={org._id}
                        value={org._id}
                    >
                        {org.name}
                    </option>

                ))
            }

        </select>

    );
}