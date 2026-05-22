/**
*	Version number: 01
*/
if (typeof window.giftbeeloaded === 'undefined' ||  document.getElementById("giftbee-loaded") === null) {
	
	try {
		// Mark Giftbee as loaded
		window.giftbeeloaded = true;
		
		var elem54214243 = document.createElement('div');
		elem54214243.id = 'giftbee-loaded';
		elem54214243.style.cssText = 'display:none;';
	
		document.body.appendChild(elem54214243);
	} catch(e) {
		console.error(e); 
	}
	
	
	(function() {


		var loadScript = function(url, callback){
			var script = document.createElement("script")
			script.type = "text/javascript";
			script.setAttribute("defer", "defer");
		 
			if (script.readyState){  //IE
				script.onreadystatechange = function(){
					if (script.readyState == "loaded" ||
							script.readyState == "complete"){
						script.onreadystatechange = null;
						callback();
					}
				};
			} else {  //Others
				script.onload = function(){
					callback();
				};
			}
		 
			script.src = url;
			document.getElementsByTagName("head")[0].appendChild(script);
		};

		var leakyBucket = {
			bucket: 0,
			capacity: 10, // TODO increase to 10 or more after shisenfox fixed the theme
			delay: 500,
			add: function() {
				this.bucket++;
				this.clearBucket();
			},
			clearBucketTimeout: null,
			clearBucket: function() {
				if (this.clearBucketTimeout !== null) {
					clearTimeout(this.clearBucketTimeout);
				}
				
				var self = this;
				setTimeout(function() {
					self.bucket = 0;
				}, this.delay);
			},
			hasSpace: function() {
				if (this.bucket < this.capacity) {
					return true;
				}
				
				return false;
			}
		}

				
		// Main GiftBee app		
		var GiftBee = function($) {

			var dbRules = [];

            
            			
			var productsConfiguration = null;

            

            // Keep track of the items that are shown for customer
            // To be 100% sure we don't add these items by accident to the cart
            // This variable is used when user has both PSP and clasic bots
            // But we need to keep it in the script even if he doesn't
            // Milan - Keep this code below commented since this is a double
            // checker for PSP bot. If after some time we don't need this it can be deleted.

            // var pspProductsAlreadyShown = {
            //     items: []
            // };

            var rules = [];
			
			// Check if bot is active based on it's schedule
			var currentDateTime = (new Date()).getTime();
			for(var z = 0; z < dbRules.length; z++) {
				var enabledRule = true;

				if (typeof dbRules[z].use_date_condition !== 'undefined' && dbRules[z].use_date_condition === 'true') {
					if (typeof dbRules[z].date_from !== 'undefined' && dbRules[z].date_from !== null && dbRules[z].date_from.trim() !== '') {
						// We have an actual date set up here
						var fromDate = new Date(dbRules[z].date_from);
						
						if (fromDate.getTime() > currentDateTime) {
							enabledRule = false;
						}
					}
					
					if (typeof dbRules[z].date_to !== 'undefined' && dbRules[z].date_to !== null && dbRules[z].date_to.trim() !== '') {
						// We have an actual date set up here
						var toDate = new Date(dbRules[z].date_to);
						
						if (toDate.getTime() < currentDateTime) {
							enabledRule = false;
						}
					}
				}

				if (enabledRule === true) {
					rules.push(dbRules[z]);
				}
			}
			
			if (typeof Shopify !== 'undefined' && typeof Shopify.currency !== 'undefined' && typeof Shopify.currency.rate !== 'undefined') {
				var currencyRate = Shopify.currency.rate*1;
				for (var x = 0; x < rules.length; x++) {
					var rule = rules[x];
					if (rule.condition_type === 'cart_value' || rule.condition_type === 'cart_value_and_products' || rule.condition_type === 'n_products_and_cart_value') {
						if (rule.cart_value_min !== '') {
							rule.cart_value_min = rule.cart_value_min*currencyRate;
						}
						
						if (rule.cart_value_max !== '') {
							rule.cart_value_max = rule.cart_value_max*currencyRate;
						}
					}
				}
			}

			/*
			$('body').append('<style>' +
				'' +
			'</style>');
			*/

			// Added 2021-03-17
			var globalDebouncers = [];
			function globalDebounce(key, callback, delay) {
				if (typeof globalDebouncers[key] !== 'undefined') {
					clearTimeout(globalDebouncers[key]);
				}
				globalDebouncers[key] = setTimeout(callback, delay);			
			}

			
			/* --------------------- Global Utility --------------------- */
			// Collection of various global utilities
			var GlobalUtility = (function() {
				var local = {
					key : 'cartbot_data_',
					save: function(key, data) {
						try {
							localStorage.setItem(this.getKey()+key, data);
						} catch(e) {
							console.log('Error when saving data', e);
						}
					},
					get: function(key) {
						try {
							
							var ld = localStorage.getItem(this.getKey()+key);
							return JSON.parse(ld);
							
						} catch(e) {
							return false;
						}
						return false;
					},
					/*
					get: function(key, age) {
						if (typeof age === 'undefined') {
							age = this.maxAge;
						}
						try {
							
							if (typeof this.cache[key] !== 'undefined') {
								var ld = this.cache[key];
							} else {
								var ld = localStorage.getItem(this.getKey());
								ld = JSON.parse(ld);
							}

							if (typeof ld[key] === 'undefined' ||  ld[key].time === 'undefined') {
								return false;
							}

							if (ld[key].time < (new Date().getTime() - this.maxAge)) {
								// data is too old
								return false;
							}
							
							return JSON.parse(JSON.stringify(ld[key].data));
						} catch(e) {
							return false;
						}
						return false;
					},*/
					getKey: function() {
						var localKey = this.key;
						return localKey;
					}
				};
				
				var session = {
					key : 'cartbot_data_',
					save: function(key, data) {
						try {
							sessionStorage.setItem(this.getKey()+key, data);
						} catch(e) {
							console.log('Error when saving data', e);
						}
					},
					get: function(key) {
						try {
							
							var ld = sessionStorage.getItem(this.getKey()+key);
							return JSON.parse(ld);
							
						} catch(e) {
							return false;
						}
						return false;
					},
					getKey: function() {
						var sessionKey = this.key;
						return sessionKey;
					}
				};

                var cartbot = {
                    getDefaultCurrency: function() {
                        if (typeof Shopify !== 'undefined' && typeof Shopify.currency !== 'undefined' && typeof Shopify.currency.active !== 'undefined') {
                            var currency = Shopify.currency.active;
                        } else {
                            							var currency = 'USD';
                        }
                        
                        return currency;
                    }
                }
				
				var cart = {
					_cartData: {
						items: []
					},
					get cartData() {
						if (this._cartData.items.length === 0) {
							// Retrieve the cart from local storage in case the data is empty.
							// This resolves the issue where the app added the same product twice if you clicked the add to cart button before the app retrieved the cart.
							// 53d6e1-2.myshopify.com
							var cartFromLocalStorage = local.get('cart');
							
							if (cartFromLocalStorage !== false) {
								return cartFromLocalStorage;
							}
						}
						
						return this._cartData;
					},
					set cartData(value) {
						this._cartData = value;
					},
					clearCartData() {
						this.cartData = {
							items: []
						};
						
						local.save('cart', JSON.stringify({
							items: []
						}));
					},
					cartCache: {},
					get: function(checkCache, writeToLocalStorage) {
						if (typeof checkCache === 'undefined') {
							checkCache = true;
						}
						
						if (typeof writeToLocalStorage === 'undefined') {
							writeToLocalStorage = true;
						}
						
						var maxCacheLength = 1500 // 1.5 seconds 
																		
						
						if (checkCache) { // We aren't really using this anymore
							
							// Check if there is a response in the cache which isn't older than 1.5 seconds
							var timestamp = Date.now();
								timestamp = Math.round(timestamp / maxCacheLength);
								
							//if (Object.keys(this.cartData).length > 0) {
							if (typeof self.cartCache[timestamp] !== 'undefined' && Object.keys(self.cartCache[timestamp]).length > 0) {
								// Return the response
						
								if (enableDebugging) {
									console.log('---- reading cart data from cache via promise ----');
								}

								var self = this;
								var simPromise = new Promise((resolve, reject) => {
									var response = new Response(JSON.stringify(self.cartCache[timestamp]), { "status" : 200 , "statusText" : "Smashing success!" });
									// Resolve the promise
									resolve(response);
								});
								
								localCartIswaitingToBeRefreshed = false;
								
								return simPromise;
							}
						}
						
						if (leakyBucket.hasSpace() === false) {
							console.log('leaky bucket is full');
							return null;
						}
						
						leakyBucket.add();
						
						var endpoint = 'cart.json?cartbot-cart-call';
						var self = this;
						
						var promise = fetch(nav.getRootUrl() + endpoint, {
							method: 'GET',
							cache: 'no-cache',
							credentials: 'same-origin',
							headers: {
								'Content-Type': 'application/json'
							}
						}).then(function(data) {
							return data.clone().json().then(function(p) {
								var cartD = JSON.parse(JSON.stringify(p));
								
								if (typeof window.bndlr !== 'undefined' && typeof window.bndlr.updateCartWithDiscounts === 'function') {
									try {
										var bndlrCart = window.bndlr.updateCartWithDiscounts(cartD);
										
										if (typeof bndlrCart.discounted_cart_object !== 'undefined') {
											cartD = bndlrCart.discounted_cart_object;
											
											cartD = self.reorderCartItemsIfNeeded(cartD);
										}
										
									} catch(e) {
										console.log(e);
									}
								}
								
								if (enableDebugging) {
									console.log('---- saving cart data to cache ----', JSON.parse(JSON.stringify(cartD)));
								}
								
								self.cartData = JSON.parse(JSON.stringify(cartD));
								
								self.cartData = JSON.parse(JSON.stringify(cartD)); // Redundand
								
								// Save response to cache for 1.5 seconds
								var timestamp = Date.now();
									timestamp = Math.round(timestamp / maxCacheLength);
								
								self.cartCache[timestamp] = JSON.parse(JSON.stringify(cartD));
								
								
								localCartIswaitingToBeRefreshed = false;

								if (writeToLocalStorage) {
									// Write to local storage so that the other tabs will pick up the change
									local.save('cart', JSON.stringify(cartD));
								}
								
								return data;
							});
						});
						
						return promise;
						
					},
					reorderCartItemsIfNeeded: function(cart) {
						var newCart = JSON.parse(JSON.stringify(cart));
						newCart.items = [];
						for(var k in cart.items) {
							if (cart.items.hasOwnProperty(k)) {
								if (cart.items[k].original_line_item_id !== 'undefined') {
									newCart.items[cart.items[k].original_line_item_id*1] = JSON.parse(JSON.stringify(cart.items[k]));
								} else {
									newCart.items.push(JSON.parse(JSON.stringify(cart.items[k])));
								}
							}
						}

						return newCart;
					}
				}
				
				// Navigation object
				var nav = {
					getRootUrl: function() {
						return window.location.origin?window.location.origin+'/':window.location.protocol+'/'+window.location.host+'/';
					},
					isHomePage: function() {
						if (window.location.pathname === '/') {
							return true;
						}
						return false;
					},
					isProductPage: function() {
						if (/\/products\/([^\?\/\n]+)/.test(window.location.href)) {
							return true;
						}
						return false;
					},
					isCartPage: function() {
						if (/\/cart\/?/.test(window.location.href)) {
							return true;
						}
						return false;
					},
					getProductHandle: function(href) {
						if (typeof href === 'undefined') {
							var href = window.location.href;
							href = href.replace('/products/products', '/products');
						}
						
						if (/\/products\/([^\?\/\n]+)/.test(href)) {
							var found = href.match(/\/products\/([^\?\/\n]+)/);
							if (typeof found[1] !== 'undefined') {
								try {
									return decodeURIComponent(found[1]).replace('#', '');
								} catch(e) {
									return found[1].replace('#', '');
								}
							}
						}
						return false;
					},
					getAppApiEndpoint: function() {
						return 'https://app.cart-bot.net/public/api/';
					},
					getInvoiceEndpoint: function() {
						return this.getAppApiEndpoint() + 'cdo.php?shop=2b24be-2.myshopify.com';
					},
					getSellingPlanId: function() {
						var qp = this.getQueryParams(window.location.search);
						if (typeof qp['selling_plan'] !== 'undefined') {
							return qp['selling_plan'];
						}
						
						return '';
					},
					getQueryParams: function(qs) {
						qs = qs.split('+').join(' ');

						var params = {},
							tokens,
							re = /[?&]?([^=]+)=([^&]*)/g;

						while (tokens = re.exec(qs)) {
							params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
						}

						return params;
					},
					reload: function() {
						//console.log('reloading 2');
						//window.location.reload();
						
												
							window.location = self.location;
							window.location.reload(true);
						
											},
					isQueryParameterSet: function(param) {
						var qp = this.getQueryParams(window.location.search);
						if (typeof qp[param] !== 'undefined') {
							return true
						}
						
						return false;
					}
				};
				
				var string = {
					getRandomString: function(length) {
						var result           = '';
						var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
						var charactersLength = characters.length;
						var a = [];
						for ( var i = 0; i < length; i++) {
							a.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
						}
						return a.join('');
					}
				}
				
				// Queue for handling multiple requests and triggering callback after they are all finished
				var queue = {
					queue: {},
					/**
					 * key: is a key by which you set in which queue you want to set the action 
					 * action: is a function, which will executed your desired action
					 * afterFinish: is a function, which will be executed after all actions are executed
					 */
					add: function(key, action, afterFinish) {
						if (typeof this.queue[key] === 'undefined') {
							this.queue[key] = {
								finish: afterFinish, // Action, which will be exectued after all queued actions have finished processing
								q: [],
								tick: 0
							};
						}
						this.queue[key].q.push(action);
					},
					process: function(key) {
						if (typeof this.queue[key] !== 'undefined') {
							var total = this.queue[key].q.length;
							
							var tick = this.queue[key].tick;
							if (typeof this.queue[key].q[tick] !== 'undefined') {
								this.queue[key].q[tick]();
								
								this.tick(key); // Increase the tick and continue processing the queue
							}
						}
					},
					tick: function(key) {
						if (typeof this.queue[key] !== 'undefined') {
							this.queue[key].tick++;
							
							if (this.queue[key].tick === this.queue[key].q.length) {
								this.queue[key].finish();
								
								delete this.queue[key];
							} else {
								this.process(key);
							}
						}
					},
					cancel: function(key) {
						delete this.queue[key];
					}
				};
				
				// Queue which can work only with promises. Each function must return a promise. 
				var promiseQueue = {
					queue: {},
					/**
					 * key: is a key by which you set in which queue you want to set the action 
					 * action: is a function, which will executed your desired action
					 * afterFinish: is a function, which will be executed after all actions are executed
					 */
					add: function(key, action, afterFinish) {
						if (typeof this.queue[key] === 'undefined') {
							this.queue[key] = {
								finish: afterFinish, // Action, which will be exectued after all queued actions have finished processing
								q: [],
								tick: 0
							};
						}
						this.queue[key].q.push(action);
					},
					process: function(key) {
						if (typeof this.queue[key] !== 'undefined') {
							var total = this.queue[key].q.length;
							
							var tick = this.queue[key].tick;
							if (typeof this.queue[key].q[tick] !== 'undefined') {
								var promise = this.queue[key].q[tick]();
								
								promise.then(function() {
									setTimeout(function() {
										promiseQueue.tick(key);
									}, 10); // Wait for 10 miliseconds so that the cart total value can be updated
								});
								
								//this.tick(key); // Increase the tick and continue processing the queue
							}
						}
					},
					tick: function(key) {
						if (typeof this.queue[key] !== 'undefined') {
							this.queue[key].tick++;
							
							if (this.queue[key].tick === this.queue[key].q.length) {
								this.queue[key].finish();
								
								delete this.queue[key];
							} else {
								this.process(key);
							}
						}
					},
					cancel: function(key) {
						delete this.queue[key];
					}
				};
				
				var cookie = {
					key : 'cartbot_data_',
					maxAge: 60*1000*60, // Set max age to 60 minutes
					set: function(cname, cvalue, exdays) { // Set exdays to 0 to create a session cookie.
						var d = new Date();
						cname = this.key+cname;
						
						var data = JSON.parse(cvalue);
						
						var fullData = {
							data: data,
							time: (new Date().getTime())
						}
						
						cvalue = JSON.stringify(fullData);
						
						if (exdays > 0) {
							d.setTime(d.getTime() + (exdays*24*60*60*1000));
							var expires = "expires="+ d.toUTCString();
							document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
						} else {
							document.cookie = cname + "=" + cvalue + ";path=/";
						}					
					},
					get: function(cname) {
						cname = this.key+cname;
						var name = cname + "=";

						var cookies = document.cookie;
						cookies = cookies.split(';');

						var ca = [];
						for (var i = 0; i < cookies.length; i++) {
							try {
								ca.push(decodeURIComponent(cookies[i].trim(' ')));
							} catch(e) {
								console.error(cookies[i]);
							}
						}
						
						
						
						var cookieData = '';
						
						for(var i = 0; i <ca.length; i++) {
							var c = ca[i];
							while (c.charAt(0) == ' ') {
								c = c.substring(1);
							}
							if (c.indexOf(name) == 0) {
								cookieData = c.substring(name.length, c.length);
								i = ca.length; // Stop the loop 
							}
						}
						
						try {
							// Parse the data and reject it if the data is too old.
							var data = JSON.parse(cookieData);
							if (typeof data.time === 'undefined') {
								// This is an old format, without the expirating time 
								return cookieData; 
							} else {
								if (data.time < (new Date().getTime() - this.maxAge)) {
									// data is too old
									return '';
								} else {
									return JSON.stringify(data.data);
								}
							}
							
						} catch(e) {}
						
						return "";
					}
				};
				
				
				var money = {
					currencySymbols: {
						'USD': '$', // Dollar
						'CAD': '$', // Dollar
						'AUD': '$', // Dollar
						'NZD': '$', // Dollar
						'CLP': '$', // Chilean Peso
						'EUR': '€', // Euro
						'CRC': '₡', // Costa Rican Colón
						'GBP': '£', // British Pound Sterling
						'ILS': '₪', // Israeli New Sheqel
						'INR': '₹', // Indian Rupee
						'JPY': '¥', // Japanese Yen
						'KRW': '₩', // South Korean Won
						'NGN': '₦', // Nigerian Naira
						'PHP': '₱', // Philippine Peso
						'PLN': 'zł', // Polish Zloty
						'PYG': '₲', // Paraguayan Guarani
						'THB': '฿', // Thai Baht
						'UAH': '₴', // Ukrainian Hryvnia
						'VND': '₫', // Vietnamese Dong
					},
					formatPrice: function(price, convertCurrency) {
						
						if (typeof Shopify !== 'undefined' && Shopify.hasOwnProperty('currency') && Shopify.currency.hasOwnProperty('rate')) {

							var currency 		= Shopify.currency.active;
							var exchangeRate 	= Shopify.currency.rate;
							var moneyFormat		= '{{amount}} '+currency; // We are no longer using this fallback value. If the currency can't be found, then the .toLocaleString method is used.
							
							var currencyFormat = '';
														
							if (currencyFormat.indexOf('{{iso_currency}}') !== -1) {
								currencyFormat = currencyFormat.replace('{{iso_currency}}', currency);
							}
							
							if (currencyFormat.indexOf('{{currency_symbol}}') !== -1) {
								if (typeof this.currencySymbols[currency] === 'string') {
									var symbol = this.currencySymbols[currency];
									currencyFormat = currencyFormat.replace('{{currency_symbol}}', symbol);
								} else {
									currencyFormat = currencyFormat.replace('{{currency_symbol}}', '');
								}
							}							
							
							if (typeof convertCurrency === 'undefined') {
								convertCurrency = false;
							}
							
							if (convertCurrency && exchangeRate !== "1.0") {
								price = this.convertMoney(price, exchangeRate, currency);
							}
							
							moneyFormat = currencyFormat;
							
							return this.formatMoney(price, moneyFormat, (currency || this.getDefaultCurrency()));
						}
						
						return '';
					},
					formatMoney: function(cents, format, fallbackCurrency, directionFor50) {
						
						// The directionFor50 is used to let the function know how to round numbers if the decimals equal 50.
						// We are using this direction for discounted value if the user chooses the amount_no_decimals format, because we calculate the discounted value in here by 
						// subtracting original - discount. 
						// E.g. 
						// original = 100
						// discount = 0.5
						// discounted value = 99.5
						// Rounded discounted value would be 100 and the rounded discount would be 1.
						if (typeof directionFor50 === 'undefined') {
							var directionFor50 = 'up';
						}
						
						try {
							if (typeof cents == 'string') {
								cents = cents.replace('.','');
							}

							var value = '';
							var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
							var formatString = format;

							function defaultOption(opt, def) {
								return (typeof opt == 'undefined' ? def : opt);
							}

							function formatWithDelimiters(number, precision, thousands, decimal, directionFor50) {

								precision 		= defaultOption(precision, 2);
								thousands 		= defaultOption(thousands, ',');
								decimal   		= defaultOption(decimal, '.');
								directionFor50  = defaultOption(directionFor50, 'up');

								if (isNaN(number) || number == null) {
									return 0;
								}

								var originalNumber = number;
								number = (number/100.0).toFixed(precision);
								
								if (directionFor50 === 'down') {
									if (((originalNumber/100) - number) === -0.5) {
										// We have rounded in the wrong direction
										// Subtract 1 to fix this
										number -= 1;
										number = number.toString();
									}
								}

								var parts 	= number.split('.'),
								dollars 	= parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
								cents   	= parts[1] ? (decimal + parts[1]) : '';

								return dollars + cents;
							}

							switch(formatString.match(placeholderRegex)[1]) {
								case 'amount':
								value = formatWithDelimiters(cents, 2);
								break;
								case 'amount_no_decimals':
								value = formatWithDelimiters(cents, 0, ',', '.', directionFor50);
								break;
								case 'amount_with_comma_separator':
								value = formatWithDelimiters(cents, 2, '.', ',');
								break;
								case 'amount_with_decimal_separator': // Some strange format
								value = formatWithDelimiters(cents, 2, ',', '.');
								break;
								case 'amount_no_decimals_with_comma_separator':
								value = formatWithDelimiters(cents, 0, '.', ',', directionFor50);
								break;
								case 'amount_no_decimals_with_space_separator':
								value = formatWithDelimiters(cents, 0, ' ', ',', directionFor50);
								break;
								case 'amount_with_apostrophe_separator':
								value = formatWithDelimiters(cents, 2, "'", '.');
								break;
							}
						

							return formatString.replace(placeholderRegex, value);
							
						} catch(e) {
							//console.log(e.message);
							
							price = cents/100;
							
							return price.toLocaleString(undefined, { style: 'currency', currency: fallbackCurrency });
						}
					},
					convertMoney: function(value, rate, currency, round) {
						// Converts money and rounds up based on the defined policy
						if (value <= 0) {
							return 0;
						}
						
						value *= rate;
						
						var roundUp = [
							'USD', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'GBP'
						];
						
						var roundTo100 = [
							'JPY'
						];
						
						var roundTo95 = [
							'EUR'
						];
						
						if (round) {
							if (roundUp.indexOf(currency) !== -1) {
								// Round up
								value = Math.ceil(value);						
							} else if(roundTo100.indexOf(currency) !== -1) {
								// Round to nearest 100
								value = Math.ceil(value/100)*100
							} else if(roundTo95.indexOf(currency) !== -1) {
								// Round up to 0.95
								value = Math.ceil(value) - 0.05;
							}
						}

						return value;
					}
				}
				
				
				return {
					cart			: cart,
					nav				: nav,
                    cartbot         : cartbot,
					string			: string,
					queue			: queue,
					promiseQueue	: promiseQueue,
					cookie			: cookie,
					local			: local,
					sessionStorage 	: session,
					money			: money
				}
			})();
			
			
			var enableDebugging = false;
			
			if (GlobalUtility.nav.isQueryParameterSet('botdebug') === true) {
				// Add query parameter botdebug=true to the URL to enable debugging mode.
				enableDebugging = true;
			}
			
			var cvProductsItemsDoesMatch;
			var localCartIswaitingToBeRefreshed = false;
            var isProductSelectorOpened = false;
            var isConfirmationModalOpened = false;
			
			/* --------------------- CONTROLLER --------------------- */
			var Controller = (function() {
				
				//var addingVariants = false; // Semaphore so that we don't add the same variants at the same time 
				
				function init() {
					
					if (typeof window.completelyDisableCartbotApp !== 'undefined' && window.completelyDisableCartbotApp === true) {
						console.log('Cartbot is disabled via completelyDisableCartbotApp variable.');
						return true;
					}
					
					window.OpusNoATC = true; // Disable Opus add to cart actions. (goodsafer)

					hookToAddToCartEvent();
					
					setListeners();

					setTimeout(function() {
						// We can only check for these actions if one of them isn't already being processed. 
						// This could happen if you click add to cart button in the one second interval set here. (helo-sauna)
						if (true || localCartIswaitingToBeRefreshed === false) { // Disabled for theapothecary-ca
							checkAndApplyCartActions(false, '');
						} else {
							console.log('Can\'t check for Cartbot actions because an action is already being processed');
						}
					}, 1000);
					
					addStyles();


                    
                    					
					window.addEventListener('icartAddToCartEvent', function() {
						// Item added to the cart
						console.log('Item added to the cart');
						checkAndApplyCartActions(false, 'add');
					});
					window.addEventListener('icartUpdateCartEvent', function() {
						// iCart updated
						console.log('iCart updated');
						checkAndApplyCartActions(false, '');
					});
					
					window.addEventListener('OpusCartChange', function() {
						// iCart updated
						//console.log('Opus Cart updated');
						checkAndApplyCartActions(false, '');
					});
					
										
					
										
					
					class CartbotProduct extends HTMLElement {
						
						constructor() {
							super();
							this.attachShadow({ mode: 'open' });
						}

						connectedCallback() {
							this.injectStyles();
							this.fetchProductData();
						}
						
						injectStyles() {
							
							const style = document.createElement('style');
							var confirmationModalStyles = getConfirmationModalProductStyles();

							style.textContent = confirmationModalStyles;
							this.shadowRoot.appendChild(style);
							
						}

						async fetchProductData() {
							const handle = this.getAttribute('data-handle');
							if (!handle) {
								console.error('Missing data-handle attribute');
								return;
							}
							
							try {
								//const response = await fetch(`/products/${handle}.json?`);
								const response = await fetch(`/products/${handle}.js?`);
								if (!response.ok) {
									throw new Error('Network response was not ok');
								}
								let data = await response.json();
								data = this.remapProductData(data);
								
								this.renderProduct(data);
							} catch (error) {
								console.error('Error fetching product data:', error);
							}
						}
						
						remapProductData(product) {
							
							return {
								product: {
									title: product.title,
									handle: product.handle,
									image: {
										src: "https:" + product.featured_image
									},
									variants: product.variants.map(variant => ({
										id: variant.id,
										title: variant.title,
										price: (variant.price / 100).toFixed(2), // convert cents to dollars
										featured_image: variant.featured_image
									}))
								}
							};
							
						}

						renderProduct(item) {
							if (!item) return;
							
							item = item.product;
							
							let variantId = this.getAttribute('data-variant-id')*1;
							if (!variantId) {
								console.error('Missing data-variant-id attribute');
								return;
							}
							
							let quantity = this.getAttribute('data-quantity');
							if (!quantity) {
								console.error('Missing data-quantity attribute');
								return;
							}
							
							let price = '';
							let variant = {};
							let title = item.title;
							
							for(let k = 0; k < item.variants.length; k++) {
								if (item.variants[k].id === variantId) {
									variant = item.variants[k];
									
									if (variant.title !== 'Default Title') {
										title += ' - ' + variant.title;
									}
								}
							}
							
							if (typeof variant.price !== 'undefined') {
								price = variant.price*100;
							}
							
							var priceFormatted = GlobalUtility.money.formatPrice(price);
							
							var imageUrl = '//cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?v=1530129081';
							
							if (typeof item.image === 'string') {
								imageUrl = item.image;
							}
							
							if (typeof item.image !== 'undefined' && typeof item.image.src === 'string') {
								imageUrl = item.image.src;
							}
							
							if (variant.featured_image !== null && typeof variant.featured_image !== 'undefined' && typeof variant.featured_image.src === 'string' && variant.featured_image.src.length > 0) {
								imageUrl = variant.featured_image.src;
							}
							
							// ${(price / 100).toFixed(2)} ${Shopify.currency.active}
							
							const template = document.createElement('template');
							template.innerHTML = `
								<div class="cartbot-confirmation-product" part="product">
									<div class="cartbot-confirmation-product-info">
										<a href="${window.location.origin}/products/${item.handle}" target="_blank">
											<img src="${imageUrl}" 
												 alt="Product Image" 
												 part="product-image"
												 style="max-width: 100%;">
										</a>
										<a href="${window.location.origin}/products/${item.handle}" target="_blank" style="text-decoration: none;">
											<p class="cartbot-confirmation-product-title" part="product-title">${quantity}x ${title}</p>
										</a>
										<span class="cartbot-confirmation-product-price" part="product-price" id="cartbot-confirmation-price-${item.id}">
											${priceFormatted}
										</span>
									</div>
								</div>
							`;
							
							this.shadowRoot.appendChild(template.content.cloneNode(true));
						}
					}

					customElements.define('cartbot-product', CartbotProduct);

				}

                				
                

				function addStyles() {
					
										
					
										
										
										
										
										
										
										
										
										
										
															
										
										
										
										
										
										
										
										
										
										
										
										
										
										
										
															
										
										
										
										
										
										
										
										
										
									}
				
				function closest(element, selector) {

					while (element && element.nodeType === 1) {
						if (element.matches(selector)) {
							return element;
						}

						element = element.parentNode;
					}

					return null;
				};
				
				function setListeners() {
					try {
						document.addEventListener('click', function (event) {
							
							try {
								var additionalCondition = false;
																
																
																
																	additionalCondition = event.target.matches('form[action*="/cart/add"] #gokwik-buy-now') || event.target.matches('form[action*="/cart/add"] #gokwik-buy-now *');
																
								if ((	
										event.target.matches('form[action*="/cart/add"] .shopify-payment-button__button') || 
										event.target.matches('form[action*="/cart/add"] .shopify-payment-button__button *') ||
										event.target.matches('form[action*="/cart/add"] .shopify-payment-button') ||
										event.target.matches('form[action*="/cart/add"] .shopify-payment-button *') ||
										event.target.matches('form[action*="/cart/add"] .shopify-payment-button__more-options') ||
										event.target.matches('form[action*="/cart/add"] [onclick="onClickBuyBtn(this, event)"]') ||
										event.target.matches('form[action*="/cart/add"] .lh-buy-now') ||
										event.target.matches('form.fast-checkout-form #fast-checkout-btn') ||
										additionalCondition
									)) {
									
									event.preventDefault();
									event.stopPropagation();
									event.stopImmediatePropagation();
									
									var formElement = closest(event.target, 'form');
									
									if (formElement !== null) {
										event.preventDefault();
										event.stopPropagation();
										event.stopImmediatePropagation();
										
										
										var url = formElement.getAttribute('action');
										if (url === null) {
											url = '/cart/add';
										}
										
										var data 		= new URLSearchParams();
										var formData 	= new FormData(formElement);

										for (var pair of formData) {
											data.append(pair[0], pair[1]);
										}
										
										var productData = getProductData([url, {body: data}]);

										var actions = getActions(productData, true, 'add'); // Second parameter indicates that we should ignore the session limit, as we are in the buy_now action.
										
										url = url+'?cartbot-cart-call';

										var queueKey = 'buy_now_queue';

										if (actions.add.length > 0) {
											var args = arguments;
											addingVariants = true;
											
											GlobalUtility.promiseQueue.add(queueKey, function() {
												return addVariants(actions.add, false, undefined, productData, false);
											}, goToCheckout);
											
										} else if (actions.remove.length > 0) {
											// We can't add any variants, but we can remove some variants 
											GlobalUtility.promiseQueue.add(queueKey, function() {
												return removeItems(actions.remove);
											}, goToCheckout);
										}
										
										var processOriginalAction = true;
										if (actions.remove.length > 0) {
											
											try {
												var baseVariantId = data.get('id');
												
												if (actions.remove[0].id === baseVariantId) {
													// It seems that we have to replace the original item with the added items, so simply skip the add to cart action.
													processOriginalAction = false;
												}
											} catch(e) {
												console.log(e);
											}
										}
										
										if (processOriginalAction === true) {
											GlobalUtility.promiseQueue.add(queueKey, function() {
												return fetch(url, {
													method: 'post',
													body: data,
												}).then(function(data) {

													// Go to checkout
													//goToCheckout();

												});
											}, goToCheckout);
										}
										
										GlobalUtility.promiseQueue.add(queueKey, function() {
											return checkAndApplyCartActions(true, 'add'); // Retrieve the cart again because of the "total cart" value bots. First parameter indicates that we should ignore the session limit, as we are in the buy_now action.
										}, goToCheckout);
										
										GlobalUtility.promiseQueue.process(queueKey);
										
									}
								}
							} catch(e) {
								console.log(e.message);
							}
						}, true);
					} catch(e) {
						console.log(e.message);				
					}
					
										
					
						setCheckoutButtonListener();

										
										
										
					try {
						addEventListener('storage', function(event) {
							if (typeof event.key === 'string' && event.key === 'cartbot_data_cart') {
								// Cart was updated (through us). Refresh it locally.
								GlobalUtility.cart.get(false, false);
							}
						});
					} catch(e) {
						console.log(e.message);
					}
				}
				
				canPreventCheckout = true;
				function setCheckoutButtonListener() {
					
					// Should we use all these classes?
					var checkoutSelector = "input[type='submit'][name='checkout']:not(.productForm-submit), button[type='submit'][name='checkout']:not(.productForm-submit):not([disabled]), button.checkout-button[name='checkout'], form.cart-form a.btn-checkout, a[href='/checkout'], #dropdown-cart button.btn-checkout, .cart-popup-content a.btn-checkout, .cart__popup a.checkout-button, .widget_shopping_cart_content a[href='/checkout'], .jas_cart_page button.checkout-button, .mini-cart-info button.mini-cart-button, a.checkout-link, a.mini-cart-checkout-button, .shopping_cart_footer .actions button";
					checkoutSelector += ', #dropdown-cart button.btn[onclick="window.location=\'/checkout\'"], form[action="/cart"] button[name="checkout"], .bundler-checkout-button, input.action_button[type="submit"][value="Checkout"]';
					checkoutSelector += ', button.Cart__Checkout[type="submit"][name="checkout"] span';
					checkoutSelector += ', .popup-cart a[href^="/checkout"], #slidecarthq .footer button.button';
					checkoutSelector += ', button.cart__checkout-cta, button.sidecart__checkout-cta';
					checkoutSelector += ', button.bc-atc-slide-checkout-btn';
					checkoutSelector += ', #ajax-cart__content .ajax-cart__button.button--add-to-cart';
					checkoutSelector += ', .cart_container form.js-cart_content__form button.add_to_cart.action_button';
					checkoutSelector += ', .cart_container .js-cart_content__form input.action_button[type="submit"]';
					checkoutSelector += ', #checkout_shipping_continue_btn';
					checkoutSelector += ', .spurit-occ2-checkout a[name="checkout"][href="/checkout/"]';
					checkoutSelector += ', #checkout-button';
					checkoutSelector += ', button.btn-checkout';
					checkoutSelector += ', button.rebuy-cart__checkout-button'; // Changed from button.rebuy-button on 2022-11-09
					checkoutSelector += ', .go-cart__button[href*="/checkout/"],  .go-cart__button[href*="/checkout?"]';
					checkoutSelector += ', a[href*="/checkout/"]:not([href*="/a/bundles/checkout/"]):not([href*="/subscriptions/"]), a[href*="/checkout?"]:not([href*="partial.ly"])';
					checkoutSelector += ', input.cart--button-checkout, a.satcb-cs-checkout-btn';
					checkoutSelector += ', button#parcelySubmit[data-cart-submit]';
					checkoutSelector += ', #checkout[type="submit"][name="checkout"], #checkout[type="submit"][name="checkout"] .custom-cobutton';
					checkoutSelector += ', a[href*="/checkout"]:not([href*="/a/bundles/checkout/"]):not([href*="/subscriptions/"]):not([href*="partial.ly"]):not([href^="https://checkout"])';
					checkoutSelector += ', .rebuy-cart__flyout-footer .rebuy-cart__flyout-subtotal + .rebuy-cart__flyout-actions > button.rebuy-button:first-child, .rebuy-cart__flyout-footer .rebuy-cart__flyout-subtotal + .rebuy-cart__flyout-actions > button.rebuy-button:first-child span';
					checkoutSelector += ', .rebuy-cart__checkout-button, .rebuy-cart__checkout-button span, rebuy-cart__checkout-button span i';
					checkoutSelector += ', .quick-cart__buy-now[data-buy-now-button], .icart-checkout-btn, .icartCheckoutBtn';
					checkoutSelector += ', button.cart__checkout, button[type="submit"][form="mini-cart-form"]';
					checkoutSelector += ', button[type="submit"][form="mini-cart-form"] span, button[type="submit"][form="mini-cart-form"] span svg';
					checkoutSelector += ', .SideCart__footer button[type="submit"]';
					checkoutSelector += ', div[onclick="clicktocheckoutnormal()"], div[onclick="clicktocheckout()"]';
					checkoutSelector += ', .mini-cart__actions .mini-cart__checkout, .mini-cart__actions .mini-cart__checkout *';
					checkoutSelector += ', button.checkout-button[onclick="window.location=\'/checkout\'"]';
					checkoutSelector += ', [data-ocu-checkout="true"]';
					checkoutSelector += ', input[type="submit"][name="checkout"].cart__submit';
					checkoutSelector += ', [data-ocu-checkout="true"], .btncheckout';
					checkoutSelector += ', form[action="/cart"][method="post"] button[type="submit"]:not([name*="update"]):not([name*="add"])';
					checkoutSelector += ', a.js-checkout, #mu-checkout-button';
					checkoutSelector += ', #cart-sidebar-checkout:not([disabled="disabled"]), .checkout-x-buy-now-btn, .checkout-x-buy-now-btn .hs-add--to--cart, .slider-cart-checkout-btn';
					checkoutSelector += ', button[onclick="window.location=\'/checkout\'"], .ymq-fake-checkout-btn, button.StickyCheckout__button';
					checkoutSelector += ', input[type="submit"][name="checkout"], a.checkout-button';
					checkoutSelector += ', .hs-content-checkout-button, .hs-content-checkout-button .hs-add--to--cart, .hs-content-checkout-button .hs-checkout-purchase';
					checkoutSelector += ', button.cart__checkout-button, button.cart__checkout-button .loader-button__text, button.cart__checkout-button .loader-button__loader, button.cart__checkout-button .loader-button__loader div, button.cart__checkout-button .loader-button__loader div svg';
					checkoutSelector += ', .cd-cart-checkout-button';
					checkoutSelector += ', .sezzle-checkout-button, .sezzle-checkout-button .sezzle-button-logo-img';
					checkoutSelector += ', .Cart__Footer .Cart__Checkout, .cart--checkout-button button, .cart--checkout-button button span, button.js-process-checkout';
					checkoutSelector += ', .j2t-checkout-link, .j2t-checkout-link span, #cart-checkout, #cart-notification-form button[name="checkout"]';
					checkoutSelector += ', .zecpe-btn-checkout, .zecpe-btn-checkout span, .mbcOverlayOnCheckout, #checkoutCustom, #wsg-checkout-one';
					checkoutSelector += ', .icart-chk-btn, .side-cart__checkout button#sideCartButton'; // glow-skinco
					checkoutSelector += ', .cart__checkout-button, #actionsArea button[onclick="startCheckoutEvent()"], button.cart--button-checkout, .kaktusc-cart__checkout, .cart__checkout';
					checkoutSelector += ', #cartform_bottom #actionsArea button, hh-button[href="/checkout"]';
					checkoutSelector += ', .cart-drawer--checkout-button button, .scd__checkout, button.scd__checkout span, #cart-summary button[data-cart-submit]';
					checkoutSelector += ', .cart__footer .cart__submit-controls input.cart__submit, #CartDrawer-Checkout, .ajax-cart__button-submit, .amp-cart__footer-checkout-button, button#checkout, button#checkout span';
					
					
					
					try {
						// Try to attach the default aggressive event listener to trigger before other events
						// Some older browsers don't support it.
						document.addEventListener('click', function (event) {

							try {
								if (canPreventCheckout === true && event.target.matches(checkoutSelector)) {

									if (typeof window.ZapietCheckoutEnabled !== 'undefined' && window.ZapietCheckoutEnabled === false) {
										return true;
									}

									event.preventDefault();
									event.stopPropagation();
									event.stopImmediatePropagation();
									
									if (event.target.matches('[wallet-params]') !== true) {
										// Add clicked class to the button, but not on the dynamic checkout buttons on the cart page as we can't re-click on them.
										event.target.classList.add('cartbot-checkout-button-clicked');
									}


																		
										checkCartBeforeCheckout(event.target);

																	}
							} catch(e) {
								console.log(e.message);
								
								goToCheckout();
							}
						}, true);
						
					} catch(e) {

					}
					
					
									}
				
				function updateCartDataWithCartInputs(cartData, parentForm) {
					
					var quantityWasFixed = false;
					try {
						// Find any input items on cart page, loop through them and change the quantity if needed
						var cartItemKeyRegex = /\d+:[a-z0-9]+/;
						
						var parentElement = document;
						if (parentForm !== null) {
							parentElement = parentForm;
						}

						var cartLineItems = parentElement.querySelectorAll('[name="updates[]"]');

						if (cartLineItems.length > 0) {
							for (var k = 0; k < cartLineItems.length; k++) {

								var el = cartLineItems[k];
								
								var id = el.id;

								if (typeof id === 'string') {
									var match = id.match(cartItemKeyRegex);
									
									if (match !== null && typeof match[0] === 'string') {
										var itemKey		 = match[0];
										var itemQuantity = el.value*1;
										
										if (itemQuantity >= 0) {
											// Loop through cart items and correct quantity if needed
											for (var j = 0; j < cartData.items.length; j++) {
												if (cartData.items[j].key === itemKey && cartData.items[j].quantity != itemQuantity) {
													// Set new item quantity
													cartData.items[j].quantity 				= itemQuantity;
													cartData.items[j].line_price 			= itemQuantity*cartData.items[j].price; 			// No need to actually set this, just the quantity is important
													cartData.items[j].original_line_price 	= itemQuantity*cartData.items[j].original_price; 	// No need to actually set this, just the quantity is important
													cartData.items[j].final_line_price 		= itemQuantity*cartData.items[j].final_price; 		// No need to actually set this, just the quantity is important
												}
											}
											
											quantityWasFixed = true;
										}
									}
								}
								
								if (quantityWasFixed === false) {
									
									if (cartLineItems.length === cartData.items.length) {
										// Only run this check if we have the same number of input elements as there are items in the cart 

										var elementIndex = el.dataset.index;
										
										if (typeof elementIndex === 'undefined') {
											// The element doesn't have an index on it 
											// Get your own index. 
											var index = k+1;
										}
										
										if (typeof index === 'string' || typeof index === 'number') {

											var index = index*1;
											
											if (index > 0) {
												var itemQuantity = el.value*1;
													if (itemQuantity >= 0) {
													// Loop thorugh cart items and correct quantity if needed
													for (var j = 0; j<cartData.items.length; j++) {
														if ((j+1) === index && cartData.items[j].quantity != itemQuantity) {

															// Set new item quantity
															cartData.items[j].quantity 				= itemQuantity;
															cartData.items[j].line_price 			= itemQuantity*cartData.items[j].price; // No need to actually set this, just the quantity is important
															cartData.items[j].original_line_price 	= itemQuantity*cartData.items[j].original_price; // No need to actually set this, just the quantity is important
															cartData.items[j].final_line_price 		= itemQuantity*cartData.items[j].final_price; // No need to actually set this, just the quantity is important
														}
													}
												}
											}
										}
									}
								}
							}
						}
						
					} catch(e) {
						console.error(e);
					}

					return {
						cartData		: cartData,
						quantityWasFixed: quantityWasFixed
					}
				}
				
				function getCartChanges(cartData, parentForm) {
					
					var cartChanges = [];
					var quantityWasFixed = false;
					
					try {
						// Find any input items on cart page, loop through them and change the quantity if needed
						var cartItemKeyRegex = /\d+:[a-z0-9]+/;
						
						var parentElement = document;
						if (parentForm !== null) {
							parentElement = parentForm;
						}

						var cartLineItems = parentElement.querySelectorAll('[name="updates[]"]');

						if (cartLineItems.length > 0) {
							for (var k = 0; k < cartLineItems.length; k++) {

								var el = cartLineItems[k];
								
								var id = el.id;

								if (typeof id === 'string') {
									var match = id.match(cartItemKeyRegex);
									
									if (match !== null && typeof match[0] === 'string') {
										var itemKey		 = match[0];
										var itemQuantity = el.value*1;
										
										if (itemQuantity >= 0) {
											// Loop through cart items and correct quantity if needed
											for (var j = 0; j < cartData.items.length; j++) {
												if (cartData.items[j].key === itemKey && cartData.items[j].quantity != itemQuantity) {
													
													cartChanges.push({
														key		: cartData.items[j].key,
														id		: cartData.items[j].id,
														quantity: itemQuantity
													});
												}
											}
											
											quantityWasFixed = true;
										}
									}
								}
								
								if (quantityWasFixed === false) {
									
									if (cartLineItems.length === cartData.items.length) {
										// Only run this check if we have the same number of input elements as there are items in the cart 
										
										var elementIndex = el.dataset.index;
										
										if (typeof elementIndex === 'undefined') {
											// The element doesn't have an index on it 
											// Get your own index. 
											var index = k+1; // Increase the index for frederica-pt, otherwise we get wrong cart item
										} else {
											var index = elementIndex;
										}
										
										if (typeof index === 'string' || typeof index === 'number') {
											index = index*1;
											
											if (index > 0) {
												var itemQuantity = el.value*1;
												
												if (itemQuantity >= 0) {
													// Loop through cart items and correct quantity if needed
													for (var j = 0; j<cartData.items.length; j++) {
														if ((j+1) === index && cartData.items[j].quantity != itemQuantity) {

															cartChanges.push({
																key		: cartData.items[j].key,
																id		: cartData.items[j].id,
																quantity: itemQuantity
															});
														}
													}
												}
											}
										}
									}
								}
							}
						}
						
					} catch(e) {
						console.error(e);
					}

					return cartChanges;
				}
				
				var wasInvokedByBundler = false;
				// This method is here so Bundler can first check with Cartbot if any item should be added to the cart or not. 
				function applyBots() {

					if (wasInvokedByBundler === false) {
						wasInvokedByBundler = true;
						checkCartBeforeCheckout();

						// We return true to let the Bundler know that we will take care of this
						return true;
					}

					// Return false to let Bundler know to do it's magic
					return false;
				}
				
				changesWereMadeToTheCart = false; // We use this to know if we made any changes to the cart.
				function checkCartBeforeCheckout(clickedButton, recall) {
					
					// Recall parameter lets us know if this is a callback of this function 
					if (typeof recall === 'undefined') {
						recall = false;
					}
					
					var parentForm = null;
					if (typeof clickedButton !== 'undefined') {
						var parentForm = clickedButton.closest('form, .icartShopifyCartContent');
					}
					
					if (recall === false) {
						// Add our function as a callback in case Cartbot is already adding items to the cart. This will essentially re-trigger this function 
						// after cartbot adds items to the cart. But this is okay, as we make a double check to make sure that the correct items are in the cart before going to the checkout. 
						afterAddToCartCallback = function() {
							checkCartBeforeCheckout(clickedButton, true)
						};
					}

				
					var promise = GlobalUtility.cart.get(false).then(function(data) {
						
						return data.clone().json().then(function(cartData) {

							var cartChanges = getCartChanges(cartData, parentForm);
							
							if (cartChanges.length > 0) {
								// We have some cart changes 
								// Get updated cart data so we can calculate the necessary changes 
								if (changesWereMadeToTheCart === false) { // But only if we didn't already update it in the last call
									var updatedCartData = updateCartDataWithCartInputs(cartData, parentForm);
									cartData = updatedCartData.cartData;
									GlobalUtility.cart.cartData = cartData; // Update the cart data with new values 
								}
								
								var actions = getActions(undefined, false, '');
								
								// Check if we have to make any actions after this change.
								if (actions.add.length > 0 || actions.remove.length > 0) {
									// If we have, then we make this change to the cart and then apply our actions
									return updateVariants(cartChanges).then(function(data) {
										// Check for actions and apply them on the cart 
										return checkCartAndAddProduct(false, false, '');
									});
								}
								
							} else {							
								changesWereMadeToTheCart = false;
								return checkCartAndAddProduct(false, false, '');
							}						
						});
					}).then(function(data) {

						goToCheckout();
						
					});
				}
				
				
				function goToCheckout() {
					
					// Bundler integration
					if (typeof window.bndlr !== 'undefined' && typeof bndlr.canUseCheckout === 'function' && typeof bndlr.checkout === 'function') {
						if (bndlr.canUseCheckout() === true) {
							bndlr.checkout();
							return true;
						}
					}
					
					var checkoutHandled = false;
					try {
						if (typeof window.gokwikSdk !== 'undefined' && typeof window.gokwikSdk.initCheckout !== 'undefined' && typeof window.merchantInfo !== 'undefined') {
							window.gokwikSdk.initCheckout(window.merchantInfo);
							
							checkoutHandled = true;
						}
					} catch(e) {
						console.error(e);
					}
					
					if (checkoutHandled === false) {
						
						
						var clickedCheckoutButton = document.querySelector('.cartbot-checkout-button-clicked');
						
												
						if (clickedCheckoutButton !== null && changesWereMadeToTheCart === false) {
							// If any changes were made to the cart, then we can't click the same button, as it would just submit the original form.
							// But if we didn't make any changes, then we can submit the form and keep the original functionality.

							canPreventCheckout = false;

							// Simulate the click on the checkout button 
							clickedCheckoutButton.click();
							
							canPreventCheckout = true;

															// Force redirection to checkout if it didn't happen within 4 seconds. 
								
								var canFallbackToCheckout = true;
								if (typeof window.sendicaPickupPoints !== 'undefined' && typeof window.sendicaPickupPoints.controllingCheckout !== 'undefined') {
									if (window.sendicaPickupPoints.controllingCheckout === true) {
										canFallbackToCheckout = false;
									}
								}
								
								if (canFallbackToCheckout === true) {								
									setTimeout(function() {
										window.location.href = '/checkout';
									}, 4000);
								}
														
						} else {
							// There isn't any checkout button we clicked, so simply go to the checkout. 
							window.location.href = '/checkout';
						}
					}
					
					
				}
				
				function checkAndApplyCartActions(ignoreSessionLimit, eventType) {

					
						var promise = GlobalUtility.cart.get(false).then(function(data) {
							/*return data.clone().json().then(function(p) {
								return checkCartAndAddProduct(true);
							});
							*/
							return checkCartAndAddProduct(true, ignoreSessionLimit, eventType);
						});
						
						return promise;
					
										
					/*
						var simPromise = new Promise((resolve, reject) => {
							var response = new Response(JSON.stringify(self.cartData), { "status" : 200 , "statusText" : "Smashing success!" });
							// Resolve the promise
							resolve(response);
						});
						
						return simPromise;
					*/
				}
				
				function refresh() {
					
					globalDebounce('cartbot_refresh', function() {
						try {
							checkAndApplyCartActions();
						} catch(e) {
							console.log(e);
						}
					}, 100);
				}
				
				
				function refershLocalCart() {
					if (enableDebugging) {
						console.log('== refreshing local cart ==');
					}

					return GlobalUtility.cart.get(false);
				}
				
				function checkCartAndAddProduct(refreshIfNeeded, ignoreSessionLimit, eventType) {
					if (typeof eventType === 'undefined') {
						eventType = '';
					}
					
					var actions = getActions(undefined, ignoreSessionLimit, eventType);

					var removeActions = JSON.parse(JSON.stringify(actions.remove));

					if (actions.add.length > 0) {
						// We can add some variants 
						
						changesWereMadeToTheCart = true;
						
						// TODO: 	We should also add these products to the cached cart before we add them to the cart, to make sure that any other 
						// 			request which might fire in between won't try to add them to the cart again.

						var promise = addVariants(actions.add).then(function(data) {

							if (removeActions.length > 0) {
								
								// We can remove some variants // TODO: we should also return a promise here 
								removeItems(removeActions).then(function(data) {
									if (refreshIfNeeded && GlobalUtility.nav.isCartPage()) {
										// Refresh the cart page
										//window.location.reload();
										GlobalUtility.nav.reload();
									}
								});
							} else {

								if (refreshIfNeeded && GlobalUtility.nav.isCartPage() && data !== null) { // if data is null, then an error happened 

									// Refresh the cart page
									console.log('reloading the cart page');
									//window.location.reload();
									GlobalUtility.nav.reload();
								}
							}
						});
						
						return promise;
					} else if (actions.remove.length > 0) {
						
						changesWereMadeToTheCart = true;
						
						// We can't add any variants, but we can remove some variants 
						var promise = removeItems(actions.remove).then(function(data) {
							if (refreshIfNeeded && GlobalUtility.nav.isCartPage()) {
								// Refresh the cart page
								//window.location.reload();
								GlobalUtility.nav.reload();
							}
						});
						
						return promise;
					}
					
					// Fallback to empty promise 
					var simPromise = new Promise((resolve, reject) => {
						var response = new Response('', { "status" : 200 , "statusText" : "Fallback promise." });
						// Resolve the promise
						resolve(response);
					});
					
					return simPromise;
				}
				
				function getProductData(arguments, alsoForChangeActions) {
					
					if (typeof alsoForChangeActions === 'undefined') {
						alsoForChangeActions = false;
					}

					var url 	= arguments[0];
					var form 	= arguments[1];

					var isAddingToCart = isCorrectUrlAction(url, 'add');
					var isChangingCart = isCorrectUrlAction(url, 'change');
					
					var formData = {};
					
					if (isAddingToCart || (alsoForChangeActions && isChangingCart)) {
						
						if (form !== null && typeof form === 'object' && typeof form.body === 'object') {
							
							// Display the key/value pairs
							for(var pair of form.body.entries()) {
								formData[pair[0]] = pair[1];
							}
							
						} else if(typeof form === 'object' && typeof form.body === 'string' && typeof form.headers !== 'undefined' && typeof form.headers['Content-Type'] === 'string' && form.headers['Content-Type'].indexOf('application/json') !== -1) {
							
							try {
								// This might be the JSON format 
								formData = JSON.parse(form.body);
							} catch(e) {
								//console.error(e);
							}
						} else if(typeof form === 'object' && typeof form.body === 'string' && typeof form.headers !== 'undefined' && typeof form.headers['content-type'] === 'string' && form.headers['content-type'].indexOf('application/json') !== -1) {
							
							try {
								// This might be the JSON format 
								formData = JSON.parse(form.body);
							} catch(e) {
								//console.error(e);
							}
						} else if(typeof form === 'object' && typeof form.body === 'string') {
							// serialized string to object 
							
							formData = GlobalUtility.nav.getQueryParams(form.body);
						} else if(typeof form === 'object' && typeof form.body === 'undefined') {
							// serialized string to object 
							
							try {
								for(var pair of form.entries()) {
									formData[pair[0]] = pair[1];
								}
							} catch(e) {
								console.log(e);
							}							
							
						} else if(typeof form === 'string') {
							
							// serialized string to object 
							try {
								// This might be the JSON format 
								formData = JSON.parse(form);
							} catch(e) {
								//console.error(e);
							}
							
							if (Object.keys(formData).length === 0) {
								// Looks like we don't have a JSON object 
								// It is probably a URL encoded form data 
								try {
									formData = GlobalUtility.nav.getQueryParams(form);
								} catch(e) {
									//console.error(e);
								}
							}
						} 
					}
					
					if (typeof formData.line !== 'undefined' && typeof formData.id === 'undefined') {
						// Get id from 
						var cart = JSON.parse(JSON.stringify(GlobalUtility.cart.cartData));
						
						var line = formData.line*1;
						line = line-1;
						if (typeof cart.items !== 'undefined' && typeof cart.items[line] !== 'undefined') {
							formData.id 	= cart.items[line].id;
							formData.key 	= cart.items[line].key;
						}
					}
					
					if (typeof formData.items !== 'undefined' && typeof formData.items[0] !== 'undefined') {
						var originalItems = formData.items;
						
						formData = formData.items[0];

						formData.items = originalItems; // Pass the original items key so that we can prepare all products
					}
					
					if (typeof formData.updates !== 'undefined' && Object.keys(formData.updates).length > 0) {
						
						var originalItems = [];
						for (var w in formData.updates) {
							if (formData.updates.hasOwnProperty(w)) {
								originalItems.push({
									id: w,
									quantity: formData.updates[w]
								});
							}
						}

						formData = originalItems[0];

						formData.items = originalItems; // Pass the original items key so that we can prepare all products
					}
					
					if (typeof formData['id[]'] !== 'undefined') {
						formData.id = formData['id[]'];
					}
					
					if (typeof formData['items[0][id]'] !== 'undefined') {
						formData.id = formData['items[0][id]']
					}
					
					if (typeof formData['items[0][quantity]'] !== 'undefined') {
						formData.quantity = formData['items[0][quantity]']
					}
					
					if (typeof formData['items[0][selling_plan]'] !== 'undefined') {
						formData.selling_plan = formData['items[0][selling_plan]']
					}
					

					if (typeof formData.id === 'string' && formData.id.indexOf(':') !== -1) {
						var splitId = formData.id.split(':');
						
						if (typeof splitId[0] === 'string' && splitId[0].length > 0) {
							formData.id = splitId[0];
						}
					}
					
					if (typeof formData.id === 'undefined' && typeof formData['items[1]id'] !== 'undefined') {
						// It seems that the theme is adding multiple items to the cart at the same time 
						formData.id = formData['items[1]id'];
					}
					
					if (typeof formData.id !== 'undefined') {
						// We are adding a product to the cart 
						// Do your magic then return true
						var quantity = 1;
						if (typeof formData.quantity !== 'undefined') {
							quantity = formData.quantity;
						}
						
						var selling_plan = '';
						if (typeof formData.selling_plan !== 'undefined') {
							selling_plan = formData.selling_plan;
						}
						
						var otherItems = [];

						if (typeof formData.items !== 'undefined' && formData.items.length > 1) {
							// This requestust is adding more than just one item to the cart 
							// Add all item data to the object

							for (var i = 0; i < formData.items.length; i++) {
								var item = formData.items[i];
								
								if (typeof item.id !== 'undefined') {
									
									var newItemQuantity = 1;
									if (typeof item.quantity !== 'undefined') {
										newItemQuantity = item.quantity;
									}
									
									var newItemSellingPlan = '';
									if (typeof item.selling_plan !== 'undefined') {
										newItemSellingPlan = item.selling_plan;
									}
									
									
									var newItem = {
										id: item.id,
										quantity	: newItemQuantity,
										selling_plan: newItemSellingPlan,
									}
									
									otherItems.push(newItem);
								}
							}							
						}
						
						if (otherItems.length === 0) {
							var itemsLoop = true;
							var i = 0; 
							
							while (itemsLoop) {
								
								if (typeof formData['items['+i+'][id]'] === 'undefined') {
									itemsLoop = false; // Stop the loop. 
									
								} else {
									var newItemId = formData['items['+i+'][id]'];
									
									var newItemQuantity = 1;
									if (typeof formData['items['+i+'][quantity]'] !== 'undefined') {
										newItemQuantity = formData['items['+i+'][quantity]'];
									}
									
									var newItemSellingPlan = '';
									if (typeof formData['items['+i+'][selling_plan]'] !== 'undefined') {
										newItemSellingPlan = formData['items['+i+'][selling_plan]'];
									}
									
									var newItem = {
										id			: newItemId,
										quantity	: newItemQuantity,
										selling_plan: newItemSellingPlan,
									}
									
									otherItems.push(newItem);
								}
								i++;
							}
						}
						
												
						if (formData.id === '') {
							return false; // We have empty product ID so this add to cart event is basically invalid
						}
						
						if (formData.id*1+'' !== formData.id+'') {
							// The ID isn't a number so just skip this one
							return false;
						}
						
						return {
							id						: formData.id,
							quantity				: quantity,
							selling_plan			: selling_plan,
							other_items				: otherItems,
                            number_of_line_in_cart  : formData.line
						};
					}
					
					return false;
				}
				
				function isCartAction(arguments) {

					var url 	= arguments[0];
					
					var types = [
						'/cart/'
					];
					
					var restrictedUrlParameters = [
						'cartbot-cart-call',
						'bundler-cart-call'
					];
					
					
					var isCartAction = false;
					if (typeof url === 'string') {
						for(var i = 0; i<types.length; i++) {
							if (url.indexOf(types[i]) !== -1) { // && url.indexOf('cartbot-cart-call') === -1) {
								
								var restrictedParameterMatch = false;
								for(var z = 0; z < restrictedUrlParameters.length; z++) {
									if (url.indexOf(restrictedUrlParameters[z]) !== -1) {
										restrictedParameterMatch = true;
									}
								}
								
								if (restrictedParameterMatch === false) {
								
									isCartAction = true;
									// Stop the loop
									i = types.length;
								}
							}
						}
					}
					
					return isCartAction;
				}
				
				
				
				function isCorrectUrlAction(url, type) {
					var allTypes = {
						'add' : [
							'/cart/add.js',
							'/cart/add.json',
							'/cart/add'
						],
						'change': [
							'/cart/change.js',
							'/cart/change.json',
							'/cart/change',
							'/cart/update.js',
							'/cart/update.json',
							//'/cart/update'
						],
						'clear': [
							'/cart/clear.js',
							'/cart/clear.json',
							'/cart/clear',
						]
					};
					
											// Someting strange is happening here, because some other app updates the cart and then, the bot is triggered twice. 
						// Not sure how and why, but this resolved it, as the other app used this endpoint. 
						// Would be grat to figure out what was actually causing the issue.
						allTypes.change.push('/cart/update');
										
					if (typeof allTypes[type] === 'undefined') {
						return false;
					}
					
					var restrictedUrlParameters = [
						'cartbot-cart-call'
					];
					
					if (type === 'change') {
						restrictedUrlParameters.push('bundler-cart-call');
					}
					
										
										
										
										
					var types = allTypes[type];
					
					var isCorrectUrlAction = false;
					if (typeof url === 'string') {
						for(var i = 0; i<types.length; i++) {

							if (url.indexOf(types[i]) !== -1) { // && url.indexOf('cartbot-cart-call') === -1) {
								
								var restrictedParameterMatch = false;
								for(var z = 0; z < restrictedUrlParameters.length; z++) {
									if (url.indexOf(restrictedUrlParameters[z]) !== -1) {
										restrictedParameterMatch = true;
									}
								}
								
								if (restrictedParameterMatch === false) {

									isCorrectUrlAction = true;
									// Stop the loop
									i = types.length;
								}
							}
						}
					}
					
					return isCorrectUrlAction;
					
				}
				
				function getAdditionalUrlParameters() {
					// Dawn theme 
					// Used for hackeeslax.myshopify.com
					var cartEl = document.querySelector('cart-notification') || document.querySelector('cart-items') || document.querySelector('cart-drawer') || document.querySelector('product-form.product-form');
					
					if (cartEl !== null && typeof cartEl.renderContents === 'function') {
						
						var sectionsToRender = 'cart-drawer,cart-icon-bubble';
						if (typeof cartEl.getSectionsToRender === 'function') {
							//var actualSectionsToRender = cartEl.getSectionsToRender().map((section) => section.section);
							
							var actualSectionsToRender = [];
							
							var sectionsToRender = cartEl.getSectionsToRender();
							for (var k in sectionsToRender) {
								if (sectionsToRender.hasOwnProperty(k)) {
									if (typeof sectionsToRender[k].section === 'string') {
										actualSectionsToRender.push(sectionsToRender[k].section);
									} else if (typeof sectionsToRender[k].id === 'string') {
										actualSectionsToRender.push(sectionsToRender[k].id);
									}
								}
							}
							
							if (actualSectionsToRender.length > 0) {
								sectionsToRender = actualSectionsToRender.join(',');
							}
						}
						
						return 'sections='+sectionsToRender;
					}
					
					return '';
				}
				
				function isChromeOniOS() {
					const userAgent = navigator.userAgent;
					return /CriOS/.test(userAgent);
				}
				
				function isJsonString(str) {
					try {
						JSON.parse(str);
					} catch (e) {
						return false;
					}
					return true;
				}
					
				function hookToAddToCartEvent() {
					//console.log('hookToAddToCartEvent');
					
										
										
					
													if (true) {
								// Workaround so that we can still have isChromeOniOS check for mon-carbone-japan. 507e4f reported that the bot didn't work in Chrome on iPhone.
													
							// Added on 2022-12-06: oneswipeau
							(function(oldSend) {
								
								// override the native send()
								XMLHttpRequest.prototype.send = function(data) {
									
									
									/*
									console.log('this', this);
									console.log('this._url', this._url);
									console.log('arguments', JSON.parse(JSON.stringify(arguments)));
									console.log('data', JSON.parse(JSON.stringify(data)));
									*/
                                    //console.log('in our custom send');

									
									var url = this._url;
									//var args = arguments;
									
									var originalSendWasQueued = false;
									
									if (typeof url === 'string' && url.length > 0) {
									
										var queueKey = GlobalUtility.string.getRandomString(10);

										var wasChangeAction = false;
										try {									
											var oldChange = this.onreadystatechange;

											this.onreadystatechange = function() {
												if (typeof oldChange === 'function') {
													oldChange.apply(this, arguments);
												}
												
												if (this.status === 200 && this.readyState === 4) {
													// Process queue
													GlobalUtility.promiseQueue.process(queueKey);
												}										
											};
											
											if (isCorrectUrlAction(url, 'change')) {
												// This is a change action 
												// Queue the cart check function
												
												
												// TODO add this to fetch request so that we remove the item before the theme removes it from the cart 
												
												var productData = getProductData([url, arguments[0]], true);
												//console.log('productData', productData);
												var actions = getActions(productData, false, 'change');

												if (actions.remove.length > 0) {
													// We can't add any variants, but we can remove some variants 
													var args = arguments;
													var self = this;
													
													originalSendWasQueued 	= true;
													
													if (actions.add.length > 0) {
														
														addVariants(actions.add, false, undefined, productData).then(function(data) {
															
															if (actions.remove.length > 0 && actions.remove[0].id == productData.id && actions.remove[0].quantity === productData.quantity*1) {
																// We have to remove the item which we are updating. 
																/*
																console.log('args', args);
																// quantity=2&line=1
																var outputString = args[0].replace(/quantity=\d&/g, 'quantity=0&');
																args[0] = outputString;
																console.log('outputString', outputString);
																
																// Remove items simply by adjusting the original change request
																oldSend.apply(self, args);
																*/
																// Remove items and don't queue the original request or we might change the quantity of a wrong item.
																removeItems(actions.remove).then(function(data) {
																	// Removed items
																	// Apply the old request
																	// Refresh page // ovdje sam
																	if (GlobalUtility.nav.isCartPage()) {
																		// Refresh the cart page
																		GlobalUtility.nav.reload();
																	}
																});

															} else {
															
																// No need to queue the original send here, as we will run it later because we didn't set the originalSendWasQueued variable. 
																removeItems(actions.remove).then(function(data) {
																	// Removed items
																	// Apply the old request
																	oldSend.apply(self, args);
																});
															}
														});
													} else {
														
														// Allow the theme to first adjust the cart and then remove items so that we don't change the line count and thus don't mess up the theme remove requests.

														originalSendWasQueued = false;
														GlobalUtility.promiseQueue.add(queueKey, function() {
															// Do stuff
															return removeItems(actions.remove);
														}, function() {});
														
														/*
														// This code will remove items before they are edited by the theme, causing issues where line ID changes
														// No need to queue the original send here, as we will run it later because we didn't set the originalSendWasQueued variable. 
														removeItems(actions.remove).then(function(data) {
															// Removed items
															// Apply the old request
															oldSend.apply(self, args);
														});
														*/
													
														
													}
												} else {
													GlobalUtility.promiseQueue.add(queueKey, function() {
														// Do stuff
														return checkAndApplyCartActions(false, 'change');
													}, function() {});
												}
												
												wasChangeAction = true;
												
											} else {
											
												var productData = getProductData([url, arguments[0]]);

												var addingVariants = false;
												if (productData !== false) {

													localCartIswaitingToBeRefreshed = true;
													GlobalUtility.promiseQueue.add(queueKey, function() {
														// Do stuff
														return refershLocalCart();
													}, function() {});
													
													// We are adding a product to the cart 
													// Do your magic then return true
													//var actions = getActions(productData, false, 'add');
													var actions = getActionsAll(productData, false, 'add');

													if (actions.add.length > 0) {
														var args 	= arguments;
														var self 	= this;
														
														var originalArguments = Array.from(arguments);
														
														addingVariants 			= true;
														originalSendWasQueued 	= true;
														
														var requestWasHandled = false;

														if (actions.remove.length > 0 && actions.remove[0].id == productData.id && actions.remove[0].quantity === productData.quantity*1) {
															// We have to remove the same product and quantity that we are adding to the cart
															// So we just change the fetch request data. 
															// Created for breakthrough-filters
															
															var arguments = args;
															
															if (typeof arguments[0] === 'string') {
																// TODO: Ask the customer if they agree with this
																// Change POST data
																var postDataForBody = getAddVariantsPostData(actions.add);

																if (url.indexOf('bundler-cart-call') !== -1 && productData.other_items.length > 1) {
																	// This is a Bundler add to cart action 
																	// Replace only the required product and leave the rest 
																	
																	postDataForBody = addOtherItemsToPostData(postDataForBody, productData.other_items, productData.id);
																}																	

																var formData = objectToFormData(postDataForBody);
																arguments[0] = formDataToSerializedString(formData);
																
																requestWasHandled = true;
																
																//oldSend.apply(self, arguments);
																
																var argsTmp = arguments;
																// Ask the customer if they agree with this
																var showConfirmationPopup = false;
																
																if (typeof actions.add[0] !== 'undefined' && typeof actions.add[0].rule_id !== 'undefined') {
				
																	for(let j = 0; j < rules.length; j++) {
																		if (rules[j].id === actions.add[0].rule_id) {
																			if (rules[j].ask_for_confirmation === 'true') {
																				// We have to show the confirmation popup before adding the item to the cart 
																				showConfirmationPopup = true;
																			}
																		}
																	}
																}
																
																shouldIShowConfirmationPopup(actions.add, productData, true, showConfirmationPopup).then((flag) => {
																	showConfirmationPopup = flag;
																
																	if (showConfirmationPopup === true) {
																		openConfirmationModal(actions.add, () => {
																			// Return a promise here to control timing
																			return new Promise((resolve, reject) => {
																				// Simulate a delay and then proceed
																				// OR: if you want to chain logic, you can resolve after doing something else
																				resolve();
																			}).then(() => {
																				oldSend.apply(self, argsTmp); // finally send it
																			});
																		}, false, () => {
																			// Add the original product to the cart
																			oldSend.apply(self, originalArguments);
																			
																		}); // <== note: 'false' since we're not returning a promise here
																	} else {
																		oldSend.apply(self, argsTmp); // send it immediately if no modal needed
																	}
																});
															}
														}

														if (requestWasHandled === false) {
														
															// Add a delay to this shop otherwise the original item wasn't added to the cart (dosedaily-co.myshopify.com)
															addVariants(actions.add, false, undefined, productData).then(x => new Promise(resolve => setTimeout(() => resolve(x), 750))).then(function(data) {
																
																oldSend.apply(self, args);
																
																if (actions.remove.length > 0) {
																	// We also have to remove products, mos tlikely the same product that is being added to the cart. 
																	// Queue this action
																	GlobalUtility.promiseQueue.add(queueKey, function() {
																		// Do stuff
																		return removeItems(actions.remove);
																	}, function() {});
																}
																
																/*
																if (actions.remove.length > 0) {
																	oldPromise.then(function(data) {
																		removeItems(actions.remove).then(function(data) {
																			// Removed items
																			// Process the queue so that we can refresh the cart
																			GlobalUtility.promiseQueue.process(queueKey);
																		});
																	});
																	
																	return oldPromise;
																} else {
																	oldPromise.then(function(data) {
																		// Process the queue so that we can refresh the cart
																		GlobalUtility.promiseQueue.process(queueKey);
																	});
																	
																	return oldPromise; 
																}
																*/
															});
														}
													} else if (actions.remove.length > 0) {
														// We can't add any variants, but we can remove some variants 
														var args = arguments;
														var self = this;
														// No need to queue the original send here, as we will run it later because we didn't set the originalSendWasQueued variable. 
														
														removeItems(actions.remove).then(function(data) {
															// Removed items
															// Process the queue so that we can refresh the cart
															GlobalUtility.promiseQueue.process(queueKey);
														});
													} else {
														
														// Check the cart again (after the product is aded to the cart, to see if any "total cart value" bot should be applied.
														GlobalUtility.promiseQueue.add(queueKey, function() {
															// Do stuff
															
															var delay = 0;
															
															return (new Promise(resolve => setTimeout(() => {
																console.log('resolving promise');
																resolve(x);
															}, delay))).then(function() {
																return checkAndApplyCartActions(false, 'add');
															});
															
															//return checkAndApplyCartActions(false, 'add');
														}, function() {});
														
														// Added on 2024-07-01
														// We generally trigger the processing of the queue when the original request gets a 200 OK response. 
														// But it seems that this doesn't happen for kidbeastore.myshopify.com store
														setTimeout(function() {
															GlobalUtility.promiseQueue.process(queueKey);
														}, 500); 
													}
												}
											}
										} catch(e) {
											console.log('Cartbot');
											console.error(e);
										}
										
										// Fallback to standard request
										// If we are making any cart action, add refresh to the queue 
										if (isCartAction([this._url])) {
											
											localCartIswaitingToBeRefreshed = true;
											GlobalUtility.promiseQueue.add(queueKey, function() {
												// Do stuff
												return refershLocalCart();
											}, function() {});
										}
									}
									
									
									if (originalSendWasQueued !== true) {
										// Call the original send
										oldSend.apply(this, arguments);
									}
								}
								
							})(XMLHttpRequest.prototype.send);
						}
					
					
										(function(w) {
						// w.fetch
						var fetchFunctionsToOverride = [
							'fetch',
							'xbcFetch'
						];
						
						for (let t = 0; t < fetchFunctionsToOverride.length; t++) {
							let fetchKey = fetchFunctionsToOverride[t];
							
							if (typeof w[fetchKey] === 'function') {
								try {
									// Override the fetch function to listen for cart refresh actions
									var oldFetch = w[fetchKey];  // must be on the global scope
									w[fetchKey] = function() {
										
										var queueKey = GlobalUtility.string.getRandomString(10);

										if (isCorrectUrlAction(arguments[0], 'clear')) {
											// Something is trying to clear the cart data. Also clear local cache
											GlobalUtility.cart.clearCartData();
										}

										//var wasChangeAction = false;
										try {
											if (isCorrectUrlAction(arguments[0], 'change')) {
												// This is a change action 
												// Queue the cart check function
												//console.log('is change action');
												
												/*
												return new Promise((resolve, reject) => {
													cancelled = true;
													reject(new Error('Temporarily reject'));
												});*/
												
												//console.log('arguments', arguments);
												//console.log('productData', getProductData(arguments, true));
												
												/*
												GlobalUtility.promiseQueue.add(queueKey, function() {
													// Do stuff
													return checkAndApplyCartActions(false, 'change');
												}, function() {});
												*/
												
												//wasChangeAction = true;
												
												
												
												
												// --------
												var productData = getProductData(arguments, true);

												if (productData !== false) {
													// Only do this if the customer actually adjusted any product in the shop. For example, don't trigger this if another script only updated some cart attributes.
													
													// Also check for standard cart actions, otherwise the bots with a price requirement won't be applied
													GlobalUtility.promiseQueue.add(queueKey, function() {												
														return checkAndApplyCartActions(false, 'change');
													}, function() {});
													
													var actions = getActions(productData, false, 'change');
													
													if (actions.add.length > 0) {
														// If we have an "add action" here, it means that the customer probably removed the item and we have to add it back again 
														// To be able to prevent them from removing the same item in the next request, add a line item property to it 
														
														
														if (actions.add.length === 1) {

															// It seems that we have to add the same product as the one we are removing. 
															// Simply don't execute this fetch request 
															if (actions.add[0].id*1 === productData.id) { // Also check selling plans?
																
																// If the shop is persillo.myshopify.com then we allow it to remove from the cart
																// If the lineItemProperty is not enable in atleast one bot that means all the logic stays the same before
																// Implementing the feature (backwards compatible)
																
																																			return new Promise((resolve, reject) => {
																			cancelled = true;
																			console.log('This item is required and can\'t be removed from the cart.');
																			reject(new Error('Can\'t remove this item from the cart.'));
																		});
																																	
																
															} else {
																var args = arguments;
																var self = this;
																addingVariants = true;
																
																/*
																return addVariants(actions.add, false).then(function(data) {
																	
																	var oldPromise = oldFetch.apply(self, args);

																	oldPromise.then(function(data) {
																		// Process the queue so that we can refresh the cart
																		GlobalUtility.promiseQueue.process(queueKey);
																	});
																	
																	return oldPromise;
																});
																*/
																
																var oldPromise = oldFetch.apply(self, args);

																oldPromise.then(function(data) {
																	addVariants(actions.add, false, undefined, productData).then(function(data) {
																		// Process the queue so that we can refresh the cart
																		GlobalUtility.promiseQueue.process(queueKey);
																		
																		if (GlobalUtility.nav.isCartPage()) {
																			// Refresh the cart page
																			GlobalUtility.nav.reload();
																		}
																	});
																});
																
																return oldPromise;
															}
														}
														
													} else if (actions.remove.length > 0) {
														// We can't add any variants, but we can remove some variants 
														var args = arguments;
														var self = this;


																												
															var oldPromise = oldFetch.apply(self, args);
															
															oldPromise.then(function(data) {
																removeItems(actions.remove).then(function(data) {
																	// Removed items
																	// Process the queue so that we can refresh the cart
																	GlobalUtility.promiseQueue.process(queueKey);
																	
																	if (GlobalUtility.nav.isCartPage()) {
																		// Refresh the cart page
																		GlobalUtility.nav.reload();
																	}
																});
															});
															
															return oldPromise;
														
																												
													} else {
														
														//GlobalUtility.promiseQueue.add(queueKey, function() {
														//	// Do stuff
														//	console.log('checking for cart actions');
														//	
														//	return checkAndApplyCartActions(false, 'change');
														//}, function() {});
													
													}
												}
												
											} else {
												// ADD TO CART ACTION 

												var productData = getProductData(arguments);

												var addingVariants = false;
												if (productData !== false) {
													
													localCartIswaitingToBeRefreshed = true;
													GlobalUtility.promiseQueue.add(queueKey, function() {
														// Do stuff
														return refershLocalCart();
													}, function() {});
													
													// We are adding a product to the cart 
													// Do your magic then return true
													var actions = getActionsAll(productData, false, 'add');

													if (actions.add.length > 0) {
														
														var originalArguments = arguments;
														
														var args = arguments;
														var self = this;
														addingVariants = true;
														
														// -------------------------
																																										
														// Check the cart again (after the product is aded to the cart, to see if any "total cart value" bot should be applied.
														// mr-floral.myshopify.com 2023-12-01
														GlobalUtility.promiseQueue.add(queueKey, function() {
															// Do stuff
															return checkAndApplyCartActions(false, 'add');
														}, function() {});
														
														// -------------------------
														
																												
														
																												//console.log('args', args);return;
														
														
														var requestWasHandled = false;
														
																												
														if (actions.remove.length > 0 && actions.remove[0].id == productData.id) {
															// We have to remove the same product that we are adding to the cart
															// So we just change the fetch request data. 
															// Created for denver-registered-agent
															
																														
																var arguments = args;
																
																
															
																if (typeof arguments[1] !== 'undefined' && typeof arguments[1].body !== 'undefined') {
																	
																	var originalBodyAsString = formDataToSerializedString(arguments[1].body);
																	
																	// Change POST data for body 
																	var postDataForBody = getAddVariantsPostData(actions.add);
																	
																	var newFormData = objectToFormData(postDataForBody);
																	
																	var keepKeys = [
																		'sections',
																		'sections_url'
																	];
																	
																	for(var u = 0; u < keepKeys.length; u++) {
																		try {
																			
																			if (typeof arguments[1].body === 'string') {
																				var formObject = GlobalUtility.nav.getQueryParams(arguments[1].body);
																				//
																				if (typeof formObject[keepKeys[u]] !== 'undefined') {
																					var origValue = formObject[keepKeys[u]];
																				} else {
																					var origValue = null;
																				}
																				
																			} else {
																				var origValue = arguments[1].body.get(keepKeys[u]);
																			}
																			
																			if (typeof origValue !== 'undefined' && origValue !== null) {
																				newFormData.append(keepKeys[u], origValue);
																			}
																			
																		} catch(e) {
																			console.log(e);
																		}
																	}
																	
																	//console.log('typeof arguments[1].body === string', typeof arguments[1].body === 'string');
																	//console.log('arguments[1].body', arguments[1].body);

																	if (typeof arguments[1].body === 'string') {
																		
																		if (isJsonString(arguments[1].body)) {
																			// Pass the arguments as JSON string, as the original query also passed it as JSON string
																			arguments[1].body = JSON.stringify(postDataForBody);
																		} else {
																			// Pass new data as string if the original was also a string
																			arguments[1].body = formDataToSerializedString(newFormData);
																		}
																	
																	} else {
																		// Pass data as form data
																		arguments[1].body = newFormData;
																		
																	}
																	
																	requestWasHandled = true;
																	
																	// Ask the customer if they agree with this
																	var showConfirmationPopup = false;
																	
																	if (typeof actions.add[0] !== 'undefined' && typeof actions.add[0].rule_id !== 'undefined') {
					
																		for(let j = 0; j < rules.length; j++) {
																			if (rules[j].id === actions.add[0].rule_id) {
																				if (rules[j].ask_for_confirmation === 'true') {
																					// We have to show the confirmation popup before adding the item to the cart 
																					showConfirmationPopup = true;
																				}
																			}
																		}
																		
																	}

																	// Override the original fetch request with new product data 
																	var argsTmp = arguments;
																	var replaceOriginalProductFetch = (oldFetch, self, argsTmp) => {
																		
																		return oldFetch.apply(self, argsTmp).then((response) => {
																			// Clone the original response to read and modify the body
																			return response.clone().json().then((data) => {
																				// Modify the JSON data
																				if (typeof data.sections !== "undefined" && typeof data.key === "undefined") {
																					if (typeof data.sections["cart-notification-product"] !== "undefined") {
																						// Regular expression to extract the desired part.
																						// We have to modify this so that the SHopify' default themes (Dawn) can show the cart notification drawer.
																						const regex = /cart-notification-product-([\d]+:[a-f0-9]+)/;
																						const match = data.sections["cart-notification-product"].match(regex);

																						if (match && match[1]) {
																							data.key = match[1]; // Add the key to the data
																						}
																					}
																				}

																				// Create a new response object with the modified data
																				return new Response(JSON.stringify(data), {
																					headers: { "Content-Type": "application/json" },
																					status: response.status,
																					statusText: response.statusText,
																				});
																			});
																		});
																	};
																	
																	return shouldIShowConfirmationPopup(actions.add, productData, true, showConfirmationPopup).then((flag) => {
																		showConfirmationPopup = flag;
																	
																		// Show confirmation modal before replacing the products.
																		if (showConfirmationPopup === true) {
																			try {
																				
																				return openConfirmationModal(actions.add, function() {
																					
																					return replaceOriginalProductFetch(oldFetch, self, argsTmp);
																					
																				}, true, function() {

																					originalArguments[1].body = serializedStringToFormData(originalBodyAsString);
																					return replaceOriginalProductFetch(oldFetch, self, originalArguments);
																					
																				}, true);
																				
																			} catch (e) {
																				console.log(e)
																			}
																		} else {
																			return replaceOriginalProductFetch(oldFetch, self, argsTmp);
																		}
																	});
																	
																																	}
																													} 

														if (requestWasHandled === false) {
															
															//var delay = 1500;
															var delay = 10;
																																																																											
																														
																														
																																													
															// Add a delay to this shop otherwise the original item wasn't added to the cart (sam-turner-sons, photographers-edge-store)
															return addVariants(actions.add, false, undefined, productData).then(x => new Promise(resolve => setTimeout(() => resolve(x), delay))).then(function(data) {

																if (actions.remove.length > 0) {
																	
																																		
																	
																	
																	var oldPromise = oldFetch.apply(self, args);
																	oldPromise.then(function(data) {
																		removeItems(actions.remove).then(function(data) {
																			// Removed items
																			// Process the queue so that we can refresh the cart
																			GlobalUtility.promiseQueue.process(queueKey);
																		});
																	});
																	
																	return oldPromise;
																} else {
																
																	var oldPromise = oldFetch.apply(self, args);

																	oldPromise.then(function(data) {
																		// Process the queue so that we can refresh the cart
																		GlobalUtility.promiseQueue.process(queueKey);
																	});
																	

																	return oldPromise; 
																}
															});
														}
													} else if (actions.remove.length > 0) {
														// We can't add any variants, but we can remove some variants 
														var args = arguments;
														var self = this;
														var oldPromise = oldFetch.apply(self, args);
														
														oldPromise.then(function(data) {

															removeItems(actions.remove).then(function(data) {
																// Removed items
																// Process the queue so that we can refresh the cart
																GlobalUtility.promiseQueue.process(queueKey);
															});
														});
														
																												
														
														return oldPromise;
													} else {

														// Check the cart again (after the product is aded to the cart, to see if any "total cart value" bot should be applied.
														GlobalUtility.promiseQueue.add(queueKey, function() {
															// Do stuff
															return checkAndApplyCartActions(false, 'add');
														}, function() {});
													}
												}
											}
										} catch(e) {
											console.log('Cartbot');
											console.error(e);
										}
										
										// Fallback to standard request
										/*
										return oldFetch.apply(this, arguments).then(function(data) {
											GlobalUtility.queue.process('change');
										});
										*/
										// If we are making any cart action, add refresh to the queue 
										if (isCartAction(arguments)) {
											localCartIswaitingToBeRefreshed = true;
											
											GlobalUtility.promiseQueue.add(queueKey, function() {
												// Do stuff
												
												return refershLocalCart();
											}, function() {});
										}
										
										var oldPromise = oldFetch.apply(this, arguments);
										oldPromise.then(function(data) {
											GlobalUtility.promiseQueue.process(queueKey);
											
											//GlobalUtility.queue.process('change'); // Might be a problem if we apply other actions before we actually refresh the cart, but this can only be done with promises. Althugh it could be done with a special queue just for promises so that they are chained properly. 
											//GlobalUtility.queue.process('refresh_cart');
										});
										
										return oldPromise;
										/*
										if (wasChangeAction) {
											return oldFetch.apply(this, arguments).then(function(data) {
												GlobalUtility.queue.process('change');
											});
										} else {
											return oldFetch.apply(this, arguments);
										}
										*/
									}
								} catch(e) {
									console.log(e);
								}
							}
						}
						
						
					})(window);
					
					
					
				}
				
				function addOtherItemsToPostData(postDataForBody, otherItems, excludedVariantId) {
					
					var allItems = [];
					allItems.push(postDataForBody);
					
					for(let k = 0; k < otherItems.length; k++) {
						if (otherItems[k].id !== excludedVariantId) {
							allItems.push(otherItems[k]);
						}
					}
					
					postDataForBody = {
						items: allItems
					};
					
					return postDataForBody;
				}
				
				function getActionsAll(productData, ignoreSessionLimit, eventType) {
					var allActions = {
						'add'	: [],
						'remove': []
					};
					
					if (typeof productData.other_items !== 'undefined' && productData.other_items.length > 1) {
                        
						var tmpActions = getActions(productData.other_items[0], ignoreSessionLimit, eventType, productData.other_items);
						
						if (typeof tmpActions.add !== 'undefined' && tmpActions.add.length > 0) {
							allActions.add = allActions.add.concat(tmpActions.add);
						}
						
						if (typeof tmpActions.remove !== 'undefined' && tmpActions.remove.length > 0) {
							allActions.remove = allActions.remove.concat(tmpActions.remove);
						}
						/*
						for (var i = 0; i < productData.other_items.length; i++) {
							var tmpActions = getActions(productData.other_items[i], ignoreSessionLimit, eventType, productData.other_items);
							
							if (typeof tmpActions.add !== 'undefined' && tmpActions.add.length > 0) {
								allActions.add = allActions.add.concat(tmpActions.add);
							}
							
							if (typeof tmpActions.remove !== 'undefined' && tmpActions.remove.length > 0) {
								allActions.remove = allActions.remove.concat(tmpActions.remove);
							}
							
						}
                        */
					} else {
						allActions = getActions(productData, ignoreSessionLimit, eventType);
					}
					
					return allActions;
				}
				
				
				function RenderTemplate(html, options) {
					var re = /{(?:%|{)(.+?(?=%|}}))?(?:%|})}/g, 
					reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, // temporarily disabled the advanced logic
					code = 'var r=[];\n',
					cursor = 0, 
					match;
					var add = function(line, js) {
						js? (code += (line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n')) :
							(code += (line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : ''));
					}
					
					while(match = re.exec(html)) {
						add(html.slice(cursor, match.index));
						if (match[0].indexOf('{{') === 0) {
							add(match[1].replace(/\s*/, ''), true);
						} else {
							add(match[1], true);
						}
						cursor = match.index + match[0].length;
					}
					add(html.substr(cursor, html.length - cursor));
					code += 'return r.join("");';

					return new Function(code.replace(/[\r\t\n]/g, ' ')).apply(options);
				}


				

                 

                
				function getActions(productData, ignoreSessionLimit, eventType, otherItems) {
					// This one checks for conditions on the fly. 
					
					if (enableDebugging) {
						console.log('---- getActions ----');
						console.trace();
					}
					
					if (typeof ignoreSessionLimit === 'undefined') {
						ignoreSessionLimit = false;
					}
					
					if (typeof otherItems === 'undefined') {
						// otherItems variable contains other items that are being added with this add to cart request
						// We have to virtually add them to the cart before we can check if we can apply any actions. 
						otherItems = [];
					}
					
					
					if (typeof window.completelyDisableCartbotApp !== 'undefined' && window.completelyDisableCartbotApp === true) {
						console.log('Cartbot app was disabled by the completelyDisableCartbotApp variable');
						
						return {
							'add'	: [],
							'remove': []
						};
					}

					// Event type defines the event which triggered this function. For example, an add to cart action, an update action or a cart load action.
					if (typeof eventType === 'undefined') {
						eventType = '';
					}

					var cart 					= JSON.parse(JSON.stringify(GlobalUtility.cart.cartData));
					var cartForRemovalofItems 	= JSON.parse(JSON.stringify(cart));

					if (enableDebugging) {
						console.log('cart in getActions', JSON.parse(JSON.stringify(cart)));
					}

					var rulesForRemoval = [];

					var quantity = 1;

					// If we are in "add" or "change" action, add the product to the cart before it actually gets added to it 
					
					if (otherItems.length <= 1) {
						otherItems = [productData];
					}
					
					if (typeof otherItems !== 'undefined' && otherItems.length > 0) {

						for (var oi = 0; otherItems.length > oi; oi++) {

							var tmpItem = otherItems[oi];
							
							if (typeof tmpItem !== 'undefined' && tmpItem !== null) {
							
								var itemAdded = false;
								
								if (cart !== null && typeof cart.items !== 'undefined' && cart.items.length > 0) {
									
									for(var x = 0; x < cart.items.length; x++) {
										
										var sellingPlan = '';
										if (typeof cart.items[x].selling_plan_allocation !== 'undefined') {
											sellingPlan = cart.items[x].selling_plan_allocation.selling_plan.id;
										}
										
										var addedProductSellingPlan = '';
										if (typeof tmpItem.selling_plan !== 'undefined') {
											addedProductSellingPlan = tmpItem.selling_plan;
										}
										
										var idMatches = false;
										if ((cart.items[x].id*1 === tmpItem.id*1 || cart.items[x].key === tmpItem.id)) {
											idMatches = true;
										}
										
										if (typeof cart.items[x].key === 'string' && cart.items[x].key.indexOf(tmpItem.id+':') === 0) {
											idMatches = true;
											
											//console.log('id matches', cart.items[x].key, tmpItem.id);
										} else {
											//console.log('id doesnt match', cart.items[x].key, tmpItem.id);
										}
										
										if (idMatches === true && (sellingPlan+'' === addedProductSellingPlan+'' || (tmpItem.quantity*1 === 0 && eventType === 'change'))) {
																						if (eventType === 'change') {
												cart.items[x].quantity = tmpItem.quantity*1;
											} else {
												cart.items[x].quantity = cart.items[x].quantity*1 + tmpItem.quantity*1;
											}
											itemAdded = true;
											
											// Stop the loop so we don't modify multiple items as we are only adjusting one item 
											x  = cart.items.length;
										}
									}
								}

								if (itemAdded === false && eventType !== 'change') {
									var item = {
										id		: tmpItem.id*1,
										quantity: tmpItem.quantity*1,
										key		: tmpItem.id*1 // Simulate key with variant id
									};
									
									if (typeof tmpItem.selling_plan !== 'undefined' && tmpItem.selling_plan !== null) {
										item.selling_plan_allocation = {
											selling_plan: {
												id: tmpItem.selling_plan
											}
										};
									}
									cart.items.push(item);
								}
								
								if (typeof tmpItem.quantity !== 'undefined') {
									quantity = tmpItem.quantity;
								}
							}
						}
					}
					
					
										
					// Calculate the total cart value 
					var totalCartValue = 0;
					if (typeof cart !== 'undefined' && cart !== null && typeof cart.items !== 'undefined' && cart.items !== null && cart.items.length > 0) {							
						for(var x = 0; x < cart.items.length; x++) {
							if (typeof cart.items[x].line_price !== 'undefined' && typeof cart.items[x].quantity !== 'undefined' && cart.items[x].quantity > 0) {
								totalCartValue += cart.items[x].line_price;
							}
						}
					}
					
					//console.log('cart', JSON.parse(JSON.stringify(cart.items)));
					
					totalCartValue = totalCartValue/100; // To get the value in dollars, not cents
					
					if (enableDebugging) {
						console.log('totalCartValue', totalCartValue);
					}
					
					var variantsToAdd 		= [];
					var variantsToRemove 	= []; // Will contain conditioned variants, which have to be removed
					
					for(var i = 0; i < rules.length; i++) {
						
						
						var rule = rules[i];
						
						var canLoop = true;
						var loopCounter = 0; // For safety so we don't make an infinite loop
						
						var maxLoop = 10000;
						
												
						while(canLoop && loopCounter < maxLoop) {
							canLoop = false; // Turn off the boolean flag and turn it back on later.
							loopCounter++;
						
							var cartSnapshot = JSON.parse(JSON.stringify(cart)); // Create a snapshot of the cart so that if the rule doesn't apply, you can return it back to the it's original value
						
							var canAddItems = true;

							var mustIncludeAllVariants 	= (rule.must_include_any_variant === 'true') 	? false : true;
							var botInReverse 			= (rule.works_in_reverse === 'true') 			? true : false;
							
							
							if (rule.condition_type === 'n_products' || rule.condition_type === 'n_products_and_cart_value') {
								// If its mix and match and cart value rule, we don't require all products to be in the cart 
								// In Mix & match type, we don't require all products to be in the cart ;) 
								mustIncludeAllVariants = false;
							}

							
							var variantsWillBeAdded = false;
							var conditionedVariants = [];
							
							var alreadyAppliedPerSession = false;

                            if (rule.ask_for_confirmation === 'true') {
                                // Check if this rule was already applied per session and don't apply it again no matter what.
								
								                            }
							
							if (rule.apply_once_per_session === 'true' && ignoreSessionLimit !== true) {
								
								// Check if this rule was already applied per session and don't apply it again no matter what.
								try {
									var appliedRules = GlobalUtility.cookie.get('applied_rules');

									if (appliedRules !== '') {
										appliedRules = JSON.parse(appliedRules);
									}
									
									if (typeof appliedRules['_'+rule.id] !== 'undefined') {
										alreadyAppliedPerSession 	= true;
										canAddItems 				= false;
									}
								} catch(e) {
									console.error('cartbot', e);
								}
							}
							
							if (rule.condition_type === 'products' || 
								rule.condition_type === 'n_products' || 
								rule.condition_type === 'cart_value_and_products' || 
								rule.condition_type === 'n_products_and_cart_value') {
								
								var reasons = [];
								
								if(rule.product_variants_contain.length > 0) {
									
									var containedItemsCount 	= 0;
									var containedItemsQuantity 	= 0;
									var totalMatchingProductQuantity = 0;
									
									for(var y = 0; y<rule.product_variants_contain.length; y++) {
										
										var requiredVariant = rule.product_variants_contain[y];
										var appliedQuantity = 0;
										
										var conditionedVariantsBackup 	= JSON.parse(JSON.stringify(conditionedVariants));
										var cartItemsBackup 			= JSON.parse(JSON.stringify(cart.items));
										

										for(var z = 0; z < cart.items.length; z++) {
											var item = cart.items[z];
											
											var sellingPlan = '';
											if (typeof item.selling_plan_allocation !== 'undefined') {
												sellingPlan = item.selling_plan_allocation.selling_plan.id+'';
											}

											if (requiredVariant.variant_id*1 === item.id*1 
												&& item.quantity > 0 
												//&& item.quantity >= requiredVariant.quantity // Removed on 2024-08-14 for 682d00-2 so that the rules work even if shopify separates item into different line items.
												&& appliedQuantity < requiredVariant.quantity
												&& (requiredVariant.selling_plan_id+'' === sellingPlan || 
													requiredVariant.selling_plan_id === 'one_time_or_any' || 
													(requiredVariant.selling_plan_id === 'any' && sellingPlan !== '')
												)
											) {
												
												
												if (rule.condition_type === 'n_products' || rule.condition_type === 'n_products_and_cart_value') {
													// We have a Mix & Match rule
													
													var remainingQuantity 	= null;
													
													if (rule.products_max_enable === 'true') {
														remainingQuantity = rule.products_max*1;
														remainingQuantity = remainingQuantity - containedItemsQuantity;
													} else {
														remainingQuantity = 99999999;
													}
													
													// Quantity that is actually in the cart and we can include in our calculations
													var allowedQuantity = item.quantity;
													
													if (allowedQuantity > remainingQuantity) {
														allowedQuantity = remainingQuantity;
													}
													
													containedItemsCount++;
													containedItemsQuantity += allowedQuantity;
													totalMatchingProductQuantity += allowedQuantity;
													// containedItemsQuantity and totalMatchingProductQuantity should be merged into one variable as they basically represent the same counter
													
													/*
													console.log('containedItemsCount', containedItemsCount);
													console.log('remainingQuantity', remainingQuantity);
													console.log('allowedQuantity', allowedQuantity);
													console.log('item.quantity', item.quantity);
													*/
													
													item.quantity = item.quantity - allowedQuantity;
													
													if (rule.condition_type === 'n_products_and_cart_value') {
														// No need to check for this at n_products condition, as we simply put as many products as we can in there (the-farmers-dog-uk)
														appliedQuantity = allowedQuantity;
													}
													
													if (enableDebugging) {
														console.log('Reducing quantity of item '+item.id+' for quantity of '+allowedQuantity+' because of '+rule.name+' rule');
													}
													
													conditionedVariants.push({
														id		: requiredVariant.variant_id,
														quantity: allowedQuantity,
														line_key: item.key
													});
													
												} else {
													// We have a classic rule 

													var maxApplicableQuantity = item.quantity;
													if (maxApplicableQuantity > requiredVariant.quantity) {
														maxApplicableQuantity = requiredVariant.quantity;
													}
													
													
													item.quantity = item.quantity - maxApplicableQuantity;
													
													appliedQuantity += maxApplicableQuantity;
													
													if (appliedQuantity === requiredVariant.quantity) {
														containedItemsCount++;
													}
													
													if (enableDebugging) {
														console.log('Reducing quantity of item '+item.id+' for quantity of '+maxApplicableQuantity+' because of '+rule.name+' rule', item.quantity);
													}
													//console.log('cart.items[z].quantity 2', cart.items[z].quantity);
													
													conditionedVariants.push({
														id		: requiredVariant.variant_id,
														quantity: requiredVariant.quantity,
														line_key: item.key
													});
												}
												
												
											} else {
												// write to log why this variant doesn't match 
												if (requiredVariant.variant_id*1 === item.id*1) {
													//reasons.push('Variant '+requiredVariant.variant_id*1+' doesnt match the item '+item.id+' in the cart');
													
													
													if (item.quantity <= 0) {
														reasons.push('Item '+item.id+' doesnt have enough quantity: '+item.quantity);
													}
													
													/*
													if (item.quantity < requiredVariant.quantity) {
														reasons.push('Item '+item.id+' has less quantity than the required quantity: '+requiredVariant.quantity);
													}*/
													
													if (appliedQuantity >= requiredVariant.quantity) {
														reasons.push('We applied more quantity already than what is required for '+requiredVariant.variant_id*1+'. Applied quantity: '+appliedQuantity);
													}
													
													if (requiredVariant.selling_plan_id+'' !== sellingPlan && 
														requiredVariant.selling_plan_id !== 'one_time_or_any' &&
														(requiredVariant.selling_plan_id === 'any' && sellingPlan !== '')) {
															
														reasons.push('Selling plan doesnt match '+requiredVariant.variant_id*1+'. Selling plan: '+sellingPlan);
													}
													
													if (enableDebugging) {
														console.log('reasons', reasons);
													}
												}
											}
											
											if (mustIncludeAllVariants === true) {
												
												//console.log('mustIncludeAllVariants -------------------------');
												//console.log('containedItemsCount', containedItemsCount);
												//console.log('rule.product_variants_contain.length', rule.product_variants_contain.length);

												if (containedItemsCount === rule.product_variants_contain.length) {
													// canAddItems = true;
													z = cart.items.length; // Stop the loop so that we leave the products to other rules.
												}
											} else {
												// Let's check if we have to stop the loop so that we leave items for other rules 
												
												if (rule.condition_type === 'n_products' || rule.condition_type === 'n_products_and_cart_value') {

													if (rule.products_max_enable === 'true' && containedItemsQuantity >= rule.products_max*1) {
														// I think we shouldn't stop the loop here. 
														
														z = cart.items.length; // Stop the loop so that we leave the products to other rules.
														
														if (enableDebugging) {
															console.log('Stopping the loop');
														}
													} else {
														// No need to stop the loop yet 
														if (enableDebugging) {
															console.log('NOT stopping the loop');
														}
													}
													
												} else {
												
													if (containedItemsCount > 0) {

														z = cart.items.length; // Stop the loop so that we leave the products to other rules.
														
														if (enableDebugging) {
															console.log('Stopping the loop');
														}
														
														if (rule.apply_once_per_cart === 'false') {
															// The rule can be applied multiple times per cart and we require customer to buy ANY product, so we will apply it per each item in the cart :) 
															// Stop the products loop and go to adding the products to the cart.
															y = rule.product_variants_contain.length;
														}
														
													} else {
														if (enableDebugging) {
															console.log('NOT stopping the loop');
														}
													}
												}
											}
										}
									}

									if (mustIncludeAllVariants === true) {

										if (containedItemsCount === rule.product_variants_contain.length) {
											canAddItems = true;
										} else {
											canAddItems = false;
										} 
										
										// If the condition type is cart_value_and_products we will send a signal
										// to proceed checking the cart value so we can apply the cartbot 
										if (rule.condition_type === 'cart_value_and_products') {
											if (canAddItems === true) {
												cvProductsItemsDoesMatch = true;
											} else {
												cvProductsItemsDoesMatch = false;
											}
										}

									} else {
										
										/*
										if (rule.condition_type === 'cart_value_and_products') {
											if (canAddItems === true) {
												cvProductsItemsDoesMatch = true;
											}
											else {
												cvProductsItemsDoesMatch = false;
											}
										}
										*/
										
										if (rule.condition_type === 'n_products' || rule.condition_type === 'n_products_and_cart_value') {
											
											//console.log('containedItemsQuantity', containedItemsQuantity);
											//console.log('rule.products_min', rule.products_min*1);
											//console.log('rule.products_max', rule.products_max*1);

											if (containedItemsQuantity >= rule.products_min*1) {
												canAddItems = true;
											} else {
												canAddItems = false;
											}
											
											//console.log('-- totalMatchingProductQuantity', totalMatchingProductQuantity);
											//console.log('-- rule.products_max*1', rule.products_max*1);
											
											if (rule.products_max_enable === 'true') {
												//remainingQuantity = rule.products_max*1;
												if (totalMatchingProductQuantity > rule.products_max*1) {
													// We have more than the allowed number of items. This bot can no longer apply.
													canAddItems = false;
												}
											}
											
										} else if (rule.condition_type === 'cart_value_and_products') {
											
											// Set the cvProductsItemsDoesMatch variable to true if the cart contains enough items so we can start checking the cart value
											if (containedItemsCount > 0) {
												//canAddItems = true;
												cvProductsItemsDoesMatch = true;
											} else {											
												//canAddItems = false;
												cvProductsItemsDoesMatch = false;
											}
											
										} else {

											if (containedItemsCount > 0) {
												canAddItems = true;
											} else {											
												canAddItems = false;
											}
											
										}
									}
								}
							} else if (rule.condition_type === 'cart_value') {
								canAddItems = false;
								
								var newTotalCartValue = totalCartValue;
								
																

								if (rule.cart_value_max_enable === 'true') {
									if (rule.cart_value_min*1 <= newTotalCartValue && rule.cart_value_max*1 >= newTotalCartValue) {
										canAddItems = true;
									}
								} else {
									if (rule.cart_value_min*1 <= newTotalCartValue) {
										canAddItems = true;
									}
								}
							}

							if (rule.condition_type === 'cart_value_and_products') {

								// This logic will start by defining two boolean variables
								// If the both of these conditions is true only then we will return
								// that canAddItems is true

								// cartValueCanAddItems that will check if the cart rule has been applied
								let cartValueCanAddItems = false;

								// productCanAddItems that will check if the product rule has been applied
								// this variable is using the value of global variable cvProductsItemsDoesMatch
								let productCanAddItems = cvProductsItemsDoesMatch;

								canAddItems = false;

								// We check if the user wants only to apply the bot when the cart value of the products reaches the value he set in the settings.
								// This means that we calculate the cartValue only for the products that are in cart and in variants_contain
								if (rule.restrict_amount_to_products_included === 'true') {

									//let cartItemsEqualToRuleContain = [];
	
									//let sameVariantIdsInBoth = [];
									
									var alreadyUsedVairantIds = {};
	
	
									totalCartValue = 0;
									// Loop throuhg cart items and get total cart value for items which are required in the bot. 
									// The alreadyUsedVairantIds variable is used to prevent using the same item twice in the total cart calculation (if it is twice in the list of required products).
									for (let j = 0; j < rule.product_variants_contain.length; j++) {
										for (let i = 0; i < cart.items.length; i++) {
											
											if (typeof alreadyUsedVairantIds[cart.items[i].variant_id+'_'+i] === 'undefined') {
												
												if (cart.items[i].variant_id+'' == rule.product_variants_contain[j].variant_id+'') {
													//sameVariantIdsInBoth.push(cart.items[i].variant_id);
													
													totalCartValue 	+= cart.items[i].line_price;
													alreadyUsedVairantIds[cart.items[i].variant_id+'_'+i] = true;
												}
											}
											
										}
									}
									
									/*
									// This loop needs to check for every id inside the sameVariantIdsInBoth
									// And compare them, so we can filter cart items and extract cart value only in these products
									// We could put this total cart value calculation in the for loop above, but this could cause an issue if somehow the same variant is twice in the required list of products.
									totalCartValue = 0;
									sameVariantIdsInBoth.forEach(id => {
										for (let i = 0; i < cart.items.length; i++) {
											if (id === cart.items[i].variant_id) {
												totalCartValue += cart.items[i].line_price;
											}
										}
									})
									*/

									totalCartValue = totalCartValue/100;

								}

								if (rule.cart_value_max_enable === 'true') {
									if (rule.cart_value_min*1 <= totalCartValue && rule.cart_value_max*1 >= totalCartValue) {
										cartValueCanAddItems = true;
									}
								} else {
									if (rule.cart_value_min*1 <= totalCartValue) {
										cartValueCanAddItems = true;
									}
								}

								// We will check if the cart value is over the requested,
								// If it is we will continue to check our second condition
								// If it is not we will instantly return false for canAddItems (global variable for adding)
								if (cartValueCanAddItems === true && productCanAddItems === true) {
									canAddItems = true;
								} else {
									canAddItems = false;
								}
							}
							
							if (rule.condition_type === 'n_products_and_cart_value') {


								// cartValueSufficient is varaible that will check cart value
								// on true: cart value is in range, on false: cart value is not in range 
								let cartValueSufficient = false;

								// Final variable that decides if the bot is applies or not
								canAddItems = false;

								if (rule.cart_value_max_enable === 'true') {
									if (totalCartValue >= rule.cart_value_min*1 && totalCartValue <= rule.cart_value_max*1) {
										cartValueSufficient = true;
									} else {
										cartValueSufficient = false;
									}
								} else {
									if (totalCartValue >= rule.cart_value_min*1) {
										cartValueSufficient = true;
									}
								}
								

								// Check mix and match
								// Check if we have suficient quantity of products in the cart
								if (cartValueSufficient === true) {
									
									if (containedItemsQuantity >= rule.products_min*1) {
										canAddItems = true;
									} else {
										canAddItems = false;
									}
								} 
							}
							
							if (alreadyAppliedPerSession === false) {
								// At this point, the function above took out the required items and now, 
								// if all conditions are satisfied, we should just skip adding the products to the cart
								// as the bot was already applied.
								// eatpluck.myshopify.com
							}
							
							if (enableDebugging) {
								console.log('canAddItems', canAddItems);
							}

							if (canAddItems) {
								if (rule.apply_only_on_add_to_cart === 'true' && eventType !== 'add') {
									// Skip this loop because the bot can only be applied on add to cart actions, but the action is clearly not add to cart.
									canLoop = false;
									continue;
								}

								if (rule.product_variants_add.length > 0) {
									
									for(var y = 0; y < rule.product_variants_add.length; y++) {
										var addVariant = rule.product_variants_add[y];
										
										var missingQuantity = addVariant.quantity;
										
										var isAlreadyInCart = false; // This function won't add the same product again even if it could be added because multiple rules could be applied here 
																	 // We should give the an option to choose if they want to apply the rule multiple times or just once. 
																	 
										if (eventType !== 'add' || rule.apply_once_per_cart === 'true' || rule.remove_the_initial_variants === 'false') {
											// Only check this if we aren't in an add to cart action. 
											// Don't check existing items if we are in add to cart action, as in that case, we just have to add all required items to the cart, right?
											
											for(var z = 0; z < cart.items.length; z++) {
												var item = cart.items[z];
												
												var sellingPlan = '';
												if (typeof item.selling_plan_allocation !== 'undefined') {
													sellingPlan =  item.selling_plan_allocation.selling_plan.id;
												}
												
												if (addVariant.variant_id*1 === item.id*1 
													&& item.quantity > 0
													&& sellingPlan+'' === addVariant.selling_plan_id+'') {
														
													var canContinue = true;
													
                                                    if (rule.add_products_even_if_already_in_the_cart === 'true') {
                                                        canContinue = false; 
                                                        if (typeof item.properties !== 'undefined' && typeof item.properties['_added_by_cartbot'] !== 'undefined') {
                                                            canContinue = true;
                                                        }
                                                    }
													
													if (canContinue === true) {
													
														
														var maxPossibleSubtractableQuantity = item.quantity;
														if (maxPossibleSubtractableQuantity > addVariant.quantity) {
															maxPossibleSubtractableQuantity = addVariant.quantity;
														}
														
														if (missingQuantity < maxPossibleSubtractableQuantity) {
															maxPossibleSubtractableQuantity = missingQuantity;
														}
														
														if (rule.remove_the_initial_variants === 'true' && rule.apply_once_per_cart === 'false') {
															// We have to replace the original product, so ignore the actual quantity that is in the cart 
															//missingQuantity = missingQuantity;
															
														} else {
															
															missingQuantity = missingQuantity - maxPossibleSubtractableQuantity;
															if (missingQuantity < 0) {
																missingQuantity = 0;
															}
														}
															
														isAlreadyInCart = true;
														item.quantity 	= item.quantity - maxPossibleSubtractableQuantity;
														//z 				= cart.items.length; // Don't stop the loop here, otherwise we can have an infinite loop if the customer has same item with different line item properties.
														
														if (enableDebugging) {
															console.log('Subtracting quantity of item '+item.id+' for quantity of '+maxPossibleSubtractableQuantity+' because of '+rule.name+' rule');
															console.log('New quantity ' + item.quantity);
														}
														
														if (rule.apply_once_per_cart === 'true' && item.quantity > 0 && botInReverse && rule.condition_type !== 'cart_value') {
															// This rule can be applied only once per cart and this item is already in the cart. 
															// then set this rule for the removal, after we already subtracted set quantity from the cart so that we will be left with the correct number of items in the cart.
															// Stop the loop for this rule/bot.
															// math-scientific-se shop
															var ruleForRemoval = JSON.parse(JSON.stringify(rule));
															rulesForRemoval.push(ruleForRemoval);
															canLoop = false; // And stop the loop (this variable should be already set by other method, but is set to false again here just in case).
														}
														
														/*
														if (rule.apply_once_per_cart === 'true' && item.quantity > 0 && botInReverse && rule.condition_type !== 'cart_value') {
															// If rule can only be applied once per cart AND remaining item quantity is greater than 0 AND the bot is set to work in reverse AND we have a product condition (not cart value condition), 
															// then continue looping, as we clearly have too much of the allowed item in the cart and we have to remove it from the cart. 
															canLoop = true;
														}*/
														
														if (rule.apply_once_per_cart === 'true' && item.quantity > 0 && botInReverse && rule.condition_type === 'cart_value') {
															// If bot is set to be applied only once per cart AND the remaining item quantity is too high && and the bot is set to work in reverse AND we have a cart condition set up
															// then set this rule for the removal, after we already subtracted set quantity from the cart so that we will be left with the correct number of items in the cart.
															// putsimply shop
															var ruleForRemoval = JSON.parse(JSON.stringify(rule));
															rulesForRemoval.push(ruleForRemoval);
															canLoop = false; // And stop the loop (this variable should be already set by other method, but is set to false again here just in case).
														}
													}
												}
											}
										}


										if (isAlreadyInCart === false || (isAlreadyInCart === true && missingQuantity > 0)) {

											if (alreadyAppliedPerSession === false) {
												// At this point, the function above took out the required items and now, 
												// if all conditions are satisfied, we should just skip adding the products to the cart
												// as the bot was already applied.
												// eatpluck.myshopify.com
												
												variantsToAdd.push({
													id				: addVariant.variant_id,
													quantity		: missingQuantity,
													selling_plan	: addVariant.selling_plan_id,
													rule_id			: rule.id,
													product_id		: addVariant.product_id
												});
												
												// Moved this into this if block otherwise the app removed an item and didn't add any other item because the customer rejected it through the popup. 
												// And this only happened if the bot was set to "replace" the products
												variantsWillBeAdded = true;
											}
											
											if (enableDebugging) {
												console.log('Adding variant '+addVariant.variant_id+' to the cart with quantity of '+missingQuantity+' because of '+rule.name+' rule.');
												console.log('variantsToAdd', JSON.parse(JSON.stringify(variantsToAdd)), variantsToAdd);
											}
									
											if (rule.apply_once_per_cart === 'false' && rule.condition_type !== 'cart_value') {
												// This rule can be applied more than just once. This is useful when the quantity is greater than 1 (heritageco-store.myshopify.com).
												canLoop = true;
											}
											
										} else {
											
											if (rule.apply_once_per_cart === 'false' && rule.condition_type !== 'cart_value') {
												// This rule can be applied more than just once 
												canLoop = true;
											}
											
											if (conditionedVariants.length > 0 && rule.remove_the_initial_variants === 'true' && rule.apply_once_per_cart === 'false') {
												// This rule can be applied just once and we already have the items in the cart 
												// So it could be that we have to remove some items. 
												// Set the variantsWillBeAdded to true, so that we will remove the excessive variants from the cart 
												// everythingchilliuk
												variantsWillBeAdded = true;
											}
										}
									}
									
									if (rule.apply_once_per_session === 'true' && variantsWillBeAdded === true && ignoreSessionLimit !== true) {
										// Save this rule to session so that we don't apply it again 										
										try {
											var appliedRules = GlobalUtility.cookie.get('applied_rules');

											if (appliedRules !== '') {
												appliedRules = JSON.parse(appliedRules);
											} else {
												appliedRules = {};
											}
											
											appliedRules['_'+rule.id] = rule.id;
										
											GlobalUtility.cookie.set('applied_rules', JSON.stringify(appliedRules), 0);
										} catch(e) {
											
										}
									}
								}
							} else {
								// I am fairly sure what we should return the reduced quantity back to the cart here. And this is what we are doing here.
								cart = JSON.parse(JSON.stringify(cartSnapshot));
								//console.log('reverting the cart back to its snapshot');
								
								// Can't add items, which means that if bot works in reverse, the added item also shouldn't be there
								if (botInReverse) {
									if (enableDebugging) {
										console.log('Adding rule in for removal', JSON.parse(JSON.stringify(rule)), JSON.parse(JSON.stringify(cartSnapshot)));
									}
									
									rulesForRemoval.push(JSON.parse(JSON.stringify(rule)));
								}
							}
							
							if (variantsWillBeAdded === false) {
								//console.log('reverting the cart back to its snapshot 2');
								// Reset the cart back to it's snapshot because this rule won't do anything. This is causing an issue with infinite redirect at comiso-coffee.myshopify.com, but we have to figure out where exactly do we need this
								// We actually shouldn't revert this back if even if this bot doesn't do anything because all items are already there, so that we don't go into an infinite loop.
								//cart = JSON.parse(JSON.stringify(cartSnapshot));
							}
							
							//console.log('variantsWillBeAdded', variantsWillBeAdded, rule);
							
							if (rule.remove_the_initial_variants === 'true' && variantsWillBeAdded === true) {
								// The conditioned products should be removed, so add it to the "variantsToRemove" array here 
								variantsToRemove = variantsToRemove.concat(JSON.parse(JSON.stringify(conditionedVariants)));
							}
							
							conditionedVariants = [];
						}
					}
					
					if (enableDebugging) {
						console.log('rulesForRemoval', JSON.parse(JSON.stringify(rulesForRemoval)));
					}

					if (rulesForRemoval.length > 0) {
						// Check all reverse rules for removal, but after all cart bots were processed so that we don't go into infinite loop 
						for(var j = 0; j<rulesForRemoval.length; j++) {
							var rule = rulesForRemoval[j];
							
							var reverseVariants = [];

							//var tmpCart = JSON.parse(JSON.stringify(GlobalUtility.cart.cartData)); // Get the cart again, without the reduced quantities
							var tmpCart = cart; // We have to take the cart with the already reduced quantites, otherwise we will remove and add items if we have two very similar bots. 

							for(var y = 0; y < rule.product_variants_add.length; y++) {
								var addVariant = rule.product_variants_add[y];

								for(var z = 0; z < tmpCart.items.length; z++) {
									var item = tmpCart.items[z];
									
									var sellingPlan = '';
									if (typeof item.selling_plan_allocation !== 'undefined') {
										sellingPlan = item.selling_plan_allocation.selling_plan.id+'';
									}
									
									if (addVariant.variant_id*1 === item.id*1 && item.quantity > 0 && addVariant.selling_plan_id+'' === sellingPlan) {
										z = tmpCart.items.length;
										/*
										var newQuantity = item.quantity*1 - addVariant.quantity*1;
										if (newQuantity < 0) {
											newQuantity = 0;
										}*/
										
										var removableQuantity = addVariant.quantity*1;
										
										if (rule.condition_type === 'cart_value' && item.quantity > addVariant.quantity*1) {
											// If the rule confition is set ot cart value, then remove all that is left of this item in the cart.
											removableQuantity = item.quantity;
										}
										
										/*
										if (rule.apply_once_per_cart === 'true') {
											// This item should be in the cart only once. As we already reduced the quantity of this item in the cart for each required product 
											// We only have the quantity left, which should be removed from the cart. So we just set the removableQuantity variable to the quantity of the item in the cart.
											removableQuantity = item.quantity;
										}*/
										
										if (rule.works_in_reverse === 'true') {
											// The quantity that was left of this item should be removed, as the bot works in reverse and we have already subtracted it for all fulfilled conditions 
											// math-scientific-se shop
											removableQuantity = item.quantity;
										}
										
										reverseVariants.push({
											id		: addVariant.variant_id,
											quantity: removableQuantity*1, // The function which removes items will update to the correct value. This is actually "removable quantity."
											line_key: item.key
										});
										
										item.quantity -= removableQuantity*1; // Reduce the quantity of this item so that other rules won't further reduce it 
										
										if (enableDebugging) {
											console.log('Removing variant '+addVariant.variant_id+' for quantity of '+removableQuantity+' because of '+rule.name+' rule');
											console.log('Current quantity '+item.quantity+'. Item id '+item.id);
											console.log(JSON.parse(JSON.stringify(tmpCart)));
										}
									}
								}
							}
							
							variantsToRemove = variantsToRemove.concat(JSON.parse(JSON.stringify(reverseVariants)));
						}
					}
					
					if (enableDebugging) {
                        //console.trace();
						console.log({
							'add'	: JSON.parse(JSON.stringify(variantsToAdd)),
							'remove': JSON.parse(JSON.stringify(variantsToRemove))
						});
					}
					
					return {
						'add'	: variantsToAdd,
						'remove': variantsToRemove
					};
				}
				
				function updateCart() {
					
										
										
										
											if (typeof window.SLIDECART_UPDATE === 'function') {
							try {
								window.SLIDECART_UPDATE();
							} catch(e) {}
						}
					
					if (typeof window.theme !== 'undefined' && typeof window.theme.ajaxCart !== 'undefined' && typeof window.theme.ajaxCart.update === 'function') {
						try {
							window.theme.ajaxCart.update();
						} catch(e) {}
					}
					
					if (typeof window.icartCartActivityEvent === 'function') {
						try {
							window.icartCartActivityEvent();
						} catch(e) {}
					}
					
					
										
						try {
							document.dispatchEvent(new CustomEvent('cart:refresh', {
								detail: {
									open:true
								}
							}));
						} catch(e) {}
					
					
						try {
							document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
								bubbles: true,
								detail: {
									open:true
								}
							}));
						} catch(e) {}
										
					try {
						document.dispatchEvent(new CustomEvent('product:added', {
							detail:{quantity:1},
                            bubbles: true
                        }));
					} catch(e) {}
					
					if (typeof window.HsCartDrawer !== 'undefined' && typeof window.HsCartDrawer.updateSlideCart === 'function') {
						// You could also use the window.HS_SLIDE_CART_UPDATE() method
						globalDebounce('hscartdrawer', function() {
							try {
								// tesbros
								HsCartDrawer.updateSlideCart();
							} catch(e) {
								console.log(e);
							}
						}, 100);
					}
					if (typeof window.Hs_CartDrawer !== 'undefined' && typeof window.Hs_CartDrawer.updateSlideCart === 'function') {
						// You could also use the window.HS_SLIDE_CART_UPDATE() method
						globalDebounce('hscartdrawer', function() {
							try {
								Hs_CartDrawer.updateSlideCart();
							} catch(e) {
								console.log(e);
							}
						}, 100);
					}
					
					if (typeof window.HS_SLIDE_CART_OPEN !== 'undefined' && typeof window.HS_SLIDE_CART_OPEN === 'function') {
						globalDebounce('hscartdraweropen', function() {
							try {
								// adultluxe
								window.HS_SLIDE_CART_OPEN()
							} catch(e) {
								bundlerConsole.log(e);
							}
						}, 100);
					}
					
					if (typeof theme !== 'undefined' && typeof theme.Cart !== 'undefined' && typeof theme.Cart.updateCart === 'function') {
						try {
							theme.Cart.updateCart();
						} catch(e) {}
					}
					
					if (typeof window.updateMiniCartContents === 'function') {
						try {
							window.updateMiniCartContents();
						} catch(e) {}
					}
					
					if (typeof window.loadEgCartDrawer === 'function') {
						try {
							window.loadEgCartDrawer();
						} catch(e) {}
					}

					try {
						document.dispatchEvent(new CustomEvent('cart:build'));
					} catch(e) {}
	
					try {
						document.dispatchEvent(
							new CustomEvent('obsidian:upsell:refresh')
						);
						document.dispatchEvent(
							new CustomEvent('obsidian:upsell:open')
						);
					} catch(e) {}
					
					var siteCart = document.getElementById('site-cart');
					if (siteCart !== null) {
						try {
							siteCart.show();
						} catch(e) {}
					}
					
					if (typeof CartJS !== 'undefined' && typeof CartJS.getCart === 'function') {
						try {
							// Avone theme
							CartJS.getCart();
						} catch(e) {
							console.log(e);
						}
					}
					
											if (typeof window.SLIDECART_UPDATE !== 'undefined') {
							try {
								// #slidecarthq
								window.SLIDECART_UPDATE();
							} catch(e) {
								bundlerConsole.log(e);
							}
						}
						if (typeof window.SLIDECART_OPEN !== 'undefined') {
							setTimeout(function() {
								try {
									// meina-naturkosmetik-de
									// #slidecarthq
									window.SLIDECART_OPEN();
								} catch(e) {
									bundlerConsole.log(e);
								}
							}, 500);
						}
										
					if (typeof Shopify !== 'undefined' && typeof Shopify.theme !== 'undefined' && typeof Shopify.theme.jsAjaxCart !== 'undefined' && typeof Shopify.theme.jsAjaxCart.updateView === 'function') {
						try {
							Shopify.theme.jsAjaxCart.updateView();
						} catch(e) {}
					}
					if (typeof Shopify !== 'undefined' && typeof Shopify.theme !== 'undefined' && typeof Shopify.theme.ajaxCart !== 'undefined' && typeof Shopify.theme.ajaxCart.updateView === 'function') {
						try {
							
							GlobalUtility.cart.get(false).then(function(data) {
								data.clone().json().then(function(cart) {
									Shopify.theme.ajaxCart.updateView({cart_url: window.location.origin+'/cart'}, cart);
								});
							});
							
						} catch(e) {}
					}
					if (typeof window.theme !== 'undefined' && typeof window.theme.MiniCart !== 'undefined' && typeof window.theme.MiniCart.update === 'function') {
						try {
							theme.MiniCart.update();
						} catch(e) {}
					}
					
					if (typeof window.ajaxCart !== 'undefined' && typeof window.ajaxCart.load === 'function') {
						try {
							window.ajaxCart.load();
						} catch(e) {}
					}
					
					if (typeof window.cart !== 'undefined' && typeof window.cart.getCart === 'function') {
						try {
							window.cart.getCart();
						} catch(e) {}
					}
					
					if (typeof window.geckoShopify !== 'undefined' && typeof window.geckoShopify.onCartUpdate === 'function') {
						try {
							window.geckoShopify.onCartUpdate(1, 1, 19041994);
						} catch(e) {}
					}

					if (typeof window.Shopify !== 'undefined' && typeof window.Shopify.KT_onItemAdded === 'function') {
						try {
							 window.Shopify.KT_onItemAdded();
						} catch(e) {}
					}
					
					
					// rothys-us-staging.myshopify.com
					if (typeof window.flatRefreshCartCallback === 'function') {
						try {
							window.flatRefreshCartCallback();
						} catch(e) {}
					}
					
					// discstore-2023.myshopify.com
					try {
						var tmpCart = document.querySelectorAll('html')[0]._x_dataStack[0]; 
						tmpCart.updateCart(true);
					} catch(e) {}
					
					
					try {
						document.dispatchEvent(new CustomEvent('product:added', { detail: { quantity: 0 } }));
					} catch(e) {}
					
					
					try {
						if (typeof window.Alpine !== 'undefined') {
							window.Alpine.store('main').fetchCart();
						}
					} catch(e) {}
					
					try {
						if (typeof window.Alpine !== 'undefined') {
							Alpine.store('xMiniCart').reLoad();
						}
					} catch(e) {}
					
					try {
						
						if (typeof window.Hs_CartDrawer !== 'undefined' && typeof window.Hs_CartDrawer.updateSlideCart === 'function') {
							window.Hs_CartDrawer.updateSlideCart();
						}
					} catch(e) {}
					
					try {
						
						if (typeof window.updateCartDrawer === 'function') {
							window.updateCartDrawer();
						}
					} catch(e) {}
					
					
					try {
						
						if (typeof window.PXUTheme !== 'undefined' && typeof window.PXUTheme.jsAjaxCart !== 'undefined' && typeof window.PXUTheme.jsAjaxCart.updateView === 'function') {
							window.PXUTheme.jsAjaxCart.updateView();
						}
					} catch(e) {}
					
					try {
						
						if (typeof window.theme !== 'undefined' && typeof window.theme.miniCart !== 'undefined' && typeof window.theme.miniCart.updateElements === 'function') {
							window.theme.miniCart.updateElements();
						}
					} catch(e) {}
					
					try {
						
						if (typeof window.liquidAjaxCart !== 'undefined' && typeof window.liquidAjaxCart.update === 'function') {
							window.liquidAjaxCart.update();
						}
					} catch(e) {}
					try {
						
						if (typeof window.theme !== 'undefined' && typeof window.theme.miniCart !== 'undefined' && typeof window.theme.miniCart.generateCart === 'function') {
							window.theme.miniCart.generateCart();
						}
					} catch(e) {}
					
					
					try {
						var tmpCart = document.querySelector('#ajax-cart');
						if (tmpCart !== null && typeof tmpCart.getCartData === 'function') {
							tmpCart.getCartData();
						}
						
						
					} catch(e) {}
					
					try {

						if (typeof HELPER_UTIL !== 'undefined' && typeof _EVENT_HELPER !== 'undefined') {

							HELPER_UTIL.dispatchCustomEvent(
								_EVENT_HELPER.updateAndShowCart
							);
						}
					} catch(e) {}
					
					try {
						window.dispatchEvent(new Event('cart:updated'));
					} catch(e) {}
					
											try {

							if (typeof window.opusRefreshCart === 'function') {
								window?.opusRefreshCart(); // (3c3c49-c5)
							}
							if (typeof window.opusOpen === 'function') {
								window?.opusOpen(); // (goodsafer)
							}
							
						} catch(e) {}
										
					
					setTimeout(function() {
						try {
							
														
								document.documentElement.dispatchEvent(
									new CustomEvent('cart:refresh', {
										bubbles: true,
										detail: {
											open: true
										}
									})
								);
							
													} catch(e) {
							console.log(e);
						}
					}, 2000);
					
											if (typeof window.cart !== 'undefined' && typeof window.cart.getCart === 'function') {
							setTimeout(function() {
								try {
									window.cart.getCart();
								} catch(e) {
									console.log(e);
								}
							}, 1000);
							
							setTimeout(function() {
								try {
									window.cart.getCart();
								} catch(e) {
									console.log(e);
								}
							}, 2000);
							
							setTimeout(function() {
								try {
									window.cart.getCart();
								} catch(e) {
									console.log(e);
								}
							}, 5000);
							
							setTimeout(function() {
								try {
									window.cart.getCart();
								} catch(e) {
									console.log(e);
								}
							}, 10000);
						}
										
					
										
					
					try {
						GlobalUtility.cart.get(false).then(function(data) {
							data.clone().json().then(function(cart) {
								
								// document.addEventListener('theme:cart:reload',
								document.dispatchEvent(new CustomEvent('theme:cart:reload'));
								
								/*
								document.dispatchEvent(new CustomEvent('theme:cart:change', {
									detail: {
										cart: cart
									},
									bubbles: true
								}))
								
								*/
								var cartBubble = document.querySelector('#cart-icon-bubble .cart-count-bubble span[aria-hidden="true"]');
								if (cartBubble !== null) {
									cartBubble.innerHTML = cart.item_count;
								}
								
								var cartNotificationButton = document.querySelector('#cart-notification-button');
								if (cartNotificationButton !== null) {
									cartNotificationButton.innerHTML = cartNotificationButton.innerHTML.replace(/\d+/, cart.item_count);
								}
								
								var cartCounter = document.querySelector('.cart-link__count');
								if (cartCounter !== null) {
									if (cart.item_count > 0) {
										cartCounter.innerHTML = cart.item_count;
									} else {
										cartCounter.innerHTML = '';
									}
								}

								if (typeof cart.items !== 'undefined' && cart.items.length === 0) {
									var cartDrawer = document.querySelector('cart-drawer.drawer');
									if (cartDrawer !== null) {
										// Add is-empty class to the cart drawer container
										cartDrawer.classList.add('is-empty');
									}
								}
								
								if (typeof window.halo !== 'undefined' && typeof window.halo.updateSidebarCart !== 'undefined') {
									window.halo.updateSidebarCart(cart);
								}
								
																
																
																
								
								try {
									if (typeof window.theme !== 'undefined' && typeof window.theme.cart !== 'undefined' && typeof window.theme.cart.store !== 'undefined' && typeof window.theme.cart.store.getState === 'function') {
										var cartState = window.theme.cart.store.getState();
										
										if (typeof cartState.updateNote === 'function') {
											// Update note to the same value as this triggers a cart drawer update XD
											cartState.updateNote(cart.note);
										}
									}
								} catch(e) {
									console.log(e);
								}
								// window.theme.cart.store.getState().updateNote('asdad');
							});
						});
					} catch(e) {
						console.error(e);
					}
					
					try {
						GlobalUtility.cart.get(false).then(function(data) {
							data.clone().json().then(function(cart) {
								// Update cart counter
								if (typeof cart.item_count !== 'undefined') {
									var itemCount = cart.item_count;
									var el = document.querySelector('cart-count');
									
									if (el !== null) {
										el.innerHTML = itemCount;
									}
									
									var satcbCountEl = document.querySelector('.satcb-cs-header-title .satcb-cs-header-count');
									if (satcbCountEl !== null) {
										satcbCountEl.innerHTML = itemCount;
									}
									
									var cartCount = document.querySelector('#CartCount [data-cart-count]');
									if (cartCount !== null) {
										cartCount.innerHTML = itemCount;
									}
								}
								
								if (typeof window !== 'undefined' && typeof window.wetheme !== 'undefined' && typeof window.wetheme.updateCartDrawer !== 'undefined') {
									window.wetheme.updateCartDrawer(cart);
								}
								
								
							});
						});
					} catch(e) {}
					
					try {

													// Update cart in Dawn theme (queer-ivy-art)
							var cartEl = document.querySelector('cart-notification') ||  document.querySelector('cart-drawer mini-cart') || document.querySelector('cart-drawer') || document.querySelector('product-form.product-form') || document.querySelector('#mini-cart') || document.querySelector('sht-cart-drwr-frm');

							if (cartEl !== null && typeof cartEl.renderContents === 'function') {
								
								var sectionsToRender = 'cart-drawer,cart-icon-bubble';
								if (typeof cartEl.getSectionsToRender === 'function') {
									//var actualSectionsToRender = cartEl.getSectionsToRender().map((section) => section.section);
									
									var actualSectionsToRender = [];
									
									var sectionsToRender = cartEl.getSectionsToRender();
									for (var k in sectionsToRender) {
										if (sectionsToRender.hasOwnProperty(k)) {
											if (typeof sectionsToRender[k].section === 'string') {
												actualSectionsToRender.push(sectionsToRender[k].section);
											} else if (typeof sectionsToRender[k].id === 'string') {
												actualSectionsToRender.push(sectionsToRender[k].id);
											}
										}
									}
									
									if (actualSectionsToRender.length > 0) {
										sectionsToRender = actualSectionsToRender.join(',');
									}
								}
								
								var promise = fetch(GlobalUtility.nav.getRootUrl() + 'cart?sections='+sectionsToRender, {
									method: 'GET',
									cache: 'no-cache',
									credentials: 'same-origin',
									headers: {
										'Content-Type': 'application/json'
									}
								}).then(function(data) {
									
									try {
										return data.clone().json().then(function(p) {

											try {
												var newData = {
													sections: p
												};
												
												cartEl.renderContents(newData);
											} catch(e) {
												//console.error(e);
											}
											
										});
									} catch(e) {
										//console.error(e);
									}
								});
								
							}
											} catch(e) {
						console.error(e);
					}
					
					try {
						// Update cart in Dawn theme (queer-ivy-art)
						var cartEl2 = document.querySelector('loess-cart-items') || document.querySelector('loess-cart-drawer-items');

						if (cartEl2 !== null && typeof cartEl2.renderCartItems === 'function') {
	
							var sectionsToRender = 'cart-drawer,cart-icon-bubble';
							if (typeof cartEl2.getSectionsToRender === 'function') {
								//var actualSectionsToRender = cartEl2.getSectionsToRender().map((section) => section.section);
								
								var actualSectionsToRender = [];
								
								var sectionsToRender = cartEl2.getSectionsToRender();
								for (var k in sectionsToRender) {
									if (sectionsToRender.hasOwnProperty(k)) {
										if (typeof sectionsToRender[k].section === 'string') {
											actualSectionsToRender.push(sectionsToRender[k].section);
										} else if (typeof sectionsToRender[k].id === 'string') {
											actualSectionsToRender.push(sectionsToRender[k].id);
										}
									}
								}
								
								if (actualSectionsToRender.length > 0) {
									sectionsToRender = actualSectionsToRender.join(',');
								}
							}
							
							var promise = fetch(GlobalUtility.nav.getRootUrl() + 'cart?sections='+sectionsToRender, {
								method: 'GET',
								cache: 'no-cache',
								credentials: 'same-origin',
								headers: {
									'Content-Type': 'application/json'
								}
							}).then(function(data) {
								
								try {
									return data.clone().json().then(function(p) {

										// Also retrieve the cart because this method also needs the full cart data
										GlobalUtility.cart.get(true).then(function(data) {
											data.clone().json().then(function(cart) {
												cart.sections = p;												
												cartEl2.renderCartItems(cart);
											});
										});
										
									});
								} catch(e) {
									console.error(e);
								}
							});
							
						}
					} catch(e) {
						console.error(e);
					}
					
					
					try {
						
						var miniCartOuterbox = document.querySelector('.minicart__outerbox');
						if (miniCartOuterbox !== null && typeof window.cartContentUpdate === 'function') {
							sectionsToRender = miniCartOuterbox.dataset.section;
							var promise = fetch(GlobalUtility.nav.getRootUrl() + 'cart?sections='+sectionsToRender, {
								method: 'GET',
								cache: 'no-cache',
								credentials: 'same-origin',
								headers: {
									'Content-Type': 'application/json'
								}
							}).then(function(data) {
								
								try {
									return data.clone().json().then(function(p) {

										// Also retrieve the cart because this method also needs the full cart data
										GlobalUtility.cart.get(true).then(function(data) {
											data.clone().json().then(function(cart) {
												cart.sections = p;												
												window.cartContentUpdate(cart, miniCartOuterbox, sectionsToRender);
											});
										});
										
									});
								} catch(e) {
									console.error(e);
								}
							});
						}
						
					} catch(e) {
						console.error(e);
					}
					
					
					
										
					try {
						// buck-your-bronco
						setTimeout(() => {
							
							document.dispatchEvent(new CustomEvent('dispatch:cart-drawer:refresh'));
						}, 500);
					} catch(e) {}
					
					try {
						/*
						if (document.querySelectorAll('form.cart-drawer').length > 0) {
							console.log('triggering update');
							// Trigger update of cart drawer in Narrative theme
							// Simulate edit on the template or actual input of one of the products in the cart
							document.querySelector('.cart-drawer input').blur();
							setTimeout(function(){ 
								//$('.cart-drawer input').first().trigger('input');
								document.querySelector('.cart-drawer input').dispatchEvent(new Event('input'));
							}, 350);
						}*/
						
						if (window.$ === 'function' && window.$('form.cart-drawer').length > 0) {
							// Trigger update of cart drawer in Narrative theme
							// Simulate edit on the template or actual input of one of the products in the cart
							window.$('.cart-drawer input').first().trigger('blur');
							setTimeout(function(){ 
								window.$('.cart-drawer input').first().trigger('input');
							}, 350);
						}
					} catch(e) {
						console.log(e);
					}
					
					
					try {
						// forlaget-mammut
						window.dispatchEvent(new Event('update_cart'));
					} catch(e) {}
					
					
					try {
						// cannanda
						document.dispatchEvent(new Event('theme:cartchanged'));
					} catch(e) {}
					
					try {
						if (typeof window.theme !== 'undefined' && typeof window.theme.cart !== 'undefined' && typeof window.theme.cart._updateCart === 'function') {
							window.theme.cart._updateCart();
						}
					} catch(e) {}
					
					try {
						if (typeof window.AMG !== 'undefined' && typeof window.AMG.sidecart !== 'undefined' && typeof window.AMG.sidecart.refresh === 'function') {
							window.AMG.sidecart.refresh();
						}
					} catch(e) {}
					
					if (typeof window.ajaxCart !== 'undefined' && typeof window.ajaxCart.load === 'function') {
						try {
							ajaxCart.load();
						} catch(e) {}
					}
					
					if (typeof window.Shopify !== 'undefined' && typeof window.Shopify.onItemAdded === 'function') {
						try {
							window.Shopify.onItemAdded();
						} catch(e) {
							
						}
					}

					if (typeof window.Rebuy !== 'undefined' && typeof window.Rebuy.Cart !== 'undefined' && typeof window.Rebuy.Cart.fetchShopifyCart === 'function' ) {
						try {
							Rebuy.Cart.fetchShopifyCart(function(cart) {}); 
						} catch(e) {
							
						}
					}
					
					try {
						if (typeof window.theme !== 'undefined' && typeof window.theme.partials !== 'undefined' && typeof window.theme.partials.Cart !== 'undefined' && typeof window.theme.partials.Cart.updateAllHtml === 'function') {
							window.theme.partials.Cart.updateAllHtml(function () {});
						}
					} catch(e) {
						
					}
					
					try {
						if (typeof  window.refreshCart !== 'undefined') {
							window.refreshCart();
						}
					} catch(e) {
						
					}
					
					try {
						if (typeof  window.upcartRefreshCart !== 'undefined') {
							window.upcartRefreshCart();
						}
					} catch(e) {
						
					} 
					try {
						if (typeof window.theme !== 'undefined' && typeof window.theme.updateCartSummaries !== 'undefined') {
							window.theme.updateCartSummaries();
						}
					} catch(e) {
						
					} 
					
					
					try {
						if (typeof window.liquidAjaxCart !== 'undefined' && typeof window.liquidAjaxCart.cartRequestUpdate === 'function') {
							window.liquidAjaxCart.cartRequestUpdate();
						}
					} catch(e) {
						
					}
					try {
						var cartRoot = document.querySelector('cart-root');
						if (typeof cartRoot !== 'undefined' && cartRoot !== null && typeof cartRoot.updateHtml === 'function') {
							cartRoot.updateHtml();
						}
					} catch(e) {
						console.log(e);
					}
					try {

						var cartItems = document.querySelector('cart-drawer-items');
						if (typeof cartItems !== 'undefined' && cartItems !== null && typeof cartItems.onCartUpdate === 'function') {
							cartItems.onCartUpdate();
						}
					} catch(e) {
						console.log(e);
					}
					
					
					try {
						var cartDrawer = document.querySelector('cart-drawer');
						if (typeof cartDrawer !== 'undefined' && cartDrawer !== null && typeof cartDrawer.update === 'function') {
							cartDrawer.update();
						}
					} catch(e) {
						console.log(e);
					}
					
					
											try {
							
							if (typeof window.theme !== 'undefined' && typeof window.theme.CartDrawer === 'function') {
								new theme.CartDrawer();
								
															}
						} catch(e) {}
										
					
					
					/*
					if (typeof window.cart !== 'undefined' && typeof window.cart.getCart === 'function') {
						try {
							window.cart.getCart();
						} catch(e) {
							console.error(e);
						}
					}*/
					
					/*
					try {
						
						if (
							typeof window.SATCB !== 'undefined' &&
							typeof window.SATCB.Helpers !== 'undefined' &&
							typeof window.SATCB.Helpers.openCartSlider === 'function'
						) {
							window.SATCB.Helpers.openCartSlider();
						}
                    } catch (e) {
                    }*/
					
					
										
										
										
										
										
					
										
					/*
					setTimeout(function() {
						try {
							console.log('emitting event');
							if (typeof window.MinimogEvents !== 'undefined' && typeof window.MinimogEvents.emit === 'function') {
								GlobalUtility.cart.get(false).then(function(data) {
									data.clone().json().then(function(cart) {
										
										console.log('emitting event', JSON.parse(JSON.stringify(cart)));
										// Update cart counter
										MinimogEvents.emit('ON_CART_UPDATE', cart);
										
										
									});
								});
							}
						} catch(e) {}
					}, 500);
					*/
					
					try {
						// For fodyfoods
						var sectionsToFetch = ['cart-items', 'cart-footer', 'cart-item-count'];

						fetch(`/?sections=${sectionsToFetch.join(',')}`, {
							method: 'GET',
							headers: { 'X-Requested-With': 'XMLHttpRequest' }
						})
						.then(res => res.json())
						.then(data => {
							// Dispatch the same event the theme uses to refresh the cart drawer
							document.body.dispatchEvent(
								new CustomEvent('shapes:modalcart:afteradditem', {
									bubbles: true,
									detail: { 
										response: {
											sections: data 
										}
									}
								})
							);
						})
						.catch(err => console.error('Cart drawer update failed:', err));
						
					} catch(e) {}
					
					try {
						var MinimogCartDrawer = document.querySelectorAll('#MinimogCartDrawer');
						if (typeof MinimogCartDrawer[0] !== 'undefined' && typeof MinimogCartDrawer[0].onCartDrawerUpdate === 'function') {
							MinimogCartDrawer[0].onCartDrawerUpdate();
						}
					} catch(e) {
						console.log(e);
					}
					
					
					
					
					/*
					try {
						document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
							bubbles: true,
							detail: {
								cart: {}
							}
						}));
					} catch(e) {}*/
				}
				
				function objectToFormData(obj, formData = new FormData(), parentKey = '') {
					for (let key in obj) {
						if (obj.hasOwnProperty(key)) {
							const value 	= obj[key];
							const newKey 	= parentKey ? `${parentKey}[${key}]` : key;

							if (typeof value === 'object' && !Array.isArray(value)) {
								
								objectToFormData(value, formData, newKey);
								
							} else if (Array.isArray(value)) {
								
								for(var z = 0; z < value.length; z++) {
									objectToFormData(value[z], formData, `${newKey}[${z}]`);
								}
								
							} else {
								formData.append(newKey, value);
							}
						}
					}

					return formData;
				}
				
				function formDataToSerializedString(formData) {
					let serializedString = '';
					for (let [key, value] of formData.entries()) {
						if (serializedString.length > 0) {
							serializedString += '&';
						}
						serializedString += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
					}
					return serializedString;
				}
				
				function serializedStringToFormData(serializedString) {
					const formData = new FormData();

					if (typeof serializedString !== 'string' || !serializedString.trim()) {
						return formData;
					}

					const pairs = serializedString.split('&');
					for (const pair of pairs) {
						const [key, value] = pair.split('=');
						formData.append(
						  decodeURIComponent(key),
						  value !== undefined ? decodeURIComponent(value) : ''
						);
					}

					return formData;
				}


				function getAddVariantsPostData(variantsData, lineItemProperties) {
					var data = {
						items: []
					};
					
					for (var i = 0; i < variantsData.length; i++) {
						var item = {
							id 		: variantsData[i].id,
							quantity: variantsData[i].quantity
						};

                        						
												
												
						if (typeof variantsData[i].selling_plan !== 'undefined' && variantsData[i].selling_plan !== '') {
							item.selling_plan = variantsData[i].selling_plan;
						}
						
						if (typeof lineItemProperties !== 'undefined') {
							item.properties = lineItemProperties;
						}
						
						// Merge same items into one line
						var itemQuantityWasIncreased = false; 
						// Loop through existing items and just increase the quantity 
						for (var j = 0; j < data.items.length; j++) {
							if (data.items[j].id === item.id && 
								(
									typeof item.selling_plan === typeof data.items[j].selling_plan && 
									(
										typeof item.selling_plan === 'undefined' || 
										item.selling_plan === data.items[j].selling_plan
									)
								)
								) {
									// Increase the quantity as this is the same item
									data.items[j].quantity += item.quantity;
									itemQuantityWasIncreased = true;
							}
						}
						
						if (itemQuantityWasIncreased === false) {
							// Push this as a new item
							data.items.push(item);
						}
					}
					
					// quickstart-6536d374.myshopify.com
					if (typeof data.items !== 'undefined' && data.items.length === 1) {
						// We are only adding one item 
						// Reformat this to the standard Shopify format so that cart drawers will still work 
						var newData = data.items[0];
						data = newData;
					}
					
					return data;
				}

				var addingToCart = false;
				
				var afterAddToCartCallback = function() {};
				
				async function addVariants(variantsData, throwErrorOnFailure, lineItemProperties, productData, shouldUpdateCart) {
					if (typeof throwErrorOnFailure === 'undefined') {
						throwErrorOnFailure = true;
					}
					
					if (typeof shouldUpdateCart === 'undefined') {
						shouldUpdateCart = true;
					}
					
					var data = getAddVariantsPostData(variantsData, lineItemProperties);
					
					if (addingToCart === true) {
						console.log('Already adding to the cart');
						return null;
					}

					addingToCart = true;
					
					if (leakyBucket.hasSpace() === false) {
						console.log('leaky bucket is full');
						return null;
					}
					
					leakyBucket.add();
					
					var endpointSuffix = '';
					
                    					
					//var additionalGetParameters = getAdditionalUrlParameters();
					var additionalGetParameters = '';
					
										
					var prefix = '/';
					
					if (typeof window.Shopify !== 'undefined' && typeof window.Shopify.routes !== 'undefined' && typeof window.Shopify.routes.root === 'string') {
						prefix = window.Shopify.routes.root;
					}

                    // var matchingBot = null
                    var matchingConfirmationBot = null;

                    // if (typeof pspBots === 'undefined') {
                    //     matchingBot = null;
                    // } else {
                    //     if (typeof data.items !== 'undefined') {
                    //         matchingBot = findMatchingPspBot(pspBots, data.items);
                    //     } else {
                    //         matchingBot = null;
                    //     }
                    // }

					/*
                    if (typeof confirmationBots === 'undefined') {
                        matchingConfirmationBot = null;
                    } else {
                        if (typeof data.items !== 'undefined') {
                            matchingConfirmationBot = findMatchingConfirmationBot(confirmationBots, data.items);
                        } else {
                            matchingConfirmationBot = null;
                        }
                    }
					*/
					
					var showConfirmationPopup = false;
					
					for(let d = 0; d < variantsData.length; d++) {
						for(let j = 0; j < rules.length; j++) {
							if (rules[j].id === variantsData[d].rule_id) {
								if (rules[j].ask_for_confirmation === 'true') {
									// We have to show the confirmation popup before adding the item to the cart 
									//matchingConfirmationBot = rules[j]; // Shouldn't we show the popup with all products?
									showConfirmationPopup = true;
								}
							}
						}
					}

                    					
					showConfirmationPopup = await shouldIShowConfirmationPopup(variantsData, productData, false, showConfirmationPopup);
					
					if (showConfirmationPopup === true) {
						// Show confirmation popup 
						try {
							return openConfirmationModal(variantsData, function() {
								return overrideFetchRequest(prefix, endpointSuffix, additionalGetParameters, throwErrorOnFailure, data, shouldUpdateCart);
							});
						} catch (e) {
							console.log(e)
						}

					} else {
						return overrideFetchRequest(prefix, endpointSuffix, additionalGetParameters, throwErrorOnFailure, data, shouldUpdateCart)
					}
                    
					
                }

                async function overrideFetchRequest(prefix, endpointSuffix, additionalGetParameters, throwErrorOnFailure, data, shouldUpdateCart) {
					
					if (typeof shouldUpdateCart === 'undefined') {
						shouldUpdateCart = true;
					}

                    return await fetch(prefix+'cart/add'+endpointSuffix+'?cartbot-cart-call&'+additionalGetParameters, {
                        method: 'POST',
                        cache: 'no-cache',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json'
                            //'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        redirect: 'follow',
                        referrerPolicy: 'no-referrer',
                        body: JSON.stringify(data)
                    }).then(function(data) {
                        
                        //console.log('data', data);

                        addingToCart = false;
                        
                        
                        if (throwErrorOnFailure) {
                            if (typeof data.status === 'undefined' || data.status !== 200) {
                                //console.log('Couldnt add products to the cart!', data.status);
                                throw new Error('Cartbot: Couldnt add the product to the cart automatically. Please recreate your bot or check that the product you are trying to add exists and has the correct selling plan selected (if needed). '+ data.status);
                            }
                        }
                        
                        if (typeof window.$ === 'function') {
                            try {
                                window.$('body').trigger('added.ajaxProduct');
                                
                            } catch(e) {}
                        }
                        
                        try {
                            document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
								detail: {
									open:true
								}
							}));

                            setTimeout(function() {
                                // Retrigger this event so that the cart drawer will be updated. Some cart drawers can show old state and the refresh has to be triggered again.
                                document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
									detail: {
										open:true
									}
								}));
                            }, 1000);
                        } catch(e) {}
                        
						
						if (shouldUpdateCart === true) {
							try {
								updateCart();
							} catch(e) {
								console.error(e);
							}
						}
                        
                        if (typeof afterAddToCartCallback === 'function') {
                            afterAddToCartCallback();
                        }
                        
                    }).catch(function(e) {
                        
                        //console.log('error -----------------');
                        addingToCart = false;
                        
                                                    console.log('error', e);
                                                
                        try {
                            updateCart();
                        } catch(e) {
                            console.error(e);
                        }
                        
                        if (typeof afterAddToCartCallback === 'function') {
                            afterAddToCartCallback();
                        }
                        
                        // Return a value to continue the chain
                        return null;
                    });
                }
				
				async function removeItems(items) {
					// Items contains 
					// {
					// 	id: integer
					//	quantity: integer // Quantity of the items that should be removed 
					// 	key: line item key or NULL if the item wasn't yet added to the cart 
					// }
					
					// First, group the line items by their key 
					var groupedItems = {};
					
					for(var i = 0; i<items.length; i++) {
						var item = items[i];
						var line_key = item.line_key;
						
						if (typeof groupedItems[line_key] === 'undefined') {
							
							groupedItems[line_key] = {
								id: item.id,
								line_key: item.line_key,
								removable_quantity: item.quantity*1
							};
						} else {
							groupedItems[line_key].removable_quantity += item.quantity;
						}
					}
					
					//var cart = JSON.parse(JSON.stringify(GlobalUtility.cart.cartData));
					
					return GlobalUtility.cart.get(false).then(function(data) {
						return data.clone().json().then(function(cart) {
							
							var updateQuantityObject = {};
							for(var line_key in groupedItems) {
								if (groupedItems.hasOwnProperty(line_key)) {
									
									var itemFound = false;
									// Loop through cart items to get the updated quantity 
									for(var x = 0; x<cart.items.length; x++) {
										if (cart.items[x].key === line_key && cart.items[x].quantity > 0) {
											var newQuantity = cart.items[x].quantity - groupedItems[line_key].removable_quantity;
											
											if (newQuantity < 0) {
												newQuantity = 0;
											}
											
											cart.items[x].quantity = newQuantity;
											
											updateQuantityObject[line_key] = newQuantity;
											
											itemFound = true;
										}
									}
									
									if (itemFound === false) {
										// Item wasn't found. Loop again, but match the line items by variant only
										for(var x = 0; x<cart.items.length; x++) {
											if (cart.items[x].key.indexOf(line_key) === 0 && cart.items[x].quantity > 0) {
												var newQuantity = cart.items[x].quantity - groupedItems[line_key].removable_quantity;
												
												if (newQuantity < 0) {
													newQuantity = 0;
												}
												
												updateQuantityObject[line_key] = newQuantity;
												
												itemFound = true;
											}
										}
									}
									
									if (itemFound === false) {
										
										var split = line_key.split(':');
										var newLineKey = '';
										if (typeof split[0] !== 'undefined') {
											newLineKey = split[0];
										}
										
										// Item wasn't found. Loop again, but match the line items by variant only
										for(var x = 0; x<cart.items.length; x++) {
											if (cart.items[x].key.indexOf(newLineKey) === 0 && cart.items[x].quantity > 0) {
												var newQuantity = cart.items[x].quantity - groupedItems[line_key].removable_quantity;
												
												if (newQuantity < 0) {
													newQuantity = 0;
												}
												
												updateQuantityObject[line_key] = newQuantity;
												
												itemFound = true;
											}
										}
									}
									
									/*
									if (itemFound === false) { // Item wasn't found. This was most likely a newly added item. Just reduce it's quantity to 0
										updateQuantityObject[line_key] = 0;
									}
									*/
									
								}
							}

							if (Object.keys(updateQuantityObject).length > 0) {
								// Only trigger update if there is something to update
								return fetch('/cart/update.js?cartbot-cart-call', {
									method: 'POST',
									cache: 'no-cache',
									credentials: 'same-origin',
									headers: {
										'Content-Type': 'application/json'
									},
									redirect: 'follow',
									referrerPolicy: 'no-referrer',
									body: JSON.stringify({
										updates: updateQuantityObject
									})
								}).then(function(data) {

									if (typeof window.$ === 'function') {
										try {
											window.$('body').trigger('added.ajaxProduct');
										} catch(e) {
											
											console.error(e);
											
										}							
									}
									
									try {
										document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
											detail: {
												open:true
											}
										}));
										
										setTimeout(function() {
											// Retrigger this event so that the cart drawer will be updated. Some cart drawers can show old state and the refresh has to be triggered again.
											document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {												
												detail: {
													open:true
												}
											}));
										}, 1000);
									} catch(e) {}
									
									try {
										updateCart();
									} catch(e) {
										console.error(e);
									}
								});
							} else {
								// Return a simulated response
								var simPromise = new Promise((resolve, reject) => {
									var response = new Response({}, { "status" : 200 , "statusText" : "Smashing success!" });
									// Resolve the promise
									resolve(response);
								});
								
								return simPromise;
							}
						});					
					});					
				}
				
				function getUpdateVariantsPostData(variantsData) {
					var updates = {}
					
					for (var i = 0; i < variantsData.length; i++) {
						if (typeof variantsData[i].key !== 'undefined') {
							updates[variantsData[i].key] = variantsData[i].quantity;
						} else if (typeof variantsData[i].id !== 'undefined') {
							updates[variantsData[i].id] = variantsData[i].quantity;
						}
					}
					
					
					return updates;
				}

				
				async function updateVariants(variantsData, throwErrorOnFailure) {
					if (typeof throwErrorOnFailure === 'undefined') {
						throwErrorOnFailure = true;
					}
					
					var data = getUpdateVariantsPostData(variantsData);

					if (addingToCart === true) {
						console.log('Already adding to the cart');
						return null;
					}

					addingToCart = true;
					
					if (leakyBucket.hasSpace() === false) {
						console.log('leaky bucket is full');
						return null;
					}
					
					leakyBucket.add();
					
					var endpointSuffix = '.js';
					
					//var additionalGetParameters = getAdditionalUrlParameters();
					var additionalGetParameters = '';
					
					var prefix = '/';
					
					if (typeof window.Shopify !== 'undefined' && typeof window.Shopify.routes !== 'undefined' && typeof window.Shopify.routes.root === 'string') {
						prefix = window.Shopify.routes.root;
					}

					return await fetch(prefix+'cart/update'+endpointSuffix+'?cartbot-cart-call&'+additionalGetParameters, {
						method: 'POST',
						cache: 'no-cache',
						credentials: 'same-origin',
						headers: {
							'Content-Type': 'application/json'
						},
						redirect: 'follow',
						referrerPolicy: 'no-referrer',
						body: JSON.stringify({
							updates: data							
						})
					}).then(function(data) {

						addingToCart = false;
						
						
						if (throwErrorOnFailure) {
							if (typeof data.status === 'undefined' || data.status !== 200) {
								//console.log('Couldnt add products to the cart!', data.status);
								throw new Error('Cartbot: Couldnt add the product to the cart automatically. Please recreate your bot or check that the product you are trying to add exists and has the correct selling plan selected (if needed). '+ data.status);
							}
						}
						
						if (typeof afterAddToCartCallback === 'function') {
							afterAddToCartCallback();
						}
						
					}).catch(function(e) {
						
						addingToCart = false;
						
						if (typeof afterAddToCartCallback === 'function') {
							afterAddToCartCallback();
						}

						// Return a value to continue the chain
						return null;
					});
				}
				
				return {
					init			: init,
					applyBots		: applyBots,
					refresh			: refresh,
					addingToCart	: addingToCart
				}

            })();
			
			if (typeof clientSpecifics === 'undefined') {
				// This will contain a list of all client specific functions
				var clientSpecifics = {};
			}
			
			Controller.init();
			
			
			function outputProductUrls() {
				var urls = [];
				
				for (var i = 0; i < rules.length; i++) {

					for (var key in rules[i].product_variants_contain) {
						if (rules[i].product_variants_contain.hasOwnProperty(key)) {
							urls.push(
								GlobalUtility.nav.getRootUrl() + 'variants/' + encodeURIComponent(rules[i].product_variants_contain[key].variant_id)
							);
						}
					}
				}
				console.log(JSON.parse(JSON.stringify(urls)));
            }
			
			function outputProductUrlsGrouped($rules, $products) {
				var urls = {};

				for (var i = 0; i < rules.length; i++) {
					var ruleName = rules[i].name;
					urls[ruleName] = [];

					for (var key in rules[i].product_variants_contain) {
						if (rules[i].product_variants_contain.hasOwnProperty(key)) {
							urls[ruleName].push(
								GlobalUtility.nav.getRootUrl() + 'variants/' + encodeURIComponent(rules[i].product_variants_contain[key].variant_id)
							);
						}
					}
				}
    			console.log(JSON.parse(JSON.stringify(urls)));
			}
			
			// ---- Bundler Integration -> Don't show popup if there is a 100% bundle discount ----
			// ---- Replacing products setting -> Don't show popup if the cart total doesn't increase
			// variantsData -> data of a product that the cartbot is trying to add
			// productData -> data of a product that the customer is trying to add
			async function shouldIShowConfirmationPopup(variantsData, productData, comparePrices, showConfirmationPopup) {
				
				if (showConfirmationPopup === false) {
					// The bot doesn't have the confirmation modal turned on, so skip it.
					return false;
				}

				
				var showConfirmationPopup = true;
				var cart = JSON.parse(JSON.stringify(GlobalUtility.cart.cartData));	
				var cartBotWillAddArray = [];		

				// Item cartbot wants to add
				if (typeof variantsData !== 'undefined' && variantsData.length > 0) {
					for (let variant of variantsData) {
						handle = productsConfiguration[variant.product_id].handle;

						try {
							let response = await fetch(`/products/${handle}.json?`);
							if (!response.ok) {
								throw new Error('Network response was not ok');
							}
							let responseData = await response.json();
							let product = responseData.product;

							let matchedVariant = product.variants.find(v => v.id.toString() === variant.id);

							if (!matchedVariant) {
								console.warn(`Variant ID ${variant.id} not found in product ${handle}`);
								continue;
							}

							let priceInCents = parseFloat(matchedVariant.price) * 100;

							var item = {
								variant_id			: parseInt((variant.id * 1)),
								quantity			: variant.quantity,
								key					: parseInt((variant.id * 1)),
								price				: priceInCents,
								line_price			: priceInCents * variant.quantity,
								original_price		: priceInCents,
								discounted_price	: priceInCents,
								original_line_price	: priceInCents
							};

							cartBotWillAddArray.push(item);
							cart.items.push(item);

						} catch (error) {
							// console.error('Error fetching product data:', error);
						}						
					}
				}

				var itemProductData = {};

				// Item customer wants to add
				if (typeof productData !== 'undefined' && Object.keys(productData).length > 0) {

					try {
						let response = await fetch(`/variants/${productData.id}.json?`);
						if (!response.ok) {
							throw new Error('Network response was not ok');
						}
						let responseData = await response.json();
						let productVariant = responseData.product_variant;

						let matchedVariant = false;

						if (parseInt(productVariant.id * 1) === parseInt(productData.id * 1)) {
							matchedVariant = true;
						}

						if (matchedVariant) {
							let priceInCents = parseFloat(productVariant.price) * 100;

							itemProductData = {
								variant_id			: parseInt((productData.id * 1)),
								quantity			: parseInt(productData.quantity),
								price				: priceInCents,
								line_price			: priceInCents * productData.quantity,
								original_price		: priceInCents,
								discounted_price	: priceInCents,
								original_line_price	: priceInCents
							}

							if (typeof productData.selling_plan !== 'undefined' && (productData.selling_plan.toString()).length > 0) {
								itemProductData['selling_plan_allocation'] = {
									selling_plan: {
										id: productData.selling_plan*1
									}
								}
							}

                            // This item needs to go to cart only if we are not comparing the prices of the products (not swapping them), since Bundler will then wrongly
                            // respond back
                            if (comparePrices === false) {
                                cart.items.push(itemProductData);
                            }
						} 

					} catch (error) {
						// console.error('Error fetching product data:', error);
					}	
				}

				let checkBundleDiscounts = true;

				
								
				return showConfirmationPopup;
			}
			
			
			window.cartbot = {
				outputProductUrls		: outputProductUrls,
				outputProductUrlsGrouped: outputProductUrlsGrouped,
				applyBots				: Controller.applyBots,
				refresh					: Controller.refresh
			}

			// Expose this to allow other apps to know when Cartbot is adding items to the cart 
			Object.defineProperty(window.cartbot, 'isCartbotAddingToCart', {
				get: function() {
					if (Controller.addingToCart === true) {
						return true;
					} else {
						return false;
					}
				},
				configurable: false
			});
		}

		
		GiftBee();
	})();
}




