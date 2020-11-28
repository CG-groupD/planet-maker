"use strict";

var canvas;
var gl;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 1;
var theta = [ 0, 0, 0 ];

var thetaLoc;

var flag = false;

var points = [];
var colors = [];
var earth_point_length;
var earth_color_length;
var moon_point_length;
var moon_color_length;
var depth1_point_length;
var depth2_point_length;
var vColor;
var mvMatrix;
var modelViewMatrix;
var projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var near = 2;
var far = 10.0;
var radius =8;
var camera_theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/100.0;

var fovy = 45.0;
var aspect = 1;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var clicked_x;
var clicked_y;
var moved_x;
var moved_y;
var click_check=0;

var normalsArray = [];

var lightPosition = vec4(10.0, 10.0, 10.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

// Paint the apple white
var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var normalMatrix, normalMatrixLoc;
var program;


// image laying function
function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	
	//=================================================================
	// make planet vertex and colors
    //=================================================================
	

	// earth sphere
    var earth = sphere(); 

    earth.rotate(45.0, [ 1, 1, 1]);
    earth.translate(0.0, 0.0, 0.0);

	points = points.concat(earth.TriangleVertices);

	earth_point_length = points.length;
	earth_color_length = colors.length;

	//=================================================================

	// moon sphere
	var moon = sphere(); 

	moon.scale(0.1, 0.1, 0.1);
	moon.rotate(45.0, [1,1,1]);
	moon.translate(1.2,0.0,1.2);

    points = points.concat(moon.TriangleVertices);

	// number of moon's point = total point - earth point
	moon_point_length = points.length - earth_point_length;
	moon_color_length = colors.length - earth_color_length;
	
	//=================================================================

	//earth depth1
	var depth1 = sphere();
	depth1.scale(0.5,0.5,0.5);
	depth1.rotate(45.0, [ 1, 1, 1]);
	depth1.translate(0.0, 0.0, 0.0);

	points = points.concat(depth1.TriangleVertices);
	
	// number of earth depth1's point = total point - earth point - moon point
	depth1_point_length = points.length - earth_point_length - moon_point_length;

	//=================================================================

	// earth_depth2
	var depth2 = sphere();
	depth2.scale(0.1,0.1,0.1);
	depth2.rotate(45.0, [ 1, 1, 1]);
	depth2.translate(0.0, 0.0, 0.0);

	points = points.concat(depth2.TriangleVertices);
	
	// number of earth depth2's point = total point - earth point - moon point - earth_depth1 point
	depth2_point_length = points.length - earth_point_length - moon_point_length - depth1_point_length;

	
	var p = Math.pow(-1, Math.round(Math.random()) + 1);

	//=================================================================

	// background stars vertex
	for(var i = 0; i < 100; i++) {
		var star = sphere();
		star.scale(0.01,0.01,0.01);
		star.rotate(45.0, [ 1, 1, 1]);
		star.translate(Math.pow(-1, Math.round(Math.random()) + 1) * (Math.random()*3 + 0.5),
			Math.pow(-1, Math.round(Math.random()) + 1) * (Math.random()*3 + 0.5),
			Math.pow(-1, Math.round(Math.random()) + 1) * (Math.random()*3 + 0.5));

		points = points.concat(star.TriangleVertices);	
	}

	//=================================================================
	//=================================================================


	//  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0, 0, 0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    
    //  Load shaders and initialize attribute buffers
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);


	//Load the data into the GPU

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");

	modelViewMatrixLoc = gl.getUniformLocation( program, "modelView" );
	projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );



	 gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );

	// read image
	var image = new Image();
	image.onload = function() {
	   configureTexture( image );
	}
	image.crossOrigin = "anonymous";
    image.src = "earth2.jpg";
    

	wheel();
	moveCamera();
    render();

}


// drag event
function moveCamera(){
	canvas.onmouseup = function(e){
		
		click_check = 0;
	}
	canvas.onmousedown = function(e){
		clicked_x=event.offsetX;
        clicked_y=event.offsetY;
		click_check = 1;
	}	
	canvas.onmousemove = function(e){
		if(click_check == 1){ // When the mouse moves while the mouse is pressed, drag event
			// drag ending coord save
            moved_x=event.offsetX;
            moved_y=event.offsetY;
    
            // Longitude control only with latitude, the circle splashes
			// The greater the number you divide, the smaller the angle of rotation.
            phi-=((moved_x-clicked_x)/10000);
            camera_theta-=((moved_y-clicked_y)/10000);

     
		}
	}

}

// camera zoom in, zoom out
function wheel(){
		canvas.onmousewheel=function(e){
				if(radius>2.0){
					if(e.wheelDelta<0){
						radius += 0.05;
					}
					else{
						radius -= 0.05;
					}
				}
				else{
					if(e.wheelDelta<0){
						radius += 0.05;
					}
				}
			
		}
}

function render()
{
	    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta[axis] -= 2.0;
    gl.uniform3fv(thetaLoc, theta);

	
	eye = vec3(radius*Math.cos(camera_theta)*Math.sin(phi), radius*Math.sin(camera_theta),
             radius*Math.cos(camera_theta)*Math.cos(phi)); // eye point
    modelViewMatrix = lookAt(eye, at , up);
	projectionMatrix = perspective(fovy, aspect, near, far); //perspective 

	// normal matrix only really need if there is nonuniform scaling
    // it's here for generality but since there is
    // no scaling in this example we could just use modelView matrix in shaders

	normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

  
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
	gl.uniformMatrix3fv( normalMatrixLoc, false, flatten(normalMatrix) );



	gl.disableVertexAttribArray( vColor );
	gl.vertexAttrib4f(vColor,0,0,0,1); //brown

	// draw earth 
	gl.uniform1i(gl.getUniformLocation(program, "texture"), 0); // use earth image texture 
    gl.drawArrays( gl.TRIANGLES, 0, earth_point_length);	// first sphere (earth)


	gl.uniform1i(gl.getUniformLocation(program, "texture"), 1); // do not use texture

	// draw moon
	gl.disableVertexAttribArray( vColor ); // Reset Vertex attrib array to Disable
	gl.vertexAttrib4f(vColor,1,1,0.5,1); // yellow
	gl.drawArrays( gl.TRIANGLES, earth_point_length, moon_point_length); //second sphere (moon)


	// draw earth depth
	gl.disableVertexAttribArray(vColor); // Reset Vertex attrib array to Disable
	gl.vertexAttrib4f(vColor,0.6,0.3,0,1); // brown
	gl.drawArrays( gl.TRIANGLES, 2*earth_point_length, depth1_point_length);	// third sphere (nuclear)
	gl.vertexAttrib4f(vColor,1,0,0,1); // red
	gl.drawArrays( gl.TRIANGLES, 3*earth_point_length, depth2_point_length); // fourth sphere (mantle)


	// draw stars in background
	gl.uniform3fv(thetaLoc, [0,0,0]);
	for(var x = 4; x< 104; x++){
		gl.disableVertexAttribArray(vColor); //Reset Vertex attrib array to Disable
		gl.vertexAttrib4f(vColor,1,1,1,1); // white stars
		gl.drawArrays( gl.TRIANGLES, x*earth_point_length, depth1_point_length);
	}

	requestAnimFrame( render ,200);

}


// Draw sphere
function sphere(numSubdivisions) {

var subdivisions = 5;
if(numSubdivisions) subdivisions = numSubdivisions;


var data = {};


var sphereVertexCoordinates = [];
var sphereVertexCoordinatesNormals = [];
var sphereVertexColors = [];
var sphereTextureCoordinates = [];
var sphereNormals = [];

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

function triangle(a, b, c) {

     sphereVertexCoordinates.push([a[0],a[1], a[2], 1]);
     sphereVertexCoordinates.push([b[0],b[1], b[2], 1]);
     sphereVertexCoordinates.push([c[0],c[1], c[2], 1]);


     sphereNormals.push([a[0],a[1], a[2]]);
     sphereNormals.push([b[0],b[1], b[2]]);
     sphereNormals.push([c[0],c[1], c[2]]);

	// normals are vectors  
	// the part from geometry.js
	 normalsArray.push(a[0],a[1], a[2], 0.0);
     normalsArray.push(b[0],b[1], b[2], 0.0);
     normalsArray.push(c[0],c[1], c[2], 0.0);



     sphereVertexColors.push([(1+a[0])/2.0, (1+a[1])/2.0, (1+a[2])/2.0, 1.0]);
     sphereVertexColors.push([(1+b[0])/2.0, (1+b[1])/2.0, (1+b[2])/2.0, 1.0]);
     sphereVertexColors.push([(1+c[0])/2.0, (1+c[1])/2.0, (1+c[2])/2.0, 1.0]);

     sphereTextureCoordinates.push([0.5*Math.acos(a[0])/Math.PI, 0.5*Math.asin(a[1]/Math.sqrt(1.0-a[0]*a[0]))/Math.PI]);
     sphereTextureCoordinates.push([0.5*Math.acos(b[0])/Math.PI, 0.5*Math.asin(b[1]/Math.sqrt(1.0-b[0]*b[0]))/Math.PI]);
     sphereTextureCoordinates.push([0.5*Math.acos(c[0])/Math.PI, 0.5*Math.asin(c[1]/Math.sqrt(1.0-c[0]*c[0]))/Math.PI]);

}



function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

tetrahedron(va, vb, vc, vd, subdivisions);


function translate(x, y, z){
   for(var i=0; i<sphereVertexCoordinates.length; i++) {
     sphereVertexCoordinates[i][0] += x;
     sphereVertexCoordinates[i][1] += y;
     sphereVertexCoordinates[i][2] += z;
   };
}

function scale(sx, sy, sz){
    for(var i=0; i<sphereVertexCoordinates.length; i++) {
        sphereVertexCoordinates[i][0] *= sx;
        sphereVertexCoordinates[i][1] *= sy;
        sphereVertexCoordinates[i][2] *= sz;
        sphereNormals[i][0] /= sx;
        sphereNormals[i][1] /= sy;
        sphereNormals[i][2] /= sz;
    };
}

function radians( degrees ) {
    return degrees * Math.PI / 180.0;
}

function rotate( angle, axis) {

    var d = Math.sqrt(axis[0]*axis[0] + axis[1]*axis[1] + axis[2]*axis[2]);

    var x = axis[0]/d;
    var y = axis[1]/d;
    var z = axis[2]/d;

    var c = Math.cos( radians(angle) );
    var omc = 1.0 - c;
    var s = Math.sin( radians(angle) );

    var mat = [
        [ x*x*omc + c,   x*y*omc - z*s, x*z*omc + y*s ],
        [ x*y*omc + z*s, y*y*omc + c,   y*z*omc - x*s ],
        [ x*z*omc - y*s, y*z*omc + x*s, z*z*omc + c ]
    ];

    for(var i=0; i<sphereVertexCoordinates.length; i++) {
          var u = [0, 0, 0];
          var v = [0, 0, 0];
          for( var j =0; j<3; j++)
           for( var k =0 ; k<3; k++) {
              u[j] += mat[j][k]*sphereVertexCoordinates[i][k];
              v[j] += mat[j][k]*sphereNormals[i][k];
            };
           for( var j =0; j<3; j++) {
             sphereVertexCoordinates[i][j] = u[j];
             sphereNormals[i][j] = v[j];
           };
    };
}

data.TriangleVertices = sphereVertexCoordinates;
data.TriangleNormals = sphereNormals;
data.TriangleVertexColors = sphereVertexColors;
data.TextureCoordinates = sphereTextureCoordinates;
data.rotate = rotate;
data.translate = translate;
data.scale = scale;
return data;

}
