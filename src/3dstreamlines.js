import * as THREE from "three";

const isNumeric = (n) => {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

const indexOfClosest = (num, arr) => {
  var index = 0;
  var diff = Math.abs(num - arr[0]);
  for (var val = 0; val < arr.length; val++) {
    var newdiff = Math.abs(num - arr[val]);
    if (newdiff < diff) {
      diff = newdiff;
      index = val;
    }
  }
  return index;
};

const getBinaryColor = (value, min, max, colors) => {
  function trim(s) {
    return s.charAt(0) === "#" ? s.substring(1, 7) : s;
  }
  function convertToRGB(hex) {
    var color = [];
    color[0] = parseInt(trim(hex).substring(0, 2), 16);
    color[1] = parseInt(trim(hex).substring(2, 4), 16);
    color[2] = parseInt(trim(hex).substring(4, 6), 16);
    color[3] = 255;
    return color;
  }
  if (value === null || isNaN(value)) {
    return [255, 255, 255, 0];
  }
  if (value > max) {
    return convertToRGB(colors[colors.length - 1].color);
  }
  if (value < min) {
    return convertToRGB(colors[0].color);
  }
  var loc = (value - min) / (max - min);
  if (loc < 0 || loc > 1) {
    return [255, 255, 255, 0];
  } else {
    var index = 0;
    for (var i = 0; i < colors.length - 1; i++) {
      if (loc >= colors[i].point && loc <= colors[i + 1].point) {
        index = i;
      }
    }
    var color1 = convertToRGB(colors[index].color);
    var color2 = convertToRGB(colors[index + 1].color);

    var f =
      (loc - colors[index].point) /
      (colors[index + 1].point - colors[index].point);
    var rgb = [
      (color1[0] + (color2[0] - color1[0]) * f) / 255,
      (color1[1] + (color2[1] - color1[1]) * f) / 255,
      (color1[2] + (color2[2] - color1[2]) * f) / 255,
      1,
    ];

    return rgb;
  }
};

const size = (a) => {
  var dim = [];
  var arr, len, index;
  for (;;) {
    arr = a.map((aa) => (Array.isArray(aa) ? aa.length : 0));
    len = Math.max(...arr);
    index = arr.indexOf(len);
    dim.push(a.length);
    if (len > 0) {
      a = a[index];
    } else {
      break;
    }
  }
  return dim;
};

class StreamLines {
  constructor(data, bounds, scene, options = {}) {
    this.verifyInputs(data, bounds, scene, options);
    this.data = data;
    this.bounds = this.computeBounds(data, bounds);
    this.scene = scene;
    this.noParticles = options.noParticles || 10000;
    this.maxAge = options.maxAge || 200;
    this.fadeOutPercentage = options.fadeOutPercentage || 0.1;
    this.individualColors = options.individualColors || 100;
    this.velocityFactor = options.velocityFactor || 0.1;
    this.min = options.min || 0;
    this.max = options.max || 1;
    this.noData = options.nodata || null;
    this.colorSource = options.colorSource || false;
    this.colors = options.colors || [
      { color: "#000000", point: 0.0 },
      { color: "#550088", point: 0.14285714285714285 },
      { color: "#0000ff", point: 0.2857142857142857 },
      { color: "#00ffff", point: 0.42857142857142855 },
      { color: "#00ff00", point: 0.5714285714285714 },
      { color: "#ffff00", point: 0.7142857142857143 },
      { color: "#ff8c00", point: 0.8571428571428571 },
      { color: "#ff0000", point: 1.0 },
    ];
    this.fadeOut = Math.round(this.maxAge * this.fadeOutPercentage);
    this.setColors(this.colors);
    this.getValidCells();
    this.add();
  }

  verifyInputs(data, bounds, scene, options) {
    if (scene.type !== "Scene") {
      throw new Error("Invalid Scene object");
    }

    if (!("u" in data) || !("v" in data) || !("w" in data)) {
      throw new Error("Invalid data object. Must contain keys: u, v, w.");
    }

    if (size(data.u).length !== 3) {
      throw new Error(
        "Invalid data object. Velocity array must have three dimensions, input has " +
          size(data.u).length +
          " dimensions."
      );
    }

    if (
      String(size(data.u)) !== String(size(data.v)) ||
      String(size(data.v)) !== String(size(data.w))
    ) {
      throw new Error(
        "Invalid data object. Dimensions must be consistent across velocity components"
      );
    }

    this.yarr = false;
    this.xarr = false;
    this.zarr = false;

    if ("y" in data) {
      this.yarr = true;
      if (size(data.y).length !== 1 || data.y.length !== size(data.u)[0]) {
        throw new Error(
          "Invalid data object. Provided y-axis array must be 1 dimensions and of equal length to the first dimension of the velocity arrays."
        );
      }
    } else {
      if (!("yMin" in bounds) || !isNumeric(bounds.yMin)) {
        throw new Error(
          "Invalid data object. If y-axis array not provided then yMin and yMax must be provided in bounds object."
        );
      }
    }

    if ("x" in data) {
      this.xarr = true;
      if (size(data.x).length !== 1 || data.x.length !== size(data.u)[1]) {
        throw new Error(
          "Invalid data object. Provided x-axis array must be 1 dimensions and of equal length to the second dimension of the velocity arrays."
        );
      }
    } else {
      if (!("xMin" in bounds) || !isNumeric(bounds.xMin)) {
        throw new Error(
          "Invalid data object. If x-axis array not provided then xMin and xMax must be provided in bounds object."
        );
      }
    }

    if ("z" in data) {
      this.zarr = true;
      if (size(data.z).length !== 1 || data.z.length !== size(data.u)[2]) {
        throw new Error(
          "Invalid data object. Provided z-axis array must be 1 dimensions and of equal length to the third dimension of the velocity arrays."
        );
      }
    } else {
      if (!("zMin" in bounds) || !isNumeric(bounds.zMin)) {
        throw new Error(
          "Invalid data object. If z-axis array not provided then zMin and zMax must be provided in bounds object."
        );
      }
    }
  }

  computeBounds(data, bounds) {
    if (!this.yarr) {
      bounds["yLen"] = data.u.length;
      bounds["yMin"] = parseFloat(bounds["yMin"]);
      bounds["yMax"] = parseFloat(bounds["yMax"]);
      bounds["ySize"] = (bounds["yMax"] - bounds["yMin"]) / bounds["yLen"];
    }
    if (!this.xarr) {
      bounds["xLen"] = data.u[0].length;
      bounds["xMin"] = parseFloat(bounds["xMin"]);
      bounds["xMax"] = parseFloat(bounds["xMax"]);
      bounds["xSize"] = (bounds["xMax"] - bounds["xMin"]) / bounds["xLen"];
    }
    if (!this.zarr) {
      bounds["zLen"] = data.u[0][0].length;
      bounds["zMin"] = parseFloat(bounds["zMin"]);
      bounds["zMax"] = parseFloat(bounds["zMax"]);
      bounds["zSize"] = (bounds["zMax"] - bounds["zMin"]) / bounds["zLen"];
    }
    return bounds;
  }

  getValidCells() {
    this.validCells = [];
    for (let i = 0; i < this.bounds["yLen"]; i++) {
      for (let j = 0; j < this.bounds["xLen"]; j++) {
        if (Array.isArray(this.data.u[i][j])) {
          for (let k = 0; k < this.bounds["zLen"]; k++) {
            if (
              isNumeric(this.data.u[i][j][k]) &&
              this.data.u[i][j][k] !== this.noData
            ) {
              this.validCells.push([i, j, k]);
            }
          }
        }
      }
    }
  }

  add() {
    var vertexShader = `
      precision mediump float;
      precision mediump int;

      attribute vec4 color;
      varying vec4 vColor;

      void main()    {

        vColor = color;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }
    `;
    var fragmentShader = `
      precision mediump float;
      precision mediump int;

      varying vec4 vColor;

      void main()    {

        vec4 color = vec4( vColor );
        gl_FragColor = color;

      }
    `;

    var geometry = new THREE.BufferGeometry();

    var colors = new Array(this.maxAge * 4).fill(1);
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 4, true)
    );

    var positions = new Float32Array(this.maxAge * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);

    var material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });

    this.streamlines = new THREE.Group();
    for (var p = 0; p < this.noParticles; p++) {
      let line = new THREE.Line(geometry.clone(), material.clone());
      line.age = 0;
      line.maxAge =
        Math.round((this.maxAge - this.fadeOut) * Math.random()) + this.fadeOut;
      this.streamlines.add(line);
    }
    this.initialPositions();
    try {
      this.scene.add(this.streamlines);
    } catch (e) {
      console.error(e);
      throw new Error("Invalid Scene object");
    }
  }

  initialPositions() {
    var pl = this.validCells.length - 1;
    for (var i = 0; i < this.streamlines.children.length; i++) {
      let line = this.streamlines.children[i];
      let pick = this.validCells[Math.round(pl * Math.random())];
      let positions = line.geometry.attributes.position.array;
      positions[0] = this.xarr
        ? this.data.x[pick[1]]
        : this.bounds.xMin +
          this.bounds.xSize * pick[1] +
          (this.bounds.xSize * Math.random() - this.bounds.xSize); // x
      positions[1] = this.zarr
        ? this.data.z[pick[2]]
        : this.bounds.zMin +
          this.bounds.zSize * pick[2] +
          (this.bounds.zSize * Math.random() - this.bounds.zSize); // z
      positions[2] = this.yarr
        ? this.data.y[pick[0]]
        : this.bounds.yMin +
          this.bounds.ySize * pick[0] +
          (this.bounds.ySize * Math.random() - this.bounds.ySize); // y

      positions[3] = positions[0];
      positions[4] = positions[1];
      positions[5] = positions[2];
      line.geometry.attributes.position.needsUpdate = true;
    }
  }

  animate() {
    var pl = this.validCells.length - 1;
    for (var i = 0; i < this.streamlines.children.length; i++) {
      let line = this.streamlines.children[i];
      let positions = line.geometry.attributes.position.array;
      let colors = line.geometry.attributes.color.array;
      if (line.age < line.maxAge - this.fadeOut) {
        // Move to next position
        line.age++;
        var nextposition = this.nextPosition(
          positions[(line.age - 1) * 3],
          positions[(line.age - 1) * 3 + 2],
          positions[(line.age - 1) * 3 + 1]
        );
        if (nextposition) {
          positions[line.age * 3] = nextposition.x;
          positions[line.age * 3 + 1] = nextposition.z;
          positions[line.age * 3 + 2] = nextposition.y;
          let v = this.colorSource
            ? nextposition.m
            : Math.sqrt(
                nextposition.u ** 2 + nextposition.v ** 2 + nextposition.w ** 2
              );
          let color =
            this.colorBar[
              Math.min(
                this.individualColors,
                Math.round(((v - this.min) / (this.max - this.min)) * 100)
              )
            ];
          colors[line.age * 4 - 4] = color[0];
          colors[line.age * 4 - 3] = color[1];
          colors[line.age * 4 - 2] = color[2];

          for (let c = 1; c < line.age; c++) {
            colors[c * 4 - 1] = Math.exp(1 - 1 / (c / line.age) ** 2);
          }
          line.geometry.attributes.color.needsUpdate = true;
          line.geometry.setDrawRange(0, line.age);
          line.geometry.attributes.position.needsUpdate = true;
        } else {
          line.age = line.maxAge - this.fadeOut;
        }
      } else if (line.age < line.maxAge) {
        // Fade out line
        line.age++;
        for (let c = 1; c < line.age; c++) {
          colors[c * 4 - 1] = Math.min(
            (1 * (line.maxAge - line.age)) / this.fadeOut,
            colors[c * 4 - 1]
          );
        }
        line.geometry.attributes.color.needsUpdate = true;
      } else {
        // Reset particle location
        line.age = 0;
        line.maxAge =
          Math.round((this.maxAge - this.fadeOut) * Math.random()) +
          this.fadeOut;
        let pick = this.validCells[Math.round(pl * Math.random())];
        positions[0] = this.xarr
          ? this.data.x[pick[1]]
          : this.bounds.xMin +
            this.bounds.xSize * pick[1] +
            (this.bounds.xSize * Math.random() - this.bounds.xSize); // x
        positions[1] = this.zarr
          ? this.data.z[pick[2]]
          : this.bounds.zMin +
            this.bounds.zSize * pick[2] +
            (this.bounds.zSize * Math.random() - this.bounds.zSize); // z
        positions[2] = this.yarr
          ? this.data.y[pick[0]]
          : this.bounds.yMin +
            this.bounds.ySize * pick[0] +
            (this.bounds.ySize * Math.random() - this.bounds.ySize); // y
        positions[3] = positions[0];
        positions[4] = positions[1];
        positions[5] = positions[2];
        for (let c = 0; c < this.maxAge * 4; c++) {
          colors[c] = 1;
        }
        line.geometry.setDrawRange(0, line.age);
        line.geometry.attributes.position.needsUpdate = true;
        line.geometry.attributes.color.needsUpdate = true;
      }
    }
  }

  nextPosition(xin, yin, zin) {
    var i = this.yarr
      ? indexOfClosest(yin, this.data.y)
      : Math.round((yin - this.bounds.yMin) / this.bounds.ySize);
    var j = this.xarr
      ? indexOfClosest(xin, this.data.x)
      : Math.round((xin - this.bounds.xMin) / this.bounds.xSize);
    var k = this.zarr
      ? indexOfClosest(zin, this.data.z)
      : Math.round((zin - this.bounds.zMin) / this.bounds.zSize);
    if (
      i > -1 &&
      i < this.bounds["yLen"] &&
      j > -1 &&
      j < this.bounds["xLen"] &&
      k > -1 &&
      k < this.bounds["zLen"] &&
      this.data.u[i][j][k] !== null
    ) {
      var u = this.data.u[i][j][k];
      var v = this.data.v[i][j][k];
      var w = this.data.w[i][j][k];
      var m = this.colorSource ? this.data.m[i][j][k] : NaN;
      var x = xin + u * this.velocityFactor;
      var y = yin + v * this.velocityFactor;
      var z = zin + w * this.velocityFactor;
      return { x, y, z, u, v, w, m };
    } else {
      return false;
    }
  }

  setColors(colors) {
    var colorBar = [];
    for (let i = 0; i < this.individualColors + 1; i++) {
      colorBar.push(getBinaryColor(i, 0, 99, colors));
    }
    this.colors = colors;
    this.colorBar = colorBar;
  }

  setVelocityFactor(velocityFactor) {
    this.velocityFactor = velocityFactor;
  }

  setMaxAge(maxAge) {
    this.maxAge = maxAge;
  }

  setNoParticles(noParticles) {
    this.scene.remove(this.streamlines);
    this.noParticles = noParticles;
    this.add();
  }

  clearStreamlines() {
    this.scene.remove(this.streamlines);
  }
}

export default StreamLines;
