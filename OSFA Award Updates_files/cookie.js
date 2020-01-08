/*------------------------------------------------------------------------------
* CookieGet, CookieSet, CookieRemove
*		Functions for getting, setting and removing cookies.
*
*		NOTE: tabsession.js uses this exact code but all function names are
*		      prefixed with "ts_".  tabsession2.js should replace tabsession.js
*		      as soon as possible so the code base is not duplicated.
------------------------------------------------------------------------------*/
function CookieGet( psName )
{
	var
		i,
		arrCookies,
		sCookie,
		sNameEQ;
		
	sNameEQ = String(psName).replace(/^\s+|\s+$/g, '') + "=";
	arrCookies = document.cookie.split(';');
	for (i=0; i<arrCookies.length; i++) {
		sCookie = String(arrCookies[i]).replace(/^\s+/, '');  // remove leading spaces for indexOf() test
		if (sCookie.indexOf(sNameEQ) == 0) {
			return unescape( sCookie.substring(sNameEQ.length) );
		}
	}
	return null;
}

function CookieRemove( psName, psPath, psDomain )
{
	CookieSet(psName, 'null', -1, psPath, psDomain);
}

function CookieSet( psName, psValue, piMinutes, psPath, psDomain, psSecure )
{
	var
		arrUrlParts,
		objDateExpires,
		objDateToday,
		sCookie;
		
	if ( ! psName) {
		// cookie doesn't have a name so it can't be retrieved
		return;
	}
		
	// remove leading & trailing spaces from the name & value, just in case:
	psName = String(psName).replace(/^\s+|\s+$/g, '');
	psValue = String(psValue).replace(/^\s+|\s+$/g, '');

	// create date object (in milliseconds) with today's date & time:
	objDateToday = new Date();
	objDateToday.setTime( objDateToday.getTime() );

	/*if (piDays) {
		// convert days to milliseconds; for hours remove '*24'; for minutes also remove '*60'
		piDays = piDays * 1000 * 60 * 60 * 24;
	}*/
	if (piMinutes) {		
		piMinutes = piMinutes * 1000 * 60;  // convert minutes to milliseconds
	}
	objDateExpires = new Date(objDateToday.getTime() + piMinutes);
	
	psSecure = String(psSecure);
	if (psSecure != "true" && psSecure != "false") {
		// default 'secure' value depends on the current url:
		psSecure = (window.location.protocol == 'https:');
	}

	sCookie =
			psName +'='+ escape(psValue)
		+	( piMinutes ? '; expires=' + objDateExpires.toGMTString() : '' )
		+	( psPath ? '; path=' + psPath : '' )
		+	( psDomain ? '; domain=' + psDomain : '' )
		+	( psSecure ? '; secure' : '' )
		;
	document.cookie = sCookie;
}