import React from 'react';
import ReactApexChart from 'react-apexcharts';

function LineChart({ data, xField, yField, title }) {
  const options = {
    chart: {
      type: 'line',
      toolbar: { show: false },
    },
    xaxis: {
      categories: data.map(item => item[xField]),
    },
    title: {
      text: title,
      align: 'center',
    },
  };

  const series = [
    {
      name: yField,
      data: data.map(item => item[yField]),
    },
  ];

  return (
    <div>
      <ReactApexChart options={options} series={series} type="line" height={350} />
    </div>
  );
}

export default LineChart;
