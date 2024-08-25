chrome.storage.local.get(KEYS)
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
        return chrome.storage.local.get(KEYS);
    })
})
.then(newURLInfo =>
{
    URL_INFO = newURLInfo;
    console.log('Updating global var: URL_INFO');

    return Sheet.read(SPREADSHEET_ID, INFO_SHEET.name, INFO_SHEET.rowCountCell)
    .then(result =>
    {
        INFO_SHEET.rowCount =  Number(result[0][0]);
        console.log('Reading row count from sheet: ', INFO_SHEET.rowCount);

        return Promise.resolve();
    })
})
.then(() =>
{
    if (INFO_SHEET.rowCount === 0)
    {
        return Promise.resolve();
    }

    updateInfoSheetRange();

    return Sheet.read(SPREADSHEET_ID, INFO_SHEET.name, INFO_SHEET.tableRange)
    .then(result =>
    {
        result = result.map(row =>
            row.map(val =>
            {
                num = parseInt(val);
                return isNaN(num) ? val : num;
            })
        );

        INFO_SHEET.tableValues = result;
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

    if (INFO_SHEET.rowCount === 0)
    {
        result.indexToInsert = 1;
        return result
    }


    const key = Number(URL_INFO['FAID']);
    let index = binarySearch(key, INFO_SHEET.tableValues);
    

    if (INFO_SHEET.tableValues[index][0]  === key)
    {
        result.createSheet = false;
    }
    else if (key > INFO_SHEET.tableValues[index][0])
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
        console.log(`Sheet ${URL_INFO['FAID']} does not exists`);
        console.log(`Creating sheet ${URL_INFO['FAID']}`);
    
        return Sheet.create(SPREADSHEET_ID, URL_INFO["FANumber"])
        .then(newSheet =>
        {
            if (newSheet)
            {
                console.log(`Sheet: ${URL_INFO['FANumber']} created`);
                return initSheet(SPREADSHEET_ID, URL_INFO['FANumber']);
            }
            else
            {
                return Promise.reject('Failed to create new Sheet: ', URL_INFO['FANumber']);
            }
        })
        .then(initResponse =>
        {
            if (initResponse)
            {
                console.log("Sheet: ", URL_INFO['FANumber'], ' initialized');
                return Sheet.insertRow(SPREADSHEET_ID, INFO_SHEET.name, result.indexToInsert, [URL_INFO['FAID'], URL_INFO['FANumber']])
                .then(() =>
                {
                    return Sheet.write(SPREADSHEET_ID, INFO_SHEET.name, INFO_SHEET.rowCountCell, [[INFO_SHEET.rowCount + 1]]);
                });
            }
            else
            {
                console.log("Sheet: ", URL_INFO['FANumber'], ' not initialized');
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

    console.log(getQuestionStatus(questionStatus));
})
.catch((error) =>
{
    console.error(error.message);
});

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
            reject(new Error('Max wait of ' + maxWait + ' seconds for Canvas Loader exceeded'));
        }, maxWait);
    });
}

function updateInfoSheetRange()
{
    let splitRange = INFO_SHEET.tableRange.split('b');
    let num = Number(splitRange[1]);
    
    num += INFO_SHEET.rowCount;
    num = String(num);

    INFO_SHEET.tableRange = splitRange[0] + 'b' + num;
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