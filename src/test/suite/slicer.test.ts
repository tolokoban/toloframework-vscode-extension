// tslint:disable: no-magic-numbers

import Slicer from '../../fonts/slicer'
import * as assert from 'assert'
import * as X from 'vscode'

// import * as myExtension from '../../extension';

suite('fonts/slicer', () => {
    X.window.showInformationMessage('Start tests for fonts/slicer.')

    suite('removeComments()', () => {
        test("should keep content intact if no comments", () => {
            const content = "Hello world!"
            assert.strictEqual(
                Slicer.removeComments(content),
                content
            )
        })
        test("should remove comments", () => {
            const input = "Hello/* world*/!"
            const expected = "Hello!"
            assert.strictEqual(
                Slicer.removeComments(input),
                expected
            )
        })
        test("should keep content intact if no comments (even with '*/')", () => {
            const content = "Hello world!\nI like the */ that we can see."
            assert.strictEqual(
                Slicer.removeComments(content),
                content
            )
        })
        test("should work on real example", () => {
            const input = `/* cyrillic-ext */
@font-face {
  font-family: 'Noto Sans';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: local('Noto Sans Italic'), local('NotoSans-Italic'), url(https://fonts.gstatic.com/s/notosans/v10/o-0OIpQlx3QUlC5A4PNr4ARPQ_m87A.woff2) format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}`
            assert.strictEqual(
                Slicer.removeComments(input),
                `
@font-face {
  font-family: 'Noto Sans';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: local('Noto Sans Italic'), local('NotoSans-Italic'), url(https://fonts.gstatic.com/s/notosans/v10/o-0OIpQlx3QUlC5A4PNr4ARPQ_m87A.woff2) format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}`
            )
        })
    })

    suite('slice()', () => {
        test("should keep content intact if no comments nor URLs", () => {
            const content = "I like to eat cats!"
            const got = Slicer.slice(content)
            assert.deepStrictEqual(
                got.pieces,
                [content]
            )
        })
        test("should work with a single URL", () => {
            const input = "background-image: url(./dead-cat.png);"
            const got = Slicer.slice(input)
            assert.deepStrictEqual(
                got.pieces,
                ["background-image: url(", 0, ");"]
            )
            assert.deepStrictEqual(
                got.urls,
                ["./dead-cat.png"]
            )
        })
        test("should work with a single URL with comments", () => {
            const input = "/* Comment... */background-image: url(./dead-cat.png);"
            const got = Slicer.slice(input)
            assert.deepStrictEqual(
                got.pieces,
                ["background-image: url(", 0, ");"]
            )
            assert.deepStrictEqual(
                got.urls,
                ["./dead-cat.png"]
            )
        })
        test("should work with two URLs", () => {
            const input = "background-image: url(./dead-cat.png);@import url(https://fonts.gstatic.com/s/notosans/v10/o-0OIpQlx3QUlC5A4PNr4ARPQ_m87A.woff2);"
            const got = Slicer.slice(input)
            assert.deepStrictEqual(
                got.pieces,
                ["background-image: url(", 0, ");@import url(", 1, ");"]
            )
            assert.deepStrictEqual(
                got.urls,
                [
                    "./dead-cat.png",
                    "https://fonts.gstatic.com/s/notosans/v10/o-0OIpQlx3QUlC5A4PNr4ARPQ_m87A.woff2"
                ]
            )
        })
        test("should work with real example", () => {
            const input = `@font-face {
  font-family: 'Noto Sans';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: local('Noto Sans Italic'), local('NotoSans-Italic'), url(https://fonts.gstatic.com) format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}`
            const got = Slicer.slice(input)
            // assert.deepStrictEqual(
            //     got.pieces,
            //     ["background-image: url(", 0, ");@import url(", 1, ");"]
            // )
            assert.deepStrictEqual(
                got.urls,
                [
                    "https://fonts.gstatic.com",
                ]
            )
        })
    })
})
