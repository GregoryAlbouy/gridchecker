declare interface PropertyDict {
    [propName: string]: Property
}

declare interface Property {
    attr: string,
    val: boolean | number | string | HTMLElement
    isWidth: boolean
}

declare interface GridCheckerError {
    msg: string,
    src: any
}

declare interface StringProcessor {
    [key: string]: boolean | number | string
}

declare type elementDict = { [key:string]: Element }
declare type optionsDict = { [key:string]: any }