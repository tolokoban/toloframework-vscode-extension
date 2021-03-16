import Util from '../../util'

export default function(filename: string, folder: string) {
    const viewname = Util.kebabCaseToPascalCase(filename)
    const className = `${
        folder.split("/").map(Util.kebabCaseToLowerPascalCase).join("-")
    }-${viewname}`

    return `import * as React from "react"

import './${filename}.css'


export interface ${viewname}Props {
    className?: string
}

export default function(props: ${viewname}Props) {
    return <div className={getClassNames(props)}>
    </div>
}


function getClassNames(props: ${viewname}Props): string {
    const classNames = ['custom', '${className}']
    if (typeof props.className === 'string') {
        classNames.push(props.className)
    }

    return classNames.join(' ')
}
`
}