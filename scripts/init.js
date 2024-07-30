getCourseID();

function getCourseID() {
    let URL = window.location.href;
    let match = URL.match(/courses\/(\d+)/);
    
    //add error handling
    let courseID = match[1];
    console.log('course id: ' + courseID);
    
    //add error handling
    let FANumber = document.querySelector('header.quiz-header').querySelector('h1').textContent;
    console.log('FA number: ' + FANumber);
}