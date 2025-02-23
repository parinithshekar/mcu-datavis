// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/stacked-horizontal-bar-chart
function StackedBarChart(
  data,
  {
    x = (d) => d, // given d in data, returns the (quantitative) x-value
    y = (d, i) => i, // given d in data, returns the (ordinal) y-value
    z = () => 1, // given d in data, returns the (categorical) z-value
    l = (d, i) => i,
    title, // given d in data, returns the title text
    marginTop = 60, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 100, // left margin, in pixels
    width = 640, // outer width, in pixels
    height, // outer height, in pixels
    xType = d3.scaleLinear, // type of x-scale
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    yDomain, // array of y-values
    yRange, // [bottom, top]
    yPadding = 0.2, // amount of y-range to reserve to separate bars
    zDomain, // array of z-values
    offset = d3.stackOffsetDiverging, // stack offset method
    order = d3.stackOrderNone, // stack order method
    xFormat = '1s', // a format specifier string for the x-axis
    xLabel, // a label for the x-axis
    colors = d3.schemeTableau10, // array of colors
    colorMapping, // custom colors for each stack
  } = {}
) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const Z = d3.map(data, z);
  const L = d3.map(data, l);

  // Compute default y- and z-domains, and unique them.
  if (yDomain === undefined) yDomain = Y;
  if (zDomain === undefined) zDomain = Z;
  yDomain = new d3.InternSet(yDomain);
  zDomain = new d3.InternSet(zDomain);

  // Omit any data not present in the y- and z-domains.
  const I = d3.range(X.length).filter((i) => yDomain.has(Y[i]) && zDomain.has(Z[i]));

  // If the height is not specified, derive it from the y-domain.
  if (height === undefined) height = yDomain.size * 60 + marginTop + marginBottom;
  else height = Math.min(height, yDomain.size * 60 + marginTop + marginBottom);
  if (yRange === undefined) yRange = [height - marginBottom, marginTop];

  // Compute a nested array of series where each series is [[x1, x2], [x1, x2],
  // [x1, x2], …] representing the x-extent of each stacked rect. In addition,
  // each tuple has an i (index) property so that we can refer back to the
  // original data point (data[i]). This code assumes that there is only one
  // data point for a given unique y- and z-value.
  const series = d3
    .stack()
    .keys(zDomain)
    .value(([, I], z) => X[I.get(z)])
    .order(order)
    .offset(offset)(
      d3.rollup(
        I,
        ([i]) => i,
        (i) => Y[i],
        (i) => Z[i]
      )
    )
    .map((s) => s.map((d) => Object.assign(d, { i: d.data[1].get(s.key) })));

  // Compute the default y-domain. Note: diverging stacks can be negative.
  if (xDomain === undefined) xDomain = d3.extent(series.flat(2));

  // Construct scales, axes, and formats.
  const xScale = xType(xDomain, xRange);
  const yScale = d3.scaleBand(yDomain, yRange).paddingInner(yPadding);
  const color = d3.scaleOrdinal(zDomain, colors);
  const xAxis = d3.axisTop(xScale).ticks(width / 80, xFormat);
  const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

  // Compute titles.
  if (title === undefined) {
    const formatValue = xScale.tickFormat(100, xFormat);
    title = (i) => `${L[i]}\n${Z[i]}\n${formatValue(X[i])}`;
  } else {
    const O = d3.map(data, (d) => d);
    const T = title;
    title = (i) => T(O[i], i, data);
  }

  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;');

  svg
    .append('g')
    .attr('transform', `translate(0,${marginTop})`)
    .call(xAxis)
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .selectAll('.tick line')
        .clone()
        .attr('y2', height - marginTop - marginBottom)
        .attr('stroke-opacity', 0.1)
    )
    .call((g) =>
      g
        .append('text')
        .attr('x', width - marginRight)
        .attr('y', -40)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'end')
        .text(xLabel)
    );

  // Custom tooltip to show extra information
  const barTooltip = d3
    .select('#root')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'custom-tooltip')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '5px')
    .style('white-space', 'pre-line');

  const bar = svg
    .append('g')
    .selectAll('g')
    .data(series)
    .join('g')
    // .attr('fill', ([{ i }]) => color(Z[i]))
    // Custom colors for movies
    .attr('fill', (k) => {
      let movie = null;
      for ({ data, i } of k) {
        if (i > -1) {
          // Extract which movie the current rect is for
          movie = [...data[1]]
            .filter((moviePlace) => moviePlace[1] == i)
            .map((moviePlace) => moviePlace[0])[0];
        }
      }
      if (movie) {
        return colorMapping[movie];
      }
    })
    .selectAll('rect')
    .data((d) => d)
    .join('rect')
    .attr('belongs', `${xLabel.split(' ')[0]}`)
    .attr('movie', ({ data, i }) => {
      // console.log(data);
      if (i > -1) {
        // Extract which movie the current rect is for
        const movie = [...data[1]]
          .filter((moviePlace) => moviePlace[1] == i)
          .map((moviePlace) => moviePlace[0])[0];
        return movie;
      }
      return 'unknownMovie';
    })
    .attr('x', ([x1, x2]) => Math.min(xScale(x1), xScale(x2)))
    .attr('y', ({ i }) => yScale(Y[i]))
    .attr('width', ([x1, x2]) => Math.abs(xScale(x1) - xScale(x2)))
    .attr('height', yScale.bandwidth())
    .on('mouseover', function (d) {
      // Enable tooltip
      barTooltip.style('opacity', 1);
      // Fill all rects in this chart as gray
      d3.selectAll(`[belongs="${xLabel.split(' ')[0]}"]`).attr('fill', 'gray');
      // Get the movie for the hovered rect
      let movie = d3.select(this).attr('movie');
      // Select all rects in this graph for this movie
      // Remove the custom fill of gray we initially set
      d3.selectAll(`[belongs="${xLabel.split(' ')[0]}"][movie="${movie}"]`).attr('fill', null);
    })
    .on('mousemove', function (d) {
      // Get tooltip text
      // Move tooltip according to mouse
      barTooltip
        .html(d3.select(this).select('tooltipText').text())
        .style('left', d.pageX + 10 + 'px')
        .style('top', d.pageY - 60 + 'px');
    })
    .on('mouseout', function (d) {
      // Disable tooltip
      barTooltip.html('').style('left', 0).style('top', 0).style('opacity', 0);
      // Remove the custom fill of gray we initially set
      d3.selectAll(`[belongs="${xLabel.split(' ')[0]}"]`).attr('fill', 'null');
    });

  if (title)
    bar
      .append('tooltipText')
      .attr('visibility', 'hidden')
      .text(({ i }) => title(i));

  svg
    .append('g')
    .attr('transform', `translate(${xScale(0)},0)`)
    .call(yAxis);

  return Object.assign(svg.node(), { scales: { color } });
}
