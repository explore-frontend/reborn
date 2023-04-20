import type { QueryResult } from '../../../operations/types';

import { BaseModel } from '../../class-type';
import { restQuery } from '../../decorators';

export class CustomModel extends BaseModel {
    private a = 1;

    get b() {
        return this.a + 1;
    }

    set b(value: number) {
        this.a = value - 1;
    }

    add(num: number) {
        this.a += num;
    }

    min = (num: number) => {
        this.a -= num;
    }

    @restQuery<CustomModel>({
        url: '/query',
        variables() {
            return {
                a: this.a,
            };
        },
        skip() {
            return this.a === 1;
        }
    })
    private query!: QueryResult<{
        a: number;
        b: number;
    }>;

    get data() {
        return this.query.data;
    }

    get loading() {
        return this.query.loading;
    }

    get error() {
        return this.query.error;
    }

    refetch() {
        return this.query.refetch();
    }

    c = 10;
};

export class CustomClassWithExtends extends CustomModel {
    get d() {
        return this.b + 10;
    }

    @restQuery<CustomClassWithExtends>({
        url: '/query1',
        variables() {
            return {
                d: this.d,
            };
        },
        skip() {
            return this.d === 12;
        }
    })
    private query1!: QueryResult<{
        a: number;
        b: number;
    }>;

    get data1() {
        return this.query1.data;
    }

    get loading1() {
        return this.query1.loading;
    }

    get error1() {
        return this.query1.error;
    }
}