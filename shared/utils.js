/**
 * Converts bytes to type specified or largest type
 * @param {Number} bytes Amount of bytes to be convertd
 * @param {String} [size] Byte type to be returned
 * @returns {Number} Bytes converted to type specified or largest type
 */
const formatBytes = (bytes, size) => {
    bytes = Number(bytes);
    if (isNaN(bytes) || bytes === 0) return `0${size || 'B'}`;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = sizes.indexOf(size) > -1 ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(1024));
    const byte_size = (bytes / Math.pow(1024, i)).toFixed(2) * 1;
    return  `${byte_size === 0 && bytes > 0 ? '<1 ' : byte_size } ${sizes[i]}`;
}

/**
 * Converts milliseconds to formatted time
 * @param {Number} milliseconds 
 * @param {'h'|'m'|'s'|'ms'} [start=h] Maximum time increment to display - will display higher if non-zero value
 * @param {Boolean} [leadingZero=false] Whether to include leading zero in single digit numbers
 * @param {Boolean} includeMilliseconds Whether to include remaining milliseconds in returned value
 * @returns {String} {h}h:{m}m:{s}s{.ms}
 */
const formatMilliseconds = (milliseconds, start='h', leadingZero=false, includeMilliseconds=false) => {
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
 * Formats a string for alphanumeric sorting
 * @param {String} value String to be formatted 
 * @returns {String} String formatted for alphanumeric sorting
 */
const setAlpha = (value) => {
    const ret = [];
    const words = value.toLowerCase().split(' ').filter(word => /[\p{L}\p{N}]/u.test(word));
    if (['a', 'an', 'the'].includes(words[0])) words.push(words.shift());
    for (let i = 0; i < words.length; i++) {
        ret.push(words[i].replace(/[^\p{L}\p{N}]/ug,''));
    }
    return ret.join(' ');
}

/**
 * Converts milliseconds to hours, minutes, seconds and milliseconds
 * @param {Number} milliseconds Milliseconds to be converted  
 * @returns {Number[]} [hours, minutes, seconds, milliseconds]
 */
const millisecondsToHours = (milliseconds) => {
    const increments = [60, 60, 1000];
    const time = increments.reduce((obj, increment, index) => {
        const divisor = increments.slice(index).reduce((increment, index) => increment * index, 1);
        obj.push(Math.floor(milliseconds / divisor));
        milliseconds = milliseconds % divisor;
        return obj;
    },[]);
    time.push(milliseconds);
    return time;
}

/**
 * Capitalizes words in a string - words are delimited by space and passed criteria
 * @param {String} value String to be capitalized
 * @param {String} [separators=''] Optional string of word delimiters to add to space
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
        if ([].concat(separators, exclude).includes(words[i])) continue;
        let word = words[i].toLowerCase();
        let c = 0;
        while (!/\p{L}/u.test(word.charAt(c)) && c < word.length) c++; 
        if (word.charAt(c)) word = word.replace(word.charAt(c), word.charAt(c).toUpperCase());
        words[i] = word;
    }
    return words.join('');
}

/**
 * A quick sort function
 * @param {Array} arr Array to be sorted 
 * @param {Function} [formatter = (value) => { return value }] Function to add formatting to value being compared 
 * @param {*} [key] Key to be sorted on if array value is an object 
 * @returns {Array} Sorted array
 */
const quickSort = (arr, formatter=(value) => { return value }, key, defaultValue = '') => {
    if (arr.length <= 1) {
      return arr;
    }      
    const pivot = arr[0];

    const leftArr = [];
    const rightArr = [];
    const compare1 = formatter(key ? (pivot[key] || defaultValue) : pivot);
    for (let i = 1; i < arr.length; i++) {
        const compare2 = formatter(key ? (arr[i][key] || defaultValue) : arr[i]);
        if (compare2 < compare1) {
            leftArr.push(arr[i]);
        } else {
            rightArr.push(arr[i]);
        }
    }
  
    return [].concat(quickSort(leftArr, formatter, key), pivot, quickSort(rightArr, formatter, key));
};

exports.capitalize = capitalize;
exports.formatBytes = formatBytes;
exports.formatMilliseconds = formatMilliseconds;
exports.millisecondsToHours = millisecondsToHours;
exports.quickSort = quickSort;
exports.setAlpha = setAlpha;
