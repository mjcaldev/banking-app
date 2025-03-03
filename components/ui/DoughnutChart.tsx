
"use client"

import { Chart as ChartJS, ArcElement, Tooltip, Legend }
from "chart.js";
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ accounts }: DoughnutChartProps) => {
  const accountNames = accounts.map((a) => a.name); // "a" represents each individual account
  const balances = accounts.map((a) => a.currentBalance);

  const data = {
    datasets: [
      {
        label: 'Banks',
        data: balances, //changed this from the static data to our new balances variable
        backgroundColor: ['#0747b6', '#2265d8', '2f91fa']
      }
    ],
    labels: accountNames //changed to accountNames variable to replace the static "Bank 1, 2, 3, etc"
  };


  return <Doughnut 
  data={data}
  options={{
    cutout: '60%',
    plugins: {
      legend:  {
        display: false
      }
    }
  }}
   />
}

export default DoughnutChart