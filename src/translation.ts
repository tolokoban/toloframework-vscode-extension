// tslint:disable-next-line: no-implicit-dependencies
import * as VSC from 'vscode'
import * as YAML from 'yaml'
import Util from './util'

export default { compileYAML }

interface IYamlException {
    name: string
    source: string
    message: string
    makePretty(): string
}

function isYamlException(ex: any): ex is IYamlException {
    if (!ex) return false
    if (typeof ex !== 'object') return false
    if (typeof (ex as { [key: string]: any }).makePretty !== 'function') return false
    return true
}

async function compileYAML() {
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

    const content = activeEditor.document.getText().replace("\t", "    ")
    let value: any = null
    try {
        console.info(content)
        value = YAML.parse(content)
    }
    catch (ex) {
        console.error("ex", ex) // @TODO Remove this line written on 2020-09-18 at 12:05
        VSC.window.showErrorMessage("This YAML file is invalid!")
        if (isYamlException(ex)) {
            VSC.window.showErrorMessage(ex.makePretty(), { modal: true })
        }
        return
    }
    const destination = Util.changeExtension(filename, "json")
    Util.writeTextFile(
        destination,
        JSON.stringify(value, null, "  ")
    )
    await Util.openFileInEditor(destination)
}
