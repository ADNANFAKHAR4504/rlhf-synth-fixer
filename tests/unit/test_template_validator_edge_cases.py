"""Edge case tests for template validator module."""
import pytest
import sys
import os
import tempfile
import json
sys.path.insert(0, 'lib')
from template_validator import CloudFormationTemplateValidator

def test_file_not_found():
    """Test that missing file raises error."""
    with pytest.raises(FileNotFoundError):
        CloudFormationTemplateValidator('nonexistent.yaml')

def test_validate_structure_missing_version():
    """Test structure validation with missing version."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write("Resources:\n  Test:\n    Type: AWS::EC2::Instance")
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_structure()
        assert 'AWSTemplateFormatVersion' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_parameters_no_section():
    """Test parameter validation with no parameters section."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write("AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  Test:\n    Type: AWS::EC2::Instance")
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_parameters(['TestParam'])
        assert 'No parameters section' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_outputs_no_section():
    """Test output validation with no outputs section."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write("AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  Test:\n    Type: AWS::EC2::Instance")
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_outputs(['TestOutput'])
        assert 'No outputs section' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_encryption_missing():
    """Test encryption validation with unencrypted resources."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  TestBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: test-bucket
  TestDB:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: test-db
      StorageEncrypted: false
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_encryption()
        assert 'missing encryption' in str(exc.value) or 'not encrypted' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_security_public_rds():
    """Test security validation with public RDS."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  TestDB:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: test-db
      PubliclyAccessible: true
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_security_configuration()
        assert 'publicly accessible' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_security_public_s3():
    """Test security validation with public S3."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  TestBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: test-bucket
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_security_configuration()
        assert 'allows public ACLs' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_high_availability_insufficient_subnets():
    """Test HA validation with insufficient subnets."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  Subnet1:
    Type: AWS::EC2::Subnet
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_high_availability()
        assert 'Not enough subnets' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_high_availability_single_nat():
    """Test HA validation with single NAT Gateway."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  Subnet1:
    Type: AWS::EC2::Subnet
  Subnet2:
    Type: AWS::EC2::Subnet
  NatGateway1:
    Type: AWS::EC2::NatGateway
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_high_availability()
        assert 'Not enough NAT Gateways' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_monitoring_no_logs():
    """Test monitoring validation with no log groups."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  TestInstance:
    Type: AWS::EC2::Instance
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_monitoring()
        assert 'No CloudWatch Log Groups' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_monitoring_no_alarms():
    """Test monitoring validation with no alarms."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  LogGroup:
    Type: AWS::Logs::LogGroup
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_monitoring()
        assert 'No CloudWatch Alarms' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_autoscaling_no_asg():
    """Test auto-scaling validation with no ASG."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  TestInstance:
    Type: AWS::EC2::Instance
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_autoscaling()
        assert 'No Auto Scaling Group' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_autoscaling_bad_config():
    """Test auto-scaling validation with bad configuration."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  ASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 0
      MaxSize: 0
      HealthCheckType: EC2
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_autoscaling()
        assert 'min size too low' in str(exc.value) or 'not greater than min' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_waf_no_webacl():
    """Test WAF validation with no Web ACL."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  TestInstance:
    Type: AWS::EC2::Instance
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_waf()
        assert 'No WAF Web ACL' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_waf_no_rules():
    """Test WAF validation with no rules."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Rules: []
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_waf()
        assert 'has no rules' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_waf_no_owasp():
    """Test WAF validation without OWASP rules."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  WebACL:
    Type: AWS::WAFv2::WebACL
    Properties:
      Rules:
        - Name: CustomRule
          Statement:
            ByteMatchStatement:
              SearchString: test
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_waf()
        assert 'missing OWASP Core Rule Set' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_fallback_yaml_loader():
    """Test fallback YAML loader when cfn-flip fails."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        # Write a simple YAML that might fail cfn-flip but can be parsed
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  Test:
    Type: AWS::EC2::Instance
"""
        f.write(content)
        temp_path = f.name
    
    try:
        # This should use the fallback loader
        validator = CloudFormationTemplateValidator(temp_path)
        assert validator.template is not None
    finally:
        os.unlink(temp_path)

def test_validate_autoscaling_max_not_greater():
    """Test auto-scaling validation when max equals min."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  ASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 2
      MaxSize: 2
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_autoscaling()
        assert 'not greater than min' in str(exc.value)
    finally:
        os.unlink(temp_path)

def test_validate_autoscaling_wrong_health_check():
    """Test auto-scaling validation with wrong health check type."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        content = """
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  ASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 1
      MaxSize: 3
      HealthCheckType: EC2
"""
        f.write(content)
        temp_path = f.name
    
    try:
        validator = CloudFormationTemplateValidator(temp_path)
        with pytest.raises(ValueError) as exc:
            validator.validate_autoscaling()
        assert 'should use ELB health checks' in str(exc.value)
    finally:
        os.unlink(temp_path)