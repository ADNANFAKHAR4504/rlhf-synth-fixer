"""Unit tests for TAP Stack - CDKTF Python implementation."""

import pytest
import json
from cdktf import Testing, App
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for TapStack."""

    @pytest.fixture
    def app(self):
        """Create CDKTF app fixture."""
        return App()

    @pytest.fixture
    def stack(self, app):
        """Create TapStack fixture with test configuration."""
        return TapStack(
            app,
            "test-stack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket_region="us-east-1",
            state_bucket="test-bucket",
            default_tags=[{"tags": {"Environment": "test"}}]
        )

    @pytest.fixture
    def synth_json(self, stack):
        """Get synthesized JSON."""
        synth_output = Testing.synth(stack)
        return json.loads(synth_output)

    def test_stack_is_created(self, stack):
        """Test that stack is created successfully."""
        assert stack is not None
        synth = Testing.synth(stack)
        assert synth is not None
        assert len(synth) > 0

    def test_aws_provider_is_configured(self, synth_json):
        """Test that AWS provider is configured correctly."""
        assert "provider" in synth_json
        assert "aws" in synth_json["provider"]

        provider_config = synth_json["provider"]["aws"][0]
        assert provider_config["region"] == "us-east-1"

    # VPC and Networking Tests
    def test_vpc_is_created(self, synth_json):
        """Test that VPC is created with correct configuration."""
        assert "resource" in synth_json
        assert "aws_vpc" in synth_json["resource"]

        vpcs = synth_json["resource"]["aws_vpc"]
        assert len(vpcs) == 1

        vpc_key = list(vpcs.keys())[0]
        vpc = vpcs[vpc_key]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True
        assert "test" in vpc["tags"]["Name"]

    def test_public_subnets_are_created(self, synth_json):
        """Test that 3 public subnets are created."""
        subnets = synth_json["resource"]["aws_subnet"]

        public_subnets = [s for s in subnets.values() if s["tags"].get("Type") == "Public"]
        assert len(public_subnets) == 3

        # Check CIDR blocks
        cidrs = sorted([s["cidr_block"] for s in public_subnets])
        expected_cidrs = ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]
        assert cidrs == expected_cidrs

        # Check map_public_ip_on_launch
        for subnet in public_subnets:
            assert subnet["map_public_ip_on_launch"] is True

    def test_private_subnets_are_created(self, synth_json):
        """Test that 3 private subnets are created."""
        subnets = synth_json["resource"]["aws_subnet"]

        private_subnets = [s for s in subnets.values() if s["tags"].get("Type") == "Private"]
        assert len(private_subnets) == 3

        # Check CIDR blocks
        cidrs = sorted([s["cidr_block"] for s in private_subnets])
        expected_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
        assert cidrs == expected_cidrs

        # Check map_public_ip_on_launch
        for subnet in private_subnets:
            assert subnet["map_public_ip_on_launch"] is False

    def test_internet_gateway_is_created(self, synth_json):
        """Test that Internet Gateway is created."""
        assert "aws_internet_gateway" in synth_json["resource"]
        igws = synth_json["resource"]["aws_internet_gateway"]
        assert len(igws) == 1

        igw = list(igws.values())[0]
        assert "test" in igw["tags"]["Name"]

    def test_nat_gateways_are_created(self, synth_json):
        """Test that 3 NAT Gateways are created (one per AZ)."""
        assert "aws_nat_gateway" in synth_json["resource"]
        nats = synth_json["resource"]["aws_nat_gateway"]
        assert len(nats) == 3

        for nat in nats.values():
            assert "test" in nat["tags"]["Name"]

    def test_elastic_ips_are_created(self, synth_json):
        """Test that 3 Elastic IPs are created for NAT Gateways."""
        assert "aws_eip" in synth_json["resource"]
        eips = synth_json["resource"]["aws_eip"]
        assert len(eips) == 3

        for eip in eips.values():
            assert eip["domain"] == "vpc"

    def test_route_tables_are_created(self, synth_json):
        """Test that route tables are created correctly."""
        assert "aws_route_table" in synth_json["resource"]
        route_tables = synth_json["resource"]["aws_route_table"]

        # 1 public + 3 private route tables
        assert len(route_tables) == 4

    def test_vpc_flow_logs_are_configured(self, synth_json):
        """Test that VPC Flow Logs are configured."""
        assert "aws_flow_log" in synth_json["resource"]
        flow_logs = synth_json["resource"]["aws_flow_log"]
        assert len(flow_logs) >= 1

        flow_log = list(flow_logs.values())[0]
        assert flow_log["traffic_type"] == "ALL"

    def test_cloudwatch_log_group_for_flow_logs(self, synth_json):
        """Test that CloudWatch Log Group is created for Flow Logs."""
        assert "aws_cloudwatch_log_group" in synth_json["resource"]
        log_groups = synth_json["resource"]["aws_cloudwatch_log_group"]

        flow_log_groups = [lg for lg in log_groups.values() if "flowlogs" in lg["name"]]
        assert len(flow_log_groups) >= 1
        assert flow_log_groups[0]["retention_in_days"] == 7

    # Security Tests
    def test_security_groups_are_created(self, synth_json):
        """Test that all required security groups are created."""
        assert "aws_security_group" in synth_json["resource"]
        sgs = synth_json["resource"]["aws_security_group"]

        # ALB, API, Database security groups
        assert len(sgs) >= 3

    def test_alb_security_group_rules(self, synth_json):
        """Test that ALB security group has correct rules."""
        sgs = synth_json["resource"]["aws_security_group"]
        alb_sg = [sg for sg in sgs.values() if "alb-sg" in sg["name"]]

        assert len(alb_sg) == 1
        ingress_rules = alb_sg[0]["ingress"]

        # Should allow HTTPS (443) and HTTP (80)
        ports = [rule["from_port"] for rule in ingress_rules]
        assert 443 in ports
        assert 80 in ports

    def test_api_security_group_rules(self, synth_json):
        """Test that API security group has correct rules."""
        sgs = synth_json["resource"]["aws_security_group"]
        api_sg = [sg for sg in sgs.values() if "api-sg" in sg["name"]]

        assert len(api_sg) == 1
        ingress_rules = api_sg[0]["ingress"]

        # Should allow traffic on port 3000 from ALB
        assert len(ingress_rules) >= 1
        assert ingress_rules[0]["from_port"] == 3000

    def test_database_security_group_rules(self, synth_json):
        """Test that Database security group has correct rules."""
        sgs = synth_json["resource"]["aws_security_group"]
        db_sg = [sg for sg in sgs.values() if "database-sg" in sg["name"]]

        assert len(db_sg) == 1
        ingress_rules = db_sg[0]["ingress"]

        # Should allow PostgreSQL traffic (5432) from API servers
        assert len(ingress_rules) >= 1
        assert ingress_rules[0]["from_port"] == 5432
        assert ingress_rules[0]["to_port"] == 5432

    def test_iam_roles_are_created(self, synth_json):
        """Test that IAM roles are created."""
        assert "aws_iam_role" in synth_json["resource"]
        iam_roles = synth_json["resource"]["aws_iam_role"]

        # Should have roles for EC2, Flow Logs
        assert len(iam_roles) >= 2

    def test_ec2_instance_profile_is_created(self, synth_json):
        """Test that EC2 instance profile is created."""
        assert "aws_iam_instance_profile" in synth_json["resource"]
        instance_profiles = synth_json["resource"]["aws_iam_instance_profile"]
        assert len(instance_profiles) >= 1

    def test_waf_web_acl_is_created(self, synth_json):
        """Test that WAF Web ACL is created."""
        assert "aws_wafv2_web_acl" in synth_json["resource"]
        wafs = synth_json["resource"]["aws_wafv2_web_acl"]
        assert len(wafs) == 1

        waf = list(wafs.values())[0]
        assert waf["scope"] == "REGIONAL"
        assert "test" in waf["name"]

    def test_waf_managed_rules(self, synth_json):
        """Test that WAF has managed rule groups configured."""
        wafs = synth_json["resource"]["aws_wafv2_web_acl"]
        waf = list(wafs.values())[0]
        rules = waf["rule"]

        # Should have at least 3 managed rule sets
        assert len(rules) >= 3

        rule_names = [rule["name"] for rule in rules]
        assert "AWSManagedRulesCommonRuleSet" in rule_names
        assert "AWSManagedRulesKnownBadInputsRuleSet" in rule_names
        assert "AWSManagedRulesSQLiRuleSet" in rule_names

    # Compute Tests
    def test_alb_is_created(self, synth_json):
        """Test that Application Load Balancer is created."""
        assert "aws_lb" in synth_json["resource"]
        albs = synth_json["resource"]["aws_lb"]
        assert len(albs) == 1

        alb = list(albs.values())[0]
        assert alb["load_balancer_type"] == "application"
        assert alb["internal"] is False
        assert "test" in alb["name"]

    def test_alb_target_group_is_created(self, synth_json):
        """Test that ALB target group is created."""
        assert "aws_lb_target_group" in synth_json["resource"]
        tgs = synth_json["resource"]["aws_lb_target_group"]
        assert len(tgs) == 1

        tg = list(tgs.values())[0]
        assert tg["port"] == 3000
        assert tg["protocol"] == "HTTP"
        assert tg["target_type"] == "instance"

    def test_alb_listeners_are_created(self, synth_json):
        """Test that ALB listeners are created."""
        assert "aws_lb_listener" in synth_json["resource"]
        listeners = synth_json["resource"]["aws_lb_listener"]

        # Should have HTTPS listener
        assert len(listeners) >= 1

    def test_launch_template_is_created(self, synth_json):
        """Test that launch template is created."""
        assert "aws_launch_template" in synth_json["resource"]
        lts = synth_json["resource"]["aws_launch_template"]
        assert len(lts) == 1

        lt = list(lts.values())[0]
        assert "test" in lt["name"]

    def test_auto_scaling_group_is_created(self, synth_json):
        """Test that Auto Scaling Group is created."""
        assert "aws_autoscaling_group" in synth_json["resource"]
        asgs = synth_json["resource"]["aws_autoscaling_group"]
        assert len(asgs) == 1

        asg = list(asgs.values())[0]
        assert asg["min_size"] >= 1
        assert asg["max_size"] >= asg["min_size"]
        assert asg["desired_capacity"] >= asg["min_size"]

    # Database Tests
    def test_rds_subnet_group_is_created(self, synth_json):
        """Test that RDS subnet group is created."""
        assert "aws_db_subnet_group" in synth_json["resource"]
        subnet_groups = synth_json["resource"]["aws_db_subnet_group"]
        assert len(subnet_groups) == 1

    def test_rds_instance_is_created(self, synth_json):
        """Test that RDS PostgreSQL instance is created."""
        assert "aws_db_instance" in synth_json["resource"]
        rdss = synth_json["resource"]["aws_db_instance"]
        assert len(rdss) == 1

        rds = list(rdss.values())[0]
        assert rds["engine"] == "postgres"
        assert rds["multi_az"] is True
        assert rds["storage_encrypted"] is True
        assert "test" in rds["identifier"]

    def test_ssm_parameter_for_db_connection(self, synth_json):
        """Test that SSM parameter for DB connection is created."""
        assert "aws_ssm_parameter" in synth_json["resource"]
        ssm_params = synth_json["resource"]["aws_ssm_parameter"]

        db_params = [p for p in ssm_params.values() if "db/connection" in p["name"]]
        assert len(db_params) == 1
        assert db_params[0]["type"] == "SecureString"

    # Frontend Tests
    def test_s3_bucket_is_created(self, synth_json):
        """Test that S3 bucket for frontend is created."""
        assert "aws_s3_bucket" in synth_json["resource"]
        s3_buckets = synth_json["resource"]["aws_s3_bucket"]
        assert len(s3_buckets) >= 1

    def test_s3_bucket_encryption(self, synth_json):
        """Test that S3 bucket has encryption enabled."""
        assert "aws_s3_bucket_server_side_encryption_configuration" in synth_json["resource"]
        encryptions = synth_json["resource"]["aws_s3_bucket_server_side_encryption_configuration"]
        assert len(encryptions) >= 1

    def test_cloudfront_distribution_is_created(self, synth_json):
        """Test that CloudFront distribution is created."""
        assert "aws_cloudfront_distribution" in synth_json["resource"]
        cfs = synth_json["resource"]["aws_cloudfront_distribution"]
        assert len(cfs) == 1

        cf = list(cfs.values())[0]
        assert cf["enabled"] is True

    def test_cloudfront_oai_is_created(self, synth_json):
        """Test that CloudFront Origin Access Identity is created."""
        assert "aws_cloudfront_origin_access_identity" in synth_json["resource"]
        oais = synth_json["resource"]["aws_cloudfront_origin_access_identity"]
        assert len(oais) >= 1

    # Monitoring Tests
    def test_cloudwatch_alarms_are_created(self, synth_json):
        """Test that CloudWatch alarms are created."""
        assert "aws_cloudwatch_metric_alarm" in synth_json["resource"]
        alarms = synth_json["resource"]["aws_cloudwatch_metric_alarm"]

        # Should have alarms for ALB 5XX errors and ASG CPU utilization
        assert len(alarms) >= 2

    def test_alb_5xx_alarm_configuration(self, synth_json):
        """Test that ALB 5XX error alarm is properly configured."""
        alarms = synth_json["resource"]["aws_cloudwatch_metric_alarm"]

        alb_alarms = [a for a in alarms.values() if "5xx" in a["alarm_name"].lower()]
        assert len(alb_alarms) >= 1

        alarm = alb_alarms[0]
        assert alarm["comparison_operator"] == "GreaterThanThreshold"
        assert alarm["threshold"] >= 5

    def test_cpu_utilization_alarm_configuration(self, synth_json):
        """Test that CPU utilization alarm is properly configured."""
        alarms = synth_json["resource"]["aws_cloudwatch_metric_alarm"]

        cpu_alarms = [a for a in alarms.values() if "cpu" in a["alarm_name"].lower()]
        assert len(cpu_alarms) >= 1

        alarm = cpu_alarms[0]
        assert alarm["comparison_operator"] == "GreaterThanThreshold"
        assert alarm["threshold"] >= 80

    # Environment Suffix Tests
    def test_environment_suffix_in_resource_names(self, synth_json):
        """Test that environment suffix is included in all resource names."""
        # Check VPC
        vpc = list(synth_json["resource"]["aws_vpc"].values())[0]
        assert "test" in vpc["tags"]["Name"]

        # Check ALB
        alb = list(synth_json["resource"]["aws_lb"].values())[0]
        assert "test" in alb["name"]

        # Check RDS
        rds = list(synth_json["resource"]["aws_db_instance"].values())[0]
        assert "test" in rds["identifier"]

    def test_stack_outputs_are_defined(self, synth_json):
        """Test that stack outputs are defined."""
        assert "output" in synth_json
        outputs = synth_json["output"]

        # Should have outputs for key resources
        expected_outputs = ["vpc_id", "alb_dns_name", "rds_endpoint", "cloudfront_domain_name"]
        for expected in expected_outputs:
            assert expected in outputs

    def test_availability_zones_distribution(self, synth_json):
        """Test that resources are distributed across 3 AZs."""
        subnets = synth_json["resource"]["aws_subnet"]

        azs = set(s["availability_zone"] for s in subnets.values())
        assert len(azs) == 3

        for az in azs:
            assert az.startswith("us-east-1")

    def test_tags_are_applied(self, synth_json):
        """Test that tags are applied to resources."""
        # Check VPC has tags
        vpc = list(synth_json["resource"]["aws_vpc"].values())[0]
        assert "tags" in vpc
        assert "Name" in vpc["tags"]

    def test_encryption_at_rest(self, synth_json):
        """Test that encryption at rest is enabled for data services."""
        # Check RDS encryption
        rds = list(synth_json["resource"]["aws_db_instance"].values())[0]
        assert rds["storage_encrypted"] is True

        # Check S3 encryption
        encryptions = synth_json["resource"]["aws_s3_bucket_server_side_encryption_configuration"]
        assert len(encryptions) >= 1
