import { useRestQuery } from './fn-type';

const query = useRestQuery<{
    user: string;
    isAdmin: boolean;
}>({
    url: '/',
});