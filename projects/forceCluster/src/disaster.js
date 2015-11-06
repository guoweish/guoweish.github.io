//**********************************************************
//==========================================================
// start 设置viz顶层div容器
//==========================================================
// var vizContainer = d3.select('#vizContainer')
// 		.style('width', '100%')
// 		.style('height', '100%');
//设置svg画布
var svgHeight = 700;
var svg = d3.select('#vizContainer')
		.append('svg')
		.style('width', '100%')
		.style('height', svgHeight);
var svgNode = d3.select('svg').node();
// console.log(svgNode);
// console.log(svgNode.parent); //svgNode.parent is undefined
//==========================================================
//screen.width = 设备屏幕大小
var deviceWidth = screen.width;
var deviceHeight = screen.height;

// 不直接用screen.width是因为设备屏幕大小，还包括浏览器菜单栏地址栏等尺寸，和浏览器可用显示区域不一致，而包裹在div中的svg，正好表示为浏览器可用尺寸
var screenWidth = parseFloat(svgNode.clientWidth || svgNode.parent.clientWidth);
var screenHeight = parseFloat(svgNode.clientHeight || svgNode.parent.clientHeight);

// 设置viewbox才能保证旋转屏幕弹性调整svg图片
svg.attr('viewBox', '0 0 ' + screenWidth + ' ' + screenHeight);
//==========================================================
//end 设置viz顶层div容器
//==========================================================
//**********************************************************
// 浮动工具栏
var mouseTooltip = d3.select("body")
        .append("div")
        .attr("class", "mouseTooltip")
        .style("opacity", 0);

// 布局设置
// 两边距去除15%
var marginHorizontal = screenWidth * 0.15;
var marginTop = 30;

//共分4.5块，第一块行首，占0.5块
 //内容连行标题分5块，每块宽度
var numContentBlocks = 4.5;
var singleBlockWidth = (screenWidth - marginHorizontal * 2)/numContentBlocks;
// 每块高度100
var singleBlockHeight = 100;

function singleBlockHeight(h) {
	if(!argument.length) {
		var _height = singleBlockHeight;
	} else {
		var _height = h;
	}
	return _height;
}

// 获取列表默认选中值
var defaultSelectedOption = d3.select('#selectContainer')[0][0].value;


//==================================================================
//===========start 绘制季度标题
// console.log(singleBlockWidth);
var titleSeasonContent = ['第一季度','第二季度','第三季度','第四季度'];
var titleSeasonGroup = svg.append('g')
		.attr('transform', 'translate(' + marginHorizontal + ',' + marginTop + ')');
titleSeasonGroup.selectAll('text.titleSeason')
	.data(titleSeasonContent)
	.enter()
	.append('text')
	.attr('class', 'titleSeason')
	.attr('transform', function(d, i) {
		return 'translate(' + (i+1) * singleBlockWidth + ',0)';
	})
	.text(function(d) {
		return d;
	});
//===========end 绘制季度标题
//==================================================================

d3.csv('data/geo_disaster.csv', function(data) {
	var dateFormat = d3.time.format('%Y-%m-%d');
	var yearFormat = d3.time.format('%Y');
	var monthFormat = d3.time.format('%m');
	// 提取每个数值的年份
	data.forEach(function(d) {
		d.standardTime = dateFormat.parse(d.date);//将字符串转为标准时间格式
		d.year = yearFormat(d.standardTime);
		d.month = monthFormat(d.standardTime);
	});
	// console.log(data);
	
	// console.log('default selected option: ' + defaultSelectedOption);

	var defaultNestedData = d3.nest()
			.key(function(d) {
				return d[defaultSelectedOption];
			})
			.key(function(d) { //按季度分类
				// return d.month; //暂时直接用已知变量
				if (d.month>=1 && d.month<=3) {
					return 1;
				} else if (d.month>=4 && d.month<=6) {
					return 2;
				} else if (d.month>=7 && d.month<=9) {
					return 3;
				} else if (d.month>=10 && d.month<=12) {
					return 4;
				}
			})
			.entries(data);
	// console.log(defaultNestedData);
	// console.log(defaultNestedData[0].values);

	var maxSeasonLength = 0; //单个季度最多的事故数量
	for(var i=0; i<defaultNestedData.length; i++) {
		defaultNestedData[i].values.forEach(function(d) {
			// console.log(d.values.length);
			if (d.values.length > maxSeasonLength) {
				maxSeasonLength = d.values.length;
			}
		});
	}
	// console.log(maxSeasonLength);

	//==================================================================
	//===========start 绘制年度标题
	var titleYearContent = getNestedDataKeys(defaultNestedData);
	var titleYearGroup = svg.append('g')
			.attr('transform', 'translate(' + marginHorizontal + ',' + marginTop + ')');
	titleYearGroup.selectAll('text.titleYear')
		.data(titleYearContent)
		.enter()
		.append('text')
		.attr('class', 'titleYear')
		.attr('transform', function(d, i) {
			return 'translate(0,' + (i+0.5) * singleBlockHeight + ')';
		})
		.text(function(d) {
			return d;
		});

	//===========end 绘制年度标题
	//==================================================================


	//==================================================================
	//===========start 绘制默认视图
	renderViz(defaultNestedData);
	//===========end 绘制默认视图
	//==================================================================

	// 列表菜单设置触发函数
	d3.select('#selectContainer')
		.on('change', selectedChange(data));

	/*
	render(selectedOption); //渲染视图，视图的类别取决于selectedOption的值
	--processData(); //处理数据
	--renderLabels(); //标签
	----renderTopLabel(); //标签-顶部标签
	----renderLeftLabel(); ////标签-左侧标签
	--renderPoints();

	*/

});

function showMouseTooltip(d, i) {
	mouseTooltip.style("opacity", 1)
		.style('z-index', 10);

	mouseTooltip.html(generateMouseTipContent (d))
        .style("left", function() {
        	if (d3.event.pageX < screenWidth/2) {
        		return d3.event.pageX + "px";
        	} else{
        		return (d3.event.pageX - 70) + "px";
        	}
        	
        })
        .style("top", (d3.event.pageY) + "px");
}

function hideMouseTooltip(d, i) {
	// 隐藏提示框
	mouseTooltip.style("opacity", 0);
}

function generateMouseTipContent (d) {
	return "<div id='dateTooltip'>" + d.date + "</div>" + 
	"<div id='deathTooltip'>死亡" + d.death + "人</div>" +
	"<div id='placeTooltip'>" + d.place + "</div>" +
	"<div class='lineTooltip'><hr id='lineInTooltip'></div>" +
	"<div class='innerTitleTooltip'>事故描述</div>" +
	"<div id='descriptionTooltip'>" + d.desc + "</div>" +
	"<div class='lineTooltip'><hr id='lineInTooltip'></div>" +
	"<div class='innerTitleTooltip'>事故责任方</div>" +
	"<div id='responsibleTooltip'>" + d.responsible + "</div>";
}

function drawSinglePointsBlock (allPointsGroup, data, singleBlockWidth, singleBlockHeight) {
	var canvasWidth = singleBlockWidth;
	var canvasHeight = singleBlockHeight;
	// 圆点半径
	var rPoint = 8;
	// 圆之间缝隙
	var gapPoints = 1;
	// 水平位置可以放置圆个数
	var maxHorizontalPointsNum = Math.floor(singleBlockWidth / (rPoint*2 + gapPoints*2));
	// console.log(maxHorizontalPointsNum);
	// 构建和圆点个数一致的虚拟数据数组
	// var pointsVirtualData = d3.range(pointNum);
	// console.log(pointsVirtualData);

	allPointsGroup.selectAll('circle.dataPoints')
		// .data(pointsVirtualData)
		.data(data)
		.enter()
		.append('circle')
		.attr('class', 'dataPoints')
		.attr('r', rPoint)
		.attr('transform', function(d, i) {
			return 'translate(' + ((i % maxHorizontalPointsNum) * (rPoint*2 + gapPoints*2) + (gapPoints + rPoint)) + ',' + (Math.floor(i / maxHorizontalPointsNum) * (rPoint*2 + gapPoints*2) + (gapPoints + rPoint)) + ')';
		})
		.on('mouseover', showMouseTooltip)
		.on('mouseout', hideMouseTooltip);
}

// 获取nesteddata数据的第一层key
function getNestedDataKeys(data) {
	var dataKeys = [];
	data.forEach(function(d) {
		dataKeys.push(d.key);
	});
	// console.log('output from function getNestedDataKeys: ' + dataKeys);
	return dataKeys;
}

function showSelectedValue() {
	console.log(this.value);
}

function selectedChange(data) {
	// on模式处理event不能传递参数，故用闭包传递参数
	return function selectedChangeEventHandler() {
		defaultSelectedOption = this.value;
		var currentNestedData = d3.nest()
			.key(function(d) {
				return d[defaultSelectedOption];
			})
			.key(function(d) { //按季度分类
				// return d.month; //暂时直接用已知变量
				if (d.month>=1 && d.month<=3) {
					return 1;
				} else if (d.month>=4 && d.month<=6) {
					return 2;
				} else if (d.month>=7 && d.month<=9) {
					return 3;
				} else if (d.month>=10 && d.month<=12) {
					return 4;
				}
			})
			.entries(data);
		// console.log(currentNestedData);
		// 绘制园点
		renderViz(currentNestedData);
	}
}

function renderViz(currentNestedData) {
	d3.select('#allPointsGroup').remove();
	var allPointsGroup = svg.append('g')
			.attr('id', 'allPointsGroup');

	console.log(defaultSelectedOption);

	if (defaultSelectedOption == 'year') {
		singleBlockHeight = 100;
	} else if (defaultSelectedOption == 'province') {
		singleBlockHeight = 20;
	}

	allPointsGroup.attr('transform', 'translate(' + (marginHorizontal + singleBlockWidth * 0.5) + ',' + (marginTop + singleBlockHeight * 0.4) + ')');
	for(var i=0; i<currentNestedData.length; i++) {
		// console.log(currentNestedData[i].values);
		currentNestedData[i].values.forEach(function(d, j) {
			// console.log(d);
			// console.log(d.values.length);
			// console.log(d.values);
			var pointsGroupColumn = allPointsGroup.append('g')
					.attr('transform', function(e) {
						return 'translate(' + j * singleBlockWidth + ',' + i * singleBlockHeight + ')';
					});

			drawSinglePointsBlock(pointsGroupColumn, d.values, singleBlockWidth, singleBlockHeight);
		});
	}
}
