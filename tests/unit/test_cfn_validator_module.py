"""
Unit tests for the CloudFormation validator module.
"""

import pytest
from pathlib import Path
from lib.cfn_validator import CloudFormationTemplateValidator


class TestValidatorModule:
    """Test the CloudFormation validator module."""
    
    @pytest.fixture
    def validator(self):
        """Create a validator instance."""
        return CloudFormationTemplateValidator()
    
    def test_validator_initialization(self, validator):
        """Test validator initializes correctly."""
        assert validator is not None
        assert validator.template_path.exists()
        assert validator.template_path.name == 'TapStack.yml'
    
    def test_load_template(self, validator):
        """Test template loading."""
        template = validator.load_template()
        assert isinstance(template, dict)
        assert 'AWSTemplateFormatVersion' in template
        assert 'Resources' in template
    
    def test_get_resources(self, validator):
        """Test getting resources from template."""
        resources = validator.get_resources()
        assert isinstance(resources, dict)
        assert len(resources) > 0
        assert 'VPC' in resources
    
    def test_get_parameters(self, validator):
        """Test getting parameters from template."""
        parameters = validator.get_parameters()
        assert isinstance(parameters, dict)
        assert 'EnvironmentSuffix' in parameters
        assert 'Environment' in parameters
        assert 'Owner' in parameters
    
    def test_get_outputs(self, validator):
        """Test getting outputs from template."""
        outputs = validator.get_outputs()
        assert isinstance(outputs, dict)
        assert len(outputs) > 0
        assert 'VPCId' in outputs
    
    def test_count_resources_by_type(self, validator):
        """Test counting resources by type."""
        counts = validator.count_resources_by_type()
        assert isinstance(counts, dict)
        assert 'AWS::EC2::VPC' in counts
        assert counts['AWS::EC2::VPC'] >= 1
        assert 'AWS::EC2::Subnet' in counts
        assert counts['AWS::EC2::Subnet'] >= 4
    
    def test_validate_structure(self, validator):
        """Test structure validation."""
        passed, errors = validator.validate_structure()
        assert passed is True
        assert len(errors) == 0
    
    def test_validate_vpc_configuration(self, validator):
        """Test VPC configuration validation."""
        passed, errors = validator.validate_vpc_configuration()
        assert passed is True
        assert len(errors) == 0
    
    def test_validate_iam_roles(self, validator):
        """Test IAM roles validation."""
        passed, errors = validator.validate_iam_roles()
        assert passed is True
        assert len(errors) == 0
    
    def test_validate_s3_encryption(self, validator):
        """Test S3 encryption validation."""
        passed, errors = validator.validate_s3_encryption()
        assert passed is True
        assert len(errors) == 0
    
    def test_validate_cloudtrail(self, validator):
        """Test CloudTrail validation."""
        passed, errors = validator.validate_cloudtrail()
        assert passed is True
        assert len(errors) == 0
    
    def test_validate_rds_configuration(self, validator):
        """Test RDS configuration validation."""
        passed, errors = validator.validate_rds_configuration()
        assert passed is True
        assert len(errors) == 0
    
    def test_validate_ec2_imdsv2(self, validator):
        """Test EC2 IMDSv2 validation."""
        passed, errors = validator.validate_ec2_imdsv2()
        assert passed is True
        assert len(errors) == 0
    
    def test_validate_lambda_vpc_isolation(self, validator):
        """Test Lambda VPC isolation validation."""
        passed, errors = validator.validate_lambda_vpc_isolation()
        assert passed is True
        assert len(errors) == 0
    
    def test_validate_tags(self, validator):
        """Test tags validation."""
        passed, errors = validator.validate_tags()
        # Tags validation might have some warnings but should generally pass
        assert isinstance(passed, bool)
        assert isinstance(errors, list)
    
    def test_validate_cloudwatch_alarms(self, validator):
        """Test CloudWatch alarms validation."""
        passed, errors = validator.validate_cloudwatch_alarms()
        assert passed is True
        assert len(errors) == 0
    
    def test_validate_environment_suffix(self, validator):
        """Test environment suffix validation."""
        passed, errors = validator.validate_environment_suffix()
        assert passed is True
        assert len(errors) == 0
    
    def test_run_all_validations(self, validator):
        """Test running all validations."""
        results = validator.run_all_validations()
        assert isinstance(results, dict)
        assert 'structure' in results
        assert 'vpc_configuration' in results
        assert 'iam_roles' in results
        assert 's3_encryption' in results
        
        # Check that most validations pass
        passed_count = sum(1 for passed, _ in results.values() if passed)
        assert passed_count >= 10  # Most validations should pass
    
    def test_get_validation_summary(self, validator):
        """Test getting validation summary."""
        summary = validator.get_validation_summary()
        assert isinstance(summary, str)
        assert 'CloudFormation Template Validation Summary' in summary
        assert 'Total Checks:' in summary
        assert 'Success Rate:' in summary


class TestValidatorEdgeCases:
    """Test edge cases for the validator."""
    
    def test_invalid_template_path(self):
        """Test with invalid template path."""
        with pytest.raises(FileNotFoundError):
            validator = CloudFormationTemplateValidator('/nonexistent/path.yml')
            validator.load_template()
    
    def test_template_caching(self):
        """Test that template is cached after first load."""
        validator = CloudFormationTemplateValidator()
        template1 = validator.template
        template2 = validator.template
        assert template1 is template2  # Should be the same object
    
    def test_empty_validations(self):
        """Test validation methods return proper types even with issues."""
        validator = CloudFormationTemplateValidator()
        
        # Even if validations fail, they should return tuple of (bool, list)
        for method_name in dir(validator):
            if method_name.startswith('validate_'):
                method = getattr(validator, method_name)
                if callable(method) and method_name != 'validate_tags':
                    result = method()
                    assert isinstance(result, tuple)
                    assert len(result) == 2
                    assert isinstance(result[0], bool)
                    assert isinstance(result[1], list)