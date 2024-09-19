const modal = document.getElementById('modal');
const modalText = document.getElementById('modal-text');
const modalContent = document.getElementById('modal-content');
const closeModal = document.querySelector('.close-modal');
const suggestionsContainer = document.getElementById('suggestions-container');

// Function to open the modal
const openModal = (text,big) => {
  modalText.style.fontSize = "36px";
  modalText.style.textAlign = "left";
  modalContent.style.backgroundColor="#007bff";
  modalText.textContent = text;
  modal.style.display = 'block';
  suggestionsContainer.classList.add('modal-blur');
  if(big){
    modalText.style.fontSize = "64px";
    modalText.style.textAlign = "center";
    modalContent.style.backgroundColor="#53d769";
  }

};

// Function to close the modal
const closeModalHandler = () => {
  modal.style.display = 'none';
  suggestionsContainer.classList.remove('modal-blur');
};

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModalHandler();
  }
});




var ws = new WebSocket('ws://localhost:3000');

setInterval(()=>{
  if(ws.readyState==WebSocket.CLOSED) window.location.reload();
},1000);

const isPresenter = document.getElementById('presenter') !== null;

let positions = []; // Keep track of suggestion positions and their text

const doesOverlap = (x, y, width, height) => {
  return positions.some((pos) => {
    const [existingX, existingY, existingWidth, existingHeight] = pos;
    return (
      x < existingX + existingWidth &&
      x + width > existingX &&
      y < existingY + existingHeight &&
      y + height > existingY
    );
  });
};

const getRandomPosition = (width, height, container) => {
  let x, y;
  do {
    x = Math.random() * (container.offsetWidth - width);
    y = Math.random() * (container.offsetHeight - height);
  } while (doesOverlap(x, y, width, height));
  return { x, y };
};

const getPositionForSuggestion = (suggestion, width, height, container) => {
  // Check if the suggestion already has a saved position
  const existingPos = positions.find((pos) => pos[4] === suggestion);
  if (existingPos) {
    return { x: existingPos[0], y: existingPos[1] , exists: true};
  }

  // Calculate a new position for the suggestion
  const { x, y } = getRandomPosition(width, height, container);
  positions.push([x, y, width, height, suggestion]); // Save position along with the suggestion text
  return { x, y, exists: false };
};

ws.onmessage = (event) => {
  const suggestions = JSON.parse(event.data);
  if(suggestions.type == "exit") window.location.replace("index.html");
  if(suggestions.type == "topic") {document.getElementById("topic").innerText = suggestions.topic; return;}
  
  //Only presenter code
  if(!isPresenter)  return;
  if(suggestions.type == "count") {document.getElementById("count").innerText = suggestions.count; return;}

  //Student suggestions code
  if(suggestions.type)return;
  const container = document.getElementById('suggestions-container');
  container.innerHTML = ''; // Clear previous suggestions
  suggestions.forEach((suggestion, index) => {
    //Create box to place suggestion in.
    const suggestionBox = document.createElement('div');
    suggestionBox.classList.add('suggestion-box');
    const text = document.createElement('p');
    text.textContent = suggestion;

    // Create the close (X) button
    const closeButton = document.createElement('span');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      ws.send(JSON.stringify({ type: 'delete', index }));
    });
    suggestionBox.appendChild(text);
    suggestionBox.appendChild(closeButton);

    // Handle double-click to open the modal
    suggestionBox.addEventListener('dblclick', () => {
      openModal(suggestion);
    });

    // Calculate position without overlapping
    const boxWidth = Math.min(suggestionBox.scrollWidth + 40, 300); // Adjust for padding
    const boxHeight = suggestionBox.scrollHeight + 20;
    const { x, y, exists } = getPositionForSuggestion(suggestion, boxWidth, boxHeight, container);
    
    if(!exists) suggestionBox.style.animation = "fadeIn 1s forwards"; // Apply the fadeIn animation
    if(exists) {suggestionBox.style.opacity = 1; suggestionBox.style.backgroundColor="#007bff"}


    suggestionBox.style.left = `${x}px`;
    suggestionBox.style.top = `${y}px`;
    container.appendChild(suggestionBox);
  });
};

if(!isPresenter){
  document.getElementById('submit-button').addEventListener('click', () => {
    const input = document.getElementById('suggestion-input');
    if (input.value.trim() !== '') {
      ws.send(JSON.stringify(input.value));
      input.value = ''; // Clear input field
    }
  });
}




if(isPresenter){
  //Presenter Specific code
 
  var shown = true;
  document.getElementById('code-display').onclick = function() {
    shown = !shown;
    if(shown){
      document.getElementById('code-display').innerText = code;
    }else{
      document.getElementById('code-display').innerText = "*****";
    }
  };
}
var code = "****"
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  code = urlParams.get('code');
  //Hopefully  the websocket is connected!
  //TODO make robust
  setTimeout(() => {
    if(isPresenter){
      var auth = urlParams.get('auth');
      const codeDisplay = document.getElementById('code-display');
      codeDisplay.addEventListener('dblclick', () => {
        openModal(code,true);
      });
      codeDisplay.textContent = code;
      ws.send(JSON.stringify({ type: 'connect', code: code, auth: auth }));
    }else{
      ws.send(JSON.stringify({ type: 'connect', code: code, auth: null }));
    }
  }, 500);
});