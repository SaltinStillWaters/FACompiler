document.getElementById('submitButton').addEventListener('click', () => {
    const input1 = document.getElementById('input1').value;
    const input2 = document.getElementById('input2').value;
    
    // Log to the console within the popup
    console.log('Input 1:', input1);
    console.log('Input 2:', input2);
  
    // Send a message to the background script
    chrome.runtime.sendMessage({input1: input1, input2: input2}, response => {
      console.log('Response from background:', response);
    });
  });
  