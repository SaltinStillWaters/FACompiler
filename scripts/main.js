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
        rowToInsert: -1,
    }

    return sheet;
})
.then(sheet =>
{
    return Sheet.read(SPREADSHEET_ID, sheet.name, sheet.rowCountCell)
    .then(result =>
    {
        sheet.rowCount = Number(result[0][0]);
        console.log(sheet);
        return sheet;
    })
})
.then(sheet =>
{// check if question exists in sheet
    if (sheet.rowCount === 0)
    {
        sheet.rowToInsert = 1;
        return sheet;
    }

    const questionsRange = Utils.computeRange(sheet.questionColumn, G_ROW_START, sheet.rowCount);
    return Sheet.read(SPREADSHEET_ID, sheet.name, questionsRange)
    .then(output =>
    {
        //bypass if rowCount is 0 just like driver.init.js
        const firstIndex = binarySearch(output, QnA.question, SEARCH.FIRST);
        const lastIndex = binarySearch(output, QnA.question, SEARCH.LAST);
        
        console.log({firstIndex, lastIndex, output});
        
        let indices = 
        {
            first: firstIndex,
            last: lastIndex,
        }
        return indices;
    })
})
.then(sheet =>
{// check if choices match
    return sheet;
})
.then(sheet =>
{
    console.log('insertRow');
    return insertQuestion(sheet, QnA);
})
.catch((error) =>
{
    console.error(error);
});

function insertQuestion(sheetInfo, QnA)
{
    const answer = QnA.questionStatus === Type.Question.CORRECT ? QnA.prevAnswer : undefined;
    const userChoice = unpackForUser(QnA.choices);
    const userWrongs = unpackForUser(QnA.wrongs);
    const backEndChoice = unpackForBackEnd(QnA.choices);
    const backEndWrongs = unpackForBackEnd(QnA.wrongs);

    //user side
    return Sheet.insertRow(SPREADSHEET_ID, sheetInfo.name, sheetInfo.rowToInsert, [QnA.question, userChoice, answer, userWrongs, backEndChoice, backEndWrongs]);
}

function unpackForUser(arr)
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

function unpackForBackEnd(arr)
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