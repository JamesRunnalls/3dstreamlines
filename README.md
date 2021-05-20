# 3D Streamlines

[![NPM package][npm-img]][npm-url]
[![Build Size][build-size-img]][build-size-url]
[![Dependencies][dependencies-img]][dependencies-url]

<p align="center">
     <a href=""><img width="80%" src="https://en.wikipedia.org/wiki/Lake_Geneva#/media/File:Lake_Geneva_by_Sentinel-2.jpg"></a>
</p>

Visualise three dimensional vector fields in browser using stream lines.

Uses [ThreeJS](https://github.com/mrdoob/three.js/)/WebGL for 3D rendering.

Check out the examples:

- [Tornado](https://jamesrunnalls.github.io/3dstreamlines/example/tornado/) ([source](https://github.com/jamesrunnalls/3dstreamlines/blob/master/example/tornado/index.html))

## Quick start

```
import 3dstreamlines from '3dstreamlines';
```

or

```
var 3dstreamlines = require('3dstreamlines');
```

or even

```
<script src="//unpkg.com/3dstreamlines"></script>
```

then

```
const streamlines = new 3dstreamlines(data, bounds, scene, options);
```

## API reference

### Initialisation

```
3dstreamlines(data, bounds, scene, options)
```

### data

| Parameter    | Description                                                       |
| ------------ | ----------------------------------------------------------------- |
| u            | 3D array of x component of velocity, dims (y,x,z)                 |
| v            | 3D array of y component of velocity, dims (y,x,z)                 |
| w            | 3D array of z component of velocity, dims (y,x,z)                 |
| x (optional) | 1D array of x coordinates (not required if spacing in grid fixed) |
| y (optional) | 1D array of y coordinates (not required if spacing in grid fixed) |
| z (optional) | 1D array of z coordinates (not required if spacing in grid fixed) |

```
{
    "u": [
            [
                [...],
                ...,
                [...]
            ]
            ,...,
            [
                [...],
                ...,
                [...]
            ]
        ],
    "v": [
            [
                [...],
                ...,
                [...]
            ]
            ,...,
            [
                [...],
                ...,
                [...]
            ]
        ],
    "w": [
            [
                [...],
                ...,
                [...]
            ]
            ,...,
            [
                [...],
                ...,
                [...]
            ]
        ],
    "x": [...],
    "y": [...],
    "z": [...],
}
```

### bounds

| Parameter | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| xMin      | Min x coordinate (required if array of x coordinates not included) |
| xMax      | Max x coordinate (required if array of x coordinates not included) |
| yMin      | Min y coordinate (required if array of y coordinates not included) |
| yMax      | Max y coordinate (required if array of y coordinates not included) |
| zMin      | Min z coordinate (required if array of z coordinates not included) |
| zMax      | Max z coordinate (required if array of z coordinates not included) |

```
{
    "xMin": 0,
    "xMax": 1,
    "yMin": 0,
    "yMax": 1,
    "zMin": 0,
    "zMax": 1,
}
```

### scene

This is a ThreeJS scene object created as follows:

```
const scene = new THREE.Scene();
```

### options

| Option            | Description                                               | Default |
| ----------------- | --------------------------------------------------------- | ------- |
| noParticles       | Number of streams to be plotted                           | 10000   |
| maxAge            | Maximum age (number of animation timesteps) of any stream | 200     |
| fadeOutPercentage | Percentage of stream to fade out                          | 0.1     |
| individualColors  | Number of individual colors in color ramp                 | 100     |
| velocityFactor    | Unitless velocity factor to speed up/ slow down streams   | 0.1     |
| min               | Minimum value for color range                             | 0       |
| max               | Maximum value for color range                             | 1       |
| nodata            | Custom no data value                                      | null    |
| colorSource       | Use velocity magnitude or use data.m as color             | false   |
| colors            | Color range                                               | {}      |

```
{
    "noParticles": 10000,
    "maxAge": 200,
    "fadeOutPercentage": 0.1,
    "individualColors": 100,
    "velocityFactor": 0.1,
    "min": 0,
    "max": 0.1,
    "nodata": null,
    "colorSource": false,
    "colors": [
      { color: "#000000", point: 0.0 },
      { color: "#550088", point: 0.14285714285714285 },
      { color: "#0000ff", point: 0.2857142857142857 },
      { color: "#00ffff", point: 0.42857142857142855 },
      { color: "#00ff00", point: 0.5714285714285714 },
      { color: "#ffff00", point: 0.7142857142857143 },
      { color: "#ff8c00", point: 0.8571428571428571 },
      { color: "#ff0000", point: 1.0 },
    ];
}
```
