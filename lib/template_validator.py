"""CloudFormation template validator module."""
import json
import yaml
import subprocess
import os


class CloudFormationTemplateValidator:
    """Validator for CloudFormation templates."""
    
    def __init__(self, template_path):
        """Initialize validator with template path."""
        self.template_path = template_path
        self.template = None
        self._load_template()
    
    def _load_template(self):
        """Load CloudFormation template from file."""
        if not os.path.exists(self.template_path):
            raise FileNotFoundError(f"Template not found: {self.template_path}")
        
        # Use cfn-flip to convert YAML to JSON
        try:
            result = subprocess.run(['cfn-flip', self.template_path], 
                                  capture_output=True, text=True, check=True)
            self.template = json.loads(result.stdout)
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            # Fallback to basic YAML loader with custom constructors
            with open(self.template_path, 'r') as f:
                content = f.read()
                # Replace CloudFormation intrinsic functions for basic parsing
                for func in ['!Ref', '!GetAtt', '!Sub', '!Join', '!Select', '!Split']:
                    content = content.replace(func, '')
                self.template = yaml.safe_load(content)
    
    def validate_structure(self):
        """Validate template has required structure."""
        required_sections = ['AWSTemplateFormatVersion', 'Resources']
        for section in required_sections:
            if section not in self.template:
                raise ValueError(f"Missing required section: {section}")
        return True
    
    def validate_parameters(self, required_params):
        """Validate required parameters exist."""
        if 'Parameters' not in self.template:
            raise ValueError("No parameters section found")
        
        for param in required_params:
            if param not in self.template['Parameters']:
                raise ValueError(f"Missing required parameter: {param}")
        return True
    
    def validate_resources(self, required_resources):
        """Validate required resources exist."""
        for resource in required_resources:
            if resource not in self.template['Resources']:
                raise ValueError(f"Missing required resource: {resource}")
        return True
    
    def validate_outputs(self, required_outputs):
        """Validate required outputs exist."""
        if 'Outputs' not in self.template:
            raise ValueError("No outputs section found")
        
        for output in required_outputs:
            if output not in self.template['Outputs']:
                raise ValueError(f"Missing required output: {output}")
        return True
    
    def validate_resource_types(self, resource_type_map):
        """Validate resource types match expected."""
        for resource_name, expected_type in resource_type_map.items():
            if resource_name in self.template['Resources']:
                actual_type = self.template['Resources'][resource_name].get('Type')
                if actual_type != expected_type:
                    raise ValueError(f"Resource {resource_name} has wrong type: {actual_type}")
        return True
    
    def validate_no_retain_policies(self):
        """Validate no resources have Retain deletion policy."""
        for resource_name, resource in self.template['Resources'].items():
            deletion_policy = resource.get('DeletionPolicy', 'Delete')
            if deletion_policy == 'Retain':
                raise ValueError(f"Resource {resource_name} has Retain policy")
        return True
    
    def validate_encryption(self):
        """Validate encryption is enabled on sensitive resources."""
        # Check S3 buckets
        for resource_name, resource in self.template['Resources'].items():
            if resource.get('Type') == 'AWS::S3::Bucket':
                props = resource.get('Properties', {})
                if 'BucketEncryption' not in props:
                    raise ValueError(f"S3 bucket {resource_name} missing encryption")
            
            elif resource.get('Type') == 'AWS::RDS::DBInstance':
                props = resource.get('Properties', {})
                if not props.get('StorageEncrypted'):
                    raise ValueError(f"RDS instance {resource_name} not encrypted")
        return True
    
    def validate_security_configuration(self):
        """Validate security best practices."""
        errors = []
        
        # Check RDS is not publicly accessible
        for resource_name, resource in self.template['Resources'].items():
            if resource.get('Type') == 'AWS::RDS::DBInstance':
                props = resource.get('Properties', {})
                if props.get('PubliclyAccessible', False):
                    errors.append(f"RDS {resource_name} is publicly accessible")
        
        # Check S3 public access is blocked
        for resource_name, resource in self.template['Resources'].items():
            if resource.get('Type') == 'AWS::S3::Bucket':
                props = resource.get('Properties', {})
                pac = props.get('PublicAccessBlockConfiguration', {})
                if not pac.get('BlockPublicAcls', False):
                    errors.append(f"S3 bucket {resource_name} allows public ACLs")
        
        if errors:
            raise ValueError(f"Security issues found: {', '.join(errors)}")
        return True
    
    def validate_high_availability(self):
        """Validate high availability configuration."""
        # Check for multiple subnets
        subnets = [r for r, v in self.template['Resources'].items() 
                  if v.get('Type') == 'AWS::EC2::Subnet']
        if len(subnets) < 2:
            raise ValueError("Not enough subnets for high availability")
        
        # Check for NAT Gateway redundancy
        nat_gateways = [r for r, v in self.template['Resources'].items()
                       if v.get('Type') == 'AWS::EC2::NatGateway']
        if len(nat_gateways) < 2:
            raise ValueError("Not enough NAT Gateways for high availability")
        
        return True
    
    def validate_monitoring(self):
        """Validate monitoring and logging configuration."""
        # Check for CloudWatch Log Groups
        log_groups = [r for r, v in self.template['Resources'].items()
                     if v.get('Type') == 'AWS::Logs::LogGroup']
        if len(log_groups) < 1:
            raise ValueError("No CloudWatch Log Groups found")
        
        # Check for CloudWatch Alarms
        alarms = [r for r, v in self.template['Resources'].items()
                 if v.get('Type') == 'AWS::CloudWatch::Alarm']
        if len(alarms) < 1:
            raise ValueError("No CloudWatch Alarms found")
        
        return True
    
    def validate_autoscaling(self):
        """Validate auto-scaling configuration."""
        # Find ASG
        asg_resources = [r for r, v in self.template['Resources'].items()
                        if v.get('Type') == 'AWS::AutoScaling::AutoScalingGroup']
        
        if not asg_resources:
            raise ValueError("No Auto Scaling Group found")
        
        for asg_name in asg_resources:
            asg = self.template['Resources'][asg_name]
            props = asg.get('Properties', {})
            
            # Validate min/max sizes
            min_size = props.get('MinSize', 0)
            max_size = props.get('MaxSize', 0)
            
            if min_size < 1:
                raise ValueError(f"ASG {asg_name} min size too low")
            if max_size <= min_size:
                raise ValueError(f"ASG {asg_name} max size not greater than min")
            
            # Check health check type
            if props.get('HealthCheckType') != 'ELB':
                raise ValueError(f"ASG {asg_name} should use ELB health checks")
        
        return True
    
    def validate_waf(self):
        """Validate WAF configuration."""
        waf_resources = [r for r, v in self.template['Resources'].items()
                        if v.get('Type') == 'AWS::WAFv2::WebACL']
        
        if not waf_resources:
            raise ValueError("No WAF Web ACL found")
        
        for waf_name in waf_resources:
            waf = self.template['Resources'][waf_name]
            props = waf.get('Properties', {})
            
            # Check for rules
            rules = props.get('Rules', [])
            if len(rules) < 1:
                raise ValueError(f"WAF {waf_name} has no rules")
            
            # Check for OWASP Core Rule Set
            has_core_rules = any('AWSManagedRulesCommonRuleSet' in str(rule) 
                                for rule in rules)
            if not has_core_rules:
                raise ValueError(f"WAF {waf_name} missing OWASP Core Rule Set")
        
        return True
    
    def validate_all(self):
        """Run all validations."""
        validations = [
            self.validate_structure(),
            self.validate_no_retain_policies(),
            self.validate_encryption(),
            self.validate_security_configuration(),
            self.validate_high_availability(),
            self.validate_monitoring(),
            self.validate_autoscaling(),
            self.validate_waf()
        ]
        return all(validations)


def validate_template(template_path):
    """Convenience function to validate a template."""
    validator = CloudFormationTemplateValidator(template_path)
    return validator.validate_all()