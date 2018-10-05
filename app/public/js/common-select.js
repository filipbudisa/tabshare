(function($){
	"use strict";

	$(document).ready(function(){
		$(".select p").click(function(){
			let $this = $(this);
			if($this.hasClass("selected")) return;

			let $select = $this.parent().parent();
			let $items = $this.siblings();

			let oldIndex = $this.siblings(".selected").index()+1;
			let index = $this.index()+1;

			$items.removeClass("selected");
			$this.addClass("selected");

			$select.removeClass("selected_" + oldIndex);
			$select.addClass("selected_" + index);

			$("#" + $select.data("input")).val($this.data("val"));
		});
	});
})($);