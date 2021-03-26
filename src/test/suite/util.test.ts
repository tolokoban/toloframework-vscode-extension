import * as assert from 'assert';
import Util from '../../util'

suite('util.ts', () => {
    suite('Util.stripComments()', () => {
        test(`should work with empty string`, () => {
            const code = ''
            assert.strictEqual(Util.stripComments(code), code)
        })
        test(`should work even without comments`, () => {
            const code = 'import Will from "strenght"\nWill.go()'
            assert.strictEqual(Util.stripComments(code), code)
        })
        test(`should strip single line comments`, () => {
            const code = 'import Will // comment"\nWill.go()'
            const exp = 'import Will \nWill.go()'
            assert.strictEqual(Util.stripComments(code), exp)
        })
        test(`should strip multi-line comments`, () => {
            const code = 'import /* Will do \n nothing */nothing'
            const exp = 'import nothing'
            assert.strictEqual(Util.stripComments(code), exp)
        })
    })
})
