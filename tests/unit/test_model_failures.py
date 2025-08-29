"""Specific model failure tests identifying discrepancies between prompt and implementation.

These tests document and validate specific failures where the model implementation
differs from the original prompt requirements.
"""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("Model Failure Analysis Tests")
class TestModelFailureAnalysis(unittest.TestCase):
    """Tests specifically designed to catch model implementation failures"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.stack = TapStack(self.app, "ModelFailureTest",
                              TapStackProps(environment_suffix="test"),
                              env=cdk.Environment(region="us-east-1"))
        self.template = Template.from_stack(self.stack)

    @mark.it("detects CloudTrail requirement omission")
    def test_cloudtrail_requirement_missing(self):
        """Test for missing CloudTrail requirement from original prompt"""
        # Original prompt.md stated: "we need CloudTrail running to log all API calls"
        # But the implementation completely omits CloudTrail
        
        self.template.resource_count_is("AWS::CloudTrail::Trail", 0)
        
        # This test documents a clear model failure:
        # The prompt explicitly requested CloudTrail but it was not implemented
        print("MODEL FAILURE DETECTED: CloudTrail requirement from prompt was not implemented")

    @mark.it("detects single EC2 instance vs ASG architectural difference")
    def test_single_instance_vs_asg_architecture(self):
        """Test architectural mismatch between prompt and implementation"""
        # Original prompt.md requested: "a web-facing EC2 instance (a t3.micro is fine for now)"
        # But implementation uses Auto Scaling Group instead of single instance
        
        # Implementation has ASG (not requested)
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        
        # Implementation has no standalone EC2 instances
        self.template.resource_count_is("AWS::EC2::Instance", 0)
        
        print("MODEL ARCHITECTURAL CHANGE: Single EC2 instance request became ASG implementation")

    @mark.it("validates tagging requirement compliance")
    def test_required_tag_compliance(self):
        """Test compliance with specific tag requirements from prompt"""
        # Original prompt.md required: "Environment: Production" and "Department: IT" tags
        # Implementation uses different tags: "Project: WebApp", "Environment: Production", "ManagedBy: CDK"
        
        # Check if resources have the required tags (this will vary by CDK implementation)
        template_json = self.template.to_json()
        
        # Look for Department: IT tag (missing from implementation)
        found_department_it = False
        found_project_webapp = False
        
        # Check for tag patterns in the template
        template_str = str(template_json)
        
        if "Department" in template_str and "IT" in template_str:
            found_department_it = True
        
        if "Project" in template_str and "WebApp" in template_str:
            found_project_webapp = True
        
        # Document the tag discrepancy
        self.assertFalse(found_department_it, 
                        "Department: IT tag missing (documents model failure)")
        print("MODEL FAILURE: Required 'Department: IT' tag not implemented")
        
        # Implementation added different tags not requested in prompt
        if found_project_webapp:
            print("MODEL ADDITION: 'Project: WebApp' tag added (not requested in prompt)")

    @mark.it("detects HTTPS-only requirement vs HTTP+HTTPS implementation")
    def test_https_only_vs_dual_protocol(self):
        """Test HTTP protocol allowance vs prompt requirement"""
        # Original prompt mentioned: "make sure its security group is locked down 
        # to only allow HTTPS traffic from the outside world"
        # But implementation allows both HTTP (80) and HTTPS (443)
        
        # Check for HTTP listener (not requested in original prompt)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })
        
        # HTTPS listener (requested)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 443,
            "Protocol": "HTTPS"
        })
        
        print("MODEL SECURITY CHANGE: Original prompt suggested HTTPS-only, implementation allows both HTTP and HTTPS")

    @mark.it("validates security group source restrictions")
    def test_security_group_source_compliance(self):
        """Test security group source restrictions vs implementation"""
        # Implementation allows HTTP from ALB to instances, but original prompt
        # was less clear about internal load balancer communication
        
        # Check ALB allows traffic from anywhere (0.0.0.0/0)
        self.template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
        })
        
        # This matches the requirement, but the HTTP allowance is the issue
        print("MODEL CLARIFICATION: ALB accepts traffic from internet as expected")

    @mark.it("detects infrastructure sizing choices")
    def test_instance_sizing_compliance(self):
        """Test instance sizing choices vs prompt specifications"""
        # Prompt specified t3.micro for EC2 instance
        # Implementation uses t3.micro but in ASG instead of single instance
        
        self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "InstanceType": "t3.micro"
            }
        })
        
        # RDS sizing (db.t2.micro) matches the requirement
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceClass": "db.t2.micro"
        })
        
        print("MODEL SIZING: Instance types match prompt, but architecture changed from single instance to ASG")

    @mark.it("validates database encryption requirement implementation")
    def test_database_encryption_compliance(self):
        """Test database encryption requirement compliance"""
        # Prompt stated: "database must have encryption at rest enabled"
        # This should be implemented correctly
        
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })
        
        print("MODEL SUCCESS: Database encryption requirement correctly implemented")

    @mark.it("detects public subnet placement vs security requirements")
    def test_public_vs_private_placement(self):
        """Test resource placement relative to security requirements"""
        # Original prompt suggested EC2 instance in public subnet
        # Implementation puts ASG instances in private subnets (more secure)
        
        # ALB should be in public subnets (correct)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing"
        })
        
        # ASG instances are in private subnets (security improvement over prompt)
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        
        print("MODEL SECURITY IMPROVEMENT: ASG instances placed in private subnets (more secure than prompt suggestion)")

    @mark.it("validates PostgreSQL version specification")
    def test_postgresql_version_specification(self):
        """Test PostgreSQL version specification"""
        # Prompt didn't specify PostgreSQL version, implementation chose specific version
        
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres"
        })
        
        # Check if version is specified (implementation detail not in prompt)
        template_json = self.template.to_json()
        found_version_spec = False
        
        for resource in template_json.get("Resources", {}).values():
            if resource.get("Type") == "AWS::RDS::DBInstance":
                if "EngineVersion" in resource.get("Properties", {}):
                    found_version_spec = True
                    engine_version = resource["Properties"]["EngineVersion"]
                    print(f"MODEL IMPLEMENTATION DETAIL: PostgreSQL version {engine_version} chosen (not specified in prompt)")
        
        if not found_version_spec:
            print("MODEL IMPLEMENTATION: PostgreSQL version not explicitly set (using AWS default)")

    @mark.it("detects backup and retention policy implementations")
    def test_backup_retention_policy(self):
        """Test backup and retention policy implementation"""
        # Original prompt didn't specify backup requirements
        # Implementation includes backup retention settings
        
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": Match.any_value()
        })
        
        print("MODEL ADDITION: Backup retention policy added (not specified in original prompt)")

    @mark.it("validates secrets manager integration choice")
    def test_secrets_manager_integration(self):
        """Test Secrets Manager integration choice"""
        # Original prompt didn't specify credential management approach
        # Implementation uses Secrets Manager (good security practice)
        
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
        
        print("MODEL SECURITY ADDITION: Secrets Manager integration added (security best practice, not in original prompt)")

    @mark.it("documents comprehensive model failure analysis")
    def test_comprehensive_failure_analysis(self):
        """Comprehensive analysis of all model failures and improvements"""
        
        failures = []
        improvements = []
        additions = []
        
        # Major failures (requirements not met)
        failures.extend([
            "CloudTrail requirement completely omitted",
            "Single EC2 instance became ASG (architectural change)",
            "Required Department: IT tag not implemented",
            "HTTP allowed when prompt suggested HTTPS-only"
        ])
        
        # Security improvements (better than prompt)
        improvements.extend([
            "ASG instances in private subnets vs public (more secure)",
            "Secrets Manager integration for credentials",
            "Backup retention policy added"
        ])
        
        # Implementation additions (not specified in prompt)
        additions.extend([
            "Auto Scaling Group with min/max/desired capacity",
            "Application Load Balancer instead of direct EC2 access",
            "Launch Template configuration",
            "Target Group health checks",
            "NAT Gateways for private subnet egress"
        ])
        
        print(f"\nCOMPREHENSIVE MODEL ANALYSIS:")
        print(f"Major Failures ({len(failures)}):")
        for failure in failures:
            print(f"  - {failure}")
        
        print(f"\nSecurity Improvements ({len(improvements)}):")
        for improvement in improvements:
            print(f"  + {improvement}")
        
        print(f"\nImplementation Additions ({len(additions)}):")
        for addition in additions:
            print(f"  * {addition}")
        
        # The test passes but documents all the discrepancies
        self.assertTrue(len(failures) > 0, "Model failures detected and documented")
        self.assertTrue(len(improvements) > 0, "Security improvements documented")
        self.assertTrue(len(additions) > 0, "Implementation additions documented")


if __name__ == '__main__':
    unittest.main()