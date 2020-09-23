import { Readable as ReadableStream } from "stream"

declare interface Headers {
    append(name: string, value: string): void
    delete(name: string): void
    entries(): Array<[string, string]>
    get(name: string): string | null
    has(name: string): boolean
    keys(): string[]
    set(name: string, value: string): void
    values(): string[]
}

declare interface Blob {
    size: number
    type: string
    arrayBuffer(): Promise<ArrayBuffer>
    slice(start?: number, end?: number, contentType?: string): Blob
    stream(): ReadableStream
    text(): Promise<string>
}

declare interface File extends Blob {
    readonly lastModified: number
    readonly name: number
    readonly size: number
    readonly type: string
}

declare type FormDataEntryValue = string | File

declare interface FormData {
    append(name: string, value: string, filename?: string): void
    delete(name: string): void
    entries(): Array<[string, string]>
    get(name: string): FormDataEntryValue | null
    getAll(name: string): FormDataEntryValue[]
    has(name: string): boolean
    keys(): string[]
    set(name: string, value: string | Blob | File): void
    values(): Array<string | Blob>
}

declare interface Body {
    body: ReadableStream
    bodyUsed: boolean
    arrayBuffer(): Promise<ArrayBuffer>
    blob(): Promise<Blob>
    formData(): Promise<FormData>
    json(): Promise<any>
    text(): Promise<string>
}

declare interface Response extends Body {
    headers: Headers
    ok: boolean
    redirected: boolean
    status: number
    statusText: string
    trailers: any  // @see https://developer.mozilla.org/en-US/docs/Web/API/Response
    type: "basic" | "cors" | "error" | "opaque" | "opaqueredirect"
    url: string
    useFinalURL: boolean
    clone(): Response
    error(): Response
    redirect(url: string, status: number): Response
}

declare function fetch(url: string): Promise<Response>