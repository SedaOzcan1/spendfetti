import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);

ChartJS.defaults.font.family = "'Inter Variable', ui-sans-serif, system-ui, sans-serif";
ChartJS.defaults.color = '#757b74';
