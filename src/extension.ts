// The module 'vscode' contains the VS Code extensibility API
// tslint:disable-next-line: no-implicit-dependencies
import * as VSC from 'vscode'
import Util from './util'
import Translation from './translation'

// this method is called when your extension is activated
export function activate(context: VSC.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const LEFT = 1
    const RIGHT = 2
    const actions: Array<[string, number]> = [
        ["css", RIGHT],
        ["js", LEFT],
        ["ts", LEFT],
        ["tsx", LEFT],
        ["json", RIGHT],
        ["yaml", RIGHT],
        ["frag", LEFT],
        ["vert", LEFT]
    ]
    for (const action of actions) {
        const [extension, viewColumn] = action
        const id = `tolokoban-vscode-extension.switchTo${extension.toUpperCase()}`
        const disposable = VSC.commands.registerCommand(
            id,
            () => switchTo(extension, viewColumn)
        )
        context.subscriptions.push(disposable)
    }

    context.subscriptions.push(
        VSC.commands.registerCommand(
            "tolokoban-vscode-extension.compileTranslationYAML",
            Translation.compileYAML
        )
    )
}

// this method is called when your extension is deactivated
// tslint:disable-next-line: no-empty
export function deactivate() { }


const EXTENSION_FALLBACKS: { [key: string]: string[] } = {
    tsx: ["ts", "js"],
    ts: ["tsx", "js"],
    js: ["ts", "tsx"],
    json: ["jsn", "yaml", "yml"],
    yaml: ["yml", "json", "jsn"]
}
async function switchTo(extension: string, viewColumn: number) {
    const activeEditor = VSC.window.activeTextEditor
    if (!activeEditor) {
        VSC.window.showErrorMessage("No active text editor!")
        return
    }

    if (await openFileIfExists(extension, viewColumn, activeEditor)) return

    // File does not exist.
    // We need to create it.
    const filename: string = Util.changeExtension(
        activeEditor.document.fileName,
        extension
    )
    Util.writeTextFile(filename, getInitialContent(extension, activeEditor.document.fileName))
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
    extension: string,
    viewColumn: number,
    activeEditor: VSC.TextEditor
) {
    const extensions: string[] = [extension]
    const fallbacks = EXTENSION_FALLBACKS[extension]
    if (Array.isArray(fallbacks)) {
        extensions.push(...fallbacks)
    }

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

function getInitialContent(extension: string, originFileName: string) {
    switch (extension) {
        case "yaml": return getInitialContentYAML(originFileName)
    }
    return ""
}

function getInitialContentYAML(originFileName: string) {
    return "en:\n    cancel: Cancel\n    ok: Ok\nfr:\n    cancel: Annuler\n    ok: Valider\n"
}
