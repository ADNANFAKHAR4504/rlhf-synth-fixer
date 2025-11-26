"""
Report Generator Lambda Function

Generates comprehensive compliance reports from validation results
and stores them in S3.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, List, Any
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK clients for X-Ray tracing
patch_all()

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
REPORTS_BUCKET = os.environ.get('REPORTS_BUCKET')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for generating compliance reports.
    
    Args:
        event: Lambda event containing validation results
        context: Lambda context
        
    Returns:
        Dictionary with report URL and summary
    """
    try:
        # Extract data from previous step
        scan_id = event.get('scanId')
        stack_name = event.get('stackName')
        account_id = event.get('accountId')
        region = event.get('region', 'us-east-1')
        compliance_score = event.get('complianceScore', 0)
        validation_results = event.get('validationResults', [])
        
        if not scan_id:
            return create_error_response('Missing required data: scanId')
        
        # Generate report content
        report = generate_compliance_report(
            scan_id, stack_name, account_id, region,
            compliance_score, validation_results
        )
        
        # Store report in S3
        report_key = store_report_in_s3(report, scan_id, account_id)
        
        # Update DynamoDB with report location
        update_scan_record_with_report(scan_id, report_key)
        
        # Publish metrics
        publish_metrics('ReportsGenerated', 1)
        
        # Generate report URL
        report_url = f"s3://{REPORTS_BUCKET}/{report_key}"
        
        return {
            'statusCode': 200,
            'scanId': scan_id,
            'reportUrl': report_url,
            'reportKey': report_key,
            'complianceScore': compliance_score,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_message = f'Error generating report: {str(e)}'
        print(error_message)
        publish_metrics('ReportGenerationErrors', 1)
        return create_error_response(error_message)


@xray_recorder.capture('generate_compliance_report')
def generate_compliance_report(scan_id: str, stack_name: str, account_id: str,
                               region: str, compliance_score: float,
                               validation_results: List[Dict]) -> Dict:
    """
    Generate comprehensive compliance report.
    
    Args:
        scan_id: Scan identifier
        stack_name: CloudFormation stack name
        account_id: AWS account ID
        region: AWS region
        compliance_score: Overall compliance score
        validation_results: List of validation results
        
    Returns:
        Report dictionary
    """
    # Calculate statistics
    total_resources = len(validation_results)
    compliant_resources = sum(1 for r in validation_results if r['compliant'])
    non_compliant_resources = total_resources - compliant_resources
    
    # Group violations by severity
    critical_violations = [r for r in validation_results if r.get('severity') == 'CRITICAL']
    high_violations = [r for r in validation_results if r.get('severity') == 'HIGH']
    medium_violations = [r for r in validation_results if r.get('severity') == 'MEDIUM']
    
    # Group violations by resource type
    violations_by_type = {}
    for result in validation_results:
        if not result['compliant']:
            resource_type = result['resourceType']
            if resource_type not in violations_by_type:
                violations_by_type[resource_type] = []
            violations_by_type[resource_type].append(result)
    
    # Build report
    report = {
        'reportMetadata': {
            'scanId': scan_id,
            'stackName': stack_name,
            'accountId': account_id,
            'region': region,
            'scanTimestamp': scan_id.split('#')[1],
            'reportGeneratedAt': datetime.utcnow().isoformat()
        },
        'executiveSummary': {
            'complianceScore': compliance_score,
            'totalResources': total_resources,
            'compliantResources': compliant_resources,
            'nonCompliantResources': non_compliant_resources,
            'criticalViolations': len(critical_violations),
            'highViolations': len(high_violations),
            'mediumViolations': len(medium_violations),
            'overallStatus': get_overall_status(compliance_score)
        },
        'violationsByType': violations_by_type,
        'criticalViolations': critical_violations,
        'detailedResults': validation_results,
        'recommendations': generate_recommendations(validation_results)
    }
    
    return report


def get_overall_status(compliance_score: float) -> str:
    """Determine overall compliance status based on score."""
    if compliance_score >= 95:
        return 'EXCELLENT'
    elif compliance_score >= 80:
        return 'GOOD'
    elif compliance_score >= 60:
        return 'FAIR'
    else:
        return 'POOR'


def generate_recommendations(validation_results: List[Dict]) -> List[Dict]:
    """
    Generate remediation recommendations based on violations.
    
    Args:
        validation_results: List of validation results
        
    Returns:
        List of recommendations
    """
    recommendations = []
    
    for result in validation_results:
        if not result['compliant']:
            resource_id = result['resourceId']
            resource_type = result['resourceType']
            
            for violation in result.get('violations', []):
                recommendations.append({
                    'resource': f"{resource_type} - {resource_id}",
                    'issue': violation.get('message'),
                    'recommendation': violation.get('remediation'),
                    'severity': result.get('severity'),
                    'rule': violation.get('rule')
                })
    
    # Sort by severity
    severity_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
    recommendations.sort(key=lambda x: severity_order.get(x['severity'], 99))
    
    return recommendations


@xray_recorder.capture('store_report_in_s3')
def store_report_in_s3(report: Dict, scan_id: str, account_id: str) -> str:
    """
    Store compliance report in S3.
    
    Args:
        report: Report dictionary
        scan_id: Scan identifier
        account_id: AWS account ID
        
    Returns:
        S3 object key
    """
    try:
        # Generate S3 key with organized structure
        timestamp = datetime.utcnow()
        year = timestamp.strftime('%Y')
        month = timestamp.strftime('%m')
        day = timestamp.strftime('%d')
        
        report_key = f"reports/{account_id}/{year}/{month}/{day}/{scan_id}.json"
        
        # Convert report to JSON
        report_json = json.dumps(report, indent=2, default=str)
        
        # Upload to S3
        s3_client.put_object(
            Bucket=REPORTS_BUCKET,
            Key=report_key,
            Body=report_json,
            ContentType='application/json',
            ServerSideEncryption='AES256',
            Metadata={
                'scanId': scan_id,
                'accountId': account_id,
                'complianceScore': str(report['executiveSummary']['complianceScore'])
            }
        )
        
        return report_key
        
    except Exception as e:
        print(f'Error storing report in S3: {str(e)}')
        raise


@xray_recorder.capture('update_scan_record_with_report')
def update_scan_record_with_report(scan_id: str, report_key: str) -> None:
    """
    Update DynamoDB scan record with report location.
    
    Args:
        scan_id: Scan identifier
        report_key: S3 object key for report
    """
    try:
        table.update_item(
            Key={
                'accountIdTimestamp': scan_id,
                'resourceId': 'METADATA'
            },
            UpdateExpression='SET reportKey = :key, scanStatus = :status, completedAt = :completed',
            ExpressionAttributeValues={
                ':key': report_key,
                ':status': 'COMPLETED',
                ':completed': datetime.utcnow().isoformat()
            }
        )
    except Exception as e:
        print(f'Error updating scan record: {str(e)}')


def publish_metrics(metric_name: str, value: float, unit: str = 'Count') -> None:
    """
    Publish custom CloudWatch metrics.
    
    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Metric unit
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='ComplianceAnalyzer',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': ENVIRONMENT_SUFFIX
                        }
                    ]
                }
            ]
        )
    except Exception as e:
        print(f'Error publishing metric {metric_name}: {str(e)}')


def create_error_response(error_message: str) -> Dict:
    """Create standardized error response."""
    return {
        'statusCode': 500,
        'error': error_message,
        'timestamp': datetime.utcnow().isoformat()
    }
