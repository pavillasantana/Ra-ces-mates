// Unified Analytics Tracking for Raíces Storefront (GA4, GTM, Meta Pixel, TikTok Pixel)

const GTM_ID = import.meta.env.VITE_GTM_ID || 'GTM-MOCK123';
const GA4_ID = import.meta.env.VITE_GA4_ID || 'G-MOCK123';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || 'MOCK_META_PIXEL_ID';
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID || 'MOCK_TIKTOK_PIXEL_ID';

export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  // 1. Google Analytics 4 (gtag.js)
  if (!window.gtag) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, { send_page_view: true });
  }

  // 2. Google Tag Manager
  if (!window.gtmInitialized) {
    (function(w,d,s,l,i){
      w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',GTM_ID);
    window.gtmInitialized = true;
  }

  // 3. Meta Pixel (Facebook)
  if (!window.fbq) {
    (function(f,b,e,v,n,t,s) {
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    })(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // 4. TikTok Pixel
  if (!window.ttq) {
    (function (w, d, t) {
      w.ttq = w.ttq || [];
      w.ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
      w.ttq.setAndDefer = function (e, t) {
        e[t] = function () {
          e.push([t].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (var i = 0; i < w.ttq.methods.length; i++) {
        w.ttq.setAndDefer(w.ttq, w.ttq.methods[i]);
      }
      w.ttq.instance = function (e) {
        var t = w.ttq._i[e] || [];
        for (var i = 0; i < w.ttq.methods.length; i++) {
          w.ttq.setAndDefer(t, w.ttq.methods[i]);
        }
        return t;
      };
      w.ttq.load = function (e, t) {
        var n = "https://analytics.tiktok.com/i18n/pixel/events.js";
        w.ttq._i = w.ttq._i || {};
        w.ttq._i[e] = [];
        w.ttq._i[e]._u = n;
        w.ttq._t = w.ttq._t || {};
        w.ttq._t[e] = +new Date;
        w.ttq._o = w.ttq._o || {};
        w.ttq._o[e] = t || {};
        var n_script = d.createElement("script");
        n_script.type = "text/javascript";
        n_script.async = !0;
        n_script.src = n;
        var first_script = d.getElementsByTagName("script")[0];
        first_script.parentNode.insertBefore(n_script, first_script);
      };
      w.ttq.load(TIKTOK_PIXEL_ID);
      w.ttq.page();
    })(window, document, 'script');
  }

  console.log(`%c⚙️ [ANALYTICS] Initialized GTM (${GTM_ID}), GA4 (${GA4_ID}), Meta Pixel, and TikTok Pixel successfully.`, 'color: #0b6623; font-weight: bold;');
};

// Unified Event Dispatcher
export const trackEvent = (eventName, params = {}) => {
  if (typeof window === 'undefined') return;

  console.log(`%c📊 [ANALYTICS EVENT] ${eventName}:`, 'color: #18281a; font-weight: bold; background-color: #f4f1eb; padding: 4px 8px; border: 1px solid #18281a; border-radius: 4px;', params);

  // Dispatch to GA4
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Dispatch to GTM / DataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params
  });

  // Dispatch to Meta Pixel
  if (window.fbq) {
    const metaEventMap = {
      'view_item': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'Purchase'
    };
    const metaEvent = metaEventMap[eventName] || eventName;
    
    // Map standard params
    const metaParams = {};
    if (params.value) metaParams.value = params.value;
    if (params.currency) metaParams.currency = params.currency;
    if (params.items) {
      metaParams.content_ids = params.items.map(i => i.item_id || i.id);
      metaParams.content_type = 'product';
    }
    
    window.fbq('track', metaEvent, metaParams);
  }

  // Dispatch to TikTok Pixel
  if (window.ttq) {
    const tiktokEventMap = {
      'view_item': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'CompletePayment'
    };
    const ttEvent = tiktokEventMap[eventName] || eventName;
    
    const ttParams = {
      contents: params.items ? params.items.map(i => ({
        content_id: String(i.item_id || i.id),
        content_name: i.item_name || i.name,
        price: Number(i.price),
        quantity: Number(i.quantity || 1)
      })) : [],
      value: Number(params.value || 0),
      currency: params.currency || 'ARS'
    };
    
    window.ttq.track(ttEvent, ttParams);
  }
};
