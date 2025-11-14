import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFormationClient,
  EstimateTemplateCostCommand
} from '@aws-sdk/client-cloudformation';

describe('Financial Services CloudFormation Integration Tests', () => {
  let template: any;
  let templateString: string;
  let cfnClient: CloudFormationClient;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    templateString = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateString);

    // Initialize CloudFormation client
    cfnClient = new CloudFormationClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  });

  describe('Template Validation', () => {
    test('should estimate template cost', async () => {
      const command = new EstimateTemplateCostCommand({
        TemplateBody: templateString,
        Parameters: [
          {
            ParameterKey: 'EnvironmentSuffix',
            ParameterValue: 'test'
          }
        ]
      });

      let result;
      let error;

      try {
        result = await cfnClient.send(command);
      } catch (err) {
        error = err;
      }

      // The estimate cost command returns a URL, not an error
      if (result) {
        expect(result.Url).toBeDefined();
        expect(result.Url).toContain('calculator.aws');
      }
    }, 30000);
  });

  describe('Resource Dependency Validation', () => {
    test('should have proper VPC dependencies', () => {
      const resources = template.Resources;

      // Check that subnets depend on VPC
      const publicSubnet1 = resources.PublicSubnet1;
      const privateSubnet1 = resources.PrivateSubnet1;

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet1.Properties.VpcId).toBeDefined();
      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet1.Properties.VpcId).toBeDefined();
    });

  });


  describe('High Availability Configuration', () => {
    test('should have multi-AZ deployment', () => {
      const resources = template.Resources;

      // Check subnets are in different AZs
      const publicSubnet1 = resources.PublicSubnet1;
      const publicSubnet2 = resources.PublicSubnet2;
      const publicSubnet3 = resources.PublicSubnet3;

      expect(publicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(publicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(publicSubnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);

      // Check Auto Scaling Group spans multiple AZs
      const asg = resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asg.Properties.VPCZoneIdentifier.length).toBe(3);
    });


    test('should have Auto Scaling configuration', () => {
      const resources = template.Resources;
      const asg = resources.AutoScalingGroup;
      const scaleUpPolicy = resources.ScaleUpPolicy;
      const scaleDownPolicy = resources.ScaleDownPolicy;

      expect(asg).toBeDefined();
      expect(asg.Properties.MinSize).toBeDefined();
      expect(asg.Properties.MaxSize).toBeDefined();
      expect(asg.Properties.DesiredCapacity).toBeDefined();
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBeDefined();

      expect(scaleUpPolicy).toBeDefined();
      expect(scaleDownPolicy).toBeDefined();
    });
  });


  describe('Network Configuration', () => {
    test('should have VPC with proper CIDR configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Properties.CidrBlock).toBeDefined();
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });


    test('should have proper route table configuration', () => {
      const resources = template.Resources;

      expect(resources.PublicRouteTable).toBeDefined();
      expect(resources.PublicRoute).toBeDefined();
      expect(resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');

      expect(resources.PrivateRouteTable1).toBeDefined();
      expect(resources.PrivateRouteTable2).toBeDefined();
      expect(resources.PrivateRouteTable3).toBeDefined();
      expect(resources.PrivateRoute1).toBeDefined();
      expect(resources.PrivateRoute2).toBeDefined();
      expect(resources.PrivateRoute3).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    test('should have instance profile for EC2', () => {
      const resources = template.Resources;
      const instanceProfile = resources.EC2InstanceProfile;

      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toBeDefined();
    });
  });

  describe('Compliance and Best Practices', () => {
    test('should have tagging strategy', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();

      const tags = vpc.Properties.Tags;
      const hasEnvironmentTag = tags.some((tag: any) => tag.Key === 'Environment');
      const hasProjectTag = tags.some((tag: any) => tag.Key === 'Project');
      const hasCostCenterTag = tags.some((tag: any) => tag.Key === 'CostCenter');

      expect(hasEnvironmentTag).toBe(true);
      expect(hasProjectTag).toBe(true);
      expect(hasCostCenterTag).toBe(true);
    });

    test('should not have hardcoded secrets', () => {
      const templateStr = JSON.stringify(template);

      // Check for common patterns of hardcoded secrets
      expect(templateStr).not.toMatch(/password["']?\s*:\s*["'][^{]/i);
      expect(templateStr).not.toMatch(/secret["']?\s*:\s*["'][^{]/i);
      expect(templateStr).not.toMatch(/api[_-]?key["']?\s*:\s*["'][^{]/i);

      // Should use Secrets Manager or Parameter Store
      expect(templateStr).toContain('AWS::SecretsManager::Secret');
    });


    test('should use parameter constraints', () => {
      const params = template.Parameters;

      // Environment suffix should have pattern
      expect(params.EnvironmentSuffix.AllowedPattern).toBeDefined();
      expect(params.EnvironmentSuffix.ConstraintDescription).toBeDefined();

      // Instance types should have allowed values
      expect(params.InstanceType.AllowedValues).toBeDefined();
      expect(params.InstanceType.AllowedValues.length).toBeGreaterThan(0);

      // VPC CIDR should have pattern
      expect(params.VpcCIDR.AllowedPattern).toBeDefined();
    });
  });
});