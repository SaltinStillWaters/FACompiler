chrome.storage.local.get(G_KEYS)
.then(response =>
{
    if (response['currURL'] === Extract.getCleanedURL())
    {
        console.log('Local Data matches current URL');
        return response;
    }

    console.log('Local Data needs update');
    
    return chrome.storage.local.set(Extract.getURLInfo())
    .then(() =>
    {
        console.log('Local Data updated');
        return chrome.storage.local.get(G_KEYS);
    });
})
.then(newURLInfo =>
{
    G_URL_INFO = newURLInfo;
    console.log('Updated global var: G_URL_INFO');

    console.log("Reading row count from sheet")
    return Sheet.read(SPREADSHEET_ID, G_INFO_SHEET.name, G_INFO_SHEET.rowCountCell)
    .then(result =>
    {
        G_INFO_SHEET.rowCount =  Number(result[0][0]);
        console.log('Row count: ', G_INFO_SHEET.rowCount);

        return Promise.resolve();
    })
})
.then(() =>
{
    if (G_INFO_SHEET.rowCount === 0)
    {
        return Promise.resolve();
    }

    updateInfoSheetRange();

    return Sheet.read(SPREADSHEET_ID, G_INFO_SHEET.name, G_INFO_SHEET.tableRange)
    .then(result =>
    {
        result = result.map(row =>
            row.map(val =>
            {
                num = parseInt(val);
                return isNaN(num) ? val : num;
            })
        );

        G_INFO_SHEET.tableValues = result;
        return Promise.resolve();
    })
})
.then(() =>
{
    let result = 
    {
        createSheet: true,
        indexToInsert: undefined,
    };

    if (G_INFO_SHEET.rowCount === 0)
    {
        result.indexToInsert = 1;
        return result
    }

    const key = Number(G_URL_INFO['FAID']);
    let index = binarySearch(key, G_INFO_SHEET.tableValues);
    

    if (G_INFO_SHEET.tableValues[index][0]  === key)
    {
        result.createSheet = false;
    }
    else if (key > G_INFO_SHEET.tableValues[index][0])
    {
        index++;
    }

    result.indexToInsert = index + 1; //+1 because row 1 is the header
    return result; 
})
.then(result =>
{
    if (result.createSheet)
    {
        console.log(`Sheet ${G_URL_INFO['FAID']} does not exists`);
        console.log(`Creating sheet ${G_URL_INFO['FAID']}`);
    
        return Sheet.create(SPREADSHEET_ID, G_URL_INFO["FANumber"])
        .then(newSheet =>
        {
            if (newSheet)
            {
                console.log(`Sheet: ${G_URL_INFO['FANumber']} created`);
                return initSheet(SPREADSHEET_ID, G_URL_INFO['FANumber']);
            }
            else
            {
                return Promise.reject('Failed to create new Sheet: ', G_URL_INFO['FANumber']);
            }
        })
        .then(initResponse =>
        {
            if (initResponse)
            {
                console.log("Sheet: ", G_URL_INFO['FANumber'], ' initialized');
                return Sheet.insertRow(SPREADSHEET_ID, G_INFO_SHEET.name, result.indexToInsert, [G_URL_INFO['FAID'], G_URL_INFO['FANumber']])
                .then(() =>
                {
                    return Sheet.write(SPREADSHEET_ID, G_INFO_SHEET.name, G_INFO_SHEET.rowCountCell, [[G_INFO_SHEET.rowCount + 1]]);
                });
            }
            else
            {
                console.log("Sheet: ", G_URL_INFO['FANumber'], ' not initialized');
                return Promise.reject();
            }
        })
    }   
})
.then(() =>
{
    console.log('Waiting for Canvas Loader to load');

    return waitCanvasLoader("span.points.question_points")
    .then(() =>
    {
        console.log('Canvas Loader loaded successfully');
        return Promise.resolve();
    })
})
.then(() =>
{
    let questionStatus = document.querySelector("span.question_points_holder").textContent;
    console.log("questionStatus: ", questionStatus);

    questionStatus = getQuestionStatus(questionStatus);
    console.log("Translated question status: ", questionStatus);

    const question = document.querySelector('.question_text.user_content').textContent;
    console.log(question);

    const answerType = getAnswerType();
    console.log('Answer type: ', answerType);

    getChoices(answerType);
})
.catch((error) =>
{
    console.error(error.message);
});

function getChoices(answerType)
{
    if (answerType === 'radio')
    {
        let choices = [];
        document.querySelectorAll('.answer_label')
        .forEach(div =>
        {
            choices.push(div.textContent.slice(9, div.textContent.length - 7));
        });

        console.log(choices);
        return choices;
    }
}
function getAnswerType()
{
    const inputType = document.querySelector('.question_input').type;

    if (inputType !== 'radio' && inputType !== 'text')
    {
        throw new Error('Unexpected input type of: ' + inputType);
    }

    return inputType;
}
function getQuestionStatus(rawStatus)
{
    if (rawStatus.includes('New Question'))
    {
        return 'new';
    }
    
    let nums = [];

    let split = rawStatus.split(' ');
    for(let x = 0; x < split.length; ++x)
    {
        if (!isNaN(Number(split[x])))
        {
            nums.push(Number(split[x]));
        }
    }

    if (nums.length !== 2)
    {
        throw new Error('Unexpected Question Status: Does not contain exactly 2 numbers');
    }

    if (nums[0] === nums[1])
    {
        return 'correct';
    }
    else if (nums[0] === 0)
    {
        return 'incorrect';
    }
    else if (nums[0] < nums[1])
    {
        return 'partially incorrect';
    }
    else
    {
        throw new Error('Unexpected Question Status');
    }
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

function updateInfoSheetRange()
{
    let splitRange = G_INFO_SHEET.tableRange.split('b');
    let num = Number(splitRange[1]);
    
    num += G_INFO_SHEET.rowCount;
    num = String(num);

    G_INFO_SHEET.tableRange = splitRange[0] + 'b' + num;
}

function binarySearch(key, range)
{
    let left = 0;
    let right = range.length - 1;

    console.log(key, range);
    while(left <= right)
    {
        mid = Math.floor((left + right) / 2);
        
        if (key < range[mid][0])
        {
            right = mid - 1;
        }
        else if (key > range[mid][0])
        {
            left = mid + 1;
        }
        else
        {
            return mid;
        }
    }

    return mid;
}

function initSheet(spreadsheetID, sheetName)
{
    return Sheet.write(spreadsheetID, sheetName, 'A1:G1', [['QUESTIONS', 'CHOICES', 'ANSWERS', 'WRONG ANSWERS', null , 'TOTAL QUESTIONS:', 0]]);
}