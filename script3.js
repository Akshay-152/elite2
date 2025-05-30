// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCNl1eLCccchmMvUNf29EtTUbMn_FO_nuU",
    authDomain: "data-4e1c7.firebaseapp.com",
    projectId: "data-4e1c7",
    storageBucket: "data-4e1c7.firebasestorage.app",
    messagingSenderId: "844230746094",
    appId: "1:844230746094:web:7834ae9aaf29eccc3d38ff",
    measurementId: "G-L4ZQ1CL7T8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global State Management
let currentUser = null;
let currentDatabase = null;
let cart = JSON.parse(localStorage.getItem('elite_cart')) || [];
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSort = 'newest';
let darkMode = localStorage.getItem('elite_darkMode') === 'true';

// Mobile responsive breakpoints
const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
};

// Authentication credentials mapping
const userCredentials = {
    '1234': { password: '1234', database: 'products1lap' },
    '123456': { password: '123456', database: 'products2lap' }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

// Application Initialization
function initializeApp() {
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
    
    setTheme(darkMode);
    initializeResponsiveHandlers();
    initializeSmoothScrolling();
    loadProducts();
    updateCartUI();
    initializeEventListeners();
    initializeScrollHandlers();
    updateMobileLayout();
}

// Enhanced Smooth Scrolling
function initializeSmoothScrolling() {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    window.smoothScrollTo = function(targetPosition, duration = 1000) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }
        
        function easeInOutCubic(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t * t + b;
            t -= 2;
            return c / 2 * (t * t * t + 2) + b;
        }
        
        requestAnimationFrame(animation);
    };
    
    document.body.style.webkitOverflowScrolling = 'touch';
}

// Responsive Handlers
function initializeResponsiveHandlers() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateMobileLayout();
            adjustProductGrid();
        }, 150);
    });
    
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            updateMobileLayout();
            adjustProductGrid();
        }, 300);
    });
}

// Mobile Layout Updates
function updateMobileLayout() {
    const isMobile = window.innerWidth <= BREAKPOINTS.mobile;
    const isTablet = window.innerWidth <= BREAKPOINTS.tablet;
    
    document.documentElement.style.setProperty('--mobile-spacing', isMobile ? '16px' : '20px');
    document.documentElement.style.setProperty('--mobile-gap', isMobile ? '12px' : '16px');
    document.documentElement.style.setProperty('--card-padding', isMobile ? '16px' : '20px');
    
    document.body.classList.toggle('mobile-layout', isMobile);
    document.body.classList.toggle('tablet-layout', isTablet && !isMobile);
    
    adjustProductGrid();
}

// Enhanced Product Grid Adjustment
function adjustProductGrid() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    const isMobile = window.innerWidth <= BREAKPOINTS.mobile;
    const isTablet = window.innerWidth <= BREAKPOINTS.tablet;
    
    let columns = isMobile ? 2 : isTablet ? 3 : 4;
    const gap = isMobile ? '12px' : '20px';
    
    productsGrid.style.display = 'grid';
    productsGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    productsGrid.style.gap = gap;
    productsGrid.style.padding = isMobile ? '16px' : '20px';
    productsGrid.classList.add('products-grid');
}

// Event Listeners Initialization
function initializeEventListeners() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('touchstart', handleMobileMenuToggle);
        mobileMenuBtn.addEventListener('click', handleMobileMenuToggle);
    }
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    const mobileDarkModeToggle = document.getElementById('mobileDarkModeToggle');
    
    darkModeToggle?.addEventListener('click', toggleDarkMode);
    mobileDarkModeToggle?.addEventListener('click', () => {
        toggleDarkMode();
        closeMobileMenu();
    });
    
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.getAttribute('data-category');
            setActiveCategory(category);
            filterProducts();
        });
        
        btn.addEventListener('touchstart', () => btn.style.transform = 'scale(0.95)');
        btn.addEventListener('touchend', () => btn.style.transform = 'scale(1)');
    });
    
    const sortFilter = document.getElementById('sortFilter');
    sortFilter?.addEventListener('change', (e) => {
        currentSort = e.target.value;
        sortProducts();
        displayProducts();
    });
    
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            closeAllModals();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    initializeSwipeHandlers();
}

// Enhanced Mobile Menu Toggle
function handleMobileMenuToggle(e) {
    e.preventDefault();
    const mobileMenu = document.getElementById('mobileMenu');
    const isOpen = mobileMenu?.classList.contains('open');
    
    if (isOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

// Enhanced Scroll Handlers
function initializeScrollHandlers() {
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', throttle(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const goTopBtn = document.getElementById('goTopBtn');
        
        if (scrollTop > 300) {
            goTopBtn?.classList.remove('hidden');
            goTopBtn?.classList.add('animate-fadeIn');
        } else {
            goTopBtn?.classList.add('hidden');
            goTopBtn?.classList.remove('animate-fadeIn');
        }
        
        if (header) {
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        }
        
        lastScrollTop = scrollTop;
    }, 100));
}

// Smooth Scroll Functions
function scrollToTop() {
    window.smoothScrollTo(0, 1200);
}

function scrollToProducts() {
    const productsSection = document.getElementById('productsSection');
    if (productsSection) {
        const targetPosition = productsSection.offsetTop - 100;
        window.smoothScrollTo(targetPosition, 1200);
    }
}

function goHome() {
    window.smoothScrollTo(0, 1200);
}

// Load Products Function
async function loadProducts() {
    try {
        showLoadingState();
        
        const publicSnapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        let products = publicSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        if (currentUser && currentDatabase) {
            try {
                const userSnapshot = await db.collection(currentDatabase).orderBy('createdAt', 'desc').get();
                const userProducts = userSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                products = [...userProducts, ...products];
            } catch (error) {
                console.log('User database not found or empty:', error);
            }
        }
        
        allProducts = products;
        filteredProducts = [...allProducts];
        
        sortProducts();
        displayProducts();
        hideLoadingState();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showError('main', 'Failed to load products. Please try again.');
        hideLoadingState();
    }
}

// Enhanced Display Products - NO Add to Cart button in product cards
function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const productsCount = document.getElementById('productsCount');
    const isMobile = window.innerWidth <= BREAKPOINTS.mobile;
    
    if (!productsGrid) return;
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-20 animate-fadeIn">
                <div class="text-8xl mb-8">📦</div>
                <h3 class="text-3xl font-bold mb-4 text-elite-900 dark:text-white">No products found</h3>
                <p class="text-elite-600 dark:text-elite-400 text-xl">Try adjusting your search or filters</p>
            </div>
        `;
        if (productsCount) productsCount.textContent = '0 products found';
        return;
    }
    
    productsGrid.innerHTML = filteredProducts.map((product, index) => `
        <div class="product-card bg-white dark:bg-elite-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer border border-elite-200 dark:border-elite-700 animate-slideUp hover-lift" 
             style="animation-delay: ${index * 100}ms"
             onclick="openProductModal('${product.id}')">
            
            <!-- Product Image with better spacing -->
            <div class="relative overflow-hidden ${isMobile ? 'h-48 mb-4' : 'h-56 mb-6'}">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 lazy-load"
                     loading="lazy"
                     onerror="this.src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop'">
                
                <!-- Category Badge -->
                <div class="absolute top-3 right-3 bg-white/95 dark:bg-elite-800/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold text-elite-700 dark:text-elite-300 shadow-lg">
                    ${product.category}
                </div>
                
                <!-- Unique Code Badge -->
                ${product.uniqueCode ? `
                    <div class="absolute top-3 left-3 bg-blue-500/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                        ${product.uniqueCode}
                    </div>
                ` : ''}
                
                <!-- Overlay gradient -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            <!-- Product Details with better spacing -->
            <div class="${isMobile ? 'px-4 pb-4 space-y-3' : 'px-6 pb-6 space-y-4'}">
                <!-- Title and Rating -->
                <div class="flex items-start justify-between gap-3">
                    <h3 class="font-bold text-elite-900 dark:text-white line-clamp-2 ${isMobile ? 'text-base' : 'text-lg'} leading-tight group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors duration-300">${product.name}</h3>
                    <div class="flex items-center gap-1 text-gold-500 ${isMobile ? 'text-sm' : 'text-base'} flex-shrink-0">
                        <span class="star-filled">★</span>
                        <span class="text-elite-600 dark:text-elite-400 font-semibold">${product.rating || 4.5}</span>
                    </div>
                </div>
                
                <!-- Description -->
                <p class="text-elite-600 dark:text-elite-400 line-clamp-2 ${isMobile ? 'text-sm' : 'text-base'} leading-relaxed">${product.description}</p>
                
                <!-- Price and Details Button -->
                <div class="flex items-center justify-between ${isMobile ? 'pt-2' : 'pt-4'}">
                    <div class="flex flex-col space-y-1">
                        <span class="font-bold text-gold-600 dark:text-gold-400 ${isMobile ? 'text-lg' : 'text-2xl'}">₹${product.price?.toLocaleString() || '0'}</span>
                        <span class="text-elite-500 dark:text-elite-400 ${isMobile ? 'text-xs' : 'text-sm'} font-medium">${product.reviews || 0} reviews</span>
                    </div>
                    
                    <!-- Only View Details button - NO Add to Cart here -->
                    <button onclick="event.stopPropagation(); openProductModal('${product.id}')" 
                            class="bg-elite-700 hover:bg-elite-800 dark:bg-elite-600 dark:hover:bg-elite-500 text-white ${isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3 text-base'} rounded-xl transition-all duration-300 flex items-center gap-2 font-bold hover:scale-105 hover:shadow-lg">
                        <span class="${isMobile ? 'text-sm' : 'text-base'}">👁️</span>
                        ${isMobile ? 'Details' : 'View Details'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    if (productsCount) {
        productsCount.textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`;
    }
    
    setTimeout(() => {
        adjustProductGrid();
    }, 100);
}

// Enhanced Product Modal with Add to Cart button and better spacing
function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const isMobile = window.innerWidth <= BREAKPOINTS.mobile;
    
    lockScroll();
    const modal = document.getElementById('productModal') || createModal('productModal');
    
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div class="bg-white dark:bg-elite-800 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-auto animate-modalSlideUp shadow-2xl">
                <!-- Close Button -->
                <button onclick="closeProductModal()" 
                        class="absolute top-6 right-6 z-10 bg-white/95 dark:bg-elite-700/95 backdrop-blur-sm rounded-full p-3 hover:bg-white dark:hover:bg-elite-600 transition-all duration-200 hover:scale-110 shadow-xl">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                
                <!-- Modal Content with extra spacing before image -->
                <div class="${isMobile ? 'pt-20 px-6 pb-8' : 'pt-24 px-10 pb-10'}">
                    <div class="${isMobile ? 'block space-y-8' : 'grid grid-cols-1 lg:grid-cols-2 gap-12'}">
                        
                        <!-- Image Gallery with extra spacing -->
                        <div class="space-y-6">
                            <div class="relative ${isMobile ? 'h-80' : 'h-96'} bg-elite-100 dark:bg-elite-700 rounded-2xl overflow-hidden shadow-lg">
                                <img id="mainProductImage" 
                                     src="${product.image}" 
                                     alt="${product.name}" 
                                     class="w-full h-full object-cover transition-all duration-500">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            
                            ${getProductImageThumbnails(product, isMobile)}
                        </div>
                        
                        <!-- Product Details with better spacing -->
                        <div class="space-y-6">
                            ${product.uniqueCode ? `
                                <div class="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-bold animate-slideIn shadow-sm">
                                    Code: ${product.uniqueCode}
                                </div>
                            ` : ''}
                            
                            <!-- Product Title and Rating -->
                            <div class="space-y-4">
                                <h1 class="text-${isMobile ? '3xl' : '4xl'} font-bold text-elite-900 dark:text-white leading-tight animate-slideIn" style="animation-delay: 100ms">${product.name}</h1>
                                
                                <div class="flex items-center gap-6 animate-slideIn" style="animation-delay: 200ms">
                                    <div class="flex items-center gap-2">
                                        <div class="flex text-gold-500 text-xl">
                                            ${'★'.repeat(Math.floor(product.rating || 4.5))}
                                        </div>
                                        <span class="text-elite-600 dark:text-elite-400 font-semibold text-lg">${product.rating || 4.5} (${product.reviews || 0} reviews)</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Price -->
                            <div class="text-${isMobile ? '3xl' : '4xl'} font-bold text-gold-600 dark:text-gold-400 animate-slideIn" style="animation-delay: 300ms">₹${product.price?.toLocaleString() || '0'}</div>
                            
                            <!-- Description with spacing -->
                            <div class="space-y-4 animate-slideIn" style="animation-delay: 400ms">
                                <p class="text-elite-600 dark:text-elite-300 ${isMobile ? 'text-base' : 'text-xl'} leading-relaxed">${product.description}</p>
                            </div>
                            
                            <!-- Product Info -->
                            <div class="bg-elite-50 dark:bg-elite-700/50 rounded-2xl p-6 space-y-4 animate-slideIn" style="animation-delay: 500ms">
                                <div class="flex justify-between items-center">
                                    <span class="text-elite-600 dark:text-elite-400 font-semibold">Category:</span>
                                    <span class="font-bold text-elite-900 dark:text-white capitalize text-lg">${product.category}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-elite-600 dark:text-elite-400 font-semibold">Added:</span>
                                    <span class="font-bold text-elite-900 dark:text-white">${product.createdAt ? new Date(product.createdAt.toDate()).toLocaleDateString() : 'Recently'}</span>
                                </div>
                            </div>
                            
                            <!-- Action Buttons with extra spacing - Add to Cart HERE -->
                            <div class="pt-8 space-y-6 animate-slideIn" style="animation-delay: 600ms">
                                <div class="flex gap-4 ${isMobile ? 'flex-col' : ''}">
                                    <button onclick="addToCart('${product.id}')" 
                                            class="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white py-5 px-8 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-xl hover:scale-105 hover:shadow-xl">
                                        <span class="text-2xl">🛒</span>
                                        Add to Cart
                                    </button>
                                    <button onclick="buyNow('${product.id}')" 
                                            class="flex-1 bg-elite-900 dark:bg-white dark:text-elite-900 hover:bg-elite-800 dark:hover:bg-elite-100 text-white py-5 px-8 rounded-2xl font-bold transition-all duration-300 text-xl hover:scale-105 hover:shadow-xl">
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.appendChild(modal);
}

// Enhanced Image Thumbnails with better spacing
function getProductImageThumbnails(product, isMobile) {
    const images = [product.image, product.image2, product.image3].filter(img => img && img.trim());
    
    if (images.length <= 1) return '';
    
    const thumbnailSize = isMobile ? 'h-20 w-20' : 'h-24 w-24';
    const gap = isMobile ? 'gap-3' : 'gap-4';
    
    return `
        <div class="flex ${gap} overflow-x-auto pb-2 ${isMobile ? 'px-2' : 'px-4'} scrollbar-hide">
            ${images.map((img, index) => `
                <button onclick="changeMainImage('${img}')" 
                        class="${thumbnailSize} flex-shrink-0 bg-elite-100 dark:bg-elite-700 rounded-xl overflow-hidden border-3 border-transparent hover:border-gold-500 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg animate-slideIn"
                        style="animation-delay: ${index * 150}ms">
                    <img src="${img}" alt="Product view ${index + 1}" class="w-full h-full object-cover">
                </button>
            `).join('')}
        </div>
    `;
}

// Change main product image with smooth transition
function changeMainImage(imageSrc) {
    const mainImage = document.getElementById('mainProductImage');
    if (mainImage) {
        mainImage.style.opacity = '0.5';
        setTimeout(() => {
            mainImage.src = imageSrc;
            mainImage.style.opacity = '1';
        }, 200);
    }
}

// Enhanced Upload Modal with extra spacing before upload products section
function openUploadModal() {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    
    lockScroll();
    const modal = document.getElementById('uploadModal') || createModal('uploadModal');
    
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div class="bg-white dark:bg-elite-800 rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-auto animate-modalSlideUp shadow-2xl">
                <!-- Close Button -->
                <button onclick="closeUploadModal()" 
                        class="absolute top-6 right-6 z-10 bg-white/95 dark:bg-elite-700/95 backdrop-blur-sm rounded-full p-3 hover:bg-white dark:hover:bg-elite-600 transition-all duration-200 hover:scale-110 shadow-xl">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                
                <!-- Extra spacing before upload products section -->
                <div class="pt-24 px-10 pb-10">
                    <div class="space-y-10">
                        <!-- Header with extra spacing -->
                        <div class="text-center space-y-4 animate-slideIn">
                            <h2 class="text-4xl font-bold text-elite-900 dark:text-white">Upload New Product</h2>
                            <p class="text-elite-600 dark:text-elite-400 text-xl">Add a new product to your inventory</p>
                        </div>
                        
                        <!-- Upload form with better spacing -->
                        <form id="uploadForm" onsubmit="handleProductUpload(event)" class="space-y-8">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slideIn" style="animation-delay: 100ms">
                                <div class="space-y-3">
                                    <label class="block text-lg font-bold text-elite-700 dark:text-elite-300">Product Name *</label>
                                    <input type="text" name="productName" required 
                                           class="w-full px-6 py-4 border-2 border-elite-300 dark:border-elite-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent dark:bg-elite-700 dark:text-white transition-all duration-300 text-lg">
                                </div>
                                
                                <div class="space-y-3">
                                    <label class="block text-lg font-bold text-elite-700 dark:text-elite-300">Price (₹) *</label>
                                    <input type="number" name="productPrice" required min="0" step="0.01"
                                           class="w-full px-6 py-4 border-2 border-elite-300 dark:border-elite-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent dark:bg-elite-700 dark:text-white transition-all duration-300 text-lg">
                                </div>
                            </div>
                            
                            <div class="space-y-3 animate-slideIn" style="animation-delay: 200ms">
                                <label class="block text-lg font-bold text-elite-700 dark:text-elite-300">Category *</label>
                                <select name="productCategory" required
                                        class="w-full px-6 py-4 border-2 border-elite-300 dark:border-elite-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent dark:bg-elite-700 dark:text-white transition-all duration-300 text-lg">
                                    <option value="">Select a category</option>
                                    <option value="electronics">Electronics</option>
                                    <option value="fashion">Fashion</option>
                                    <option value="home">Home & Garden</option>
                                    <option value="sports">Sports & Outdoors</option>
                                    <option value="books">Books</option>
                                    <option value="beauty">Beauty & Health</option>
                                    <option value="automotive">Automotive</option>
                                    <option value="toys">Toys & Games</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            
                            <div class="space-y-3 animate-slideIn" style="animation-delay: 300ms">
                                <label class="block text-lg font-bold text-elite-700 dark:text-elite-300">Description *</label>
                                <textarea name="productDescription" required rows="4"
                                          class="w-full px-6 py-4 border-2 border-elite-300 dark:border-elite-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent dark:bg-elite-700 dark:text-white resize-none transition-all duration-300 text-lg"
                                          placeholder="Describe your product in detail..."></textarea>
                            </div>
                            
                            <!-- Image URLs with extra spacing -->
                            <div class="space-y-6 animate-slideIn" style="animation-delay: 400ms">
                                <div class="flex items-center justify-between">
                                    <label class="block text-lg font-bold text-elite-700 dark:text-elite-300">Product Images</label>
                                    <button type="button" onclick="toggleImageGuide()" 
                                            class="definition-toggle text-base text-gold-600 dark:text-gold-400 hover:text-gold-800 dark:hover:text-gold-300 font-bold">
                                        Image Guidelines
                                    </button>
                                </div>
                                
                                <div class="definition-content hidden bg-gold-50 dark:bg-gold-900/20 p-6 rounded-2xl">
                                    <h4 class="font-bold text-gold-900 dark:text-gold-300 mb-4 text-lg">Image Guidelines:</h4>
                                    <ul class="text-base text-gold-800 dark:text-gold-400 space-y-2">
                                        <li>• Use high-quality images (min 800x600px)</li>
                                        <li>• Ensure good lighting and clear visibility</li>
                                        <li>• Show multiple angles of the product</li>
                                        <li>• Use image hosting services like Imgur, Google Drive, or Dropbox</li>
                                        <li>• Make sure the image URL ends with an image extension (.jpg, .png, .gif)</li>
                                    </ul>
                                </div>
                                
                                <div class="space-y-6">
                                    <div class="space-y-3">
                                        <label class="block text-base font-bold text-elite-700 dark:text-elite-300">Main Image URL *</label>
                                        <input type="url" name="productImage" required
                                               class="w-full px-6 py-4 border-2 border-elite-300 dark:border-elite-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent dark:bg-elite-700 dark:text-white transition-all duration-300 text-base"
                                               placeholder="https://example.com/image1.jpg">
                                    </div>
                                    
                                    <div class="space-y-3">
                                        <label class="block text-base font-bold text-elite-700 dark:text-elite-300">Additional Image URL 2</label>
                                        <input type="url" name="productImage2"
                                               class="w-full px-6 py-4 border-2 border-elite-300 dark:border-elite-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent dark:bg-elite-700 dark:text-white transition-all duration-300 text-base"
                                               placeholder="https://example.com/image2.jpg">
                                    </div>
                                    
                                    <div class="space-y-3">
                                        <label class="block text-base font-bold text-elite-700 dark:text-elite-300">Additional Image URL 3</label>
                                        <input type="url" name="productImage3"
                                               class="w-full px-6 py-4 border-2 border-elite-300 dark:border-elite-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent dark:bg-elite-700 dark:text-white transition-all duration-300 text-base"
                                               placeholder="https://example.com/image3.jpg">
                                    </div>
                                </div>
                            </div>
                            
                            <div id="uploadError" class="error-message hidden"></div>
                            
                            <!-- Submit button with extra spacing -->
                            <div class="pt-8 animate-slideIn" style="animation-delay: 500ms">
                                <button type="submit" id="uploadSubmitBtn"
                                        class="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white py-5 px-8 rounded-2xl font-bold transition-all duration-300 text-xl hover:scale-105 hover:shadow-xl">
                                    Upload Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.appendChild(modal);
}

// Rest of the JavaScript functions (Auth, Cart, etc.)
// Theme Management
function setTheme(isDark) {
    const html = document.documentElement;
    if (isDark) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    localStorage.setItem('elite_darkMode', isDark.toString());
    darkMode = isDark;
}

function toggleDarkMode() {
    setTheme(!darkMode);
}

// Mobile Menu Functions
function openMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    mobileMenu.classList.add('open');
    mobileMenuBtn.classList.add('open');
    
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/30 z-30 backdrop-blur-sm';
    backdrop.id = 'mobileMenuBackdrop';
    backdrop.addEventListener('click', closeMobileMenu);
    backdrop.addEventListener('touchstart', closeMobileMenu);
    document.body.appendChild(backdrop);
    
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const backdrop = document.getElementById('mobileMenuBackdrop');
    
    mobileMenu?.classList.remove('open');
    mobileMenuBtn?.classList.remove('open');
    
    if (backdrop) {
        backdrop.remove();
    }
    
    document.body.style.overflow = '';
}

// Search Functionality
function handleSearch(event) {
    event.preventDefault();
    const searchInput = event.target.querySelector('input');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            (product.uniqueCode && product.uniqueCode.toLowerCase().includes(searchTerm))
        );
    }
    
    sortProducts();
    displayProducts();
    
    if (event.target.closest('#mobileMenu')) {
        closeMobileMenu();
    }
}

// Category Management
function setActiveCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('bg-gold-500', 'text-white');
        btn.classList.add('bg-elite-200', 'dark:bg-elite-700', 'text-elite-800', 'dark:text-elite-200');
    });
    
    const activeBtn = document.querySelector(`[data-category="${category}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.classList.remove('bg-elite-200', 'dark:bg-elite-700', 'text-elite-800', 'dark:text-elite-200');
        activeBtn.classList.add('bg-gold-500', 'text-white');
    }
}

function filterProducts() {
    if (currentCategory === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.category.toLowerCase() === currentCategory.toLowerCase()
        );
    }
    
    sortProducts();
    displayProducts();
}

// Sort Products
function sortProducts() {
    filteredProducts.sort((a, b) => {
        switch (currentSort) {
            case 'newest':
                return new Date(b.createdAt?.toDate() || 0) - new Date(a.createdAt?.toDate() || 0);
            case 'oldest':
                return new Date(a.createdAt?.toDate() || 0) - new Date(b.createdAt?.toDate() || 0);
            case 'price-low':
                return (a.price || 0) - (b.price || 0);
            case 'price-high':
                return (b.price || 0) - (a.price || 0);
            case 'name-az':
                return a.name.localeCompare(b.name);
            case 'name-za':
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });
}

// Loading States
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const productsGrid = document.getElementById('productsGrid');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (productsGrid) productsGrid.classList.add('hidden');
}

function hideLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const productsGrid = document.getElementById('productsGrid');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (productsGrid) productsGrid.classList.remove('hidden');
}

// Modal Management
function createModal(modalId) {
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'hidden';
        document.body.appendChild(modal);
    }
    return modal;
}

function closeProductModal() {
    unlockScroll();
    const modal = document.getElementById('productModal');
    modal.classList.add('hidden');
}

function closeUploadModal() {
    unlockScroll();
    const modal = document.getElementById('uploadModal');
    modal.classList.add('hidden');
    const form = document.getElementById('uploadForm');
    if (form) form.reset();
    hideError('uploadError');
}

function closeAllModals() {
    unlockScroll();
    const modals = ['authModal', 'productModal', 'uploadModal', 'cartModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    });
}

// Utility Functions
function lockScroll() {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.classList.add('scroll-locked');
}

function unlockScroll() {
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('scroll-locked');
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Toggle Image Guide
function toggleImageGuide() {
    const toggle = document.querySelector('.definition-toggle');
    const content = document.querySelector('.definition-content');
    
    if (toggle && content) {
        toggle.classList.toggle('active');
        content.classList.toggle('hidden');
    }
}

// Message Management
function showSuccess(message) {
    showMessage(message, 'success');
}

function showError(target, message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert-${type} animate-slideIn`;
    messageDiv.textContent = message;
    
    container.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

// Cart Management
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const mobileCartCount = document.getElementById('mobileCartCount');
    
    if (cart.length > 0) {
        cartCount?.classList.remove('hidden');
        mobileCartCount?.classList.remove('hidden');
        if (cartCount) cartCount.textContent = cart.length;
        if (mobileCartCount) mobileCartCount.textContent = cart.length;
    } else {
        cartCount?.classList.add('hidden');
        mobileCartCount?.classList.add('hidden');
    }
}

// Swipe Handlers for Mobile
function initializeSwipeHandlers() {
    let startX = 0;
    let startY = 0;
    let isSwipingImage = false;
    
    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('#mainProductImage')) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipingImage = true;
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isSwipingImage) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = startX - currentX;
        const diffY = startY - currentY;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            e.preventDefault();
        }
    });
    
    document.addEventListener('touchend', (e) => {
        if (!isSwipingImage) return;
        
        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;
        
        if (Math.abs(diffX) > 50) {
            const productModal = document.getElementById('productModal');
            const thumbnails = productModal?.querySelectorAll('button[onclick^="changeMainImage"]');
            
            if (thumbnails && thumbnails.length > 1) {
                const currentImg = document.getElementById('mainProductImage')?.src;
                const currentIndex = Array.from(thumbnails).findIndex(thumb => 
                    thumb.querySelector('img')?.src === currentImg
                );
                
                let nextIndex;
                if (diffX > 0) {
                    nextIndex = (currentIndex + 1) % thumbnails.length;
                } else {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : thumbnails.length - 1;
                }
                
                const nextImg = thumbnails[nextIndex]?.querySelector('img')?.src;
                if (nextImg) {
                    changeMainImage(nextImg);
                }
            }
        }
        
        isSwipingImage = false;
    });
}

// Authentication Functions (placeholders)
function handleAuthClick() {
    console.log('Auth clicked');
}

function openAuthModal() {
    console.log('Open auth modal');
}

function openCartModal() {
    console.log('Open cart modal');
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        localStorage.setItem('elite_cart', JSON.stringify(cart));
        updateCartUI();
        showSuccess(`${product.name} added to cart!`);
    }
}

function buyNow(productId) {
    console.log('Buy now:', productId);
    showSuccess('Redirecting to checkout...');
}

// Product Upload Handler (placeholder)
function handleProductUpload(event) {
    event.preventDefault();
    console.log('Upload product');
    showSuccess('Product uploaded successfully!');
    closeUploadModal();
}

// Generate Unique Code
function generateUniqueCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `EF${timestamp}${random}`.toUpperCase();
}

// URL Validation
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}