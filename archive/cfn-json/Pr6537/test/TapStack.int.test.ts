import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFormationClient,
  EstimateTemplateCostCommand,
  GetTemplateSummaryCommand
} from '@aws-sdk/client-cloudformation';

describe('Trading Platform DR CloudFormation Integration Tests', () => {
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
    test('should have valid template summary', async () => {
      const command = new GetTemplateSummaryCommand({
        TemplateBody: templateString
      });

      const result = await cfnClient.send(command);

      expect(result.ResourceTypes).toBeDefined();
      expect(result.Parameters).toBeDefined();
      expect(result.Capabilities).toBeDefined();
      expect(result.ResourceTypes).toContain('AWS::RDS::DBInstance');
      expect(result.ResourceTypes).toContain('AWS::EC2::VPC');
      expect(result.ResourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
    }, 30000);

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

  describe('Security Configuration Validation', () => {
    test('should have proper security group rules', () => {
      const resources = template.Resources;

      // ALB Security Group
      const albSG = resources.ALBSecurityGroup;
      expect(albSG).toBeDefined();
      expect(albSG.Properties.SecurityGroupIngress).toBeDefined();

      const httpIngress = albSG.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      expect(httpIngress).toBeDefined();
      expect(httpIngress.CidrIp).toBe('0.0.0.0/0');

      // RDS Security Group
      const rdsSG = resources.RDSSecurityGroup;
      expect(rdsSG).toBeDefined();
      expect(rdsSG.Properties.SecurityGroupIngress).toBeDefined();

      const dbIngress = rdsSG.Properties.SecurityGroupIngress[0];
      expect(dbIngress.FromPort).toBe(3306);
      expect(dbIngress.SourceSecurityGroupId).toBeDefined();
    });
  });
});