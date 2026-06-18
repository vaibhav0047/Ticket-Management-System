import { useEffect, useState } from "react";
import api from "../api/axios";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";


type Props = {
    orgId?: string;
};


const COLORS = [
    "#22c55e",
    "#ef4444",
    "#f59e0b",
];


export default function TicketStatusChart({ orgId }: Props) {

    const [data, setData] = useState<any[]>([]);


    useEffect(() => {

        if (!orgId) return;


        const fetchStatus = async () => {

            try {

                const res = await api.get(
                    `/tickets/status?orgId=${orgId}`
                );

                setData(res.data.data || []);


            } catch (error) {

                console.error(
                    "Failed to fetch ticket status:",
                    error
                );

            }

        };


        fetchStatus();


    }, [orgId]);



    return (

        <ResponsiveContainer width="100%" height={300}>

            <PieChart>

                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label
                >

                    {data.map((_, index) => (

                        <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                        />

                    ))}

                </Pie>


                <Tooltip />

            </PieChart>

        </ResponsiveContainer>

    );
}