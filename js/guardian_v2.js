//**********************************************************
//==========================================================
// start 设置viz顶层div容器
//==========================================================
var vizContainer = d3.select('body')
		.append('div')
		.attr('id', 'vizContainer')
		.style('width', '100%')
		.style('height', '100%');
//设置svg画布
var svg = d3.select('#vizContainer')
		.append('svg')
		.style('width', '100%')
		.style('height', '100%');
var svgNode = d3.select('svg').node();
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


d3.csv('data/poor.csv', function(data) {
	//预处理数据
	data.forEach(function(d) {
		d.poorPopulation = + d.poorPopulation;
		d.totalPopulation = + d.totalPopulation;
		d.poorPercent = +(d.poorPopulation / d.totalPopulation).toFixed(2);

		if(d.provinceCate == '东部地区') {
			d.provinceClass = 'eastChina';
		} else if(d.provinceCate == '中部地区') {
			d.provinceClass = 'centerChina';
		} else if(d.provinceCate == '西部地区') {
			d.provinceClass = 'westChina';
		}
	});
	// console.log(data);

	// 浮动工具栏
	var tooltipMap = d3.select("body")
	        .append("div")
	        .attr("class", "tooltipMap")
	        .style("opacity", 0);

	// 列表和计数变量不能跟随window resize每次恢复原始值
	//根据数据定义气泡和弧线的类别
	var targetList = ['eastChina', 'centerChina', 'westChina'];
	var countState = 0;
	// d3.select('#toggleButton')
	// 	.on('click', toogleVisible(countState, targetList));

	var downPoint; //定义大圆初始位置
	var upPointGroup; //上圆数据
	var curvePathGroup; //曲线
	var downCircle; //定义下部大圆

	var toggleButtonVisible = 'hidden'; //移动设备按钮默认隐藏
	var bubbleVisible = 'visible'; //气泡默认显示
	// var toggleTitlePhoneView = svg.append('g')
	// 		.attr('class', 'toggle')
	// 		.append('text')
	// 		.attr('id', 'toggleTitlePhoneView')
	// 		.attr('transform', 'translate(20, 20)');

	//定义大圆初始位置
	var downCircleRadius = screenWidth * 0.08; //设定下方圆球半径为窗口宽度的20%

	//生成一组圆形的原始位置点
	var numUpPoint = data.length;
	//上部圆球最左最右的留白宽度，固定像素不如比例能在移动设备实现弹性布局
	var sideGap = screenWidth * 0.1; 
	var stepPosition = (screenWidth - sideGap*2) / (numUpPoint - 1); //每个上部元球数据点间隔
	//上部圆球位置不小于最大圆球的半径，确保最大的球在显示区域，因此最大圆球半径为screenWidth * 0.1（因为圆球实际上移半径的距离，离开连接线）
	var yPositionUpPoint = screenWidth * 0.16 + 20; 

	//定义拖拽工具
	var drag = d3.behavior.drag()
		.on('dragstart', function() {
			d3.event.sourceEvent.stopPropagation();
		})
		.on('drag', dragmove);

	//贝塞尔曲线宽度
	var curveWidth = 4;

	//单个被动圆的移动比例尺
	var rExtent = d3.extent(data, function(d) {
		return d.totalPopulation;
	});
	// console.log(rExtent);
	var radiusScale = d3.scale.linear()
			.domain(rExtent)
			.range([10,screenWidth * 0.08]); //上部气球最大直径不超过下部圆球

	var distanceScale = d3.scale.linear()
			.domain(rExtent)
			.range([2,20]);

	if (deviceWidth < 400) { 
		phoneView();
	}
	else if (deviceWidth < 1000) {
		tabletView();
	}
	else {
		desktopView();
	}

	//是否只适用于desktop的窗口缩放？===============================================
	window.onresize = function() { //window.onresize 适用于desktop的窗口缩放，不适用于mobile
		var resizeWindow = parseFloat(svgNode.clientWidth || svgNode.parent.clientWidth);

		var isVisible = 'visible';
		// console.log(resizeWindow);
		if (resizeWindow > 1000) {
			// console.log('pc');
			d3.select('#toggleButton')
				.style('visibility', 'hidden');

			isVisible = 'visible';
			initialBubbleVisibility('.' + targetList[0], isVisible);
		} 
		else if (resizeWindow >= 400 && resizeWindow <= 1000) {
			// console.log('tablet');
			d3.select('#toggleButton')
				.style('visibility', 'hidden');

			isVisible = 'visible';
			initialBubbleVisibility('.' + targetList[0], isVisible);
		} else {
			console.log('phone');
			isVisible = 'hidden';
			initialBubbleVisibility('.' + targetList[0], isVisible);

			// d3.select('#toggleButton')
			// 	.on('click', toogleVisible(countState, targetList));

			d3.select('#toggleButton')
				.style('visibility', 'visible');

		}
	}

	function phoneView() {//手机视图
		downPoint = [screenWidth/2, screenHeight * 0.4];

		drawViz();

		initialBubbleVisibility('.' + targetList[0], 'visible');
		initialBubbleVisibility('.' + targetList[1], 'hidden');
		initialBubbleVisibility('.' + targetList[2], 'hidden');

		d3.selectAll('.toggle')
				.style('visibility', 'visible');

		d3.select('#toggleButtonLeft')
				// .on('click', toogleVisiblePrev(countState, targetList));
				.on('click', toggleBubbleVisibilityLeft);

		d3.select('#toggleButtonRight')
				// .on('click', toogleVisibleNext(countState, targetList));
				.on('click', toggleBubbleVisibilityRight); 
		
	}

	function tabletView() {//平板视图
		// downPoint = [screenWidth/2, screenHeight * 0.8];
		// d3.selectAll('.toggle')
		// 		.style('visibility', 'hidden');

		// drawViz();

		//门面模式直接套用phoneview
		phoneView(); 
	}

	function desktopView() {//桌面视图
		downPoint = [screenWidth/2, screenHeight * 0.8];
		d3.selectAll('.toggle')
				.style('visibility', 'hidden');

		drawViz();
	}

	function drawViz() {
		//生成上部圆球数据
		upPointGroup = generateUpPointData(numUpPoint, sideGap, stepPosition, yPositionUpPoint, data);
		//生成一组连线贝塞尔曲线数据
		curvePathGroup = generateCurveData(upPointGroup, downPoint);	

		//绘制贝塞尔曲线		
		drawCurve(curvePathGroup, svg, upPointGroup, curveWidth, highlightElement, unHighlightElement);

		//绘制上半组圆形
		createCircle(svg, upPointGroup);

		//绘制下半部分可拖动圆球
		downCircle = drawDownCircle(svg, downPoint, drag, downCircleRadius);
	}
	
	
	//生成上部圆球数据
	function generateUpPointData(numUpPoint, sideGap, stepPosition, yPositionUpPoint, data) {
		var upPointGroup = d3.range(numUpPoint).map(function(i) {
			return [(sideGap + i * stepPosition), yPositionUpPoint, data[i].poorPopulation, data[i].provinceClass, data[i].poorPercent, data[i].province, data[i].totalPopulation];
		});

		console.log('upPointGroup: ' + upPointGroup);
		return upPointGroup;
	}

	//生成一组连线贝塞尔曲线数据
	function generateCurveData(upPointGroup, downPoint) {
		var curvePathGroup = [];
		upPointGroup.forEach(function(d) {
			var yDistance = downPoint[1] - d[1];

			var m_1 = [d[0], (d[1] + yDistance/3*2)];
			var m_2 = [downPoint[0], (downPoint[1] - yDistance/3*2)];

			var curveElement = curveJoin([d[0], d[1]], m_1, m_2, downPoint);

			curvePathGroup.push(curveElement);
		});

		return curvePathGroup;
	}
	
	//绘制贝塞尔曲线
	function drawCurve(curvePathGroup, svg, upPointGroup, curveWidth, highlightElement, unHighlightElement) {
		curvePathGroup.forEach(function(d, i) {
			svg.append('path')
				.attr('id', 'bezier_' + i)
				.attr('class', upPointGroup[i][3]) //class定义为数据点类型，方便弹性布局操控
			    .attr("d", d)
			    .attr("stroke", "#FEEEF1")
			    .attr("stroke-width", curveWidth)
			    .attr("fill", "none")
			    .on('mouseover', function() {
			    	return highlightElement(d, i);
			    })
				.on('mouseout', function() {
			    	return unHighlightElement(d, i);
			    });
		});
	}


	function drawDownCircle(svg, downPoint, drag, downCircleRadius) {
		var downCircle = svg.append('g')
				.attr('id', 'pullHandler')
				.attr('transform', 'translate(' + downPoint[0] + ',' + downPoint[1] + ')')
				.call(drag);


		downCircle.append('circle')
				.attr('id', 'downCircle')
				.attr('r', downCircleRadius) //下半部分控制球大小
				.style('fill', '#AA001E');

		downCircle.append('circle')
			.attr('transform', 'translate(0,' + (-downCircleRadius/2) + ')')
			.attr('id', 'downCircle-center')
			.attr('r', downCircleRadius/2) //下半部分控制球内部小球大小设定一半
			.style('fill', '#BA324A')
			.style('stroke', 'white')
			.style('stroke-width', 1.5)
			.style("stroke-dasharray", ("2, 2"));

		return downCircle;
	}
		
	//=======================================================

	

	function dragmove(d) {
		// var x = d3.event.x;
		var pullRatio = 4; //上球移动下球的1/4
		var x = downPoint[0];
		var y = d3.event.y;

		// 判断是否在可移动距离内
		var maxPullDistance = 150,
			minPullDistance = 0;
		var pulledDistance = y - downPoint[1];

		if (pulledDistance > minPullDistance && pulledDistance < maxPullDistance) {
			//移动下方大圆
			d3.select(this)
				.attr('transform', 'translate(' + x + ',' + y + ')');

			var colorScale = d3.scale.linear()
					.domain([0, maxPullDistance/2])
					.range(['#FEEEF1', '#AA001E']);

			//定义填充曲线渐变方式
			function fillCurveColor(i) {
				return colorScale(pulledDistance/distanceScale(upPointGroup[i][2]));
			}

			//移动一组圆形 ============================
			upPointGroup.forEach(function(d, i) {
				d3.select('#upG_' + i)
					.attr('transform', 'translate(' + d[0] + ',' + (d[1] + pulledDistance/distanceScale(d[2])) +')');

				d3.select('#upCircle_' + i)	
					.attr('fill', colorScale(pulledDistance/distanceScale(d[2])));
			});

			//计算新的曲线数据
			var newCurvePathGroup = [];
			// var newUpPointGroup = [];

			upPointGroup.forEach(function(d, i) {
				var newUpPoint = [d[0], (d[1] + pulledDistance/distanceScale(d[2]))];
				var newDownPoint = [downPoint[0], y];

				var newYDistance = newDownPoint[1] - newUpPoint[1];

				var newM_1 = [newUpPoint[0], (newUpPoint[1] + newYDistance/3*2)];
				var newM_2 = [newDownPoint[0], (newDownPoint[1] - newYDistance/3*2)];

				var newCurvePath = curveJoin(newUpPoint, newM_1, newM_2, newDownPoint);

				newCurvePathGroup.push(newCurvePath);
				// newUpPointGroup.push(newUpPoint);
			});
			// console.log(newCurvePathGroup);

			//更新曲线数据============================
			newCurvePathGroup.forEach(function(d, i) {
				d3.select('#bezier_' + i)
					.attr("d", d)
				    .attr("stroke", fillCurveColor(i))
				    .attr("stroke-opacity", .7)
				    .attr("stroke-width", curveWidth)
				    .attr("fill", "none");
			});	

		}
	}

	//将4个点连接成贝塞尔曲线数据
	function curveJoin(start, m_1, m_2, end) {
		var newStart = 'M' + start.join(',');
		var newM_1 = 'C' + m_1.join(',');
		var newM_2 = m_2.join(',');
		var newEnd = end.join(',');

		return newStart + ' ' + newM_1 + ' ' + newM_2 + ' ' + newEnd;
	}

	//绘制上班部分圆形
	function createCircle(svg,data) {
		svg.selectAll('g.up')
			.data(data)
			.enter()
			.append('g')
			.attr('class', 'up')
			.attr('id', function(d, i) {
				return 'upG_' + i;
			})
			.attr('transform', function(d) {
				return 'translate(' + d[0] + ',' + d[1] + ')';
			});

		//上部大圆
		svg.selectAll('g.up')
			.append('circle')
			.attr('id', function(d, i) {
				return 'upCircle_' + i;
			})
			.attr('class', function(d, i) {
				return d[3]; //将class定义为数据的cate类别，以便弹性布局操控
			})
			.attr('transform', function(d) {
				return 'translate(0,' + (-radiusScale(d[6]) - 20) + ')'; //为说明文字上移20空出白底
			})
			.attr('r', function(d) {
				return radiusScale(d[6]);
			})
			.attr('fill', '#FEEEF1')
			.on('mouseover', function(d, i) { //高亮选中的圆球和曲线
				highlightElement(d, i);
			})
			.on('mouseout', function(d, i) {
				unHighlightElement(d, i);
			});

		//上部大圆内部小园
		svg.selectAll('g.up')
			.append('circle')
			.attr('id', function(d, i) {
				return 'upCircleInner_' + i;
			})
			.attr('class', function(d, i) {
				return d[3]; //将class定义为数据的cate类别，以便弹性布局操控
			})
			.attr('transform', function(d) {
				return 'translate(0,' + (-20 - radiusScale(d[6])/5) + ')'; 
			})
			.attr('r', function(d) {
				return radiusScale(d[6])/5;
			})
			.attr('fill', '#fff')
			.attr('stroke', '#ccc')
			.style("stroke-dasharray", ("2, 2"))
			.on('mouseover', function(d, i) { //高亮选中的圆球和曲线
				highlightElement(d, i);
			})
			.on('mouseout', function(d, i) {
				unHighlightElement(d, i);
			});


		// 每个圆球的说明文字
		svg.selectAll('g.up')
			.append('text')
			.attr('class', function(d, i) {
				return d[3]; //将class定义为数据的cate类别，以便弹性布局操控
			})
			.attr('text-anchor', 'middle')
			.attr('transform', function(d) {
				return 'translate(0,' + (-5) + ')';
			})
			.text(function(d,i) {
				return d[5];
			})
			.style('pointer-event', 'none');
	}

	// 高亮选中元素
	function highlightElement(d, i) {
		// console.log('highlight ' + d);
		// 鼠标划过，Z轴第一
		// this.parentElement.appendChild(this); 
		var thisFlag = d3.select('#upG_' + i);
		// console.log(thisFlag[0][0]);
		// console.log(thisFlag[0][0].parentElement);
		// 为何是数组，原因不明，原理是将目标svg元素摘下来之后再装回去，使之达到z轴最顶端，形成最前层显示效果
		var targetElement = thisFlag[0][0]; 
		targetElement.parentElement.appendChild(targetElement);
		// thisFlag.parentElement.appendChild(thisFlag);

		d3.select('#upCircle_' + i)
			.classed('circleHighlight', true);

		d3.select('#bezier_' + i)
			.classed('curveHighlight', true);

		// 显示提示框
		tooltipMap.style("opacity", .9).style('z-index', 10);
		tooltipMap.html(d[5] + '贫困人口比例: ' + d[4] + '%')
	        .style("left", function() {
	        	if (d3.event.pageX < screenWidth/2) {
	        		return d3.event.pageX + "px";
	        	} else{
	        		return (d3.event.pageX - 70) + "px";
	        	}
	        	
	        })
	        .style("top", (d3.event.pageY + 20) + "px");


	}

	function unHighlightElement(d, i) {
		// console.log('un highlight ' + d);
		d3.select('#upCircle_' + i)
			.classed('circleHighlight', false);

		d3.select('#bezier_' + i)
			.classed('curveHighlight', false);

		// 隐藏提示框
		tooltipMap.style("opacity", 0);
	}

	// 将小数点保留2位
	function fixNumber(numObj) {
		return numObj.toFixed(2);
	}

	function initialBubbleVisibility (targetList, isVisible) {
		// console.log(d3.selectAll(targetList));

		d3.selectAll(targetList)
			.transition()
			.duration(1000)
			.style('visibility', isVisible);
	}

	function toggleBubbleVisibilityRight() {
		switch(countState) {
			case 0:
				initialBubbleVisibility('.' + targetList[0], 'hidden');
				initialBubbleVisibility('.' + targetList[1], 'visible');
				initialBubbleVisibility('.' + targetList[2], 'hidden');
				countState = 1;
				// console.log(countState);

				d3.select('#toggleTitlePhoneView')
					.text('中部地区');		
				break;

			case 1:
				initialBubbleVisibility('.' + targetList[0], 'hidden');
				initialBubbleVisibility('.' + targetList[1], 'hidden');
				initialBubbleVisibility('.' + targetList[2], 'visible');
				countState = 2;
				// console.log(countState);
				d3.select('#toggleTitlePhoneView')
					.text('西部地区');
				break;

			case 2:
				initialBubbleVisibility('.' + targetList[0], 'visible');
				initialBubbleVisibility('.' + targetList[1], 'hidden');
				initialBubbleVisibility('.' + targetList[2], 'hidden');
				countState = 0;
				// console.log(countState);
				d3.select('#toggleTitlePhoneView')
					.text('东部地区');
				break;
		}
	}

	function toggleBubbleVisibilityLeft() {
		switch(countState) {
			case 0:
				initialBubbleVisibility('.' + targetList[0], 'hidden');
				initialBubbleVisibility('.' + targetList[1], 'hidden');
				initialBubbleVisibility('.' + targetList[2], 'visible');
				countState = 2;
				d3.select('#toggleTitlePhoneView')
					.text('西部地区');
				console.log(countState);
				break;
			case 1:
				initialBubbleVisibility('.' + targetList[0], 'visible');
				initialBubbleVisibility('.' + targetList[1], 'hidden');
				initialBubbleVisibility('.' + targetList[2], 'hidden');
				countState = 0;
				d3.select('#toggleTitlePhoneView')
					.text('西部地区');
				console.log(countState);
				break;
			case 2:
				initialBubbleVisibility('.' + targetList[0], 'hidden');
				initialBubbleVisibility('.' + targetList[1], 'visible');
				initialBubbleVisibility('.' + targetList[2], 'hidden');
				countState = 1;
				d3.select('#toggleTitlePhoneView')
					.text('东部地区');
				console.log(countState);
				break;
		}
	}

	function clickTest (words) {
		return function() {
			console.log(words);
		}
	}

});


