import * as X from 'vscode'
import * as FS from "fs"
import * as Path from "path"
import Util from '../util'
import Inputs from '../inputs'
import TplView from './tpl/view'
import TplStyle from './tpl/style'
import TplTester from './tpl/tester'

export default {
    exec
}

async function exec() {
    const folder = await Inputs.selectFolder("Root folder for your new VIEW")
    if (!folder) return
    const relativeFolder = Util.makeRelativeToSource(folder)
    const folderName = Path.basename(folder)
    let viewName = await Inputs.promptForName("View's filename:")
    if (!viewName) return
    const destinationFolder = Path.resolve(folder, viewName)
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
            prompt: "View's name suffix (press ESC if you don't want any)",
            value: folderName,
            validateInput: Util.isKebabCase
        })
        if (moduleSuffix) {
            viewName += `-${moduleSuffix.trim()}`
        }
    }

    const save = writeFile.bind(null, destinationFolder)
    save("index.ts", `export { default } from './${viewName}'\n`)
    save(`${viewName}.tsx`, TplView(viewName, relativeFolder))
    save(`${viewName}.css`, TplStyle(viewName, relativeFolder))
    save(`${viewName}.test.tsx`, TplTester(viewName, relativeFolder))

    const fileToOpen = Path.resolve(destinationFolder, `${viewName}.tsx`)
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
