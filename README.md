# Grid checker

Grid checker is a simple tool I developped to make sure an integration respects the designer's original grid.  
It simply creates a highly configurable grid directly in the document, using ES6 classes and Web components.


## Installation

* Classic way:
    ```html
    <script src="path/to/gridchecker.js"></script>
    ```

* Using ES6 modules:
    ```javascript
    import { GridChecker } from './path/to/gridchecker.module.js'
    ```

## Render

You can then add as many gridchecker as you want, using either the custom tag `<grid-checker>` directly in the HTML document, or the `GridChecker()` constructor in a JavaScript file, or any combination of both.

* HTML

    ```html
    <grid-checker
        columns="12"
        grid-width="94rem"
        gap-width="2rem">
    </grid-checker>
    ```

* JavaScript

    ```javascript
    const gridcheck = new GridChecker({
        columns: 12,
        gridWidth: '94rem',
        gapWidth: '2rem'
    })
    ```

## Attributes

Here is the list of available attributes to set up the grid.

| HTML attribute | JavaScript property | Description | Importance | Default value
| ---- | ---------- | ----------- | ---------- | ------------- |
| `columns` | `columns` | Number of columns. | **required** | `null` |
| `grid-width` | `gridWidth` | CSS value for the grid width. | **required** \| *optional* \* | `null` |
| `column-width` | `columnWidth` | CSS value for columns width. | **required** \| *optional* \* | `null` |
| `gap-width` | `gapWidth` | CSS value for the space between two columns. | **required** \| *optional* \* | `null` |
| `offset-x` | `offsetX` | CSS value for the horizontal offset. | *optional* | `"0"` |
| `offset-y` | `offsetY` | CSS value for the vertical offset. | *optional* | `"0"` |
| `z-index` | `zIndex` | CSS value for z-index. | *optional* | `"1000000"` |
| `color` | `color` | CSS value for the grid's color. | *optional* | `"rgba(200, 50, 200, .4)"` |
| `key` | `key` | A single character used to toggle the grid on key down. | *optional* | `"g"` |
| N/A | `target` | HTML Element in which the grid should be appended, when using the constructor. | *optional* | `document.body` |
| `debug` | `debug` | If not null nor false nor 0, shows a table of all values on creation and after every updates | *optional* | `false`

\*: Two of the three `*-width` values are **required**, the last one is *optional* as it is computed if not also set by the user.