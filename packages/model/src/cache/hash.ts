/**
 * 将hash字符串中的 '<' 和 '>' 转义
 * @link https://github.com/yahoo/serialize-javascript/blob/main/index.js
 */
const ESCAPED_CHARS: Record<string, string> = {
    '<': '\\u003C',
    '>': '\\u003E',
    '/': '\\u002F',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
}
export function encode(str: string) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const hashChar = String.fromCharCode(str.charCodeAt(i) + 1);
        result += ESCAPED_CHARS[hashChar] ?? hashChar
    }
    return result;
}

export function hash(params: any): string {
    if (params === null) {
        return encode('null-null');
    }

    if (Array.isArray(params)) {
        return encode(`array-${params.map(hash).join('-')}`);
    }

    if (typeof params === 'function') {
        throw new Error('Function hash is not support');
    }

    if (typeof params === 'object') {
        return encode(`object-${Object.keys(params).sort().map(key => `${key}-${hash(params[key])}`).join('-')}`);
    }

    return encode(`${typeof params}-${params}`);
}
