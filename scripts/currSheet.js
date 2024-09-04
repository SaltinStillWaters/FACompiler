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

    static #choiceRange = 'Z';
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
                CurrSheet.#questionValue = output;
                const firstIndex = binarySearch(output, QnA.question, SEARCH.FIRST).lastMid;
                const lastIndex = binarySearch(output, QnA.question, SEARCH.LAST).lastMid;
                
                console.log({firstIndex, lastIndex});
                
                let indices = 
                {
                    first: firstIndex,
                    last: lastIndex,
                }
                return indices;
            })
            .then(indices =>
            {
            })
        })
        .then(indices =>
        {
            CurrSheet.#choiceRange += (2 + firstIndex) + ':' + CurrSheet.#choiceRange + (2 + lastIndex);
            console.log(CurrSheet.#choiceRange);
            
            return Sheet.read(SPREADSHEET_ID, CurrSheet.#name, CurrSheet.#choiceRange)
            .then(output =>
            {
                console.log(output, QnA);
                console.log(CurrSheet.#choicesMatch(output, QnA.choices.choices));
            })
        })
    }

    static #choicesMatch(sheetChoices, canvasChoice)
    {
        console.log({canvasChoice, sheetChoices});
        
        for (let x = 0; x < sheetChoices.length; ++x)
        {
            const sheetChoice = sheetChoices[x][0].split(CurrSheet.#delimiter);

            let match = true;
            canvasChoice.forEach(choice => 
            {
                if (!sheetChoice.includes(choice))
                {
                    match = false;
                }    
            });

            if (match)
            {
                return x;
            }
        }

        return -1;
    }
}