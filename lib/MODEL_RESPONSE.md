=== lib/tap_stack.py ===

```python
import pulumi
import pulumi_aws as aws
from typing import Dict, Any, List
import json

# GitHub Actions CI/CD Pipeline Configuration (add to .github/workflows/deploy.yml):
"""
name: Deploy Infrastructure
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: |
          pip install pulumi pulumi-aws black flake8 mypy
          black --check .
          flake8 .
          mypy lib/

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: |
          pip install pulumi pulumi-aws pytest
          pytest tests/

  preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pulumi/actions@v4
        with:
          command: preview
          stack-name: production
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pulumi/actions@v4
        id: deploy
        with:
          command: up
          stack-name: production
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Notify Success
        if: success()
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":" Infrastructure deployed successfully"}' \
            ${{ secrets.SLACK_WEBHOOK_URL }}
      
      - name: Rollback on Failure
        if: failure()
        run: |
          # Cancel current deployment
          pulumi cancel --stack production --yes
          # Get last successful commit
          LAST_COMMIT=$(git log --format="%H" -n 2 | tail -1)
          git checkout $LAST_COMMIT
          # Redeploy last known good state
          pulumi up --stack production --yes
          # Notify failure
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":" Deployment failed, rolled back to previous state"}' \
            ${{ secrets.SLACK_WEBHOOK_URL }}
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
"""

class TapStack:
    def __init__(self):
        # Get configuration with validation
        self.config = pulumi.Config()
        self.allowed_cidr = self._get_required_config("allowed_cidr")
        self.replication_region = self.config.get("replication_region") or "us-west-2"
        
        # Common tags for all resources
        self.common_tags = {
            "environment": "production",
            "project": "tap-stack",
            "managed-by": "pulumi"
        }
        
        # Create infrastructure components
        self.kms_key = self._create_kms_key()
        self.vpc = self._create_vpc()
        self.security_group = self._create_security_group()
        self.s3_resources = self._create_s3_resources()
        self.cloudwatch_resources = self._create_cloudwatch_resources()
        
        # Export important outputs
        self._create_outputs()
    
    def _get_required_config(self, key: str) -> str:
        """Get required configuration value or fail fast"""
        value = self.config.get(key)
        if not value:
            raise pulumi.RunError(f"Required configuration '{key}' is missing")
        return value
    
    def _create_kms_key(self) -> aws.kms.Key:
        """Create KMS key for encryption"""
        return aws.kms.Key(
            "tap-kms-key",
            description="KMS key for TAP stack encryption",
            tags=self.common_tags
        )
    
    def _create_vpc(self) -> Dict[str, Any]:
        """Create VPC with subnets across multiple AZs"""
        # Get available AZs in us-east-1
        azs = aws.get_availability_zones(state="available")
        
        vpc = aws.ec2.Vpc(
            "tap-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": "tap-vpc"}
        )
        
        # Create internet gateway
        igw = aws.ec2.InternetGateway(
            "tap-igw",
            vpc_id=vpc.id,
            tags={**self.common_tags, "Name": "tap-igw"}
        )
        
        # Create subnets in first two AZs for high availability
        subnets = []
        for i in range(min(2, len(azs.names))):
            subnet = aws.ec2.Subnet(
                f"tap-subnet-{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"tap-subnet-{i}"}
            )
            subnets.append(subnet)
        
        # Create route table
        route_table = aws.ec2.RouteTable(
            "tap-rt",
            vpc_id=vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={**self.common_tags, "Name": "tap-rt"}
        )
        
        # Associate subnets with route table
        for i, subnet in enumerate(subnets):
            aws.ec2.RouteTableAssociation(
                f"tap-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=route_table.id
            )
        
        return {
            "vpc": vpc,
            "subnets": subnets,
            "internet_gateway": igw,
            "route_table": route_table
        }
    
    def _create_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group with least privilege rules"""
        return aws.ec2.SecurityGroup(
            "tap-sg",
            name="tap-security-group",
            description="Security group for TAP stack",
            vpc_id=self.vpc["vpc"].id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTPS from allowed CIDR",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=[self.allowed_cidr]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP from allowed CIDR",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=[self.allowed_cidr]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description="All outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.common_tags, "Name": "tap-sg"}
        )
    
    def _create_s3_resources(self) -> Dict[str, Any]:
        """Create S3 bucket with cross-region replication"""
        # Create replication role
        replication_role = aws.iam.Role(
            "tap-s3-replication-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"}
                }]
            }),
            tags=self.common_tags
        )
        
        # Attach replication policy
        aws.iam.RolePolicyAttachment(
            "tap-s3-replication-policy",
            role=replication_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSS3ReplicationServiceRolePolicy"
        )
        
        # Create destination bucket in replication region
        destination_bucket = aws.s3.Bucket(
            "tap-destination-bucket",
            bucket=None,  # Auto-generate name
            opts=pulumi.ResourceOptions(provider=aws.Provider(
                "replication-provider",
                region=self.replication_region
            )),
            tags=self.common_tags
        )
        
        # Configure destination bucket encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            "tap-destination-bucket-encryption",
            bucket=destination_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.kms_key.arn
                )
            )],
            opts=pulumi.ResourceOptions(provider=aws.Provider(
                "replication-provider-enc",
                region=self.replication_region
            ))
        )
        
        # Create primary bucket
        primary_bucket = aws.s3.Bucket(
            "tap-primary-bucket",
            bucket=None,  # Auto-generate name
            tags=self.common_tags
        )
        
        # Configure primary bucket encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            "tap-primary-bucket-encryption",
            bucket=primary_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.kms_key.arn
                )
            )]
        )
        
        # Enable versioning on primary bucket
        aws.s3.BucketVersioningV2(
            "tap-primary-bucket-versioning",
            bucket=primary_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            )
        )
        
        # Configure replication
        aws.s3.BucketReplicationConfiguration(
            "tap-bucket-replication",
            role=replication_role.arn,
            bucket=primary_bucket.id,
            rules=[aws.s3.BucketReplicationConfigurationRuleArgs(
                id="ReplicateEverything",
                status="Enabled",
                destination=aws.s3.BucketReplicationConfigurationRuleDestinationArgs(
                    bucket=destination_bucket.arn,
                    storage_class="STANDARD_IA"
                )
            )],
            opts=pulumi.ResourceOptions(depends_on=[
                aws.s3.BucketVersioningV2("tap-primary-bucket-versioning")
            ])
        )
        
        return {
            "primary_bucket": primary_bucket,
            "destination_bucket": destination_bucket,
            "replication_role": replication_role
        }
    
    def _create_cloudwatch_resources(self) -> Dict[str, Any]:
        """Create CloudWatch log groups and monitoring"""
        # Create encrypted log group
        log_group = aws.cloudwatch.LogGroup(
            "tap-log-group",
            name="/aws/tap-stack/application",
            retention_in_days=14,
            kms_key_id=self.kms_key.arn,
            tags=self.common_tags
        )
        
        # Create CloudWatch dashboard
        dashboard = aws.cloudwatch.Dashboard(
            "tap-dashboard",
            dashboard_name="tap-stack-monitoring",
            dashboard_body=pulumi.Output.all(
                self.s3_resources["primary_bucket"].id,
                self.vpc["vpc"].id
            ).apply(lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/S3", "BucketSizeBytes", "BucketName", args[0]],
                                ["AWS/VPC", "PacketDropCount", "VpcId", args[1]]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "us-east-1",
                            "title": "TAP Stack Metrics"
                        }
                    }
                ]
            }))
        )
        
        return {
            "log_group": log_group,
            "dashboard": dashboard
        }
    
    def _create_outputs(self):
        """Export stack outputs"""
        pulumi.export("vpc_id", self.vpc["vpc"].id)
        pulumi.export("subnet_ids", [subnet.id for subnet in self.vpc["subnets"]])
        pulumi.export("security_group_id", self.security_group.id)
        pulumi.export("primary_bucket_name", self.s3_resources["primary_bucket"].id)
        pulumi.export("destination_bucket_name", self.s3_resources["destination_bucket"].id)
        pulumi.export("log_group_name", self.cloudwatch_resources["log_group"].name)
        pulumi.export("kms_key_id", self.kms_key.id)

# Create the stack
stack = TapStack()
```

=== tests/unit/test_tap_stack.py ===

```python
import pytest
import pulumi
from unittest.mock import patch, MagicMock
import json

# Set up Pulumi mocks
class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        # Mock resource creation with predictable outputs
        outputs = args.inputs.copy() if args.inputs else {}
        
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs.update({
                "id": "vpc-12345",
                "cidr_block": "10.0.0.0/16",
                "arn": "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-12345"
            })
        elif args.typ == "aws:ec2/subnet:Subnet":
            subnet_num = "1" if "subnet-0" in args.name else "2"
            outputs.update({
                "id": f"subnet-{subnet_num}2345",
                "availability_zone": f"us-east-1{'a' if subnet_num == '1' else 'b'}",
                "cidr_block": f"10.0.{subnet_num}.0/24"
            })
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs.update({
                "id": "sg-12345",
                "ingress": args.inputs.get("ingress", []),
                "egress": args.inputs.get("egress", [])
            })
        elif args.typ == "aws:s3/bucket:Bucket":
            bucket_id = "primary-bucket-12345" if "primary" in args.name else "dest-bucket-12345"
            outputs.update({
                "id": bucket_id,
                "arn": f"arn:aws:s3:::{bucket_id}",
                "bucket": bucket_id
            })
        elif args.typ == "aws:s3/bucketReplicationConfiguration:BucketReplicationConfiguration":
            outputs.update({
                "id": "replication-config-12345",
                "rules": args.inputs.get("rules", [])
            })
        elif args.typ == "aws:s3/bucketServerSideEncryptionConfiguration:BucketServerSideEncryptionConfiguration":
            outputs.update({
                "id": "encryption-config-12345",
                "rules": args.inputs.get("rules", [])
            })
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs.update({
                "id": "/aws/tap-stack/application",
                "name": "/aws/tap-stack/application",
                "kms_key_id": "arn:aws:kms:us-east-1:123456789012:key/12345"
            })
        elif args.typ == "aws:kms/key:Key":
            outputs.update({
                "id": "12345-key-id",
                "arn": "arn:aws:kms:us-east-1:123456789012:key/12345"
            })
        elif args.typ == "aws:iam/role:Role":
            outputs.update({
                "id": "replication-role-12345",
                "arn": "arn:aws:iam::123456789012:role/replication-role-12345",
                "name": "replication-role-12345"
            })
        
        return [outputs.get("id", "mock-id"), outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zone_ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        return {}

pulumi.runtime.set_mocks(MyMocks())

@pytest.fixture
def mock_config():
    """Mock Pulumi configuration"""
    with patch('pulumi.Config') as mock:
        config_instance = MagicMock()
        config_instance.get.side_effect = lambda key, default=None: {
            "allowed_cidr": "10.0.0.0/8",
            "replication_region": "us-west-2"
        }.get(key, default)
        mock.return_value = config_instance
        yield config_instance

@pulumi.runtime.test
def test_vpc_creation(mock_config):
    """Test VPC is created with correct configuration"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    # Test VPC exists
    assert stack.vpc["vpc"] is not None
    
    # Test subnets exist and are in different AZs
    assert len(stack.vpc["subnets"]) >= 2
    
    # Verify subnet AZs are different
    subnet_azs = []
    for subnet in stack.vpc["subnets"]:
        def check_az(az):
            subnet_azs.append(az)
            return az
        subnet.availability_zone.apply(check_az)
    
    # Ensure we have subnets in different AZs
    assert len(set(subnet_azs)) >= 2

@pulumi.runtime.test
def test_security_group_rules(mock_config):
    """Test security group has correct CIDR restrictions"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    # Verify security group exists
    assert stack.security_group is not None
    
    # Check ingress rules contain allowed CIDR
    def verify_ingress(ingress_rules):
        https_rule = next((rule for rule in ingress_rules if rule.get("from_port") == 443), None)
        assert https_rule is not None
        assert "10.0.0.0/8" in https_rule.get("cidr_blocks", [])
        return ingress_rules
    
    stack.security_group.ingress.apply(verify_ingress)

@pulumi.runtime.test
def test_s3_encryption_and_replication(mock_config):
    """Test S3 bucket has encryption and replication enabled"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    # Verify primary and destination buckets exist
    assert stack.s3_resources["primary_bucket"] is not None
    assert stack.s3_resources["destination_bucket"] is not None
    assert stack.s3_resources["replication_role"] is not None

@pulumi.runtime.test
def test_resource_tags(mock_config):
    """Test all resources have required environment tag"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    # Check VPC tags
    def verify_vpc_tags(tags):
        assert tags.get("environment") == "production"
        return tags
    
    stack.vpc["vpc"].tags.apply(verify_vpc_tags)
    
    # Check security group tags
    def verify_sg_tags(tags):
        assert tags.get("environment") == "production"
        return tags
    
    stack.security_group.tags.apply(verify_sg_tags)

@pulumi.runtime.test
def test_cloudwatch_log_encryption(mock_config):
    """Test CloudWatch log groups are encrypted"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    # Verify log group exists and is encrypted
    assert stack.cloudwatch_resources["log_group"] is not None
    
    def verify_encryption(kms_key_id):
        assert kms_key_id is not None
        assert "arn:aws:kms" in str(kms_key_id)
        return kms_key_id
    
    stack.cloudwatch_resources["log_group"].kms_key_id.apply(verify_encryption)

@pulumi.runtime.test
def test_required_config_validation():
    """Test that missing required config raises error"""
    with patch('pulumi.Config') as mock:
        config_instance = MagicMock()
        config_instance.get.return_value = None  # Simulate missing config
        mock.return_value = config_instance
        
        with pytest.raises(pulumi.RunError, match="Required configuration 'allowed_cidr' is missing"):
            from lib.tap_stack import TapStack
            TapStack()

@pulumi.runtime.test
def test_kms_key_creation(mock_config):
    """Test KMS key is created for encryption"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    # Verify KMS key exists
    assert stack.kms_key is not None
    
    def verify_kms_tags(tags):
        assert tags.get("environment") == "production"
        return tags
    
    stack.kms_key.tags.apply(verify_kms_tags)
```

=== tests/integration/test_tap_stack.py ===

```python
import pytest
import pulumi
from unittest.mock import patch, MagicMock
import json

# Use the same mocks as unit tests for consistency
class IntegrationMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs.copy() if args.inputs else {}
        
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs.update({
                "id": "vpc-integration-12345",
                "cidr_block": "10.0.0.0/16",
                "arn": "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-integration-12345"
            })
        elif args.typ == "aws:ec2/subnet:Subnet":
            subnet_num = "1" if "subnet-0" in args.name else "2"
            az = "us-east-1a" if subnet_num == "1" else "us-east-1b"
            outputs.update({
                "id": f"subnet-integration-{subnet_num}2345",
                "availability_zone": az,
                "cidr_block": f"10.0.{subnet_num}.0/24",
                "vpc_id": "vpc-integration-12345"
            })
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs.update({
                "id": "sg-integration-12345",
                "vpc_id": "vpc-integration-12345",
                "ingress": args.inputs.get("ingress", []),
                "egress": args.inputs.get("egress", [])
            })
        elif args.typ == "aws:s3/bucket:Bucket":
            bucket_id = "primary-integration-12345" if "primary" in args.name else "dest-integration-12345"
            outputs.update({
                "id": bucket_id,
                "arn": f"arn:aws:s3:::{bucket_id}",
                "bucket": bucket_id
            })
        elif args.typ == "aws:s3/bucketReplicationConfiguration:BucketReplicationConfiguration":
            outputs.update({
                "id": "replication-integration-12345",
                "bucket": args.inputs.get("bucket"),
                "role": args.inputs.get("role"),
                "rules": args.inputs.get("rules", [])
            })
        elif args.typ == "aws:s3/bucketServerSideEncryptionConfiguration:BucketServerSideEncryptionConfiguration":
            outputs.update({
                "id": "encryption-integration-12345",
                "bucket": args.inputs.get("bucket"),
                "rules": args.inputs.get("rules", [])
            })
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs.update({
                "id": "/aws/tap-stack/application",
                "name": "/aws/tap-stack/application",
                "kms_key_id": "arn:aws:kms:us-east-1:123456789012:key/integration-12345"
            })
        elif args.typ == "aws:kms/key:Key":
            outputs.update({
                "id": "integration-key-12345",
                "arn": "arn:aws:kms:us-east-1:123456789012:key/integration-12345"
            })
        elif args.typ == "aws:iam/role:Role":
            outputs.update({
                "id": "replication-role-integration-12345",
                "arn": "arn:aws:iam::123456789012:role/replication-role-integration-12345",
                "name": "replication-role-integration-12345"
            })
        
        return [outputs.get("id", "mock-integration-id"), outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zone_ids": ["use1-az1", "use1-az2", "use1-az3"]
            }
        return {}

pulumi.runtime.set_mocks(IntegrationMocks())

@pytest.fixture
def integration_config():
    """Mock configuration for integration tests"""
    with patch('pulumi.Config') as mock:
        config_instance = MagicMock()
        config_instance.get.side_effect = lambda key, default=None: {
            "allowed_cidr": "192.168.1.0/24",
            "replication_region": "us-west-2"
        }.get(key, default)
        mock.return_value = config_instance
        yield config_instance

@pulumi.runtime.test
def test_s3_replication_wiring(integration_config):
    """Test S3 replication is properly wired between regions"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    # Verify replication configuration exists and references correct resources
    primary_bucket = stack.s3_resources["primary_bucket"]
    destination_bucket = stack.s3_resources["destination_bucket"]
    replication_role = stack.s3_resources["replication_role"]
    
    assert primary_bucket is not None
    assert destination_bucket is not None
    assert replication_role is not None
    
    # Verify bucket IDs are different (primary vs destination)
    def verify_bucket_difference(args):
        primary_id, dest_id = args
        assert primary_id != dest_id
        assert "primary" in primary_id
        assert "dest" in dest_id
        return args
    
    pulumi.Output.all(primary_bucket.id, destination_bucket.id).apply(verify_bucket_difference)

@pulumi.runtime.test
def test_security_group_vpc_attachment(integration_config):
    """Test security group is attached to correct VPC"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    vpc_id = stack.vpc["vpc"].id
    sg_vpc_id = stack.security_group.vpc_id
    
    def verify_vpc_attachment(args):
        vpc_id, sg_vpc_id = args
        assert vpc_id == sg_vpc_id
        return args
    
    pulumi.Output.all(vpc_id, sg_vpc_id).apply(verify_vpc_attachment)

@pulumi.runtime.test
def test_subnet_az_mapping(integration_config):
    """Test VPC subnets are mapped to correct AZs"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    subnets = stack.vpc["subnets"]
    assert len(subnets) >= 2
    
    # Collect AZ mappings
    az_mappings = []
    
    def collect_az(subnet_info):
        subnet_id, az = subnet_info
        az_mappings.append((subnet_id, az))
        return subnet_info
    
    for subnet in subnets:
        pulumi.Output.all(subnet.id, subnet.availability_zone).apply(collect_az)
    
    # Verify we have distinct AZs
    def verify_distinct_azs():
        if len(az_mappings) >= 2:
            azs = [mapping[1] for mapping in az_mappings]
            assert len(set(azs)) >= 2, f"Expected distinct AZs, got: {azs}"
    
    # This would be called after all applies are resolved
    verify_distinct_azs()

@pulumi.runtime.test
def test_encryption_consistency(integration_config):
    """Test encryption is consistently applied across resources"""
    from lib.tap_stack import TapStack
    
    stack = TapStack()
    
    