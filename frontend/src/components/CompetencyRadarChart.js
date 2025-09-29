import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

function CompetencyRadarChart({ competencies, className = "" }) {
  // Transform competencies data for radar chart
  const chartData = competencies.map(comp => ({
    competency: comp.name.replace(/([A-Z])/g, ' $1').trim(), // Add spaces to camelCase
    score: comp.score,
    maxScore: 5
  }));

  // Custom label formatter to wrap long text
  const formatLabel = (value) => {
    if (value.length > 12) {
      return value.split(' ').slice(0, 2).join(' ');
    }
    return value;
  };

  if (!competencies || competencies.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-[color:var(--text-muted)] ${className}`}>
        <p className="body-sm">No competency data available for chart</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <PolarGrid 
            stroke="var(--border-light)" 
            strokeOpacity={0.6}
          />
          <PolarAngleAxis 
            dataKey="competency" 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            tickFormatter={formatLabel}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 5]} 
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="var(--brand)"
            fill="var(--brand)"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ fill: 'var(--brand)', strokeWidth: 1, r: 4 }}
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CompetencyRadarChart;