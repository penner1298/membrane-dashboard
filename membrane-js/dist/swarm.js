"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Swarm = void 0;
class Swarm {
    constructor(membrane) {
        this.membrane = membrane;
    }
    async plan(payload) {
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
    async map(payload) {
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
exports.Swarm = Swarm;
