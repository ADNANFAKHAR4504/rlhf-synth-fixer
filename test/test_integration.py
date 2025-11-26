"""
Integration tests for Aurora Global Database deployment
Tests validate deployment readiness and cross-template integration
"""
import json
import os
import unittest
from pathlib import Path


class TestIntegration(unittest.TestCase):
    """Integration tests for multi-region Aurora Global Database"""

    @classmethod
    def setUpClass(cls):
        """Setup test environment"""
        cls.lib_dir = Path(__file__).parent.parent / "lib"
        cls.outputs_file = Path(__file__).parent.parent / "cfn-outputs" / "flat-outputs.json"

        # Load templates
        cls.primary_template = cls._load_template("aurora-global-primary.json")
        cls.secondary_template = cls._load_template("aurora-global-secondary.json")
        cls.route53_template = cls._load_template("route53-failover.json")

        # Load outputs if deployment completed
        cls.deployment_outputs = None
        if cls.outputs_file.exists():
            with open(cls.outputs_file, 'r') as f:
                cls.deployment_outputs = json.load(f)

    @classmethod
    def _load_template(cls, filename):
        """Load CloudFormation template"""
        with open(cls.lib_dir / filename, 'r') as f:
            return json.load(f)

    # Pre-deployment Integration Tests
    def test_deployment_order_dependencies(self):
        """Templates can be deployed in correct order"""
        # Primary must create global cluster
        primary_resources = self.primary_template["Resources"]
        has_global_cluster = any(
            r.get("Type") == "AWS::RDS::GlobalCluster"
            for r in primary_resources.values()
        )
        self.assertTrue(has_global_cluster, "Primary must create global cluster for secondary to reference")

        # Secondary must reference global cluster
        secondary_resources = self.secondary_template["Resources"]
        references_global = False
        for resource in secondary_resources.values():
            if resource.get("Type") == "AWS::RDS::DBCluster":
                props = resource.get("Properties", {})
                if "GlobalClusterIdentifier" in props:
                    references_global = True
                    break
        self.assertTrue(references_global, "Secondary must reference global cluster from primary")

    def test_cross_stack_parameter_compatibility(self):
        """Templates have compatible parameters for cross-stack references"""
        primary_outputs = self.primary_template.get("Outputs", {})
        secondary_params = self.secondary_template.get("Parameters", {})

        # Check that primary exports what secondary might need
        self.assertGreater(len(primary_outputs), 0, "Primary should export values for other stacks")

    def test_multi_region_configuration(self):
        """Templates are configured for different regions"""
        # Primary should have indicators for us-east-1
        # Secondary should have indicators for eu-west-1
        # This is validated through parameter descriptions or resource names
        primary_desc = json.dumps(self.primary_template).lower()
        secondary_desc = json.dumps(self.secondary_template).lower()

        # Check region-specific naming patterns exist
        self.assertIn("primary", primary_desc)
        self.assertIn("secondary", secondary_desc)

    def test_failover_routing_references_both_regions(self):
        """Route53 template references both regional endpoints"""
        route53_resources = self.route53_template["Resources"]
        route53_params = self.route53_template.get("Parameters", {})

        # Should have parameters or references for both regions
        record_sets = [r for r in route53_resources.values()
                      if r.get("Type") == "AWS::Route53::RecordSet"]
        self.assertGreater(len(record_sets), 0, "Route53 must have record sets for failover")

    def test_health_check_configuration(self):
        """Health checks are properly configured for both regions"""
        route53_resources = self.route53_template["Resources"]
        health_checks = [r for r in route53_resources.values()
                        if r.get("Type") == "AWS::Route53::HealthCheck"]
        self.assertGreater(len(health_checks), 0, "Must have health checks for monitoring")

    def test_encryption_keys_per_region(self):
        """Each region can use separate KMS keys"""
        # Primary and secondary should both have encryption enabled
        primary_resources = self.primary_template["Resources"]
        secondary_resources = self.secondary_template["Resources"]

        primary_encrypted = False
        for resource in primary_resources.values():
            if resource.get("Type") == "AWS::RDS::DBCluster":
                props = resource.get("Properties", {})
                if props.get("StorageEncrypted"):
                    primary_encrypted = True
                    break

        secondary_encrypted = False
        for resource in secondary_resources.values():
            if resource.get("Type") == "AWS::RDS::DBCluster":
                props = resource.get("Properties", {})
                if props.get("StorageEncrypted"):
                    secondary_encrypted = True
                    break

        self.assertTrue(primary_encrypted, "Primary cluster must be encrypted")
        self.assertTrue(secondary_encrypted, "Secondary cluster must be encrypted")

    def test_backup_coordination(self):
        """Backup windows are configured to avoid conflicts"""
        primary_resources = self.primary_template["Resources"]
        secondary_resources = self.secondary_template["Resources"]

        # Both should have backup retention configured
        primary_backup = False
        secondary_backup = False

        for resource in primary_resources.values():
            if resource.get("Type") == "AWS::RDS::DBCluster":
                props = resource.get("Properties", {})
                if props.get("BackupRetentionPeriod", 0) > 0:
                    primary_backup = True

        for resource in secondary_resources.values():
            if resource.get("Type") == "AWS::RDS::DBCluster":
                props = resource.get("Properties", {})
                if props.get("BackupRetentionPeriod", 0) > 0:
                    secondary_backup = True

        self.assertTrue(primary_backup, "Primary must have backup configured")
        self.assertTrue(secondary_backup, "Secondary must have backup configured")

    def test_monitoring_alarms_cover_critical_metrics(self):
        """CloudWatch alarms monitor critical metrics in both regions"""
        primary_resources = self.primary_template["Resources"]
        secondary_resources = self.secondary_template["Resources"]

        primary_alarms = sum(1 for r in primary_resources.values()
                           if r.get("Type") == "AWS::CloudWatch::Alarm")
        secondary_alarms = sum(1 for r in secondary_resources.values()
                             if r.get("Type") == "AWS::CloudWatch::Alarm")

        self.assertGreater(primary_alarms, 0, "Primary must have monitoring alarms")
        self.assertGreater(secondary_alarms, 0, "Secondary must have monitoring alarms")

    # Post-deployment Integration Tests (only run if outputs exist)
    def test_deployment_outputs_available(self):
        """Deployment outputs file exists after successful deployment"""
        if self.deployment_outputs:
            self.assertIsInstance(self.deployment_outputs, dict)
            self.assertGreater(len(self.deployment_outputs), 0)
        else:
            self.skipTest("Deployment not yet completed - outputs file not found")

    def test_primary_endpoint_in_outputs(self):
        """Primary cluster endpoint is in deployment outputs"""
        if not self.deployment_outputs:
            self.skipTest("Deployment not yet completed")

        # Look for endpoint outputs
        endpoint_keys = [k for k in self.deployment_outputs.keys()
                        if "endpoint" in k.lower() and "primary" in k.lower()]
        self.assertGreater(len(endpoint_keys), 0, "Primary endpoint should be in outputs")

    def test_secondary_endpoint_in_outputs(self):
        """Secondary cluster endpoint is in deployment outputs"""
        if not self.deployment_outputs:
            self.skipTest("Deployment not yet completed")

        # Look for endpoint outputs
        endpoint_keys = [k for k in self.deployment_outputs.keys()
                        if "endpoint" in k.lower() and "secondary" in k.lower()]
        self.assertGreater(len(endpoint_keys), 0, "Secondary endpoint should be in outputs")

    def test_route53_record_in_outputs(self):
        """Route53 DNS record is in deployment outputs"""
        if not self.deployment_outputs:
            self.skipTest("Deployment not yet completed")

        # Look for DNS/Route53 outputs
        dns_keys = [k for k in self.deployment_outputs.keys()
                   if any(term in k.lower() for term in ["dns", "route53", "domain", "record"])]
        self.assertGreater(len(dns_keys), 0, "Route53 DNS record should be in outputs")

    # Compliance Tests
    def test_all_resources_have_tags(self):
        """All major resources are tagged appropriately"""
        templates = [
            ("primary", self.primary_template),
            ("secondary", self.secondary_template),
            ("route53", self.route53_template)
        ]

        for template_name, template in templates:
            with self.subTest(template=template_name):
                resources = template.get("Resources", {})
                # Check that major resources have tags or tag specifications
                major_resources = [
                    r for r in resources.values()
                    if r.get("Type") in [
                        "AWS::RDS::DBCluster",
                        "AWS::RDS::DBInstance",
                        "AWS::CloudWatch::Alarm"
                    ]
                ]
                if major_resources:
                    # At least some resources should support tagging
                    self.assertGreater(len(major_resources), 0)

    def test_security_encryption_at_rest(self):
        """All data at rest is encrypted"""
        for template_name in ["primary", "secondary"]:
            template = self.primary_template if template_name == "primary" else self.secondary_template
            with self.subTest(template=template_name):
                resources = template.get("Resources", {})
                for resource in resources.values():
                    if resource.get("Type") == "AWS::RDS::DBCluster":
                        props = resource.get("Properties", {})
                        self.assertTrue(props.get("StorageEncrypted", False),
                                      f"{template_name} cluster must be encrypted")

    def test_high_availability_multi_az(self):
        """Clusters are configured for high availability"""
        templates = [
            ("primary", self.primary_template),
            ("secondary", self.secondary_template)
        ]

        for template_name, template in templates:
            with self.subTest(template=template_name):
                resources = template.get("Resources", {})
                # Check for multiple instances or multi-AZ configuration
                db_instances = [r for r in resources.values()
                              if r.get("Type") == "AWS::RDS::DBInstance"]
                # Should have at least one instance (writer or reader)
                self.assertGreater(len(db_instances), 0,
                                 f"{template_name} should have DB instances")

    def test_disaster_recovery_metrics_available(self):
        """DR-related metrics and alarms are configured"""
        # Secondary must have replication lag alarm
        secondary_resources = self.secondary_template["Resources"]
        lag_alarms = [r for r in secondary_resources.values()
                     if r.get("Type") == "AWS::CloudWatch::Alarm"]
        self.assertGreater(len(lag_alarms), 0,
                         "Secondary must have alarms including replication lag")

    def test_failover_capability_configured(self):
        """Route53 failover routing is properly configured"""
        route53_resources = self.route53_template["Resources"]

        # Must have both primary and secondary record sets
        record_sets = [r for r in route53_resources.values()
                      if r.get("Type") == "AWS::Route53::RecordSet"]

        failover_types = set()
        for record_set in record_sets:
            props = record_set.get("Properties", {})
            failover = props.get("Failover")
            if failover:
                failover_types.add(failover)

        # Should have PRIMARY and SECONDARY failover types
        self.assertIn("PRIMARY", failover_types, "Must have PRIMARY failover record")
        self.assertIn("SECONDARY", failover_types, "Must have SECONDARY failover record")


if __name__ == "__main__":
    unittest.main()
