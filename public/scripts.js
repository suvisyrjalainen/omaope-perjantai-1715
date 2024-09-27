document.getElementById('send-button-chatbox').addEventListener('click', sendMessage);

document.getElementById('user-input-chatbox').addEventListener('keypress', function (pressedKey) {
    if (pressedKey.key === 'Enter') {
      sendMessage();
    }
  });
  

function sendMessage() {
    console.log("Viesti lähetetty");
    const userMessage = document.getElementById('user-input-chatbox').value;
    document.getElementById('user-input-chatbox').value = '';
    console.log(userMessage);
    addMessageToChat(userMessage);
}

function addMessageToChat(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    console.log(messageElement);

    document.getElementById('chatbox').appendChild(messageElement);


}
