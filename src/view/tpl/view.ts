import Util from '../../util'

export default function(filename: string, folder: string) {
    const viewname = Util.kebabCaseToPascalCase(filename)
    const className = `${
        folder.split("/").map(Util.kebabCaseToLowerPascalCase).join("-")
    }-${viewname}`

    return `import * as React from "react"
import Tfw from 'tfw'

import './${filename}.css'

// const _ = Tfw.Intl.make(require('./${filename}.json'))

export interface I${viewname}Props {
    className?: string
}

// tslint:disable-next-line: no-empty-interface
interface I${viewname}State {}

export default class ${viewname} extends React.Component<I${viewname}Props, I${viewname}State> {
    state: I${viewname}State = {}

    render() {
        const classNames = ['custom', '${className}']
        if (typeof this.props.className === 'string') {
            classNames.push(this.props.className)
        }

        return <div className={classNames.join(" ")}>
        </div>
    }
}
`
}