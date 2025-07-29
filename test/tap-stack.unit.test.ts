import fs from 'fs';
import path from 'path';

describe('Secure Web Application Infrastructure Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Secure Web Application Infrastructure');
    });

    test('should define resources', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should define EnvironmentName parameter', () => {
      expect(template.Parameters?.EnvironmentName).toBeDefined();
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toContain('Environment name');
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'KMSKey',
      'KMSAlias',
      'AppDataBucket',
      'AppVPC',
      'InternetGateway',
      'AttachGateway',
      'PublicRouteTable',
      'PublicRoute',
      'PublicSubnet1',
      'PublicSubnet2',
      'PublicSubnet1RouteTableAssociation',
      'PublicSubnet2RouteTableAssociation',
      'WebAppSecurityGroup',
      'WebAppRole',
      'ApiGatewayServiceRole',
      'ApiLogGroup',
      'ApiGatewayRestApi',
      'ApiGatewayRootResource',
      'ApiGatewayGetMethod',
      'ApiGatewayDeployment',
      'ApiGatewayStage'
    ];

    test.each(expectedResources)('should contain %s resource', (resName) => {
      expect(template.Resources[resName]).toBeDefined();
    });

    test('WebAppRole should reference the KMSKey ARN correctly', () => {
      const role = template.Resources.WebAppRole;
      const kmsStatement = role.Properties.Policies[0].PolicyDocument.Statement.find(
        (stmt: any) => stmt.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement.Resource).toEqual({
        'Fn::Sub': 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/${KMSKey}'
      });
    });

    test('ApiGatewayDeployment should depend on ApiGatewayGetMethod', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment.DependsOn).toContain('ApiGatewayGetMethod');
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'S3BucketName',
      'VPCId',
      'Subnet1Id',
      'Subnet2Id',
      'SecurityGroupId',
      'ApiEndpoint'
    ];

    test.each(expectedOutputs)('should define %s output', (outputName) => {
      expect(template.Outputs[outputName]).toBeDefined();
    });

    test('ApiEndpoint output should include correct URL structure', () => {
      const endpointOutput = template.Outputs.ApiEndpoint;
      expect(endpointOutput.Value['Fn::Sub']).toContain('execute-api');
      expect(endpointOutput.Value['Fn::Sub']).toContain('${EnvironmentName}');
    });
  });

  describe('Template Validation', () => {
    test('template object should be defined and valid', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('all critical sections should be non-null', () => {
      expect(template.Resources).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});
