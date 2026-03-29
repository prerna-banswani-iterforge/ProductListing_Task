const BASE_URL = "http://localhost:3000";

const categoryContainer = document.getElementById("categoryFilters");
const productContainer= document.getElementById("productContainer");


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
        <div class="product-price">rs.${product.price}</div>

        <div class="card-actions">
        <button class="btn atc">Add To Cart</button>
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


