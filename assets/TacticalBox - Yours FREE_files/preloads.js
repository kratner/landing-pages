
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.iRHCMwIP.js","/cdn/shopifycloud/checkout-web/assets/c1/app.TdO5T-Uw.js","/cdn/shopifycloud/checkout-web/assets/c1/esnext-vendor.DIMGU94m.js","/cdn/shopifycloud/checkout-web/assets/c1/browser.DL4me7US.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-is-shop-pay-active.BVwFZx78.js","/cdn/shopifycloud/checkout-web/assets/c1/types-UnauthenticatedErrorModalPayload.USmlHhB-.js","/cdn/shopifycloud/checkout-web/assets/c1/images-payment-icon.C_9SDN8i.js","/cdn/shopifycloud/checkout-web/assets/c1/context-utilities.DJcMcEah.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-shop-discount-offer.Yf3C7TxM.js","/cdn/shopifycloud/checkout-web/assets/c1/NotFound.Bulev4e7.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-unactionable-errors.BPOqfwr6.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-installmentsNotSupportedForAddress.C7sWh81p.js","/cdn/shopifycloud/checkout-web/assets/c1/utils-getCommonShopPayExternalTelemetryAttributes.DHJOBJFY.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayCheckoutGqlVersion.DGpjqT3Y.js","/cdn/shopifycloud/checkout-web/assets/c1/graphql-ShopPayCheckoutSessionQuery.BMHsrL4d.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-setAddressErrors.BaFnaoDa.js","/cdn/shopifycloud/checkout-web/assets/c1/types-index.BE0UD4Nk.js","/cdn/shopifycloud/checkout-web/assets/c1/images-flag-icon.C_eXYJRt.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-en.D_zw2QX-.js","/cdn/shopifycloud/checkout-web/assets/c1/page-OnePage.U0uRqMK_.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsTimeout.BGhhyUC_.js","/cdn/shopifycloud/checkout-web/assets/c1/remember-me-hooks.C4X9Al7u.js","/cdn/shopifycloud/checkout-web/assets/c1/MarketsProDisclaimer.BlKZ_CPP.js","/cdn/shopifycloud/checkout-web/assets/c1/SplitDeliveryMerchandiseContainer.BpymsSp1.js","/cdn/shopifycloud/checkout-web/assets/c1/useShopPayButtonClassName.D1cm3cTK.js","/cdn/shopifycloud/checkout-web/assets/c1/ChangeCompanyLocationLink.DbPFApFY.js","/cdn/shopifycloud/checkout-web/assets/c1/WalletsSandbox-WalletSandbox.DWF8SZ0Q.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUnauthenticatedErrorModal.EpBysKGB.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useForceShopPayUrl.YL7lFZiL.js","/cdn/shopifycloud/checkout-web/assets/c1/GooglePayButton-index.KQabuzPi.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingGroupsSummaryLine.ChJFENLP.js","/cdn/shopifycloud/checkout-web/assets/c1/StackedMerchandisePreview.D3JEvRm-.js","/cdn/shopifycloud/checkout-web/assets/c1/AutocompleteField-hooks.CUKyFqJQ.js","/cdn/shopifycloud/checkout-web/assets/c1/LocalizationExtensionField.DWSsVrhB.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayPaymentRequiredMethod.D-2FSosL.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUpdateCheckoutAddress.n0pHsRnT.js","/cdn/shopifycloud/checkout-web/assets/c1/WalletLogo.Bk4EDzrF.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useGeneralPaymentErrorMessage.CUMeuemB.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShowShopPayOptin.nsn5l4oW.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShowCreateMoreAccountsGdprTreatment.Dmlnxscf.js","/cdn/shopifycloud/checkout-web/assets/c1/Section.BXlnqrjb.js","/cdn/shopifycloud/checkout-web/assets/c1/MobileOrderSummary.Bn0y_Fb1.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useOnePageFormSubmit.CMGx54Yv.js","/cdn/shopifycloud/checkout-web/assets/c1/PayPalOverCaptureInfoBanner.TxbGjOtE.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-get-negotiation-input.VhJzb74d.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-cash-constants.CHrTxVec.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentErrorBanner.BXpcVz2V.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblems-StockProblemsLineItemList.D4snQBpf.js","/cdn/shopifycloud/checkout-web/assets/c1/DutyOptions.C6uy_bFS.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown.BhTtHmiJ.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal.C4kGh8RG.js","/cdn/shopifycloud/checkout-web/assets/c1/extension-targets-shipping-options.r2X1WVLe.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodSelector.CvbvHzBb.js","/cdn/shopifycloud/checkout-web/assets/c1/SubscriptionPriceBreakdown.DeVf9z3U.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useSubscribeMessenger.DPtLmDB3.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.DQm2XSFQ.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/is-shop-pay-active.Bz45BrAn.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/UnauthenticatedErrorModalPayload.D1hsMvAK.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/index.CZTotsbB.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OnePage.Du-yF2xV.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/SplitDeliveryMerchandiseContainer.CRDql5Io.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/LocalizationExtensionField.CHFhA8b0.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/MobileOrderSummary.BLCAQEbk.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useOnePageFormSubmit.CFcgLtAD.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/WalletLogo.DSXJIrkc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ChangeCompanyLocationLink.uqpm88mq.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Section.CU18S7Ap.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayButtonClassName.BrcQzLuH.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/DutyOptions.LcqrKXE1.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PayPalOverCaptureInfoBanner.CuS5ve3d.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/WalletSandbox.CnR7qNLY.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingMethodSelector.B0hio2RO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/SubscriptionPriceBreakdown.BSemv9tH.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/StackedMerchandisePreview.D6OuIVjc.css"];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = [];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  