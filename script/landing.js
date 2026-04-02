const BASE_URL = "http://localhost:3000";
const CART_URL = `${BASE_URL}/cart`;
const WISHLIST_URL = `${BASE_URL}/wishlist`;
const PRODUCTS_URL = `${BASE_URL}/products`;

const categoryContainer = document.getElementById("categoryFilters");
const productContainer= document.getElementById("productContainer");
const cartCountElement = document.getElementById("cartCount");

// Wishlist Modal Elements
const wishlistModal = document.getElementById("wishlistModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const wishlistDropdown = document.getElementById("wishlistDropdown");
const addToWishlistBtn = document.getElementById("addToWishlistBtn");

let selectedProductId = null;


async function loadCategories(){
    const res = await fetch(`${BASE_URL}/categories`);
    const categories = await res.json();

    renderCategories(categories);
}

function renderCategories(categories){
    categoryContainer.innerHTML ="";
    // console.log(categoryContainer);

    const allBtn = document.createElement("div");
    allBtn.className = "category-pill active";
    allBtn.textContent = "All Products";
    allBtn.dataset.id = "all";

    categoryContainer.appendChild(allBtn);

    categories.forEach(cat => {
        
    const pill = document.createElement("div");
    pill.className = "category-pill";
    pill.textContent = cat.name;
    pill.dataset.id = cat.id;

    categoryContainer.appendChild(pill);

    
    });
}

async function loadProducts(categoryId = "all"){
    let url = `${BASE_URL}/products`;

    if(categoryId != "all"){
        url += `?parentCategoryId=${categoryId}`;
    }
    const res = await fetch(url);
    const products = await res.json();

    renderProducts(products);
}


function renderProducts(products){
    productContainer.innerHTML ="";

    products.forEach((product)=>{
        const productCard = document.createElement("div");
        productCard.className ="product-card";

        productCard.innerHTML = `
        <div class="product-img">
            <img src="${product.imageUrl}" alt="${product.name}">
        </div>
        
        <div class="product-name"> ${product.name}</div>
        <div class="product-price">₹${product.price}</div>

        <div class="card-actions">
            <button class="btn atc" data-id="${product.id}">Add To Cart</button>
            <button class="btn atw" data-id="${product.id}">Add To Wishlist</button>
        </div>
        `;

        productContainer.appendChild(productCard);
    });

}


categoryContainer.addEventListener("click", (e)=>{
    console.log("Listening");

    document.querySelectorAll(".category-pill").forEach(pill => pill.classList.remove("active"));

    e.target.classList.add("active");
    const categoryId = e.target.dataset.id;
    console.log(categoryId);
    loadProducts(categoryId);
});

loadCategories();
loadProducts();



// Add To Cart Functionality
 

// Function to get all cart items from server
async function getCartItems() {
    const res = await fetch(CART_URL);
    const cartItems = await res.json();
    return cartItems;
}
 
async function updateCartCount() {
    const cartItems= await getCartItems();
    const totalQuantity= cartItems.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = totalQuantity;
}
 
 
// Function to add product to cart
async function addToCart(productId) {
    try {
        
        const cartItems = await getCartItems();
        
        const existingItem = cartItems.find(item => item.productId === productId);
        
        if (existingItem) {
// If product exists then increase quantity by 1
            const updatedQuantity = existingItem.quantity + 1;
            
            await fetch(`${CART_URL}/${existingItem.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quantity: updatedQuantity
                })
            });
            
            console.log(`Updated quantity for product ${productId} to ${updatedQuantity}`);
        } else {
// If Product doesn't exist - adding new item with quantity 1
            await fetch(CART_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1
                })
            });
            
            console.log(`Added new product wth id ${productId} to cart`);
        }
        alert('Product added to cart!');        
        await updateCartCount();
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add product to cart');
    }
}


// Wishlist funtion


async function getAllWishlists() {
    try {
        const response = await fetch(WISHLIST_URL);
        const wishlists = await response.json();
        return wishlists;
    } catch (error) {
        console.error('Error fetching wishlists:', error);
        return [];
    }
}

async function getProductById(productId) {
    try {
        const response = await fetch(`${PRODUCTS_URL}/${productId}`);
        const product = await response.json();
        return product;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

async function openWishlistModal(productId) {
    selectedProductId = productId;
    
    await loadWishlistsIntoDropdown();
    
    wishlistModal.classList.add("active");
}

function closeWishlistModal() {
    wishlistModal.classList.remove("active");
    selectedProductId = null;
    wishlistDropdown.value = "";
}

// Load wishlists into dropdown
async function loadWishlistsIntoDropdown() {
    const wishlists = await getAllWishlists();
    
    wishlistDropdown.innerHTML = "";
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Choose a wishlist...";
    wishlistDropdown.appendChild(defaultOption);
    
    wishlists.forEach(wishlist => {
        const option = document.createElement("option");
        option.value = wishlist.id;
        option.textContent = wishlist.wishlistName;
        wishlistDropdown.appendChild(option);
    });
    
}

// Add product to selected wishlist
async function addProductToWishlist() {
    const selectedWishlistId = wishlistDropdown.value;
    
    // Validate selection
    if (!selectedWishlistId || selectedWishlistId === "") {
        alert("Please select a wishlist");
        return;
    }
    
    
    try {
        const product = await getProductById(selectedProductId);
        
        if (!product) {
            alert("Product not found");
            return;
        }
        
        // Get current wishlist
        const response = await fetch(`${WISHLIST_URL}/${selectedWishlistId}`);
        const wishlist = await response.json();
        
        // Check if product already exists in this wishlist
        const productExists = wishlist.products.some(
            p => (p.id === product.id || p.productId === product.id)
        );
        
        if (productExists) {
            alert("Product already in this wishlist!");
            return;
        }
        
        // Add product to wishlist
        const productToAdd = {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            parentCategoryId: product.parentCategoryId
        };
        
        wishlist.products.push(productToAdd);
        
        // Update wishlist on server
        await fetch(`${WISHLIST_URL}/${selectedWishlistId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                products: wishlist.products
            })
        });
        
        alert("Product added to wishlist!");
        closeWishlistModal();
        
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        alert('Failed to add product to wishlist');
    }
}



categoryContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("category-pill")) {
        // Remove active class from all pills
        document.querySelectorAll(".category-pill").forEach(pill => {
            pill.classList.remove("active");
        });

        e.target.classList.add("active");
        
        const categoryId = e.target.dataset.id;
        loadProducts(categoryId);
    }
});

productContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("atc")) {
        const productId = parseInt(e.target.dataset.id);
        addToCart(productId);
    }
    
    if (e.target.classList.contains("atw")) {
        const productId = parseInt(e.target.dataset.id);
        openWishlistModal(productId);
    }
});

closeModalBtn.addEventListener("click", closeWishlistModal);

cancelModalBtn.addEventListener("click", closeWishlistModal);

wishlistModal.addEventListener("click", (e) => {
    if (e.target === wishlistModal) {
        closeWishlistModal();
    }
});

addToWishlistBtn.addEventListener("click", addProductToWishlist);


loadCategories();
loadProducts();
updateCartCount(); // Load initial cart count when page loads