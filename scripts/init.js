updateDataLocal();

function updateDataLocal() {
    storeDataLocal('courseID', getCourseID());
    storeDataLocal('FANumber', getFANumber());
    storeDataLocal('currURL', window.location.href);
}

function getCourseID() {
    let currURL = window.location.href;
    let match = currURL.match(/courses\/(\d+)/);
    
    return match[1];
}

function getFANumber() {
    return document.querySelector('header.quiz-header').querySelector('h1').textContent;
}

function storeDataLocal(key, val) {
    chrome.storage.local.set({[key] : val}, function() {
        console.log('key: ' + key + ', val: ' + val + ' is set');
        console.log('init.js is running at', new Date().toLocaleString());
    });
}

function retrieveDataLocal(key, callback) {
    chrome.storage.local.get([key], function(result) {
        if (result[key]) {
            console.log('val of key: ' + key + ' is: ' + result[key]);
            callback(result[key]);
        } else {
            console.log('key: ' + key + ' not found');
            callback(null);
        }
    });
}