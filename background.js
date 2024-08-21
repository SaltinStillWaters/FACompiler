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
  else if (request.action === 'writeToSheet')
  {
    getAuthToken()
    .then(token => writeToSheet(token, request.spreadsheetID, request.sheetName, request.range, request.values))
    .then(response =>
    {
      console.log(response);
      sendResponse({result: response});
    }
    )
    .catch(error =>
    {
      console.log('Error writing to sheet: ', error.message);
      sendResponse({error: error.message});
    }
    )
    return true;
  }
  else if (request.action === 'readFromSheet')
  {
    getAuthToken()
    .then(token => readFromSheet(token, request.spreadsheetID, request.sheetName, request.range))
    .then(response =>
    {
      console.log(response);
      sendResponse({result: response});
    }
    )
    .catch(error =>
    {
      console.log('Error reading from sheet: ', error.message);
      sendResponse({error: error.message})
    }
    )

    return true;
  }
  else if (request.action === 'insertRowToSheet')
  {
    getAuthToken()
    .then(token => 
        getSheetID(token, request.spreadsheetID, request.sheetName)
        .then(sheetId => insertRowToSheet(token, request.spreadsheetID, sheetId, request.rowIndex, request.rowData))
      )
    .then(response =>
    {
      console.log(response);
      sendResponse({result: response});
    })
    .catch(error =>
    {
      console.log('Error inserting row: ', error.message);
      sendResponse({error: error.message});
    })

    return true;
  }
}) 

function insertRowToSheet(token, spreadsheetID, sheetId, rowIndex, rowData)
{
  const requestBody =
  {
    requests:
    [
      {
        insertDimension: 
        {
          range:
          {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          },
          inheritFromBefore: false
        }
      },
      {
        updateCells:
        {
          rows:
          [
            {
              values: rowData.map(cellData => ({userEnteredValue: {stringValue: cellData}}))
            }
          ],
          fields: 'userEnteredValue',
          start:
          {
            sheetId: sheetId,
            rowIndex: rowIndex,
            columnIndex: 0
          }
        }
      }
    ]
  };

  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}:batchUpdate`,
    {
      method: 'POST',
      headers:
      {
        'Authorization': `Bearer ${token}`,
        'Content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data =>
    {
      if (data.error)
      {
        throw new Error(data.error.message);
      }
      console.log(data);
      return data;
    }
    )
}

function getSheetID(token, spreadsheetID, sheetName)
{
  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}?fields=sheets.properties`,
    {
      method: 'GET',
      headers:
      {
        'Authorization': `Bearer ${token}`,
        'Content-type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data =>
    {
      let sheetId = null;
      for (let i = 0; i < data.sheets.length; i++) 
      {
        if (data.sheets[i].properties.title === sheetName) 
        {
          sheetId = data.sheets[i].properties.sheetId;
          break;
        }
      }

      console.log('sheet id: ', sheetId);
      return sheetId;
      }
    )
}

function readFromSheet(token, spreadsheetID, sheetName, range)
{
  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}/values/${sheetName}!${range}`,
    {
      method: 'GET',
      headers: 
      {
        'Authorization': `Bearer ${token}`,
        'Content-type': 'application/json'
      }
    }
  )
  .then(response => response.json())
  .then(data =>
  {
    if (data.error)
    {
      throw new Error(data.error.message);
    }

    return data.values;
  }
  )

}

function writeToSheet(token, spreadsheetID, sheetName, range, values)
{
  return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}/values/${sheetName}!${range}?valueInputOption=RAW`, 
    {
      method: 'PUT',
      headers:
      {
        'Authorization': `Bearer ${token}`,
        'Content-type': 'application/json'
      },
      body: JSON.stringify(
        {
          values: values
        }
      )
    }
  )
  .then(response => response.json())
  .then(data => 
  {
    if (data.error)
    {
      throw new Error(data.error.message);
    }

    return data;
  }
  )
}

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