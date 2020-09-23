// tslint:disable-next-line: no-implicit-dependencies
import * as VSC from 'vscode'
import * as YAML from 'yaml'
import { YAMLError, YAMLSemanticError } from 'yaml/util'
import Util from './util'

export default { compileYAML }

const DEFAULT_INDENTATION = "    "
const NOT_FOUND = -1

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
        value = YAML.parse(
            content, {
            indent: 4,
            prettyErrors: true
        }
        )
    }
    catch (ex) {
        console.error("================================================================================")
        console.error(ex) // @TODO Remove this line written on 2020-09-18 at 12:05
        let errorMessage = `Invalid YAML file!\n${ex}`
        if (ex instanceof YAMLSemanticError) {
            errorMessage = `YAML Semantic Error at line ${ex.linePos?.start.line
                }!\n${ex.message
                }\n`
        }
        else if (ex instanceof YAMLError) {
            errorMessage = `YAML Error!\n${ex.message}\n`
        }
        if (errorMessage.indexOf("cannot start with a tab character") !== NOT_FOUND) {
            errorMessage += "\nTry to execute the following command from the palette:\n"
            errorMessage += '"Convert indentation to spaces"'
        }
        VSC.window.showErrorMessage(
            errorMessage,
            { modal: true }
        )
        return
    }
    const destination = Util.changeExtension(filename, "json")
    Util.writeTextFile(
        destination,
        JSON.stringify(value, null, DEFAULT_INDENTATION)
    )
    await Util.openFileInEditor(destination)
}
