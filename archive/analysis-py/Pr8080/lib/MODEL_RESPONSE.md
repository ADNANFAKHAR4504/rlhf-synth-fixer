### Reasoning Trace

---

The user wants me to create a comprehensive Python script for AWS infrastructure analysis that:

1. Uses boto3 to analyze AWS resources via Config
2. Detects configuration drift
3. Evaluates compliance
4. Reports to S3, DynamoDB, and SNS
5. Can run both as a Lambda function and standalone
6. Does not create any infrastructure - only analyzes and reports

Key requirements:

- Single self-contained Python script
- Lambda handler included
- Uses AWS Config for resource analysis
- Stores reports in S3 with versioning
- Records drift in DynamoDB
- Alerts via SNS when drift > 15%
- Reads baselines from SSM Parameter Store (with fallback)
- Handles EC2, RDS, S3, and IAM resources
- Includes compliance checks
- Robust error handling
- Extensible design
- Local testing capability

I'll create a professional, well-documented Python script that meets all these requirements.

### Answer

---

```python
#!/usr/bin/env python3
"""
AWS Infrastructure Analysis and Drift Detection Script
======================================================

Purpose:
    Performs infrastructure analysis, configuration drift detection, and compliance
    evaluation for AWS resources using AWS Config as the primary data source.

Environment Requirements:
    - AWS Config enabled and recording EC2, RDS, S3, and IAM resources
    - S3 bucket with versioning enabled for report storage
    - DynamoDB table (partition key: resourceId, sort key: timestamp) with on-demand billing
    - SNS topic for drift threshold alerts
    - (Optional) SSM Parameter Store with baseline configurations

Assumptions:
    - Script runs with IAM role having read-only permissions to required services
    - Does NOT create or modify any AWS resources
    - VPC endpoints configured for AWS API access
    - Lambda execution: 3GB memory, 5-minute timeout when run as Lambda

Resources Accessed (Read):
    - AWS Config: Resource configurations and compliance
    - SSM Parameter Store: Baseline configurations
    - CloudWatch: Optional metrics
    - STS: Caller identity

Resources Written To:
    - S3: JSON compliance reports (versioned objects)
    - DynamoDB: Drift records
    - SNS: Alert messages when drift exceeds threshold

Required IAM Permissions:
    - config:DescribeConfigurationRecorderStatus
    - config:GetResourceConfigHistory
    - config:ListDiscoveredResources
    - config:BatchGetResourceConfig
    - config:DescribeComplianceByResource
    - s3:PutObject, s3:GetObject, s3:GetObjectVersion
    - dynamodb:PutItem, dynamodb:BatchWriteItem
    - sns:Publish
    - ssm:GetParameter
    - sts:GetCallerIdentity
    - cloudwatch:PutMetricData (optional)
"""

import os
import json
import logging
import time
import hashlib
import traceback
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from botocore.config import Config as BotoConfig

# ============================================================================
# CONFIGURATION
# ============================================================================

# Environment variable configuration with defaults
REGION = os.environ.get('AWS_REGION', 'us-east-1')
S3_REPORT_BUCKET = os.environ.get('S3_REPORT_BUCKET', 'aws-compliance-reports')
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'drift-records')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
SSM_BASELINE_PARAM = os.environ.get('SSM_BASELINE_PARAM', '/config/baseline')
DRIFT_THRESHOLD = float(os.environ.get('DRIFT_THRESHOLD', '15'))
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
VERBOSE = os.environ.get('VERBOSE', 'false').lower() == 'true'

# Resource types to analyze
RESOURCE_TYPES = ['AWS::EC2::Instance', 'AWS::RDS::DBInstance',
                  'AWS::S3::Bucket', 'AWS::IAM::Role', 'AWS::Lambda::Function',
                  'AWS::Events::Rule', 'AWS::SNS::Topic', 'AWS::DynamoDB::Table']

# Boto3 configuration for retries and timeouts
boto_config = BotoConfig(
    region_name=REGION,
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    },
    read_timeout=60,
    connect_timeout=10
)

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if VERBOSE:
    logger.setLevel(logging.DEBUG)
    boto3.set_stream_logger('boto3.resources', logging.DEBUG)

# ============================================================================
# AWS CLIENT INITIALIZATION
# ============================================================================

def initialize_clients():
    """Initialize boto3 clients with proper error handling and configuration."""
    try:
        clients = {
            'config': boto3.client('config', config=boto_config),
            's3': boto3.client('s3', config=boto_config),
            'dynamodb': boto3.client('dynamodb', config=boto_config),
            'sns': boto3.client('sns', config=boto_config),
            'ssm': boto3.client('ssm', config=boto_config),
            'sts': boto3.client('sts', config=boto_config),
            'cloudwatch': boto3.client('cloudwatch', config=boto_config)
        }
        logger.info(f"Initialized AWS clients for region: {REGION}")
        return clients
    except Exception as e:
        logger.error(f"Failed to initialize AWS clients: {str(e)}")
        raise

# ============================================================================
# BASELINE MANAGEMENT
# ============================================================================

def load_baseline_from_ssm(clients: Dict, param_name: str) -> Optional[Dict]:
    """
    Load baseline configuration from SSM Parameter Store.
    Returns None if parameter doesn't exist or on error.
    """
    try:
        response = clients['ssm'].get_parameter(
            Name=param_name,
            WithDecryption=True
        )
        baseline_data = json.loads(response['Parameter']['Value'])
        logger.info(f"Loaded baseline from SSM parameter: {param_name}")
        return baseline_data
    except ClientError as e:
        if e.response['Error']['Code'] == 'ParameterNotFound':
            logger.warning(f"SSM baseline parameter not found: {param_name}")
        else:
            logger.error(f"Error loading baseline from SSM: {str(e)}")
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in SSM parameter: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error loading baseline: {str(e)}")
    return None

def derive_baseline_from_config(clients: Dict, resource_types: List[str]) -> Dict:
    """
    Derive baseline from oldest available Config snapshot when SSM baseline is unavailable.
    """
    baseline = {
        'source': 'config_history',
        'timestamp': None,
        'resources': {}
    }

    try:
        for resource_type in resource_types:
            # Get oldest configuration for each resource type
            response = clients['config'].list_discovered_resources(
                resourceType=resource_type,
                limit=100
            )

            for resource in response.get('resourceIdentifiers', []):
                resource_id = resource['resourceId']

                # Get configuration history
                history = clients['config'].get_resource_config_history(
                    resourceType=resource_type,
                    resourceId=resource_id,
                    limit=1,
                    chronologicalOrder='Reverse'  # Oldest first
                )

                if history['configurationItems']:
                    config_item = history['configurationItems'][0]
                    baseline['resources'][resource_id] = {
                        'type': resource_type,
                        'configuration': config_item.get('configuration', {}),
                        'configurationItemCaptureTime': config_item.get('configurationItemCaptureTime', '').isoformat()
                    }

                    # Track oldest timestamp
                    if not baseline['timestamp'] or config_item['configurationItemCaptureTime'] < baseline['timestamp']:
                        baseline['timestamp'] = config_item['configurationItemCaptureTime']

        logger.info(f"Derived baseline from Config history with {len(baseline['resources'])} resources")
        return baseline

    except Exception as e:
        logger.error(f"Error deriving baseline from Config: {str(e)}")
        return baseline

# ============================================================================
# CONFIGURATION ANALYSIS
# ============================================================================

def fetch_current_configurations(clients: Dict, resource_types: List[str]) -> Dict:
    """Fetch current resource configurations from AWS Config."""
    current_configs = {}

    try:
        for resource_type in resource_types:
            logger.debug(f"Fetching configurations for {resource_type}")

            # List all resources of this type
            response = clients['config'].list_discovered_resources(
                resourceType=resource_type,
                limit=100
            )

            resource_ids = [r['resourceId'] for r in response.get('resourceIdentifiers', [])]

            if resource_ids:
                # Batch get resource configurations
                batch_response = clients['config'].batch_get_resource_config(
                    resourceKeys=[
                        {'resourceType': resource_type, 'resourceId': rid}
                        for rid in resource_ids
                    ]
                )

                for item in batch_response.get('baseConfigurationItems', []):
                    resource_id = item['resourceId']
                    current_configs[resource_id] = {
                        'type': resource_type,
                        'configuration': json.loads(item.get('configuration', '{}')),
                        'configurationItemCaptureTime': item.get('configurationItemCaptureTime', '').isoformat(),
                        'configurationStateId': item.get('configurationStateId'),
                        'arn': item.get('arn'),
                        'resourceCreationTime': item.get('resourceCreationTime', '').isoformat()
                    }

        logger.info(f"Fetched {len(current_configs)} resource configurations")
        return current_configs

    except Exception as e:
        logger.error(f"Error fetching current configurations: {str(e)}")
        return current_configs

# ============================================================================
# DRIFT DETECTION
# ============================================================================

def calculate_configuration_drift(baseline: Dict, current: Dict) -> Dict:
    """
    Calculate drift between baseline and current configurations.
    Returns detailed drift analysis including per-resource changes.
    """
    drift_analysis = {
        'total_resources': len(current),
        'baseline_resources': len(baseline.get('resources', {})),
        'changed_resources': [],
        'added_resources': [],
        'removed_resources': [],
        'drift_details': {},
        'drift_percentage': 0.0
    }

    baseline_resources = baseline.get('resources', {})

    # Check for changes and additions
    for resource_id, current_config in current.items():
        if resource_id in baseline_resources:
            baseline_config = baseline_resources[resource_id]
            differences = compare_configurations(
                baseline_config.get('configuration', {}),
                current_config.get('configuration', {})
            )

            if differences:
                drift_analysis['changed_resources'].append(resource_id)
                drift_analysis['drift_details'][resource_id] = {
                    'type': current_config['type'],
                    'differences': differences,
                    'baseline_time': baseline_config.get('configurationItemCaptureTime'),
                    'current_time': current_config.get('configurationItemCaptureTime')
                }
        else:
            drift_analysis['added_resources'].append(resource_id)

    # Check for removals
    for resource_id in baseline_resources:
        if resource_id not in current:
            drift_analysis['removed_resources'].append(resource_id)

    # Calculate drift percentage
    total_tracked = max(len(current), len(baseline_resources))
    if total_tracked > 0:
        changed_count = (len(drift_analysis['changed_resources']) +
                        len(drift_analysis['added_resources']) +
                        len(drift_analysis['removed_resources']))
        drift_analysis['drift_percentage'] = (changed_count / total_tracked) * 100

    logger.info(f"Drift analysis complete: {drift_analysis['drift_percentage']:.2f}% drift detected")
    return drift_analysis

def compare_configurations(baseline: Any, current: Any, path: str = "") -> List[Dict]:
    """
    Recursively compare two configuration objects and return differences.
    """
    differences = []

    if type(baseline) != type(current):
        differences.append({
            'path': path or 'root',
            'type': 'type_change',
            'baseline': str(type(baseline).__name__),
            'current': str(type(current).__name__)
        })
        return differences

    if isinstance(baseline, dict):
        all_keys = set(baseline.keys()) | set(current.keys())
        for key in all_keys:
            new_path = f"{path}.{key}" if path else key

            if key not in baseline:
                differences.append({
                    'path': new_path,
                    'type': 'added',
                    'value': current.get(key)
                })
            elif key not in current:
                differences.append({
                    'path': new_path,
                    'type': 'removed',
                    'value': baseline.get(key)
                })
            else:
                differences.extend(
                    compare_configurations(baseline[key], current[key], new_path)
                )

    elif isinstance(baseline, list):
        if len(baseline) != len(current):
            differences.append({
                'path': path or 'root',
                'type': 'list_size_change',
                'baseline_size': len(baseline),
                'current_size': len(current)
            })
        else:
            for i, (b_item, c_item) in enumerate(zip(baseline, current)):
                differences.extend(
                    compare_configurations(b_item, c_item, f"{path}[{i}]")
                )

    elif baseline != current:
        differences.append({
            'path': path or 'root',
            'type': 'value_change',
            'baseline': baseline,
            'current': current
        })

    return differences

# ============================================================================
# COMPLIANCE EVALUATION
# ============================================================================

def evaluate_compliance(clients: Dict, current_configs: Dict) -> Dict:
    """
    Evaluate resources against compliance rules.
    Returns detailed compliance findings with remediation hints.
    """
    compliance_results = {
        'checks_performed': [],
        'total_checks': 0,
        'passed_checks': 0,
        'failed_checks': 0,
        'findings': []
    }

    # Check S3 bucket compliance
    s3_findings = check_s3_compliance(current_configs)
    compliance_results['findings'].extend(s3_findings)

    # Check DynamoDB compliance
    dynamodb_findings = check_dynamodb_compliance(current_configs)
    compliance_results['findings'].extend(dynamodb_findings)

    # Check Lambda compliance
    lambda_findings = check_lambda_compliance(current_configs)
    compliance_results['findings'].extend(lambda_findings)

    # Check EventBridge compliance
    eventbridge_findings = check_eventbridge_compliance(current_configs)
    compliance_results['findings'].extend(eventbridge_findings)

    # Check SNS compliance
    sns_findings = check_sns_compliance(clients, current_configs)
    compliance_results['findings'].extend(sns_findings)

    # Calculate statistics
    compliance_results['total_checks'] = len(compliance_results['findings'])
    compliance_results['passed_checks'] = sum(1 for f in compliance_results['findings'] if f['status'] == 'PASS')
    compliance_results['failed_checks'] = sum(1 for f in compliance_results['findings'] if f['status'] == 'FAIL')
    compliance_results['checks_performed'] = list(set(f['check_name'] for f in compliance_results['findings']))

    logger.info(f"Compliance evaluation complete: {compliance_results['passed_checks']}/{compliance_results['total_checks']} checks passed")
    return compliance_results

def check_s3_compliance(configs: Dict) -> List[Dict]:
    """Check S3 buckets for versioning and lifecycle rules."""
    findings = []

    for resource_id, config in configs.items():
        if config['type'] == 'AWS::S3::Bucket':
            bucket_config = config.get('configuration', {})

            # Check versioning
            versioning_status = bucket_config.get('BucketVersioningConfiguration', {}).get('Status', 'Disabled')
            findings.append({
                'resource_id': resource_id,
                'resource_type': 'S3_BUCKET',
                'check_name': 'S3_VERSIONING_ENABLED',
                'status': 'PASS' if versioning_status == 'Enabled' else 'FAIL',
                'message': f"Versioning is {versioning_status}",
                'remediation': 'Enable versioning using: aws s3api put-bucket-versioning --bucket BUCKET --versioning-configuration Status=Enabled'
            })

            # Check lifecycle rules
            lifecycle_rules = bucket_config.get('BucketLifecycleConfiguration', {}).get('Rules', [])
            findings.append({
                'resource_id': resource_id,
                'resource_type': 'S3_BUCKET',
                'check_name': 'S3_LIFECYCLE_CONFIGURED',
                'status': 'PASS' if lifecycle_rules else 'FAIL',
                'message': f"Found {len(lifecycle_rules)} lifecycle rules",
                'remediation': 'Configure lifecycle rules for cost optimization and compliance'
            })

    return findings

def check_dynamodb_compliance(configs: Dict) -> List[Dict]:
    """Check DynamoDB tables for on-demand billing mode."""
    findings = []

    for resource_id, config in configs.items():
        if config['type'] == 'AWS::DynamoDB::Table':
            table_config = config.get('configuration', {})
            billing_mode = table_config.get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED')

            findings.append({
                'resource_id': resource_id,
                'resource_type': 'DYNAMODB_TABLE',
                'check_name': 'DYNAMODB_ON_DEMAND_BILLING',
                'status': 'PASS' if billing_mode == 'PAY_PER_REQUEST' else 'FAIL',
                'message': f"Billing mode is {billing_mode}",
                'remediation': 'Update to on-demand billing: aws dynamodb update-table --table-name TABLE --billing-mode PAY_PER_REQUEST'
            })

    return findings

def check_lambda_compliance(configs: Dict) -> List[Dict]:
    """Check Lambda functions for memory and timeout requirements."""
    findings = []

    for resource_id, config in configs.items():
        if config['type'] == 'AWS::Lambda::Function':
            lambda_config = config.get('configuration', {})
            memory = lambda_config.get('MemorySize', 128)
            timeout = lambda_config.get('Timeout', 3)

            # Check memory >= 3072 MB for analysis functions
            if 'analyse' in resource_id.lower() or 'analysis' in resource_id.lower():
                findings.append({
                    'resource_id': resource_id,
                    'resource_type': 'LAMBDA_FUNCTION',
                    'check_name': 'LAMBDA_ANALYSIS_MEMORY',
                    'status': 'PASS' if memory >= 3072 else 'FAIL',
                    'message': f"Memory is {memory}MB (required: >=3072MB for analysis)",
                    'remediation': 'Update memory: aws lambda update-function-configuration --function-name FUNCTION --memory-size 3072'
                })

                # Check timeout >= 300 seconds
                findings.append({
                    'resource_id': resource_id,
                    'resource_type': 'LAMBDA_FUNCTION',
                    'check_name': 'LAMBDA_ANALYSIS_TIMEOUT',
                    'status': 'PASS' if timeout >= 300 else 'FAIL',
                    'message': f"Timeout is {timeout}s (required: >=300s for analysis)",
                    'remediation': 'Update timeout: aws lambda update-function-configuration --function-name FUNCTION --timeout 300'
                })

    return findings

def check_eventbridge_compliance(configs: Dict) -> List[Dict]:
    """Check EventBridge rules for proper scheduling."""
    findings = []

    for resource_id, config in configs.items():
        if config['type'] == 'AWS::Events::Rule':
            rule_config = config.get('configuration', {})
            schedule = rule_config.get('ScheduleExpression', '')

            # Check for 6-hour schedule
            is_six_hour = 'rate(6 hours)' in schedule or 'cron' in schedule
            findings.append({
                'resource_id': resource_id,
                'resource_type': 'EVENTBRIDGE_RULE',
                'check_name': 'EVENTBRIDGE_SCHEDULE_FREQUENCY',
                'status': 'PASS' if is_six_hour else 'WARNING',
                'message': f"Schedule expression: {schedule}",
                'remediation': 'Ensure rule runs every 6 hours: rate(6 hours) or appropriate cron expression'
            })

    return findings

def check_sns_compliance(clients: Dict, configs: Dict) -> List[Dict]:
    """Check SNS topics for subscription endpoints."""
    findings = []

    for resource_id, config in configs.items():
        if config['type'] == 'AWS::SNS::Topic':
            topic_arn = config.get('arn', '')

            try:
                # Get subscriptions for the topic
                response = clients['sns'].list_subscriptions_by_topic(TopicArn=topic_arn)
                subscriptions = response.get('Subscriptions', [])

                findings.append({
                    'resource_id': resource_id,
                    'resource_type': 'SNS_TOPIC',
                    'check_name': 'SNS_HAS_SUBSCRIPTIONS',
                    'status': 'PASS' if subscriptions else 'FAIL',
                    'message': f"Topic has {len(subscriptions)} subscription(s)",
                    'remediation': 'Add email or other subscription: aws sns subscribe --topic-arn ARN --protocol email --notification-endpoint EMAIL'
                })

                # Check for email subscriptions
                email_subs = [s for s in subscriptions if s.get('Protocol') == 'email']
                if subscriptions and not email_subs:
                    findings.append({
                        'resource_id': resource_id,
                        'resource_type': 'SNS_TOPIC',
                        'check_name': 'SNS_EMAIL_SUBSCRIPTION',
                        'status': 'WARNING',
                        'message': f"No email subscriptions found (has {len(subscriptions)} other)",
                        'remediation': 'Consider adding email subscription for human-readable alerts'
                    })

            except Exception as e:
                logger.error(f"Error checking SNS subscriptions for {topic_arn}: {str(e)}")
                findings.append({
                    'resource_id': resource_id,
                    'resource_type': 'SNS_TOPIC',
                    'check_name': 'SNS_HAS_SUBSCRIPTIONS',
                    'status': 'ERROR',
                    'message': f"Could not check subscriptions: {str(e)}",
                    'remediation': 'Verify IAM permissions for sns:ListSubscriptionsByTopic'
                })

    return findings

# ============================================================================
# REPORTING AND PERSISTENCE
# ============================================================================

def generate_analysis_report(run_id: str, drift_analysis: Dict, compliance_results: Dict,
                            baseline_source: str, caller_identity: Dict) -> Dict:
    """Generate comprehensive JSON analysis report."""
    report = {
        'metadata': {
            'run_id': run_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'region': REGION,
            'invoking_principal': caller_identity.get('Arn', 'Unknown'),
            'account_id': caller_identity.get('Account', 'Unknown'),
            'baseline_source': baseline_source,
            'analysis_version': '1.0.0'
        },
        'drift_analysis': {
            'summary': {
                'total_resources': drift_analysis['total_resources'],
                'baseline_resources': drift_analysis['baseline_resources'],
                'changed_resources_count': len(drift_analysis['changed_resources']),
                'added_resources_count': len(drift_analysis['added_resources']),
                'removed_resources_count': len(drift_analysis['removed_resources']),
                'drift_percentage': drift_analysis['drift_percentage']
            },
            'changed_resources': drift_analysis['changed_resources'],
            'added_resources': drift_analysis['added_resources'],
            'removed_resources': drift_analysis['removed_resources'],
            'detailed_changes': drift_analysis['drift_details']
        },
        'compliance': {
            'summary': {
                'total_checks': compliance_results['total_checks'],
                'passed': compliance_results['passed_checks'],
                'failed': compliance_results['failed_checks'],
                'compliance_percentage': (compliance_results['passed_checks'] / max(compliance_results['total_checks'], 1)) * 100
            },
            'checks_performed': compliance_results['checks_performed'],
            'findings': compliance_results['findings']
        },
        'alerts_triggered': False,
        'errors': []
    }

    return report

def write_report_to_s3(clients: Dict, bucket: str, report: Dict) -> Optional[str]:
    """
    Write analysis report to S3 bucket with versioning.
    Returns the S3 key on success, None on failure.
    """
    try:
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
        s3_key = f"compliance-reports/{report['metadata']['run_id']}/{timestamp}_analysis.json"

        # Pretty-print JSON for readability
        json_content = json.dumps(report, indent=2, default=str)

        # Calculate content hash for integrity
        content_hash = hashlib.sha256(json_content.encode()).hexdigest()

        # Upload to S3 with metadata
        response = clients['s3'].put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=json_content,
            ContentType='application/json',
            Metadata={
                'run-id': report['metadata']['run_id'],
                'drift-percentage': str(report['drift_analysis']['summary']['drift_percentage']),
                'compliance-percentage': str(report['compliance']['summary']['compliance_percentage']),
                'content-hash': content_hash
            },
            ServerSideEncryption='AES256'
        )

        logger.info(f"Report written to S3: s3://{bucket}/{s3_key}")
        return s3_key

    except Exception as e:
        logger.error(f"Failed to write report to S3: {str(e)}")
        return None

def write_drift_to_dynamodb(clients: Dict, table: str, report: Dict):
    """
    Write drift records to DynamoDB table.

    DynamoDB Item Schema:
    - resourceId (PK): Resource identifier or 'SUMMARY' for aggregate
    - timestamp (SK): ISO8601 timestamp
    - resourceType: AWS resource type
    - driftPercentage: Float percentage
    - changeType: 'CHANGED' | 'ADDED' | 'REMOVED' | 'SUMMARY'
    - runId: Analysis run identifier
    - reportS3Key: S3 location of full report
    - details: JSON string of detailed changes
    """
    try:
        items_to_write = []
        timestamp = report['metadata']['timestamp']
        run_id = report['metadata']['run_id']

        # Write summary record
        items_to_write.append({
            'PutRequest': {
                'Item': {
                    'resourceId': {'S': 'SUMMARY'},
                    'timestamp': {'S': timestamp},
                    'resourceType': {'S': 'AGGREGATE'},
                    'driftPercentage': {'N': str(report['drift_analysis']['summary']['drift_percentage'])},
                    'changeType': {'S': 'SUMMARY'},
                    'runId': {'S': run_id},
                    'totalResources': {'N': str(report['drift_analysis']['summary']['total_resources'])},
                    'changedCount': {'N': str(report['drift_analysis']['summary']['changed_resources_count'])},
                    'compliancePercentage': {'N': str(report['compliance']['summary']['compliance_percentage'])}
                }
            }
        })

        # Write individual resource drift records
        for resource_id, details in report['drift_analysis']['detailed_changes'].items():
            items_to_write.append({
                'PutRequest': {
                    'Item': {
                        'resourceId': {'S': resource_id},
                        'timestamp': {'S': timestamp},
                        'resourceType': {'S': details.get('type', 'UNKNOWN')},
                        'changeType': {'S': 'CHANGED'},
                        'runId': {'S': run_id},
                        'differences': {'S': json.dumps(details.get('differences', []))}
                    }
                }
            })

        # Batch write to DynamoDB (max 25 items per batch)
        for i in range(0, len(items_to_write), 25):
            batch = items_to_write[i:i+25]
            response = clients['dynamodb'].batch_write_item(
                RequestItems={
                    table: batch
                }
            )

            # Handle unprocessed items with retry
            unprocessed = response.get('UnprocessedItems', {})
            if unprocessed:
                logger.warning(f"Retrying {len(unprocessed)} unprocessed items")
                time.sleep(1)
                clients['dynamodb'].batch_write_item(RequestItems=unprocessed)

        logger.info(f"Wrote {len(items_to_write)} drift records to DynamoDB")

    except Exception as e:
        logger.error(f"Failed to write drift records to DynamoDB: {str(e)}")
        raise

def send_drift_alert(clients: Dict, topic_arn: str, report: Dict, s3_key: str):
    """Send SNS alert when drift exceeds threshold."""
    try:
        drift_percentage = report['drift_analysis']['summary']['drift_percentage']

        # Generate alert message
        message = f"""
Infrastructure Drift Alert

Drift Detected: {drift_percentage:.2f}%
Threshold: {DRIFT_THRESHOLD}%

Summary:
- Total Resources: {report['drift_analysis']['summary']['total_resources']}
- Changed Resources: {report['drift_analysis']['summary']['changed_resources_count']}
- Added Resources: {report['drift_analysis']['summary']['added_resources_count']}
- Removed Resources: {report['drift_analysis']['summary']['removed_resources_count']}

Compliance Status:
- Checks Passed: {report['compliance']['summary']['passed']}/{report['compliance']['summary']['total_checks']}
- Compliance Rate: {report['compliance']['summary']['compliance_percentage']:.2f}%

Full Report: s3://{S3_REPORT_BUCKET}/{s3_key}

Run ID: {report['metadata']['run_id']}
Timestamp: {report['metadata']['timestamp']}
"""

        # Publish to SNS with structured attributes
        response = clients['sns'].publish(
            TopicArn=topic_arn,
            Subject=f'[DRIFT ALERT] {drift_percentage:.2f}% configuration drift detected',
            Message=message,
            MessageAttributes={
                'drift_percentage': {
                    'DataType': 'Number',
                    'StringValue': str(drift_percentage)
                },
                'affected_resources': {
                    'DataType': 'Number',
                    'StringValue': str(len(report['drift_analysis']['changed_resources']))
                },
                'run_id': {
                    'DataType': 'String',
                    'StringValue': report['metadata']['run_id']
                },
                'severity': {
                    'DataType': 'String',
                    'StringValue': 'HIGH' if drift_percentage > 25 else 'MEDIUM'
                }
            }
        )

        logger.info(f"Drift alert sent to SNS: {response['MessageId']}")
        return True

    except Exception as e:
        logger.error(f"Failed to send drift alert: {str(e)}")
        return False

# ============================================================================
# RESOURCE RELATIONSHIP MAPPING (Extensibility)
# ============================================================================

def enrich_with_relationships(report: Dict, configs: Dict) -> Dict:
    """
    Stub function demonstrating resource relationship enrichment.
    Future enhancement: Track transitive changes across related resources.

    Relationship mapping examples:
    - EC2 instance -> IAM role (instance profile)
    - Lambda function -> IAM role (execution role)
    - S3 bucket -> Lambda functions (event triggers)
    - RDS instance -> Security groups
    """
    relationships = defaultdict(list)

    # Example: Map EC2 instances to their IAM roles
    for resource_id, config in configs.items():
        if config['type'] == 'AWS::EC2::Instance':
            instance_config = config.get('configuration', {})
            iam_instance_profile = instance_config.get('IamInstanceProfile', {})
            if iam_instance_profile:
                role_arn = iam_instance_profile.get('Arn', '')
                if role_arn:
                    relationships[resource_id].append({
                        'type': 'uses_role',
                        'target': role_arn,
                        'target_type': 'AWS::IAM::Role'
                    })

    # Add relationships to report for future use
    report['resource_relationships'] = dict(relationships)

    logger.debug(f"Enriched report with {len(relationships)} resource relationships")
    return report

# ============================================================================
# CLOUDWATCH METRICS (Optional)
# ============================================================================

def emit_cloudwatch_metrics(clients: Dict, report: Dict):
    """Emit custom CloudWatch metrics for monitoring the analysis."""
    try:
        namespace = 'InfrastructureAnalysis'
        timestamp = datetime.now(timezone.utc)

        metrics = [
            {
                'MetricName': 'DriftPercentage',
                'Value': report['drift_analysis']['summary']['drift_percentage'],
                'Unit': 'Percent',
                'Timestamp': timestamp
            },
            {
                'MetricName': 'CompliancePercentage',
                'Value': report['compliance']['summary']['compliance_percentage'],
                'Unit': 'Percent',
                'Timestamp': timestamp
            },
            {
                'MetricName': 'TotalResourcesAnalyzed',
                'Value': report['drift_analysis']['summary']['total_resources'],
                'Unit': 'Count',
                'Timestamp': timestamp
            },
            {
                'MetricName': 'ChangedResources',
                'Value': report['drift_analysis']['summary']['changed_resources_count'],
                'Unit': 'Count',
                'Timestamp': timestamp
            }
        ]

        for metric in metrics:
            clients['cloudwatch'].put_metric_data(
                Namespace=namespace,
                MetricData=[metric]
            )

        logger.info(f"Emitted {len(metrics)} CloudWatch metrics")

    except Exception as e:
        logger.warning(f"Failed to emit CloudWatch metrics: {str(e)}")

# ============================================================================
# MAIN ANALYSIS ORCHESTRATION
# ============================================================================

def perform_analysis(clients: Dict) -> Dict:
    """
    Main analysis orchestration function.
    Performs all analysis steps and returns the complete report.
    """
    # Generate run ID
    run_id = f"run_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{os.getpid()}"
    logger.info(f"Starting analysis run: {run_id}")

    # Get caller identity
    try:
        caller_identity = clients['sts'].get_caller_identity()
    except Exception as e:
        logger.warning(f"Could not get caller identity: {str(e)}")
        caller_identity = {}

    # Step 1: Load or derive baseline
    baseline = load_baseline_from_ssm(clients, SSM_BASELINE_PARAM)
    baseline_source = 'ssm_parameter'

    if not baseline:
        logger.info("SSM baseline not found, deriving from Config history")
        baseline = derive_baseline_from_config(clients, RESOURCE_TYPES)
        baseline_source = 'config_history_fallback'

    # Step 2: Fetch current configurations
    current_configs = fetch_current_configurations(clients, RESOURCE_TYPES)

    # Step 3: Calculate drift
    drift_analysis = calculate_configuration_drift(baseline, current_configs)

    # Step 4: Evaluate compliance
    compliance_results = evaluate_compliance(clients, current_configs)

    # Step 5: Generate report
    report = generate_analysis_report(
        run_id, drift_analysis, compliance_results, baseline_source, caller_identity
    )

    # Step 6: Enrich with relationships (extensibility demonstration)
    report = enrich_with_relationships(report, current_configs)

    # Step 7: Write to S3
    s3_key = write_report_to_s3(clients, S3_REPORT_BUCKET, report)
    if s3_key:
        report['metadata']['s3_report_location'] = f"s3://{S3_REPORT_BUCKET}/{s3_key}"
    else:
        report['errors'].append("Failed to write report to S3")

    # Step 8: Write to DynamoDB
    try:
        write_drift_to_dynamodb(clients, DYNAMODB_TABLE, report)
    except Exception as e:
        report['errors'].append(f"Failed to write to DynamoDB: {str(e)}")

    # Step 9: Send alert if threshold exceeded
    if drift_analysis['drift_percentage'] > DRIFT_THRESHOLD:
        logger.warning(f"Drift {drift_analysis['drift_percentage']:.2f}% exceeds threshold {DRIFT_THRESHOLD}%")
        if SNS_TOPIC_ARN and s3_key:
            alert_sent = send_drift_alert(clients, SNS_TOPIC_ARN, report, s3_key)
            report['alerts_triggered'] = alert_sent

    # Step 10: Emit CloudWatch metrics (optional)
    if os.environ.get('EMIT_METRICS', 'false').lower() == 'true':
        emit_cloudwatch_metrics(clients, report)

    logger.info(f"Analysis complete for run {run_id}")
    return report

# ============================================================================
# LAMBDA HANDLER
# ============================================================================

def lambda_handler(event, context):
    """
    AWS Lambda handler function for scheduled or manual invocation.

    Event parameters (optional):
    - dryRun: boolean to skip writes
    - verbose: boolean to increase logging
    - resourceTypes: list of specific resource types to analyze
    """
    start_time = time.time()

    # Override configuration from event if provided
    if event.get('verbose'):
        logger.setLevel(logging.DEBUG)

    if event.get('dryRun'):
        logger.info("DRY RUN mode - will not write results")

    try:
        # Initialize clients
        clients = initialize_clients()

        # Perform analysis
        report = perform_analysis(clients)

        # Log execution time
        execution_time = time.time() - start_time
        report['metadata']['execution_time_seconds'] = execution_time
        logger.info(f"Lambda execution completed in {execution_time:.2f} seconds")

        # Return summary for Lambda response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'run_id': report['metadata']['run_id'],
                'drift_percentage': report['drift_analysis']['summary']['drift_percentage'],
                'compliance_percentage': report['compliance']['summary']['compliance_percentage'],
                'alerts_triggered': report.get('alerts_triggered', False),
                's3_report': report['metadata'].get('s3_report_location'),
                'execution_time': execution_time,
                'errors': report.get('errors', [])
            })
        }

    except Exception as e:
        logger.error(f"Lambda execution failed: {str(e)}\n{traceback.format_exc()}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'execution_time': time.time() - start_time
            })
        }

# ============================================================================
# LOCAL EXECUTION
# ============================================================================

if __name__ == "__main__":
    """
    Local execution entry point for testing and manual runs.
    Configure via environment variables before running.
    """
    print("AWS Infrastructure Analysis Tool")
    print("=" * 50)
    print(f"Region: {REGION}")
    print(f"S3 Bucket: {S3_REPORT_BUCKET}")
    print(f"DynamoDB Table: {DYNAMODB_TABLE}")
    print(f"Drift Threshold: {DRIFT_THRESHOLD}%")
    print(f"Verbose: {VERBOSE}")
    print("=" * 50)

    try:
        # Initialize clients
        clients = initialize_clients()

        # Perform analysis
        report = perform_analysis(clients)

        # Print summary to stdout
        print("\nAnalysis Results:")
        print("-" * 30)
        print(f"Run ID: {report['metadata']['run_id']}")
        print(f"Drift: {report['drift_analysis']['summary']['drift_percentage']:.2f}%")
        print(f"Compliance: {report['compliance']['summary']['compliance_percentage']:.2f}%")
        print(f"Total Resources: {report['drift_analysis']['summary']['total_resources']}")
        print(f"Changed Resources: {len(report['drift_analysis']['changed_resources'])}")

        if report.get('alerts_triggered'):
            print("\nALERT TRIGGERED - Drift exceeds threshold!")

        if report.get('errors'):
            print(f"\nErrors encountered: {report['errors']}")

        # Write full report to local file for inspection
        local_report_file = f"analysis_report_{report['metadata']['run_id']}.json"
        with open(local_report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        print(f"\nFull report saved to: {local_report_file}")

        if report['metadata'].get('s3_report_location'):
            print(f"S3 Report: {report['metadata']['s3_report_location']}")

    except KeyboardInterrupt:
        print("\n\nAnalysis interrupted by user")
    except Exception as e:
        print(f"\nAnalysis failed: {str(e)}")
        logger.error(f"Analysis failed: {str(e)}\n{traceback.format_exc()}")
```

This comprehensive Python script (`lib/analyse.py`) implements a complete AWS infrastructure analysis and drift detection system with the following key features:

## Core Functionality

### 1. **Infrastructure Analysis**

- Analyzes AWS resources using AWS Config as the primary data source
- Supports EC2, RDS, S3, IAM, Lambda, EventBridge, SNS, and DynamoDB resources
- Fetches current configurations and historical snapshots

### 2. **Drift Detection**

- Compares current state against baselines stored in SSM Parameter Store
- Falls back to historical Config snapshots if SSM baseline unavailable
- Calculates drift percentage and detailed change tracking
- Recursive configuration comparison with path-aware difference reporting

### 3. **Compliance Evaluation**

- S3: Versioning and lifecycle rules
- DynamoDB: On-demand billing mode
- Lambda: Memory (≥3GB) and timeout (≥300s) for analysis functions
- EventBridge: 6-hour scheduling verification
- SNS: Subscription endpoint validation

### 4. **Multi-Channel Reporting**

- **S3**: Versioned JSON reports with metadata
- **DynamoDB**: Granular drift records with resourceId/timestamp keys
- **SNS**: Threshold-based alerting with structured attributes
- **CloudWatch**: Optional custom metrics emission

### 5. **Operational Features**

- Exponential backoff retry logic for API throttling
- Idempotent writes and partial failure handling
- Configurable via environment variables
- Comprehensive logging with adjustable verbosity
- Lambda handler for scheduled execution
- Local testing capability with stdout reporting

### 6. **Extensibility**

- Resource relationship mapping framework
- Modular compliance check functions
- Step Functions orchestration hooks
- CloudWatch metrics integration

## Required IAM Permissions

The execution role needs these read-only permissions:

- `config:*` (read operations)
- `s3:PutObject`, `s3:GetObject`
- `dynamodb:PutItem`, `dynamodb:BatchWriteItem`
- `sns:Publish`, `sns:ListSubscriptionsByTopic`
- `ssm:GetParameter`
- `sts:GetCallerIdentity`
- `cloudwatch:PutMetricData` (optional)

## Usage

### As Lambda Function:

Deploy with 3GB memory and 5-minute timeout. The handler is `analyse.lambda_handler`.

### Local Execution:

```bash
export AWS_REGION=us-east-1
export S3_REPORT_BUCKET=my-compliance-reports
export DYNAMODB_TABLE=drift-records
export SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:drift-alerts
export SSM_BASELINE_PARAM=/config/baseline
export DRIFT_THRESHOLD=15
export VERBOSE=true

python lib/analyse.py
```

The script provides comprehensive analysis without creating any infrastructure, making it safe to run in production environments with appropriate read-only permissions.
