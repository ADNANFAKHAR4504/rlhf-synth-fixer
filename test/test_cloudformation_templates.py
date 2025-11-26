"""
Unit tests for CloudFormation templates
Tests validate JSON syntax, resource structure, and compliance requirements
"""
import json
import os
import unittest
from pathlib import Path


class TestCloudFormationTemplates(unittest.TestCase):
    """Test suite for Aurora Global Database CloudFormation templates"""

    @classmethod
    def setUpClass(cls):
        """Load all CloudFormation templates once"""
        cls.lib_dir = Path(__file__).parent.parent / "lib"
        cls.templates = {}

        template_files = [
            "aurora-global-primary.json",
            "aurora-global-secondary.json",
            "route53-failover.json"
        ]

        for template_file in template_files:
            template_path = cls.lib_dir / template_file
            with open(template_path, 'r') as f:
                cls.templates[template_file] = json.load(f)

    # JSON Syntax Tests
    def test_primary_template_valid_json(self):
        """Primary template is valid JSON"""
        self.assertIsInstance(self.templates["aurora-global-primary.json"], dict)
        self.assertIn("Resources", self.templates["aurora-global-primary.json"])

    def test_secondary_template_valid_json(self):
        """Secondary template is valid JSON"""
        self.assertIsInstance(self.templates["aurora-global-secondary.json"], dict)
        self.assertIn("Resources", self.templates["aurora-global-secondary.json"])

    def test_route53_template_valid_json(self):
        """Route53 template is valid JSON"""
        self.assertIsInstance(self.templates["route53-failover.json"], dict)
        self.assertIn("Resources", self.templates["route53-failover.json"])

    # Template Structure Tests
    def test_all_templates_have_parameters(self):
        """All templates have Parameters section"""
        for template_name, template in self.templates.items():
            with self.subTest(template=template_name):
                self.assertIn("Parameters", template)
                self.assertIsInstance(template["Parameters"], dict)

    def test_all_templates_have_outputs(self):
        """All templates have Outputs section"""
        for template_name, template in self.templates.items():
            with self.subTest(template=template_name):
                self.assertIn("Outputs", template)
                self.assertIsInstance(template["Outputs"], dict)

    # environmentSuffix Tests
    def test_environment_suffix_parameter_present(self):
        """All templates have environmentSuffix parameter"""
        for template_name, template in self.templates.items():
            with self.subTest(template=template_name):
                self.assertIn("EnvironmentSuffix", template["Parameters"])

    def test_environment_suffix_used_in_resources(self):
        """Resource names use environmentSuffix"""
        for template_name, template in self.templates.items():
            with self.subTest(template=template_name):
                resources = template.get("Resources", {})
                # Check at least one resource uses Sub with EnvironmentSuffix
                found_usage = False
                for resource_name, resource in resources.items():
                    props = resource.get("Properties", {})
                    # Check various properties that might contain resource names
                    for prop_value in props.values():
                        if isinstance(prop_value, dict):
                            if "Fn::Sub" in prop_value:
                                sub_value = prop_value["Fn::Sub"]
                                if isinstance(sub_value, str) and "EnvironmentSuffix" in sub_value:
                                    found_usage = True
                                    break
                        elif isinstance(prop_value, str) and "EnvironmentSuffix" in prop_value:
                            found_usage = True
                            break
                    if found_usage:
                        break
                self.assertTrue(found_usage, f"{template_name} should use EnvironmentSuffix in resource names")

    # DeletionPolicy Tests
    def test_no_retain_deletion_policy(self):
        """No resources have DeletionPolicy: Retain"""
        for template_name, template in self.templates.items():
            with self.subTest(template=template_name):
                resources = template.get("Resources", {})
                for resource_name, resource in resources.items():
                    deletion_policy = resource.get("DeletionPolicy", "Delete")
                    self.assertNotEqual(deletion_policy, "Retain",
                                      f"{resource_name} in {template_name} has DeletionPolicy: Retain")

    # Aurora Global Database Tests
    def test_primary_has_global_cluster(self):
        """Primary template creates Aurora Global Cluster"""
        resources = self.templates["aurora-global-primary.json"]["Resources"]
        global_cluster_found = False
        for resource_name, resource in resources.items():
            if resource.get("Type") == "AWS::RDS::GlobalCluster":
                global_cluster_found = True
                # Verify MySQL 8.0 compatibility
                props = resource.get("Properties", {})
                engine = props.get("Engine", "")
                self.assertIn("aurora-mysql", engine.lower())
                break
        self.assertTrue(global_cluster_found, "Primary template must have GlobalCluster")

    def test_primary_has_db_cluster(self):
        """Primary template creates Aurora DB Cluster"""
        resources = self.templates["aurora-global-primary.json"]["Resources"]
        db_cluster_found = False
        for resource_name, resource in resources.items():
            if resource.get("Type") == "AWS::RDS::DBCluster":
                db_cluster_found = True
                props = resource.get("Properties", {})
                # Verify encryption enabled
                self.assertTrue(props.get("StorageEncrypted", False))
                # Verify 7-day backup retention
                self.assertEqual(props.get("BackupRetentionPeriod"), 7)
                break
        self.assertTrue(db_cluster_found, "Primary template must have DBCluster")

    def test_primary_has_writer_instance(self):
        """Primary template creates writer DB instance"""
        resources = self.templates["aurora-global-primary.json"]["Resources"]
        writer_found = False
        for resource_name, resource in resources.items():
            if resource.get("Type") == "AWS::RDS::DBInstance":
                writer_found = True
                props = resource.get("Properties", {})
                # Verify db.r6g.2xlarge instance class
                self.assertEqual(props.get("DBInstanceClass"), "db.r6g.2xlarge")
                break
        self.assertTrue(writer_found, "Primary template must have DB instance")

    def test_secondary_has_db_cluster(self):
        """Secondary template creates Aurora DB Cluster"""
        resources = self.templates["aurora-global-secondary.json"]["Resources"]
        db_cluster_found = False
        for resource_name, resource in resources.items():
            if resource.get("Type") == "AWS::RDS::DBCluster":
                db_cluster_found = True
                props = resource.get("Properties", {})
                # Verify it references global cluster
                self.assertIn("GlobalClusterIdentifier", props)
                break
        self.assertTrue(db_cluster_found, "Secondary template must have DBCluster")

    def test_secondary_has_reader_instance(self):
        """Secondary template creates reader DB instance"""
        resources = self.templates["aurora-global-secondary.json"]["Resources"]
        reader_found = False
        for resource_name, resource in resources.items():
            if resource.get("Type") == "AWS::RDS::DBInstance":
                reader_found = True
                props = resource.get("Properties", {})
                # Verify db.r6g.2xlarge instance class
                self.assertEqual(props.get("DBInstanceClass"), "db.r6g.2xlarge")
                break
        self.assertTrue(reader_found, "Secondary template must have DB instance")

    # CloudWatch Alarms Tests
    def test_primary_has_cloudwatch_alarms(self):
        """Primary template has CloudWatch alarms"""
        resources = self.templates["aurora-global-primary.json"]["Resources"]
        alarm_count = sum(1 for r in resources.values()
                         if r.get("Type") == "AWS::CloudWatch::Alarm")
        self.assertGreater(alarm_count, 0, "Primary should have CloudWatch alarms")

    def test_secondary_has_replication_lag_alarm(self):
        """Secondary template has replication lag alarm at 1000ms threshold"""
        resources = self.templates["aurora-global-secondary.json"]["Resources"]
        lag_alarm_found = False
        for resource_name, resource in resources.items():
            if resource.get("Type") == "AWS::CloudWatch::Alarm":
                props = resource.get("Properties", {})
                metric_name = props.get("MetricName", "")
                if "lag" in metric_name.lower() or "replication" in resource_name.lower():
                    # Verify 1000ms (1 second) threshold
                    threshold = props.get("Threshold")
                    self.assertEqual(threshold, 1000, "Replication lag threshold must be 1000ms")
                    lag_alarm_found = True
                    break
        self.assertTrue(lag_alarm_found, "Secondary must have replication lag alarm")

    # Route 53 Tests
    def test_route53_has_health_checks(self):
        """Route53 template has health checks"""
        resources = self.templates["route53-failover.json"]["Resources"]
        health_check_count = sum(1 for r in resources.values()
                                if r.get("Type") == "AWS::Route53::HealthCheck")
        self.assertGreater(health_check_count, 0, "Route53 template should have health checks")

    def test_route53_has_record_sets(self):
        """Route53 template has record sets with failover routing"""
        resources = self.templates["route53-failover.json"]["Resources"]
        record_set_found = False
        for resource_name, resource in resources.items():
            if resource.get("Type") == "AWS::Route53::RecordSet":
                record_set_found = True
                props = resource.get("Properties", {})
                # Should have failover routing policy
                self.assertIn("Failover", props, f"{resource_name} should have Failover property")
                break
        self.assertTrue(record_set_found, "Route53 template must have RecordSets")

    # KMS Encryption Tests
    def test_encryption_enabled_in_primary(self):
        """Primary cluster has encryption enabled"""
        resources = self.templates["aurora-global-primary.json"]["Resources"]
        for resource_name, resource in resources.items():
            if resource.get("Type") == "AWS::RDS::DBCluster":
                props = resource.get("Properties", {})
                self.assertTrue(props.get("StorageEncrypted", False),
                              "Primary cluster must have encryption enabled")

    # Backup Configuration Tests
    def test_backup_retention_seven_days(self):
        """Both clusters have 7-day backup retention"""
        for template_name in ["aurora-global-primary.json", "aurora-global-secondary.json"]:
            with self.subTest(template=template_name):
                resources = self.templates[template_name]["Resources"]
                for resource_name, resource in resources.items():
                    if resource.get("Type") == "AWS::RDS::DBCluster":
                        props = resource.get("Properties", {})
                        self.assertEqual(props.get("BackupRetentionPeriod"), 7,
                                       f"{template_name} must have 7-day backup retention")

    # Resource Count Tests
    def test_primary_has_required_resource_types(self):
        """Primary template has all required resource types"""
        resources = self.templates["aurora-global-primary.json"]["Resources"]
        resource_types = {r.get("Type") for r in resources.values()}

        required_types = {
            "AWS::RDS::GlobalCluster",
            "AWS::RDS::DBCluster",
            "AWS::RDS::DBInstance",
            "AWS::CloudWatch::Alarm"
        }

        for required_type in required_types:
            self.assertIn(required_type, resource_types,
                         f"Primary template must have {required_type}")

    def test_secondary_has_required_resource_types(self):
        """Secondary template has all required resource types"""
        resources = self.templates["aurora-global-secondary.json"]["Resources"]
        resource_types = {r.get("Type") for r in resources.values()}

        required_types = {
            "AWS::RDS::DBCluster",
            "AWS::RDS::DBInstance",
            "AWS::CloudWatch::Alarm"
        }

        for required_type in required_types:
            self.assertIn(required_type, resource_types,
                         f"Secondary template must have {required_type}")

    # Output Tests
    def test_primary_outputs_cluster_endpoint(self):
        """Primary template outputs cluster endpoint"""
        outputs = self.templates["aurora-global-primary.json"]["Outputs"]
        endpoint_output_found = False
        for output_name, output in outputs.items():
            if "endpoint" in output_name.lower() or "endpoint" in output.get("Description", "").lower():
                endpoint_output_found = True
                break
        self.assertTrue(endpoint_output_found, "Primary must output cluster endpoint")

    def test_secondary_outputs_cluster_endpoint(self):
        """Secondary template outputs cluster endpoint"""
        outputs = self.templates["aurora-global-secondary.json"]["Outputs"]
        endpoint_output_found = False
        for output_name, output in outputs.items():
            if "endpoint" in output_name.lower() or "endpoint" in output.get("Description", "").lower():
                endpoint_output_found = True
                break
        self.assertTrue(endpoint_output_found, "Secondary must output cluster endpoint")

    # Integration Tests
    def test_all_templates_reference_compatible_parameters(self):
        """Templates use consistent parameter names for integration"""
        # All should have EnvironmentSuffix
        for template_name, template in self.templates.items():
            with self.subTest(template=template_name):
                self.assertIn("EnvironmentSuffix", template["Parameters"])

    def test_template_files_exist(self):
        """All required template files exist"""
        required_files = [
            "aurora-global-primary.json",
            "aurora-global-secondary.json",
            "route53-failover.json"
        ]
        for file_name in required_files:
            file_path = self.lib_dir / file_name
            self.assertTrue(file_path.exists(), f"{file_name} must exist")


if __name__ == "__main__":
    unittest.main()
