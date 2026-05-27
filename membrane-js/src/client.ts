import OpenAI from 'openai';
import { Swarm } from './swarm';

export interface MembraneOptions {
  baseUrl?: string;
  apiKey?: string;
}

export class Membrane {
  public client: OpenAI;
  public swarm: Swarm;
  public baseUrl: string;
  public apiKey: string;

  constructor(options: MembraneOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.MEMBRANE_BASE_URL || 'https://membrane-api.com/v1';
    this.apiKey = options.apiKey || process.env.MEMBRANE_API_KEY || 'local';
    this.client = new OpenAI({
      baseURL: this.baseUrl,
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true // Enable use in sandbox frontends if needed
    });
    this.swarm = new Swarm(this);
  }
}
