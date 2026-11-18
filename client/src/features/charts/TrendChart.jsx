import { Bar } from 'react-chartjs-2';
import { formatCompact, formatMoney } from '../../lib/format.js';
import { formatMonth } from '../../lib/month.js';
import { chartColors } from '../../theme/colors.js';
import './chartSetup.js';

export function TrendChart({ trend }) {
  const lastIndex = trend.length - 1;
  const data = {
    labels: trend.map((t) => formatMonth(t.month, { short: true })),
    datasets: [
      {
        label: 'Income',
        data: trend.map((t) => t.income),
        backgroundColor: chartColors.income,
      },
      {
        label: 'Expenses',
        data: trend.map((t) => t.expense),
        backgroundColor: trend.map((_, i) =>
          i === lastIndex ? chartColors.expenseCurrent : chartColors.expense,
        ),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    datasets: {
      bar: {
        borderRadius: 4,
        borderSkipped: 'bottom',
        maxBarThickness: 18,
        categoryPercentage: 0.55,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}` } },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: (ctx) => ({ size: 13, weight: ctx.index === lastIndex ? 600 : 400 }),
          color: (ctx) => (ctx.index === lastIndex ? '#242c29' : chartColors.tick),
        },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: chartColors.grid },
        ticks: { maxTicksLimit: 4, font: { size: 11 }, callback: (v) => formatCompact(v) },
      },
    },
  };

  return (
    <div className="h-60" role="img" aria-label="Income and expenses over the last 6 months">
      <Bar data={data} options={options} />
    </div>
  );
}
