/** @internal */
const instanceCache = new WeakMap<object, any>();

/**
 * Wraps a given class method/getter.
 *
 * The wrapped function will only run one time,
 * and the first returned value will be cached and returned in every subsequent call.
 */
export const memoize = (): MethodDecorator => {
    const memo = (func: Function) => {
        const uid = Symbol(); // Create a globally unique identifier for the given function.

        return function (...args: any) {
            // @ts-ignore
            const self = this;
            const cache = instanceCache.get(self) || {};

            if (cache.hasOwnProperty(uid)) return cache[uid];
            const ret = func.apply(self, args);
            cache[uid] = ret;
            instanceCache.set(self, cache);
            return ret;
        }
    };

    return (target: any, propertyKey: string|symbol, descriptor: PropertyDescriptor) => {
        if ('value' in descriptor) {
            const func = descriptor.value;
            descriptor.value = memo(func);
        } else if ('get' in descriptor) {
            const func = descriptor.get;
            if (func) {
                descriptor.get = memo(func);
            }
        }
        return descriptor;
    }
}

/**
 * Simple method to enable invalidating all cached memoized data for a given instance.
 * @param object Any constructed object with data stored in the cache.
 */
export function invalidateCache (object: any) {
    instanceCache.delete(object);
}
