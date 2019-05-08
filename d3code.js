var data;
var scaleBand;
var clusters;
var circleSize;
var circlePadding;
var xScale;
var yScale;
var hoverLabel;
var svg;
var midHeight;

function getData(category) {
  d3.csv(
    "https://gist.githubusercontent.com/garrettvercoe/ad4b340b0d53f0383b4dc16d739a3810/raw/8ce735d1f00f888bc01d4302d423c8e42927dbbd/" +
      category +
      ".csv",
    d => {
      return {
        Score: +d.Score,
        Word: d.Word
      };
    }
  ).then(function(d) {
    data = d;
    draw();
  });
}

function color() {
  return d3
    .scaleCluster()
    .domain(data.map(d => d.Score))
    .range([
      "#2166ac",
      "#4393c3",
      "#92c5de",
      "#b6d9ec",
      "#ffbba9",
      "#f49582",
      "#d6604d",
      "#b2182b"
    ]);
}

// from https://beta.observablehq.com/@mbostock/d3-beeswarm-ii
function dodge(data, radius, padding, scale) {
  const circles = data
    .map(d => ({ x: scale(d.Score), data: d }))
    .sort((a, b) => a.x - b.x);
  const epsilon = 0.001;
  let head = null,
    tail = null;

  // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
  function intersects(x, y) {
    let a = head;
    while (a) {
      if (
        (radius * 2 + padding - epsilon) ** 2 >
        (a.x - x) ** 2 + (a.y - y) ** 2
      ) {
        return true;
      }
      a = a.next;
    }
    return false;
  }

  // Place each circle sequentially.
  for (const b of circles) {
    // Remove circles from the queue that can’t intersect the new circle b.
    while (head && head.x < b.x - (radius * 2 + padding)) head = head.next;

    // Choose the minimum non-intersecting tangent.
    if (intersects(b.x, (b.y = 0))) {
      let a = head;
      b.y = Infinity;
      do {
        let y1 =
          a.y + Math.sqrt((radius * 2 + padding) ** 2 - (a.x - b.x) ** 2);
        let y2 =
          a.y - Math.sqrt((radius * 2 + padding) ** 2 - (a.x - b.x) ** 2);
        if (Math.abs(y1) < Math.abs(b.y) && !intersects(b.x, y1)) b.y = y1;
        if (Math.abs(y2) < Math.abs(b.y) && !intersects(b.x, y2)) b.y = y2;
        a = a.next;
      } while (a);
    }

    // Add b to the queue.
    b.next = null;
    if (head === null) head = tail = b;
    else tail = tail.next = b;
  }

  return circles;
}

function stats(focus) {
  return {
    median: d3.median(focus, function(d) {
      return d.Score;
    }),
    mean: d3.mean(focus, function(d) {
      return d.Score;
    }),
    max: +d3.max(focus, function(d) {
      return d.Score;
    }),
    min: +d3.min(focus, function(d) {
      return d.Score;
    })
  };
}

function draw() {
  (svg = d3.select("#vis")),
    (margin = { top: 0, right: 20, bottom: 0, left: 160 }),
    (width = 1080),
    (height = 800);
  midHeight = 0;
  scaleBand = color();
  clusters = scaleBand.clusters();
  xScale = d3
    .scaleLinear()
    .domain(
      d3.extent(data, function(d) {
        return d.Score;
      })
    )
    .range([margin.left, width - margin.right]);

  yScale = d3
    .scaleOrdinal()
    .domain([1])
    .range([100, height / 2, height - 100]);

  circleSize = 5;
  circlePadding = 1.5;

  svg
    .append("g")
    .attr("transform", `translate(0, 200)`)
    .append("line")
    .attr("x1", xScale(clusters[3]))
    .attr("y1", -180)
    .attr("x2", xScale(clusters[3]))
    .attr("y2", 180)
    .style("stroke", "#838dba")
    .style("stroke-width", "3px");

  svg
    .append("g")
    .attr("transform", `translate(0, 200)`)
    .append("line")
    .attr("x1", xScale(stats(data).min))
    .attr("y1", midHeight)
    .attr("x2", xScale(stats(data).max))
    .attr("y2", midHeight)
    .style("stroke", "#e3e1e1")
    .style("stroke-width", "3px");

  svg
    .append("text")
    .text(`Masculine`)
    .attr("class", "masc")
    .attr("text-anchor", "start")
    .attr("x", 50)
    .attr("y", 200 + 4);

  svg
    .append("text")
    .text(`Feminine`)
    .attr("class", "masc")

    .attr("text-anchor", "end")
    .attr("x", width + 70)
    .attr("y", 200 + 4);

  svg
    .append("g")
    .attr("transform", `translate(0, 200)`)
    .selectAll(".circles")
    .data(dodge(data, circleSize, circlePadding, xScale))
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      return d.x;
    })
    .attr("cy", function(d) {
      return d.y;
    })
    .attr("r", circleSize)
    .style("fill", d => scaleBand(d.data.Score))
    .on("mouseenter", function(d) {
      d3.select(this).style("fill", d =>
        d3.rgb(scaleBand(d.data.Score)).darker(1)
      );
      d3.selectAll(".hoverBox")
        .attr("x", d.x - (d.data.Word.length * 9) / 2 - 10)
        .attr("y", d.y + 135)
        .attr("width", d.data.Word.length * 9 + 20)
        .attr("stroke", "#f2f1f1");

      d3.selectAll(".hoverLabel")
        .text(d.data.Word)
        .attr("x", d.x)
        .attr("y", d.y + 160);
    })
    .on("mouseleave", function(d) {
      //d3.selectAll(".hoverLabel").text("");

      d3.select(this).style("fill", d3.rgb(scaleBand(d.data.Score)));
    });

  svg
    .append("rect")
    .attr("class", "hoverBox")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 100)
    .attr("height", 40)
    .attr("rx", "2px");

  svg
    .append("svg:text")
    .attr("class", "hoverLabel")
    .attr("x", 0)
    .attr("y", 0)
    .text("")
    .style("text-transform", "capitalize");

  svg
    .append("svg:text")
    .attr("class", "hoverLabel")
    .attr("x", 0)
    .attr("y", 0)
    .text("")
    .style("text-transform", "capitalize");

  return svg.node();
}
