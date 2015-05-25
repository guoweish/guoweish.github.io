var width = 700,
    height = 500,
    i = -1,
    θ = 0,
    δθ = .03,
    n = 2000,
    k = 20; // samples to replace per frame

var randomX = d3.random.normal(width / 2, 80),
    randomY = d3.random.normal(height / 2, 80),
    points = d3.range(n).map(function() { return [randomX(), randomY()]; });

var color = d3.scale.linear()
    .domain([0, 20])
    .range(["white", "#985D34"])
    .interpolate(d3.interpolateLab);

var hexbin = d3.hexbin()
    .size([width - 50, height- 50])
    .radius(20);

var svg = d3.select("body")
    .select("#d3")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", function () {
      return "0,0," + width + "," + height;
    });

var hexagon = svg.append("g")
    .attr("class", "hexagons")
  .selectAll("path")
    .data(hexbin(points))
  .enter().append("path")
    .attr("d", hexbin.hexagon(19.5))
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    .style("fill", function(d) { return color(d.length); });

d3.timer(function() {
  θ += δθ;
  randomX = d3.random.normal(width / 2 + 80 * Math.cos(θ), 80),
  randomY = d3.random.normal(height / 2 + 80 * Math.sin(θ), 80);

  for (var j = 0; j < k; ++j) {
    i = (i + 1) % n;
    points[i][0] = randomX();
    points[i][1] = randomY();
  }

  hexagon = hexagon
      .data(hexbin(points), function(d) { return d.i + "," + d.j; });

  hexagon.exit().remove();

  hexagon.enter().append("path")
      .attr("d", hexbin.hexagon(19.5))
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  hexagon
      .style("fill", function(d) { return color(d.length); });
});