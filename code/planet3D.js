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

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	// make planet vertex and colors
	// earth sphere
    var earth = sphere(); 

    earth.scale(0.5, 0.5, 0.5);
    earth.rotate(45.0, [ 1, 1, 1]);
    earth.translate(0.0, 0.0, 0.0);

	points = points.concat(earth.TriangleVertices);
    colors = colors.concat(earth.TriangleVertexColors);

	earth_point_length = points.length;
	earth_color_length = colors.length;


	// moon sphere
	var moon = sphere(); 

	moon.scale(0.1, 0.1, 0.1);
	moon.rotate(45.0, [1,1,1]);
	moon.translate(0.6,0.0,0.6);

    points = points.concat(moon.TriangleVertices);
    colors = colors.concat(moon.TriangleVertexColors);


	// number of moon's point = total point - earth point
	moon_point_length = points.length - earth_point_length;
	moon_color_length = colors.length - earth_color_length;
	


	//  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0, 0, 0, 1.0 );

    gl.enable(gl.DEPTH_TEST);
   // gl.enable(gl.CULL);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


	// Load the data into the GPU
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");

	//����� ��������
    //event listeners for buttons
	/*
    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
	*/
    render();
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, theta);

	// draw earth 
    gl.drawArrays( gl.TRIANGLES, 0, earth_point_length);
	// draw moon
	gl.drawArrays( gl.TRIANGLES, earth_point_length, moon_point_length);
    requestAnimFrame( render );
}