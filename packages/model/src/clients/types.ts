import type { createClient } from './index';

export type RequestInfo = {
    url: string;
    requestInit: RequestInit;
}

export type Client = ReturnType<typeof createClient>;

export type RebornClient = {
    gql?: Client,
    rest?: Client,
};
