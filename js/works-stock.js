var width = 950,
			height = 800;				

		// set how many column display
		var column = 80;

		//width and height of each brick
		var widthBrick = 9,
			heightBrick = 19;

		//row of bricks, to set the y position
		var row, // math round of number of brick / column
			xCol; //number of brick % column

		//icon on tooltip
		var iconType; 

		var customTimeFormat = d3.time.format.multi([
			  ["%B", function(d) { return d.getMonth(); }],
			  ["%Y", function() { return true; }]
			]);

		var yScale = d3.time.scale()
			    .domain([new Date(2014, 11, 31), new Date(2005, 0, 1)])
				.range([0, 650]);

		// var yScaleRight = d3.time.scale()
		// 	    .domain([new Date(2013, 11, 1), new Date(1991, 0, 1)])
		// 		.range([20, 1380]);

		var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .tickFormat(customTimeFormat)
            .ticks(d3.time.year, 1);

        // var yAxisRight = d3.svg.axis()
        // .scale(yScaleRight)
        // .orient("right")
        // .tickFormat(customTimeFormat);

		var colorScale = d3.scale.quantile()
				.domain([-80, -50, -0.01, 0, 0.01, 50, 80])
				.range(["#03784E", "#8EC63F", "#D8DF20", "#ccc", "#FBB383", "#F14D31", "#C41228"]);

		//tooltip to display quote and candle
		var tooltip = d3.select("body")
				.append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);

		var dataLegend = [0, 1, 2, 3, 4, 5, 6];

		var colorScaleLegend = d3.scale.ordinal()
				.range(["#03784E", "#8EC63F", "#D8DF20", "#ccc", "#FBB383", "#F14D31", "#C41228"]);

		//diagram container
		var svg = d3.select("body")
				.select("#d3")
				.append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("viewBox", function () {
	    			return "0,0," +width + "," + height;
	    		});

		d3.csv("data/works-stock.csv", function (data) {
			svg.selectAll("rect.brick")
				.data(data)
				.enter()
				.append("rect")
				.attr("class", "brick")
				.attr("width", widthBrick)
				.attr("height", heightBrick)
				.attr("fill", function (d) {
					return colorScale(d.priceChange);
				})
				.attr("x", function (d, j) {
					return (j % column) * 10 + 120;
				})
				.attr("y", function (d, j) {
					return Math.floor((j / column)) * 20 + 75;
				})
				.on("mouseover", function(d) {
					tooltip.transition()
					.duration(200)
					.style("opacity", .8);

					//calculate which icon to use first here,then apply below
					if(d.close > d.open) { // price up
						if(d.close >= d.high){ //highest is the final price
							if(d.open <= d.low){
								iconType = 1;
							} else {
								iconType = 2;
							} 
						} else {
								if(d.open > d.low){
									iconType = 3;
								} else {
									iconType = 4;
								}
							}
					} else if(d.close < d.open) { //price down
						if(d.close > d.low){
							if(d.open >= d.high){
								iconType = 6;
							} else {
								iconType = 7;
							} 
						} else {
								if(d.open < d.high){
									iconType = 8;
								} else {
									iconType = 9;
								}
						}
					} else { //price equal
						iconType = 5;
					};

					tooltip.html( "<div class=tooltipGadget><b>上证指数" + "<br/>"
						+ "日期: " + d.date + "<br/>" 
						+ "收盘: " + d.close + "<br/>"
						+ "昨收: " + d.open + "<br/>" 
						+ "涨跌: " + d.priceChange
						+ "</div>"
						+ "<div class='tooltipGadget box'>"
						+ "<img src=image/work/work-stock/box" + iconType + ".svg></div>"
					)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY - 20) + "px");
				})
				.on("mouseout", function(d) {
					tooltip.transition()
					.duration(500)
					.style("opacity", 0);
				});

		});

        svg.append("g")
        	.attr("id", "yAxis")       
	        .attr("class", "axis")
	        .attr("transform", function(){ 
	            return "translate(105, 30)";
	        })
	        .call(yAxis);

		//title for diagrame
		// svg.append("g")       
	 //        .attr("id", "title")
	 //        .attr("transform", function(){ 
	 //            return "translate(115, 50)";
	 //        })
	 //        .append("text")
	 //        .attr("class", "title")
	 //        .text("中国股市晴雨表：2005-2014");

	    //footnote of data source
	    svg.append("g")       
	        .attr("id", "footnote")
	        .attr("transform", function(){ 
	            return "translate(118, 720)";
	        })
	        .append("text")
	        .attr("class", "footnote")
	        .text("数据来源：网易财经，上海证券交易所")
	        .style("font-size", "12px")
	        .style("font-family", "SimHei, STHeiti, Arial, sans-serif");

	    //legend


		svg.append("g")
				.attr("id", "legend")
				.attr("transform", "translate(775, 35)");

		svg.select("#legend")
				.selectAll("rect.legend")
				.data(dataLegend)
				.enter()
				.append("rect")
				.attr("class", "legend")
				.attr("width", "20")
				.attr("height", "10")
				.attr("fill", function (d, i) {
					return colorScaleLegend(i);
				})
				.attr("transform", function (d, j) {
					return "translate(" + 21 * j + ", 5)"
				});

		svg.select("#legend")
				.append("text")
				.attr("transform", "translate(0, 0)")
				.text("跌")
				.style("font-size", "12px")
	        	.style("font-family", "SimHei, STHeiti, Arial, sans-serif");

	    svg.select("#legend")
				.append("text")
				.attr("transform", "translate(135, 0)")
				.text("涨")
				.style("font-size", "12px")
	        	.style("font-family", "SimHei, STHeiti, Arial, sans-serif");