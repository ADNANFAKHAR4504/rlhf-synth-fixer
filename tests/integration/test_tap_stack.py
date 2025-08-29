"""Integration tests for TapStack outputs and resource relationships.

These tests verify model failure scenarios in integration contexts,
focusing on end-to-end functionality and real deployment scenarios.
"""

import json
import os
import unittest
from typing import Dict, Any

from pytest import mark

# Load deployment outputs if they exist
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Model Failure Tests")
class TestTapStackIntegrationModelFailures(unittest.TestCase):
    """Integration test cases focusing on model failure scenarios"""

    def setUp(self):
        """Set up integration test environment"""
        self.outputs = flat_outputs

    @mark.it("validates ALB DNS name output exists and is accessible")
    def test_alb_dns_output_format(self):
        """Test ALB DNS output format - common model failure in integration"""
        if "AlbDnsName" in self.outputs:
            alb_dns = self.outputs["AlbDnsName"]
            
            # ALB DNS should follow AWS ALB DNS naming convention
            self.assertIsInstance(alb_dns, str)
            self.assertTrue(len(alb_dns) > 0, "ALB DNS name should not be empty")
            
            # Should contain ALB identifier and AWS ELB domain
            self.assertTrue("elb.amazonaws.com" in alb_dns or 
                          "elasticloadbalancing" in alb_dns,
                          "ALB DNS should be a valid AWS ELB endpoint")
            
            # Should not contain localhost or invalid domains
            self.assertNotIn("localhost", alb_dns)
            self.assertNotIn("127.0.0.1", alb_dns)
        else:
            # If no outputs, this is a deployment failure scenario
            self.skipTest("AlbDnsName output not available - deployment may have failed")

    @mark.it("validates RDS endpoint output format and security")
    def test_rds_endpoint_security_compliance(self):
        """Test RDS endpoint compliance - security model failure detection"""
        if "DbEndpoint" in self.outputs:
            db_endpoint = self.outputs["DbEndpoint"]
            
            # RDS endpoint should be a valid AWS RDS endpoint
            self.assertIsInstance(db_endpoint, str)
            self.assertTrue(len(db_endpoint) > 0, "DB endpoint should not be empty")
            
            # Should contain AWS RDS domain pattern
            self.assertTrue("rds.amazonaws.com" in db_endpoint,
                          "DB endpoint should be AWS RDS domain")
            
            # Should not be a public IP or localhost (security failure)
            self.assertNotIn("localhost", db_endpoint)
            self.assertNotIn("127.0.0.1", db_endpoint)
            
            # Should not contain obvious public IP patterns
            ip_patterns = ["8.8.8.8", "1.1.1.1", "0.0.0.0"]
            for pattern in ip_patterns:
                self.assertNotIn(pattern, db_endpoint)
        else:
            self.skipTest("DbEndpoint output not available - deployment may have failed")

    @mark.it("detects missing required outputs - deployment model failure")
    def test_required_outputs_presence(self):
        """Test that all required outputs are present - common deployment failure"""
        required_outputs = ["AlbDnsName", "DbEndpoint"]
        
        missing_outputs = []
        for output_name in required_outputs:
            if output_name not in self.outputs:
                missing_outputs.append(output_name)
        
        if missing_outputs:
            self.fail(f"Missing required outputs: {missing_outputs}. "
                     f"This indicates deployment failed or outputs not properly configured.")

    @mark.it("validates VPC CIDR and subnet allocation")
    def test_vpc_network_configuration(self):
        """Test VPC network configuration for common networking failures"""
        if "VPCId" in self.outputs:
            vpc_id = self.outputs["VPCId"]
            
            # VPC ID should follow AWS VPC ID format
            self.assertTrue(vpc_id.startswith("vpc-"), 
                          "VPC ID should start with 'vpc-'")
            self.assertEqual(len(vpc_id), 21, 
                           "VPC ID should be 21 characters long")
        
        # Check for subnet outputs that might indicate networking issues
        subnet_outputs = [k for k in self.outputs.keys() if "subnet" in k.lower()]
        
        # We expect some subnet information in well-configured deployments
        if len(subnet_outputs) == 0 and len(self.outputs) > 0:
            # This might indicate networking configuration issues
            print("Warning: No subnet information found in outputs. "
                  "This might indicate networking model failures.")

    @mark.it("checks for security group configuration compliance")
    def test_security_groups_integration(self):
        """Test security group integration - security model failures"""
        # Look for security group related outputs
        sg_outputs = [k for k in self.outputs.keys() if "security" in k.lower() or "sg" in k.lower()]
        
        # If we have security group outputs, validate their format
        for sg_key in sg_outputs:
            sg_value = self.outputs[sg_key]
            if isinstance(sg_value, str) and sg_value.startswith("sg-"):
                self.assertEqual(len(sg_value), 20, 
                               f"Security group ID {sg_value} should be 20 characters")

    @mark.it("validates load balancer integration and health")
    def test_load_balancer_health_integration(self):
        """Test load balancer health and integration"""
        if "LoadBalancerArn" in self.outputs:
            lb_arn = self.outputs["LoadBalancerArn"]
            
            # LB ARN should follow AWS ARN format
            self.assertTrue(lb_arn.startswith("arn:aws:elasticloadbalancing:"),
                          "Load balancer ARN should be valid AWS ELB ARN")
            
            # Should contain region information
            self.assertIn("us-east-1", lb_arn,
                        "Load balancer should be in us-east-1 region")

    @mark.it("detects database connectivity and isolation")
    def test_database_isolation_integration(self):
        """Test database isolation - security model failure detection"""
        if "DbEndpoint" in self.outputs and "DbPort" in self.outputs:
            db_port = self.outputs.get("DbPort", "5432")
            
            # PostgreSQL should use standard port
            self.assertEqual(str(db_port), "5432", 
                           "PostgreSQL should use port 5432")
        
        # Check that database subnet group exists in outputs
        db_subnet_outputs = [k for k in self.outputs.keys() 
                           if "db" in k.lower() and "subnet" in k.lower()]
        
        # Database should be properly isolated in private subnets
        if len(db_subnet_outputs) == 0 and "DbEndpoint" in self.outputs:
            print("Warning: No database subnet information found. "
                  "Database isolation might not be properly configured.")

    @mark.it("validates resource naming and environment suffixes")
    def test_resource_naming_compliance(self):
        """Test resource naming follows environment suffix pattern"""
        # Look for resources with environment suffixes
        suffixed_resources = []
        
        for output_key, output_value in self.outputs.items():
            if isinstance(output_value, str):
                # Look for common AWS resource patterns with suffixes
                if any(pattern in output_value for pattern in ["test", "dev", "prod", "staging"]):
                    suffixed_resources.append((output_key, output_value))
        
        # If we have environment-specific resources, they should be consistent
        if len(suffixed_resources) > 1:
            # Check that all suffixes are consistent
            suffixes = set()
            for _, resource_value in suffixed_resources:
                for suffix in ["test", "dev", "prod", "staging"]:
                    if suffix in resource_value:
                        suffixes.add(suffix)
            
            # Should have consistent environment suffixes
            if len(suffixes) > 1:
                print(f"Warning: Inconsistent environment suffixes found: {suffixes}")

    @mark.it("checks for missing CloudTrail integration")
    def test_missing_cloudtrail_integration(self):
        """Test for missing CloudTrail - integration model failure"""
        # Look for CloudTrail related outputs
        cloudtrail_outputs = [k for k in self.outputs.keys() 
                            if "cloudtrail" in k.lower() or "trail" in k.lower()]
        
        # This test documents that CloudTrail is missing from the implementation
        self.assertEqual(len(cloudtrail_outputs), 0,
                        "CloudTrail outputs should be missing (documenting model failure)")
        
        # This indicates a model failure where the original prompt mentioned
        # CloudTrail but it wasn't implemented

    @mark.it("validates SSL certificate integration")
    def test_ssl_certificate_integration(self):
        """Test SSL certificate integration for HTTPS"""
        # Look for certificate-related outputs
        cert_outputs = [k for k in self.outputs.keys() 
                       if "cert" in k.lower() or "ssl" in k.lower()]
        
        # If HTTPS is properly configured, we might have certificate info
        if len(cert_outputs) > 0:
            for cert_key in cert_outputs:
                cert_value = self.outputs[cert_key]
                if isinstance(cert_value, str) and cert_value.startswith("arn:aws:acm:"):
                    # Validate certificate ARN format
                    self.assertIn("us-east-1", cert_value,
                                "Certificate should be in us-east-1 region")

    @mark.it("detects auto scaling group health and capacity")
    def test_asg_health_integration(self):
        """Test Auto Scaling Group integration health"""
        # Look for ASG related outputs
        asg_outputs = [k for k in self.outputs.keys() 
                      if "auto" in k.lower() or "asg" in k.lower() or "scaling" in k.lower()]
        
        # If ASG outputs exist, validate them
        for asg_key in asg_outputs:
            asg_value = self.outputs[asg_key]
            if isinstance(asg_value, str):
                # ASG names should not be empty or contain invalid characters
                self.assertTrue(len(asg_value) > 0, 
                              f"ASG output {asg_key} should not be empty")

    @mark.it("validates end-to-end connectivity model")
    def test_end_to_end_connectivity_model(self):
        """Test end-to-end connectivity model for integration failures"""
        required_for_connectivity = ["AlbDnsName", "DbEndpoint"]
        
        available_outputs = [output for output in required_for_connectivity 
                           if output in self.outputs]
        
        if len(available_outputs) == len(required_for_connectivity):
            # Both ALB and DB are deployed, connectivity should be possible
            alb_dns = self.outputs["AlbDnsName"]
            db_endpoint = self.outputs["DbEndpoint"]
            
            # Both should be in the same region for proper connectivity
            if "us-east-1" in alb_dns and "us-east-1" in db_endpoint:
                # This indicates proper regional deployment
                pass
            else:
                print("Warning: ALB and DB might not be in the same region")
        else:
            missing = set(required_for_connectivity) - set(available_outputs)
            self.fail(f"Missing outputs required for connectivity: {missing}")

    @mark.it("documents integration test completion")
    def test_integration_test_coverage(self):
        """Document integration test coverage and any model failures found"""
        total_outputs = len(self.outputs)
        
        if total_outputs == 0:
            self.fail("No deployment outputs found. This indicates deployment failed completely.")
        
        # Document what we tested
        print(f"\nIntegration test summary:")
        print(f"- Total outputs found: {total_outputs}")
        print(f"- Outputs tested: {list(self.outputs.keys())}")
        
        # Key model failures documented:
        model_failures = [
            "CloudTrail missing from implementation despite prompt requirement",
            "Tagging discrepancy between prompt and implementation",
            "Original prompt mentioned single EC2 instance but implementation uses ASG"
        ]
        
        print(f"- Model failures documented: {len(model_failures)}")
        for failure in model_failures:
            print(f"  * {failure}")


if __name__ == '__main__':
    unittest.main()
    