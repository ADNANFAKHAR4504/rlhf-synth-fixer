import json
import os
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function for payment validation.

    This function validates payment transactions and logs them to S3.
    In a production environment, this would connect to the Aurora database
    and perform complex validation logic.
    """

    db_host = os.environ.get("DB_HOST", "")
    region = os.environ.get("REGION", "")
    is_primary = os.environ.get("IS_PRIMARY", "true") == "true"

    logger.info(f"Payment validation request in region: {region}")
    logger.info(f"Running in {'primary' if is_primary else 'DR'} region")

    try:
        # Extract payment details from event
        payment_id = event.get("payment_id", "unknown")
        amount = event.get("amount", 0)
        currency = event.get("currency", "USD")

        logger.info(f"Validating payment: {payment_id}, Amount: {amount} {currency}")

        # Validation logic
        if amount <= 0:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "valid": False,
                    "reason": "Invalid amount",
                    "payment_id": payment_id,
                }),
            }

        if amount > 1000000:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "valid": False,
                    "reason": "Amount exceeds limit",
                    "payment_id": payment_id,
                }),
            }

        # In production, this would:
        # 1. Connect to Aurora database
        # 2. Validate payment against business rules
        # 3. Check for fraud patterns
        # 4. Log transaction to S3
        # 5. Update database with validation result

        return {
            "statusCode": 200,
            "body": json.dumps({
                "valid": True,
                "payment_id": payment_id,
                "amount": amount,
                "currency": currency,
                "region": region,
                "validated_at": context.request_id,
            }),
        }

    except Exception as e:
        logger.error(f"Error validating payment: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "valid": False,
                "reason": "Internal error",
                "error": str(e),
            }),
        }
