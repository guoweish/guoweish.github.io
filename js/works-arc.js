var width = 800,
    height = 600,
    margin = 50,
    pad = margin / 2,
    radius = 10, //r for nodes
    yFixed = pad + radius;

var svg = d3.select("body")
        .select("#d3")
        .append("svg")
        .attr("id", "arc")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", function () {
            return "0,0," + width + "," + height;
        });

var plot = svg.append("g")
        .attr("id", "plot")
        .attr("transform", "translate(" + pad + "," + pad + ")");

d3.json("data/works-arc.json", function (graph) {
    
    //set x position of each nodes
    var xScale = d3.scale.linear()
            .domain([0, graph.nodes.length - 1])
            .range([radius, width - margin - radius]);

    //set color for each nodes
    var color = d3.scale.category20();

    var arrayFlights = [];
    for (var i = 0, l = graph.links.length; i < l; i++) {
        arrayFlights[i] = graph.links[i].flights;
    };
    //console.log(d3.extent(arrayFlights));
    var arcWidthScale = d3.scale.linear()
            .domain(d3.extent(arrayFlights))
            .range([2, 25]);

    var arcColorScale = d3.scale.linear()
            .domain(d3.extent(arrayFlights))
            .range(["#1F54AD", "#20AD1F"]);

    var nodeValue = [];
    for (var i = 0, nodesLength = graph.nodes.length; i < nodesLength; i++) {
        nodeValue[i] = 0;
        for (var j = 0, linksLength = graph.links.length; j < linksLength; j++) {
            if (graph.links[j].source == i) {
               nodeValue[i] +=  graph.links[j].flights;
            };

            if (graph.links[j].target == i) {
               nodeValue[i] +=  graph.links[j].flights;
            };
        };
    };
    //console.log(nodeValue);
    var rectWidthScale = d3.scale.linear()
            .domain(d3.extent(nodeValue))
            .range([30, 100]);

    // //console.log(graph.links.length);
    // var arrayFlights = [];
    // // var l = graph.links.length;
    // for (var i = 0, l = graph.links.length; i < l; i++) {
    //     arrayFlights[i] = graph.links[i].flights;
    // };
    // console.log(d3.extent(arrayFlights));

    //radians for arc between nodes
    var radians = d3.scale.linear()
            .range([Math.PI / 2, 3 * Math.PI / 2]);

    //arc 
    var arc = d3.svg.line.radial()
            .interpolate("basis")
            .tension(0)
            .angle(function (d) {return radians(d)});

    graph.links.forEach(function (d, i) {
        d.source = isNaN(d.source) ? d.source : graph.nodes[d.source];
        d.target = isNaN(d.target) ? d.target : graph.nodes[d.target];
    });

    //set x, y for each nodes
    graph.nodes.forEach(function (d, i) {
        d.x = xScale(i);
        d.y = yFixed;
    });

    //sort nodes by groups
    graph.nodes.sort(function (a, b) {
       return a.group - b.group;
    });

    d3.select("#plot")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("id", function (d) {
            return d.remark;
        })
        .attr("class", "link")
        .attr("transform", function (d, i) {
            var xShift = d.source.x + (d.target.x - d.source.x) / 2;
            var yShift = yFixed;
            return "translate(" + xShift + "," + yShift + ")";
        })
        .attr("d", function (d, i) {
           var xDist = Math.abs(d.source.x - d.target.x);
           //set radius for arc, as line radial path, api: # line.radius([radius])
           arc.radius(xDist / 2);

           //Math.ceil is opposite to Math.floor
           var points = d3.range(0, Math.ceil(xDist / 3));
           radians.domain([0, points.length - 1]);

           //not so clear
           return arc(points);
        })
        .attr("stroke-width", function (d) {
            return arcWidthScale(d.flights) + "px";
        })
        .attr("stroke", function (d) {
            return arcColorScale(d.flights);
        })
        .on("mouseover", function (d) {
            arcTooltip(d);
            d3.select(this).attr("stroke", function (d) {
                return "#333";
            });
        })
        .on("mouseout", function (d) {
            d3.select("#arcTooltip").remove();
            d3.select(this).attr("stroke", function (d) {
                return arcColorScale(d.flights);
            });
        });

    

    d3.select("#plot")
        .selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("id", function (d, i) {
            return d.name;
        })
        .attr("cx", function (d, i) {
            return d.x;
        })
        .attr("cy", function (d, i) {
            return d.y;
        })
        .attr("r", function (d, i) {
            return radius;
        })
        .on("mouseover", function (d) {
            arcFocus(d);
            //addTooltip(d3.select(this));
            d3.select(this)
                .classed("node",false)
                .classed("nodeFocus",true)
                .attr("r", function (d) {
                    return radius * 1.3;
                });
        })
        .on("mouseout", function (d) {
            arcFocusRemove();
            //d3.select("#tooltip").remove();
            d3.select(this)
                .classed("node",true)
                .classed("nodeFocus",false)
                .attr("r", function (d) {
                    return radius;
                });
        });

    d3.select("#plot")
        .selectAll(".label")
        .data(graph.nodes)
        .enter()
        .append("text")
        .attr("class", "label")
        .text(function (d) {
            return d.name
        })
        .attr("text-anchor", "middle")
        .attr("x", function (d) {
            return d.x;
        })
        .attr("y", function (d) {
            return d.y - 30;
        });

        //append city name for each node
    // d3.select("#plot")
    //     .selectAll(".node")
    //     .data(graph.nodes)
    //     .enter()
    //     .append("circle")



});

function addTooltip(circle) {
    
    var x = parseFloat(circle.attr("cx"));
    var y = parseFloat(circle.attr("cy"));
    var r = parseFloat(circle.attr("r"));
    var text = circle.attr("id");

    var tooltip = d3.select("#plot")
        .append("text")
        .text(text)
        .attr("x", x)
        .attr("y", y)
        .attr("dy", -r * 2)
        .attr("id", "tooltip");

    var offset = tooltip.node().getBBox().width / 2;

    if ((x - offset) < 0) {
        tooltip.attr("text-anchor", "start");
        tooltip.attr("dx", -r);
    }
    else if ((x + offset) > (width - margin)) {
        tooltip.attr("text-anchor", "end");
        tooltip.attr("dx", r);
    }
    else {
        tooltip.attr("text-anchor", "middle");
        tooltip.attr("dx", 0);
    }
}

function arcTooltip(d) {
    var xShift = d.source.x + (d.target.x - d.source.x) / 2;
    var yShift = Math.abs(d.source.x - d.target.x) / 2;

    var arcTooltip = d3.select("#plot")
        .append("text")
        .text(" Total Flights in " + d.remark + " : " + d.flights)
        .attr("x", xShift)
        .attr("y", yShift)
        .attr("dy", 50)
        .attr("text-anchor", "middle")
        .attr("id", "arcTooltip");
}

function arcFocus(d) {
   d3.selectAll(".link")
        .classed("linkGray", true)
        .forEach(function (e, i) {
            //console.log(e[0].id);
            for (var i = 0, linksFlag = e.length; i < linksFlag; i++) {
                if (e[i].id.indexOf(d.name) > -1) {
                    //console.log(e[i].id);
                    d3.select("#" + e[i].id)
                        .classed("linkGray", false)
                        .classed("linkFocus", true);
                    //e[i].classed("linkFocus", true);
                    //console.log(e[i]);
                }
            };
        });
}

function arcFocusRemove() {
    d3.selectAll(".link")
        .classed("linkFocus", false)
        .classed("linkGray", false);
}