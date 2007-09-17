eXo.require('eXo.webui.UIPopup');
function UIWindow() {} ;

UIWindow.prototype.init = function(popup, isShow, posX, posY) {
	this.superClass = eXo.webui.UIPopup ;
	if(typeof(popup) == "string") popup = document.getElementById(popup) ;
	if(popup == null) return ;

	var domUtil = eXo.core.DOMUtil ;
	var uiPageDesktop = document.getElementById("UIPageDesktop") ;
	var uiApplication = domUtil.findFirstDescendantByClass(popup, "div", "UIApplication") ;
	if(!uiApplication) return ;

	if(popup.style.zIndex == "") popup.style.zIndex = ++eXo.webui.UIPopup.zIndex ;
	
	popup.onmousedown = this.mousedownOnPopup ;

	var windowPortletInfo = domUtil.findFirstDescendantByClass(popup, "div", "WindowPortletInfo") ;
	this.superClass.setPosition(popup, posX, posY) ;
	try {
		windowPortletInfo.onmousedown = this.initDND ;
	} catch(err) {
		alert("Error In DND: " + err) ;
	}
	
	var windowPortletControl = domUtil.findFirstDescendantByClass(popup, "div", "WindowPortletControl") ;
	var minimizedIcon = domUtil.findFirstDescendantByClass(windowPortletControl, "div", "MinimizedIcon") ;
	var maximizedIcon = domUtil.findFirstDescendantByClass(windowPortletControl, "div", "MaximizedIcon") ;
	var resizeArea = domUtil.findFirstDescendantByClass(popup, "div", "ResizeArea") ;
	minimizedIcon.onmouseup = this.minimizeWindowEvt ; 
	maximizedIcon.onmouseup = this.maximizeWindowEvt ;
	resizeArea.onmousedown = this.startResizeWindowEvt ;
//  eXo.desktop.UIWindow.windowMinHeight = popup.offsetHeight ;
} ;

UIWindow.prototype.fixHeight = function(portletId) {
	var portlet =document.getElementById(portletId) ;
	var delta = portlet.parentNode.offsetHeight - portlet.offsetHeight ;
	var resizeObj = eXo.core.DOMUtil.findDescendantsByClass(portlet, 'div', 'UIResizableBlock') ;
	for(var i = 0; i < resizeObj.length; i++) {
		var nHeight = parseInt(resizeObj[i].offsetHeight) + delta;
		if (nHeight < 0 ) nHeight = "0px" ;
		resizeObj[i].style.height = nHeight + 'px' ;
	}
} ;

UIWindow.prototype.mousedownOnPopup = function(evt) {
	var isMaxZIndex = eXo.desktop.UIDesktop.isMaxZIndex(this) ;
	if(!isMaxZIndex)	eXo.desktop.UIDesktop.resetZIndex(this) ;
} ;

UIWindow.prototype.maximizeWindowEvt = function(evt) {
	var domUtil = eXo.core.DOMUtil ;
	var portletWindow = domUtil.findAncestorByClass(this, "UIResizeObject") ;
	
	var uiWindow = eXo.desktop.UIWindow ;
  var uiPageDesktop = document.getElementById("UIPageDesktop") ;
  var desktopWidth = uiPageDesktop.offsetWidth  ;
  var desktopHeight = uiPageDesktop.offsetHeight  ;
  var uiResizableBlock = domUtil.findDescendantsByClass(portletWindow, "div", "UIResizableBlock") ;
  
  if(portletWindow.maximized) {
    portletWindow.style.top = uiWindow.posY + "px" ;
    portletWindow.style.left = uiWindow.posX + "px" ;
    portletWindow.style.width = uiWindow.originalWidth + "px" ;
    portletWindow.maximized = false ;
    for(var i = 0; i < uiResizableBlock.length; i++) {
      uiResizableBlock[i].style.height = uiResizableBlock[i].originalHeight + "px" ;
    }
    this.className = "ControlIcon MaximizedIcon" ;
  } else {
    uiWindow.backupObjectProperties(portletWindow, uiResizableBlock) ;
    portletWindow.style.top = "0px" ;
    portletWindow.style.left = "0px" ;
    portletWindow.style.width = "100%" ;
    var delta = eXo.core.Browser.getBrowserHeight() - portletWindow.offsetHeight ;
    for(var i = 0; i < uiResizableBlock.length; i++) {
  		uiResizableBlock[i].style.height =  (parseInt(uiResizableBlock[i].clientHeight) + delta) + "px" ;
    }
    portletWindow.maximized = true ;
    this.className = "ControlIcon RestoreIcon" ;
		eXo.desktop.UIWindow.saveWindowProperties(portletWindow);
  }
  // Re initializes the scroll tabs managers on the page
	eXo.portal.UIPortalControl.initAllManagers() ;
	
} ;

UIWindow.prototype.minimizeWindowEvt =	function(evt) {
	var DOMUtil = eXo.core.DOMUtil ;
	var popup = DOMUtil.findAncestorByClass(this, "UIDragObject") ;
	var windows = DOMUtil.getChildrenByTagName(popup.parentNode, "div") ;
	var index = 0 ;
	for(var j = 0; j < windows.length; j++) {
		if(popup == windows[j]) {
			index = j ;
			break ;
		}
	}
	var iconContainer = document.getElementById("IconContainer") ;
	var children = DOMUtil.findChildrenByClass(iconContainer, "img", "Icon") ;
	eXo.desktop.UIDesktop.showHideWindow(popup, children[index + 1]) ;
} ;
	
UIWindow.prototype.startResizeWindowEvt = function(evt) {
	var portletWindow = eXo.core.DOMUtil.findAncestorByClass(this, "UIResizeObject") ;
	var uiWindow = eXo.desktop.UIWindow ;
	if(portletWindow.maximized || uiWindow.portletWindow) return ;

	if(!evt) evt = window.event ;
	var uiPageDesktop = document.getElementById("UIPageDesktop") ;
	var uiApplication = eXo.core.DOMUtil.findFirstDescendantByClass(portletWindow, "div", "UIApplication") ;
	var hasResizableClass = eXo.core.DOMUtil.hasDescendantClass(uiApplication, "UIResizableBlock")	;
	if(hasResizableClass) uiApplication.style.overflow = "hidden" ;

	var portlet = eXo.core.DOMUtil.getChildrenByTagName(uiApplication, "div")[0] ;
	uiWindow.resizableObject = eXo.core.DOMUtil.findDescendantsByClass(portletWindow, "div", "UIResizableBlock") ;
	uiWindow.initMouseX = evt.clientX ;
	uiWindow.initMouseY = evt.clientY ;
	uiWindow.backupObjectProperties(portletWindow, uiWindow.resizableObject) ;
	uiWindow.portletWindow = portletWindow ;
	uiPageDesktop.onmousemove = uiWindow.resizeWindowEvt ;
	uiPageDesktop.onmouseup = uiWindow.endResizeWindowEvt ;
} ;

UIWindow.prototype.resizeWindowEvt = function(evt) {
	if(!evt) evt = window.event ;
//	var uiWindow = eXo.desktop.UIWindow;
//	var DOMUtil = eXo.core.DOMUtil ;
	var uiPageDesktop = document.getElementById("UIPageDesktop") ;
	var deltaX = evt.clientX - eXo.desktop.UIWindow.initMouseX ;
	var deltaY = evt.clientY - eXo.desktop.UIWindow.initMouseY ;
	var uiApplication = eXo.core.DOMUtil.findFirstDescendantByClass(eXo.desktop.UIWindow.portletWindow, "div", "UIApplication") ;
	
	eXo.desktop.UIWindow.portletWindow.style.width = Math.max(10, (eXo.desktop.UIWindow.originalWidth + deltaX)) + "px" ;
	for(var i = 0; i < eXo.desktop.UIWindow.resizableObject.length; i++) {
		eXo.desktop.UIWindow.resizableObject[i].style.height = Math.max(10,(eXo.desktop.UIWindow.resizableObject[i].originalHeight + deltaY)) + "px" ;
	}
} ;

UIWindow.prototype.endResizeWindowEvt = function(evt) {
	// Re initializes the scroll tabs managers on the page
	eXo.portal.UIPortalControl.initAllManagers() ;
	eXo.desktop.UIWindow.portletWindow = null ;
	eXo.desktop.UIWindow.resizableObject = null;
  this.onmousemove = null ;
  this.onmouseup = null ;
} ;  

//
//UIWindow.prototype.maximizeWindow = function(windowObject, clickedElement) {
//	var DOMUtil = eXo.core.DOMUtil ;
//	var UIWindow = eXo.desktop.UIWindow ;
//  var uiPageDesktop = document.getElementById("UIPageDesktop") ;
//  var desktopWidth = uiPageDesktop.offsetWidth  ;
//  var desktopHeight = uiPageDesktop.offsetHeight  ;
//  var uiApplication = DOMUtil.findFirstDescendantByClass(windowObject, "div", "UIApplication") ;
//  var uiResizableBlock = DOMUtil.findDescendantsByClass(windowObject, "div", "UIResizableBlock") ;
//
//  var resizableObject = new Array() ;
//  var tables = DOMUtil.findDescendantsByTag(windowObject, "table", resizableObject);
//  if(uiApplication != null) resizableObject.push(uiApplication) ;
//  if(uiResizableBlock != null) {
//    for(var i = 0; i < uiResizableBlock.length; i++) {
//      resizableObject.push(uiResizableBlock[i]) ;
//    }
//  }
//  
//  if(!windowObject.maximized) {
//    UIWindow.backupObjectProperties(windowObject, resizableObject) ;
//    windowObject.style.top = "0px" ;
//    windowObject.oldY = 0;
//    windowObject.style.left = "0px" ;
//    windowObject.oldX = 0;
//    windowObject.style.width = desktopWidth + "px" ;
//    windowObject.oldW = desktopWidth;
//    
//    for(var i = 0; i < resizableObject.length; i++) {
//    	if (resizableObject[i].nodeName.toLowerCase() == "table") {
//    		resizableObject[i].style.height = "auto" ;
//    	} else {
//    		resizableObject[i].style.height = (eXo.core.Browser.getBrowserHeight() - 50) + "px" ;
//    	}
//    }
//   
//    
//    windowObject.maximized = true ;
//    clickedElement.className = "ControlIcon RestoreIcon" ;
//    
//    if(eXo.core.Browser.isIE6()) {
//    	windowObject.backupUIApplicationWidth = uiApplication.offsetWidth ;
//    	uiApplication.style.width = "auto" ;
//    }
//		
//  } else {
//    windowObject.style.top = UIWindow.posY + "px" ;
//    windowObject.oldY = UIWindow.posY ;
//    windowObject.style.left = UIWindow.posX + "px" ;
//    windowObject.oldX = UIWindow.posX ;
//    windowObject.style.width = UIWindow.originalWidth + "px" ;
//    windowObject.oldW = UIWindow.originalWidth ;
//    windowObject.maximized = false ;
//    for(var i = 0; i < resizableObject.length; i++) {
//      resizableObject[i].style.height = resizableObject[i].originalHeight + "px" ;
//    }
//    clickedElement.className = "ControlIcon MaximizedIcon" ;
//    if(eXo.core.Browser.isIE6()) {
//    	uiApplication.style.width = windowObject.backupUIApplicationWidth + "px" ;
//    }
//  }
//	eXo.portal.UIPortalControl.initAllManagers() ;
//} ;

UIWindow.prototype.backupObjectProperties = function(windowPortlet, resizableComponents) {
	var UIWindow = eXo.desktop.UIWindow ;
  for(var i = 0; i < resizableComponents.length; i++) {
    resizableComponents[i].originalWidth = resizableComponents[i].offsetWidth ;
    resizableComponents[i].originalHeight = resizableComponents[i].offsetHeight ;
  }
  
  UIWindow.posX = eXo.desktop.UIDesktop.findPosXInDesktop(windowPortlet) ;
  UIWindow.posY = eXo.desktop.UIDesktop.findPosYInDesktop(windowPortlet) ;
  UIWindow.originalWidth = windowPortlet.offsetWidth ;
  UIWindow.originalHeight = windowPortlet.offsetHeight ;
} ;

UIWindow.prototype.initDND = function(e) {
	var DOMUtil = eXo.core.DOMUtil ;
  var DragDrop = eXo.core.DragDrop ;
  var clickBlock = this ;
  var dragBlock = DOMUtil.findAncestorByClass(this, "UIDragObject") ;
  
	// Can drag n drop only when the window is NOT maximized
  if(!dragBlock.maximized) {
	  
		var uiApplication = DOMUtil.findFirstDescendantByClass(dragBlock, "div", "UIApplication");
		var hiddenElements = new Array() ;
		
	  DragDrop.initCallback = function(dndEvent) {
	  	// A workaround to make the window go under the workspace panel during drag
	  	if (eXo.core.Browser.getBrowserType() == "mozilla" && DOMUtil.getStyle(uiApplication, "overflow") == "auto") {
	  		hiddenElements.push(uiApplication) ;
	  		uiApplication.style.overflow = "hidden" ;
	  	}
	  	uiAppDescendants = DOMUtil.findDescendantsByTagName(uiApplication, "div");
	  	for (var i=0; i<uiAppDescendants.length; i++) {
	  		if (DOMUtil.getStyle(uiAppDescendants[i], "overflow") == "auto") {
	  			hiddenElements.push(uiAppDescendants[i]) ;
	  			uiAppDescendants[i].style.overflow = "hidden" ;
	  		}
	  	}
	  } ;
	
	  DragDrop.dragCallback = function(dndEvent) {
	    var dragObject = dndEvent.dragObject ;
	    var dragObjectY = eXo.core.Browser.findPosY(dragObject) ;
	    var browserHeight = eXo.core.Browser.getBrowserHeight() ;
	    var browserWidth = eXo.core.Browser.getBrowserWidth() ;
	    var mouseX = eXo.core.Browser.findMouseXInPage(dndEvent.backupMouseEvent) ;
	    	    
	    if(dragObjectY < 0) {
	      dragObject.style.top = "0px" ;
	      document.onmousemove = DragDrop.onDrop ; /*Fix Bug On IE6*/
	    }
	    
	    if(dragObjectY > (browserHeight - 25)) {
	      dragObject.style.top = (browserHeight - 25) + "px" ;
	      document.onmousemove = DragDrop.onDrop ; /*Fix Bug On IE6*/
	    }
	    
		  var uiPageDesktop = document.getElementById("UIPageDesktop") ;
		  var uiPageDesktopX = eXo.core.Browser.findPosX(uiPageDesktop) ;
		  
		  /*Fix Bug On IE7, It's always double the value returned*/
		  if((eXo.core.Browser.getBrowserType() == "ie") && (!eXo.core.Browser.isIE6())) {
		  	uiPageDesktopX = uiPageDesktopX / 2 ;
		  }
		  
	    if((mouseX < uiPageDesktopX) || (mouseX > browserWidth)) {
	      document.onmousemove = DragDrop.onDrop ;
	    }
	    
	  } ;
	
	  DragDrop.dropCallback = function(dndEvent) {
	  	var dragObject = dndEvent.dragObject ;
	  	
		  //TODO Lambkin: Save properties of window
		  eXo.desktop.UIWindow.saveWindowProperties(dragBlock) ;
		  
	  	for (var i = 0; i < hiddenElements.length; i++) {
	  		hiddenElements[i].style.overflow = "auto" ;
	  	}
	  } ;
	  DragDrop.init(null, clickBlock, dragBlock, e) ;
	}
} ;

UIWindow.prototype.onControlOver = function(element, isOver) {
  var originalElementName = element.className ;
  if(isOver) {
    var overElementName = "ControlIcon Over" + originalElementName.substr(originalElementName.indexOf(" ") + 1, 30) ;
    element.className   = overElementName;
    if(element.className == "ControlIcon OverRestoreIcon"){ element.title = "Restore Down" ;}
    if(element.className == "ControlIcon OverMaximizedIcon"){element.title = "Maximize" ;}
  } else {
    var over = originalElementName.indexOf("Over") ;
    if(over >= 0) {
      var overElementName = "ControlIcon " + originalElementName.substr(originalElementName.indexOf(" ") + 5, 30) ;
      element.className   = overElementName ;
    }
  }
} ;

UIWindow.prototype.saveWindowProperties = function(object, appStatus) {
	var DOMUtil = eXo.core.DOMUtil ;
	var uiPage = DOMUtil.findAncestorByClass(object, "UIPage") ;
	var uiPageIdNode = DOMUtil.findFirstDescendantByClass(uiPage, "div", "id") ;
	containerBlockId = uiPageIdNode.innerHTML ;
	var uiResizableBlock = DOMUtil.findFirstDescendantByClass(object, "div", "UIApplication") ;
	var params ;
	if(!appStatus) {
	  params = [
	  	{name : "objectId", value : object.id},
	  	{name : "posX", value : object.offsetLeft},
	  	{name : "posY", value : object.offsetTop},
	  	{name : "zIndex", value : object.style.zIndex},
	  	{name : "windowWidth", value : object.offsetWidth},
		  {name : "windowHeight", value : uiResizableBlock.offsetHeight}
	  ] ;
	} else {
		params = [
	  	{name : "objectId", value : object.id},
		  {name : "appStatus", value : appStatus}
	  ] ;
	}
	
	ajaxAsyncGetRequest(eXo.env.server.createPortalURL(containerBlockId, "SaveWindowProperties", true, params), true) ;
} ;

eXo.desktop.UIWindow = new UIWindow() ;
