function showPic(whichpic){
	if(!document.getElementById("placeholder")) return true;
	var source = whichpic.getAttribute("href");
	var placeholder = document.getElementById("placeholder");
	placeholder.setAttribute("src",source);
	var text = whichpic.getAttribute("title");
	if(!document.getElementById("description")) return false;
	var description = document.getElementById("description");
	description.firstChild.nodeValue = text;
	return false;
}

//create image place holder by dom muniputation
function preparePlaceholder(){
	if(!document.createElement) return false;
	var placeholder = document.createElement("img");
	placeholder.setAttribute("id","placeholder");
	placeholder.setAttribute("src","images/placeholder.gif");
	placeholder.setAttribute("alt","My Gallery");
	var description = document.createElement("p");
	description.setAttribute("id","description");
	var desctext = document.createTextNode("Choose Image");
	description.appendChild(desctext);
	var gallery = document.getElementById("imagegallery");
	insertAfter(description,gallery); 
	insertAfter(placeholder,description); 
}

function prepareGallery(){
	if(!document.getElementById || !document.getElementsByTagName)
		return false;
	if(!document.getElementById("imagegallery")) return false;
	var gallery = document.getElementById("imagegallery");
	var links = gallery.getElementsByTagName("a");
	for(var i=0; i<links.length; i++){
		links[i].onclick = function(){
			return showPic(this);
		}
	}
}

addLoadEvent(preparePlaceholder);
addLoadEvent(prepareGallery);