Chart.register({
    id: 'selectSample',
    afterDraw: function (chart) {
        const highlightedSample = chart.options.plugins.selectSample.highlightedSample;
        if (!highlightedSample) {
            return;
        }

        const datasets = chart.data.datasets;
        for (let i = 0; i < datasets.length; i++) {
            const data = datasets[i].data;
            for (let j = 0; j < data.length; j++) {
                if (data[j].label === highlightedSample) {
                    const meta = chart.getDatasetMeta(i);
                    const point = meta.data[j];

                    if (point) {
                        const { x, y, options } = point.getProps(['x', 'y', 'options']);
                        const { ctx } = chart;
                        ctx.save();
                        ctx.beginPath();
                        ctx.strokeStyle = 'red';
                        ctx.lineWidth = 2;
                        ctx.arc(x, y, options.radius + 3, 0, 2 * Math.PI);
                        ctx.stroke();
                        ctx.restore();
                    }
                    return; // Stop searching once the highlighted sample is found.
                }
            }
        }
    }
});