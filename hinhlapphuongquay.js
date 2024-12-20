var VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
attribute vec3 a_Normal;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
varying vec2 v_TexCoord;
varying vec3 v_Normal;
varying vec3 v_Position;

void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_TexCoord = a_TexCoord;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    v_Position = vec3(u_ModelMatrix * a_Position);
}
`;

var FSHADER_SOURCE = `
precision mediump float;
uniform sampler2D u_Sampler;
varying vec2 v_TexCoord;
varying vec3 v_Normal;
varying vec3 v_Position;
uniform vec3 u_LightColor;
uniform vec3 u_LightPosition;
uniform vec3 u_AmbientColor;

void main() {
    vec3 normal = normalize(v_Normal);
    vec3 lightDirection = normalize(u_LightPosition - v_Position);

    float nDotL = max(dot(lightDirection, normal), 0.0);

    vec3 diffuse = u_LightColor * nDotL;

    vec3 ambient = u_AmbientColor;

    gl_FragColor = texture2D(u_Sampler, v_TexCoord) * vec4(diffuse + ambient, 1.0);
}
`;

var vertices = new Float32Array([
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,     // v0-v1-v2-v3 front
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,  // v4-v5-v6-v7 back
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5,  // v3-v7-v4-v0 left
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5,   // v2-v6-v5-v1 right
    -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,  // v3-v2-v6-v7 top
    -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5   // v0-v4-v5-v1 bottom
]);

var normals = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,     // v0-v1-v2-v3 front
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,     // v4-v5-v6-v7 back
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,     // v3-v7-v4-v0 left
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,     // v2-v6-v5-v1 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,     // v3-v2-v6-v7 top
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0     // v0-v4-v5-v1 bottom
]);

var texCoords = new Float32Array([
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,     // v0-v1-v2-v3 front
    0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0,     // v4-v5-v6-v7 back
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,     // v3-v7-v4-v0 left
    0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,     // v2-v6-v5-v1 right
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,     // v3-v2-v6-v7 top
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0      // v0-v4-v5-v1 bottom
]);

var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3,     // front
    4, 5, 6, 4, 6, 7,     // back
    8, 9, 10, 8, 10, 11,    // left
    12, 13, 14, 12, 14, 15,  // right
    16, 17, 18, 16, 18, 19,  // top
    20, 21, 22, 20, 22, 23   // bottom
]);

function main() {
    var canvas = document.getElementById('webgl');
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.1, 0.1, 0.1, 0.8);

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    var u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');

    var modelMatrix = new Matrix4();
    var normalMatrix = new Matrix4();
    var viewMatrix = new Matrix4();
    var projMatrix = new Matrix4();
    var translationMatrix = new Matrix4(); // Khôi phục

    var textures = [];
    var loaded = 0;
    var imageFiles = ['xucxac1.jpg', 'xucxac2.jpg', 'xucxac3.jpg', 'xucxac4.jpg', 'xucxac5.jpg', 'xucxac6.jpg'];

    imageFiles.forEach((src, index) => {
        textures[index] = gl.createTexture();
        var image = new Image();
        image.onload = function() {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[index]);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

            loaded++;
            if (loaded === imageFiles.length) {
                tick();
            }
        };
        image.src = src;
    });

    let isDraggingLeft = false;
    let isDraggingRight = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let angleX = 0;
    let angleY = 0;
    let rotationSpeed = 0.4;
    let freeRotationSpeed = 1;
    let dragStartPositionX = 0;
    let dragStartPositionY = 0;
    let dragSensitivity = 0.01; // Khôi phục

    canvas.addEventListener('mousedown', (event) => {
        if (event.button === 0) {
            isDraggingLeft = true;
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
        } else if (event.button === 2) {
            isDraggingRight = true;
            dragStartPositionX = event.clientX;
            dragStartPositionY = event.clientY;
        }
    });

    canvas.addEventListener('mouseup', (event) => {
        if (event.button === 0) {
            isDraggingLeft = false;
        } else if (event.button === 2) {
            isDraggingRight = false;
        }
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDraggingLeft) {
            const deltaX = event.clientX - lastMouseX;
            const deltaY = event.clientY - lastMouseY;

            angleX += deltaX * rotationSpeed;
            angleY += deltaY * rotationSpeed;

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
        } else if (isDraggingRight) {
            const deltaX = event.clientX - dragStartPositionX;
            const deltaY = event.clientY - dragStartPositionY;

            const xTranslation = deltaX * dragSensitivity;
            const yTranslation = -deltaY * dragSensitivity;

            translationMatrix.translate(xTranslation, yTranslation, 0);

            dragStartPositionX = event.clientX;
            dragStartPositionY = event.clientY;
        }
    });

    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // Initialize scale
    let scale = 1.0; 

    // Get the scale slider
    var scaleSlider = document.getElementById('scaleSlider');

    // Add an event listener to the slider to update the scale value
    scaleSlider.addEventListener('input', function() {
        scale = parseFloat(scaleSlider.value); 
    });

    function tick() {
        if (!isDraggingLeft) {
            angleX += freeRotationSpeed * 0.7;
            angleY += freeRotationSpeed * 0.7;
        }

        modelMatrix.setIdentity();
        modelMatrix.multiply(translationMatrix);
        modelMatrix.rotate(angleY, 1, 0, 0);
        modelMatrix.rotate(angleX, 0, 1, 0);

        // Apply scaling (and pulsating effect) BEFORE sending the matrix to the shader
        let pulse = Math.sin(Date.now() * 0.002) * 0.2 + 0.9; // Vary between 0.7 and 1.1
        let currentScale = scale * pulse;
        modelMatrix.scale(currentScale, currentScale, currentScale);
    
        normalMatrix.setInverseOf(modelMatrix);
        normalMatrix.transpose();

        viewMatrix.setLookAt(0, 0, 5, 0, 0, 0, 0, 1, 0);
        projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
    
        // Send the updated model matrix to the shader
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
        gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);

        gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
        gl.uniform3f(u_LightPosition, -3.0, 3.0, 5.0);
        gl.uniform3f(u_AmbientColor, 0.3, 0.3, 0.3);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (let i = 0; i < 6; i++) {
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, i * 6);
        }

        requestAnimationFrame(tick);
    }
}

function initVertexBuffers(gl) {
    var vertexBuffer = gl.createBuffer();
    var texCoordBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    var normalBuffer = gl.createBuffer();

    if (!vertexBuffer || !texCoordBuffer || !indexBuffer || !normalBuffer) {
        console.log('Failed to create buffers');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_TexCoord);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}