document.getElementById('send-button-chatbox').addEventListener('click', sendMessage);

document.getElementById('user-input-chatbox').addEventListener('keypress', function (pressedKey) {
    if (pressedKey.key === 'Enter') {
      sendMessage();
    }
  });
  

async function sendMessage() {
    console.log("Viesti lähetetty");
    const userMessage = document.getElementById('user-input-chatbox').value;
    document.getElementById('user-input-chatbox').value = '';
    console.log(userMessage);
    addMessageToChat(userMessage);

    const response = await fetch('/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
          },
    body: JSON.stringify({ question: userMessage })  
  });
  
  if (response.status == 200){
    const data = await response.json();
    console.log(data)
    console.log(data.question);
    addMessageToChat(data.question);
  }
  else{
    console.log(response);
    addMessageToChat('ChatGPT: Jotain meni pieleen. Yritä uudelleen myöhemmin.');
  }

}

function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    console.log(messageElement);

    document.getElementById('chatbox').appendChild(messageElement);


}
