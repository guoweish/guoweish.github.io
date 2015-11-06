/*
//全局变量初始化
var svgwWidth, svgHeight;
var margins; //{top: 20, right: 0.1, bottom;20, left:0.1} 如果屏幕大于1200，左右边距比例调大
var selectedOption; //控件状态存储
var mouseTooltip;
var dataView //充当每次视图改变的数据载体

//画布初始化
iniSvg(width, height, margins);

//数据初始化，处理时间，添加必要属性
iniData();

//注册表单控制事件:triggerControlChange();
setControlsAction();

//默认执行一次
//执行控制状态变化
//triggerControlChange();
--getControlsState(); //获取已经改变的selectedOption
--render(selectedOption); //由getControlsState传递全局变量新值selectedOption

//获取表单状态,返回selectedOption
getControlsState();

//渲染图表
render(selectedOption); //渲染视图，视图的类别取决于selectedOption的值
--changeDataView(); //处理数据,根据表单状态selectedOption改变数据nest状态，数据本身不改变
--renderWidgets();
----renderWidgetsLine();
----renderWidgetsBackground();
--renderLabels(); //标签
----renderTopLabel(); //标签-顶部标签
----renderLeftLabel(); ////标签-左侧标签
--renderPoints();
----drawForce();

//渲染地图
renderMap(data);
*/

//start 交互力图变量初始化 =================================================
var svg; //svg canvas
var svgwWidth = 1000;
var svgHeight = 600;
var svgMargins = {top:20, right:50, bottom:10, left:50};

var dataView; //nest之后的数据
var rawData; //未nest之前到数据
var selectedOption; //控件状态存储

var mouseTooltip = d3.select("body")
        .append("div")
        .attr("class", "mouseTooltip")
        .style("opacity", 0);
//end 交互力图变量初始化 =================================================

//start 地图变量初始化 ===============================================
var viewCenter = [34.277799897831,100.9530982792]; //view center
var mapScale = 4; //default map view scale
var minZoom = 3; // min zoom level
var maxZoom = 13;
var mapStyle = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'; //map style from osm
var mapAttribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'; //buttom labels on map
var map = L.map('map').setView(viewCenter, mapScale); //attach to div#map
L.tileLayer(mapStyle, {attribution: mapAttribution,  maxZoom: maxZoom, minZoom: minZoom}).addTo(map); //initial map
//end 地图变量初始化 ===============================================

//载入数据，渲染力图与地图
d3.csv('data/geo_disaster.csv', function(data) {
	//画布初始化，初始宽度加上左右边距，初始高度加上上下边距，因此svg画框原点即是边距的上、左点
	iniSvg(svgwWidth, svgHeight, svgMargins);
	//数据初始化，处理时间，添加必要属性
	rawData = data;
	iniData(rawData);
	//注册表单控制事件
	setControlsAction('#selectContainer', triggerControlChange);
	//默认执行一次，包括获取默认表单状态，渲染视图
	// triggerControlChange执行后返回的是函数，需要调用apply执行
	triggerControlChange('#selectContainer').apply();
	// 加载地图，不属于交互项目，放render之外
	renderMap(data);
});

// svg画布初始化
function iniSvg(svgwWidth, svgHeight) {
	svg = d3.select('#vizContainer')
		.append('svg')
		.attr('id', 'svgCanvas')
		.attr('width', svgwWidth + svgMargins.right + svgMargins.left)
		.attr('height', svgHeight + svgMargins.top + svgMargins.bottom);

	return svg;	
}

//数据初始化，处理时间，添加必要属性
function iniData(data) {
	var dateFormat = d3.time.format('%Y-%m-%d');
	var yearFormat = d3.time.format('%Y');
	var monthFormat = d3.time.format('%m');
	// 提取每个数值的年份
	data.forEach(function(d) {
		d.standardTime = dateFormat.parse(d.date);//将字符串转为标准时间格式
		d.year = yearFormat(d.standardTime);
		d.month = monthFormat(d.standardTime);
		d.area = setProvinceArea(d.province);
		d.season = setSeason(+d.month);
		d.disasterLevel = setDisasterLevel(+d.death);
	});

	// console.log('fun iniData: ');
	console.log(data);
	return data;
}

//注册表单控制事件:triggerControlChange();
function setControlsAction(selectDivId, handlerFunction) {
	d3.select(selectDivId)
		.on('change', handlerFunction(selectDivId));
}

//执行控制状态变化
function triggerControlChange(selectDivId) {
	return function() {
		getControlsState(selectDivId);
		render(selectedOption); 
	}
}

//获取表单状态,返回selectedOption
function getControlsState(selectDivId) {
	var selectedOptionIndex = d3.select(selectDivId)[0][0].selectedIndex;
	selectedOption = d3.select(selectDivId)[0][0][selectedOptionIndex].value;

	// console.log('fun getControlsState: ' + selectedOption);
	return selectedOption;
}

//渲染图表
function render(selectedOption) {
	//处理数据,根据表单状态selectedOption改变数据nest状态，数据本身不改变
	changeDataView(selectedOption); 
	// //渲染标签
	renderLabels(); 
	// //渲染背景
	renderWidgets();
	// //渲染数据点
	renderPoints();

}

//处理数据,根据表单状态selectedOption改变数据nest状态，数据本身不改变
function changeDataView(selectedOption) {
	dataView = d3.nest()
		.key(function(d) {
			return d[selectedOption];
		})
		.sortKeys(d3.ascending)
		.key(function(d) { 
			return d.year;
		})
		.entries(rawData);

	// console.log(dataView);
}

//渲染所有标题
function renderLabels() {
	//删除上次渲染内容
	if (d3.select('#labelsGroup')) {
		d3.select('#labelsGroup').remove();
		// console.log('old label remove');
	}
	svg.append('g').attr('id', 'labelsGroup');
	// countFlag++;
	// console.log(countFlag);
	renderTopLabel();
	renderLeftLabel();
}

//渲染顶部标题
function renderTopLabel() {
	//顶部标题内容，提取自dataview
	var topLabelContent = getNestedDataKeys(dataView);
	// console.log(topLabelContent);
	//顶部标题内容字符串个数
	var numTopLabel = topLabelContent.length;
	//顶部标题位置
	var leftGapTopLabelGroup = 65; //左侧空出边距，配合leftLabel
	var xPositionTopLabelGroup = svgMargins.left+ leftGapTopLabelGroup;
	var yPositionTopLabelGroup = svgMargins.top;
	//顶部标题容器，#labelsGroup来自renderLabels()函数预先生成
	// console.log(d3.select('#labelsGroup'));
	var topLabelGroup = d3.select('#labelsGroup')
			.append('g')
			.attr('id', 'topLabelGroup')
			.attr('transform', 'translate(' + xPositionTopLabelGroup + ',' + yPositionTopLabelGroup + ')');
	//顶部标题容器实际宽度，减去左边距
	var widthTopLabelCanvas = svgwWidth - leftGapTopLabelGroup;
	var heightTopLabelCanvas = 20;

	//顶部标题容器每一块宽度，除于numTopLabel
	var singleTopLabelBlockWidth = widthTopLabelCanvas / numTopLabel;

	topLabelGroup.selectAll('text.titleTop')
		.data(topLabelContent)
		.enter()
		.append('text')
		.attr('class', 'titleTop')
		.attr('transform', function(d, i) {
			//加0.5半个singleTopLabelBlockWidth，居中效果
			return 'translate(' + ((i+0.5)*singleTopLabelBlockWidth) + ', 0)';
		})
		.text(function(d) {
			return d;
		});
}

//渲染左侧标题
function renderLeftLabel() {
	var leftlabelContent = ['2011年','2012年','2013年','2014年', '2015年'];
	var topGapLeftLabelGroup = 70; //顶侧空出边距，配合leftLabel
	var gapIntervolLeftLabelGroup = 100; //左侧标题每个间隙
	var xPositionLeftLabelGroup = svgMargins.left;
	var yPositionLeftLabelGroup = svgMargins.top + topGapLeftLabelGroup;

	var leftLabelGroup = d3.select('#labelsGroup')
			.append('g')
			.attr('id', 'leftLabelGroup')
			.attr('transform', 'translate(' + xPositionLeftLabelGroup + ',' + yPositionLeftLabelGroup + ')');

	leftLabelGroup.selectAll('text.titleLeft')
		.data(leftlabelContent)
		.enter()
		.append('text')
		.attr('class', 'titleLeft')
		.attr('transform', function(d, i) {
			return 'translate(0, ' + i*gapIntervolLeftLabelGroup + ')';
		})
		.text(function(d) {
			return d;
		});
}

//渲染线条、背景色
function renderWidgets() {
	if (d3.select('#widgetsGroup')) {
		d3.select('#widgetsGroup').remove();
		// console.log('old label remove');
	}
	// 总容器
	var widgetsGroup = svg.append('g').attr('id', 'widgetsGroup');
	
	// 背景色容器
	var backgroundHolder = widgetsGroup.append('g').attr('id', 'backgroundHolder');

	
	renderWidgetsBackground();
	renderWidgetsLines(6);
}

// 渲染线条
function renderWidgetsLines(data) {
	var numLines = data;

	var topGapWidgetsLinesGroup = 20; //顶侧空出边距，配合leftLabel
	var gapIntervolWidgetsLinesGroup = 100; //左侧标题每个间隙
	var xPositionWidgetsLinesGroup = svgMargins.left;
	var yPositionWidgetsLinesGroup = svgMargins.top + topGapWidgetsLinesGroup;

	var dataLinesVirtual = d3.range(numLines);

	// 线条容器
	var linesHolder = d3.select('#widgetsGroup')
		.append('g')
		.attr('id', 'linesHolder')
		.attr('transform', 'translate(' + xPositionWidgetsLinesGroup + ',' + yPositionWidgetsLinesGroup + ')');

	linesHolder.selectAll('line.widgetsLine')
		.data(dataLinesVirtual)
		.enter()
		.append('line')
		.attr('class', 'widgetsLine')
		.attr('x1', 0)
		.attr('y1', function(d, i) {
			return i * gapIntervolWidgetsLinesGroup;
		})
		.attr('x2', svgwWidth) //线条长度等于画布宽度
		.attr('y2', function(d, i) {
			return i * gapIntervolWidgetsLinesGroup;
		});
}

// 渲染背景色
function renderWidgetsBackground() {
	// 沿用force模式，修改尺寸
	var leftGapForceGroup = 70; //左侧空出边距，配合leftLabel
	var topGapForceGroup = 20; //顶部空出边距
	var xPositionForceGroup = svgMargins.left+ leftGapForceGroup;
	var yPositionForceGroup = svgMargins.top + topGapForceGroup;
	// 沿用force尺寸
	var numHorizontalForce = dataView.length;
	var singleForceClusterWidth = (svgwWidth - leftGapForceGroup) / numHorizontalForce;
	// 单个背景高度
	var singleBackgroundHeight = 500;

	var dataBackgroundVirtual = d3.range(numHorizontalForce);

	// 线条容器
	var backgroundHolder = d3.select('#widgetsGroup')
		.append('g')
		.attr('id', 'backgroundHolder')
		.attr('transform', 'translate(' + xPositionForceGroup + ',' + yPositionForceGroup + ')');

	backgroundHolder.selectAll('rect.widgetsBackground')
		.data(dataBackgroundVirtual)
		.enter()
		.append('rect')
		.attr('class', 'widgetsBackground')
		.attr('x', function(d, i) {
			return i * singleForceClusterWidth;
		})
		.attr('y', 0)
		.attr('width', singleForceClusterWidth) //线条长度等于画布宽度
		.attr('height', singleBackgroundHeight)
		.classed('widgetsBackgroundGray', function(d, i) {
			if(!(i%2)) {
				return true;
			}
		});
}

//所有数据点
function renderPoints() {
	//删除上次渲染数据点
	if (d3.select('#pointsGroup')) {
		d3.select('#pointsGroup').remove();
		console.log('old pointsGroup remove');
	}
	svg.append('g').attr('id', 'pointsGroup');
	// 根据下拉列表选项渲染数据点类型
	// if (selectedOption == 'season') {
	// 	drawForce();
	// } else if (selectedOption == 'area') {
	// 	drawPoints();
	// }
	drawForce();
}

//渲染力图类型数据点
function drawForce() {
	var leftGapForceGroup = 50; //左侧空出边距，配合leftLabel
	var topGapForceGroup = 10; //顶部空出边距
	var xPositionForceGroup = svgMargins.left+ leftGapForceGroup;
	var yPositionForceGroup = svgMargins.top + topGapForceGroup;

	var numHorizontalForce = dataView.length;
	var singleForceClusterWidth = (svgwWidth - leftGapForceGroup) / numHorizontalForce;
	var singleForceClusterHeight = 100;

	//数据点总容器
	var allFroceGroup = d3.select('#pointsGroup')
			.attr('transform', 'translate(' + xPositionForceGroup + ',' + yPositionForceGroup + ')');
	//循环渲染每幅力图
	for(var i=0; i<dataView.length; i++) {
		// console.log(dataView[i].values);
		dataView[i].values.forEach(function(d, j) {
			// console.log(d);
			// console.log(d.values.length);
			// console.log(d.values);
			//移动单个力图
			var forceGroupColumn = allFroceGroup.append('g')
					.attr('transform', function(e) {
						return 'translate(' + i * singleForceClusterWidth + ',' + j * singleForceClusterHeight + ')';
					});
			//绘制单个力图
			drawSingleForceCluster(forceGroupColumn, d.values, singleForceClusterWidth, singleForceClusterHeight);
		});
	}
}

//渲染单幅力图类型数据点
function drawSingleForceCluster(placeHolder, data, singleForceClusterWidth, singleForceClusterHeight) {
	var numForcePoints = data.length;
	var nodes = d3.range(numForcePoints).map(function(i) {
	  return {index: i, value: data[i]};
	});
	// console.log(nodes);
	var rScale = d3.scale.linear()
		.domain([10, 30])
		.range([5, 12])
		.clamp(true);

	var force = d3.layout.force()
		    .nodes(nodes)
		    .size([singleForceClusterWidth, singleForceClusterHeight])
		    .gravity([0.4])
		    .on("tick", tick)
		    .start();

	//原始圆点circle版
	// var node = placeHolder.append('g')
	// 		.selectAll("circle.dataPoints")
	// 	    .data(nodes)
	// 		.enter()
	// 		.append("circle")
	// 	    .attr("class", "dataPoints")
	// 	    .attr("cx", function(d) { return d.x; })
	// 	    .attr("cy", function(d) { return d.y; })
	// 	    .attr("r", function(d) {
	// 	    	return rScale(+d.value.death);
	// 	    })
	// 	    .on('mouseover', showMouseTooltip)
	// 	    .on('mouseout', hideMouseTooltip)
	// 	    .on("mousedown", function() { d3.event.stopPropagation(); });

	//start try use blod image=================================
	var node = placeHolder.append('g')
			.selectAll("image.blod")
		    .data(nodes)
			.enter()
			.append('image')
		    .attr("class", "blod")
		    .attr("x", function(d) { return d.x; })
		    .attr("y", function(d) { return d.y; })
		    // .attr('xlink:href', 'images/blod.png')
		    .attr('xlink:href', function(d) {
		    	return getRandomImgae();
		    })
			.attr('width', function(d) {
			    	return rScale(+d.value.death)*3 + 'px';
			})
			.attr('height', function(d) {
			    	return rScale(+d.value.death)*3 + 'px';
			})
		    .on('mouseover', showMouseTooltip)
		    .on('mouseout', hideMouseTooltip)
		    .on("mousedown", function() { d3.event.stopPropagation(); });

	//end try use blod image=================================

	node.style("opacity", 1e-6)
		.transition()
	    .duration(1000)
	    .style("opacity", 0.5); //半透明效果

	d3.select("body")
	    .on("mousedown", mousedown);

	//针对插入图片版，所以是x，y
	function tick(e) {
		node.attr("x", function(d) { return d.x; })
	    	.attr("y", function(d) { return d.y; });
	}

	//针对添加circle版，所以是cx，cy
	// function tick(e) {
	// 	node.attr("cx", function(d) { return d.x; })
	//     	.attr("cy", function(d) { return d.y; });
	// }

	function mousedown() {
	  nodes.forEach(function(o, i) {
	    o.x += (Math.random() - .5) * 40;
	    o.y += (Math.random() - .5) * 40;
	  });
	  force.resume();
	}
}

//出现提示框
function showMouseTooltip(d, i) {
	//选中后降低透明度
	d3.select(this).style('opacity', 1);
	// console.log(this);

	mouseTooltip.style("opacity", 1)
		.style('z-index', 10);

	mouseTooltip.html(generateMouseTipContent (d.value))
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
function hideMouseTooltip(d, i) {
	//取消选中后恢复透明度
	d3.select(this).style('opacity', 0.5);
	// 隐藏提示框
	mouseTooltip.style("opacity", 0);
}

//生成提示框内容
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

//渲染圆点类型数据点
function drawPoints() {
	//won't use
}
//utility tools ===================================
// 获取nesteddata数据的第一层key
function getNestedDataKeys(data) {
	var dataKeys = [];
	data.forEach(function(d) {
		dataKeys.push(d.key);
	});
	// console.log('output from function getNestedDataKeys: ' + dataKeys);
	return dataKeys;
}

// 检查元素是否是数组成员
function checkElementOfArray(targetElement, hostArray) {
	var isElement = false;
	for(var i=0; i<hostArray.length; i++) {
		if (hostArray[i] == targetElement) {
			isElement = true;
			break;
		}
	}

	return isElement;
}

// 将省份归入地区
function setProvinceArea(d) {
	var provinceArea;
	var provinceAreaList = ['1.东部沿海地区', '2.中部内陆地区', '3.西部边远地区', '4.东北地区'];
	var provinceList = [['北京','天津','河北','上海','江苏','浙江','福建','山东','广东','广西','海南','重庆'], 
		['山西','内蒙古','安徽','江西','河南','湖北','湖南'], 
		['四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆'], 
		['吉林','黑龙江','辽宁']
	];
	if(checkElementOfArray(d, provinceList[0])) {
		provinceArea = provinceAreaList[0];
	} else if(checkElementOfArray(d, provinceList[1])) {
		provinceArea = provinceAreaList[1];
	} else if(checkElementOfArray(d, provinceList[2])) {
		provinceArea = provinceAreaList[2];
	} else if(checkElementOfArray(d, provinceList[3])) {
		provinceArea = provinceAreaList[3];
	}

	return provinceArea;
}

// 数据添加季度属性
function setSeason(d) {
	var season;
	var seasonList = ['1.第一季度','2.第二季度','3.第三季度','4.第四季度'];
	var monthList = [[1,2,3], [4,5,6], [7,8,9], [10,11,12]];

	if(checkElementOfArray(d, monthList[0])) {
		season = seasonList[0];
	} else if(checkElementOfArray(d, monthList[1])) {
		season = seasonList[1];
	} else if(checkElementOfArray(d, monthList[2])) {
		season = seasonList[2];
	} else if(checkElementOfArray(d, monthList[3])) {
		season = seasonList[3];
	}

	return season;
}

// 数据添加死亡人数级别属性
function setDisasterLevel(d) {
	var level;
	var levelList = ['1.死亡小于20人','2.死亡21～30人','3.死亡31～40人','4.死亡超过40人'];
	var deathList = [0, 20, 30, 40];

	if(d>=deathList[0] && d<=deathList[1]) {
		level = levelList[0];
	} else if(d>deathList[1] && d<=deathList[2]) {
		level = levelList[1];
	} else if(d>deathList[2] && d<=deathList[3]) {
		level = levelList[2];
	} else if(d>deathList[3]) {
		level = levelList[3];
	}

	return level;
}

// 生成随机图片
function getRandomImgae() {
	return 'image/b' + generateRandomInt() + '.png';

	function generateRandomInt() {
		return Math.floor(Math.random()*4) + 1;
	}
}

//map utility function =================================================
// 定义标点分组函数
function defineCluster(clusterCss) {
        var clusterObj = {};
        clusterObj.maxClusterRadius = 100;
        clusterObj.iconCreateFunction = function (cluster) {
            var childCount = cluster.getChildCount();

            var c = clusterCss;
            if (childCount < 10) {
                c += '-small';
            } else if (childCount < 30) {
                c += '-medium';
            } else {
                c += '-large';
            }

            return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className:'marker-cluster ' + c, iconSize: new L.Point(40, 40) });
        }

        return L.markerClusterGroup(clusterObj);
}
//定义单个标点函数
function defineMarker(d, cluster, markerIcon) {
    var title = '<b>事故时间</b>：' + d.date + '<br>' + '<b>事故地点</b>：' + d.place + '<br>' + '<b>死亡人数</b>：' + d.death + '<br>' + '<b>事故原因</b>：' + d.desc;
    var marker = L.marker(new L.LatLng(d.lat, d.lng), { title: title,  icon: markerIcon});
    
    marker.bindPopup(title);
    cluster.addLayer(marker);
}

// 渲染地图
function renderMap(data) {
	// 自定义图标
    var LeafIcon = L.Icon.extend({
            options: {
                iconSize:     [30, 40],
                iconAnchor:   [15, 20],
                popupAnchor:  [0, -30]
            }
        });
    var iconPath = new LeafIcon({iconUrl: 'image/dead.png'});
    // 定义标点分组
    var markersCluster = defineCluster('dead');
    // 定义单个标点
    data.forEach(function(d) {
        // console.log(d.death);
        defineMarker(d, markersCluster, iconPath);
    });
    // 添加标点分组到地图
    map.addLayer(markersCluster); 
}
 

