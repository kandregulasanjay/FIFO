import React from 'react';
import ReactApexChart from 'react-apexcharts';

function DonutChart({ data, groupByField, yField, title }) {
  const groupData = {};

  data.forEach(item => {
    const key = item[groupByField];
    if (!groupData[key]) {
      groupData[key] = 0;
    }
    groupData[key] += item[yField];
  });

  const options = {
    chart: {
      type: 'donut',
    },
    labels: Object.keys(groupData),
    title: {
      text: title,
      align: 'center',
    },
  };

  const series = Object.values(groupData);

  return (
    <div>
      <ReactApexChart options={options} series={series} type="donut" height={350} />
    </div>
  );
}

export default DonutChart;
