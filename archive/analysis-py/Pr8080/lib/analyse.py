#!/usr/bin/env python3
"""
AWS Resource Audit and Infrastructure Analysis Script
Identifies unused and misconfigured resources in AWS environment.
Performs infrastructure analysis, configuration drift detection, and compliance evaluation.
"""

import hashlib
import json
import logging
import os
import time
import traceback
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError

# ============================================================================
# CONFIGURATION
# ============================================================================

# Environment variable configuration with defaults
DEFAULT_REGION = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
REGION = os.environ.get('AWS_REGION', DEFAULT_REGION)
ENDPOINT_URL = os.environ.get('AWS_ENDPOINT_URL')
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
# BOTO CLIENT HELPER
# ============================================================================

def boto_client(service: str, region: str = DEFAULT_REGION):
    """Create a boto3 client respecting optional local endpoint."""
    return boto3.client(service, region_name=region, endpoint_url=ENDPOINT_URL)


# ============================================================================
# INFRASTRUCTURE ANALYZER CLASS
# ============================================================================

class InfrastructureAnalyzer:
    """
    AWS Infrastructure Analysis and Drift Detection.
    
    Purpose:
        Performs infrastructure analysis, configuration drift detection, and compliance
        evaluation for AWS resources using AWS Config as the primary data source.
    """
    
    def __init__(self, clients: Dict = None, region: str = None):
        """Initialize the InfrastructureAnalyzer with AWS clients."""
        self.region = region or REGION
        if clients:
            self.clients = clients
        else:
            self.clients = self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize boto3 clients with proper error handling and configuration."""
        try:
            clients = {
                'config': boto_client('config', self.region),
                's3': boto_client('s3', self.region),
                'dynamodb': boto_client('dynamodb', self.region),
                'sns': boto_client('sns', self.region),
                'ssm': boto_client('ssm', self.region),
                'sts': boto_client('sts', self.region),
                'cloudwatch': boto_client('cloudwatch', self.region)
            }
            logger.info(f"Initialized AWS clients for region: {self.region}")
            return clients
        except Exception as e:
            logger.error(f"Failed to initialize AWS clients: {str(e)}")
            raise
    
    def load_baseline_from_ssm(self, param_name: str) -> Optional[Dict]:
        """Load baseline configuration from SSM Parameter Store."""
        try:
            response = self.clients['ssm'].get_parameter(
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
    
    def derive_baseline_from_config(self, resource_types: List[str]) -> Dict:
        """Derive baseline from oldest available Config snapshot."""
        baseline = {
            'source': 'config_history',
            'timestamp': None,
            'resources': {}
        }
        
        try:
            for resource_type in resource_types:
                response = self.clients['config'].list_discovered_resources(
                    resourceType=resource_type,
                    limit=100
                )
                
                for resource in response.get('resourceIdentifiers', []):
                    resource_id = resource['resourceId']
                    
                    history = self.clients['config'].get_resource_config_history(
                        resourceType=resource_type,
                        resourceId=resource_id,
                        limit=1,
                        chronologicalOrder='Reverse'
                    )
                    
                    if history['configurationItems']:
                        config_item = history['configurationItems'][0]
                        baseline['resources'][resource_id] = {
                            'type': resource_type,
                            'configuration': config_item.get('configuration', {}),
                            'configurationItemCaptureTime': config_item.get('configurationItemCaptureTime', '').isoformat()
                        }
                        
                        if not baseline['timestamp'] or config_item['configurationItemCaptureTime'] < baseline['timestamp']:
                            baseline['timestamp'] = config_item['configurationItemCaptureTime']
            
            logger.info(f"Derived baseline from Config history with {len(baseline['resources'])} resources")
            return baseline
            
        except Exception as e:
            logger.error(f"Error deriving baseline from Config: {str(e)}")
            return baseline
    
    def fetch_current_configurations(self, resource_types: List[str]) -> Dict:
        """Fetch current resource configurations from AWS Config."""
        current_configs = {}
        
        try:
            for resource_type in resource_types:
                logger.debug(f"Fetching configurations for {resource_type}")
                
                response = self.clients['config'].list_discovered_resources(
                    resourceType=resource_type,
                    limit=100
                )
                
                resource_ids = [r['resourceId'] for r in response.get('resourceIdentifiers', [])]
                
                if resource_ids:
                    batch_response = self.clients['config'].batch_get_resource_config(
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
    
    def calculate_configuration_drift(self, baseline: Dict, current: Dict) -> Dict:
        """Calculate drift between baseline and current configurations."""
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
        
        for resource_id, current_config in current.items():
            if resource_id in baseline_resources:
                baseline_config = baseline_resources[resource_id]
                differences = self._compare_configurations(
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
        
        for resource_id in baseline_resources:
            if resource_id not in current:
                drift_analysis['removed_resources'].append(resource_id)
        
        total_tracked = max(len(current), len(baseline_resources))
        if total_tracked > 0:
            changed_count = (len(drift_analysis['changed_resources']) + 
                            len(drift_analysis['added_resources']) + 
                            len(drift_analysis['removed_resources']))
            drift_analysis['drift_percentage'] = (changed_count / total_tracked) * 100
        
        logger.info(f"Drift analysis complete: {drift_analysis['drift_percentage']:.2f}% drift detected")
        return drift_analysis
    
    def _compare_configurations(self, baseline: Any, current: Any, path: str = "") -> List[Dict]:
        """Recursively compare two configuration objects."""
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
                        self._compare_configurations(baseline[key], current[key], new_path)
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
                        self._compare_configurations(b_item, c_item, f"{path}[{i}]")
                    )
        
        elif baseline != current:
            differences.append({
                'path': path or 'root',
                'type': 'value_change',
                'baseline': baseline,
                'current': current
            })
        
        return differences
    
    def evaluate_compliance(self, current_configs: Dict) -> Dict:
        """Evaluate resources against compliance rules."""
        compliance_results = {
            'checks_performed': [],
            'total_checks': 0,
            'passed_checks': 0,
            'failed_checks': 0,
            'findings': []
        }
        
        compliance_results['findings'].extend(self._check_s3_compliance(current_configs))
        compliance_results['findings'].extend(self._check_dynamodb_compliance(current_configs))
        compliance_results['findings'].extend(self._check_lambda_compliance(current_configs))
        compliance_results['findings'].extend(self._check_eventbridge_compliance(current_configs))
        compliance_results['findings'].extend(self._check_sns_compliance(current_configs))
        
        compliance_results['total_checks'] = len(compliance_results['findings'])
        compliance_results['passed_checks'] = sum(1 for f in compliance_results['findings'] if f['status'] == 'PASS')
        compliance_results['failed_checks'] = sum(1 for f in compliance_results['findings'] if f['status'] == 'FAIL')
        compliance_results['checks_performed'] = list(set(f['check_name'] for f in compliance_results['findings']))
        
        logger.info(f"Compliance evaluation complete: {compliance_results['passed_checks']}/{compliance_results['total_checks']} checks passed")
        return compliance_results
    
    def _check_s3_compliance(self, configs: Dict) -> List[Dict]:
        """Check S3 buckets for versioning and lifecycle rules."""
        findings = []
        
        for resource_id, config in configs.items():
            if config['type'] == 'AWS::S3::Bucket':
                bucket_config = config.get('configuration', {})
                
                versioning_status = bucket_config.get('BucketVersioningConfiguration', {}).get('Status', 'Disabled')
                findings.append({
                    'resource_id': resource_id,
                    'resource_type': 'S3_BUCKET',
                    'check_name': 'S3_VERSIONING_ENABLED',
                    'status': 'PASS' if versioning_status == 'Enabled' else 'FAIL',
                    'message': f"Versioning is {versioning_status}",
                    'remediation': 'Enable versioning using: aws s3api put-bucket-versioning --bucket BUCKET --versioning-configuration Status=Enabled'
                })
                
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
    
    def _check_dynamodb_compliance(self, configs: Dict) -> List[Dict]:
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
    
    def _check_lambda_compliance(self, configs: Dict) -> List[Dict]:
        """Check Lambda functions for memory and timeout requirements."""
        findings = []
        
        for resource_id, config in configs.items():
            if config['type'] == 'AWS::Lambda::Function':
                lambda_config = config.get('configuration', {})
                memory = lambda_config.get('MemorySize', 128)
                timeout = lambda_config.get('Timeout', 3)
                
                if 'analyse' in resource_id.lower() or 'analysis' in resource_id.lower():
                    findings.append({
                        'resource_id': resource_id,
                        'resource_type': 'LAMBDA_FUNCTION',
                        'check_name': 'LAMBDA_ANALYSIS_MEMORY',
                        'status': 'PASS' if memory >= 3072 else 'FAIL',
                        'message': f"Memory is {memory}MB (required: >=3072MB for analysis)",
                        'remediation': 'Update memory: aws lambda update-function-configuration --function-name FUNCTION --memory-size 3072'
                    })
                    
                    findings.append({
                        'resource_id': resource_id,
                        'resource_type': 'LAMBDA_FUNCTION',
                        'check_name': 'LAMBDA_ANALYSIS_TIMEOUT',
                        'status': 'PASS' if timeout >= 300 else 'FAIL',
                        'message': f"Timeout is {timeout}s (required: >=300s for analysis)",
                        'remediation': 'Update timeout: aws lambda update-function-configuration --function-name FUNCTION --timeout 300'
                    })
        
        return findings
    
    def _check_eventbridge_compliance(self, configs: Dict) -> List[Dict]:
        """Check EventBridge rules for proper scheduling."""
        findings = []
        
        for resource_id, config in configs.items():
            if config['type'] == 'AWS::Events::Rule':
                rule_config = config.get('configuration', {})
                schedule = rule_config.get('ScheduleExpression', '')
                
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
    
    def _check_sns_compliance(self, configs: Dict) -> List[Dict]:
        """Check SNS topics for subscription endpoints."""
        findings = []
        
        for resource_id, config in configs.items():
            if config['type'] == 'AWS::SNS::Topic':
                topic_arn = config.get('arn', '')
                
                try:
                    response = self.clients['sns'].list_subscriptions_by_topic(TopicArn=topic_arn)
                    subscriptions = response.get('Subscriptions', [])
                    
                    findings.append({
                        'resource_id': resource_id,
                        'resource_type': 'SNS_TOPIC',
                        'check_name': 'SNS_HAS_SUBSCRIPTIONS',
                        'status': 'PASS' if subscriptions else 'FAIL',
                        'message': f"Topic has {len(subscriptions)} subscription(s)",
                        'remediation': 'Add email or other subscription: aws sns subscribe --topic-arn ARN --protocol email --notification-endpoint EMAIL'
                    })
                    
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
    
    def generate_analysis_report(self, run_id: str, drift_analysis: Dict, compliance_results: Dict, 
                                baseline_source: str, caller_identity: Dict) -> Dict:
        """Generate comprehensive JSON analysis report."""
        report = {
            'metadata': {
                'run_id': run_id,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'region': self.region,
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
    
    def write_report_to_s3(self, bucket: str, report: Dict) -> Optional[str]:
        """Write analysis report to S3 bucket with versioning."""
        try:
            timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
            s3_key = f"compliance-reports/{report['metadata']['run_id']}/{timestamp}_analysis.json"
            
            json_content = json.dumps(report, indent=2, default=str)
            content_hash = hashlib.sha256(json_content.encode()).hexdigest()
            
            response = self.clients['s3'].put_object(
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
    
    def write_drift_to_dynamodb(self, table: str, report: Dict):
        """Write drift records to DynamoDB table."""
        try:
            items_to_write = []
            timestamp = report['metadata']['timestamp']
            run_id = report['metadata']['run_id']
            
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
            
            for i in range(0, len(items_to_write), 25):
                batch = items_to_write[i:i+25]
                response = self.clients['dynamodb'].batch_write_item(
                    RequestItems={
                        table: batch
                    }
                )
                
                unprocessed = response.get('UnprocessedItems', {})
                if unprocessed:
                    logger.warning(f"Retrying {len(unprocessed)} unprocessed items")
                    time.sleep(1)
                    self.clients['dynamodb'].batch_write_item(RequestItems=unprocessed)
            
            logger.info(f"Wrote {len(items_to_write)} drift records to DynamoDB")
            
        except Exception as e:
            logger.error(f"Failed to write drift records to DynamoDB: {str(e)}")
            raise
    
    def send_drift_alert(self, topic_arn: str, report: Dict, s3_key: str):
        """Send SNS alert when drift exceeds threshold."""
        try:
            drift_percentage = report['drift_analysis']['summary']['drift_percentage']
            
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
            
            response = self.clients['sns'].publish(
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
    
    def perform_analysis(self) -> Dict:
        """Main analysis orchestration function."""
        run_id = f"run_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{os.getpid()}"
        logger.info(f"Starting analysis run: {run_id}")
        
        try:
            caller_identity = self.clients['sts'].get_caller_identity()
        except Exception as e:
            logger.warning(f"Could not get caller identity: {str(e)}")
            caller_identity = {}
        
        baseline = self.load_baseline_from_ssm(SSM_BASELINE_PARAM)
        baseline_source = 'ssm_parameter'
        
        if not baseline:
            logger.info("SSM baseline not found, deriving from Config history")
            baseline = self.derive_baseline_from_config(RESOURCE_TYPES)
            baseline_source = 'config_history_fallback'
        
        current_configs = self.fetch_current_configurations(RESOURCE_TYPES)
        drift_analysis = self.calculate_configuration_drift(baseline, current_configs)
        compliance_results = self.evaluate_compliance(current_configs)
        
        report = self.generate_analysis_report(
            run_id, drift_analysis, compliance_results, baseline_source, caller_identity
        )
        
        s3_key = self.write_report_to_s3(S3_REPORT_BUCKET, report)
        if s3_key:
            report['metadata']['s3_report_location'] = f"s3://{S3_REPORT_BUCKET}/{s3_key}"
        else:
            report['errors'].append("Failed to write report to S3")
        
        try:
            self.write_drift_to_dynamodb(DYNAMODB_TABLE, report)
        except Exception as e:
            report['errors'].append(f"Failed to write to DynamoDB: {str(e)}")
        
        if drift_analysis['drift_percentage'] > DRIFT_THRESHOLD:
            logger.warning(f"Drift {drift_analysis['drift_percentage']:.2f}% exceeds threshold {DRIFT_THRESHOLD}%")
            if SNS_TOPIC_ARN and s3_key:
                alert_sent = self.send_drift_alert(SNS_TOPIC_ARN, report, s3_key)
                report['alerts_triggered'] = alert_sent
        
        logger.info(f"Analysis complete for run {run_id}")
        return report
    
    def run_full_analysis(self):
        """Run the complete AWS resource audit and infrastructure analysis."""
        try:
            print("AWS Infrastructure Analysis Tool")
            print("=" * 60)
            print(f"Region: {self.region}")
            print(f"S3 Bucket: {S3_REPORT_BUCKET}")
            print(f"DynamoDB Table: {DYNAMODB_TABLE}")
            print(f"Drift Threshold: {DRIFT_THRESHOLD}%")
            print(f"Verbose: {VERBOSE}")
            print("=" * 60)
            
            # Perform infrastructure analysis
            print("\nRunning Infrastructure Drift & Compliance Analysis...")
            analysis_report = self.perform_analysis()
            
            # Print analysis summary to stdout
            print("\nInfrastructure Analysis Results:")
            print("-" * 40)
            print(f"Run ID: {analysis_report['metadata']['run_id']}")
            print(f"Drift: {analysis_report['drift_analysis']['summary']['drift_percentage']:.2f}%")
            print(f"Compliance: {analysis_report['compliance']['summary']['compliance_percentage']:.2f}%")
            print(f"Total Resources: {analysis_report['drift_analysis']['summary']['total_resources']}")
            print(f"Changed Resources: {len(analysis_report['drift_analysis']['changed_resources'])}")
            
            if analysis_report.get('alerts_triggered'):
                print("\nALERT TRIGGERED - Drift exceeds threshold!")
            
            if analysis_report.get('errors'):
                print(f"\nErrors encountered: {analysis_report['errors']}")
            
            # Write full report to stdout as JSON
            print("\nFull Report:")
            print(json.dumps(analysis_report, indent=2, default=str))
            
            # Write full report to local file for inspection
            local_report_file = f"analysis_report_{analysis_report['metadata']['run_id']}.json"
            with open(local_report_file, 'w') as f:
                json.dump(analysis_report, f, indent=2, default=str)
            print(f"\nFull infrastructure analysis report saved to: {local_report_file}")
            
            if analysis_report['metadata'].get('s3_report_location'):
                print(f"S3 Report: {analysis_report['metadata']['s3_report_location']}")
            
            print("=" * 60)
            print("Analysis complete!")
            print("=" * 60)
            
            return 0
            
        except KeyboardInterrupt:
            print("\n\nAnalysis interrupted by user")
            return 1
        except Exception as e:
            print(f"\nError during analysis: {e}")
            logger.error(f"Analysis failed: {str(e)}\n{traceback.format_exc()}")
            return 1


# ============================================================================
# RESOURCE AUDITOR CLASS
# ============================================================================


class AWSResourceAuditor:
    """Audits AWS resources for optimization and security improvements."""
    
    def __init__(self, region_name: str = None):
        """
        Initialize AWS clients for resource auditing.
        
        Args:
            region_name: AWS region name (uses default if not specified)
        """
        self.region_name = region_name or DEFAULT_REGION
        self.ec2_client = boto_client('ec2', self.region_name)
        self.logs_client = boto_client('logs', self.region_name)

def main():
    """Main entry point for the script."""
    analyzer = InfrastructureAnalyzer()
    return analyzer.run_full_analysis()


if __name__ == "__main__":
    exit(main())
