// tslint:disable-next-line: no-implicit-dependencies
import * as X from 'vscode'
import FS = require("fs")
import Path = require("path")
import ChildProcess = require("child_process")

export default {
    changeExtension,
    execCommandAsync,
    exists,
    fileNameToModuleName,
    findFilenameInAncestors,
    getBasename,
    getDirectory,
    getSourceFolder,
    hasExtension,
    isDir,
    isKebabCase,
    kebabCaseToLowerPascalCase,
    kebabCaseToPascalCase,
    listFilesAndSubFolders,
    makeRelativeToSource,
    openFileInEditor,
    openTextDocument,
    readTextFile,
    removeExtension,
    stripComments,
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

function fileNameToModuleName(filename: string): string {
    return kebabCaseToPascalCase(removeExtension(getBasename(filename)))
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
    return filename.substring(idxSlash + 1)
}

function getDirectory(filename: string): string {
    const idxSlash = filename.lastIndexOf("/")
    return filename.substr(0, idxSlash)
}

function writeTextFile(filename: string, content: string) {
    FS.writeFileSync(filename, content)
}

function readTextFile(filename: string): string {
    if (!FS.existsSync(filename)) return ""

    const content = FS.readFileSync(filename)
    return content ? content.toString() : ''
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
 * of the current open file, or in the children of the current
 * workspace.
 * If `path` is defined, start looking from this path.
 * 
 * Then, return the "src" folder that lies in the same directory
 * tham "package.json".
 */
function getSourceFolder(path?: string): string | null {
    if (path) return getSourceFolderFromPath(path)

    const editor = X.window.activeTextEditor
    if (editor) return getSourceFolderFromActiveTextEditor(editor)
    return null
}

function getSourceFolderFromActiveTextEditor(editor: X.TextEditor): string | null {
    const path = editor.document.fileName
    return getSourceFolderFromPath(path)
}

function getSourceFolderFromPath(path: string): string | null {
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

/**
 * Return a path relative to "src/".
 * @param path Absolute path
 */
function makeRelativeToSource(path: string): string {
    return Path.relative(getSourceFolder() ?? '/', path)
}

const RX_KEBAB_CASE = /^[a-z][a-z0-9]+(-[a-z0-9]+)*$/g

function isKebabCase(input: string): string {
    RX_KEBAB_CASE.lastIndex = -1
    return RX_KEBAB_CASE.test(input) ? "" : "Kebab case name expected (ex.: \"wonder-woman\")! Minimum length is 2."
}

function kebabCaseToPascalCase(name: string): string {
    return name.split("-")
        .map(x => `${x.charAt(0).toUpperCase()}${x.substr(1).toLowerCase()}`)
        .join("")
}

function kebabCaseToLowerPascalCase(name: string): string {
    const pascal = kebabCaseToPascalCase(name)
    return pascal.charAt(0).toLowerCase() + pascal.substr(1)
}


function isDir(path: string): boolean {
    if (!FS.existsSync(path)) return false

    const stat = FS.statSync(path)
    return stat.isDirectory()
}

export interface FilesAndFolders {
    files: string[]
    folders: string[]
}

function listFilesAndSubFolders(sourceFolder: string): FilesAndFolders {
    const result: FilesAndFolders = {
        files: [], folders: []
    }
    if (!isDir(sourceFolder)) return result

    const dir = FS.readdirSync(sourceFolder)
    for (const name of dir) {
        if (name === '.' || name === '..') continue

        const path = Path.resolve(sourceFolder, name)
        if (isDir(path)) result.folders.push(path)
        else result.files.push(path)
    }

    return result
}

function hasExtension(filename: string, ...extensions: string[]): boolean {
    for (const ext of extensions) {
        if (filename.endsWith(`.${ext}`)) return true

    }
    return false
}

/**
 * Execute a command and throw an exception in case of failure.
 * 
 * @param command Shell command to execute
 * @returns stdout of this command (if success).
 */
async function execCommandAsync(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        ChildProcess.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`${error}\n\n${stdout}`.trim())
                return

            }
            resolve(stdout)
        })
    })
}


function stripComments(content: string) {
    let output = ''
    let mode = ''
    let start = 0
    for (let i = 0; i < content.length; i++) {
        const c = content.charAt(i)
        switch (mode) {
            case '':
                if ("\"'`\\".includes(c)) {
                    mode = c
                }
                else if (c === '/') {
                    mode = '/'
                    output = output + content.substring(start, i)
                    start = i
                }
                break
            case '/':
                if (c === '/') {
                    mode = '//'
                }
                else if (c === '*') {
                    mode = '/*'
                }
                else {
                    i = i - 1
                    mode = ''
                }
                break
            case '//':
                if (c === '\n') {
                    start = i
                    mode = ''
                }
                break
            case '/*':
                if (c === '*') {
                    mode = '/**'
                }
                break
            case '/**':
                if (c === '/') {
                    start = i + 1
                    mode = ''
                } else {
                    mode = '/*'
                }
                break
            case '\\':
                mode = ''
                break
            case '"':
                if (c === '"') mode = ''
                break
            case '\\"':
                mode = '"'
                break
            case "'":
                if (c === "'") mode = ''
                break
            case "\\'":
                mode = "'"
                break
            case "'":
                if (c === "'") mode = ''
                break
            case "\\`":
                mode = "`"
                break
        }
    }
    return `${output}${content.substr(start)}`
}
