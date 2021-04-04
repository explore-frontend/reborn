import Vue from 'vue';

type ObservableData<DataType> = {
    loading: boolean;
    data: DataType;
    error: any;
};

export function initDataType<T, P>(model: T, data: P) {
    const observableData: ObservableData<P> = Vue.observable({
        data,
        loading: false,
        error: null
    });

    Object.defineProperty(model, 'data', {
        get() {
            return observableData.data
        },
        set(data: P) {
            observableData.data = data;
        },
        configurable: true,
        enumerable: false,
    });

    Object.defineProperty(model, 'loading', {
        get() {
            return observableData.loading
        },
        set(loading: boolean) {
            observableData.loading = loading;
        },
        configurable: true,
        enumerable: false,
    });

    Object.defineProperty(model, 'error', {
        get() {
            return observableData.error
        },
        set(error: any) {
            observableData.error = error;
        },
        configurable: true,
        enumerable: false,
    });
}