var app = 'tipper';
var lastOne = '0';
var chunk = 1000;
var myAccount = 'tipu';
var myMemo = '';
var myFee = 0.001 //Per Transaction
var totalFee = 0; //Total Fee
var feeFlag = false;

function appendHTML(html, resetFlag) {
   var div = document.createElement("div");
   div.innerHTML = html;

   if (resetFlag == null) {
      resetFlag = false;
   }
   if (resetFlag) {
      document.getElementById('result').innerHTML = "";
   }

   document.getElementById('result').appendChild(div);
   window.scrollTo(0, document.body.scrollHeight);
}


function checkAccountName(flag) {
   if (flag == null) {
      flag = false;
   }
   disableTransfer();
   var accountName = document.getElementById('accountName').value;
   steem.api.getAccounts([accountName], function (err, result) {
      if (result.length == 0) {
         var errorMessage = 'Not available!';
         document.getElementById('accountName_err').innerHTML = errorMessage;
         return false;
      } else {
         if (parseFloat(result[0].sbd_balance) < totalFee) {
            var errorMessage = 'Not enough SBD!';
            document.getElementById('accountName_err').innerHTML = errorMessage;
            document.getElementById('transfer').disabled = true;
            return false;
         } else {
            document.getElementById('accountName_err').innerHTML = '';
            if (flag && totalFee > myFee) {
               disableTransfer(false);
            }
            return true;
         }
      }
   });
}

function checkTipAmount() {
   disableTransfer();
   var tipAmount = document.getElementById('tipAmount').value;
   var errorMessage = '';
   document.getElementById('tipAmount_err').innerHTML = errorMessage;
   var reg = /^\d*[\.]\d*$/;
   var tip = parseFloat(tipAmount);
   if (!tipAmount.match(reg) || tip < 0.001 || tipAmount.split('.')[1].length > 3) {
      var errorMessage = 'Not valid!';
      document.getElementById('tipAmount_err').innerHTML = errorMessage;
      return false;
   } else {
      return true;
   }
}

function validate() {
   checkAccountName();
   checkActiveKey();
   checkTipAmount();
   checkInactiveHours();
   checkTipMessage();

   var elements = document.getElementsByClassName('error');
   for (e = 0; e < elements.length; e++) {
      if (elements[e].innerHTML != "") {
         return false;
      }
   }

   return true;
}

function calculateFee() {
   totalFee = myFee;
   if (validate()) {
      appendHTML("", true);
      disableAll(true);
      startLoading();
      var accountName = document.getElementById('accountName').value;
      getFollowers(accountName);
   }
}

function checkTipMessage() {
   var tipMessage = document.getElementById('tipMessage').value;
   var errorMessage = '';
   document.getElementById('tipMessage_err').innerHTML = errorMessage;
   if (tipMessage == null || tipMessage == '') {
      var errorMessage = 'Type something!';
      document.getElementById('tipMessage_err').innerHTML = errorMessage;
      return false;
   } else {
      return true;
   }
}

function checkInactiveHours() {
   disableTransfer();
   var inactiveHours = document.getElementById('inactiveHours').value;
   var errorMessage = '';
   document.getElementById('inactiveHours_err').innerHTML = errorMessage;
   var reg = /^[\d]\d*$/;
   var hours = parseInt(inactiveHours);
   if (!inactiveHours.match(reg) || hours < 1) {
      var errorMessage = 'Not valid!';
      document.getElementById('inactiveHours_err').innerHTML = errorMessage;
      return false;
   } else {
      return true;
   }
}

function checkActiveKey() {
   disableTransfer();
   var activeKey = document.getElementById('activeKey').value;
   var errorMessage = '';
   document.getElementById('activeKey_err').innerHTML = errorMessage;

   if (!steem.auth.isWif(activeKey)) {
      var errorMessage = 'False key!';
      document.getElementById('activeKey_err').innerHTML = errorMessage;
      return false;
   } else {
      var accountName = document.getElementById('accountName').value;
      steem.api.getAccounts([accountName], function (err, result) {
         if (result.length > 0) {
            var activeKey = document.getElementById('activeKey').value;
            var publicKey = result[0].active.key_auths[0][0];
            if (!steem.auth.wifIsValid(activeKey, publicKey)) {
               var errorMessage = 'Wrong key!';
               document.getElementById('activeKey_err').innerHTML = errorMessage;
               return false;
            }
         } else {
            return true;
         }
      });
   }
}


function disableAll(flag) {
   if (flag == null) {
      flag = true;
   }
   document.getElementById('accountName').disabled = flag;
   document.getElementById('activeKey').disabled = flag;
   document.getElementById('tipAmount').disabled = flag;
   document.getElementById('inactiveHours').disabled = flag;
   document.getElementById('tipMessage').disabled = flag;
   document.getElementById('calculateFee').disabled = flag;

   if (flag) {
      document.getElementById('transfer').disabled = flag;
   }
}

function disableTransfer(flag) {
   if (flag == null) {
      flag = true;
   }
   document.getElementById('transfer').disabled = flag;
}

var barId = 0;

function startLoading(milliseconds) {
   if (milliseconds == null) {
      milliseconds = true;
   }
   document.getElementById('status').innerHTML = 'PLEASE WAIT';
   barId = window.setInterval(loadBar, milliseconds);
}

function stopLoading(message) {
   if (message == null) {
      message = '';
   }
   window.clearInterval(barId);
   document.getElementById('status').innerHTML = message;
   document.getElementById('bar').innerHTML = '';
}

function loadBar() {
   var barValue = document.getElementById('bar').innerHTML;
   if (barValue.length == 3) {
      barValue = '';
   } else {
      barValue += '.';
   }

   document.getElementById('bar').innerHTML = barValue;
}

function transferTheTips() {
   var myFee_ = (followers__.length * myFee).toFixed(3) + " SBD";
   var confirm_ = confirm("This is a clientside application, which means if you close this window, the application will stop without completeing all the transactions. The first transaction will be @msg768's fee which is " + myFee_ + ". All transfers are non-refundable. Are you sure you want to continue?");

   if (confirm_) {
      disableAll();
      startLoading();

      var activeKey = document.getElementById('activeKey').value;
      var accountName = document.getElementById('accountName').value;

      appendHTML("<BR />");
      steem.broadcast.transfer(activeKey, accountName, myAccount, myFee_, myMemo, function (err, result) {
         if (err == null) {
            appendHTML("Transfered " + myFee_ + " To @msg768.");
            var activeKey = document.getElementById('activeKey').value;
            var accountName = document.getElementById('accountName').value;
            var tipMessage = document.getElementById('tipMessage').value;
            var tipAmount = document.getElementById('tipAmount').value;
            tipAmount = parseFloat(tipAmount).toFixed(3) + " SBD";
            bulkTransfer(accountName, activeKey, tipAmount, tipMessage);
         } else {
            appendHTML("Transfering " + myFee_ + " To @msg768 Failed.");
            disableAll(false);
            console.log(err);
            stopLoading();
         }
      });
   }
}
