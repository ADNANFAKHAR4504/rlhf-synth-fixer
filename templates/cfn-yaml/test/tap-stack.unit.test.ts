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
    test('Dont forget!', async () => {
      expect(false).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  test('EC2 Instance should be of type t2.micro', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro'
    });
  });

  test('Security Group should allow SSH and HTTP', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        { FromPort: 22, ToPort: 22, IpProtocol: 'tcp' },
        { FromPort: 80, ToPort: 80, IpProtocol: 'tcp' }
      ]
    });
  });

  test('Internet Gateway should be attached to the VPC', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });

  test('At least one public subnet should exist', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 2); // Adjust if dynamic
  });

  test('Outputs must include public IP and VPC ID', () => {
    template.hasOutput('VpcId', {});
    template.hasOutput('InstancePublicIp', {});
  });
});
