// Fullscreen toggle function
const expandButton = document.getElementById('expand');

//Listen for user escape full screen
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
    document.getElementById('options').style.display = 'flex';
    }
});

//Make our button activate fullscreen.
expandButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
    document.getElementById('options').style.display = 'none';
    document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen mode: ${err.message}`);
    });
    } else {
    document.exitFullscreen();
    }
});

// Listen for mouse movement
document.addEventListener('mousemove', (e) => {
    // Only care about events when in fullscreen mode
    if (!document.fullscreenElement) return;
      // Check if the user has moved their mouse away from the top of the screen
    if (e.clientY < 50) {
        document.getElementById('options').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('options').style.opacity = '1';
        }, 100);
    }else{
        document.getElementById('options').style.display = 'none';
        document.getElementById('options').style.opacity = '0';

    }
});