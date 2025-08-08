// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi();

// Declare global BabylonJS objects that will be loaded from CDN
declare global {
  const BABYLON: typeof import('babylonjs');
  const BABYLON_GUI: typeof import('babylonjs-gui');
  const BABYLON_MATERIALS: typeof import('babylonjs-materials');
}

// Local imports for ROS-specific modules
let urdf: typeof import('@polyhobbyist/babylon_ros');
let ColladaFileLoader: typeof import('@polyhobbyist/babylon-collada-loader');

let scene : BABYLON.Scene | undefined = undefined;
let engine : BABYLON.Engine | undefined = undefined;

let currentRobot : urdf.Robot | undefined = undefined;

let ground : BABYLON.GroundMesh | undefined = undefined;
let camera : BABYLON.ArcRotateCamera | undefined = undefined;
let statusLabel : BABYLON_GUI.TextBlock;

function clearStatus() {
  statusLabel.text = "";
}

let readyToRender : Boolean = false;

let jointAxisList : BABYLON.PositionGizmo[] = [];
let linkAxisList : BABYLON.PositionGizmo[] = [];

function clearAxisGizmos() {
  linkAxisList.forEach((a) => {
    a.dispose();
  });
  linkAxisList = [];

  jointAxisList.forEach((a) => {
    a.dispose();
  });
  jointAxisList = [];
}

function addAxisToTransform(list : BABYLON.PositionGizmo[], scene : BABYLON.Scene, layer: BABYLON.UtilityLayerRenderer, transform : BABYLON.TransformNode | undefined) {
  if (transform) {
    let axis = new BABYLON.PositionGizmo(layer);
    axis.scaleRatio = 0.5
    axis.attachedNode = transform;
    list.push(axis);

    let drag = () => {
      if (transform) {
        vscode.postMessage({
          type: 'updateJoint',
          name: transform.id,
          value: transform.position
        });
      }
    }

    axis.onDragEndObservable.add(drag);
  }
}

// Initialize function to load ROS-specific dependencies
async function initializeDependencies() {
  try {
    // Show loading status
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
      loadingDiv.innerHTML = '<p>Loading ROS components...</p>';
    }

    // Load ROS-specific dependencies
    const [urdfModule, colladaModule] = await Promise.all([
      import('@polyhobbyist/babylon_ros'),
      import('@polyhobbyist/babylon-collada-loader')
    ]);

    urdf = urdfModule;
    ColladaFileLoader = colladaModule;

    // Remove loading indicator
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }

    // Initialize the scene after dependencies are loaded
    initializeScene();
  } catch (error) {
    console.error('Failed to load dependencies:', error);
    vscode.postMessage({
      type: 'error',
      message: 'Failed to load ROS components'
    });
  }
}

// Initialize scene after all dependencies are loaded
function initializeScene() {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  engine = new BABYLON.Engine(canvas, true);
  
  // Create scene
  createScene().then(() => {
    // Initialize status label
    statusLabel = new BABYLON_GUI.TextBlock();
    createUI(scene);
  });

  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'urdf':
        applyURDF(message.urdf);
        break;
        case 'previewFile':
        vscode.setState({previewFile: message.previewFile});
        break;
        case 'colors':
          camera.radius = message.cameraRadius;
          scene.clearColor = BABYLON.Color4.FromHexString(message.backgroundColor);
          let gm = ground.material as BABYLON_MATERIALS.GridMaterial;
          gm.lineColor = BABYLON.Color3.FromHexString(message.gridLineColor);
          gm.mainColor = BABYLON.Color3.FromHexString(message.gridMainColor);
          gm.minorUnitVisibility = parseFloat(message.gridMinorOpacity);

          readyToRender = true;
          break;
    }
  });
  
  // Start render loop
  engine.runRenderLoop(function () {
    if (scene && readyToRender) {
      scene.render();
    }
  });

  // Watch for browser/canvas resize events
  window.addEventListener("resize", function () {
    engine.resize();
  });
  
  // Send ready message
  vscode.postMessage({ type: 'ready' });
}

// Copy the rest of the functions from the original file
// (createScene, createUI, applyURDF, etc.)

// Wait for BabylonJS to load from CDN before initializing
window.addEventListener('DOMContentLoaded', () => {
  // Check if BabylonJS is loaded
  const checkBabylon = setInterval(() => {
    if (typeof BABYLON !== 'undefined' && typeof BABYLON_GUI !== 'undefined' && typeof BABYLON_MATERIALS !== 'undefined') {
      clearInterval(checkBabylon);
      initializeDependencies();
    }
  }, 100);
  
  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkBabylon);
    if (typeof BABYLON === 'undefined') {
      vscode.postMessage({
        type: 'error',
        message: 'Failed to load 3D viewer libraries'
      });
    }
  }, 10000);
});