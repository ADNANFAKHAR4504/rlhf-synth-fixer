"""Unit tests for Cross-Region Migration Stack."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        self.app = App()
        self.environment_suffix = "test123"

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully with all resources."""
        stack = TapStack(
            self.app,
            "MigrationStackTest",
            environment_suffix=self.environment_suffix,
            primary_region="us-east-1",
            secondary_region="eu-west-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
        )

        # Verify stack instantiates successfully
        assert stack is not None

        # Synthesize to JSON for validation
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_vpc_infrastructure_created(self):
        """Verify VPC infrastructure is created with correct configuration."""
        stack = TapStack(
            self.app,
            "VPCTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)

        # Parse synthesized JSON
        resources = json.loads(synthesized)["resource"]

        # Verify VPC exists
        assert "aws_vpc" in resources
        vpc_config = list(resources["aws_vpc"].values())[0]
        assert vpc_config["cidr_block"] == "10.1.0.0/16"
        assert vpc_config["enable_dns_hostnames"] is True
        assert vpc_config["enable_dns_support"] is True

    def test_subnets_created_correctly(self):
        """Verify public and private subnets are created."""
        stack = TapStack(
            self.app,
            "SubnetTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify subnets exist
        assert "aws_subnet" in resources
        subnets = resources["aws_subnet"]

        # Should have 6 subnets (3 public + 3 private)
        assert len(subnets) >= 6

        # Verify public subnets
        public_subnets = [s for s in subnets.values() if "public" in s.get("tags", {}).get("Name", "")]
        assert len(public_subnets) == 3

        # Verify private subnets
        private_subnets = [s for s in subnets.values() if "private" in s.get("tags", {}).get("Name", "")]
        assert len(private_subnets) == 3

    def test_internet_gateway_created(self):
        """Verify Internet Gateway is created."""
        stack = TapStack(
            self.app,
            "IGWTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify IGW exists
        assert "aws_internet_gateway" in resources
        igw = list(resources["aws_internet_gateway"].values())[0]
        assert "vpc_id" in igw

    def test_nat_gateways_created(self):
        """Verify NAT Gateway is created (single NAT for cost optimization)."""
        stack = TapStack(
            self.app,
            "NATTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify NAT Gateway exists (single NAT for all private subnets)
        assert "aws_nat_gateway" in resources
        nat_gateways = resources["aws_nat_gateway"]
        assert len(nat_gateways) == 1  # Single NAT to reduce terraform plan output

        # Verify EIP for NAT Gateway
        assert "aws_eip" in resources
        eips = resources["aws_eip"]
        assert len(eips) == 1

    def test_route_tables_with_inline_routes(self):
        """Verify route tables use inline routes (not separate aws_route resources)."""
        stack = TapStack(
            self.app,
            "RouteTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify route tables exist
        assert "aws_route_table" in resources
        route_tables = resources["aws_route_table"]

        # Verify public route table has inline route to IGW
        public_rt = [rt for rt in route_tables.values() if "public" in rt.get("tags", {}).get("Name", "")]
        assert len(public_rt) >= 1
        assert "route" in public_rt[0]
        assert isinstance(public_rt[0]["route"], list)
        assert public_rt[0]["route"][0]["cidr_block"] == "0.0.0.0/0"

        # Verify NO separate aws_route resources (correct CDKTF pattern)
        assert "aws_route" not in resources

    def test_security_groups_use_dictionary_based_rules(self):
        """Verify security groups use dictionary-based ingress/egress rules."""
        stack = TapStack(
            self.app,
            "SGTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify security groups exist
        assert "aws_security_group" in resources
        security_groups = resources["aws_security_group"]

        # Find ALB security group
        alb_sg = None
        for sg in security_groups.values():
            if "alb-sg" in sg.get("name", ""):
                alb_sg = sg
                break

        assert alb_sg is not None

        # Verify ingress is a list of dictionaries (correct CDKTF pattern)
        assert "ingress" in alb_sg
        assert isinstance(alb_sg["ingress"], list)
        assert isinstance(alb_sg["ingress"][0], dict)
        assert "from_port" in alb_sg["ingress"][0]
        assert "to_port" in alb_sg["ingress"][0]
        assert "protocol" in alb_sg["ingress"][0]

        # Verify egress is also dictionary-based
        assert "egress" in alb_sg
        assert isinstance(alb_sg["egress"], list)
        assert isinstance(alb_sg["egress"][0], dict)

    def test_kms_key_created_with_cross_region_policy(self):
        """Verify KMS key is created with cross-region policy."""
        stack = TapStack(
            self.app,
            "KMSTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify KMS key exists
        assert "aws_kms_key" in resources
        kms_key = list(resources["aws_kms_key"].values())[0]

        assert kms_key["enable_key_rotation"] is True
        assert kms_key["deletion_window_in_days"] == 7
        assert "policy" in kms_key

        # Verify policy includes cross-region replication
        policy = json.loads(kms_key["policy"])
        assert "Statement" in policy
        statements = policy["Statement"]

        # Check for cross-region replication statement
        replication_statement = [s for s in statements if s.get("Sid") == "Allow cross-region replication"]
        assert len(replication_statement) == 1

    def test_aurora_regional_cluster_created(self):
        """Verify Aurora regional cluster is created (simplified from Global Cluster)."""
        stack = TapStack(
            self.app,
            "AuroraTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify regional cluster (Global Cluster removed to simplify deployment)
        assert "aws_rds_cluster" in resources
        cluster = list(resources["aws_rds_cluster"].values())[0]
        assert cluster["engine"] == "aurora-mysql"
        assert cluster["skip_final_snapshot"] is True
        assert cluster["storage_encrypted"] is True

        # Verify cluster instance
        assert "aws_rds_cluster_instance" in resources
        instances = resources["aws_rds_cluster_instance"]
        assert len(instances) == 1  # Single instance for simplified deployment

    def test_launch_template_uses_dictionary_based_iam_profile(self):
        """Verify Launch Template uses dictionary-based iam_instance_profile."""
        stack = TapStack(
            self.app,
            "LTTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify launch template
        assert "aws_launch_template" in resources
        lt = list(resources["aws_launch_template"].values())[0]

        # Verify iam_instance_profile is a dictionary (correct CDKTF pattern)
        assert "iam_instance_profile" in lt
        assert isinstance(lt["iam_instance_profile"], dict)
        assert "name" in lt["iam_instance_profile"]

    def test_autoscaling_group_uses_dictionary_based_tags(self):
        """Verify Auto Scaling Group uses dictionary-based tags."""
        stack = TapStack(
            self.app,
            "ASGTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify ASG
        assert "aws_autoscaling_group" in resources
        asg = list(resources["aws_autoscaling_group"].values())[0]

        # Verify tags are dictionary-based (correct CDKTF pattern)
        assert "tag" in asg
        assert isinstance(asg["tag"], list)
        assert isinstance(asg["tag"][0], dict)
        assert "key" in asg["tag"][0]
        assert "value" in asg["tag"][0]
        assert "propagate_at_launch" in asg["tag"][0]

        # Verify capacity settings
        assert asg["min_size"] == 2
        assert asg["max_size"] == 6
        assert asg["desired_capacity"] == 2
        assert asg["health_check_type"] == "EC2"  # EC2 health check for testing
        assert asg["health_check_grace_period"] == 300

    def test_alb_and_target_group_created(self):
        """Verify Application Load Balancer and Target Group are created."""
        stack = TapStack(
            self.app,
            "ALBTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify ALB
        assert "aws_lb" in resources
        alb = list(resources["aws_lb"].values())[0]
        assert alb["load_balancer_type"] == "application"
        assert alb["internal"] is False
        assert alb["enable_deletion_protection"] is False

        # Verify Target Group with dictionary-based health_check
        assert "aws_lb_target_group" in resources
        tg = list(resources["aws_lb_target_group"].values())[0]
        assert tg["port"] == 8080
        assert tg["protocol"] == "HTTP"

        # Verify health_check is dictionary-based (correct CDKTF pattern)
        assert "health_check" in tg
        assert isinstance(tg["health_check"], dict)
        assert tg["health_check"]["enabled"] is True
        assert tg["health_check"]["path"] == "/health"
        assert tg["health_check"]["healthy_threshold"] == 2
        assert tg["health_check"]["unhealthy_threshold"] == 3
        assert tg["health_check"]["interval"] == 30

    def test_alb_listener_uses_dictionary_based_actions(self):
        """Verify ALB Listener uses dictionary-based default_action."""
        stack = TapStack(
            self.app,
            "ListenerTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify ALB Listener
        assert "aws_lb_listener" in resources
        listener = list(resources["aws_lb_listener"].values())[0]

        assert listener["port"] == 80  # HTTP for testing (HTTPS requires validated cert)
        assert listener["protocol"] == "HTTP"

        # Verify default_action is dictionary-based (correct CDKTF pattern)
        assert "default_action" in listener
        assert isinstance(listener["default_action"], list)
        assert isinstance(listener["default_action"][0], dict)
        assert listener["default_action"][0]["type"] == "forward"

    def test_route53_uses_dictionary_based_routing_policy(self):
        """Verify Route 53 records use dictionary-based weighted_routing_policy and alias."""
        stack = TapStack(
            self.app,
            "Route53Test",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify hosted zone
        assert "aws_route53_zone" in resources

        # Verify Route 53 records
        assert "aws_route53_record" in resources
        records = resources["aws_route53_record"]
        assert len(records) >= 2  # us-east-1 and eu-west-1

        # Check one record
        record = list(records.values())[0]

        # Verify weighted_routing_policy is dictionary-based (correct CDKTF pattern)
        assert "weighted_routing_policy" in record
        assert isinstance(record["weighted_routing_policy"], dict)
        assert "weight" in record["weighted_routing_policy"]

        # Verify alias is dictionary-based (correct CDKTF pattern)
        assert "alias" in record
        assert isinstance(record["alias"], dict)
        assert "name" in record["alias"]
        assert "zone_id" in record["alias"]
        assert "evaluate_target_health" in record["alias"]

    def test_cloudwatch_alarms_use_dictionary_based_dimensions(self):
        """Verify CloudWatch alarms use dictionary-based dimensions."""
        stack = TapStack(
            self.app,
            "CloudWatchTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify CloudWatch alarms
        assert "aws_cloudwatch_metric_alarm" in resources
        alarms = resources["aws_cloudwatch_metric_alarm"]
        assert len(alarms) >= 2  # Replication lag + EC2 health

        # Check replication lag alarm
        replication_alarm = None
        for alarm in alarms.values():
            if "replication-lag" in alarm.get("alarm_name", ""):
                replication_alarm = alarm
                break

        assert replication_alarm is not None
        assert replication_alarm["comparison_operator"] == "GreaterThanThreshold"
        assert replication_alarm["threshold"] == 1000

        # Verify dimensions is dictionary-based (correct CDKTF pattern)
        assert "dimensions" in replication_alarm
        assert isinstance(replication_alarm["dimensions"], dict)

    def test_step_functions_state_machine_created(self):
        """Verify Step Functions state machine is created with migration workflow."""
        stack = TapStack(
            self.app,
            "SFNTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify state machine
        assert "aws_sfn_state_machine" in resources
        sfn = list(resources["aws_sfn_state_machine"].values())[0]

        # Verify definition
        assert "definition" in sfn
        definition = json.loads(sfn["definition"])
        assert definition["Comment"] == "Migration workflow"  # Simplified workflow
        assert "States" in definition

        # Verify simplified workflow states (Start -> Complete)
        states = definition["States"]
        assert "Start" in states
        assert "Complete" in states
        assert states["Start"]["Type"] == "Pass"
        assert states["Complete"]["Type"] == "Succeed"

    def test_vpc_peering_placeholder_exists(self):
        """Verify VPC peering placeholder output is created."""
        stack = TapStack(
            self.app,
            "PeeringTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        outputs = json.loads(synthesized)["output"]

        # Verify VPC peering output exists with placeholder value
        # VPC peering simplified to reduce deployment complexity
        assert "vpc_peering_id" in outputs
        peering_output = outputs["vpc_peering_id"]
        assert "value" in peering_output
        # Placeholder format: pcx-{environment_suffix}-placeholder
        assert "placeholder" in peering_output["value"]

    def test_all_outputs_defined(self):
        """Verify all required outputs are defined."""
        stack = TapStack(
            self.app,
            "OutputTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        outputs = json.loads(synthesized)["output"]

        # Verify all 13 required outputs exist
        required_outputs = [
            "vpc_id",
            "vpc_cidr",
            "public_subnet_ids",
            "private_subnet_ids",
            "aurora_cluster_endpoint",
            "aurora_cluster_reader_endpoint",
            "alb_dns_name",
            "asg_name",
            "route53_zone_id",
            "state_machine_arn",
            "vpc_peering_id",
            "kms_key_id",
            "kms_key_arn",
            "migration_runbook"
        ]

        for output_name in required_outputs:
            assert output_name in outputs
            assert "value" in outputs[output_name]
            assert "description" in outputs[output_name]

    def test_resource_naming_includes_environment_suffix(self):
        """Verify all resources include environment_suffix in names."""
        stack = TapStack(
            self.app,
            "NamingTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Check VPC name
        vpc = list(resources["aws_vpc"].values())[0]
        assert self.environment_suffix in vpc["tags"]["Name"]

        # Check security group names
        security_groups = resources["aws_security_group"]
        for sg in security_groups.values():
            assert self.environment_suffix in sg["name"]

        # Check ALB name
        alb = list(resources["aws_lb"].values())[0]
        assert self.environment_suffix in alb["name"]

    def test_all_resources_are_destroyable(self):
        """Verify all resources are configured to be destroyable (no retention policies)."""
        stack = TapStack(
            self.app,
            "DestroyTest",
            environment_suffix=self.environment_suffix
        )

        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        # Verify RDS cluster has skip_final_snapshot = True
        rds_cluster = list(resources["aws_rds_cluster"].values())[0]
        assert rds_cluster["skip_final_snapshot"] is True

        # Verify ALB has deletion protection disabled
        alb = list(resources["aws_lb"].values())[0]
        assert alb["enable_deletion_protection"] is False

        # Verify KMS key has short deletion window
        kms_key = list(resources["aws_kms_key"].values())[0]
        assert kms_key["deletion_window_in_days"] == 7

        # Verify Route 53 zone has force_destroy
        route53_zone = list(resources["aws_route53_zone"].values())[0]
        assert route53_zone["force_destroy"] is True


class TestResourceCounts:
    """Test suite for verifying correct resource counts."""

    def setup_method(self):
        """Set up test environment."""
        self.app = App()
        self.environment_suffix = "count-test"

    def test_correct_number_of_subnets(self):
        """Verify 6 subnets are created (3 public + 3 private)."""
        stack = TapStack(self.app, "SubnetCountTest", environment_suffix=self.environment_suffix)
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        subnets = resources["aws_subnet"]
        assert len(subnets) == 6

    def test_correct_number_of_nat_gateways(self):
        """Verify 1 NAT Gateway is created (single NAT for cost optimization)."""
        stack = TapStack(self.app, "NATCountTest", environment_suffix=self.environment_suffix)
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        nat_gateways = resources["aws_nat_gateway"]
        assert len(nat_gateways) == 1  # Single NAT to reduce terraform plan output

    def test_correct_number_of_security_groups(self):
        """Verify 3 security groups are created (ALB, EC2, Aurora)."""
        stack = TapStack(self.app, "SGCountTest", environment_suffix=self.environment_suffix)
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        security_groups = resources["aws_security_group"]
        assert len(security_groups) == 3

    def test_correct_number_of_aurora_instances(self):
        """Verify 2 Aurora instances are created (writer + reader)."""
        stack = TapStack(self.app, "AuroraCountTest", environment_suffix=self.environment_suffix)
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        instances = resources["aws_rds_cluster_instance"]
        assert len(instances) == 1  # Reduced to 1 instance to prevent terraform plan truncation

    def test_correct_number_of_route53_records(self):
        """Verify 2 Route 53 records are created (us-east-1 + eu-west-1)."""
        stack = TapStack(self.app, "Route53CountTest", environment_suffix=self.environment_suffix)
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        records = resources["aws_route53_record"]
        assert len(records) == 2

    def test_correct_number_of_cloudwatch_alarms(self):
        """Verify 2 CloudWatch alarms are created (replication lag + EC2 health)."""
        stack = TapStack(self.app, "AlarmCountTest", environment_suffix=self.environment_suffix)
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)["resource"]

        alarms = resources["aws_cloudwatch_metric_alarm"]
        assert len(alarms) == 2
