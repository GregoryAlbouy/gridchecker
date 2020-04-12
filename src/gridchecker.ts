/**
 * FIX: update event listener after "key" attribute change
 * 
 * TODO: error when W !== n*cw + (n-1)*gw (when user enters all 3 values)
 * TODO: add prop condition(callback(): boolean)
 * TODO: add prop breakpoint(options: object, breakpoint: string)
 */
interface PropertyList {
    [name: string]: Property
}
interface Property {
    attr: string,
    val: boolean | number | string | HTMLElement
    isWidth: boolean
}
class GridChecker extends HTMLElement
{
    static error = {
        MISSING_COL_VAL: 'GridChecker warning: missing value for the attribute: columns (number of columns).',
        MISSING_WIDTH_VAL: 'GridChecker warning: missing width value(s). At least two of the following attributes must be set: grid-width, column-width, gap-width.',
        INVALID_COL_VAL: 'GridChecker warning: integer >= 2 is expected for attribute "columns" value.',
        UNKNOWN_ATTR: 'GridChecker warning: unknown attribute.',
        UNKNOWN_PROP: 'GridChecker warning: unknown property.'
    }

    static attributes = ['columns', 'grid-width', 'column-width', 'gap-width', 'offset-x', 'offset-y', 'z-index', 'color', 'key']

    props: PropertyList = {
        columns:     { attr: 'columns',      val: 0,                     isWidth: true },
        gridWidth:   { attr: 'grid-width',   val: '',                    isWidth: true },
        columnWidth: { attr: 'column-width', val: '',                    isWidth: true },
        gapWidth:    { attr: 'gap-width',    val: '',                    isWidth: true },
        offsetX:     { attr: 'offset-x',     val: '',                    isWidth: false },
        offsetY:     { attr: 'offset-y',     val: '',                    isWidth: false },
        zIndex:      { attr: 'z-index',      val: '1000000',             isWidth: false },
        color:       { attr: 'color',        val: 'rgba(200,50,200,.4)', isWidth: false },
        key:         { attr: 'key',          val: 'g',                   isWidth: false },
        debug:       { attr: 'debug',        val: false,                 isWidth: false },
        target:      { attr: '',             val: document.body,         isWidth: false }
    }

    isInitialized = false
    rendered = 0

    html = this
    shadow: ShadowRoot

    constructor(options: object)
    {
        super()
        this.shadow = this.attachShadow({ mode: 'open' })

        if (options) this.createElement(options)
    }

    static get observedAttributes(): Array<string>
    {
        return GridChecker.attributes
    }

    attributeChangedCallback(name: string, _: any, value: string)
    {
        if (!this.isInitialized) return
        if (!this.attributesAreValid()) return

        const matchedPropKey =  Object.keys(this.props).find((key) => this.props[key].attr === name) as string
        const matchedProp = this.props[matchedPropKey]
        
        this.set(matchedProp, value)
    }

    connectedCallback()
    {
        if (!this.attributesAreValid()) return

        this.init()
        this.setRemainingWidthValue()
        this.render()
        this.listenKey()
        this.isInitialized = true
        this.log()
    }

    /**
     * Sets all property values from the html attributes
     */
    init()
    {
        const setValues = (propName: string) => {
            this.set(this.props[propName], this.getAttribute(this.props[propName].attr))
        }

        const constrainToParent = () => {
            const parent = this.html.parentNode as HTMLElement
            const updatePosition = () => this.html.style.top = `${parent.getBoundingClientRect().top}px`
            
            this.html.style.top = `${parent.getBoundingClientRect().top}px`
            this.html.style.height = `${parent.getBoundingClientRect().height}px`
            
            window.addEventListener('scroll', updatePosition)
        }

        Object.keys(this.props).forEach(setValues)
        constrainToParent()
    }

    attributesAreValid(): boolean
    {
        const
            columns = this.getAttribute('columns'),
            gridWidth = this.getAttribute('grid-width'),
            columnWidth = this.getAttribute('column-width'),
            gapWidth = this.getAttribute('gap-width')

        let errors = []

        if (!columns) {
            errors.push({ msg: GridChecker.error.MISSING_COL_VAL, src: columns })
        }

        if (!!columns && (Number.isNaN(Number(columns)) || Number(columns) < 2)) {
            errors.push({ msg: GridChecker.error.INVALID_COL_VAL, src: columns })
        }

        // if more than one width value is missing
        if ([gridWidth, columnWidth, gapWidth].filter(value => value === null).length > 1) {
            errors.push({ msg: GridChecker.error.MISSING_WIDTH_VAL, src: null })
        }

        errors.forEach((err: any) => this.warn(err.msg, err.src))

        return !errors.length
    }

    set(prop: Property, value: string | null)
    {
        prop.val = this.getProcessedValue(prop, value)

        if (prop.isWidth) this.setRemainingWidthValue()

        this.log()
        this.render()
    }
 
    /**
     * Converts string values from html attributes to the expected type
     * depending on the property
     */
    getProcessedValue(prop: Property, value: string | null)
    {
        const process: any = {
            boolean: !(value === "false" || value === "0" || value === null),
            number: Math.floor(Number(value)),
            string: value || `${prop.val}`
        }

        return process[`${typeof prop.val}`]
        }

    /**
     * Identifies and sets the missing width information (if applicable).
     */
    setRemainingWidthValue()
    {
        const widthValues = [this.props.gridWidth, this.props.columnWidth, this.props.gapWidth]
        let missingValue: Property | undefined
        const getMissingValue = () => widthValues.find(prop => !this.getAttribute(prop.attr))
        const getComputedWidthValueFromClientRect = (attr: string) => {
            // Needs to pre-render before accessing getBoundingClientRect()
            this.render()
    
            const
                ctr = this.shadow.querySelector('.column-container'),
                col = ctr!.querySelector('div'),
                n   = Number(this.props.columns.val),
                W   = Number(ctr!.getBoundingClientRect().width),
                cw  = Number(col!.getBoundingClientRect().width),
                gw  = Number(ctr!.querySelector('div:nth-child(2)')!.getBoundingClientRect().left)
                    - Number(col!.getBoundingClientRect().right)
    
            const computed: any = {
                'grid-width': `${n * cw + (n - 1) * gw}px`,
                'column-width': `${(W - (n - 1) * gw) / n}px`,
                'gap-width': `${(W - n * cw) / (n - 1)}px`
            }

            return computed[attr]
        }

        if (!(missingValue = getMissingValue())) return

        missingValue.val = getComputedWidthValueFromClientRect(missingValue.attr)
    }

    render()
    {
        this.shadow.innerHTML = `
            <style>
                ${this.getStyle()}
            </style>
            <div class="column-container">
                ${this.getTemplateColumns()}
            </div>
        `
        this.rendered += 1
    }

    listenKey()
    {
        window.addEventListener('keydown', (event) => {
            if (event.key === this.props.key.val) this.toggleAttribute('hidden')
        })
    }

    /**
     * Returns as a string a number of divs equal to the number of columns
     */
    getTemplateColumns(): string
    {
        return (
            [...Array(this.props.columns.val)]
                .map(() => '<div></div>')
                .join('')
        );
    }

    getStyle(): string
    {
        return `
            :host {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                z-index: ${this.props.zIndex.val};
                width: 100%;
                height: 100%;
            }
            :host([hidden]) { display: none; }
            .column-container {
                position: relative;
                ${this.props.offsetY.val ? 'top: ' + this.props.offsetY.val : ''};
                ${this.props.offsetX.val ? 'left: ' + this.props.offsetX.val : ''};
                width: ${this.props.gridWidth.val};
                height: 100%;
                margin: auto;
                font-size: 0;
            }
            .column-container div {
                display: inline-block;
                width: ${this.props.columnWidth.val};
                height: 100%;
                background: ${this.props.color.val};
            }
            .column-container div:not(:last-of-type) {
                margin-right: ${this.props.gapWidth.val};
            }
        `
    }

    /**
     * Processes and appends the element to the DOM
     * (when created via the constructor using new GridChecker())
     */
    createElement(options: any)
    {
        const
            gridChecker = document.createElement('grid-checker'),
            target = options.target || document.body

        Object.keys(options).forEach((key) => {
            if (!this.props.hasOwnProperty(key)) this.warn(GridChecker.error.UNKNOWN_PROP, key)
            else if (this.props[key].attr) gridChecker.setAttribute(this.props[key].attr, options[key])
        })

        target.appendChild(gridChecker)
        this.html = gridChecker as this
    }

    /**
     * If debug is activated, logs handful informations on dom connection
     * and attribute change
     */
    log()
    {
        if (!this.props.debug.val) return

        const debug: any = {}

        Object.keys(this.props).forEach((propName: string) => {
            debug[propName] = {
                'value': this.props[propName].val,
                'getAttribute()': this.getAttribute(this.props[propName].attr)
            }
        })

        console.table(debug)
        console.log(`rendered: ${this.rendered}`, this.html)
    }

    warn(message: string, source: any)
    {
        const detail = source ? ` (input: ${source})` : ''
        console.warn('%c  ', `background: ${this.props.color.val}`, `${message + detail}`, this)
        this.log()
    }
}

// 'as any': workaround to avoid TypeScript bug.
customElements.define('grid-checker', GridChecker as any)