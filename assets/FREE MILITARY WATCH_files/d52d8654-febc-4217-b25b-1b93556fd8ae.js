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

  var trackingUrl = 'https://cdn.cfptaddons.com/d52d8654-febc-4217-b25b-1b93556fd8ae/track';

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
  $container.innerHTML = '<script>\nCFPT = window.CFPT || {};\nCFPT.prodPrices = {\n        \'5041844\': 19.95\n        ,\n        \'5041845\': 35.90\n        ,\n        \'5041846\': 44.85\n        ,\n        \'5041847\': 74.75\n        ,\n        \'5041848\': 9.95\n        ,\n        \'5041849\': 39.95\n        ,\n        \'5041850\': 59.00\n        ,\n        \'5041851\': 59.00\n};\nCFPT.freePriceDisplay = \"FREE\";\nCFPT.orderTotalLabel = \"Order Total:\";\nCFPT.orderSummaryAlwaysShow = false;\nCFPT.useOriginalPriceDisplay = true;\n</script>\n\n<script>\n/**************************\n* Copyright 2019 CF Pro Tools, All Rights Reserved\n* Do not share, or distribute this code without author\'s consent.\n* This copyright notice must remain in place whenever using\n* this code - DO NOT REMOVE\n* Author: Jaime Smith\n* Website: https://cfprotools.com\n* Add-on: CF Order Summary\n* Version: 2.0\n* Last Updated: 10/28/2019\n**************************/\nvar $summTemplate = null;\n\n$(function () {\n	//set default value to kill bug in L&E JS\n	window.cfpe = window.cfpe || {};\n	window.cfpe.orderTotal = window.cfpe.orderTotal || 0;\n\n	window.cfptOrderTotal = null;\n\n	setSummaryTemplate();\n\n	$(\'#bump-offer\').off();\n\n	rebuildOrderSummary();\n	$(document).on(\"change\", \'.qty_select, .o2step_step2 [name=\"purchase[product_id]\"], [data-de-type=\"orpo\"] [name=\"purchase[product_id]\"], #bump-offer\', function (ev) {\n\n		$(\'#bump-offer, [id*=\"bump_offer_\"]\').each(function () {\n			var bumpId = $(this).val();\n\n			if ($(this).is(\':checked\')) {\n				$(\'#cfAR [name=\"purchase[product_ids][]\"][value=\"\'+bumpId+\'\"]\').attr(\'checked\', true);\n			} else {\n				$(\'#cfAR [name=\"purchase[product_ids][]\"][value=\"\'+bumpId+\'\"]\').attr(\'checked\', false);\n			}\n		});\n		rebuildOrderSummary();\n	});\n	$(document).on(\'cfpt:cart-updated\', function () {\n		rebuildOrderSummary();\n	});\n});\n\nfunction setSummaryTemplate() {\n	$(\'[data-de-type=\"ors\"], .elOrderProductOptions:not(:has(input,select))\').first().attr(\'data-title\',\'cf-order-summary\');\n\n	$summTemplate = $(\'[data-title=\"cf-order-summary\"] .elOrderProductOptinProducts\').first().clone();\n}\n\nfunction rebuildOrderSummary() {\n	if (typeof window.cfpeRebuildOrderSummary != \"undefined\") {\n		window.cfpeRebuildOrderSummary();\n	}\n	\n	var cfpt = window.CFPT || {};\n	var prodPrices = cfpt.prodPrices || {};\n	var freePriceDisplay = cfpt.freePriceDisplay || null;\n	var orderTotalLabel = cfpt.orderTotalLabel || null;\n	var prodSelParent = \'[data-de-type*=\"orpo\"]\';\n	var appendTo = \'[data-title=\"cf-order-summary\"] .elOrderProductOptions\';\n\n	var cartMode = ($(\'.qty_select\').length) ? true : false;\n\n	if ($(\'.o2step_wrapper\').length > 0) {\n		prodSelParent = \'.o2step_step2\';\n		appendTo = \'[data-title=\"cf-order-summary\"]\';\n	}\n\n	if (!$summTemplate) {\n		setSummaryTemplate();\n	}\n\n    $(\'[data-title=\"cf-order-summary\"]\').hide();\n	if ($(\'[data-title=\"cf-order-summary\"] .qty-head\').length == 0 && $(\'.qty_select\').length > 0) {\n        if ($(\'table.elOrderProductOptions\').length > 0) {\n            //this is the new way\n            $(\'[data-title=\"cf-order-summary\"] .elOrderProductOptinItem\').prepend(\'<span class=\"pull-left qty-head\">Qty</span>\');\n			appendTo = \'[data-title=\"cf-order-summary\"] tbody\';\n        } else {\n            $(\'[data-title=\"cf-order-summary\"] .elOrderProductOptinLabel .elOrderProductOptinItem\').before(\'<div class=\"pull-left qty-head\">Qty</div>\');\n        }\n	}\n\n	var orderTotal = 0.00;\n	var orderCurrency = \"USD\"; //default\n\n	$(\'[data-title=\"cf-order-summary\"] .elOrderProductOptinProducts\').remove();\n\n	window.cfptCartProds = {};\n	$(\'#cfAR [name=\"purchase[product_ids][]\"]:checked\').each(function () {\n		var prodId = $(this).val();\n\n		if (window.cfptCartProds.hasOwnProperty(prodId)) {\n			window.cfptCartProds[prodId].qty++;\n		} else {\n			window.cfptCartProds[prodId] = {qty: 1};\n		}\n	});\n\n	//$(\'#cfAR [name=\"purchase[product_ids][]\"]:checked\').each(function () {\n	$.each(window.cfptCartProds, function (index, value) {\n		var qty = value.qty;\n		var prodId = index;\n\n		var $prodItem = $(prodSelParent+\' [name=\"\'+prodId+\'_qty\"]\');\n		if (!$prodItem.length) {\n			$prodItem = $(prodSelParent+\' [name=\"purchase[product_id]\"][value=\"\'+prodId+\'\"]\');\n		}\n\n    var prodParent = $prodItem.parents(\'[data-cf-product-template]\').first();\n		//var prodDesc = prodParent.find(\'[data-cf-product-name]\').html();\n		var prodDesc = $prodItem.data(\'product-name\') || prodParent.find(\'[data-cf-product-name]\').html();\n		//var prodPriceStr = prodParent.find(\'[data-cf-product-price]\').html();\n		var prodPriceStr = originalPriceStr = String($prodItem.data(\'product-display-amount\') || $prodItem.data(\'product-amount\') || prodParent.find(\'[data-cf-product-price]\').text());\n		if (cartMode) {\n			prodPriceStr = String(prodParent.find(\'input[name=\"purchase[product_id]\"]\').data(\'product-display-price\') || prodParent.find(\'input[name=\"purchase[product_id]\"]\').data(\'product-amount\') || prodParent.find(\'[data-cf-product-price]\').text());\n		}\n		if (prodPrices.hasOwnProperty(prodId)) {\n			var prodPriceNum = prodPrices[prodId].toFixed(2);\n		} else {\n			var prodPriceNum = parseFloat(prodPriceStr.replace(/[^0-9\\.]+/g, \"\")).toFixed(2);\n		}\n		var subTotal = qty * prodPriceNum;\n		//var currency = prodParent.find(\'[data-cf-product-price]\').attr(\"taxamo-currency\");\n		var currency = $prodItem.data(\'product-currency-code\') || prodParent.find(\'[data-cf-product-price]\').attr(\"taxamo-currency\") || orderCurrency;\n		orderCurrency = CFPT.orderCurrency = currency;\n\n		$currTemplate = $summTemplate.clone();\n		$currTemplate.attr(\'data-product_id\', prodId);\n		$currTemplate.attr(\'data-quantity\', qty);\n\n		var prodName = prodDesc;\n		if ($(\'.qty_select\').length > 0) {\n			prodName = \'<span class=\"prodQty\">\'+qty+\'</span>\'+prodDesc;\n		}\n		$currTemplate.find(\'.product-name\').html(prodName);\n		var priceDisplay = subTotal.toLocaleString(undefined, {style: \'currency\', currency: orderCurrency});\n		if (freePriceDisplay && subTotal == 0) {\n			priceDisplay = freePriceDisplay;\n			$currTemplate.find(\'.product-price\').attr(\"taxamo-currency\",currency).html(freePriceDisplay);\n			$currTemplate.attr(\'data-subtotal\', freePriceDisplay);\n		}\n\n		if (CFPT.useOriginalPriceDisplay) {\n			priceDisplay = originalPriceStr;\n		}\n\n		$currTemplate.find(\'.product-price\').attr(\"taxamo-currency\",currency).html(priceDisplay);\n		$currTemplate.attr(\'data-subtotal\', priceDisplay);\n\n		$currTemplate.appendTo($(appendTo));\n\n		orderTotal += subTotal;\n	});\n\n	if (orderTotal || CFPT.orderSummaryAlwaysShow) {\n		$ttlTemplate = $summTemplate.clone();\n\n		$ttlTemplate.addClass(\'cf-order-total-row\').css({\'border-top\': \'1px solid #DDD\', \'margin-top\': \'.5em\'});\n		$ttlTemplate.find(\'.product-name\').html(orderTotalLabel);\n		$ttlTemplate.find(\'.product-price\').attr(\"taxamo-currency\",orderCurrency).html(orderTotal.toLocaleString(undefined, {style: \'currency\', currency: orderCurrency}));\n		$ttlTemplate.appendTo($(appendTo));\n\n		if (ClickFunnels.CalculateTaxes.canCalcTaxes()) {\n			window.page_key = window.page_key || \'\';\n			ClickFunnels.CalculateTaxes.calcTaxesAfterProductChange(window.cfptCartProds);\n		}\n\n		$(\'[data-title=\"cf-order-summary\"]\').show();\n		window.cfptOrderTotal = orderTotal;\n\n		if (typeof window.cfpe != \"undefined\") {\n			window.cfpe.orderTotal = orderTotal;\n		}\n	} else {\n		$(\'[data-title=\"cf-order-summary\"]\').hide();\n		window.cfptOrderTotal = null;\n	}\n\n	$(document).trigger(\"cfpt:order-summary-updated\");\n}\n</script>\n\n<script>\n	$(document).on(\'shipping:updated\', function (evt, rates, finalAmountString) {\n		$(\'[data-title=\"cf-order-summary\"]\').hide();\n\n		setTimeout(function () {\n			var finalAmount = parseFloat(finalAmountString.replace(/[^0-9\\.]+/g, \"\"));\n\n			$(\'.elOrderProductOptinProducts.shippingAmount\').remove();\n\n			$(\'.cf-order-total-row .product-price\').html(window.cfptOrderTotal.toLocaleString(undefined, {style: \'currency\', currency: CFPT.orderCurrency}));\n		  if (finalAmount && !_.isNaN(finalAmount)) {\n		    //Used for legacy elements\n		    $(\'div.cf-order-total-row\').before(\"<div class=\'clearfix elOrderProductOptinProducts shippingAmount\'><span class=\'description elOrderProductOptinProductName product-name pull-left\'>Shipping</span><span class=\'amount elOrderProductOptinPrice product-price pull-right\'>\" + finalAmount.toLocaleString(undefined, {style: \'currency\', currency: CFPT.orderCurrency}) + \"</span></div>\");\n\n		    //$(\'.product-price\').parents(\".elOrderProductOptions:not(table)\").append(\"<div class=\'clearfix elOrderProductOptinProducts taxAmount\'><span class=\'description elOrderProductOptinProductName product-name pull-left\'>Taxes</span><span class=\'amount elOrderProductOptinPrice product-price pull-right\'>$\" + finalAmount.toFixed(2) + \"</span></div>\");\n		    //End of legacy elements code.\n\n		    //$(\'.product-price\').parents(\"table.elOrderProductOptions\").append(\"<tr class=\'clearfix elOrderProductOptinProducts taxAmount\'><td class=\'description elOrderProductOptinProductName product-name pull-left\'>Taxes</td><td class=\'amount elOrderProductOptinPrice product-price pull-right\'>$\" + finalAmount.toFixed(2) + \"</td></tr>\");\n\n				$(\'tr.cf-order-total-row\').before(\"<tr class=\'clearfix elOrderProductOptinProducts shippingAmount\'><td class=\'description elOrderProductOptinProductName product-name pull-left\'>Shipping</td><td class=\'amount elOrderProductOptinPrice product-price pull-right\'>\" + finalAmount.toLocaleString(undefined, {style: \'currency\', currency: CFPT.orderCurrency}) + \"</td></tr>\");\n\n				var orderTotal = window.cfptOrderTotal + finalAmount;\n\n				$(\'.cf-order-total-row .product-price\').html(orderTotal.toLocaleString(undefined, {style: \'currency\', currency: CFPT.orderCurrency}));\n		  }\n		}, 100);\n\n		$(\'[data-title=\"cf-order-summary\"]\').fadeIn();\n	});\n</script>\n\n<script>\nClickFunnels.CalculateTaxes.printTaxInfo = function(finalAmount) {\n	$(\'.cf-order-total-row .product-price\').html(window.cfptOrderTotal.toLocaleString(undefined, {style: \'currency\', currency: CFPT.orderCurrency}));\n  if (finalAmount && !_.isNaN(finalAmount)) {\n    //Used for legacy elements\n    $(\'div.cf-order-total-row\').before(\"<div class=\'clearfix elOrderProductOptinProducts taxAmount\'><span class=\'description elOrderProductOptinProductName product-name pull-left\'>Taxes</span><span class=\'amount elOrderProductOptinPrice product-price pull-right\'>\" + finalAmount.toLocaleString(undefined, {style: \'currency\', currency: CFPT.orderCurrency}) + \"</span></div>\");\n\n    //$(\'.product-price\').parents(\".elOrderProductOptions:not(table)\").append(\"<div class=\'clearfix elOrderProductOptinProducts taxAmount\'><span class=\'description elOrderProductOptinProductName product-name pull-left\'>Taxes</span><span class=\'amount elOrderProductOptinPrice product-price pull-right\'>$\" + finalAmount.toFixed(2) + \"</span></div>\");\n    //End of legacy elements code.\n\n    //$(\'.product-price\').parents(\"table.elOrderProductOptions\").append(\"<tr class=\'clearfix elOrderProductOptinProducts taxAmount\'><td class=\'description elOrderProductOptinProductName product-name pull-left\'>Taxes</td><td class=\'amount elOrderProductOptinPrice product-price pull-right\'>$\" + finalAmount.toFixed(2) + \"</td></tr>\");\n\n		$(\'tr.cf-order-total-row\').before(\"<tr class=\'clearfix elOrderProductOptinProducts taxAmount\'><td class=\'description elOrderProductOptinProductName product-name pull-left\'>Taxes</td><td class=\'amount elOrderProductOptinPrice product-price pull-right\'>\" + finalAmount.toLocaleString(undefined, {style: \'currency\', currency: CFPT.orderCurrency}) + \"</td></tr>\");\n\n		var orderTotal = window.cfptOrderTotal + finalAmount;\n\n		$(\'.cf-order-total-row .product-price\').html(orderTotal.toLocaleString(undefined, {style: \'currency\', currency: CFPT.orderCurrency}));\n  }\n\n  if($(\'#payment-request-button\').length){\n    updateApplePay(); // update apple pay with fetched tax\n  }\n\n  if(window.ClickFunnels.isOrderWithProductVariants) {\n    window.ClickFunnels.OrderProductVariationSummary.updateTax(window.cfpe.avalaraTaxAmount);\n  }\n}\n</script>\n\n<style>\n/* Custom CSS for CF Pro Tools cf-order-summary script\n * Copyright 2017 CF Pro Tools, All Rights Reserved\n * Do not share, or distribute this code without author\'s consent.\n * Author: Jaime Smith\n * Website: https://cfprotools.com\n */\n\n.cf-order-total-row {\n	border-top: 1px solid #DDD;\n	margin-top: .5em;\n}\n\n.cf-order-total-row .product-name {\n	font-weight: bold;\n}\n\n.cf-order-total-row .product-price {\n	font-weight: bold;\n}\n\n[data-title=\"cf-order-summary\"] .qty-head {\n  display: inline-block;\n  font-weight: bold;\n	width: 3em;\n}\n\n[data-title=\"cf-order-summary\"] tr .qty-head {\n	padding: 5px;\n}\n\n[data-title=\"cf-order-summary\"] .qty-head + th {\n	width: 60%;\n}\n\n.prodQty {\n	display: inline-block;\n	width: 3em;\n}\n\n[data-title*=\"cf-order-summary\"] .best-seller-head,\n[data-title*=\"cf-order-summary\"] .best-seller-head + br\n{\n	display: none;\n}\n</style>\n'
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

