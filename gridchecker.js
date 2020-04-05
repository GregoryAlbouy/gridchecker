class GridChecker extends HTMLElement {
    constructor(options) {
        super();
        this.columns = null;
        this.gridWidth = null;
        this.columnWidth = null;
        this.gapWidth = null;
        this.offsetX = '0';
        this.offsetY = '0';
        this.zIndex = '1000000';
        this.color = 'rgba(200, 50, 200, .4)';
        this.key = 'g';
        this.debug = false;
        this.renderAmount = 0;
        this.isListeningToAttributes = false;
        this.shadow = this.attachShadow({ mode: 'open' });
        if (options)
            this.createElement(options);
    }
    static get observedAttributes() {
        return GridChecker.attributes;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isListeningToAttributes)
            return;
        if (!this.attributesAreValid())
            return;
        this.setProperty(name, newValue);
    }
    connectedCallback() {
        this.init();
        this.isListeningToAttributes = true;
        if (!this.attributesAreValid())
            return;
        this.render();
        this.setRemainingWidthValue(false);
        this.render();
        this.listenKey();
        if (this.debug)
            this.log();
    }
    init() {
        if (!this.attributesAreValid())
            return;
        this.columns = this.getAttribute('columns') || this.columns;
        this.gridWidth = this.getAttribute('grid-width') || this.gridWidth;
        this.columnWidth = this.getAttribute('column-width') || this.columnWidth;
        this.gapWidth = this.getAttribute('gap-width') || this.gapWidth;
        this.offsetX = this.getAttribute('offset-x') || this.offsetX;
        this.offsetY = this.getAttribute('offset-y') || this.offsetY;
        this.zIndex = this.getAttribute('z-index') || this.zIndex;
        this.color = this.getAttribute('color') || this.color;
        this.key = this.getAttribute('key') || this.key;
        this.debug = !(this.getAttribute('debug') === "false"
            || this.getAttribute('debug') === "0"
            || this.getAttribute('debug') === null);
    }
    attributesAreValid() {
        const columns = this.getAttribute('columns'), gridWidth = this.getAttribute('grid-width'), columnWidth = this.getAttribute('column-width'), gapWidth = this.getAttribute('gap-width');
        let attributesAreValid = true;
        if (!columns) {
            this.warn(GridChecker.error.MISSING_COL_VAL);
            attributesAreValid = false;
        }
        if (!!columns && (isNaN(Number(columns)) || Number(columns) < 2)) {
            this.warn(GridChecker.error.INVALID_COL_VAL);
            attributesAreValid = false;
        }
        if ([gridWidth, columnWidth, gapWidth].filter(value => value === null).length > 1) {
            this.warn(GridChecker.error.MISSING_WIDTH_VAL);
            attributesAreValid = false;
        }
        return attributesAreValid;
    }
    setProperty(attribute, value) {
        switch (attribute) {
            case 'columns':
                this.columns = value;
                this.render();
                this.setRemainingWidthValue(true);
                break;
            case 'grid-width':
                this.gridWidth = value;
                this.render();
                this.setRemainingWidthValue(true);
                break;
            case 'column-width':
                this.columnWidth = value;
                this.render();
                this.setRemainingWidthValue(true);
                break;
            case 'gap-width':
                this.gapWidth = value;
                this.render();
                this.setRemainingWidthValue(true);
                break;
            case 'offset-x':
                this.offsetX = value;
                break;
            case 'offset-y':
                this.offsetY = value;
                break;
            case 'z-index':
                this.zIndex = value;
                break;
            case 'color':
                this.color = value;
                break;
            case 'key':
                this.key = value;
                break;
            case 'debug': this.debug = this.getAttribute('debug') !== null ? true : false;
            default: this.warn(`GridChecker warning: unknown attribute "${attribute}".`);
        }
        if (this.debug)
            this.log();
        this.render();
    }
    setRemainingWidthValue(isUpdate) {
        if (isUpdate) {
            if (!this.attributesAreValid)
                return;
            if (!this.getAttribute('grid-width'))
                this.gridWidth = null;
            if (!this.getAttribute('column-width'))
                this.columnWidth = null;
            if (!this.getAttribute('gap-width'))
                this.gapWidth = null;
        }
        if (!this.gridWidth)
            this.gridWidth = this.getComputedWidthValueFromClientRect('grid-width');
        if (!this.columnWidth)
            this.columnWidth = this.getComputedWidthValueFromClientRect('column-width');
        if (!this.gapWidth)
            this.gapWidth = this.getComputedWidthValueFromClientRect('gap-width');
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
        if (this.debug) {
            this.renderAmount += 1;
            console.log(`rendered: ${this.renderAmount}`);
        }
    }
    getComputedWidthValueFromClientRect(prop) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const n = Number(this.columns);
        if (prop === 'grid-width') {
            const cw = Number((_a = this.shadow.querySelector('.column-container div')) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect().width), gStart = Number((_b = this.shadow.querySelector('.column-container div')) === null || _b === void 0 ? void 0 : _b.getBoundingClientRect().right), gEnd = Number((_c = this.shadow.querySelector('.column-container div:nth-child(2)')) === null || _c === void 0 ? void 0 : _c.getBoundingClientRect().left), gw = gEnd - gStart;
            return `${n * cw + (n - 1) * gw}px`;
        }
        if (prop === 'gap-width') {
            const W = Number((_d = this.shadow.querySelector('.column-container')) === null || _d === void 0 ? void 0 : _d.getBoundingClientRect().width), cw = Number((_e = this.shadow.querySelector('.column-container div')) === null || _e === void 0 ? void 0 : _e.getBoundingClientRect().width);
            return `${(W - n * cw) / (n - 1)}px`;
        }
        if (prop === 'column-width') {
            const W = Number((_f = this.shadow.querySelector('.column-container')) === null || _f === void 0 ? void 0 : _f.getBoundingClientRect().width), gStart = Number((_g = this.shadow.querySelector('.column-container div')) === null || _g === void 0 ? void 0 : _g.getBoundingClientRect().right), gEnd = Number((_h = this.shadow.querySelector('.column-container div:nth-child(2)')) === null || _h === void 0 ? void 0 : _h.getBoundingClientRect().left), gw = gEnd - gStart;
            return `${(W - (n - 1) * gw) / n}px`;
        }
        return '0px';
    }
    listenKey() {
        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === this.key.toLowerCase())
                this.toggleAttribute('hidden');
        });
    }
    getTemplateColumns() {
        let templateColumns = '';
        for (let i = 0; i < Number(this.columns); i++) {
            templateColumns += '<div></div>';
        }
        return templateColumns;
    }
    getStyle() {
        return `
            :host {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                z-index: ${this.zIndex};
                width: 100%;
                height: 100%;
            }
            :host([hidden]) { display: none; }
            .column-container {
                position: relative;
                top: ${this.offsetY};
                left: ${this.offsetX};
                width: ${this.gridWidth};
                height: 100%;
                margin: auto;
                font-size: 0;
            }
            .column-container div {
                display: inline-block;
                width: ${this.columnWidth};
                height: 100%;
                background: ${this.color};
            }
            .column-container div:not(:last-of-type) {
                margin-right: ${this.gapWidth};
            }
        `;
    }
    createElement(options) {
        const gridChecker = document.createElement('grid-checker'), target = options.target || document.body;
        if (options.columns)
            gridChecker.setAttribute('columns', options.columns);
        if (options.gridWidth)
            gridChecker.setAttribute('grid-width', options.gridWidth);
        if (options.columnWidth)
            gridChecker.setAttribute('column-width', options.columnWidth);
        if (options.gapWidth)
            gridChecker.setAttribute('gap-width', options.gapWidth);
        if (options.offsetX)
            gridChecker.setAttribute('offset-x', options.offsetX);
        if (options.offsetY)
            gridChecker.setAttribute('offset-y', options.offsetY);
        if (options.zIndex)
            gridChecker.setAttribute('z-index', options.zIndex);
        if (options.color)
            gridChecker.setAttribute('color', options.color);
        if (options.key)
            gridChecker.setAttribute('key', options.key);
        if (options.debug)
            gridChecker.setAttribute('debug', options.debug);
        target.appendChild(gridChecker);
        if (target !== document.body) {
            gridChecker.style.top = `${target.getBoundingClientRect().top}px`;
            gridChecker.style.height = `${target.getBoundingClientRect().height}px`;
            window.addEventListener('scroll', () => gridChecker.style.top = `${target.getBoundingClientRect().top}px`);
        }
    }
    log() {
        console.table({
            columns: { 'value': this.columns, 'getAttribute()': this.getAttribute('columns') },
            gridWidth: { 'value': this.gridWidth, 'getAttribute()': this.getAttribute('grid-width') },
            columnWidth: { 'value': this.columnWidth, 'getAttribute()': this.getAttribute('column-width') },
            gapWidth: { 'value': this.gapWidth, 'getAttribute()': this.getAttribute('gap-width') },
            offsetX: { 'value': this.offsetX, 'getAttribute()': this.getAttribute('offset-x') },
            offsetY: { 'value': this.offsetY, 'getAttribute()': this.getAttribute('offset-y') },
            zIndex: { 'value': this.zIndex, 'getAttribute()': this.getAttribute('z-index') },
            color: { 'value': this.color, 'getAttribute()': this.getAttribute('color') },
            key: { 'value': this.key, 'getAttribute()': this.getAttribute('key') },
            debug: { 'value': this.debug, 'getAttribute()': this.getAttribute('debug') }
        });
        console.log(this);
    }
    warn(message) {
        console.warn('%c  ', `background: ${this.color}`, message, this);
        if (this.debug)
            this.log();
    }
}
GridChecker.error = {
    MISSING_COL_VAL: 'GridChecker warning: missing value for the attribute: columns (number of columns).',
    MISSING_WIDTH_VAL: 'GridChecker warning: missing width value(s). At least two of the following attributes must be set: grid-width, column-width, gap-width.',
    INVALID_COL_VAL: 'GridChecker warning: integer >= 2 is expected for attribute "columns" value.',
    UNKNOWN_ATTR: 'GridChecker warning: unknown attribute.'
};
GridChecker.attributes = ['columns', 'grid-width', 'column-width', 'gap-width', 'offset-x', 'offset-y', 'z-index', 'color', 'key'];
customElements.define('grid-checker', GridChecker);
