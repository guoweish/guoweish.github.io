function resetFields(whichform) {
	for(var i=0; i<whichform.elements.length; i++) {
		var element = whichform.elements[i];
		if(element.type == "submit") continue;
		if(!element.defaultValue) continue;
		element.onfocus = function() {
			if (this.value == this.defaultValue) {
				this.value = "";
			}
		}
		element.onblur = function() {
			if (this.value == "") {
				this.value = this.defaultValue;
			}
		}
	}
	
}

function prepareForms() {
	for (var i=0; i<document.forms.length; i++) {
		var thisform = document.forms[i];
		resetFields(thisform);
	}
}

function isFilled(field) {
	if (field.value.length < 1 || field.value == field.defaultValue) {
		return false;
	} else {
		return true;
	}
}

function isEmail(field) {
	if (field.value.indexOf("@") == -1 || field.value.indexOf(".") == -1){
		return false;
	} else {
		return true;
	}
}

function validateForm(whichform) {
	for (var i=0; i<whichform.elements.length;i++) {
		var element = whichform.elements[i];
		if (element.className.indexOf("required") != -1) {
			if (!isFilled(element)) {
				alert("please fill the table");
				return false;
			}			
		}
		if (element.className.indexOf("email") != -1) {
				if (!isEmail(element)) {
					alert("elegl email address");
					return false;
				}
		}
	}
	return true;
}

function prepareForms() {
	for (var i=0; i<document.forms.length; i++) {
		var thisform = document.forms[i];
		resetFields(thisform);
		thisform.onsubmit = function() {
			return validateForm(this);
		}
	}
}

addLoadEvent(prepareForms);






















