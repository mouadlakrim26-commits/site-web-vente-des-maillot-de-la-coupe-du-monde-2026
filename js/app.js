const WEB3FORMS_KEY = 'f492e95a-9c98-46d0-bdc1-4bc4143670cc';
const WHATSAPP_NUMBER = '212772170491';

let currency = 'USD';
let activeRegion = 'ALL';
let cart = [];
let currentKit = null;
let selectedVersion = 'FAN';
let selectedSize = 'L';

// Hero Showcase Carousel (rotates every 6 seconds)
const HERO_SLIDES = [
  { id: 'mar', badge: '🔥 Trending #1 on Facebook' },
  { id: 'fra', badge: '⚡ World Cup Finalist' },
  { id: 'arg', badge: '🏆 Defending Champions' },
  { id: 'ned', badge: '🧡 Fan Favorite' },
  { id: 'mex', badge: '🏟️ Host Nation Kit' },
  { id: 'esp', badge: '⭐ European Champions' },
  { id: 'bra', badge: '✨ Seleção Classic' },
  { id: 'por', badge: '🔥 Best Seller' },
];
let heroIndex = 0;
let heroTimer = null;

const fmtPrice = (usd) => currency === 'USD' ? `$${usd.toFixed(2)}` : `${Math.round(usd * 10)} MAD`;

function jerseySVG(primary, secondary, name = '', num = '') {
  const textColor = (primary === '#FFFFFF' || primary === '#F8FAFC' || primary === '#F1F5F9' || primary === '#FFDF00') ? '#0F172A' : '#FFFFFF';
  return `
    <svg viewBox="0 0 200 210" class="w-full h-auto drop-shadow-xl">
      <path d="M55,22 L20,45 L5,88 L38,102 L48,76 L48,195 L152,195 L152,76 L162,102 L195,88 L180,45 L145,22 C130,36 70,36 55,22 Z"
        fill="${primary}" stroke="#1E293B" stroke-width="2"/>
      <path d="M62,22 C75,42 125,42 138,22 C125,28 75,28 62,22 Z" fill="${secondary}"/>
      <path d="M5,88 L38,102 L41,94 L8,80 Z" fill="${secondary}"/>
      <path d="M195,88 L162,102 L159,94 L192,80 Z" fill="${secondary}"/>
      <text x="100" y="76" text-anchor="middle" fill="${textColor}" font-family="Oswald, sans-serif" font-weight="700" font-size="16" letter-spacing="1.5">${name}</text>
      <text x="100" y="142" text-anchor="middle" fill="${textColor}" font-family="Oswald, sans-serif" font-weight="700" font-size="62">${num}</text>
    </svg>
  `;
}

// Always displays the front-facing hanger jersey photo (with automatic SVG fallback only if offline)
function renderJerseyMedia(kit, imgClass = 'w-full h-44 object-contain', fallbackName = '', fallbackNum = '') {
  if (!kit.image) {
    return jerseySVG(kit.primary, kit.secondary, fallbackName, fallbackNum);
  }
  return `
    <img src="${kit.image}"
      alt="${kit.country} Home Kit"
      loading="lazy"
      class="${imgClass} transition-transform duration-300 group-hover:scale-105"
      onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');" />
    <div class="hidden w-full">${jerseySVG(kit.primary, kit.secondary, fallbackName, fallbackNum)}</div>
  `;
}

function renderHeroSlide(index, animate = true) {
  heroIndex = index % HERO_SLIDES.length;
  const slide = HERO_SLIDES[heroIndex];
  const kit = JERSEYS.find(j => j.id === slide.id) || JERSEYS[0];
  const inner = document.getElementById('hero-showcase-inner');

  const applyContent = () => {
    document.getElementById('hero-badge').innerText = slide.badge;
    document.getElementById('hero-title').innerText = `${kit.country} Home Kit`;
    const starsLine = kit.players.slice(0, 2).map(p => `${p.name} #${p.num}`).join(' • ');
    document.getElementById('hero-subtitle').innerText = `Default: ${starsLine} • Custom Name`;
    document.getElementById('hero-btn').setAttribute('onclick', `openCustomizer('${kit.id}')`);

    const heroPreview = document.getElementById('hero-jersey-preview');
    heroPreview.className = 'w-32 sm:w-40 h-36 sm:h-40 shrink-0 flex items-center justify-center bg-white rounded-xl p-2';
    heroPreview.innerHTML = renderJerseyMedia(
      kit,
      'w-full h-full object-contain',
      kit.players[0].name,
      kit.players[0].num
    );
    renderHeroDots();
  };

  if (animate) {
    inner.classList.add('opacity-0', 'translate-y-1');
    setTimeout(() => {
      applyContent();
      inner.classList.remove('opacity-0', 'translate-y-1');
    }, 220);
  } else {
    applyContent();
  }
}

function renderHeroDots() {
  document.getElementById('hero-dots').innerHTML = HERO_SLIDES.map((_, idx) => `
    <button type="button" onclick="jumpHeroSlide(${idx})" aria-label="Show featured jersey ${idx + 1}"
      class="h-1.5 rounded-full transition-all ${idx === heroIndex ? 'w-5 bg-emerald-400' : 'w-1.5 bg-slate-600 hover:bg-slate-400'}">
    </button>
  `).join('');
}

function jumpHeroSlide(idx) {
  renderHeroSlide(idx, true);
  startHeroCarousel();
}

function startHeroCarousel() {
  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    renderHeroSlide((heroIndex + 1) % HERO_SLIDES.length, true);
  }, 6000);
}

function changeCurrency(val) {
  currency = val;
  renderCatalog();
  renderCart();
  if (currentKit) updateModalPrice();
}

function renderRegions() {
  document.getElementById('region-tabs').innerHTML = REGIONS.map(r => `
    <button onclick="activeRegion='${r.id}'; renderRegions(); renderCatalog();"
      class="px-3.5 py-2 rounded-full text-xs font-bold transition ${activeRegion === r.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}">
      ${r.label}
    </button>
  `).join('');
}

function renderCatalog() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const filtered = JERSEYS.filter(j => {
    const matchReg = activeRegion === 'ALL' || j.region === activeRegion;
    const matchQ = !q || j.country.toLowerCase().includes(q) || j.players.some(p => p.name.toLowerCase().includes(q));
    return matchReg && matchQ;
  });
  document.getElementById('result-count').innerText = `${filtered.length} National Kits Available`;
  document.getElementById('catalog-grid').innerHTML = filtered.map(j => {
    const defaultPlayer = j.players[0];
    return `
      <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xl hover:border-emerald-500 transition group">
        <div class="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
          <span>${j.flag} ${j.region}</span>
          <span class="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">${defaultPlayer.name} #${defaultPlayer.num}</span>
        </div>
        <div class="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-center transition cursor-pointer h-52" onclick="openCustomizer('${j.id}')">
          ${renderJerseyMedia(j, 'w-full h-44 object-contain', defaultPlayer.name, defaultPlayer.num)}
        </div>
        <div class="mt-4">
          <h3 class="font-display text-xl font-bold uppercase">${j.country} Home Kit</h3>
          <p class="text-xs text-slate-500 truncate mt-0.5">Options: ${j.players.map(p => `${p.name} #${p.num}`).join(', ')}</p>
          <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <span class="font-bold text-lg text-slate-900">${fmtPrice(j.price)}</span>
            <button onclick="openCustomizer('${j.id}')" class="bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition">
              Select Size &amp; Name
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openCustomizer(id) {
  currentKit = JERSEYS.find(j => j.id === id);
  selectedVersion = 'FAN';
  selectedSize = 'L';
  document.getElementById('patch-checkbox').checked = false;
  document.getElementById('modal-country-badge').innerText = `${currentKit.flag} ${currentKit.country}`;
  document.getElementById('modal-title').innerText = `${currentKit.country} World Cup Jersey`;

  // Default star player & number for this country
  document.getElementById('custom-name').value = currentKit.players[0].name;
  document.getElementById('custom-num').value = currentKit.players[0].num;

  // Render real front jersey photo on a clean white card
  const modalPreview = document.getElementById('modal-jersey-preview');
  modalPreview.className = 'w-52 sm:w-56 h-60 my-4 flex items-center justify-center bg-white rounded-2xl p-3';
  modalPreview.innerHTML = renderJerseyMedia(
    currentKit,
    'w-full h-52 object-contain',
    currentKit.players[0].name,
    currentKit.players[0].num
  );

  renderSizes();
  setOption('version', 'FAN');
  updateLivePrint();
  document.getElementById('customizer-modal').classList.remove('hidden');
}

function closeCustomizer() {
  document.getElementById('customizer-modal').classList.add('hidden');
}

function renderPlayerChips() {
  const currentName = document.getElementById('custom-name').value.toUpperCase();
  const currentNum = Number(document.getElementById('custom-num').value);

  document.getElementById('preset-players').innerHTML = currentKit.players.map(p => {
    const active = currentName === p.name && currentNum === p.num;
    return `
      <button type="button" onclick="pickPlayer('${p.name}', ${p.num})"
        class="text-[11px] font-bold px-2.5 py-1 rounded-md transition ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'}">
        #${p.num} ${p.name}
      </button>
    `;
  }).join('') + `<button type="button" onclick="pickPlayer('', '')" class="bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-md">Clear (Blank)</button>`;
}

function pickPlayer(name, num) {
  document.getElementById('custom-name').value = name;
  document.getElementById('custom-num').value = num;
  updateLivePrint();
}

// Auto-match player name if the client types one of the team's star numbers
function handleNumberInput() {
  const numVal = parseInt(document.getElementById('custom-num').value, 10);
  if (!isNaN(numVal) && currentKit) {
    const matched = currentKit.players.find(p => p.num === numVal);
    if (matched) {
      document.getElementById('custom-name').value = matched.name;
    }
  }
  updateLivePrint();
}

function setOption(type, val) {
  if (type === 'version') {
    selectedVersion = val;
    ['FAN', 'PLAYER'].forEach(v => {
      document.getElementById(`btn-ver-${v}`).className = v === val
        ? 'border-2 border-emerald-600 bg-emerald-50 rounded-lg p-2.5 text-left text-xs'
        : 'border border-slate-200 rounded-lg p-2.5 text-left text-xs';
    });
  }
  updateModalPrice();
}

function renderSizes() {
  document.getElementById('size-buttons').innerHTML = ['S', 'M', 'L', 'XL', 'XXL'].map(s => `
    <button type="button" onclick="selectedSize='${s}'; renderSizes();"
      class="py-2 rounded-lg text-xs font-bold border transition ${selectedSize === s ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-400'}">
      ${s}
    </button>
  `).join('');
}

function updateLivePrint() {
  const name = document.getElementById('custom-name').value.toUpperCase();
  const num = document.getElementById('custom-num').value;
  document.getElementById('modal-print-pill').innerText =
    name || num ? `Print: ${name || 'PLAYER'} #${num || '0'}` : 'Blank Shirt (No Print)';
  renderPlayerChips();
}

function getUnitPrice() {
  const verExtra = selectedVersion === 'PLAYER' ? 8 : 0;
  const patchExtra = document.getElementById('patch-checkbox').checked ? 3 : 0;
  return currentKit.price + verExtra + patchExtra;
}

function updateModalPrice() {
  document.getElementById('modal-price').innerText = fmtPrice(getUnitPrice());
}

function addToCart() {
  cart.push({
    kit: currentKit,
    version: selectedVersion,
    size: selectedSize,
    name: document.getElementById('custom-name').value.toUpperCase() || 'NO PRINT',
    num: document.getElementById('custom-num').value || '-',
    patch: document.getElementById('patch-checkbox').checked,
    unitPrice: getUnitPrice(),
  });
  closeCustomizer();
  renderCart();
  toggleCart(true);
}

function toggleCart(open) {
  document.getElementById('cart-drawer').classList.toggle('hidden', !open);
  document.getElementById('order-success').classList.add('hidden');
}

function renderCart() {
  document.getElementById('cart-badge').innerText = cart.length;
  document.getElementById('drawer-count').innerText = cart.length;
  const itemsEl = document.getElementById('cart-items');

  if (!cart.length) {
    itemsEl.innerHTML = `<div class="text-center text-slate-400 text-sm py-12">Your cart is empty. Pick a country to start!</div>`;
    document.getElementById('cart-total').innerText = fmtPrice(0);
    document.getElementById('bundle-alert').classList.add('hidden');
    return;
  }

  let subtotal = 0;
  itemsEl.innerHTML = cart.map((item, idx) => {
    subtotal += item.unitPrice;
    return `
      <div class="flex gap-3 border border-slate-200 rounded-xl p-3 items-center">
        <div class="w-14 h-14 shrink-0 flex items-center justify-center bg-white rounded-lg border border-slate-100 p-1">
          ${renderJerseyMedia(item.kit, 'w-full h-full object-contain', item.name, item.num)}
        </div>
        <div class="flex-1 text-xs">
          <div class="font-bold text-sm">${item.kit.flag} ${item.kit.country} (${item.size})</div>
          <div class="text-slate-500">${item.version} • ${item.name} #${item.num} ${item.patch ? '+ Patch' : ''}</div>
          <div class="font-bold text-emerald-600 mt-1">${fmtPrice(item.unitPrice)}</div>
        </div>
        <button onclick="cart.splice(${idx},1); renderCart();" class="text-slate-400 hover:text-red-600 text-xs font-bold">Remove</button>
      </div>
    `;
  }).join('');

  const hasBundle = cart.length >= 2;
  document.getElementById('bundle-alert').classList.toggle('hidden', !hasBundle);
  const total = hasBundle ? subtotal * 0.85 : subtotal;
  document.getElementById('cart-total').innerText = fmtPrice(total);
}

async function placeOrder(e) {
  e.preventDefault();
  if (!cart.length) return;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = 'Sending Order...';

  const custName = document.getElementById('cust-name').value.trim();
  const custPhone = document.getElementById('cust-phone').value.trim();
  const custCity = document.getElementById('cust-city').value.trim();
  const custAddress = document.getElementById('cust-address').value.trim();
  const paymentMethod = document.querySelector('input[name="pay"]:checked').value;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice, 0);
  const hasBundle = cart.length >= 2;
  const total = hasBundle ? subtotal * 0.85 : subtotal;

  const isLiveSite = window.location.protocol.startsWith('http')
    && !window.location.hostname.includes('localhost')
    && !window.location.hostname.includes('127.0.0.1');
  const baseUrl = isLiveSite ? window.location.origin : '';

  const orderLines = cart.map((i, idx) =>
    `${idx + 1}. ${i.kit.country} (${i.size} | ${i.version}) - Print: ${i.name} #${i.num}${i.patch ? ' + WC Patch' : ''} | SKU: ${i.kit.sku}-${i.version}-${i.size}\n   Photo: ${i.kit.image || 'N/A'}`
  ).join('\n\n');

  const waLines = cart.map((i, idx) => {
    const kitLink = baseUrl ? `${baseUrl}/kits/${i.kit.id}.html` : (i.kit.image || 'N/A');
    return `${idx + 1}. ${i.kit.country} (${i.size} | ${i.version})\n   Print: ${i.name} #${i.num}${i.patch ? ' + WC Patch' : ''}\n   Kit: ${kitLink}`;
  }).join('\n\n');

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `New Mundial Kits Order - ${custName} (${fmtPrice(total)})`,
        customer_name: custName,
        phone_whatsapp: custPhone,
        city: custCity,
        address: custAddress,
        payment_method: paymentMethod,
        total_amount: fmtPrice(total),
        bundle_discount: hasBundle ? '15% Applied' : 'None',
        order_items_and_skus: orderLines
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Order submission failed');
    }

    const waText = `Hello Mundial Kits! I just placed an order:\n\n${waLines}\n\nTotal: ${fmtPrice(total)} (${paymentMethod})\nName: ${custName}\nCity: ${custCity}\nAddress: ${custAddress}\nPhone: ${custPhone}`;
    const waLink = document.getElementById('wa-confirm-link');
    if (waLink) {
      waLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
    }

    document.getElementById('order-success').classList.remove('hidden');
    e.target.reset();
    cart = [];
    renderCart();
  } catch (err) {
    alert('Could not send order automatically. Please check your internet connection and try again.');
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
  }
}

// Init
renderHeroSlide(0, false);
startHeroCarousel();
renderRegions();
renderCatalog();