var width = 1000,
    	height = 600,
    	margin = 50;

    var commasFormatter = d3.format(",.0f");

    var xScale = d3.scale.linear()
				.domain([100,12000])
				.rangeRound([margin, width-margin]),
		yScale = d3.scale.log()
				.domain([0.5,200])
				.rangeRound([height-margin, margin]),
		rScale = d3.scale.linear()
				.domain([0,1800000])
				.rangeRound([15, 100]);

	var color = d3.scale.category10();

	var colorScale = d3.scale.linear()
				.domain([20000, 400000, 1000000, 1600000])
				.range(["#2E8ECE", "#40D47E", "#E98B39", "#D14233"]);

	var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickFormat(function(d) { return d + " 万人"; });

    var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(7)
            .tickFormat(function(d) { return d; })
            .tickValues([0.5, 35, 70, 100, 135, 170, 200]);   

    //container for tooltip of each circle
    var div = d3.select("body").append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);

    svg = d3.select("body")
    		.select("#d3")
    		.append("svg")
    		.attr("width", width)
    		.attr("height", height)
    		.attr("viewBox", function (d) {
    			return "0,0," +width + "," + height;
    		});

    svg.append("g")       
        .attr("class", "axis")
        .attr("transform", function(){ 
            return "translate(0, " + (height / 2) + ")";
        })
        .call(xAxis);
    
    svg.append("g")       
        .attr("class", "axis")
        .attr("transform", function(){ 
            return "translate(" + margin + ", 0)";
        })
        .call(yAxis);

    // svg.append("g")
    // 	.append("text")
    // 	.text("2014年全国各省乘用车上牌量比较")
    // 	.attr("x", 15)
    // 	.attr("y", 20);

	d3.json("data/works-bubble.json", function (data) {
		svg.selectAll("text.label")
			.data(data)
			.enter()
			.append("text")
			.attr("class", "label")
			.text(function (d) {
					return d.province;
			})
			.attr("style", "text-anchor:middle")
			.attr("x", function (d) {
					return xScale(d.people);
			})
			.attr("y", function (d) {
					return yScale(d.land);
			});

		svg.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr("class","bubble")
			.style("stroke", function (d) {
					return colorScale(d.car);
			})
			.style("fill", function (d) {
					return colorScale(d.car);
			})
			.attr("cx", function (d) {
					return xScale(d.people);
			})
			.attr("cy", function (d) {
					return yScale(d.land);
			})
			.attr("r", function (d) {
					return rScale(d.car);
			})
			.on("mouseover", function(d) {
					div.transition()
					.duration(200)
					.style("opacity", .5);
					div.html(d.car + "辆" + "<br/>" + d.province)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY - 28) + "px");
			})
			.on("mouseout", function(d) {
					div.transition()
					.duration(500)
					.style("opacity", 0);
			});

	});