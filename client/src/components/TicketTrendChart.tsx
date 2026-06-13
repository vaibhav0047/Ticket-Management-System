import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const data = [
    { month: "Jan", tickets: 30 },
    { month: "Feb", tickets: 45 },
    { month: "Mar", tickets: 35 },
    { month: "Apr", tickets: 60 },
    { month: "May", tickets: 55 },
    { month: "Jun", tickets: 75 },
];

export default function TicketTrendChart() {
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