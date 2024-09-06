const updateQnAPromise = waitCanvasLoader("span.points.question_points")
.then(() =>
{
    console.log('Canvas Loader loaded successfully');
    QnA = Extract.QnAInfo();
    console.log(QnA);
})
.then(() =>
{
    let sheet = 
    {
        name: G_URL_INFO['FANumber'],
        rowCountCell: 'G1',
        rowCount: undefined,
        questionColumn: 'A',
        backEndChoiceColumn: 'E',
        backEndChoicesRange: undefined,
        firstQuestionMatchIndex: undefined,
        QnAMatchIndex: undefined,
        rowToInsert: -1,
    }

    console.log(sheet)
    return sheet;
})
.then(sheet =>
{// get rowCount
    console.log(sheet)
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
        sheet.rowToInsert = G_ROW_START - 1; //-1 because it is 0-indexed
        return sheet;
    }
    console.log(sheet)
    const questionsRange = Utils.computeRange(sheet.questionColumn, G_ROW_START, sheet.rowCount);
    return Sheet.read(SPREADSHEET_ID, sheet.name, questionsRange)
    .then(output =>
    {// get range all choices with matching questions if question is found
        const first = binarySearch(output, QnA.question, SEARCH.FIRST);
        const last = binarySearch(output, QnA.question, SEARCH.LAST);
        
        if (!first.isFound)
        {
            sheet.rowToInsert = first.index + G_ROW_START - 1;
        }
        else
        {
            sheet.firstQuestionMatchIndex = first.index;
            sheet.backEndChoicesRange = Utils.computeRange(sheet.backEndChoiceColumn, G_ROW_START + first.index, last.index - first.index + 1);
        }

        return sheet;
    })
})
.then(sheet =>
{// check if choices match
    if (sheet.rowToInsert !== -1)
    {
        return sheet;
    }

    console.log(sheet)
    return Sheet.read(SPREADSHEET_ID, sheet.name, sheet.backEndChoicesRange)
    .then(output =>
    {// returns row in sheet where choices match (0-indexed)
        console.log(output);
        for (let x = 0; x < output.length; ++x)
        {
            const sheetChoice = backEndToStr(output[x][0]);
            const canvasChoice = arrToStr(QnA.choices);

            console.log({sheetChoice, canvasChoice});
            if (sheetChoice.length !== canvasChoice.length)
            {
                continue;
            }

            if (sheetChoice === canvasChoice)
            {
                sheet.QnAMatchIndex = sheet.firstQuestionMatchIndex + x + G_ROW_START - 1;
                break;
            }
        }

        return sheet;
    });
})
.then(sheet =>
{
    console.log(sheet);
    if (sheet.rowToInsert !== -1)
    {
        console.log('insertRow');
        return insertQuestion(sheet, QnA);
    }
})
.catch((error) =>
{
    console.error(error);
});

function insertQuestion(sheetInfo, QnA)
{
    const answer = QnA.questionStatus === Type.Question.CORRECT ? QnA.prevAnswer : undefined;
    const userChoice = arrToUser(QnA.choices);
    const userWrongs = arrToUser(QnA.wrongs);
    const backEndChoice = arrToBackEnd(QnA.choices);
    const backEndWrongs = arrToBackEnd(QnA.wrongs);

    //user side
    return Sheet.insertRow(SPREADSHEET_ID, sheetInfo.name, sheetInfo.rowToInsert, [QnA.question, userChoice, answer, userWrongs, backEndChoice, backEndWrongs])
    .then(() =>
    {
        return Sheet.write(SPREADSHEET_ID, sheetInfo.name, sheetInfo.rowCountCell, [[sheetInfo.rowCount + 1]]);
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

function backEndToStr(backEnd)
{
    if (!backEnd)
    {
        return '';
    }

    const escapedDelimiter = G_DELIMITER.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return backEnd.replace(new RegExp(escapedDelimiter, 'g'), '');
}

function arrToStr(arr)
{
    let str = '';
    arr.forEach(x =>
    {
        str += x;
    });

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