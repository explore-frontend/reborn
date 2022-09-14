import { computed, Ref } from "vue"
import { isDef } from "./core"

export interface InfoDataType<T> {
    data: T | undefined
    loading: boolean
    error: any
}

/**
digraph {
    Empty -> Loading; # 第一次请求
    Loading -> Error; # 第一次请求失败
    Error -> Loading; # 重新请求，按第一次请求算
    Loading -> Done; # 第一次请求完成，数据返回
    Done -> Refresh; # 刷新数据请求
    Refresh -> Done; # 刷新数据请求完成
    Refresh -> RefreshError; # 刷新数据失败
    RefreshError -> Refresh; # 重新刷新数据
}
 */
export enum StateStatus {
    /**
     * 空状态，出现在进入页面并且没有任何请求的时候。
     */
    Empty = 'Empty',
    /**
     * 载入状态，出现在进入页面且发起第一次请求的时候。
     */
    Loading = 'Loading',
    /**
     * 完成状态，出现在有数据并且没有错误且没有请求的时候。
     */
    Done = 'Done',
    /**
     * 错误状态，出现在进入页面第一次请求就失败的时候。
     */
    Error = 'Error',
    /**
     * 刷新状态，出现在进入页面完成请求后，再次发起刷新数据的请求的时候。
     */
    Refresh = 'Refresh',
    /**
     * 刷新错误状态，出现在刷新数据的请求失败的时候。
     */
    RefreshError = 'RefreshError',
}

export interface EmptyState {
    status: StateStatus.Empty
}

export interface LoadingState {
    status: StateStatus.Loading
    error: unknown | undefined
}

export interface DoneState<T> {
    status: StateStatus.Done
    data: T
}

export interface ErrorState {
    status: StateStatus.Error
    error: unknown
}

export interface RefreshState<T> {
    status: StateStatus.Refresh
    data: T
    error: unknown | undefined
}

export interface RefreshErrorState<T> {
    status: StateStatus.RefreshError
    data: T
    error: unknown
}

export type State<T> =
    | EmptyState
    | LoadingState
    | DoneState<T>
    | ErrorState
    | RefreshState<T>
    | RefreshErrorState<T>

export type DoneLikeState<T> =
    | DoneState<T>
    | RefreshState<T>
    | RefreshErrorState<T>

export type LoadingLikeState<T> =
    | LoadingState
    | RefreshState<T>

export type ErrorLikeState<T> =
    | ErrorState
    | RefreshErrorState<T>

export function isEmptyState<T>(v: State<T>): v is EmptyState {
    return v.status === StateStatus.Empty
}

export function isLoadingState<T>(v: State<T>): v is LoadingState {
    return v.status === StateStatus.Loading
}

export function isDoneState<T>(v: State<T>): v is DoneState<T> {
    return v.status === StateStatus.Done
}

export function isErrorState<T>(v: State<T>): v is ErrorState {
    return v.status === StateStatus.Error
}

export function isRefreshState<T>(v: State<T>): v is RefreshState<T> {
    return v.status === StateStatus.Refresh
}

export function isRefreshErrorState<T>(v: State<T>): v is RefreshErrorState<T> {
    return v.status === StateStatus.RefreshError
}

export function isLoadingLikeState<T>(v: State<T>): v is LoadingLikeState<T> {
    switch (v.status) {
        case StateStatus.Loading:
        case StateStatus.Refresh:
            return true
        default:
            return false
    }
}

export function isDoneLikeState<T>(v: State<T>): v is DoneLikeState<T> {
    switch (v.status) {
        case StateStatus.Done:
        case StateStatus.Refresh:
        case StateStatus.RefreshError:
            return true
        default:
            return false
    }
}

export function isErrorLikeState<T>(v: State<T>): v is ErrorLikeState<T> {
    switch (v.status) {
        case StateStatus.Error:
        case StateStatus.RefreshError:
            return true;
        default:
            return false;
    }
}

export function assertLoadingLikeState<T>(v: State<T>): asserts v is LoadingLikeState<T> {
    if (!isLoadingLikeState(v)) {
        throw new Error(`Expected LoadingLikeState, but got ${v.status}`)
    }
}

export function assertDoneLikeState<T>(v: State<T>): asserts v is DoneLikeState<T> {
    if (!isDoneLikeState(v)) {
        throw new Error(`Expected DoneLikeState, but got ${v.status}`)
    }
}

export function assertErrorLikeState<T>(v: State<T>): asserts v is ErrorLikeState<T> {
    if (!isErrorLikeState(v)) {
        throw new Error(`Expected ErrorLikeState, but got ${v.status}`)
    }
}

export function assertEmptyState<T>(v: State<T>): asserts v is EmptyState {
    if (!isEmptyState(v)) {
        throw new Error(`Expected EmptyState, but got ${v.status}`)
    }
}

export function assertLoadingState<T>(v: State<T>): asserts v is LoadingState {
    if (!isLoadingState(v)) {
        throw new Error(`Expected LoadingState, but got ${v.status}`)
    }
}

export function assertDoneState<T>(v: State<T>): asserts v is DoneState<T> {
    if (!isDoneState(v)) {
        throw new Error(`Expected DoneState, but got ${v.status}`)
    }
}

export function assertErrorState<T>(v: State<T>): asserts v is ErrorState {
    if (!isErrorState(v)) {
        throw new Error(`Expected ErrorState, but got ${v.status}`)
    }
}

export function assertRefreshState<T>(v: State<T>): asserts v is RefreshState<T> {
    if (!isRefreshState(v)) {
        throw new Error(`Expected RefreshState, but got ${v.status}`)
    }
}

export function assertRefreshErrorState<T>(v: State<T>): asserts v is RefreshErrorState<T> {
    if (!isRefreshErrorState(v)) {
        throw new Error(`Expected RefreshErrorState, but got ${v.status}`)
    }
}

export function useState<T>(info: InfoDataType<T>): Ref<State<T>> {
    return computed(() => {
        if (info.loading) {
            if (!isDef(info.data)) {
                return { status: StateStatus.Loading, error: info.error }
            }
            return { status: StateStatus.Refresh, data: info.data, error: info.error }
        }
        if (isDef(info.error)) {
            if (!isDef(info.data)) {
                return { status: StateStatus.Error, error: info.error }
            }
            return { status: StateStatus.RefreshError, data: info.data, error: info.error }
        }
    
        if (!isDef(info.data)) {
            return { status: StateStatus.Empty }
        }
        return { status: StateStatus.Done, data: info.data }
    })
}
