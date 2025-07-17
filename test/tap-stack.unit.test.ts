import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

describe('Secure Web Infrastructure Unit Test', () => {
  let template: Template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
    const file = fs.readFileSync(templatePath, 'utf8');
    const parsedYaml = yaml.parse(file.split('```yaml')[1].split('```')[0], { logLevel: 'silent' });
    template = Template.fromJSON(parsedYaml);
  });

  test('VPC should be created with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16'
    });
  });

  test('Launch Template should be of type t3.micro', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: {
        InstanceType: 't3.micro'
      }
    });
  });

  test('Security Group should allow HTTP and HTTPS', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        { FromPort: 80, ToPort: 80, IpProtocol: 'tcp' },
        { FromPort: 443, ToPort: 443, IpProtocol: 'tcp' }
      ]
    });
  });

  test('Internet Gateway should be attached to the VPC', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });

  test('Three public subnets should exist for multi-AZ deployment', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 3);
  });

  test('Outputs must include Load Balancer DNS and CloudFront URL', () => {
    template.hasOutput('AppLoadBalancerDNS', {});
    template.hasOutput('CloudFrontURL', {});
  });
});
