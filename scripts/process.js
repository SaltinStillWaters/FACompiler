let currURL = window.location.href;

retrieveDataLocal('currURL', function(val) {
    let cleanedURL = currURL.split('/take')[0]  + '/take';

    if (val && val == cleanedURL) {
        console.log('currURL matches the currURL in local storage');
    } else {
        console.log('currURL does not match the currURL in local storage');
        console.log('currURL: ' + cleanedURL);
        console.log('local: ' + val);

        updateDataLocal(cleanedURL);
    }

    console.log('val: ' + val);
    console.log('currURL: ' + currURL);
});

function updateDataLocal(url) {
    storeDataLocal('courseID', getCourseID());
    storeDataLocal('FANumber', getFANumber());
    storeDataLocal('currURL', url);
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
    });
}

function getDataLocal(key) {
    retrieveDataLocal(key, function(val) {
        if (val) {
            console.log('Course ID is ' + val);
        } else {
            console.log('No Course ID found');
        }
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