function stripTables(){
	var tables = document.getElementsByTagName("table");
	for(var i=0; i<tables.length; i++){
		var odd = false;
		var rows = tables[i].getElementsByTagName("tr");
		for(var j=0; j<rows.length; j++){
			if(odd == true){
				addClass(rows[j],"odd");
				odd = false;
			} else {
				odd = true;
			}
		}
	}
}

function highlightRows(){
	var rows = document.getElementsByTagName("tr");
	for(var i=0; i<rows.length; i++){
		rows[i].oldClassName = rows[i].className;
		rows[i].onmouseover = function(){
			addClass(this,"highlight");
		}
		rows[i].onmouseout = function(){
			this.className = this.oldClassName;
		}
	}
}

addLoadEvent(stripTables);
addLoadEvent(highlightRows);