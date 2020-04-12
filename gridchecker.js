class GridChecker extends HTMLElement {
    constructor(options) {
        super();
        this.props = {
            columns: { attr: 'columns', val: 0, isWidth: true },
            gridWidth: { attr: 'grid-width', val: '', isWidth: true },
            columnWidth: { attr: 'column-width', val: '', isWidth: true },
            gapWidth: { attr: 'gap-width', val: '', isWidth: true },
            offsetX: { attr: 'offset-x', val: '', isWidth: false },
            offsetY: { attr: 'offset-y', val: '', isWidth: false },
            zIndex: { attr: 'z-index', val: '1000000', isWidth: false },
            color: { attr: 'color', val: 'rgba(200,50,200,.4)', isWidth: false },
            key: { attr: 'key', val: 'g', isWidth: false },
            debug: { attr: 'debug', val: false, isWidth: false },
            target: { attr: '', val: document.body, isWidth: false }
        };
        this.isInitialized = false;
        this.rendered = 0;
        this.html = this;
        this.shadow = this.attachShadow({ mode: 'open' });
        if (options)
            this.createElement(options);
    }
    static get observedAttributes() {
        return GridChecker.attributes;
    }
    attributeChangedCallback(name, _, value) {
        if (!this.isInitialized)
            return;
        if (!this.attributesAreValid())
            return;
        const matchedPropKey = Object.keys(this.props).find((key) => this.props[key].attr === name);
        const matchedProp = this.props[matchedPropKey];
        this.setProperty(matchedProp, value);
    }
    connectedCallback() {
        if (!this.attributesAreValid())
            return;
        this.init();
        this.setRemainingWidthValue();
        this.render();
        this.listenKey();
        this.isInitialized = true;
        this.log();
    }
    init() {
        const setValues = (propName) => {
            this.setProperty(this.props[propName], this.getAttribute(this.props[propName].attr));
        };
        const constrainToParent = () => {
            const parent = this.html.parentNode;
            const updatePosition = () => this.html.style.top = `${parent.getBoundingClientRect().top}px`;
            this.html.style.top = `${parent.getBoundingClientRect().top}px`;
            this.html.style.height = `${parent.getBoundingClientRect().height}px`;
            window.addEventListener('scroll', updatePosition);
        };
        Object.keys(this.props).forEach(setValues);
        constrainToParent();
    }
    attributesAreValid() {
        const columns = this.getAttribute('columns'), gridWidth = this.getAttribute('grid-width'), columnWidth = this.getAttribute('column-width'), gapWidth = this.getAttribute('gap-width');
        let errors = [];
        if (!columns) {
            errors.push({ msg: GridChecker.error.MISSING_COL_VAL, src: columns });
        }
        if (!!columns && (Number.isNaN(Number(columns)) || Number(columns) < 2)) {
            errors.push({ msg: GridChecker.error.INVALID_COL_VAL, src: columns });
        }
        if ([gridWidth, columnWidth, gapWidth].filter(value => value === null).length > 1) {
            errors.push({ msg: GridChecker.error.MISSING_WIDTH_VAL, src: null });
        }
        errors.forEach((err) => this.warn(err.msg, err.src));
        return !errors.length;
    }
    setProperty(prop, value) {
        prop.val = this.getProcessedValue(prop, value);
        if (prop.isWidth)
            this.setRemainingWidthValue();
        this.log();
        this.render();
    }
    getProcessedValue(prop, value) {
        const process = {
            boolean: !(value === "false" || value === "0" || value === null),
            number: Math.floor(Number(value)),
            string: value || `${prop.val}`
        };
        return process[`${typeof prop.val}`];
    }
    setRemainingWidthValue() {
        const widthValues = [this.props.gridWidth, this.props.columnWidth, this.props.gapWidth];
        let missingValue;
        const getMissingValue = () => widthValues.find(prop => !this.getAttribute(prop.attr));
        const getComputedWidthValueFromClientRect = (attr) => {
            this.render();
            const ctr = this.shadow.querySelector('.column-container'), col = ctr.querySelector('div'), n = Number(this.props.columns.val), W = Number(ctr.getBoundingClientRect().width), cw = Number(col.getBoundingClientRect().width), gw = Number(ctr.querySelector('div:nth-child(2)').getBoundingClientRect().left)
                - Number(col.getBoundingClientRect().right);
            const computed = {
                'grid-width': `${n * cw + (n - 1) * gw}px`,
                'column-width': `${(W - (n - 1) * gw) / n}px`,
                'gap-width': `${(W - n * cw) / (n - 1)}px`
            };
            return computed[attr];
        };
        if (!(missingValue = getMissingValue()))
            return;
        missingValue.val = getComputedWidthValueFromClientRect(missingValue.attr);
    }
    render() {
        this.shadow.innerHTML = `
            <style>
                ${this.getStyle()}
            </style>
            <div class="column-container">
                ${this.getTemplateColumns()}
            </div>
        `;
        this.rendered += 1;
    }
    listenKey() {
        window.addEventListener('keydown', (event) => {
            if (event.key === this.props.key.val)
                this.toggleAttribute('hidden');
        });
    }
    getTemplateColumns() {
        return ([...Array(this.props.columns.val)]
            .map(() => '<div></div>')
            .join(''));
    }
    getStyle() {
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
        `;
    }
    createElement(options) {
        const gridChecker = document.createElement('grid-checker'), target = options.target || document.body;
        Object.keys(options).forEach((key) => {
            if (!this.props.hasOwnProperty(key))
                this.warn(GridChecker.error.UNKNOWN_PROP, key);
            else if (this.props[key].attr)
                gridChecker.setAttribute(this.props[key].attr, options[key]);
        });
        target.appendChild(gridChecker);
        this.html = gridChecker;
    }
    log() {
        if (!this.props.debug.val)
            return;
        const debug = {};
        Object.entries(this.props).forEach(([propName, prop]) => {
            debug[propName] = { 'value': prop.val, 'getAttribute()': this.getAttribute(prop.attr) };
        });
        console.table(debug);
        console.log(`rendered: ${this.rendered}`, this.html);
    }
    warn(message, source) {
        const detail = source ? ` (input: ${source})` : '';
        console.warn('%c  ', `background: ${this.props.color.val}`, `${message + detail}`, this);
        this.log();
    }
}
GridChecker.error = {
    MISSING_COL_VAL: 'GridChecker warning: missing value for the attribute: columns (number of columns).',
    MISSING_WIDTH_VAL: 'GridChecker warning: missing width value(s). At least two of the following attributes must be set: grid-width, column-width, gap-width.',
    INVALID_COL_VAL: 'GridChecker warning: integer >= 2 is expected for attribute "columns" value.',
    UNKNOWN_ATTR: 'GridChecker warning: unknown attribute.',
    UNKNOWN_PROP: 'GridChecker warning: unknown property.'
};
GridChecker.attributes = ['columns', 'grid-width', 'column-width', 'gap-width', 'offset-x', 'offset-y', 'z-index', 'color', 'key'];
customElements.define('grid-checker', GridChecker);
