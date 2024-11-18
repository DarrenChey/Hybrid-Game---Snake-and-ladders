// home.js
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
  
    startBtn.addEventListener('click', () => {
      window.location.href = '/gameboard';
    });
  });