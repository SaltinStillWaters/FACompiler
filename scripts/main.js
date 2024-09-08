const extractQnAPromise = waitCanvasLoader("span.points.question_points")
.then(() =>
{
    console.log('Canvas Loader loaded successfully');
    QnA = Extract.QnAInfo();
    console.log(QnA);
})
.catch(error => console.error(error));

Promise.all([initSheetPromise, extractQnAPromise])
.then(() =>
{
    let sheet = 
    {
        name: G_URL_INFO['FANumber'],
        rowCountCell: 'I1',
        rowCount: null,
        questionColumn: 'A',
        backEndChoiceColumn: 'E',
        backEndChoicesRange: null,
        backEndAnswerColumn: 'F',
        backEndWrongsColumn: 'G',
        firstQuestionMatchRow: null,
        QnAMatchRow: null,
        rowToInsert: null,
    }

    return sheet;
})
.then(sheet =>
{// get rowCount
    return Sheet.read(SPREADSHEET_ID, sheet.name, sheet.rowCountCell)
    .then(result =>
    {
        sheet.rowCount = Number(result[0][0]);
        return sheet;
    })
})
.then(sheet =>
{// check if question exists in sheet
    if (sheet.rowCount === 0)
    {
        sheet.rowToInsert = G_ROW_START;
        return sheet;
    }
    
    const questionsRange = Utils.computeRange(sheet.questionColumn, G_ROW_START, sheet.rowCount);

    return Sheet.read(SPREADSHEET_ID, sheet.name, questionsRange)
    .then(output =>
    {// get range all choices with matching questions if question is found
        const first = binarySearch(output, QnA.question, SEARCH.FIRST);
        const last = binarySearch(output, QnA.question, SEARCH.LAST);
        
        console.log(first, last)
        if (!first.isFound)
        {
            sheet.rowToInsert = first.index + G_ROW_START;
            if (QnA.question > output[first.index][0])
            {
                ++sheet.rowToInsert;
            }
        }
        else
        {
            sheet.firstQuestionMatchRow = first.index + G_ROW_START;
            sheet.backEndChoicesRange = Utils.computeRange(sheet.backEndChoiceColumn, G_ROW_START + first.index, last.index - first.index + 1);
        }

        return sheet;
    })
})
.then(sheet =>
{// check if choices match
    if (sheet.rowToInsert)  return sheet;

    console.log(sheet)
    return Sheet.read(SPREADSHEET_ID, sheet.name, sheet.backEndChoicesRange)
    .then(output =>
    {// returns row in sheet where choices match (0-indexed)
        console.log(output);
        for (let x = 0; x < output.length; ++x)
        {
            const sheetChoice = backEndToStr(output[x][0]);
            const canvasChoice = arrToStr(QnA.choices);

            console.log(sheetChoice, canvasChoice);
            
            if (QnA.inputType === Type.Input.TEXT)
            {
                if (sheetChoice === G_DELIMITER)
                {
                    sheet.QnAMatchRow = sheet.firstQuestionMatchRow + x;
                    break;
                }

                if (sheetChoice.length !== canvasChoice.length)
                {
                    continue;
                }
            }
            else if (sheetChoice == canvasChoice)
            {
                sheet.QnAMatchRow = sheet.firstQuestionMatchRow + x;
                break;
            }
        }

        if (!sheet.QnAMatchRow)
        {
            sheet.rowToInsert = sheet.firstQuestionMatchRow;
        }
        return sheet;
    });
})
.then(sheet =>
{
    console.log('Final sheet info: ', sheet);

    if (sheet.rowToInsert)
    {
        console.log('insertRow at Row (0-indexed): ' + sheet.rowToInsert);
        return insertQuestion(sheet, QnA);
    }
    else if (sheet.QnAMatchRow)
    {
        console.log('QnA found at Row (0-indexed): ' + sheet.QnAMatchRow)
        return updateQnA(sheet, QnA);
    }
    else
    {
        throw new Error('Unexpected sheet value. Cannot determine wether to update or insert QnA');
    }
})
.catch((error) =>
{
    console.error(error);
});

function updateQnA(sheet, QnA)
{
    const backEndAnswerRange = Utils.computeRange(sheet.backEndAnswerColumn, sheet.QnAMatchRow, 1);

    return Sheet.read(SPREADSHEET_ID, sheet.name, backEndAnswerRange)
    .then(result =>
    {
        result = result[0][0];

        if (result)
        {
            if (QnA.inputType === Type.Input.TEXT)
            {
                if (QnA.questionStatus === Type.Question.CORRECT)
                {
                    const backEndAnwers = backEndToArr(result);
                    if (!backEndAnwers.includes(QnA.answer))
                    {
                        return Sheet.write(SPREADSHEET_ID, sheet.name, backEndAnswerRange, [[result + QnA.answer]]);
                    }
                }
            }
        }
    })
}

function insertQuestion(sheet, QnA)
{
    const answer = QnA.questionStatus === Type.Question.CORRECT ? QnA.prevAnswer : null;
    const userChoice = arrToUser(QnA.choices);
    const userWrongs = arrToUser(QnA.wrongs);

    let backEndChoice = arrToBackEnd(QnA.choices);
    backEndChoice = backEndChoice ? backEndChoice : G_DELIMITER;

    let backEndAnswer = answer ? answer + G_DELIMITER : G_DELIMITER;

    let backEndWrongs = arrToBackEnd(QnA.wrongs);
    backEndWrongs = backEndWrongs ? backEndWrongs : G_DELIMITER;

    //user side
    return Sheet.insertRow(SPREADSHEET_ID, sheet.name, sheet.rowToInsert, [QnA.question, userChoice, answer, userWrongs, backEndChoice, backEndAnswer, backEndWrongs])
    .then(() =>
    {
        return Sheet.write(SPREADSHEET_ID, sheet.name, sheet.rowCountCell, [[sheet.rowCount + 1]]);
    });
}

function arrToUser(arr)
{
    if (!Array.isArray(arr))
    {
        return arr;
    }

    let str = '';
    arr.forEach(x =>
    {
        if (x)
        {
            str += x + ".\n\n\n";
        }
    });

    return str.trimEnd();
}

function arrToBackEnd(arr)
{
    if (!Array.isArray(arr))
    {
        return arr;
    }

    let str = '';
    arr.forEach(x =>
    {
        if (x)
        {
            str += x + G_DELIMITER;
        }
    });

    return str;
}
function backEndToArr(backEnd)
{
    return backEnd.split(G_DELIMITER);
}

function backEndToStr(backEnd)
{
    if (!backEnd)
    {
        return '';
    }
    else if (backEnd === G_DELIMITER)
    {
        return backEnd;
    }

    const escapedDelimiter = G_DELIMITER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return backEnd.replace(new RegExp(escapedDelimiter, 'g'), '');
}

function arrToStr(arr)
{
    let str = '';
    if (arr)
    {
        arr.forEach(x =>
        {
            str += x;
        });
    }

    return str;
}

function waitCanvasLoader(selector, interval = 100, maxWait = 10000)
{
    return new Promise((resolve, reject) =>
    {
        const checkExistence = setInterval(() =>
        {
            const element = document.querySelector(selector);
            if (!element)
            {
                clearInterval(checkExistence);
                resolve();
            }
        }, interval);
        
        setTimeout(() =>
        {
            clearInterval(checkExistence);
            reject(new Error('Max wait of ' + maxWait/1000 + ' seconds for Canvas Loader exceeded'));
        }, maxWait);
    });
}