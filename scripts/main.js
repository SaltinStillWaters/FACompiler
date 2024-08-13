const KEYS = ['currURL', 'FANumber', 'courseID', 'FAID', 'questionID'];
const SPREADSHEET_ID = '1Nt9_t6cTjv-J7Ej9q-b9NK8aETeB0OxEkr4eFGz_D4I';

const INFO_SHEET =
{
    name: 'Info',
    rowCountCell: 'e1',
    tableRange: 'a2:b2',
    rowCount: undefined,
    tableValues: undefined,
}

let URL_INFO;


chrome.storage.local.get(KEYS)
.then(response =>
{
    if (response['currURL'] === getCleanedURL())
    {
        console.log('Local Data matches current URL');
        return response;
    }

    console.log('Local Data needs update');
    
    return chrome.storage.local.set(getURLInfo())
    .then(() =>
    {
        console.log('Local Data updated');
        return chrome.storage.local.get(KEYS);
    })
})
.then(newURLInfo =>
{
    URL_INFO = newURLInfo;

    return readFromSheet(SPREADSHEET_ID, INFO_SHEET.name, INFO_SHEET.rowCountCell)
    .then(result =>
    {
        INFO_SHEET.rowCount =  Number(result[0][0]);
        return Promise.resolve();
    })
})
.then(() =>
{
    updateInfoSheetRange();

    return readFromSheet(SPREADSHEET_ID, INFO_SHEET.name, INFO_SHEET.tableRange)
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
    const key = Number(URL_INFO['FAID']);
    const index = binarySearch(key, INFO_SHEET.tableValues);
    
    if (INFO_SHEET.tableValues[index][0]  !== key)
    {
        console.log(`Sheet ${key} does not exists`);
        console.log(`Creating sheet ${key}`);

        return createSheet(SPREADSHEET_ID, URL_INFO["FANumber"])
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
                    return Promise.resolve();
                }
                else
                {
                    console.log("Sheet: ", URL_INFO['FANumber'], ' not initialized');
                    return Promise.reject();
                }
            })
    }
})
// .then((exists) =>
// {
//     if (exists)
//     {
//         console.log('Sheet: ', URL_INFO['FANumber'], ' exists');
//         return Promise.resolve();
//     }
//     else
//     {
//         console.log('Sheet: ', URL_INFO['FANumber'], ' does not exist');
//         console.log('Creating sheet: ', URL_INFO['FANumber'], '...');

//         return createSheet(SPREADSHEET_ID, URL_INFO['FANumber'])
//         .then(newSheet =>
//         {
//             if (newSheet)
//             {
//                 console.log('Sheet: ', URL_INFO['FANumber'], ' created: ', );
//                 return initSheet(SPREADSHEET_ID, URL_INFO['FANumber']);
//             }
//             else
//             {
//                 Promise.reject('Failed to create new Sheet: ', URL_INFO['FANumber']);
//             }
//         })
//         .then(initResponse =>
//         {
//             if (initResponse)
//             {
//                 console.log("Sheet: ", URL_INFO['FANumber'], ' initialized');
//                 return Promise.resolve();
//             }
//             else
//             {
//                 console.log("Sheet: ", URL_INFO['FANumber'], ' not initialized');
//                 return Promise.reject();
//             }
//         })
//     }
// })
// .then(() =>
// {
//     const INFO_SHEET.rowCountCell = 'e1';

//     return readFromSheet(SPREADSHEET_ID, 'Info', INFO_SHEET.rowCountCell)
//     .then(result => 
//     {
//         if (result)
//         {
//             return result[0][0];
//         }
//         else
//         {
//             return Promise.reject('No value returned from readFromSheet()');
//         }
//     }
//     )
// })
// .then(result =>
// {
//     if (result === 0)
//     {
//         console.log('result is 0');
//     }
//     else
//     {
//         console.log('result is ', result);
//     }
// })
.catch((error) =>
{
    console.error(error);
});

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

function readFromSheet(spreadsheetID, sheetName, range)
{
    return new Promise((resolve, reject) =>
    {
        chrome.runtime.sendMessage(
            {
                action: 'readFromSheet',
                spreadsheetID: spreadsheetID,
                sheetName: sheetName,
                range: range
            },
            response =>
            {
                if (response.error)
                {
                    reject(response.error);
                }
                else
                {
                    resolve(response.result);
                }
            });
    });
}

function initSheet(spreadsheetID, sheetName)
{
    return writeToSheet(spreadsheetID, sheetName, 'A1:G1', [['QUESTIONS', 'CHOICES', 'ANSWERS', 'WRONG ANSWERS', null , 'TOTAL QUESTIONS:', 0]]);
}

function writeToSheet(spreadsheetID, sheetName, range, values)
{
    return new Promise((resolve, reject) =>
    {
        chrome.runtime.sendMessage(
            {
                action: 'writeToSheet',
                spreadsheetID: spreadsheetID,
                sheetName: sheetName,
                range: range,
                values: values
            },
            response =>
            {
                if (response.error)
                {
                    reject(response.error);
                }
                else
                {
                    resolve(response.result);
                }
            });
    });
}

function createSheet(spreadsheetID, sheetName)
{
    return new Promise((resolve, reject) =>
    {
        chrome.runtime.sendMessage(
        {
            action: 'createSheet',
            spreadsheetID: spreadsheetID,
            sheetName: sheetName
        },
        response =>
        {
            if (response.error)
            {
                reject(response.error);
            }
            else
            {
                resolve(response.result);
            }
        });
    });
}

// function checkSheetExists(spreadsheetID, sheetName)
// {
//     return new Promise((resolve, reject) =>
//     {
//         chrome.runtime.sendMessage(
//         {
//                 action: 'checkSheetExists',
//                 spreadsheetID: spreadsheetID,
//                 sheetName: sheetName
//         },
//         response =>
//         {
//             if (response.error)
//             {
//                 reject(response.error);
//             }
//             else
//             {
//                 resolve(response.exists);
//             }
//         });
//     });
// }

//EXTRACT
function getURLInfo()
{
    try
    {
        let values =  [getCleanedURL(), getFANumber(), getCourseID(), getFAID(), getQuestionID()];
        let result = {};
        
        KEYS.forEach((key, index) =>
        {
            result[key] = values[index];
        })

        return result;
    }
    catch (error)
    {
        console.error('Error in getURLInfo(): ', error);
        return null;
    }
}

function getFANumber() 
{
    const header = document.querySelector('header.quiz-header');
    if (!header)
    {
        throw new Error("'header.quiz-header' not found");
    }

    const h1 = header.querySelector('h1');
    if (!h1)
    {
        throw new Error("'h1' not found");
    }

    const FANumber = h1.textContent;
    if (!FANumber)
    {
        throw new Error("'FANumber' not found or empty");
    }

    return FANumber;
}

function getCleanedURL()
{
    let splitUrl = window.location.href.split('/take');
    if (splitUrl.length < 2)
    {
        throw new Error("URL does not contain '/questions'");
    }

    return splitUrl[0] + '/take';
}

//catches Error and returns null so it the cell will remain blank
function getCourseID()
{
    let splitUrl = window.location.href.split('courses/');
    if (splitUrl.length < 2)
    {
        throw new Error("URL does not contain 'courses/'");
    }

    splitUrl = splitUrl[1].split('/quizzes');
    if (splitUrl.length < 2)
    {
        throw new Error("URL does not contain '/quizzes'");
    }

    return splitUrl[0];
}

function getFAID()
{
    let splitURL = window.location.href.split('quizzes/');
    if (splitURL.length < 2)
    {
        throw new Error("URL does not contain 'quizzes/'");
    }
    
    splitURL = splitURL[1].split('/');
    if (splitURL.length < 2)
    {
        throw new Error("URL does not contain '/'");
    }

    return splitURL[0];
}

function getQuestionID()
{
    try
    {
        let splitUrl = window.location.href.split('questions/');
        if (splitUrl.length < 2)
        {
            throw new Error("URL does not contain 'questions/'");
        }

        return splitUrl[1];
    }
    catch (error)
    {
        console.error("Error in getting getQuestionsID(): ", error);
        return null;
    }
}
//END EXTRACT