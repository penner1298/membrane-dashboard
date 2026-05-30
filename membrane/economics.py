from typing import Any, Optional
from litellm import completion_cost
from membrane.config import (
    FLASH_INPUT_COST,
    FLASH_OUTPUT_COST,
    PRO_INPUT_COST,
    PRO_OUTPUT_COST,
)

def calculate_token_savings(model_name: str, raw_tokens: int, optimized_tokens: int):
    # Static industry baseline rates per 1M tokens
    if "flash" in model_name.lower():
        input_rate = 0.075
        output_rate = 0.30
    else:
        input_rate = 1.25
        output_rate = 5.00
        
    actual_cost = (optimized_tokens / 1000000) * input_rate
    hypothetical_cost = (raw_tokens / 1000000) * input_rate
    net_savings = max(0.0, hypothetical_cost - actual_cost)
    
    return {
        "actual_cost_incurred": actual_cost,
        "gross_unoptimized_cost": hypothetical_cost,
        "net_enterprise_savings": net_savings
    }

def calc_cost(model_name: str, in_tokens: int, out_tokens: int, response_object: Optional[Any] = None) -> float:
    if "gemini" in model_name.lower():
        if "flash" in model_name.lower():
            return (in_tokens / 1000000) * FLASH_INPUT_COST + (out_tokens / 1000000) * FLASH_OUTPUT_COST
        else:
            return (in_tokens / 1000000) * PRO_INPUT_COST + (out_tokens / 1000000) * PRO_OUTPUT_COST
            
    if any(p in model_name.lower() for p in ["ollama/", "local/", "llama"]):
        return 0.0
    try:
        if response_object:
            calculated = completion_cost(completion_response=response_object)
        else:
            calculated = completion_cost(model=model_name, prompt_tokens=in_tokens, completion_tokens=out_tokens)
        if calculated and calculated > 0:
            return float(calculated)
    except Exception:
        pass
    if "flash" in model_name.lower():
        return (in_tokens / 1000000) * FLASH_INPUT_COST + (out_tokens / 1000000) * FLASH_OUTPUT_COST
    else:
        return (in_tokens / 1000000) * PRO_INPUT_COST + (out_tokens / 1000000) * PRO_OUTPUT_COST
