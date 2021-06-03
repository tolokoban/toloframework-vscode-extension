// tslint:disable-next-line: no-implicit-dependencies
import * as VSC from "vscode"
import * as YAML from "yaml"
import * as Path from "path"
import { YAMLError, YAMLSemanticError } from "yaml/util"
import Util from "../util"
import Inputs from "../inputs"
import PreProcessor from "./preprocessor"
import preprocessor from "./preprocessor"

export default { compileYAML, translateSelection }

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
    if (typeof ex !== "object") return false
    if (typeof (ex as { [key: string]: any }).makePretty !== "function")
        return false
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
        value = YAML.parse(content, {
            indent: 4,
            prettyErrors: true
        })
    } catch (ex) {
        console.error(
            "================================================================================"
        )
        console.error(ex) // @TODO Remove this line written on 2020-09-18 at 12:05
        let errorMessage = `Invalid YAML file!\n${ex}`
        if (ex instanceof YAMLSemanticError) {
            errorMessage = `YAML Semantic Error at line ${ex.linePos?.start.line}!\n${ex.message}\n`
        } else if (ex instanceof YAMLError) {
            errorMessage = `YAML Error!\n${ex.message}\n`
        }
        if (
            errorMessage.indexOf("cannot start with a tab character") !==
            NOT_FOUND
        ) {
            errorMessage +=
                "\nTry to execute the following command from the palette:\n"
            errorMessage += '"Convert indentation to spaces"'
        }
        VSC.window.showErrorMessage(errorMessage, { modal: true })
        return
    }
    const destination = Util.changeExtension(filename, "json")
    Util.writeTextFile(
        destination,
        JSON.stringify(value, null, DEFAULT_INDENTATION)
    )
    await Util.openFileInEditor(destination)
}

async function translateSelection() {
    const activeEditor = VSC.window.activeTextEditor
    if (!activeEditor) {
        VSC.window.showErrorMessage("No active text editor!")
        return
    }

    const { selection } = activeEditor
    const text = expandString(activeEditor.document.getText(selection).trim())
    const id = await Inputs.promptForName("Enter a translation ID")
    if (!id) return

    const languages = PreProcessor.getAvailableLanguages()
    for (const lang of languages) {
        await askForTranslation(id, lang, text)
    }
    const name = Util.kebabCaseToLowerPascalCase(id)
    const moduleRelPath = Util.getRelativeImportPath("translate")
    const isEditable = await activeEditor.edit(edit => {
        edit.replace(selection, `Translate.${name}`)
        if (!hasTranslateImport(activeEditor.document.getText())) {
            edit.replace(
                new VSC.Range(new VSC.Position(0, 0), new VSC.Position(0, 0)),
                `import Translate from '${moduleRelPath}'\n`
            )
        }
    })
    if (!isEditable) {
        VSC.window.showErrorMessage("Unable to edit this file!", {
            modal: true
        })
    }
    PreProcessor.processTranslations()
}

function expandString(text: string) {
    try {
        if (text.startsWith('"') || text.startsWith("'"))
            return JSON.parse(text)
        return text
    } catch (ex) {
        console.error(ex)
        return text
    }
}

function hasTranslateImport(content: string): boolean {
    const lines = content.split("\n")
    for (const line of lines) {
        if (line.trim().startsWith("import Translate from ")) return true
    }
    return false
}

async function askForTranslation(
    id: string,
    lang: string,
    defaultText: string
): Promise<boolean> {
    try {
        const filename = PreProcessor.abs(
            "translate",
            "translations",
            `${lang}.yaml`
        )
        const data = preprocessor.loadYaml(filename)
        const value = data[id] ?? defaultText
        const result = await VSC.window.showInputBox({
            value,
            prompt: `Translation for ${lang.toUpperCase()}`
        })
        if (!result) return false

        data[id] = result
        Util.writeTextFile(
            filename,
            YAML.stringify(data, { indent: 4, sortMapEntries: true })
        )
        return true
    } catch (ex) {
        return false
    }
}
