// The module 'vscode' contains the VS Code extensibility API
// tslint:disable-next-line: no-implicit-dependencies
import * as VSC from 'vscode'
import Util from './util'
import View from './view'
import Fonts from './fonts'
import Module from './module'
import Template from './template'
import Translation from './translation'

// this method is called when your extension is activated
export function activate(context: VSC.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const LEFT = 1
    const RIGHT = 2
    // Define where to open a window when switching.
    const actions: Array<[string, number]> = [
        ["css", RIGHT],
        ["js", LEFT],
        ["test", RIGHT],
        ["json", RIGHT],
        ["yaml", RIGHT],
        ["frag", LEFT],
        ["vert", LEFT]
    ]
    for (const action of actions) {
        const [extension, viewColumn] = action
        const id = `toloframework-vscode-extension.switchTo${extension.toUpperCase()}`
        const disposable = VSC.commands.registerCommand(
            id,
            () => switchTo(extension, viewColumn)
        )
        context.subscriptions.push(disposable)
    }

    context.subscriptions.push(
        VSC.commands.registerCommand(
            "toloframework-vscode-extension.compileTranslationYAML",
            Translation.compileYAML
        )
    )

    context.subscriptions.push(
        VSC.commands.registerCommand(
            "toloframework-vscode-extension.importFont",
            Fonts.load
        )
    )

    context.subscriptions.push(
        VSC.commands.registerCommand(
            "toloframework-vscode-extension.createModule",
            Module.exec
        )
    )

    context.subscriptions.push(
        VSC.commands.registerCommand(
            "toloframework-vscode-extension.createFromTemplate",
            Template.exec
        )
    )

    context.subscriptions.push(
        VSC.commands.registerCommand(
            "toloframework-vscode-extension.createView",
            View.exec
        )
    )

    context.subscriptions.push(
        VSC.commands.registerCommand(
            'toloframework-vscode-extension.help',
            () => {
                const panel = VSC.window.createWebviewPanel(
                    'help',
                    'TFW Documentation',
                    VSC.ViewColumn.Beside,
                    {
                        enableScripts: true,
                        enableCommandUris: true
                    }
                )
                panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        html, body, iframe {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            right: 0;
            border: none;
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
    <iframe src="https://tolokoban.github.io/tfw"></iframe>
</body>
</html>`
            }
        )
    )
}

// this method is called when your extension is deactivated
// tslint:disable-next-line: no-empty
export function deactivate() { }


const EXTENSION_FALLBACKS: { [key: string]: string[] } = {
    js: ["ts", "tsx", "js", "jsx"],
    json: ["json", "jsn", "yaml", "yml"],
    yaml: ["yaml", "yml", "json", "jsn"],
    css: ['css', 'scss']
}
async function switchTo(extension: string, viewColumn: number) {
    const activeEditor = VSC.window.activeTextEditor
    if (!activeEditor) {
        VSC.window.showErrorMessage("No active text editor!")
        return
    }

    const extensions: string[] = getExtensionsToCheck(extension, activeEditor)
    if (await openFileIfExists(extensions, viewColumn, activeEditor)) return

    // File does not exist.
    // We need to create it.
    const [preferedExtension] = extensions
    const filename: string = Util.changeExtension(
        activeEditor.document.fileName,
        preferedExtension
    )
    Util.writeTextFile(
        filename,
        getInitialContent(preferedExtension, activeEditor.document.fileName)
    )
    const doc = await Util.openTextDocument(filename)
    if (doc !== null) {
        VSC.window.showTextDocument(doc, { viewColumn })
    } else {
        VSC.window.showErrorMessage(
            `File not found:  \n\`${filename}\``
        )
    }
}

async function openFileIfExists(
    extensions: string[],
    viewColumn: number,
    activeEditor: VSC.TextEditor
) {
    for (const ext of extensions) {
        const filename: string = Util.changeExtension(
            activeEditor.document.fileName,
            ext
        )
        if (!Util.exists(filename)) continue

        const doc = await Util.openTextDocument(filename)
        if (doc === null) return false
        VSC.window.showTextDocument(doc, { viewColumn })
        return true
    }

    return false
}

function getExtensionsToCheck(extension: string, activeEditor: VSC.TextEditor): string[] {
    if (extension !== 'test') {
        return EXTENSION_FALLBACKS[extension] ?? [extension]
    }

    const moduleExtensions = EXTENSION_FALLBACKS["js"]
    for (const modExt of moduleExtensions) {
        const filename: string = Util.changeExtension(
            activeEditor.document.fileName,
            modExt
        )
        if (Util.exists(filename)) {
            return [`test.${modExt}`, `spec.${modExt}`]
        }
    }

    const fallbacks: string[] = []
    for (const modExt of moduleExtensions) {
        fallbacks.push(`test.${modExt}`, `spec.${modExt}`)
    }

    return fallbacks
}

function getInitialContent(extension: string, originFileName: string) {
    if (extension.startsWith("test.") || extension.startsWith("spec.")) {
        return getInitialContentTest(originFileName)
    }
    switch (extension) {
        case "yaml": return getInitialContentYAML(originFileName)
        case "frag": return getInitialContentFRAG(originFileName)
        case "vert": return getInitialContentVERT(originFileName)
    }
    return ""
}

function getInitialContentVERT(path: string) {
    const filename = Util.removeExtension(Util.makeRelativeToSource(path))

    return `// ${filename}.vert
attribute vec4 attPoint;

void main() {
    gl_Position = attPoint;
}`
}

function getInitialContentFRAG(path: string) {
    const filename = Util.removeExtension(Util.makeRelativeToSource(path))

    return `// ${filename}.frag
precision mediump float;

void main() {
    gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);
}`
}

function getInitialContentYAML(originFileName: string) {
    return "en:\n    cancel: Cancel\n    ok: Ok\nfr:\n    cancel: Annuler\n    ok: Valider\n"
}

function getInitialContentTest(originFileName: string) {
    if (originFileName.endsWith("x")) return getInitialContentTestView(originFileName)

    const modName = Util.fileNameToModuleName(originFileName)
    const filename = Util.removeExtension(Util.getBasename(originFileName))
    return `import ${modName} from './${filename}'

describe('${Util.makeRelativeToSource(originFileName)}', () => {
    // @TODO: Implement tests.
    describe('${modName}.foo()', () => {
        it('should ...', () => {
            const got = ${modName}.foo()
            const exp = null
            expect(got).toEqual(exp)
        })
    })
})
`
}

function getInitialContentTestView(originFileName: string) {
    const viewname = Util.fileNameToModuleName(originFileName)
    const filename = Util.removeExtension(Util.getBasename(originFileName))
    const folder = Util.getDirectory(Util.makeRelativeToSource(originFileName))

    return `// To test a React component, you need to install these modules:
// yarn add --dev react-test-renderer @types/react-test-renderer
// @see https://jestjs.io/docs/en/snapshot-testing
//
// If a test failed because you intended to improve the component, just call
// jest --updateSnapshot testNamePattern "${Util.makeRelativeToSource(originFileName)}"

import React from 'react'
import Renderer from 'react-test-renderer'
import ${viewname}, { I${viewname}Props } from './${filename}'

function view(partialProps: Partial<I${viewname}Props>) {
    const props: I${viewname}Props = {
        // @TODO Set default props.
        ...partialProps
    }
    return Renderer.create(<${viewname} {...props} />).toJSON()
}

describe('<${viewname}/> in ${folder}', () => {
    it('should be consistent with previous snapshot', () => {
        expect(view({})).toMatchSnapshot()
    })
})
`
}
