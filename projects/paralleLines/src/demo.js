******************************************
******************************************
### viewer:

### vier-model:

###model:
data: {
    chartConfig: {
        svgWidth: 800,
        svgHeight: 600,
        margin: {
            top: 30,
            bottom:30,
            left: 30,
            right: 30
        },
        color: d3.scale.category10()
    },
    checkedParas: []
}
methods: {
    //turn the csv table into parallel data
    iniParallesData: iniParallesData();
    //draw graph on load with default setting
    iniGraph: iniGraph();
    //update graph with new setting by user, get changes from viewer
    updateGraph: updateGraph();
    chart: {
        setWidth: setWidth();
        setHeight: setHeight();
    }
}
******************************************
******************************************

var margin = {top: 30, right: 40, bottom: 20, left: 100},
    width = 1000 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var mouseTooltip = d3.select("body")
        .append("div")
        .attr("class", "mouseTooltip")
        .style("opacity", 0);

var color = d3.scale.category10();

var dimensions = [
    {
        name: "区域",
        scale: d3.scale.ordinal().rangePoints([0, height]),
        type: String
    },
    {
        name: "年份",
        scale: d3.scale.linear().range([height, 0]),
        type: Number
    },
    {
        name: "单位GDP用水总量_立方米每万元",
        scale: d3.scale.linear().range([height, 0]),
        type: Number
    },
    {
        name: "单位GDP能源消耗总量_公斤每万元",
        scale: d3.scale.linear().range([height, 0]),
        type: Number
    },
    {
        name: "单位产值建设用地消耗_亩每亿元",
        scale: d3.scale.linear().range([height, 0]),
        type: Number
    },
    {
        name: "单位GDP固定资产投资_元每万元",
        scale: d3.scale.linear().range([height, 0]),
        type: Number
    }
];

var x = d3.scale.ordinal()
    .domain(dimensions.map(function(d) { return d.name; }))
    .rangePoints([0, width]);

var line = d3.svg.line()
    .defined(function(d) { return !isNaN(d[1]); });

var yAxis = d3.svg.axis()
    .orient("left");

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var dimension = svg.selectAll(".dimension")
    .data(dimensions)
    .enter()
    .append("g")
    .attr("class", "dimension")
    .attr("transform", function(d) {
        return "translate(" + x(d.name) + ")";
    });

d3.csv("data/sample.csv", function(data) {
    data = iniParallesData(data);
    // console.log(data);
    dimensions.forEach(function(dimension) {
        dimension.scale.domain(dimension.type === Number
            ? d3.extent(data, function(d) { return +d[dimension.name]; })
            : data.map(function(d) { return d[dimension.name]; }).sort());
    });

    svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", draw);

    svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr({
            fill: "none",
        	stroke:function(d,i){ return color(d.区域); },
            "stroke-width": "1.5px"
        })
        .attr("d", draw);

    dimension.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(yAxis.scale(d.scale)); })
        .append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d.name; });

    svg.select(".axis").selectAll("text:not(.title)")
        .attr("class", "label")
        .data(data, function(d) { return d.name || d; });

    var projection = svg.selectAll(".axis text,.background path,.foreground path")
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    function iniParallesData(data) {
        // console.log(data);
        var dataProcessed = [];
        data.forEach(function(d) {
            d.年份 = +d.年份;
            d.指标值 = +d.指标值;
            d[d.指标名称] = d.指标值;
            var obj = {};
            obj['区域'] = d.区域;
            obj['年份'] = d.年份;
            obj[d.指标名称] = d.指标值;
            dataProcessed.push(obj);
        });
        // console.log(dataProcessed);

        var dataNested = d3.nest()
            .key(function(d) {
                return d.区域;
            })
            .key(function(d) {
                return d.年份;
            })
            .entries(dataProcessed);
            // console.log(dataNested);

        var dataParallel = [];
        var keyYear = '年份';
        var keyPlace = '区域';

        dataNested.forEach(function(d) {
            var place = d.key;
            d.values.forEach(function(e) {
                // console.log(e);
                var year = +e.key;
                var obj = {};
                obj[keyYear] = year;
                obj[keyPlace] = place;
                e.values.forEach(function(f) {
                    for(key in f) {
                        if (key != keyPlace && key != keyYear) {
                            // console.log(key + ': ' + f[key]);
                            obj[key] = f[key];
                        }
                    }
                });
                dataParallel.push(obj);
            });
        });

        return dataParallel;
    }

    function mouseover(d) {
        svg.classed("active", true);
        projection.classed("inactive", function(p) { return p !== d; });
        projection.filter(function(p) { return p === d; }).each(moveToFront);
        // console.log(d);
        // *** show bubble content of single line
        // showMouseTooltip(d);
    }

    function mouseout(d) {
        svg.classed("active", false);
        projection.classed("inactive", false);
        hideMouseTooltip();
    }

    function moveToFront() {
        this.parentNode.appendChild(this);
    }


});

function draw(d) {
    return line(dimensions.map(function(dimension) {
        return [x(dimension.name), dimension.scale(d[dimension.name])];
    }));
}

//出现提示框
function showMouseTooltip(d) {
	mouseTooltip.style("opacity", 1)
		.style('z-index', 10);

	mouseTooltip.html(generateMouseTooltipContent(d))
        .style("left", function() {
        	var screenWidth = screen.width;
        	if (d3.event.pageX < screenWidth/2) {
        		return d3.event.pageX + "px";
        	} else{
        		return (d3.event.pageX - 160) + "px";
        	}
        	return d3.event.pageX + "px";
        })
        .style("top", (d3.event.pageY) + "px");
}

// 隐藏提示框
function hideMouseTooltip() {
	mouseTooltip.style("opacity", 0);
}

//生成提示框内容
function generateMouseTooltipContent (d) {
    var tooltipContent = [];
    var keyArray = [];
    var htmlContent = '';
    for (key in d) {
        // console.log(key + ': ' + d[key]);
        tooltipContent.push(d[key]);
        keyArray.push(key);
        htmlContent += "<div>" + key + ": " + d[key] + "</div>";
    }
    console.log(htmlContent);
    return htmlContent;
}
