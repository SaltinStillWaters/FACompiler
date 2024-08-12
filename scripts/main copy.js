const keys = ['currURL', 'FANumber', 'courseID', 'FAID', 'questionID'];
let creds;
const spreadsheetID = '1Nt9_t6cTjv-J7Ej9q-b9NK8aETeB0OxEkr4eFGz_D4I';

chrome.storage.local.get(keys)
.then((response) =>
{
    if (response['currURL'] !== getCleanedURL())
    {
        console.log('Local Data needs update...');

        let values = getvalues();

        let keyVal = {};
        keys.forEach((key, index) =>
        {
            keyVal[key] = values[index];
        })
        
        return chrome.storage.local.set(keyVal)
        .then(() =>
        {
            console.log('...Local Data updated');
            return chrome.storage.local.get(keys);
        })
    }
    else
    {
        return response;
    }
})
.then((response) =>
{
    creds = response;
    return checkSheetExists(spreadsheetID, response['FANumber']);
})
.then((exists) =>
{
    if (exists)
    {
        console.log('Sheet: ', creds['FANumber'], ' exists');
        return Promise.resolve();
    }
    else
    {
        console.log('Sheet: ', creds['FANumber'], ' does not exist');
        console.log('Creating sheet: ', creds['FANumber'], '...');

        return createSheet(spreadsheetID, creds['FANumber'])
        .then(newSheet =>
        {
            if (newSheet)
            {
                console.log('Sheet: ', creds['FANumber'], ' created: ', );
                return initSheet(spreadsheetID, creds['FANumber']);
            }
            else
            {
                Promise.reject('Failed to create new Sheet: ', creds['FANumber']);
            }
        })
        .then(initResponse =>
        {
            if (initResponse)
            {
                console.log("Sheet: ", creds['FANumber'], ' initialized');
                return Promise.resolve();
            }
            else
            {
                console.log("Sheet: ", creds['FANumber'], ' not initialized');
                return Promise.reject();
            }
        })
    }
})
.then(() =>
{
    return readFromSheet(spreadsheetID, 'Info', 'e1')
    .then(result => 
    {
        if (result)
        {
            return result[0][0];
        }
        else
        {
            return Promise.reject('No value returned from readFromSheet()');
        }
    }
    )
})
.then(result =>
{
    console.log('Output: ', result);
})
.catch((error) =>
{
    console.error(error);
});

function getFASheetName(spreadsheetID, FAID)
{
    
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

function checkSheetExists(spreadsheetID, sheetName)
{
    return new Promise((resolve, reject) =>
    {
        chrome.runtime.sendMessage(
        {
                action: 'checkSheetExists',
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
                resolve(response.exists);
            }
        });
    });
}

//EXTRACT
function getvalues()
{
    try
    {
        let values =  [getCleanedURL(), getFANumber(), getCourseID(), getFAID(), getQuestionID()];
        return values;
    }
    catch (error)
    {
        console.error('Error in getvalues(): ', error);
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