import type { ComputedRef } from 'vue-demi';

import { computed } from 'vue-demi';
import { isDef } from './core';

export interface InfoDataType<T> {
    data: T | undefined
    loading: boolean
    error: any
}

enum NetworkStatus {
    /**
     * The query has never been run before and the query is now currently running. A query will still
     * have this network status even if a partial data result was returned from the cache, but a
     * query was dispatched anyway.
     */
    loading = 1,
    /**
     * If `setVariables` was called and a query was fired because of that then the network status
     * will be `setVariables` until the result of that query comes back.
     */
    setVariables = 2,
    /**
     * Indicates that `fetchMore` was called on this query and that the query created is currently in
     * flight.
     */
    fetchMore = 3,
    /**
     * Similar to the `setVariables` network status. It means that `refetch` was called on a query
     * and the refetch request is currently in flight.
     */
    refetch = 4,
    /**
     * Indicates that a polling query is currently in flight. So for example if you are polling a
     * query every 10 seconds then the network status will switch to `poll` every 10 seconds whenever
     * a poll request has been sent but not resolved.
     */
    poll = 6,
    /**
     * No request is in flight for this query, and no errors happened. Everything is OK.
     */
    ready = 7,
    /**
     * No request is in flight for this query, but one or more errors were detected.
     */
    error = 8,
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

export type DoneLikeStatus =
    | StateStatus.Done
    | StateStatus.Refresh
    | StateStatus.RefreshError;

export type LoadingLikeStatus =
    | StateStatus.Loading
    | StateStatus.Refresh;

export type ErrorLikeStatus =
    | StateStatus.Error
    | StateStatus.RefreshError;

export function isEmptyState(v: StateStatus): v is StateStatus.Empty {
    return v === StateStatus.Empty
}

export function isLoadingState(v: StateStatus): v is StateStatus.Loading {
    return v === StateStatus.Loading
}

export function isDoneState(v: StateStatus): v is StateStatus.Done {
    return v === StateStatus.Done
}

export function isErrorState(v: StateStatus): v is StateStatus.Error {
    return v === StateStatus.Error
}

export function isRefreshState(v: StateStatus): v is StateStatus.Refresh {
    return v === StateStatus.Refresh
}

export function isRefreshErrorState(v: StateStatus): v is StateStatus.RefreshError {
    return v === StateStatus.RefreshError
}

export function isLoadingLikeState(v: StateStatus): v is LoadingLikeStatus {
    switch (v) {
        case StateStatus.Loading:
        case StateStatus.Refresh:
            return true
        default:
            return false
    }
}

export function isDoneLikeState<T>(v: StateStatus): v is DoneLikeStatus {
    switch (v) {
        case StateStatus.Done:
        case StateStatus.Refresh:
        case StateStatus.RefreshError:
            return true
        default:
            return false
    }
}

export function isErrorLikeState<T>(v: StateStatus): v is ErrorLikeStatus {
    switch (v) {
        case StateStatus.Error:
        case StateStatus.RefreshError:
            return true;
        default:
            return false;
    }
}

export function assertLoadingLikeState<T>(v: StateStatus): asserts v is LoadingLikeStatus {
    if (!isLoadingLikeState(v)) {
        throw new Error(`Expected LoadingLikeState, but got ${v}`)
    }
}

export function assertDoneLikeState<T>(v: StateStatus): asserts v is DoneLikeStatus {
    if (!isDoneLikeState(v)) {
        throw new Error(`Expected DoneLikeState, but got ${v}`)
    }
}

export function assertErrorLikeState<T>(v: StateStatus): asserts v is ErrorLikeStatus {
    if (!isErrorLikeState(v)) {
        throw new Error(`Expected ErrorLikeState, but got ${v}`)
    }
}

export function assertEmptyState<T>(v: StateStatus): asserts v is StateStatus.Empty {
    if (!isEmptyState(v)) {
        throw new Error(`Expected EmptyState, but got ${v}`)
    }
}

export function assertLoadingState<T>(v: StateStatus): asserts v is StateStatus.Loading {
    if (!isLoadingState(v)) {
        throw new Error(`Expected LoadingState, but got ${v}`)
    }
}

export function assertDoneState<T>(v: StateStatus): asserts v is StateStatus.Done {
    if (!isDoneState(v)) {
        throw new Error(`Expected DoneState, but got ${v}`)
    }
}

export function assertErrorState<T>(v: StateStatus): asserts v is StateStatus.Error {
    if (!isErrorState(v)) {
        throw new Error(`Expected ErrorState, but got ${v}`)
    }
}

export function assertRefreshState<T>(v: StateStatus): asserts v is StateStatus.Refresh {
    if (!isRefreshState(v)) {
        throw new Error(`Expected RefreshState, but got ${v}`)
    }
}

export function assertRefreshErrorState<T>(v: StateStatus): asserts v is StateStatus.RefreshError {
    if (!isRefreshErrorState(v)) {
        throw new Error(`Expected RefreshErrorState, but got ${v}`)
    }
}

export function useStatus<T>(info: InfoDataType<T>): ComputedRef<StateStatus> {
    return computed(() => {
        if (info.loading) {
            if (!isDef(info.data)) {
                return StateStatus.Loading;
            }
            return StateStatus.Refresh;
        }
        if (isDef(info.error)) {
            if (!isDef(info.data)) {
                return StateStatus.Error;
            }
            return StateStatus.RefreshError;
        }

        if (!isDef(info.data)) {
            return StateStatus.Empty;
        }
        return StateStatus.Done;
    });
}
