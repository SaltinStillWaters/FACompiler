chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>
{
  if (request.action === 'checkSheetExists')
  {
    getAuthToken()
    .then(token => checkSheetExists(token, request.spreadsheetID, request.sheetName))
    .then(exists => 
    {
      console.log(request.sheetName, ' exists: ', exists);
      sendResponse({exists: exists});
    })
    .catch(error => 
    {
      console.log('Error in checking if sheet exists: ', error.message);
      sendResponse({error: error.message});
    });

    return true;  //indicate asynchronous behaviour
  }
  else if (request.action === 'createSheet')
  {
    getAuthToken()
    .then(token => createSheet(token, request.spreadsheetID, request.sheetName))
    .then(response =>
    {
      console.log('Sheet created: ', response);
      sendResponse({result: response});
    })
    .catch(error =>
    {
      console.log('Error in creating sheet: ', error.message);
      sendResponse({error: error.message});
    });

    return true;
  }
}) 

//SHEETS
function createSheet(token, spreadsheetID, sheetName)
{
  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}:batchUpdate`, 
    {
      method: 'POST',
      headers: 
      {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
        {
          requests: 
          [
            {
              addSheet: 
              {
                properties:
                {
                  title: sheetName,
                },
              },
            }],
        }),
    })
  .then(response => response.json())
  .then(data =>
    {
      if (data.replies && data.replies[0].addSheet)
      {
        return data.replies[0].addSheet.properties;
      }
      else
      {
        throw new Error(`Failed to create new sheet: ${sheetName}. API Response: ${JSON.stringify(data)}`);
      }
    });
}

function checkSheetExists(token, spreadsheetID, sheetName)
{
  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}`, 
    {
      method: 'GET',
      headers: 
      {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data =>
      {
        const sheets = data.sheets;
        let exists = false;

        for (let sheet of sheets)
        {
          let sheetTitle = sheet.properties.title;

          if (sheetTitle != sheetName)
          {
            console.log("sheet: ", sheetTitle, " !== sheetName: ", sheetName);
          }
          else
          {
            console.log("sheet: ", sheetTitle, " === sheetName: ", sheetName);
            exists = true;
            break;
          }
        }

        return exists;
      });
}

//TOKEN
function getAuthToken()
{
  return new Promise((resolve, reject) =>
  {
    chrome.identity.getAuthToken({interactive: true}, function (token)
      {
        if (chrome.runtime.lastError || !token)
        {
            reject(chrome.runtime.lastError);
        }
        else
        {
            resolve(token);
        }
      });
  });
}