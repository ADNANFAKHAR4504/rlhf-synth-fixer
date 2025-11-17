"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of infrastructure resources and 
manages environment-specific configurations.
"""

from typing import Optional, Dict, List
from datetime import datetime
import base64
import json

import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the properties for the TapStack component.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
            deployment environment (e.g., 'dev', 'prod', 'pr1234').
        aws_region (Optional[str]): AWS region for deployment. Defaults to 'us-east-1'.
        tags (Optional[Dict[str, str]]): Custom tags to apply to all resources.
        db_password (Optional[pulumi.Output[str]]): Database password for RDS instance.
            Defaults to 'DefaultPassword123!' if not provided.
    
    Attributes:
        environment_suffix (str): Stores the environment suffix for the stack.
        aws_region (str): Stores the AWS region.
        tags (Optional[Dict[str, str]]): Stores custom tags.
        db_password (pulumi.Output[str]): Stores the database password.
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        aws_region: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None,
        db_password: Optional[pulumi.Output[str]] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.aws_region = aws_region or 'us-east-1'
        self.tags = tags
        self.db_password = db_password or pulumi.Output.from_input('DefaultPassword123!')


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi ComponentResource for the Tap project.

    This component is responsible for creating all infrastructure resources
    including VPC, RDS, Lambda, API Gateway, ALB, S3, CloudWatch, and IAM resources.

    Args:
        name (str): The unique name for this component resource.
        args (TapStackArgs): Properties for configuring the stack.
        opts (Optional[ResourceOptions]): Optional resource options.
        **kwargs: Additional keyword arguments.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
        aws_region (str): The AWS region for deployment.
        environment (str): The environment name (dev/staging/prod).
        vpc_id (pulumi.Output[str]): The VPC ID.
        alb_dns_name (pulumi.Output[str]): The ALB DNS name.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None,
        **kwargs
    ):
        super().__init__("tap:infrastructure:TapStack", name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.aws_region = args.aws_region
        
        # Determine environment from suffix
        if self.environment_suffix in ['dev', 'development']:
            self.environment = 'dev'
        elif self.environment_suffix in ['staging', 'stage']:
            self.environment = 'staging'
        elif self.environment_suffix in ['prod', 'production']:
            self.environment = 'prod'
        else:
            self.environment = 'dev'
        
        # Common tags for all resources
        migration_date = datetime.now().strftime("%Y-%m-%d")
        common_tags = {
            "Environment": self.environment,
            "EnvironmentSuffix": self.environment_suffix,
            "MigrationDate": migration_date,
            "ManagedBy": "Pulumi",
            "Project": "PaymentProcessing"
        }
        if args.tags:
            common_tags.update(args.tags)
        
        # Get availability zones
        availability_zones = aws.get_availability_zones(
            state="available",
            opts=pulumi.InvokeOptions(parent=self)
        )
        azs = availability_zones.names[:3]
        
        # Dynamically fetch the latest Amazon Linux 2 AMI for the current region
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"],
                ),
                aws.ec2.GetAmiFilterArgs(
                    name="virtualization-type",
                    values=["hvm"],
                ),
            ],
            opts=pulumi.InvokeOptions(parent=self)
        )
        ami_id = ami.id
        
        # KMS Key for RDS encryption
        kms_key = aws.kms.Key(
            f"rds-key-{self.environment_suffix}",
            description=f"KMS key for RDS encryption in {self.environment} environment",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={**common_tags, "Name": f"rds-key-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        kms_key_alias = aws.kms.Alias(
            f"rds-key-alias-{self.environment_suffix}",
            name=f"alias/rds-{self.environment_suffix}",
            target_key_id=kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )
        
        # VPC
        vpc = aws.ec2.Vpc(
            f"payment-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"payment-vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"payment-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"payment-igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Public Subnets (for ALB)
        public_subnets: List[aws.ec2.Subnet] = []
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"payment-public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**common_tags, "Name": f"payment-public-subnet-{i+1}-{self.environment_suffix}", "Type": "Public"},
                opts=ResourceOptions(parent=self)
            )
            public_subnets.append(subnet)
        
        # Private Subnets (for Lambda, RDS, ASG)
        private_subnets: List[aws.ec2.Subnet] = []
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"payment-private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=az,
                tags={**common_tags, "Name": f"payment-private-subnet-{i+1}-{self.environment_suffix}", "Type": "Private"},
                opts=ResourceOptions(parent=self)
            )
            private_subnets.append(subnet)
        
        # Elastic IPs for NAT Gateways
        nat_eips: List[aws.ec2.Eip] = []
        for i in range(len(azs)):
            eip = aws.ec2.Eip(
                f"nat-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={**common_tags, "Name": f"nat-eip-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            nat_eips.append(eip)
        
        # NAT Gateways (one per AZ)
        nat_gateways: List[aws.ec2.NatGateway] = []
        for i, (subnet, eip) in enumerate(zip(public_subnets, nat_eips)):
            nat = aws.ec2.NatGateway(
                f"nat-gateway-{i+1}-{self.environment_suffix}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={**common_tags, "Name": f"nat-gateway-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, depends_on=[igw])
            )
            nat_gateways.append(nat)
        
        # Public Route Table
        public_route_table = aws.ec2.RouteTable(
            f"payment-public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"payment-public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        public_route = aws.ec2.Route(
            f"public-route-{self.environment_suffix}",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=ResourceOptions(parent=self)
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_route_table.id,
                opts=ResourceOptions(parent=self)
            )
        
        # Private Route Tables (one per AZ with its own NAT Gateway)
        for i, (subnet, nat) in enumerate(zip(private_subnets, nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"payment-private-rt-{i+1}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={**common_tags, "Name": f"payment-private-rt-{i+1}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            
            aws.ec2.Route(
                f"private-route-{i+1}-{self.environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat.id,
                opts=ResourceOptions(parent=self)
            )
            
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )
        
        # Security Group for RDS
        rds_security_group = aws.ec2.SecurityGroup(
            f"rds-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for RDS PostgreSQL",
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                cidr_blocks=[vpc.cidr_block]
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**common_tags, "Name": f"rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Security Group for Lambda
        lambda_security_group = aws.ec2.SecurityGroup(
            f"lambda-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Lambda functions",
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**common_tags, "Name": f"lambda-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Security Group for ALB
        alb_security_group = aws.ec2.SecurityGroup(
            f"alb-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**common_tags, "Name": f"alb-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Security Group for Application (ASG instances)
        app_security_group = aws.ec2.SecurityGroup(
            f"app-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for application instances",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[alb_security_group.id.apply(lambda id: str(id) if id is not None else "")]
                )
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**common_tags, "Name": f"app-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # DB Subnet Group
        # Collect subnet IDs ensuring they're strings (handle None from mocks)
        private_subnet_ids = pulumi.Output.all(*[subnet.id for subnet in private_subnets]).apply(
            lambda ids: [str(id) if id is not None else "" for id in ids if id is not None]
        )
        db_subnet_group = aws.rds.SubnetGroup(
            f"payment-db-subnet-group-{self.environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={**common_tags, "Name": f"payment-db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # RDS PostgreSQL Instance
        db_instance = aws.rds.Instance(
            f"payment-db-{self.environment_suffix}",
            identifier=f"payment-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="14.13",
            instance_class="db.t3.medium",
            allocated_storage=20,
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=pulumi.Output.all(rds_security_group.id).apply(
                lambda ids: [str(ids[0]) if ids[0] is not None else ""] if ids[0] is not None else []
            ),
            multi_az=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            username="dbadmin",
            password=args.db_password,
            skip_final_snapshot=True,
            tags={**common_tags, "Name": f"payment-db-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Log Group for RDS
        rds_log_group = aws.cloudwatch.LogGroup(
            f"rds-log-group-{self.environment_suffix}",
            name=f"/aws/rds/payment-db-{self.environment_suffix}",
            retention_in_days=30,
            tags={**common_tags, "Name": f"rds-log-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Alarm for RDS CPU
        rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when RDS CPU exceeds 80%",
            dimensions={"DBInstanceIdentifier": db_instance.identifier},
            tags={**common_tags, "Name": f"rds-cpu-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # S3 Bucket for Audit Logs
        audit_bucket = aws.s3.Bucket(
            f"payment-audit-logs-{self.environment_suffix}",
            bucket=f"payment-logs-{self.environment_suffix}",
            tags={**common_tags, "Name": f"payment-audit-logs-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # S3 Bucket Versioning
        audit_bucket_versioning = aws.s3.BucketVersioning(
            f"audit-bucket-versioning-{self.environment_suffix}",
            bucket=audit_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # S3 Bucket Server-side Encryption
        audit_bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            f"audit-bucket-encryption-{self.environment_suffix}",
            bucket=audit_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )],
            opts=ResourceOptions(parent=self)
        )
        
        # S3 Lifecycle Policy (90-day retention)
        audit_bucket_lifecycle = aws.s3.BucketLifecycleConfiguration(
            f"audit-bucket-lifecycle-{self.environment_suffix}",
            bucket=audit_bucket.id,
            rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
                id="delete-old-logs",
                status="Enabled",
                expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                    days=90
                )
            )],
            opts=ResourceOptions(parent=self)
        )
        
        # S3 Public Access Block
        s3_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"s3-public-access-block-{self.environment_suffix}",
            bucket=audit_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )
        
        # IAM Role for Lambda
        lambda_role = aws.iam.Role(
            f"payment-lambda-role-{self.environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={**common_tags, "Name": f"payment-lambda-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Policy for CloudWatch Logs
        lambda_logs_policy = aws.iam.RolePolicy(
            f"lambda-logs-policy-{self.environment_suffix}",
            role=lambda_role.id,
            policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }]
            }""",
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Policy for VPC Access
        lambda_vpc_policy = aws.iam.RolePolicyAttachment(
            f"lambda-vpc-policy-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Policy for X-Ray
        lambda_xray_policy = aws.iam.RolePolicyAttachment(
            f"lambda-xray-policy-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Policy for S3 Access
        lambda_s3_policy = aws.iam.RolePolicy(
            f"lambda-s3-policy-{self.environment_suffix}",
            role=lambda_role.id,
            policy=audit_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject"
                    ],
                    "Resource": f"{arn}/*"
                }]
            })),
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Log Group for Lambda
        lambda_log_group = aws.cloudwatch.LogGroup(
            f"lambda-log-group-{self.environment_suffix}",
            name=f"/aws/lambda/payment-validator-{self.environment_suffix}",
            retention_in_days=30,
            tags={**common_tags, "Name": f"lambda-log-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Function for Payment Validation
        lambda_code = pulumi.AssetArchive({
            "index.py": pulumi.StringAsset("""
import json
import os
import boto3
from datetime import datetime

s3 = boto3.client('s3')
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']

def handler(event, context):
    try:
        # Payment validation logic
        payment_data = json.loads(event.get('body', '{}'))

        # Validate payment
        if not payment_data.get('amount') or not payment_data.get('card'):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid payment data'})
            }

        # Log to S3 for audit
        audit_log = {
            'timestamp': datetime.now().isoformat(),
            'payment_id': payment_data.get('payment_id'),
            'amount': payment_data.get('amount'),
            'status': 'validated'
        }

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=f"audit/{datetime.now().strftime('%Y/%m/%d')}/{payment_data.get('payment_id')}.json",
            Body=json.dumps(audit_log)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Payment validated successfully'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
""")
        })
        
        lambda_function = aws.lambda_.Function(
            f"payment-validator-{self.environment_suffix}",
            name=f"payment-validator-{self.environment_suffix}",
            runtime="python3.11",
            role=lambda_role.arn,
            handler="index.handler",
            code=lambda_code,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.environment,
                    "DB_HOST": db_instance.endpoint,
                    "DB_NAME": "payments",
                    "AUDIT_BUCKET": audit_bucket.bucket,
                    "REGION": self.aws_region
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=pulumi.Output.all(*[subnet.id for subnet in private_subnets]).apply(
                    lambda ids: [str(id) if id is not None else "" for id in ids if id is not None]
                ),
                security_group_ids=pulumi.Output.all(lambda_security_group.id).apply(
                    lambda ids: [str(ids[0]) if ids[0] is not None else ""] if ids[0] is not None else []
                )
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            timeout=30,
            memory_size=256,
            tags={**common_tags, "Name": f"payment-validator-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Alarm for Lambda Errors
        lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-error-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5.0,
            alarm_description="Alert when Lambda errors exceed 5 in 5 minutes",
            dimensions={"FunctionName": lambda_function.name},
            tags={**common_tags, "Name": f"lambda-error-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway REST API
        api = aws.apigateway.RestApi(
            f"payment-api-{self.environment_suffix}",
            name=f"payment-api-{self.environment_suffix}",
            description=f"Payment Processing API - {self.environment} Environment",
            tags={**common_tags, "Name": f"payment-api-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway Resource
        api_resource = aws.apigateway.Resource(
            f"payment-resource-{self.environment_suffix}",
            rest_api=api.id,
            parent_id=api.root_resource_id,
            path_part="validate",
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway Request Validator
        api_validator = aws.apigateway.RequestValidator(
            f"api-validator-{self.environment_suffix}",
            rest_api=api.id,
            name=f"payment-validator-{self.environment_suffix}",
            validate_request_body=True,
            validate_request_parameters=True,
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway Method
        api_method = aws.apigateway.Method(
            f"payment-method-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=api_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=api_validator.id,
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway Integration with Lambda
        api_integration = aws.apigateway.Integration(
            f"payment-integration-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=api_resource.id,
            http_method=api_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Permission for API Gateway
        # Handle None execution_arn gracefully
        api_execution_arn_safe = api.execution_arn.apply(lambda arn: arn if arn is not None else "")
        lambda_permission = aws.lambda_.Permission(
            f"api-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(api_execution_arn_safe, "/*/*"),
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway Deployment
        api_deployment = aws.apigateway.Deployment(
            f"payment-deployment-{self.environment_suffix}",
            rest_api=api.id,
            opts=ResourceOptions(parent=self, depends_on=[api_integration])
        )
        
        # API Gateway Stage
        api_stage = aws.apigateway.Stage(
            f"payment-stage-{self.environment_suffix}",
            rest_api=api.id,
            deployment=api_deployment.id,
            stage_name=self.environment,
            xray_tracing_enabled=True,
            tags={**common_tags, "Name": f"payment-stage-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway Usage Plan
        usage_plan = aws.apigateway.UsagePlan(
            f"payment-usage-plan-{self.environment_suffix}",
            name=f"payment-usage-plan-{self.environment_suffix}",
            api_stages=[aws.apigateway.UsagePlanApiStageArgs(
                api_id=api.id,
                stage=api_stage.stage_name
            )],
            quota_settings=aws.apigateway.UsagePlanQuotaSettingsArgs(
                limit=10000,
                period="DAY"
            ),
            throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
                burst_limit=100,
                rate_limit=50
            ),
            tags={**common_tags, "Name": f"payment-usage-plan-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Log Group for API Gateway
        api_log_group = aws.cloudwatch.LogGroup(
            f"api-log-group-{self.environment_suffix}",
            name=f"/aws/apigateway/payment-api-{self.environment_suffix}",
            retention_in_days=30,
            tags={**common_tags, "Name": f"api-log-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Alarm for API Gateway 4xx Errors
        api_4xx_alarm = aws.cloudwatch.MetricAlarm(
            f"api-4xx-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=50.0,
            alarm_description="Alert when API Gateway 4xx errors exceed 50 in 5 minutes",
            dimensions={
                "ApiName": api.name,
                "Stage": api_stage.stage_name
            },
            tags={**common_tags, "Name": f"api-4xx-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # CloudWatch Alarm for API Gateway 5xx Errors
        api_5xx_alarm = aws.cloudwatch.MetricAlarm(
            f"api-5xx-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10.0,
            alarm_description="Alert when API Gateway 5xx errors exceed 10 in 5 minutes",
            dimensions={
                "ApiName": api.name,
                "Stage": api_stage.stage_name
            },
            tags={**common_tags, "Name": f"api-5xx-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Application Load Balancer
        # Collect public subnet IDs ensuring they're strings (handle None from mocks)
        public_subnet_ids = pulumi.Output.all(*[subnet.id for subnet in public_subnets]).apply(
            lambda ids: [str(id) if id is not None else "" for id in ids if id is not None]
        )
        alb_security_group_ids = pulumi.Output.all(alb_security_group.id).apply(
            lambda ids: [str(ids[0]) if ids[0] is not None else ""] if ids[0] is not None else []
        )
        alb = aws.lb.LoadBalancer(
            f"payment-alb-{self.environment_suffix}",
            name=f"payment-alb-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=alb_security_group_ids,
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            tags={**common_tags, "Name": f"payment-alb-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Target Group for ALB
        target_group = aws.lb.TargetGroup(
            f"payment-tg-{self.environment_suffix}",
            name=f"payment-tg-{self.environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=3
            ),
            tags={**common_tags, "Name": f"payment-tg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # ALB Listener
        alb_listener = aws.lb.Listener(
            f"payment-alb-listener-{self.environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )],
            tags={**common_tags, "Name": f"payment-alb-listener-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # IAM Role for EC2 Instances (ASG)
        instance_role = aws.iam.Role(
            f"payment-instance-role-{self.environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }""",
            tags={**common_tags, "Name": f"payment-instance-role-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # EC2 Instance Profile
        instance_profile = aws.iam.InstanceProfile(
            f"payment-instance-profile-{self.environment_suffix}",
            role=instance_role.name,
            tags={**common_tags, "Name": f"payment-instance-profile-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Launch Template for ASG
        user_data_script = f"""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Payment Service - {self.environment_suffix}</h1>" > /var/www/html/index.html
"""
        user_data = base64.b64encode(user_data_script.encode()).decode()
        
        launch_template = aws.ec2.LaunchTemplate(
            f"payment-lt-{self.environment_suffix}",
            name=f"payment-lt-{self.environment_suffix}",
            image_id=ami_id,
            instance_type="t3.micro",
            vpc_security_group_ids=pulumi.Output.all(app_security_group.id).apply(
                lambda ids: [str(ids[0]) if ids[0] is not None else ""] if ids[0] is not None else []
            ),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=instance_profile.arn,
            ),
            user_data=user_data,
            tag_specifications=[aws.ec2.LaunchTemplateTagSpecificationArgs(
                resource_type="instance",
                tags={**common_tags, "Name": f"payment-instance-{self.environment_suffix}"}
            )],
            tags={**common_tags, "Name": f"payment-lt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Auto Scaling Group
        # Collect private subnet IDs ensuring they're strings (handle None from mocks)
        asg_subnet_ids = pulumi.Output.all(*[subnet.id for subnet in private_subnets]).apply(
            lambda ids: [str(id) if id is not None else "" for id in ids if id is not None]
        )
        target_group_arns_safe = pulumi.Output.all(target_group.arn).apply(
            lambda arns: [str(arns[0]) if arns[0] is not None else ""] if arns[0] is not None else []
        )
        asg = aws.autoscaling.Group(
            f"payment-asg-{self.environment_suffix}",
            name=f"payment-asg-{self.environment_suffix}",
            vpc_zone_identifiers=asg_subnet_ids,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template.id,
                version="$Latest"
            ),
            min_size=1,
            max_size=3,
            desired_capacity=2,
            health_check_type="ELB",
            health_check_grace_period=300,
            target_group_arns=target_group_arns_safe,
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"payment-instance-{self.environment_suffix}",
                    propagate_at_launch=True
                )
            ],
            opts=ResourceOptions(parent=self, depends_on=[target_group])
        )
        
        # CloudWatch Alarm for ASG CPU
        cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"payment-cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description=f"Triggers when ASG CPU exceeds 80% for {self.environment} environment",
            dimensions={
                "AutoScalingGroupName": asg.name
            },
            tags={**common_tags, "Name": f"payment-cpu-alarm-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )
        
        # Register outputs using pulumi.export
        pulumi.export("vpc_id", vpc.id)
        pulumi.export("alb_dns_name", alb.dns_name)
        # Handle None dns_name gracefully for unit tests - convert None to empty string first
        dns_name_safe = alb.dns_name.apply(lambda dns: dns if dns is not None else "")
        alb_url = pulumi.Output.concat("http://", dns_name_safe)
        pulumi.export("alb_url", alb_url)
        pulumi.export("rds_endpoint", db_instance.endpoint)
        pulumi.export("rds_address", db_instance.address)
        pulumi.export("s3_bucket_name", audit_bucket.id)
        pulumi.export("s3_bucket_arn", audit_bucket.arn)
        pulumi.export("asg_name", asg.name)
        pulumi.export("environment", self.environment)
        pulumi.export("environment_suffix", self.environment_suffix)
        pulumi.export("region", self.aws_region)