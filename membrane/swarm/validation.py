import json
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from pydantic import BaseModel

def validate_criteria_types(criteria: Any) -> None:
    if criteria is not None:
        if not isinstance(criteria, dict):
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "structural_validation_failure",
                    "message": "extraction_criteria must be a dictionary",
                    "check": "extraction_criteria"
                }
            )
        if "system_persona" in criteria and not isinstance(criteria["system_persona"], str):
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "structural_validation_failure",
                    "message": "system_persona must be a string",
                    "check": "extraction_criteria"
                }
            )
        if "target_signals" in criteria and not isinstance(criteria["target_signals"], list):
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "structural_validation_failure",
                    "message": "target_signals must be a list of strings",
                    "check": "extraction_criteria"
                }
            )
        if "target_signals" in criteria and isinstance(criteria["target_signals"], list):
            for idx, sig in enumerate(criteria["target_signals"]):
                if not isinstance(sig, str):
                    raise HTTPException(
                        status_code=422,
                        detail={
                            "error_type": "structural_validation_failure",
                            "message": f"target_signals element at index {idx} must be a string",
                            "check": "extraction_criteria"
                        }
                    )

def validate_strict_swarm_request(
    chunks: List[Any],
    extraction_criteria: Optional[Any]
) -> None:
    """
    Experiment 1: Pre-Fan-Out Structural Gate
    Validates requests strictly before any cache lookups, tasks, or model calls.
    Raises HTTPException(422) if validation fails.
    """
    # 1. Chunks list validation
    if not isinstance(chunks, list):
        raise HTTPException(
            status_code=422,
            detail={
                "error_type": "structural_validation_failure",
                "message": "chunks must be a list of strings",
                "check": "chunks"
            }
        )

    if not (1 <= len(chunks) <= 50):
        raise HTTPException(
            status_code=422,
            detail={
                "error_type": "structural_validation_failure",
                "message": f"chunks length must be between 1 and 50, got {len(chunks)}",
                "check": "chunks"
            }
        )

    # 2. Per-chunk type & size checking, and total size checking
    total_chars = 0
    for idx, chunk in enumerate(chunks):
        if not isinstance(chunk, str):
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "structural_validation_failure",
                    "message": f"chunk at index {idx} must be a string, got {type(chunk).__name__}",
                    "check": "chunks"
                }
            )
        
        if len(chunk) > 25000:
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "structural_validation_failure",
                    "message": f"chunk at index {idx} exceeds 25,000 character limit (length: {len(chunk)})",
                    "check": "Per-chunk size"
                }
            )
        total_chars += len(chunk)

    # 5. Total input size checking
    if total_chars > 1000000:
        raise HTTPException(
            status_code=422,
            detail={
                "error_type": "structural_validation_failure",
                "message": f"total character count across all chunks ({total_chars}) exceeds 1,000,000 character ceiling",
                "check": "Total estimated input"
            }
        )

    # 3. Extraction criteria key requirements
    if extraction_criteria is None:
        raise HTTPException(
            status_code=422,
            detail={
                "error_type": "structural_validation_failure",
                "message": "extraction_criteria is required in early_gate or canary modes",
                "check": "extraction_criteria"
            }
        )

    if not isinstance(extraction_criteria, dict):
        raise HTTPException(
            status_code=422,
            detail={
                "error_type": "structural_validation_failure",
                "message": "extraction_criteria must be a dictionary",
                "check": "extraction_criteria"
            }
        )

    if "system_persona" not in extraction_criteria:
        raise HTTPException(
            status_code=422,
            detail={
                "error_type": "structural_validation_failure",
                "message": "extraction_criteria is missing required key: 'system_persona'",
                "check": "extraction_criteria"
            }
        )

    if "target_signals" not in extraction_criteria:
        raise HTTPException(
            status_code=422,
            detail={
                "error_type": "structural_validation_failure",
                "message": "extraction_criteria is missing required key: 'target_signals'",
                "check": "extraction_criteria"
            }
        )

    # 4. Criteria shape validation
    system_persona = extraction_criteria["system_persona"]
    if not isinstance(system_persona, str):
        raise HTTPException(
            status_code=422,
            detail={
                "error_type": "structural_validation_failure",
                "message": f"system_persona must be a string, got {type(system_persona).__name__}",
                "check": "extraction_criteria"
            }
        )

    target_signals = extraction_criteria["target_signals"]
    if not isinstance(target_signals, list):
        raise HTTPException(
            status_code=422,
            detail={
                "error_type": "structural_validation_failure",
                "message": f"target_signals must be a list of strings, got {type(target_signals).__name__}",
                "check": "Criteria shape"
            }
        )

    for idx, signal in enumerate(target_signals):
        if not isinstance(signal, str):
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "structural_validation_failure",
                    "message": f"target_signals element at index {idx} must be a string, got {type(signal).__name__}",
                    "check": "Criteria shape"
                }
            )

def validate_invariant_compliance(
    chunks: List[Any],
    invariant_set_id: Optional[str]
) -> None:
    """
    4D LAYER: Invariant Compliance Check
    Validates payload against locked schema contracts.
    """
    if not chunks:
        return

    total_character_volume = sum(len(c) for c in chunks if isinstance(c, str))

    # Simulating a check against an enterprise-locked contract ceiling
    if invariant_set_id == "ent_compliance_lock_v1":
        # Example hard invariant: Enforce strict budget cap or string formats
        if total_character_volume > 500000: # 500k character limit
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "invariant_validation_failure",
                    "message": "4D Invariant Violation: Payload exceeds locked organizational volume ceilings.",
                    "check": "4D Invariant Check"
                }
            )

