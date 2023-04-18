import type { Request, Response, NextFunction } from 'express';

function add() {

}

function multiple() {

}

function more() {

}

export async function mockAPI (req: Request, res: Response, next: NextFunction) {
    console.error('Here comes a API call');
    if (req.params.action === 'add') {
        res.json({
            a: 1,
        });
        return;
    }

    if (req.params.action === 'multiple') {
        res.json({
            b: 2,
        });
        return;
    }

    if (req.params.action === 'more') {
        res.json({
            c: 3,
        });
        return;
    }

    res.json({
        d: 4,
    });
}