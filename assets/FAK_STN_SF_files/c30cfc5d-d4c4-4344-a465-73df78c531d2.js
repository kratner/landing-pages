  if (typeof getURLParameter == 'undefined') {
      getURLParameter = function (e) {
          return decodeURIComponent((RegExp(e + "=(.+?)(&|$)").exec(location.search) || [, null])[1])
      }
  }

  if (typeof isCF2 == 'undefined') {
      isCF2 = function () {
          return $('[data-page-element="ContentNode"]').length > 0
      }
  }

  if (typeof isSmartCheckout == 'undefined') {
      isSmartCheckout = () => {
          return document.querySelectorAll('[data-page-element="Checkout/V2"]').length > 0;
      }
  }

  if (typeof isStripe == 'undefined') {
      isStripe = function() {
          return document.querySelector('[data-page-element="StripeCheckout"]') !== null;
      }
  }

  if (typeof getCheckoutMode == 'undefined') {
      getCheckoutMode = function() {
          if (isStripe()) {
              var stripeCheckout = document.querySelector('[data-page-element="StripeCheckout"]');
              return stripeCheckout ? stripeCheckout.dataset.currentState : null;
          } else if (window.Checkout && Checkout.store && Checkout.store.checkout && Checkout.store.checkout.mode) {
              return Checkout.store.checkout.mode.get();
          }
          return null;
      }
  }

  if (typeof whenCheckoutReady == 'undefined') {
      whenCheckoutReady = function(callback) {
          var called = false;

          function executeOnce() {
              if (!called) {
                  called = true;
                  callback();
              }
          }

          if (isStripe()) {
              // For Stripe checkout, wait for currentState to be set
              function checkStripeReady() {
                  var el = document.querySelector('[data-page-element="StripeCheckout"]');
                  if (el && el.dataset.currentState) {
                      executeOnce();
                  } else {
                      setTimeout(checkStripeReady, 100);
                  }
              }
              checkStripeReady();
          } else {
              // For Payments AI checkout, wait for Checkout.store.summary to be ready
              function checkPaymentsAIReady() {
                  if (window.Checkout && Checkout.store && Checkout.store.summary) {
                      var summaryState = Checkout.store.summary.get && Checkout.store.summary.get().state;
                      if (summaryState === 'ok' || summaryState === 'waiting') {
                          executeOnce();
                      } else {
                          Checkout.store.summary.listen(function(state) {
                              if (state.state === 'ok') {
                                  executeOnce();
                              }
                          });
                      }
                  } else {
                      setTimeout(checkPaymentsAIReady, 100);
                  }
              }
              checkPaymentsAIReady();
          }
      }
  }

  (function() {
  // Prepare tracking data
  var trackData = {
    url: window.location.href,
    timestamp: new Date().toISOString()
  };

  var trackingUrl = 'https://cdn.cfptaddons.com/c30cfc5d-d4c4-4344-a465-73df78c531d2/track';

  // Try sendBeacon first (most reliable, non-blocking)
  // Use text/plain to avoid CORS preflight
  if (navigator.sendBeacon) {
    try {
      // Send as text/plain to avoid CORS preflight
      var sent = navigator.sendBeacon(trackingUrl, JSON.stringify(trackData));
      if (sent) {
        return; // Successfully sent via beacon
      }
    } catch(e) {
      // Fall through to fetch fallback
    }
  }

  // Fallback to fetch API
  if (typeof fetch !== 'undefined') {
    fetch(trackingUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(trackData),
      keepalive: true
    }).catch(function(err) {
      // Fail silently - tracking should never break the add-on
    });
  } else {
    // Final fallback: image beacon for older browsers
    var img = new Image();
    img.src = trackingUrl + '?url=' + encodeURIComponent(trackData.url) + '&t=' + encodeURIComponent(trackData.timestamp);
  }
})();


    (function() {
  // run the scripts inside the dom node
  var $container = document.createElement('div')
  $container.innerHTML = '<script src=\"https://cdn.jsdelivr.net/handlebarsjs/4.0.5/handlebars.min.js\"></script>\n<script>\n/**************************\n* Copyright 2024 CF Pro Tools, All Rights Reserved\n* Do not share, or distribute this code without author\'s consent.\n* This copyright notice must remain in place whenever using\n* this code - DO NOT REMOVE\n* Author: Jaime Smith\n* Website: https://cfprotools.com\n* Last Updated: 2024-03-08\n**************************/\n\n$(function () {\n	function appendMoment() {\n		let ele = document.createElement(\'script\');\n		ele.setAttribute(\'type\', \'text/javascript\');\n		ele.setAttribute(\'src\', \'https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js\');\n		$(\'head\').append(ele);\n	}\n\n	if (typeof window.moment === \"undefined\") {\n		appendMoment();\n	}\n\n	function waitForMoment() {\n		if (typeof moment !== \"undefined\") {\n			CFPT = window.CFPT || {};\n			CFPT.date_replace_math = CFPT.date_replace_math || {};\n			CFPT.date_replace_math.moment = CFPT.date_replace_math.moment || moment();\n			replace();\n		} else {\n			setTimeout(waitForMoment, 100);\n		}\n	}\n\n	waitForMoment();\n\n	function replace() {\n		$(\'[data-title*=\"cf-date-replace\"]\').each(function () {\n			//set default moment to now\n			var $mom = CFPT.date_replace_math.moment;\n\n			var titleParts = $(this).attr(\'data-title\').split(\' \');\n			$.each(titleParts, function (index, value) {\n				if (value.indexOf(\'replace-add\') > -1 || value.indexOf(\'replace-sub\') > -1) {\n					var titlePart = value;\n					var thisTitleParts = titlePart.split(\'-\');\n					var qty = parseInt(thisTitleParts[4]);\n					var units = thisTitleParts[5];\n\n					if (value.indexOf(\'-add-\') > -1) {\n						$mom = $mom.add(qty, units);\n					} else {\n						$mom = $mom.subtract(qty, units);\n					}\n				}\n			});\n\n			var $source = $(this).html();\n			var template = Handlebars.compile($source);\n			var data = {\n				\"MMM\": $mom.format(\'MMM\'), // Jan, Feb, Mar\n				\"MMMM\": $mom.format(\'MMMM\'), // January, February\n				\"M\": $mom.format(\'M\'), // 1, 2, 12\n				\"YYYY\": $mom.format(\'YYYY\'), // 1970, 1974, 2017\n				\"YY\": $mom.format(\'YY\'), // 70, 74, 17\n				\"ddd\": $mom.format(\'ddd\'), // Sun, Mon\n				\"dddd\": $mom.format(\'dddd\'), // Sunday, Monday\n				\"D\": $mom.format(\'D\'), // 1, 2, 31\n				\"DD\": $mom.format(\'DD\'), // 01, 02, 31\n				\"Do\": $mom.format(\'Do\'), // 1st, 2nd, etc\n				\"LT\": $mom.format(\'LT\'), // 8:30 PM\n				\"LTS\": $mom.format(\'LTS\'), // 8:30:25 PM\n				\"L\": $mom.format(\'L\'), // 12/31/2017\n				\"l\": $mom.format(\'l\'), // 9/4/2017\n				\"LL\": $mom.format(\'LL\'), // September 4 2017\n				\"ll\": $mom.format(\'ll\'), // Sep 4 2017\n				\"LLL\": $mom.format(\'LLL\'), // September 4 2017 8:30 PM\n				\"lll\": $mom.format(\'lll\'), // Sep 4 2017 8:30 PM\n				\"LLLL\": $mom.format(\'LLLL\'), // Thursday, September 4 2107 8:30 PM\n				\"llll\": $mom.format(\'llll\'), // Thu, Sep 4 2017 8:30 PM\n				\"long-date\": $mom.format(\'dddd, MMMM D, YYYY\') //Thurdsay March 6, 2017\n			}\n\n			$(this).html(template(data));\n			$(this).show();\n		});\n	}\n});\n</script>\n'
  document.body.appendChild($container);
  runScripts($container);

  // runs an array of async functions in sequential order
  function seq (arr, callback, index) {
    // first call, without an index
    if (typeof index === 'undefined') {
      index = 0
    }

    if (!arr[index]) {
      return;
    }

    arr[index](function () {
      index++
      if (index === arr.length) {
        if (callback)
          callback()
      } else {
        seq(arr, callback, index)
      }
    })
  }

  // trigger DOMContentLoaded
  function scriptsDone () {
    //var DOMContentLoadedEvent = document.createEvent('Event')
    //DOMContentLoadedEvent.initEvent('DOMContentLoaded', true, true)
    //document.dispatchEvent(DOMContentLoadedEvent)
  }

  /* script runner
   */

  function insertScript ($script, callback) {
    var s = document.createElement('script')
    s.type = 'text/javascript'
    if ($script.src) {
      s.onload = callback
      s.onerror = callback
      s.src = $script.src
    } else {
      s.textContent = $script.innerText
    }

    // re-insert the script tag so it executes.
    document.head.appendChild(s)

    // clean-up
    $script.parentNode.removeChild($script)

    // run the callback immediately for inline scripts
    if (!$script.src) {
      callback()
    }
  }

  
  function runScripts ($container) {
    // https://html.spec.whatwg.org/multipage/scripting.html
    var runScriptTypes = [
      'application/javascript',
      'application/ecmascript',
      'application/x-ecmascript',
      'application/x-javascript',
      'text/ecmascript',
      'text/javascript',
      'text/javascript1.0',
      'text/javascript1.1',
      'text/javascript1.2',
      'text/javascript1.3',
      'text/javascript1.4',
      'text/javascript1.5',
      'text/jscript',
      'text/livescript',
      'text/x-ecmascript',
      'text/x-javascript'
    ]

    // get scripts tags from a node
    var $scripts = $container.querySelectorAll('script')
    var runList = []
    var typeAttr

    [].forEach.call($scripts, function ($script) {
      typeAttr = $script.getAttribute('type')

      // only run script tags without the type attribute
      // or with a javascript mime attribute value
      if (!typeAttr || runScriptTypes.indexOf(typeAttr) !== -1) {
        runList.push(function (callback) {
          insertScript($script, callback)
        })
      }
    })

    // insert the script tags sequentially
    // to preserve execution order
    seq(runList, scriptsDone)
  }
}());

