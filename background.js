getAuthToken()
  .then(token => getSheetValue(token))
  .catch(error => console.error('Error getting auth token:', error));
  
  function getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({interactive: true}, function(token) {
        if (chrome.runtime.lastError || !token) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  }
  
  function getSheetValue(token) {
    const SPREADSHEET_ID = '1Nt9_t6cTjv-J7Ej9q-b9NK8aETeB0OxEkr4eFGz_D4I';
    const RANGE = 'Sheet1!A1';
  
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      const value = data.values ? data.values[0][0] : 'No data found';
      console.log('Value in A1 is:', value);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  }
  