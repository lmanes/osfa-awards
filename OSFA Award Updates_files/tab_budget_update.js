
// Make overrides "pushed" forward appear orange with class "dirty"
function bgt_AddBudgetCalcDirtyPushedOverrides() {
	//console.log("bgt_AddBudgetCalcDirtyPushedOverrides()");//TEST
	var keys = ["Resident", "Class", "Campus", "Major", "EnrollStatus", "BudgetCode"];

	var key;
	for (var r=0; r<6; r++) {  // row 0:res 1:class 2:campus 3:major 4:enrl_stat 5:bgt_code
		//console.log("dirtyOverrides["+r+"]: "+dirtyOverrides[r]);//TEST
		for (var q=0; q<4; q++) {  // qtr
			if (dirtyOverrides[r][q] == 1) {  // dirtyOverrides set in tab_budget_update.aspx.cs
				key = "#txtDG" + keys[r] + "Q" + (q + 1);
				//console.log(key + " is dirty");//TEST
				// orig_value="" so if user blanks field, the "dirty" class will be removed, BUT
				// doing this results in *_ec$Q=N and so SF40049.2150 will push override forward again
				//	$(key).data("orig_value","").addClass("dirty");
				$(key).addClass("dirty");
			}
		}
	}
}


function bgt_AjaxApiCall(source) {
	// build F array
	var sSel = "div#tabBudgetDiv" + " ";
	var F = $(sSel + 'input,' + sSel + 'select,' + sSel + 'textarea');
	$.merge(F, $("input[type='checkbox']", "#pnlTestDisplay:visible")); // for test purposes only

	// process F array
	var sFormFields = "";
	F.not("[disabled]").each(function (index, field) {
		if (field.name) { // form field must have name to get submitted
			if (field.type == 'checkbox') {
//			||  (field.type == 'radio')) {
				if (field.checked) {
					// escape() works better than encodeURI() which leaves '#' untouched
					sFormFields += '&' + field.name + '=' + escape(field.value);
				}
			}
			else {
				// escape() works better than encodeURI() which leaves '#' untouched
				sFormFields += '&' + field.name + '=' + escape(field.value);
			}
		}
	});
	sFormFields += "&" + source.id + "=Y";
	//console.log('bgt_ajaxFormSubmit:[ ' + sFormFields + ' ]');//TEST

	modalProcessingShow();

	$.ajax
		({
			url: "/sisOSFA/securid/tab_budget_update.aspx"
		, cache: false
		, type: 'post'
		, data: sFormFields
		, dataType: 'html'
		, timeout: 10000  // 10 seconds
		, error: function (jqXHR) { ajaxRequestError(jqXHR,"tabBudgetDiv"); }
		, success: function (data, textStatus, jqXHR) { ajaxRequestSuccess(jqXHR,"tabBudgetDiv"); }
		});

	// in case the page blows and leaves the modal sitting there...
	setTimeout("modalProcessingHide();", 10000); // 10 seconds
}


function bgt_CalculateAnnualTotals() {
	var $table = $("#tblBudgetAmounts");
	var qtrs = [];
	$table.find("tr:nth-child(2) input").each(function (index) {
		if (this.checked) {
			qtrs.push(index + 2);
		}
	});

	var iColSubTotals = new Array(-1, 0, 0, 0, 0, 0);
	var iColTotals = new Array(-1, 0, 0, 0, 0, 0);
	var i, iColNo, iRowTotal, iValue, sValue, $input, $row;
	$table.find("tr").has("input[type=text]").each(function (index) {
		$row = $(this);
		iRowTotal = 0;
		for (i = 0; i < qtrs.length; i++) {
			$input = $row.find("td:nth-child(" + qtrs[i] + ") input");
			if ($input.length == 1) {
				sValue = $input.val();
				if (sValue && !isNaN(sValue)) {
					iValue = parseInt(sValue);
					iRowTotal += iValue;
					iColNo = $input.data("col");
					if (!isNaN(iColNo)) {
						iColSubTotals[iColNo] += iValue;
						iColTotals[iColNo] += iValue;
					}
				}
			}
		}
		//console.log($row.find("td:nth-child(1)").html()+': '+iRowTotal);//TEST
		$row.find("td:last-child").text("$" + addCommas(iRowTotal));
		iColSubTotals[5] += iRowTotal;
		//console.log(index+'. '+$row.find("td:first-child").text());//TEST
		if (index == 5) { // Transportation ("Tuition:" row is index 0)
			$row = $table.find("tr.bgtBasic.total");
			iColTotals[5] += iColSubTotals[5];
			for (i = 1; i < 6; i++) {
				$row.find("td:nth-child(" + (i+1) + ")").text("$" + addCommas(iColSubTotals[i]));
				iColSubTotals[i] = 0;
			}
		}
	});

	$row = $table.find("tr.bgtPlus.total");
	for (i = 1; i < 6; i++) {
		$row.find("td:nth-child(" + (i + 1) + ")").text("$" + addCommas(iColSubTotals[i]));
	}
	iColTotals[5] += iColSubTotals[5];
	$row = $table.find("tr.bgtTotal");
	for (i = 1; i < 6; i++) {
		$row.find("td:nth-child(" + (i + 1) + ")").text("$" + addCommas(iColTotals[i]));
	}
}


// if there are no changes anymore, hide the "Changes Made" comment
function bgt_DirtyFormHandler()
{
	var $changes = $("table.tblLeftRight").find("input.dirty");
	//console.log("bgt_DirtyFormHandler(); gbIsFormChanged:"+gbIsFormChanged);//TEST
	//$changes.each(function () { console.log("   " + this.id) });//TEST

	if ($changes.length == 0) {
		$("#spanBudgetChanged").hide();
		$("#tabBudget").removeClass("tabDirty");
		gbIsFormChanged = false;
	} else {
		$("#spanBudgetChanged").show();
		$("#tabBudget").addClass("tabDirty");
		gbIsFormChanged = true;
	}
}


function bgt_DivvyAmountTotal($pTarget)
{
	if (($pTarget.attr("id").indexOf("txtAmt") != 0)
	&&  ($pTarget.attr("id").indexOf("txtPlus") != 0)) {
		return;  // not a budget amount field
	}

	var iColNo = $pTarget.data("col");
	var $inputs = $pTarget.closest("tr").find("input:not([disabled])").filter(function () {
		// exclude input fields before the initiating quarter
		return $(this).data("col") >= iColNo;
	});
	if ($inputs.length == 1) {
		return;  // only one quarter is active
	}

	var iTotalAmount = parseInt($pTarget.val());
	if (isNaN(iTotalAmount)) {
		return;  // couldn't get a valid number
	}

	var iNumQuarters = $inputs.length;
	var iBase = (Math.round(iTotalAmount / iNumQuarters - 0.5)); // divides into whole dollars

	// spread base/quarter amount to quarters after T quarter
	var i,amounts = [];
	for (i=(iNumQuarters - 1); i>0; i--) {
		amounts[i] = iBase;
		iTotalAmount -= iBase;
	}
	amounts[0] = iTotalAmount;  // remaining amount goes to T quarter

	// It's possible for the first quarter to be $2-3 more than the other quarters.
	// If so, subtract $1 from the first and add it to the others as needed.
	// Example: $3500 in FWS: 1168/1166/1166; should be: 1167/1167/1166
	//        : $7 in XFWS: 4/1/1/1; should be: 2/2/2/1
	for (i=1; i<iNumQuarters; i++) {
		if ((amounts[i] > 0) && (amounts[0] > amounts[i] + 1)) {
			++amounts[i];
			--amounts[0];
		}
	}
	//for (i = 0; i < amounts.length; i++) console.log(i + ". $" + amounts[i]);//TEST

	// load amounts[] values into $inputs
	for (i=0; i<$inputs.length; i++) {
		$inputs.eq(i).val(amounts[i]).change();
	}
}


function bgt_EditBudgetForm()
{
	gbIsBudgetCalc = false;
	var bHasErrors = false;

	// remove updated/error/warning text, if any are visible
	var objField = $("#tabBudgetDiv div.temporaryDisplay:visible");
	if (objField.length > 0) {
		objField.hide();
	}

	var comment = $("#txtBudgetRevision").val().trim();
	if (comment.length > 0) {
		var ascii = /^[ -~]+$/;  // valid ASCII is any char from space to tilde
		if ( ! ascii.test(comment)) {
			$("#divBudgetRevisionError").show();
			$("#txtBudgetRevision").focus().select();
			errorMessageBlink($('#fontHeaderBudgetRevisionComment'), 3500, 500, true);
			return;
		}
	}
	$("#divBudgetRevisionError").hide();  // in case it was on

/*//test - what to do here...?
	if (bHasErrors) {
//		doc_AddErrors();
		$("#divBudgetUpdatedError").show(); //.delay(5000).slideUp(500);
		return;
	}
//*/

	// Now make sure one and only one Revision field has been selected:	
	if ($("#txtBudgetRevision").val().search(/\S/) == -1) {
		document.forms[0].txtBudgetRevision.value = ""; // eliminate any spaces entered
	}
	if (!$("#txtBudgetRevision").val() && $("#dropBudgetRevision").val() == 0) {
		document.forms[0].dropBudgetRevision.focus();
//test - scroll to something below Revision Comment table?
		scrollToElement($('#bttnBudgetSubmit'), 30);
		errorMessageBlink($('#fontHeaderBudgetRevisionComment'), 3500, 500, true);
		return;
	}

	bgt_SaveFieldChanges();

	gbIsFormChanged = false;
	ajaxFormSubmit();
}


function bgt_Initialization()
{
	//console.log("bgt_Initialization()");//TEST
/*/test
	if (typeof errors === "object") {
		console.log("typeof errors: " + typeof errors);
		console.log("errors.msgs[1]: " + errors.msgs[1]);
	}
	//var sdb = { student: { firstName: "Carlee Rose", lastName: "Wengel", number: "1134151", systemKey: "001338279" }, step: 02 };
	//console.log("sdb is apparently okay");
	var json = "{\"msgs\":[\"\",\"error #1\",\"error #2\"],\"fields\":[{\"name\":\"ovr_class\",\"qtrEC\":[0,0,0,1]}]})";
	json = "{\"msgs\":[\"\",\"error #1\",\"error #2\"],\"fields\":[{},{}]}";
//	var json = "{\"msgs\":[\"one\",\"two\"]}";
	var test = JSON.parse(json);//JSON.stringify(json));
//	var test = JSON.parse(eval("("+json+")"));//JSON.stringify(json));
	//console.log("msgs[1] = " + test.msgs[1]);
//	console.log(JSON.stringify(test.msgs));
//	console.log(JSON.stringify(test.msgs[1]));
//*/
//test
	//var data = JSON.parse(JSON.stringify("{item1:'bob'}"));
	//var data = JSON.parse(JSON.stringify(eval("(" + response.d + ")")));
//	var data = JSON.parse(JSON.stringify(eval("(" + "{item1:'bob'}" + ")")));
/*
	var data = JSON.parse(JSON.stringify(eval("(" + "{qtr:[{item:1,item2:'ok'},{item:2}]}" + ")")));
	console.log("data: " + data);
	console.log("data.qtr[0].item: " + data.qtr[0].item);
	console.log("data.qtr[0].item2: " + data.qtr[0].item2);
	console.log("data.qtr[1].item: " + data.qtr[1].item);
//test */

	if (!gbIsUpdateAllowed || giStudentNo == 0) {
		$("#tabBudgetDiv").find("input").each(function() {
			$(this).attr("disabled","true");
		});
		if (giStudentNo == 0) {
			bgt_ToggleBudgetPlus(); // full empty Budget Plus table looks ugly
		}
		return;
	}

	var $input, iColNo, iRowNo, name, value;
	// add features to input[type=text] for Demographics table
	var $table = $("#tblBudgetDemographics");
	$table.find("tr").has("input[type='text']").each(function(index,source) {
		iRowNo = index + 1;
		$(source).find("td.summer,td.autumn,td.winter,td.spring").each(function (index) {
			iColNo = index + 1;
			$(this).find("input[type=text]").each(function() {
//				$(this).attr("data-row", iRowNo).attr("data-col", iColNo);
				$input = $(this);
				$input.attr("data-row", iRowNo).attr("data-col",iColNo);
			});
		});
	});

	// set 'override' class for any input/text with a value
	$table.find("input[type='text']").each(function() {
		$input = $(this);
		if ($input.val().length > 0) {
			$input.addClass("override");
		}
	});

	// For any row with an override value (has <span>), add a <span> element to non-overrides.
	// Purely cosmetic; without this the <input> field floats in the middle and looks ugly.
	$table.find("tr").has("td.cellText > span").each(function (index, source) {
		//console.log(+index + ". html:" + $(source).html());//TEST
		$(source).find("td.cellText").not(":has('span')").prepend("<span>&nbsp;</span>");
	});

	// add features to input[type=text] for Budget table(s)
	var title =
			"Special Key Functions:"
		//+	"\n   G,Q,Y - Key modifiers"
		+	"\n   T - divide Total into budget quarters"
		+	"\n   U - Undo changes";

	$table = $("#tblBudgetAmounts");
	$table.find("tr").has("input[type='text']").each(function(index,source) {
		iRowNo = index + 1;
		$(source).find("td.summer,td.autumn,td.winter,td.spring").each(function (index) {
			iColNo = index + 1;
			$(this).find("input[type=text]").each(function () {
				$(this).attr("valid_input", "numeric")
						.attr("data-row", iRowNo).attr("data-col", iColNo)
						.bind("keyup", bgt_KeyUpEvent)
						.attr("title", title);
			});
		});
	});

	$table.find("input[type=checkbox]").each(function () {
		var $cbox = $(this);
		$cbox.bind("click", bgt_QuarterClick).data("orig_value", $cbox.attr("checked"));
	});
	$table.find("tr:nth-child(2) input").each(function () {
		bgt_ToggleQuarter(this, false);
	});

	// bind text fields to bgt_QuarterChange; set data attribute "orig_value"
	var $field;
	$("#tblBudgetAmounts,#tblBudgetDemographics").find("input[type=text]").each(function () {
		$field = $(this);
		$field.bind("change", bgt_QuarterChange)
			.bind("blur", bgt_QuarterChange) // sometimes onChange doesn't fire
			.data("orig_value", $field.val());
	});

	// enhanced visibility for checkboxes when focus is on them
	$("#tblBudgetAmounts").find("input[type=checkbox]").each(function () {
		$(this).bind("focus",checkboxEnhancedFocus).bind("blur",checkboxEnhancedFocus);
	});

	bgt_CalculateAnnualTotals();
	bgt_ToggleBudgetPlus();

	var $tab = $("#tabBudget");
	if ($tab.hasClass("tabError")) {
		$("#divBudgetUpdatedError").show().find("img").attr("src",gsErrorImage);
	}
	else if (!gbIsBudgetCalc) {
		gaFieldChanges = [];  // no error & !BudgetCalc, so don't restore changes
	}
	if (gbIsBudgetCalc) {  // UI to show Budget Calc in process, even when errors
		var $row;
		$("#tblBudgetAmounts tr").each(function(index){
			$row = $(this);
			if (index == 0) {
				$row.css("border-top","solid 3px #96f");
			}
			$row.css("border-left","solid 3px #96f").css("border-right","solid 3px #96f");
			if ($(this).find("#bttnBudgetCalc").length > 0) {
				$row.css("border-bottom","solid 3px #96f")
				$row.find("td").addClass("colorPackageAward");
				return false;
			}
		});
		$("#spanBudgetCalcActive").show();
	}

	// restore "dirty" class and orig_value's (in case of error)
	if (Object.keys(gaFieldChanges).length > 0) {
		for (var key in gaFieldChanges) {
			$field = $J(key);
			$field.data("orig_value",gaFieldChanges[key]).addClass("dirty");
			if ($field.is("input[type=checkbox]")) {
				$field.parent().addClass("dirty");  // for bgt_DirtyFormHandler()
			}
		}

		gaFieldChanges = [];
/*//test - don't seem to be needed:
		$("#spanBudgetChanged").show();
		$tab.addClass("tabDirty");
		gbIsFormChanged = true;
*/
	}

	if (typeof(dirtyOverrides) == "object") {
		bgt_AddBudgetCalcDirtyPushedOverrides();
	}
}


function bgt_KeydownHandler(pTargetId, pKeyCode)
{
	//console.log("bgt_KeydownHandler(" + pTargetId + "," + pKeyCode + ")");//TEST
	var $target = $J(pTargetId);
	if ($target.length == 0) {
		return;
	}

	// for now, these actions should only apply to the budget/right table
	if ($target.closest("#tblBudgetAmounts").length == 0) {
		return;
	}

	var char = String.fromCharCode(pKeyCode).toUpperCase();

	if (char.search(/[GQY]/) == 0) {  // G/Q/Y modifier
		gsPriorElementId = pTargetId;
		gsPriorAwardAction = char;
		return;
	}

	if (char.search(/[TU]/) != 0) {
		gsPriorElementId = pTargetId;
		gsPriorAwardAction = "";
		return;
	}

	if (gsPriorElementId != pTargetId) {
		gsPriorAwardAction = ""; // unset the prior action if focus moved to a different field
	}
	else {
		if ((char == "U")
		&&  (gsPriorAwardAction.search(/[gqy]/) == 0)) {
			// apply the last modifier to the Undo action
			gsPriorAwardAction = gsPriorAwardAction.toUpperCase();
		}
	}

	if (char == "T") {
		bgt_DivvyAmountTotal($target);
		gsPriorAwardAction = "Y";
		bgt_TableActionBlockCheck($target);
	}
	else if (gsPriorAwardAction == "G") {
		bgt_TableActionForAll($target, char);
		bgt_TableActionBlockCheck($target);
	}
	else if (gsPriorAwardAction == "Q") {
		bgt_TableActionForQuarter($target,char);
	}
	else if (gsPriorAwardAction == "Y") {
		bgt_TableActionForYear($target,char);
		bgt_TableActionBlockCheck($target);
	}
	else {
		bgt_TableKeypressApply($target,char);
	}

	if ((char == "T")
	&&  (gsPriorAwardAction.search(/[GQY]/) == 0)) {
		// save the modifier [GQY] in case user decides to U-undo
		gsPriorAwardAction = gsPriorAwardAction.toLowerCase();
	}
	else {
		gsPriorAwardAction = char;
	}
	gsPriorElementId = pTargetId;
}


function bgt_KeyUpEvent()
{
	//console.log("bgt_KeyUpEvent for " + $(this).attr('id'));//TEST
	bgt_QuarterChangeAutoBlock(this);
	bgt_CalculateAnnualTotals()
}


function bgt_QuarterChange()
{
	//console.log("bgt_QuarterChange for " + $(this).attr("id"));//TEST
	var $input = $(this);
	var isChange = ($input.val() != $input.data("orig_value"));
	if (isChange == $input.hasClass("dirty")) {
		return; // nothing to do
	}

//test - old code I think, remove commented lines
//	var srcValue;
//	var $src = $input.nextAll("input[type=hidden]").first();
	if (isChange) {
		$input.addClass("dirty");
//		srcValue = "";
//		$src.data("orig_value",$src.val()).val(srcValue);
	} else {
		$input.removeClass("dirty");
//		srcValue = $src.data("orig_value");
	}
//	$input.next().html(srcValue);
//test end

	bgt_DirtyFormHandler();
}


// Automatically set/unset the "Quarter is Blocked" checkbox when
// Basic Budget field amounts change
function bgt_QuarterChangeAutoBlock(source)
{
	//if (!source.id.startsWith("txtAmt")) return; // IE doesn't like
	if (source.id.indexOf("txtAmt") != 0) return;
	var qtrCode = parseInt(source.id.charAt(source.id.length - 1));
	if (isNaN(qtrCode)) return;

	// if "Quarter is Blocked" already selected, don't auto-change
	var $cboxBlocked = $("#chkAmtBlockedQ" + qtrCode);
	if ($cboxBlocked.data("orig_value") == true) return; //test - does this work for all browsers?

	// determine if any Basic Budget fields have changed
	var qtrName = gasQtrNameByCode[qtrCode].toLowerCase();
	var $input, isChangePresent = false;
	$("tr.bgtBasic td." + qtrName + " input[type=text]").each(function () {
		$input = $(this);
		if ($input.val() != $input.data("orig_value")) {
			isChangePresent = true;
		}
	});

	// set the "Quarter is Blocked" checkbox appropriately
	if ((isChangePresent && !$cboxBlocked.attr("checked"))
	||  (!isChangePresent && $cboxBlocked.attr("checked"))) {
		if (isChangePresent) {
			$cboxBlocked.attr("checked",true)
				.addClass("dirty").parent().addClass("dirty");
		} else {
			$cboxBlocked.attr("checked",false)
				.removeClass("dirty").parent().removeClass("dirty");
		}
		bgt_ToggleQuarterBlock($cboxBlocked);
	}
}


function bgt_QuarterClick()
{
	//console.log("bgt_QuarterClick() for " + $(this).attr("id"));//TEST
	var $input = $(this);
	var origValue = $input.data("orig_value");
	var checked = $input.attr("checked");
	if (checked == origValue) {
		$input.removeClass("dirty").parent().removeClass("dirty");
	} else {
		$input.addClass("dirty").parent().addClass("dirty");
	}

	bgt_DirtyFormHandler();
}


function bgt_ProcessCalc(source)
{
	gbIsBudgetCalc = true;
	bgt_SaveFieldChanges();

	bgt_AjaxApiCall(source);
}


/* currently not used
function bgt_ProcessCalcCancel()
{
	for (var q = 1; q < 5; q++) {
		if ( ! $("#chkAmtBlockedQ" + q).attr("checked")) {
			__resetInputValue("txtAmtTuitionQ" + q);
			__resetInputValue("txtAmtBooksQ" + q);
			__resetInputValue("txtAmtRoomBoardQ" + q);
			__resetInputValue("txtAmtAllowanceQ" + q);
			__resetInputValue("txtAmtPersonalQ" + q);
			__resetInputValue("txtAmtTransportQ" + q);
		}
	}

	bgt_CalculateAnnualTotals();

	var $row;
	$("#tblBudgetAmounts tr").each(function (index) {
		$row = $(this);
		$row.css("border","inherit");
		if ($(this).find("#bttnBudgetCalc").length > 0) {
			$row.find("td").removeClass("colorPackageAward");
			return false;
		}
	});
	$("#spanBudgetCalcActive").hide();

	function __resetInputValue(fieldName) {
		$J(fieldName).val(gaBudgetSdbValues[fieldName]);
	}
}*/


function bgt_ProcessCalcFill(json)
{
	var q;
	for (var i = 0; i < 4; i++) {
		if ((json.qtr[i].active == "Y")
		&&  (json.qtr[i].blocked != "Y")) {
			q = i + 1;
			$("#txtAmtTuitionQ" + q).val(json.qtr[i].tuition);
			$("#txtAmtBooksQ" + q).val(json.qtr[i].books);
			$("#txtAmtRoomBoardQ" + q).val(json.qtr[i].room);
			$("#txtAmtPersonalQ" + q).val(json.qtr[i].personal);
			$("#txtAmtTransportQ" + q).val(json.qtr[i].transport);
		}
	}
}


function bgt_SaveFieldChanges()
{
	// prior to update, save all "dirty" fields in gaFieldChanges array
	var $field, id, name;
	$(".dirty").each(function () {
		$field = $(this);
		if ($field.is("td")) {
			$field = $field.find("input[type=checkbox]");
		}
		id = $field.attr("id");

		if (id) {
			// set hidden form field to indicate user change to Demographics fields
			gaFieldChanges[id] = $field.data("orig_value");
			if (id.indexOf("txtDG") === 0) {
				// set corresponding hdnDG* field to Y for server-side processing:
				$field.siblings("input[type=hidden]").eq(0).val("Y");
			}
		}
	});

//test5
	// set once when the first Budget Query is run to save SDB values
	if (Object.keys(gaBudgetSdbValues).length == 0) {
		$("#tblBudgetAmounts tr.bgtBasic").find("input[type=text]").each(function () {
			gaBudgetSdbValues[this.id] = $(this).val();
		});
	}
}


// "Quarter is Blocked" checkbox may need checking/unchecking
function bgt_TableActionBlockCheck($target)
{
	if ($target.closest("tr").hasClass("bgtBasic")) {
		var $inputs = $target.closest("tr").find("input:not([disabled])");
		$inputs.each(function() {
			bgt_QuarterChangeAutoBlock(this);
		});
	}
}


// Perform an action for all budgets in this table
function bgt_TableActionForAll($pTarget, pEventChar)
{
	//$("#tblBudgetAmounts").find("input[type=text]").each(function(index) { // entire table
	var rowClass = ($pTarget.attr("id").indexOf("txtAmt") == 0) ? "bgtBasic" : "bgtPlus";
	var selector = "#tblBudgetAmounts tr." + rowClass;
	$(selector).find("input[type=text]").each(function (index) {
		//console.log("bgt_TableActionForAll(" + pEventChar + ") - " + $(this).attr("id"));//TEST
		bgt_TableKeypressApply($(this), pEventChar);
	});
}

// Perform an action for all budgets in this quarter
function bgt_TableActionForQuarter($pTarget, pEventChar)
{
	var rowClass = ($pTarget.attr("id").indexOf("txtAmt") == 0) ? "bgtBasic" : "bgtPlus";
	var rowSelector = "#tblBudgetAmounts tr." + rowClass;
	var iColNo = $pTarget.data("col");
	var selector = "input[type=text][data-col=" + iColNo + "]";
	//$("#tblBudgetAmounts").find(selector).each(function (index) { // entire table
	$(rowSelector).find(selector).each(function (index) {
		//console.log("bgt_TableActionForQuarter(" + pEventChar + ") - " + $(this).attr("id"));//TEST
		bgt_TableKeypressApply($(this), pEventChar);
	});
}


// Perform an action for all quarters for this budget
function bgt_TableActionForYear($pTarget, pEventChar)
{
	var $inputs = $pTarget.closest("tr").find("input:not([disabled])");
	$inputs.each(function () {
		//console.log("bgt_TableActionForYear(" + pEventChar + ") - " + $(this).attr("id"));//TEST
		bgt_TableKeypressApply($(this), pEventChar);
	});
}


// Perform an action for a specific input target
function bgt_TableKeypressApply($pTarget, pEventChar)
{
	if (pEventChar == "U") {
		$pTarget.val($pTarget.data("orig_value")).change();
	}
}


function bgt_TableMoveUpDown(pId, pKeyCode)
{
	var $currCell = $("#" + pId);
	if ($currCell.length == 0) { return; }
	var iRowNo = $currCell.data("row");
	var iColNo = $currCell.data("col")
	if (isNaN(iRowNo) || isNaN(iColNo)) { return; }

	var $table = $currCell.closest("table");
	var iRowCount = $table.find("tr").has("input[type=text]").length;
	if (iRowCount == 0) { return; }

	var hasLooped = false;
	var $cell;
	if (pKeyCode == 38) { // up
		--iRowNo;
		while (true) {
			if (iRowNo == 0) {
				if (hasLooped) {
					break;
				} else {
					iRowNo = iRowCount;
					hasLooped = true;
				}
			}
			$cell = $table.find("input:visible[data-row=" + iRowNo + "][data-col=" + iColNo + "]:not([disabled])");
			if ($cell.length > 0) {
				$currCell.blur();
				$cell.focus().select();
				break;
			}
			--iRowNo;
		}
	}
	else { // down
		++iRowNo;
		while (true) {
			if (iRowNo > iRowCount) {
				if (hasLooped) {
					break;
				} else {
					iRowNo = 1;
					hasLooped = true;
				}
			}
			$cell = $table.find("input:visible[data-row=" + iRowNo + "][data-col=" + iColNo + "]:not([disabled])");
			if ($cell.length > 0) {
				$currCell.blur();
				$cell.focus().select();
				break;
			}
			++iRowNo;
		}
	}
}


function bgt_ToggleQuarter(source,isFieldChange)
{
	//console.log("bgt_ToggleQuarter() for " + $(source).attr("id")+"; isFieldChange:"+isFieldChange);//TEST
	var $cbox = $(source);
	var checked = $cbox.attr("checked");
	if (checked) {
		$cbox.parent().removeClass("disabled");
	} else {
		$cbox.parent().addClass("disabled");
	}
	var qtrCode = parseInt($cbox.attr("id").substr(13, 1));
	var qtrName = gasQtrNameByCode[qtrCode];
	var qtrNameLC = qtrName.toLowerCase();
	var $cells = $('#tblBudgetDemographics .cellText.' + qtrNameLC);
	$.merge($cells, $("#tblBudgetAmounts .cellText." + qtrNameLC));
	var $cell;
	$cells.each(function () {
		$cell = $(this);
		if (checked) {
			$cell.removeClass("disabled");
			$cell.find("input,select").removeAttr("disabled");
		}
		else {
			$cell.addClass("disabled");
			$cell.find("input,select").attr("disabled", "true");
		}
	});

	bgt_ToggleQuarterBlock($("#chkAmtBlockedQ" + qtrCode).get(0));

	if (isFieldChange) {
		var $img = $("#imgBBtoggle");
		if ($img.data("toggle_state") != "collapse") {
			$img.data("toggle_state", "collapse");
			bgt_ToggleBudgetPlus();
		}

		bgt_CalculateAnnualTotals();
	}
}


//test3 function bgt_ToggleQuarterBlock(source)
function bgt_ToggleQuarterBlock(source,isFieldChange)
{
	//console.log("bgt_ToggleQuarterBlock() for " + $(source).attr("id"));//TEST
	var $cbox = $(source);
	var checked = $cbox.attr("checked");
	if ($cbox.parent().hasClass("disabled")) {
		checked = false;
	}
	if (checked) {
		$cbox.parent().addClass("blocked");
	} else {
		$cbox.parent().removeClass("blocked");
	}
	var qtrCode = parseInt($cbox.attr("id").substr(14,1));
	var qtrNameLC = gasQtrNameByCode[qtrCode].toLowerCase();
	var $cells = $("#tblBudgetAmounts tr.bgtBasic .cellText." + qtrNameLC);
	var $cell;
	$cells.each(function () {
		$cell = $(this);
		if (checked) {
			$cell.addClass("blocked");
		} else {
			$cell.removeClass("blocked");
		}
	});
//test3
/*//test7
	if (isFieldChange) {
		$("#hdnAmtBlockedQ" + qtrCode).val(checked ? "ON" : "OFF");
		//console.log("hdnAmtBlockedQ" + qtrCode + " set to " + $("#hdnAmtBlockedQ" + qtrCode).val());//TEST
	}
//test7*/
}


// function bgt_CalculateAnnualTotals must be called first
function bgt_ToggleBudgetPlus()
{
	var $img = $("#imgBBtoggle");
	var $rows = $("#tblBudgetAmounts tr.bgtPlus");
	if ($img.data("toggle_state") != "collapse") {
		$rows.show();
		$img.attr("src", "/sisOSFA/images/collapse.gif")
			.data("toggle_state", "collapse");
	}
	else {
		var value, $cell;
		$rows.find("td.total").each(function () {
			$cell = $(this);
			value = $cell.text().trim();
			if (!value || value == "$0") {
				$cell.parent().hide();
			} else {
				$cell.parent().show();
			}
		});
		$img.attr("src", "/sisOSFA/images/expand.gif")
			.data("toggle_state", "expand");
	}
}
