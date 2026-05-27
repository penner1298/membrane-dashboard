import OpenAI from 'openai';
import { Swarm } from './swarm';
export interface MembraneOptions {
    baseUrl?: string;
    apiKey?: string;
}
export declare class Membrane {
    client: OpenAI;
    swarm: Swarm;
    baseUrl: string;
    apiKey: string;
    constructor(options?: MembraneOptions);
}
