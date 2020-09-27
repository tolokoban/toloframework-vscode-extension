// tslint:disable-next-line: no-implicit-dependencies
import * as X from 'vscode'
import * as Path from 'path'
import * as  FS from 'fs'
import Util from '../util'


export default {
    selectFolder
}

async function selectFolder(): Promise<string | null> {
    // tslint:disable-next-line: no-null-undefined-union
    return new Promise<string | null>((resolve, reject) => {
        const sourceFolder = Util.getSourceFolder()
        if (!sourceFolder) {
            reject("Unable to find source folder!")
            return null
        }

        let selectedFolder: string | null = null
        const folders: string[] = []
        recursiveSearchForFolders(sourceFolder, folders)
        const items = folders.map(
            dir => ({
                label: `./${Path.relative(sourceFolder, dir)}`
            }))
        const picker = X.window.createQuickPick<X.QuickPickItem>()
        picker.items = items
        picker.title = "Select a folder for the font"
        picker.onDidAccept(() => {
            resolve(selectedFolder)
            picker.dispose()
        })
        picker.onDidChangeActive(
            activeItems => {
                selectedFolder = Path.resolve(sourceFolder, activeItems[0].label)
            }
        )
        picker.show()
    })
}


function recursiveSearchForFolders(currentFolder: string, folders: string[]) {
    folders.push(currentFolder)
    const dirs = FS.readdirSync(currentFolder, { withFileTypes: true })
    for (const dir of dirs) {
        if (dir.name === '.' || dir.name === '..') continue

        if (dir.isDirectory()) {
            recursiveSearchForFolders(
                Path.resolve(currentFolder, dir.name),
                folders
            )
        }
    }
}
