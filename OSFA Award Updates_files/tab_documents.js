/*----------------------------------------------------------------------------*\
* Modification notes at end of file
\*----------------------------------------------------------------------------*/

var
	gaDocDescriptionData,
	gaDocType,
	gaDocErrors;


/*------------------------------------------------------------------------------
* doc_AddErrors
*		Add error messages, classes and styles to the appropriate rows.  Assumes
*		that global var gaDocErrors has been filled with errors for each row.
------------------------------------------------------------------------------*/
function doc_AddErrors()
{
	var i,j,objRow;
	var objTable = $D("tblDocuments");
	var iRowCount = 0;
	for (i=2; i<objTable.rows.length; i++,iRowCount++) {
		if (objTable.rows[i].getAttribute('name') == 'rowData') {
			if ((gaDocErrors[iRowCount].length > 0)
			&&  (gaDocErrors[iRowCount][0].length > 0)) {
				_setRowError();
			}
			else {
				if (objTable.rows[i - 1].className == 'rowError') {
				// remove the error description and unset all of the error classes
					objTable.deleteRow(i - 1);
					--i;
					for (j=0; j<objTable.rows[i].cells.length; j++) {
						$(objTable.rows[i].cells[j]).removeClass('cellErrorBorderBottom');
					}
					objRow = $(objTable.rows[i]);
					objRow.removeClass('rowErrorData');
				}
			}
		}
	}
	
	return;

	function _setRowError() {
		objRow = $(objTable.rows[i]);
		var sRowID = $('#txtDocNumber',objRow).val();
		objRow = objRow.get(0); // un-jQuery-fy the object

		if (objRow.className.search(/rowErrorData/) == -1) {
			objRow.className += ' rowErrorData';
			for (j=0; j<objRow.cells.length; j++) {
				objRow.cells[j].className += ' cellErrorBorderBottom';
			}
		}
		
		objRow = objTable.rows[i - 1];
		if (objRow.className != 'rowError') {
			objRow = objTable.insertRow(i);
			objRow.id = "rowError_" + sRowID;
			objRow.className = 'rowError';
			objRow.insertCell(0);
			objRow.cells[0].className = 'cellTextErrorDocument';
			objRow.cells[0].setAttribute('colspan','7');
			objRow.cells[0].setAttribute('valign','top');
			++i; // without this, the current row may be re-evaluated endlessly
		}
		objRow.cells[0].innerHTML =
				"<ul>This document was not updated due to the following errors:"
			;
		for (var j=0; j<gaDocErrors[iRowCount].length; j++) {
			objRow.cells[0].innerHTML += "<li>"+ gaDocErrors[iRowCount][j] +"</li>";
		}
		objRow.cells[0].innerHTML += "</ul>";
		
		return i;
	}	
}


/*------------------------------------------------------------------------------
* doc_AutocompleteRenderItem
*		Change the display behaviour of jquery.ui's autocomplete.  Based on the
*		custom data example at http://jqueryui.com/demos/autocomplete/
------------------------------------------------------------------------------*/
function doc_AutocompleteRenderItem(ul,item,term)
{
	var S = item.value.replace(new RegExp(
				"(?![^&;]+;)(?!<[^<>]*)("
			+	$.ui.autocomplete.escapeRegex(term)
			+	")(?![^<>]*>)(?![^&;]+;)"
		,	"gi"
		), "<b>$1</b>" );
	S =	"<span>"
		+	S
		+	"</span><br/><div style='color:#555;margin-left:15px;white-space:nowrap;'>"
		+	item.desc
		+	"</div>"
		;
	return $( "<li/>" )
		.data( "item.autocomplete", item )
		.append( $("<a/>").html( S ) )
		.appendTo( ul );
}


/*------------------------------------------------------------------------------
* doc_EditDocumentForm
*		Submit document changes.
------------------------------------------------------------------------------*/
function doc_EditDocumentsForm()
{
	var
		i,j,
		aErrors = new Array(),
		aTypes,
		bHasErrors = false,
		bIsInArray,
		bIsRowError,
		objField,
		objRow,
		objRows,
		objTable,
		sRowID,
		sValue;
	
	// remove updated/error/warning text, if any are visible
	objField = $('div.temporaryDisplay:visible','#tabDocumentsDiv');
	if (objField.length > 0) {
		objField.hide();
	}

	objTable = $("#tblDocuments");
	objRows = $("tr[name='rowData']",objTable);
	objTable = objTable.get(0); // get regular DOM object

	if (objRows.length == 0) {
		alert('No documents were added; submit ignored.');
		return;
	}

	var iRowCount = 0; // zero-based
	gaDocErrors = []; // reset array
	for (i=2; i<objTable.rows.length; i++,iRowCount++) {
		if (objTable.rows[i].getAttribute('name') != 'rowData') {
			continue;
		}

		bIsRowError = false;
		aErrors = []; // reset array
		
		objRow = $(objTable.rows[i]); // jQuery-fy the row object
		if (objRow.hasClass('disabled')) {
			// this row is being deleted, so don't bother editing it
			continue
		}

		sRowID = $('#txtDocNumber',objRow).val();
		objField = $('#txtDocType_'+sRowID,objRow);
		objField.removeClass('error');
		sDocType = objField.val();
		
		// edit Document Type
		bIsInArray = false;
		if (sDocType.length > 0) {
			for (j = 0; j < gaDocType.length && !bIsInArray; j++) {
				bIsInArray = (gaDocType[j].value == sDocType);
			}
		}
		if (bIsInArray) {
			// check for duplicate Doc Type in new records
			if (objRow.hasClass('newRow')) {
				aTypes = $("input[name^='txtDocType']");
				for (j=0; j<aTypes.length; j++) {
					if (objField.attr('id') == aTypes[j].id) {
						break;
					}
					if (sDocType == aTypes[j].value) {
						bIsRowError = true;
						objField.addClass('error');
						aErrors[aErrors.length] = 'Duplicate Document Type';
						break;
					}
				}
			}
		}
		else {
			// [03-27-19] only check DocType if this is a new document
			if (objRow.hasClass('newRow')) {
				bIsRowError = true;
				objField.addClass('error');
				aErrors[aErrors.length] = 'Invalid Document Type';
			}
		}
		
		// edit date fields
		_editDateField('Receive');
		_editDateField('Request');
		_editDateField('Review');
	
		gaDocErrors[iRowCount] = aErrors;
		if (bIsRowError) {
			bHasErrors = true;
		}
	}

	if (bHasErrors) {
		doc_AddErrors();
//		$('#divDocUpdatedError').show(); //.delay(5000).slideUp(500);
		var $div2 = $("#divDocUpdatedError");
		$div2.find("img").attr("src",gsErrorImage);
		$div2.show();
		$J(gsCurrentTab).addClass("tabError");
	}
	else {
		gbIsFormChanged = false;
		ajaxFormSubmit();
	}
	return;

	// internal functions
	
	function _editDateField(pDateName) {
		objField = $('#txtDocDate'+ pDateName +'_'+sRowID,objRow);
		objField.removeClass('error'); // in case it was set earlier
		sValue = objField.val();
		if (sValue && sValue.length > 0) {
			if ( ! validateDateMDY(sValue) ) {
				bIsRowError = true;
				objField.addClass('error');
				aErrors[aErrors.length] = 'Invalid '+ pDateName +' Date';
			}
		}
	}		
}


/*------------------------------------------------------------------------------
* doc_EnhanceFields
*		Change fields loaded by tab_documents.aspx with javascript.
------------------------------------------------------------------------------*/
function doc_EnhanceFields()
{
	var objTable = $("#tblDocuments");

	/* not necessary, because txtDocType cannot be editted
	// attach jquery ui autocomplete to doc type input fields
	$("input[name^='txtDocType']",objTable).each(function() {
		$(this).autocomplete({
			autoSelectFirst: true,
			allowFreeFormValues: false,
			minLength: 0,
			source: gaDocType
		})
		.data("autocomplete")._renderItem = function( ul, item ) {
			return doc_AutocompleteRenderItem(ul,item,this.term);
		};
	}); */

	// attach jquery ui datepicker to all dates
	$("input[name^='txtDocDate']",objTable).each(function(){$(this).datepicker().keypress(datepickerFix);});
//test	$('#cellDeleteHeader','#tblDocuments').html('DELETE');
}


/*------------------------------------------------------------------------------
* doc_FillArray
*		Fill doc type info array (from SF50028 and cache), once when the Documents
*		tab is first loaded.
------------------------------------------------------------------------------*/
function doc_FillArray()
{
	var arr = new Array();
	var a1,s1;
	if (gaDocDescriptionData) {
		for (var i=0; i<gaDocDescriptionData.length; i++) {
			if (gaDocDescriptionData[i] != null) {
				s1 = gaDocDescriptionData[i].replace(/\[\[:comma:\]\]/g, ',');
				a1 = s1.split('|');
				arr[i] = new DocType(a1[1],a1[2]);
			}
		}
	}
	gaDocType = arr;
		
	return;
	
	function DocType(pValue,pDescription) {
		this.value = pValue;
		this.desc = pDescription;
	}
}


/*------------------------------------------------------------------------------
* doc_Initialization
*		Initialization routine when the Documents tab is loaded via ajax.
------------------------------------------------------------------------------*/
var areDocArraysLoaded = false;
var giDocUpdateIndicator = 0;
function doc_Initialization()
{
	var $div = $('#tabDocumentsDiv');
	
	if ( ! areDocArraysLoaded ) {
		doc_FillArray();
		areDocArraysLoaded = true;
	}
	
	doc_EnhanceFields();
	
	// Some browsers don't give back focus after an update
	if (giDocUpdateIndicator > 0) {
		$('#divDocUpdatedSuccess').show();
		setTimeout("focusOnElement('#txtFindStudentKey');", 50);
	}
	else if (giDocUpdateIndicator < 0) {
		if (giDocUpdateIndicator == -3) {
			var $div2 = $("#divDocUpdatedError");
			$div2.find("img").attr("src",gsErrorImage);
			$div2.show()
		}
		else {
			$('#divDocUpdatedWarning').show();
		}
		doc_AddErrors();
		
		// focus on the first input field in the first data row with an error:
		var objRow = $("#tblDocuments tr.rowErrorData:first");
		if (objRow.length == 1) {
			var obj = $("input[name^='txtDocAction']",objRow);
			var sSelector;
			if (obj.val() == "A") {
				sSelector = "#tblDocuments input[name^='txtDocType']";
			}
			else {
				sSelector = "#tblDocuments select[name^='selDocStatus']";
			}
		}

		setTimeout("focusOnElement(\""+ sSelector +"\");", 50);
	}

	/* // make 'updated' text go away after 5 seconds
	var obj = $div.find('div.temporaryDisplay:visible');
	if (obj.length > 0) {
		obj.delay(5000).slideUp(500);
	}*/
}


/*------------------------------------------------------------------------------
* doc_TableMoveUpDown
*		Allows user to move up and down among the Note and Date fields.
------------------------------------------------------------------------------*/
function doc_TableMoveUpDown(pTargetId,piKeyCode)
{
	var aMatch = pTargetId.match(/^(txtDoc.*)_(\d+)$/);
	if (aMatch == null) {
		return;
	}

	var
		i,
		aeDocNumbers,
		aiDocNumbers = new Array(),
		elem,
		iCurrentIndex = -1,
		iRow,
		sTargetPreId;

	sTargetPreId = aMatch[1];
	iRow = aMatch[2];
		
	aeDocNumbers = document.forms[0].txtDocNumber;
	
	// create an int array of non-disabled elements
	for (i=0; i<aeDocNumbers.length; i++) {
		elem = $J(sTargetPreId+'_'+aeDocNumbers[i].value);
		if (elem.length == 1  &&  !elem.attr('disabled')) {
			aiDocNumbers.push(aeDocNumbers[i].value);
		}
	}
	if (aiDocNumbers.length < 2) {
		// there are no other enabled rows to move to
		return;
	}

	for (i=0; i<aiDocNumbers.length; i++) {
		if (aiDocNumbers[i] == iRow) {
			iCurrentIndex = i;
		}
	}
	if (iCurrentIndex == -1) {
		return;
	}
	
	if (piKeyCode == 38) {  // up arrow
		--iCurrentIndex;
		if (iCurrentIndex < 0) {
			iCurrentIndex = aiDocNumbers.length - 1;
		}
	}
	else {  //down arrow
		++iCurrentIndex;
		if (iCurrentIndex == aiDocNumbers.length) {
			iCurrentIndex = 0;
		}
	}
	
	elem = $D(sTargetPreId +'_'+ aiDocNumbers[iCurrentIndex]);
	if (elem) {
		elem.focus();
		elem.select();
	}
}


/*------------------------------------------------------------------------------
* doc_TableRowAdd
*		Add a new row to the Document Tracking table on the Documents tab.
------------------------------------------------------------------------------*/
function doc_TableRowAdd()
{
	var
		i,
		arrHTML,
		obj,
		objRow,
		objTBody,
		sOptions;

	sOptions = '';
	for (i=0; i<gaDocStatusData.length; i++) {
		if (gaDocStatusData[i] != null) {
			sOptions += "<option value='"+ gaDocStatusData[i] +"'>"+ gaDocStatusData[i] +"</option>";
		}
	}

	arrHTML =
		[	"<tr id='row_RWNM' name='rowData' class='newRow'>"
		,	"<td><input type='hidden' id='txtDocNumber' name='txtDocNumber' value='RWNM'/>"
			+	"<input type='hidden' id='txtDocAction_RWNM' name='txtDocAction_RWNM' value='A'/>"
			+	"<input type='text' id='txtDocType_RWNM'' name='txtDocType_RWNM' maxlength='12' size='17' class='inputText'/></td>"
		,	"<td class='center'><select id='selDocStatus_RWNM' name='selDocStatus_RWNM'><option></option>"
			+	sOptions + "</td>"
		,	"<td class='center'><input type='text' id='txtDocNote_RWNM' name='txtDocNote_RWNM' maxlength='20' size='20' class='inputText'/></td>"
		,	"<td class='center'><input type='text' id='txtDocDateReceive_RWNM' name='txtDocDateReceive_RWNM' maxlength='8' size='8' class='inputText center'/></td>"
		,	"<td class='center'><input type='text' id='txtDocDateRequest_RWNM' name='txtDocDateRequest_RWNM' maxlength='8' size='8' class='inputText center'/></td>"
		,	"<td class='center'><input type='text' id='txtDocDateReview_RWNM' name='txtDocDateReview_RWNM' maxlength='8' size='8' class='inputText center'/></td>"
		,	"<td class='center'><img src='/sisOSFA/images/closeX.gif' border='0' class='imageLink' onclick='doc_TableRowDelete(this)' clickevent='documentTableRowDelete(this)' title='Remove this document' onmouseover='src=\"/sisOSFA/images/closeXover.gif\"' onmouseout='src=\"/sisOSFA/images/closeX.gif\"' alt='X'/></td>"
		,	"</tr>"
		];
	objTBody = $('#tblDocuments tbody');
	objTBody.append(arrHTML.join('').replace(/RWNM/g, ++giRowNum));  // last row of tbody
	objTBody.append($('#rowFooter'));  // move rowFooter back to last row of tbody
	objRow = $("#row_"+giRowNum, objTBody);

	$("input[type='text'],select",objRow)
		.blur(function(){ fieldBlur(this); })
		.focus(function(){ fieldFocus(this); })
		.change(function(){ fieldChange(); })
		;

	obj = $("input[type='text']:eq(0)",objRow);
	obj.autocomplete({
		autoSelectFirst: true,
		allowFreeFormValues: false,
		minLength: 0,
		source: gaDocType
	})
	.data("autocomplete")._renderItem = function( ul, item ) {
		return doc_AutocompleteRenderItem(ul,item,this.term);
	};
	obj.focus();

	$("input[name^='txtDocDate']",objRow).each(function(){$(this).datepicker().keypress(datepickerFix);});
	$("input[name^='txtDocDateReceive']",objRow).datepicker('setDate', new Date());
//test	$('#cellDeleteHeader','#tblDocuments').html('DELETE');
}


/*------------------------------------------------------------------------------
* doc_TableRowDelete
*		Delete the new document row on the Documents tab.
------------------------------------------------------------------------------*/
function doc_TableRowDelete(pTarget)
{
	var
		aMatch,
		objCell,
		objRow,
		objTBody;
		
	objRow = pTarget.parentNode.parentNode; // parent:<td> grandparent:<tr>
	// search for objRow id before it's deleted
	aMatch = String(objRow.id).match(/^row_(\d+)$/);
	objRow.parentNode.removeChild(objRow);
	if (aMatch != null) {
		// we have a row number, so look for accompanying error row
		objRow = $D('rowError_'+aMatch[1]);
		if (objRow != null) {
			objRow.parentNode.removeChild(objRow);
		}
	}

	objTBody = $('#tblDocuments tbody');
/*//test
	objCell = $('#txtDocNumber',objTBody);
	if (objCell.length == 0) {
		$('#cellDeleteHeader','#tblDocuments').html('');
	}
*/
	$('#bttnNewDocument',objTBody).focus();
}


/*------------------------------------------------------------------------------
* doc_TableRowDisable
*		Disable the data row that's going to be deleted.
------------------------------------------------------------------------------*/
function doc_TableRowDisable(pTarget)
{
	var objRow = $(pTarget.parentNode.parentNode); // parent:<td> grandparent:<tr>
	objRow.addClass('disabled');

	/* not necessary now because txtDocType cannot be edited
	// set doc type value back to original so module has true key to delete
	var objField = $("input[name^='txtDocType']",objRow);
	if (objField.length == 1) {
		objField.val(objField.attr('orig_value'));
	} */
	
	// disable/enable entire row
	var aFields = $("input[type='text'],select",objRow).get();	
	for (var i=0; i<aFields.length; i++) {
		if (pTarget.checked) {
			aFields[i].setAttribute('disabled', 'true');
		}
		else {
			aFields[i].removeAttribute('disabled');
		}
	}
	
	if (pTarget.checked) {
		objRow.addClass('rowDisabled');
	}
	else {
		objRow.removeClass('rowDisabled');
	}
	
	fieldChange();
}



/*==============================================================================
* Program: tab_documents.js - javascript routines for tab_documents.aspx
* Author : Bob Hurt
* Created: February 2011
*===============================================================================
* 00-00-00	First Last
*				Description of modification
*				...
*=============================================================================*/