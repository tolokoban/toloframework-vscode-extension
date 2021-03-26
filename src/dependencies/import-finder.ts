import FS = require("fs")
import Path = require("path")
import Util from '../util'
import { NamedExport, Export, TypescriptParser } from 'typescript-parser'



export default { findInFile }

export interface Dependencies {
    intDepends: string[]
    extDepends: string[]
}


async function findInFile(path: string): Promise<Dependencies> {
    if (!Util.exists(path) || Util.isDir(path)) {
        return { intDepends: [], extDepends: [] }

    }
    const result: Dependencies = { intDepends: [], extDepends: [] }
    const parser = new TypescriptParser()
    const tree = await parser.parseFile(
        path,
        Util.getSourceFolder(path) ?? Util.getDirectory(path)
    )
    const libraries = tree.imports.map(imp => imp.libraryName)
    for (const exp of tree.exports) {
        if (isNamedExport(exp)) {
            const { from } = exp
            if (typeof from === 'string') {
                libraries.push(from)
            }
        }
    }
    for (const lib of libraries) {
        if (lib.startsWith('.')) {
            // Internal dependency.
            const depFullPath = findRealFilename(Path.resolve(
                Util.getDirectory(path),
                lib
            ))
            if (depFullPath) {
                result.intDepends.push(depFullPath)
            } else {
                console.error("Error in module:", path)
                console.error("  > Unable to find import:", lib)
            }
        } else {
            // External dependency
            const [firstPart] = lib.split('/')
            if (!result.extDepends.includes(firstPart)) {
                result.extDepends.push(firstPart)
            }
        }
    }

    return result
}

/**
 * In "import" statements we usually don't specify the extension.
 * This function retrieve the full path with extension, or `null`
 * if nothing has been found.
 */
function findRealFilename(path: string): string | null {
    if (Util.isDir(path)) {
        const files = ['index.ts', 'index.tsx', 'index.js', 'index.jsx']
        for (const file of files) {
            const pathToTest = `${path}/${file}`
            if (FS.existsSync(pathToTest)) {
                return pathToTest

            }
        }
        return null

    }
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx']
    for (const ext of extensions) {
        const pathToTest = `${path}${ext}`
        if (FS.existsSync(pathToTest)) {
            return pathToTest

        }
    }
    return null
}


function isNamedExport(exp: Export): exp is NamedExport {
    const obj = (exp as unknown) as { [key: string]: any }
    return typeof obj.from === 'string'
}