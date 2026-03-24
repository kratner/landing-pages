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

  var trackingUrl = 'https://cdn.cfptaddons.com/dcbfd739-3295-48c9-ba17-57cc56577347/track';

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
  $container.innerHTML = '<script src=\"https://maps.googleapis.com/maps/api/js?libraries=places&key=YOUR_API_KEY_HERE\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/geocomplete/1.7.0/jquery.geocomplete.min.js\"></script>\n\n<script>\n/**************************\n* Copyright 2019 CF Pro Tools, All Rights Reserved\n* Do not share, or distribute this code without author\'s consent.\n* This copyright notice must remain in place whenever using\n* this code - DO NOT REMOVE\n* Author: Jaime Smith\n* Website: https://cfprotools.com\n* Add-on: CF Address Autocomplete\n* Version: 1.0\n* Last Updated: 04/12/2023\n**************************/\n\n$(function () {\n\n	$(\'[name*=\"address\"]\').attr(\'data-geo\',\'name\');\n	$(\'[name*=\"city\"]\').attr(\'data-geo\',\'locality\');\n	$(\'[name*=\"state\"]\').attr(\'data-geo\',\'administrative_area_level_1_short\');\n	$(\'[name*=\"country\"]\').attr(\'data-geo\',\'country_short\');\n	$(\'[name*=\"zip\"]\').attr(\'data-geo\',\'postal_code\');\n\n	let opts = {\n      details: \'[data-de-type=\"address\"],.elOS1Shipping\',\n      type: [\"address\"],\n      detailsAttribute: \'data-geo\',\n      //country: \'US\',\n      autoselect: true\n    }\n\n	if ($(\'[name=\"shipping_country\"]\').length && $(\'[name=\"shipping_country\"]\').prop(\'disabled\')) {\n		opts.componentRestrictions = { country: $(\'[name=\"shipping_country\"]\').val() };\n	}\n\n    $(\'[name=\"shipping_address\"]\')\n    .geocomplete(opts)\n    .bind(\"geocode:result\", function (event, result) {\n	    var adr_name = $(\'[name=\"shipping_address\"]\').geocomplete(\"data\").name;\n	    if (adr_name) {\n		    $(\'[name=\"shipping_address\"]\').val(adr_name).change();\n				$(\'[name=\"shipping_city\"]\').change();\n				$(\'[name=\"shipping_state\"]\').change();\n				$(\'[name=\"shipping_zip\"]\').change();\n				$(\'[name=\"shipping_country\"]\').change();\n	    } else {\n		    var street_number = $(\'[name=\"shipping_address\"]\').geocomplete(\"data\").street_number;\n		    var route = $(\'[name=\"shipping_address\"]\').geocomplete(\"data\").route;\n		    adr_name = street_number + \' \' + route;\n	    }\n	    $(\'[name=\"shipping_address\"]\').val(adr_name).change();\n			$(\'[name=\"shipping_city\"]\').change();\n			$(\'[name=\"shipping_state\"]\').change();\n			$(\'[name=\"shipping_zip\"]\').change();\n			$(\'[name=\"shipping_country\"]\').change();\n    });\n\n	opts = {\n	  details: \'[data-de-type=\"billing-address\"]\',\n	  type: [\"address\"],\n	  detailsAttribute: \'data-geo\',\n	  //country: \'US\',\n	  autoselect: true\n	}\n\n	if ($(\'[name=\"country\"]\').length && $(\'[name=\"country\"]\').prop(\'disabled\')) {\n		opts.componentRestrictions = { country: $(\'[name=\"country\"]\').val() };\n	}\n\n    $(\'[name=\"address\"]\')\n    .geocomplete(opts)\n    .bind(\"geocode:result\", function (event, result) {\n	    var adr_name = $(\'[name=\"address\"]\').geocomplete(\"data\").name;\n	    if (adr_name) {\n		    $(\'[name=\"address\"]\').val(adr_name).change();\n				$(\'[name=\"city\"]\').change();\n				$(\'[name=\"state\"]\').change();\n				$(\'[name=\"zip\"]\').change();\n				$(\'[name=\"country\"]\').change();\n	    } else {\n		    var street_number = $(\'[name=\"address\"]\').geocomplete(\"data\").street_number;\n		    var route = $(\'[name=\"address\"]\').geocomplete(\"data\").route;\n		    adr_name = street_number + \' \' + route;\n	    }\n	    $(\'[name=\"address\"]\').val(adr_name).change();\n			$(\'[name=\"city\"]\').change();\n			$(\'[name=\"state\"]\').change();\n			$(\'[name=\"zip\"]\').change();\n			$(\'[name=\"country\"]\').change();\n    });\n});\n</script>\n'
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

