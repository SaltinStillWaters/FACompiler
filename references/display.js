import qt from './question_types.js';
import { getPointElements, isIncorrectChoice, getQuestionIDs } from './helpers.js';


export default function display(answers) {

   const questions = document.getElementsByClassName('question');
   const questionTypes = document.getElementsByClassName('question_type');
   const numQuestions = questions.length;
   const displayer = new Displayer();
   const pointHolders = getPointElements();
   const questionIDs = getQuestionIDs();

   for (let i = 0; i < numQuestions; i++) {
      const questionType = questionTypes[i].innerText;
      const questionID = questionIDs[i];

      if (answers[questionID]) {
         const answer = answers[questionID].bestAttempt;
         answer['attemptedAnswers'] = [];
         for (let attemptedAnswer of answers[questionID].attemptedAnswers) {
            if (attemptedAnswer.text != '') {
               answer.attemptedAnswers.push(attemptedAnswer.text);
            }
         }

         switch (questionType) {
            case qt.ESSAY_QUESTION:
               displayer.displayEssay(answer, questionID);
            case qt.MATCHING:
               displayer.displayMatching(answer, questionID);
               break;
            case qt.MULTIPLE_ANSWER:
               displayer.displayMultipleAnswer(answer, questionID);
               break;
            case qt.MULTIPLE_CHOICE:
            case qt.TRUE_FALSE:
               displayer.displayMultipleChoise(answer, questionID);
               break;
            case qt.FILL_IN_BLANK:
            case qt.FORMULA_QUESTION:
            case qt.NUMERICAL_ANSWER:
               displayer.displayFillInBlank(answer, questionID);
               break;
            case qt.FILL_IN_M_BLANK:
               displayer.displayFillInMultipleBlank(answer, questionID)
               break
         }

         const earnedPoints = Math.round(answer.points * 100) / 100;
         if (earnedPoints == parseFloat(pointHolders[i].innerText)) {
            pointHolders[i].classList.add("correct-answer");
         } else {
            pointHolders[i].classList.add("incorrect-answer");
         }
         pointHolders[i].innerText = `${earnedPoints} out of ${pointHolders[i].innerText}`;
      } else {
         pointHolders[i].innerText = `(New Question) ${pointHolders[i].innerText}`;
      }
   }
}

export class Displayer {
   displayMatching(answer, questionID) {
      if (!answer) {
         return;
      }

      for (let answerProperty in answer) {
         if (answerProperty.includes('answer_')) {
            const answerID = `question_${questionID}_${answerProperty}`;
            document.getElementById(answerID).value = answer[answerProperty];
         }
      }
   }

   displayMultipleAnswer(answer, questionID) {
      if (!answer) {
         return;
      }

      for (let answerProperty in answer) {
         if (answerProperty.includes('answer_')) {
            const answerID = `question_${questionID}_${answerProperty}`;
            document.getElementById(answerID).checked = parseInt(answer[answerProperty]);
         }
      }
   }

   displayMultipleChoise(answer, questionID) {
      if (!answer) {
         return;
      }


      if ('attemptedAnswers' in answer && answer.attemptedAnswers.length) {
         for (let answerID of answer.attemptedAnswers) {
            const answerIDStr = `question_${questionID}_answer_${answerID}`;
            const el = document.getElementById(answerIDStr)
            el.parentElement.nextElementSibling.className += ' incorrect-answer';
         }
      }

      if (!('answer_id' in answer)) {
         return;
      }

      const answerID = `question_${questionID}_answer_${answer.answer_id}`;
      const el = document.getElementById(answerID);

      if (!el) {
         return;
      }

      if (!isIncorrectChoice(el)) {
         el.checked = true;
      }

      // if only one left, select it
      // if (!answer.correct === true) {
      //    const possibleAnswers = el.parentElement.parentElement.parentElement.parentElement.children;
      //    if (possibleAnswers.length - answer.attemptedAnswers.length === 1) {
      //       for (let answerEl of possibleAnswers) {
      //          const checkbox = answerEl.firstElementChild.firstElementChild.firstElementChild;
      //          if (!isIncorrectChoice(checkbox)) {
      //             checkbox.checked = true;
      //          }
      //       }
      //    }
      // }
   }

   displayFillInBlank(answer, questionID) {
      if (!answer) {
         return;
      }

      let element = null;
      const elements = document.getElementsByName(`question_${questionID}`);
      for (let el of elements) {
         if (el.tagName === 'INPUT') {
            element = el;
            break;
         }
      }

      element.value = answer.text;
   }

   displayEssay(answer, questionID) {
      if (!answer) {
         return;
      }

      let topParent;
      setTimeout(() => {
         try {
            topParent = document.getElementById(`question_${questionID}_question_text`);
            const parent = topParent.nextElementSibling.firstElementChild.children[2].firstElementChild.firstElementChild.children[1].firstElementChild;
            const iframe = parent.contentDocument ? parent.contentDocument : parent.contentWindow.document;
            iframe.getElementById('tinymce').innerHTML = answer.text;
         } catch (e) {
            topParent.innerHTML += `<p>${answer.text}</p>`;

         }
      }, 500);



   }

   displayFillInMultipleBlank(answer, questionID) {
      if (!answer) {
         return;
      }

      const topParent = document.getElementById(`question_${questionID}_question_text`);
      const inputs = topParent.querySelectorAll('input')
      const answerKeys = Object.keys(answer).filter(key => key.includes('answer_for'))

      if (answerKeys.length != inputs.length)
         return

      for (let i = 0; i < inputs.length; i++)
         inputs[i].value = answer[answerKeys[i]]
   }
}
