import { Membrane } from './client';

export class Swarm {
  private membrane: Membrane;

  constructor(membrane: Membrane) {
    this.membrane = membrane;
  }

  async plan(payload: any): Promise<any> {
    const url = `${this.membrane.baseUrl.replace(/\/$/, '')}/swarm/plan`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.membrane.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Membrane swarm.plan failed (${response.status}): ${errorText}`);
    }
    return response.json();
  }

  async map(payload: any): Promise<any> {
    const url = `${this.membrane.baseUrl.replace(/\/$/, '')}/swarm/map`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.membrane.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Membrane swarm.map failed (${response.status}): ${errorText}`);
    }
    return response.json();
  }
}
