export class GridChecker extends HTMLElement {
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
        this.isListeningToAttributes = false;
        this.renderAmount = 0;
        this.html = this;
        this.shadow = this.attachShadow({ mode: 'open' });
        if (options)
            this.createElement(options);
    }
    static get observedAttributes() {
        return GridChecker.attributes;
    }
    attributeChangedCallback(name, _, value) {
        if (!this.isListeningToAttributes)
            return;
        if (!this.attributesAreValid())
            return;
        this.setProperty(name, value);
    }
    connectedCallback() {
        this.init();
        this.render();
        this.setRemainingWidthValue(false);
        this.render();
        this.listenKey();
        this.isListeningToAttributes = true;
        if (this.debug)
            this.log();
    }
    init() {
        if (!this.attributesAreValid())
            return;
        this.columns = Math.floor(Number(this.getAttribute('columns'))) || this.columns;
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
                this.columns = Math.floor(Number(value));
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
            case 'debug':
                this.debug = !(this.getAttribute('debug') === "false"
                    || this.getAttribute('debug') === "0"
                    || this.getAttribute('debug') === null);
                break;
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
    getComputedWidthValueFromClientRect(attr) {
        var _a;
        const ctr = this.shadow.querySelector('.column-container'), col = ctr === null || ctr === void 0 ? void 0 : ctr.querySelector('div'), n = Number(this.columns), W = Number(ctr === null || ctr === void 0 ? void 0 : ctr.getBoundingClientRect().width), cw = Number(col === null || col === void 0 ? void 0 : col.getBoundingClientRect().width), gw = Number((_a = ctr === null || ctr === void 0 ? void 0 : ctr.querySelector('div:nth-child(2)')) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect().left)
            - Number(col === null || col === void 0 ? void 0 : col.getBoundingClientRect().right);
        const compute = {
            'grid-width': `${n * cw + (n - 1) * gw}px`,
            'column-width': `${(W - (n - 1) * gw) / n}px`,
            'gap-width': `${(W - n * cw) / (n - 1)}px`
        };
        return compute[attr];
    }
    listenKey() {
        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === this.key.toLowerCase())
                this.toggleAttribute('hidden');
        });
    }
    getTemplateColumns() {
        return ([...Array(this.columns)]
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
        this.html = gridChecker;
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
