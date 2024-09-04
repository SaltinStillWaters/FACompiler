chrome.storage.local.get(G_KEYS)
.then(localData =>
{// get/update local storage
    if (localData['currURL'] === Extract.cleanedURL())
    {
        return G_URL_INFO = localData;
    }
    
    console.log('Local Data needs update. Updating...');

    G_URL_INFO = Extract.URLInfo();
    return chrome.storage.local.set(G_URL_INFO);
})
.then(() =>
{// get row count of Info Sheet
    console.log("Reading row count from: 'Info Sheet'...");

    return Sheet.read(SPREADSHEET_ID, G_INFO_SHEET.name, G_INFO_SHEET.rowCountCell)
    .then(result =>
    {
        return Number(result[0][0]);
    })
})
.then(rowCount =>
{// init info var to be used by subsequent API calls
    let info = 
    {
        createSheet: true,
        indexToInsert: undefined,
        rowCount: rowCount,
        range: undefined,
    };

    if (rowCount === 0)
    {// no need to search where to insert. Just insert at 1st row
        info.indexToInsert = 1;
    }
    
    return info;
})
.then(info =>
{// generate table to know which row to insert
    if (info.rowCount === 0)
    {// no need to search where to insert. Just insert at 1st row
        return info;
    }

    range = Utils.computeRange(G_INFO_SHEET.tableColumn, G_ROW_START, info.rowCount);
    
    return Sheet.read(SPREADSHEET_ID, G_INFO_SHEET.name, range)
    .then(result =>
    {
        console.log('Extracting table from Info Sheet...');

        result = result.map(row =>
            row.map(val =>
                {
                    num = parseInt(val);
                    return isNaN(num) ? val : num;
                })
            );
            
        info.table = result;
        return info;
    });
})
.then(info =>
{// get index to insert at
    if (info.rowCount === 0)
    {// no need to search where to insert. Just insert at 1st row
        return info;
    }

    const key = Number(G_URL_INFO['FAID']);
    let index = binarySearch(info.table, key).lastMid;

    console.log({G_INFO_SHEET, index, key});
    if (info.table[index][0] === key)
    {
        info.createSheet = false;
    }
    else if (key > info.table[index][0])
    {
        index++;
    }

    info.indexToInsert = index + 1; //+1 because data starts at row 2
    return info; 
})
.then(info =>
{// creates sheet if it does not exist and initializes it
    if (info.createSheet)
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
                return Sheet.insertRow(SPREADSHEET_ID, G_INFO_SHEET.name, info.indexToInsert, [G_URL_INFO['FAID'], G_URL_INFO['FANumber']])
                .then(() =>
                {
                    return Sheet.write(SPREADSHEET_ID, G_INFO_SHEET.name, G_INFO_SHEET.rowCountCell, [[info.rowCount + 1]]);
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
    console.log('Waiting for Canvas Loader to load...');

    return waitCanvasLoader("span.points.question_points")
    .then(() =>
    {
        console.log('Canvas Loader loaded successfully');
        return Promise.resolve();
    })
})
.then(() =>
{
    QnA = Extract.QnAInfo();

    return Promise.resolve();
})
.then(() =>
{
    const sheet = CurrSheet.getInstance();
    return sheet.init();
})
.catch((error) =>
{
    console.error(error);
});


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

function initSheet(spreadsheetID, sheetName)
{
    return Sheet.write(spreadsheetID, sheetName, 'A1:G1', [['QUESTIONS', 'CHOICES', 'ANSWERS', 'WRONG ANSWERS', null , 'TOTAL QUESTIONS:', 0]]);
}