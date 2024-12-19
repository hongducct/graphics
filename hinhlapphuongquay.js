var vertices = new Float32Array([
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5, // Front
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5, // Back
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5, // Left
     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5, // Right
    -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5, // Top
    -0.5, -0.5,  0.5,  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5  // Bottom
]);

var texCoords = new Float32Array([
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0
]);

var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,
    4, 5, 6,   4, 6, 7,
    8, 9, 10,  8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
]);

var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    uniform mat4 u_ModelMatrix;
    varying vec2 v_TexCoord;
    void main() {
        gl_Position = u_ModelMatrix * a_Position;
        v_TexCoord = a_TexCoord;
    }
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform sampler2D u_Sampler;
    varying vec2 v_TexCoord;
    void main() {
        gl_FragColor = texture2D(u_Sampler, v_TexCoord);
    }
`;

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

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var modelMatrix = new Matrix4();

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1.0);

    var textures = [];
    var loaded = 0;
    var imageFiles = ['xucxac1.jpg', 'xucxac2.jpg', 'xucxac3.jpg', 'xucxac4.jpg', 'xucxac5.jpg', 'xucxac6.jpg']; // Đảm bảo các file này tồn tại

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

    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;
    let rotationFactor = 0.05;
    let angleX = 0;
    let angleY = 0;
    let freeRotationSpeed = 1;

    canvas.addEventListener('mousedown', () => {
        isMouseDown = true;
    });

    canvas.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isMouseDown) {
            const rect = canvas.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
            angleX -= (x - mouseX) * rotationFactor * 500;
            angleY -= (y - mouseY) * rotationFactor * 500;

        }
        const rect = canvas.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * -2;
        mouseX = x;
        mouseY = y;
    });


    function tick() {
        if (!isMouseDown) {
            angleX += freeRotationSpeed * 0.5;
            angleY += freeRotationSpeed * 0.5;
        }

        modelMatrix.setRotate(angleX, 0, 1, 0);
        modelMatrix.rotate(angleY, 1, 0, 0);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

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

    if (!vertexBuffer || !texCoordBuffer || !indexBuffer) {
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

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}