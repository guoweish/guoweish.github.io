d3.csv('data/hongbao.csv', function(data) {
    data.forEach(function(d) {
        d.money_received = +d.money_received;
        // d.hb_id = +d.hb_id;
    });
    // console.log(data);

    var nodes = [];
    var links = [];

    // d3.range(66).map(function(d, i) {
    //     var node = {name: i+1};
    //     nodes.push(node);
    // });

    data.forEach(function(d) {
        var link = {
            source: d.people_name,
            target: d.hb_id
        };
        links.push(link);
    });
    // console.log(links);

    // console.log(nodes);

    var dataNestedById = d3.nest()
        .key(function(d) {
            return d.hb_id;
        })
        .entries(data);
    // console.log(dataNestedById);
    // console.log(data);
    dataNestedById.forEach(function(d) {
        // console.log(d.key);
        var node = {name: d.key};
        nodes.push(node);
    });

    var dataNestedByPeople = d3.nest()
        .key(function(d) {
            return d.people_name;
        })
        .entries(data);
    // console.log(dataNestedByPeople);
    dataNestedByPeople.forEach(function(d) {
        // console.log(d.key);
        var node = {name: d.key};
        nodes.push(node);
    });
    // console.log(nodes);

    var forceData = {
        nodes: nodes,
        links: links
    };
    // console.log(forceData);
    var width = 1000;
    var height = 800;

    var svg = d3.select("body")
        .append("svg")
        .attr("width",width)
        .attr("height",height);

    var forceDataIndexed = addIndex(forceData);
    drawForce(forceDataIndexed, svg);

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

    function drawForce(data, svg) {
        var nodes = data.nodes;
        var edges = data.links;

        var force = d3.layout.force()
            .nodes(nodes)   //指定节点数组
            .links(edges)   //指定连线数组
            .size([width,height]) //指定范围
            .linkDistance(150)  //指定连线长度
            .charge([-300]);  //相互之间的作用力

        force.start();  //开始作用

        var color = d3.scale.category20();

        //添加连线
        var svg_edges = svg.selectAll("line")
            .data(edges)
            .enter()
            .append("line")
            .style("stroke","#eee")
            .style("stroke-width",1);

        //添加节点
        var svg_nodes = svg.selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r",5)
            .style('fill', 'gray')
            .call(force.drag);  //使得节点能够拖动

        //添加描述节点的文字
        var svg_texts = svg.selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .style("fill", "black")
            .style('font-size', 10)
            .attr('text-anchor', 'middle')
            .attr("dx", 0)
            .attr("dy", -8)
            .text(function(d){
                return d.name;
            });


        force.on("tick", function(){  //对于每一个时间间隔
            //更新连线坐标
            svg_edges.attr("x1",function(d){ return d.source.x; })
                .attr("y1",function(d){ return d.source.y; })
                .attr("x2",function(d){ return d.target.x; })
                .attr("y2",function(d){ return d.target.y; });

            //更新节点坐标
            svg_nodes.attr("cx",function(d){ return d.x; })
                .attr("cy",function(d){ return d.y; });

            //更新文字坐标
            svg_texts.attr("x", function(d){ return d.x; })
                .attr("y", function(d){ return d.y; });
        });
    }


});
