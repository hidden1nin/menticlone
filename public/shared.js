const ws = new WebSocket('ws://localhost:3000');
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
    return { x: existingPos[0], y: existingPos[1] };
  }

  // Calculate a new position for the suggestion
  const { x, y } = getRandomPosition(width, height, container);
  positions.push([x, y, width, height, suggestion]); // Save position along with the suggestion text
  return { x, y };
};

ws.onmessage = (event) => {
  if(!isPresenter)  return;
  const suggestions = JSON.parse(event.data);
    const container = document.getElementById('suggestions-container');
    container.innerHTML = ''; // Clear previous suggestions

    suggestions.forEach((suggestion, index) => {
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

      // Calculate position without overlapping
      const boxWidth = Math.min(suggestionBox.scrollWidth + 40, 300); // Adjust for padding
      const boxHeight = suggestionBox.scrollHeight + 20;
      const { x, y } = getPositionForSuggestion(suggestion, boxWidth, boxHeight, container);

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