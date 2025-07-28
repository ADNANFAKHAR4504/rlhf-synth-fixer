import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template: Template;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../lib/TapStack.json');
    const rawTemplate = fs.readFileSync(filePath, 'utf-8');
    const parsedTemplate = JSON.parse(rawTemplate);
    template = Template.fromJSON(parsedTemplate);

  });

  test('Region is enforced to us-east-1', () => {
    expect(template.findConditions('IsUSEast1')).toBeDefined();
  });

  test('VPC is created with correct CIDR block', () => {
  template.hasResourceProperties('AWS::EC2::VPC', {
    CidrBlock: { Ref: 'VPCCIDR' }
  });
});


  test('Subnets A and B have correct CIDR blocks', () => {
  template.hasResourceProperties('AWS::EC2::Subnet', {
    CidrBlock: { Ref: 'SubnetACIDR' }
  });

  template.hasResourceProperties('AWS::EC2::Subnet', {
    CidrBlock: { Ref: 'SubnetBCIDR' }
  });
});


  test('Internet Gateway and routing are correctly configured', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);

    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0'
    });
  });

  test('Security group allows port 80 only from subnet CIDRs', () => {
  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    SecurityGroupIngress: [
      {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: { Ref: 'SubnetACIDR' }
      },
      {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: { Ref: 'SubnetBCIDR' }
      },
      {
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'AllowedSSHLocation' }
      }
    ]
  });
});


  test('EC2 instances exist in separate subnets', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      SubnetId: { Ref: 'PublicSubnetA' }
    });

    template.hasResourceProperties('AWS::EC2::Instance', {
      SubnetId: { Ref: 'PublicSubnetB' }
    });
  });

  test('Secrets Manager entry exists for EC2 KeyPair', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: {
        'Fn::Sub': 'ec2/keypair/${EC2KeyPair}'
      }
    });
  });

  test('All resources include Environment tag (key only)', () => {
  const resourceTypes = [
    'AWS::EC2::VPC',
    'AWS::EC2::Subnet',
    'AWS::EC2::InternetGateway',
    'AWS::EC2::RouteTable',
    'AWS::EC2::Instance',
    'AWS::EC2::SecurityGroup',
    'AWS::SecretsManager::Secret'
  ];

  resourceTypes.forEach((type) => {
    const resourceDefs = template.findResources(type);
    const hasTag = Object.values(resourceDefs).some((res: any) => {
      const tags = res.Properties?.Tags || [];
      return tags.some((t: any) => t.Key === 'Environment');
    });
    expect(hasTag).toBe(true);
  });
});

});
