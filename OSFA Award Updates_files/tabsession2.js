/*============================================================================*\
* File   : tabsession2.js - javascript routines for PageBaseTabSession.cs
*          This file is a copy of tabsession.js without the cookie functions.
* Author : Bob Hurt : July 2009
*
* Setup  : This code uses /sisLibrary2/javascript/cookie.js 
*-----------------------------------------------------------------------------
* 00/00/00  name
*				Description of modification
* 01/13/10  PRG -replace sisLibrary/ path with sisLibrary2/ in setup line above.
\*============================================================================*/

var ts_sWindowOpenerName = "";
if (window.opener) {
	try {
		if (String(window.opener.name).search(/^TabNumber_\d+$/) == 0) {
			ts_sWindowOpenerName = window.opener.name;
		}
	}
	catch( x ) {
		// try/catch required because access to window.opener is sometimes restricted
	}
}

ts_AddEvent(window, 'load', ts_WindowOnload);


/*------------------------------------------------------------------------------
* ts_AddEvent
*		Function for attaching a function to a specific event for a given object.
------------------------------------------------------------------------------*/
function ts_AddEvent(pObject, psEvent, pFunctionName)
{
	if (pObject.addEventListener) { 
		pObject.addEventListener(psEvent, pFunctionName, false); 
		return( true ); 
	}
	else
	if (pObject.attachEvent) {
		return( pObject.attachEvent('on'+psEvent, pFunctionName) ); 
	}
	else {
		alert
			(	"This application requires a feature that is not supported by the\n"
			+	"web browser you are using.  Please download the latest version of\n"
			+	"your web browser, or try a different browser."
			);
	}

	return( false ); 
}


/*------------------------------------------------------------------------------
* ts_AssignWindowName
*		Function for assigning a unique window.name to this tab (or window).
------------------------------------------------------------------------------*/
function ts_AssignWindowName()
{
	if (ts_sWindowOpenerName) {
		// this window was opened by another tab/window so use the opener's name
		window.name = ts_sWindowOpenerName;
		CookieSet('CurrentWindowName',window.name);
		return;
	}
	
	if (window.name.search(/^TabNumber_\d+$/) != 0) {
		var tabCount = CookieGet('TabCount');
		if ( ! tabCount) {
			tabCount = 0;
		}
		CookieSet('TabCount',++tabCount);
		window.name = 'TabNumber_'+tabCount;
	}
	
	CookieSet('CurrentWindowName',window.name);
	//window.status = 'window.name = ['+window.name+']'; //+', window.location = ['+window.location+']';//TEST
}


/*------------------------------------------------------------------------------
* ts_WindowOnload
*		Function for window.onload event, because IE7's Ctrl-N (New Window)
*		function does not invoke the window.onfocus event.
------------------------------------------------------------------------------*/
function ts_WindowOnload()
{
	ts_AssignWindowName();
	ts_AddEvent(window, 'focus', ts_AssignWindowName);
}