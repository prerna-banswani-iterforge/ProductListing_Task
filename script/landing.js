const BASE_URL = "http://localhost:3000";
const CART_URL = `${BASE_URL}/cart`;

const categoryContainer = document.getElementById("categoryFilters");
const productContainer= document.getElementById("productContainer");
const cartCountElement = document.getElementById("cartCount");


async function loadCategories(){
    const res = await fetch(`${BASE_URL}/categories`);
    const categories = await res.json();
    // console.log(categories);

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
        console.log(url);
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
            <img src="${product.imageUrl}">
        </div>
        
        <div class="product-name"> ${product.name}</div>
        <div class="product-price">₹${product.price}</div>

        <div class="card-actions">
        <button class="btn atc" data-id=${product.id}>Add To Cart</button>
        <button class="btn atw">Add To Wishlist</button>
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
 
productContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("atc")) {
        const productId = e.target.dataset.id;
        addToCart(productId);
    }
});

// Function to update cart count badge on the landing pg when the product is added to cart
async function updateCartCount() {
    const cartItems = await getCartItems();
    const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    cartCountElement.textContent = totalQuantity;
}

updateCartCount();
