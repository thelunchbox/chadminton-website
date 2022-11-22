'use strict';

var scrollDown;

(function () {
	var hasScrolled = false;
	var autoScrolled = false;
	
	window.setTimeout(function () {
		document.body.onscroll = function () {
			if (autoScrolled) autoScrolled = false;
			else hasScrolled = true;
		};
	}, 100);
	
	/*var timer = window.setTimeout(function () {
		if (!hasScrolled && document.body.scrollTop == 0) {
			easyScroll();
		}
	}, 15000);*/
	
	var scrollTarget = 0;
	var scrollRemains = Math.min(600, window.innerHeight);
	var easyScroll = function () {
		if (hasScrolled) return;
		scrollTarget += scrollRemains/10;
		scrollRemains = 9*scrollRemains/10;
		autoScrolled = true;
		window.scrollTo(0, scrollTarget);
		if (scrollRemains > 1) {
			window.setTimeout(easyScroll, 24);
		}
	};
	
	scrollDown = function () {
		//window.clearTimeout(timer);
		hasScrolled = false;
		scrollTarget = 0;
		scrollRemains = Math.min(600, window.innerHeight);
		easyScroll();
	};
})();