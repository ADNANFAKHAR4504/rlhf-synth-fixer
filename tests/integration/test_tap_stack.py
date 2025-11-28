"""Integration tests for Cross-Region Migration Stack."""
import json
import os
from pathlib import Path


class TestDeployedInfrastructure:
    """Integration tests for deployed infrastructure."""

    def setup_method(self):
        """Set up test environment with deployment outputs."""
        # Load outputs from deployment
        outputs_path = Path("cfn-outputs") / "flat-outputs.json"

        if outputs_path.exists():
            with open(outputs_path, 'r') as f:
                raw_outputs = json.load(f)
        else:
            raw_outputs = {}

        # CDKTF outputs are nested under stack name (e.g., {"TapStackmanual": {...}})
        # Flatten by extracting the first stack's outputs
        self.outputs = {}
        if raw_outputs:
            for stack_name, stack_outputs in raw_outputs.items():
                if isinstance(stack_outputs, dict):
                    self.outputs = stack_outputs
                    break

        # Check if outputs were loaded
        self.has_outputs = len(self.outputs) > 0

    def test_vpc_deployed_successfully(self):
        """Verify VPC is deployed with correct CIDR."""
        if not self.has_outputs:
            assert False, "No deployment outputs found. Deploy infrastructure first."

        # Check VPC ID output exists
        assert "vpc_id" in self.outputs, "VPC ID not found in outputs"
        vpc_id = self.outputs["vpc_id"]
        assert vpc_id.startswith("vpc-"), f"Invalid VPC ID format: {vpc_id}"

        # Check VPC CIDR
        assert "vpc_cidr" in self.outputs, "VPC CIDR not found in outputs"
        assert self.outputs["vpc_cidr"] == "10.1.0.0/16", f"Unexpected VPC CIDR: {self.outputs['vpc_cidr']}"

    def test_subnets_deployed_successfully(self):
        """Verify public and private subnets are deployed."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Check public subnets
        assert "public_subnet_ids" in self.outputs, "Public subnet IDs not found"
        public_subnets = json.loads(self.outputs["public_subnet_ids"])
        assert len(public_subnets) == 3, f"Expected 3 public subnets, got {len(public_subnets)}"

        for subnet_id in public_subnets:
            assert subnet_id.startswith("subnet-"), f"Invalid subnet ID: {subnet_id}"

        # Check private subnets
        assert "private_subnet_ids" in self.outputs, "Private subnet IDs not found"
        private_subnets = json.loads(self.outputs["private_subnet_ids"])
        assert len(private_subnets) == 3, f"Expected 3 private subnets, got {len(private_subnets)}"

        for subnet_id in private_subnets:
            assert subnet_id.startswith("subnet-"), f"Invalid subnet ID: {subnet_id}"

    def test_aurora_cluster_deployed(self):
        """Verify Aurora cluster is deployed with endpoints."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Check writer endpoint
        assert "aurora_cluster_endpoint" in self.outputs, "Aurora cluster endpoint not found"
        writer_endpoint = self.outputs["aurora_cluster_endpoint"]
        assert ".rds.amazonaws.com" in writer_endpoint, f"Invalid Aurora endpoint: {writer_endpoint}"

        # Check reader endpoint
        assert "aurora_cluster_reader_endpoint" in self.outputs, "Aurora reader endpoint not found"
        reader_endpoint = self.outputs["aurora_cluster_reader_endpoint"]
        assert ".rds.amazonaws.com" in reader_endpoint, f"Invalid reader endpoint: {reader_endpoint}"

    def test_alb_deployed_with_dns(self):
        """Verify Application Load Balancer is deployed with DNS name."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Check ALB DNS name
        assert "alb_dns_name" in self.outputs, "ALB DNS name not found"
        alb_dns = self.outputs["alb_dns_name"]
        assert ".elb.amazonaws.com" in alb_dns, f"Invalid ALB DNS: {alb_dns}"
        assert alb_dns.startswith("payment-alb-"), f"Unexpected ALB DNS format: {alb_dns}"

    def test_auto_scaling_group_deployed(self):
        """Verify Auto Scaling Group is deployed."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Check ASG name
        assert "asg_name" in self.outputs, "ASG name not found"
        asg_name = self.outputs["asg_name"]
        assert "payment-asg-" in asg_name, f"Unexpected ASG name: {asg_name}"

    def test_route53_zone_created(self):
        """Verify Route 53 hosted zone is created."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Check hosted zone ID
        assert "route53_zone_id" in self.outputs, "Route 53 zone ID not found"
        zone_id = self.outputs["route53_zone_id"]
        assert zone_id.startswith("Z"), f"Invalid Route 53 zone ID: {zone_id}"

    def test_step_functions_deployed(self):
        """Verify Step Functions state machine is deployed."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Check state machine ARN
        assert "state_machine_arn" in self.outputs, "State machine ARN not found"
        sfn_arn = self.outputs["state_machine_arn"]
        assert "arn:aws:states:" in sfn_arn, f"Invalid state machine ARN: {sfn_arn}"
        assert "migration-workflow-" in sfn_arn, f"Unexpected state machine name: {sfn_arn}"

    def test_vpc_peering_deployed(self):
        """Verify VPC peering connection is deployed."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Check peering connection ID
        assert "vpc_peering_id" in self.outputs, "VPC peering ID not found"
        peering_id = self.outputs["vpc_peering_id"]
        assert peering_id.startswith("pcx-"), f"Invalid VPC peering ID: {peering_id}"

    def test_kms_key_deployed(self):
        """Verify KMS key is deployed."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Check KMS key ID
        assert "kms_key_id" in self.outputs, "KMS key ID not found"
        key_id = self.outputs["kms_key_id"]
        assert len(key_id) == 36, f"Invalid KMS key ID length: {key_id}"

        # Check KMS key ARN
        assert "kms_key_arn" in self.outputs, "KMS key ARN not found"
        key_arn = self.outputs["kms_key_arn"]
        assert "arn:aws:kms:" in key_arn, f"Invalid KMS key ARN: {key_arn}"

    def test_migration_runbook_output(self):
        """Verify migration runbook is generated."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Check migration runbook
        assert "migration_runbook" in self.outputs, "Migration runbook not found"
        runbook = self.outputs["migration_runbook"]

        # Verify runbook contains key migration concepts (simplified runbook)
        assert "Migration runbook" in runbook, "Missing runbook prefix"
        assert "us-east-1" in runbook, "Missing source region"
        assert "eu-west-1" in runbook, "Missing target region"
        assert "weighted routing" in runbook, "Missing weighted routing mention"

    def test_all_required_outputs_present(self):
        """Verify all 14 required outputs are present."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

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

        missing_outputs = [out for out in required_outputs if out not in self.outputs]

        assert len(missing_outputs) == 0, f"Missing required outputs: {missing_outputs}"

    def test_resource_naming_consistency(self):
        """Verify resource names follow naming convention."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        # Extract environment suffix from any resource name
        alb_dns = self.outputs.get("alb_dns_name", "")
        if alb_dns:
            # ALB DNS format: payment-alb-{suffix}-{random}.region.elb.amazonaws.com
            parts = alb_dns.split("-")
            if len(parts) >= 3:
                env_suffix = parts[2]

                # Verify suffix is present in other resource names
                asg_name = self.outputs.get("asg_name", "")
                if asg_name:
                    assert env_suffix in asg_name, f"Environment suffix {env_suffix} not in ASG name"

                sfn_arn = self.outputs.get("state_machine_arn", "")
                if sfn_arn:
                    assert env_suffix in sfn_arn, f"Environment suffix {env_suffix} not in SFN ARN"


class TestResourceConfiguration:
    """Integration tests for resource configuration validation."""

    def setup_method(self):
        """Set up test environment."""
        # Load outputs
        outputs_path = Path("cfn-outputs") / "flat-outputs.json"

        if outputs_path.exists():
            with open(outputs_path, 'r') as f:
                raw_outputs = json.load(f)
        else:
            raw_outputs = {}

        # CDKTF outputs are nested under stack name (e.g., {"TapStackmanual": {...}})
        # Flatten by extracting the first stack's outputs
        self.outputs = {}
        if raw_outputs:
            for stack_name, stack_outputs in raw_outputs.items():
                if isinstance(stack_outputs, dict):
                    self.outputs = stack_outputs
                    break

        self.has_outputs = len(self.outputs) > 0

    def test_vpc_cidr_is_correct(self):
        """Verify VPC uses the correct CIDR block."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        vpc_cidr = self.outputs.get("vpc_cidr")
        assert vpc_cidr == "10.1.0.0/16", f"Expected CIDR 10.1.0.0/16, got {vpc_cidr}"

    def test_aurora_endpoint_format(self):
        """Verify Aurora endpoints have correct format."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        writer_endpoint = self.outputs.get("aurora_cluster_endpoint", "")
        assert writer_endpoint, "Writer endpoint is empty"
        assert "payment-cluster-" in writer_endpoint, "Writer endpoint doesn't contain cluster identifier"

        reader_endpoint = self.outputs.get("aurora_cluster_reader_endpoint", "")
        assert reader_endpoint, "Reader endpoint is empty"
        assert "payment-cluster-" in reader_endpoint, "Reader endpoint doesn't contain cluster identifier"

    def test_migration_runbook_completeness(self):
        """Verify migration runbook has essential information."""
        if not self.has_outputs:
            assert False, "No deployment outputs found"

        runbook = self.outputs.get("migration_runbook", "")

        # Verify runbook is present and describes migration
        assert runbook, "Runbook is empty"
        assert "migration" in runbook.lower(), "Runbook should mention migration"
        assert "traffic" in runbook.lower() or "routing" in runbook.lower(), "Runbook should mention traffic/routing"
