"""Unit tests for TAP Stack."""
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset test state before each test."""
        pass

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'bucket')
        assert hasattr(stack, 'bucket_versioning')
        assert hasattr(stack, 'bucket_encryption')

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'bucket')
        assert hasattr(stack, 'bucket_versioning')
        assert hasattr(stack, 'bucket_encryption')

    def test_tap_stack_synth_generates_terraform_config(self):
        """TapStack synthesizes to valid Terraform configuration."""
        app = App()
        stack = TapStack(
            app, "TestSynthStack", environment_suffix="test", aws_region="us-east-1"
        )

        # Synthesize the stack to JSON string
        synth = Testing.synth(stack)

        # Verify synth produces JSON output
        assert synth is not None
        assert isinstance(synth, str)

        # Parse JSON and verify structure
        config = json.loads(synth)
        assert "resource" in config

    def test_tap_stack_has_required_outputs(self):
        """TapStack defines required Terraform outputs."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        # Synthesize to check outputs
        synth = Testing.synth(stack)

        # Parse JSON string
        config = json.loads(synth)

        # Verify outputs exist
        assert "output" in config
        outputs = config.get("output", {})

        # Check for expected outputs
        assert "alb_dns_name" in outputs
        assert "rds_cluster_endpoint" in outputs
        assert "rds_reader_endpoint" in outputs
        assert "dms_replication_instance_arn" in outputs
        assert "dms_task_arn" in outputs
        assert "vpc_id" in outputs
        assert "cloudwatch_dashboard_name" in outputs
        assert "workspace" in outputs
        assert "artifacts_bucket_name" in outputs
        assert "artifacts_bucket_arn" in outputs


class TestVPCResources:
    """Test suite for VPC resources."""

    def test_vpc_resources_created(self):
        """VPC is created with correct CIDR block."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        vpcs = resources.get("aws_vpc", {})

        # Verify VPC exists
        assert "vpc_test" in vpcs

        # Verify CIDR block
        assert vpcs["vpc_test"]["cidr_block"] == "10.0.0.0/16"
        assert vpcs["vpc_test"]["enable_dns_hostnames"] is True
        assert vpcs["vpc_test"]["enable_dns_support"] is True

    def test_public_subnets_created_in_multiple_azs(self):
        """Public subnets are created across multiple availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestPublicSubnetStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        # Verify public subnets exist
        assert "public_subnet_0_test" in subnets
        assert "public_subnet_1_test" in subnets
        assert "public_subnet_2_test" in subnets

        # Verify map_public_ip_on_launch is true
        assert subnets["public_subnet_0_test"]["map_public_ip_on_launch"] is True
        assert subnets["public_subnet_1_test"]["map_public_ip_on_launch"] is True
        assert subnets["public_subnet_2_test"]["map_public_ip_on_launch"] is True

    def test_private_subnets_created_in_multiple_azs(self):
        """Private subnets are created across multiple availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestPrivateSubnetStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        # Verify private subnets exist
        assert "private_subnet_0_test" in subnets
        assert "private_subnet_1_test" in subnets
        assert "private_subnet_2_test" in subnets

        # Verify map_public_ip_on_launch is false
        assert subnets["private_subnet_0_test"]["map_public_ip_on_launch"] is False
        assert subnets["private_subnet_1_test"]["map_public_ip_on_launch"] is False
        assert subnets["private_subnet_2_test"]["map_public_ip_on_launch"] is False

    def test_internet_gateway_created(self):
        """Internet Gateway is created and attached."""
        app = App()
        stack = TapStack(
            app,
            "TestIGWStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        igws = resources.get("aws_internet_gateway", {})

        # Verify IGW exists
        assert "igw_test" in igws


class TestDatabaseResources:
    """Test suite for database resources."""

    def test_rds_aurora_cluster_configured_correctly(self):
        """RDS Aurora cluster is configured with correct settings."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        rds_clusters = resources.get("aws_rds_cluster", {})

        assert "aurora_cluster_test" in rds_clusters
        cluster = rds_clusters["aurora_cluster_test"]

        # Verify RDS cluster configuration
        assert cluster["engine"] == "aurora-mysql"
        assert cluster["engine_version"] == "8.0.mysql_aurora.3.04.0"
        assert cluster["database_name"] == "payment_db"
        assert cluster["master_username"] == "dbadmin"
        assert cluster["skip_final_snapshot"] is True
        assert cluster["backup_retention_period"] == 7
        assert cluster["storage_encrypted"] is True

    def test_rds_cluster_instances_created(self):
        """RDS cluster instances are created (1 writer + 2 readers)."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSInstancesStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        rds_instances = resources.get("aws_rds_cluster_instance", {})

        # Verify writer instance
        assert "aurora_writer_test" in rds_instances
        writer = rds_instances["aurora_writer_test"]
        assert writer["instance_class"] == "db.r5.large"

        # Verify reader instances
        assert "aurora_reader_0_test" in rds_instances
        assert "aurora_reader_1_test" in rds_instances

    def test_db_subnet_group_created(self):
        """DB subnet group is created for RDS."""
        app = App()
        stack = TapStack(
            app,
            "TestDBSubnetStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        db_subnet_groups = resources.get("aws_db_subnet_group", {})

        assert "db_subnet_group_test" in db_subnet_groups
        assert "subnet_ids" in db_subnet_groups["db_subnet_group_test"]


class TestDMSResources:
    """Test suite for DMS (Database Migration Service) resources."""

    def test_dms_replication_instance_configured(self):
        """DMS replication instance is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestDMSStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        dms_instances = resources.get("aws_dms_replication_instance", {})

        assert "dms_instance_test" in dms_instances
        instance = dms_instances["dms_instance_test"]

        # Verify DMS configuration
        assert instance["replication_instance_class"] == "dms.t3.medium"
        assert instance["allocated_storage"] == 100
        assert instance["publicly_accessible"] is False
        assert instance["multi_az"] is False
        assert instance["engine_version"] == "3.5.3"

    def test_dms_endpoints_created(self):
        """DMS source and target endpoints are created."""
        app = App()
        stack = TapStack(
            app,
            "TestDMSEndpointsStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        endpoints = resources.get("aws_dms_endpoint", {})

        # Verify source endpoint
        assert "dms_source_test" in endpoints
        source = endpoints["dms_source_test"]
        assert source["endpoint_type"] == "source"
        assert source["engine_name"] == "mysql"

        # Verify target endpoint
        assert "dms_target_test" in endpoints
        target = endpoints["dms_target_test"]
        assert target["endpoint_type"] == "target"
        assert target["engine_name"] == "aurora"

    def test_dms_replication_task_configured(self):
        """DMS replication task is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestDMSTaskStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        tasks = resources.get("aws_dms_replication_task", {})

        assert "dms_task_test" in tasks
        task = tasks["dms_task_test"]

        # Verify task configuration
        assert task["migration_type"] == "full-load-and-cdc"

    def test_dms_subnet_group_created(self):
        """DMS subnet group is created."""
        app = App()
        stack = TapStack(
            app,
            "TestDMSSubnetStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        subnet_groups = resources.get("aws_dms_replication_subnet_group", {})

        assert "dms_subnet_group_test" in subnet_groups


class TestLoadBalancerResources:
    """Test suite for Load Balancer resources."""

    def test_alb_configured_correctly(self):
        """Application Load Balancer is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestALBStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        albs = resources.get("aws_lb", {})

        assert "alb_test" in albs
        alb = albs["alb_test"]

        # Verify ALB configuration
        assert alb["internal"] is False
        assert alb["load_balancer_type"] == "application"
        assert alb["enable_deletion_protection"] is False
        assert alb["enable_cross_zone_load_balancing"] is True

    def test_alb_target_group_configured(self):
        """ALB target group is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestTargetGroupStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        target_groups = resources.get("aws_lb_target_group", {})

        assert "target_group_test" in target_groups
        tg = target_groups["target_group_test"]

        # Verify target group configuration
        assert tg["port"] == 80
        assert tg["protocol"] == "HTTP"
        assert tg["target_type"] == "instance"
        assert tg["deregistration_delay"] == "30"

    def test_alb_listener_configured(self):
        """ALB listener is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestListenerStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        listeners = resources.get("aws_lb_listener", {})

        assert "alb_listener_test" in listeners
        listener = listeners["alb_listener_test"]

        # Verify listener configuration
        assert listener["port"] == 80
        assert listener["protocol"] == "HTTP"


class TestAutoScalingResources:
    """Test suite for Auto Scaling resources."""

    def test_launch_template_configured(self):
        """Launch template is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestLaunchTemplateStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        templates = resources.get("aws_launch_template", {})

        assert "launch_template_test" in templates
        template = templates["launch_template_test"]

        # Verify launch template configuration
        assert template["instance_type"] == "t3.medium"

    def test_autoscaling_group_configured(self):
        """Auto Scaling Group is configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestASGStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        asgs = resources.get("aws_autoscaling_group", {})

        assert "asg_test" in asgs
        asg = asgs["asg_test"]

        # Verify ASG configuration
        assert asg["min_size"] == 3
        assert asg["max_size"] == 9
        assert asg["desired_capacity"] == 3
        assert asg["health_check_type"] == "EC2"  # EC2 health checks for faster deployment
        assert asg["health_check_grace_period"] == 300
        assert asg["wait_for_capacity_timeout"] == "0"  # No wait for deployment speed


class TestStorageResources:
    """Test suite for S3 storage resources."""

    def test_s3_bucket_created(self):
        """S3 bucket is created."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Stack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        s3_buckets = resources.get("aws_s3_bucket", {})

        # Verify bucket exists
        assert "artifacts_bucket_test" in s3_buckets
        bucket = s3_buckets["artifacts_bucket_test"]
        assert bucket["force_destroy"] is True

    def test_s3_versioning_enabled(self):
        """S3 versioning is enabled on bucket."""
        app = App()
        stack = TapStack(
            app,
            "TestS3VersioningStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        s3_versioning = resources.get("aws_s3_bucket_versioning", {})

        assert "artifacts_bucket_versioning_test" in s3_versioning

        # Verify versioning status
        versioning = s3_versioning["artifacts_bucket_versioning_test"]
        assert versioning["versioning_configuration"]["status"] == "Enabled"

    def test_s3_encryption_configured(self):
        """S3 encryption is configured on bucket."""
        app = App()
        stack = TapStack(
            app,
            "TestS3EncryptionStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        s3_encryption = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})

        assert "artifacts_bucket_encryption_test" in s3_encryption
        encryption = s3_encryption["artifacts_bucket_encryption_test"]

        # Verify encryption configuration
        rules = encryption["rule"]
        assert len(rules) > 0
        assert rules[0]["apply_server_side_encryption_by_default"]["sse_algorithm"] == "AES256"
        assert rules[0]["bucket_key_enabled"] is True


class TestMonitoringResources:
    """Test suite for monitoring resources."""

    def test_cloudwatch_dashboard_created(self):
        """CloudWatch dashboard is created."""
        app = App()
        stack = TapStack(
            app,
            "TestDashboardStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        dashboards = resources.get("aws_cloudwatch_dashboard", {})

        assert "dashboard_test" in dashboards
        dashboard = dashboards["dashboard_test"]
        assert "dashboard_body" in dashboard

    def test_cloudwatch_alarms_created(self):
        """CloudWatch alarms are created."""
        app = App()
        stack = TapStack(
            app,
            "TestAlarmsStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        alarms = resources.get("aws_cloudwatch_metric_alarm", {})

        # Verify alarms exist
        assert "alb_unhealthy_alarm_test" in alarms
        assert "dms_lag_alarm_test" in alarms

        # Verify ALB unhealthy alarm configuration
        unhealthy_alarm = alarms["alb_unhealthy_alarm_test"]
        assert unhealthy_alarm["comparison_operator"] == "GreaterThanThreshold"
        assert unhealthy_alarm["threshold"] == 1
        assert unhealthy_alarm["metric_name"] == "UnHealthyHostCount"

        # Verify DMS lag alarm configuration
        lag_alarm = alarms["dms_lag_alarm_test"]
        assert lag_alarm["comparison_operator"] == "GreaterThanThreshold"
        assert lag_alarm["threshold"] == 300  # 5 minutes
        assert lag_alarm["metric_name"] == "CDCLatencySource"


class TestSecurityResources:
    """Test suite for security resources."""

    def test_security_groups_configured(self):
        """Security groups are configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestSecurityStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        security_groups = resources.get("aws_security_group", {})

        # Verify security groups exist
        assert "alb_sg_test" in security_groups
        assert "ec2_sg_test" in security_groups
        assert "rds_sg_test" in security_groups
        assert "dms_sg_test" in security_groups

    def test_alb_security_group_rules(self):
        """ALB security group has correct ingress rules."""
        app = App()
        stack = TapStack(
            app,
            "TestALBSGStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        security_groups = resources.get("aws_security_group", {})

        alb_sg = security_groups["alb_sg_test"]
        ingress_rules = alb_sg["ingress"]

        # Verify HTTP and HTTPS ingress
        ports = [rule["from_port"] for rule in ingress_rules]
        assert 80 in ports
        assert 443 in ports

    def test_rds_security_group_rules(self):
        """RDS security group allows MySQL from EC2 and DMS."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSSGStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        security_groups = resources.get("aws_security_group", {})

        rds_sg = security_groups["rds_sg_test"]
        ingress_rules = rds_sg["ingress"]

        # Verify MySQL port 3306 is allowed
        mysql_rules = [rule for rule in ingress_rules if rule["from_port"] == 3306]
        assert len(mysql_rules) >= 2  # From EC2 and from VPC


class TestIAMResources:
    """Test suite for IAM resources."""

    def test_ec2_iam_role_created(self):
        """EC2 IAM role is created."""
        app = App()
        stack = TapStack(
            app,
            "TestEC2IAMStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        iam_roles = resources.get("aws_iam_role", {})

        # Verify EC2 role exists
        assert "ec2_role_test" in iam_roles

    def test_ec2_iam_role_has_correct_permissions(self):
        """EC2 IAM role has SSM and CloudWatch permissions."""
        app = App()
        stack = TapStack(
            app,
            "TestEC2IAMPoliciesStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        policy_attachments = resources.get("aws_iam_role_policy_attachment", {})

        # Verify policy attachments exist
        assert "ec2_ssm_policy_test" in policy_attachments
        assert "ec2_cloudwatch_policy_test" in policy_attachments

        # Verify correct policy ARNs
        ssm_policy = policy_attachments["ec2_ssm_policy_test"]
        assert "AmazonSSMManagedInstanceCore" in ssm_policy["policy_arn"]

        cloudwatch_policy = policy_attachments["ec2_cloudwatch_policy_test"]
        assert "CloudWatchAgentServerPolicy" in cloudwatch_policy["policy_arn"]

    def test_ec2_instance_profile_created(self):
        """EC2 instance profile is created."""
        app = App()
        stack = TapStack(
            app,
            "TestInstanceProfileStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        instance_profiles = resources.get("aws_iam_instance_profile", {})

        # Verify instance profile exists
        assert "ec2_instance_profile_test" in instance_profiles

    def test_dms_iam_role_created(self):
        """DMS IAM role is created."""
        app = App()
        stack = TapStack(
            app,
            "TestDMSIAMStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        iam_roles = resources.get("aws_iam_role", {})

        # Verify DMS role exists
        assert "dms_role_test" in iam_roles


class TestRoute53Resources:
    """Test suite for Route53 resources."""

    def test_route53_hosted_zone_created(self):
        """Route53 hosted zone is created."""
        app = App()
        stack = TapStack(
            app,
            "TestRoute53Stack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        hosted_zones = resources.get("aws_route53_zone", {})

        # Verify hosted zone exists
        assert "hosted_zone_test" in hosted_zones
        zone = hosted_zones["hosted_zone_test"]
        assert "internal.local" in zone["name"]

    def test_route53_weighted_record_created(self):
        """Route53 weighted routing record is created."""
        app = App()
        stack = TapStack(
            app,
            "TestRoute53RecordStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        records = resources.get("aws_route53_record", {})

        # Verify weighted record exists
        assert "route53_aws_test" in records
        record = records["route53_aws_test"]
        assert record["type"] == "CNAME"
        assert "weighted_routing_policy" in record


class TestSecretsManagerResources:
    """Test suite for Secrets Manager resources."""

    def test_secrets_manager_secret_created(self):
        """Secrets Manager secret is created for database credentials."""
        app = App()
        stack = TapStack(
            app,
            "TestSecretsStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        secrets = resources.get("aws_secretsmanager_secret", {})

        # Verify secret exists
        assert "db_secret_test" in secrets
        secret = secrets["db_secret_test"]
        assert secret["recovery_window_in_days"] == 0  # Immediate deletion

    def test_secrets_manager_version_created(self):
        """Secrets Manager secret version is created."""
        app = App()
        stack = TapStack(
            app,
            "TestSecretsVersionStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        secret_versions = resources.get("aws_secretsmanager_secret_version", {})

        # Verify secret version exists
        assert "db_secret_version_test" in secret_versions


class TestResourceTagging:
    """Test suite for resource tagging."""

    def test_vpc_has_required_tags(self):
        """VPC has required tags."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCTaggingStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        vpcs = resources.get("aws_vpc", {})

        vpc = vpcs["vpc_test"]
        assert "tags" in vpc
        tags = vpc["tags"]
        assert "Name" in tags
        assert "Environment" in tags

    def test_s3_bucket_has_required_tags(self):
        """S3 bucket has required tags."""
        app = App()
        stack = TapStack(
            app,
            "TestS3TaggingStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        resources = config.get("resource", {})
        s3_buckets = resources.get("aws_s3_bucket", {})

        bucket = s3_buckets["artifacts_bucket_test"]
        assert "tags" in bucket
        tags = bucket["tags"]
        assert "Name" in tags
        assert "Environment" in tags


# All test suites completed
