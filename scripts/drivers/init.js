const initSheetPromise = chrome.storage.local.get(G_KEYS)
.then(localData =>
{// get/update local storage
    console.log("Fetched local data");
    if (localData['currURL'] === Extract.cleanedURL())
    {
        console.log("Local data matches current URL");
        return G_URL_INFO = localData;  //early return is needed. Returned value is not important
    }
    
    console.log('Local Data needs update. Updating...');
    G_URL_INFO = Extract.URLInfo();
    return chrome.storage.local.set(G_URL_INFO);
})
.then(() =>
{// get row count of Info Sheet
    console.log("Local data is up to date");

    console.log("Reading row count from: 'Info Sheet'...");
    return Sheet.read(SPREADSHEET_ID, G_INFO_SHEET.name, G_INFO_SHEET.rowCountCell)
    .then(result =>
    {
        console.log("Info sheet row count:", Number(result[0][0]));
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
            
        console.log("Table extracted:", result);
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
    let index = binarySearch(info.table, key).index;

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
        console.log(`Creating sheet ${G_URL_INFO['FAID']} with info: `, info, `...`);
    
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
                return Promise.reject('Failed to create new Sheet: ' + G_URL_INFO['FANumber']);
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
                return Promise.reject("Sheet: " + G_URL_INFO['FANumber'] + ' not initialized');
            }
        })
    }   
})
.catch((error) =>
{
    console.error(error);
});

function initSheet(spreadsheetID, sheetName)
{
    return Sheet.write(spreadsheetID, sheetName, 'A1:G1', [['QUESTIONS', 'CHOICES', 'ANSWERS', 'WRONG ANSWERS', 'BACKEND CHOICES', 'BACKEND WRONGS' , 0]]);
}