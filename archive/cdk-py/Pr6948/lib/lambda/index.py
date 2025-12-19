"""
Compliance reporter Lambda function.

This function aggregates non-compliant resources from AWS Config
and generates JSON compliance reports stored in S3.
"""

import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
config_client = boto3.client('config')
s3_client = boto3.client('s3')


def get_non_compliant_resources(rule_name: str) -> List[Dict[str, Any]]:
    """
    Get non-compliant resources for a specific Config rule.

    Args:
        rule_name: Name of the AWS Config rule

    Returns:
        List of non-compliant resources with details
    """
    non_compliant = []

    try:
        logger.info(f"Checking compliance for rule: {rule_name}")

        response = config_client.get_compliance_details_by_config_rule(
            ConfigRuleName=rule_name,
            ComplianceTypes=['NON_COMPLIANT'],
            Limit=100
        )

        for item in response.get('EvaluationResults', []):
            qualifier = item['EvaluationResultIdentifier']['EvaluationResultQualifier']

            non_compliant.append({
                'resource_id': qualifier['ResourceId'],
                'resource_type': qualifier['ResourceType'],
                'rule': rule_name,
                'compliance_type': item['ComplianceType'],
                'timestamp': item.get('ResultRecordedTime', datetime.utcnow()).isoformat(),
                'annotation': item.get('Annotation', 'No additional details')
            })

        logger.info(f"Found {len(non_compliant)} non-compliant resources for {rule_name}")

    except config_client.exceptions.NoSuchConfigRuleException:
        logger.warning(f"Config rule not found: {rule_name}")
    except Exception as e:
        logger.error(f"Error getting compliance details for {rule_name}: {str(e)}")

    return non_compliant


def generate_compliance_report() -> Dict[str, Any]:
    """
    Generate comprehensive compliance report from all Config rules.

    Returns:
        Compliance report dictionary
    """
    # CORRECTED: Get rule names from environment variables
    rules = [
        os.environ['S3_RULE_NAME'],
        os.environ['RDS_RULE_NAME'],
        os.environ['EC2_RULE_NAME']
    ]

    all_non_compliant = []

    for rule in rules:
        non_compliant = get_non_compliant_resources(rule)
        all_non_compliant.extend(non_compliant)

    # Generate summary by resource type
    summary = {
        's3': len([r for r in all_non_compliant if 'S3' in r['resource_type']]),
        'rds': len([r for r in all_non_compliant if 'RDS' in r['resource_type']]),
        'ec2': len([r for r in all_non_compliant if 'EC2' in r['resource_type']])
    }

    report = {
        'report_date': datetime.utcnow().isoformat(),
        'total_non_compliant': len(all_non_compliant),
        'non_compliant_resources': all_non_compliant,
        'summary_by_type': summary,
        'rules_evaluated': rules
    }

    return report


def store_report(report: Dict[str, Any], bucket_name: str) -> str:
    """
    Store compliance report in S3 with date-based partitioning.

    Args:
        report: Compliance report dictionary
        bucket_name: S3 bucket name

    Returns:
        S3 key where report was stored
    """
    timestamp = datetime.utcnow()

    # Organize reports by date for easier querying
    key = f'reports/{timestamp.strftime("%Y/%m/%d")}/{timestamp.strftime("%Y%m%d-%H%M%S")}.json'

    logger.info(f"Storing report to s3://{bucket_name}/{key}")

    s3_client.put_object(
        Bucket=bucket_name,
        Key=key,
        Body=json.dumps(report, indent=2),
        ContentType='application/json',
        ServerSideEncryption='AES256'
    )

    return key


def handler(event, context):
    """
    Lambda handler for compliance reporting.

    Args:
        event: Lambda event (can be scheduled or triggered by Config)
        context: Lambda context

    Returns:
        Response dictionary with status and report location
    """
    try:
        # CORRECTED: Use os.environ instead of context.env
        bucket_name = os.environ['BUCKET_NAME']

        logger.info(f"Starting compliance report generation")
        logger.info(f"Event: {json.dumps(event)}")

        # Generate comprehensive compliance report
        report = generate_compliance_report()

        # Store report in S3
        key = store_report(report, bucket_name)

        logger.info(f"Compliance report completed: {report['total_non_compliant']} non-compliant resources")
        logger.info(f"Report location: s3://{bucket_name}/{key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Compliance report generated successfully',
                'report_location': f's3://{bucket_name}/{key}',
                'non_compliant_count': report['total_non_compliant'],
                'summary': report['summary_by_type']
            })
        }

    except KeyError as e:
        logger.error(f"Missing required environment variable: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Configuration error',
                'error': f'Missing environment variable: {str(e)}'
            })
        }
    except Exception as e:
        logger.error(f"Error generating compliance report: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error generating compliance report',
                'error': str(e)
            })
        }
