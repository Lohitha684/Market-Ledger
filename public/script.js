const productsContainer = document.getElementById("products");
const message = document.getElementById("message");
const wishlistSection = document.getElementById("wishlist-section");
const wishlistProductsContainer = document.getElementById("wishlist-products");
const wishlistMessage = document.getElementById("wishlist-message");
const wishlistCount = document.getElementById("wishlist-count");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const sortFilter = document.getElementById("sort-filter");

let allProducts = [];
let cart = [];
// Load wishlist product IDs from localStorage
let wishlist = [];

try {
    wishlist = JSON.parse(
        localStorage.getItem("marketLedgerWishlist") || "[]"
    );

    if (!Array.isArray(wishlist)) {
        wishlist = [];
    }
} catch (error) {
    wishlist = [];
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getImage(product) {
    if (product.image && typeof product.image === "string") {
        return product.image;
    }

    const images = {
        "Wireless Headphones":
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
        "Smart Watch":
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
        "Travel Backpack":
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
        "Bluetooth Speaker":
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
        "Wireless Mouse":
            "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600",
        "Running Shoes":
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        "Cotton T-Shirt":
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
        "Stainless Steel Water Bottle":
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600",
        "Adjustable Laptop Stand":
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600",
        "LED Desk Lamp":
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
        "Classic Sunglasses":
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600"
    };

    return images[product.name] ||
        "https://placehold.co/600x400/e9ebf5/20243a?text=Product";
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

async function loadProducts() {
    productsContainer.innerHTML = "";
    message.textContent = "Loading products...";

    try {
        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error(`Products API returned HTTP ${response.status}`);
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("The products API did not return a product list.");
        }

        allProducts = products;

        if (allProducts.length === 0) {
            message.textContent =
                "No products found. Add products to your MongoDB collection.";
            return;
        }

        message.textContent = `${allProducts.length} products available.`;
        renderProducts();

    } catch (error) {
        console.error("Product loading failed:", error);

        message.textContent =
            "Unable to load products. Check that the backend is running.";

        productsContainer.innerHTML = `
            <p>We couldn't load the product catalogue.
            Please refresh the page and try again.</p>
        `;
    }
}

 function renderProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortValue = sortFilter.value;

    let filteredProducts = allProducts.filter(product => {
        const matchesName =
            String(product.name || "").toLowerCase().includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        return matchesName && matchesCategory;
    });

    if (sortValue === "low") {
        filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortValue === "high") {
        filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortValue === "name") {
        filteredProducts.sort((a, b) =>
            String(a.name).localeCompare(String(b.name))
        );
    }

    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = "";
        message.textContent = "No products match your search.";
        return;
    }

    message.textContent = `${filteredProducts.length} products available.`;

    productsContainer.innerHTML = filteredProducts.map((product, index) => {
        const stock = Math.max(0, Number(product.stock) || 0);
        const image = escapeHTML(getImage(product));
        const name = escapeHTML(product.name);
        const category = escapeHTML(product.category || "General");

        const productId = escapeHTML(
            product._id?.$oid || product._id || ""
        );

        return `
    <article class="product-card">

        <button
            class="wishlist-heart-button ${
                wishlist.includes(String(productId)) ? "active" : ""
            }"
            data-wishlist-id="${productId}"
            title="Add or remove from wishlist"
            aria-label="Toggle wishlist"
        >
            ${wishlist.includes(String(productId)) ? "♥" : "♡"}
        </button>

        <img
            class="product-image"
            src="${image}"
            alt="${name}"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://placehold.co/600x400/e9ebf5/20243a?text=Product+Image';"
        >

        <div class="product-details">

            <span class="category-label">${category}</span>

            <h3>${name}</h3>

            <p class="product-price">
                ₹${formatPrice(product.price)}
            </p>

            <p class="product-stock">
                ${stock > 0 ? `● In Stock (${stock})` : "Out of stock"}
            </p>

            <button
                class="add-cart-button ${stock === 0 ? "out-of-stock" : ""}"
                ${stock === 0 ? "disabled" : ""}
                data-product-id="${productId}"
                data-product-index="${index}"
            >
                🛒 Add to Cart
            </button>

        </div>
    </article>
`;
                
    }).join("");

    productsContainer.querySelectorAll(".add-cart-button").forEach(button => {
        button.addEventListener("click", () => {
            const product = filteredProducts[Number(button.dataset.productIndex)];

            if (product) {
                addToCart(product);
            }
        });
    });
    // Handle wishlist heart buttons
productsContainer
    .querySelectorAll(".wishlist-heart-button")
    .forEach(button => {
        button.addEventListener("click", () => {
            toggleWishlist(button.dataset.wishlistId);
        });
    });
}

function addToCart(product) {
    const productId = String(product._id?.$oid || product._id || "");

    const stock = Math.max(0, Number(product.stock) || 0);
    if (stock <= 0) {
        alert("Sorry, this product is out of stock.");
        return;
    }
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity >= stock) {
            alert("You cannot add more than the available stock.");
            return;
        }

        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: Number(product.price) || 0,
            stock,
            quantity: 1
        });
    }

    updateCart();
    alert(product.name + " added to your cart!");
}

function updateCart() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById("cart-count").textContent = cartCount;

    document.getElementById("cart-total").textContent = formatPrice(
        cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    const cartItems = document.getElementById("cart-items");

    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">

            <div class="cart-item-info">
                <h3>${escapeHTML(item.name)}</h3>
                <p>₹${formatPrice(item.price)} each</p>
            </div>

            <div class="cart-controls">

                <button data-action="decrease" data-id="${escapeHTML(item.id)}">
                    −
                </button>

                <span>${item.quantity}</span>

                <button
                    data-action="increase"
                    data-id="${escapeHTML(item.id)}"
                    ${item.quantity >= item.stock ? "disabled" : ""}
                >
                    +
                </button>

                <button
                    class="remove-button"
                    data-action="remove"
                    data-id="${escapeHTML(item.id)}"
                >
                    Remove
                </button>

            </div>
        </div>
    `).join("");

    cartItems.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {
            changeCartQuantity(button.dataset.id, button.dataset.action);
        });
    });
}

function changeCartQuantity(productId, action) {
    const item = cart.find(entry => entry.id === productId);

    if (!item) return;

    if (action === "increase" && item.quantity < item.stock) {
        item.quantity++;
    } else if (action === "decrease") {
        item.quantity--;

        if (item.quantity <= 0) {
            cart = cart.filter(entry => entry.id !== productId);
        }
    } else if (action === "remove") {
        cart = cart.filter(entry => entry.id !== productId);
    }

    updateCart();
}

function showCart() {
    const section = document.getElementById("cart-section");

    section.hidden = false;
    updateCart();

    section.scrollIntoView({ behavior: "smooth" });
}

function closeCart() {
    document.getElementById("cart-section").hidden = true;

    document.getElementById("products-section").scrollIntoView({
        behavior: "smooth"
    });
}
async function checkout() {
    if (cart.length === 0) {
        alert("Your shopping cart is empty.");
        return;
    }

    const checkoutButton = document.querySelector(
        "#cart-section button[onclick='checkout()']"
    );

    try {
        if (checkoutButton) {
            checkoutButton.disabled = true;
            checkoutButton.textContent = "Processing...";
        }

        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                items: cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity
                }))
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Checkout failed.");
        }

        alert(
            "Order placed successfully!\n\n" +
            "Order ID: " + result.orderId + "\n" +
            "Total: ₹" + formatPrice(result.total)
        );

        cart = [];
        updateCart();
        closeCart();

    } catch (error) {
        console.error("Checkout error:", error);
        alert(error.message || "Unable to place your order.");

    } finally {
        if (checkoutButton) {
            checkoutButton.disabled = false;
            checkoutButton.textContent = "Checkout";
        }
    }
}
// Search, category filter, and sorting events
searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
sortFilter.addEventListener("change", renderProducts);

// Initialize wishlist and load products
updateWishlistCount();
loadProducts();
// Get a product's unique MongoDB ID
function getProductId(product) {
    const id = product._id;

    if (id && typeof id === "object" && id.$oid) {
        return String(id.$oid);
    }

    return String(id);
}

// Save wishlist in the browser
function saveWishlist() {
    localStorage.setItem(
        "marketLedgerWishlist",
        JSON.stringify(wishlist)
    );
}

// Update wishlist count in the navbar
function updateWishlistCount() {
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
}

// Add or remove a product from the wishlist
function toggleWishlist(productId) {
    productId = String(productId);

    if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
    } else {
        wishlist.push(productId);
    }

    saveWishlist();
    updateWishlistCount();
    renderProducts();
    renderWishlist();
}

// Display wishlist products
function renderWishlist() {
    if (!wishlistProductsContainer) return;

    const wishlistProducts = allProducts.filter(product =>
        wishlist.includes(getProductId(product))
    );

    if (wishlistMessage) {
        wishlistMessage.textContent = wishlistProducts.length
            ? `${wishlistProducts.length} favourite product(s) saved.`
            : "Your wishlist is empty. Click the ❤️ button on a product to save it.";
    }

    wishlistProductsContainer.innerHTML = wishlistProducts.map(product => {
        const id = getProductId(product);
        const name = escapeHTML(product.name || "Unnamed product");
        const category = escapeHTML(product.category || "General");
        const image = getImage(product);
        const stock = Number(product.stock) || 0;

        return `
            <article class="product-card">
                <button
                    class="wishlist-heart-button active"
                    data-wishlist-id="${escapeHTML(id)}"
                    aria-label="Remove ${name} from wishlist"
                    title="Remove from wishlist"
                >♥</button>

                <img
                    class="product-image"
                    src="${image}"
                    alt="${name}"
                    loading="lazy"
                >

                <div class="product-details">
                    <span class="category-label">${category}</span>
                    <h3>${name}</h3>

                    <p class="product-price">
                        ₹${formatPrice(product.price)}
                    </p>

                    <p class="product-stock">
                        ${stock > 0 ? `● In Stock (${stock})` : "Out of stock"}
                    </p>

                    <button
                        class="add-cart-button"
                        data-wishlist-cart-id="${escapeHTML(id)}"
                        ${stock <= 0 ? "disabled" : ""}
                    >
                        🛒 Add to Cart
                    </button>
                </div>
            </article>
        `;
    }).join("");

    // Remove products from wishlist
    wishlistProductsContainer
        .querySelectorAll("[data-wishlist-id]")
        .forEach(button => {
            button.addEventListener("click", () => {
                toggleWishlist(button.dataset.wishlistId);
            });
        });

    // Add wishlist products to cart
    wishlistProductsContainer
        .querySelectorAll("[data-wishlist-cart-id]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const product = allProducts.find(
                    item => getProductId(item) === button.dataset.wishlistCartId
                );

                if (product) {
                    addToCart(product);
                }
            });
        });
}

// Open wishlist
function showWishlist() {
    if (!wishlistSection) return;

    wishlistSection.hidden = false;
    renderWishlist();
    wishlistSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Close wishlist
function closeWishlist() {
    if (!wishlistSection) return;

    wishlistSection.hidden = true;

    const productsSection = document.getElementById("products");

    if (productsSection) {
        productsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}  