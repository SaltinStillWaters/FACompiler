export function getCorrectAnswers(submissions) {
   let missingAnswers = {};
   let correctAnswers = {};
   let parsedSubmissions = {};
   let submission = restructureSubmission(submissions[0]);

   if (!submission) {
      return null;
   }

   for (let i = 0; i < submissions.length; i++) {
      submission = restructureSubmission(submissions[i]);
      for (let questionID in submission) {
         const question = submission[questionID]

         if (!(questionID in parsedSubmissions)) {
            parsedSubmissions[questionID] = {};
            parsedSubmissions[questionID]['attemptedAnswers'] = [];
            parsedSubmissions[questionID]['bestAttempt'] = question;
            parsedSubmissions[questionID]['latestAttempt'] = question;
         }

         if (parsedSubmissions[questionID].bestAttempt.correct == true) {
            continue;
         };

         if (question.correct == true) {
            parsedSubmissions[questionID].bestAttempt = question;
         } else if (parsedSubmissions[questionID].bestAttempt.points < question.points) {
            parsedSubmissions[questionID].bestAttempt = question;
         } else {
            parsedSubmissions[questionID].attemptedAnswers.push(question);
         }
      }
   }

   return parsedSubmissions;
}

function restructureSubmission(submission) {
   if (!submission.submission_data) {
      return null;
   }

   let restructuredSubmission = {};
   for (let question of submission.submission_data) {
      restructuredSubmission[question.question_id] = question;
   }
   return restructuredSubmission;
}
