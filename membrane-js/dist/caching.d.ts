import { Membrane } from './client';
export declare class CacheManager {
    private membrane;
    constructor(membrane: Membrane);
    getStatus(): Promise<any>;
}
