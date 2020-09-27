import * as X from 'vscode'
import * as FS from "fs"
import * as Path from "path"
import Util from '../util'
import Inputs from '../inputs'

export default {
    exec
}

async function exec() {
    const folder = await Inputs.selectFolder("Root folder for your new module")
    if (!folder) return
    const folderName = Path.basename(folder)
    let moduleName = await X.window.showInputBox({
        prompt: "Module's name",
        validateInput: Util.isKebabCase
    })
    if (!moduleName) return
    const destinationFolder = Path.resolve(folder, moduleName)
    if (Util.exists(destinationFolder)) {
        X.window.showErrorMessage(
            `This folder already exists!\n${destinationFolder}`,
            { modal: true }
        )
        return
    }
    await X.workspace.fs.createDirectory(X.Uri.file(destinationFolder))

    if (folderName !== 'src') {
        const moduleSuffix = await X.window.showInputBox({
            prompt: "Module's name suffix (press ESC if you don't want any)",
            value: folderName,
            validateInput: Util.isKebabCase
        })
        if (moduleSuffix) {
            moduleName += `-${moduleSuffix.trim()}`
        }
    }

    const save = writeFile.bind(null, destinationFolder)
    save("index.ts", `export { default } from './${moduleName}'\n`)
    save(`${moduleName}.ts`, getModuleContent())
    save(`${moduleName}.test.ts`, getTestContent(moduleName))

    const fileToOpen = Path.resolve(folder, `${moduleName}.ts`)
    console.log("fileToOpen = ", fileToOpen) // @TODO Remove this line written on 2020-09-27 at 19:48
    await Util.openFileInEditor(fileToOpen)
}


function writeFile(folder: string, filename: string, content: string) {
    const path = Path.resolve(folder, filename)
    try {
        FS.writeFileSync(path, content)
    } catch (ex) {
        console.error("Unable to write file: ", path)
        console.error(ex)
        X.window.showErrorMessage(`${ex}`)
    }
}

function getModuleContent(): string {
    return `export default { exec }

function exec() {}
`
}

function getTestContent(moduleName: string): string {
    const pascalName = Util.kebabCaseToPascalCase(moduleName)
    return `import ${pascalName} from './${moduleName}'

describe("Module ${moduleName}", () => {
    // @TODO Write tests for module ${moduleName}
})
`
}