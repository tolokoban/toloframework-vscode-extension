import * as VSC from "vscode"
import * as Path from "path"
import * as YAML from "yaml"
import * as FS from "fs"
import Util from "../util"

export default {
    abs,
    getAvailableLanguages,
    loadYaml,
    processTranslations
}

function abs(...parts: string[]): string {
    return Path.resolve(Util.getSourceFolder() ?? ".", ...parts)
}

function loadYaml(path: string) {
    const content = FS.readFileSync(path).toString()
    const data = YAML.parse(content)

    return data
}

function getAvailableLanguages(): string[] {
    const translatePath = abs("translate")
    if (!FS.existsSync(translatePath)) {
        VSC.window.showInformationMessage(
            `Create new folder: \n${translatePath}`
        )
        FS.mkdirSync(translatePath)
    }
    const translationPath = abs("translate", "translations")
    if (!FS.existsSync(translationPath)) {
        VSC.window.showInformationMessage(
            `Create new folder: \n${translationPath}`
        )
        FS.mkdirSync(translationPath)
    }
    const files = FS.readdirSync(translationPath).filter(f =>
        f.endsWith(".yaml")
    )
    if (files.length === 0) {
        const filename = Path.resolve(translationPath, "en.yaml")
        VSC.window.showInformationMessage(`Create new file: \n${filename}`)
        Util.writeTextFile(filename, "cancel: Cancel\nok: OK\n")
        return ["en"]
    }
    return files.map(f => f.substr(0, f.length - 5)).sort()
}

function processTranslations() {
    const translationPath = abs("translate", "translations")
    const files = FS.readdirSync(translationPath).filter(f =>
        f.endsWith(".yaml")
    )
    const keys: string[] = []
    for (const file of files) {
        const data = loadYaml(abs(translationPath, file))
        for (const key of Object.keys(data)) {
            if (!keys.includes(key)) keys.push(key)
        }
    }
    keys.sort()

    for (const file of files) {
        const [lang] = file.split(".")
        const input = loadYaml(abs(translationPath, file))
        const output: { [key: string]: string | null } = {}
        for (const key of keys) {
            const value = input[key]
            if (typeof value === "undefined" || value === null) {
                console.error(
                    `Missing translation for <${key}> in "translate/translations/${file}"!`
                )
                output[key] = null
            } else {
                output[key] = value
            }
        }
        FS.writeFileSync(abs(translationPath, file), YAML.stringify(output))
        FS.writeFileSync(
            abs("translate", "translations", `lang-${lang}.ts`),
            `const T = require('./${lang}.yaml')\nexport default T`
        )
    }

    FS.writeFileSync(
        abs("translate", "translate.ts"),
        `// This file has been generated automatically.
import TranslateBase from './translate-base'


class AppTranslations extends TranslateBase {
    constructor() {
        super()
        this._registerTranslationsLoader(async lang => {
            switch (lang) {
${files
    .map(file => {
        const [lang] = file.split(".")
        const indent = "                "
        return `${indent}case '${lang}':
${indent}    const ${lang}Mod = await import('./translations/lang-${lang}')
${indent}    return ${lang}Mod.default`
    })
    .join("\n")}                        
                default:
                    return {}
            }
        })
    }
        
${keys
    .map(key => `    get ${Util.kebabCaseToLowerPascalCase(key)}() { return this._("${key}") }`)
    .join("\n")}
}

export default new AppTranslations()
`
    )
}

processTranslations()
