I'll help you create a secure AWS infrastructure for an e-commerce application using AWS CDK in Python with comprehensive testing. Let me break this down into the required components.

##  Project Structure Implementation

### 1. Entry Point: `tap.py`

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Environment configuration
env = cdk.Environment(
    account=os.getenv('CDK_DEFAULT_ACCOUNT', '123456789012'),  # Replace with your account
    region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
)

TapStack(app, "TapStack-dev", env=env)

app.synth()
```

### 2. Main Stack: `lib/tap_stack.py`

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudfront as cloudfront,
    RemovalPolicy,
    Duration
)
from constructs import Construct
import aws_cdk as cdk

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create VPC with public and private subnets
        self.vpc = ec2.Vpc(
            self, "EcommerceVpc",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )
        
        # Create CloudFront Origin Access Control
        self.oac = cloudfront.OriginAccessControl(
            self, "EcommerceOAC",
            description="OAC for e-commerce S3 bucket",
            origin_access_control_origin_type=cloudfront.OriginAccessControlOriginType.S3,
            signing=cloudfront.Signing.SIGV4_ALWAYS
        )
        
        # Create S3 bucket with security configurations
        self.s3_bucket = self._create_s3_bucket()
        
        # Create RDS instance
        self.rds_instance = self._create_rds_instance()
        
        # Create IAM roles
        self.rds_access_role = self._create_rds_access_role()
        self.s3_access_role = self._create_s3_access_role()
        
        # Create CloudFront distribution
        self.cloudfront_distribution = self._create_cloudfront_distribution()
        
        # Update S3 bucket policy after CloudFront creation
        self._update_s3_bucket_policy()
    
    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with security best practices"""
        bucket = s3.Bucket(
            self, "EcommerceBucket",
            bucket_name=f"ecommerce-assets-{self.account}-{self.region}",
            versioning=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            enforce_ssl=True,
            server_access_logs_prefix="access-logs/",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )
        
        return bucket
    
    def _create_rds_instance(self) -> rds.DatabaseInstance:
        """Create RDS PostgreSQL instance with security configurations"""
        # Create DB subnet group in private subnets only
        db_subnet_group = rds.SubnetGroup(
            self, "EcommerceDbSubnetGroup",
            description="Subnet group for e-commerce database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )
        
        # Create security group for RDS
        db_security_group = ec2.SecurityGroup(
            self, "EcommerceDbSecurityGroup",
            vpc=self.vpc,
            description="Security group for e-commerce database",
            allow_all_outbound=False
        )
        
        # Create application security group (for services that need DB access)
        app_security_group = ec2.SecurityGroup(
            self, "EcommerceAppSecurityGroup",
            vpc=self.vpc,
            description="Security group for application services"
        )
        
        # Allow DB access only from application security group
        db_security_group.add_ingress_rule(
            peer=app_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from application services"
        )
        
        # Store app security group for potential use by other services
        self.app_security_group = app_security_group
        
        # Create RDS instance
        rds_instance = rds.DatabaseInstance(
            self, "EcommerceDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, 
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[db_security_group],
            database_name="ecommerce",
            credentials=rds.Credentials.from_generated_secret(
                "ecommerce_admin",
                secret_name="ecommerce/db/credentials"
            ),
            backup_retention=Duration.days(7),
            multi_az=True,
            storage_encrypted=True,
            deletion_protection=True,
            delete_automated_backups=False,
            removal_policy=RemovalPolicy.RETAIN,
            parameter_group=rds.ParameterGroup.from_parameter_group_name(
                self, "EcommerceDbParameterGroup",
                "default.postgres15"
            )
        )
        
        return rds_instance
    
    def _create_rds_access_role(self) -> iam.Role:
        """Create IAM role for RDS access with least privilege"""
        role = iam.Role(
            self, "EcommerceRdsAccessRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for accessing e-commerce RDS instance",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )
        
        # Add policy for RDS connect (for RDS Proxy if used)
        rds_policy = iam.Policy(
            self, "EcommerceRdsAccessPolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "rds-db:connect"
                    ],
                    resources=[
                        f"arn:aws:rds-db:{self.region}:{self.account}:dbuser:{self.rds_instance.instance_resource_id}/ecommerce_app"
                    ]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    resources=[
                        self.rds_instance.secret.secret_arn
                    ]
                )
            ]
        )
        
        role.attach_inline_policy(rds_policy)
        return role
    
    def _create_s3_access_role(self) -> iam.Role:
        """Create IAM role for S3 access with least privilege"""
        role = iam.Role(
            self, "EcommerceS3AccessRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for accessing e-commerce S3 bucket",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )
        
        # Add policy for specific S3 bucket access
        s3_policy = iam.Policy(
            self, "EcommerceS3AccessPolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    resources=[
                        f"{self.s3_bucket.bucket_arn}/*"
                    ]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:ListBucket"
                    ],
                    resources=[
                        self.s3_bucket.bucket_arn
                    ]
                )
            ]
        )
        
        role.attach_inline_policy(s3_policy)
        return role
    
    def _create_cloudfront_distribution(self) -> cloudfront.Distribution:
        """Create CloudFront distribution for S3 bucket"""
        distribution = cloudfront.Distribution(
            self, "EcommerceDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=cloudfront.S3Origin(
                    bucket=self.s3_bucket,
                    origin_access_control=self.oac
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                compress=True
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enabled=True
        )
        
        return distribution
    
    def _update_s3_bucket_policy(self):
        """Update S3 bucket policy to allow access only from CloudFront OAC"""
        bucket_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    sid="AllowCloudFrontServicePrincipal",
                    effect=iam.Effect.ALLOW,
                    principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                    actions=["s3:GetObject"],
                    resources=[f"{self.s3_bucket.bucket_arn}/*"],
                    conditions={
                        "StringEquals": {
                            "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{self.cloudfront_distribution.distribution_id}"
                        }
                    }
                ),
                iam.PolicyStatement(
                    sid="DenyPublicAccess",
                    effect=iam.Effect.DENY,
                    principals=[iam.AnyPrincipal()],
                    actions=["s3:*"],
                    resources=[
                        self.s3_bucket.bucket_arn,
                        f"{self.s3_bucket.bucket_arn}/*"
                    ],
                    conditions={
                        "Bool": {
                            "aws:SecureTransport": "false"
                        }
                    }
                )
            ]
        )
        
        # Apply the policy to the bucket
        s3.CfnBucketPolicy(
            self, "EcommerceBucketPolicy",
            bucket=self.s3_bucket.bucket_name,
            policy_document=bucket_policy.to_json()
        )
```

### 3. Unit Tests: `tests/unit/test_tap_stack.py`

```python
import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack

@pytest.fixture
def template():
    """Create a CDK template for testing"""
    app = cdk.App()
    stack = TapStack(app, "test-stack")
    return Template.from_stack(stack)

class TestTapStackUnit:
    """Unit tests for TapStack resource definitions"""
    
    def test_s3_bucket_configuration(self, template):
        """Test S3 bucket has correct security configurations"""
        # Assert S3 bucket exists with versioning enabled
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })
    
    def test_s3_bucket_policy_cloudfront_only(self, template):
        """Test S3 bucket policy allows access only from CloudFront"""
        template.has_resource_properties("AWS::S3::BucketPolicy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Sid": "AllowCloudFrontServicePrincipal",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudfront.amazonaws.com"
                        },
                        "Action": "s3:GetObject",
                        "Condition": {
                            "StringEquals": {
                                "AWS:SourceArn": Match.any_value()
                            }
                        }
                    }
                ])
            }
        })
    
    def test_rds_security_configuration(self, template):
        """Test RDS instance has proper security settings"""
        # Test RDS instance configuration
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": True,
            "MultiAZ": True,
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "Engine": "postgres"
        })
    
    def test_rds_subnet_group_private_only(self, template):
        """Test RDS subnet group uses only private subnets"""
        # This test verifies that subnet group exists
        # The actual subnet verification is better done in integration tests
        template.has_resource("AWS::RDS::DBSubnetGroup", {
            "Properties": {
                "DBSubnetGroupDescription": "Subnet group for e-commerce database"
            }
        })
    
    def test_rds_security_group_restrictions(self, template):
        """Test RDS security group allows only internal access"""
        # Find security group rules for RDS
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for e-commerce database",
            "SecurityGroupEgress": []  # No outbound rules
        })
        
        # Test that ingress rule exists from app security group
        template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "Description": "Allow PostgreSQL access from application services"
        })
    
    def test_iam_rds_role_least_privilege(self, template):
        """Test RDS access role has minimal required permissions"""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            },
            "Description": "Role for accessing e-commerce RDS instance"
        })
        
        # Test inline policy for RDS access
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": ["rds-db:connect"],
                        "Resource": Match.string_like_regexp(r"arn:aws:rds-db:.*:dbuser:.*/ecommerce_app")
                    }
                ])
            }
        })
    
    def test_iam_s3_role_least_privilege(self, template):
        """Test S3 access role has minimal required permissions"""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            },
            "Description": "Role for accessing e-commerce S3 bucket"
        })
        
        # Test inline policy for S3 access
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject", 
                            "s3:DeleteObject"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["s3:ListBucket"]
                    }
                ])
            }
        })
    
    def test_cloudfront_distribution_exists(self, template):
        """Test CloudFront distribution is created with proper configuration"""
        template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": {
                "Enabled": True,
                "PriceClass": "PriceClass_100",
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "redirect-to-https",
                    "Compress": True
                }
            }
        })
    
    def test_vpc_configuration(self, template):
        """Test VPC has proper subnet configuration"""
        # Test VPC exists
        template.has_resource("AWS::EC2::VPC", {})
        
        # Test that we have both public and private subnets
        template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 AZs × 2 subnet types
        
        # Test NAT Gateway exists
        template.resource_count_is("AWS::EC2::NatGateway", 1)
```

### 4. Integration Tests: `tests/integration/test_tap_stack.py`

```python
import aws_cdk as cdk
import pytest
import json
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack

@pytest.fixture
def synthesized_template():
    """Create and synthesize a CDK template for integration testing"""
    app = cdk.App()
    stack = TapStack(app, "integration-test-stack")
    template = Template.from_stack(stack)
    return template, stack

class TestTapStackIntegration:
    """Integration tests for synthesized CloudFormation template"""
    
    def test_resource_counts(self, synthesized_template):
        """Test expected resource counts in synthesized template"""
        template, stack = synthesized_template
        
        # Core infrastructure resources
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::RDS::DBInstance", 1)
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.resource_count_is("AWS::CloudFront::OriginAccessControl", 1)
        
        # IAM resources
        template.resource_count_is("AWS::IAM::Role", 2)  # RDS and S3 access roles
        template.resource_count_is("AWS::IAM::Policy", 2)  # Inline policies for roles
        
        # Security groups
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)  # DB and App security groups
        
        # VPC resources
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
        template.resource_count_is("AWS::EC2::InternetGateway", 1)
        template.resource_count_is("AWS::EC2::NatGateway", 1)
    
    def test_rds_subnet_group_private_subnets_only(self, synthesized_template):
        """Test RDS subnet group contains only private subnets"""
        template, stack = synthesized_template
        
        # Get all subnets from template
        subnets = template.find_resources("AWS::EC2::Subnet")
        
        # Get RDS subnet group
        subnet_groups = template.find_resources("AWS::RDS::DBSubnetGroup")
        assert len(subnet_groups) == 1
        
        subnet_group = list(subnet_groups.values())[0]
        subnet_refs = subnet_group["Properties"]["SubnetIds"]
        
        # Verify that referenced subnets are private (don't have MapPublicIpOnLaunch: true)
        for subnet_ref in subnet_refs:
            if isinstance(subnet_ref, dict) and "Ref" in subnet_ref:
                subnet_logical_id = subnet_ref["Ref"]
                subnet_props = subnets[subnet_logical_id]["Properties"]
                
                # Private subnets should not have MapPublicIpOnLaunch set to true
                map_public_ip = subnet_props.get("MapPublicIpOnLaunch", False)
                assert map_public_ip is False, f"Subnet {subnet_logical_id} should be private"
    
    def test_s3_bucket_policy_cloudfront_restriction(self, synthesized_template):
        """Test S3 bucket policy allows access only from CloudFront distribution"""
        template, stack = synthesized_template
        
        # Get bucket policy
        bucket_policies = template.find_resources("AWS::S3::BucketPolicy")
        assert len(bucket_policies) == 1
        
        bucket_policy = list(bucket_policies.values())[0]
        policy_doc = bucket_policy["Properties"]["PolicyDocument"]
        
        # Find CloudFront allow statement
        cloudfront_statement = None
        for statement in policy_doc["Statement"]:
            if statement.get("Sid") == "AllowCloudFrontServicePrincipal":
                cloudfront_statement = statement
                break
        
        assert cloudfront_statement is not None, "CloudFront access statement not found"
        assert cloudfront_statement["Effect"] == "Allow"
        assert cloudfront_statement["Principal"]["Service"] == "cloudfront.amazonaws.com"
        assert "AWS:SourceArn" in cloudfront_statement["Condition"]["StringEquals"]
        
        # Verify the SourceArn references the CloudFront distribution
        source_arn = cloudfront_statement["Condition"]["StringEquals"]["AWS:SourceArn"]
        assert "cloudfront" in str(source_arn).lower()
        assert "distribution" in str(source_arn).lower()
    
    def test_rds_security_configuration_integration(self, synthesized_template):
        """Test RDS instance security settings in synthesized template"""
        template, stack = synthesized_template
        
        rds_instances = template.find_resources("AWS::RDS::DBInstance")
        assert len(rds_instances) == 1
        
        rds_instance = list(rds_instances.values())[0]
        props = rds_instance["Properties"]
        
        # Verify security settings
        assert props["DeletionProtection"] is True
        assert props["MultiAZ"] is True
        assert props["StorageEncrypted"] is True
        assert props["BackupRetentionPeriod"] == 7
        assert props["Engine"] == "postgres"
        
        # Verify it's in a private subnet group
        assert "DBSubnetGroupName" in props
    
    def test_iam_roles_policy_structure(self, synthesized_template):
        """Test IAM roles have expected policy structure and permissions"""
        template, stack = synthesized_template
        
        # Get all IAM roles
        roles = template.find_resources("AWS::IAM::Role")
        policies = template.find_resources("AWS::IAM::Policy")
        
        # Should have exactly 2 roles and 2 policies
        assert len(roles) == 2
        assert len(policies) == 2
        
        # Check role descriptions to identify them
        rds_role = None
        s3_role = None
        
        for role_id, role in roles.items():
            description = role["Properties"].get("Description", "")
            if "RDS" in description:
                rds_role = role
            elif "S3" in description:
                s3_role = role
        
        assert rds_role is not None, "RDS access role not found"
        assert s3_role is not None, "S3 access role not found"
        
        # Verify both roles are assumable by Lambda
        for role in [rds_role, s3_role]:
            assume_policy = role["Properties"]["AssumeRolePolicyDocument"]
            lambda_principal = False
            for statement in assume_policy["Statement"]:
                if (statement.get("Principal", {}).get("Service") == "lambda.amazonaws.com" and
                    statement.get("Action") == "sts:AssumeRole"):
                    lambda_principal = True
                    break
            assert lambda_principal, "Role should be assumable by Lambda"
    
    def test_security_groups_configuration(self, synthesized_template):
        """Test security groups are properly configured"""
        template, stack = synthesized_template
        
        security_groups = template.find_resources("AWS::EC2::SecurityGroup")
        
        # Should have DB and App security groups
        db_sg = None
        app_sg = None
        
        for sg_id, sg in security_groups.items():
            description = sg["Properties"]["GroupDescription"]
            if "database" in description.lower():
                db_sg = sg
            elif "application" in description.lower():
                app_sg = sg
        
        assert db_sg is not None, "Database security group not found"
        assert app_sg is not None, "Application security group not found"
        
        # DB security group should have no outbound rules (empty egress)
        db_egress = db_sg["Properties"].get("SecurityGroupEgress", [])
        assert len(db_egress) == 0, "Database security group should have no outbound rules"
    
    def test_cloudfront_s3_integration(self, synthesized_template):
        """Test CloudFront distribution is properly configured with S3 origin"""
        template, stack = synthesized_template
        
        distributions = template.find_resources("AWS::CloudFront::Distribution")
        assert len(distributions) == 1
        
        distribution = list(distributions.values())[0]
        config = distribution["Properties"]["DistributionConfig"]
        
        # Verify security settings
        assert config["Enabled"] is True
        default_behavior = config["DefaultCacheBehavior"]
        assert default_behavior["ViewerProtocolPolicy"] == "redirect-to-https"
        assert default_behavior["Compress"] is True
        
        # Verify origin configuration
        origins = config.get("Origins", [])
        assert len(origins) >= 1, "CloudFront should have at least one origin"
        
        # Check if S3 origin is configured
        s3_origin_found = False
        for origin in origins:
            if "S3OriginConfig" in origin or "DomainName" in origin:
                s3_origin_found = True
                break
        
        assert s3_origin_found, "S3 origin should be configured in CloudFront"
```

### 5. Additional Configuration Files

#### `requirements.txt`
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
pytest>=7.0.0
pytest-cov>=4.0.0
```

#### `cdk.json`
```json
{
  "app": "python tap.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/.venv"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

##  Running the Tests

### Setup and Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Run unit tests
pytest tests/unit/ -v

# Run integration tests
pytest tests/integration/ -v

# Run all tests with coverage
pytest tests/ --cov=lib --cov-report=html -v
```

### CDK Commands
```bash
# Synthesize the CloudFormation template
cdk synth

# Deploy the stack
cdk deploy TapStack-dev

# Destroy the stack
cdk destroy TapStack-dev
```

##  Security Features Implemented

### S3 Security
-  Block all public access
-  Versioning enabled
-  SSE-S3 encryption
-  Bucket policy restricts access to CloudFront OAC only
-  SSL enforcement
-  Access logging

### RDS Security
-  Private subnets only (no public access)
-  Encryption at rest
-  Multi-AZ deployment
-  Automated backups (7 days retention)
-  Deletion protection
-  Security group restricts access to application services only
-  Credentials stored in AWS Secrets Manager

### IAM Security
-  Least privilege principle
-  Resource-scoped permissions
-  Action-limited policies
-  Service-specific assume role policies

This implementation provides a comprehensive, secure e-commerce infrastructure with thorough testing coverage that validates both the resource definitions and the synthesized CloudFormation template behavior.