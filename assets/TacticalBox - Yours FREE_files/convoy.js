(function(d, script) {

console.log("CONVOY: LOADED")
const c= document.createDocumentFragment()
const ediv = document.createElement("div");
ediv.className = "coca-accordion coca-accordion-auto-render";
ediv.setAttribute("data-accordion-type", "dynamic");
ediv.setAttribute("autoRenderedAccordion", "true");
c.appendChild(ediv);
let after = false;
let divRenderTarget = null;
if (divRenderTarget === null || divRenderTarget === undefined) {
    divRenderTarget = document.getElementById('shopify-section-product-template')
}
if (divRenderTarget === null || divRenderTarget === undefined) {
    divRenderTarget = document.getElementsByClassName('product-details__blocks')[0]
}
if (divRenderTarget === null || divRenderTarget === undefined) {
    divRenderTarget = document.getElementsByClassName('single-product-content')[0]
}
if (divRenderTarget === null || divRenderTarget === undefined) {
    divRenderTarget = document.getElementById('product-box')
    after = true
}
if (divRenderTarget === null || divRenderTarget === undefined) {
    divRenderTarget = document.querySelector('div[data-section-type="product"]');
    after = true
}
if (divRenderTarget === null || divRenderTarget === undefined) {
    divRenderTarget = document.querySelector('div[data-id="_ppr"]');
    after = true
}
if (divRenderTarget === null || divRenderTarget === undefined)
    divRenderTarget = document.querySelector('section[data-section-type="product"]');
if (divRenderTarget === null || divRenderTarget === undefined)
    divRenderTarget = document.getElementsByClassName("product-page-wrapper")[0];
if (divRenderTarget === null || divRenderTarget === undefined)
    divRenderTarget = document.getElementsByClassName("js-product_section")[0];
if (divRenderTarget === null || divRenderTarget === undefined) {
    divRenderTarget = document.getElementsByClassName("main-content")[0];
    after = true
}
if (divRenderTarget === null || divRenderTarget === undefined) {
    divRenderTarget =  document.getElementsByTagName("main")[0];
}

if (divRenderTarget !== null && divRenderTarget !== undefined) {
        if (after) {
            divRenderTarget.after(c)
        } else {
            divRenderTarget.appendChild(c)
        }
}
    script = d.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = function(){
        // remote script has loaded
        console.log("CONVOY: COCA-ACCORDION-SCRIPT-LOADED");
    };
    script.src = 'https://accordion.usecorner.io/accordion.js';
    d.getElementsByTagName('head')[0].appendChild(script); // or we can inject on body
  
})(document);
