import { getQuizSubmissions } from './submissions.js';
import { getCorrectAnswers } from './answers.js';
import display from './display.js';

loadQuiz();

async function loadQuiz() {
    const currentURL = window.location.href;
    const courseID = currentURL.split('courses/')[1].split('/')[0];
    const quizID = currentURL.split('quizzes/')[1].split('/')[0];
    const splittedURL = currentURL.split('/');
    const baseURL = `${splittedURL[0]}//${splittedURL[2]}/`;

    if (!courseID || !parseInt(courseID)) {
        console.error('Unable to retrieve course id');
    } else if (!quizID || !parseInt(quizID)) {
        console.error('Unable to retrieve quiz id');
    }

    const submissions = await getQuizSubmissions(courseID, quizID, baseURL);
    const correctAnswers = getCorrectAnswers(submissions);

    if (!correctAnswers) {
        return null;
    }

    display(correctAnswers);
};

const script = document.createElement('script');
script.innerHTML = "confirm = function(){return true;}"
document.body.appendChild(script);
/*
    TODO
    * Don't paste in inccorect answers (or have an option to view past answers)
    * Don't overwrite what is already there
    * Create seetings



    Settings:
    * Autoselect last available option in multiple choice and true/false questions
    * Enable disable the app
    * Multiple choice and True/False helper
    *   disable incorrect answer
    *   color code incorrect answer
    * If correct answer is not found:
    *   apply answer from latest attempt
    *   apply best answer
*/
