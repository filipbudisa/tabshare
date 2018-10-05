(function($){
	"use strict";

	$(document).ready(function(){
		if($("#uredivac").length === 1){
			tinymce.init({
				selector: "#uredivac",
				forced_root_blocks: "p",
				toolbar: "undo redo | bold italic | removeformat",
				menubar: false,
				statusbar: false,
				valid_elements: "p,br,b,i,strong,em"
			});
		}

		if($("#komentar").length === 1){
			tinymce.init({
				selector: "#komentar",
				forced_root_blocks: "p",
				toolbar: "undo redo | bold italic | removeformat",
				menubar: false,
				statusbar: false,
				valid_elements: "p,br,b,i,strong,em"
			});
		}
	});
})($);