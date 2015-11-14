var margin={top:20,right:120,bottom:20,left:120},width=960-margin.right-margin.left,height=1200-margin.top-margin.bottom,tooltip=d3.select("body").select("#tooltip"),header=d3.select("body").select("#head"),header1=d3.select("body").select("#header1"),budget=d3.select("body").select("#budget"),lineWidthScale=d3.scale.linear().clamp(!0).domain([40,250]).range([2,20]),departmentWidthScale=d3.scale.linear().clamp(!0).domain([4,300,500,6E3]).range([5,10,20,50]),colorScale=d3.scale.linear().clamp(!0).domain([8,
300,500,6E3]).range(["#BA1E20","#F79324","#C3D181","#38A1D6"]),formatNumber=d3.format(".2f"),i=0,duration=250,root,tree=d3.layout.tree().size([height,width]).value(function(d){return d.size}),diagonal=d3.svg.diagonal().projection(function(d){return[d.y,d.x]}),svg=d3.select("body").select("#d3").append("svg").attr("width",width+margin.right+margin.left).attr("height",height+margin.top+margin.bottom).attr("viewBox",function(){return"0,0,"+(width+margin.right+margin.left)+","+(height+margin.top+margin.bottom)}).append("g").attr("transform",
"translate("+margin.left+","+margin.top+")");
d3.csv("data/ChinaBudget-full.csv",function(d,f){function g(b){var d=tree.nodes(root).reverse(),f=tree.links(d);d.forEach(function(a){a.y=300*a.depth});var e=svg.selectAll("g.node").data(d,function(a){return a.id||(a.id=++h)}),g=e.enter().append("g").attr("class","node").attr("transform",function(a){return"translate("+b.y0+","+b.x0+")"}).on("click",k);g.append("circle").attr("r",1E-6).on("mouseover",function(a){l(a)}).on("mouseout",n).style("fill",function(a){return a._children?"lightsteelblue":"#fff"});
g.append("text").attr("x",function(a){return a.children||a._children?-15:15}).attr("dy",".35em").attr("text-anchor",function(a){return a.children||a._children?"end":"start"}).text(function(a){return a.name}).on("mouseover",function(a){l(a)}).on("mouseout",n).style("fill-opacity",1E-6);g=e.transition().duration(duration).attr("transform",function(a){return"translate("+a.y+","+a.x+")"});g.select("circle").attr("r",function(a){if(1===a.depth)return departmentWidthScale(c[a.name])/2;if(2===a.depth)return lineWidthScale(a.size)/
2;if(0===a.depth)return 10}).style("fill",function(a){if(1===a.depth)return colorScale(c[a.name]);if(2===a.depth)return colorScale(c[a.parent.name]);if(0===a.depth)return"#666"}).attr("stroke",function(a){if(1===a.depth)return colorScale(c[a.name]);if(2===a.depth)return colorScale(c[a.parent.name]);if(0===a.depth)return"#666"}).style("stroke-opacity",function(a){return 0===a.depth?.3:.8});g.select("text").style("fill-opacity",1);e=e.exit().transition().duration(duration).attr("transform",function(a){return"translate("+
b.y+","+b.x+")"}).remove();e.select("circle").attr("r",1E-6);e.select("text").style("fill-opacity",1E-6);f=svg.selectAll("path.link").data(f,function(a){return a.target.id});f.enter().insert("path","g").attr("class","link").attr("stroke-linecap","round").attr("stroke",function(a){if(1===a.target.depth)return colorScale(c[a.target.name]);if(2===a.target.depth)return colorScale(c[a.source.name])}).attr("stroke-width",function(a){if(1===a.target.depth)return departmentWidthScale(c[a.target.name])+"px";
if(2===a.target.depth)return lineWidthScale(a.target.size)+"px"}).attr("d",function(a){a={x:b.x0,y:b.y0};return diagonal({source:a,target:a})});f.transition().duration(duration).attr("stroke-linecap","round").attr("stroke",function(a){if(1===a.target.depth)return colorScale(c[a.target.name]);if(2===a.target.depth)return colorScale(c[a.source.name])}).attr("stroke-width",function(a){if(1===a.target.depth)return departmentWidthScale(c[a.target.name])+"px";if(2===a.target.depth)return lineWidthScale(a.target.size)+
"px"}).attr("d",diagonal);f.exit().transition().duration(duration).attr("stroke-linecap","round").attr("stroke",function(a){if(1===a.target.depth)return colorScale(c[a.target.name]);if(2===a.target.depth)return colorScale(c[a.source.name])}).attr("stroke-width",function(a){if(1===a.target.depth)return departmentWidthScale(c[a.target.name])+"px";if(2===a.target.depth)return lineWidthScale(a.target.size)+"px"}).attr("d",function(a){a={x:b.x,y:b.y};return diagonal({source:a,target:a})}).remove();d.forEach(function(a){a.x0=
a.x;a.y0=a.y})}function e(b){b.children&&(b._children=b.children,b._children.forEach(e),b.children=null)}function k(b){b.children?(b._children=b.children,b.children=null):(b.children=b._children,b._children=null);g(b)}function l(b){tooltip.transition().duration(200).style("opacity",.9);0===b.depth?(header.text("2015\u5e74\u4e2d\u592e\u672c\u7ea7\u9884\u7b97"),header1.text("\u5404\u90e8\u95e8\u603b\u8ba1"),budget.text("22360.52 \u4ebf\u5143")):1===b.depth?(header.text(b.name),header1.text("\u90e8\u95e8\u603b\u8ba1"),
budget.text(formatNumber(c[b.name])+" \u4ebf\u5143")):2===b.depth&&(header.text(b.name),header1.text("\u90e8\u95e8: "+b.parent.name),budget.text(formatNumber(b.size)+" \u4ebf\u5143"));tooltip.style("left",d3.event.pageX+20+"px").style("top",d3.event.pageY-10+"px")}function n(){tooltip.transition().duration(500).style("opacity",0)}_.each(f,function(b,c,e){b.size=+b.size});root=genJSON(f,["department"]);root.x0=height/2;root.y0=0;for(var c=[],h=0;h<root.children.length;h++)for(var m=c[root.children[h].name]=
0;m<root.children[h].children.length;m++)c[root.children[h].name]+=Number(root.children[h].children[m].size);root.children.forEach(e);g(root)});d3.select(self.frameElement).style("height","1200px");
function genJSON(d,f){var g=function(e){return _.map(e,function(e,d){return{name:d,children:e}})},e=function(k,l){0===l?(k.children=g(_.groupBy(d,f[0])),_.each(k.children,function(d){e(d,l+1)})):l<f.length&&(k.children=g(_.groupBy(k.children,f[l])),_.each(k.children,function(d){e(d,l+1)}));return k};return e({},0)};
