import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import multer from 'multer';
import vision from '@google-cloud/vision';
import fs from 'fs';

let currentQuestion = ''; //Muuttuja kysymyksen tallentamiseen
let correctAnswer = ''; // Muuttuja oikean vastauksen tallentamiseen

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.json());

dotenv.config();

const upload = multer({ dest: 'uploads/' });

const client = new vision.ImageAnnotatorClient({
  keyFilename: 'omaope-vision.json' 
});

let koealueTekstina = '';
let context = [];


app.post('/chat', async (req, res) => {
  const userMessage = req.body.question;
  console.log("Käyttäjä lähetti chatGPT:lle viestin: " + userMessage);
  try{
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: userMessage }
        ],
        max_tokens: 150
      })
    });
  
    const data = await response.json();
    console.log('API response:', data.choices[0].message.content);
    
    const reply = data.choices[0].message.content;
    
    res.json({reply});
  }catch(error){
    console.error('Virheviesti:',error.message);
  }
})

app.post('/upload-images', upload.array('images', 10), async (req, res) => {

  const files = req.files;
  console.log("Kuvat lähetetty");
  console.log(files);

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Kuvia ei ole lisätty/löydy' });
  }
  else{
     //Odotetaan, että kaikki kuvat on käsitelty OCR:n avulla, eli jokaisen kuvan teksti tunnistetaan.
     const texts = await Promise.all(files.map(async file => {
     // suoritetaan, että saadaan tiedostopolku kuvalle, jonka OCR-tunnistus halutaan suorittaa. 
     const imagePath = file.path;
     console.log(imagePath);
     // kutsu GCV API:lle, joka suorittaa OCR:n annetulle kuvalle
     const [result] = await client.textDetection(imagePath);
     //ottaa result-muuttujasta kaikki tekstintunnistusmerkinnät (textAnnotations), jotka sisältävät kaikki kuvasta tunnistetut tekstialueet.
     const detections = result.textAnnotations;
     console.log('OCR Detected Text:', detections);
     // poistaa tiedoston, joka on luotu kuvan lähettämisen yhteydessä
     fs.unlinkSync(imagePath); 
     // Koodi tarkistaa, löytyykö kuvasta OCR-tunnistuksen perusteella tekstiä. Jos löytyy, se palauttaa tämän tekstin. Jos ei, se palauttaa tyhjän merkkijonon 
     return detections.length > 0 ? detections[0].description : '';
    }));
    
    console.log(texts);
    koealueTekstina = texts.join(' ');
    console.log(koealueTekstina);

    context = [{ role: 'user', content: koealueTekstina }];

    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: context.concat([{ role: 'user', content: 'Luo yksi yksinkertainen ja selkeä kysymys kysymys: -kenttään ja sen vastaus yllä olevasta tekstistä suomeksi vastaus: -kenttään. Kysy vain yksi asia kerrallaan.' }]),
        max_tokens: 150
      })
    }); 

    const data = await response.json();
    console.log(data.choices[0].message.content);

    const responseText = data.choices[0].message.content;

    console.log('API response:', responseText);

    const [question, answer] = responseText.includes('Vastaus:') ? responseText.split('Vastaus:'): [responseText, null]; 

    console.log('Parsed Question:', question);
    console.log('Parsed Answer:', answer);

    if (!question || !answer) {
      return res.status(400).json({ error: 'Model could not generate a valid question. Please provide a clearer text.' });
    }

    
    currentQuestion = question.trim(); // Päivitetään nykyinen kysymys
    correctAnswer = answer.trim();

    context.push({ role: 'assistant', content: `Kysymys: ${currentQuestion}` });
    context.push({ role: 'assistant', content: `Vastaus: ${correctAnswer}` });

    res.json({ question: currentQuestion, answer: correctAnswer });
     
  }

});


app.post('/check-answer', async (req, res) => {
  const userAnswer = req.body.user_answer;
  const correctAnswer = req.body.correct_answer;
  console.log("Käyttäjän vastaus: " + userAnswer);
  console.log("Tietokoneen vastaus: " + correctAnswer);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Olet aina ihana opettaja joka arvioi oppilaan vastauksen kannustavaan sävyyn.' },
        { role: 'user', content: `Kysymys: ${currentQuestion}` },
        { role: 'user', content: `Oikea vastaus: ${correctAnswer}` },
        { role: 'user', content: `Opiskelijan vastaus: ${userAnswer}` },
        { role: 'user', content: 'Arvioi opiskelijan vastaus asteikolla 0-10 ja anna lyhyt selitys. Kehu oppilasta.' }
      ],
      max_tokens: 150
    })
  });

  if(response.status === 200){

     const data = await response.json();
     //console.log('API response:', JSON.stringify(data));

     const evaluation = data.choices[0].message.content.trim();
     console.log('Evaluation:', evaluation);

     res.json({ evaluation });  
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
