import { cleanRes } from './helpers.js';

export async function getQuizSubmissions(courseID, quizID, baseURL) {
    const quizURL = `${baseURL}api/v1/courses/${courseID}/quizzes/${quizID}/`;
    const submissionsURL = quizURL + 'submissions';

    return await (Promise.all([fetch(quizURL), fetch(submissionsURL)])
        .then(([resQuiz, resSubmissions]) => {
            return (Promise.all([resQuiz.text(), resSubmissions.text()])
                .then(([resQuiz, resSubmissions]) => {
                    return [JSON.parse(resQuiz), JSON.parse(resSubmissions).quiz_submissions];
                }))
        })
        .then(([resQuiz, resSubmissions]) => {
            const assignmentID = resQuiz.assignment_id;
            const userID = resSubmissions[resSubmissions.length - 1].user_id;

            if (!assignmentID) {
                throw new Error('Unable to retrieve assignmentID');
            } else if (!userID) {
                throw new Error('Unable to retrieve userID');
            }

            const submissionsHistoryURL = `${baseURL}api/v1/courses/${courseID}/assignments/${assignmentID}/submissions/${userID}?include[]=submission_history`;
            return fetch(submissionsHistoryURL);
        })
        .then((res) => {
            return (res.text()
                .then((res) => JSON.parse(res)))
        })
        .then((res) => {
            return res.submission_history;
        }))
}

