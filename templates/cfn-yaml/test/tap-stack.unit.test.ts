import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

describe('Secure Web Infrastructure Unit Test', () => {
  let template: Template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../../../templates/cfn-yaml/lib/TapStack.yml');
    const file = fs.readFileSync(templatePath, 'utf8');
    const parsed = yaml.parse(file);
    template = Template.fromJSON(parsed);
  });

  test('VPC should be created with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16'
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
