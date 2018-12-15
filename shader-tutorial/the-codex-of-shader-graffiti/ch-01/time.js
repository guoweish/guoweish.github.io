// To create a quad for shading
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform float u_Time;\n' +
  'uniform float u_hwr;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  float r = 0.5 + sin(u_Time)/3.0;\n' +
  '  vec2 center = vec2(0.0, 0.0);\n' +
  '  vec2 uv = v_TexCoord - 0.5;\n' +
  '  uv.x /= u_hwr;\n' +
  '  float col = 0.0;\n' +
  '  float dist = distance(uv.xy, center.xy);\n' +
  '  if(dist < r) {\n' +
  '    col = 1.0 - smoothstep(0.0, r, dist);\n' +
  '  }\n' +
  '  gl_FragColor = vec4(vec3(col),1.0);\n' +
  '  gl_FragColor *= vec4(1.0, 2.5, 3.0, 1.0);\n' +
  '}\n';

function main() { 
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var heightWidthRatio = windowHeight / windowWidth;

  var canvas = document.getElementById('example');  
  canvas.width = windowWidth;
  canvas.height = windowHeight;

  var startTime = new Date().getTime()/1000;
  var uTime = 0;

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the vertex information
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  var u_hwr = gl.getUniformLocation(gl.program, 'u_hwr');
  gl.uniform1f(u_hwr, heightWidthRatio);

  var u_Time = gl.getUniformLocation(gl.program, 'u_Time');
  gl.uniform1f(u_Time, uTime);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // Clear <canvas>
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle

  loop();

  function loop() {
    uTime = new Date().getTime()/1000 - startTime;
    gl.uniform1f(u_Time, uTime);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); 

    window.requestAnimationFrame(loop);
  }
}

function initVertexBuffers(gl) {
  var verticesTexCoords = new Float32Array([
    // Vertex coordinates, texture coordinate
    -1.0,  1.0,   0.0, 1.0,
    -1.0, -1.0,   0.0, 0.0,
     1.0,  1.0,   1.0, 1.0,
     1.0, -1.0,   1.0, 0.0,
  ]);
  var n = 4; // The number of vertices

  // Create the buffer object
  var vertexTexCoordBuffer = gl.createBuffer();
  if (!vertexTexCoordBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

  var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_TexCoord
  var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  // Assign the buffer object to a_TexCoord variable
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object

  return n;
}
