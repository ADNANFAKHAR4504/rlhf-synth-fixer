"""Integration tests for TAP Stack deployed infrastructure."""
import os
import sys
import json
import re
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestTapStackIntegration:
    """Integration tests validating deployed AWS resources from outputs."""

    @classmethod
    def setup_class(cls):
        """Load deployment outputs once for all tests."""
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "cfn-outputs",
            "flat-outputs.json"
        )

        if not os.path.exists(outputs_file):
            pytest.skip(f"Outputs file not found: {outputs_file}. Deployment may not have completed.")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            all_outputs = json.load(f)

        # Get the first stack's outputs (assuming single stack deployment)
        cls.stack_name = list(all_outputs.keys())[0]
        cls.outputs = all_outputs[cls.stack_name]

        # Extract environment suffix from stack name or resources
        # Pattern: TapStack{suffix} or from resource names
        match = re.search(r'TapStack(.+)', cls.stack_name)
        if match:
            cls.environment_suffix = match.group(1).lower()
        else:
            # Extract from bucket name
            logs_bucket = cls.outputs.get('logs_bucket_name', '')
            match = re.search(r'compliance-logs-(.+)', logs_bucket)
            cls.environment_suffix = match.group(1) if match else 'unknown'

    def test_outputs_structure(self):
        """Validate that all required outputs are present."""
        required_keys = [
            'vpc_id',
            'alb_dns_name',
            'ecs_cluster_name',
            'rds_cluster_endpoint',
            'logs_bucket_name',
            'assets_bucket_name',
            'kms_key_id'
        ]

        for key in required_keys:
            assert key in self.outputs, f"Missing required output: {key}"
            assert self.outputs[key], f"Output {key} is empty"
            assert isinstance(self.outputs[key], str), f"Output {key} must be a string"
            assert len(self.outputs[key]) > 0, f"Output {key} is empty string"

    def test_vpc_id_format(self):
        """Test that VPC ID has correct format."""
        vpc_id = self.outputs['vpc_id']

        # VPC ID format: vpc-xxxxxxxxxxxxxxxxx (vpc- followed by 17 hex characters)
        assert vpc_id.startswith('vpc-'), f"VPC ID should start with 'vpc-': {vpc_id}"
        assert len(vpc_id) == 21, f"VPC ID should be 21 characters long: {vpc_id}"
        assert re.match(r'^vpc-[0-9a-f]{17}$', vpc_id), f"Invalid VPC ID format: {vpc_id}"

    def test_s3_bucket_names_format(self):
        """Test that S3 bucket names follow correct format and naming conventions."""
        logs_bucket = self.outputs['logs_bucket_name']
        assets_bucket = self.outputs['assets_bucket_name']

        # Check logs bucket
        assert logs_bucket.startswith('compliance-logs-'), \
            f"Logs bucket should start with 'compliance-logs-': {logs_bucket}"
        assert self.environment_suffix in logs_bucket, \
            f"Logs bucket should contain environment suffix '{self.environment_suffix}': {logs_bucket}"

        # S3 bucket naming rules: lowercase, alphanumeric, hyphens, 3-63 chars
        assert re.match(r'^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$', logs_bucket), \
            f"Logs bucket name invalid format: {logs_bucket}"
        assert len(logs_bucket) >= 3 and len(logs_bucket) <= 63, \
            f"Logs bucket name must be 3-63 characters: {logs_bucket}"

        # Check assets bucket
        assert assets_bucket.startswith('compliance-assets-'), \
            f"Assets bucket should start with 'compliance-assets-': {assets_bucket}"
        assert self.environment_suffix in assets_bucket, \
            f"Assets bucket should contain environment suffix '{self.environment_suffix}': {assets_bucket}"

        assert re.match(r'^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$', assets_bucket), \
            f"Assets bucket name invalid format: {assets_bucket}"
        assert len(assets_bucket) >= 3 and len(assets_bucket) <= 63, \
            f"Assets bucket name must be 3-63 characters: {assets_bucket}"

    def test_ecs_cluster_name_format(self):
        """Test that ECS cluster name follows correct format."""
        cluster_name = self.outputs['ecs_cluster_name']

        assert cluster_name.startswith('compliance-cluster-'), \
            f"ECS cluster name should start with 'compliance-cluster-': {cluster_name}"
        assert self.environment_suffix in cluster_name, \
            f"ECS cluster name should contain environment suffix '{self.environment_suffix}': {cluster_name}"

        # ECS cluster names: alphanumeric, hyphens, underscores, up to 255 chars
        assert re.match(r'^[a-zA-Z0-9_-]+$', cluster_name), \
            f"ECS cluster name invalid format: {cluster_name}"
        assert len(cluster_name) <= 255, \
            f"ECS cluster name must be <= 255 characters: {cluster_name}"

    def test_alb_dns_name_format(self):
        """Test that ALB DNS name has correct format."""
        alb_dns = self.outputs['alb_dns_name']

        # ALB DNS format: name-id.region.elb.amazonaws.com
        assert alb_dns.endswith('.elb.amazonaws.com'), \
            f"ALB DNS should end with '.elb.amazonaws.com': {alb_dns}"

        # Extract region from DNS (second to last part)
        parts = alb_dns.split('.')
        assert len(parts) >= 5, f"Invalid ALB DNS format: {alb_dns}"

        region = parts[1]
        assert re.match(r'^[a-z]{2}-[a-z]+-\d+$', region), \
            f"Invalid AWS region in ALB DNS: {region}"

        # Check ALB name starts with expected prefix
        alb_name = parts[0]
        assert alb_name.startswith('comp-alb-'), \
            f"ALB name should start with 'comp-alb-': {alb_name}"

    def test_rds_cluster_endpoint_format(self):
        """Test that RDS cluster endpoint has correct format."""
        rds_endpoint = self.outputs['rds_cluster_endpoint']

        # RDS endpoint format: identifier.cluster-id.region.rds.amazonaws.com
        assert rds_endpoint.endswith('.rds.amazonaws.com'), \
            f"RDS endpoint should end with '.rds.amazonaws.com': {rds_endpoint}"

        # Extract cluster identifier
        cluster_id = rds_endpoint.split('.')[0]
        assert cluster_id.startswith('compliance-db-'), \
            f"RDS cluster ID should start with 'compliance-db-': {cluster_id}"
        assert self.environment_suffix in cluster_id, \
            f"RDS cluster ID should contain environment suffix '{self.environment_suffix}': {cluster_id}"

        # Check for 'cluster' in endpoint (Aurora cluster endpoint)
        assert 'cluster' in rds_endpoint, \
            f"RDS endpoint should contain 'cluster' for Aurora: {rds_endpoint}"

    def test_kms_key_id_format(self):
        """Test that KMS key ID has correct UUID format."""
        kms_key_id = self.outputs['kms_key_id']

        # KMS key ID is a UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        assert re.match(uuid_pattern, kms_key_id), \
            f"KMS key ID should be a valid UUID: {kms_key_id}"

    def test_environment_suffix_consistency(self):
        """Test that environment suffix is consistently used across all resources."""
        resources_with_suffix = [
            ('logs_bucket_name', self.outputs['logs_bucket_name']),
            ('assets_bucket_name', self.outputs['assets_bucket_name']),
            ('ecs_cluster_name', self.outputs['ecs_cluster_name']),
            ('rds_cluster_endpoint', self.outputs['rds_cluster_endpoint'])
        ]

        for resource_name, resource_value in resources_with_suffix:
            assert self.environment_suffix in resource_value, \
                f"{resource_name} should contain environment suffix '{self.environment_suffix}': {resource_value}"

    def test_resource_naming_conventions(self):
        """Test that all resources follow AWS naming conventions."""
        # VPC ID
        assert re.match(r'^vpc-[0-9a-f]{17}$', self.outputs['vpc_id'])

        # S3 buckets (lowercase, alphanumeric, hyphens)
        assert re.match(r'^[a-z0-9][a-z0-9-]+[a-z0-9]$', self.outputs['logs_bucket_name'])
        assert re.match(r'^[a-z0-9][a-z0-9-]+[a-z0-9]$', self.outputs['assets_bucket_name'])

        # ECS cluster (alphanumeric, hyphens, underscores)
        assert re.match(r'^[a-zA-Z0-9_-]+$', self.outputs['ecs_cluster_name'])

        # ALB DNS
        assert re.match(r'^[a-z0-9-]+\.[a-z]{2}-[a-z]+-\d+\.elb\.amazonaws\.com$',
                       self.outputs['alb_dns_name'])

        # RDS endpoint
        assert re.match(r'^[a-z0-9-]+\.cluster-[a-z0-9]+\.[a-z]{2}-[a-z]+-\d+\.rds\.amazonaws\.com$',
                       self.outputs['rds_cluster_endpoint'])

        # KMS key ID (UUID)
        assert re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                       self.outputs['kms_key_id'])

    def test_compliance_prefix_in_resources(self):
        """Test that resources use 'compliance' prefix as per requirements."""
        assert 'compliance' in self.outputs['logs_bucket_name'].lower()
        assert 'compliance' in self.outputs['assets_bucket_name'].lower()
        assert 'compliance' in self.outputs['ecs_cluster_name'].lower()
        assert 'compliance' in self.outputs['rds_cluster_endpoint'].lower()

    def test_alb_name_length_constraint(self):
        """Test that ALB name respects 32-character limit."""
        alb_dns = self.outputs['alb_dns_name']
        alb_name = alb_dns.split('.')[0]

        # Extract just the name part before the random ID
        # Format: comp-alb-{suffix}-{random}
        assert len(alb_name) <= 32, \
            f"ALB name must be <= 32 characters (AWS limit): {alb_name} ({len(alb_name)} chars)"

    def test_rds_cluster_identifier_conventions(self):
        """Test RDS cluster identifier follows naming conventions."""
        rds_endpoint = self.outputs['rds_cluster_endpoint']
        cluster_id = rds_endpoint.split('.')[0]

        # RDS cluster identifier: lowercase, alphanumeric, hyphens
        assert re.match(r'^[a-z][a-z0-9-]*$', cluster_id), \
            f"RDS cluster identifier must start with letter, contain only lowercase, numbers, hyphens: {cluster_id}"

        # Length check (1-63 characters)
        assert len(cluster_id) >= 1 and len(cluster_id) <= 63, \
            f"RDS cluster identifier must be 1-63 characters: {cluster_id} ({len(cluster_id)} chars)"

    def test_stack_name_format(self):
        """Test that stack name follows expected format."""
        assert self.stack_name.startswith('TapStack'), \
            f"Stack name should start with 'TapStack': {self.stack_name}"

        # Verify environment suffix is part of stack name
        assert len(self.environment_suffix) > 0, \
            "Environment suffix should be extracted from stack name or resources"

    def test_outputs_data_types(self):
        """Test that all outputs are strings and non-empty."""
        for key, value in self.outputs.items():
            assert isinstance(value, str), f"Output {key} should be string, got {type(value)}"
            assert len(value.strip()) > 0, f"Output {key} should not be empty or whitespace"
            assert value == value.strip(), f"Output {key} should not have leading/trailing whitespace"

    def test_no_sensitive_data_in_outputs(self):
        """Test that outputs don't contain sensitive data patterns."""
        sensitive_patterns = [
            r'password',
            r'secret',
            r'key.*[=:]',  # key=value or key:value patterns
            r'token',
            r'credentials'
        ]

        for key, value in self.outputs.items():
            for pattern in sensitive_patterns:
                assert not re.search(pattern, value.lower()), \
                    f"Output {key} may contain sensitive data matching pattern '{pattern}': {value}"

    def test_aws_region_in_resources(self):
        """Test that AWS region is consistent across resources."""
        # Extract regions from different resources
        alb_region = self.outputs['alb_dns_name'].split('.')[1]
        rds_region = self.outputs['rds_cluster_endpoint'].split('.')[-4]

        # Verify both are valid AWS regions
        aws_region_pattern = r'^[a-z]{2}-[a-z]+-\d+$'
        assert re.match(aws_region_pattern, alb_region), f"Invalid ALB region: {alb_region}"
        assert re.match(aws_region_pattern, rds_region), f"Invalid RDS region: {rds_region}"

        # Verify regions are consistent
        assert alb_region == rds_region, \
            f"ALB region ({alb_region}) and RDS region ({rds_region}) should match"

    def test_deployment_outputs_completeness(self):
        """Test that deployment completed successfully with all outputs."""
        # If we got here, all outputs exist and are valid
        output_count = len(self.outputs)
        assert output_count == 7, \
            f"Expected exactly 7 outputs, got {output_count}: {list(self.outputs.keys())}"

    def test_resource_identifiers_uniqueness(self):
        """Test that all resource identifiers are unique."""
        values = list(self.outputs.values())
        unique_values = set(values)

        assert len(values) == len(unique_values), \
            "All output values should be unique (no duplicate resource identifiers)"
