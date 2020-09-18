import FS = require("fs")

export default {
	changeExtension,
	exists,
    getBasename,
    getDirectory,
	removeExtension,
	writeTextFile
}

function changeExtension(filename: string, newExtension: string): string {
	return `${removeExtension(filename)}.${newExtension}`
}

function exists(path: string): boolean {	
	return FS.existsSync(path)
}

function removeExtension(filename: string): string {
	const idxDot = filename.lastIndexOf(".")
	return filename.substr(0, idxDot)
}

function getBasename(filename: string): string {
	const idxSlash = filename.lastIndexOf("/")
	return filename.substring(idxSlash)
}

function getDirectory(filename: string): string {
	const idxSlash = filename.lastIndexOf("/")
	return filename.substr(0, idxSlash)
}

function writeTextFile(filename: string, content: string) {
	FS.writeFileSync(filename, content)
}