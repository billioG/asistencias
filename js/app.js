document.getElementById('syncBtn').addEventListener('click', async () => {
  await syncAttendance();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
