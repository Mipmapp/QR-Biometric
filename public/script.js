let fullscreenButtonsVisible = false;
let hideFullscreenButtonsTimeout;

const fullscreenButtons = document.getElementById('fullscreen-buttons');
const statusNotification = document.getElementById('status-notification');

function showFullscreenButtons() {
  clearTimeout(hideFullscreenButtonsTimeout);
  fullscreenButtons.classList.add('show');
  fullscreenButtonsVisible = true;

  // Automatically hide after 5 seconds of inactivity
  hideFullscreenButtonsTimeout = setTimeout(() => {
    hideFullscreenButtons();
  }, 5000);
}

function hideFullscreenButtons() {
  fullscreenButtons.classList.remove('show');
  fullscreenButtonsVisible = false;
}

// Add click listener to the Online button
statusNotification.addEventListener('click', () => {
  showFullscreenButtons();
});

// Add event listeners to buttons to prevent hiding during interaction
fullscreenButtons.addEventListener('mouseenter', () => {
  clearTimeout(hideFullscreenButtonsTimeout);
});

fullscreenButtons.addEventListener('mouseleave', () => {
  if (fullscreenButtonsVisible) {
    hideFullscreenButtonsTimeout = setTimeout(() => {
      hideFullscreenButtons();
    }, 5000);
  }
});

// Initialize fullscreen buttons to show when page loads
window.addEventListener('load', () => {
  showFullscreenButtons();
});
