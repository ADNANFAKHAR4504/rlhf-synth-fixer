"""Unit tests for GlobalStack."""
import pytest
import json
from cdktf import Testing
from lib.stacks.global_stack import GlobalStack


class TestGlobalStack:
    """Test suite for GlobalStack infrastructure."""

    @pytest.fixture
    def stack(self):
        """Create a GlobalStack instance for testing."""
        app = Testing.app()
        return GlobalStack(
            app,
            "test-global",
            environment_suffix="test",
            primary_endpoint="primary-api.example.com",
            secondary_endpoint="secondary-api.example.com",
            primary_region="us-east-1",
            secondary_region="us-west-2"
        )

    @pytest.fixture
    def synthesized(self, stack):
        """Synthesize the stack and return JSON."""
        return Testing.synth(stack)

    def test_stack_creation(self, stack):
        """Test that stack is created successfully."""
        assert stack is not None
        assert stack.environment_suffix == "test"
        assert stack.primary_endpoint == "primary-api.example.com"
        assert stack.secondary_endpoint == "secondary-api.example.com"

    def test_patient_records_table_created(self, synthesized):
        """Test that patient records DynamoDB table is created."""
        resources = json.loads(synthesized)
        tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        patient_table = next(t for t in tables if "patient-records" in t["name"])
        assert patient_table is not None
        assert patient_table["name"] == "healthcare-patient-records-test"
        assert patient_table["billing_mode"] == "PAY_PER_REQUEST"
        assert patient_table["hash_key"] == "patient_id"
        assert patient_table["range_key"] == "record_timestamp"

    def test_patient_records_attributes(self, synthesized):
        """Test that patient records table has correct attributes."""
        resources = json.loads(synthesized)
        tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        patient_table = next(t for t in tables if "patient-records" in t["name"])

        attributes = patient_table["attribute"]
        assert len(attributes) == 2

        patient_id_attr = next(a for a in attributes if a["name"] == "patient_id")
        assert patient_id_attr["type"] == "S"

        timestamp_attr = next(a for a in attributes if a["name"] == "record_timestamp")
        assert timestamp_attr["type"] == "N"

    def test_patient_records_pitr_enabled(self, synthesized):
        """Test that point-in-time recovery is enabled."""
        resources = json.loads(synthesized)
        tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        patient_table = next(t for t in tables if "patient-records" in t["name"])
        assert patient_table["point_in_time_recovery"]["enabled"] is True

    def test_patient_records_stream_enabled(self, synthesized):
        """Test that DynamoDB streams are enabled."""
        resources = json.loads(synthesized)
        tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        patient_table = next(t for t in tables if "patient-records" in t["name"])
        assert patient_table["stream_enabled"] is True
        assert patient_table["stream_view_type"] == "NEW_AND_OLD_IMAGES"

    def test_patient_records_replica_configured(self, synthesized):
        """Test that table replica is configured for us-west-2."""
        resources = json.loads(synthesized)
        tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        patient_table = next(t for t in tables if "patient-records" in t["name"])
        assert len(patient_table["replica"]) == 1
        assert patient_table["replica"][0]["region_name"] == "us-west-2"

    def test_audit_logs_table_created(self, synthesized):
        """Test that audit logs DynamoDB table is created."""
        resources = json.loads(synthesized)
        tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        audit_table = next(t for t in tables if "audit-logs" in t["name"])
        assert audit_table is not None
        assert audit_table["name"] == "healthcare-audit-logs-test"
        assert audit_table["billing_mode"] == "PAY_PER_REQUEST"
        assert audit_table["hash_key"] == "audit_id"
        assert audit_table["range_key"] == "timestamp"

    def test_audit_logs_attributes(self, synthesized):
        """Test that audit logs table has correct attributes."""
        resources = json.loads(synthesized)
        tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        audit_table = next(t for t in tables if "audit-logs" in t["name"])

        attributes = audit_table["attribute"]
        assert len(attributes) == 2

        audit_id_attr = next(a for a in attributes if a["name"] == "audit_id")
        assert audit_id_attr["type"] == "S"

        timestamp_attr = next(a for a in attributes if a["name"] == "timestamp")
        assert timestamp_attr["type"] == "N"

    def test_audit_logs_pitr_enabled(self, synthesized):
        """Test that point-in-time recovery is enabled for audit logs."""
        resources = json.loads(synthesized)
        tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        audit_table = next(t for t in tables if "audit-logs" in t["name"])
        assert audit_table["point_in_time_recovery"]["enabled"] is True

    def test_route53_hosted_zone_created(self, synthesized):
        """Test that Route 53 hosted zone is created."""
        resources = json.loads(synthesized)
        zones = [
            r for r in resources.get("resource", {}).get("aws_route53_zone", {}).values()
        ]
        assert len(zones) > 0
        zone = zones[0]
        assert zone["name"] == "healthcare-dr-test.com"

    def test_health_checks_created(self, synthesized):
        """Test that health checks are created for both regions."""
        resources = json.loads(synthesized)
        health_checks = [
            r for r in resources.get("resource", {}).get("aws_route53_health_check", {}).values()
        ]
        assert len(health_checks) == 2

        for check in health_checks:
            assert check["type"] == "HTTPS"
            assert check["resource_path"] == "/health"
            assert check["failure_threshold"] == 3
            assert check["request_interval"] == 30

    def test_route53_records_created(self, synthesized):
        """Test that Route 53 records are created with weighted routing."""
        resources = json.loads(synthesized)
        records = [
            r for r in resources.get("resource", {}).get("aws_route53_record", {}).values()
        ]
        assert len(records) == 2

        # Check primary record (70% weight)
        primary = next(r for r in records if r["set_identifier"] == "primary")
        assert primary["name"] == "api.healthcare-dr-test.com"
        assert primary["type"] == "CNAME"
        assert primary["ttl"] == 60
        assert primary["records"] == ["primary-api.example.com"]
        assert primary["weighted_routing_policy"]["weight"] == 70

        # Check secondary record (30% weight)
        secondary = next(r for r in records if r["set_identifier"] == "secondary")
        assert secondary["name"] == "api.healthcare-dr-test.com"
        assert secondary["type"] == "CNAME"
        assert secondary["ttl"] == 60
        assert secondary["records"] == ["secondary-api.example.com"]
        assert secondary["weighted_routing_policy"]["weight"] == 30

    def test_route53_records_have_health_checks(self, synthesized):
        """Test that Route 53 records have health checks attached."""
        resources = json.loads(synthesized)
        records = [
            r for r in resources.get("resource", {}).get("aws_route53_record", {}).values()
        ]

        for record in records:
            assert "health_check_id" in record
            # Verify it references a health check resource
            assert "${aws_route53_health_check" in str(record["health_check_id"])

    def test_common_tags_applied(self, synthesized):
        """Test that common tags are applied to resources."""
        resources = json.loads(synthesized)

        # Check DynamoDB table tags
        tables = [
            r for r in resources.get("resource", {}).get("aws_dynamodb_table", {}).values()
        ]
        table = tables[0]
        assert table["tags"]["Environment"] == "Production"
        assert table["tags"]["DisasterRecovery"] == "Enabled"
        assert table["tags"]["Scope"] == "Global"
        assert table["tags"]["ManagedBy"] == "CDKTF"

    def test_outputs_exist(self, synthesized):
        """Test that stack outputs are defined."""
        resources = json.loads(synthesized)
        outputs = resources.get("output", {})

        assert "patient_records_table" in outputs
        assert "audit_logs_table" in outputs
        assert "hosted_zone_id" in outputs
        assert "api_domain" in outputs

    def test_aws_provider_configured(self, synthesized):
        """Test that AWS provider is configured for primary region."""
        resources = json.loads(synthesized)
        providers = resources.get("provider", {}).get("aws", [])
        assert len(providers) > 0
        provider = providers[0]
        assert provider["region"] == "us-east-1"
