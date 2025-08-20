import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Generate JSON first: `pipenv run cfn-flip ./lib/TapStack.yml > ./lib/TapStack.json`
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('has valid format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBe(
        'Secure, scalable, and compliant AWS infrastructure foundation - TapStack'
      );
    });
  });

  describe('Parameters', () => {
    test('includes required parameters', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.DBUsername).toBeDefined();
      // Secrets are now provided via Secrets Manager dynamic reference (DBMasterSecret),
      // so there is no DBPassword parameter anymore.
      expect(template.Parameters.DBPassword).toBeUndefined();

      // New parameters for optional reuse/conditional creation
      expect(template.Parameters.UseExistingCloudTrail).toBeDefined();
      expect(template.Parameters.ExistingCloudTrailArn).toBeDefined();
      expect(template.Parameters.UseExistingCloudFrontWebACL).toBeDefined();
      expect(template.Parameters.ExistingCloudFrontWebACLArn).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('core resources exist', () => {
      const r = template.Resources;
      ['VPC', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway', 'ApplicationDataBucket', 'LambdaFunction', 'CloudFrontDistribution', 'WebACL', 'CloudTrail']
        .forEach(key => expect(r[key]).toBeDefined());
    });

    test('IAM roles and security groups do not use explicit names', () => {
      const iamRole = template.Resources.LambdaExecutionRole;
      expect(iamRole.Properties.RoleName).toBeUndefined();

      const cfgRole = template.Resources.ConfigRole;
      expect(cfgRole.Properties.RoleName).toBeUndefined();

      const dbSg = template.Resources.DatabaseSecurityGroup;
      expect(dbSg.Properties.GroupName).toBeUndefined();

      const lambdaSg = template.Resources.LambdaSecurityGroup;
      expect(lambdaSg.Properties.GroupName).toBeUndefined();
    });

    test('Lambda runtime is python3.12 and VPC config present', () => {
      const fn = template.Resources.LambdaFunction;
      expect(fn.Properties.Runtime).toBe('python3.12');
      expect(fn.Properties.VpcConfig).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('expected outputs exist', () => {
      const expected = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ApplicationDataBucketName',
        'DatabaseEndpoint',
        'LambdaFunctionArn',
        'CloudFrontDistributionId',
        'CloudFrontDistributionDomainName',
        'WebACLArn',
        'CloudTrailArn',
      ];
      expected.forEach(o => expect(template.Outputs[o]).toBeDefined());
    });
  });
});
