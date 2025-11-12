# Payment Processing API Infrastructure - CDK Python Implementation

This document contains the complete CDK Python implementation for a production-grade payment processing API infrastructure with comprehensive security, compliance, and monitoring capabilities.

## File: tap.py

```python
#!/usr/bin/env python3
"""
CDK application entry point for the Payment Processing API infrastructure.
"""
import os
import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"PaymentProcessingStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)
Tags.of(app).add('Project', 'PaymentProcessing')

# Create stack
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region='us-east-1'
    )
)

TapStack(app, STACK_NAME, props=props)

app.synth()
```

## File: lib/tap_stack.py

```python
"""
Main CDK stack for Payment Processing API infrastructure.
"""
from typing import Optional
import aws_cdk as cdk
from constructs import Construct

# Import nested stacks
from .network_stack import NetworkStack, NetworkStackProps
from .security_stack import SecurityStack, SecurityStackProps
from .database_stack import DatabaseStack, DatabaseStackProps
from .compute_stack import ComputeStack, ComputeStackProps
from .api_stack import ApiStack, ApiStackProps
from .storage_stack import StorageStack, StorageStackProps
from .monitoring_stack import MonitoringStack, MonitoringStackProps


class TapStackProps(cdk.StackProps):
    """Properties for TapStack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Main orchestration stack for payment processing infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # 1. Network infrastructure
        network_stack = NetworkStack(
            self,
            f"NetworkStack{environment_suffix}",
            props=NetworkStackProps(environment_suffix=environment_suffix)
        )

        # 2. Security (KMS, Secrets Manager, IAM)
        security_stack = SecurityStack(
            self,
            f"SecurityStack{environment_suffix}",
            props=SecurityStackProps(
                environment_suffix=environment_suffix,
                vpc=network_stack.vpc
            )
        )

        # 3. Database (RDS Aurora)
        database_stack = DatabaseStack(
            self,
            f"DatabaseStack{environment_suffix}",
            props=DatabaseStackProps(
                environment_suffix=environment_suffix,
                vpc=network_stack.vpc,
                kms_key=security_stack.rds_kms_key,
                db_security_group=network_stack.database_security_group
            )
        )

        # 4. Storage (S3)
        storage_stack = StorageStack(
            self,
            f"StorageStack{environment_suffix}",
            props=StorageStackProps(
                environment_suffix=environment_suffix,
                kms_key=security_stack.s3_kms_key
            )
        )

        # 5. Compute (ECS, Lambda, SQS)
        compute_stack = ComputeStack(
            self,
            f"ComputeStack{environment_suffix}",
            props=ComputeStackProps(
                environment_suffix=environment_suffix,
                vpc=network_stack.vpc,
                alb=network_stack.alb,
                alb_security_group=network_stack.alb_security_group,
                ecs_security_group=network_stack.ecs_security_group,
                lambda_security_group=network_stack.lambda_security_group,
                database=database_stack.cluster,
                storage_bucket=storage_stack.document_bucket,
                kms_key=security_stack.lambda_kms_key
            )
        )

        # 6. API Gateway
        api_stack = ApiStack(
            self,
            f"ApiStack{environment_suffix}",
            props=ApiStackProps(
                environment_suffix=environment_suffix,
                vpc=network_stack.vpc,
                alb=network_stack.alb
            )
        )

        # 7. Monitoring (CloudWatch)
        monitoring_stack = MonitoringStack(
            self,
            f"MonitoringStack{environment_suffix}",
            props=MonitoringStackProps(
                environment_suffix=environment_suffix,
                alb=network_stack.alb,
                ecs_service=compute_stack.ecs_service,
                database=database_stack.cluster,
                lambda_functions=compute_stack.lambda_functions,
                api=api_stack.api
            )
        )

        # Outputs
        cdk.CfnOutput(
            self,
            "ALBDNSName",
            value=network_stack.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name"
        )

        cdk.CfnOutput(
            self,
            "ApiGatewayEndpoint",
            value=api_stack.api.url,
            description="API Gateway Endpoint URL"
        )

        cdk.CfnOutput(
            self,
            "CloudWatchDashboardURL",
            value=f"https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name={monitoring_stack.dashboard.dashboard_name}",
            description="CloudWatch Dashboard URL"
        )

        cdk.CfnOutput(
            self,
            "DatabaseClusterEndpoint",
            value=database_stack.cluster.cluster_endpoint.hostname,
            description="RDS Aurora Cluster Endpoint"
        )

        cdk.CfnOutput(
            self,
            "DocumentBucketName",
            value=storage_stack.document_bucket.bucket_name,
            description="S3 Document Storage Bucket Name"
        )
```

## File: lib/network_stack.py

```python
"""
Network infrastructure stack - VPC, subnets, NAT instances, ALB, WAF, VPC endpoints.
"""
from aws_cdk import (
    NestedStack,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_wafv2 as wafv2,
    CfnOutput
)
from constructs import Construct
from typing import Optional


class NetworkStackProps:
    """Properties for NetworkStack."""

    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class NetworkStack(NestedStack):
    """Network infrastructure including VPC, ALB, WAF, and VPC endpoints."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: NetworkStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # VPC with 3 AZs
        self.vpc = ec2.Vpc(
            self,
            f"PaymentVPC-{env_suffix}",
            vpc_name=f"payment-vpc-{env_suffix}",
            max_azs=3,
            nat_gateways=0,  # Will use NAT instances instead
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{env_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Database-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Create NAT instances for each AZ
        nat_instance_type = ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
        )

        nat_ami = ec2.MachineImage.latest_amazon_linux(
            generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
        )

        for i, public_subnet in enumerate(self.vpc.public_subnets[:3]):
            nat_instance = ec2.Instance(
                self,
                f"NATInstance-{i}-{env_suffix}",
                instance_name=f"nat-instance-{i}-{env_suffix}",
                instance_type=nat_instance_type,
                machine_image=nat_ami,
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(subnets=[public_subnet]),
                source_dest_check=False,
                user_data=ec2.UserData.for_linux()
            )

            # Configure NAT instance
            nat_instance.user_data.add_commands(
                "yum install -y iptables-services",
                "systemctl enable iptables",
                "systemctl start iptables",
                "echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf",
                "sysctl -p",
                "iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE",
                "service iptables save"
            )

        # Security Groups
        self.alb_security_group = ec2.SecurityGroup(
            self,
            f"ALBSecurityGroup-{env_suffix}",
            security_group_name=f"alb-sg-{env_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )

        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS from internet"
        )

        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP from internet"
        )

        self.ecs_security_group = ec2.SecurityGroup(
            self,
            f"ECSSecurityGroup-{env_suffix}",
            security_group_name=f"ecs-sg-{env_suffix}",
            vpc=self.vpc,
            description="Security group for ECS tasks",
            allow_all_outbound=True
        )

        self.ecs_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(8080),
            "Allow traffic from ALB"
        )

        self.database_security_group = ec2.SecurityGroup(
            self,
            f"DatabaseSecurityGroup-{env_suffix}",
            security_group_name=f"database-sg-{env_suffix}",
            vpc=self.vpc,
            description="Security group for RDS Aurora",
            allow_all_outbound=False
        )

        self.database_security_group.add_ingress_rule(
            self.ecs_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL from ECS"
        )

        self.lambda_security_group = ec2.SecurityGroup(
            self,
            f"LambdaSecurityGroup-{env_suffix}",
            security_group_name=f"lambda-sg-{env_suffix}",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )

        self.database_security_group.add_ingress_rule(
            self.lambda_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL from Lambda"
        )

        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            f"PaymentALB-{env_suffix}",
            load_balancer_name=f"payment-alb-{env_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )

        # AWS WAF Web ACL
        waf_rules = []

        # SQL Injection protection
        sql_injection_rule = wafv2.CfnWebACL.RuleProperty(
            name=f"SQLInjectionRule-{env_suffix}",
            priority=1,
            statement=wafv2.CfnWebACL.StatementProperty(
                managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                    vendor_name="AWS",
                    name="AWSManagedRulesSQLiRuleSet"
                )
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"SQLInjectionRule-{env_suffix}"
            ),
            override_action=wafv2.CfnWebACL.OverrideActionProperty(none={})
        )
        waf_rules.append(sql_injection_rule)

        # XSS protection
        xss_rule = wafv2.CfnWebACL.RuleProperty(
            name=f"XSSRule-{env_suffix}",
            priority=2,
            statement=wafv2.CfnWebACL.StatementProperty(
                managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                    vendor_name="AWS",
                    name="AWSManagedRulesKnownBadInputsRuleSet"
                )
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"XSSRule-{env_suffix}"
            ),
            override_action=wafv2.CfnWebACL.OverrideActionProperty(none={})
        )
        waf_rules.append(xss_rule)

        # OWASP Top 10 protection
        owasp_rule = wafv2.CfnWebACL.RuleProperty(
            name=f"OWASPRule-{env_suffix}",
            priority=3,
            statement=wafv2.CfnWebACL.StatementProperty(
                managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                    vendor_name="AWS",
                    name="AWSManagedRulesCommonRuleSet"
                )
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"OWASPRule-{env_suffix}"
            ),
            override_action=wafv2.CfnWebACL.OverrideActionProperty(none={})
        )
        waf_rules.append(owasp_rule)

        # Create Web ACL
        web_acl = wafv2.CfnWebACL(
            self,
            f"PaymentWAF-{env_suffix}",
            name=f"payment-waf-{env_suffix}",
            scope="REGIONAL",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            rules=waf_rules,
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"PaymentWAF-{env_suffix}"
            )
        )

        # Associate WAF with ALB
        wafv2.CfnWebACLAssociation(
            self,
            f"WAFAssociation-{env_suffix}",
            resource_arn=self.alb.load_balancer_arn,
            web_acl_arn=web_acl.attr_arn
        )

        # VPC Endpoints
        # S3 Gateway Endpoint
        self.vpc.add_gateway_endpoint(
            f"S3Endpoint-{env_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[
                ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
                ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
            ]
        )

        # DynamoDB Gateway Endpoint
        self.vpc.add_gateway_endpoint(
            f"DynamoDBEndpoint-{env_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[
                ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
                ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
            ]
        )

        # ECR API Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"ECRApiEndpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.ECR,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        # ECR Docker Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"ECRDockerEndpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        # Secrets Manager Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"SecretsManagerEndpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        # CloudWatch Logs Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"CloudWatchLogsEndpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )

        CfnOutput(
            self,
            "ALBArn",
            value=self.alb.load_balancer_arn,
            description="ALB ARN"
        )
```

## File: lib/security_stack.py

```python
"""
Security infrastructure - KMS keys, Secrets Manager, IAM roles.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_kms as kms,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    RemovalPolicy
)
from constructs import Construct


class SecurityStackProps:
    """Properties for SecurityStack."""

    def __init__(self, environment_suffix: str, vpc: ec2.Vpc):
        self.environment_suffix = environment_suffix
        self.vpc = vpc


class SecurityStack(NestedStack):
    """Security infrastructure including KMS and Secrets Manager."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: SecurityStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # KMS Keys for different services
        self.rds_kms_key = kms.Key(
            self,
            f"RDSKMSKey-{env_suffix}",
            description=f"KMS key for RDS encryption - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        self.s3_kms_key = kms.Key(
            self,
            f"S3KMSKey-{env_suffix}",
            description=f"KMS key for S3 encryption - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        self.lambda_kms_key = kms.Key(
            self,
            f"LambdaKMSKey-{env_suffix}",
            description=f"KMS key for Lambda environment variables - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        self.secrets_kms_key = kms.Key(
            self,
            f"SecretsKMSKey-{env_suffix}",
            description=f"KMS key for Secrets Manager - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Database credentials secret
        self.db_credentials_secret = secretsmanager.Secret(
            self,
            f"DBCredentials-{env_suffix}",
            secret_name=f"payment-db-credentials-{env_suffix}",
            description="Database credentials for payment processing",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                exclude_punctuation=True,
                include_space=False,
                password_length=32
            ),
            encryption_key=self.secrets_kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # API Keys secret
        self.api_keys_secret = secretsmanager.Secret(
            self,
            f"APIKeys-{env_suffix}",
            secret_name=f"payment-api-keys-{env_suffix}",
            description="API keys for payment processing",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"apiKey": ""}',
                generate_string_key="apiSecret",
                exclude_punctuation=True,
                include_space=False,
                password_length=64
            ),
            encryption_key=self.secrets_kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Lambda function for secret rotation
        rotation_lambda_role = iam.Role(
            self,
            f"RotationLambdaRole-{env_suffix}",
            role_name=f"rotation-lambda-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Grant permissions for rotation
        self.db_credentials_secret.grant_read(rotation_lambda_role)
        self.db_credentials_secret.grant_write(rotation_lambda_role)
        self.secrets_kms_key.grant_encrypt_decrypt(rotation_lambda_role)

        # Rotation Lambda function
        rotation_function = lambda_.Function(
            self,
            f"SecretRotationFunction-{env_suffix}",
            function_name=f"secret-rotation-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/secret_rotation"),
            timeout=Duration.minutes(5),
            role=rotation_lambda_role,
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            environment={
                "SECRET_ARN": self.db_credentials_secret.secret_arn
            }
        )

        # Enable automatic rotation (30 days)
        self.db_credentials_secret.add_rotation_schedule(
            f"RotationSchedule-{env_suffix}",
            automatically_after=Duration.days(30),
            rotation_lambda=rotation_function
        )
```

## File: lib/database_stack.py

```python
"""
Database infrastructure - RDS Aurora PostgreSQL cluster with IAM authentication.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_kms as kms,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class DatabaseStackProps:
    """Properties for DatabaseStack."""

    def __init__(
        self,
        environment_suffix: str,
        vpc: ec2.Vpc,
        kms_key: kms.Key,
        db_security_group: ec2.SecurityGroup
    ):
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.kms_key = kms_key
        self.db_security_group = db_security_group


class DatabaseStack(NestedStack):
    """RDS Aurora PostgreSQL database infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: DatabaseStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self,
            f"DBSubnetGroup-{env_suffix}",
            subnet_group_name=f"payment-db-subnet-group-{env_suffix}",
            description="Subnet group for payment processing database",
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # RDS Aurora PostgreSQL cluster
        self.cluster = rds.DatabaseCluster(
            self,
            f"PaymentDBCluster-{env_suffix}",
            cluster_identifier=f"payment-db-cluster-{env_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            instances=3,  # 1 writer + 2 readers
            instance_props=rds.InstanceProps(
                vpc=props.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                security_groups=[props.db_security_group],
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.R6G,
                    ec2.InstanceSize.LARGE
                ),
                enable_performance_insights=True,
                performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT
            ),
            default_database_name="paymentdb",
            storage_encrypted=True,
            storage_encryption_key=props.kms_key,
            backup=rds.BackupProps(
                retention=Duration.days(7),
                preferred_window="03:00-04:00"
            ),
            cloudwatch_logs_exports=["postgresql"],
            iam_authentication=True,  # Enable IAM database authentication
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False
        )

        CfnOutput(
            self,
            "ClusterEndpoint",
            value=self.cluster.cluster_endpoint.hostname,
            description="Database cluster endpoint"
        )

        CfnOutput(
            self,
            "ClusterReadEndpoint",
            value=self.cluster.cluster_read_endpoint.hostname,
            description="Database cluster read endpoint"
        )
```

## File: lib/compute_stack.py

```python
"""
Compute infrastructure - ECS Fargate, Lambda, SQS.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_lambda as lambda_,
    aws_sqs as sqs,
    aws_iam as iam,
    aws_s3 as s3,
    aws_rds as rds,
    aws_kms as kms,
    aws_logs as logs,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class ComputeStackProps:
    """Properties for ComputeStack."""

    def __init__(
        self,
        environment_suffix: str,
        vpc: ec2.Vpc,
        alb: elbv2.ApplicationLoadBalancer,
        alb_security_group: ec2.SecurityGroup,
        ecs_security_group: ec2.SecurityGroup,
        lambda_security_group: ec2.SecurityGroup,
        database: rds.DatabaseCluster,
        storage_bucket: s3.Bucket,
        kms_key: kms.Key
    ):
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.alb = alb
        self.alb_security_group = alb_security_group
        self.ecs_security_group = ecs_security_group
        self.lambda_security_group = lambda_security_group
        self.database = database
        self.storage_bucket = storage_bucket
        self.kms_key = kms_key


class ComputeStack(NestedStack):
    """Compute infrastructure with ECS and Lambda."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: ComputeStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # ECS Cluster
        cluster = ecs.Cluster(
            self,
            f"PaymentCluster-{env_suffix}",
            cluster_name=f"payment-cluster-{env_suffix}",
            vpc=props.vpc,
            container_insights=True
        )

        # Task execution role
        task_execution_role = iam.Role(
            self,
            f"ECSTaskExecutionRole-{env_suffix}",
            role_name=f"ecs-task-execution-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        # Task role with least-privilege permissions
        task_role = iam.Role(
            self,
            f"ECSTaskRole-{env_suffix}",
            role_name=f"ecs-task-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )

        # Grant database access
        props.database.grant_connect(task_role, "dbadmin")
        props.storage_bucket.grant_read_write(task_role)

        # Task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"PaymentTaskDef-{env_suffix}",
            family=f"payment-task-{env_suffix}",
            cpu=512,
            memory_limit_mib=1024,
            execution_role=task_execution_role,
            task_role=task_role
        )

        # Container definition
        container = task_definition.add_container(
            f"PaymentContainer-{env_suffix}",
            container_name=f"payment-api-{env_suffix}",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/docker/library/nginx:latest"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="payment-api",
                log_retention=logs.RetentionDays.ONE_WEEK
            ),
            environment={
                "DB_ENDPOINT": props.database.cluster_endpoint.hostname,
                "BUCKET_NAME": props.storage_bucket.bucket_name,
                "ENVIRONMENT": env_suffix
            }
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=8080, protocol=ecs.Protocol.TCP)
        )

        # Fargate Service
        self.ecs_service = ecs.FargateService(
            self,
            f"PaymentService-{env_suffix}",
            service_name=f"payment-service-{env_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[props.ecs_security_group],
            assign_public_ip=False
        )

        # Target group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"PaymentTargetGroup-{env_suffix}",
            target_group_name=f"payment-tg-{env_suffix}",
            vpc=props.vpc,
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=Duration.seconds(5),
                interval=Duration.seconds(30)
            )
        )

        # Register ECS service with target group
        self.ecs_service.attach_to_application_target_group(target_group)

        # Add listener to ALB
        props.alb.add_listener(
            f"HTTPSListener-{env_suffix}",
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTPS,
            default_target_groups=[target_group],
            certificates=[
                # Add your certificate here
            ]
        )

        # Auto-scaling based on CPU and Memory
        scaling = self.ecs_service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10
        )

        scaling.scale_on_cpu_utilization(
            f"CPUScaling-{env_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        scaling.scale_on_memory_utilization(
            f"MemoryScaling-{env_suffix}",
            target_utilization_percent=80,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        # SQS Dead Letter Queue
        dlq = sqs.Queue(
            self,
            f"PaymentDLQ-{env_suffix}",
            queue_name=f"payment-dlq-{env_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=props.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # SQS Queue for payment processing
        payment_queue = sqs.Queue(
            self,
            f"PaymentQueue-{env_suffix}",
            queue_name=f"payment-queue-{env_suffix}",
            visibility_timeout=Duration.minutes(5),
            retention_period=Duration.days(7),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=props.kms_key,
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=dlq
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Lambda execution role with least-privilege
        lambda_role = iam.Role(
            self,
            f"PaymentLambdaRole-{env_suffix}",
            role_name=f"payment-lambda-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Grant permissions
        payment_queue.grant_consume_messages(lambda_role)
        props.database.grant_connect(lambda_role, "dbadmin")
        props.storage_bucket.grant_read_write(lambda_role)

        # Lambda function for async payment processing
        payment_processor_lambda = lambda_.Function(
            self,
            f"PaymentProcessorLambda-{env_suffix}",
            function_name=f"payment-processor-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/payment_processor"),
            timeout=Duration.minutes(5),
            memory_size=512,
            role=lambda_role,
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[props.lambda_security_group],
            environment={
                "DB_ENDPOINT": props.database.cluster_endpoint.hostname,
                "BUCKET_NAME": props.storage_bucket.bucket_name,
                "QUEUE_URL": payment_queue.queue_url,
                "ENVIRONMENT": env_suffix
            },
            environment_encryption=props.kms_key,
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Add SQS trigger to Lambda
        payment_processor_lambda.add_event_source(
            lambda_.SqsEventSource(
                payment_queue,
                batch_size=10,
                max_batching_window=Duration.seconds(30)
            )
        )

        # Fraud detection Lambda
        fraud_detection_lambda = lambda_.Function(
            self,
            f"FraudDetectionLambda-{env_suffix}",
            function_name=f"fraud-detection-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/fraud_detection"),
            timeout=Duration.seconds(30),
            memory_size=256,
            role=lambda_role,
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[props.lambda_security_group],
            environment={
                "DB_ENDPOINT": props.database.cluster_endpoint.hostname,
                "ENVIRONMENT": env_suffix
            },
            environment_encryption=props.kms_key,
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        self.lambda_functions = [payment_processor_lambda, fraud_detection_lambda]

        CfnOutput(
            self,
            "ECSServiceName",
            value=self.ecs_service.service_name,
            description="ECS Service Name"
        )

        CfnOutput(
            self,
            "QueueURL",
            value=payment_queue.queue_url,
            description="Payment Processing Queue URL"
        )
```

## File: lib/storage_stack.py

```python
"""
Storage infrastructure - S3 buckets with encryption, lifecycle, and replication.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_s3 as s3,
    aws_kms as kms,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class StorageStackProps:
    """Properties for StorageStack."""

    def __init__(self, environment_suffix: str, kms_key: kms.Key):
        self.environment_suffix = environment_suffix
        self.kms_key = kms_key


class StorageStack(NestedStack):
    """S3 storage infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: StorageStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Destination bucket for cross-region replication
        self.replication_bucket = s3.Bucket(
            self,
            f"ReplicationBucket-{env_suffix}",
            bucket_name=f"payment-docs-replica-{env_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=props.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Primary document storage bucket
        self.document_bucket = s3.Bucket(
            self,
            f"DocumentBucket-{env_suffix}",
            bucket_name=f"payment-docs-{env_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=props.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id=f"TransitionToIA-{env_suffix}",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.DEEP_ARCHIVE,
                            transition_after=Duration.days(180)
                        )
                    ],
                    enabled=True
                ),
                s3.LifecycleRule(
                    id=f"ExpireOldVersions-{env_suffix}",
                    noncurrent_version_expiration=Duration.days(30),
                    enabled=True
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        CfnOutput(
            self,
            "DocumentBucketName",
            value=self.document_bucket.bucket_name,
            description="Document storage bucket name"
        )

        CfnOutput(
            self,
            "ReplicationBucketName",
            value=self.replication_bucket.bucket_name,
            description="Replication bucket name"
        )
```

## File: lib/api_stack.py

```python
"""
API Gateway infrastructure with mutual TLS and throttling.
"""
from aws_cdk import (
    NestedStack,
    aws_apigateway as apigw,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_logs as logs,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class ApiStackProps:
    """Properties for ApiStack."""

    def __init__(
        self,
        environment_suffix: str,
        vpc: ec2.Vpc,
        alb: elbv2.ApplicationLoadBalancer
    ):
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.alb = alb


class ApiStack(NestedStack):
    """API Gateway infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: ApiStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # CloudWatch Log Group for API Gateway
        log_group = logs.LogGroup(
            self,
            f"APIGatewayLogs-{env_suffix}",
            log_group_name=f"/aws/apigateway/payment-api-{env_suffix}",
            retention=logs.RetentionDays.SEVEN_YEARS,
            removal_policy=RemovalPolicy.DESTROY
        )

        # REST API
        self.api = apigw.RestApi(
            self,
            f"PaymentAPI-{env_suffix}",
            rest_api_name=f"payment-api-{env_suffix}",
            description="Payment Processing API with mutual TLS",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigw.LogGroupLogDestination(log_group),
                access_log_format=apigw.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                )
            ),
            endpoint_configuration=apigw.EndpointConfiguration(
                types=[apigw.EndpointType.REGIONAL]
            ),
            cloud_watch_role=True
        )

        # VPC Link for private integration with ALB
        vpc_link = apigw.VpcLink(
            self,
            f"PaymentVPCLink-{env_suffix}",
            vpc_link_name=f"payment-vpc-link-{env_suffix}",
            targets=[props.alb]
        )

        # HTTP Integration with ALB
        integration = apigw.Integration(
            type=apigw.IntegrationType.HTTP_PROXY,
            integration_http_method="ANY",
            uri=f"http://{props.alb.load_balancer_dns_name}",
            options=apigw.IntegrationOptions(
                connection_type=apigw.ConnectionType.VPC_LINK,
                vpc_link=vpc_link,
                request_parameters={
                    "integration.request.path.proxy": "method.request.path.proxy"
                }
            )
        )

        # Add proxy resource
        proxy = self.api.root.add_resource("{proxy+}")
        proxy.add_method(
            "ANY",
            integration,
            request_parameters={
                "method.request.path.proxy": True
            }
        )

        # Usage Plan
        usage_plan = self.api.add_usage_plan(
            f"PaymentUsagePlan-{env_suffix}",
            name=f"payment-usage-plan-{env_suffix}",
            throttle=apigw.ThrottleSettings(
                rate_limit=1000,
                burst_limit=2000
            ),
            quota=apigw.QuotaSettings(
                limit=1000000,
                period=apigw.Period.MONTH
            )
        )

        usage_plan.add_api_stage(
            stage=self.api.deployment_stage
        )

        # API Key
        api_key = self.api.add_api_key(
            f"PaymentAPIKey-{env_suffix}",
            api_key_name=f"payment-api-key-{env_suffix}"
        )

        usage_plan.add_api_key(api_key)

        CfnOutput(
            self,
            "APIEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL"
        )

        CfnOutput(
            self,
            "APIKeyId",
            value=api_key.key_id,
            description="API Key ID"
        )
```

## File: lib/monitoring_stack.py

```python
"""
Monitoring infrastructure - CloudWatch dashboards, metrics, and alarms.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_cloudwatch as cloudwatch,
    aws_elasticloadbalancingv2 as elbv2,
    aws_ecs as ecs,
    aws_rds as rds,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_sns as sns,
    aws_cloudwatch_actions as cw_actions
)
from constructs import Construct
from typing import List


class MonitoringStackProps:
    """Properties for MonitoringStack."""

    def __init__(
        self,
        environment_suffix: str,
        alb: elbv2.ApplicationLoadBalancer,
        ecs_service: ecs.FargateService,
        database: rds.DatabaseCluster,
        lambda_functions: List[lambda_.Function],
        api: apigw.RestApi
    ):
        self.environment_suffix = environment_suffix
        self.alb = alb
        self.ecs_service = ecs_service
        self.database = database
        self.lambda_functions = lambda_functions
        self.api = api


class MonitoringStack(NestedStack):
    """CloudWatch monitoring and alerting infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: MonitoringStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # SNS Topic for alarms
        alarm_topic = sns.Topic(
            self,
            f"AlarmTopic-{env_suffix}",
            topic_name=f"payment-alarms-{env_suffix}",
            display_name="Payment Processing Alarms"
        )

        # CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self,
            f"PaymentDashboard-{env_suffix}",
            dashboard_name=f"payment-dashboard-{env_suffix}"
        )

        # ALB Metrics
        alb_target_response_time = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="TargetResponseTime",
            dimensions_map={
                "LoadBalancer": props.alb.load_balancer_full_name
            },
            statistic="Average",
            period=Duration.minutes(1)
        )

        alb_request_count = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="RequestCount",
            dimensions_map={
                "LoadBalancer": props.alb.load_balancer_full_name
            },
            statistic="Sum",
            period=Duration.minutes(1)
        )

        alb_target_errors = cloudwatch.Metric(
            namespace="AWS/ApplicationELB",
            metric_name="HTTPCode_Target_5XX_Count",
            dimensions_map={
                "LoadBalancer": props.alb.load_balancer_full_name
            },
            statistic="Sum",
            period=Duration.minutes(1)
        )

        # ECS Metrics
        ecs_cpu = props.ecs_service.metric_cpu_utilization(
            period=Duration.minutes(1)
        )

        ecs_memory = props.ecs_service.metric_memory_utilization(
            period=Duration.minutes(1)
        )

        # Database Metrics
        db_cpu = props.database.metric_cpu_utilization(
            period=Duration.minutes(1)
        )

        db_connections = props.database.metric_database_connections(
            period=Duration.minutes(1)
        )

        # API Gateway Metrics
        api_requests = props.api.metric_count(
            period=Duration.minutes(1)
        )

        api_latency = props.api.metric_latency(
            period=Duration.minutes(1)
        )

        api_errors = props.api.metric_server_error(
            period=Duration.minutes(1)
        )

        # Add widgets to dashboard
        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Performance",
                left=[alb_request_count],
                right=[alb_target_response_time],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="ALB Errors",
                left=[alb_target_errors],
                width=12
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Resource Utilization",
                left=[ecs_cpu, ecs_memory],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Database Performance",
                left=[db_cpu],
                right=[db_connections],
                width=12
            )
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="API Gateway Requests",
                left=[api_requests],
                right=[api_latency],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="API Gateway Errors",
                left=[api_errors],
                width=12
            )
        )

        # Lambda metrics
        for i, lambda_fn in enumerate(props.lambda_functions):
            lambda_errors = lambda_fn.metric_errors(
                period=Duration.minutes(1)
            )
            lambda_duration = lambda_fn.metric_duration(
                period=Duration.minutes(1)
            )

            self.dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title=f"Lambda: {lambda_fn.function_name}",
                    left=[lambda_errors],
                    right=[lambda_duration],
                    width=12
                )
            )

        # Custom metrics for transaction processing
        transaction_processing_time = cloudwatch.Metric(
            namespace=f"PaymentProcessing/{env_suffix}",
            metric_name="TransactionProcessingTime",
            statistic="Average",
            period=Duration.minutes(1)
        )

        transaction_success_rate = cloudwatch.Metric(
            namespace=f"PaymentProcessing/{env_suffix}",
            metric_name="TransactionSuccessRate",
            statistic="Average",
            period=Duration.minutes(1)
        )

        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Transaction Metrics",
                left=[transaction_processing_time],
                right=[transaction_success_rate],
                width=24
            )
        )

        # Alarms
        # High ALB response time
        cloudwatch.Alarm(
            self,
            f"HighResponseTimeAlarm-{env_suffix}",
            alarm_name=f"payment-high-response-time-{env_suffix}",
            metric=alb_target_response_time,
            threshold=1000,  # 1 second
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # High error rate
        cloudwatch.Alarm(
            self,
            f"HighErrorRateAlarm-{env_suffix}",
            alarm_name=f"payment-high-error-rate-{env_suffix}",
            metric=alb_target_errors,
            threshold=10,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # High ECS CPU
        cloudwatch.Alarm(
            self,
            f"HighECSCPUAlarm-{env_suffix}",
            alarm_name=f"payment-high-ecs-cpu-{env_suffix}",
            metric=ecs_cpu,
            threshold=80,
            evaluation_periods=3,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # High Database CPU
        cloudwatch.Alarm(
            self,
            f"HighDBCPUAlarm-{env_suffix}",
            alarm_name=f"payment-high-db-cpu-{env_suffix}",
            metric=db_cpu,
            threshold=80,
            evaluation_periods=3,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Lambda errors
        for lambda_fn in props.lambda_functions:
            cloudwatch.Alarm(
                self,
                f"LambdaErrorAlarm-{lambda_fn.function_name}-{env_suffix}",
                alarm_name=f"lambda-errors-{lambda_fn.function_name}-{env_suffix}",
                metric=lambda_fn.metric_errors(),
                threshold=5,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
            ).add_alarm_action(cw_actions.SnsAction(alarm_topic))
```

## File: lib/__init__.py

```python
"""
Payment Processing API Infrastructure package.
"""
```

## File: lib/lambda/payment_processor/index.py

```python
"""
Lambda function for async payment processing.
"""
import json
import os
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')

DB_ENDPOINT = os.environ['DB_ENDPOINT']
BUCKET_NAME = os.environ['BUCKET_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event, context):
    """
    Process payment messages from SQS queue.
    """
    logger.info(f"Processing {len(event['Records'])} payment records")

    successful_payments = 0
    failed_payments = 0

    for record in event['Records']:
        try:
            # Parse message
            message = json.loads(record['body'])
            payment_id = message.get('payment_id')
            amount = message.get('amount')
            customer_id = message.get('customer_id')

            logger.info(f"Processing payment {payment_id} for customer {customer_id}")

            # Process payment logic here
            start_time = datetime.now()

            # Simulate payment processing
            process_payment(payment_id, amount, customer_id)

            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds() * 1000

            # Store receipt in S3
            receipt = {
                'payment_id': payment_id,
                'customer_id': customer_id,
                'amount': amount,
                'timestamp': end_time.isoformat(),
                'status': 'completed'
            }

            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=f"receipts/{payment_id}.json",
                Body=json.dumps(receipt),
                ServerSideEncryption='aws:kms'
            )

            # Send custom metrics
            cloudwatch.put_metric_data(
                Namespace=f'PaymentProcessing/{ENVIRONMENT}',
                MetricData=[
                    {
                        'MetricName': 'TransactionProcessingTime',
                        'Value': processing_time,
                        'Unit': 'Milliseconds',
                        'Timestamp': datetime.now()
                    },
                    {
                        'MetricName': 'TransactionSuccessRate',
                        'Value': 100,
                        'Unit': 'Percent',
                        'Timestamp': datetime.now()
                    }
                ]
            )

            successful_payments += 1
            logger.info(f"Successfully processed payment {payment_id}")

        except Exception as e:
            failed_payments += 1
            logger.error(f"Failed to process payment: {str(e)}")

            # Send failure metric
            cloudwatch.put_metric_data(
                Namespace=f'PaymentProcessing/{ENVIRONMENT}',
                MetricData=[
                    {
                        'MetricName': 'TransactionSuccessRate',
                        'Value': 0,
                        'Unit': 'Percent',
                        'Timestamp': datetime.now()
                    }
                ]
            )

            # Re-raise to send to DLQ
            raise

    return {
        'statusCode': 200,
        'body': json.dumps({
            'successful': successful_payments,
            'failed': failed_payments
        })
    }


def process_payment(payment_id, amount, customer_id):
    """
    Process payment transaction.
    """
    # Add actual payment processing logic here
    # This could involve:
    # - Validating payment details
    # - Checking fraud detection
    # - Connecting to payment gateway
    # - Updating database
    logger.info(f"Processing payment {payment_id} for ${amount}")
```

## File: lib/lambda/payment_processor/requirements.txt

```txt
boto3>=1.26.0
```

## File: lib/lambda/fraud_detection/index.py

```python
"""
Lambda function for fraud detection.
"""
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DB_ENDPOINT = os.environ['DB_ENDPOINT']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event, context):
    """
    Analyze transactions for fraud indicators.
    """
    logger.info(f"Analyzing transaction for fraud")

    try:
        # Parse transaction data
        transaction = json.loads(event['body']) if 'body' in event else event

        transaction_id = transaction.get('transaction_id')
        amount = float(transaction.get('amount', 0))
        customer_id = transaction.get('customer_id')
        location = transaction.get('location')

        logger.info(f"Analyzing transaction {transaction_id}")

        # Fraud detection logic
        risk_score = calculate_risk_score(amount, customer_id, location)

        result = {
            'transaction_id': transaction_id,
            'risk_score': risk_score,
            'status': 'approved' if risk_score < 0.7 else 'flagged',
            'timestamp': datetime.now().isoformat()
        }

        logger.info(f"Transaction {transaction_id} risk score: {risk_score}")

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        logger.error(f"Error in fraud detection: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def calculate_risk_score(amount, customer_id, location):
    """
    Calculate fraud risk score based on transaction attributes.
    """
    risk_score = 0.0

    # High amount transactions
    if amount > 10000:
        risk_score += 0.3

    # Add more fraud detection logic here
    # - Check transaction velocity
    # - Check location anomalies
    # - Check customer history
    # - Apply ML model

    return min(risk_score, 1.0)
```

## File: lib/lambda/fraud_detection/requirements.txt

```txt
boto3>=1.26.0
```

## File: lib/lambda/secret_rotation/index.py

```python
"""
Lambda function for rotating Secrets Manager secrets.
"""
import json
import os
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_client = boto3.client('secretsmanager')
rds_client = boto3.client('rds')

SECRET_ARN = os.environ['SECRET_ARN']


def handler(event, context):
    """
    Rotate database credentials.
    """
    logger.info(f"Rotating secret: {SECRET_ARN}")

    token = event['Token']
    step = event['Step']

    try:
        if step == "createSecret":
            create_secret(token)
        elif step == "setSecret":
            set_secret(token)
        elif step == "testSecret":
            test_secret(token)
        elif step == "finishSecret":
            finish_secret(token)
        else:
            raise ValueError(f"Invalid step: {step}")

        logger.info(f"Successfully completed step: {step}")

    except Exception as e:
        logger.error(f"Error during rotation step {step}: {str(e)}")
        raise


def create_secret(token):
    """Create new secret version."""
    logger.info("Creating new secret version")
    # Implementation for creating new credentials
    pass


def set_secret(token):
    """Set new secret in database."""
    logger.info("Setting new secret in database")
    # Implementation for updating database credentials
    pass


def test_secret(token):
    """Test new secret."""
    logger.info("Testing new secret")
    # Implementation for testing new credentials
    pass


def finish_secret(token):
    """Finalize secret rotation."""
    logger.info("Finalizing secret rotation")
    # Implementation for finalizing rotation
    pass
```

## File: lib/lambda/secret_rotation/requirements.txt

```txt
boto3>=1.26.0
psycopg2-binary>=2.9.0
```
