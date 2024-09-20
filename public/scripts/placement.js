const doesOverlap = (x, y, width, height, positions) => {
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
  
const getRandomPosition = (width, height, container, positions) => {
    let x, y;
    do {
        x = Math.random() * (container.offsetWidth - width);
        y = Math.random() * (container.offsetHeight - height);
    } while (doesOverlap(x, y, width, height, positions));
    return { x, y };
};
  
const getPositionForSuggestion = (suggestion, width, height, container, positions) => {
    // Check if the suggestion already has a saved position
    const existingPos = positions.find((pos) => pos[4] === suggestion);
    if (existingPos) {
        return { x: existingPos[0], y: existingPos[1] , exists: true};
    }

    // Calculate a new position for the suggestion
    
    const { x, y } = getRandomPosition(width, height, container,positions);
    positions.push([x, y, width, height, suggestion]); // Save position along with the suggestion text
    return { x, y, exists: false };
};

export { getPositionForSuggestion };