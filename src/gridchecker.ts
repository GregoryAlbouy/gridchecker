import TEMPLATE_HTML from './template.html'
import TEMPLATE_CSS from './style.css'

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

    props: PropertyDict = {
        columns:     { attr: 'columns',      val: 0,                     isWidth: true },
        gridWidth:   { attr: 'grid-width',   val: '',                    isWidth: true },
        columnWidth: { attr: 'column-width', val: '',                    isWidth: true },
        gapWidth:    { attr: 'gap-width',    val: '',                    isWidth: true },
        offsetX:     { attr: 'offset-x',     val: '0px',                 isWidth: false },
        offsetY:     { attr: 'offset-y',     val: '0px',                 isWidth: false },
        zIndex:      { attr: 'z-index',      val: '1000000',             isWidth: false },
        color:       { attr: 'color',        val: 'rgba(200,50,200,.4)', isWidth: false },
        key:         { attr: 'key',          val: 'g',                   isWidth: false },
        debug:       { attr: 'debug',        val: false,                 isWidth: false },
        target:      { attr: '',             val: document.body,         isWidth: false }
    }

    isInitialized = false
    rendered = 0

    dom = this
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

    attributeChangedCallback(name: string, _: any, value: string): void
    {
        if (!this.isInitialized) return
        if (!this.attributesAreValid()) return

        const matchedPropKey =  Object.keys(this.props).find((key) => this.props[key].attr === name) as string
        const matchedProp = this.props[matchedPropKey]
        
        this.set(matchedProp, value)
    }

    connectedCallback(): void
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
    init(): void
    {
        const setValues = (propName: string) => {
            this.set(this.props[propName], this.getAttribute(this.props[propName].attr))
        }

        const constrainToParent = () => {
            const parent = this.dom.parentNode as HTMLElement
            const updatePosition = () => this.dom.style.top = `${parent.getBoundingClientRect().top}px`

            if (parent === document.body) return
            
            this.dom.style.top = `${parent.getBoundingClientRect().top}px`
            this.dom.style.height = `${parent.getBoundingClientRect().height}px`
            
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

        errors.forEach((err: GridCheckerError) => this.warn(err.msg, err.src))

        return !errors.length
    }

    /**
     * Generic setter
     */
    set(prop: Property, value: string | null): void
    {
        prop.val = this.getProcessedValue(prop, value)

        if (prop.isWidth) this.setRemainingWidthValue()
        if (this.isInitialized) this.render()

        this.log()
    }
 
    /**
     * Converts string values from html attributes to the expected type
     * depending on the property
     */
    getProcessedValue(prop: Property, value: string | null): boolean | number  | string
    {        
        const process: StringProcessor = {
            boolean: !(value === "false" || value === "0" || value === null),
            number: Math.floor(Number(value)),
            string: value || `${prop.val}`
        }

        return process[typeof prop.val]
    }

    /**
     * Identifies and sets the missing width information (if applicable).
     */
    setRemainingWidthValue(): void
    {
        let missingValue: Property | undefined
        const widthValues = [this.props.gridWidth, this.props.columnWidth, this.props.gapWidth]

        const getMissingValue = () => widthValues.find(prop => !this.getAttribute(prop.attr))

        const getComputedWidthValueFromClientRect = (attr: string) => {
            // Needs to pre-render before accessing getBoundingClientRect()
            this.render()

            const
                ctr = this.shadow.querySelector('.column-container')!,
                col = ctr.querySelector('div')!,
                cl2 = ctr.querySelector('div:nth-child(2)')!,
                n   = Number(this.props.columns.val),            // number of columns
                W   = Number(ctr.getBoundingClientRect().width), // actual grid width
                cw  = Number(col.getBoundingClientRect().width), // actual column width
                gw  = Number(cl2.getBoundingClientRect().left)   // actual gap width
                      - Number(col.getBoundingClientRect().right) 
    
            const computed: StringProcessor = {
                'grid-width': `${n * cw + (n - 1) * gw}px`,
                'column-width': `${(W - (n - 1) * gw) / n}px`,
                'gap-width': `${(W - n * cw) / (n - 1)}px`
            }

            return computed[attr]
        }

        if (!(missingValue = getMissingValue())) return

        missingValue.val = getComputedWidthValueFromClientRect(missingValue.attr)
    }

    render(): void
    {
        const getElements: () => elementDict = () => {
            return {
                style: this.shadow.querySelector('style')!,
                container: this.shadow.querySelector('.column-container')!
            }
        }

        const getTemplateColumns: () => string = () => {
            return [...Array(this.props.columns.val)]
                .map(() => '<div></div>')
                .join('')
        }

        const getStyle: () => string = () => {
            return TEMPLATE_CSS
                .replace(/"{{\s?([\w]+)\s?}}"/g, (_, propName) => `${this.props[propName].val}`)
        }

        this.shadow.innerHTML = TEMPLATE_HTML
        getElements().style.textContent = getStyle()
        getElements().container.innerHTML = getTemplateColumns()

        this.rendered += 1 
    }

    listenKey(): void
    {
        const toggleHidden = (event: KeyboardEvent) => {
            if (event.key === this.props.key.val) this.toggleAttribute('hidden')
        }

        window.addEventListener('keydown', toggleHidden)
    }

    /**
     * Processes and appends the element to the DOM
     * (when created via the constructor using new GridChecker())
     */
    createElement(options: optionsDict): void
    {
        const
            gridChecker = document.createElement('grid-checker'),
            target = options.target || document.body

        Object.keys(options).forEach((key) => {
            if (!this.props.hasOwnProperty(key)) this.warn(GridChecker.error.UNKNOWN_PROP, key)
            else if (this.props[key].attr) gridChecker.setAttribute(this.props[key].attr, options[key])
        })

        target.appendChild(gridChecker)
        this.dom = gridChecker as this
    }

    /**
     * If debug is activated, logs handful informations on dom connection
     * and attribute change
     */
    log(): void
    {
        if (!this.props.debug.val) return

        const debug: optionsDict = {}

        const discloseIdentity = (propName: string) => {
            return {
                'value': this.props[propName].val,
                'getAttribute()': this.getAttribute(this.props[propName].attr)
            }
        }

        const newDebugEntry = (propName: string) => {
            debug[propName] = discloseIdentity(propName)
        }

        Object.keys(this.props).forEach(newDebugEntry)

        console.table(debug)
        console.log(`rendered: ${this.rendered}`, this.dom)
    }

    warn(message: string, source: any): void
    {
        const detail = source ? ` (input: ${source})` : ''
        console.warn('%c  ', `background: ${this.props.color.val}`, `${message + detail}`, this)
        this.log()
    }
}

// 'as any': workaround to avoid TypeScript bug.
customElements.define('grid-checker', GridChecker as any)
Object.defineProperty(window, 'GridChecker', { value: GridChecker })