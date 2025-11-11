"""
Helper functions for fraud detection pipeline.

These functions contain the core business logic that can be unit tested
independently of the Pulumi infrastructure code.
"""


def validate_transaction(body):
    """
    Validate transaction data.

    Args:
        body (dict): Transaction data

    Returns:
        tuple: (is_valid, error_message)
    """
    if not body:
        return False, "Empty transaction body"

    if 'transaction_id' not in body:
        return False, "Missing transaction_id"

    return True, None


def detect_fraud(amount):
    """
    Detect if a transaction is suspicious based on amount.

    Args:
        amount (float): Transaction amount

    Returns:
        tuple: (is_suspicious, reasons, severity)
    """
    is_suspicious = False
    reasons = []
    severity = 'low'

    if amount > 1000:
        is_suspicious = True
        reasons.append('High amount transaction')
        severity = 'medium'

    if amount > 5000:
        reasons.append('Very high amount transaction')
        severity = 'high'

    return is_suspicious, reasons, severity


def format_notification_message(transaction_id, amount, reasons, severity):
    """
    Format notification message for fraud alerts.

    Args:
        transaction_id (str): Transaction ID
        amount (float): Transaction amount
        reasons (list): List of fraud reasons
        severity (str): Severity level

    Returns:
        str: Formatted notification message
    """
    message = f"\n"
    message += f"FRAUD ALERT - {severity.upper()} SEVERITY\n\n"
    message += f"Transaction ID: {transaction_id}\n"
    message += f"Amount: ${amount}\n"
    message += f"Reasons: {', '.join(reasons)}\n\n"
    message += f"Please investigate this transaction immediately.\n"

    return message


def get_configuration_values():
    """
    Get all configuration values for the infrastructure.

    Returns:
        dict: Configuration values
    """
    return {
        'lambda_memory': 512,
        'lambda_concurrency': 50,
        'lambda_runtime': 'python3.9',
        'dynamodb_billing': 'PAY_PER_REQUEST',
        'dynamodb_stream_view': 'NEW_AND_OLD_IMAGES',
        'sqs_visibility_timeout': 300,
        'cloudwatch_retention': 7,
        'common_tags': {
            'Environment': 'production',
            'CostCenter': 'fraud-detection'
        }
    }
