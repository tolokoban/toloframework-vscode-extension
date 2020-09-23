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
* __Switch to JS__ (`C+F12 J`): js, jsx, ts, tsx.
* __Switch to TS__ (`C+F12 T`): ts, tsx, js, jsx.
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

## Requirements

No requirements.

## Extension Settings

No settings.

## Known Issues

No known issues.

## Release Notes

### 0.1.0

First release.
