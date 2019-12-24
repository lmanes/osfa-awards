var
	gaOADescriptionData,
	gaOAType,
	gaOAErrors;


/*------------------------------------------------------------------------------
* oa_AddErrors
*		Add error messages, classes and styles to the appropriate rows.  Assumes
*		that global var gaOAErrors has been filled with errors for each row.
------------------------------------------------------------------------------*/
function oa_AddErrors() {
	var i, j, $row;
	var objTable = $D("tblOutsideAid");
	var iRowCount = 0;
	for (i = 2; i < objTable.rows.length; i++ , iRowCount++) {
		if (objTable.rows[i].getAttribute('name') == 'rowData') {
			if ((gaOAErrors[iRowCount].length > 0)
				&& (gaOAErrors[iRowCount][0].length > 0)) {
				_setRowError();
			}
			else {
				if (objTable.rows[i - 1].className == 'rowError') {
					// remove the error description and unset all of the error classes
					objTable.deleteRow(i - 1);
					--i;
					for (j = 0; j < objTable.rows[i].cells.length; j++) {
						$(objTable.rows[i].cells[j]).removeClass('cellErrorBorderBottom');
					}
					$row = $(objTable.rows[i]);
					$row.removeClass('rowErrorData');
				}
			}
		}
	}

	return;

	function _setRowError() {
		$row = $(objTable.rows[i]);
		var sRowID = $('#txtOutsideAidNumber', $row).val();
		$row = $row.get(0); // un-jQuery-fy the object

		if ($row.className.search(/rowErrorData/) == -1) {
			$row.className += ' rowErrorData';
			for (j = 0; j < $row.cells.length; j++) {
				$row.cells[j].className += ' cellErrorBorderBottom';
			}
		}

		$row = objTable.rows[i - 1];
		if ($row.className != 'rowError') {
			$row = objTable.insertRow(i);
			$row.id = "rowError_" + sRowID;
			$row.className = 'rowError';
			$row.insertCell(0);
			$row.cells[0].className = 'cellTextErrorDocument';
			$row.cells[0].setAttribute('colspan', '7');
			$row.cells[0].setAttribute('valign', 'top');
			++i; // without this, the current row may be re-evaluated endlessly
		}
		$row.cells[0].innerHTML =
			"<ul>This document was not updated due to the following errors:"
			;
		for (var j = 0; j < gaOAErrors[iRowCount].length; j++) {
			$row.cells[0].innerHTML += "<li>" + gaOAErrors[iRowCount][j] + "</li>";
		}
		$row.cells[0].innerHTML += "</ul>";

		return i;
	}
}


/*------------------------------------------------------------------------------
* oa_EditDocumentForm
*		Submit document changes.
------------------------------------------------------------------------------*/
function oa_EditResourcesForm() {
/*//test
	var
		i, j,
		aErrors = new Array(),
		aTypes,
		isPageInError = false,
		isInArray,
		isRowError,
		objField,
		$row,
		$rows,
		objTable,
		sRowID,
		sValue;
*/
//test	gbIsBudgetCalc = false;
	var isPageInError = false;

//	ajaxFormSubmit();//test remove
//	return;//test remove

	// remove updated/error/warning text, if any are visible
	var objField = $('div.temporaryDisplay:visible', '#tabDocumentsDiv');
	if (objField.length > 0) {
		objField.hide();
	}

	var comment = $("#txtResourcesRevision").val().trim();
	if (comment.length > 0) {
		var ascii = /^[ -~]+$/;  // valid ASCII is any char from space to tilde
//ascii = /^[a]$/;//test remove
		if (!ascii.test(comment)) {
			$("#divResourcesRevisionError").show();
			$("#txtResourcesRevision").focus().select();
			errorMessageBlink($('#fontHeaderResourcesRevisionComment'), 3500, 500, true);
			return;
		}
	}
	$("#divBudgetRevisionError").hide();  // in case it was on

	var objTable = $("#tblOutsideAid");
	var $rows = $("tr[name='rowData']", objTable);

	if ($rows.length == 0) {
		alert('No documents were added; submit ignored.');
		return;
	}

/*//test - all editing done in .cs or web module?
	var j, $row, isInArray, isRowError, sDocType;
	var aErrors = new Array();
	var iRowCount = 0; // zero-based
	gaOAErrors = []; // reset array
	objTable = objTable.get(0); // get regular DOM object
	for (i = 2; i < objTable.rows.length; i++ , iRowCount++) {
		if (objTable.rows[i].getAttribute('name') != 'rowData') {
			continue;
		}

		isRowError = false;
		aErrors = []; // reset array

		$row = $(objTable.rows[i]); // jQuery-fy the row object
		if ($row.hasClass('disabled')) {
			// this row is being deleted, so don't bother editing it
			continue
		}

		sRowID = $('#txtOutsideAidNumber', $row).val();
		objField = $('#txtOutsideAidType_' + sRowID, $row);
		objField.removeClass('error');
		sDocType = objField.val();

		// edit Document Type
		isInArray = false;
		if (sDocType.length > 0) {
			for (j = 0; j < gaOAType.length && !isInArray; j++) {
				isInArray = (gaOAType[j].value == sDocType);
			}
		}
		if (isInArray) {
			// check for duplicate Doc Type in new records
			if ($row.hasClass('newRow')) {
				aTypes = $("input[name^='txtOutsideAidType']");
				for (j = 0; j < aTypes.length; j++) {
					if (objField.attr('id') == aTypes[j].id) {
						break;
					}
					if (sDocType == aTypes[j].value) {
						isRowError = true;
						objField.addClass('error');
						aErrors[aErrors.length] = 'Duplicate Document Type';
						break;
					}
				}
			}
		}
		else {
			// [03-27-19] only check DocType if this is a new document
			if ($row.hasClass('newRow')) {
				isRowError = true;
				objField.addClass('error');
				aErrors[aErrors.length] = 'Invalid Document Type';
			}
		}

		gaOAErrors[iRowCount] = aErrors;
		if (isRowError) {
			isPageInError = true;
		}
	}

	if (isPageInError) {
		oa_AddErrors();
		//$('#divDocUpdatedError').show(); //.delay(5000).slideUp(500);
		var $div2 = $("#divDocUpdatedError");
		$div2.find("img").attr("src", gsErrorImage);
		$div2.show();
		$J(gsCurrentTab).addClass("tabError");
		return;
	}
//test */

	// Now make sure one and only one Revision field has been selected:	
	if ($("#txtResourcesRevision").val().search(/\S/) == -1) {
		document.forms[0].txtResourcesRevision.value = ""; // eliminate any spaces entered
	}
//test	if (!$("#txtResourcesRevision").val() && $("#dropResourcesRevision").val() == 0) {
	if ((!$("#txtResourcesRevision").val() && $("#dropResourcesRevision").val() == 0)
	||  ($("#txtResourcesRevision").val() && $("#dropResourcesRevision").val() > 0)) {
		document.forms[0].dropResourcesRevision.focus();
//test - scroll to something below submit button?
		scrollToElement($('#tabResourcesSubmitButton'), 30);
		errorMessageBlink($('#fontHeaderResourcesRevisionComment'), 3500, 500, true);
		return;
	}

//	oa_SaveFieldChanges(); //test - create this function

//alert('form would be submitted\nblocked by test'); return;//test remove
	gbIsFormChanged = false;
	ajaxFormSubmit();
}


/*------------------------------------------------------------------------------
* oa_EnhanceFields
*		Change fields loaded by tab_documents.aspx with javascript.
------------------------------------------------------------------------------*/
function oa_EnhanceFields() {
//test	var objTable = $("#tblOutsideAid");

	$('#cellDeleteHeader', '#tblOutsideAid').html('DELETE');
}


/*------------------------------------------------------------------------------
* oa_Initialization
*		Initialization routine when the Documents tab is loaded via ajax.
------------------------------------------------------------------------------*/
var giDocUpdateIndicator = 0;
function oa_Initialization() {
	var $div = $('#tabDocumentsDiv');

	oa_EnhanceFields();

	// Some browsers don't give back focus after an update
	if (giDocUpdateIndicator > 0) {
		$('#divDocUpdatedSuccess').show();
		setTimeout("focusOnElement('#txtFindStudentKey');", 50);
	}
	else if (giDocUpdateIndicator < 0) {
		if (giDocUpdateIndicator == -3) {
			var $div2 = $("#divDocUpdatedError");
			$div2.find("img").attr("src", gsErrorImage);
			$div2.show()
		}
		else {
			$('#divDocUpdatedWarning').show();
		}
		oa_AddErrors();

		// focus on the first input field in the first data row with an error:
		var $row = $("#tblOutsideAid tr.rowErrorData:first");
		if ($row.length == 1) {
			var obj = $("input[name^='txtOutsideAidAction']", $row);
			var sSelector;
			if (obj.val() == "A") {
				sSelector = "#tblOutsideAid input[name^='txtOutsideAidType']";
			}
			else {
				sSelector = "#tblOutsideAid select[name^='selDocStatus']";
			}
		}

		setTimeout("focusOnElement(\"" + sSelector + "\");", 50);
	}

	/* // make 'updated' text go away after 5 seconds
	var obj = $div.find('div.temporaryDisplay:visible');
	if (obj.length > 0) {
		obj.delay(5000).slideUp(500);
	}*/
}


/*------------------------------------------------------------------------------
* oa_TableMoveUpDown
*		Allows user to move up and down among input/test fields.
------------------------------------------------------------------------------*/
function oa_TableMoveUpDown(pTargetId, piKeyCode) {
	var aMatch = pTargetId.match(/^(txtOutsideAid.*)_(\d+)$/);
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

	aeDocNumbers = document.forms[0].txtOutsideAidNumber;

	// create an int array of non-disabled elements
	for (i = 0; i < aeDocNumbers.length; i++) {
		elem = $J(sTargetPreId + '_' + aeDocNumbers[i].value);
		if (elem.length == 1 && !elem.attr('disabled')) {
			aiDocNumbers.push(aeDocNumbers[i].value);
		}
	}
	if (aiDocNumbers.length < 2) {
		// there are no other enabled rows to move to
		return;
	}

	for (i = 0; i < aiDocNumbers.length; i++) {
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

	elem = $D(sTargetPreId + '_' + aiDocNumbers[iCurrentIndex]);
	if (elem) {
		elem.focus();
		elem.select();
	}
}


/*------------------------------------------------------------------------------
* oa_TableRowAdd
*		Add a new row to the Document Tracking table on the Resources tab.
------------------------------------------------------------------------------*/
function oa_TableRowAdd() {
	var $rows = $("#tblOutsideAid tr");
	var $row = $J("row_oa_totals");
	if ($row.length == 0) {
		$row = $J("row_oa_footer");
		if ($row.length == 0) {
			return;  // shouldn't ever happen
		}
	}
	var outsideAidRows = $rows.length - 4;
	if (outsideAidRows >= 8) {
		alert("Maximum of 8 outside aid funds");
		return;
	}

	var sHTML =
			"<tr id='row_oa_RWNM' name='rowData' class='newRow'>"
		+	"<td class='cellText center noBorderRight'><img src='/sisOSFA/images/closeX.gif' border='0' class='imageLink' onclick='oa_TableRowDelete(this)' title='Remove this outside aid' onmouseover='src=\"/sisOSFA/images/closeXover.gif\"' onmouseout='src=\"/sisOSFA/images/closeX.gif\"' alt='X'/>"
		+		"<input type='hidden' name='hdnOutsideAidNumbers' value='RWNM' /></td>"
		+		"<input type='hidden' name='hdnOutsideAidAction_RWNM' value='A' /></td>"
		+	"<td class='cellText right noBorderLeft'><input type='text' id='txtOutsideAidDesc_RWNM' name='txtOutsideAidDesc_RWNM' maxlength='15' size='16' class='inputText'/></td>"
		+	"<td class='cellText right'><input type='text' id='txtOutsideAidSummer_RWNM' name='txtOutsideAidSummer_RWNM' maxlength='5' size='6' class='inputText right'/></td>"
		+	"<td class='cellText right'><input type='text' id='txtOutsideAidAutumn_RWNM' name='txtOutsideAidAutumn_RWNM' maxlength='5' size='6' class='inputText right'/></td>"
		+	"<td class='cellText right'><input type='text' id='txtOutsideAidWinter_RWNM' name='txtOutsideAidWinter_RWNM' maxlength='5' size='6' class='inputText right'/></td>"
		+	"<td class='cellText right'><input type='text' id='txtOutsideAidSpring_RWNM' name='txtOutsideAidSpring_RWNM' maxlength='5' size='6' class='inputText right'/></td>"
		+	"<td></td>"
		+	"<td class='cellText center'><input type='checkbox' id='chkOutsideAidReplaceEFC_RWNM' name='chkOutsideAidReplaceEFC_RWNM' value='Y'/></td>"
		+	"</tr>"
		;

	var $newRow = $(sHTML.replace(/RWNM/g, ++giRowNum));
	$newRow.insertBefore($row);

	$("input[type='text']", $newRow)
		.blur(function () { fieldBlur(this); })
		.focus(function () { fieldFocus(this); })
		.change(function () { fieldChange(); })
		;

	$("input[type=text]", $newRow)[0].focus();  // [0] refers to native DOM element
}


/*------------------------------------------------------------------------------
* oa_TableRowDelete
*		Delete the new document row on the Documents tab.
------------------------------------------------------------------------------*/
function oa_TableRowDelete(pTarget) {
	var
		aMatch,
		objCell,
		$row,
		$tbody;

	$row = pTarget.parentNode.parentNode; // parent:<td> grandparent:<tr>
	// search for $row id before it's deleted
	aMatch = String($row.id).match(/^row_(\d+)$/);
	$row.parentNode.removeChild($row);
	if (aMatch != null) {
		// we have a row number, so look for accompanying error row
		$row = $D('rowError_' + aMatch[1]);
		if ($row != null) {
			$row.parentNode.removeChild($row);
		}
	}

	$tbody = $('#tblOutsideAid tbody');
	objCell = $('#txtOutsideAidNumber', $tbody);
	if (objCell.length == 0) {
		$('#cellDeleteHeader', '#tblOutsideAid').html('');
	}
	$('#bttnNewDocument', $tbody).focus();
}


/*------------------------------------------------------------------------------
* oa_TableRowDisable
*		Disable the data row that's going to be deleted.
------------------------------------------------------------------------------*/
function oa_TableRowDisable(pTarget) {
	var $row = $(pTarget.parentNode.parentNode); // parent:<td> grandparent:<tr>
//	var $row = $(pTarget).parents("tr");

	// disable/enable entire row
	var aFields = $("input", $row).get();
	for (var i=3; i<aFields.length; i++) {
		if (pTarget.checked) {
			aFields[i].setAttribute('disabled', 'true');
		}
		else {
			aFields[i].removeAttribute('disabled');
		}
	}

	if (pTarget.checked) {
		$row.addClass('rowDisabled');
		$("input.oa_action", $row).val("D");
	}
	else {
		$row.removeClass('rowDisabled');
		$("input:oa_action", $row).val("U");
	}

	fieldChange();
}