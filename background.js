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
    .catch(error => sendResponse({error: error.message}));

    return true;  //indicate asynchronous behaviour
  }
}) 

//SHEETS
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

// getAuthToken()
//   .then(token => getSheetValue(token))
//   .catch(error => console.error('Error getting auth token:', error));
  
//   function getAuthToken() {
//     return new Promise((resolve, reject) => {
//       chrome.identity.getAuthToken({interactive: true}, function(token) {
//         if (chrome.runtime.lastError || !token) {
//           reject(chrome.runtime.lastError);
//         } else {
//           resolve(token);
//         }
//       });
//     });
//   }
  
//   function getSheetValue(token) {
//     const SPREADSHEET_ID = '1Nt9_t6cTjv-J7Ej9q-b9NK8aETeB0OxEkr4eFGz_D4I';
//     const RANGE = 'Sheet1!A1';
  
//     fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     })
//     .then(response => response.json())
//     .then(data => {
//       const value = data.values ? data.values[0][0] : 'No data found';
//       console.log('Value in A1 is:', value);
//     })
//     .catch(error => {
//       console.error('Error fetching data:', error);
//     });
//   }
  
//   function checkSheetExists(token, spreadsheetID, sheetName)
//   {
//     return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetID}`, 
//       {
//         method: 'GET',
//         headers: 
//         {
//           'Authorization': `Bearer ${token}`
//         }
//       })
//       .then(response => response.json())
//       .then(data =>
//       {
//         const sheets = data.sheets;
//         return sheets.some(sheet => sheet.properties.title === sheetName);
//       });
//   }