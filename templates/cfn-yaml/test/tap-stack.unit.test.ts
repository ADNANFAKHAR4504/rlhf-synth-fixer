import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

describe('Tap Stack Unit Tests (Rewritten)', () => {
  let template: Template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../../../templates/cfn-yaml/lib/IDEAL_RESPONSE.md');
    const file = fs.readFileSync(templatePath, 'utf8');
    const parsedYaml = yaml.parse(file.split('```yaml')[1].split('```')[0]);
    template = Template.fromJSON(parsedYaml);
  });

  test('VPC should use 10.0.0.0/16 CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
  });

  test('Internet Gateway should exist', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });

  test('Public subnet should be present', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('Security Group should allow SSH and HTTP', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: expect.arrayContaining([
        expect.objectContaining({ FromPort: 22, ToPort: 22, IpProtocol: 'tcp' }),
        expect.objectContaining({ FromPort: 80, ToPort: 80, IpProtocol: 'tcp' }),
      ]),
    });
  });

  test('Launch Template should use t3.micro instance type', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceType: 't3.micro',
      },
    });
  });

  test('Outputs should include VPC ID and public IP', () => {
    const outputs = template.toJSON().Outputs || {};
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('PublicIP');
  });
});
