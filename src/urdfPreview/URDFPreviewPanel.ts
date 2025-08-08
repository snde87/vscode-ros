// Get access to the VS Code API from within the webview context
const vscode = acquireVsCodeApi();

// Lazy load heavy dependencies
let BABYLON: typeof import('babylonjs');
let Materials: typeof import('babylonjs-materials');
let urdf: typeof import('@polyhobbyist/babylon_ros');
let ColladaFileLoader: typeof import('@polyhobbyist/babylon-collada-loader');
let GUI: typeof import('babylonjs-gui');

let scene : BABYLON.Scene | undefined = undefined;
let engine : BABYLON.Engine | undefined = undefined;

let currentRobot : urdf.Robot | undefined = undefined;

let ground : BABYLON.GroundMesh | undefined = undefined;
let camera : BABYLON.ArcRotateCamera | undefined = undefined;
let statusLabel : GUI.TextBlock;

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
        statusLabel.text = transform.name + 
        "\nX: " + transform.position.x.toFixed(6) + 
        "\nY: " + transform.position.y.toFixed(6) + 
        "\nZ: " + transform.position.z.toFixed(6);
        statusLabel.linkOffsetY = -100;
      statusLabel.linkWithMesh(transform);
      }
    }

    axis.xGizmo.dragBehavior.onDragObservable.add(drag);
    axis.yGizmo.dragBehavior.onDragObservable.add(drag);
    axis.zGizmo.dragBehavior.onDragObservable.add(drag);
      
  }
}

function toggleAxisOnRobot(jointOrLink : Boolean, scene : BABYLON.Scene, layer: BABYLON.UtilityLayerRenderer, robot : urdf.Robot) {
  let whichAxis = jointOrLink ? jointAxisList : linkAxisList;

  if (whichAxis.length == 0) {
    if (jointOrLink) {
      robot.joints.forEach((j) => {
        addAxisToTransform(whichAxis, scene, layer, j.transform);
      });
    } else {
      robot.links.forEach((l) => {
        l.visuals.forEach((v) => {
          addAxisToTransform(whichAxis, scene, layer, v.transform);
        });
      });
    }
  } else {
    clearAxisGizmos();
    clearStatus();
  }
}

let jointRotationGizmos : BABYLON.RotationGizmo[] = [];
let linkRotationGizmos : BABYLON.RotationGizmo[] = [];

function clearRotationGizmos() {
  jointRotationGizmos.forEach((a) => {
    a.dispose();
  });
  jointRotationGizmos = [];
  linkRotationGizmos.forEach((a) => {
    a.dispose();
  });
  linkRotationGizmos = [];
}

function addRotationToTransform(list : BABYLON.RotationGizmo[], scene : BABYLON.Scene, layer: BABYLON.UtilityLayerRenderer, transform : BABYLON.TransformNode | undefined) {
  if (transform) {
    let rotationGizmo = new BABYLON.RotationGizmo(layer);
    rotationGizmo.scaleRatio = 0.5
    rotationGizmo.attachedNode = transform;
    list.push(rotationGizmo);

    let drag = () => {
      if (transform) {
        statusLabel.text = transform.name + 
        "\nR:" + transform.rotation.x.toFixed(6) + 
        "\nP:" + transform.rotation.y.toFixed(6) + 
        "\nY:" + transform.rotation.z.toFixed(6);
        statusLabel.linkOffsetY = -100;
      statusLabel.linkWithMesh(transform);
      }
    }

    rotationGizmo.xGizmo.dragBehavior.onDragObservable.add(drag);
    rotationGizmo.yGizmo.dragBehavior.onDragObservable.add(drag);
    rotationGizmo.zGizmo.dragBehavior.onDragObservable.add(drag);
  }

}

function toggleAxisRotationOnRobot(jointOrLink : Boolean, ui: GUI.AdvancedDynamicTexture, scene : BABYLON.Scene, layer: BABYLON.UtilityLayerRenderer, robot : urdf.Robot) {
  let whichList = jointOrLink ? jointRotationGizmos : linkRotationGizmos;
  if (whichList.length == 0) {
    if (jointOrLink) {
      robot.joints.forEach((j) => {
        addRotationToTransform(whichList, scene, layer, j.transform);
      });
    } else {
      robot.links.forEach((l) => {
        l.visuals.forEach((v) => {
          addRotationToTransform(whichList, scene, layer, v.transform);
        });
      });
    }
  } else {
    clearRotationGizmos();
    clearStatus();
  }
}


var createScene = async function () {
  scene = new BABYLON.Scene(engine);
  if (BABYLON.SceneLoader) {
    //Add this loader into the register plugin
    BABYLON.SceneLoader.RegisterPlugin(new ColladaFileLoader.DAEFileLoader());
  }

  // This creates a basic Babylon Scene object (non-mesh)
    // Create a default ground and skybox.
  const environment = scene.createDefaultEnvironment({
    createGround: true,
    createSkybox: false,
    enableGroundMirror: true,
    groundMirrorSizeRatio: 0.15
  });

  scene.useRightHandedSystem = true;
  scene.clearColor = BABYLON.Color4.FromColor3(BABYLON.Color3.Black());

  
  // This creates and positions a free camera (non-mesh)
  camera = new BABYLON.ArcRotateCamera("camera1", - Math.PI / 3, 5 * Math.PI / 12, 1, new BABYLON.Vector3(0, 0, 0), scene);
  camera.wheelDeltaPercentage = 0.01;
  camera.minZ = 0.1;

  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  var groundMaterial = new Materials.GridMaterial("groundMaterial", scene);
  groundMaterial.majorUnitFrequency = 5;
  groundMaterial.minorUnitVisibility = 0.5;
  groundMaterial.gridRatio = 1;
  groundMaterial.opacity = 0.8;
  groundMaterial.useMaxLine = true;
  groundMaterial.lineColor = BABYLON.Color3.Green();
  groundMaterial.mainColor = BABYLON.Color3.Green();

  ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 50, height: 50}, scene);
  ground.material = groundMaterial;
  ground.isPickable = false;


  return scene;
};

function resetCamera() {
  camera.alpha = - Math.PI / 3;
  camera.beta = 5 * Math.PI / 12;
  camera.target = new BABYLON.Vector3(0, 0, 0);
}

function createButton(toolbar: GUI.StackPanel, name : string, text : string, scene : BABYLON.Scene, onClick : () => void) {
  var button = GUI.Button.CreateSimpleButton(name, text);
  button.width = "100px"
  button.height = "20px";
  button.color = "white";
  button.cornerRadius = 5;
  button.background = "green";
  button.onPointerUpObservable.add(onClick);
  toolbar.addControl(button);
  return button;
}

function createUI(scene : BABYLON.Scene) {
  var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

  statusLabel.color = "white";
  statusLabel.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  statusLabel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  statusLabel.resizeToFit = true;
  statusLabel.outlineColor = "green";
  statusLabel.outlineWidth = 2.0;
  advancedTexture.addControl(statusLabel);

  var toolbar = new GUI.StackPanel();
  toolbar.paddingTop = "10px";
  toolbar.paddingLeft = "10px";
  toolbar.width = "500px";
  toolbar.height = "50px";
  toolbar.fontSize = "14px";
  toolbar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
  toolbar.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  toolbar.isVertical = false;
  advancedTexture.addControl(toolbar);


  var utilLayer = new BABYLON.UtilityLayerRenderer(scene);

  const gizmoManager = new BABYLON.GizmoManager(scene);
  gizmoManager.usePointerToAttachGizmos = false;

  createButton(toolbar, "jointAxisButton", "Joint Axis", scene, () => {
    toggleAxisOnRobot(true, scene, utilLayer, currentRobot);
  });

  createButton(toolbar, "linkAxisButton", "Link Axis", scene, () => {
    toggleAxisOnRobot(false, scene, utilLayer, currentRobot);
  });

  createButton(toolbar, "jointRotationButton", "Joint Rotation", scene, () => {  
    toggleAxisRotationOnRobot(true, advancedTexture, scene, utilLayer, currentRobot);
  });

  createButton(toolbar, "linkRotationButton", "Link Rotation", scene, () => {  
    toggleAxisRotationOnRobot(false, advancedTexture, scene, utilLayer, currentRobot);
  });

}

async function applyURDF(urdfText) {
  try {
    clearAxisGizmos();
    clearRotationGizmos();
    clearStatus();
    resetCamera();

    if (currentRobot) {
      currentRobot.dispose();
      currentRobot = undefined;
    }

    vscode.postMessage({
      command: "trace",
      text: `loading urdf`,
    });


    currentRobot = await urdf.deserializeUrdfToRobot(urdfText);
    currentRobot.create(scene);

    vscode.postMessage({
      command: "trace",
      text: `loaded urdf`,
    });
  } catch (err) {
    
    vscode.postMessage({
      command: "error",
      text: `Could not render URDF due to: ${err}\n${err.stack}`,
    });
  }
}

// Initialize function to load dependencies
async function initializeDependencies() {
  try {
    // Show loading status
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.innerHTML = '<p>Loading 3D viewer components...</p>';
    loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white; font-size: 18px;';
    document.body.appendChild(loadingDiv);

    // Load dependencies in parallel
    const [babylonModule, materialsModule, urdfModule, colladaModule, guiModule] = await Promise.all([
      import('babylonjs'),
      import('babylonjs-materials'),
      import('@polyhobbyist/babylon_ros'),
      import('@polyhobbyist/babylon-collada-loader'),
      import('babylonjs-gui')
    ]);

    BABYLON = babylonModule;
    Materials = materialsModule;
    urdf = urdfModule;
    ColladaFileLoader = colladaModule;
    GUI = guiModule;

    // Remove loading indicator
    loadingDiv.remove();

    // Initialize the scene after dependencies are loaded
    initializeScene();
  } catch (error) {
    console.error('Failed to load dependencies:', error);
    vscode.postMessage({
      type: 'error',
      message: 'Failed to load 3D viewer components'
    });
  }
}



// Move scene initialization to a separate function
function initializeScene() {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  engine = new BABYLON.Engine(canvas, true);
  
  // Create scene
  createScene().then(() => {
    // Initialize status label
    statusLabel = new GUI.TextBlock();
    createUI(scene);
  });

  window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
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
          let gm = ground.material as Materials.GridMaterial;
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

// Start loading dependencies when the page loads
window.addEventListener('DOMContentLoaded', () => {
  initializeDependencies();
});
  
