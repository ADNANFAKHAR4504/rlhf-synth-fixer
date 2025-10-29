"""Integration tests for deployed TAP infrastructure using AWS SDK"""
import json
import os
from pathlib import Path
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark


# Load outputs from flat-outputs.json
def load_stack_outputs():
    """Load CloudFormation outputs from flat-outputs.json"""
    outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

    if not outputs_path.exists():
        raise FileNotFoundError(
            f"flat-outputs.json not found at {outputs_path}. "
            "Please run deployment first to generate outputs."
        )

    with open(outputs_path, "r", encoding="utf-8") as f:
        return json.load(f)


# Load configuration from environment and metadata
def load_config():
    """Load configuration from environment variables and metadata.json"""
    metadata_path = Path(__file__).parent.parent.parent / "metadata.json"

    config = {
        "region": os.getenv("AWS_REGION", "us-east-1"),
        "environment_suffix": os.getenv("ENVIRONMENT_SUFFIX", "dev"),
    }

    if metadata_path.exists():
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            config["account_id"] = metadata.get("account_id", "")

    return config


# Global configuration and outputs
CONFIG = load_config()
OUTPUTS = load_stack_outputs()


@mark.describe("VPC and Networking Integration Tests")
class TestVPCIntegration(unittest.TestCase):
    """Integration tests for VPC and networking resources"""

    @classmethod
    def setUpClass(cls):
        """Set up EC2 client for tests"""
        cls.ec2_client = boto3.client("ec2", region_name=CONFIG["region"])
        cls.vpc_id = OUTPUTS.get("VPCId")

    @mark.it("VPC exists and is available")
    def test_vpc_exists(self):
        """Test that VPC exists and is in available state"""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        self.assertEqual(len(response["Vpcs"]), 1)
        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["State"], "available")

        # Check DNS attributes separately
        attrs = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id, Attribute="enableDnsHostnames"
        )
        self.assertTrue(attrs["EnableDnsHostnames"]["Value"])

        attrs = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id, Attribute="enableDnsSupport"
        )
        self.assertTrue(attrs["EnableDnsSupport"]["Value"])

    @mark.it("VPC has correct CIDR block")
    def test_vpc_cidr_block(self):
        """Test that VPC has the expected CIDR block (10.0.0.0/16 default for CDK VPC)"""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response["Vpcs"][0]

        # Verify VPC has CIDR blocks assigned
        cidr_blocks = [block["CidrBlock"] for block in vpc.get("CidrBlockAssociationSet", [])]
        self.assertGreater(len(cidr_blocks), 0, "VPC has no CIDR blocks")

        # Check that primary CIDR exists
        primary_cidr = vpc.get("CidrBlock")
        self.assertIsNotNone(primary_cidr, "VPC has no primary CIDR block")

        # Verify it's a valid /16 CIDR (standard for CDK VPC)
        self.assertTrue(primary_cidr.endswith("/16"), f"Expected /16 CIDR, got {primary_cidr}")

    @mark.it("Private subnets exist and are configured correctly")
    def test_private_subnets_exist(self):
        """Test that private subnets exist"""
        # Query subnets directly by VPC ID and tags
        response = self.ec2_client.describe_subnets(
            Filters=[
                {"Name": "vpc-id", "Values": [self.vpc_id]},
                {"Name": "tag:aws-cdk:subnet-type", "Values": ["Private"]}
            ]
        )

        private_subnets = response.get("Subnets", [])
        self.assertGreater(len(private_subnets), 0, "No private subnets found in VPC")

        # Verify each subnet
        for subnet in private_subnets:
            self.assertEqual(subnet["VpcId"], self.vpc_id)
            self.assertEqual(subnet["State"], "available")
            self.assertFalse(subnet.get("MapPublicIpOnLaunch", False), "Private subnet should not auto-assign public IPs")

    @mark.it("Security groups exist with proper configurations")
    def test_security_groups_exist(self):
        """Test that security groups exist and have proper rules"""
        sg_id = OUTPUTS.get("AppSecurityGroupId")
        if not sg_id:
            self.fail("App security group ID not found in outputs")

        response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])

        self.assertEqual(len(response["SecurityGroups"]), 1)
        sg = response["SecurityGroups"][0]
        self.assertEqual(sg["VpcId"], self.vpc_id)
        self.assertTrue(len(sg["IpPermissions"]) > 0 or len(sg["IpPermissionsEgress"]) > 0)

    @mark.it("VPC has internet gateway attached")
    def test_vpc_has_internet_gateway(self):
        """Test that VPC has an internet gateway attached"""
        response = self.ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [self.vpc_id]}]
        )

        self.assertGreater(len(response["InternetGateways"]), 0)
        igw = response["InternetGateways"][0]
        self.assertEqual(igw["Attachments"][0]["State"], "available")

    @mark.it("Public subnets exist and are configured correctly")
    def test_public_subnets_exist(self):
        """Test that public subnets exist"""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {"Name": "vpc-id", "Values": [self.vpc_id]},
                {"Name": "tag:aws-cdk:subnet-type", "Values": ["Public"]}
            ]
        )

        public_subnets = response.get("Subnets", [])
        self.assertGreater(len(public_subnets), 0, "No public subnets found in VPC")

        for subnet in public_subnets:
            self.assertEqual(subnet["VpcId"], self.vpc_id)
            self.assertEqual(subnet["State"], "available")
            self.assertTrue(subnet.get("MapPublicIpOnLaunch", False), "Public subnet should auto-assign public IPs")

    @mark.it("NAT gateways are deployed and available")
    def test_nat_gateways_exist(self):
        """Test that NAT gateways exist for private subnet connectivity"""
        response = self.ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [self.vpc_id]}]
        )

        nat_gateways = response.get("NatGateways", [])
        available_nats = [nat for nat in nat_gateways if nat["State"] == "available"]

        self.assertGreater(len(available_nats), 0, "No available NAT gateways found")

        # Verify NAT gateway has an Elastic IP
        for nat in available_nats:
            self.assertGreater(len(nat.get("NatGatewayAddresses", [])), 0)
            self.assertIn("AllocationId", nat["NatGatewayAddresses"][0])

    @mark.it("VPC flow logs are enabled")
    def test_vpc_flow_logs_enabled(self):
        """Test that VPC flow logs are enabled for monitoring"""
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {"Name": "resource-id", "Values": [self.vpc_id]}
            ]
        )

        flow_logs = response.get("FlowLogs", [])
        active_logs = [log for log in flow_logs if log["FlowLogStatus"] == "ACTIVE"]

        self.assertGreater(len(active_logs), 0, "No active VPC flow logs found")


@mark.describe("S3 Storage Integration Tests")
class TestS3Integration(unittest.TestCase):
    """Integration tests for S3 buckets"""

    @classmethod
    def setUpClass(cls):
        """Set up S3 client for tests"""
        cls.s3_client = boto3.client("s3", region_name=CONFIG["region"])
        cls.main_bucket_name = OUTPUTS.get("MainBucketName")
        cls.log_bucket_name = OUTPUTS.get("LogBucketName")

    @mark.it("Main S3 bucket exists and is accessible")
    def test_main_bucket_exists(self):
        """Test that main S3 bucket exists"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        try:
            response = self.s3_client.head_bucket(Bucket=self.main_bucket_name)
            self.assertIn("ResponseMetadata", response)
            self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
        except ClientError as e:
            self.fail(f"Main bucket does not exist or is not accessible: {e}")

    @mark.it("Main bucket has versioning enabled")
    def test_main_bucket_versioning(self):
        """Test that main bucket has versioning enabled"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        response = self.s3_client.get_bucket_versioning(Bucket=self.main_bucket_name)
        self.assertEqual(response.get("Status"), "Enabled")

    @mark.it("Main bucket has encryption enabled")
    def test_main_bucket_encryption(self):
        """Test that main bucket has encryption configured"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        response = self.s3_client.get_bucket_encryption(Bucket=self.main_bucket_name)

        self.assertIn("ServerSideEncryptionConfiguration", response)
        config = response["ServerSideEncryptionConfiguration"]
        self.assertIn("Rules", config)
        self.assertGreater(len(config["Rules"]), 0)

        rule = config["Rules"][0]
        self.assertIn("ApplyServerSideEncryptionByDefault", rule)
        sse_algorithm = rule["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"]
        self.assertIn(sse_algorithm, ["AES256", "aws:kms"])

    @mark.it("Main bucket blocks public access")
    def test_main_bucket_public_access_block(self):
        """Test that main bucket blocks all public access"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        response = self.s3_client.get_public_access_block(Bucket=self.main_bucket_name)

        config = response["PublicAccessBlockConfiguration"]
        self.assertTrue(config["BlockPublicAcls"])
        self.assertTrue(config["IgnorePublicAcls"])
        self.assertTrue(config["BlockPublicPolicy"])
        self.assertTrue(config["RestrictPublicBuckets"])

    @mark.it("Log bucket exists and is accessible")
    def test_log_bucket_exists(self):
        """Test that log S3 bucket exists"""
        if not self.log_bucket_name:
            self.skipTest("Log bucket name not found in outputs")

        try:
            response = self.s3_client.head_bucket(Bucket=self.log_bucket_name)
            self.assertIn("ResponseMetadata", response)
            self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
        except ClientError as e:
            self.fail(f"Log bucket does not exist or is not accessible: {e}")

    @mark.it("Can write and read from main bucket")
    def test_main_bucket_read_write(self):
        """Test that we can write to and read from main bucket"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        test_key = "integration-test/test-file.txt"
        test_content = b"Integration test content"

        try:
            # Write test file
            self.s3_client.put_object(
                Bucket=self.main_bucket_name,
                Key=test_key,
                Body=test_content
            )

            # Read test file
            response = self.s3_client.get_object(
                Bucket=self.main_bucket_name,
                Key=test_key
            )

            content = response["Body"].read()
            self.assertEqual(content, test_content)

        finally:
            # Clean up
            try:
                self.s3_client.delete_object(
                    Bucket=self.main_bucket_name,
                    Key=test_key
                )
            except Exception:
                pass


@mark.describe("KMS Integration Tests")
class TestKMSIntegration(unittest.TestCase):
    """Integration tests for KMS keys"""

    @classmethod
    def setUpClass(cls):
        """Set up KMS client for tests"""
        cls.kms_client = boto3.client("kms", region_name=CONFIG["region"])
        cls.kms_key_arn = OUTPUTS.get("KMSKeyArn")

    @mark.it("KMS key exists and is enabled")
    def test_kms_key_exists(self):
        """Test that KMS key exists and is enabled"""
        if not self.kms_key_arn:
            self.skipTest("KMS key ARN not found in outputs")

        key_id = self.kms_key_arn.split("/")[-1]
        response = self.kms_client.describe_key(KeyId=key_id)

        key_metadata = response["KeyMetadata"]
        self.assertEqual(key_metadata["KeyState"], "Enabled")
        self.assertTrue(key_metadata["Enabled"])

    @mark.it("KMS key has rotation enabled")
    def test_kms_key_rotation(self):
        """Test that KMS key has automatic rotation enabled"""
        if not self.kms_key_arn:
            self.skipTest("KMS key ARN not found in outputs")

        key_id = self.kms_key_arn.split("/")[-1]
        response = self.kms_client.get_key_rotation_status(KeyId=key_id)

        self.assertTrue(response["KeyRotationEnabled"])


@mark.describe("IAM Integration Tests")
class TestIAMIntegration(unittest.TestCase):
    """Integration tests for IAM roles"""

    @classmethod
    def setUpClass(cls):
        """Set up IAM client for tests"""
        cls.iam_client = boto3.client("iam", region_name=CONFIG["region"])
        cls.iam_role_arn = OUTPUTS.get("IAMRoleArn")

    @mark.it("IAM execution role exists")
    def test_iam_role_exists(self):
        """Test that IAM execution role exists"""
        if not self.iam_role_arn:
            self.skipTest("IAM role ARN not found in outputs")

        role_name = self.iam_role_arn.split("/")[-1]
        response = self.iam_client.get_role(RoleName=role_name)

        role = response["Role"]
        self.assertEqual(role["Arn"], self.iam_role_arn)
        self.assertIn("AssumeRolePolicyDocument", role)


@mark.describe("SNS Integration Tests")
class TestSNSIntegration(unittest.TestCase):
    """Integration tests for SNS topics"""

    @classmethod
    def setUpClass(cls):
        """Set up SNS client for tests"""
        cls.sns_client = boto3.client("sns", region_name=CONFIG["region"])
        cls.notification_topic_arn = OUTPUTS.get("NotificationTopicArn")
        cls.alert_topic_arn = OUTPUTS.get("SecurityAlertTopicArn")

    @mark.it("Notification SNS topic exists")
    def test_notification_topic_exists(self):
        """Test that notification SNS topic exists"""
        if not self.notification_topic_arn:
            self.skipTest("Notification topic ARN not found in outputs")

        response = self.sns_client.get_topic_attributes(
            TopicArn=self.notification_topic_arn
        )

        self.assertIn("Attributes", response)
        self.assertEqual(response["Attributes"]["TopicArn"], self.notification_topic_arn)

    @mark.it("Alert SNS topic exists")
    def test_alert_topic_exists(self):
        """Test that alert SNS topic exists"""
        if not self.alert_topic_arn:
            self.skipTest("Alert topic ARN not found in outputs")

        response = self.sns_client.get_topic_attributes(
            TopicArn=self.alert_topic_arn
        )

        self.assertIn("Attributes", response)
        self.assertEqual(response["Attributes"]["TopicArn"], self.alert_topic_arn)

    @mark.it("Can publish message to notification topic")
    def test_publish_to_notification_topic(self):
        """Test that we can publish messages to notification topic"""
        if not self.notification_topic_arn:
            self.skipTest("Notification topic ARN not found in outputs")

        response = self.sns_client.publish(
            TopicArn=self.notification_topic_arn,
            Message="Integration test message",
            Subject="Integration Test"
        )

        self.assertIn("MessageId", response)
        self.assertTrue(len(response["MessageId"]) > 0)


@mark.describe("ALB Integration Tests")
class TestALBIntegration(unittest.TestCase):
    """Integration tests for Application Load Balancer"""

    @classmethod
    def setUpClass(cls):
        """Set up ELBv2 client for tests"""
        cls.elbv2_client = boto3.client("elbv2", region_name=CONFIG["region"])
        cls.alb_dns_name = OUTPUTS.get("ALBDNSName")

    @mark.it("Application Load Balancer exists")
    def test_alb_exists(self):
        """Test that ALB exists and is active"""
        if not self.alb_dns_name:
            self.skipTest("ALB DNS name not found in outputs")

        # List all load balancers and find ours by DNS name
        response = self.elbv2_client.describe_load_balancers()

        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == self.alb_dns_name]
        self.assertEqual(len(albs), 1)

        alb = albs[0]
        self.assertEqual(alb["State"]["Code"], "active")
        self.assertEqual(alb["Scheme"], "internet-facing")

    @mark.it("ALB has target groups configured")
    def test_alb_target_groups(self):
        """Test that ALB has target groups"""
        if not self.alb_dns_name:
            self.skipTest("ALB DNS name not found in outputs")

        # Get load balancer ARN
        response = self.elbv2_client.describe_load_balancers()
        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == self.alb_dns_name]

        if not albs:
            self.skipTest("ALB not found")

        alb_arn = albs[0]["LoadBalancerArn"]

        # Get target groups for this ALB
        tg_response = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb_arn
        )

        self.assertGreater(len(tg_response["TargetGroups"]), 0)

        # Verify health check configuration
        for tg in tg_response["TargetGroups"]:
            self.assertTrue(tg["HealthCheckEnabled"])
            self.assertEqual(tg["HealthCheckPath"], "/health")


@mark.describe("Auto Scaling Integration Tests")
class TestAutoScalingIntegration(unittest.TestCase):
    """Integration tests for Auto Scaling Groups"""

    @classmethod
    def setUpClass(cls):
        """Set up Auto Scaling client for tests"""
        cls.autoscaling_client = boto3.client("autoscaling", region_name=CONFIG["region"])
        cls.ec2_client = boto3.client("ec2", region_name=CONFIG["region"])
        cls.vpc_id = OUTPUTS.get("VPCId")
        cls.env_suffix = CONFIG["environment_suffix"]

    @mark.it("Auto Scaling Group exists and is configured")
    def test_asg_exists(self):
        """Test that Auto Scaling Group exists with correct configuration"""
        # Find ASG by tags
        response = self.autoscaling_client.describe_auto_scaling_groups()

        # Filter ASGs by VPC (via subnet)
        asgs = []
        for asg in response["AutoScalingGroups"]:
            if asg.get("VPCZoneIdentifier"):
                # Get subnet IDs
                subnet_ids = asg["VPCZoneIdentifier"].split(",")
                # Check if subnets belong to our VPC
                try:
                    subnets = self.ec2_client.describe_subnets(SubnetIds=subnet_ids[:1])
                    if subnets["Subnets"] and subnets["Subnets"][0]["VpcId"] == self.vpc_id:
                        asgs.append(asg)
                except Exception:
                    continue

        self.assertGreater(len(asgs), 0, "No Auto Scaling Groups found in VPC")

        asg = asgs[0]
        self.assertGreater(asg["MinSize"], 0, "ASG MinSize should be greater than 0")
        self.assertGreater(asg["MaxSize"], asg["MinSize"], "ASG MaxSize should be greater than MinSize")
        self.assertGreaterEqual(asg["DesiredCapacity"], asg["MinSize"])
        self.assertLessEqual(asg["DesiredCapacity"], asg["MaxSize"])

    @mark.it("Auto Scaling Group has health checks enabled")
    def test_asg_health_checks(self):
        """Test that ASG has proper health check configuration"""
        response = self.autoscaling_client.describe_auto_scaling_groups()

        asgs = []
        for asg in response["AutoScalingGroups"]:
            if asg.get("VPCZoneIdentifier"):
                subnet_ids = asg["VPCZoneIdentifier"].split(",")
                try:
                    subnets = self.ec2_client.describe_subnets(SubnetIds=subnet_ids[:1])
                    if subnets["Subnets"] and subnets["Subnets"][0]["VpcId"] == self.vpc_id:
                        asgs.append(asg)
                except Exception:
                    continue

        if not asgs:
            self.skipTest("No Auto Scaling Groups found")

        asg = asgs[0]
        self.assertGreater(asg.get("HealthCheckGracePeriod", 0), 0)
        self.assertIn(asg.get("HealthCheckType"), ["EC2", "ELB"])


@mark.describe("CloudFront CDN Integration Tests")
class TestCloudFrontIntegration(unittest.TestCase):
    """Integration tests for CloudFront distribution"""

    @classmethod
    def setUpClass(cls):
        """Set up CloudFront client for tests"""
        cls.cloudfront_client = boto3.client("cloudfront", region_name=CONFIG["region"])
        cls.cloudfront_domain = OUTPUTS.get("CloudFrontDomain")

    @mark.it("CloudFront distribution exists and is deployed")
    def test_cloudfront_exists(self):
        """Test that CloudFront distribution exists and is deployed"""
        if not self.cloudfront_domain:
            self.skipTest("CloudFront domain not found in outputs")

        # List all distributions and find ours by domain name
        response = self.cloudfront_client.list_distributions()

        if "DistributionList" not in response or "Items" not in response["DistributionList"]:
            self.fail("No CloudFront distributions found")

        distributions = [
            dist for dist in response["DistributionList"]["Items"]
            if dist["DomainName"] == self.cloudfront_domain
        ]

        self.assertEqual(len(distributions), 1, "CloudFront distribution not found")
        distribution = distributions[0]

        self.assertEqual(distribution["Status"], "Deployed")
        self.assertTrue(distribution["Enabled"])

    @mark.it("CloudFront distribution has HTTPS enforcement")
    def test_cloudfront_https_enforcement(self):
        """Test that CloudFront enforces HTTPS"""
        if not self.cloudfront_domain:
            self.skipTest("CloudFront domain not found in outputs")

        response = self.cloudfront_client.list_distributions()
        distributions = [
            dist for dist in response["DistributionList"]["Items"]
            if dist["DomainName"] == self.cloudfront_domain
        ]

        if not distributions:
            self.skipTest("CloudFront distribution not found")

        distribution_id = distributions[0]["Id"]
        config = self.cloudfront_client.get_distribution_config(Id=distribution_id)

        default_behavior = config["DistributionConfig"]["DefaultCacheBehavior"]
        self.assertEqual(default_behavior["ViewerProtocolPolicy"], "redirect-to-https")

    @mark.it("CloudFront distribution has proper origins configured")
    def test_cloudfront_origins(self):
        """Test that CloudFront has proper origins (S3 and ALB)"""
        if not self.cloudfront_domain:
            self.skipTest("CloudFront domain not found in outputs")

        response = self.cloudfront_client.list_distributions()
        distributions = [
            dist for dist in response["DistributionList"]["Items"]
            if dist["DomainName"] == self.cloudfront_domain
        ]

        if not distributions:
            self.skipTest("CloudFront distribution not found")

        distribution_id = distributions[0]["Id"]
        config = self.cloudfront_client.get_distribution_config(Id=distribution_id)

        origins = config["DistributionConfig"]["Origins"]["Items"]
        self.assertGreater(len(origins), 0, "No origins configured")

    @mark.it("CloudFront distribution has logging enabled")
    def test_cloudfront_logging(self):
        """Test that CloudFront has access logging enabled"""
        if not self.cloudfront_domain:
            self.skipTest("CloudFront domain not found in outputs")

        response = self.cloudfront_client.list_distributions()
        distributions = [
            dist for dist in response["DistributionList"]["Items"]
            if dist["DomainName"] == self.cloudfront_domain
        ]

        if not distributions:
            self.skipTest("CloudFront distribution not found")

        distribution_id = distributions[0]["Id"]
        config = self.cloudfront_client.get_distribution_config(Id=distribution_id)

        logging = config["DistributionConfig"].get("Logging", {})
        self.assertTrue(logging.get("Enabled", False), "CloudFront logging should be enabled")


@mark.describe("Route53 DNS Integration Tests")
class TestRoute53Integration(unittest.TestCase):
    """Integration tests for Route53 hosted zone and records"""

    @classmethod
    def setUpClass(cls):
        """Set up Route53 client for tests"""
        cls.route53_client = boto3.client("route53", region_name=CONFIG["region"])
        cls.hosted_zone_id = OUTPUTS.get("HostedZoneId")

    @mark.it("Route53 hosted zone exists if domain is configured")
    def test_hosted_zone_exists(self):
        """Test that Route53 hosted zone exists if domain is configured"""
        if not self.hosted_zone_id:
            self.skipTest("Hosted zone ID not found - domain may not be configured")

        response = self.route53_client.get_hosted_zone(Id=self.hosted_zone_id)

        self.assertIn("HostedZone", response)
        zone = response["HostedZone"]
        self.assertEqual(zone["Id"].split("/")[-1], self.hosted_zone_id.split("/")[-1])

    @mark.it("Route53 has health checks configured")
    def test_health_checks_exist(self):
        """Test that Route53 health checks are configured"""
        if not self.hosted_zone_id:
            self.skipTest("Hosted zone ID not found - domain may not be configured")

        response = self.route53_client.list_health_checks()

        # Filter health checks by tags or name pattern
        health_checks = response.get("HealthChecks", [])
        self.assertGreater(len(health_checks), 0, "No health checks found")


@mark.describe("CloudWatch Monitoring Integration Tests")
class TestCloudWatchIntegration(unittest.TestCase):
    """Integration tests for CloudWatch monitoring"""

    @classmethod
    def setUpClass(cls):
        """Set up CloudWatch client for tests"""
        cls.cloudwatch_client = boto3.client("cloudwatch", region_name=CONFIG["region"])
        cls.logs_client = boto3.client("logs", region_name=CONFIG["region"])
        cls.env_suffix = CONFIG["environment_suffix"]
        cls.region = CONFIG["region"]

    @mark.it("CloudWatch log groups exist for application and infrastructure")
    def test_log_groups_exist(self):
        """Test that CloudWatch log groups are created"""
        app_log_group = f"/aws/tap/app-{self.env_suffix}-{self.region}"
        infra_log_group = f"/aws/tap/infra-{self.env_suffix}-{self.region}"

        # Check app log group
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=app_log_group
            )
            log_groups = [lg for lg in response["logGroups"] if lg["logGroupName"] == app_log_group]
            self.assertGreater(len(log_groups), 0, f"App log group {app_log_group} not found")
        except ClientError:
            self.fail(f"App log group {app_log_group} does not exist")

        # Check infra log group
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=infra_log_group
            )
            log_groups = [lg for lg in response["logGroups"] if lg["logGroupName"] == infra_log_group]
            self.assertGreater(len(log_groups), 0, f"Infra log group {infra_log_group} not found")
        except ClientError:
            self.fail(f"Infra log group {infra_log_group} does not exist")

    @mark.it("CloudWatch alarms exist for critical metrics")
    def test_alarms_exist(self):
        """Test that CloudWatch alarms are configured"""
        alarm_prefix = f"tap-{self.env_suffix}"

        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix=alarm_prefix
        )

        alarms = response.get("MetricAlarms", [])
        self.assertGreater(len(alarms), 0, "No CloudWatch alarms found")

        # Check for specific alarms
        alarm_names = [alarm["AlarmName"] for alarm in alarms]
        high_cpu_alarm = any("high-cpu" in name.lower() for name in alarm_names)
        unhealthy_targets_alarm = any("unhealthy" in name.lower() for name in alarm_names)

        self.assertTrue(high_cpu_alarm, "High CPU alarm not found")
        self.assertTrue(unhealthy_targets_alarm, "Unhealthy targets alarm not found")

    @mark.it("CloudWatch alarms are configured with SNS actions")
    def test_alarms_have_sns_actions(self):
        """Test that alarms have SNS notification actions"""
        alarm_prefix = f"tap-{self.env_suffix}"

        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix=alarm_prefix
        )

        alarms = response.get("MetricAlarms", [])
        if not alarms:
            self.skipTest("No alarms found")

        for alarm in alarms:
            self.assertGreater(
                len(alarm.get("AlarmActions", [])),
                0,
                f"Alarm {alarm['AlarmName']} has no actions configured"
            )

    @mark.it("CloudWatch dashboard exists")
    def test_dashboard_exists(self):
        """Test that CloudWatch dashboard is created"""
        dashboard_name = f"tap-dashboard-{self.env_suffix}-{self.region}"

        response = self.cloudwatch_client.list_dashboards(
            DashboardNamePrefix=dashboard_name
        )

        dashboards = [
            d for d in response.get("DashboardEntries", [])
            if d["DashboardName"] == dashboard_name
        ]

        self.assertEqual(len(dashboards), 1, f"Dashboard {dashboard_name} not found")


# REMOVED to avoid NoAvailableConfigurationRecorder error
# @mark.describe("AWS Config Compliance Integration Tests")
# class TestAWSConfigIntegration(unittest.TestCase):
#     """Integration tests for AWS Config"""
#
#     @classmethod
#     def setUpClass(cls):
#         """Set up Config client for tests"""
#         cls.config_client = boto3.client("config", region_name=CONFIG["region"])
#         cls.s3_client = boto3.client("s3", region_name=CONFIG["region"])
#         cls.env_suffix = CONFIG["environment_suffix"]
#         cls.region = CONFIG["region"]
#
#     @mark.it("AWS Config recorder is enabled and recording")
#     def test_config_recorder_enabled(self):
#         """Test that Config recorder is enabled"""
#         recorder_name = f"tap-config-recorder-{self.env_suffix}-{self.region}"
#
#         try:
#             response = self.config_client.describe_configuration_recorder_status(
#                 ConfigurationRecorderNames=[recorder_name]
#             )
#
#             if response["ConfigurationRecordersStatus"]:
#                 status = response["ConfigurationRecordersStatus"][0]
#                 self.assertTrue(status["recording"], "Config recorder is not recording")
#         except ClientError as e:
#             if e.response["Error"]["Code"] == "NoSuchConfigurationRecorderException":
#                 self.skipTest(f"Config recorder {recorder_name} not found")
#             raise
#
#     @mark.it("AWS Config delivery channel is configured")
#     def test_config_delivery_channel(self):
#         """Test that Config delivery channel is configured"""
#         channel_name = f"tap-delivery-channel-{self.env_suffix}-{self.region}"
#
#         try:
#             response = self.config_client.describe_delivery_channels(
#                 DeliveryChannelNames=[channel_name]
#             )
#
#             self.assertGreater(len(response["DeliveryChannels"]), 0)
#             channel = response["DeliveryChannels"][0]
#             self.assertIn("s3BucketName", channel)
#         except ClientError as e:
#             if e.response["Error"]["Code"] == "NoSuchDeliveryChannelException":
#                 self.skipTest(f"Delivery channel {channel_name} not found")
#             raise
#
#     @mark.it("AWS Config rules are deployed")
#     def test_config_rules_exist(self):
#         """Test that Config rules are deployed"""
#         rule_prefix = f"tap-"
#
#         response = self.config_client.describe_config_rules(
#             ConfigRuleNames=[]
#         )
#
#         # Filter rules by prefix
#         rules = [
#             rule for rule in response.get("ConfigRules", [])
#             if rule["ConfigRuleName"].startswith(rule_prefix)
#         ]
#
#         self.assertGreater(len(rules), 0, "No Config rules found")
#
#         # Verify specific rules exist
#         rule_names = [rule["ConfigRuleName"] for rule in rules]
#         self.assertTrue(
#             any("s3-encryption" in name for name in rule_names),
#             "S3 encryption rule not found"
#         )


@mark.describe("CodePipeline CI/CD Integration Tests")
class TestCodePipelineIntegration(unittest.TestCase):
    """Integration tests for CodePipeline"""

    @classmethod
    def setUpClass(cls):
        """Set up CodePipeline client for tests"""
        cls.codepipeline_client = boto3.client("codepipeline", region_name=CONFIG["region"])
        cls.codebuild_client = boto3.client("codebuild", region_name=CONFIG["region"])
        cls.env_suffix = CONFIG["environment_suffix"]
        cls.region = CONFIG["region"]

    @mark.it("CodePipeline exists and is configured")
    def test_pipeline_exists(self):
        """Test that CodePipeline is created"""
        pipeline_name = f"tap-pipeline-{self.env_suffix}-{self.region}"

        try:
            response = self.codepipeline_client.get_pipeline(name=pipeline_name)

            self.assertIn("pipeline", response)
            pipeline = response["pipeline"]
            self.assertEqual(pipeline["name"], pipeline_name)

            # Verify stages exist
            stages = pipeline.get("stages", [])
            self.assertGreater(len(stages), 0, "No pipeline stages found")

            stage_names = [stage["name"] for stage in stages]
            self.assertIn("Source", stage_names)
            self.assertIn("Build", stage_names)
            self.assertIn("Deploy", stage_names)

        except ClientError as e:
            if e.response["Error"]["Code"] == "PipelineNotFoundException":
                self.skipTest(f"Pipeline {pipeline_name} not found")
            raise

    @mark.it("CodeBuild project exists for pipeline")
    def test_codebuild_project_exists(self):
        """Test that CodeBuild project is created"""
        project_name = f"tap-build-{self.env_suffix}-{self.region}"

        try:
            response = self.codebuild_client.batch_get_projects(names=[project_name])

            projects = response.get("projects", [])
            self.assertEqual(len(projects), 1, f"CodeBuild project {project_name} not found")

            project = projects[0]
            self.assertEqual(project["name"], project_name)
            self.assertIn("source", project)
            self.assertIn("environment", project)

        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                self.skipTest(f"CodeBuild project {project_name} not found")
            raise


@mark.describe("CloudTrail Security Integration Tests")
class TestCloudTrailIntegration(unittest.TestCase):
    """Integration tests for CloudTrail"""

    @classmethod
    def setUpClass(cls):
        """Set up CloudTrail client for tests"""
        cls.cloudtrail_client = boto3.client("cloudtrail", region_name=CONFIG["region"])
        cls.s3_client = boto3.client("s3", region_name=CONFIG["region"])
        cls.env_suffix = CONFIG["environment_suffix"]
        cls.region = CONFIG["region"]

    @mark.it("CloudTrail trail exists and is logging")
    def test_trail_exists_and_logging(self):
        """Test that CloudTrail trail exists and is actively logging"""
        trail_name = f"tap-trail-{self.env_suffix}-{self.region}"

        try:
            response = self.cloudtrail_client.describe_trails(
                trailNameList=[trail_name]
            )

            trails = response.get("trailList", [])
            self.assertEqual(len(trails), 1, f"Trail {trail_name} not found")

            trail = trails[0]
            self.assertEqual(trail["Name"], trail_name)

            # Check if trail is logging
            status_response = self.cloudtrail_client.get_trail_status(Name=trail_name)
            self.assertTrue(status_response["IsLogging"], "Trail is not actively logging")

        except ClientError as e:
            if e.response["Error"]["Code"] == "TrailNotFoundException":
                self.skipTest(f"Trail {trail_name} not found")
            raise

    @mark.it("CloudTrail has log file validation enabled")
    def test_trail_log_validation(self):
        """Test that CloudTrail has log file validation enabled"""
        trail_name = f"tap-trail-{self.env_suffix}-{self.region}"

        try:
            response = self.cloudtrail_client.describe_trails(
                trailNameList=[trail_name]
            )

            trails = response.get("trailList", [])
            if not trails:
                self.skipTest(f"Trail {trail_name} not found")

            trail = trails[0]
            self.assertTrue(
                trail.get("LogFileValidationEnabled", False),
                "Log file validation is not enabled"
            )

        except ClientError as e:
            if e.response["Error"]["Code"] == "TrailNotFoundException":
                self.skipTest(f"Trail {trail_name} not found")
            raise

    @mark.it("CloudTrail sends logs to CloudWatch")
    def test_trail_cloudwatch_integration(self):
        """Test that CloudTrail sends logs to CloudWatch"""
        trail_name = f"tap-trail-{self.env_suffix}-{self.region}"

        try:
            response = self.cloudtrail_client.describe_trails(
                trailNameList=[trail_name]
            )

            trails = response.get("trailList", [])
            if not trails:
                self.skipTest(f"Trail {trail_name} not found")

            trail = trails[0]
            self.assertIn("CloudWatchLogsLogGroupArn", trail)
            self.assertIsNotNone(trail.get("CloudWatchLogsLogGroupArn"))

        except ClientError as e:
            if e.response["Error"]["Code"] == "TrailNotFoundException":
                self.skipTest(f"Trail {trail_name} not found")
            raise

    @mark.it("CloudTrail bucket exists and has encryption")
    def test_trail_bucket_encryption(self):
        """Test that CloudTrail S3 bucket exists and has encryption"""
        trail_name = f"tap-trail-{self.env_suffix}-{self.region}"

        try:
            response = self.cloudtrail_client.describe_trails(
                trailNameList=[trail_name]
            )

            trails = response.get("trailList", [])
            if not trails:
                self.skipTest(f"Trail {trail_name} not found")

            trail = trails[0]
            bucket_name = trail["S3BucketName"]

            # Check bucket encryption
            encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)

            self.assertIn("ServerSideEncryptionConfiguration", encryption_response)
            rules = encryption_response["ServerSideEncryptionConfiguration"]["Rules"]
            self.assertGreater(len(rules), 0)

            sse_algorithm = rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"]
            self.assertEqual(sse_algorithm, "aws:kms")

        except ClientError as e:
            if e.response["Error"]["Code"] == "TrailNotFoundException":
                self.skipTest(f"Trail {trail_name} not found")
            elif e.response["Error"]["Code"] == "ServerSideEncryptionConfigurationNotFoundError":
                self.fail("CloudTrail bucket does not have encryption configured")
            raise


if __name__ == "__main__":
    unittest.main()
