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

declare type stringProcessor = { [key: string]: boolean | number | string }
declare type optionsObject = { [key:string]: any }