import Util from '../../util'

export default function(filename: string, folder: string) {
    const viewname = Util.kebabCaseToPascalCase(filename)
    const className = `${
        folder.split("/").map(Util.kebabCaseToLowerPascalCase).join("-")
    }-${viewname}`

    return `.${className} {}\n`
}

