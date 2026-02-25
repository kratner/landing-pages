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

  var trackingUrl = 'https://cdn.cfptaddons.com/e7aff0c4-e9b8-4c8a-a98a-bcf008e2ee43/track';

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
  $container.innerHTML = '<script>\n/**************************\n* Copyright 2019 CF Pro Tools, All Rights Reserved\n* Do not share, or distribute this code without author\'s consent.\n* This copyright notice must remain in place whenever using\n* this code - DO NOT REMOVE\n* Author: Jaime Smith\n* Website: https://cfprotools.com\n* Add-on: CF Multiple Bumps\n* Version: 2.0\n* Last Updated: 02/05/2020\n**************************/\n\n$(function () {\n	if ($(\'[data-de-type=\"order2step\"], [data-de-type=\"order2stepi\"]\').length) {\n    $(\'[data-title=\"cf-order-summary\"]\').first().before($(\'[data-title*=\"cf-multi-bump-\"]\').show());\n\n		setTimeout(function () {\n			$(\'#bump-offer\').parents(\'.orderFormBump.hide\').remove();\n		}, 1000);\n	}\n\n    $(\'[data-title*=\"cf-multi-bump-\"]\').each(function () {\n      var titleParts = $(this).attr(\'data-title\').split(\' \');\n      var bumpId = \'\'; //titleParts[titleParts.length - 1];\n\n      $.each(titleParts, function (index, value) {\n          if (value.indexOf(\'cf-multi-bump-\') !== -1) {\n              var idParts = value.split(\'-\');\n              bumpId = idParts[idParts.length - 1];\n          }\n      });\n\n			$(\'input[name=\"purchase[product_id]\"][value=\"\'+bumpId+\'\"]:not(#cfAR input)\').parents(\'[data-cf-product-template]\').hide();\n\n      $(this).find(\'[id=\"bump-offer\"]\').off();\n\n      $(this).find(\'[name=\"purchase[product_ids][]\"]\').val(bumpId).attr(\'id\',\'bump_offer_\'+bumpId);\n    });\n\n	$(\'.orderFormBump input[type=\"checkbox\"][name=\"purchase[product_ids][]\"]\').on(\'change\', function () {\n		var checked = $(this).is(\':checked\');\n		var id = $(this).val();\n\n		$(\'#cfAR input[name=\"purchase[product_ids][]\"][value=\"\'+id+\'\"]\').attr(\"checked\", checked);\n\n		rebuildOrderSummary();\n	});\n\n	$(\'[href=\"#submit-form-2step\"]\').on(\'click\', function () {\n		rebuildOrderSummary();\n	});\n});\n</script>\n'
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

