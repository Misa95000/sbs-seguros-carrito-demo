(() => {
  'use strict';
  const KEY = 'sbs-auto-cart-v1';
  const IDLE_MS = 18000;
  const root = document.getElementById('app');
  let state;
  let idleTimer;
  let modalOpen = false;
  let messengerReady = false;
  let databaseReady = false;
  let genesysSubscribed = false;
  let pendingOpen = false;
  let pendingContext = null;
  let openAttempts = 0;
  let openTimeout;
  const fresh = () => ({ step: 1, vehicle: { make: '', model: '', year: '', city: '' }, plan: 'plus', cart: null, rescued: false, touched: Date.now() });
  try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) { state = fresh(); }
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const price = () => ({ basic: 108000, plus: 142000, full: 203000 }[state.plan]);
  const cop = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  function save() { state.touched = Date.now(); localStorage.setItem(KEY, JSON.stringify(state)); }
  function toast(title, message) { const t = document.getElementById('toastRoot'); t.innerHTML = '<div class="toast"><b>' + esc(title) + '</b><span>' + esc(message) + '</span></div>'; setTimeout(() => { t.innerHTML = ''; }, 4000); }
  function header() {
    document.getElementById('header').innerHTML = '<div class="topline"><div class="container top-inner"><span>Estamos para cuidar lo que te mueve</span><a href="https://www.sbseguros.co/" target="_blank" rel="noreferrer">Visitar SBS Seguros ↗</a></div></div><div class="container nav"><a class="brand" href="#inicio"><span class="brand-mark">sbs<span>.</span></span><span class="brand-caption">SEGUROS</span></a><nav><a href="#como-funciona">Cómo funciona</a><a href="#beneficios">Beneficios</a><a href="#ayuda">Ayuda</a></nav><button class="nav-quote" data-action="start">Cotizar mi auto ↗</button></div>';
  }
  function stepper() { return '<nav class="stepper" aria-label="Progreso de la cotización"><div class="step active" ' + (state.step === 1 ? 'aria-current="step"' : '') + '><span>01</span><b>Tu vehículo</b></div><i aria-hidden="true"></i><div class="step ' + (state.step > 1 ? 'active' : '') + '" ' + (state.step === 2 ? 'aria-current="step"' : '') + '><span>02</span><b>Elige tu plan</b></div><i aria-hidden="true"></i><div class="step ' + (state.step > 2 ? 'active' : '') + '" ' + (state.step === 3 ? 'aria-current="step"' : '') + '><span>03</span><b>Finaliza</b></div></nav>'; }
  function form() {
    const v = state.vehicle;
    let years = '<option value="">Selecciona</option>';
    for (let y = 2026; y >= 2005; y--) years += '<option ' + (String(v.year) === String(y) ? 'selected' : '') + '>' + y + '</option>';
    return stepper() + '<form id="quoteForm" class="quote-form" aria-labelledby="quoteFormTitle"><span class="eyebrow">● Cotiza en minutos</span><h2 id="quoteFormTitle">Empecemos por tu auto</h2><p id="quoteFormHelp">Cuéntanos un poco para mostrarte opciones a tu medida.</p><label for="vehicleMake">Marca del vehículo <span aria-hidden="true">*</span><input id="vehicleMake" name="make" type="text" placeholder="Ej. Mazda" value="' + esc(v.make) + '" aria-describedby="quoteFormHelp" required></label><div class="field-row"><label for="vehicleModel">Modelo <span aria-hidden="true">*</span><input id="vehicleModel" name="model" type="text" placeholder="Ej. 3 Touring" value="' + esc(v.model) + '" required></label><label for="vehicleYear">Año <span aria-hidden="true">*</span><select id="vehicleYear" name="year" required>' + years + '</select></label></div><label for="vehicleCity">Ciudad <span aria-hidden="true">*</span><input id="vehicleCity" name="city" type="text" autocomplete="address-level2" placeholder="Ej. Bogotá" value="' + esc(v.city) + '" required></label><button class="primary-btn wide" type="submit">Ver opciones de protección <span>→</span></button><p class="fine-print">* Campos obligatorios. Demostración: no emite pólizas ni solicita datos sensibles.</p></form>';
  }
  function results() {
    const plans = [ ['basic','Esencial',108000,'Responsabilidad civil|Asistencia en carretera'], ['plus','Plus',142000,'Pérdida parcial y total|Asistencia ampliada'], ['full','Integral',203000,'Coberturas ampliadas|Vehículo de reemplazo'] ];
    let cards = '';
    plans.forEach(p => { cards += '<article class="plan-card ' + (state.plan === p[0] ? 'selected' : '') + '"><span class="eyebrow">' + (p[0] === 'plus' ? 'MÁS ELEGIDO' : 'PLAN SBS') + '</span><h3>' + p[1] + '</h3><p>Respaldo para seguir tu camino con tranquilidad.</p><ul>' + p[3].split('|').map(x => '<li>✓ ' + x + '</li>').join('') + '</ul><div class="plan-price">' + cop(p[2]) + '<small> / mes aprox.</small></div><button class="' + (state.plan === p[0] ? 'primary-btn' : 'outline-btn') + ' wide" data-action="choose" data-plan="' + p[0] + '">' + (state.plan === p[0] ? 'Plan seleccionado' : 'Elegir este plan') + '</button></article>'; });
    return stepper() + '<div class="results-head"><div><span class="eyebrow">Opciones para ti</span><h2>Elige tu tranquilidad</h2><p>Estimaciones ilustrativas, sujetas a validación.</p></div><button class="text-button" data-action="edit">← Editar auto</button></div><div class="vehicle-chip"><b>🚘 ' + esc(state.vehicle.year) + ' ' + esc(state.vehicle.make) + ' ' + esc(state.vehicle.model) + '</b><span>' + esc(state.vehicle.city) + '</span></div><div class="plan-grid">' + cards + '</div><button class="primary-btn" data-action="checkout">Continuar con esta cotización →</button>';
  }
  function checkout() {
    return stepper() + '<div class="checkout-panel"><div><span class="eyebrow">Tu cotización está guardada</span><h2>Continúa cuando estés listo</h2><p>Un asesor puede ayudarte con tus preguntas y próximos pasos.</p><div class="vehicle-chip"><b>' + esc(state.vehicle.year) + ' ' + esc(state.vehicle.make) + ' ' + esc(state.vehicle.model) + '</b><span>Plan ' + (state.plan === 'plus' ? 'Plus' : state.plan === 'basic' ? 'Esencial' : 'Integral') + ' · ' + esc(state.vehicle.city) + '</span></div><label class="consent"><input type="checkbox" id="consent"> Acepto que me contacten para continuar esta cotización de demostración.</label><button class="primary-btn" data-action="finish">Continuar con asesor →</button><button class="text-button" data-action="back">Volver a comparar planes</button><p class="fine-print">Valores y coberturas representativos. No constituyen una oferta de seguro.</p></div><aside class="summary"><span>RESUMEN</span><h3>' + esc(state.vehicle.make) + ' ' + esc(state.vehicle.model) + '</h3><p>' + esc(state.vehicle.year) + ' · ' + esc(state.vehicle.city) + '</p><hr><span>Prima mensual estimada</span><b>' + cop(price()) + '</b></aside></div>';
  }
  function render(focusStep = false) {
    header();
    let main = state.step === 1 ? form() : state.step === 2 ? results() : checkout();
    root.innerHTML = '<div class="container"><div class="hero"><div class="hero-copy"><span class="eyebrow">Tu seguro de auto, sin complicaciones</span><h1>Protección para seguir tu camino.</h1><p>Compara opciones y encuentra el respaldo que se ajusta a ti. Si necesitas una pausa, guardamos tu cotización.</p><div class="hero-points"><span>✓ Cotización guiada</span><span>✓ Acompañamiento cuando lo necesites</span></div></div><div class="hero-art"><img class="hero-car-art" src="assets/car-illustration.svg" alt="" aria-hidden="true"><div class="art-note"><b>Tu camino,</b><span>con más tranquilidad.</span></div></div></div><div class="quote-shell"><section class="quote-main">' + main + '</section><aside class="side-note"><div class="shield">✳</div><h3>Claro y acompañado.</h3><p>Estamos aquí para ayudarte a elegir una opción para tu vehículo.</p><div class="side-rule"></div><b>¿Tienes una duda?</b><button class="help-link" data-action="help">Hablar con un asesor →</button><p class="side-small">Atención sujeta a disponibilidad.</p>' + (state.cart ? '<div class="cart-mini"><span>Tu cotización guardada</span><b>' + cop(price()) + ' / mes</b><button data-action="checkout">Retomar →</button></div>' : '') + '</aside></div></div><section class="below container" id="como-funciona"><div><span class="eyebrow">Simple y acompañado</span><h2>Tu cotización te espera cuando quieras volver.</h2><p>Guardamos tu avance en este navegador para que retomes justo donde lo dejaste.</p></div><div class="below-features" id="beneficios"><article><span>01</span><b>Compara con calma</b><p>Revisa opciones de protección.</p></article><article><span>02</span><b>Guarda tu avance</b><p>Tu vehículo y plan se conservan en esta demo.</p></article><article id="ayuda"><span>03</span><b>Recibe ayuda contextual</b><p>Conecta con asesoría desde tu paso actual.</p></article></div></section><footer class="footer"><div class="container"><span class="brand-mark">sbs<span>.</span></span><span>Demo de experiencia digital · SBS Seguros</span><button class="text-button" data-action="reset">Reiniciar demo</button></div></footer>';
    if (focusStep) requestAnimationFrame(() => { const heading = root.querySelector('.quote-main h2'); if (heading) { heading.tabIndex = -1; heading.focus(); } });
  }
  function closeRescue() {
    const dialog = document.getElementById('rescueDialog');
    if (dialog?.open) dialog.close();
    document.getElementById('modalRoot').innerHTML = '';
    modalOpen = false;
  }
  function rescue(reason) {
    if (!state.cart || state.rescued || modalOpen || state.step === 3) return;
    state.rescued = true; save(); modalOpen = true;
    const modalRoot = document.getElementById('modalRoot');
    modalRoot.innerHTML = '<dialog class="rescue-dialog" id="rescueDialog" closedby="any" aria-labelledby="rescueTitle"><button class="modal-x" type="button" data-action="dismiss" aria-label="Cerrar recordatorio">×</button><div class="rescue-art"><img src="assets/car-illustration.svg" alt="" aria-hidden="true"></div><span class="eyebrow">Tu avance está guardado</span><h2 id="rescueTitle">¿Retomamos tu protección?</h2><p>Tu cotización de <b>' + esc(state.vehicle.make) + ' ' + esc(state.vehicle.model) + '</b> sigue aquí. Si algo te detuvo, un asesor puede ayudarte.</p><div class="rescue-summary"><span>Plan ' + (state.plan === 'plus' ? 'Plus' : state.plan === 'basic' ? 'Esencial' : 'Integral') + '</span><b>' + cop(price()) + '<small> / mes aprox.</small></b></div><div class="rescue-actions"><button class="primary-btn wide" type="button" data-action="resume" autofocus>Retomar cotización →</button><button class="outline-btn wide" type="button" data-action="help">Quiero ayuda de un asesor</button></div><small class="modal-note">Sin presión. Puedes revisar o reiniciar cuando quieras.</small></dialog>';
    const dialog = document.getElementById('rescueDialog');
    dialog.addEventListener('close', () => { modalOpen = false; dialog.returnValue = ''; });
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = event => {
        const rect = dialog.getBoundingClientRect();
        return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      };
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', event => { pressedOutside = outside(event); });
      dialog.addEventListener('pointerup', event => {
        if (pressedOutside && outside(event)) dialog.close();
        pressedOutside = false;
      });
    }
    dialog.showModal();
    sessionStorage.setItem('sbs_rescue_reason', reason);
  }
  function help() {
    closeRescue();
    const context = { journeyStep: state.step, frictionType: sessionStorage.getItem('sbs_rescue_reason') || 'quote_incomplete', product: 'Seguro de auto', vehicle: state.vehicle.year + ' ' + state.vehicle.make + ' ' + state.vehicle.model, city: state.vehicle.city, selectedPlan: state.plan, estimatedMonthlyPremiumCOP: price(), nextBestAction: 'Ayudar a retomar cotización' };
    try {
      if (typeof window.Genesys === 'function') {
        pendingOpen = true;
        openAttempts = 0;
        pendingContext = context;
        if (databaseReady) {
          setMessengerContext(context, () => {
            pendingContext = null;
            openMessenger();
          });
        }
        if (messengerReady && databaseReady) openMessenger();
        else toast('Conectando con un asesor', 'El chat se abrirá en cuanto Messenger esté listo.');
        clearTimeout(openTimeout);
        openTimeout = setTimeout(() => {
          if (!pendingOpen) return;
          pendingOpen = false;
          pendingContext = null;
          toast('Chat no disponible', 'Puedes continuar con la cotización guardada o intentarlo de nuevo.');
        }, 9000);
      } else toast('Asesoría por chat', 'Configura el deployment Genesys para activar el chat en vivo.');
    } catch (_) { toast('Chat no disponible', 'Puedes retomar tu cotización guardada.'); }
  }
  function openMessenger() {
    if (!pendingOpen) return;
    if (!messengerReady || pendingContext) return;
    openAttempts += 1;
    try {
      window.Genesys('command', 'Messenger.open', {}, () => {
        pendingOpen = false;
        clearTimeout(openTimeout);
      }, error => {
        if (openAttempts < 3) setTimeout(openMessenger, 700 * openAttempts);
        else {
          pendingOpen = false;
          clearTimeout(openTimeout);
          console.error('Genesys Messenger.open failed', error);
          toast('Chat no disponible', 'Puedes retomar tu cotización guardada.');
        }
      });
    } catch (error) {
      if (openAttempts < 3) setTimeout(openMessenger, 700 * openAttempts);
      else {
        pendingOpen = false;
        clearTimeout(openTimeout);
        console.error('Genesys Messenger.open threw an error', error);
        toast('Chat no disponible', 'Puedes retomar tu cotización guardada.');
      }
    }
  }
  function setMessengerContext(customAttributes, onSettled = () => {}) {
    const finish = () => { onSettled(); };
    try {
      window.Genesys('command', 'Database.set', { messaging: { customAttributes } }, finish, error => {
        console.error('Genesys Database.set failed', error);
        toast('No se pudo compartir el contexto', 'El asesor puede ayudarte si vuelves a abrir el chat.');
        finish();
      });
    } catch (error) {
      console.error('Genesys Database.set threw an error', error);
      toast('No se pudo compartir el contexto', 'Puedes continuar con la cotización guardada.');
      finish();
    }
  }
  function initializeGenesys(attempt) {
    if (genesysSubscribed) return;
    if (typeof window.Genesys !== 'function') {
      if (attempt < 24) setTimeout(() => initializeGenesys(attempt + 1), 250);
      return;
    }
    genesysSubscribed = true;
    try {
      window.Genesys('subscribe', 'Messenger.ready', () => { messengerReady = true; openMessenger(); });
      window.Genesys('subscribe', 'Database.ready', () => {
        databaseReady = true;
        if (pendingContext) {
          setMessengerContext(pendingContext, () => {
            pendingContext = null;
            openMessenger();
          });
        } else openMessenger();
      });
    } catch (_) { genesysSubscribed = false; }
  }
  document.addEventListener('submit', e => {
    if (e.target.id !== 'quoteForm') return;
    e.preventDefault(); const d = new FormData(e.target);
    state.vehicle = { make: d.get('make'), model: d.get('model'), year: d.get('year'), city: d.get('city') };
    state.step = 2; state.cart = { created: Date.now() }; state.rescued = false; save(); render(true); armIdle();
    try { window.Genesys && window.Genesys('command', 'Journey.record', { eventName: 'auto_quote_created', customAttributes: { product: 'Seguro de auto', city: state.vehicle.city } }); } catch (_) {}
    toast('Cotización lista', 'Elige el nivel de protección que prefieras.');
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]'); if (!b) return;
    const a = b.dataset.action;
    if (a === 'start') { state.step = 1; save(); render(true); document.querySelector('.quote-shell').scrollIntoView({ behavior: 'smooth' }); }
    if (a === 'choose') { state.plan = b.dataset.plan; save(); render(); }
    if (a === 'edit') { state.step = 1; save(); render(true); }
    if (a === 'checkout') { state.step = 3; save(); render(true); }
    if (a === 'back') { state.step = 2; save(); render(true); }
    if (a === 'resume') { closeRescue(); state.step = 2; state.rescued = false; save(); render(true); toast('Cotización recuperada', 'Continúa donde te quedaste.'); }
    if (a === 'help') help();
    if (a === 'dismiss') closeRescue();
    if (a === 'reset') { localStorage.removeItem(KEY); state = fresh(); render(); toast('Demo reiniciada', 'Empieza una cotización nueva.'); }
    if (a === 'finish') { if (!document.getElementById('consent').checked) toast('Confirma el consentimiento', 'Marca la casilla para continuar en esta simulación.'); else help(); }
  });
  function armIdle() { clearTimeout(idleTimer); if (state.cart && !state.rescued && state.step !== 3) idleTimer = setTimeout(() => rescue('quote_idle'), IDLE_MS); }
  ['pointerdown', 'keydown', 'scroll'].forEach(type => document.addEventListener(type, armIdle, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.cart && state.step !== 3) { state.abandonPending = true; save(); }
    else if (state.abandonPending && state.cart) { state.abandonPending = false; save(); rescue('page_exit'); }
  });
  window.addEventListener('pagehide', () => { if (state.cart) save(); });
  if (new URLSearchParams(location.search).get('reset') === '1') { localStorage.removeItem(KEY); location.replace(location.pathname); }
  render(); initializeGenesys(0); armIdle();
  if (state.abandonPending && state.cart && state.step !== 3) { state.abandonPending = false; setTimeout(() => rescue('return_visit'), 500); }
})();
