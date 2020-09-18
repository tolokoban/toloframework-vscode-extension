// The module 'vscode' contains the VS Code extensibility API
import * as VSC from 'vscode';
import Util from './util'

// this method is called when your extension is activated
export function activate(context: VSC.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const actions: Array<[string, number]> = [
		["css", 2],
		["js", 1],
		["ts", 1],
		["tsx", 1],
		["json", 2],
		["yaml", 2],
		["frag", 1],
		["vert", 1]
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

	console.log("compileYAML", compileYAML) // @TODO Remove this line written on 2020-09-18 at 12:20
	context.subscriptions.push(
		VSC.commands.registerCommand(
			"compileTransYAML",
			compileYAML
		)
	)
}

// this method is called when your extension is deactivated
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

		const doc = await VSC.workspace.openTextDocument(filename)
		VSC.window.showTextDocument(doc, { viewColumn })
		return
	}

	// File does not exist.
	// We need to create it.
	const filename: string = Util.changeExtension(
		activeEditor.document.fileName,
		extension
	)
	Util.writeTextFile(filename, getInitialContent(extension, activeEditor.document.fileName))
	const doc = await VSC.workspace.openTextDocument(filename)
	VSC.window.showTextDocument(doc, { viewColumn })
}

function getInitialContent(extension: string, originFileName: string) {
	switch (extension) {
		case "yaml": return getInitialContentYAML(originFileName)
	}
	return ""
}

function getInitialContentYAML(originFileName: string) {
	return `en:
	cancel: Cancel
	ok: Ok
fr:
	cancel: Annuler
	ok: Valider`
}


function compileYAML() {
    const activeEditor = VSC.window.activeTextEditor
    if (!activeEditor) {
        VSC.window.showErrorMessage("No active text editor!")
        return
    }
    const filename = activeEditor.document.fileName
    if (!filename.endsWith(".yaml") && !filename.endsWith(".yml")) {
        VSC.window.showErrorMessage("This is not a YAML file!")
        return
    }

    const content = activeEditor.document.getText()
    let value: any = null
    try {
        value = { en: { ok: "Ok" }, fr: { ok: "Valider" } } // YAML.parse(content)
    }
    catch (ex) {
        console.error("ex", ex) // @TODO Remove this line written on 2020-09-18 at 12:05
        VSC.window.showErrorMessage("This YAML file is invalid!")
        return
    }
    const destination = Util.changeExtension(filename, "json")
    Util.writeTextFile(
        destination,
        JSON.stringify(value, null, "  ")
    )
    VSC.window.showInformationMessage(
        "JSON file has been created/updated."
    )
}