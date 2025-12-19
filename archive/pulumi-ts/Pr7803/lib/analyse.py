#!/usr/bin/env python3
"""
AWS Infrastructure Compliance Analyzer - Analysis Script
Validates deployed compliance scanning infrastructure and tests Lambda function execution
"""

import json
import boto3
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ComplianceAnalyzer:
    """Analyzes deployed compliance monitoring infrastructure"""

    def __init__(self, region='us-east-1', endpoint_url=None):
        """
        Initialize analyzer with AWS clients

        Args:
            region: AWS region
            endpoint_url: Optional endpoint URL for testing
        """
        self.region = region
        self.endpoint_url = endpoint_url
        self.env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        self.timestamp = datetime.now(timezone.utc).isoformat()

        # Initialize AWS clients
        client_config = {'region_name': region}
        if endpoint_url:
            client_config['endpoint_url'] = endpoint_url

        self.lambda_client = boto3.client('lambda', **client_config)
        self.s3_client = boto3.client('s3', **client_config)
        self.sns_client = boto3.client('sns', **client_config)
        self.cloudwatch_client = boto3.client('cloudwatch', **client_config)
        self.iam_client = boto3.client('iam', **client_config)
        self.kms_client = boto3.client('kms', **client_config)

        logger.info(f"Initialized analyzer for environment: {self.env_suffix}")

    def analyze_lambda_function(self) -> Dict[str, Any]:
        """Analyze compliance scanner Lambda function"""
        logger.info("Analyzing Lambda function...")
        lambda_analysis = {
            'exists': False,
            'configuration': {},
            'invocation_result': {}
        }

        function_name = f"compliance-scanner-{self.env_suffix}"

        try:
            # Get function configuration
            response = self.lambda_client.get_function(FunctionName=function_name)
            lambda_analysis['exists'] = True

            config = response['Configuration']
            lambda_analysis['configuration'] = {
                'function_name': config['FunctionName'],
                'runtime': config['Runtime'],
                'memory_size': config['MemorySize'],
                'timeout': config['Timeout'],
                'role': config['Role'],
                'environment': config.get('Environment', {}).get('Variables', {}),
                'last_modified': config['LastModified']
            }

            logger.info(f"✓ Lambda function found: {function_name}")
            logger.info(f"  Runtime: {config['Runtime']}, Memory: {config['MemorySize']}MB, Timeout: {config['Timeout']}s")

            # Validate environment variables
            env_vars = config.get('Environment', {}).get('Variables', {})
            required_vars = ['REPORT_BUCKET', 'SNS_TOPIC_ARN', 'ENVIRONMENT_SUFFIX']
            missing_vars = [var for var in required_vars if var not in env_vars]

            if missing_vars:
                logger.warning(f"Missing environment variables: {missing_vars}")
                lambda_analysis['configuration']['missing_vars'] = missing_vars
            else:
                logger.info("✓ All required environment variables present")

            # Invoke Lambda function to test execution
            logger.info("Invoking Lambda function for compliance scan...")
            try:
                invoke_response = self.lambda_client.invoke(
                    FunctionName=function_name,
                    InvocationType='RequestResponse'
                )

                # Read payload and handle empty/invalid responses
                payload_data = invoke_response['Payload'].read()
                if payload_data:
                    try:
                        payload = json.loads(payload_data)
                    except json.JSONDecodeError:
                        payload = {'error': 'Invalid JSON response', 'raw': payload_data.decode('utf-8', errors='ignore')}
                else:
                    payload = {'error': 'Empty response'}

                # Determine success based on invocation status
                # Lambda can return with statusCode 200 but have an error in FunctionError field
                has_function_error = 'FunctionError' in invoke_response
                status_ok = invoke_response['StatusCode'] == 200

                invocation_success = status_ok and not has_function_error

                lambda_analysis['invocation_result'] = {
                    'status_code': invoke_response['StatusCode'],
                    'payload': payload,
                    'success': invocation_success
                }

                if invocation_success:
                    logger.info("✓ Lambda function executed successfully")
                    if 'body' in payload:
                        body = json.loads(payload['body']) if isinstance(payload['body'], str) else payload['body']
                        logger.info(f"  Total violations: {body.get('totalViolations', 0)}")
                        logger.info(f"  Critical violations: {body.get('criticalViolations', 0)}")
                else:
                    error_msg = f"Lambda invocation status: {invoke_response['StatusCode']}"
                    if has_function_error:
                        error_msg += f", FunctionError: {invoke_response.get('FunctionError', 'Unknown')}"
                    logger.warning(error_msg)

            except Exception as e:
                logger.error(f"Error invoking Lambda function: {str(e)}")
                lambda_analysis['invocation_result'] = {
                    'error': str(e),
                    'success': False
                }

        except self.lambda_client.exceptions.ResourceNotFoundException:
            logger.error(f"✗ Lambda function not found: {function_name}")
        except Exception as e:
            logger.error(f"Error analyzing Lambda function: {str(e)}")
            lambda_analysis['error'] = str(e)

        return lambda_analysis

    def analyze_s3_bucket(self) -> Dict[str, Any]:
        """Analyze S3 bucket for compliance reports"""
        logger.info("Analyzing S3 bucket...")
        s3_analysis = {
            'exists': False,
            'configuration': {},
            'reports': []
        }

        bucket_name = f"compliance-reports-{self.env_suffix}"

        try:
            # Check bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)
            s3_analysis['exists'] = True
            logger.info(f"✓ S3 bucket found: {bucket_name}")

            # Check versioning
            try:
                versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
                s3_analysis['configuration']['versioning'] = versioning.get('Status', 'Disabled')
                logger.info(f"  Versioning: {versioning.get('Status', 'Disabled')}")
            except Exception as e:
                logger.warning(f"Could not check versioning: {str(e)}")

            # Check encryption
            try:
                encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                s3_analysis['configuration']['encryption'] = 'Enabled'
                logger.info("  Encryption: Enabled")
            except Exception as e:
                # Handle encryption not configured (moto doesn't have ServerSideEncryptionConfigurationNotFoundError)
                if 'ServerSideEncryptionConfigurationNotFoundError' in str(type(e)) or 'not found' in str(e).lower():
                    s3_analysis['configuration']['encryption'] = 'Disabled'
                    logger.warning("  Encryption: Disabled")
                else:
                    logger.warning(f"Could not check encryption: {str(e)}")

            # Check public access block
            try:
                public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
                config = public_access['PublicAccessBlockConfiguration']
                s3_analysis['configuration']['public_access_blocked'] = all([
                    config.get('BlockPublicAcls', False),
                    config.get('BlockPublicPolicy', False),
                    config.get('IgnorePublicAcls', False),
                    config.get('RestrictPublicBuckets', False)
                ])
                logger.info(f"  Public access blocked: {s3_analysis['configuration']['public_access_blocked']}")
            except Exception as e:
                logger.warning(f"Could not check public access block: {str(e)}")

            # List recent reports
            try:
                response = self.s3_client.list_objects_v2(
                    Bucket=bucket_name,
                    Prefix='compliance-reports/',
                    MaxKeys=10
                )

                if 'Contents' in response:
                    s3_analysis['reports'] = [
                        {
                            'key': obj['Key'],
                            'size': obj['Size'],
                            'last_modified': obj['LastModified'].isoformat()
                        }
                        for obj in response['Contents']
                    ]
                    logger.info(f"✓ Found {len(s3_analysis['reports'])} compliance reports")
                else:
                    logger.info("  No reports found yet")

            except Exception as e:
                logger.warning(f"Could not list reports: {str(e)}")

        except self.s3_client.exceptions.NoSuchBucket:
            logger.error(f"✗ S3 bucket not found: {bucket_name}")
        except Exception as e:
            logger.error(f"Error analyzing S3 bucket: {str(e)}")
            s3_analysis['error'] = str(e)

        return s3_analysis

    def analyze_sns_topic(self) -> Dict[str, Any]:
        """Analyze SNS topic for critical alerts"""
        logger.info("Analyzing SNS topic...")
        sns_analysis = {
            'exists': False,
            'configuration': {},
            'subscriptions': []
        }

        topic_name = f"compliance-alerts-{self.env_suffix}"

        try:
            # List topics to find ours
            response = self.sns_client.list_topics()
            topic_arn = None

            for topic in response.get('Topics', []):
                if topic_name in topic['TopicArn']:
                    topic_arn = topic['TopicArn']
                    break

            if topic_arn:
                sns_analysis['exists'] = True
                sns_analysis['configuration']['arn'] = topic_arn
                logger.info(f"✓ SNS topic found: {topic_name}")

                # Get topic attributes
                attrs = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
                sns_analysis['configuration']['attributes'] = attrs['Attributes']

                # Check KMS encryption
                if 'KmsMasterKeyId' in attrs['Attributes']:
                    sns_analysis['configuration']['kms_encrypted'] = True
                    logger.info("  KMS encryption: Enabled")
                else:
                    sns_analysis['configuration']['kms_encrypted'] = False
                    logger.warning("  KMS encryption: Disabled")

                # List subscriptions
                subs = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
                sns_analysis['subscriptions'] = [
                    {
                        'protocol': sub['Protocol'],
                        'endpoint': sub['Endpoint'],
                        'status': sub['SubscriptionArn'] != 'PendingConfirmation'
                    }
                    for sub in subs.get('Subscriptions', [])
                ]
                logger.info(f"  Subscriptions: {len(sns_analysis['subscriptions'])}")

            else:
                logger.error(f"✗ SNS topic not found: {topic_name}")

        except Exception as e:
            logger.error(f"Error analyzing SNS topic: {str(e)}")
            sns_analysis['error'] = str(e)

        return sns_analysis

    def analyze_iam_role(self) -> Dict[str, Any]:
        """Analyze IAM role for Lambda function"""
        logger.info("Analyzing IAM role...")
        iam_analysis = {
            'exists': False,
            'configuration': {},
            'policies': {}
        }

        role_name = f"compliance-scanner-role-{self.env_suffix}"

        try:
            # Get role
            response = self.iam_client.get_role(RoleName=role_name)
            iam_analysis['exists'] = True

            role = response['Role']
            iam_analysis['configuration'] = {
                'role_name': role['RoleName'],
                'arn': role['Arn'],
                'created': role['CreateDate'].isoformat()
            }

            logger.info(f"✓ IAM role found: {role_name}")

            # List attached policies
            attached = self.iam_client.list_attached_role_policies(RoleName=role_name)
            iam_analysis['policies']['attached'] = [
                {'name': p['PolicyName'], 'arn': p['PolicyArn']}
                for p in attached.get('AttachedPolicies', [])
            ]

            # List inline policies
            inline = self.iam_client.list_role_policies(RoleName=role_name)
            iam_analysis['policies']['inline'] = inline.get('PolicyNames', [])

            logger.info(f"  Attached policies: {len(iam_analysis['policies']['attached'])}")
            logger.info(f"  Inline policies: {len(iam_analysis['policies']['inline'])}")

        except self.iam_client.exceptions.NoSuchEntityException:
            logger.error(f"✗ IAM role not found: {role_name}")
        except Exception as e:
            logger.error(f"Error analyzing IAM role: {str(e)}")
            iam_analysis['error'] = str(e)

        return iam_analysis

    def analyze_kms_key(self) -> Dict[str, Any]:
        """Analyze KMS key for SNS encryption"""
        logger.info("Analyzing KMS key...")
        kms_analysis = {
            'exists': False,
            'configuration': {}
        }

        key_alias = f"alias/compliance-sns-{self.env_suffix}"

        try:
            # Describe key alias
            response = self.kms_client.describe_key(KeyId=key_alias)
            kms_analysis['exists'] = True

            metadata = response['KeyMetadata']
            kms_analysis['configuration'] = {
                'key_id': metadata['KeyId'],
                'arn': metadata['Arn'],
                'enabled': metadata['Enabled'],
                'key_state': metadata['KeyState'],
                'key_rotation_enabled': metadata.get('KeyRotationEnabled', False)
            }

            logger.info(f"✓ KMS key found: {key_alias}")
            logger.info(f"  State: {metadata['KeyState']}, Enabled: {metadata['Enabled']}")

            # Check key rotation
            try:
                rotation = self.kms_client.get_key_rotation_status(KeyId=metadata['KeyId'])
                kms_analysis['configuration']['key_rotation_enabled'] = rotation['KeyRotationEnabled']
                logger.info(f"  Key rotation: {rotation['KeyRotationEnabled']}")
            except Exception as e:
                logger.warning(f"Could not check key rotation: {str(e)}")

        except self.kms_client.exceptions.NotFoundException:
            logger.error(f"✗ KMS key not found: {key_alias}")
        except Exception as e:
            logger.error(f"Error analyzing KMS key: {str(e)}")
            kms_analysis['error'] = str(e)

        return kms_analysis

    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        logger.info("=" * 60)
        logger.info("AWS Infrastructure Compliance Analyzer")
        logger.info(f"Environment: {self.env_suffix}")
        logger.info(f"Timestamp: {self.timestamp}")
        logger.info("=" * 60)

        report = {
            'timestamp': self.timestamp,
            'environment': self.env_suffix,
            'region': self.region,
            'components': {
                'lambda_function': self.analyze_lambda_function(),
                's3_bucket': self.analyze_s3_bucket(),
                'sns_topic': self.analyze_sns_topic(),
                'iam_role': self.analyze_iam_role(),
                'kms_key': self.analyze_kms_key()
            }
        }

        # Determine overall health
        components_exist = [
            report['components']['lambda_function']['exists'],
            report['components']['s3_bucket']['exists'],
            report['components']['sns_topic']['exists'],
            report['components']['iam_role']['exists'],
            report['components']['kms_key']['exists']
        ]

        report['overall_health'] = {
            'total_components': len(components_exist),
            'deployed_components': sum(components_exist),
            'missing_components': len(components_exist) - sum(components_exist),
            'health_percentage': (sum(components_exist) / len(components_exist)) * 100
        }

        # Check Lambda execution
        lambda_success = report['components']['lambda_function'].get('invocation_result', {}).get('success', False)
        report['overall_health']['lambda_execution'] = 'SUCCESS' if lambda_success else 'FAILED'

        logger.info("\n" + "=" * 60)
        logger.info("ANALYSIS SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Components deployed: {report['overall_health']['deployed_components']}/{report['overall_health']['total_components']}")
        logger.info(f"Infrastructure health: {report['overall_health']['health_percentage']:.1f}%")
        logger.info(f"Lambda execution: {report['overall_health']['lambda_execution']}")
        logger.info("=" * 60)

        return report


def main():
    """Main execution function"""
    # Get configuration from environment
    region = os.environ.get('AWS_REGION', 'us-east-1')
    endpoint_url = os.environ.get('AWS_ENDPOINT_URL')

    try:
        # Create analyzer
        analyzer = ComplianceAnalyzer(region=region, endpoint_url=endpoint_url)

        # Generate report
        report = analyzer.generate_report()

        # Save report to file
        output_file = 'analysis-report.json'
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)

        logger.info(f"\n✓ Analysis report saved to: {output_file}")

        # Exit with appropriate code
        if report['overall_health']['health_percentage'] == 100:
            logger.info("✓ Infrastructure analysis PASSED - All components healthy")
            sys.exit(0)
        elif report['overall_health']['health_percentage'] >= 80:
            logger.warning("⚠ Infrastructure analysis PASSED with warnings")
            sys.exit(0)
        else:
            logger.error("✗ Infrastructure analysis FAILED - Critical components missing")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Analysis failed with error: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
