import FS = require("fs")
import Path = require("path")
import ImportFinder from './import-finder'
import {
    Uri, Progress, ProgressLocation, CancellationToken,
    commands, window
} from 'vscode'
import Util from '../util'

export default { generateGraph }

let ID = 0
const OUTPUT_FILENAME = 'dep-graph'
const LIB_PREFIX = "LIB://"

interface ExternalLib {
    name: string
    version: string
}

async function generateGraph(folder: Uri) {
    window.withProgress(
        {
            cancellable: false,
            location: ProgressLocation.Notification,
            title: 'Dependency Graph'
        },
        async (progress: Progress<{ increment: number, message: string }>, token: CancellationToken) => {
            progress.report({ increment: 25, message: "Parsing files..." })
            const sourceFolder = folder.fsPath
            const modulesByPath = new Map<string, ModuleFile>()
            const rootModule = await exploreDependencies(sourceFolder, modulesByPath)
            console.log("MODULE:", JSON.stringify(rootModule, null, '  '))
            const externalLibs = new Map<string, ExternalLib>()
            getInfoOnExternalLibs(rootModule, externalLibs)
            progress.report({ increment: 25, message: "Generating Graphviz file..." })
            const graphCode = `digraph G {
  rankdir=LR;
  node [fontsize=12,shape=box,style=filled,fillcolor="#BBDDFF"];
  edge [color="#555555"];
${indentLines('  ', codeForModule(rootModule)).join('\n')}
${codeForExternalLibs(externalLibs)}
  node [shape=box,style=filled,fillcolor="#BBBBBB"];
${codeForLinks(rootModule, modulesByPath)}
${codeForLinksToLibs(rootModule)}
}`

            console.log("[dependencies] graphCode = ", graphCode) // @FIXME: Remove this line written on 2021-03-25 at 16:00

            const packageFilename = Util.findFilenameInAncestors('package.json', sourceFolder)
            const packageFolder = packageFilename ? Util.getDirectory(packageFilename) : sourceFolder
            const graphDotPath = Path.resolve(packageFolder, `${OUTPUT_FILENAME}.dot`)
            Util.writeTextFile(graphDotPath, graphCode)

            progress.report({ increment: 25, message: "Generating image..." })
            const graphJpgPath = Path.resolve(packageFolder, `${OUTPUT_FILENAME}.jpg`)
            try {
                const command = `dot -Tjpg "${graphDotPath}" -o "${graphJpgPath}"`
                await Util.execCommandAsync(command)
                commands.executeCommand('vscode.open', Uri.file(graphJpgPath))
            } catch (ex) {
                window.showErrorMessage(`${ex}`)
            }
        }
    )
}

interface ModuleFile {
    id: number
    path: string
    isDir: boolean
    children: ModuleFile[]
    // Files of the project
    intDepends: string[]
    // From external libraries
    extDepends: string[]
}


async function exploreDependencies(
    sourceFolder: string,
    modules: Map<string, ModuleFile>
): Promise<ModuleFile> {
    if (modules.has(sourceFolder)) {
        return modules.get(sourceFolder) as ModuleFile
    }

    const module: ModuleFile = {
        id: ID++,
        path: sourceFolder,
        isDir: Util.isDir(sourceFolder),
        children: [],
        ...(await ImportFinder.findInFile(sourceFolder))
    }
    modules.set(sourceFolder, module)

    await addChildren(module, modules)
    for (const dep of module.intDepends) {
        await exploreDependencies(dep, modules)
    }
    // Sort alphabetically with "index.*" always first.
    module.children.sort((c1, c2) => {
        const n1 = c1.path.split('/').pop() ?? ''
        const n2 = c2.path.split('/').pop() ?? ''
        const name1 = `${n1.startsWith('index.') ? "0" : "1"}${n1}`
        const name2 = `${n2.startsWith('index.') ? "0" : "1"}${n2}`
        if (name1 < name2) return -1
        if (name1 > name2) return +1
        return 0
    })
    return module
}

async function addChildren(
    module: ModuleFile,
    modules: Map<string, ModuleFile>
) {
    const { files, folders } = Util.listFilesAndSubFolders(module.path)
    for (const file of files) {
        // Ignore test files.
        if (Util.hasExtension(
            file,
            'test.ts', 'test.tsx', 'test.js', 'test.jsx',
            'spec.ts', 'spec.tsx', 'spec.js', 'spec.jsx'
        )) {
            continue

        }
        // Keep only TS/JS modules.
        if (Util.hasExtension(file, 'ts', 'tsx', 'js', 'jsx')) {
            module.children.push(
                await exploreDependencies(file, modules)
            )
        }
    }
    for (const folder of folders) {
        const subModule = await exploreDependencies(folder, modules)
        module.children.push(subModule)
    }
}

function codeForModule(module: ModuleFile): string[] {
    return module.isDir
        ? codeForModuleCluster(module)
        : codeForModuleFile(module)
}

function codeForModuleCluster(
    module: ModuleFile
): string[] {
    const nextIndent = `  `
    const filename = module.path.split('/').pop() ?? '???'
    const level = Path.relative(
        Path.resolve(
            Util.getSourceFolder(module.path) ?? module.path,
            '..'
        ),
        module.path
    ).split('/').length % 5
    const fillcolor = makeRGB(
        0.9 - level / 8,
        0.95 - level / 8,
        1 - level / 8
    )
    const color = makeRGB(
        0.85 - level / 8,
        0.9 - level / 8,
        0.95 - level / 8
    )
    const output = [
        `subgraph cluster${module.id} {`,
        '  style=filled;',
        `  fillcolor="${fillcolor}";`,
        `  color="${color}";`,
        `  label="${filename}/";`
    ]
    for (const child of module.children) {
        output.push(
            ...indentLines('  ', codeForModule(child))
        )
    }
    output.push('}')
    return output
}

function codeForModuleFile(module: ModuleFile): string[] {
    const filename = module.path.split('/').pop()
    if (filename?.startsWith('index.')) {
        return [`f${module.id} [label="${filename}",fillcolor="#ffddbb"];`]

    }
    return [`f${module.id} [label="${filename}"];`]
}

function indentLines(indent: string, lines: string[]): string[] {
    return lines.map(line => `${indent}${line.trimRight()}`)
}

function codeForLinks(
    module: ModuleFile,
    modulesByPath: Map<string, ModuleFile>
) {
    const links: string[] = []
    fillCodeForLinks(module, modulesByPath, links, module.path)

    return links.join('\n')
}

function fillCodeForLinks(
    module: ModuleFile,
    modulesByPath: Map<string, ModuleFile>,
    links: string[],
    base: string
) {
    if (!module.isDir) {
        for (const dep of module.intDepends) {
            if (dep.endsWith('.css')) continue
            if (dep.endsWith('.scss')) continue

            const depName = findDepName(dep)
            const target = modulesByPath.get(depName)
            if (!target) {
                console.error("Cannot find this dep:", depName)
                console.error(module)
                continue

            }
            if (target.path.startsWith(base)) {
                const edgeStyle =
                    isValidLink(module.path, target.path) ? '' : ' [color=red]'
                links.push(`f${module.id
                    } -> ${target.isDir ? 'cluster' : 'f'
                    }${target.id}${edgeStyle};`)
            } else {
                const path = Path.relative(
                    Util.getSourceFolder(target.path) ?? '/',
                    target.path
                )
                links.push(`f${module.id} -> "${path}";`)
            }
        }
    }
    for (const child of module.children) {
        fillCodeForLinks(child, modulesByPath, links, base)
    }
}

function findDepName(dep: string) {
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx']
    for (const ext of extensions) {
        const name = `${dep}${ext}`
        if (FS.existsSync(name)) return name
    }

    return dep
}

function makeRGB(red: number, green: number, blue: number) {
    return `#${toHex256(red)}${toHex256(green)}${toHex256(blue)}`
}

/**
 * Return hexadecimal number equal to integral part of `value` * 255
 * and padded to two digits.
 * @param value Float between 0 and 1.
 */
function toHex256(value: number): string {
    const intVal = Math.floor(255 * value)
    const hex = intVal.toString(16)
    return hex.length < 2 ? `0${hex}` : hex
}

function isIndexFile(path: string): boolean {
    const extensions = ['ts', 'tsx', 'js', 'jsx']
    for (const ext of extensions) {
        const indexName = `index.${ext}`
        if (path.endsWith(indexName)) return true

    }
    return false
}

/**
 * Links to 'index.ts' are always valid.
 * We consider invalid, direct links to modules not in a subfolder.
 */
function isValidLink(src: string, dst: string): boolean {
    if (isIndexFile(dst)) return true

    return Util.getDirectory(dst).startsWith(Util.getDirectory(src))
}

function getInfoOnExternalLibs(
    module: ModuleFile,
    externalLibs: Map<string, ExternalLib>
) {
    const nodeModulesPath = Path.resolve(
        Util.getSourceFolder(module.path) ?? module.path,
        '..',
        'node_modules'
    )
    for (const libName of module.extDepends) {
        if (externalLibs.has(libName)) continue

        const path = Path.resolve(nodeModulesPath, libName, 'package.json')
        const info = parsePackage(path)
        externalLibs.set(libName, info)
    }
    for (const child of module.children) {
        getInfoOnExternalLibs(child, externalLibs)
    }
}

function parsePackage(packagePath: string): ExternalLib {
    try {
        const content = Util.readTextFile(packagePath)
        const data = JSON.parse(content)
        const { name, version } = data
        return { name, version }
    } catch (ex) {
        console.error("Unable to load/parse:", packagePath)
        console.error("  > ", ex)
        const name = Util.getDirectory(packagePath).split('/').pop() ?? '???'
        return { name, version: '???' }
    }
}

function codeForExternalLibs(externalLibs: Map<string, ExternalLib>): string {
    if (externalLibs.size === 0) return ""

    return [
        'subgraph clusterExternalLibs {',
        '  style=filled;',
        '  fillcolor="#FFDDBB";',
        '  color="#664422";',
        '  node [shape=box,style=filled,fillcolor="#FFCC99"];',
        ...Array.from(externalLibs.entries())
            .map(([id, lib]) =>
                `  "${LIB_PREFIX}${id}" [label="${lib.name} ${lib.version}"];`),
        '}'
    ].join('\n')
}

function codeForLinksToLibs(module: ModuleFile): string {
    const lines: string[] = []
    recurseForLinksToLibs(module, lines)
    return lines.join('\n')
}

function recurseForLinksToLibs(module: ModuleFile, lines: string[]) {
    for (const libName of module.extDepends) {
        lines.push(`  f${module.id} -> "${LIB_PREFIX}${libName}";`)
    }
    for (const child of module.children) {
        recurseForLinksToLibs(child, lines)
    }
}

