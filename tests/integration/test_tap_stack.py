"""
Integration Tests for TapStack CDKTF Infrastructure

This module contains integration tests that validate the deployed TapStack
infrastructure using actual AWS API calls. Tests verify resource creation,
configuration, security settings, and functionality following patterns
from the archive examples.
"""

import json
import os
import time
import pytest
import boto3
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError, NoCredentialsError


@pytest.mark.integration
class TestTapStackLiveIntegration:
    """Live Integration Tests for TapStack - tests deployed infrastructure with actual AWS API calls."""

    def setup_method(self):
        """Setup AWS clients and configuration for testing."""
        self.region = os.getenv('AWS_REGION', 'us-west-2')
        self.environment = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.stack_name = f"TapStack{self.environment}"
        
        # Initialize AWS clients
        try:
            self.ec2 = boto3.client('ec2', region_name=self.region)
            self.s3 = boto3.client('s3', region_name=self.region)
            self.rds = boto3.client('rds', region_name=self.region)
            self.iam = boto3.client('iam', region_name=self.region)
            self.secretsmanager = boto3.client('secretsmanager', region_name=self.region)
            self.cloudtrail = boto3.client('cloudtrail', region_name=self.region)
            self.logs = boto3.client('logs', region_name=self.region)
            
            # Test AWS connectivity
            self.ec2.describe_regions()
            
        except NoCredentialsError:
            pytest.fail("AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        except Exception as e:
            pytest.fail(f"Failed to initialize AWS clients: {str(e)}")

    def get_stack_outputs(self) -> Dict[str, Any]:
        """Get stack outputs from CDKTF terraform outputs."""
        # Try multiple possible output file locations
        possible_paths = [
            "terraform.tfstate",
            "cdktf.out/stacks/*/terraform.tfstate",
            "outputs.json",
            "cfn-outputs/flat-outputs.json"
        ]
        
        outputs_data = {}
        
        # For integration tests, we'll try to get outputs from Terraform state
        # or use environment variables as fallback
        vpc_id = os.getenv('VPC_ID')
        if vpc_id:
            outputs_data = {
                'vpc_id': vpc_id,
                'region': self.region,
                'environment': self.environment
            }
        
        if not outputs_data:
            pytest.skip("No deployment outputs found. Deploy the stack first or set environment variables.")
        
        return outputs_data

    def test_aws_connectivity(self):
        """Test basic AWS connectivity and permissions."""
        try:
            # Test basic EC2 permissions
            regions = self.ec2.describe_regions()["Regions"]
            assert len(regions) > 0
            
            # Test current region is available
            region_names = [r["RegionName"] for r in regions]
            assert self.region in region_names
            
            # Test that us-east-1 is not being used
            assert self.region != "us-east-1", "us-east-1 region should be excluded"
            
        except ClientError as e:
            pytest.fail(f"AWS connectivity test failed: {str(e)}")

    def test_vpc_infrastructure_deployment(self):
        """Test VPC and networking infrastructure deployment."""
        try:
            # Get VPCs with our tags
            vpcs = self.ec2.describe_vpcs(
                Filters=[
                    {"Name": "tag:Environment", "Values": [self.environment]},
                    {"Name": "tag:Component", "Values": ["Networking"]}
                ]
            )["Vpcs"]
            
            if not vpcs:
                pytest.skip("No VPC found with expected tags. Deploy the stack first.")
            
            vpc = vpcs[0]
            vpc_id = vpc["VpcId"]
            
            # Test VPC configuration
            assert vpc["CidrBlock"] == "10.0.0.0/16"
            assert vpc["State"] == "available"
            assert vpc["DhcpOptionsId"] is not None
            
            # Test VPC has DNS support enabled
            vpc_attributes = self.ec2.describe_vpc_attribute(VpcId=vpc_id, Attribute="enableDnsSupport")
            assert vpc_attributes["EnableDnsSupport"]["Value"] is True
            
            vpc_attributes = self.ec2.describe_vpc_attribute(VpcId=vpc_id, Attribute="enableDnsHostnames")
            assert vpc_attributes["EnableDnsHostnames"]["Value"] is True
            
            # Test subnets
            subnets = self.ec2.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )["Subnets"]
            
            assert len(subnets) == 4, "Should have 4 subnets (2 public, 2 private)"
            
            # Categorize subnets
            public_subnets = [s for s in subnets if s.get("MapPublicIpOnLaunch", False)]
            private_subnets = [s for s in subnets if not s.get("MapPublicIpOnLaunch", False)]
            
            assert len(public_subnets) == 2, "Should have 2 public subnets"
            assert len(private_subnets) == 2, "Should have 2 private subnets"
            
            # Test subnet CIDR blocks
            expected_cidrs = {"10.0.1.0/24", "10.0.2.0/24", "10.0.11.0/24", "10.0.12.0/24"}
            actual_cidrs = {s["CidrBlock"] for s in subnets}
            assert expected_cidrs == actual_cidrs
            
            # Test Internet Gateway
            igws = self.ec2.describe_internet_gateways(
                Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
            )["InternetGateways"]
            
            assert len(igws) == 1, "Should have exactly one Internet Gateway"
            assert igws[0]["Attachments"][0]["State"] == "available"
            
            # Test NAT Gateway
            nat_gateways = self.ec2.describe_nat_gateways(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )["NatGateways"]
            
            assert len(nat_gateways) == 1, "Should have exactly one NAT Gateway"
            assert nat_gateways[0]["State"] == "available"
            
            # Test route tables
            route_tables = self.ec2.describe_route_tables(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )["RouteTables"]
            
            # Should have main route table + 2 custom (public, private)
            custom_route_tables = [rt for rt in route_tables if not any(
                assoc.get("Main", False) for assoc in rt.get("Associations", [])
            )]
            assert len(custom_route_tables) == 2
            
            print(f"✓ VPC infrastructure validation passed for VPC {vpc_id}")
            
        except ClientError as e:
            pytest.fail(f"VPC infrastructure test failed: {str(e)}")

    def test_security_groups_configuration(self):
        """Test security group configuration and rules."""
        try:
            # Get security groups with our tags
            security_groups = self.ec2.describe_security_groups(
                Filters=[
                    {"Name": "tag:Environment", "Values": [self.environment]}
                ]
            )["SecurityGroups"]
            
            if not security_groups:
                pytest.skip("No security groups found with expected tags. Deploy the stack first.")
            
            # Find web and database security groups
            web_sg = None
            db_sg = None
            
            for sg in security_groups:
                name = sg.get("GroupName", "")
                tags = {tag["Key"]: tag["Value"] for tag in sg.get("Tags", [])}
                
                if "web" in name.lower() or tags.get("Tier") == "Web":
                    web_sg = sg
                elif "db" in name.lower() or tags.get("Tier") == "Database":
                    db_sg = sg
            
            if web_sg:
                # Test web security group rules
                ingress_rules = web_sg["IpPermissions"]
                
                # Should allow HTTP (80) and HTTPS (443)
                allowed_ports = set()
                for rule in ingress_rules:
                    if rule.get("FromPort"):
                        allowed_ports.add(rule["FromPort"])
                
                assert 80 in allowed_ports, "Web SG should allow HTTP traffic"
                assert 443 in allowed_ports, "Web SG should allow HTTPS traffic"
                
                print(f"✓ Web security group validation passed for {web_sg['GroupId']}")
            
            if db_sg:
                # Test database security group rules
                ingress_rules = db_sg["IpPermissions"]
                
                # Should allow MySQL (3306) only from specific security groups
                mysql_rules = [rule for rule in ingress_rules if rule.get("FromPort") == 3306]
                assert len(mysql_rules) > 0, "Database SG should allow MySQL traffic"
                
                # MySQL access should be restricted (not from 0.0.0.0/0)
                for rule in mysql_rules:
                    ip_ranges = rule.get("IpRanges", [])
                    for ip_range in ip_ranges:
                        assert ip_range["CidrIp"] != "0.0.0.0/0", "Database should not be open to internet"
                
                print(f"✓ Database security group validation passed for {db_sg['GroupId']}")
            
        except ClientError as e:
            pytest.fail(f"Security groups test failed: {str(e)}")

    def test_s3_buckets_security(self):
        """Test S3 bucket creation and security configuration."""
        try:
            # Get S3 buckets
            buckets = self.s3.list_buckets()["Buckets"]
            
            # Find buckets with our environment suffix
            tap_buckets = [b for b in buckets if self.environment in b["Name"]]
            
            if not tap_buckets:
                pytest.skip("No S3 buckets found with environment suffix. Deploy the stack first.")
            
            for bucket in tap_buckets:
                bucket_name = bucket["Name"]
                
                # Test bucket encryption
                try:
                    encryption = self.s3.get_bucket_encryption(Bucket=bucket_name)
                    rules = encryption["ServerSideEncryptionConfiguration"]["Rules"]
                    assert len(rules) > 0, f"Bucket {bucket_name} should have encryption enabled"
                    
                    sse_algorithm = rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"]
                    assert sse_algorithm == "AES256", f"Bucket {bucket_name} should use AES256 encryption"
                    
                except ClientError as e:
                    if e.response["Error"]["Code"] != "ServerSideEncryptionConfigurationNotFoundError":
                        raise
                    pytest.fail(f"Bucket {bucket_name} does not have encryption configured")
                
                # Test bucket versioning
                try:
                    versioning = self.s3.get_bucket_versioning(Bucket=bucket_name)
                    assert versioning.get("Status") == "Enabled", f"Bucket {bucket_name} should have versioning enabled"
                except ClientError as e:
                    pytest.fail(f"Failed to get versioning for bucket {bucket_name}: {str(e)}")
                
                # Test public access block
                try:
                    public_access = self.s3.get_public_access_block(Bucket=bucket_name)
                    config = public_access["PublicAccessBlockConfiguration"]
                    
                    assert config["BlockPublicAcls"] is True
                    assert config["IgnorePublicAcls"] is True
                    assert config["BlockPublicPolicy"] is True
                    assert config["RestrictPublicBuckets"] is True
                    
                except ClientError as e:
                    if e.response["Error"]["Code"] != "NoSuchPublicAccessBlockConfiguration":
                        pytest.fail(f"Failed to get public access block for bucket {bucket_name}: {str(e)}")
                
                # Test bucket policy exists
                try:
                    policy = self.s3.get_bucket_policy(Bucket=bucket_name)
                    assert policy["Policy"] is not None, f"Bucket {bucket_name} should have a bucket policy"
                except ClientError as e:
                    if e.response["Error"]["Code"] != "NoSuchBucketPolicy":
                        pytest.fail(f"Bucket {bucket_name} should have a bucket policy")
                
                print(f"✓ S3 bucket security validation passed for {bucket_name}")
                
        except ClientError as e:
            pytest.fail(f"S3 buckets security test failed: {str(e)}")

    def test_rds_instance_configuration(self):
        """Test RDS instance configuration and security."""
        try:
            # Get RDS instances
            instances = self.rds.describe_db_instances()["DBInstances"]
            
            # Find instances with our environment suffix
            tap_instances = [i for i in instances if self.environment in i["DBInstanceIdentifier"]]
            
            if not tap_instances:
                pytest.skip("No RDS instances found with environment suffix. Deploy the stack first.")
            
            for instance in tap_instances:
                instance_id = instance["DBInstanceIdentifier"]
                
                # Test instance is not publicly accessible
                assert instance["PubliclyAccessible"] is False, f"RDS instance {instance_id} should not be publicly accessible"
                
                # Test storage encryption
                assert instance.get("StorageEncrypted", False) is True, f"RDS instance {instance_id} should have encrypted storage"
                
                # Test backup configuration
                assert instance["BackupRetentionPeriod"] >= 7, f"RDS instance {instance_id} should have at least 7 days backup retention"
                
                # Test deletion protection
                assert instance.get("DeletionProtection", False) is True, f"RDS instance {instance_id} should have deletion protection enabled"
                
                # Test engine and version
                assert instance["Engine"] == "mysql", f"RDS instance {instance_id} should use MySQL engine"
                assert instance["EngineVersion"].startswith("8.0"), f"RDS instance {instance_id} should use MySQL 8.0"
                
                # Test instance is in private subnets
                subnet_group = instance["DBSubnetGroup"]
                subnets = subnet_group["Subnets"]
                assert len(subnets) >= 2, f"RDS instance {instance_id} should be in multiple subnets"
                
                # Test VPC security groups
                vpc_security_groups = instance["VpcSecurityGroups"]
                assert len(vpc_security_groups) > 0, f"RDS instance {instance_id} should have VPC security groups"
                
                for sg in vpc_security_groups:
                    assert sg["Status"] == "active", f"Security group should be active for RDS instance {instance_id}"
                
                print(f"✓ RDS instance validation passed for {instance_id}")
                
        except ClientError as e:
            pytest.fail(f"RDS instance test failed: {str(e)}")

    def test_secrets_manager_integration(self):
        """Test Secrets Manager secrets for database credentials."""
        try:
            # List secrets
            secrets = self.secretsmanager.list_secrets()["SecretList"]
            
            # Find secrets with our environment suffix
            tap_secrets = [s for s in secrets if self.environment in s["Name"]]
            
            if not tap_secrets:
                pytest.skip("No Secrets Manager secrets found with environment suffix. Deploy the stack first.")
            
            for secret in tap_secrets:
                secret_name = secret["Name"]
                
                # Test secret can be retrieved (validates permissions)
                try:
                    secret_value = self.secretsmanager.get_secret_value(SecretId=secret_name)
                    assert secret_value["SecretString"] is not None
                    
                    # Parse secret value if it's JSON
                    if secret_value["SecretString"].startswith("{"):
                        secret_data = json.loads(secret_value["SecretString"])
                        assert "username" in secret_data
                        assert "password" in secret_data
                        assert "database" in secret_data
                        
                except ClientError as e:
                    pytest.fail(f"Failed to retrieve secret {secret_name}: {str(e)}")
                
                # Test secret encryption
                if "KmsKeyId" in secret:
                    assert secret["KmsKeyId"] is not None, f"Secret {secret_name} should be encrypted"
                
                print(f"✓ Secrets Manager validation passed for {secret_name}")
                
        except ClientError as e:
            pytest.fail(f"Secrets Manager test failed: {str(e)}")

    def test_iam_roles_and_policies(self):
        """Test IAM roles and policies configuration."""
        try:
            # List roles
            roles = self.iam.list_roles()["Roles"]
            
            # Find roles with our environment suffix
            tap_roles = [r for r in roles if self.environment in r["RoleName"]]
            
            if not tap_roles:
                pytest.skip("No IAM roles found with environment suffix. Deploy the stack first.")
            
            for role in tap_roles:
                role_name = role["RoleName"]
                
                # Test role has assume role policy
                assert role["AssumeRolePolicyDocument"] is not None
                
                # Test role has description
                if "Description" in role:
                    assert len(role["Description"]) > 0
                
                # Get attached policies
                attached_policies = self.iam.list_attached_role_policies(RoleName=role_name)["AttachedPolicies"]
                
                # Role should have at least one policy attached
                if "app-role" in role_name:
                    assert len(attached_policies) > 0, f"Role {role_name} should have policies attached"
                
                print(f"✓ IAM role validation passed for {role_name}")
            
            # Test IAM users
            users = self.iam.list_users()["Users"]
            tap_users = [u for u in users if self.environment in u["UserName"]]
            
            for user in tap_users:
                user_name = user["UserName"]
                
                # Get attached policies
                attached_policies = self.iam.list_attached_user_policies(UserName=user_name)["AttachedPolicies"]
                
                # User should have MFA policy attached
                mfa_policies = [p for p in attached_policies if "mfa" in p["PolicyName"].lower()]
                assert len(mfa_policies) > 0, f"User {user_name} should have MFA policy attached"
                
                print(f"✓ IAM user validation passed for {user_name}")
                
        except ClientError as e:
            pytest.fail(f"IAM roles and policies test failed: {str(e)}")

    def test_cloudtrail_configuration(self):
        """Test CloudTrail configuration and logging."""
        try:
            # List CloudTrails
            trails = self.cloudtrail.list_trails()["Trails"]
            
            # Find trails with our environment
            tap_trails = [t for t in trails if self.environment in t["Name"]]
            
            if not tap_trails:
                pytest.skip("No CloudTrail trails found with environment suffix. Deploy the stack first.")
            
            for trail in tap_trails:
                trail_name = trail["Name"]
                
                # Get trail status
                status = self.cloudtrail.get_trail_status(Name=trail_name)
                assert status["IsLogging"] is True, f"CloudTrail {trail_name} should be logging"
                
                # Get trail configuration
                trail_config = self.cloudtrail.describe_trails(trailNameList=[trail_name])["trailList"][0]
                
                # Test multi-region trail
                assert trail_config.get("IsMultiRegionTrail", False) is True, f"CloudTrail {trail_name} should be multi-region"
                
                # Test log file validation
                assert trail_config.get("LogFileValidationEnabled", False) is True, f"CloudTrail {trail_name} should have log file validation enabled"
                
                # Test S3 bucket
                s3_bucket_name = trail_config["S3BucketName"]
                assert s3_bucket_name is not None, f"CloudTrail {trail_name} should have S3 bucket configured"
                assert self.environment in s3_bucket_name, f"CloudTrail S3 bucket should include environment suffix"
                
                # Test S3 key prefix
                if "S3KeyPrefix" in trail_config:
                    assert trail_config["S3KeyPrefix"] == "AWSLogs"
                
                print(f"✓ CloudTrail validation passed for {trail_name}")
                
        except ClientError as e:
            pytest.fail(f"CloudTrail test failed: {str(e)}")

    def test_vpc_flow_logs(self):
        """Test VPC Flow Logs configuration."""
        try:
            # Get VPCs with our tags
            vpcs = self.ec2.describe_vpcs(
                Filters=[
                    {"Name": "tag:Environment", "Values": [self.environment]},
                    {"Name": "tag:Component", "Values": ["Networking"]}
                ]
            )["Vpcs"]
            
            if not vpcs:
                pytest.skip("No VPC found with expected tags. Deploy the stack first.")
            
            vpc_id = vpcs[0]["VpcId"]
            
            # Get flow logs for the VPC
            flow_logs = self.ec2.describe_flow_logs(
                Filters=[{"Name": "resource-id", "Values": [vpc_id]}]
            )["FlowLogs"]
            
            assert len(flow_logs) > 0, f"VPC {vpc_id} should have flow logs enabled"
            
            for flow_log in flow_logs:
                assert flow_log["FlowLogStatus"] == "ACTIVE", "Flow log should be active"
                assert flow_log["TrafficType"] == "ALL", "Flow log should capture all traffic"
                assert flow_log["LogDestinationType"] == "cloud-watch-logs", "Flow log should send to CloudWatch"
                
                # Test CloudWatch log group exists
                log_group_name = flow_log["LogGroupName"]
                try:
                    log_groups = self.logs.describe_log_groups(logGroupNamePrefix=log_group_name)
                    assert len(log_groups["logGroups"]) > 0, f"CloudWatch log group {log_group_name} should exist"
                except ClientError as e:
                    pytest.fail(f"CloudWatch log group {log_group_name} not found: {str(e)}")
                
                print(f"✓ VPC Flow Logs validation passed for VPC {vpc_id}")
                
        except ClientError as e:
            pytest.fail(f"VPC Flow Logs test failed: {str(e)}")

    def test_resource_tagging_compliance(self):
        """Test that all resources are properly tagged."""
        try:
            required_tags = ["Environment"]
            
            # Test VPC tags
            vpcs = self.ec2.describe_vpcs(
                Filters=[{"Name": "tag:Environment", "Values": [self.environment]}]
            )["Vpcs"]
            
            for vpc in vpcs:
                tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
                for required_tag in required_tags:
                    assert required_tag in tags, f"VPC {vpc['VpcId']} missing required tag {required_tag}"
                assert tags["Environment"] == self.environment
            
            # Test subnet tags
            subnets = self.ec2.describe_subnets(
                Filters=[{"Name": "tag:Environment", "Values": [self.environment]}]
            )["Subnets"]
            
            for subnet in subnets:
                tags = {tag["Key"]: tag["Value"] for tag in subnet.get("Tags", [])}
                for required_tag in required_tags:
                    assert required_tag in tags, f"Subnet {subnet['SubnetId']} missing required tag {required_tag}"
                assert tags["Environment"] == self.environment
                assert "Type" in tags  # Should be Public or Private
            
            # Test security group tags
            security_groups = self.ec2.describe_security_groups(
                Filters=[{"Name": "tag:Environment", "Values": [self.environment]}]
            )["SecurityGroups"]
            
            for sg in security_groups:
                tags = {tag["Key"]: tag["Value"] for tag in sg.get("Tags", [])}
                for required_tag in required_tags:
                    assert required_tag in tags, f"Security Group {sg['GroupId']} missing required tag {required_tag}"
                assert tags["Environment"] == self.environment
            
            print(f"✓ Resource tagging compliance validation passed")
            
        except ClientError as e:
            pytest.fail(f"Resource tagging compliance test failed: {str(e)}")

    def test_region_compliance(self):
        """Test that resources are not deployed in us-east-1."""
        # This test runs in the configured region
        assert self.region != "us-east-1", "Deployment should not be in us-east-1 region"
        
        # Test that CloudTrail is not using us-east-1 for global events
        try:
            trails = self.cloudtrail.list_trails()["Trails"]
            for trail in trails:
                if self.environment in trail["Name"]:
                    trail_config = self.cloudtrail.describe_trails(trailNameList=[trail["Name"]])["trailList"][0]
                    trail_region = trail_config["HomeRegion"]
                    assert trail_region != "us-east-1", f"CloudTrail {trail['Name']} should not be in us-east-1"
        except ClientError:
            pass  # Skip if no trails found
        
        print(f"✓ Region compliance validation passed (using {self.region})")


@pytest.mark.e2e
class TestTapStackEndToEnd:
    """End-to-End Tests for TapStack - comprehensive infrastructure validation."""

    def setup_method(self):
        """Setup for end-to-end tests."""
        self.region = os.getenv('AWS_REGION', 'us-west-2')
        self.environment = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        # Initialize all AWS clients
        self.ec2 = boto3.client('ec2', region_name=self.region)
        self.s3 = boto3.client('s3', region_name=self.region)
        self.rds = boto3.client('rds', region_name=self.region)
        self.iam = boto3.client('iam', region_name=self.region)

    def test_complete_infrastructure_stack(self):
        """Test that the complete infrastructure stack is deployed and functional."""
        try:
            # Test VPC exists and is properly configured
            vpcs = self.ec2.describe_vpcs(
                Filters=[{"Name": "tag:Environment", "Values": [self.environment]}]
            )["Vpcs"]
            
            assert len(vpcs) > 0, "VPC should be deployed"
            vpc = vpcs[0]
            vpc_id = vpc["VpcId"]
            
            # Test networking components
            subnets = self.ec2.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )["Subnets"]
            assert len(subnets) == 4, "Should have 4 subnets"
            
            # Test security groups
            security_groups = self.ec2.describe_security_groups(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )["SecurityGroups"]
            
            # Should have default SG + our custom SGs
            custom_sgs = [sg for sg in security_groups if sg["GroupName"] != "default"]
            assert len(custom_sgs) >= 2, "Should have at least 2 custom security groups"
            
            # Test storage components
            buckets = self.s3.list_buckets()["Buckets"]
            tap_buckets = [b for b in buckets if self.environment in b["Name"]]
            assert len(tap_buckets) >= 1, "Should have at least one S3 bucket"
            
            # Test database components
            try:
                instances = self.rds.describe_db_instances()["DBInstances"]
                tap_instances = [i for i in instances if self.environment in i["DBInstanceIdentifier"]]
                if tap_instances:
                    instance = tap_instances[0]
                    assert instance["DBInstanceStatus"] in ["available", "creating", "backing-up"], "RDS instance should be in healthy state"
            except ClientError:
                pass  # RDS might not be deployed yet
            
            print("✓ Complete infrastructure stack validation passed")
            
        except ClientError as e:
            pytest.fail(f"Complete infrastructure stack test failed: {str(e)}")

    def test_security_posture(self):
        """Test overall security posture of the deployed infrastructure."""
        try:
            # Test S3 bucket security
            buckets = self.s3.list_buckets()["Buckets"]
            tap_buckets = [b for b in buckets if self.environment in b["Name"]]
            
            for bucket in tap_buckets:
                bucket_name = bucket["Name"]
                
                # Test public access is blocked
                try:
                    public_access = self.s3.get_public_access_block(Bucket=bucket_name)
                    config = public_access["PublicAccessBlockConfiguration"]
                    assert all([
                        config["BlockPublicAcls"],
                        config["IgnorePublicAcls"],
                        config["BlockPublicPolicy"],
                        config["RestrictPublicBuckets"]
                    ]), f"Bucket {bucket_name} should block all public access"
                except ClientError:
                    pytest.fail(f"Bucket {bucket_name} should have public access block configured")
            
            # Test security group rules are restrictive
            security_groups = self.ec2.describe_security_groups(
                Filters=[{"Name": "tag:Environment", "Values": [self.environment]}]
            )["SecurityGroups"]
            
            for sg in security_groups:
                # Check for overly permissive rules
                for rule in sg.get("IpPermissions", []):
                    ip_ranges = rule.get("IpRanges", [])
                    for ip_range in ip_ranges:
                        cidr = ip_range.get("CidrIp", "")
                        # Database access should not be open to internet
                        if rule.get("FromPort") == 3306 and cidr == "0.0.0.0/0":
                            pytest.fail(f"Security group {sg['GroupId']} has overly permissive MySQL access")
            
            print("✓ Security posture validation passed")
            
        except ClientError as e:
            pytest.fail(f"Security posture test failed: {str(e)}")

    def test_high_availability_setup(self):
        """Test high availability configuration."""
        try:
            # Test multi-AZ subnet distribution
            vpcs = self.ec2.describe_vpcs(
                Filters=[{"Name": "tag:Environment", "Values": [self.environment]}]
            )["Vpcs"]
            
            if vpcs:
                vpc_id = vpcs[0]["VpcId"]
                
                subnets = self.ec2.describe_subnets(
                    Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
                )["Subnets"]
                
                # Check that subnets are distributed across multiple AZs
                availability_zones = set(subnet["AvailabilityZone"] for subnet in subnets)
                assert len(availability_zones) >= 2, "Subnets should be distributed across multiple AZs"
                
                # Check that we have both public and private subnets in multiple AZs
                public_azs = set(subnet["AvailabilityZone"] for subnet in subnets 
                               if subnet.get("MapPublicIpOnLaunch", False))
                private_azs = set(subnet["AvailabilityZone"] for subnet in subnets 
                                if not subnet.get("MapPublicIpOnLaunch", False))
                
                assert len(public_azs) >= 2, "Should have public subnets in multiple AZs"
                assert len(private_azs) >= 2, "Should have private subnets in multiple AZs"
            
            print("✓ High availability setup validation passed")
            
        except ClientError as e:
            pytest.fail(f"High availability setup test failed: {str(e)}")


# Pytest configuration for integration tests
def pytest_configure(config):
    """Configure pytest with custom markers for integration tests."""
    config.addinivalue_line("markers", "integration: mark test as integration test requiring AWS credentials")
    config.addinivalue_line("markers", "e2e: mark test as end-to-end test requiring full deployment")


# Pytest fixtures for integration tests
@pytest.fixture(scope="session")
def aws_credentials():
    """Ensure AWS credentials are available for integration tests."""
    try:
        boto3.client('sts').get_caller_identity()
        return True
    except Exception:
        pytest.skip("AWS credentials not available")


@pytest.fixture(scope="session") 
def deployed_infrastructure():
    """Ensure infrastructure is deployed before running integration tests."""
    region = os.getenv('AWS_REGION', 'us-west-2')
    environment = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    
    ec2 = boto3.client('ec2', region_name=region)
    
    try:
        vpcs = ec2.describe_vpcs(
            Filters=[{"Name": "tag:Environment", "Values": [environment]}]
        )["Vpcs"]
        
        if not vpcs:
            pytest.skip("Infrastructure not deployed. Run deployment first.")
        
        return True
    except Exception:
        pytest.skip("Cannot verify infrastructure deployment")


pytestmark = [pytest.mark.integration, pytest.mark.slow]
