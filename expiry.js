
const PRODUCTS_KEY = "nikoraProducts";
const LOCAL_PRODUCTS_KEY = "nikoraLocalProducts";
const TRACKED_KEY = "nikoraTracked";
const THEME_KEY = "nikoraTheme";

// =====================================
// LOCAL STORAGE
// =====================================

function getData(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.error("მონაცემების წაკითხვის შეცდომა:", error);
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("მონაცემების შენახვის შეცდომა:", error);
    showToast("მონაცემების შენახვა ვერ მოხერხდა");
  }
}

let tracked = getData(TRACKED_KEY, []);

if (!Array.isArray(tracked)) {
  tracked = [];
}

// კატალოგის პროდუქტების წაკითხვა კოდების აღსადგენად
function getAllCatalogProducts() {
  const localProducts = getData(LOCAL_PRODUCTS_KEY, []);
  const savedProducts = getData(PRODUCTS_KEY, []);

  return [
    ...(Array.isArray(localProducts) ? localProducts : []),
    ...(Array.isArray(savedProducts) ? savedProducts : [])
  ];
}

// ძველი tracked ჩანაწერებისთვის კოდის მოძებნა
function restoreProductCodes() {
  const catalog = getAllCatalogProducts();
  let changed = false;

  tracked = tracked.map(item => {
    const original = catalog.find(product =>
      String(product.id) === String(item.id)
    ) || catalog.find(product =>
      String(product.name || "").trim().toLowerCase() ===
      String(item.name || "").trim().toLowerCase()
    );

    if (!item.code && original && original.code) {
      changed = true;

      return {
        ...item,
        code: original.code
      };
    }

    return {
      ...item,
      code: item.code || ""
    };
  });

  if (changed) {
    saveData(TRACKED_KEY, tracked);
  }
}

restoreProductCodes();

// =====================================
// HAMBURGER MENU
// =====================================

const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("header-nav");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", event => {
    if (
      !navLinks.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      navLinks.classList.remove("open");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

// =====================================
// DATE FUNCTIONS
// =====================================

function getToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}

function getDaysLeft(dateString) {
  if (!dateString || typeof dateString !== "string") {
    return NaN;
  }

  const parts = dateString.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return NaN;
  }

  const expiry = new Date(
    parts[0],
    parts[1] - 1,
    parts[2]
  );

  if (
    expiry.getFullYear() !== parts[0] ||
    expiry.getMonth() !== parts[1] - 1 ||
    expiry.getDate() !== parts[2]
  ) {
    return NaN;
  }

  return Math.round(
    (expiry - getToday()) / 86400000
  );
}

function formatDate(dateString) {
  if (!dateString) {
    return "თარიღი მითითებული არ არის";
  }

  const parts = dateString.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return "არასწორი თარიღი";
  }

  return new Intl.DateTimeFormat("ka-GE").format(
    new Date(parts[0], parts[1] - 1, parts[2])
  );
}

function isWarning(product) {
  const days = getDaysLeft(product.expiryDate);

  return days >= 0 && days <= 3;
}

// =====================================
// TOAST
// =====================================

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// =====================================
// THEME
// =====================================

function applyTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "dark";

  document.body.classList.toggle(
    "light",
    theme === "light"
  );

  const button = document.getElementById("theme-toggle");

  if (button) {
    button.textContent = theme === "light" ? "🌙" : "☀️";
  }
}

const themeButton = document.getElementById("theme-toggle");

if (themeButton) {
  themeButton.addEventListener("click", () => {
    const current = localStorage.getItem(THEME_KEY) || "dark";
    const next = current === "dark" ? "light" : "dark";

    localStorage.setItem(THEME_KEY, next);
    applyTheme();
  });
}

applyTheme();

// =====================================
// TODAY
// =====================================

function updateToday() {
  const todayElement = document.getElementById("today");

  if (!todayElement) return;

  todayElement.textContent =
    new Intl.DateTimeFormat("ka-GE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date());
}

// =====================================
// STATISTICS
// =====================================

function updateStats() {
  const trackedCount =
    document.getElementById("tracked-products");

  const expiringCount =
    document.getElementById("expiring-products");

  const expiredCount =
    document.getElementById("expired-products");

  const warningCount =
    document.getElementById("warning-count");

  const expiring = tracked.filter(isWarning).length;

  const expired = tracked.filter(product =>
    getDaysLeft(product.expiryDate) < 0
  ).length;

  if (trackedCount) {
    trackedCount.textContent = tracked.length;
  }

  if (expiringCount) {
    expiringCount.textContent = expiring;
  }

  if (expiredCount) {
    expiredCount.textContent = expired;
  }

  if (warningCount) {
    warningCount.textContent = expiring;
    warningCount.style.display =
      expiring > 0 ? "inline-flex" : "none";
  }
}

// =====================================
// PRODUCT IMAGE
// =====================================

function getProductImage(product) {
  return product.image ||
    "https://placehold.co/400x250?text=Product";
}

// =====================================
// RENDER EXPIRY PRODUCTS
// =====================================

function renderExpiry() {
  const container =
    document.getElementById("expiry-container");

  if (!container) return;

  const searchInput = document.getElementById("search");
  const filterSelect = document.getElementById("expiry-filter");
  const sortSelect = document.getElementById("expiry-sort");

  const search = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const filter = filterSelect ? filterSelect.value : "all";
  const sort = sortSelect ? sortSelect.value : "nearest";

  // ძებნა სახელით ან კოდით
  let filtered = tracked.filter(product => {
    const name = String(product.name || "").toLowerCase();
    const code = String(product.code || "").toLowerCase();

    return name.includes(search) || code.includes(search);
  });

  // FILTER

  if (filter === "danger") {
    filtered = filtered.filter(product => {
      const days = getDaysLeft(product.expiryDate);
      return days >= 0 && days <= 3;
    });
  }

  if (filter === "safe") {
    filtered = filtered.filter(product =>
      getDaysLeft(product.expiryDate) > 3
    );
  }

  if (filter === "expired") {
    filtered = filtered.filter(product =>
      getDaysLeft(product.expiryDate) < 0
    );
  }

  // SORT

  if (sort === "nearest") {
    filtered.sort((a, b) =>
      getDaysLeft(a.expiryDate) - getDaysLeft(b.expiryDate)
    );
  }

  if (sort === "farthest") {
    filtered.sort((a, b) =>
      getDaysLeft(b.expiryDate) - getDaysLeft(a.expiryDate)
    );
  }

  if (sort === "name") {
    filtered.sort((a, b) =>
      String(a.name || "").localeCompare(
        String(b.name || ""),
        "ka"
      )
    );
  }

  container.innerHTML = "";

  filtered.forEach(product => {
    const days = getDaysLeft(product.expiryDate);

    const card = document.createElement("article");
    card.className = "product-card";

    if (isWarning(product)) {
      card.classList.add("expiring");
    }

    if (days < 0) {
      card.classList.add("expired");
    }

    // IMAGE

    const image = document.createElement("img");

    image.className = "product-image";
    image.src = getProductImage(product);
    image.alt = product.name || "პროდუქტი";

    image.onerror = () => {
      image.src =
        "https://placehold.co/400x250?text=Product";
    };

    // CONTENT

    const content = document.createElement("div");
    content.className = "product-content";

    const name = document.createElement("h3");
    name.textContent = product.name || "უსახელო პროდუქტი";

    const category = document.createElement("p");
    category.className = "category";
    category.textContent = product.category || "სხვა";

    // PRODUCT CODE — ეს ნაწილი ამატებს კოდს ქარდზე
    const codeText = document.createElement("p");
    codeText.className = "product-code";

    codeText.textContent = product.code
      ? `კოდი: ${product.code}`
      : "კოდი მითითებული არ არის";

    const date = document.createElement("p");
    date.className = "expiry-date";
    date.textContent =
      "ვადის გასვლა: " + formatDate(product.expiryDate);

    // DAYS BADGE

    const badge = document.createElement("span");
    badge.className = "days-left";

    if (!Number.isFinite(days)) {
      badge.classList.add("danger");
      badge.textContent = "თარიღი არასწორია";
    } else if (days < 0) {
      badge.classList.add("expired");
      badge.textContent = "ვადა გასულია";
    } else if (days <= 3) {
      badge.classList.add("danger");

      badge.textContent = days === 0
        ? "⚠ ვადა დღეს გასდის!"
        : `⚠ დარჩენილია ${days} დღე`;
    } else {
      badge.textContent = `დარჩენილია ${days} დღე`;
    }

    // BUTTONS

    const buttons = document.createElement("div");
    buttons.className = "card-buttons";

    const editButton = document.createElement("button");
    editButton.className = "track-btn";
    editButton.textContent = "ვადის შეცვლა";

    editButton.addEventListener("click", () => {
      showEditForm(product, content);
    });

    const removeButton = document.createElement("button");
    removeButton.className = "delete-btn";
    removeButton.textContent = "ამოღება";

    removeButton.addEventListener("click", () => {
      if (!confirm(
        `ნამდვილად გინდა ${product.name}-ის ამოღება?`
      )) {
        return;
      }

      tracked = tracked.filter(item =>
        String(item.id) !== String(product.id)
      );

      saveData(TRACKED_KEY, tracked);

      renderExpiry();
      updateStats();

      showToast("პროდუქტი ამოღებულია");
    });

    buttons.append(editButton, removeButton);

    // კოდი ჩასმულია კატეგორიასა და თარიღს შორის
    content.append(
      name,
      category,
      codeText,
      date,
      badge,
      buttons
    );

    card.append(image, content);
    container.appendChild(card);
  });

  const resultsCount =
    document.getElementById("results-count");

  if (resultsCount) {
    resultsCount.textContent =
      `${filtered.length} პროდუქტი`;
  }

  const empty =
    document.getElementById("empty-message");

  if (empty) {
    empty.classList.toggle(
      "hidden",
      filtered.length > 0
    );

    if (filtered.length === 0) {
      empty.textContent = tracked.length === 0
        ? "ჯერ არ გაქვს გადატანილი პროდუქტები."
        : "ასეთი პროდუქტი ვერ მოიძებნა.";
    }
  }
}

// =====================================
// EDIT EXPIRY DATE
// =====================================

function showEditForm(product, content) {
  const oldForm = content.querySelector(".edit-area");

  if (oldForm) return;

  const form = document.createElement("div");
  form.className = "edit-area";

  const input = document.createElement("input");
  input.type = "date";
  input.value = product.expiryDate || "";

  const saveButton = document.createElement("button");
  saveButton.className = "track-btn edit-save";
  saveButton.textContent = "შენახვა";

  const cancelButton = document.createElement("button");
  cancelButton.className = "edit-cancel";
  cancelButton.textContent = "გაუქმება";

  saveButton.addEventListener("click", () => {
    if (!input.value) {
      showToast("აირჩიე თარიღი");
      return;
    }

    const days = getDaysLeft(input.value);

    if (!Number.isFinite(days) || days < 0) {
      showToast("მიუთითე დღევანდელი ან მომავალი თარიღი");
      return;
    }

    product.expiryDate = input.value;
    product.notificationShown = false;

    saveData(TRACKED_KEY, tracked);

    renderExpiry();
    updateStats();
    checkNotifications();

    showToast("ვადა წარმატებით შეიცვალა");
  });

  cancelButton.addEventListener("click", () => {
    form.remove();
  });

  form.append(input, saveButton, cancelButton);
  content.appendChild(form);
}

// =====================================
// NOTIFICATIONS
// =====================================

function checkNotifications() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  let changed = false;

  tracked.forEach(product => {
    const days = getDaysLeft(product.expiryDate);

    if (
      days >= 0 &&
      days <= 3 &&
      !product.notificationShown
    ) {
      const message = days === 0
        ? `${product.name}-ს ვადა დღეს გასდის!`
        : `${product.name}-ს ვადა ${days} დღეში გასდის!`;

      new Notification("Nikora Expiry Tracker", {
        body: message
      });

      product.notificationShown = true;
      changed = true;
    }
  });

  if (changed) {
    saveData(TRACKED_KEY, tracked);
  }
}

// =====================================
// ENABLE NOTIFICATIONS
// =====================================

const notificationButton =
  document.getElementById("enable-notifications");

if (notificationButton) {
  notificationButton.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      showToast("ბრაუზერი შეტყობინებებს არ უჭერს მხარს");
      return;
    }

    try {
      const permission =
        await Notification.requestPermission();

      if (permission === "granted") {
        showToast("შეტყობინებები ჩართულია!");
        checkNotifications();
      } else {
        showToast("შეტყობინებების ნებართვა არ გაიცა");
      }
    } catch (error) {
      showToast("შეტყობინებების ჩართვა ვერ მოხერხდა");
    }
  });
}

// =====================================
// SEARCH AND FILTERS
// =====================================

const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("expiry-filter");
const sortSelect = document.getElementById("expiry-sort");

if (searchInput) {
  searchInput.addEventListener("input", renderExpiry);
}

if (filterSelect) {
  filterSelect.addEventListener("change", renderExpiry);
}

if (sortSelect) {
  sortSelect.addEventListener("change", renderExpiry);
}

// =====================================
// INITIALIZE
// =====================================

function initializeExpiryPage() {
  tracked = getData(TRACKED_KEY, []);

  if (!Array.isArray(tracked)) {
    tracked = [];
  }

  restoreProductCodes();
  updateToday();
  renderExpiry();
  updateStats();
  checkNotifications();
}

initializeExpiryPage();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    initializeExpiryPage();
  }
});

window.addEventListener("focus", initializeExpiryPage);
