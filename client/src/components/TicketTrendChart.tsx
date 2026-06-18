import { useEffect, useState } from "react";
import api from "../api/axios";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";


type Props = {
    orgId?: string;
};


export default function TicketTrendChart({ orgId }: Props) {

    const [data, setData] = useState<any[]>([]);


    useEffect(() => {

        if (!orgId) return;


        const fetchData = async () => {

            try {

                const res = await api.get(
                    `/tickets/trends?orgId=${orgId}`
                );

                setData(res.data.data || []);

            } catch (error) {

                console.error(
                    "Failed to fetch ticket trends:",
                    error
                );

            }

        };


        fetchData();


    }, [orgId]);



    return (
        <ResponsiveContainer width="100%" height={300}>

            <LineChart data={data}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />


                <Line
                    type="monotone"
                    dataKey="tickets"
                    stroke="#2563eb"
                    strokeWidth={3}
                />

            </LineChart>

        </ResponsiveContainer>
    );
}