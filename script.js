const PRODUCTS_KEY = "nikoraProducts";
const TRACKED_KEY = "nikoraTracked";
const THEME_KEY = "nikoraTheme";
const LOCAL_PRODUCTS_KEY = "nikoraLocalProducts";
const HIDDEN_PRODUCTS_KEY = "nikoraHiddenProducts";

const productCategories = [
  "რძის ნაწარმი",
  "ხორცი",
  "ტკბილეული",
  "სასმელები",
  "პური",
  "კონსერვაცია",
  "შვრია-ბურღული",
  "მაკარონი-ფქვილი",
  "ზეთი",
  "სუნელები",
  "ტკბილი კონსერვაცია",
  "სნექები",
  "ჩაი-ყავა",
  "გაყინულები"
];

const catalogProducts = [];

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

let localProducts = getData(LOCAL_PRODUCTS_KEY, []);

if (!Array.isArray(localProducts)) {
  localProducts = [];
}

localProducts = localProducts.filter(product =>
  product &&
  product.id &&
  (
    String(product.id).startsWith("local-") ||
    String(product.id).startsWith("csv-")
  )
);

let hiddenProducts = getData(HIDDEN_PRODUCTS_KEY, []);

if (!Array.isArray(hiddenProducts)) {
  hiddenProducts = [];
}

let products = [
  ...catalogProducts.filter(product =>
    !hiddenProducts.includes(String(product.id))
  ),
  ...localProducts
];

products = products.filter((product, index, array) =>
  array.findIndex(item =>
    String(item.id) === String(product.id)
  ) === index
);

let tracked = getData(TRACKED_KEY, []);

if (!Array.isArray(tracked)) {
  tracked = [];
}

products = products.map(product => {
  if (product.category === "სხვა" && product.name === "მაკარონი") {
    return {
      ...product,
      category: "მაკარონი-ფქვილი"
    };
  }

  return product;
});

// ძველი პროდუქტებისთვის კოდის აღდგენა კატალოგიდან
tracked = tracked
  .filter(item =>
    products.some(product =>
      String(product.id) === String(item.id)
    )
  )
  .map(item => {
    const originalProduct = products.find(product =>
      String(product.id) === String(item.id)
    );

    return {
      ...originalProduct,
      ...item,
      code: item.code || originalProduct.code || ""
    };
  });

function saveAll() {
  saveData(LOCAL_PRODUCTS_KEY, localProducts);
  saveData(HIDDEN_PRODUCTS_KEY, hiddenProducts);
  saveData(TRACKED_KEY, tracked);
}

// განახლებული მონაცემების შენახვა
saveAll();

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

function updateCategoryDropdowns() {
  const filter = document.getElementById("category-filter");
  const productCategory = document.getElementById("product-category");

  if (filter) {
    const selected = filter.value;
    filter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "ყველა კატეგორია";

    filter.appendChild(allOption);

    productCategories.forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;

      filter.appendChild(option);
    });

    filter.value = productCategories.includes(selected)
      ? selected
      : "all";
  }

  if (productCategory) {
    const selected = productCategory.value;
    productCategory.innerHTML = "";

    productCategories.forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;

      productCategory.appendChild(option);
    });

    productCategory.value = productCategories.includes(selected)
      ? selected
      : productCategories[0];
  }
}

updateCategoryDropdowns();

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
    return 0;
  }

  const parts = dateString.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return 0;
  }

  const expiry = new Date(
    parts[0],
    parts[1] - 1,
    parts[2]
  );

  const today = getToday();

  return Math.round((expiry - today) / 86400000);
}

function getExpiryStatus(days) {
  if (days < 0) return "expired";
  if (days <= 3) return "danger";

  return "safe";
}

function isWarning(item) {
  return getDaysLeft(item.expiryDate) <= 3;
}

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

const todayElement = document.getElementById("today");

if (todayElement) {
  todayElement.textContent = new Intl.DateTimeFormat("ka-GE", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function updateWarningCount() {
  const countElement = document.getElementById("warning-count");

  if (!countElement) return;

  const count = tracked.filter(isWarning).length;

  countElement.textContent = count;

  countElement.style.display = count > 0
    ? "inline-flex"
    : "none";
}

function updateStats() {
  const total = document.getElementById("total-products");
  const trackedCount = document.getElementById("tracked-products");
  const expiring = document.getElementById("expiring-products");
  const expired = document.getElementById("expired-products");

  const dangerCount = tracked.filter(item => {
    const days = getDaysLeft(item.expiryDate);

    return days >= 0 && days <= 3;
  }).length;

  const expiredCount = tracked.filter(item =>
    getDaysLeft(item.expiryDate) < 0
  ).length;

  if (total) total.textContent = products.length;
  if (trackedCount) trackedCount.textContent = tracked.length;
  if (expiring) expiring.textContent = dangerCount;
  if (expired) expired.textContent = expiredCount;
}

function updateEverything() {
  updateStats();
  updateWarningCount();
}

function getProductImage(product) {
  if (product.image) return product.image;

  return "https://placehold.co/400x250?text=Product";
}

// =====================================
// კატალოგის პროდუქტების გამოტანა
// =====================================

function renderProducts() {
  const container = document.getElementById("products-container");

  if (!container) return;

  const searchInput = document.getElementById("search");
  const categoryInput = document.getElementById("category-filter");
  const sortInput = document.getElementById("sort");

  const search = searchInput
    ? searchInput.value.toLowerCase().trim()
    : "";

  const category = categoryInput
    ? categoryInput.value
    : "all";

  const sort = sortInput
    ? sortInput.value
    : "name";

  let filtered = products.filter(product => {
    const matchesName = String(product.name || "")
      .toLowerCase()
      .includes(search);

    const matchesCode = String(product.code || "")
      .toLowerCase()
      .includes(search);

    const matchesCategory =
      category === "all" ||
      product.category === category;

    return (matchesName || matchesCode) && matchesCategory;
  });

  if (sort === "name") {
    filtered.sort((a, b) =>
      String(a.name || "").localeCompare(
        String(b.name || ""),
        "ka"
      )
    );
  }

  if (sort === "name-desc") {
    filtered.sort((a, b) =>
      String(b.name || "").localeCompare(
        String(a.name || ""),
        "ka"
      )
    );
  }

  if (sort === "category") {
    filtered.sort((a, b) =>
      String(a.category || "").localeCompare(
        String(b.category || ""),
        "ka"
      )
    );
  }

  if (sort === "price-low") {
    filtered.sort((a, b) =>
      Number(a.price || 0) - Number(b.price || 0)
    );
  }

  if (sort === "price-high") {
    filtered.sort((a, b) =>
      Number(b.price || 0) - Number(a.price || 0)
    );
  }

  container.innerHTML = "";

  filtered.forEach(product => {
    const alreadyTracked = tracked.some(item =>
      String(item.id) === String(product.id)
    );

    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.className = "product-image";
    image.src = getProductImage(product);
    image.alt = product.name || "პროდუქტი";

    image.onerror = () => {
      image.src = "https://placehold.co/400x250?text=Product";
    };

    const content = document.createElement("div");
    content.className = "product-content";

    const name = document.createElement("h3");
    name.textContent = product.name || "";

    const categoryText = document.createElement("p");
    categoryText.className = "category";
    categoryText.textContent = product.category || "";

    const codeText = document.createElement("p");
    codeText.className = "product-code";

    codeText.textContent = product.code
      ? `კოდი: ${product.code}`
      : "კოდი მითითებული არ არის";

    const price = document.createElement("p");
    price.className = "price";

    price.textContent = product.price
      ? `${product.price} ₾`
      : "ფასი მითითებული არ არის";

    const buttons = document.createElement("div");
    buttons.className = "card-buttons";

    const trackButton = document.createElement("button");
    trackButton.className = "track-btn";

    trackButton.textContent = alreadyTracked
      ? "უკვე დამატებულია"
      : "ვადის მითითება";

    trackButton.disabled = alreadyTracked;

    trackButton.addEventListener("click", () => {
      addToTracking(product);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "წაშლა";

    deleteButton.addEventListener("click", () => {
      if (!confirm(`წავშალოთ ${product.name}?`)) return;

      products = products.filter(item =>
        String(item.id) !== String(product.id)
      );

      localProducts = localProducts.filter(item =>
        String(item.id) !== String(product.id)
      );

      if (
        catalogProducts.some(item =>
          String(item.id) === String(product.id)
        )
      ) {
        if (!hiddenProducts.includes(String(product.id))) {
          hiddenProducts.push(String(product.id));
        }
      }

      tracked = tracked.filter(item =>
        String(item.id) !== String(product.id)
      );

      saveAll();
      renderProducts();
      renderExpiry();
      updateEverything();

      showToast("პროდუქტი წაიშალა");
    });

    buttons.append(trackButton, deleteButton);

    content.append(
      name,
      categoryText,
      codeText,
      price,
      buttons
    );

    card.append(image, content);

    container.appendChild(card);
  });

  const empty = document.getElementById("empty-message");

  if (empty) {
    empty.classList.toggle(
      "hidden",
      filtered.length > 0
    );
  }

  const results = document.getElementById("results-count");

  if (results) {
    results.textContent = `${filtered.length} პროდუქტი`;
  }
}

// =====================================
// პროდუქტის ვადების კონტროლში დამატება
// =====================================

function addToTracking(product) {
  if (
    tracked.some(item =>
      String(item.id) === String(product.id)
    )
  ) {
    showToast("ეს პროდუქტი უკვე დამატებულია");
    return;
  }

  const oldModal = document.getElementById("expiry-date-dialog");

  if (oldModal) oldModal.remove();

  const dialog = document.createElement("div");
  dialog.className = "modal";
  dialog.id = "expiry-date-dialog";

  const content = document.createElement("div");
  content.className = "modal-content";

  const heading = document.createElement("h2");
  heading.textContent = product.name;

  const label = document.createElement("label");
  label.textContent = "როდის გასდის პროდუქტს ვადა?";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.required = true;

  const confirmButton = document.createElement("button");
  confirmButton.className = "primary-btn";
  confirmButton.textContent = "დამატება";
  confirmButton.style.width = "100%";
  confirmButton.style.marginTop = "20px";

  const closeButton = document.createElement("button");
  closeButton.className = "close-modal";
  closeButton.textContent = "×";
  closeButton.type = "button";

  closeButton.addEventListener("click", () => {
    dialog.remove();
  });

  confirmButton.addEventListener("click", () => {
    if (!dateInput.value) {
      showToast("აირჩიე ვადის გასვლის თარიღი");
      return;
    }

    const selected = new Date(
      dateInput.value + "T00:00:00"
    );

    if (
      Number.isNaN(selected.getTime()) ||
      selected < getToday() ||
      selected.getFullYear() < 2020 ||
      selected.getFullYear() > 2100
    ) {
      showToast("მიუთითე სწორი, დღევანდელი ან მომავალი თარიღი");
      return;
    }

    // აქ კოდიც გადადის ვადების კონტროლში
    const trackedProduct = {
      ...product,
      code: product.code || "",
      expiryDate: dateInput.value,
      notificationShown: false
    };

    tracked.push(trackedProduct);

    saveAll();

    dialog.remove();

    renderProducts();
    renderExpiry();
    updateEverything();

    showToast("პროდუქტი ვადების კონტროლში დაემატა");

    checkNotifications();
  });

  content.append(
    closeButton,
    heading,
    label,
    dateInput,
    confirmButton
  );

  dialog.appendChild(content);

  document.body.appendChild(dialog);
}

// =====================================
// ვადების კონტროლის პროდუქტების გამოტანა
// =====================================

function renderExpiry() {
  const container = document.getElementById("expiry-container");

  if (!container) return;

  const searchInput = document.getElementById("search");
  const filterInput = document.getElementById("expiry-filter");
  const sortInput = document.getElementById("expiry-sort");

  const search = searchInput
    ? searchInput.value.toLowerCase().trim()
    : "";

  const filter = filterInput
    ? filterInput.value
    : "all";

  const sort = sortInput
    ? sortInput.value
    : "nearest";

  // ძებნა სახელით ან კოდით
  let filtered = tracked.filter(item => {
    const matchesName = String(item.name || "")
      .toLowerCase()
      .includes(search);

    const matchesCode = String(item.code || "")
      .toLowerCase()
      .includes(search);

    return matchesName || matchesCode;
  });

  if (filter === "danger") {
    filtered = filtered.filter(item => {
      const days = getDaysLeft(item.expiryDate);

      return days >= 0 && days <= 3;
    });
  }

  if (filter === "safe") {
    filtered = filtered.filter(item =>
      getDaysLeft(item.expiryDate) > 3
    );
  }

  if (filter === "expired") {
    filtered = filtered.filter(item =>
      getDaysLeft(item.expiryDate) < 0
    );
  }

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
    const status = getExpiryStatus(days);

    const card = document.createElement("article");
    card.className = "product-card";

    if (status !== "safe") {
      card.classList.add("expiring");
    }

    const image = document.createElement("img");
    image.className = "product-image";
    image.src = getProductImage(product);
    image.alt = product.name || "პროდუქტი";

    image.onerror = () => {
      image.src = "https://placehold.co/400x250?text=Product";
    };

    const content = document.createElement("div");
    content.className = "product-content";

    const name = document.createElement("h3");
    name.textContent = product.name || "";

    const category = document.createElement("p");
    category.className = "category";
    category.textContent = product.category || "";

    // პროდუქტის კოდის ჩვენება
    const codeText = document.createElement("p");
    codeText.className = "product-code";

    codeText.textContent = product.code
      ? `კოდი: ${product.code}`
      : "კოდი მითითებული არ არის";

    const date = document.createElement("p");
    date.className = "expiry-date";

    const dateParts = String(product.expiryDate || "")
      .split("-")
      .map(Number);

    if (
      dateParts.length === 3 &&
      dateParts.every(Number.isFinite)
    ) {
      date.textContent = "ვადის გასვლა: " +
        new Intl.DateTimeFormat("ka-GE").format(
          new Date(
            dateParts[0],
            dateParts[1] - 1,
            dateParts[2]
          )
        );
    } else {
      date.textContent = "ვადის თარიღი მითითებული არ არის";
    }

    const badge = document.createElement("span");
    badge.className = "days-left";

    if (status === "danger") {
      badge.classList.add("danger");
      badge.textContent = `⚠ დარჩენილია ${days} დღე`;
    } else if (status === "expired") {
      badge.classList.add("expired");
      badge.textContent = "ვადა გასულია";
    } else {
      badge.textContent = `დარჩენილია ${days} დღე`;
    }

    const buttons = document.createElement("div");
    buttons.className = "card-buttons";

    // თარიღის შეცვლა
    const edit = document.createElement("button");
    edit.className = "track-btn";
    edit.textContent = "თარიღის შეცვლა";

    edit.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "date";
      input.value = product.expiryDate || "";

      const save = document.createElement("button");
      save.className = "track-btn";
      save.textContent = "შენახვა";

      const cancel = document.createElement("button");
      cancel.className = "delete-btn";
      cancel.textContent = "გაუქმება";

      buttons.replaceChildren(input, save, cancel);

      cancel.addEventListener("click", () => {
        renderExpiry();
      });

      save.addEventListener("click", () => {
        if (!input.value) {
          showToast("აირჩიე თარიღი");
          return;
        }

        const selected = new Date(
          input.value + "T00:00:00"
        );

        if (
          Number.isNaN(selected.getTime()) ||
          selected < getToday() ||
          selected.getFullYear() > 2100
        ) {
          showToast("მიუთითე სწორი მომავალი თარიღი");
          return;
        }

        product.expiryDate = input.value;
        product.notificationShown = false;

        const trackedIndex = tracked.findIndex(item =>
          String(item.id) === String(product.id)
        );

        if (trackedIndex !== -1) {
          tracked[trackedIndex] = product;
        }

        saveAll();

        renderExpiry();
        updateEverything();
        checkNotifications();

        showToast("თარიღი შეიცვალა");
      });
    });

    // ვადების კონტროლიდან ამოღება
    const remove = document.createElement("button");
    remove.className = "delete-btn";
    remove.textContent = "ამოღება";

    remove.addEventListener("click", () => {
      if (!confirm("ამოვიღოთ პროდუქტი ვადების კონტროლიდან?")) {
        return;
      }

      tracked = tracked.filter(item =>
        String(item.id) !== String(product.id)
      );

      saveAll();

      renderExpiry();
      renderProducts();
      updateEverything();

      showToast("პროდუქტი ამოღებულია");
    });

    buttons.append(edit, remove);

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

  const empty = document.getElementById("empty-message");

  if (empty) {
    empty.classList.toggle(
      "hidden",
      filtered.length > 0
    );
  }
}

// =====================================
// ახალი პროდუქტის დამატების მოდალი
// =====================================

const addButton = document.getElementById("add-product-btn");
const modal = document.getElementById("product-modal");
const closeModal = document.getElementById("close-modal");

if (addButton && modal) {
  addButton.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
}

if (closeModal && modal) {
  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

if (modal) {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });
}

// =====================================
// ახალი პროდუქტის შენახვა
// =====================================

const productForm = document.getElementById("product-form");

if (productForm) {
  productForm.addEventListener("submit", event => {
    event.preventDefault();

    const nameInput = document.getElementById("product-name");
    const categoryInput = document.getElementById("product-category");
    const priceInput = document.getElementById("product-price");
    const imageInput = document.getElementById("product-image");
    const codeInput = document.getElementById("product-code");

    if (
      !nameInput ||
      !categoryInput ||
      !priceInput ||
      !imageInput
    ) {
      showToast("ფორმის რომელიმე საჭირო ველი ვერ მოიძებნა");
      return;
    }

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const price = Number(priceInput.value);
    const image = imageInput.value.trim();

    // კოდი არასავალდებულოა
    const code = codeInput
      ? codeInput.value.trim()
      : "";

    if (!name) {
      showToast("შეიყვანე პროდუქტის სახელი");
      return;
    }

    if (!productCategories.includes(category)) {
      showToast("აირჩიე სწორი კატეგორია");
      return;
    }

    if (price < 0 || !Number.isFinite(price)) {
      showToast("შეიყვანე სწორი ფასი");
      return;
    }

    const newProduct = {
      id: `local-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      name,
      category,
      price,
      image,
      code
    };

    products.push(newProduct);
    localProducts.push(newProduct);

    saveAll();

    productForm.reset();

    updateCategoryDropdowns();

    if (modal) {
      modal.classList.add("hidden");
    }

    renderProducts();
    updateEverything();

    showToast("ახალი პროდუქტი დაემატა");
  });
}

// =====================================
// ძებნა, ფილტრები და დალაგება
// =====================================

[
  "search",
  "category-filter",
  "sort",
  "expiry-filter",
  "expiry-sort"
].forEach(id => {
  const element = document.getElementById(id);

  if (!element) return;

  element.addEventListener("input", () => {
    renderProducts();
    renderExpiry();
  });

  element.addEventListener("change", () => {
    renderProducts();
    renderExpiry();
  });
});

// ფილტრების განულება
const resetFilters = document.getElementById("reset-filters");

if (resetFilters) {
  resetFilters.addEventListener("click", () => {
    const search = document.getElementById("search");
    const category = document.getElementById("category-filter");
    const sort = document.getElementById("sort");

    if (search) search.value = "";
    if (category) category.value = "all";
    if (sort) sort.value = "name";

    renderProducts();
  });
}

// =====================================
// CSV ფაილის იმპორტი
// =====================================

const catalogFile = document.getElementById("catalog-file");

if (catalogFile) {
  catalogFile.addEventListener("change", async event => {
    const file = event.target.files[0];

    if (!file) return;

    try {
      const fileText = (await file.text()).replace(/^\uFEFF/, "");

      function parseCSV(text) {
        const rows = [];
        let row = [];
        let value = "";
        let insideQuotes = false;

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const next = text[i + 1];

          if (
            char === '"' &&
            insideQuotes &&
            next === '"'
          ) {
            value += '"';
            i++;
          } else if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === "," && !insideQuotes) {
            row.push(value.trim());
            value = "";
          } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
          ) {
            if (char === "\r" && next === "\n") {
              i++;
            }

            row.push(value.trim());

            if (row.some(cell => cell !== "")) {
              rows.push(row);
            }

            row = [];
            value = "";
          } else {
            value += char;
          }
        }

        row.push(value.trim());

        if (row.some(cell => cell !== "")) {
          rows.push(row);
        }

        return rows;
      }

      const rows = parseCSV(fileText);

      if (rows.length < 2) {
        throw new Error("CSV ფაილში პროდუქტები არ მოიძებნა");
      }

      const headers = rows[0].map(header =>
        header.trim().toLowerCase()
      );

      function findColumn(...names) {
        return headers.findIndex(header =>
          names.includes(header)
        );
      }

      const codeIndex = findColumn(
        "კოდი",
        "code",
        "barcode",
        "შტრიხკოდი"
      );

      const nameIndex = findColumn(
        "პროდუქტის სახელი",
        "name",
        "product",
        "სახელი"
      );

      const categoryIndex = findColumn(
        "კატეგორია",
        "category"
      );

      const priceIndex = findColumn(
        "ფასი",
        "price"
      );

      const weightIndex = findColumn(
        "წონა",
        "weight"
      );

      const imageIndex = findColumn(
        "image",
        "სურათი"
      );

      if (
        nameIndex === -1 ||
        categoryIndex === -1
      ) {
        throw new Error(
          "პროდუქტის სახელი ან კატეგორია ვერ მოიძებნა"
        );
      }

      let added = 0;
      let skipped = 0;

      rows.slice(1).forEach(values => {
        const name = (values[nameIndex] || "").trim();

        const category = (
          values[categoryIndex] || ""
        ).trim();

        if (
          !name ||
          !productCategories.includes(category)
        ) {
          skipped++;
          return;
        }

        const rawPrice = priceIndex === -1
          ? ""
          : (values[priceIndex] || "").trim();

        const price = rawPrice
          ? Number(rawPrice.replace(",", "."))
          : 0;

        const product = {
          id: `csv-${Date.now()}-${added}-${Math.floor(Math.random() * 100000)}`,
          name,
          category,

          price: Number.isFinite(price) && price >= 0
            ? price
            : 0,

          image: imageIndex === -1
            ? ""
            : (values[imageIndex] || "").trim(),

          code: codeIndex === -1
            ? ""
            : (values[codeIndex] || "").trim(),

          weight: weightIndex === -1
            ? ""
            : (values[weightIndex] || "").trim()
        };

        const alreadyExists = products.some(item =>
          String(item.name).toLowerCase() ===
            name.toLowerCase() &&
          item.category === category
        );

        if (alreadyExists) {
          skipped++;
          return;
        }

        products.push(product);
        localProducts.push(product);

        added++;
      });

      saveAll();

      renderProducts();
      updateEverything();

      showToast(
        `${added} პროდუქტი დაემატა. გამოტოვებულია: ${skipped}`
      );

    } catch (error) {
      console.error("CSV Import Error:", error);

      showToast("CSV ფაილის წაკითხვა ვერ მოხერხდა");
    }

    event.target.value = "";
  });
}

// =====================================
// ბრაუზერის შეტყობინებები
// =====================================

function checkNotifications() {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") return;

  let changed = false;

  tracked.forEach(item => {
    const days = getDaysLeft(item.expiryDate);

    if (days <= 3 && !item.notificationShown) {
      const message = days < 0
        ? `${item.name} — ვადა გასულია`
        : days === 0
          ? `${item.name} — ვადა დღეს იწურება`
          : `${item.name} — დარჩენილია ${days} დღე`;

      new Notification("Nikora Expiry Tracker", {
        body: message
      });

      item.notificationShown = true;

      changed = true;
    }
  });

  if (changed) {
    saveAll();
  }
}

// =====================================
// გვერდის ჩატვირთვა
// =====================================

renderProducts();
renderExpiry();
updateEverything();
checkNotifications();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    renderExpiry();
    renderProducts();
    updateEverything();
    checkNotifications();
  }
});

window.addEventListener("focus", () => {
  renderExpiry();
  renderProducts();
  updateEverything();
  checkNotifications();
});

// =====================================
// შეტყობინებების ჩართვა
// =====================================

const notificationButton = document.getElementById(
  "enable-notifications"
);

if (notificationButton) {
  notificationButton.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      showToast(
        "შენი ბრაუზერი შეტყობინებებს არ უჭერს მხარს"
      );

      return;
    }

    try {
      const permission = await Notification.requestPermission();

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
// მობილური მენიუ
// =====================================

const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("active");
    navLinks.classList.toggle("open");

    menuToggle.setAttribute(
      "aria-expanded",
      navLinks.classList.contains("open")
    );
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menuToggle.classList.remove("active");
      navLinks.classList.remove("open");

      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}