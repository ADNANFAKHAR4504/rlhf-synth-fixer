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
            --data '{"text":"✅ Infrastructure deployed successfully"}' \
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
            --data '{"text":"❌ Deployment failed, rolled back to previous state"}' \
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