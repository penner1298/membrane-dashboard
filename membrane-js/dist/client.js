"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Membrane = void 0;
const openai_1 = __importDefault(require("openai"));
const swarm_1 = require("./swarm");
class Membrane {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || process.env.MEMBRANE_BASE_URL || 'https://membrane-api.com/v1';
        this.apiKey = options.apiKey || process.env.MEMBRANE_API_KEY || 'local';
        this.client = new openai_1.default({
            baseURL: this.baseUrl,
            apiKey: this.apiKey,
            dangerouslyAllowBrowser: true // Enable use in sandbox frontends if needed
        });
        this.swarm = new swarm_1.Swarm(this);
    }
}
exports.Membrane = Membrane;
