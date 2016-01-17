//###############################################################
//### scroll page start #########################################
$(".main").onepage_scroll({loop: false});
//### scroll page end #########################################

//###############################################################
//### viz start ###############################################
// 视口查询
// var viewportWidth = window.innerWidth; // ios safari刷新后svg图像莫名变大
// var viewportHeight = window.innerHeight;
var viewportWidth = document.documentElement.clientWidth;
var viewportHeight = document.documentElement.clientHeight;
// console.log(window.innerHeight);
// console.log(document.documentElement.clientHeight);

d3.csv('data/hongbao.csv', function(data) {
    var hongbao = {};
    var people = {};

    hongbao.money = {}; //红包id与金额
    hongbao.sender = {};//红包id与发送人
    hongbao.hongbaoHottest = {}; // 最热门的红包，红包id，抢的人数

    people.peopleHottest = {}; //最活跃多人（发、抢红包累积）人名和次数，
    people.mostSender = {}; //发最多红包的人，人名和次数
    people.mostGetter = {}; // 抢最多红包个数的人，人名和次数
    people.balance = {}; // 盈亏排名，人名与余额
    people.senderSet = d3.set(); // 红包发送者人名，去重

    var dataNestedById;
    var dataNestedByPeople;

    //红包编号和人名的堆
    var idSet;
    var peopleSet;

    data.forEach(function(d) {
        d.money_received = +d.money_received;
        // d.hb_id = +d.hb_id;
        if (d.money_received < 0) {
            hongbao.money[d.hb_id] = -d.money_received; //红包大小，id和金额
            hongbao.sender[d.hb_id] = d.people_name; //红包id和发送者
            // 统计发红包达人
            if (!people.mostSender[d.people_name]) {
                people.mostSender[d.people_name] = 1;
            } else {
                people.mostSender[d.people_name] += 1;
            }
            // 红包发送者人名，去重
            if (!people.senderSet.has(d.people_name)) {
                people.senderSet.add(d.people_name);
            }
        }
    });
    // console.log(people.mostSender);

    dataNestedById = d3.nest()
        .key(function(d) {
            return d.hb_id;
        })
        .entries(data);
    console.log(dataNestedById);

    dataNestedByPeople = d3.nest()
        .key(function(d) {
            return d.people_name;
        })
        .entries(data);
    // console.log(dataNestedByPeople);

    idSet = d3.set(dataNestedById.map(function(d) {
        return d.key;
    }));
    peopleSet = d3.set(dataNestedByPeople.map(function(d) {
        return d.key;
    }));
    // console.log(peopleSet.size()); //70

    // 红包金额比例尺
    var hongbaoMoneySizeExtent = d3.extent(d3.values(hongbao.money));
    var hongbaoMoneySizeScale = d3.scale.linear()
            .domain(hongbaoMoneySizeExtent)
            .range([2, 15]);

    // 红包热度比例尺
    dataNestedById.forEach(function(d) {
        hongbao.hongbaoHottest[d.key] = d.values.length;
    });
    var hongbaoHotExtent = d3.extent(d3.values(hongbao.hongbaoHottest));
    var hongbaoHotScale = d3.scale.linear()
            .domain(hongbaoHotExtent)
            .range([2, 15]);

    // 人的活跃度比例尺
    dataNestedByPeople.forEach(function(d) {
        // console.log(d.values.length);
        people.peopleHottest[d.key] = d.values.length;
        people.mostGetter[d.key] = d.values.length;
    });

    var peopleHotExtent = d3.extent(d3.values(people.peopleHottest));
    var peopleHotScale = d3.scale.linear()
            .domain(peopleHotExtent)
            .range([2, 10]);

    //计算抢红包达人，去除发送红包次数的统计
    for (key in people.mostGetter) {
        if (people.mostSender[key]) {
            people.mostGetter[key] -= people.mostSender[key];
        }
    }

    people.balance = d3.nest()
        .key(function(d) { return d.people_name;})
        .rollup(function(d) {
            return d3.sum(d, function(k) {
                return k.money_received;
            });
        })
        .entries(data);
    // console.log(people.balance);

    // 在这里可以做不同设备的视口设置，代替css方案
    var svgMinCanvas = d3.min([viewportWidth, viewportHeight]) - 60;
    // console.log(svgMaxCanvas);

    drawBundle(data, '#vizContainer-1', svgMinCanvas, svgMinCanvas);
    drawMatrix('#vizContainer-2', people.senderSet, dataNestedById, svgMinCanvas, svgMinCanvas);
    drawForce(data, '#vizContainer-3', svgMinCanvas, svgMinCanvas);

    //###################################################################
    //### force start #################################################


    function drawMatrix(container, senderSet, dataNestedById, svgWidth, svgHeight) {
        hongbao.senderCollection = calculateSenderCollection(senderSet);

        var uniqEdges = calculateUniqEdges(dataNestedById);

        var matrix = calculateMatrix(hongbao.senderCollection, uniqEdges);

        setMatrix(container, matrix, hongbao.senderCollection, svgWidth, svgHeight);

        function calculateSenderCollection(senderSet) {
            var senderSetArray = senderSet.values();
            var senderCollection = senderSetArray.map(function(d) {
                return {people: d};
            });
            return senderCollection;
        }

        function calculateUniqEdges(dataNestedById) {
            var edgesDuplicate = dataNestedById.map(function(d) {
                var singleIdEdgeCollection = [];

                d.values.forEach(function(obj) {
                    var edge = {};
                    // console.log(obj.money_received);
                    if (obj.money_received > 0) {
                        // console.log(obj);
                        singleIdEdgeCollection.push({
                            source: d.values[0].people_name,
                            target: obj.people_name,
                            money: obj.money_received
                        });
                    }
                })
                return singleIdEdgeCollection;
            });

            // 连线：发送人-抢的人，以id为统计，64个统计结果数组
            var edgesConnectionDuplicate = edgesDuplicate.map(function(d) {
                var edgeHash = {};
                for (x in d) {
                    var id = d[x].source + "-" + d[x].target;
                    edgeHash[id] = d[x];
                    // console.log(id);
                }
                return edgeHash;
            });

            var mergedEdgesConnectionDuplicate = d3.merge([edgesConnectionDuplicate]);

            var uniqEdges = {};
            mergedEdgesConnectionDuplicate.forEach(function(d) {
                for(key in d) {
                    // console.log(key);
                    if (!uniqEdges[key]) {
                        uniqEdges[key] = d[key];
                    } else {
                        uniqEdges[key].money += d[key].money;
                    }
                }
            });

            return uniqEdges;
        }

        function calculateMatrix(hongbaoSenderCollection, uniqEdges) {
            var matrix = [];
            for (a in hongbaoSenderCollection) {
                for (b in hongbaoSenderCollection) {
                    var grid = {
                        id: hongbaoSenderCollection[a].people + "-" + hongbaoSenderCollection[b].people,
                        x: b,
                        y: a,
                        money: 0
                    }
                    // console.log(grid);

                    if (uniqEdges[grid.id]) {
                        grid.money = uniqEdges[grid.id].money;
                    }

                    matrix.push(grid);
                    // console.log(matrix);
                }
            }
            return matrix;
        }

        function setMatrix(container, matrix, hongbaoSenderCollection, svgWidth, svgHeight) {
            var rect_width = (svgWidth - 70) / hongbaoSenderCollection.length;

            var svg = d3.select(container)
                .append("svg")
                .attr('width', svgWidth)
                .attr('height', svgHeight)
                .attr("id", "adjacencyG");

            svg.append("g")
                .attr("transform", "translate(50,40)")
                .append('rect')
                .attr('width', svgWidth - 70)
                .attr('height', svgHeight - 70)
                .attr('fill', '#222');

                var scaleSize = hongbaoSenderCollection.length * rect_width;
                var nameScale = d3.scale.ordinal()
                    .domain(hongbaoSenderCollection.map(function (el) {return el.people}))
                    .rangePoints([0,scaleSize],1);

                xAxis = d3.svg.axis().scale(nameScale).orient("top").tickSize(4);
                yAxis = d3.svg.axis().scale(nameScale).orient("left").tickSize(4);

                d3.select("#adjacencyG")
                    .append("g")
                    .attr("transform", "translate(50,40)")
                    .call(xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("transform", "translate(-10,-10) rotate(90)");

                d3.select("#adjacencyG")
                    .append("g")
                    .attr("transform", "translate(50,40)")
                    .call(yAxis);

            svg.append("g")
                .attr("transform", "translate(50,40)")
                // .attr("id", "adjacencyG")
                .selectAll("rect")
                .data(matrix)
                .enter()
                .append("rect")
                .attr('class', 'hongbao')
                .attr("width", rect_width)
                .attr("height", rect_width)
                .attr("x", function (d) {return d.x * rect_width})
                .attr("y", function (d) {return d.y * rect_width})
                .style("stroke", "#000")
                .style("stroke-width", "1px")
                .style("fill", "orange")
                .style("fill-opacity", function (d) {return d.money * .2})
                .on("mouseover", gridOver)



            // console.log(hongbaoSenderCollection.length);
            // d3.select("#adjacencyG")
            //     .append("g")
            //     .attr("transform", "translate(50,10)")
            //     .selectAll('text.matrixHorizontal')
            //     .data(hongbaoSenderCollection)
            //     .enter()
            //     .append('text')
            //     .attr('class', 'matrixHorizontal')
            //     .attr("transform",function(d, i) {
            //         return "translate(" + rect_width * i + ",0)";
            //     })
            //     .text(function(d) {
            //         return d.people;
            //     });

            function gridOver(d,i) {
                d3.selectAll("rect.hongbao")
                    .style('stroke', function(p) {
                        if (p.x == d.x || p.y == d.y) {
                            // console.log(d.y);
                            // console.log(p.x);
                            if (p.x == d.x && p.y == d.y) {
                                // console.log(d.y);
                                // console.log(d.x);
                            }
                            return '#fdd431';
                        } else {
                            return 'black';
                            // return {'stroke': 'black', 'stroke-width': '1px'};
                        }
                    })
                    // .style("stroke-width", function (p) {
                    //     return p.x == d.x || p.y == d.y ? "3px" : "1px"
                    // });
                // var selectedTick = 'tick:nth-child(' + i + ')';
                // console.log(d3.select(selectedTick));
                // d3.select(selectedTick).style('fill-opacity', 1);
            }
        }
    }
    //### force end #################################################

    //###################################################################
    //### force start #################################################
    function drawForce(data, container, svgWidth, svgHeight) {
        var nodes = [];
        var links = [];

        data.forEach(function(d) {
            var link = {
                source: d.people_name,
                target: d.hb_id
            };
            links.push(link);
        });

        dataNestedById.forEach(function(d) {
            // console.log(d.key);
            var node = {name: d.key};
            nodes.push(node);
        });

        dataNestedByPeople.forEach(function(d) {
            // console.log(d.key);
            var node = {name: d.key};
            nodes.push(node);
        });

        var forceData = {
            nodes: nodes,
            links: links
        };
        // console.log(forceData);
        var width = svgWidth;
        var height = svgHeight;

        var svg = d3.select(container)
            .append("svg")
            .attr("width",width)
            .attr("height",height - 50);

        var forceDataIndexed = addIndex(forceData);

        setForce(forceDataIndexed, svg);

        function addIndex(data) {
            var dataIndexed = {};
            var nodesArray = [];
            var nodesData = data.nodes;
            var linksData = data.links;
            var linkIndexed;

            for(keys in nodesData) {
                nodesArray.push(nodesData[keys].name);
            }

            linkIndexed = linksData.map(function(link) {
                var sourceData = link.source;
                var targetData = link.target;

                var sourceIndex = nodesArray.indexOf(sourceData);
                var targetIndex = nodesArray.indexOf(targetData);

                return {source: sourceIndex, target: targetIndex};
            });

            dataIndexed.nodes = nodesData;
            dataIndexed.links = linkIndexed;

            return dataIndexed;
        }

        function setForce(data, svg) {
            var nodes = data.nodes;
            var edges = data.links;

            var force = d3.layout.force()
                .nodes(nodes)   //指定节点数组
                .links(edges)   //指定连线数组
                .size([width-30,height-30]) //指定范围
                .linkDistance(250)  //指定连线长度
                .charge([-300]);  //相互之间的作用力

            force.start();  //开始作用

            var color = d3.scale.category20();

            //添加连线
            var svg_edges = svg.selectAll("line")
                .data(edges)
                .enter()
                .append("line")
                .style("stroke","#eee")
                .style("stroke-opacity", .1)
                .style("stroke-width",1);

            //添加节点
            var svg_nodes = svg.selectAll("circle")
                .data(nodes)
                .enter()
                .append("circle")
                .attr("r",function(d) {
                    if (idSet.has(d.name)) {
                        // 红包大小
                        // return hongbaoMoneySizeScale(hongbao.money[d.name]);
                        // 红包热度
                        return hongbaoHotScale(hongbao.hongbaoHottest[d.name]);
                    } else if (peopleSet.has(d.name)) {
                        // return 5;
                        return peopleHotScale(people.peopleHottest[d.name]);
                    }
                })
                .style('fill', function(d) {
                    // console.log(d);
                    if (idSet.has(d.name)) {
                        return 'orange';
                    } else if (peopleSet.has(d.name)) {
                        return 'gray';
                    }
                })
                .style('fill-opacity', .7)
                .on('mouseover', function(d) {
                    // console.log(d);
                })
                // .style("stroke","#eee")
                // .style("stroke-opacity", .3)
                // .style("stroke-width",1)
                .call(force.drag);  //使得节点能够拖动

            //添加描述节点的文字
            // var svg_texts = svg.selectAll("text")
            //     .data(nodes)
            //     .enter()
            //     .append("text")
            //     .style("fill", "black")
            //     .style('font-size', 10)
            //     .attr('text-anchor', 'middle')
            //     .attr("dx", 0)
            //     .attr("dy", -8)
            //     .text(function(d){
            //         return d.name;
            //     });

            force.on("tick", function(){  //对于每一个时间间隔
                //更新连线坐标
                svg_edges.attr("x1",function(d){ return d.source.x; })
                    .attr("y1",function(d){ return d.source.y; })
                    .attr("x2",function(d){ return d.target.x; })
                    .attr("y2",function(d){ return d.target.y; });

                //更新节点坐标
                svg_nodes.attr("cx",function(d){ return d.x; })
                    .attr("cy",function(d){ return d.y; });

                // //更新文字坐标
                // svg_texts.attr("x", function(d){ return d.x; })
                //     .attr("y", function(d){ return d.y; });
            });
        }

    }
    //### force end #################################################

    //###################################################################
    //### bundle start #################################################
    function drawBundle(data, container, svgWidth, svgHeight) {
        var bundleLinks = [];

        data.forEach(function(d) {
            var link = {
                source: d.hb_id,
                target: d.people_name
            };
            bundleLinks.push(link);
        });

        var nodesId = dataNestedById.map(function(d) {
            return {name: d.key};
        });
        // console.log(children);

        var nodesPeople = dataNestedByPeople.map(function(d) {
            return {name: d.key};
        });

        var nodesAll = nodesId.concat(nodesPeople);

        var bundleNodes = {
            name: '',
            children: nodesAll
        };

        var width  = svgWidth;	//SVG绘制区域的宽度
        var height = svgHeight;	//SVG绘制区域的高度

        var svg = d3.select(container)			//选择<body>
                    .append("svg")
                    .attr('id', 'diagram')			//在<body>中添加<svg>
                    .attr("width", width)	//设定<svg>的宽度属性
                    .attr("height", height);//设定<svg>的高度属性

        // //just for png background-color
        // svg.append('rect')
        //     .attr("width", width)
        //     .attr("height", height)
        //     .style('fill', 'black');

        var cluster = d3.layout.cluster()
                        .size([width *1.2, height/2])
                        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

        var bundle = d3.layout.bundle();

        var nodes = cluster.nodes(bundleNodes);
        // console.log(nodes);

        var oLinks = map(nodes, bundleLinks);
        // console.log(oLinks);

        var links = bundle(oLinks);
        // console.log(links);

        //将links中的source和target由名称替换成节点
        function map( nodes, links ){
            var hash = [];
            for(var i = 0; i < nodes.length; i++){
                hash[nodes[i].name] = nodes[i];
            }
            var resultLinks = [];
            for(var i = 0; i < links.length; i++){
                resultLinks.push({  source: hash[ links[i].source ],
                                    target: hash[ links[i].target ]
                                });
            }
            return resultLinks;
        }
        //3. 绘图
        var line = d3.svg.line.radial()
                    .interpolate("bundle")
                    .tension(.85)
                    .radius(function(d) { return d.y; })
                    .angle(function(d) { return d.x / 180 * Math.PI; });

        gBundle = svg.append("g")
                    .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

        var color = d3.scale.category20c();

        var link = gBundle.selectAll(".link")
              .data(links)
              .enter()
              .append("path")
              .attr("class", "link")
              .transition()
              .delay(function(d, i) {
                  return i * 10;
              })
              .attr("d", line);	//使用线段生成器

        var node = gBundle.selectAll(".node")
              .data( nodes.filter(function(d) { return !d.children; }) )
              .enter()
              .append("g")
              .attr("class", "node")
              .attr("transform", function(d) {
                    return "rotate(" + (d.x- 90) + ")translate(" + d.y + ")" + "rotate("+ (90 - d.x) +")";
              });

        node.append("circle")
              .attr("r", function(d, i) {
                //  return 20 + i;
                // console.log(d);
                return 2;
              })
              .style('fill', function(d) {
                  if (idSet.has(d.name)) {
                      return 'brown';
                  } else if (peopleSet.has(d.name)) {
                      return 'gray';
                  }
              });
            //   .style("fill",function(d,i){ return color(i); });

        // node.append("text")
        // 	.attr("dy",".2em")
        // 	.style("text-anchor", "middle")
        // 	.text(function(d) { return d.name; });
    }
    //### drawBundle end #################################################

    //###################################################################
    //### helper start #################################################
    //*** if in collection *****************

    //### helper end #################################################

});
