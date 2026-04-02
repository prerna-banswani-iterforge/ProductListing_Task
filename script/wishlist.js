const BASE_URL = "http://localhost:3000";
const WISHLIST_URL = `${BASE_URL}/wishlist`;

// DOM Elements
const wishlistTabs = document.getElementById("wishlistTabs");
const currentWishlistName = document.getElementById("currentWishlistName");
const wishlistProductsGrid = document.getElementById("wishlistProductsGrid");
const emptyWishlistMessage = document.getElementById("emptyWishlistMessage");

// Store current selected wishlist ID
let currentWishlistId = null;

/**
 * Fetch all wishlists from the server
 * @returns {Promise<Array>} Array of wishlist objects
 */
async function getAllWishlists() {
    try {
        const response = await fetch(WISHLIST_URL);
        const wishlists = await response.json();
        console.log("Wishlists are:" ,wishlists);
        return wishlists;
    } catch (error) {
        console.error('Error fetching wishlists:', error);
        return [];
    }
}

/**
 * Fetch a single wishlist by its ID
 * @param {number} wishlistId - ID of the wishlist
 * @returns {Promise<Object|null>} Wishlist object or null if failed
 */
async function getWishlistById(wishlistId) {
    try {
        const response = await fetch(`${WISHLIST_URL}/${wishlistId}`);
        const wishlist = await response.json();
        console.log("Wishlist fetched by id is" ,wishlist);
        return wishlist;
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return null;
    }
}

/**
 * Delete a wishlist by ID
 * @param {number} wishlistId - ID of the wishlist to delete
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function deleteWishlist(wishlistId) {
    try {
        await fetch(`${WISHLIST_URL}/${wishlistId}`, {
            method: 'DELETE'
        });
        console.log(`Deleted wishlist ${wishlistId}`);
        return true;
    } catch (error) {
        console.error('Error deleting wishlist:', error);
        return false;
    }
}

/**
 * Remove a product from a specific wishlist
 * @param {number} wishlistId - Wishlist ID
 * @param {number} productId - Product ID to remove
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function removeProductFromWishlist(wishlistId, productId) {
    try {
        // Get current wishlist
        const wishlist = await getWishlistById(wishlistId);
        
        // Filter out the product to remove
        const updatedProducts = wishlist.products.filter(
            product => product.id !== productId
        );
        
        // Update wishlist with new products array
        await fetch(`${WISHLIST_URL}/${wishlistId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                products: updatedProducts
            })
        });
        
        console.log(`Removed product ${productId} from wishlist ${wishlistId}`);
        return true;
    } catch (error) {
        console.error('Error removing product:', error);
        return false;
    }
}


/**
 * Render wishlist tabs dynamically
 * @param {Array} wishlists - List of wishlist objects
 */
function renderWishlistTabs(wishlists) {
    wishlistTabs.innerHTML = "";
    
    if (wishlists.length === 0) {
        wishlistTabs.innerHTML = "<p>No wishlists found. Create one from the products page!</p>";
        return;
    }
    
    wishlists.forEach((wishlist, index) => {
        const tabButton = document.createElement("button");
        tabButton.className = "wishlist-tab";
        tabButton.textContent = wishlist.wishlistName;
        tabButton.dataset.wishlistId = wishlist.id;
        
        // Make first tab active by default
        if (index === 0) {
            tabButton.classList.add("active");
            currentWishlistId = wishlist.id;
        }
        
        // Add click event
        tabButton.addEventListener("click", () => {
            selectWishlist(wishlist.id);
        });
        
        wishlistTabs.appendChild(tabButton);
    });
}

/**
 * Render products for a selected wishlist
 * @param {Object} wishlist - Wishlist object containing products
 */
function renderWishlistProducts(wishlist) {
    wishlistProductsGrid.innerHTML = "";
    
    // Update wishlist name
    currentWishlistName.textContent = wishlist.wishlistName;
    
    // Check if wishlist has products
    if (!wishlist.products || wishlist.products.length === 0) {
        // Show empty message
        wishlistProductsGrid.style.display = "none";
        emptyWishlistMessage.style.display = "block";
        return;
    }
    
    // Hide empty message, show products
    wishlistProductsGrid.style.display = "grid";
    emptyWishlistMessage.style.display = "none";
    
    // Render each product
    wishlist.products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "wishlist-product-card";
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.imageUrl}" alt="${product.name}">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">₹${product.price}</p>
            <button class="btn-remove" data-product-id="${product.productId}">Remove</button>
        `;
        
        // Add remove button click event
        const removeBtn = productCard.querySelector(".btn-remove");
        removeBtn.addEventListener("click", async () => {
            if (confirm(`Remove ${product.name} from wishlist?`)) {
                await removeProductFromWishlist(wishlist.id, product.id);
                loadWishlistPage(); // Reload page
            }
        });
        
        wishlistProductsGrid.appendChild(productCard);
    });
}



/**
 * Handle selecting a wishlist and updating UI
 * @param {number} wishlistId - Selected wishlist ID
 */
async function selectWishlist(wishlistId) {
    // Update active tab
    document.querySelectorAll(".wishlist-tab").forEach(tab => {
        tab.classList.remove("active");
    });
    
    const activeTab = document.querySelector(`[data-wishlist-id="${wishlistId}"]`);
    if (activeTab) {
        activeTab.classList.add("active");
    }
    
    // Store current wishlist ID
    currentWishlistId = wishlistId;
    
    // Load and display wishlist products
    const wishlist = await getWishlistById(wishlistId);
    if (wishlist) {
        renderWishlistProducts(wishlist);
    }
}

/**
 * Initialize and load the wishlist page
 * - Fetches all wishlists
 * - Renders tabs
 * - Loads default or previously selected wishlist
 */
async function loadWishlistPage() {
    const wishlists = await getAllWishlists();
    
    if (wishlists.length === 0) {
        renderWishlistTabs([]);
        emptyWishlistMessage.style.display = "block";
        wishlistProductsGrid.style.display = "none";
        return;
    }
    
    // Render tabs
    renderWishlistTabs(wishlists);
    
    // Load first wishlist by default
    if (currentWishlistId) {
        selectWishlist(currentWishlistId);
    } else {
        selectWishlist(wishlists[0].id);
    }
}

loadWishlistPage();