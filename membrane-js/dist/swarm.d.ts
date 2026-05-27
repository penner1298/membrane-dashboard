import { Membrane } from './client';
export declare class Swarm {
    private membrane;
    constructor(membrane: Membrane);
    plan(payload: any): Promise<any>;
    map(payload: any): Promise<any>;
}
