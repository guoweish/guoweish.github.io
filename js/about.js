function showSection(id){
	var divs = document.getElementsByTagName("div");
	for(var i=0; i<divs.length; i++){
		if(divs[i].className.indexOf("section") == -1) continue;
		if(divs[i].getAttribute("id")!=id){
			divs[i].style.display = "none";
		} else {
			divs[i].style.display = "block";
			//alert("got");
		}
	}
}

function prepareInternalnav(){
	var nav = document.getElementById("internalnav");
	//alert(typeof nav);
	var links = nav.getElementsByTagName("a");
	//alert(links.length);
	for(var i=0; i<links.length; i++){
		var sectionId = links[i].getAttribute("href").split("#")[1];
		//alert(sectionId); //get sectionId test ok
		if(!document.getElementById(sectionId)) continue;
		document.getElementById(sectionId).style.display = "none";
		links[i].destination = sectionId;
		links[i].onclick = function(){
			showSection(this.destination);
			return false;
		}
	}
}

addLoadEvent(prepareInternalnav);