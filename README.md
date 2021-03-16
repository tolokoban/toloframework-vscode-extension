# toloframework-vscode-extension

Visual Studio Code extension to help coding React/Typescript applications with ToloFrameWork (a.k.a. TFW).

## Features

### Switching files

In TFW we use to have the CSS file in the same directory
than the TS, TSX, JS or JSX file, with the same basename.  
For example the module foobar could look like this:

```bash
foobar/
├── index.ts
├── foobar.css
├── foobar.ts
└── foobar.yaml
```

This extension provide the following commands to navigate
between different files of the same module.
Sometime, they are several extensions tested.
The first existing file is opened. But if no file is found, the first
extension is used and a file is created.

* __Switch to CSS__ (`C+F12 C`): css.
* __Switch to TS/JS__ (`C+F12 J`): ts, tsx, js, jsx.
* __Switch to TEST/SPEC__ (`C+F12 T`): test.ts, spec.ts, test.tsx, spec.tsx, test.js, spec.js, test.jsx.
* __Switch to TSX__ (`C+F12 X`): tsx, jsx, ts, js.
* __Switch to YAML__ (`C+F12 Y`): yaml, yml, json, jsn.
* __Switch to JSON__ (`C+F12 N`): json, jsn, yaml, yml.
* __Switch to VERT__ (`C+F12 V`): vert.
* __Switch to FRAG__ (`C+F12 F`): frag.

### Loading font from the web

The command __[tfw] Load font locally__ will create a folder
with the CSS file needed to use a font.
All the fonts will also be loaded locally.

You can generate a font URL by using
[Google Fonts](https://fonts.google.com).

### Creating files/folders from Templates

You can define your own templates in `templates/` folder at the root of your project (where `package.json` is).
Each template must have its own subfolder and contain at least the file `@index.json5`.



## Requirements

No requirements.

## Extension Settings

No settings.

## Known Issues

No known issues.

## Release Notes

### 0.8.0

CSS switch can now go to SCSS files.
Simplified React View, more hook oriented.

### 0.7.0

`Ctrl-F12 T` switches to test/spec instead of Typescript.
You can switch to Typescript with `Ctrl-F12 J`.

### 0.4.0

Added templates.

### 0.3.0

Added a feature to create modules.

### 0.2.0

Added a feature to locally import CSS fonts.

### 0.1.0

First release.
