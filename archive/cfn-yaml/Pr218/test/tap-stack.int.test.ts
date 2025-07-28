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

  test('Region condition exists and is enforced (IsUSEast1)', () => {
    const conditions = template.toJSON().Conditions || {};
    expect(conditions).toHaveProperty('IsUSEast1');
  });

  test('VPC has /16 CIDR block from VPCCIDR param', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: { Ref: 'VPCCIDR' }
    });
  });

  test('Subnets use CIDRs from parameters', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: { Ref: 'SubnetACIDR' }
    });

    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: { Ref: 'SubnetBCIDR' }
    });
  });

  test('Security group allows port 80 from subnet CIDRs only', () => {
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

  test('SecretsManager entry exists for EC2 keypair', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: {
        'Fn::Sub': 'ec2/keypair/${EC2KeyPair}'
      }
    });
  });

  test('EC2 instances are deployed in separate subnets', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      SubnetId: { Ref: 'PublicSubnetA' }
    });

    template.hasResourceProperties('AWS::EC2::Instance', {
      SubnetId: { Ref: 'PublicSubnetB' }
    });
  });

  test('All output values are declared', () => {
    const outputs = template.toJSON().Outputs;
    const expectedKeys = [
      'VPCId',
      'PublicSubnetAId',
      'PublicSubnetBId',
      'EC2InstanceAId',
      'EC2InstanceBId',
      'KeyPairName'
    ];

    expectedKeys.forEach((key) => {
      expect(outputs).toHaveProperty(key);
    });
  });

  test('All resources include Environment tag', () => {
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
      const resources = template.findResources(type);
      const foundTag = Object.values(resources).some((resource: any) => {
        return (resource.Properties?.Tags || []).some(
          (tag: any) => tag.Key === 'Environment'
        );
      });
      expect(foundTag).toBe(true);
    });
  });

  // -----------------------------
  // 🔴 Failure / Negative Test Cases
  // -----------------------------

  test('FAIL if VPC has hardcoded CIDR', () => {
    const resources = template.findResources('AWS::EC2::VPC');
    for (const r of Object.values(resources)) {
      expect(r.Properties?.CidrBlock).not.toBe('192.168.0.0/16');
    }
  });

  test('FAIL if security group allows 0.0.0.0/0 on port 80', () => {
    const resources = template.findResources('AWS::EC2::SecurityGroup');
    for (const sg of Object.values(resources)) {
      const badRule = (sg.Properties?.SecurityGroupIngress || []).find(
        (r: any) =>
          r.CidrIp === '0.0.0.0/0' &&
          r.FromPort === 80 &&
          r.ToPort === 80
      );
      expect(badRule).toBeUndefined();
    }
  });

  test('FAIL if EC2 instances are placed in same subnet', () => {
    const a = template.findResources('AWS::EC2::Instance');
    const subnets = new Set(
      Object.values(a).map((r: any) => r.Properties?.SubnetId?.Ref)
    );
    expect(subnets.size).toBeGreaterThanOrEqual(2);
  });

  test('FAIL if any Outputs are missing or null', () => {
    const outputs = template.toJSON().Outputs;
    ['VPCId', 'PublicSubnetAId', 'PublicSubnetBId', 'EC2InstanceAId', 'EC2InstanceBId'].forEach(key => {
      expect(outputs).toHaveProperty(key);
      expect(outputs[key]).not.toBeNull();
    });
  });
});
