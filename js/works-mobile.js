//==ini============================================
var margin = {top: 50, right: 140, bottom: 50, left: 80},
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var formatValue = d3.format(",.2f"); //keep 2 diti
var timeParse = d3.time.format("%Y").parse;
var timeFormat = d3.time.format("%Y");


var svg = d3.select("body")
		.select("#d3")
	    .append("svg")
	        .attr("width", width + margin.left + margin.right)
	        .attr("height", height + margin.top + margin.bottom)
	        .attr("class", "graph-svg-component")
	    .append("g")
	        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	        .attr("viewBox", function () {
	            return -margin.left + "," + -margin.top + "," + (width + margin.right) + "," + (height + margin.bottom);
	        });

//====loading logo=========================================
svg.append("text")
	.attr("id", "loading")
	.attr("x", width / 2)
	.attr("y", height / 2)
	.text("Loading......");

//====scale=========================================
var xScale = d3.time.scale().range([0, width]),
	yScale = d3.scale.linear().range([height, 0]);

//====draw module=========================================
var voronoi = d3.geom.voronoi()
	    .x(function(d) { return xScale(d.year); })
	    .y(function(d) { return yScale(d.value); })
	    .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);

var  line = d3.svg.line()
		// .interpolate("cardinal")
		.x(function(d) { return xScale(d.year); })
	    .y(function(d) { return yScale(d.value); });

//==== load data======================================
d3.csv("data/works-mobile.csv", function (error, data) {
	data.forEach(function (d) {
		d.year = timeParse(d.year);
		d.value = +d.value;
	});

	var dataProcessed = _.reject(data, 'value', 0);
	// console.log(dataProcessed);

	var yearExtent = d3.extent(dataProcessed, function (d) {
		return d.year;
	});

	var valueExtent = d3.extent(dataProcessed, function (d) {
		return d.value;
	});

	xScale.domain(yearExtent);
	// yScale.domain(allExtent);
	yScale.domain(valueExtent);
	// console.log(valueExtent);

	//==== render axes=========================
	renderLeftYAxis (yScale);
	renderBottomXAxis (xScale);

	//===========add title===============
	// svg.append("g")
	// 	.attr("class","titleGroup");

	// d3.select(".titleGroup")
	// 	.append("rect")
	// 	.attr("class", "titleBackground")
	// 	.attr("width", 600)
	// 	.attr("height", 200)
	// 	.attr("x", -50)
	// 	.attr("y", 0);

	// appendText(".titleGroup", "titleText", -30, 20, "Mobile telephone subscriptions");
	// appendText(".titleGroup", "titleText", -30, 60, "per 100 inhabitants");
	// appendText(".titleGroup", "titleAnthor", -30, 90, "By 郭不耐  MAY.10,2015");
	// appendText(".titleGroup", "titleTextDetail", -30, 130, "People in Macao has 3 mobile phones in average,");
	// appendText(".titleGroup", "titleTextDetail", -30, 155, "while 20 people own 1 phone in Eritrea.");
	
	//==add the hide axis--y ticks , besides the title=============
	d3.select(".titleGroup")
		.append("text")
		.attr("class", "axisHideText")
		.attr("x", 520)
		.attr("y", 175)
		.text("200%");

	d3.select(".titleGroup")
		.append("text")
		.attr("class", "axisHideText")
		.attr("x", 520)
		.attr("y", 90)
		.text("250%");

	d3.select(".titleGroup")
		.append("text")
		.attr("class", "axisHideText")
		.attr("x", 520)
		.attr("y", 10)
		.text("300%");

	//====legend=========================================


	//====tooltips=========================================
	var focus = svg.append("g")
			.attr("class", "focus")
			.attr("transform", "translate(-100,-100)");

	focus.append("circle")
		.attr("r", 4.5);

	focus.append("text")
		.attr("x", 9)
		.attr("dy", ".35em");

	//==== render voronoi======================
	var voronoiGroup = svg.append("g")
			.attr("class", "voronoi");

	voronoiGroup.selectAll("path")
		.data(voronoi(dataProcessed))
		.enter().append("path")
		.attr("d", function(d) { return "M" + d.join("L") + "Z"; })
		.datum(function(d) {  return d.point; })
		.on("mouseover", mouseover)
		.on("mouseout", mouseout);

	d3.select("#hide-voronoi")
		.property("disabled", false)
		.on("change", function() { 
			voronoiGroup.classed("voronoi--hide", this.checked);
			voronoiGroup.classed("voronoi", !this.checked);  
		});

	//==== render line ========================
	var dataNest = d3.nest()
			.key(function(d) { return d.country; })
			.entries(dataProcessed);

	// console.log(dataNest);
	svg.append("g")
	      // .attr("class", "line")
	    .selectAll("path")
	      .data(dataNest)
	    .enter().append("path")
	    	.attr("class", function (d) {
	    		return "line" + " " + d.key;
	    	})
	      .attr("d", function (d) {
	      		return line(d.values);
	      });

	//highlight some outstanding nodes
	d3.select(".Macao")
		.classed("highlight", true);

	d3.select(".HongKong")
		.classed("lowlight", true);

	d3.select(".Latvia")
		.classed("lowlight", true);

	d3.select(".Gabon")
		.classed("lowlight", true);

	d3.select(".Cayman-Islands")
		.classed("lowlight", true);


	//============================================
	//to remove the loading state words
	d3.select("#loading").remove();

	//************************************
	function mouseover(d) {
		d3.select("."+d.country)
			.classed("line-hover", true);

		focus.attr("transform", "translate(" + xScale(d.year) + "," + yScale(d.value) + ")");
		focus.select("text")
			.attr("text-anchor", function () {
				return (xScale(d.year) > (width - 150)) ? "end" : "start";
			})
			.attr("x", function () {
				return (xScale(d.year) > (width - 150)) ? "-10" : "10";
				// return "end";
			})
			.text(d.country + ": " + formatValue(d.value) + "% , Year:" + timeFormat(d.year));
			
	}

	function mouseout(d) {
		d3.select("."+d.country).classed("line-hover", false);
		focus.attr("transform", "translate(-100,-100)");
	}


});

//===apped text to svg ==========================
function appendText(textHolder, setClass, xPosition, yPosition, textContent) {
	d3.select(textHolder)
		.append("text")
		.attr("class", setClass)
		.attr("x", xPosition)
		.attr("y", yPosition)
		.text(textContent);
}

//== function axes =============================
function renderLeftYAxis (scale) {
	yAxis = d3.svg.axis()
	    .scale(scale)
	    .orient("left")
	    .ticks(5)
	    .tickFormat(function (v) {
        	return v + " %"; 
        });
    
    svg.append("g")       
        .attr("class", "axis--y")
        // .attr("transform", function(){ 
        //     return "translate(" + margin.left + ", 0)";
        // })
        .call(yAxis);

    //add dash horizonal grid line
    d3.selectAll("g.axis--y g.tick")
		.append("line")
		.classed("grid-line", true)
		.style("stroke-dasharray", ("2,2"))
		.attr("x1",0)
		.attr("y1",0)
		.attr("x2",width)
		.attr("y2",0);
	
}

function renderBottomXAxis (scale) {
	xAxis = d3.svg.axis()
	    .scale(scale)
	    .orient("bottom")
	    // .tickSize([0, 0])
	    // .ticks(3)//设置标签数
		// .tickFormat(function (v) {
  //       	return timeFormat(v); 
  //       });
    
    svg.append("g")       
        .attr("class", "axis")
        .attr("transform", function(){ 
            return "translate(0," + height + ")";
        })
        .call(xAxis);
}