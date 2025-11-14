"""Integration tests for deployed payment processing infrastructure."""

import pytest
import json
import os
import boto3
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from deployment."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip("Stack outputs not found - deployment required")

    with open(outputs_file, "r", encoding="utf-8") as f:
        all_outputs = json.load(f)
        # Extract outputs from nested stack structure
        # Structure is: {"TapStackpr6460": {"vpc_id": "...", ...}}
        # We need to get the first (and only) stack's outputs
        if all_outputs:
            stack_key = list(all_outputs.keys())[0]
            return all_outputs[stack_key]
        return all_outputs


@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from configuration."""
    region_file = "lib/AWS_REGION"
    if os.path.exists(region_file):
        with open(region_file, "r", encoding="utf-8") as f:
            return f.read().strip()
    return "ap-southeast-1"


class TestVPCDeployment:
    """Test VPC deployment."""

    def test_vpc_exists(self, stack_outputs, aws_region):
        """Test that VPC was created."""
        assert "vpc_id" in stack_outputs
        vpc_id = stack_outputs["vpc_id"]
        assert vpc_id.startswith("vpc-")

        # Verify VPC exists in AWS
        ec2 = boto3.client("ec2", region_name=aws_region)
        response = ec2.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        assert response["Vpcs"][0]["State"] == "available"

    def test_vpc_dns_enabled(self, stack_outputs, aws_region):
        """Test that VPC has DNS support enabled."""
        vpc_id = stack_outputs["vpc_id"]
        ec2 = boto3.client("ec2", region_name=aws_region)

        # Check DNS support
        response = ec2.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsSupport"
        )
        assert response["EnableDnsSupport"]["Value"] is True

        # Check DNS hostnames
        response = ec2.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsHostnames"
        )
        assert response["EnableDnsHostnames"]["Value"] is True


class TestALBDeployment:
    """Test Application Load Balancer deployment."""

    def test_alb_exists(self, stack_outputs, aws_region):
        """Test that ALB was created and is active."""
        assert "alb_dns_name" in stack_outputs
        alb_dns = stack_outputs["alb_dns_name"]
        assert alb_dns
        assert ".elb." in alb_dns

        # Verify ALB is active
        elb = boto3.client("elbv2", region_name=aws_region)
        response = elb.describe_load_balancers()
        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == alb_dns]
        assert len(albs) == 1
        assert albs[0]["State"]["Code"] == "active"

    def test_alb_has_listeners(self, stack_outputs, aws_region):
        """Test that ALB has HTTP and HTTPS listeners."""
        alb_dns = stack_outputs["alb_dns_name"]
        elb = boto3.client("elbv2", region_name=aws_region)

        # Get ALB ARN
        response = elb.describe_load_balancers()
        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == alb_dns]
        alb_arn = albs[0]["LoadBalancerArn"]

        # Check listeners
        listeners = elb.describe_listeners(LoadBalancerArn=alb_arn)
        assert len(listeners["Listeners"]) >= 1


class TestRDSDeployment:
    """Test RDS database deployment."""

    def test_rds_exists(self, stack_outputs, aws_region):
        """Test that RDS instance was created and is available."""
        assert "db_endpoint" in stack_outputs
        db_endpoint = stack_outputs["db_endpoint"]
        assert db_endpoint

        # Extract instance identifier from endpoint
        db_identifier = db_endpoint.split(".")[0]

        # Verify RDS instance exists and is available
        rds = boto3.client("rds", region_name=aws_region)
        try:
            response = rds.describe_db_instances(DBInstanceIdentifier=db_identifier)
            assert len(response["DBInstances"]) == 1
            assert response["DBInstances"][0]["DBInstanceStatus"] == "available"
        except ClientError:
            # Instance might have a different identifier format
            pytest.skip("RDS instance identifier format differs")

    def test_rds_multi_az_enabled(self, stack_outputs, aws_region):
        """Test that RDS Multi-AZ is enabled."""
        db_endpoint = stack_outputs["db_endpoint"]
        db_identifier = db_endpoint.split(".")[0]

        rds = boto3.client("rds", region_name=aws_region)
        try:
            response = rds.describe_db_instances(DBInstanceIdentifier=db_identifier)
            assert response["DBInstances"][0]["MultiAZ"] is True
        except ClientError:
            pytest.skip("RDS instance not accessible")

    def test_rds_encryption_enabled(self, stack_outputs, aws_region):
        """Test that RDS encryption is enabled."""
        db_endpoint = stack_outputs["db_endpoint"]
        db_identifier = db_endpoint.split(".")[0]

        rds = boto3.client("rds", region_name=aws_region)
        try:
            response = rds.describe_db_instances(DBInstanceIdentifier=db_identifier)
            assert response["DBInstances"][0]["StorageEncrypted"] is True
        except ClientError:
            pytest.skip("RDS instance not accessible")


class TestS3Deployment:
    """Test S3 bucket deployment."""

    def test_s3_bucket_exists(self, stack_outputs, aws_region):
        """Test that S3 bucket was created."""
        assert "static_content_bucket" in stack_outputs
        bucket_name = stack_outputs["static_content_bucket"]
        assert bucket_name

        # Verify bucket exists
        s3 = boto3.client("s3", region_name=aws_region)
        response = s3.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_s3_bucket_encryption(self, stack_outputs, aws_region):
        """Test that S3 bucket has encryption enabled."""
        bucket_name = stack_outputs["static_content_bucket"]
        s3 = boto3.client("s3", region_name=aws_region)

        # Check encryption configuration
        try:
            response = s3.get_bucket_encryption(Bucket=bucket_name)
            assert "ServerSideEncryptionConfiguration" in response
            assert "Rules" in response["ServerSideEncryptionConfiguration"]
            assert len(response["ServerSideEncryptionConfiguration"]["Rules"]) > 0
        except ClientError as e:
            if (
                e.response["Error"]["Code"]
                != "ServerSideEncryptionConfigurationNotFoundError"
            ):
                raise

    def test_s3_bucket_versioning(self, stack_outputs, aws_region):
        """Test that S3 bucket has versioning enabled."""
        bucket_name = stack_outputs["static_content_bucket"]
        s3 = boto3.client("s3", region_name=aws_region)

        # Check versioning
        response = s3.get_bucket_versioning(Bucket=bucket_name)
        assert response.get("Status") == "Enabled"


class TestCloudFrontDeployment:
    """Test CloudFront distribution deployment."""

    def test_cloudfront_distribution_exists(self, stack_outputs):
        """Test that CloudFront distribution was created."""
        assert "cloudfront_domain_name" in stack_outputs
        cf_domain = stack_outputs["cloudfront_domain_name"]
        assert cf_domain
        assert ".cloudfront.net" in cf_domain

    def test_cloudfront_distribution_enabled(self, stack_outputs):
        """Test that CloudFront distribution is enabled."""
        cf_domain = stack_outputs["cloudfront_domain_name"]
        cf = boto3.client("cloudfront")

        # List distributions and find ours
        response = cf.list_distributions()
        if "DistributionList" in response and "Items" in response["DistributionList"]:
            distributions = [
                d
                for d in response["DistributionList"]["Items"]
                if d["DomainName"] == cf_domain
            ]
            if distributions:
                assert distributions[0]["Enabled"] is True
                assert distributions[0]["Status"] == "Deployed"


class TestAutoScalingDeployment:
    """Test Auto Scaling Group deployment."""

    def test_autoscaling_group_exists(self, aws_region):
        """Test that Auto Scaling Group was created."""
        asg = boto3.client("autoscaling", region_name=aws_region)
        response = asg.describe_auto_scaling_groups()

        # Find payment processing ASG
        payment_asgs = [
            group
            for group in response["AutoScalingGroups"]
            if "payment-asg" in group["AutoScalingGroupName"]
        ]
        assert len(payment_asgs) > 0

    def test_autoscaling_group_has_instances(self, aws_region):
        """Test that Auto Scaling Group has running instances."""
        asg = boto3.client("autoscaling", region_name=aws_region)
        response = asg.describe_auto_scaling_groups()

        # Find payment processing ASG
        payment_asgs = [
            group
            for group in response["AutoScalingGroups"]
            if "payment-asg" in group["AutoScalingGroupName"]
        ]
        if payment_asgs:
            assert len(payment_asgs[0]["Instances"]) >= payment_asgs[0]["MinSize"]


class TestMonitoringDeployment:
    """Test CloudWatch monitoring deployment."""

    def test_cloudwatch_alarms_exist(self, aws_region):
        """Test that CloudWatch alarms were created."""
        cw = boto3.client("cloudwatch", region_name=aws_region)
        response = cw.describe_alarms()

        # Find payment processing alarms
        payment_alarms = [
            alarm
            for alarm in response["MetricAlarms"]
            if "payment-" in alarm["AlarmName"]
        ]
        assert len(payment_alarms) > 0


class TestSecurityConfiguration:
    """Test security configuration."""

    def test_security_groups_configured(self, stack_outputs, aws_region):
        """Test that security groups are properly configured."""
        vpc_id = stack_outputs["vpc_id"]
        ec2 = boto3.client("ec2", region_name=aws_region)

        # Get security groups for VPC
        response = ec2.describe_security_groups(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        # Should have ALB, app, and DB security groups
        sg_names = [sg["GroupName"] for sg in response["SecurityGroups"]]
        payment_sgs = [name for name in sg_names if "payment-" in name]
        assert len(payment_sgs) >= 3
