"""
RDS Backup Checker Lambda Function

Checks RDS instances for automated backup configuration and reports compliance status.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, Any

rds_client = boto3.client('rds')
dynamodb_client = boto3.client('dynamodb')
sns_client = boto3.client('sns')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for RDS backup compliance checking.

    Args:
        event: Lambda event containing Config rule evaluation or scheduled trigger
        context: Lambda context

    Returns:
        Dict with evaluation results
    """
    try:
        print(f"Event received: {json.dumps(event)}")

        # Get all RDS instances
        response = rds_client.describe_db_instances()

        evaluation_results = []
        non_compliant_resources = []

        for instance in response.get('DBInstances', []):
            instance_id = instance['DBInstanceIdentifier']
            backup_retention = instance.get('BackupRetentionPeriod', 0)

            # Check if automated backups are enabled (retention > 0)
            is_compliant = backup_retention > 0
            compliance_type = 'COMPLIANT' if is_compliant else 'NON_COMPLIANT'

            timestamp = datetime.utcnow().isoformat()

            # Store evaluation in DynamoDB
            dynamodb_client.put_item(
                TableName=DYNAMODB_TABLE,
                Item={
                    'resource_id': {'S': instance_id},
                    'evaluation_timestamp': {'S': timestamp},
                    'compliance_type': {'S': compliance_type},
                    'resource_type': {'S': 'AWS::RDS::DBInstance'},
                    'backup_retention_period': {'N': str(backup_retention)},
                    'rule': {'S': 'rds-backup-enabled'}
                }
            )

            evaluation_results.append({
                'resource_id': instance_id,
                'compliance_type': compliance_type,
                'backup_retention_period': backup_retention
            })

            if not is_compliant:
                non_compliant_resources.append({
                    'instance_id': instance_id,
                    'backup_retention_period': backup_retention
                })

        # Send SNS alert if non-compliant resources found
        if non_compliant_resources:
            message = f"RDS Backup Compliance Alert\n\n"
            message += f"Found {len(non_compliant_resources)} non-compliant RDS instances:\n\n"
            for resource in non_compliant_resources:
                message += f"Instance: {resource['instance_id']}\n"
                message += f"Backup Retention: {resource['backup_retention_period']} days\n\n"

            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="RDS Backup Compliance Violation",
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'RDS backup compliance check completed',
                'total_instances': len(evaluation_results),
                'non_compliant': len(non_compliant_resources)
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise
