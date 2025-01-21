let correctAnswer = ''; // Muuttuja oikean vastauksen tallentamiseen

document.getElementById('send-button-chatbox').addEventListener('click', sendMessage);

document.getElementById('user-input-chatbox').addEventListener('keypress', function (pressedKey) {
    if (pressedKey.key === 'Enter') {
      sendMessage();
    }
  });

  document.getElementById('send-images-button').addEventListener('click', sendImages);

  document.getElementById('send-answer-button').addEventListener('click', sendAnswer);

async function sendMessage() {
    console.log("Viesti lähetetty");
    const userMessage = document.getElementById('user-input-chatbox').value;
    document.getElementById('user-input-chatbox').value = '';
    console.log(userMessage);
    addMessageToChat("Sinä: " + userMessage, "user-message", "chatbox");

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
    console.log(data.reply);
    addMessageToChat("ChatGPT: " + data.reply, "bot-message", "chatbox");
  }
  else{
    console.log(response);
    addMessageToChat('ChatGPT: Jotain meni pieleen. Yritä uudelleen myöhemmin.', "bot-message", "chatbox");
  }

}

function addMessageToChat(message, className, box) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    messageElement.textContent = message;
    console.log(messageElement);

    document.getElementById(box).appendChild(messageElement);


}

async function sendImages(){
  const imageInput = document.getElementById('image-input');
  const files = imageInput.files;
  console.log(files);

  if (files.length === 0) {
    alert('Valitse kuvia ensin.');
    return;
  } 
  
  const formData = new FormData();
  console.log(formData);

  for (const file of files) {
    formData.append('images', file);
  }

  //logataan että nähdään tiedostot
  console.log(formData.getAll('images'));

  const response = await fetch('/upload-images', {
    method: 'POST',
    body: formData
  })

  const data = await response.json();
  
  if(response.status === 200){
    console.log(data.question);
    addMessageToChat("OmaOpe: " + data.question, "bot-message", "omaopebox");
    correctAnswer = data.answer;
  }
  else{
      console.log(data);
      alert(data.error);
  }

}

async function sendAnswer(){
  const answerInput = document.getElementById('answer-input').value;
  if (answerInput.trim() === '') return;
  console.log(answerInput);

  const response = await fetch('/check-answer', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
                },
    body: JSON.stringify({ user_answer: answerInput, correct_answer: correctAnswer })    
});

}

