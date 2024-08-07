const keys = ['currURL', 'FANumber', 'courseID', 'questionID'];
let creds;
const spreadsheetID = '1Nt9_t6cTjv-J7Ej9q-b9NK8aETeB0OxEkr4eFGz_D4I';

chrome.storage.local.get(keys)
.then((response) =>
{
    if (response['currURL'] !== getCleanedURL())
    {
        console.log('Local Data needs update...');

        let vals = getVals();

        let keyVal = {};
        keys.forEach((key, index) =>
        {
            keyVal[key] = vals[index];
        })
        
        return chrome.storage.local.set(keyVal)
        .then(() =>
        {
            console.log('...Local Data updated');
        })
    }
})
.then(() => 
{
    return chrome.storage.local.get(keys);
})
.then((response) =>
{
    creds = response;
    return checkSheetExists(spreadsheetID, response['FANumber']);
})
.then(exists =>
{
    if (exists)
    {
        console.log('Sheet: ', creds['FANumber'], ' exists');
    }
    else
    {
        console.log('Sheet: ', creds['FANumber'], ' does not exist');
        console.log('Creating sheet: ', creds['FANumber'], '...');
        return createSheet(spreadsheetID, creds['FANumber']);
    }
})
.then(newSheet =>
{
    if (newSheet)
    {
        console.log('Sheet: ', creds['FANumber'], ' created: ', );
    }
}
)
.catch((error) =>
{
    console.error(error);
});


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
function getVals()
{
    try
    {
        let vals =  [getCleanedURL(), getFANumber(), getCourseID(), getQuestionID()];
        return vals;
    }
    catch (error)
    {
        console.error('Error in getVals(): ', error);
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