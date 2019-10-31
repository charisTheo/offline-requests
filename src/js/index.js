if (!global._babelPolyfill) {
	require('babel-polyfill');
}

import './../css/main.css';
import './../css/offline-theme-dark.css';

import '@polymer/paper-card/paper-card';
import '@polymer/paper-button/paper-button';
import '@polymer/paper-toolbar/paper-toolbar';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/iron-icons/iron-icons';
import '@polymer/paper-item/paper-item';
import '@polymer/paper-item/paper-item-body';
import '@polymer/paper-item/paper-icon-item';

import "./offline.min";
import { showSnackBar } from "./snackBar";
import {
    getNotificationPermission,
    requestNotificationPermission,
    requestNotification,
    subscribeToPushManager
} from "./notifications";
import {
    db,
    addItemToObjectStore,
    removeItemFromObjectStore,
    getAllItemsInObjectStore,
    configureLocalDatabase
} from './indexDB';
import {
    addToCart,
    deleteItemFromCart,
    addItemDescriptionToShoppingCart,
    removeItemDescriptionFromShoppingCart,
    removeAllItemsDescriptionsFromShoppingCart,
    clearShoppingCart,
    initialiseNumberOfCartItems,
    updateNumberOfCartItems,
    toggleShoppingCart
} from './shopping-cart';

const API_URL = 'https://ecommerce-pwa.herokuapp.com';
const NOTIFICATIONS_ACTIVE_URL = './img/notifications-active.svg';
const NOTIFICATIONS_NONE_URL = './img/notifications-none.svg';
const notificationsRequestButton = document.getElementById('notifications-request-button');
const shoppingCartButton = document.getElementById('shopping-cart-button');
const cartCloseButton = document.getElementById('cart-close-button');
const checkoutButton = document.getElementById('checkout-button');
const addToCartButtons = document.querySelectorAll('.add-to-cart-button');

window.addEventListener('load', async () => {
    // TODO register service worker
    const registration = await registerServiceWorker();

    attachClickEventListeners();
    initialiseNumberOfCartItems();
    
    // * initialise notificationsRequestBtn notification icon src after checking the pushManager's permission
    const pushPermission = await getNotificationPermission();
    const notificationButtonIconSrc = pushPermission === "granted" ? NOTIFICATIONS_ACTIVE_URL : NOTIFICATIONS_NONE_URL;
    notificationsRequestButton.setAttribute('src', notificationButtonIconSrc);
});

const attachClickEventListeners = () => {
    addToCartButtons.forEach(button => button.addEventListener('click', addToCart));
    shoppingCartButton.addEventListener('click', toggleShoppingCart);
    cartCloseButton.addEventListener('click', toggleShoppingCart);
    checkoutButton.addEventListener('click', checkout);
    notificationsRequestButton.addEventListener('click', requestNotificationPermission);
}

const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: '/offline-requests' });
        return registration;
    } else {
        return null;
    }
}

const checkout = async event => {
    const response = await fetch(`${API_URL}/checkout`, { 
        method: 'GET', 
    });
    const items = await response.json();
    console.log("checkout: items", items);
    
    if (response.status === 200) {
        removeAllItemsDescriptionsFromShoppingCart();
        showSnackBar(`🤟 Yeayy!! Checkout 🛒! 🤟`);
    } else {
        showSnackBar(`There was an error during the checkout of your cart 😕`);
    }
}

window.addEventListener('offline', async () => {
    // showSnackBar('You are offline 📴');
    configureLocalDatabase();
    const registration = await navigator.serviceWorker.getRegistration('/offline-requests');
    // * register Background Sync event
    registration.sync.register('sync-cart-items');
});

window.addEventListener('online', function() {
    // showSnackBar('You are back online! 🎉');
    // TODO use background sync to add or remove items from IndexDB to the API
});

if (window.Offline) {
    window.Offline.options = {
        checkOnLoad: true,
        requests: true
    }
}
