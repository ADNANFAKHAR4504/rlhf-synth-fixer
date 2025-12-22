"""
compliance_stack.py

Creates Lambda functions for compliance rules and report generation
"""

from typing import Optional, Dict, Any
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class ComplianceStack(pulumi.ComponentResource):
    """
    ComplianceStack creates Lambda functions for compliance checking and reporting.

    Creates:
    - Lambda function for EC2 tag compliance
    - Lambda function for S3 encryption compliance
    - Lambda function for RDS backup compliance
    - Lambda function for report aggregation
    - CloudWatch Events rule for scheduled evaluations
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        sns_topic_arn: Output[str],
        dynamodb_table_name: Output[str],
        reports_bucket_name: Output[str],
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:compliance:ComplianceStack', name, None, opts)

        self.environment_suffix = environment_suffix
        self.sns_topic_arn = sns_topic_arn
        self.dynamodb_table_name = dynamodb_table_name
        self.reports_bucket_name = reports_bucket_name

        # Define tags
        tags = {
            'Environment': 'Production',
            'Compliance': 'Required',
            'ManagedBy': 'Pulumi',
        }

        # Create IAM role for EC2 tag checker Lambda
        self.ec2_tag_role = self._create_lambda_role(
            f"ec2-tag-checker-role-{environment_suffix}",
            "ec2-tag-checker",
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeTags"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem"
                        ],
                        "Resource": pulumi.Output.concat("arn:aws:dynamodb:*:*:table/", dynamodb_table_name)
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": sns_topic_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            },
            tags
        )

        # Create IAM role for S3 encryption checker Lambda
        self.s3_encryption_role = self._create_lambda_role(
            f"s3-encryption-checker-role-{environment_suffix}",
            "s3-encryption-checker",
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetEncryptionConfiguration",
                            "s3:ListAllMyBuckets"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem"
                        ],
                        "Resource": pulumi.Output.concat("arn:aws:dynamodb:*:*:table/", dynamodb_table_name)
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": sns_topic_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            },
            tags
        )

        # Create IAM role for RDS backup checker Lambda
        self.rds_backup_role = self._create_lambda_role(
            f"rds-backup-checker-role-{environment_suffix}",
            "rds-backup-checker",
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBInstances"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem"
                        ],
                        "Resource": pulumi.Output.concat("arn:aws:dynamodb:*:*:table/", dynamodb_table_name)
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": sns_topic_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            },
            tags
        )

        # Create IAM role for report aggregator Lambda
        self.report_aggregator_role = self._create_lambda_role(
            f"report-aggregator-role-{environment_suffix}",
            "report-aggregator",
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": pulumi.Output.concat("arn:aws:dynamodb:*:*:table/", dynamodb_table_name)
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject"
                        ],
                        "Resource": pulumi.Output.concat("arn:aws:s3:::", reports_bucket_name, "/*")
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            },
            tags
        )

        # Create Lambda function for EC2 tag checking
        self.ec2_tag_lambda = aws.lambda_.Function(
            f"ec2-tag-checker-{environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=self.ec2_tag_role.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lib/lambda/ec2_tag_checker')
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "SNS_TOPIC_ARN": sns_topic_arn,
                }
            ),
            timeout=300,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda function for S3 encryption checking
        self.s3_encryption_lambda = aws.lambda_.Function(
            f"s3-encryption-checker-{environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=self.s3_encryption_role.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lib/lambda/s3_encryption_checker')
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "SNS_TOPIC_ARN": sns_topic_arn,
                }
            ),
            timeout=300,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda function for RDS backup checking
        self.rds_backup_lambda = aws.lambda_.Function(
            f"rds-backup-checker-{environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=self.rds_backup_role.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lib/lambda/rds_backup_checker')
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "SNS_TOPIC_ARN": sns_topic_arn,
                }
            ),
            timeout=300,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda function for report aggregation
        self.report_aggregator_lambda = aws.lambda_.Function(
            f"report-aggregator-{environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=self.report_aggregator_role.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lib/lambda/report_aggregator')
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "REPORTS_BUCKET": reports_bucket_name,
                }
            ),
            timeout=300,
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch Events rule for 6-hour schedule
        self.schedule_rule = aws.cloudwatch.EventRule(
            f"compliance-schedule-{environment_suffix}",
            description="Trigger compliance evaluations every 6 hours",
            schedule_expression="cron(0 */6 * * ? *)",
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for CloudWatch Events
        self.events_role = aws.iam.Role(
            f"compliance-events-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "events.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach policy to allow CloudWatch Events to invoke Lambda
        self.events_policy = aws.iam.RolePolicy(
            f"compliance-events-policy-{environment_suffix}",
            role=self.events_role.id,
            policy=pulumi.Output.all(
                self.ec2_tag_lambda.arn,
                self.s3_encryption_lambda.arn,
                self.rds_backup_lambda.arn,
                self.report_aggregator_lambda.arn
            ).apply(lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": "lambda:InvokeFunction",
                    "Resource": arns
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Add permissions for EventBridge to invoke Lambda functions
        self.ec2_permission = aws.lambda_.Permission(
            f"ec2-tag-checker-invoke-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.ec2_tag_lambda.name,
            principal="events.amazonaws.com",
            source_arn=self.schedule_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        self.s3_permission = aws.lambda_.Permission(
            f"s3-encryption-checker-invoke-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.s3_encryption_lambda.name,
            principal="events.amazonaws.com",
            source_arn=self.schedule_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        self.rds_permission = aws.lambda_.Permission(
            f"rds-backup-checker-invoke-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.rds_backup_lambda.name,
            principal="events.amazonaws.com",
            source_arn=self.schedule_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        self.report_permission = aws.lambda_.Permission(
            f"report-aggregator-invoke-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.report_aggregator_lambda.name,
            principal="events.amazonaws.com",
            source_arn=self.schedule_rule.arn,
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge targets for all Lambda functions
        self.ec2_target = aws.cloudwatch.EventTarget(
            f"ec2-tag-checker-target-{environment_suffix}",
            rule=self.schedule_rule.name,
            arn=self.ec2_tag_lambda.arn,
            opts=ResourceOptions(parent=self, depends_on=[self.ec2_permission])
        )

        self.s3_target = aws.cloudwatch.EventTarget(
            f"s3-encryption-checker-target-{environment_suffix}",
            rule=self.schedule_rule.name,
            arn=self.s3_encryption_lambda.arn,
            opts=ResourceOptions(parent=self, depends_on=[self.s3_permission])
        )

        self.rds_target = aws.cloudwatch.EventTarget(
            f"rds-backup-checker-target-{environment_suffix}",
            rule=self.schedule_rule.name,
            arn=self.rds_backup_lambda.arn,
            opts=ResourceOptions(parent=self, depends_on=[self.rds_permission])
        )

        self.report_target = aws.cloudwatch.EventTarget(
            f"report-aggregator-target-{environment_suffix}",
            rule=self.schedule_rule.name,
            arn=self.report_aggregator_lambda.arn,
            opts=ResourceOptions(parent=self, depends_on=[self.report_permission])
        )

        # Store compliance rule lambdas for AWS Config
        self.compliance_rule_lambdas = {
            'ec2_tags': self.ec2_tag_lambda,
            's3_encryption': self.s3_encryption_lambda,
            'rds_backups': self.rds_backup_lambda,
        }

        self.register_outputs({})

    def _create_lambda_role(
        self,
        name: str,
        service: str,
        policy_document: Any,
        tags: Dict[str, str]
    ) -> aws.iam.Role:
        """Helper to create IAM role for Lambda with inline policy"""
        role = aws.iam.Role(
            name,
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
            opts=ResourceOptions(parent=self)
        )

        # Handle policy_document that may contain Pulumi Outputs
        # Convert to JSON using pulumi.Output.json_dumps if it contains Outputs
        if isinstance(policy_document, dict):
            policy_json = pulumi.Output.json_dumps(policy_document)
        else:
            policy_json = policy_document

        policy = aws.iam.RolePolicy(
            f"{name}-policy",
            role=role.id,
            policy=policy_json,
            opts=ResourceOptions(parent=self)
        )

        return role
