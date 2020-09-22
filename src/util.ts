// tslint:disable-next-line: no-implicit-dependencies
import * as VSC from 'vscode'

import FS = require("fs")

export default {
    changeExtension,
    exists,
    getBasename,
    getDirectory,
    openFileInEditor,
    openTextDocument,
    removeExtension,
    writeTextFile
}

enum IViewColumn {
    ACTIVE = -1,
    BESIDE = -2,
    ONE = 1,
    TWO = 2
}

function changeExtension(filename: string, newExtension: string): string {
    return `${removeExtension(filename)}.${newExtension}`
}

function exists(path: string): boolean {
    return FS.existsSync(path)
}

async function openTextDocument(filename: string):
    Promise<VSC.TextDocument | null> {
    return new Promise((resolve, reject) => {
        if (!exists(filename)) {
            resolve(null)
            return
        }
        VSC.workspace.openTextDocument(filename).then(
            resolve,
            reject
        )
    })
}

async function openFileInEditor(
    filename: string,
    viewColumn: IViewColumn = IViewColumn.ACTIVE
): Promise<boolean> {
    const doc = await openTextDocument(filename)
    if (!doc) return false
    VSC.window.showTextDocument(
        doc,
        viewColumn.valueOf()
    )
    return true
}

function removeExtension(filename: string): string {
    const idxDot = filename.lastIndexOf(".")
    return filename.substr(0, idxDot)
}

function getBasename(filename: string): string {
    const idxSlash = filename.lastIndexOf("/")
    return filename.substring(idxSlash)
}

function getDirectory(filename: string): string {
    const idxSlash = filename.lastIndexOf("/")
    return filename.substr(0, idxSlash)
}

function writeTextFile(filename: string, content: string) {
    FS.writeFileSync(filename, content)
}
