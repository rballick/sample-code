

/**
 * Extends the getBoundingClientRect with elem measurements (client height, client width, page scroll top and scroll left, element scroll top and scroll left, border width)
 * @param {HTMLElement} elem Element being analyzed
 * @returns {{ x: Number, y: Number, top: Number, bottom: Number, right: Number, width: Number, height: Number, clientHeight: Number, clientWith: Number, bodyTop: Number}}
 */
export const getRect = (elem) => {
    const bodyTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const bodyLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
    const scrollTop = elem.scrollTop || 0;
    const scrollLeft = elem.scrollLeft || 0;
    const borderWidth = ['top', 'right', 'bottom', 'left'].reduce((width, side) => {
        return { ...width, [side]: parseInt(window.getComputedStyle(elem, null).getPropertyValue(`border-${side}-width`),10)}
    }, {});
    let { x, y, top, left, bottom, right, width, height } = elem.getBoundingClientRect();
    const rect = { x, y, top, left, bottom, right, width, height };
    rect.offset = {};
    ['y','top','bottom','x','left','right'].forEach(item => rect.offset[item] = rect[item] + (['y','top','bottom'].includes(item) ? bodyTop : bodyLeft));
    Object.assign(rect, { clientHeight: elem.clientHeight, clientWidth: elem.clientWidth, bodyTop, bodyLeft, scrollTop, scrollLeft, borderWidth });
    return rect;
};

/**
 * Converts css style classname to css module classnames
 * @param {String|String[]=[]} classnames Stylesheet name(s) to be converted - if string converts to array
 * @param {Object|Object[]=[]} styles Mapping of stylesheet class names to module class names 
 * @returns {String} Space delimited list of all style classname and module(s) classname(s)
 */
export const setClassName = (classnames = [], styles = []) => {
    if (!Array.isArray(styles)) styles = [styles];
    if (!Array.isArray(classnames)) classnames = [classnames];
    classnames.forEach((classname) => {
        styles.forEach((style) => {
            if (style[classname]) classnames.push(style[classname]);
        });
    })

    return classnames.join(' ');
}

/**
 * Determines if elements scroll is within 30px of the bottom of the element
 * @param {HTMLElement} elem Document element being analyzed
 * @returns {Boolean} true if within 30px of bottom, false if not
 */
export const isScrollBottom = (elem) => {
    const childHeight = getRect(elem.firstChild).height;
    const rect = getRect(elem);
    const ratio = rect.height / childHeight;
    const scrollerHeight = ratio * rect.height;
    const scrollTop = ratio * rect.scrollTop;
    return scrollerHeight + scrollTop + 30 > rect.height;
}

export default { getRect, setClassName, isScrollBottom }