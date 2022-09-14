export function isDef<T>(v: T): v is NonNullable<T> {
    return v !== undefined && v !== null;
}
