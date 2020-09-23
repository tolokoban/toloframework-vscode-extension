export default {
    removeComments,
    slice
}

const NOT_FOUND = -1

interface ISlices {
    urls: string[]
    data: Array<ArrayBuffer | null>
    pieces: Array<string | number>
}

function slice(cssContent: string): ISlices {
    const urls: string[] = []
    const pieces: Array<string | number> = []
    const content = removeComments(cssContent)
    let cursor = 0

    while (true) {
        const indexOpen = content.indexOf("url(", cursor)
        if (indexOpen === NOT_FOUND) {
            pieces.push(content.substr(cursor))
            break
        }
        pieces.push(content.substring(cursor, indexOpen + "url(".length))
        const indexClose = content.indexOf(")", indexOpen + "url(".length)
        if (indexClose === NOT_FOUND) break

        pieces.push(urls.length)
        const url = content.substring(indexOpen + "url(".length, indexClose)
        urls.push(url)
        cursor = indexClose
    }

    return { urls, pieces, data: [] }
}

function removeComments(content: string): string {
    const pieces: string[] = []
    let cursor = 0

    while (true) {
        const indexOpen = content.indexOf("/*", cursor)
        if (indexOpen === NOT_FOUND) {
            pieces.push(content.substr(cursor))
            break
        }
        pieces.push(content.substring(cursor, indexOpen))
        const indexClose = content.indexOf("*/", cursor + "/*".length)
        if (indexClose === NOT_FOUND) break
        cursor = indexClose + "*/".length
    }

    return pieces.join("")
}