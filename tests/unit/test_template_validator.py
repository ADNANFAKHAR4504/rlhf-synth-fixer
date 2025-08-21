"""Unit tests for template validator module."""
import pytest
import sys
sys.path.insert(0, 'lib')
from template_validator import CloudFormationTemplateValidator

TEMPLATE_PATH = 'lib/secure-infrastructure.yaml'

@pytest.fixture
def validator():
    """Create a validator instance."""
    return CloudFormationTemplateValidator(TEMPLATE_PATH)

def test_validator_initialization(validator):
    """Test validator initializes correctly."""
    assert validator.template_path == TEMPLATE_PATH
    assert validator.template is not None
    assert isinstance(validator.template, dict)

def test_validate_structure(validator):
    """Test structure validation."""
    assert validator.validate_structure() == True

def test_validate_parameters(validator):
    """Test parameter validation."""
    required = ['EnvironmentSuffix', 'InstanceType', 'DatabaseName']
    assert validator.validate_parameters(required) == True

def test_validate_resources(validator):
    """Test resource validation."""
    required = ['AppVPC', 'AppKMSKey', 'Database', 'AutoScalingGroup']
    assert validator.validate_resources(required) == True

def test_validate_outputs(validator):
    """Test output validation."""
    required = ['VPCId', 'LoadBalancerDNS', 'S3BucketName']
    assert validator.validate_outputs(required) == True

def test_validate_resource_types(validator):
    """Test resource type validation."""
    type_map = {
        'AppVPC': 'AWS::EC2::VPC',
        'Database': 'AWS::RDS::DBInstance',
        'AppS3Bucket': 'AWS::S3::Bucket'
    }
    assert validator.validate_resource_types(type_map) == True

def test_validate_no_retain_policies(validator):
    """Test no retain policies validation."""
    assert validator.validate_no_retain_policies() == True

def test_validate_encryption(validator):
    """Test encryption validation."""
    assert validator.validate_encryption() == True

def test_validate_security_configuration(validator):
    """Test security configuration validation."""
    assert validator.validate_security_configuration() == True

def test_validate_high_availability(validator):
    """Test high availability validation."""
    assert validator.validate_high_availability() == True

def test_validate_monitoring(validator):
    """Test monitoring validation."""
    assert validator.validate_monitoring() == True

def test_validate_autoscaling(validator):
    """Test auto-scaling validation."""
    assert validator.validate_autoscaling() == True

def test_validate_waf(validator):
    """Test WAF validation."""
    assert validator.validate_waf() == True

def test_validate_all(validator):
    """Test full validation."""
    assert validator.validate_all() == True

def test_invalid_parameter_raises_error(validator):
    """Test that missing parameter raises error."""
    with pytest.raises(ValueError) as exc:
        validator.validate_parameters(['NonExistentParam'])
    assert 'Missing required parameter' in str(exc.value)

def test_invalid_resource_raises_error(validator):
    """Test that missing resource raises error."""
    with pytest.raises(ValueError) as exc:
        validator.validate_resources(['NonExistentResource'])
    assert 'Missing required resource' in str(exc.value)

def test_invalid_output_raises_error(validator):
    """Test that missing output raises error."""
    with pytest.raises(ValueError) as exc:
        validator.validate_outputs(['NonExistentOutput'])
    assert 'Missing required output' in str(exc.value)

def test_wrong_resource_type_raises_error(validator):
    """Test that wrong resource type raises error."""
    with pytest.raises(ValueError) as exc:
        validator.validate_resource_types({'AppVPC': 'AWS::EC2::Instance'})
    assert 'wrong type' in str(exc.value)