import Util from '../../util'

export default function(filename: string, folder: string) {
    const viewname = Util.kebabCaseToPascalCase(filename)
    const back = folder.split("/")
        .map(x => "..")
        .join("/")

    return `import { connect } from 'react-redux'
import ${viewname}, { I${viewname}Props } from './${filename}'
import { IAppState, IAction } from '${back}/../types'

function mapStateToProps(
    state: IAppState,
    props: Partial<I${viewname}Props>
): I${viewname}Props {
    return { ...props }
}

function mapDispatchToProps(
    dispatch: (action: IAction) => void,
    props: Partial<I${viewname}Props>
) {
    // @see https://redux.js.org/basics/usage-with-react/#implementing-container-components
}

export default connect(mapStateToProps, mapDispatchToProps)(${viewname})
`
}