class Type
{
    static Question = Object.freeze(
        {
            CORRECT: 'CORRECT',
            PARTIAL: 'PARTIAL',
            WRONG: 'WRONG',
            NEW: 'NEW',
        });
    
    static Input = Object.freeze(
        {
            RADIO: 'radio',
            TEXT: 'text',
        });

    static Color = Object.freeze(
        {
            RED: 'rgb(255, 0, 0)',
            BLACK: 'rgb(51, 51, 51)',
        });
}

class CurrSheet
{
    static #instance = null;
    static #name = null;
    
    static #totalQuestionRange = 'G1';
    static #totalQuestionValue = null;

    static #questionRange = 'A2:A';
    static #questionValue = null;

    static #answerRange = 'C';
    static #answerValue = null;

    static #userChoiceRange = 'B';
    static #userChoiceValue = null;

    static #userWrongAnswerRange = 'D';
    static #userWrongAnswerValue = null;

    static #choiceRange = 'O';
    static #choiceValue = null;

    static #wrongAnswerRange = 'P';
    static #wrongAnswerValue = null;

    static #delimiter = '**EOF**';

    constructor()
    {
        if (CurrSheet.#instance)
        {
            throw new Error('Trying to initialize a singleton: CurrSheet. Use getInstance() instead');
        }

        CurrSheet.#name = G_URL_INFO['FANumber'];
    }

    static getInstance()
    {
        if (!CurrSheet.#instance)
        {
            CurrSheet.#instance = new CurrSheet();
        }

        return CurrSheet.#instance;
    }

    init()
    {
        return Sheet.read(SPREADSHEET_ID, CurrSheet.#name, CurrSheet.#totalQuestionRange)
        .then(result =>
        {
            CurrSheet.#totalQuestionValue = Number(result[0][0]);

            console.log('Total questions: ', CurrSheet.#totalQuestionValue);
            return CurrSheet.#totalQuestionValue;
        })
        .then((total) =>
        {
            CurrSheet.#questionRange += 1 + total;

            console.log('Question range:', CurrSheet.#questionRange);
            return Promise.resolve();
        })
        .then(() =>
        {
            return Sheet.read(SPREADSHEET_ID, CurrSheet.#name, CurrSheet.#questionRange)
            .then(output =>
            {
                console.log(output);
            })
        })
    }
}