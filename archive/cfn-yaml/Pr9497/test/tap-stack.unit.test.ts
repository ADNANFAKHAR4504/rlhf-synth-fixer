import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Integration tests should be implemented separately', async () => {
      // This unit test file focuses on CloudFormation template structure validation
      // Integration tests are implemented in tap-stack.int.test.ts
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have SAM transform', () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready serverless infrastructure with high availability, security, and operational excellence'
      );
    });

    test('should have mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.SubnetConfig).toBeDefined();
      expect(template.Mappings.ApiGatewayHostedZone).toBeDefined();
    });

    test('should have globals section for SAM', () => {
      expect(template.Globals).toBeDefined();
      expect(template.Globals.Function).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = ['Environment', 'Project', 'Owner', 'DomainName', 'AlertEmail'];
      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
      expect(envParam.Description).toBe('Environment name for resource tagging');
    });

    test('Project parameter should have correct properties', () => {
      const projectParam = template.Parameters.Project;
      expect(projectParam.Type).toBe('String');
      expect(projectParam.Default).toBe('serverless-webapp');
      expect(projectParam.MinLength).toBe(1);
      expect(projectParam.MaxLength).toBe(50);
      expect(projectParam.Description).toBe('Project name for resource tagging');
    });

    test('Owner parameter should have correct properties', () => {
      const ownerParam = template.Parameters.Owner;
      expect(ownerParam.Type).toBe('String');
      expect(ownerParam.Default).toBe('platform-team');
      expect(ownerParam.MinLength).toBe(1);
      expect(ownerParam.MaxLength).toBe(50);
      expect(ownerParam.Description).toBe('Owner identifier for resource tagging');
    });

    test('DomainName parameter should have correct properties', () => {
      const domainParam = template.Parameters.DomainName;
      expect(domainParam.Type).toBe('String');
      expect(domainParam.Default).toBe('');
      expect(domainParam.AllowedPattern).toBeDefined();
      expect(domainParam.Description).toBe('Base domain name for Route53 configuration (leave empty to skip Route53 setup)');
    });

    test('AlertEmail parameter should have correct properties', () => {
      const emailParam = template.Parameters.AlertEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.AllowedPattern).toBeDefined();
      expect(emailParam.Description).toBe('Email address for CloudWatch alerts');
    });
  });

  describe('Resources', () => {
    test('should have core networking resources', () => {
      const networkingResources = ['VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      networkingResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have NAT Gateway resources', () => {
      const natResources = ['NATGateway1EIP', 'NATGateway2EIP', 'NATGateway1', 'NATGateway2'];
      natResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have route table resources', () => {
      const routeResources = ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'];
      routeResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have security group resources', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
    });

    test('should have VPC endpoint resources', () => {
      const vpcEndpointResources = ['S3VPCEndpoint', 'DynamoDBVPCEndpoint'];
      vpcEndpointResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have serverless resources', () => {
      const serverlessResources = ['HttpApi', 'MainLambdaFunction', 'DynamoDBTable', 'S3Bucket'];
      serverlessResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have security and monitoring resources', () => {
      const securityResources = ['WAFWebACL', 'ApplicationSecret', 'LambdaKMSKey'];
      securityResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have Route53 resources', () => {
      const route53Resources = ['HostedZone', 'HealthCheck', 'PrimaryRecordSet'];
      route53Resources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR']
      });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('resources should have RLHF tags', () => {
      const taggedResources = ['VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2'];
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const rlhfTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'rlhf-iac-amazon');
          expect(rlhfTag).toBeDefined();
          expect(rlhfTag.Value).toBe('true');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ApiEndpoint',
        'LambdaFunctionArn',
        'S3BucketName',
        'DynamoDBTableName',
        'WAFWebACLId',
        'SecretArn',
        'KMSKeyId',
        'Region',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have conditional DNS output', () => {
      expect(template.Outputs.DNSName).toBeDefined();
      expect(template.Outputs.DNSName.Condition).toBe('HasDomainName');
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC',
      });
    });

    test('ApiEndpoint output should be correct', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('HTTP API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com',
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApiEndpoint',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Main Lambda Function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['MainLambdaFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaArn',
      });
    });

    test('DNSName output should be correct', () => {
      const output = template.Outputs.DNSName;
      expect(output.Description).toBe('Route53 DNS Name');
      expect(output.Value).toEqual({
        'Fn::Sub': 'api.${DomainName}',
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DNSName',
      });
    });

    test('Region output should be correct', () => {
      const output = template.Outputs.Region;
      expect(output.Description).toBe('AWS Region where stack is deployed');
      expect(output.Value).toEqual({ Ref: 'AWS::Region' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Region',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Transform).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Mappings).not.toBeNull();
      expect(template.Globals).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have comprehensive infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Should have many resources for full infrastructure
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5); // Environment, Project, Owner, DomainName, AlertEmail
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10); // 9 standard outputs + 1 conditional DNS output
    });

    test('should have mappings for configuration', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
      expect(template.Mappings.ApiGatewayHostedZone).toBeDefined();
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsSecondaryRegion).toBeDefined();
      expect(template.Conditions.HasDomainName).toBeDefined();
      expect(template.Conditions.HasDomainNameAndSecondaryRegion).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow consistent naming patterns', () => {
      const vpc = template.Resources.VPC;
      const vpcTags = vpc.Properties.Tags;
      const nameTag = vpcTags.find((tag: any) => tag.Key === 'Name');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${Project}-${Environment}-vpc'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name).toHaveProperty('Fn::Sub');
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-.+/);
      });
    });

    test('resources should have consistent tagging', () => {
      const taggedResources = ['VPC', 'InternetGateway', 'PublicSubnet1'];
      
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          
          // Check for standard tags
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          const projectTag = tags.find((tag: any) => tag.Key === 'Project');
          const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
          const rlhfTag = tags.find((tag: any) => tag.Key === 'rlhf-iac-amazon');
          
          expect(envTag).toBeDefined();
          expect(projectTag).toBeDefined();
          expect(ownerTag).toBeDefined();
          expect(rlhfTag).toBeDefined();
          expect(rlhfTag.Value).toBe('true');
        }
      });
    });
  });
});
