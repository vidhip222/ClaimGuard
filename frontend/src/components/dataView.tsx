import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "../api";

export default function DataView({ id }: { id: string }) {
  const claim = useQuery({
    queryKey: ["claim", id],
    queryFn: async () => {
      const res = await api.claim[":id"].$get({
        param: { id: id.toString() },
      });
      if (!res.ok) throw new Error("Failed to fetch claim");
      const data = await res.json();
      return data;
    },
    refetchInterval: 2000,
  });

  if (!claim.data || claim.data.images.length === 0) return null;

  const fraudScores = claim.data.images
    .filter((image) => image.fraudScore !== null && image.processed > 0)
    .map((image) => image!.fraudScore! / image.processed);

  const fraudScore = fraudScores.reduce((acc, curr) => acc + curr, 0) / fraudScores.length;

  const cost = claim.data.images.reduce((acc, curr) => acc + (curr?.cost || 0), 0) || 0;

  // Prepare histogram data
  const histogramData = fraudScores.map((score, index) => ({
    name: `Input ${index + 1}`,
    score: score,
  }));

  // Prepare pie chart data
  const pieData = [
    { name: "Fraud Score", value: fraudScore },
    { name: "Remaining", value: 1 - fraudScore },
  ];

  const COLORS = ["#FF8042", "#00C49F"];

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>DataView Component</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Histogram */}
        <div className='bg-white p-4 rounded-lg shadow'>
          <h2 className='text-lg font-semibold mb-4'>Fraud Scores Distribution</h2>
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={histogramData}>
                <XAxis dataKey='name' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='score' fill='#8884d8' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className='bg-white p-4 rounded-lg shadow'>
          <h2 className='text-lg font-semibold mb-4'>Average Fraud Score: {(fraudScore * 100).toFixed(1)}%</h2>
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={pieData}
                  cx='50%'
                  cy='50%'
                  innerRadius={60}
                  outerRadius={80}
                  fill='#8884d8'
                  paddingAngle={5}
                  dataKey='value'>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Display */}
        <div className='bg-white p-4 rounded-lg shadow'>
          <h2 className='text-lg font-semibold mb-2'>Total Cost</h2>
          <p className='text-3xl font-bold text-blue-600'>${cost.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
