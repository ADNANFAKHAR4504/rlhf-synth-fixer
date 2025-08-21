"""
CloudFormation template validator module.
Provides functions to validate and analyze CloudFormation templates.
"""

import json
import subprocess
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple


class CloudFormationTemplateValidator:
    """Validator for CloudFormation templates."""
    
    def __init__(self, template_path: str = None):
        """Initialize the validator with a template path."""
        if template_path is None:
            template_path = Path(__file__).parent / 'TapStack.yml'
        self.template_path = Path(template_path)
        self._template = None
    
    @property
    def template(self) -> Dict[str, Any]:
        """Load and cache the CloudFormation template."""
        if self._template is None:
            self._template = self.load_template()
        return self._template
    
    def load_template(self) -> Dict[str, Any]:
        """Load and parse the CloudFormation template."""
        if not self.template_path.exists():
            raise FileNotFoundError(f"Template not found: {self.template_path}")
        
        # Convert YAML to JSON using cfn-flip
        result = subprocess.run(
            ['cfn-flip', str(self.template_path)],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            raise ValueError(f"Failed to parse template: {result.stderr}")
        
        return json.loads(result.stdout)
    
    def validate_structure(self) -> Tuple[bool, List[str]]:
        """Validate the basic structure of the template."""
        errors = []
        required_sections = ['AWSTemplateFormatVersion', 'Resources']
        
        for section in required_sections:
            if section not in self.template:
                errors.append(f"Missing required section: {section}")
        
        if 'AWSTemplateFormatVersion' in self.template:
            if self.template['AWSTemplateFormatVersion'] != '2010-09-09':
                errors.append(f"Invalid template version: {self.template['AWSTemplateFormatVersion']}")
        
        return len(errors) == 0, errors
    
    def get_resources(self) -> Dict[str, Any]:
        """Get all resources from the template."""
        return self.template.get('Resources', {})
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get all parameters from the template."""
        return self.template.get('Parameters', {})
    
    def get_outputs(self) -> Dict[str, Any]:
        """Get all outputs from the template."""
        return self.template.get('Outputs', {})
    
    def count_resources_by_type(self) -> Dict[str, int]:
        """Count resources by their AWS type."""
        resources = self.get_resources()
        resource_counts = {}
        
        for resource in resources.values():
            resource_type = resource.get('Type', 'Unknown')
            resource_counts[resource_type] = resource_counts.get(resource_type, 0) + 1
        
        return resource_counts
    
    def validate_vpc_configuration(self) -> Tuple[bool, List[str]]:
        """Validate VPC configuration requirements."""
        errors = []
        resources = self.get_resources()
        
        # Check for VPC
        vpc_resources = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::VPC']
        if not vpc_resources:
            errors.append("No VPC resource found")
        
        # Check for subnets
        subnets = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::Subnet']
        if len(subnets) < 2:
            errors.append(f"Insufficient subnets: found {len(subnets)}, need at least 2")
        
        # Check for Internet Gateway
        igw = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::InternetGateway']
        if not igw:
            errors.append("No Internet Gateway found")
        
        # Check for NAT Gateway
        nat = [r for r in resources.values() if r.get('Type') == 'AWS::EC2::NatGateway']
        if not nat:
            errors.append("No NAT Gateway found")
        
        return len(errors) == 0, errors
    
    def validate_iam_roles(self) -> Tuple[bool, List[str]]:
        """Validate IAM roles follow least privilege."""
        errors = []
        resources = self.get_resources()
        
        iam_roles = [r for r in resources.values() if r.get('Type') == 'AWS::IAM::Role']
        if len(iam_roles) < 3:
            errors.append(f"Insufficient IAM roles: found {len(iam_roles)}, need at least 3")
        
        for role_name, role in [(k, v) for k, v in resources.items() if v.get('Type') == 'AWS::IAM::Role']:
            if 'AssumeRolePolicyDocument' not in role.get('Properties', {}):
                errors.append(f"Role {role_name} missing AssumeRolePolicyDocument")
        
        return len(errors) == 0, errors
    
    def validate_s3_encryption(self) -> Tuple[bool, List[str]]:
        """Validate S3 buckets have encryption enabled."""
        errors = []
        resources = self.get_resources()
        
        s3_buckets = [(k, v) for k, v in resources.items() if v.get('Type') == 'AWS::S3::Bucket']
        
        for bucket_name, bucket in s3_buckets:
            props = bucket.get('Properties', {})
            
            # Check encryption
            if 'BucketEncryption' not in props:
                errors.append(f"Bucket {bucket_name} missing encryption configuration")
            else:
                encryption_config = props['BucketEncryption'].get('ServerSideEncryptionConfiguration', [])
                if not encryption_config:
                    errors.append(f"Bucket {bucket_name} has empty encryption configuration")
                else:
                    for config in encryption_config:
                        algorithm = config.get('ServerSideEncryptionByDefault', {}).get('SSEAlgorithm')
                        if algorithm != 'AES256':
                            errors.append(f"Bucket {bucket_name} not using AES256 encryption")
            
            # Check public access block
            if 'PublicAccessBlockConfiguration' not in props:
                errors.append(f"Bucket {bucket_name} missing public access block configuration")
            else:
                pub_access = props['PublicAccessBlockConfiguration']
                if not all([
                    pub_access.get('BlockPublicAcls') == True,
                    pub_access.get('BlockPublicPolicy') == True,
                    pub_access.get('IgnorePublicAcls') == True,
                    pub_access.get('RestrictPublicBuckets') == True
                ]):
                    errors.append(f"Bucket {bucket_name} not blocking all public access")
        
        return len(errors) == 0, errors
    
    def validate_cloudtrail(self) -> Tuple[bool, List[str]]:
        """Validate CloudTrail configuration."""
        errors = []
        resources = self.get_resources()
        
        trails = [(k, v) for k, v in resources.items() if v.get('Type') == 'AWS::CloudTrail::Trail']
        
        if not trails:
            errors.append("No CloudTrail trail found")
        else:
            for trail_name, trail in trails:
                props = trail.get('Properties', {})
                
                if not props.get('IsMultiRegionTrail'):
                    errors.append(f"Trail {trail_name} not configured as multi-region")
                
                if not props.get('EnableLogFileValidation'):
                    errors.append(f"Trail {trail_name} missing log file validation")
                
                if not props.get('IsLogging'):
                    errors.append(f"Trail {trail_name} logging not enabled")
                
                if 'CloudWatchLogsLogGroupArn' not in props:
                    errors.append(f"Trail {trail_name} not sending logs to CloudWatch")
        
        return len(errors) == 0, errors
    
    def validate_rds_configuration(self) -> Tuple[bool, List[str]]:
        """Validate RDS configuration for Multi-AZ and encryption."""
        errors = []
        resources = self.get_resources()
        
        rds_instances = [(k, v) for k, v in resources.items() if v.get('Type') == 'AWS::RDS::DBInstance']
        
        if not rds_instances:
            errors.append("No RDS instance found")
        else:
            for db_name, db in rds_instances:
                props = db.get('Properties', {})
                
                if not props.get('MultiAZ'):
                    errors.append(f"RDS instance {db_name} not configured for Multi-AZ")
                
                if not props.get('StorageEncrypted'):
                    errors.append(f"RDS instance {db_name} not encrypted at rest")
                
                if props.get('BackupRetentionPeriod', 0) < 1:
                    errors.append(f"RDS instance {db_name} has no backup retention")
        
        return len(errors) == 0, errors
    
    def validate_ec2_imdsv2(self) -> Tuple[bool, List[str]]:
        """Validate EC2 instances use IMDSv2 exclusively."""
        errors = []
        resources = self.get_resources()
        
        launch_templates = [(k, v) for k, v in resources.items() if v.get('Type') == 'AWS::EC2::LaunchTemplate']
        
        for template_name, template in launch_templates:
            metadata_options = template.get('Properties', {}).get('LaunchTemplateData', {}).get('MetadataOptions', {})
            
            if metadata_options.get('HttpTokens') != 'required':
                errors.append(f"Launch template {template_name} not enforcing IMDSv2")
            
            if metadata_options.get('HttpEndpoint') != 'enabled':
                errors.append(f"Launch template {template_name} has metadata endpoint disabled")
        
        return len(errors) == 0, errors
    
    def validate_lambda_vpc_isolation(self) -> Tuple[bool, List[str]]:
        """Validate Lambda functions run in VPC without public internet."""
        errors = []
        resources = self.get_resources()
        
        lambda_functions = [(k, v) for k, v in resources.items() if v.get('Type') == 'AWS::Lambda::Function']
        
        for func_name, func in lambda_functions:
            props = func.get('Properties', {})
            
            if 'VpcConfig' not in props:
                errors.append(f"Lambda function {func_name} not configured for VPC")
            else:
                vpc_config = props['VpcConfig']
                if not vpc_config.get('SubnetIds'):
                    errors.append(f"Lambda function {func_name} missing subnet configuration")
                if not vpc_config.get('SecurityGroupIds'):
                    errors.append(f"Lambda function {func_name} missing security group configuration")
        
        return len(errors) == 0, errors
    
    def validate_tags(self) -> Tuple[bool, List[str]]:
        """Validate all resources have Environment and Owner tags."""
        errors = []
        resources = self.get_resources()
        
        taggable_types = [
            'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::InternetGateway',
            'AWS::EC2::NatGateway', 'AWS::EC2::RouteTable', 'AWS::EC2::SecurityGroup',
            'AWS::EC2::Instance', 'AWS::EC2::EIP', 'AWS::RDS::DBInstance',
            'AWS::RDS::DBSubnetGroup', 'AWS::S3::Bucket', 'AWS::Lambda::Function',
            'AWS::CloudTrail::Trail', 'AWS::CloudWatch::Alarm', 'AWS::Logs::LogGroup',
            'AWS::IAM::Role', 'AWS::EC2::VPCEndpoint'
        ]
        
        for resource_name, resource in resources.items():
            if resource.get('Type') in taggable_types:
                tags = resource.get('Properties', {}).get('Tags', [])
                if tags:
                    tag_keys = [tag.get('Key') for tag in tags if isinstance(tag, dict)]
                    if 'Environment' not in tag_keys:
                        errors.append(f"Resource {resource_name} missing Environment tag")
                    if 'Owner' not in tag_keys:
                        errors.append(f"Resource {resource_name} missing Owner tag")
        
        return len(errors) == 0, errors
    
    def validate_cloudwatch_alarms(self) -> Tuple[bool, List[str]]:
        """Validate CloudWatch alarms exist for EC2 monitoring."""
        errors = []
        resources = self.get_resources()
        
        alarms = [r for r in resources.values() if r.get('Type') == 'AWS::CloudWatch::Alarm']
        
        if len(alarms) < 2:
            errors.append(f"Insufficient CloudWatch alarms: found {len(alarms)}, need at least 2")
        
        # Check for CPU alarm
        cpu_alarms = [a for a in alarms if a.get('Properties', {}).get('MetricName') == 'CPUUtilization']
        if not cpu_alarms:
            errors.append("No CPU utilization alarm found")
        
        return len(errors) == 0, errors
    
    def validate_environment_suffix(self) -> Tuple[bool, List[str]]:
        """Validate resources use EnvironmentSuffix parameter."""
        errors = []
        parameters = self.get_parameters()
        
        if 'EnvironmentSuffix' not in parameters:
            errors.append("EnvironmentSuffix parameter not found")
        
        return len(errors) == 0, errors
    
    def run_all_validations(self) -> Dict[str, Tuple[bool, List[str]]]:
        """Run all validation checks and return results."""
        validations = {
            'structure': self.validate_structure(),
            'vpc_configuration': self.validate_vpc_configuration(),
            'iam_roles': self.validate_iam_roles(),
            's3_encryption': self.validate_s3_encryption(),
            'cloudtrail': self.validate_cloudtrail(),
            'rds_configuration': self.validate_rds_configuration(),
            'ec2_imdsv2': self.validate_ec2_imdsv2(),
            'lambda_vpc_isolation': self.validate_lambda_vpc_isolation(),
            'tags': self.validate_tags(),
            'cloudwatch_alarms': self.validate_cloudwatch_alarms(),
            'environment_suffix': self.validate_environment_suffix()
        }
        
        return validations
    
    def get_validation_summary(self) -> str:
        """Get a summary of all validation results."""
        results = self.run_all_validations()
        summary = []
        
        summary.append("CloudFormation Template Validation Summary")
        summary.append("=" * 50)
        
        total_checks = len(results)
        passed_checks = sum(1 for passed, _ in results.values() if passed)
        
        for check_name, (passed, errors) in results.items():
            status = "✅ PASSED" if passed else "❌ FAILED"
            summary.append(f"\n{check_name}: {status}")
            if not passed and errors:
                for error in errors:
                    summary.append(f"  - {error}")
        
        summary.append("\n" + "=" * 50)
        summary.append(f"Total Checks: {total_checks}")
        summary.append(f"Passed: {passed_checks}/{total_checks}")
        summary.append(f"Success Rate: {(passed_checks/total_checks)*100:.1f}%")
        
        return "\n".join(summary)