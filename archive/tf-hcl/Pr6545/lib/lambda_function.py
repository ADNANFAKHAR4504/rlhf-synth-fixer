# lambda_function.py
# Lambda function to process Config compliance events and analyze snapshots

import json
import boto3
import os
import logging
from datetime import datetime
from typing import Dict, List, Any

# Configure logging
logger = logging.getLogger()
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(getattr(logging, log_level))

# Initialize AWS clients
config_client = boto3.client('config')
sns_client = boto3.client('sns')
s3_client = boto3.client('s3')

# Environment variables
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
CONFIG_BUCKET = os.environ.get('CONFIG_BUCKET')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'prod')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing Config compliance events.

    Args:
        event: Event data from EventBridge or Config
        context: Lambda context object

    Returns:
        Response dictionary with status and message
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Determine event source
        if 'source' in event and event['source'] == 'aws.config':
            # Config compliance change event
            process_compliance_event(event)
        elif 'source' in event and event['source'] == 'aws.events':
            # Periodic check triggered by EventBridge
            perform_periodic_compliance_check()
        else:
            # Direct invocation - perform full compliance check
            perform_periodic_compliance_check()

        return {
            'statusCode': 200,
            'body': json.dumps('Compliance check completed successfully')
        }

    except Exception as e:
        logger.error(f"Error processing compliance check: {str(e)}", exc_info=True)
        send_error_notification(str(e))
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }


def process_compliance_event(event: Dict[str, Any]) -> None:
    """
    Process a Config compliance change event.

    Args:
        event: EventBridge event containing Config compliance change details
    """
    try:
        detail = event.get('detail', {})
        config_rule_name = detail.get('configRuleName', 'Unknown')
        new_evaluation_result = detail.get('newEvaluationResult', {})
        compliance_type = new_evaluation_result.get('complianceType', 'UNKNOWN')

        logger.info(f"Processing compliance event for rule: {config_rule_name}")
        logger.info(f"Compliance type: {compliance_type}")

        if compliance_type == 'NON_COMPLIANT':
            resource_type = new_evaluation_result.get('evaluationResultIdentifier', {}).get('evaluationResultQualifier', {}).get('resourceType', 'Unknown')
            resource_id = new_evaluation_result.get('evaluationResultIdentifier', {}).get('evaluationResultQualifier', {}).get('resourceId', 'Unknown')

            violation_details = {
                'rule_name': config_rule_name,
                'resource_type': resource_type,
                'resource_id': resource_id,
                'compliance_type': compliance_type,
                'annotation': new_evaluation_result.get('annotation', 'No annotation provided'),
                'timestamp': detail.get('resultRecordedTime', datetime.utcnow().isoformat())
            }

            logger.warning(f"Compliance violation detected: {json.dumps(violation_details)}")
            send_compliance_notification(violation_details)
        else:
            logger.info(f"Resource is compliant: {config_rule_name}")

    except Exception as e:
        logger.error(f"Error processing compliance event: {str(e)}", exc_info=True)
        raise


def perform_periodic_compliance_check() -> None:
    """
    Perform a comprehensive periodic compliance check across all Config rules.
    """
    try:
        logger.info("Starting periodic compliance check")

        # Get all Config rules
        config_rules = get_all_config_rules()
        logger.info(f"Found {len(config_rules)} Config rules to check")

        all_violations = []

        # Check compliance for each rule
        for rule in config_rules:
            rule_name = rule['ConfigRuleName']
            logger.info(f"Checking compliance for rule: {rule_name}")

            violations = check_rule_compliance(rule_name)
            if violations:
                all_violations.extend(violations)
                logger.warning(f"Found {len(violations)} violations for rule: {rule_name}")

        # Send summary notification if violations found
        if all_violations:
            send_summary_notification(all_violations)
            logger.warning(f"Total violations found: {len(all_violations)}")
        else:
            logger.info("No compliance violations found")

    except Exception as e:
        logger.error(f"Error during periodic compliance check: {str(e)}", exc_info=True)
        raise


def get_all_config_rules() -> List[Dict[str, Any]]:
    """
    Retrieve all Config rules in the account.

    Returns:
        List of Config rule dictionaries
    """
    try:
        rules = []
        paginator = config_client.get_paginator('describe_config_rules')

        for page in paginator.paginate():
            rules.extend(page.get('ConfigRules', []))

        return rules

    except Exception as e:
        logger.error(f"Error retrieving Config rules: {str(e)}", exc_info=True)
        raise


def check_rule_compliance(rule_name: str) -> List[Dict[str, Any]]:
    """
    Check compliance status for a specific Config rule.

    Args:
        rule_name: Name of the Config rule to check

    Returns:
        List of non-compliant resources
    """
    try:
        violations = []
        paginator = config_client.get_paginator('get_compliance_details_by_config_rule')

        for page in paginator.paginate(
            ConfigRuleName=rule_name,
            ComplianceTypes=['NON_COMPLIANT']
        ):
            evaluation_results = page.get('EvaluationResults', [])

            for result in evaluation_results:
                resource_id = result.get('EvaluationResultIdentifier', {}).get('EvaluationResultQualifier', {}).get('ResourceId', 'Unknown')
                resource_type = result.get('EvaluationResultIdentifier', {}).get('EvaluationResultQualifier', {}).get('ResourceType', 'Unknown')

                violation = {
                    'rule_name': rule_name,
                    'resource_type': resource_type,
                    'resource_id': resource_id,
                    'compliance_type': result.get('ComplianceType', 'UNKNOWN'),
                    'annotation': result.get('Annotation', 'No annotation provided'),
                    'config_rule_invoked_time': result.get('ConfigRuleInvokedTime', '').strftime('%Y-%m-%d %H:%M:%S') if result.get('ConfigRuleInvokedTime') else 'Unknown',
                    'result_recorded_time': result.get('ResultRecordedTime', '').strftime('%Y-%m-%d %H:%M:%S') if result.get('ResultRecordedTime') else 'Unknown'
                }

                violations.append(violation)

        return violations

    except Exception as e:
        logger.error(f"Error checking compliance for rule {rule_name}: {str(e)}", exc_info=True)
        return []


def send_compliance_notification(violation: Dict[str, Any]) -> None:
    """
    Send SNS notification for a single compliance violation.

    Args:
        violation: Dictionary containing violation details
    """
    try:
        subject = f"[{ENVIRONMENT_SUFFIX.upper()}] Compliance Violation Detected: {violation['rule_name']}"

        message = f"""
Compliance Violation Alert

Environment: {ENVIRONMENT_SUFFIX}
Rule Name: {violation['rule_name']}
Resource Type: {violation['resource_type']}
Resource ID: {violation['resource_id']}
Compliance Status: {violation['compliance_type']}
Timestamp: {violation['timestamp']}

Details:
{violation['annotation']}

Action Required:
Please investigate and remediate this compliance violation immediately.

---
This is an automated notification from the AWS Infrastructure Compliance Checking System.
"""

        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        logger.info(f"Notification sent successfully. MessageId: {response['MessageId']}")

    except Exception as e:
        logger.error(f"Error sending compliance notification: {str(e)}", exc_info=True)


def send_summary_notification(violations: List[Dict[str, Any]]) -> None:
    """
    Send SNS notification with summary of multiple compliance violations.

    Args:
        violations: List of violation dictionaries
    """
    try:
        subject = f"[{ENVIRONMENT_SUFFIX.upper()}] Compliance Summary: {len(violations)} Violations Found"

        # Group violations by rule
        violations_by_rule = {}
        for violation in violations:
            rule_name = violation['rule_name']
            if rule_name not in violations_by_rule:
                violations_by_rule[rule_name] = []
            violations_by_rule[rule_name].append(violation)

        message_parts = [
            "Compliance Violations Summary Report",
            f"\nEnvironment: {ENVIRONMENT_SUFFIX}",
            f"Total Violations: {len(violations)}",
            f"Rules with Violations: {len(violations_by_rule)}",
            f"Report Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC",
            "\n" + "="*80 + "\n"
        ]

        for rule_name, rule_violations in violations_by_rule.items():
            message_parts.append(f"\nRule: {rule_name}")
            message_parts.append(f"Violations: {len(rule_violations)}")
            message_parts.append("-" * 40)

            for i, violation in enumerate(rule_violations[:5], 1):  # Limit to first 5 per rule
                message_parts.append(f"\n  {i}. Resource Type: {violation['resource_type']}")
                message_parts.append(f"     Resource ID: {violation['resource_id']}")
                message_parts.append(f"     Status: {violation['compliance_type']}")

            if len(rule_violations) > 5:
                message_parts.append(f"\n  ... and {len(rule_violations) - 5} more violations")

            message_parts.append("")

        message_parts.append("\n" + "="*80)
        message_parts.append("\nAction Required:")
        message_parts.append("Please review and remediate these compliance violations.")
        message_parts.append("\nFor detailed information, check the AWS Config console or CloudWatch Logs.")
        message_parts.append("\n---")
        message_parts.append("This is an automated notification from the AWS Infrastructure Compliance Checking System.")

        message = "\n".join(message_parts)

        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        logger.info(f"Summary notification sent successfully. MessageId: {response['MessageId']}")

    except Exception as e:
        logger.error(f"Error sending summary notification: {str(e)}", exc_info=True)


def send_error_notification(error_message: str) -> None:
    """
    Send SNS notification for Lambda execution errors.

    Args:
        error_message: Error message to include in notification
    """
    try:
        subject = f"[{ENVIRONMENT_SUFFIX.upper()}] Compliance Checker Error"

        message = f"""
Compliance Checker Lambda Error

Environment: {ENVIRONMENT_SUFFIX}
Error Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC

Error Details:
{error_message}

Action Required:
Please investigate this error in CloudWatch Logs and resolve any issues with the compliance checking system.

---
This is an automated error notification from the AWS Infrastructure Compliance Checking System.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        logger.info("Error notification sent successfully")

    except Exception as e:
        logger.error(f"Error sending error notification: {str(e)}", exc_info=True)

