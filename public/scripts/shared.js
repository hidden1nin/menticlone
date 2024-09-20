const isPresenter = document.getElementById('presenter') !== null;
const modal = document.getElementById('modal');
const modalText = document.getElementById('modal-text');
const modalContent = document.getElementById('modal-content');
const closeModal = document.querySelector('.close-modal');
const suggestionsContainer = document.getElementById('suggestions-container');
const settingsModal = document.getElementById('settings-modal');
const votingModal = document.getElementById('voting-modal');

// Function to open the modal
const openModal = (text,big) => {
  ws.send(JSON.stringify({type:"focus",focus:text}));
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

var triedToClose = false;
// Function to close the modal
const closeModalHandler = () => {
  ws.send(JSON.stringify({type:"focus",focus:null}));
  modal.style.display = 'none';
  settingsModal.style.display = 'none';

  if(!fromSettings){
    suggestionsContainer.classList.remove('modal-blur');
    return;
  }

  if(options.size==0 || triedToClose == true){
    suggestionsContainer.classList.remove('modal-blur');
    votingModal.style.display = 'none';
    triedToClose = false;
    fromSettings = false;
  } else{
    votingModal.style.display = 'block';
    triedToClose = true;
  }


};

if(isPresenter)window.addEventListener('click', (event) => {
  if (event.target === modal || event.target === votingModal || event.target === settingsModal) {
    closeModalHandler();
  }
});

var fromSettings = false;
// Function to open the settings modal
const openSettingsModal = () => {
  fromSettings = true;
  settingsModal.style.display = 'block';
  votingModal.style.display = 'none';
  suggestionsContainer.classList.add('modal-blur');
};



var options = new Set();

// Function to add an option to the options list
const addOption = (text) => {
  const newOption = document.createElement('input');
  newOption.type = 'text';
  newOption.placeholder = 'Enter an option';
  newOption.className = 'option-input';
  newOption.value = text;
  options.add(newOption);
  newOption.addEventListener('input',(event)=>{
      // Check if the backspace key was pressed and the input value is now empty
      if (event.inputType === 'deleteContentBackward' && newOption.value === '') {
        newOption.remove();
        options.delete(newOption);
      }

      //Send new question info
      var inputs = [];
      options.forEach((option)=>{
        inputs.push(option.value);
      })

      ws.send(JSON.stringify({type: "vote_options", vote_options: inputs}));
  });
  document.getElementById('options-list').appendChild(newOption);
};








var ws = new WebSocket('ws://localhost:3000');

setInterval(()=>{
  if(ws.readyState==WebSocket.CLOSED) window.location.reload();
},1000);



var positions = []; // Keep track of suggestion positions and their text



var count = 0;
var voted = false;
var voteoptions = [];
ws.onmessage = (event) => {
  const suggestions = JSON.parse(event.data);
  if(suggestions.type == "exit") window.location.replace("index.html");
  if(suggestions.type == "focus") { 
    if(suggestions.focus == null){
      modal.style.display = 'none';
      document.getElementById('form-container').style.display = "flex";
    } else{
      document.getElementById('form-container').style.display = "none";
      modal.style.display = 'flex';
      document.getElementById("modal-text").innerText = suggestions.focus; 
    }
    return;
  }
  if(suggestions.type == "topic") {document.getElementById("topic").innerText = suggestions.topic; return;}
  if(suggestions.type == "vote_options") {
    //If no options reset to normal input
    if(suggestions.voteoptions.length==0){
       document.getElementById("inputs").style.display= "contents";
    }else{
      document.getElementById("inputs").style.display= "none";
    }
    
    if(JSON.stringify(voteoptions)==JSON.stringify(suggestions.voteoptions)){return;}
    voteoptions = suggestions.voteoptions;

    options.forEach(  (option) => {option.remove();});
    options.clear();
    voted = false;
    //Create new ones based on new vote options
    suggestions.voteoptions.forEach((option, index) => {
      let suggestion = document.createElement('button');
      suggestion.innerText = option;
      suggestion.addEventListener("click", () => {
        if(voted) {return;}
        voted = true;
        options.forEach((optioncolor)=>{
          optioncolor.style.backgroundColor="#ccc";
        });
        ws.send(JSON.stringify({type:"vote", vote: option}));
      });
      document.getElementById('buttons').appendChild(suggestion);
      options.add(suggestion);
    });
    return;
  }

  
  //Only presenter code
  if(!isPresenter)  return;
  if(suggestions.type == "count") {document.getElementById("count").innerText = suggestions.count; return;}
  if(suggestions.type == "topic_rec") {
    document.getElementById("tq").innerText = suggestions.topic;
    document.getElementById("topic-input").value = suggestions.topic; 
    return;
  }
  if(suggestions.type == "question_rec") {console.log(suggestions.voteoptions);suggestions.voteoptions.forEach((question)=>addOption(question)); return;}

  if(suggestions.type == "vote_count") {
    votelist = document.getElementById('votelist');
    votelist.innerHTML = "";
    // Create an object to store the vote counts
    const voteCounts = {};

    // Loop through each suggestion in votecount array
    suggestions.votecount.forEach((vote) => {
      // If the vote is already in the object, increment its count
      if (voteCounts[vote]) {
        voteCounts[vote]++;
      } else {
        // Otherwise, add it to the object with a count of 1
        voteCounts[vote] = 1;
      }
    });

    // Log the vote counts for debugging purposes
    console.log(voteCounts);

    // Loop through each suggestion in votecount array and create a new p element
    Object.keys(voteCounts).forEach((vote) => {
      const d =  document.createElement("div");
      d.classList.add('vote_specific');
      const p = document.createElement("p");
      const c = document.createElement("p");
      d.appendChild(p);
      d.appendChild(c);
      // Set the text content of the p element to "vote: count"
      p.textContent = `${vote}`;
      c.textContent = `${voteCounts[vote]}`;
      d.addEventListener('dblclick', () => {
        closeModalHandler();
        openModal(vote,true);
      });
      votelist.appendChild(d);
    });
    return;
  }

  //Student suggestions code
  if(suggestions.type)return;
  const container = document.getElementById('suggestions-container');
  container.innerHTML = ''; // Clear previous suggestions
  count = 0;
  import('./placement.js').then(placement => {
    suggestions.forEach((suggestion, index) => {
      count++;
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
      const { x, y, exists } = placement.getPositionForSuggestion(suggestion, boxWidth, boxHeight, container, positions);
      
      if(!exists) suggestionBox.style.animation = "fadeIn 1s forwards"; // Apply the fadeIn animation
      if(exists) {suggestionBox.style.opacity = 1; suggestionBox.style.backgroundColor="#007bff"}


      suggestionBox.style.left = `${x}px`;
      suggestionBox.style.top = `${y}px`;
      container.appendChild(suggestionBox);
    });
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
 
  // Add event listener to open the settings modal when the settings option is clicked
  document.getElementById('settings').addEventListener('click', openSettingsModal);

  // Add event listener to add an option when the add option button is clicked
  document.getElementById("add-option-button").addEventListener('click', ()=>addOption(""));

  document.getElementById('clear-option-button').addEventListener('click', ()=>{
    options.clear();
    document.getElementById('options-list').innerHTML = '';
    document.getElementById('topic-input').value = "";
    ws.send(JSON.stringify({type: "vote_options", vote_options: []}));
    ws.send(JSON.stringify({type: "topic", topic: ""}));
  });

  // Add event listener to add an option when the add option button is clicked
  document.getElementById("topic-input").addEventListener('input', ()=>{
    const input = document.getElementById("topic-input");
    document.getElementById("tq").innerText = input.value.trim();
    const topic = input.value.trim();
    ws.send(JSON.stringify({type: "topic", topic: topic}))
  });
  var shown = true;
  document.getElementById('code-display').onclick = function() {
    shown = !shown;
    if(shown){
      document.getElementById('code-display').innerText = code;
    }else{
      document.getElementById('code-display').innerText = "*****";
    }
  };
  document.getElementById('trash').addEventListener('click', () => {
    for(let i = 0; i < count; i++){
      ws.send(JSON.stringify({ type: 'delete', i }));
    }
  });
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
      ws.send(JSON.stringify({type:"focus",focus:null}));
    }else{
      ws.send(JSON.stringify({ type: 'connect', code: code, auth: null }));
    }
  }, 500);
});