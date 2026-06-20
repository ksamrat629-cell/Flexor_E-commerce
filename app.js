(() => {
  const CART_KEY = "flexorCart";
  const PRODUCT_INDEX = (window.FLEXOR_PRODUCTS || []).reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const parsePrice = (text) => {
    const digits = (text || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  };

  const getCart = () => {
    try {
      const value = localStorage.getItem(CART_KEY);
      const parsed = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const saveCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  };

  const cartCount = () => getCart().reduce((sum, item) => sum + (item.qty || 0), 0);

  const updateCartLabels = () => {
    const total = cartCount();
    const cartLinks = [...document.querySelectorAll("a, button")].filter((el) =>
      (el.textContent || "").trim().toLowerCase().startsWith("my cart")
    );

    cartLinks.forEach((link) => {
      link.textContent = `My Cart (${total})`;
    });
  };

  const extractProduct = (button) => {
    const card = button.closest(".product, .collection-item, .card");
    if (!card) {
      return null;
    }

    const nameEl = card.querySelector("h3, h5, .card-title");
    const priceEl = card.querySelector(".price, .collection-price, h6");
    const imageEl = card.querySelector("img");

    const id = (nameEl?.textContent || "item").trim().toLowerCase().replace(/\s+/g, "-");
    const fallback = PRODUCT_INDEX[id] || {};
    return {
      id,
      name: fallback.name || (nameEl?.textContent || "Flexor Item").trim(),
      price: fallback.price || parsePrice(priceEl?.textContent || ""),
      image: imageEl?.getAttribute("src") || "",
      qty: 1
    };
  };

  const addToCart = (product) => {
    if (!product) {
      return;
    }

    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push(product);
    }

    saveCart(cart);
    updateCartLabels();
  };

  const wireAddToCartButtons = () => {
    const triggers = [...document.querySelectorAll("a, button")].filter((el) =>
      /(add to cart)/i.test((el.textContent || "").trim())
    );

    triggers.forEach((button) => {
      button.addEventListener("click", (event) => {
        if (button.tagName.toLowerCase() === "a") {
          event.preventDefault();
        }

        const label = button.textContent;
        addToCart(extractProduct(button));
        button.textContent = "Added";
        window.setTimeout(() => {
          button.textContent = label;
        }, 1200);
      });
    });
  };

  const wireCollectionFilters = () => {
    const filterButtons = [...document.querySelectorAll(".filter-btn[data-filter]")];
    const items = [...document.querySelectorAll(".collection-item")];
    if (!filterButtons.length || !items.length) {
      return;
    }

    const matchesFilter = (item, filter) => {
      if (filter === "all") {
        return true;
      }

      const tags = [...item.querySelectorAll(".tag")]
        .map((tag) => tag.textContent.toLowerCase())
        .join(" ");
      const badge = (item.querySelector(".collection-badge")?.textContent || "").toLowerCase();

      if (filter === "new") {
        return badge.includes("new");
      }

      return tags.includes(filter);
    };

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        const filter = button.getAttribute("data-filter");
        items.forEach((item) => {
          item.style.display = matchesFilter(item, filter) ? "" : "none";
        });
      });
    });
  };

  const wireSearch = () => {
    const searchInput = document.querySelector(".futuristic-input");
    const cards = [...document.querySelectorAll(".card")];

    if (!searchInput || !cards.length) {
      return;
    }

    searchInput.addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();

      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.parentElement.style.display = text.includes(query) ? "" : "none";
      });
    });
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const cartItemRow = (item) => {
    const itemTotal = (item.price || 0) * (item.qty || 0);
    return `
      <tr>
        <td>
          <div class="cart-item">
            ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ""}
            <span>${item.name}</span>
          </div>
        </td>
        <td>
          <div class="qty-group">
            <button class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
          </div>
        </td>
        <td>${formatCurrency(item.price)}</td>
        <td>${formatCurrency(itemTotal)}</td>
        <td><button class="remove-btn" data-action="remove" data-id="${item.id}">Remove</button></td>
      </tr>
    `;
  };

  const renderCartPage = () => {
    const container = document.getElementById("cartContainer");
    if (!container) {
      return;
    }

    const cart = getCart();
    if (!cart.length) {
      container.innerHTML = `<p class="empty-cart">Your cart is empty. Add products to get started.</p>`;
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
    container.innerHTML = `
      <table class="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${cart.map(cartItemRow).join("")}
        </tbody>
      </table>
      <div class="cart-summary">
        <div class="cart-total">Subtotal: ${formatCurrency(subtotal)}</div>
        <div class="cart-actions">
          <button class="clear-btn" id="clearCartBtn">Clear Cart</button>
          <button class="checkout-btn" id="checkoutBtn">Checkout</button>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        const current = getCart();
        const item = current.find((entry) => entry.id === id);

        if (action === "increase" && item) {
          item.qty += 1;
        } else if (action === "decrease" && item) {
          item.qty = Math.max(1, item.qty - 1);
        } else if (action === "remove") {
          saveCart(current.filter((entry) => entry.id !== id));
          updateCartLabels();
          renderCartPage();
          return;
        }

        saveCart(current);
        updateCartLabels();
        renderCartPage();
      });
    });

    const clearBtn = document.getElementById("clearCartBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        saveCart([]);
        updateCartLabels();
        renderCartPage();
      });
    }

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        alert("Checkout flow can be connected to payment in Phase 3.");
      });
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    updateCartLabels();
    wireAddToCartButtons();
    wireCollectionFilters();
    wireSearch();
    renderCartPage();
  });
})();
