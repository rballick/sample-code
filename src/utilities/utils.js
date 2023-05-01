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
 * Capitalizes words in a string - words are delimited by space and passed criteria
 * @param {String} value String to be capitalized
 * @param {String=[]} separators Optional string of word delimiters to add to space
 * @param {String|String[]} [exclude=[]] Optional list of words or value not to be capitalized, will convert string to array(string)
 * @returns {String} Value capitalized according to criteria
 */
const capitalize = (value, separators='', exclude = []) => {
    if (!Array.isArray(exclude)) exclude = [exclude];
    if (exclude.includes(value)) return value;
    separators = ` ${typeof separators === 'string' ? separators : ''}`;
    for (let s of '\\.^$*+?()[{/|') {
        separators = separators.replace(s, String.fromCharCode(92) + s);
    }
    const re = new RegExp(`([${separators}])`);
    const words = value.split(re);
    for (let i = 0; i < words.length; i++) {
        if ([ ...separators, ...exclude ].includes(words[i])) continue;
        let word = words[i].toLowerCase();
        let c = 0;
        while (!/\p{L}/u.test(word.charAt(c)) && c < word.length) c++; 
        if (word.charAt(c)) word = word.replace(word.charAt(c), word.charAt(c).toUpperCase());
        words[i] = word;
    }
    return words.join('');
}

/**
 * Converts bytes to type specified or largest type
 * @param {Number} bytes Amount of bytes to be convertd
 * @param {String} [size] Byte type to be returned
 * @returns {Number} Bytes converted to type specified or largest type
 */
export const formatBytes = (bytes, size) => {
    bytes = Number(bytes);
    if (isNaN(bytes) || bytes === 0) return `0${size || 'B'}`;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = sizes.indexOf(size) > -1 ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(1024));
    const byte_size = (bytes / Math.pow(1024, i)).toFixed(2) * 1;
    return  `${byte_size === 0 && bytes > 0 ? '<1 ' : byte_size } ${sizes[i]}`;
}

/**
 * Converts milliseconds to hours, minutes, seconds and milliseconds
 * @param {Number} milliseconds Milliseconds to be converted  
 * @returns {Number[]} [hours, minutes, seconds, milliseconds]
 */
export const millisecondsToHours = (milliseconds) => {
    const increments = [60, 60, 1000];
    const time = increments.reduce((obj, increment, index) => {
        const divisor = increments.slice(index).reduce((increment, index) => increment * index, 1);
        obj.push(Math.floor(milliseconds / divisor));
        milliseconds = milliseconds % divisor;
        return obj;
    },[]);
    return [ ...time, milliseconds ];
}

/**
 * Converts milliseconds to formatted time
 * @param {Number} milliseconds 
 * @param {'h'|'m'|'s'|'ms'} [start=h] Maximum time increment to display - will display higher if non-zero value
 * @param {Boolean} [leadingZero=false] Whether to include leading zero in single digit numbers
 * @param {Boolean} includeMilliseconds Whether to include remaining milliseconds in returned value
 * @returns {String} {h}h:{m}m:{s}s{.ms}
 */
export const formatMilliseconds = (milliseconds, start='h', leadingZero=false, includeMilliseconds=false) => {
    const setMilliseconds = () => {
        if (!includeMilliseconds) return '';
        let m = milliseconds.toString();
        while (m.length < 3) m = `0${m}`;
        return `.${m}`;
    }

    const time = millisecondsToHours(milliseconds);
    const increments = ['h','m','s','ms'];
    if (typeof start !== 'string') start = 'h';
    start = increments.findIndex(item => item === start.toLowerCase());
    milliseconds = time.pop();
    return `${time.reduce((obj, value, index) => {
        if (value === 0 && index < start) return obj;
        obj.push(`${ leadingZero && value < 10 ? '0' : ''}${value}`);
        return obj;
    }, []).join(':')}${milliseconds > 0 ? setMilliseconds(milliseconds) : ''}`;

}

/**
 * Used with javascript sort function to sort an array of object based on passed criteria
 * @param {Object} a First object to be compared
 * @param {Object} b Second object to be compared
 * @param {String|Object|String[]|Object[]} params String - property to sorted by OR Object - { path: String - property to be sorted
 * by, [reverse: Boolean - true = DESC sort,  false = ASC sort] } OR Array - multiple critera, Strings and/or Objects, in order of 
 * precedence 
 * @returns {Number} -1, 0, 1
 */
export const objSort = (a, b, params) => {
    if (!params) return 0;
    if (!Array.isArray(params)) params = [params];
    for (let param of params) {
        if (typeof param !== 'object') param = [ param, false ];
        if (!Array.isArray(param)) param = [ param.path, param.reverse ];
        const [ path, reverse ] = param;
        const keys = path.split('.');
        let obj1 = reverse ? b : a;
        let obj2 = reverse ? a : b;
        for (const key of keys) {
            if (obj1 === undefined || obj2 === undefined) break;
            obj1 = obj1[key];
            obj2 = obj2[key];
        }
        if (obj1 === undefined || obj2 === undefined) continue;
        const compare = obj1.toString().localeCompare(obj2.toString(), undefined, { numeric: true, caseFirst: 'upper' });
        if (compare !== 0) return compare
    }
    return 0;
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

export default { getRect, setClassName, capitalize, objSort, isScrollBottom, formatMilliseconds, millisecondsToHours }