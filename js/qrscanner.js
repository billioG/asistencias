let video = document.getElementById('video');
let statusEl = document.getElementById('status');

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => { video.srcObject = stream; })
  .catch(err => alert("Error al acceder a la cámara: " + err));

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
let scanning = true;

setInterval(async () => {
  if (!scanning) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, canvas.width, canvas.height);
  if (code) {
    scanning = false;
    await saveAttendance(code.data);
    statusEl.textContent = `Asistencia registrada para ${code.data}`;
    setTimeout(() => scanning = true, 2000);
  }
}, 1000);
