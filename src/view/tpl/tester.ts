import Util from '../../util'

export default function(filename: string, folder: string) {
    const viewname = Util.kebabCaseToPascalCase(filename)

    return `// To test a React component, you need to install these modules:
// yarn add --dev react-test-renderer @types/react-test-renderer
// @see https://jestjs.io/docs/en/snapshot-testing
//
// If a test failed just because you intended to improve the component,
// just call \`jest --updateSnapshot\`.

import React from 'react';
import Renderer from 'react-test-renderer'
import ${viewname}, { I${viewname}Props } from './${filename}'

function view(partialProps: Partial<I${viewname}Props>) {
    const props: I${viewname}Props = {
        // @TODO Set default props.
        ...partialProps
    }
    return Renderer.create(<${viewname} {...props} />).toJSON()
}

describe('<${viewname}/> in ${folder}', () => {
    it('should be consistent with previous snapshot', () => {
        expect(view({})).toMatchSnapshot()
    })
})
`
}