import { TapStack } from '../lib/tap-stack';

describe('Terraform Stack Structure', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully via props', () => {
      stack = new TapStack(null, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });

      // Verify that TapStack instantiates without errors via props
      expect(stack).toBeDefined();
      expect(stack.environmentSuffix).toBe('prod');
      expect(stack.stateBucket).toBe('custom-state-bucket');
      expect(stack.stateBucketRegion).toBe('us-west-2');
      expect(stack.awsRegion).toBe('us-west-2');
    });

    test('TapStack uses default values when no props provided', () => {
      stack = new TapStack(null, 'TestTapStackDefault');

      // Verify that TapStack instantiates without errors when no props are provided
      expect(stack).toBeDefined();
      expect(stack.environmentSuffix).toBe('dev');
      expect(stack.stateBucketRegion).toBe('us-east-1');
      expect(stack.awsRegion).toBe('us-east-1');
    });
  });

  describe('Terraform File Loading', () => {
    beforeEach(() => {
      stack = new TapStack(null, 'TestStack');
    });

    test('loads Terraform files from secure_env directory', () => {
      expect(stack.terraformFiles.size).toBeGreaterThan(0);
      expect(stack.terraformFiles.has('security_groups.tf')).toBe(true);
      expect(stack.terraformFiles.has('iam.tf')).toBe(true);
      expect(stack.terraformFiles.has('ec2.tf')).toBe(true);
    });

    test('validates Terraform syntax', () => {
      expect(() => stack.validateTerraformSyntax()).not.toThrow();
      expect(stack.validateTerraformSyntax()).toBe(true);
    });

    test('throws error for invalid Terraform syntax', () => {
      // Create a stack with invalid terraform content
      const mockStack = new TapStack(null, 'InvalidStack');
      // Simulate invalid terraform file with unbalanced braces
      mockStack.terraformFiles.set('invalid.tf', 'resource "aws_instance" "test" {\n  ami = "ami-123"');
      
      expect(() => mockStack.validateTerraformSyntax()).toThrow('Invalid Terraform syntax in invalid.tf');
    });
  });

  describe('Security Requirements', () => {
    beforeEach(() => {
      stack = new TapStack(null, 'TestStack');
    });

    test('has required tags (Environment and Owner)', () => {
      expect(stack.hasRequiredTags()).toBe(true);
    });

    test('has security group with restricted ports', () => {
      expect(stack.hasSecurityGroup()).toBe(true);
      expect(stack.hasRestrictedPorts()).toBe(true);
    });

    test('has IAM role for cross-account access', () => {
      expect(stack.hasIAMRole()).toBe(true);
    });

    test('has EC2 instance', () => {
      expect(stack.hasEC2Instance()).toBe(true);
    });

    test('has encrypted storage', () => {
      expect(stack.hasEncryptedStorage()).toBe(true);
    });

    test('has outputs defined', () => {
      expect(stack.hasOutputs()).toBe(true);
    });
  });

  describe('Resource Analysis', () => {
    beforeEach(() => {
      stack = new TapStack(null, 'TestStack');
    });

    test('counts all resources correctly', () => {
      const resourceCount = stack.getResourceCount();
      expect(resourceCount).toBeGreaterThan(0);
      expect(resourceCount).toBeGreaterThanOrEqual(5); // At least security group, IAM role, EC2 instance, etc.
    });

    test('identifies all resource types', () => {
      const resourceTypes = stack.getAllResourceTypes();
      expect(resourceTypes).toContain('aws_security_group');
      expect(resourceTypes).toContain('aws_iam_role');
      expect(resourceTypes).toContain('aws_instance');
      expect(resourceTypes).toContain('aws_iam_policy');
      expect(resourceTypes).toContain('aws_iam_instance_profile');
    });

    test('ensures all required AWS resource types are present', () => {
      const resourceTypes = stack.getAllResourceTypes();
      const requiredTypes = [
        'aws_security_group',
        'aws_iam_role',
        'aws_instance',
        'aws_iam_policy',
        'aws_iam_role_policy_attachment',
        'aws_iam_instance_profile'
      ];

      requiredTypes.forEach(type => {
        expect(resourceTypes).toContain(type);
      });
    });
  });

  describe('Configuration Validation', () => {
    beforeEach(() => {
      stack = new TapStack(null, 'TestStack');
    });

    test('validates security group configuration', () => {
      const securityGroupsContent = stack.terraformFiles.get('security_groups.tf') || '';
      
      // Check HTTP port configuration
      expect(securityGroupsContent).toMatch(/from_port\s*=\s*80/);
      expect(securityGroupsContent).toMatch(/to_port\s*=\s*80/);
      
      // Check HTTPS port configuration
      expect(securityGroupsContent).toMatch(/from_port\s*=\s*443/);
      expect(securityGroupsContent).toMatch(/to_port\s*=\s*443/);
      
      // Check CIDR block restrictions
      expect(securityGroupsContent).toMatch(/cidr_blocks\s*=\s*var\.allowed_cidr_blocks/);
    });

    test('validates IAM role trust policy', () => {
      const iamContent = stack.terraformFiles.get('iam.tf') || '';
      
      // Check cross-account trust policy
      expect(iamContent).toMatch(/sts:AssumeRole/);
      expect(iamContent).toMatch(/var\.trusted_account_id/);
      
      // Check for external ID condition
      expect(iamContent).toMatch(/sts:ExternalId/);
    });

    test('validates EC2 instance security configuration', () => {
      const ec2Content = stack.terraformFiles.get('ec2.tf') || '';
      
      // Check encryption
      expect(ec2Content).toMatch(/encrypted\s*=\s*true/);
      
      // Check monitoring
      expect(ec2Content).toMatch(/monitoring\s*=\s*true/);
      
      // Check EBS optimization
      expect(ec2Content).toMatch(/ebs_optimized\s*=\s*true/);
      
      // Check termination protection (disabled for automated testing)
      expect(ec2Content).toMatch(/disable_api_termination\s*=\s*false/);
    });

    test('validates provider configuration', () => {
      const providerContent = stack.terraformFiles.get('provider.tf') || '';
      
      // Check Terraform version constraint
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
      
      // Check AWS provider version
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });

    test('validates variable definitions', () => {
      const variablesContent = stack.terraformFiles.get('variables.tf') || '';
      
      // Check required variables
      expect(variablesContent).toMatch(/variable\s+"trusted_account_id"/);
      expect(variablesContent).toMatch(/variable\s+"allowed_cidr_blocks"/);
      expect(variablesContent).toMatch(/variable\s+"instance_type"/);
    });

    test('validates output definitions', () => {
      const outputsContent = stack.terraformFiles.get('outputs.tf') || '';
      
      // Check required outputs
      expect(outputsContent).toMatch(/output\s+"instance_id"/);
      expect(outputsContent).toMatch(/output\s+"security_group_id"/);
      expect(outputsContent).toMatch(/output\s+"cross_account_role_arn"/);
    });
  });
});

describe('Terraform Configuration Content', () => {
  let stack: TapStack;

  beforeEach(() => {
    stack = new TapStack(null, 'ContentTestStack');
  });

  test('validates locals configuration', () => {
    const localsContent = stack.terraformFiles.get('locals.tf') || '';
    
    expect(localsContent).toMatch(/Environment\s*=\s*"Production"/);
    expect(localsContent).toMatch(/Owner\s*=\s*"SecurityTeam"/);
  });

  test('validates data sources', () => {
    const dataContent = stack.terraformFiles.get('data.tf') || '';
    
    expect(dataContent).toMatch(/data\s+"aws_vpc"\s+"default"/);
    expect(dataContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    expect(dataContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });
});
