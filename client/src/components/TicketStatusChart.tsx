import { PieChart, Pie, Cell, Tooltip } from "recharts";

const data = [
    { name: "Resolved", value: 142 },
    { name: "Open", value: 51 },
    { name: "In Progress", value: 63 },
];

const COLORS = ["#22c55e", "#ef4444", "#f59e0b"];

export default function TicketStatusChart() {
    return (
        <PieChart width={300} height={300}>
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
                        fill={COLORS[index]}
                    />
                ))}
            </Pie>

            <Tooltip />
        </PieChart>
    );
}