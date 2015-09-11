var viewCenter = [30.9,121.5];
var mapScale = 10;
var maxZoom = 14;
var mapStyle = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
var mapAttribution = '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';

var map = L.map('map').setView(viewCenter, mapScale);
L.tileLayer(mapStyle, {attribution: mapAttribution,  maxZoom: maxZoom}).addTo(map);

d3.csv('data/geo_google_accident.csv', function(data) {
    // 自定义图标
    var LeafIcon = L.Icon.extend({
            options: {
                iconSize:     [30, 40],
                iconAnchor:   [15, 20],
                popupAnchor:  [0, -30]
            }
        });
    var iconSet = [];
    iconSet['dead'] = new LeafIcon({iconUrl: 'image/dead.png'});
    iconSet['hurt'] = new LeafIcon({iconUrl: 'image/hurt.png'});
    iconSet['damage'] = new LeafIcon({iconUrl: 'image/damage.png'});
    //以事故类型为索引，折叠数据
    var nestData = d3.nest()
        .key(function(d) { return d.accident; })
        .entries(data);
    // console.log(nestData);

    var markersClusters = [];
    //创建分组函数
    function defineCluster(clusterCss) {
        var clusterObj = {};
        clusterObj.maxClusterRadius = 100;
        clusterObj.iconCreateFunction = function (cluster) {
            var childCount = cluster.getChildCount();

            var c = clusterCss;
            if (childCount < 10) {
                c += '-small';
            } else if (childCount < 70) {
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
        var title = '事故时间：' + d.time + '<br>' + '事故类型：' + defineAccidentType(d.accident) + '<br>' + '事故地点：' + d.place;
        var marker = L.marker(new L.LatLng(d.lat, d.lng), { title: title,  icon: markerIcon});
        
        marker.bindPopup(title);
        cluster.addLayer(marker);
    }

    nestData.forEach(function(d, i) {
        // 定义每组的坐标组
        markersClusters[i] = defineCluster(d.key);
        // console.log(markersClusters[i]);
        d.values.forEach(function(k) {
            // console.log(k.time);
            // 根据坐标类型选择图片
            var iconPath = iconSet[k.accident];
            // console.log(k);
            // 定义每个坐标
            defineMarker(k, markersClusters[i], iconPath);
        });
        // 添加一组坐标
        map.addLayer(markersClusters[i]);
    }); 

    //截取20项数据做表格
    var dataAccidentTable = [];
    for (var i = 0; i < 20; i++) {
                  dataAccidentTable.push(data[i]);
    };

    var accidentTable = d3.select('body').select('#accidentTable')
            .append('svg')
            .attr('width', 280)
            .attr('height', 500);

    var textAccidentTable = accidentTable
            .append('g')
            .attr('id', 'textAccidentTable');

    addText('#textAccidentTable', 'start', 0, 20, '#333', 'Microsoft Yahei', 12, 600, '类型');
    addText('#textAccidentTable', 'start', 30, 20, '#333', 'Microsoft Yahei', 12, 600, '事故地点');
    addText('#textAccidentTable', 'end', 280, 20, '#333', 'Microsoft Yahei', 12, 600, '事故时间');

    accidentTable.append('g')
        .selectAll('circle.table')
        .data(dataAccidentTable)
        .enter()
        .append('circle')
        .attr('class', 'table')
        .attr('cx', 10)
        .attr('cy', function(d, i) {
            return i * 30 + 40;
        })
        .attr('r', 7)
        .attr('fill', 'none')
        .attr('stroke', function(d) {
            return defineAccidentColor(d.accident);
        })
        .attr('stroke-width', 4);

    accidentTable.append('g')
        .selectAll('text.place')
        .data(dataAccidentTable)
        .enter()
        .append('text')
        .attr('class', 'place')
        .attr('x', 30)
        .attr('y', function(d, i) {
            return i * 30 + 45;
        })
        .text(function(d) {
            return d.place;
        });

    accidentTable.append('g')
        .selectAll('text.time')
        .data(dataAccidentTable)
        .enter()
        .append('text')
        .attr('class', 'time')
        .attr('x', 280)
        .attr('y', function(d, i) {
            return i * 30 + 45;
        })
        .text(function(d) {
            return d.time;
        });

    // dataAccidentTable.forEach(function(d, i) {
    //     drawCircle(accidentTable, d, i);
    // });
    // console.log(dataAccidentTable); 
    
    function drawCircle(container, data, sequence) {
        d3.select(container)
            .append('circle')
            .attr('cx', 10)
            .attr('cy', sequence * 30)
            .attr('r', 7)
            .attr('fill', 'none')
            .attr('stroke', function(d) {
                return defineAccidentColor(data.accident);
            })
            .attr('stroke-width', 4);
    }

    
});

//返回伤亡类型中文的函数
function defineAccidentType (accident) {
    if (accident == 'dead') {
        return '人员死亡';
    } 
    else if (accident == 'hurt') {
        return '人员受伤';
    }
    else if (accident == 'damage') {
        return '财产损失';
    }
}

//定义伤亡类型颜色的函数
function defineAccidentColor (accident) {
    if (accident == 'dead') {
        return '#F82B00';
    } 
    else if (accident == 'hurt') {
        return '#FFD100';
    }
    else if (accident == 'damage') {
        return '#1EA1D6';
    }
}



//添加文字的函数
function addText(textHolderId, textAnchor, xPosition, yPositon, fillColor, fontFamily, fontSize, fontWeight, textContent) {
    d3.select(textHolderId)
        .append('text')
        .attr('text-anchor', textAnchor)
        .attr('x', xPosition)
        .attr('y', yPositon)
        .attr('fill', fillColor)
        .attr('font-family', fontFamily)
        .attr('font-size', fontSize)
        .attr('font-weight', fontWeight)
        .text(textContent);
}
// 临时画图======


var dataSummary = {'total': 994, 'damage': 16, 'dead': 721, 'hurt': 257};
