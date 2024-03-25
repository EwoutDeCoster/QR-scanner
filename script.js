function startprocess() {
var video = document.createElement("video");
    var canvasElement = document.getElementById("canvas");
    var canvas = canvasElement.getContext("2d");
    var loadingMessage = document.getElementById("loadingMessage");
    var outputContainer = document.getElementById("output");
    var outputMessage = document.getElementById("outputMessage");
    var outputData = document.getElementById("outputData");
    var article = document.getElementById("article");
    let scanAgain = document.getElementById("scanAgain");
    let scanningEnabled = true;


    function drawLine(begin, end, color) {
      canvas.beginPath();
      canvas.moveTo(begin.x, begin.y);
      canvas.lineTo(end.x, end.y);
      canvas.lineWidth = 4;
      canvas.strokeStyle = color;
      canvas.stroke();
    }

    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", video : true } }).then(function(stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      requestAnimationFrame(tick);
    });

    function tick() {
      if (!scanningEnabled) {
        return; // Exit the function if scanning is disabled
    }
      loadingMessage.innerText = "⌛ Loading video..."
      if (video.readyState === video.HAVE_ENOUGH_DATA) {

        canvas.clearRect(0, 0, canvasElement.width, canvasElement.height);
        loadingMessage.hidden = true;
        canvasElement.hidden = false;
        outputContainer.hidden = false;

        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);




        var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          var eva = document.getElementById("eva");
          eva.remove();
          drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
          drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
          drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
          drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
          outputMessage.hidden = true;
          outputData.parentElement.hidden = false;
          getTickets(code.data);
          outputData.innerText = "Ticketcode: " + code.data ;
            article.innerText = "Naam artikel";
            /* show the scan again button and pause the video and hide the video stream */
            scanAgain.hidden = false
            scanningEnabled = false;
            video.pause();

            

        } /*else {
          outputMessage.hidden = false;
          outputData.parentElement.hidden = true;
        }*/
      }
      if (scanningEnabled) {
      requestAnimationFrame(tick);
      }
    }
  }
scanAgain.addEventListener("click", function() {
    /* hide the scan again button and restart the video */
    scanAgain.hidden = true;
    outputData.parentElement.hidden = true;
    outputMessage.hidden = false;
    scanningEnabled = true;
    /* restart the whole script */
    startprocess();

});
    

/** get the data from tickets.json without origin error */

function getTickets(id) {
  console.log("Sending request to validate ticket:", id);
  // Construct the URL for the API endpoint
  const apiUrl = `/api/validate_ticket/${id}`;

  // Make a POST request to the Flask API
  fetch(apiUrl, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
          console.log("Response data:", data);
          let feedback = data.message; // Use the message from the response
          article.innerText = feedback;

          if (data.status === 'valid') {
              article.style.color = "green";
              outputData.innerText = "Scans: " + data.times_scanned + " / " + data.allowed_scans;
          } else if (data.status === 'invalid') {
              article.style.color = "red";
              outputData.innerText = "Scans: " + data.times_scanned + " / " + data.allowed_scans;
          } else {
              // Handle error or unknown ticket
              article.style.color = "black"; // Reset to default or indicate error
          }
      })
      .catch(error => {
          console.error('Error validating ticket:', error);
          article.innerText = "Error bij het verwerken van de aanvraag.";
      });
}

startprocess();

setTimeout(function() {
  document.getElementById("eva").style.display = "none";
} , 5000);

article.addEventListener("click", function() {
  scanAgain.hidden = true;
  outputData.parentElement.hidden = true;
  outputMessage.hidden = false;
  scanningEnabled = true;
  /* restart the whole script */
  startprocess();
}
);

outputData.addEventListener("click", function() {
  scanAgain.hidden = true;
  outputData.parentElement.hidden = true;
  outputMessage.hidden = false;
  scanningEnabled = true;
  /* restart the whole script */
  startprocess();
}
);
  