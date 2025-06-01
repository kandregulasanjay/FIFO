import React from 'react';
import ReactApexChart from 'react-apexcharts';

function StackedBarChart({ data, xField, seriesFields, title }) {
  const options = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
    },
    xaxis: {
      categories: data.map(item => item[xField]),
    },
    title: {
      text: title,
      align: 'center',
    },
    plotOptions: {
      bar: {
        horizontal: false,
      },
    },
    legend: {
      position: 'top',
    },
  };

  const series = seriesFields.map(field => ({
    name: field,
    data: data.map(item => item[field] || 0),
  }));

  return (
    <div>
      <ReactApexChart options={options} series={series} type="bar" height={350} />
    </div>
  );
}

export default StackedBarChart;
