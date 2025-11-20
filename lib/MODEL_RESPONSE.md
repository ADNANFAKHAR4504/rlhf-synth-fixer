# AWS Compliance Auditing System - Initial Implementation

This implementation provides an automated compliance auditing system using AWS CDK with Python.

## File: lib/compliance_stack.py

```python
"""Compliance auditing stack for AWS infrastructure monitoring."""

from aws_cdk import (
    Stack,
    aws_config as config,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_sns as sns,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
    Tags,
)
from constructs import Construct
from typing import Optional


class ComplianceStackProps:
    """Properties for the ComplianceStack."""

    def __init__(self, environment_suffix: Optional[str] = None):
        self.environment_suffix = environment_suffix or 'dev'


class ComplianceStack(Construct):
    """Stack for compliance auditing infrastructure."""

    def __init__(self, scope: Construct, construct_id: str, props: ComplianceStackProps):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix

        # Apply tags
        Tags.of(self).add('Environment', 'audit')
        Tags.of(self).add('CostCenter', 'compliance')

        # S3 bucket for compliance reports
        compliance_bucket = s3.Bucket(
            self, 'ComplianceBucket',
            bucket_name=f'compliance-reports-{env_suffix}',
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(2555)  # 7 years
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # SNS topic for alerts (missing DLQ)
        alert_topic = sns.Topic(
            self, 'ComplianceAlerts',
            topic_name=f'compliance-alerts-{env_suffix}',
            display_name='Compliance Alerts'
        )

        # IAM role for AWS Config (WRONG managed policy name)
        config_role = iam.Role(
            self, 'ConfigRole',
            role_name=f'config-role-{env_suffix}',
            assumed_by=iam.ServicePrincipal('config.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name('ConfigRole')  # WRONG
            ]
        )

        # Grant Config access to S3 bucket
        compliance_bucket.grant_write(config_role)

        # AWS Config recorder
        recorder = config.CfnConfigurationRecorder(
            self, 'ConfigRecorder',
            name=f'config-recorder-{env_suffix}',
            role_arn=config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,
                include_global_resource_types=True
                # Missing: exclusion of CloudWatch Logs
            )
        )

        # Delivery channel
        delivery_channel = config.CfnDeliveryChannel(
            self, 'DeliveryChannel',
            name=f'config-delivery-{env_suffix}',
            s3_bucket_name=compliance_bucket.bucket_name,
            sns_topic_arn=alert_topic.topic_arn
        )
        delivery_channel.add_dependency(recorder)

        # Lambda execution role (overly permissive)
        lambda_role = iam.Role(
            self, 'LambdaRole',
            role_name=f'compliance-lambda-role-{env_suffix}',
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.from_aws_managed_policy_name('AWSConfigUserAccess')  # Too broad
            ]
        )

        compliance_bucket.grant_write(lambda_role)

        # Lambda function for compliance reporting
        compliance_function = lambda_.Function(
            self, 'ComplianceFunction',
            function_name=f'compliance-reporter-{env_suffix}',
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler='index.handler',
            code=lambda_.Code.from_inline('''
import json
import boto3
from datetime import datetime

config_client = boto3.client('config')
s3_client = boto3.client('s3')

def handler(event, context):
    """Generate compliance report from AWS Config."""

    # Get non-compliant resources
    non_compliant = []

    # Check S3 encryption
    s3_response = config_client.get_compliance_details_by_config_rule(
        ConfigRuleName='s3-bucket-encryption-enabled'
    )

    for item in s3_response.get('EvaluationResults', []):
        if item['ComplianceType'] == 'NON_COMPLIANT':
            non_compliant.append({
                'resource': item['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceId'],
                'type': 'S3',
                'issue': 'Encryption not enabled'
            })

    # Generate report
    report = {
        'timestamp': datetime.utcnow().isoformat(),
        'non_compliant_resources': non_compliant,
        'total_count': len(non_compliant)
    }

    # Store in S3
    bucket_name = context.env.get('BUCKET_NAME')  # Wrong way to get env var
    key = f'reports/{datetime.utcnow().strftime("%Y-%m-%d")}.json'

    s3_client.put_object(
        Bucket=bucket_name,
        Key=key,
        Body=json.dumps(report, indent=2)
    )

    return {
        'statusCode': 200,
        'body': json.dumps(report)
    }
'''),
            timeout=Duration.minutes(5),
            architecture=lambda_.Architecture.ARM_64,
            role=lambda_role,
            environment={
                'BUCKET_NAME': compliance_bucket.bucket_name
            },
            log_retention=logs.RetentionDays.ONE_MONTH
        )

        # AWS Config Rules

        # Rule 1: S3 bucket encryption
        s3_encryption_rule = config.ManagedRule(
            self, 'S3EncryptionRule',
            config_rule_name=f's3-encryption-{env_suffix}',
            identifier='S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
            description='Check that S3 buckets have encryption enabled'
        )

        # Rule 2: RDS encryption (missing)
        # Rule 3: EC2 IMDSv2 (missing)

        # Store outputs
        self.bucket = compliance_bucket
        self.topic = alert_topic
        self.function = compliance_function
```

## File: lib/__init__.py

```python
"""Compliance auditing infrastructure package."""
```

## File: lib/lambda/compliance_reporter.py

```python
"""
Compliance reporter Lambda function.

This function aggregates non-compliant resources from AWS Config
and generates JSON compliance reports.
"""

import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any


config_client = boto3.client('config')
s3_client = boto3.client('s3')


def get_non_compliant_resources(rule_name: str) -> List[Dict[str, Any]]:
    """
    Get non-compliant resources for a specific Config rule.

    Args:
        rule_name: Name of the AWS Config rule

    Returns:
        List of non-compliant resources
    """
    non_compliant = []

    try:
        response = config_client.get_compliance_details_by_config_rule(
            ConfigRuleName=rule_name,
            ComplianceTypes=['NON_COMPLIANT']
        )

        for item in response.get('EvaluationResults', []):
            resource_id = item['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceId']
            resource_type = item['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceType']

            non_compliant.append({
                'resource_id': resource_id,
                'resource_type': resource_type,
                'rule': rule_name,
                'timestamp': item['ResultRecordedTime'].isoformat()
            })
    except Exception as e:
        print(f"Error getting compliance details for {rule_name}: {str(e)}")

    return non_compliant


def generate_compliance_report() -> Dict[str, Any]:
    """
    Generate comprehensive compliance report.

    Returns:
        Compliance report dictionary
    """
    # Config rules to check
    rules = [
        's3-encryption',
        'rds-encryption',
        'ec2-imdsv2'
    ]

    all_non_compliant = []

    for rule in rules:
        non_compliant = get_non_compliant_resources(rule)
        all_non_compliant.extend(non_compliant)

    report = {
        'report_date': datetime.utcnow().isoformat(),
        'total_non_compliant': len(all_non_compliant),
        'non_compliant_resources': all_non_compliant,
        'summary': {
            's3': len([r for r in all_non_compliant if 'S3' in r['resource_type']]),
            'rds': len([r for r in all_non_compliant if 'RDS' in r['resource_type']]),
            'ec2': len([r for r in all_non_compliant if 'EC2' in r['resource_type']])
        }
    }

    return report


def store_report(report: Dict[str, Any], bucket_name: str) -> str:
    """
    Store compliance report in S3.

    Args:
        report: Compliance report dictionary
        bucket_name: S3 bucket name

    Returns:
        S3 key where report was stored
    """
    timestamp = datetime.utcnow()
    key = f'reports/{timestamp.strftime("%Y/%m/%d")}/{timestamp.strftime("%Y%m%d-%H%M%S")}.json'

    s3_client.put_object(
        Bucket=bucket_name,
        Key=key,
        Body=json.dumps(report, indent=2),
        ContentType='application/json'
    )

    return key


def handler(event, context):
    """
    Lambda handler for compliance reporting.

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        Response dictionary
    """
    try:
        # Get bucket name from environment
        bucket_name = os.environ.get('BUCKET_NAME')

        if not bucket_name:
            raise ValueError('BUCKET_NAME environment variable not set')

        # Generate report
        report = generate_compliance_report()

        # Store in S3
        key = store_report(report, bucket_name)

        print(f"Compliance report generated: {report['total_non_compliant']} non-compliant resources")
        print(f"Report stored at s3://{bucket_name}/{key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Compliance report generated successfully',
                'report_location': f's3://{bucket_name}/{key}',
                'non_compliant_count': report['total_non_compliant']
            })
        }

    except Exception as e:
        print(f"Error generating compliance report: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error generating compliance report',
                'error': str(e)
            })
        }
```

## File: lib/README.md

```markdown
# AWS Compliance Auditing System

Automated infrastructure compliance monitoring using AWS Config and Lambda.

## Overview

This system continuously monitors AWS resources for compliance with security policies:

- S3 bucket encryption
- RDS instance encryption
- EC2 IMDSv2 enforcement

Non-compliant resources are aggregated into JSON reports and stored in S3 with 7-year retention.

## Architecture

- **AWS Config**: Continuous configuration monitoring
- **Lambda**: Compliance report generation
- **S3**: Report storage with versioning
- **SNS**: Real-time alerting
- **CloudWatch Logs**: Lambda execution logs

## Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Deploy
cdk deploy --context environmentSuffix=dev
```

## Configuration

Set the `environmentSuffix` context variable to distinguish environments:

```bash
cdk deploy --context environmentSuffix=prod
```

## Reports

Compliance reports are stored in S3:

```
s3://compliance-reports-{suffix}/reports/YYYY/MM/DD/YYYYMMDD-HHMMSS.json
```

Report format:

```json
{
  "report_date": "2025-01-15T10:30:00Z",
  "total_non_compliant": 5,
  "non_compliant_resources": [
    {
      "resource_id": "my-bucket",
      "resource_type": "AWS::S3::Bucket",
      "rule": "s3-encryption",
      "timestamp": "2025-01-15T10:00:00Z"
    }
  ],
  "summary": {
    "s3": 3,
    "rds": 1,
    "ec2": 1
  }
}
```
```
