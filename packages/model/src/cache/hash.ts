function encode(str: string) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) + 1);
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