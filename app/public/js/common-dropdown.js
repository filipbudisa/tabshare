(function($){
	"use strict";

	$(document).ready(function(){
		let sourceAjax, sourceAjaxDoing = false;
		$(".dropdown.w_source input").on("input", function(){
			let $input = $(this);
			let $items = $input.parent().siblings(":not(.filter):not(.root)");
			/** @type String */
			let tekst = $input.val().toLowerCase();

			if(tekst === ""){
				$items.remove();
				return;
			}

			let $dropdown = $input.parent().parent().parent();

			let data = { text: tekst };

			let sfilter = $dropdown.data("sfilter");
			if(sfilter !== undefined){
				let sfilterData = $("#" + $dropdown.data("sfilter")).val();

				if(sfilterData === ""){
					$items.remove();
					return;
				}
				data.filter = sfilterData;
			}

			if(sourceAjaxDoing) sourceAjax.abort();
			sourceAjaxDoing = true;
			sourceAjax = $.ajax($dropdown.data("izvor"), {
				method: "post",
				data: data,
				dataType: "json",
				success: function(data, status, xhr){
					sourceAjaxDoing = false;

					$items.remove();

					if($input.val() === ""){
						return;
					}

					data.forEach(function(e){
						let $newItem = $("<li />");
						$newItem.data("val", e.val);
						$newItem.html(e.title);

						$newItem.click(dropdownClickEvent);

						$input.parent().after($newItem);
					});
				}
			});
		});

		$(".dropdown.w_filter input").on("input", function(){
			let $input = $(this);
			let $items = $input.parent().siblings(":not(.filter):not(.root)");
			/** @type String */
			let tekst = $input.val().toLowerCase();

			if(tekst === ""){
				$items.show();
				return;
			}

			$items.hide();
			$items.each(function(){
				let $item = $(this);
				if($item.text().toLowerCase().includes(tekst)) $item.show();
			});
		});


		let $dropdownCustom = $(".dropdown.a_custom input");
		$dropdownCustom.keypress(function(e){ if(e.which === 13){ e.preventDefault(); return false; } });
		$dropdownCustom.keyup(function(e){
			if(e.keyCode !== 13) return;

			e.preventDefault();

			let $input = $(this);
			let $items = $input.parent().siblings(":not(.filter)");
			/** @type String */
			let tekst = $input.val().toLowerCase();

			let $dropdown = $input.parent().parent().parent();

			let $eleInput = $("#" + $dropdown.data("input"));
			let $eleTekst = $($dropdown.find("p"));
			let chosen = false;

			$items.each(function(){
				let $item = $(this);
				if($item.text().toLowerCase() === tekst){
					$eleInput.val($item.data("val"));

					$item.siblings().removeClass("selected");
					$item.addClass("selected");

					$eleTekst.html($item.text());

					chosen = true;
				}
			});

			if(!chosen){
				$eleInput.val("new:" + $input.val());
				$eleTekst.html($input.val());
			}

			$dropdown.find("ul").slideUp();
			$dropdown.removeClass("open");

			if($dropdown.data("hideroot")){
				setTimeout(function(){
					$dropdown.find("ul li.root").hide();
				}, 500);
			}

			let sfiltering = $dropdown.data("sfiltering");
			if(sfiltering !== undefined){
				let $sfiltering = $("#" + sfiltering);
				$sfiltering.val("");

				let $sfDropdown = $sfiltering.next();
				$sfDropdown.find("p").html($sfDropdown.data("emptytext"));

				$sfDropdown.find("ul li:not(.filter):not(.root)").remove();
			}

			return false;
		});

		$(".dropdown p").click(function(){
			const $dropdown = $(this).parent();

			if($dropdown.hasClass("open")){
				$dropdown.find("ul").slideUp();
				$dropdown.removeClass("open");
			}else{
				$dropdown.find("ul").slideDown();
				$dropdown.addClass("open");
			}
		});

		function dropdownClickEvent(e){
			let $this;

			if(e instanceof $) $this = e;
			else $this = $(this);

			const $dropdown = $this.parent().parent();
			const $item = $this;

			$("#" + $dropdown.data("input")).val($item.data("val"));
			$dropdown.find("p").html($item.text());

			$item.siblings().removeClass("selected");
			$item.addClass("selected");

			$dropdown.find("ul").slideUp();
			$dropdown.removeClass("open");

			if($dropdown.data("hideroot")){
				setTimeout(function(){
					$dropdown.find("ul li.root").hide();
				}, 500);
			}

			let sfiltering = $dropdown.data("sfiltering");
			if(sfiltering !== undefined){
				let $sfiltering = $("#" + sfiltering);
				$sfiltering.val("");

				let $sfDropdown = $sfiltering.next();
				$sfDropdown.find("p").html($sfDropdown.data("emptytext"));

				$sfDropdown.find("ul li:not(.filter):not(.root)").remove();
			}
		}

		$(".dropdown ul li:not(.filter)").click(dropdownClickEvent);
	});

})($);