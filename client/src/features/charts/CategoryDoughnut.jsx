import { Doughnut } from 'react-chartjs-2';
import { formatMoney } from '../../lib/format.js';
import { colors } from '../../theme/colors.js';
import './chartSetup.js';

export function CategoryDoughnut({ breakdown, total }) {
  const data = {
    labels: breakdown.map((c) => c.name),
    datasets: [
      {
        data: breakdown.map((c) => c.total),
        backgroundColor: breakdown.map((c) => c.color ?? colors.stone),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatMoney(ctx.raw)}` } },
    },
  };

  return (
    <div className="relative size-44 shrink-0 xl:size-32 2xl:size-40">
      <Doughnut data={data} options={options} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
        <span className="text-[10px] font-medium tracking-wider text-muted">TOTAL</span>
        <span className="text-lg font-bold text-ink tabular-nums">
          {formatMoney(total, { decimals: 0 })}
        </span>
      </div>
    </div>
  );
}
