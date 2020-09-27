// tslint:disable-next-line: no-implicit-dependencies
import * as X from 'vscode'
import FS = require("fs")
import Path = require("path")

export default {
    changeExtension,
    exists,
    findFilenameInAncestors,
    getBasename,
    getDirectory,
    getSourceFolder,
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
    Promise<X.TextDocument | null> {
    return new Promise((resolve, reject) => {
        if (!exists(filename)) {
            resolve(null)
            return
        }
        X.workspace.openTextDocument(filename).then(
            resolve,
            reject
        )
    })
}

async function openFileInEditor(
    filename: string,
    viewColumn: X.ViewColumn = X.ViewColumn.Active
): Promise<boolean> {
    const doc = await openTextDocument(filename)
    if (!doc) return false
    X.window.showTextDocument(
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

/**
 * Find a `filename` in the `startingPath`.
 * If not found, try in the parent directory.
 * When found, return its path.
 * If not found, return `null`.
 *
 * @param filename - Name of the file to search without any path.
 * @param startingPath - Path from where to start the search.
 */
function findFilenameInAncestors(
    filename: string,
    startingPath: string
): string | null {
    let path = startingPath
    let oldPath = ""

    while (oldPath !== path) {
        oldPath = path
        const currentFilename = Path.resolve(path, filename)
        if (FS.existsSync(currentFilename)) return currentFilename
        // Go to parent.
        path = Path.resolve(path, "..")
    }

    return null
}

/**
 * Look for the nearest "package.json" file in the parents
 * of the current opened file, on in the children of the current
 * workspace.
 * Then, return the "src" folder that lies in the same directory
 * tham "package.json".
 */
function getSourceFolder(): string | null {
    const editor = X.window.activeTextEditor
    if (editor) return getSourceFolderFromActiveTextEditor(editor)
    return null
}

function getSourceFolderFromActiveTextEditor(editor: X.TextEditor): string | null {
    const path = editor.document.fileName
    const filename = "package.json"
    const startingPath = Path.dirname(path)
    const packagePath = findFilenameInAncestors(filename, startingPath)
    if (!packagePath) return null

    const sourcePath = Path.resolve(
        Path.dirname(packagePath),
        "src"
    )
    if (exists(sourcePath)) return sourcePath
    return Path.dirname(packagePath)
}

