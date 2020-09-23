// tslint:disable: await-promise
// tslint:disable: no-implicit-dependencies
import * as X from 'vscode'
import * as FS from 'fs'
import * as Path from 'path'
import fetch from 'node-fetch'
import Util from '../util'
import Slicer from './slicer'
import { SSL_OP_MICROSOFT_SESS_ID_BUG } from 'constants'

export default {
    load
}

async function load() {
    try {
        const fontURL = await X.window.showInputBox({
            prompt: "Please enter the URL of the font CSS.\nYou will find it after the @import directive.",
            value: "https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
        })
        if (!fontURL) return
        const disposableMessage = X.window.setStatusBarMessage(`Fetching ${fontURL}`)
        const asyncContentLoading = loadContentFromURL(fontURL)

        const fontName = await X.window.showInputBox({
            prompt: "Please enter the font family name.",
            value: "noto",
            validateInput: isKebabCase
        })
        if (!fontName) return
        const cssContent = await asyncContentLoading
        disposableMessage.dispose()
        if (!cssContent) return

        const asyncLoadAll = loadAllFonts(cssContent)

        const defaultUri: X.Uri | undefined = getCurrentURI()
        const uris = await X.window.showOpenDialog({
            defaultUri,
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: "Select",
            title: "Select a folder for the font"
        })
        if (!uris) return
        const uri = uris[0]
        const path = Path.resolve(uri.path, fontName)
        if (FS.existsSync(path)) {
            X.window.showErrorMessage(
                `This directory already exists:\n${path}`,
                { modal: true }
            )
            return
        }
        await X.workspace.fs.createDirectory(X.Uri.file(path))
        const files = await asyncLoadAll
        for (const fontFile of files.fonts) {
            if (!fontFile.data) continue

            FS.writeFileSync(
                Path.resolve(path, fontFile.filename),
                new Uint8Array(fontFile.data)
            )
        }
        const cssFilename = Path.resolve(path, `${fontName}.css`)
        FS.writeFileSync(cssFilename, files.css)
        await Util.openFileInEditor(cssFilename, X.ViewColumn.Active)

        const fontClassFilename = Path.resolve(path, "..", "font.ts")
        if (FS.existsSync(fontClassFilename)) {
            FS.writeFileSync(
                Path.resolve(path, "index.ts"),
                `export { default } from '${fontName}'\n`
            )
            const modFilename = Path.resolve(path, `${fontName}.ts`)
            FS.writeFileSync(
                modFilename,
                `import FontClass from '../font'
import './${fontName}.css'

// @TODO Check the font name in the CSS file: "${fontName}.css"
export default new FontClass("${fontName}")
`
            )
            await Util.openFileInEditor(modFilename, X.ViewColumn.Beside)
        } else {
            X.window.showInformationMessage(fontClassFilename)
        }
    } catch (ex) {
        X.window.showErrorMessage(
            `${ex}`,
            { modal: true }
        )
    }
}

function getCurrentURI(): X.Uri | undefined {
    const editor = X.window.activeTextEditor
    if (editor) {
        const path: string = Path.dirname(editor.document.fileName)
        return X.Uri.file(path)
    }

    const folders = X.workspace.workspaceFolders
    if (!folders) return undefined
    return folders[0].uri
}

const RX_KEBAB_CASE = /^[a-z][a-z0-9]+(-[a-z0-9]+)*$/g

function isKebabCase(input: string): string {
    return RX_KEBAB_CASE.test(input) ? "" : "Kebab case name expected! Minimum length is 2. Example: \"my-font\""
}

async function loadContentFromURL(url: string): Promise<string> {
    try {
        const styleResponse = await fetch(url)
        const styleContent = await styleResponse.text()
        console.log("styleContent", styleContent) // @TODO Remove this line written on 2020-09-23 at 12:04
        return styleContent
    } catch (ex) {
        throw `Unable to load from URL \"${url}\"!\n\n${ex}`
    }
}

interface IFont {
    data: ArrayBuffer | null
    filename: string
}

interface IAllFonts {
    css: string,
    fonts: IFont[]
}

async function loadAllFonts(cssContent: string): Promise<IAllFonts> {
    const slices = Slicer.slice(cssContent)

    let disposableMessage = X.window.setStatusBarMessage(`Loading font files...`)
    for (let i = 0; i < slices.urls.length; i++) {
        const url = slices.urls[i]
        try {
            disposableMessage.dispose()
            disposableMessage = X.window.setStatusBarMessage(`Loading font ${i + 1} / ${slices.urls.length}`)
            const response = await fetch(url)
            if (!response.ok) {
                throw `Error ${response.status}: ${response.statusText}`
            }
            const arrayBuffer = await response.arrayBuffer()
            slices.data.push(arrayBuffer)
        } catch (ex) {
            slices.data.push(null)
            X.window.showErrorMessage(
                `Unable to load font ${i + 1} / ${slices.urls.length}:\n${url}\n\n${ex}`
            )
        }
    }
    disposableMessage.dispose()

    return {
        css: slices.pieces.map((piece, index) => {
            if (typeof piece === 'number') {
                return `./${piece}.${getExtension(slices.urls[piece])}`
            }
            return piece
        }).join(""),
        fonts: slices.data.map((data, index) => ({
            data,
            filename: `${index}.${getExtension(slices.urls[index])}`
        }))
    }
}

function getExtension(filename: string): string {
    const NOT_FOUND = -1
    const dotIndex = filename.lastIndexOf(".")
    if (dotIndex === NOT_FOUND) return ""
    return filename.substr(dotIndex + 1)
}