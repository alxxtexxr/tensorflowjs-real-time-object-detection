import React, { Component } from 'react';
import './App.css';

// Import Libraries
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

class App extends Component {
  state = {
    btnDeviceId: null,
    model: null,
    width: 360,
    height: 480,
  }

  videoRef = React.createRef();
  canvasRef = React.createRef();

  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          video: true
        })
        .then((stream) => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;

          navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
              devices
                .filter((device) => device.kind === "videoinput")
                .forEach((device) => {
                  this.setState({
                    btnDeviceId: (
                      <button onClick={() => this.changeDevice(device.deviceId)}>
                        {device.label}
                      </button>
                    )
                  })
                })
            });

          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        });

      const modelPromise = cocoSsd.load();

      Promise.all([modelPromise, webCamPromise])
        .then((values) => {
          this.setState({
            model: 1,
          })
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  detectFrame = (video, model) => {
    model.detect(video)
      .then((predictions) => {
        this.renderPredictions(predictions);

        requestAnimationFrame(() => {
          this.detectFrame(video, model);
        });
      });
  }

  renderPredictions = (predictions) => {
    const ctx = this.canvasRef.current.getContext('2d');

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Font options
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    predictions.forEach((prediction) => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];

      // Draw the bounding box
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw the label background
      ctx.fillStyle = "#00FFFF";

      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = parseInt(font, 10);

      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });

    predictions.forEach((prediction) => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];

      // Draw the text last to ensure it's on top
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
    });
  }

  /* Change facing mode */
  changeFacingMode = (facingMode) => {
    if (this.videoRef.current.srcObject) {
      this.videoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());

      this.videoRef.current.srcObject = null;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: facingMode,
        }
      })
      .then((stream) => this.videoRef.current.srcObject = stream);
  }

  /* Change device */
  changeDevice = (deviceId) => {
    if (this.videoRef.current.srcObject) {
      this.videoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());

      this.videoRef.current.srcObject = null;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          deviceId: deviceId,
        }
      })
      .then((stream) => this.videoRef.current.srcObject = stream);
  }

  render() {
    return (
      <div className="App">
        <div id="preview">
          <video
            autoPlay
            playsInline
            muted
            ref={this.videoRef}
            width={this.state.width}
            height={this.state.height}
            className="fixed"
          />
          <canvas
            ref={this.canvasRef}
            width={this.state.width}
            height={this.state.height}
            className="fixed"
          />
        </div>
        {/* <div id="button-group">
          <button id="btn-user" onClick={() => this.changeFacingMode('user')}>User (Front)</button>
          <button id="btn-enviroment" onClick={() => this.changeFacingMode('enviroment')}>Enviroment (Back)</button>
          <button id="btn-left" onClick={() => this.changeFacingMode('left')}>Left</button>
          <button id="btn-right" onClick={() => this.changeFacingMode('right')}>Right</button>
          <button id="btn-front" onClick={() => this.changeFacingMode('front')}>Front</button>
          <button id="btn-back" onClick={() => this.changeFacingMode('back')}>Back</button>
        </div> */}
        {this.state.btnDeviceId && (
          <div class="btn-device-container">
            <p>
              Click button below to access back camera
            </p>
            <div id="btnDeviceIdContainer">
              {this.state.btnDeviceId}
            </div>
          </div>
        )}
        {!this.state.model && (
          <div class="loader" style={{width: this.state.width, height: this.state.height}}>
            Loading model...
          </div>
        )}
        <footer>
          &copy; FourOhFour 2019
        </footer>
      </div>
    );
  }
}

export default App;
