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

  var trackingUrl = 'https://cdn.cfptaddons.com/cf77b277-2b7d-4218-bb88-d29a2b9280d1/track';

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
  $container.innerHTML = '<script>\n/**************************\n* Copyright 2023 CF Pro Tools, All Rights Reserved\n* Do not share, or distribute this code without author\'s consent.\n* This copyright notice must remain in place whenever using\n* this code - DO NOT REMOVE\n* Author: Jaime Smith\n* Website: https://cfprotools.com\n* Add-on: CF USA Only Shipping\n* Version: 2.0\n* Last Updated: 2023-08-23\n**************************/\n\n$(function () {\n    \n    if (!isCF2()) {\n        $(\'[name=\"shipping_country\"], [name=\"country\"]\').val(\"US\").prop(\'disabled\',true).change();\n    } else {\n        $(document).on(\'focus\', \'[name=\"shipping_address_2\"], [name=\"billing_address_2\"]\', function () {\n            disableCountrySelectors();\n        });\n        $(document).on(\'OrderSummaryFinished\', function () {\n            disableCountrySelectors();\n        });\n        if (isSmartCheckout()) {\n            let checkoutInterval = setInterval(function() {\n                if (waitOnCheckoutAndStore()) {\n                    clearInterval(checkoutInterval);\n                    setTimeout(disableCountrySelectors, 1000);\n                }\n            }, 100);\n        }\n    }\n\n    function waitOnCheckoutAndStore() {\n        if (window.Checkout?.store && window.Checkout?.allCountries) {\n            return true;\n        } else {\n            return false;\n        }\n    }\n});\n\nfunction disableCountrySelectors(countryCode = \"US\") {\n    let countrySelectors = document.querySelectorAll(\'select[name=\"billing_country\"],select[name=\"shipping_country\"]\');\n    let smartCheckout = isSmartCheckout();\n\n    countrySelectors.forEach(function (countrySelector) {\n        if (smartCheckout) {\n            usOnlyAutocomplete();\n            countrySelector.value = countryCode;\n            countrySelector.dispatchEvent(new Event(\'input\'));\n            countrySelector.disabled = true;\n        } else {\n            countrySelector.disabled = true;\n            countrySelector.value = countryCode;\n            countrySelector.style.backgroundColor = \"rgba(0,0,0,0.1)\";\n\n            let addressEl = $(countrySelector).closest(\'[data-page-element*=\"Address/V\"]\').get(0);\n            let addressCF2Instance = addressEl.cf2_instance;\n\n            if (addressCF2Instance && addressCF2Instance.refreshStates) {\n                addressCF2Instance.refreshStates();\n            }\n        }\n    });\n}\n\nfunction usOnlyAutocomplete() {\n    let addressForms = document.querySelectorAll(\'[data-page-element*=\"CheckoutAddressForm/V\"]\');\n    addressForms.forEach((addressForm) => {\n        let thisThis = addressForm.cf2_instance;\n        if (!window.google?.maps?.places) return\n        const addressInput = thisThis.getInputFromName(\'address\')\n        if (!addressInput) return\n\n        google.maps.event.clearInstanceListeners(addressInput);\n\n        const autoComplete = new window.google.maps.places.Autocomplete(addressInput, {\n            fields: [\"address_components\", \"name\"],\n            types: [\"address\"],\n            componentRestrictions: { country: \"us\" },\n        });\n\n        autoComplete.addListener(\"place_changed\", () => {\n            const place = autoComplete.getPlace();\n\n            const valueByComponentType = place.address_components.reduce((acc, component) => {\n            const type = component.types\n            if (type.includes(\'locality\')) {\n                acc[\'locality\'] = component.long_name\n            } else if (type.includes(\'administrative_area_level_2\')) {\n                acc[\'administrative_area_level_2\'] = component.long_name\n            } else if (type.includes(\'administrative_area_level_1\')) {\n                acc[\'administrative_area_level_1\'] = component.short_name\n            } else if (type.includes(\'country\')) {\n                acc[\'country\'] = component.short_name\n            } else if (type.includes(\'postal_code\')) {\n                acc[\'postal_code\'] = component.long_name\n            }\n            return acc\n            }, {})\n\n            const address = { address: place.name }\n            address.country = valueByComponentType[\'country\']\n            const stateMap = thisThis.stateMap(address.country)\n            const stateValue = valueByComponentType[\'administrative_area_level_1\']\n            address.state = stateMap.mapByCode[stateValue] ? stateValue : stateMap.mapByGoogleName[stateValue]\n            if (!address.state) {\n            address.state = thisThis.firstStateFromCountry(address.country)\n            }\n\n            address.city = valueByComponentType[\'locality\'] || valueByComponentType[\'administrative_area_level_2\']\n            address.zip = valueByComponentType[\'postal_code\']\n            thisThis.store.set(address)\n            thisThis.validateFormFields()\n        });\n    });\n}\n</script>\n'
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

