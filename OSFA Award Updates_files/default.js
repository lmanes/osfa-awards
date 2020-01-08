/*----------------------------------------------------------------------------*\
* Modification notes at end of file
\*----------------------------------------------------------------------------*/

// global variables
var
	gaFieldChanges = []
,	gaBudgetSdbValues = [] //test5
//test-a:
	//,gbIsAwardLetterCommentFocused = false  // [11-27-06] added [10-31-19] removed
,	gbIsAwardSelectTabSkipped = false
,	gbIsBudgetCalc = false  // [01-01-18] added
,	gbIsFormChanged = false
,	gbIsFormSubmittedByFindButton = false
,	gbIsFormSubmittedByPackagingButton = false
,	gbIsMSIE = (navigator.userAgent.toLowerCase().indexOf('msie') != -1)
,	gbIsPageValid = true		// value is set within default.aspx
,	gbIsUpdateAllowed = false	// value is set within default.aspx
,	giPhotoTimer = null  // [03-26-09] added
,	giRowNum = 99
,	giSelectEnterPressedInARow = 0
,	giStudentNo = 0			// value is set within default.aspx
,	giTabQuarterDefault
,	goPopWindow
//,	goTabWindow // not currently implemented
,	gsBudgetQuarters
,	gsGoldColor = "#f0e68c"
,	gsDisplayDivUpdated
,	gsCurrentTab = ""
,	gsCurrentElementId  // [02-22-11] added
,	gsErrorImage = ""  // [01-01-18] added
,	gsMultipleOffersIndicator = "" // [04-24-08] added
,	gsPackagingIndicator = "" // [03-27-07] added
,	gsPriorAwardAction = ""
,	gsPriorElementId = ""
,	gsSelectCode = "" // [11-27-06] added
;
var gasQtrNameByCol = new Array("Summer","Autumn","Winter","Spring");
var gasQtrNameByCode = new Array("","Winter","Spring","Summer","Autumn");  // [01-01-18] added


// jQuery addition to call 'bodyLoad()' function when DOM is ready:
$(document).ready(function() {
	bodyLoad();
});


/*------------------------------------------------------------------------------
* addCommas
*		Add commas to a number string.
------------------------------------------------------------------------------*/
function addCommas(psNumber)
{
	var arr = String(psNumber).split('.');
	var re = /(\d+)(\d{3})/;
	while (re.test(arr[0])) {
		arr[0] = arr[0].replace(re, "$1,$2");
	}
	
	if (arr.length > 1) {
		return( arr[0] +"."+ arr[1] );
	}
	else {
		return( arr[0] );
	}
}



/*==============================================================================
*                           A J A X   R O U T I N E S
==============================================================================*/

/*------------------------------------------------------------------------------
* ajax_init_{tab div id}_content  [02-22-11]
*		Initial javascript for the content of tab_<name>.aspx.  The name of the
*		function is specific: "ajax_init_" followed by the name of the div which
*		contains the tab's content, followed by "_content".
------------------------------------------------------------------------------*/
function ajax_init_tabBudgetDiv_content()
{
	bgt_Initialization();
}
function ajax_init_tabDocumentsDiv_content()
{
	doc_Initialization();
}
function ajax_init_tabMultipleOffersDiv_content()
{
	// run the various calculation routines as needed
	mo_BudgetCalculation();
	for (q=0; q<4; q++) {
		awardTableCalculateTotal($('#txt'+gasQtrNameByCol[q]+'_2_1'),true);
		awardTableCalculateTotal($('#txt'+gasQtrNameByCol[q]+'_3_1'),true);
	}
		
	var $div = $('#tabMultipleOffersDiv');
	
	if (gsDisplayDivUpdated) {
		$("#divMOUpdated" + gsDisplayDivUpdated).show();
		gsDisplayDivUpdated = null;  // reset so other tabs can use it
	}

	/* // make 'updated' text go away after 5 seconds
	var obj = $div.find('div.temporaryDisplay:visible');
	if (obj.length > 0) {
		obj.delay(5000).slideUp(500);
	}*/
}

/*------------------------------------------------------------------------------
* ajaxFormInitialization  [04-24-08]
*		Called after ajax has inserted html into a tab.
------------------------------------------------------------------------------*/
function ajaxFormInitialization(pId)
{
	//console.log("ajaxFormInitialization(" + pId + ")");//TEST
	if ($J(gsCurrentTab).css('display') == 'none') {
		// apparently the current tab isn't available now, so change to the main tab which has data
		gsCurrentTab = 'tabWorksheet';
		tabChange(gsCurrentTab);
		return;
	}


	var i;
	
	$J(gsCurrentTab).attr('loaded','true');

	// [04-24-08] add onchange/onclick code to all form fields
	// $(..) returns DOM elements:
	var arrElem = $("input:visible,select:visible", "#"+pId);
	for (i=0; i<arrElem.length; i++) {
		if ((arrElem[i].type)
		&&  (String(arrElem[i].type) != "undefined")) {
			if (( !gbIsUpdateAllowed)
			||  (giStudentNo == -1  &&  gsCurrentTab != 'tabDocuments')) { // [03-28-11]
				// disable all elements in all tabs, except for specific exceptions
				if (String(arrElem[i].id) != "dropMOApplications") {
					arrElem[i].setAttribute("disabled","true");
				}
			}
			
			$(arrElem[i])
				.blur(function(){ fieldBlur(this); })
				.focus(function(){ fieldFocus(this); });
			
			// [01-01-18] added outer if{}
			if (gsCurrentTab != "tabBudget") {
			if (( ! arrElem[i].onchange)
			&&  (arrElem[i].type.search(/^(text|radio|select)/) == 0)) {
				arrElem[i].onchange = function() { fieldChange(); };
				continue;
			}

			if (( ! arrElem[i].onclick)
			&&  (arrElem[i].type == 'checkbox')) {
				arrElem[i].onclick = function() { fieldChange(); };
				continue;
			}
		}
	}
	}
	//setTimeout(alert(S),250);//TEST
}

/*------------------------------------------------------------------------------
* ajaxFormSubmit
*		Submit a tab form's data using ajax.
------------------------------------------------------------------------------*/
function ajaxFormSubmit(source)
{
	var
		F=[],
		sDivId,
		sFormFields="",
		sSel,
		sUrl;
		
		
	switch( gsCurrentTab )
	{
		case 'tabBudget':
			sUrl = '/sisOSFA/securid/tab_budget_update.aspx';
			break;
		case 'tabMultipleOffers':
			sUrl = '/sisOSFA/securid/tab_multoffers.aspx';
			break;
		case 'tabDocuments':  // [02-22-11] added
			sUrl = '/sisOSFA/securid/tab_documents.aspx';
			break;
		case 'tabResources':  // [10-31-19] added
			sUrl = '/sisOSFA/securid/tab_resources.aspx';
			break;
		default:
			console.error("ajaxFormSubmit called with unexpected currentTab name \"" + gsCurrentTab + "\"");
			return;
	}

	
	sDivId = gsCurrentTab +'Div';
	sSel = 'div#' + sDivId + ' ';
	
	// build F array
	//F = $('#__CSRFTOKEN'); // [04-01-11] added for CSRF validation
	//$.merge(F, $(sSel+'input,'+sSel+'select,'+sSel+'textarea'));
	F = $(sSel + 'input,' + sSel + 'select,' + sSel + 'textarea');
	$.merge(F, $("input[type='checkbox']","#pnlTestDisplay:visible")); // for test purposes only
	
	// process F array
	F.not("[disabled]").each( function(index,field) {
		if (field.name) { // form field must have name to get submitted
				if ((field.type == 'checkbox')
				||  (field.type == 'radio')) {
					if (field.checked) {
						// escape() works better than encodeURI() which leaves '#' untouched
						sFormFields += '&'+ field.name +'='+ escape(field.value);
					}
				}
				else {
					// escape() works better than encodeURI() which leaves '#' untouched
					sFormFields += '&'+ field.name +'='+ escape(field.value);
				}
		}
	});
	if (source && source.id) {
		sFormFields += "&" + source.id + "=Y";
	}
	//console.log('ajaxFormSubmit:[ ' + sFormFields + ' ]');//TEST

	modalProcessingShow();

	$.ajax
		({	url: sUrl
		,	cache: false
		,	type: 'post'
		,	data: sFormFields
		,	dataType: 'html'
		,	timeout: 10000  // 10 seconds
		,	error: function(jqXHR) { ajaxRequestError(jqXHR,sDivId); }
		,	success: function(data,textStatus,jqXHR) { ajaxRequestSuccess(jqXHR,sDivId); }
		});
		
	// in case the page blows and leaves the modal sitting there...
	setTimeout("modalProcessingHide();",10000); // 10 seconds
}

/*------------------------------------------------------------------------------
* ajaxInitializeContent  [02-22-11]
*		The element 'spanAjaxContentComplete' is added by PageBaseTab.sisTabRender
*		as the very last element in the ajax content.  This function waits for
*		that element to be present, looks for a function with a given name
*		that will initialize the new content, and then executes the function if
*		it is available.
------------------------------------------------------------------------------*/
function ajaxInitializeContent(pAjaxId)
{
	var elem = $('#spanAjaxContentComplete');
	if (elem.length == 0) {
		setTimeout("ajaxInitializeContent('"+ pAjaxId +"')", 50);
		return;
	}
	
	// unset the id so the next ajax load will work
	elem.attr('id', '');
	
	// remove updated/error/warning text, if visible
	elem = $('div.temporaryDisplay:visible','#'+pAjaxId);
	if (elem.length > 0) {
		elem.hide();
	}

	ajaxFormInitialization(pAjaxId);
	
	var sFunctionName = 'ajax_init_'+ pAjaxId +'_content';  // i.e. ajax_init_tabDMultipleOffersDiv_content
	if (eval( "typeof "+ sFunctionName +" == 'function'" )) {
		eval( sFunctionName+'();' );
	}
}

/*------------------------------------------------------------------------------
* ajaxRequestError
*		Function called when the ajax process receives an error.
------------------------------------------------------------------------------*/
function ajaxRequestError(pJqXHR, pId)
{
	var elem = $J(pId);
	if (elem.length > 0) {
		var sHTML =
				"<p class='labelError'>Data cannot be retrieved.\nHTTP "
			+	pJqXHR.status+" - "+pJqXHR.statusText
			//+	pJqXHR.responseText
			+	"</p>"
			;
		elem.html(sHTML);
	}
	modalProcessingHide();
}

/*------------------------------------------------------------------------------
* ajaxRequestSuccess
*		Function called when the ajax process completes successfully.
------------------------------------------------------------------------------*/
function ajaxRequestSuccess(pJqXHR, pId)
{
	// [01-01-18] checks for TAB_IN_ERROR and PAGE_REFRESH
	var html = pJqXHR.responseText;
	//console.log("ajaxRequestSucces("+pId+"); pJqXHR.responseText:\n" + html);//TEST

	//if ( ! html.startsWith("<!TAB_IN_ERROR>")) {  // doesn't work in IE11-
	if (html.indexOf("<!TAB_IN_ERROR>") === 0) {
		$J(gsCurrentTab).addClass("tabError");
	} else {
		$J(gsCurrentTab).removeClass("tabError");
	}

	//if (html.startsWith("<!PAGE_REFRESH>")) {  // doesn't work in IE11-
	if (html.indexOf("<!PAGE_REFRESH>") === 0) {
		// entire page needs to be refreshed, to refresh upper table
		modalProcessingHide(); // req'd for ensuing .click() to work
		document.forms[0].bttnSubmitFind.click();
		modalProcessingShow(); // display again; page refresh will remove it
		return;
	}

	var $div = $J(pId);
	if ($div.length > 0) {
		$div.hide().html(pJqXHR.responseText);
		ajaxInitializeContent(pId);  // [02-22-11] in case a load method was created for this content
		$div.fadeIn(200);
	}
	modalProcessingHide();
}

/*------------------------------------------------------------------------------
* ajaxTabLoad
*		Insert provided url's html into the current tab's <div> element.
------------------------------------------------------------------------------*/
function ajaxTabLoad(pUrl)
{
	var sDivId = gsCurrentTab + 'Div';

	$.ajax
		({	url: pUrl
		,	cache: false
		,	type: 'get'
		,	dataType: 'html'
		,	timeout: 10000  // 10 seconds
		,	error: function(jqXHR) { ajaxRequestError(jqXHR,sDivId); }
		,	success: function(data,textStatus,jqXHR) { ajaxRequestSuccess(jqXHR,sDivId); }
		});
}

/*==============================================================================
*                   E N D   O F   A J A X   R O U T I N E S
==============================================================================*/

/*------------------------------------------------------------------------------
* alertDialog
*		Uses jQuery UI dialog to display modal alerts.
------------------------------------------------------------------------------*/
var gbIsAlertDialogCreated = false;
function alertDialog(pAlertMessage)
{
	var objWin = $("#divAlertDialog");

	if ( ! gbIsAlertDialogCreated) {
		// create the alert dialog
		objWin.dialog({
			autoOpen: false,
			modal: true,
			width: 350,
			closeOnEscape: false,
			draggable: false,
			resizable: false,
			buttons: { 'OK': function(){ $(this).dialog('close'); $('#txtFindStudentKey').focus(); } }
		});
		gbIsAlertDialogCreated = true;
	}
	
	$("#spanAlertText",objWin).html(pAlertMessage);
	objWin.dialog("open");
}


/*------------------------------------------------------------------------------
* awardTableActionForAll
*		Mark all awards with the given action, where valid.
*		Note: pTarget is a jQuery object.
------------------------------------------------------------------------------*/
function awardTableActionForAll(pTarget,pEventChar)
{
	var
		i,q,
		aeAwardNumbers,
		aMatch,
		elem,
		iTableNum;
		
	aMatch = pTarget.attr('id').match(/^txt(Summer|Autumn|Winter|Spring)_(\d+)_(\d+)/);
	if (aMatch == null)
		return;
		
	iTableNum = aMatch[2];
		
	aeAwardNumbers = document.getElementsByName('txtAwardNumber_'+iTableNum,$('#tblAwards_'+iTableNum));
	for (i=0; i<aeAwardNumbers.length; i++) {
		for (q=0; q<4; q++) {
			elem = $('#txt'+ gasQtrNameByCol[q] +'_'+ iTableNum +'_'+ aeAwardNumbers[i].value);
			awardTableKeypressApply(elem,pEventChar);
		}
		
		// feed recalculateTotal() the Summer field
		awardTableCalculateTotal($('#txtSummer_'+ iTableNum +'_'+aeAwardNumbers[i].value),false);
	}

	for (q=0; q<4; q++) {
		awardTableCalculateTotalQuarters(iTableNum,gasQtrNameByCol[q]);
	}
}


/*------------------------------------------------------------------------------
* awardTableActionForQuarter
*		Perform an action for all quarters.
*		Note: pTarget is a jQuery object.
------------------------------------------------------------------------------*/
function awardTableActionForQuarter(pTarget,pEventChar)
{
	var
		i,
		aeAwardNumbers,
		aMatch,
		elem,
		iRowNum,
		iTableNum,
		sQuarterName;
		
	aMatch = pTarget.attr('id').match(/^txt(Summer|Autumn|Winter|Spring)_(\d+)_(\d+)/);
	if (aMatch == null)
		return;
	
	//sFieldName = pTarget.attr('id').substr(0,9);	
	sQuarterName = aMatch[1];
	iTableNum = aMatch[2];
	iRowNum = aMatch[3];
	aeAwardNumbers = document.getElementsByName('txtAwardNumber_'+iTableNum,$('#tblAwards_'+iTableNum));
	
	for (i=0; i<aeAwardNumbers.length; i++) {
		elem = $('#txt'+ sQuarterName +'_'+ iTableNum +'_'+ aeAwardNumbers[i].value);
		awardTableKeypressApply(elem,pEventChar);
		
		// feed recalculateTotal() the Summer field
		awardTableCalculateTotal($('#txtSummer_'+ iTableNum +'_'+aeAwardNumbers[i].value),false);
	}

	awardTableCalculateTotalQuarters(iTableNum,sQuarterName);
}


/*------------------------------------------------------------------------------
* awardTableActionForYear
*		Perform an action for all quarters.
*		Note: pTarget is a jQuery object.
------------------------------------------------------------------------------*/
function awardTableActionForYear(pTarget,pEventChar)
{
	var
		q,
		aMatch,
		elem,
		iRowNum,
		iStartQ = -1,
		iTableNum,
		sName;
	
	aMatch = pTarget.attr('id').match(/^txt(Summer|Autumn|Winter|Spring)_(\d+)_(\d+)$/);
	if (aMatch == null)
		return;
		
	iTableNum = aMatch[2];
	iRowNum = aMatch[3];
	
	for (q=0; q<4; q++) {
		if (pTarget.attr('id') == 'txt'+ gasQtrNameByCol[q] +'_'+ iTableNum +'_'+ iRowNum) {
			iStartQ = q;
			break;
		}
	}
	
	for (q=iStartQ; q<4; q++) {
		elem = $('#txt'+ gasQtrNameByCol[q] +'_'+ iTableNum +'_'+ iRowNum);
		awardTableKeypressApply(elem,pEventChar);

		if (q > iStartQ) { // recalculateTotal() gets the iStartQ quarter
			awardTableCalculateTotalQuarters(iTableNum,gasQtrNameByCol[q]);
		}
	}
}


/*------------------------------------------------------------------------------
* awardTableCalculateTotal
*		Change the total for an award, along with the combined award total and
*		the quarterly totals.
*		Note: pTarget is a jQuery object
------------------------------------------------------------------------------*/
function awardTableCalculateTotal(pTarget,pbIsQuarterTotalsNeeded)
{
	if (( ! pTarget) || ( ! pTarget.attr('id')))
		return;
		
	var
		q,
		aMatch,
		elem,
		fAmount,
		fTotal = 0,
		iRowNum,
		iTableNum,
		sAmount,
		sCellID,
		sQuarterName;

	aMatch = pTarget.attr('id').match(/^txt(Summer|Autumn|Winter|Spring)_(\d+)_(\d+)$/);
	if (aMatch == null)
		return;
		
	/* cents are currently not allowed
	if (pTarget.val().search(/\.\d{3}/) != -1) {
		formatCurrency(pTarget);
	} */
	
	sQuarterName = aMatch[1];
	iTableNum = aMatch[2];
	iRowNum = aMatch[3];
	sCellID = iTableNum +"_"+ iRowNum;
		
	for (q=0; q<4; q++) {
		elem = $('#txt'+ gasQtrNameByCol[q] +"_"+ sCellID);
		if (elem.length > 0 && elem.val()) {
			sAmount = String(elem.val());
			fAmount = parseFloat(sAmount);
			if ( ! isNaN(fAmount)) { 
				// this is a valid amount
				if (sAmount.charAt(sAmount.length - 1).search(/[CR]/) == -1) {
				// either not table#1 (OSFA Awards, main tab) or it's not being Canceled/Rejected
					fTotal += fAmount;
				}
			}
		}
	}

	$('#cellAwardTotal_'+sCellID).html(addCommas(fTotal));
	awardTableCalculateTotalAllAwards(iTableNum);
	
	if (String(pbIsQuarterTotalsNeeded) != 'false') {
		awardTableCalculateTotalQuarters(iTableNum,sQuarterName);
	}
}


/*------------------------------------------------------------------------------
* awardTableCalculateTotalAllAwards
*		Calculate the total for the given table for all awards.
------------------------------------------------------------------------------*/
function awardTableCalculateTotalAllAwards(piTableNum)
{
	var
		i,
		aeTotals,
		fPackageTotal = 0,
		fTotal = 0,
		objTable;

	objTable = $('#tblAwards_'+piTableNum);
	
	aeTotals = document.getElementsByName('cellAwardTotal_'+piTableNum, objTable);
	for (i=0; i<aeTotals.length; i++) {
		// Number can't deal with commas in the numeric string, so remove them
		fTotal += Number(aeTotals[i].innerHTML.replace(/,/g,''));
	}	
	$('#cellTotal_'+piTableNum).html('$'+ addCommas(fTotal));
	
	/* // [04-24-08] Make remaining need & equity change as the award total changes
	if (piTableNum == 1) {
		fTotalChange = gfOriginalTotalAwardAmount - fTotal;
		fRemainingAmount = parseInt(giOriginalRemainingNeed + fTotalChange);
		if (fRemainingAmount < 0) {
			fRemainingAmount = 0;
		}
		$('#litRemainingNeed').html(addCommas(fRemainingAmount));
		fRemainingAmount = parseInt(giOriginalRemainingEquity + fTotalChange);
		if (fRemainingAmount < 0) {
			fRemainingAmount = 0;
		}
		$('#litRemainingEquity').html(addCommas(fRemainingAmount));
	}
	*/
	
	// [03-27-07] added if{}
	if ((piTableNum == 1)
	&&  (gsPackagingIndicator.search(/[EY]/) == 0)) {
		aeTotals = document.getElementsByName('cellPackageAwardTotal_1',objTable);
		for (i=0; i<aeTotals.length; i++) {
			// Number can't deal with commas in the numeric string, so remove them
			fPackageTotal += Number(aeTotals[i].innerHTML.replace(/,/g,''));
		}	
		elem = $('#cellTotalPackageOffer_1');
		if (elem.length > 0) {
			elem.html('$'+ addCommas(String(fPackageTotal)));
			elem.attr('class', 'cellTextPackageAward colorPackageAward');
		}
	}
}


/*------------------------------------------------------------------------------
* awardTableCalculateTotalQuarters
*		Calculate the total awards for a given quarter.
------------------------------------------------------------------------------*/
function awardTableCalculateTotalQuarters(piTableNum,psQuarterName)
{
	var
		i,
		aeAwardNumbers,
		elem,
		fPackageTotal = 0,  // [03-27-07] added
		fTotal = 0,
		fAmount,
		sAmount;
		
	aeAwardNumbers = document.getElementsByName('txtAwardNumber_'+piTableNum,$('#tblAwards_'+piTableNum));
	for (i=0; i<aeAwardNumbers.length; i++) {
		elem = $('#txt'+ psQuarterName +"_"+ piTableNum +"_"+ aeAwardNumbers[i].value);
		if ( elem.length == 0 || ! elem.val()) {
			continue;
		}

		sAmount = String(elem.val());
		fAmount = parseFloat(sAmount);
		if ( ! isNaN(fAmount)) {
			// this is a valid amount
			if (sAmount.charAt(sAmount.length - 1).search(/[CR]/) == -1) {
			// either not table#1 (OSFA Awards, main tab) or it's not being Canceled/Rejected
				fTotal += fAmount;
			}
		}
		
		// [03-27-07] added if{}
		if ((piTableNum == 1)
		&&  (gsPackagingIndicator.search(/[EY]/) == 0)) {
			elem = $('#cell'+ psQuarterName +'PackageAward_'+ piTableNum +"_"+ aeAwardNumbers[i].value);
			if (elem.length > 0) {
				fAmount = parseFloat(elem.html().replace(/,/g,''));
				if ( ! isNaN(fAmount)) {
					fPackageTotal += fAmount;
				}
			}
		}
	}

	elem = $('#cell'+ psQuarterName +'Total_'+piTableNum).html('$'+ addCommas(fTotal));
	if ((piTableNum == 1)
	&&  (gsPackagingIndicator.search(/[EY]/) == 0)) { // [03-27-07] added
		elem = $('#cell'+ psQuarterName +'PackageTotal_'+piTableNum);
		if (elem.length > 0) {
			elem.html('$'+ addCommas(fPackageTotal));
			elem.attr('className', 'cellTextPackageAward colorPackageAward');
		}
	}
}


/*------------------------------------------------------------------------------
* awardTableDetail
*		Hide or display all detail for a particular award.
------------------------------------------------------------------------------*/
function awardTableDetail(piAwardNum)
{
	var
		i,
		aeAwardDetail,
		elem,
		sName;
	
	sName = "rowAwardDetail"+ piAwardNum;
	aeAwardDetail = $('#'+sName,$('#tblAwards_1'));
	if (aeAwardDetail.length == 0) {
		return;
	}
	
	elem = $('#imageAwardDetail');
	if (aeAwardDetail[0].style.display == 'none') {
		elem.attr('src', '/sisOSFA/images/collapse.gif');
	}
	else {
		elem.attr('src', '/sisOSFA/images/expand.gif');
	}
	
	for (i=0; i<aeAwardDetail.length; i++) {
		$(aeAwardDetail[i]).toggle();
	}
}


/*------------------------------------------------------------------------------
* awardTableDetailAll
*		Hide or display all detail for a all awards.
------------------------------------------------------------------------------*/
function awardTableDetailAll()
{
	var
		i,j,
		aeAwardDetail,
		aeAwardNumbers,
		elem,
		sName;
	
	elem = $('#imageAwardDetail');
	if (elem.attr('src').indexOf("expand") > 0) {
		elem.attr('src', '/sisOSFA/images/collapse.gif');
	}
	else {
		elem.attr('src', '/sisOSFA/images/expand.gif');
	}

	aeAwardNumbers = document.getElementsByName('txtAwardNumber_1',$('#tblAwards_1'));
	for (i=0; i<aeAwardNumbers.length; i++) {
		sName = "rowAwardDetail"+ aeAwardNumbers[i].value;
		aeAwardDetail = document.getElementsByName(sName,$('#tblAwards_1'));
		for (j=0; j<aeAwardDetail.length; j++) {
			$(aeAwardDetail[j]).toggle(); // reverse hidden/visible
		}
	}
}


/*------------------------------------------------------------------------------
* awardTableKeypress
*		Process keystrokes within the award textboxes.
*		Note: pTarget is a jQuery object.
------------------------------------------------------------------------------*/
function awardTableKeypress(pTarget,pEventChar,pIsSelectRequested)
{
	var
		aMatch,
		iRowNum,
		iTableNum;
		
	aMatch = pTarget.attr('id').match(/^txt(Summer|Autumn|Winter|Spring)_(\d+)_(\d+)$/);
	
	if ((aMatch == null)
	||  (pEventChar.search(/\d/) == 0)) {
		return awardTableKeypressExit(true,"","");
	}
	
	iTableNum = aMatch[2];
	iRowNum = aMatch[3];
	
	/* disable cents, for now
	if (pEventChar == ".") {
		if (pTarget.val().indexOf(".") != -1)  // already a decimal
			return awardTableKeypressExit(false,"","");
		else
			return awardTableKeypressExit(true,"","");
	} */
	
	if (pEventChar == "N") {
		awardTableRowAdd(pTarget);
		return awardTableKeypressExit(false,pTarget.attr('id'),pEventChar);
	}
	
	if (pEventChar.search(/[GQY]/) == 0) {
		return awardTableKeypressExit(false,pTarget.attr('id'),pEventChar);
	}

	var elem = $('#editSelect_'+iTableNum+'_'+iRowNum);
	if (elem.length > 0  &&  elem.val() == 'D') {
		// do not allow changes if award is being deleted
		return awardTableKeypressExit(false,"","");
	}
	
	if (gsPriorElementId != pTarget.attr('id')) {
		gsPriorAwardAction = ""; // unset the prior action if focus moved to a different field
	}

	// the gsPriorAwardAction check allows GQ actions from within a new award amount
	var bIsNewAward = (elem && (elem.val() == 'N') && (gsPriorAwardAction.search(/[GQ]/) == -1)); // don't exclude Y
	
	if ((bIsNewAward && (pEventChar.search(/[TU]/) == -1))
	||  ( ! bIsNewAward && (pEventChar.search(/[ACDRTU]/) == -1))) {
		// existing awards allow a few more choices
		return awardTableKeypressExit(false,"","");
	}
	
	if ((pEventChar == "U")
	&&  (gsPriorAwardAction.search(/[gqy]/) == 0)) {
		// apply the last modifier to the Undo action
		gsPriorAwardAction = gsPriorAwardAction.toUpperCase();
	}

	if (pEventChar == "T") { // Total divvy between quarters
		divvyAmountTotal(pTarget,pEventChar);
		gsPriorAwardAction = "Y";
	}
	else
	if (pEventChar == "D") { // Detail
		if (gsPriorAwardAction.search(/[GQ]/) == 0) {
			awardTableDetailAll();
		}
		else {
			awardTableDetail(iRowNum);
		}
	}
	else
	if (gsPriorAwardAction == "G") {
		awardTableActionForAll(pTarget,pEventChar);
	}
	else
	if (gsPriorAwardAction == "Q") {
		awardTableActionForQuarter(pTarget,pEventChar);
	}
	else
	if (gsPriorAwardAction == "Y") {
		awardTableActionForYear(pTarget,pEventChar);
	}
	else {
		awardTableKeypressApply(pTarget,pEventChar);
	}
	
	if (pEventChar.search(/[CR]/) == 0) {
		awardTableCalculateTotal(pTarget);
	}
	
	pTarget.select(); // eliminates MSIE's appearance of losing focus
	return awardTableKeypressExit(false,pTarget.attr('id'),pEventChar);
}

function awardTableKeypressExit(pbReturnValue,psPriorId,psPriorAction)
{
	gsPriorElementId = psPriorId;

	if ((psPriorAction.search(/[ACRT]/) == 0)
	&&  (gsPriorAwardAction.search(/[GQY]/) == 0)) {
		// save the modifier [GQY] in case user decides to U-undo
		gsPriorAwardAction = gsPriorAwardAction.toLowerCase();
	}
	else {
		gsPriorAwardAction = psPriorAction;
	}
	
	return pbReturnValue;
}


/*------------------------------------------------------------------------------
* awardTableKeypressApply
*		Apply the keypress to the target award amount
*		Note: pTarget is a jQuery object.
------------------------------------------------------------------------------*/
function awardTableKeypressApply(pTarget,pEventChar)
{
	if ( ! awardTableKeypressValid(pTarget,pEventChar)) {
		return;
	}
	
	if (pEventChar == "U") {
		pTarget.val(pTarget.attr('orig_value'));
		return;
	}
	
	var sValue = pTarget.val();
	if ( ! isNaN(sValue)) {
		// value is a number so just append char
		pTarget.val(sValue + pEventChar);
	}
	else if (sValue.length > 1) {
		// assume the last char is non-numeric and replace it
		pTarget.val(sValue.substr(0,(sValue.length - 1)) + pEventChar);
	}
	/* // don't allow update to a blank value
	else {
		pAwardTarget.val(pEventChar);
	} */
	
	fieldChange(); // seems to be needed here
}


/*------------------------------------------------------------------------------
* awardTableKeypressValid
*		Validate the keypress against the target award field
*		Note: pTarget is a jQuery object.
------------------------------------------------------------------------------*/
function awardTableKeypressValid(pTarget,pEventChar)
{
	if (pEventChar == "U") {
		// Undo is always valid
		return true;
	}

	if ((parseFloat(pTarget.val()) == 0)
	||  (pEventChar.search(/[ACRU]/) != 0)) {
		return false;
	}
	
	var aMatch = String(pTarget.attr('id')).match(/^\D+_(\d+)_\d+$/);
	if (aMatch == null) {
		return true;
	}
	
	var iTableNum = aMatch[1];
	
	var iOrigAmount = pTarget.attr('orig_value');
	var sAwardStatus = pTarget.attr('award_status');

	if (pEventChar == "A") { // Accept
		if ((iTableNum == 1)
		&&  (sAwardStatus.search(/[ADZ]/) == -1)) {
			// cannot Accept if the award is Accepted, Disbursed or authoriZed (accepted)
			return true;
		}
	}
	else if (pEventChar == "C") { // Cancel
		if ((Number(iOrigAmount) > 0)
		&&  (sAwardStatus != "D")) {
			// award must be non-zero and not Disbursed in order to cancel
			return true
		}
	}
	else if (pEventChar == "R") { // Reject
		if ((iTableNum == 1)
		&&  (Number(iOrigAmount) > 0)
		&&  (sAwardStatus.search(/[DZ]/) == -1)) {
			// award must be non-zero and not Disbursed/Authorized in order to reject
			return true
		}
	}
	
	return false;
}


/*------------------------------------------------------------------------------
* awardTableMoveUpDown
*		Allows user to move up and down among the award quarter amount fields
------------------------------------------------------------------------------*/
function awardTableMoveUpDown(piKeyCode,psQuarter,piTable,piRow)
{
	var
		i,
		aeAwardNumbers,
		aiAwardNumbers = new Array(),
		elem,
		iCurrentIndex = -1,
		sTargetPreId;
		
	aeAwardNumbers = $("#tblAwards_"+piTable).find("input[name='txtAwardNumber_"+piTable+"']");
	sTargetPreId = 'txt'+ psQuarter +'_'+ piTable +'_';
	
	// create an int array of non-disabled elements
	for (i=0; i<aeAwardNumbers.length; i++) {
		elem = $J(sTargetPreId + aeAwardNumbers[i].value);
		if (elem.length == 1  &&  !elem.attr('disabled')) {
			aiAwardNumbers.push(aeAwardNumbers[i].value);
		}
	}
	if (aiAwardNumbers.length < 2) {
		// there are no other enabled rows to move to
		return;
	}
	
	for (i=0; i<aiAwardNumbers.length; i++) {
		if (aiAwardNumbers[i] == piRow) {
			iCurrentIndex = i;
		}
	}
	if (iCurrentIndex == -1) {
		return;
	}
	
	if (piKeyCode == 38) {  // up arrow
		--iCurrentIndex;
		if (iCurrentIndex < 0) {
			iCurrentIndex = aiAwardNumbers.length - 1;
		}
	}
	else {  //down arrow
		++iCurrentIndex;
		if (iCurrentIndex == aiAwardNumbers.length) {
			iCurrentIndex = 0;
		}
	}
	
	elem = $D(sTargetPreId + aiAwardNumbers[iCurrentIndex]);
	if (elem) {
		elem.focus();
		elem.select();
	}
}


/*------------------------------------------------------------------------------
* awardTableRowAdd
*		Add a new row to the Outside Aid table on the Multiple Offers tab.
------------------------------------------------------------------------------*/
function awardTableRowAdd(pButton)
{
	var
		i,c,q,
		aAwardNumbers,
		aMatch,
		iLastRow,
		iNumCols,
		iNumRows,
		iTableNum,
		objRow,
		objTable,
		sButtonID,
		sCellID,
		sInnerHtml,
		sRowID;
		
	if (String(pButton) == "undefined") {
		iTableNum = 1;
	}
	else {
		aMatch = String(pButton.id).match(/^\D+_(\d+)/);
		if (aMatch == null)
			return;
		iTableNum = aMatch[1];
	}

	//objTable = $('#tblAwards_'+iTableNum); // not ready for jQuery object
	objTable = $D('tblAwards_'+iTableNum);
	
	aAwardNumbers = document.getElementsByName('txtAwardNumber_'+iTableNum,objTable);
	if (((iTableNum == 1) && (aAwardNumbers.length == 20))
	||  ((iTableNum == 2) && (aAwardNumbers.length == 8))
	||  ((iTableNum == 3) && (aAwardNumbers.length == 20))) {
		alert
			(	'The maximum number of awards allowed in this table is '
			+	aAwardNumbers.length
			+	' awards.'
			);
		return;
	}

	iNumRows = objTable.rows.length;
	for (i=0; i<iNumRows; i++) {
		if (objTable.rows[i].id == 'rowAwardTotals_'+iTableNum) {
			iLastRow = i;
			break;
		}
	}

	iNumCols = objTable.rows[1].cells.length;
	objRow = objTable.insertRow(iLastRow);
	sRowID = "newRow" + ++giRowNum;
	objRow.setAttribute("id",sRowID);
	objRow.setAttribute("class", "newRow");

	for (i=0; i<iNumCols; i++) {
		objRow.insertCell(i);
		objRow.cells[i].className = "cellText borderSidesNone";
		objRow.cells[i].setAttribute("align","right");
	}
	
	sCellID = iTableNum +"_"+ giRowNum;

	c = 0;
	objRow.cells[c].setAttribute("align","center");
	objRow.cells[c].innerHTML = "<span class='fontNewAward'>New award</span>";
	++c;
	
	objRow.cells[c].setAttribute("align","center");
	sInnerHtml =
			"<input type='hidden' id='editSelect_"+ iTableNum +"_"+ giRowNum
		+"' name='editSelect_"+ iTableNum +"_"+ giRowNum +"' value='N'>" 
//test		+	"<img src='/sisOSFA/images/closeX.gif' border='0' class='imageLink'"
		+	"<img src='/sisOSFA/images/closeX.gif' border='0' class='imageLink' style='vertical-align:middle;'"
		+	" id='imgX_"+ sCellID
		+	"' onclick='awardTableRowDelete(this)'"
		//+	" clickevent='awardTableRowDelete(this)'" // [11-27-06] custom clickevent not used
		+	" title='Remove this award'"
		+	" onmouseover='src=\"/sisOSFA/images/closeXover.gif\"'"
		+	" onmouseout='src=\"/sisOSFA/images/closeX.gif\"' />"
		+	" <input type='hidden' name='txtAwardNumber_"+ iTableNum +"' value='"+ giRowNum
		+	"'><input type='text' style='margin:2px'"
		+	" id='txtAwardText_"+ sCellID +"' name='txtAwardText_"+ sCellID
		+	"' onchange='fieldChange();' onfocus='fieldFocus(this);' onblur='fieldBlur(this)'"
		;
	if (iTableNum == 1) { // OSFA Awards on main tab
		sInnerHtml += " maxlength='6' size='7' class='inputText center'>";
	}
	else
	if (iTableNum == 2) { // Outside Aid on Multiple Offers tab
		sInnerHtml += " maxlength='15' size='16' class='inputText'>";
	}
	else
	if (iTableNum == 3) { // OSFA Awards on Multiple Offers tab
		sInnerHtml += " maxlength='6' size='7' class='inputText center' valid_input='numeric'>";
	}
	objRow.cells[c].innerHTML = sInnerHtml;
	
	++c;
	for (q=0; q<4; q++) {
		sInnerHtml =
				"<input name='txtAwardAmount_"+ sCellID
			+	"' id='txt"+ gasQtrNameByCol[q] +"_"+ sCellID
			+	"' type='text' class='inputText right' value='0' orig_value='0'"
			+	" onkeyup='awardTableCalculateTotal($(this))' onchange='fieldChange();'"
			+	" onfocus='fieldFocus(this);' onblur='fieldBlur(this)'"
			+	" title='Special Key Functions:"
			+		"\n   T - divide Total into budget quarters"
			+		"\n   U - Undo changes'"
			;
		if (iTableNum == 1) {
			sInnerHtml += " maxlength='9' size='8'>";
		}
		else {
			sInnerHtml	+= " maxlength='6' size='5'>";
		}
		objRow.cells[c+q].innerHTML = sInnerHtml;
	}
	
	c += 4;
	objRow.cells[c].innerHTML = 
			"&nbsp; <span id='cellAwardTotal_"+ sCellID
		+	"' name='cellAwardTotal_"+ iTableNum +"'>0</span>"
		;
		
	++c;
	objRow.cells[c].setAttribute("align","center");
	if (iTableNum == 2) { // Outside Aid on Multiple Offers tab
		objRow.cells[c].innerHTML =
				"<input type='checkbox' name='chkEFC_"+ sCellID +"' id='chkEFC_"+ sCellID
			+	"' onclick='fieldChange();'"
			+	">"
			;
	}

	$('#txtAwardText_'+ sCellID).focus();
}


/*------------------------------------------------------------------------------
* awardTableRowDelete
*		Delete the row for adding outside aid on the Multiple Offers tab
*		Note: pTargetDOM is a regular DOM object, not a jQuery object.
------------------------------------------------------------------------------*/
function awardTableRowDelete(pTargetDOM)
{
	var
		i,q,
		aMatch,
		elem,
		iRowNum,
		iTableNum,
		objTable;

	aMatch = String(pTargetDOM.id).match(/^\D+_(\d+)_(\d+)$/);
	if (aMatch == null)
		return;
	
	iTableNum = aMatch[1];
	iRowNum = aMatch[2];	
	objTable = $D('tblAwards_'+iTableNum);
	
	for (i=0; i<objTable.rows.length; i++) {
		// [05-03-11] added if{} block checking for headerRow
		if (objTable.rows[i].id == "headerRow"+iRowNum) {
			objTable.deleteRow(i);
			--i; // ugly
		}
		else
		if (objTable.rows[i].id == "newRow"+iRowNum) {
			objTable.deleteRow(i);
			break;
		}
	}
	
	awardTableCalculateTotalAllAwards(iTableNum);
	for (q=0; q<4; q++) {
		awardTableCalculateTotalQuarters(iTableNum,gasQtrNameByCol[q]);
	}	

	elem = $('#txt'+ gasQtrNameByCol[giTabQuarterDefault-1] +'_'+ iTableNum +'_1');
	if (elem.length > 0) {
		elem.focus();
		elem.select();
	}
}


/*------------------------------------------------------------------------------
* awardTableSelect
*		Apply the selected action to the award quarters.
*		Note: pTargetDOM is a regular DOM object, not a jQuery object.
------------------------------------------------------------------------------*/
function awardTableSelect(pTargetDOM)
{
	var
		i,q,
		aeInputs,
		aMatch,
		elem,
		iRowNum,
		iTableNum,
		sSuffix,
		sTargetValue,
		sValue;

	sTargetValue = String(pTargetDOM.value);
	if (sTargetValue.search(/[ACDRU]/) != 0) {
		return;
	}

	aMatch = String(pTargetDOM.id).match(/^editSelect_(\d+)_(\d+)$/);
	if (aMatch == null) {
		return;
	}
	
	iTableNum = aMatch[1];
	iRowNum = aMatch[2];
	sSuffix = '_'+ iTableNum +'_'+ iRowNum;

	$('#rowAward'+sSuffix).css('background-color', ((sTargetValue == "D") ? "#ffd0d0" : ""));
		
	// disable or enable all INPUT/text elements for this row as needed
	//aeInputs = $('#rowAward'+sSuffix+' input'); //was disabling input/hidden; not good
	aeInputs = $('#rowAward' + sSuffix + ' input[type=text]');  // [10-31-19] added "[type=text]"
	for (i=0; i<aeInputs.length; i++) {
		aeInputs[i].disabled = (sTargetValue == "D") ? true : false;
	}

	for (q=0; q<4; q++) {
		elem = $('#txt'+ gasQtrNameByCol[q] + sSuffix); // _1_ = table#1 = OSFA Awards on main tab
		if (sTargetValue.search(/[DU]/) == 0) {
			elem.val(elem.attr('orig_value')); // Undo; reset the values
			if (sTargetValue == "D") {
				sValue = elem.val();
				if (sValue > 0) {
					elem.val(sValue + "C");
				}
				fieldChange();
			}
		}
		else {
			awardTableKeypressApply(elem,sTargetValue);
		}
		
		awardTableCalculateTotalQuarters(iTableNum,gasQtrNameByCol[q]);
	}
	
	// feed recalculateTotal() the Summer field
	awardTableCalculateTotal($('#txtSummer'+sSuffix),false);
}


/*------------------------------------------------------------------------------
* awardTableSelectNoTab
*		Operate the checkbox image associated with the award drop-down menu
*		which determines if the Tab key stops at the menu or not.
------------------------------------------------------------------------------*/
function awardTableSelectNoTab()
{
	var elem = $('#imageCheckboxSelect');
	if (elem.attr('src').indexOf("checkboxOn.gif") != -1) {
		elem.attr('src', '/sisOSFA/images/checkboxOff.gif');
		gbIsAwardSelectTabSkipped = true;
	}
	else {
		elem.attr('src', '/sisOSFA/images/checkboxOn.gif');
		gbIsAwardSelectTabSkipped = false;
	}
	awardTableSelectSetTabIndex();
}


/*------------------------------------------------------------------------------
* awardTableSelectSetTabIndex
*		Sets the tab-index attribute of the award select drop-down menu.
------------------------------------------------------------------------------*/
function awardTableSelectSetTabIndex()
{
	var
		i,
		aeInputs;
	
	//aeInputs = $('#tblAwards_1').getElementsByTagName('select');
	aeInputs = $('#tblAwards_1 select');
	for (i=0; i<aeInputs.length; i++) {
		if (aeInputs[i].id.indexOf("editSelect") == 0) {
			aeInputs[i].tabIndex = (gbIsAwardSelectTabSkipped) ? -1 : 0;
		}
	}
}


/*------------------------------------------------------------------------------
* Routines and variables to blink an element for a set time using the css
* definitions 'errorMessageVisible' and 'errorMessageInvisible'.
* [11-22-06] added all 'blink' code
* [11-27-06] revised blink code to accept 2 additional parameters.
*		Note: pTarget is a jQuery object.
------------------------------------------------------------------------------*/
var	blinkElement
	,	blinkStartTime
	,	blinkTotalTime
	;
function errorMessageBlink(pTarget,pTimeInMS,pIntervalInMS,pIsError)
{
	if (String(setTimeout) == "undefined") {
		// we can't do anything without setTimeout
		return;
	}
	
	var sVisibleClass; // [11-27-06] added
	if (String(pIsError) == "false") {
		sVisibleClass = "visible";
	}
	else { // anything but 'false' results in red text (error)
		sVisibleClass += "visible red";
	}
	
	pTarget.attr('class', sVisibleClass);
	blinkElement = pTarget;
	blinkTotalTime = pTimeInMS;
	blinkStartTime = new Date().getTime();
	setTimeout("errorMessageBlinkLoop('"+ sVisibleClass +"',"+ pIntervalInMS +")",pIntervalInMS);
}
function errorMessageBlinkLoop(pVisibleClass,pIntervalInMS)
{
	if (blinkElement.attr('class') == pVisibleClass) {
		blinkElement.attr('class', 'invisible');
	}
	else {
		blinkElement.attr('class', pVisibleClass);
	}

	var iCurr = new Date().getTime();
	if ((iCurr - blinkStartTime) < blinkTotalTime) {
		setTimeout("errorMessageBlinkLoop('"+ pVisibleClass +"',"+ pIntervalInMS +")",pIntervalInMS);
	}
	else {
		blinkElement.attr('class', pVisibleClass);
	}
}


/*------------------------------------------------------------------------------
* bodyLoad
*		Any client-side javascript that should execute when the page loads should
*		be placed here.
------------------------------------------------------------------------------*/
function bodyLoad()
{
	var
		i,q,
		elem,
		sAwardYear;

	updateTimestamp();

	sAwardYear = $('#txtAwardYear').val();
	if (sAwardYear.search(/^\d{4}$/) == 0) {
		var iYear = Number(sAwardYear);
		if (iYear < 2012) {
			// Documents tab shouldn't be available prior to 2012
			if (gsCurrentTab == 'tabDocuments') {
				gsCurrentTab = 'tabWorksheet';
				tabChange(gsCurrentTab);
			}
			$('#tabDocuments').hide();
			$('#tabDocumentsSpacer').css("display","none");//hide();
		}
	}
	
	// [04-24-08] make 'Multiple Offers' tab visible
	if (gsMultipleOffersIndicator) {
		$('#tabMultipleOffersSpacer').css('display', '');
		var elem = $('#tabMultipleOffers');
		elem.css('display', '');
		if (gsMultipleOffersIndicator == 'Z') {
			var aMatch = elem.html().match(/^<span>([^<]+)<\/span>$/i);
			if (aMatch != null) {
				elem.html('<span>'+ aMatch[1] +'*</span>');
			}
		}
	}

	// [02-22-11] load initial html into each tab's div area
	$('#tblTabs td.tab').each(function() {
			if (this.id) {
				elem = $J(this.id);
				elem.keydown(function(event) { tabMove(event); });
				elem.click(function (event) { tabChange(this.id, event); });
				if (this.id != 'tabWorksheet') {
					elem = $J(this.id+'Div');
					elem.hide();
					elem.html("<br/><br/><center><table><tr><th>loading...</th><th>&nbsp;</th><th><img src='/sisOSFA/images/animated_activity.gif' alt=''/></th></tr></table></center><br/><br/>");
				}
			}
		});
	
	// get the current tab from the cookie, or default to the Worksheet tab
	gsCurrentTab = CookieGet('CurrentTab');
	/* //test - code not currently implemented
	if (window.name != "OSFA_Duplicate_Tab") {
		var parentTab = CookieGet("ParentTabOfDuplicateTab");
		if (parentTab) {  // user ctrl-clicked on a tab; don't use that tab
			gsCurrentTab = parentTab;
			CookieRemove("ParentTabOfDuplicateTab");
		}
	} //*/
	if ( ! gsCurrentTab) {
		gsCurrentTab = 'tabWorksheet';
gsCurrentTab = 'tabBudget';//test-remove when going to production
	}
	tabChange(gsCurrentTab);
	
	// disable update elements for inquiry-only
	if (( ! gbIsUpdateAllowed)
	||  (giStudentNo == -1)) { // [03-28-11] -1 means valid student with no student number
		for (i=6; i<document.forms[0].length; i++) {  // 6 is the first element after txtAwardYear
			if ((document.forms[0][i].id)
			&&  (document.forms[0][i].id != "bttnSubmitFind")
			&&  (document.forms[0][i].id.charAt(0) != "_")) {
				$J(document.forms[0][i].id).attr('disabled','true');
			}
		}
		if (gbIsUpdateAllowed && giStudentNo == -1) { // [03-28-11] added
			// user can update, valid student, so re-enable the Photo button
			$('#bttnPhoto').removeAttr('disabled');
		}
	}
	else
	if (gsPackagingIndicator) { // [03-27-07] added 'if{}' block
		if (gsPackagingIndicator == "Y") {
			$('#litAPackageFormula').parent().addClass('colorPackageAward');
			$('#cellAwardPackagingButton').addClass('colorPackageAward');
			$('#bttnAwardPackaging').val('Accept Package');
		}
		else if (gsPackagingIndicator == "U") {
			$('#litAPackageFormula').parent().css('background-color', gsGoldColor);
			$('#cellAwardPackagingButton').css('background-color', gsGoldColor);
			elem = $('#bttnAwardPackaging');
			elem.attr('disabled','true');
			elem.val('Package Accepted');
			// F0 E6 8C  -  E0 D0 90 (why is this here...?)
			$('#txtRepackageAwards').val('Y'); // hidden field
		}
		else {
			$('#bttnAwardPackaging').attr('disabled','true');
		}
	}

	if ( ! gbIsPageValid) {
		$('#tabWorksheet').attr('class', 'tab tabError');
		
		/* cool, but shocking (saving for future use/reference)
		for (var i=0; i<document.styleSheets.length; i++)
			if (document.styleSheets[i].href.search(/sisOSFA\/css\/default.css/i) != -1) {
				var objRules = document.styleSheets[i].rules;  // IE
				if ( ! objRules) objRules = document.styleSheets[i].cssRules;  // Firefox/Mozilla
				for (var j=0; j<objRules.length; j++) {
					if (objRules[j].selectorText) {
						if (objRules[j].selectorText.search(/(page|tab)Active/) != -1) {
							objRules[j].style.backgroundColor = "#e00000";
						}
					}
				}
			}
		// */
	}

	// fill all of the award totals
	var aeAwardNumbers = document.getElementsByName('txtAwardNumber_1',$('#tblAwards_1'));
	for (i=0; i<aeAwardNumbers.length; i++) {
		// feed recalculateTotal() the Summer field
		awardTableCalculateTotal($('#txtSummer_1_'+aeAwardNumbers[i].value),false);
	}
	// fill all 4 of the quarters totals
	for (q=0; q<4; q++) {
		awardTableCalculateTotalQuarters(1,gasQtrNameByCol[q]);
	}	
	awardTableCalculateTotalAllAwards(1); // grand total

	// [10-31-19] added
	var disp = CookieGet('MainDataTableDisplay');
	if (disp == "none") {
		toggleMainData(0);
	}

	disp = CookieGet('CalculatedAmountsDisplay');
	if (disp == "none") {
		toggleDiv('CalculatedAmounts');
	}
	
	giTabQuarterDefault = CookieGet('TabQuarterDefault');
	if (isNaN(String(giTabQuarterDefault))) {
		giTabQuarterDefault = 2;  // default is Autumn
	}
	setTabQuarterDefault(giTabQuarterDefault);
	
	// cookie value is a string, so convert it to a boolean with a string compare:
	gbIsAwardSelectTabSkipped = (CookieGet('IsAwardSelectTabSkippedDefault') == "true");
	if (gbIsAwardSelectTabSkipped) {
		awardTableSelectNoTab();
		awardTableSelectSetTabIndex();
	}
	
	// add 'blur' and 'focus' function to all form elements
	// $(..) returns DOM elements:
	var arrElem = $("input:visible,select:visible");
	for (i=0; i<arrElem.length; i++) {
		if ((arrElem[i].type)
		&&  (String(arrElem[i].type) != "undefined")) {
			$(arrElem[i])
				.blur(function(){ fieldBlur(this); })
				.focus(function(){ fieldFocus(this); })
				;
		}
	}
	
	// [03-27-07]
	if (gsPackagingIndicator == "Y") {
		scrollToAwards('bttnAwardPackaging');
		//document.forms[0].bttnAwardPackaging.focus();
	}
	else {
		document.forms[0].txtFindStudentKey.focus();
	}
	
	try {
		$('#imgPhotoID').attr('src', '/sisOSFA/securid/photoid.aspx?regid='+gsRegID);
	} catch(x) { /* gsRegID may not exist, so use try/catch */ }
	
	// [03-26-09] added YAHOO.OSFA.PhotoID container code
	// [03-28-11] replaced YUI code with jQuery code
	$('#divPhoto')
			.mouseover(function(){ photoShow(); })
			.mouseout(function(){ photoHideBegin(); })
			.click(function(){ photoHideComplete(); })
		;
	$('#bttnPhoto')
			.mouseover(function(){ photoShow(); })
			.click(function(){ photoShow(); })
		;
	
	// [02-22-11] added
	// if showAnim is not '', Tab-Tab may be so fast the datepicker remains showing
	$.datepicker.setDefaults({ dateFormat: 'm/dd/y', showAnim: '' });
	
gsErrorImage = "/sisOSFA/images/redcow.gif";//test-remove when going to production
/*//test - uncomment for production surprise
	var ms = new Date().getMilliseconds();
	if (ms < 500) {
		gsErrorImage = "/sisOSFA/images/redcow.gif";
	}
	else if (ms < 625) {
		gsErrorImage = "/sisOSFA/images/reddino.png";
	}
	else if (ms < 750) {
		gsErrorImage = "/sisOSFA/images/redelephant.png";
	}
	else if (ms < 875) {
		gsErrorImage = "/sisOSFA/images/redpig.png";
	}
	else {
		gsErrorImage = "/sisOSFA/images/redrhino.png";
	}
*/
	if (gsCurrentTab == 'tabWorksheet') {
		var $div = $('#tabWorksheetDiv');
		if (gsDisplayDivUpdated) {
			var $div2 = $div.find('#divUpdated' + gsDisplayDivUpdated);
			if (gsDisplayDivUpdated == "Error") {
				$div2.find("img").attr("src", gsErrorImage);
			}
			$div2.show()
			gsDisplayDivUpdated = null;  // reset so other tabs can use it
		}
		if ($('#spanUpdatedWarningText').html() > '') {
			$div.find('#divUpdatedWarning').show();
		}
		/* // make 'updated' text go away after 5 seconds
		var obj = $div.find('div.temporaryDisplay:visible');
		if (obj.length > 0) {
			obj.delay(5000).slideUp(500);
		}*/
	}

	// [02-22-11] setup the timeout dialog
	$("#divTimeoutDialog").dialog({
		autoOpen: false,
		modal: true,
		width: 350,
		closeOnEscape: false,
		draggable: false,
		resizable: false,
		buttons: {
			'Yes, Keep Working': function(){ $(this).dialog('close'); },
			'No, Logoff': function(){
					// fire whatever the configured onTimeout callback is.
					// using .call(this) keeps the default behavior of "this" being the warning
					// element (the dialog in this case) inside the callback.
					$.idleTimeout.options.onTimeout.call(this);
				}
			}
	});

	// [02-22-11] added session timeout widget
	if (giStudentNo != 0) {  // giStudentNo value of -1 means valid std w/no std number
		// cache a reference to the countdown element so we don't have to query the DOM for it on each ping.
		var spanCountDown = $("#spanTimeoutCountdown");
		
		// start the idle timer plugin
		$.idleTimeout('#divTimeoutDialog', '#divTimeoutDialog + div.ui-dialog-buttonpane button:first', {
			idleAfter: 900, // in seconds, 15 minutes
			warningLength: 60, // number of seconds to show logout warning
			onCountdown: function(counter){ spanCountDown.html(counter); },
			onIdle: function(){ $(this).dialog("open"); },
			onResume: function(){ focusOnCurrentElement(); },
			onTimeout: function(){
					// 1 min = .0006944 of one day (CookieSet takes days)
					if (giStudentNo > 0) {
						CookieSet('SessionExpired', giStudentNo, 0.0006944); //expire in one minute
					} else {
						CookieSet('SessionExpired', 0, 0.0006944);
					}
					window.location = "/sisOSFA/securid/default.aspx";
				}
		});

		// [01-01-18] add "override" classes to main table
		var overrideDetailFound = false;
		var $table = $("#tblMain");
		$table.find("td.cellText > div.override").each(function () {
			overrideDetailFound = true;
			$(this).parent().addClass("override").click(function () {
				$(this).toggleClass("collapse").prev().find("div.override").toggleClass("collapse");
			});
		});
		if ( ! overrideDetailFound) {
			$("#ancTOD").hide();
	}
	}
	else {
		var sSessionExpiredValue = CookieGet('SessionExpired');
		if (sSessionExpiredValue) {
			CookieRemove('SessionExpired');
			if (sSessionExpiredValue.search(/^\d{5,7}$/) == 0) {
				$('#txtFindStudentKey').val( sprintf("%07s",sSessionExpiredValue) );
			}
			alertDialog("Your Web525 session has expired.");
		}
	}

	/* //test - code not currently implemented
	if (window.name == "OSFA_Duplicate_Tab") {
		// disable EVERY VISIBLE INPUT AND BUTTON:
		$("input:visible,select:visible,button:visible").attr("disabled","true");
		$("#txtFindStudentKey").blur(); // otherwise, yellow background
		var tab = $("#" + gsCurrentTab);
		// use CSS instead? Different CSS?
		tab.css("background-color", "black");
		$("span", tab).css("color", "white");
	} //*/

	if ((typeof(gsUWNetID) == "string") && (gsUWNetID == "twold")) {
		// "OSFA Awards" tab animation for Tim Wold; he's special
		var $tab = $("#tabWorksheet");
		$tab.find("span").css("width",$tab.css("width")).css("display","block").css("text-align","center")
			.html("TIMMY!").delay(5000).animate({opacity:0},400,function(){$(this).html("OSFA Awards").animate({opacity:1},400);});
}
}


/*------------------------------------------------------------------------------
* bodyUnload
*		Any client-side javascript that should execute when the page unloads
*		should be placed here.
------------------------------------------------------------------------------*/
function bodyUnload()
{
	CookieSet('TabQuarterDefault',giTabQuarterDefault,30);
	CookieSet('IsAwardSelectTabSkippedDefault',gbIsAwardSelectTabSkipped,30);

	if (window.goPopWindow) {
		window.goPopWindow.close();
	}
	/* //test - code not currently implemented (should it ever be?)
	if (window.goTabWindow) {
		window.goTabWindow.close();
	} //*/
}


/*------------------------------------------------------------------------------
* checkboxEnhancedFocus [01-01-18]
*		Enhance visibility when checkbox has focus.
------------------------------------------------------------------------------*/
function checkboxEnhancedFocus(evt)
{
	if (String(evt.type) == "focus") {
		$(this).parent().addClass("checkbox_focus");
	} else {
		$(this).parent().removeClass("checkbox_focus");
	}
	}
	
	
/*------------------------------------------------------------------------------
* datepickerFix  [02-22-11]
*		A few minor helper functions for the jQuery UI datepicker widget.
------------------------------------------------------------------------------*/
function datepickerFix(evt)
{
	//if (evt.which==32 || evt.which==45 || evt.which==46) {  // 32:' ' 45:'-' 46:'.'
	if (evt.keyCode==32 || evt.keyCode==45 || evt.keyCode==46) {  // 32:' ' 45:'-' 46:'.'
		evt.preventDefault();
		$(this).val($(this).val()+'/');
	}
}
function datepickerSelect()
{
	$(this).trigger(jQuery.Event("keyup")); // hides datepicker in all but IE
}


/*------------------------------------------------------------------------------
* divvyAmountTotal
*		If edits cleared, divide the amount entered into the remaining quarters.
*		Note: pTarget is a jQuery object.
------------------------------------------------------------------------------*/
function divvyAmountTotal(pTarget,pEventChar)
{
	if ((parseFloat(pTarget.val()) == 0)
	||  (pTarget.attr('award_status') == 'D')) {
		// $0 awards and disbursed awards cannot use Total key function
		return;
	}

	var
		q,
		aMatch,
		iBase,
		iNumQuarters = 0,
		iRowNum,
		iStartQ = -1,
		iTableNum,
		iTotalAmount = 0,
		f1,f2,
		sCellID,
		sName,
		sTempBudgetQuarters,
		sValue;
	var asQuarterCode = new Array("X","F","W","S");
			
	aMatch = pTarget.attr('id').match(/^txt(Summer|Autumn|Winter|Spring)_(\d+)_(\d+)$/);
	if (aMatch == null)
		return;
		
	iTableNum = aMatch[2];
	iRowNum = aMatch[3];
	sCellID = '_'+ iTableNum +'_'+ iRowNum;

	if (gsPriorAwardAction == "Y") {
		// assume that all quarters are in play, not just the Budget Quarters on record
		sTempBudgetQuarters = "XFWS";
	}
	else {
		if (iTableNum == 1) {
			sTempBudgetQuarters = gsBudgetQuarters;
		}
		else {
			sTempBudgetQuarters = "";
			if (iTableNum == 3) { // OSFA Awards on Multiple Offers tab
				for (q=0; q<4; q++) {
					if ($('#chkMOBudgetQuarter'+gasQtrNameByCol[q]).attr('checked')) {
						sTempBudgetQuarters += asQuarterCode[q];
					}
				}
			}
		}
	}
	
	if ( ! sTempBudgetQuarters) {
		return;
	}
	
	for (q=0; q<4; q++) {
		sName = 'txt'+ gasQtrNameByCol[q] +sCellID;
		sValue = $J(sName).val();
		if (isNaN(sValue)) {
			alert
				(	"Award amount cannot be divided because one or\n"
				+	"more quarters already has an action associated\n"
				+	"with it."
				);
			return;
		}
		if (sName == pTarget.attr('id')) {
			iTotalAmount = Number(sValue) * 100;
			iStartQ = q;
		}
		if ((iStartQ != -1)
		&&  (sTempBudgetQuarters.indexOf(asQuarterCode[q]) != -1)) {
			// start qtr has been found, and this quarter is one of the budget quarters
			++iNumQuarters;
		}
	}
	
	if (sTempBudgetQuarters.indexOf(asQuarterCode[iStartQ]) == -1) {
		alert
			(	"Award amount cannot be divided because this quarter is not\n"
			+	"one of the indicated Budget Quarters ("+	sTempBudgetQuarters +").\n\n"
			+	"The 'Y-T' hotkey sequence will divide the amount regardless\n"
			+	"of the indicated Budget Quarters.\n"
			);
		return;
	}

	iBase = (Math.round(iTotalAmount / iNumQuarters / 100 - 0.5)) * 100; // divides into whole dollars
	
	//for (q=iStartQ; q<4; q++) [
	// [08-08-06 RMH] go in reverse so higher amounts are put in the early quarters
	for (q=3; q>=iStartQ; q--) {
		if (sTempBudgetQuarters.indexOf(asQuarterCode[q]) == -1) {
			// set quarter to zero if it's not in the Budget Quarters, and continue
			$('#txt'+ gasQtrNameByCol[q] +sCellID).val(0);
			continue;
		}
		
		--iNumQuarters;
		if (iNumQuarters == 0) {
			// the remaining amount goes into the final remaining quarter
			sValue = iTotalAmount / 100;
		}
		else {
			sValue = iBase / 100;
			iTotalAmount -= iBase;
		}
	
		if (String(sValue).search(/\.\d$/) != -1) {
			// for example, 123.5 --> 123.50
			sValue += "0";
		}
		$('#txt'+ gasQtrNameByCol[q] +sCellID).val(sValue);
	}
	
	// It's possible for the first quarter to be $2-3 more than the other quarters.
	// If so, subtract $1 from the first and add it to the others as needed.
	// Example: $3500 in FWS: 1168/1166/1166; should be: 1167/1167/1166
	//        : $7 in XFWS: 4/1/1/1; should be: 2/2/2/1
	f1 = parseFloat($('#txt'+ gasQtrNameByCol[iStartQ] +sCellID).val());
	for (q=(iStartQ+1); q<3; q++) {
		f2 = parseFloat($('#txt'+ gasQtrNameByCol[q] +sCellID).val());
		if ((f2 > 0) && (f1 > f2 + 1)) {
			$('#txt'+ gasQtrNameByCol[q] +sCellID).val(++f2);
			--f1;
		}
	}
	$('#txt'+ gasQtrNameByCol[iStartQ] +sCellID).val(f1);

	// now recalculate everything
	awardTableCalculateTotal(pTarget);
	for (q=iStartQ; q<4; q++) {
		awardTableCalculateTotalQuarters(iTableNum,gasQtrNameByCol[q]);
	}
	fieldChange();
}


/*------------------------------------------------------------------------------
* dropDownListChange
*		Process changes to the drop-down lists (Aid Hold & Award Letter Comment).
*		Note: pTargetDOM is a regular DOM object, not a jQuery object.
------------------------------------------------------------------------------*/
function dropDownListChange(pTargetDOM)
{
	var i,
		iLastDisplayedIndex = 0,
		index,
		elem,
		sName;
	
	// [10-31-19] added
	if (pTargetDOM.id.indexOf("dropHoldCode") == 0) {
		index = pTargetDOM.id.substr(12);
		$("#spanHoldDateX" + index).show().css("visibility", "visible");
//test	$("#spanHoldDate" + index).show().css("visibility", "visible").html("&nbsp;"); // nbsp required for X positioning//test fix?
		$("#spanHoldDate" + index).show();//test.css("visibility", "visible");
	}
	/* Award Letter Comment currently not required
	else
	if (pTargetDOM.id.indexOf("dropAwardLetterComment") == 0) {
		if (pTargetDOM.value != 0) {
			$("#fontAwardLetterCommentLabel").removeClass("red"); // in case 'red' was applied
		}
	} //*/

	sName = pTargetDOM.id.substr(0, pTargetDOM.id.length - 1);
	for (i=1; i<=5; i++) {
		elem = $J(sName+i);
		if ((elem.length > 0) && (elem.is(':visible'))) {
			if (elem.val() == 0) {
				// no need to display a drop-down since one is available
				return;
			}
			else {
				iLastDisplayedIndex = i;
			}
		}
	}
	
	if (++iLastDisplayedIndex <= 5) {
		// there is at least one hidden drop-down list to display, so fill it in and display it
		// [09-01-07] added code to fill <select> list and add appropriate attributes
		elem = $D(sName + iLastDisplayedIndex);
		var opt;
		for (i=0; i<pTargetDOM.length; i++) {
			opt = document.createElement('option');
			opt.value = pTargetDOM.options[i].value;
			opt.text = pTargetDOM.options[i].text;
			try {
				elem.add(opt,null); // W3C standard
			}
			catch(x) {
				elem.add(opt);      // Microsoft "standard"
			}
		}
		$(elem).show();
	}
	
	/* code to move to next ALC drop-down
	//elem = $J(pTargetDOM.id);
	elem = $D(pTargetDOM.id);
	if (elem) {
		focusNextFormElement(elem);
	} */
}


/*------------------------------------------------------------------------------
* editForm
*		Edit only the absolute minimum and let the web module edit everything
*		else.
------------------------------------------------------------------------------*/
function editForm()
{
	//alert('form is being submitted; gbIsFormSubmittedByFindButton='+gbIsFormSubmittedByFindButton+'; giStudentNo='+giStudentNo);//TEST
	if ((gbIsFormSubmittedByFindButton) || (giStudentNo == 0)) {
		gbIsFormSubmittedByFindButton = false;  // reset to false for the next submit

		var studentKey = $('#txtFindStudentKey').val();
		var systemKey = $('#txtFindSystemKey').val();

//		if ((giStudentNo != 0) && ( ! $('#txtFindStudentKey').val())) {
		if ((giStudentNo != 0) && !studentKey && !systemKey) {
			// must be a change in the award year
			return( true );
		}

		if (studentKey && systemKey) {
			// drop thru to error
		}
		else

//		if ($('#txtFindStudentKey').val().search(/^(\d{7}|\d{9}|\d{3}-\d\d-\d{4})$/) == 0) {
		if (studentKey.search(/^(\d{7}|\d{9}|\d{3}-\d\d-\d{4})$/) == 0) {
			// an inquiry find is desired; don't bother editing everything else
			return( true );
		}
		else
			if (systemKey.search(/^\d{1,9}$/) == 0) {
				// an inquiry system_key find is desired
				return (true);
			}

		alert
			(	"Please enter one of the following:\n\n"
			+	"-  A 7-digit Student Number\n\n"
			+	"-  A 9-digit Social Security Number in the\n"
			+	"      format 999-99-9999 or 999999999\n\n"
			+	"-  A numeric System Key in the \"SK\" field\n"
			);
		document.forms[0].txtFindStudentKey.select();
		return( false );
	}
	
	// [02-22-08] added if{} block
	if (gsCurrentTab != "tabWorksheet") {
		var bttn = $J(gsCurrentTab+'SubmitButton');
		if (bttn.length > 0) {
			bttn.click();
		}
		return( false );
	}
	else
	if (gbIsFormSubmittedByPackagingButton) { // [03-27-07] added entire if{} block
		gbIsFormSubmittedByPackagingButton = false;
		if (gsPackagingIndicator == "Y") {
			fillPackageAwards();

			$('#litAPackageFormula').parent().css('background-color', gsGoldColor);
			$('#cellAwardPackagingButton').css('background-color', gsGoldColor);
			$('#bttnAwardPackaging').val('Remove Package');
			scrollToAwards('editSelect_1_1');
			$('#txtRepackageAwards').val('Y');
			gsPackagingIndicator = "Z";
			return( false );
		}
		else if (gsPackagingIndicator == "Z") {
			awardTableActionForAll($('#txtSummer_1_1'),"U"); // remove/undo package amounts
			$('#litAPackageFormula').parent().css('background-color', '');
			$('#cellAwardPackagingButton').css('background-color', '');
			$('#bttnAwardPackaging').val('Accept Package');
			scrollToAwards('editSelect_1_1');
			$('#txtRepackageAwards').val('N');
			gsPackagingIndicator = "Y";
			return( false );
		}
		
		return( true );
	}
	

	//lbShow('divSubmitCancel'); // [11-22-06] divSubmitCancel is inactive
	submitConfirm(); // [11-22-06] added while divSubmitCancel is inactive
	return( false );
}


/*------------------------------------------------------------------------------
* fieldBlur
*		Keep track of where the focus was last.
*		Note: pTargetDOM is a regular DOM object, not a jQuery object.
------------------------------------------------------------------------------*/
function fieldBlur(pTargetDOM)
{
	$(pTargetDOM).removeClass('highlightField');
	
	// [01-01-18] moved from below following if{} block
	gsPriorElementId = String(pTargetDOM.id);

	if (gsCurrentTab != 'tabWorksheet') {
		return;
	}
	
	if ((gsPriorElementId.indexOf('editSelect') == 0)
	&&  (String(pTargetDOM.value) != "D")) {
		// the award select drop-down menu performed the selected action,
		// so if the user is leaving the field we may as well blank it out
		pTargetDOM.selectedIndex = 0;
	}
}

/*------------------------------------------------------------------------------
* fieldChange  [04-24-08]
*		Called when a form element is changed; sets a global boolean.
------------------------------------------------------------------------------*/
function fieldChange()
{
	//console.log("fieldChange(); gbIsFormChanged:" + gbIsFormChanged);//TEST
	if (gbIsFormChanged) {
		return;
	}

	gbIsFormChanged = true;

	var $div = $("#" + gsCurrentTab + "Div");
	if ($div.length == 0) {
		return;
	}

	// i.e. #spanBudgetChanged, #spanDocumentsChanged, etc
	var spanSelector = "#span" + gsCurrentTab.substr(3) + "Changed";
	$div.find(spanSelector).show();
	$J(gsCurrentTab).addClass("tabDirty");

	//if (gsCurrentTab == "tabBudget") { }
	//else if (gsCurrentTab == "tabDocuments") { }
	//else
	if (gsCurrentTab == "tabMultipleOffers") {
		$("#dropMOApplications").attr("disabled","true").addClass("bgLightRed");
	}
/*//test-make sure documents still work
	if ((gsCurrentTab == 'tabDocuments')
	&&  ( ! gbIsFormChanged)) {
		gbIsFormChanged = true;
		$('#spanChangedText', '#tabDocumentsDiv').css('display', 'inline');
		return;
	}
	
	if ((gsCurrentTab == 'tabMultipleOffers')
	&&  ( ! gbIsFormChanged)) {
		gbIsFormChanged = true;
		$('#spanChangedText', '#tabMultipleOffersDiv').css('display', 'inline');
		var $elem = $('#dropMOApplications','#tabMultipleOffersDiv');
		if ($elem.length > 0) {
			$elem.attr('disabled','true');
			$elem.attr('class', 'bgLightRed');
		}
		return;
	}	
*/
}

/*------------------------------------------------------------------------------
* fieldFocus
*		Selected events when a form field is highlighted
*		Note: pTargetDOM is a regular DOM object, not a jQuery object.
------------------------------------------------------------------------------*/
function fieldFocus(pTargetDOM)
{
	var elem = $(pTargetDOM);
	if (elem.length > 0) {
		gsCurrentElementId = elem.attr('id');
		
		var type = elem.attr('type');
		if (type.search(/^(BUTTON|SUBMIT)/i) == -1) {
			elem.addClass('highlightField');
		}
	}
}


/*------------------------------------------------------------------------------
* fillPackageAwards  [03-27-07]
*		Move the package award amounts into the form input fields.
------------------------------------------------------------------------------*/
function fillPackageAwards()
{
	var
		i,q,
		aeAwardNumbers,
		elemA, elemP,
		sValue;
		
	aeAwardNumbers = document.getElementsByName('txtAwardNumber_1',$('#tblAwards_1'));
	for (i=0; i<aeAwardNumbers.length; i++) {
		for (q=0; q<4; q++) {
			elemA = $('#txt'+ gasQtrNameByCol[q] +'_1_'+ aeAwardNumbers[i].value);         // current award amount
			elemP = $('#cell'+ gasQtrNameByCol[q] +'PackageAward_1_'+ aeAwardNumbers[i].value); // new package amount
			if (elemP.length > 0 && (parseInt(elemP.html()) > 0)) { // [04-24-08] only if package amount > 0
				elemA.val(elemP.html().replace(/,/g,''));
			}
			else {
				//alert('cancel award '+(i+1)+' for quarter '+gasQtrNameByCol[q]);//TEST
				// [05-03-11] mark as canceled if > zero, but put in the original amount
				sValue = elemA.attr("orig_value");
				if (sValue == null) {  // weird; use the current value in the field instead
					sValue = elemA.val();
				}
				if (parseInt(sValue) > 0) {
					elemA.val(sValue + "C");
				}
				else {  // [05-03-11] make sure the orig_value value, zero, is used
					elemA.val("0");
				}
			}
		}
		
		// feed recalculateTotal() the Summer field
		awardTableCalculateTotal($('#txtSummer_1_'+aeAwardNumbers[i].value),false);
	}

	for (q=0; q<4; q++) {
		awardTableCalculateTotalQuarters(1,gasQtrNameByCol[q]);
	}
}


/*------------------------------------------------------------------------------
* focusNextFormElement  [11-27-06]
*		Focus the cursor on the next visible form element.
------------------------------------------------------------------------------*/
function focusNextFormElement(pTargetID)
{
	var elem = $D(pTargetID);
	if ( ! elem) {
		return;
	}

	var i;
	for (i=0; ((i < document.forms[0].length) && (document.forms[0][i] != elem)); i++);
	if (i < document.forms[0].length) {
		// element was found
		var iNextIndex = (i + 1) % document.forms[0].length; // mod% is for wrap-around
		while (document.forms[0][iNextIndex].style.display == "none") {
			// find the next element that is not hidden
			++iNextIndex;
		}
		document.forms[0][iNextIndex].focus();
	}
}


/*------------------------------------------------------------------------------
* focusOnCurrentElement  [02-22-11]
*		Focus the cursor on the current element.  Used after alert/alertDialog
*		takes away focus.
------------------------------------------------------------------------------*/
function focusOnCurrentElement()
{
	focusOnElement( '#'+ gsCurrentElementId );
}

/*------------------------------------------------------------------------------
* focusOnElement  [02-22-11]
*		Focus the cursor on the given element, if it exists.
------------------------------------------------------------------------------*/
function focusOnElement(pSelector1, pSelector2)
{
	var elem;
	
	if (pSelector2) {
		elem = $(pSelector1,pSelector2);
	}
	else {
		elem = $(pSelector1);
	}
	if (elem.length > 0) {
		elem.focus();
	}
}


/*------------------------------------------------------------------------------
* formatCurrency
*		Round any number entered to the 1000th's decimal to 100ths.
*		Note: pTarget is a jQuery object
------------------------------------------------------------------------------*/
/* not currently used
function formatCurrency(pTarget)
{
	var
		iLen,
		sAmount,
		sNumber,
		sSuffix,
		sTargetVal;
	
	sTargetVal = pTarget.val();
	if (isNaN(sTargetVal.substr(sTargetVal.length - 1))) {
		sAmount = sTargetVal.substr(0,sTargetVal.length - 1);
		sSuffix = sTargetVal.substr(sTargetVal.length - 1);
	}
	else {
		sAmount = sTargetVal;
		sSuffix = "";
	}

	sNumber = String(Math.round(sAmount * 100));
	iLen = sNumber.length;
	pTarget.val(sNumber.substr(0,(iLen - 2)) +"."+ sNumber.substr((iLen - 2),iLen) + sSuffix);
}
*/


/*------------------------------------------------------------------------------
* getDateTimeString  [02-22-11]
*		Return date/time as "m/dd/yy h:mm AM|PM"
------------------------------------------------------------------------------*/
function getDateTimeString()
{
	var date = new Date();
	var iHour = date.getHours();

	var S = sprintf
		(	"%d/%02d/%2s %d:%02d %s"
		,	(date.getMonth() + 1)
		,	date.getDate()
		,	String(date.getFullYear()).substring(2,4)
		,	(iHour == 0) ? 12 : ((iHour > 12) ? iHour - 12 : iHour)
		,	date.getMinutes()
		,	(iHour > 11) ? "PM" : "AM"
		);
	return( S );
}


/*------------------------------------------------------------------------------
* keydownHandler
*		Process all keydown events in the <body> element.
------------------------------------------------------------------------------*/
function keydownHandler(pKeyEvent)
{
	var
		aMatch,
		sSelectCode,
		sTagName;
	
	sSelectCode = gsSelectCode;
	gsSelectCode = "";
	
	if (!pKeyEvent) {
		pKeyEvent = window.event
	}
	if (!pKeyEvent) {
		return true;
	}
	
	var targetDOM;
	if (pKeyEvent.target) {
		targetDOM = pKeyEvent.target
	}
	else
	if (pKeyEvent.srcElement) {
		targetDOM = pKeyEvent.srcElement
	}
	else { // can't find source of event
		return true;
	}
	if (targetDOM.nodeType == 3) { // defeat Safari bug
		targetDOM = targetDOM.parentNode
	}
	//console.log(pKeyEvent.keyCode+' - '+pKeyEvent.which);//TEST
//test
//	console.log('keydownHandler: ' + targetDOM.id + ' [' + pKeyEvent.keyCode + ']');//test

	if ((pKeyEvent.keyCode == 36) && (pKeyEvent.ctrlKey)) {
		// Ctrl-Home was pressed
		if (targetDOM.blur) { targetDOM.blur(); } // [02-22-11] sometimes blur not called...
		window.scrollTo(0,0);
		$('#txtFindStudentKey').focus();
		return false;
	}

	/* [11-27-06] obsolete with IE7, so removed completely
	if ((pKeyEvent.keyCode == 9) && (pKeyEvent.ctrlKey)) {
		// Ctrl-Tab was pressed; valid only for IE
		if (gbIsMSIE) {
			tabMoveToThe( ((pKeyEvent.shiftKey) ? "left" : "right") );
			return false;
		}
	} */
	
	if (pKeyEvent.ctrlKey || pKeyEvent.altKey || pKeyEvent.shiftKey) {
		return true;
	}

	if ((targetDOM.id.indexOf('txtAwardYear') == 0)
	&&  ((pKeyEvent.keyCode > 36) && (pKeyEvent.keyCode < 41))
	&&  ($('#txtAwardYear').val().search(/^\d{4}$/) == 0)) {
		// allows year value to be changed with arrow keys
		var iYear = Number($('#txtAwardYear').val());
		if ((pKeyEvent.keyCode == 37)
		||  (pKeyEvent.keyCode == 38)) { // left or down arrow
			document.forms[0].txtAwardYear.value = iYear - 1;
		}
		else { // right or up arrow
			document.forms[0].txtAwardYear.value = iYear + 1;
		}
		document.forms[0].txtAwardYear.select(); // keeps focus on year obvious
		return false;
	}
		
	if ((pKeyEvent.keyCode == 38) || (pKeyEvent.keyCode == 40)) {
		if (gsCurrentTab == 'tabWorksheet') {
			aMatch = targetDOM.id.match(/^txt(Summer|Autumn|Winter|Spring)_(\d+)_(\d+)$/);
			if (aMatch != null) {
				// allow movement to prior/next field for this quarter
				awardTableMoveUpDown(pKeyEvent.keyCode,aMatch[1],aMatch[2],aMatch[3]);
				return false;
			}
		}
		else
		if (gsCurrentTab == 'tabBudget') {  // [01-01-18] added tabBudget{} block
			bgt_TableMoveUpDown(targetDOM.id,pKeyEvent.keyCode);
			return false;
		}
		else
		if (gsCurrentTab == 'tabDocuments') {  // [03-31-11] added tabDocuments code
			if ((targetDOM.id.indexOf("txtDocNote_") == 0)
			||  (targetDOM.id.indexOf("txtDocDate") == 0)) {
				doc_TableMoveUpDown(targetDOM.id,pKeyEvent.keyCode);
				return false;
			}
		}
	}

	if ((pKeyEvent.keyCode == 9) // Tab key
	&&  (giTabQuarterDefault > 1)) {
		if ((targetDOM.id.indexOf("txtAwardText") == 0)
		||  ((targetDOM.id.indexOf("editSelect") == 0) && (targetDOM.value != "D"))) {
			aMatch = targetDOM.id.match(/\D(_\d+_\d+)/);
			if (aMatch != null) {
				// focus on the quarter BEFORE the default quarter, and then
				// the pressed Tab key will focus on the desired default quarter
				$('#txt'+ gasQtrNameByCol[giTabQuarterDefault-2] + aMatch[1]).focus();
			}
		}
	}
	
	if (pKeyEvent.keyCode <= 46) {
		// generally these are special keys like Tab, Home, Delete, Space, etc
		// [10-31-19] added
		if ((pKeyEvent.keyCode == 8 || pKeyEvent.keyCode == 46)
		&& (targetDOM.id.indexOf("dropHoldCode") == 0)) {
			var index = targetDOM.id.substr(targetDOM.id.length - 1);
			removeAidHold(index);
			return false;
		}
		return true;
	}
	
	// [01-01-18] added if{}
	if ((gsCurrentTab == "tabBudget")
	&&  (targetDOM.id.indexOf("txtPlusOtherLabel") != 0)) {
		return bgt_KeydownHandler(targetDOM.id, pKeyEvent.keyCode);
	}
	
	sTagName = targetDOM.tagName.toLowerCase();
	if (sTagName.search(/select/) != 0) {
		return true;
	}
	
	// remaining code is just for <select> elements

	var eventChar;
	if ((pKeyEvent.keyCode > 95) && (pKeyEvent.keyCode < 106)) {
		// keyCode's 96-105 are, apparently, the NumPad numbers 0-9; convert them to 'regular' numbers
		eventChar = String.fromCharCode(pKeyEvent.keyCode - 48);
	}
	else {
		eventChar = String.fromCharCode(pKeyEvent.keyCode);
	}
	if ( ! eventChar)
		return true;
	
	// [11-27-06] added entire 'if' block regarding <select> custom attribute 'autocode'
	if (sTagName == 'select') {
		if (eventChar.search(/[0-9A-Z]/i) != 0) {
			return true;
		}
		var sAutoCode = targetDOM.getAttribute("autocode");
		if ( ! sAutoCode)
			return true;
			
		gsSelectCode = sSelectCode + eventChar.toUpperCase();
		var bIsAutoTabRequested = false;
		if (sAutoCode.charAt(0) == "T") {
			bIsAutoTabRequested = true;
			sAutoCode = sAutoCode.substring(1);
		}
		if (gsSelectCode.length == sAutoCode) {
			sSelectCode = gsSelectCode;
			gsSelectCode = "";
			
			//var elem = $J(targetDOM.id); // not ready for jQuery
			var elem = $D(targetDOM.id);
			// find code in <select>
			for (var i=0; ((i < elem.length) && (elem.options[i].value != sSelectCode)); i++);
			if (i < elem.length) {
				// the code was found in the <select> element's options collection
				elem.selectedIndex = i;
				if (targetDOM.id.search(/drop(AwardLetterComment|HoldCode)/) == 0) {
					// set of 5 dropdowns; unhide the next in sequence if needed
					dropDownListChange(targetDOM);
				}
				
				//if (navigator.userAgent.indexOf("Firefox") != -1) {						
				elem.blur(); // defeats odd IE7/Firefox 'feature' which causes next selection to be highlighted
				//}

				// setTimeout prevents this keystroke from being processed in this control or the next.
				// I don't know why, but it does.
				if (bIsAutoTabRequested) {
					setTimeout("focusNextFormElement('"+ targetDOM.id +"')",1); // 1 ms
				}
				else {
					setTimeout("$('#"+ targetDOM.id +"').focus()",1); // 1 ms
				}
				
				return false;
			}
			else { // [11-27-06] added
				if (parseInt(sAutoCode) > 1) {
					alertDialog('Code "'+ sSelectCode +'" is invalid.');
				}
			}
		}
	}
	
	return true;
}


/*------------------------------------------------------------------------------
* keypressHandler
*		Process all keystrokes in the <body> element.  Most will be passed back
*		intact, but some in <select> and <input> elements have special functions.
------------------------------------------------------------------------------*/
function keypressHandler(pKeyEvent)
{
	if ( ! pKeyEvent) {
		pKeyEvent = window.event
	}
	if (( ! pKeyEvent)
	||  (pKeyEvent.ctrlKey || pKeyEvent.altKey)) {
		// couldn't get event, or Control/Alt key pressed
		giSelectEnterPressedInARow = 0;
		gsSelectCode = "";
		return true;
	}
	
	//alert('keyCode = '+pKeyEvent.keyCode+'\nwhich = '+pKeyEvent.which); //TEST
	var targetDOM;
	if (pKeyEvent.target) {
		targetDOM = pKeyEvent.target
	}
	else
	if (pKeyEvent.srcElement) {
		targetDOM = pKeyEvent.srcElement
	}
	else { // can't find source of event
		giSelectEnterPressedInARow = 0;
		gsSelectCode = "";
		return true;
	}
	if (targetDOM.nodeType == 3) { // defeat Safari bug
		targetDOM = targetDOM.parentNode
	}
	
	if (targetDOM.parentNode.className != 'tab') {  // [02-22-11] keep going if keypress by tab
		if ((targetDOM.tagName.search(/(INPUT|SELECT)/i) == -1)
		||  ((targetDOM.tagName.search(/INPUT/i) == 0) && (targetDOM.type.search(/button/i) == 0))) {
			// process keypresses for only <input> and <select> tags, unless it's an INPUT-button
			giSelectEnterPressedInARow = 0;
			gsSelectCode = "";
			return true;
		}
	}
		
	// rudimentary check for the Enter/Return key
	if (pKeyEvent.keyCode == 13) {	/*||  (pKeyEvent.which == 13)) {*/
		gsSelectCode = "";
		if (targetDOM.id.search(/^txt(AwardYear|FindStudentKey|FindSystemKey)/) == 0) {
			document.forms[0].bttnSubmitFind.click();
		}
		else {
			if ((targetDOM.tagName.search(/SELECT/i) == 0)
			&&  (++giSelectEnterPressedInARow < 2)) {
				// <select> field, but the user hasn't pressed Enter twice in a row
				return true;
			}

			// [02-22-11] jQuery UI autocomplete widget requires two Enters to submit form
			if ((gsCurrentTab == 'tabDocuments')
			&&  (targetDOM.tagName.search(/INPUT/i) == 0)) {
				var obj = $J(targetDOM.id).data("autocomplete");
				if ((obj != null)
				&&  (++giSelectEnterPressedInARow < 2)) {
					// <input> field with jQuery UI autocomplete; user must press Enter twice in a row
					return false;
				}
			}

			if (gsCurrentTab == 'tabDocuments') {  // [03-28-11] added if{} block
				$('#tabDocumentsSubmitButton','#tabDocumentsDiv').click();
			}
/*//test-what was this supposed to do?
			else if (gsCurrentTab == "tabBudget") {
				$("#bttnBudgetCalc", "#tabBudgetDiv").click();
			}
*/
			else {
				/* [11-22-06] divSubmitCancel is inactive 
				if ($('#divSubmitCancel').css('display') == 'block') {
					// final confirm on Confirm/Cancel popup
					document.forms[0].bttnSubmitConfirm.click();
				}
				else {
					// initial submit to get to Confirm/Cancel popup
					document.forms[0].bttnSubmit.click();
				} [11-22-06] */
				document.forms[0].bttnSubmit.click(); // [11-22-06] added from inside prior 'else' block
			}
		}
		
		giSelectEnterPressedInARow = 0;
		return false;
	}
	
	
	giSelectEnterPressedInARow = 0;
	
	// [11-22-06] check for Esc in first field of a new award row which is blank
	if (pKeyEvent.keyCode == 27) {  // Esc
		if (targetDOM.id.indexOf("txtAwardText_") == 0) {
			var sCellID = targetDOM.id.substr(12); // length of "txtAwardText" is 12; precedes "_#_#"
			if ((targetDOM.value == "")
			&&  ($('#txtSummer'+sCellID).val() == 0)
			&&  ($('#txtAutumn'+sCellID).val() == 0)
			&&  ($('#txtWinter'+sCellID).val() == 0)
			&&  ($('#txtSpring'+sCellID).val() == 0)) {
				awardTableRowDelete(targetDOM);
				return false;
			}
		}
		else
		if (targetDOM.id.indexOf("txtDocType_") == 0) {
			var sRowID = targetDOM.id.substr(12); // length of "txtAwardText" is 12; precedes "_#_#"
			if ((targetDOM.value == "")
			&&  ($('#txtSummer'+sCellID).val() == 0)
			&&  ($('#txtAutumn'+sCellID).val() == 0)
			&&  ($('#txtWinter'+sCellID).val() == 0)
			&&  ($('#txtSpring'+sCellID).val() == 0)) {
				awardTableRowDelete(targetDOM);
				return false;
			}
		}
	}

	// [01-01-18] added so Tab from budget Rev Comment moves focus to Submit button
	if (pKeyEvent.keyCode == 9) {  /*|| pKeyEvent.which == 9) {*/
		if (targetDOM.id == "txtBudgetRevision") {
			$J(targetDOM.id).blur();  // remove focus highlighting
			$("#bttnBudgetSubmit").focus();
			return false;
		}
	}
	
	// the following code checks for functional keys like Del, arrows, etc
	var chrCode;
	if (String(pKeyEvent.charCode) == "undefined")
		chrCode = pKeyEvent.keyCode;	// IE
	else
		chrCode = pKeyEvent.charCode;	// Mozilla
	if (!chrCode) {
		return true;
	}
	
	var eventChar = String.fromCharCode(chrCode).toUpperCase();
	if ((targetDOM.id == "txtFindStudentKey")
	||  (targetDOM.parentNode.className == 'tab')) {  // [02-22-11] let tab have same hotkeys
		return keypressFindStudentKey(eventChar);
	}
	else
	if (targetDOM.id == "dropStatus") {
		return keypressApplicationStatus(eventChar);
	}

	if (targetDOM.id.search(/^txt(Summer|Autumn|Winter|Spring)_\d+_\d+$/) == 0) {	
		return awardTableKeypress($(targetDOM),eventChar);
	}
	
	if ((targetDOM.tagName.search(/input/i) == 0)
	&&  (targetDOM.type.search(/text/i) == 0)) {
		var sValidData = targetDOM.getAttribute("valid_input");
		if (sValidData) {
			switch( sValidData )
			{
				case 'numeric':
					if (eventChar.search(/[0-9]/) != 0) {
						return false;
					}
					break;
			}
		}
	}
	
	return true;
}


/*------------------------------------------------------------------------------
* keypressApplicationStatus  [11-27-06]
*		Provides a few shortcuts to the user from the dropStatus field.
------------------------------------------------------------------------------*/
function keypressApplicationStatus(pEventChar)
{
	if (pEventChar.search(/[NU]/) != 0) {
		return true;
	}
	
	if (pEventChar == "N") {
		awardTableRowAdd();
	}
	else
	if (pEventChar == "U") {
		scrollToAwards('editSelect_1_1');
	}
	
	return false;
}


/*------------------------------------------------------------------------------
* keypressFindStudentKey
*		Provides a few shortcuts to the user from the txtFindStudentKey field.
------------------------------------------------------------------------------*/
function keypressFindStudentKey(pEventChar)
{
	if (pEventChar.search(/[\d-]/) == 0) {
		return true;
	}
	
	if (( ! gbIsUpdateAllowed)
	||  (giStudentNo == -1  &&  gsCurrentTab != 'tabDocuments')) { [03-28-11]
		// giStudentNo -1 means valid std w/no std number
		return false;
	}
	
	var handled = false;
	
	if (gsCurrentTab == 'tabWorksheet') {
		switch( pEventChar )
		{
			case "E":
				if ( !gbIsPageValid) {
					var aeErrors = document.getElementsByName("ERROR");
					if (aeErrors.length > 0) {
						scrollToElement($(aeErrors[0]),150);
						handled = true;
					}
				}
				break;
			case "N":
				awardTableRowAdd();
				handled = true;
				break;
			case "S":  // [11-22-06] added S hotkey for Application Status
				document.forms[0].dropStatus.focus();
				handled = true;
				break;
			case "U":
				if ($D('editSelect_1_1')) {
					scrollToAwards('editSelect_1_1');
					handled = true;
				}
				break;
		}
	}
	else if (gsCurrentTab == 'tabBudget') {
		switch( pEventChar )
		{
			case "U":
				var $row1 = $("#tblBudgetDemographics tr:nth-child(2)");
				var $inputs = $row1.find("input[type=text]:not([disabled])")
				if ($inputs.length > 0) {
					$inputs.eq(0).select();
				} else {
					$("#chkAmtBudgetQ4").focus();
				}
				handled = true;
				break;
		}
	}
	else if (gsCurrentTab == 'tabDocuments') {
		switch( pEventChar )
		{
			case "N":
				doc_TableRowAdd();
				handled = true;
				break;
			case "U":
				scrollToDocuments();
				handled = true;
				break;
		}
	}
	
	if (handled) {
		$('#txtFindStudentKey').blur(); // doesn't seem to be blur-ing for some reason
	}
	return false;
}


/*------------------------------------------------------------------------------
* mo_BudgetCalculation
*		Calculate the Total Budget on the Multiple Offers tab.
------------------------------------------------------------------------------*/
function mo_BudgetCalculation()
{
	var 
		iAmount,
		iTotal = 0;
	
	iAmount = parseInt($('#txtMOBudgetTuition').val());
	if ( ! isNaN(iAmount)) {
		iTotal += iAmount;
	}
	
	iAmount = parseInt($('#txtMOBudgetRoomAndBoard').val());
	if ( ! isNaN(iAmount)) {
		iTotal += iAmount;
	}
	
	iAmount = parseInt($('#txtMOBudgetTransportation').val());
	if ( ! isNaN(iAmount)) {
		iTotal += iAmount;
	}
	
	iAmount = parseInt($('#txtMOBudgetBooks').val());
	if ( ! isNaN(iAmount)) {
		iTotal += iAmount;
	}
	
	iAmount = parseInt($('#txtMOBudgetPersonal').val());
	if ( ! isNaN(iAmount)) {
		iTotal += iAmount;
	}
	
	$('#cellMOBudgetTotal').html('$'+ addCommas(iTotal));
}


/*------------------------------------------------------------------------------
* mo_EditMultipleOffersForm
*		A new application has been selected
------------------------------------------------------------------------------*/
function mo_EditMultipleOffersForm()
{	
	// remove updated/error/warning text, if any are visible
	var elem = $('div.temporaryDisplay:visible','#tabMultipleOffersDiv');
	if (elem.length > 0) {
		elem.hide();
	}

	elem = $('#chkMODeleteRecord');
	if (elem.length > 0 && elem.attr('checked')) {
		var wasOkaySelected = confirm
			(	'YOU ARE ABOUT TO DELETE THIS ENTIRE RECORD!\n\n'
			+	'Click on the \'OK\' button to delete the record, or click\n'
			+	'\'Cancel\' to continue editing the form.'
			);
		if ( ! wasOkaySelected) {
			elem.attr('checked', false);
			return;
		}
	}
	
	gbIsFormChanged = false;
	ajaxFormSubmit();
}


/*------------------------------------------------------------------------------
* modalProcessingHide  [04-24-08]
*		Hide the modal panel displayed when an award transaction is submitted.
*		[02-22-11] Changed to use jQuery UI dialog instead of YUI.
------------------------------------------------------------------------------*/
function modalProcessingHide()
{
	$('#divProcessingDialog').dialog("close");
}

/*------------------------------------------------------------------------------
* modalProcessingShow
*		Show the modal panel displayed when an award transaction is submitted.
*		[02-22-11] Changed to use jQuery UI dialog instead of YUI.
------------------------------------------------------------------------------*/
var gbIsProcessingDialogCreated = false;
function modalProcessingShow()
{
	var objWin = $('#divProcessingDialog');

	if (!gbIsProcessingDialogCreated) {
		// create the processing dialog
		objWin.dialog({
			autoOpen: false,
			modal: true,
			height: 250,
			width: 500,
			closeOnEscape: false,
			draggable: false,
			resizable: false
		});
		gbIsProcessingDialogCreated = true;
	}
	
	objWin.dialog("open");
}


/*------------------------------------------------------------------------------
* photoXXX  [03-26-09]
*		Methods to hide and display the student's photo id.
*		[03-28-11] removed YAHOO dependencies in favor of jQuery
------------------------------------------------------------------------------*/
function photoHideBegin()
{
	giPhotoTimer = window.setTimeout("photoHideComplete();", 333);  // 1/3 of a second
}
function photoHideComplete()
{
	$('#divPhoto').hide();
	//$('#bttnPhoto').css('visibility','visible'); //not being hidden by photoShow()
	giPhotoTimer = null;
}
function photoShow()
{
	if (giPhotoTimer == null) {
		$('#divPhoto')
			.show() // show() MUST come before position() for some reason
			.position({
					my: "right top",
					at: "right top",
					of: "#bttnPhoto"
				});
		//$('#bttnPhoto').css('visibility','hidden'); //no need to hide
	}
	else {
		window.clearTimeout(giPhotoTimer);
		giPhotoTimer = null;
	}
}


/*------------------------------------------------------------------------------
* removeAidHold  [10-31-19]
*		Set aid hald to first selection, "No aid hold"
------------------------------------------------------------------------------*/
function removeAidHold(pIndex)
{
//	var index = pTargetDOM.id.substring(13);
	if (!pIndex || isNaN(pIndex)) {
		return;
	}
	var select = document.getElementById("dropHoldCode" + pIndex);
	select.selectedIndex = 0;
//test	$(pTargetDOM).css("visibility", "hidden");
	$("#spanHoldDateX" + pIndex).css("visibility", "hidden"); // hide() causes size change
//test	$("#spanHoldDate" + pIndex).css("visibility", "hidden");
	$("#spanHoldDate" + pIndex).html("&nbsp;");
}


/*------------------------------------------------------------------------------
* scrollToAwards  [11-27-06]
*		Scroll to the first award, and try to show entire award table if possible.
------------------------------------------------------------------------------*/
function scrollToAwards(psFocusId)
{
	// scroll to show bottom of the award table...
	scrollToElement($('#cellAwardLetterLabel'),5);
	// ...but if the top isn't visible, scroll up to show it
	scrollToElement($('#tblAwards_1'),0);
	
	if ((psFocusId == 'editSelect_1_1')
	&&  (gbIsAwardSelectTabSkipped)) {
		var elem = $('#txt'+ gasQtrNameByCol[giTabQuarterDefault-1] +'_1_1');
		if (elem.length > 0) {
			elem.focus();
			elem.select();
		}
	}
	else {
		try {
			$J(psFocusId).focus();
		}
		catch(x) { /* do nothing */ }
	}
}


/*------------------------------------------------------------------------------
* scrollToElement
*		Move the scroll bar to a given element, and if attribute 'focusID' is
*		available then focus on that element.  Code is courtesy of Eric Pascarello
*		at http://radio.javaranch.com/pascarello/2005/01.html#a1105293729000
*		Note: pTarget is a jQuery object.
------------------------------------------------------------------------------*/
function scrollToElement(pTarget,piPadding)
{
	var
		elem,
		elementY = 0,
		focusID,
		winBottomY,
		winHeight,
		winTopY;
		
	elem = (pTarget.jquery ? pTarget.get(0) : pTarget);

	while (elem != null) {
		elementY += elem.offsetTop;
		elem = elem.offsetParent;
	}
	
	winTopY = document.body.scrollTop;
	if (window.innerWidth) {
		winHeight = window.innerHeight;
	} else {
		winHeight = document.body.offsetHeight;
	}
	winBottomY = winTopY + winHeight;
	//alert('winTopY='+winTopY+', winBottomY='+winBottomY+', elementY='+elementY);//TEST

	if (piPadding > winHeight) { // padding is bigger than the visible page!
		piPadding = winHeight / 2;
	}
		
	if (piPadding == -1) { // -1 indicates the very top of page
		window.scrollTo(0,(elementY - piPadding));
	}
	else
	if (elementY + piPadding > winBottomY) {
		// the element is currently off the top of the page, so scroll down to make it visible			
		elementY = elementY + piPadding + winTopY - winBottomY;
		window.scrollTo(0,elementY);
	}	
	else
	if (elementY < winTopY - piPadding) {
		// the element is currently off the bottom of the page, so scroll up to make it visible			
		elementY = elementY - piPadding;
		window.scrollTo(0,elementY);
	}
	
	// put the focus on the element indicated by the 'focusID' attribute
	focusID = pTarget.attr('focusID');
	if (focusID) {
		if (focusID.indexOf("editSelect") == 0) {
			// focus on the default quarter instead
			elem = $('#txt'+ gasQtrNameByCol[giTabQuarterDefault-1] +'_1_'+ focusID.substr(10));
			elem.focus();
			elem.select();
		}
		else {
			elem = $J(focusID);
			if (elem.attr('type') != "hidden") {
				// make sure the element is not hidden before doing the focus()
				$J(focusID).focus();
			}
			else {
				alert
					(	'Unexpected problem: The page wants to focus on\n'
					+	'element "'+ focusID +'" but this element is hidden.\n\n'
					+	'Please send email to is-sa@washington.edu with the\n'
					+	'error message on the page and the element listed\n'
					+	'above on this popup message.  Thank you.\n'
					);
			}
		}
	}
}


/*------------------------------------------------------------------------------
* scrollToDocuments  [02-22-11]
*		Scroll to the first document, and try to show entire table if possible.
------------------------------------------------------------------------------*/
function scrollToDocuments()
{
	// scroll to show bottom of the document table...
	scrollToElement($('#tabDocumentsSubmitButton'),5);
	// ...but if the top isn't visible, scroll up to show it
	scrollToElement($('#tblDocuments'),0);
	
	var objRow = $("#tblDocuments tr[name='rowData']:first");
	if (objRow.length == 1) {
		var obj = $("input[name^='txtDocAction']",objRow);
		if (obj.val() == "A") {
			$("input[name^='txtDocType']",objRow).focus();
		}
		else {
			$("select[name^='selDocStatus']",objRow).focus();
		}
	}
}


/*------------------------------------------------------------------------------
* scrollToFirstError
*		If necessary, scroll to the first error on the page.
------------------------------------------------------------------------------*/
function scrollToFirstError()
{
	if (gbIsPageValid)
		return;
		
	var aeErrors = document.getElementsByName("ERROR");
	if (aeErrors.length > 0) {
		scrollToElement($(aeErrors[0]),150);
	}
}


/*------------------------------------------------------------------------------
* setTabQuarterDefault
*		Handle the checkbox images in the Awards header, which sets the default
*		quarter to focus on when an award is going to be updated.
------------------------------------------------------------------------------*/
function setTabQuarterDefault(piQtrCode)
{
	giTabQuarterDefault = piQtrCode;
	for (var i=1; i<=4; i++) {
		if (i == giTabQuarterDefault) {
			$('#imageCheckbox'+i).attr('src', '/sisOSFA/images/checkboxOn.gif');
		}
		else {
			$('#imageCheckbox'+i).attr('src', '/sisOSFA/images/checkboxOff.gif');
		}
	}
}


/*------------------------------------------------------------------------------
* submitConfirm
*		Edit the Confirm/Cancel 'lightbox' popup to make sure only one Revision
*		field has been selected.
------------------------------------------------------------------------------*/
function submitConfirm()
{
//test-a
	// [11-27-06]
//test-a	if ( ! gbIsAwardLetterCommentFocused) {
//test-a		gbIsAwardLetterCommentFocused = true;
	var i, value;
	/* [10-31-19] Award Letter Comment no longer required
	var isOneCommentSelected = false;
	for (i = 1; i < 6; i++) {
		value = $("#dropAwardLetterComment" + i).val();
		if (value && value != "00") {
			isOneCommentSelected = true;
			break;
		}
	}
	if (!isOneCommentSelected) {
		document.forms[0].dropAwardLetterComment1.focus();
		scrollToElement($('#bttnSubmit'),30);
		//errorMessageBlink($('#fontAwardLetterCommentLabel'), 2600, 400, false); // [10-31-19] pass error=true
		errorMessageBlink($('#fontAwardLetterCommentLabel'), 2600, 400, true);
		return;
	} //*/

	// [07-26-06] eliminate any spaces entered
	if ($('#txtRevision').val().search(/\S/) == -1) {
		document.forms[0].txtRevision.value = "";
	}
	
	if (( ! $('#txtRevision').val())
	&&  ($('#dropRevision').val() == 0)) {
		/* [11-22-06] removed
		alert
			(	"Before your changes can be submitted, a revision comment\n"
			+	"must be entered or selected from the drop-down list."
			); */
		//document.forms[0].txtRevision.focus();	// [11-27-06]
		document.forms[0].dropRevision.focus();	// [11-27-06]
		// [11-22-06] added next 2 lines:
		scrollToElement($('#bttnSubmit'),30);
		errorMessageBlink($('#fontHeaderRevisionComment'),3500,500,true);
		return;
	}
	
	//lbShow('pnlFormSubmitted');
	modalProcessingShow();  // [09-01-07] replaces leightbox.js code

	//document.forms[0].bttnSubmitConfirm.focus(); // prevent the blinking cursor from showing? (guess not)
	// [11-22-06] removed following line; divSubmitCancel is inactive
	//$('#divSubmitCancel').hide(); // prevents multiple Enter's
	document.forms[0].submit();
}


/*------------------------------------------------------------------------------
* submitFindClick
*		The form is being submitted via the 'Find' button at the top.  Editing
*		should not be done here; it's better to do it in the function called by
*		the form's onsubmit event.
*
*		The Find button and all the client-side jscript that goes with it is here
*		so we know when the user pressed Enter from txtFindStudentKey or clicked
*		the Find button itself.  In these cases, the user must enter a valid key.
*		Otherwise the field will be blank.
------------------------------------------------------------------------------*/
function submitFindClick()
{
	gbIsFormSubmittedByFindButton = true;
}


/*------------------------------------------------------------------------------
* submitPackagingClick  [03-27-07]
*		The form is being submitted via the 'Package Query' button at the bottom
*		of the OSFA Awards table.
------------------------------------------------------------------------------*/
function submitPackagingClick()
{
	gbIsFormSubmittedByPackagingButton = true;
}


/*------------------------------------------------------------------------------
* tabChange
*		Change tabs by hiding the current tab and showing the clicked tab.
------------------------------------------------------------------------------*/
function tabChange(pTabID,event)
{
	var
		arrTabText,
		elem,
		sOldTab;
		

	if (gbIsFormChanged) {
		var wasOkaySelected = confirm
			(	'WARNING: The contents of this form have been changed.\n'
			+	'If you leave this tab your changes may be lost.\n\n'
			+	'Click on the \'OK\' button to continue to the selected tab\n'
			+	'or click \'Cancel\' to return to the current tab.'
			);
		if (wasOkaySelected) {
			gbIsFormChanged = false;
		}
		else {
			return;
		}
	}


	if (typeof pTabID != 'string') {
	// pTabID must be the tab object instead
		pTabID = pTabID.id;
		if (!pTabID) {
			alert
				(	"ERROR:\n\nCould not change tabs using the 'tabChange()' function;\n"
				+	"please report this to Student Information System."
				);
			return;
		}
	}

	/* code not currently implemented
	if ( ! event) {
		event = window.event
	}
	if (event && (event.ctrlKey)) {  // ctrl-click on tab
		event.preventDefault();
		CookieRemove("ParentTabOfDuplicateTab");
		if (goTabWindow) {
			goTabWindow.location = "/sisOSFA/securid/?sn=" + giStudentNo + "&tab=" + pTabID;
			return;
			//goTabWindow.close();
		}

		goTabWindow = open
			(  "/sisOSFA/securid/?sn=" + giStudentNo + "&tab=" + pTabID,
				"OSFA_Duplicate_Tab",
				"resizable=yes"
					+ ",scrollbars=yes"
					+ ",toolbar=no"
					+ ",menubar=no"
					+ ",width=" + screen.width
					+ ",height=" + screen.height
					+ ",top=0"
					+ ",left=0"
					+ ",personalbar=no" // whatever this is, don't show it
			);

		// heinous hack so Refresh/Find uses parent tab, not the duplicated tab:
		CookieSet("ParentTabOfDuplicateTab", gsCurrentTab);
		return;
	}

	if (window.name != "OSFA_Duplicate_Tab") {
		CookieRemove("ParentTabOfDuplicateTab");
	} 
	//*/

	if (String(gsCurrentTab) != pTabID) {
		elem = $J(gsCurrentTab);
		elem.addClass('tabInactive');
		elem.find('span')[0].tabIndex = -1; // see 'focus' comment above arrTabText code, below
		sOldTab = gsCurrentTab;
	}
	
	gsCurrentTab = pTabID;
	elem = $J(gsCurrentTab);

	// in case the user changed to a student who doesn't have this tab
	if (!elem.is(':visible')) {  // [02-22-11] added
		gsCurrentTab = 'tabWorksheet';
		elem = $J(gsCurrentTab);
	}

	elem.removeClass('tabInactive');

	// focus on the tab text and not the tab, because otherwise the dotted box 
	// 'focus' border is hard to see
	arrTabText = elem.find('span');
	arrTabText[0].tabIndex = 0;  // note: arrTabText items are DOM elements
	arrTabText[0].focus();
	
	// hide/display the update or inquiry Award Status / PARS Formula / Package Date line
	if ((gsCurrentTab == "tabWorksheet")
	&&  (giStudentNo > 0)) {  // [03-28-11] added giStudentNo check; giStudentNo -1 means valid std w/no std number
		// [11-27-06] enable updatable fields in top data table
		$('#dropWorkStudy').removeAttr('disabled');
		$('#dropOnTime').removeAttr('disabled');
		$('#divAwardStatusInquiry').hide();
	}
	else {
		// [11-27-06] disable updatable fields in top data table
		$('#dropWorkStudy').attr('disabled', 'true');
		$('#dropOnTime').attr('disabled', 'true');
		if ($('#tblMain tbody').is(':visible')) {  // [10-31-19] added if{} around existing code
			$('#divAwardStatusInquiry').show();
		}

		// [09-01-07] revised AJAX calls, for all inquiry tabs
		if (gsCurrentTab.search(/tab(Budget|Resources|SNG|Eligibility|Documents|MultipleOffers)/) == 0) {
			if (String($J(gsCurrentTab).attr('loaded')) != 'true') {
				// load the desired contents into tabEligibilityDiv via ajax code (see ajax.js)
				switch( gsCurrentTab )
				{
					case "tabBudget":
//test				ajaxTabLoad('/sisOSFA/securid/tab_budget.aspx');
						ajaxTabLoad('/sisOSFA/securid/tab_budget_update.aspx');
						break;
					case "tabResources":
						ajaxTabLoad('/sisOSFA/securid/tab_resources.aspx');
						break;
					case "tabSNG":
						ajaxTabLoad('/sisOSFA/securid/tab_sng.aspx');
						break;
					case "tabEligibility":
						ajaxTabLoad('/sisOSFA/securid/tab_eligibility.aspx');
						break;
					case "tabDocuments":  // [02-22-11] added
						ajaxTabLoad('/sisOSFA/securid/tab_documents.aspx');
						break;
					case "tabMultipleOffers":  // [02-22-08] added
						ajaxTabLoad('/sisOSFA/securid/tab_multoffers.aspx');
						break;
				}
			}
		}
	}
	
	// [02-22-11] added switch{} block of code
	var S = '';
	switch( gsCurrentTab )
	{
		case "tabWorksheet":
			S +=	"Special Key Functions:"
				+	"\n   N - New award"
				+	"\n   S - go to Application Status"  // [11-27-06]
				+	"\n   U - go to Update menu of first award"
				;
			break;
		case "tabBudget":
			S +=	"Special Key Functions:"
				+	"\n   U - go to first Update field"
				;
			break;
		case "tabDocuments":
			S +=	"Special Key Functions:"
				+	"\n   N - New document"
				+	"\n   U - go to first Update field of first document"
				;
			break;
	}
	$('#txtFindStudentKey').attr("title", S);
	
	$J(gsCurrentTab+'Div').show();
	if (sOldTab) {
		$J(sOldTab+'Div').hide();
	}
	
	CookieSet('CurrentTab',gsCurrentTab); // session cookie (no expiration given)
}


/*------------------------------------------------------------------------------
* tabMove
*		Allows the user to move between tabs using left/right arrows.
------------------------------------------------------------------------------*/
function tabMove(pKeyEvent)
{
	if ( ! pKeyEvent) {
		pKeyEvent = window.event
	}
	if (( ! pKeyEvent)
	||  (pKeyEvent.ctrlKey || pKeyEvent.altKey)) {
		// couldn't get event, or Control/Alt key pressed
		return;
	}
	
	if (pKeyEvent.keyCode == 37) {
		tabMoveToThe("left");
	}
	else if (pKeyEvent.keyCode == 39) {
		tabMoveToThe("right");
	}
}


/*------------------------------------------------------------------------------
* tabMoveToThe
*		Performs the actual tab move to the left or right.
------------------------------------------------------------------------------*/
function tabMoveToThe(pDirection)
{
	var i, elem;
	var cells = $('#tblTabs td');
	var tabs = new Array;
	for (i=0; i<cells.length; i++) {
		if (cells[i].id) { // only the tabs for clicking should have an 'id' attribute
			elem = $J(cells[i].id); // [04-24-08] // make sure tab is visible and not a spacer
			if ((elem.css('display') != 'none')
			&&  (elem.attr('class') != 'tabSpacer')) {
				tabs[tabs.length] = cells[i].id;
			}
		}
	}
	for (i=0; i<tabs.length; i++) {
		if (tabs[i] == gsCurrentTab) {
			break;
		}
	}
	if (i == tabs.length) { // didn't find the tab, so quit
		return;
	}
	
	if (pDirection == "left") { // left arrow
		if (--i < 0) {
			i = tabs.length - 1;
		}
	}
	else { // right arrow
		if (++i == tabs.length) {
			i = 0;
		}
	}
	
	tabChange(tabs[i]);
}


/*------------------------------------------------------------------------------
* toggleDiv
*		Expand or Collapse the given div area, and reverse the corresponding
*		expand/collapse image.
------------------------------------------------------------------------------*/
function toggleDiv(psDivName)
{
	var $div = $('#div' + psDivName);
	var cookieName = psDivName + "Display";
	var objImage = document.images["image" + psDivName];

	if ($div.css("display") == "none") {
		$div.show();
		if (objImage != null) {
			objImage.src = "/sisOSFA/images/collapse.gif";
			objImage.title = "Hide detail";
		}
		CookieRemove(cookieName);
	}
	else {
		$div.hide();
		if (objImage != null) {
			objImage.src = "/sisOSFA/images/expand.gif";
			objImage.title = "Show detail";
		}
		CookieSet(cookieName, "none");
	}
}


/*------------------------------------------------------------------------------
* toggleMainData [10-31-19]
*		Show or hide primary data table at top of page.
------------------------------------------------------------------------------*/
function toggleMainData(displayMain) {
	if (displayMain) {
		$('#tblMain tbody').show();
		$('#tblMain tfoot').hide();
		//$('#divAwardStatusInquiry').show();
		$('#ancTOD').show();
		CookieRemove('MainDataTableDisplay');
	}
	else {
		$('#tblMain tbody').hide();
		$('#tblMain tfoot').show();
		//$('#divAwardStatusInquiry').hide();
		$('#ancTOD').hide();
		CookieSet('MainDataTableDisplay','none');
	}
}


/*------------------------------------------------------------------------------
* toggleOverrideDetail  [01-01-18]
*		Show or hide override detail in main table cells.
------------------------------------------------------------------------------*/
function toggleOverrideDetail()
{
	if (giStudentNo > 0) {
		var $anchor = $("#ancTOD");
		$anchor.toggleClass("collapse");
		var $cells = $("#tblMain .cellText.override");
		if ($anchor.hasClass("collapse")) {
			$cells = $cells.not(".collapse");
		}
		else {
			$cells = $cells.filter(".collapse");
		}
		$cells.click();
	}
}


/*------------------------------------------------------------------------------
* updateTimestamp [09-01-19]
*		Continuously update the time in the top-right corner
------------------------------------------------------------------------------*/
function updateTimestamp() {
	$('#spanDateTime').text(getDateTimeString());
	setTimeout("updateTimestamp()", 15000); // updated every 15 seconds
}


/*------------------------------------------------------------------------------
* validateDateMDY  [02-22-11]
*		Validates a mm/dd/yy date given a string text like '7/4/76'.  true is
*		returned if valid, otherwise false.
------------------------------------------------------------------------------*/
function validateDateMDY(pDateText)
{
	if ((typeof pDateText != 'string')
	||  (pDateText.length == 0)) {
		return false;
	}
	
	var aMatch = pDateText.match(/^(\d{1,2}).(\d{1,2}).(\d{1,2})$/);
	if (aMatch == null) {
		return false;
	}
	
	var iMM = Number(aMatch[1]) - 1;
	var iDD = Number(aMatch[2]);
	var iYY = Number(aMatch[3]);
	var iCurrYear = new Date().getFullYear();
	var iYear = iYY + iCurrYear - (iCurrYear % 100);
	if (iYear > (iCurrYear + 19)) {
		iYear -= 100;  // 20+ years in future, so assume a past year
	}
	
	var objDate = new Date(iYear, iMM, iDD);
	var iMM2 = objDate.getMonth();
	var iDD2 = objDate.getDate();
	
	if (iMM != iMM2 || iDD != iDD2) {
		// date must be invalid
		return false;
	}

	// date appears to be valid	
	return true;
}


/*------------------------------------------------------------------------------
* windowHelp
*		Opens the help page in a popup window.
------------------------------------------------------------------------------*/
function windowHelp()
{
	windowOpen("/sisOSFA/help.htm","_help",525,600);
}


/*------------------------------------------------------------------------------
* windowOpen
*		Opens a popup window.
------------------------------------------------------------------------------*/
function windowOpen(sWindowURL,sWindowName,iWidth,iHeight)
{
	if (iWidth > screen.width) {
		iWidth = screen.width * .95;
	}
	if (iHeight > screen.height) {
		iHeight = screen.height * .85;
	}

	if (window.goPopWindow) {
		window.goPopWindow.close();
	}
	
	goPopWindow = open
			(	sWindowURL,
				sWindowName,
				"resizable=yes"
					+	",scrollbars=yes"
					+	",toolbar=no"
					+	",menubar=no"
					+	",width=" + iWidth
					+	",height=" + iHeight
					+	",top="+((screen.height-iHeight)/2)
					+	",left="+((screen.width-iWidth)/2)
			);
}


/*------------------------------------------------------------------------------
* windowStatus
*		Display a message in the browser's status bar.
------------------------------------------------------------------------------*/
function windowStatus(psMessage)
{
	window.status = psMessage;
	return true;
}


/*------------------------------------------------------------------------------
* $D  [02-22-11]
*		A convenience function to shorten the statement
*			var elem = document.getElementById(elementId);
*		into
*			var elem = $D(elementId);
------------------------------------------------------------------------------*/
function $D(pId)
{
	return document.getElementById(pId);
}
/*------------------------------------------------------------------------------
* $J  [02-22-11]
*		A convenience function to shorten the statement
*			var elem = $('#' + elementId);
*		into
*			var elem = $J(elementId);
------------------------------------------------------------------------------*/
function $J(pId)
{
	return $('#' + pId);
}


/*==============================================================================
* Program: default.js - javascript routines for securid/default.aspx
* Author : Bob Hurt
* Created: February 2006
*===============================================================================
* 11-22-06	Bob Hurt
*				The revision comment textbox and dropdown list are no longer in a
*				leightbox popup.  Added new hotkeys S and Esc.
* 11-27-06	Bob Hurt
*				Configure Award Letter Comment drop-down so that two consecutive
*				digits result in that code being selected and the cursor being moved
*				to the next comment.  Updatable fields in top data table, now only
*				"Wants WorkStudy" and "On Time", are disabled on all but the Awards
*				tab.
* 03-27-07	Bob Hurt
*				Lots of code to handle the 'Package Query' button which gets
*				packaging info from the web module and displays it above the current
*				amounts in the text fields.
* 08-01-07	Bob Hurt
*				When tabChange()ing to tabEligibility tab and it hasn't been called
*				before, get the necessary data via an AJAX call.
* 09-01-07	Bob Hurt
*				Use AJAX on inquiry tabs (Budget, Resources, SNG & Eligibility).
*				Use Yahoo! UI Library instead of leightbox for modal popup.
* 03-01-08	Bob Hurt
*				Use Prototype javascript library, now in sisLibrary2 application:
*				http://www.prototypejs.org/.  Added getElementsByName redefinition
*				from now-unused leightbox.js javascript file.
* 04-24-08	Bob Hurt
*				Many, many changes to incorporate updateable Multiple Offers tab.
* 02-22-11	Bob Hurt
*				Overhauled to replace prototype javascript framework with jQuery,
*				which seems to be a better framework that is still being developed.
*				Added new "Documents" tab.
* 03-28-11	Bob Hurt
*				Tweaks to prior changes, and removed YUI dependencies.
* 06-22-18	Bob Hurt
*				txtAwardYear field mistakenly disabled after adding SystemKey field.
*=============================================================================*/