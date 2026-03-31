const BASE_URL = "http://localhost:3000";
const CART_URL = `${BASE_URL}/cart`;
const PRODUCTS_URL = `${BASE_URL}/products`;


const cartItemsContainer = document.getElementById("cartItemsContainer");
const emptyCartMessage = document.getElementById("emptyCartMessage");
const summarySubtotal = document.getElementById("summarySubtotal");
const summaryShipping = document.getElementById("summaryShipping");
const summaryTax = document.getElementById("summaryTax");
const summaryTotal = document.getElementById("summaryTotal");
const checkoutBtn = document.getElementById("checkoutBtn");


const SHIPPING_COST = 50;
const TAX_RATE = 0.05; 


/**
 * Fetch all cart items from the server.
 *
 * @async
 * @function getCartItems
 * @returns {Promise<Array>} List of cart items
 */
async function getCartItems() {
    try {
        const response = await fetch(CART_URL);
        const cartItems = await response.json();
        return cartItems;
    } 
    catch (err) {
        console.err('Error fetching cart items:', err);
        return [];
    }
}

/**
 * Fetch product details by product ID.
 *
 * @async
 * @function getProductById
 * @param {number|string} productId - ID of the product
 * @returns {Promise<Object|null>} Product details or null if failed
 */
async function getProductById(productId) {
    try {
        const response = await fetch(`${PRODUCTS_URL}/${productId}`);
        const product = await response.json();
        console.log("Products fetched with product id", product);
        return product;
    } 
    catch (err) {
        console.err(`Error fetching product ${productId}:`, err);
        return null;
    }
}

/**
 * Combines cart items with their respective product details.
 *
 * @async
 * @function getCartWithProductDetails
 * @returns {Promise<Array>} Cart items enriched with product info
 */
async function getCartWithProductDetails() {
    try {
        
        const cartItems = await getCartItems();
        
        const productPromises = cartItems.map(async (cartItem) => {
            const product = await getProductById(cartItem.productId);
            console.log("Product details for item present in cart", product );
            
            return {
                ...cartItem,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl
            };
        });
        
        const cartWithProducts = await Promise.all(productPromises);
        return cartWithProducts;
        
    } 
    catch (error) {
        console.error('Error getting cart with product details:', error);
        return [];
    }
}

/**
 * Render cart items in the UI.
 *
 * @function renderCartItems
 * @param {Array} cartItems - List of cart items with product details
 * @returns {void}
 */
function renderCartItems(cartItems) {
    
    cartItemsContainer.innerHTML = "";

    if (cartItems.length === 0) {
        cartItemsContainer.style.display = "none";
        emptyCartMessage.style.display = "block";
        return;
    }

    cartItemsContainer.style.display = "flex";
    emptyCartMessage.style.display = "none";

    cartItems.forEach(item => {
        const cartItemElement = document.createElement("div");
        cartItemElement.className = "cart-item";

        const itemTotal = item.price * item.quantity;

        cartItemElement.innerHTML = `
            <div class="item-image">
                <img src="${item.imageUrl}" alt="${item.name}">
            </div>
            
            <div class="item-details">
                <h3 class="item-name">${item.name}</h3>
                <p class="item-price">₹${item.price}</p>
            </div>

            <div class="item-quantity">
                <button class="qty-btn qty-decrease">-</button>
                <input type="number" class="qty-input" value="${item.quantity}" min="0">
                <button class="qty-btn qty-increase">+</button>
            </div>

            <div class="item-total">
                <p class="total-price">₹${itemTotal}</p>
            </div>

            <button class="item-remove-btn">x</button>
        `;

        cartItemsContainer.appendChild(cartItemElement);

        const decreaseBtn = cartItemElement.querySelector(".qty-decrease");
        const increaseBtn = cartItemElement.querySelector(".qty-increase");
        const removeBtn = cartItemElement.querySelector(".item-remove-btn");
        const quantityInput = cartItemElement.querySelector(".qty-input");

        decreaseBtn.addEventListener("click", async () => {
            const newQuantity = item.quantity - 1;
            await updateCartItemQuantity(item.id, newQuantity);
        });

        increaseBtn.addEventListener("click", async () => {
            const newQuantity = item.quantity + 1;
            await updateCartItemQuantity(item.id, newQuantity);
        });

        removeBtn.addEventListener("click", async () => {
            if (confirm("Remove this item from cart?")) {
                await removeCartItem(item.id);
            }
        });

        quantityInput.addEventListener("change", async (e) => {
            const newQuantity = parseInt(e.target.value);

            if (isNaN(newQuantity) || newQuantity < 0) {
                alert("Please enter a valid quantity");
                await loadCartPage();
                return;
            }

            await updateCartItemQuantity(item.id, newQuantity);
        });
    });
}

/**
 * Calculate and display cart summary including subtotal, tax, and total.
 *
 * @function calculateCartSummary
 * @param {Array} cartItems - List of cart items
 * @returns {void}
 */
function calculateCartSummary(cartItems) {
    const subtotal = cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

    const tax = subtotal * TAX_RATE;

    const total = subtotal + SHIPPING_COST + tax;

    summarySubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    summaryTax.textContent = `₹${tax.toFixed(2)}`;
    summaryTotal.textContent = `₹${total.toFixed(2)}`;
}


/**
 * Update the quantity of a cart item.
 *
 * @async
 * @function updateCartItemQuantity
 * @param {number|string} cartId - ID of the cart item
 * @param {number} newQuantity - Value of new updated Quantity
 */
async function updateCartItemQuantity(cartId, newQty) {
    try {
        if (newQty <= 0) {
            await removeCartItem(cartId);
            return;
        }

        const response = await fetch(`${CART_URL}/${cartId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quantity: newQty
            })
        });
        
        await response.json();
        console.log(`Updated cart item ${cartId} to quantity ${newQty}`);
        
        await loadCartPage();
        
    } catch (error) {
        console.error('Error updating cart item:', error);
        alert('Failed to update cart');
    }
}

/**
 * Remove an item from the cart.
 *
 * @async
 * @function removeCartItem
 * @param {number} cartId - ID of the cart item
 */
async function removeCartItem(cartId) {
    try {
        await fetch(`${CART_URL}/${cartId}`, {
            method: 'DELETE'
        });
        
        console.log(`Removed cart item ${cartId}`);
        
        await loadCartPage();
        
    } catch (error) {
        console.error('Error removing cart item:', error);
        alert('Failed to remove item from cart');
    }
}


checkoutBtn.addEventListener("click", () => {
    alert("Checkout functionality coming soon!");
});


/**
 * Load and initialize the cart page.
 * - Fetches cart data
 * - Renders items
 * - Calculates summary
 *
 * @async
 * @function loadCartPage
 * @returns {Promise<void>}
 */
async function loadCartPage() {
    try {
        // Get cart items with product details
        const cartItems = await getCartWithProductDetails();
        
        renderCartItems(cartItems);
        
        calculateCartSummary(cartItems);
        
    } catch (error) {
        console.error('Error loading cart page:', error);
    }
}


loadCartPage();