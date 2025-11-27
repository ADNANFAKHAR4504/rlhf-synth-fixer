import fs from 'fs';
import path from 'path';

describe('Credit Scoring CloudFormation Integration', () => {
  test('CloudFormation template file should exist', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    expect(fs.existsSync(templatePath)).toBe(true);
  });

  test('Template should be valid JSON', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const content = fs.readFileSync(templatePath, 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test('PROMPT.md file should exist', () => {
    const promptPath = path.join(__dirname, '../lib/PROMPT.md');
    expect(fs.existsSync(promptPath)).toBe(true);
  });

  test('IDEAL_RESPONSE.md file should exist', () => {
    const idealPath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
    expect(fs.existsSync(idealPath)).toBe(true);
  });

  test('MODEL_FAILURES.md file should exist', () => {
    const failuresPath = path.join(__dirname, '../lib/MODEL_FAILURES.md');
    expect(fs.existsSync(failuresPath)).toBe(true);
  });

  test('metadata.json should exist and be valid', () => {
    const metadataPath = path.join(__dirname, '../metadata.json');
    expect(fs.existsSync(metadataPath)).toBe(true);
    const content = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(content);
    expect(metadata.platform).toBe('cfn');
    expect(metadata.language).toBe('json');
  });

  test('Template should have required CloudFormation sections', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const content = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(content);

    expect(template.AWSTemplateFormatVersion).toBeDefined();
    expect(template.Description).toBeDefined();
    expect(template.Parameters).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(template.Outputs).toBeDefined();
  });

  test('All resources should have valid types', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const content = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(content);

    const validTypes = [
      'AWS::DynamoDB::Table',
      'AWS::IAM::Role',
      'AWS::Lambda::Function',
      'AWS::Events::Rule',
      'AWS::Lambda::Permission',
      'AWS::EC2::VPC',
      'AWS::EC2::InternetGateway',
      'AWS::EC2::VPCGatewayAttachment',
      'AWS::EC2::Subnet',
      'AWS::EC2::RouteTable',
      'AWS::EC2::Route',
      'AWS::EC2::SubnetRouteTableAssociation',
      'AWS::EC2::EIP',
      'AWS::EC2::NatGateway',
      'AWS::KMS::Key',
      'AWS::KMS::Alias',
      'AWS::EC2::SecurityGroup',
      'AWS::EC2::SecurityGroupIngress',
      'AWS::EC2::SecurityGroupEgress',
      'AWS::RDS::DBSubnetGroup',
      'AWS::RDS::DBCluster',
      'AWS::RDS::DBInstance',
      'AWS::Logs::LogGroup',
      'AWS::Lambda::Url',
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      'AWS::S3::Bucket',
      'AWS::S3::BucketPolicy',
      'AWS::ElasticLoadBalancingV2::TargetGroup',
      'AWS::ElasticLoadBalancingV2::Listener',
      'AWS::SecretsManager::Secret'
    ];

    Object.values(template.Resources).forEach((resource: any) => {
      expect(validTypes).toContain(resource.Type);
    });
  });

  test('Outputs should reference existing resources', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const content = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(content);

    const resourceNames = Object.keys(template.Resources);

    Object.values(template.Outputs).forEach((output: any) => {
      if (output.Value.Ref) {
        expect(resourceNames).toContain(output.Value.Ref);
      }
      if (output.Value['Fn::GetAtt']) {
        expect(resourceNames).toContain(output.Value['Fn::GetAtt'][0]);
      }
    });
  });

  test('Parameters should be referenced in resources', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const content = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(content);

    const parameterNames = Object.keys(template.Parameters);
    let parameterUsed = false;

    // Check if any parameter is referenced in resource properties
    const templateString = JSON.stringify(template);
    parameterNames.forEach(paramName => {
      if (templateString.includes(`\${${paramName}}`)) {
        parameterUsed = true;
      }
    });

    expect(parameterUsed).toBe(true);
  });

  test('Lambda functions should have proper IAM roles', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const content = fs.readFileSync(templatePath, 'utf8');
    const template = JSON.parse(content);

    const lambdaFunctions = Object.values(template.Resources).filter((resource: any) =>
      resource.Type === 'AWS::Lambda::Function'
    );

    lambdaFunctions.forEach((lambda: any) => {
      expect(lambda.Properties.Role).toBeDefined();
      expect(lambda.Properties.Role['Fn::GetAtt']).toBeDefined();
      expect(lambda.Properties.Role['Fn::GetAtt'][0]).toBe('LambdaExecutionRole');
    });
  });
});
