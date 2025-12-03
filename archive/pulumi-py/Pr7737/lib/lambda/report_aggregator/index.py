"""
Report Aggregator Lambda Function

Aggregates compliance data from DynamoDB and generates JSON reports stored in S3.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, Any, List
from decimal import Decimal

dynamodb_client = boto3.client('dynamodb')
s3_client = boto3.client('s3')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
REPORTS_BUCKET = os.environ['REPORTS_BUCKET']


class DecimalEncoder(json.JSONEncoder):
    """Helper class to encode Decimal objects to JSON"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for compliance report aggregation.

    Args:
        event: Lambda event containing scheduled trigger
        context: Lambda context

    Returns:
        Dict with report generation results
    """
    try:
        print(f"Event received: {json.dumps(event)}")

        # Scan DynamoDB for all compliance evaluations
        response = dynamodb_client.scan(TableName=DYNAMODB_TABLE)
        items = response.get('Items', [])

        # Continue scanning if there are more items
        while 'LastEvaluatedKey' in response:
            response = dynamodb_client.scan(
                TableName=DYNAMODB_TABLE,
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))

        # Convert DynamoDB items to regular dict
        evaluations = []
        for item in items:
            evaluation = {}
            for key, value in item.items():
                if 'S' in value:
                    evaluation[key] = value['S']
                elif 'N' in value:
                    evaluation[key] = int(value['N'])
            evaluations.append(evaluation)

        # Aggregate statistics
        total_resources = len(set(eval['resource_id'] for eval in evaluations))
        compliant_count = len([e for e in evaluations if e.get('compliance_type') == 'COMPLIANT'])
        non_compliant_count = len([e for e in evaluations if e.get('compliance_type') == 'NON_COMPLIANT'])

        # Group by resource type
        resource_types = {}
        for evaluation in evaluations:
            resource_type = evaluation.get('resource_type', 'Unknown')
            if resource_type not in resource_types:
                resource_types[resource_type] = {
                    'total': 0,
                    'compliant': 0,
                    'non_compliant': 0
                }
            resource_types[resource_type]['total'] += 1
            if evaluation.get('compliance_type') == 'COMPLIANT':
                resource_types[resource_type]['compliant'] += 1
            else:
                resource_types[resource_type]['non_compliant'] += 1

        # Group by rule
        rules = {}
        for evaluation in evaluations:
            rule = evaluation.get('rule', 'Unknown')
            if rule not in rules:
                rules[rule] = {
                    'total': 0,
                    'compliant': 0,
                    'non_compliant': 0
                }
            rules[rule]['total'] += 1
            if evaluation.get('compliance_type') == 'COMPLIANT':
                rules[rule]['compliant'] += 1
            else:
                rules[rule]['non_compliant'] += 1

        # Generate report
        report = {
            'report_timestamp': datetime.utcnow().isoformat(),
            'summary': {
                'total_resources': total_resources,
                'total_evaluations': len(evaluations),
                'compliant': compliant_count,
                'non_compliant': non_compliant_count,
                'compliance_percentage': round((compliant_count / len(evaluations) * 100), 2) if evaluations else 0
            },
            'by_resource_type': resource_types,
            'by_rule': rules,
            'evaluations': evaluations
        }

        # Store report in S3
        timestamp = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
        report_key = f"compliance-report-{timestamp}.json"

        s3_client.put_object(
            Bucket=REPORTS_BUCKET,
            Key=report_key,
            Body=json.dumps(report, indent=2, cls=DecimalEncoder),
            ContentType='application/json'
        )

        print(f"Report generated: {report_key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Compliance report generated successfully',
                'report_key': report_key,
                'total_evaluations': len(evaluations),
                'compliance_percentage': report['summary']['compliance_percentage']
            }, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise
