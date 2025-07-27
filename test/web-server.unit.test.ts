import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebServerStack } from '../lib/web-server';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

describe('WebServerStack', () => {
  const env = {
    account: '111111111111',
    region: 'us-east-1',
  };

  beforeAll(() => {
    jest.spyOn(ec2.Vpc, 'fromLookup').mockImplementation(() => {
      return {
        vpcId: 'vpc-123456',
        selectSubnets: (selection?: ec2.SubnetSelection) => {
          if (selection?.subnetType === ec2.SubnetType.PRIVATE_ISOLATED) {
            return {
              subnetIds: ['subnet-priv-1', 'subnet-priv-2'],
              subnets: [
                { subnetId: 'subnet-priv-1' } as ec2.ISubnet,
                { subnetId: 'subnet-priv-2' } as ec2.ISubnet,
              ],
            };
          }

          return {
            subnetIds: ['subnet-pub-1'],
            subnets: [{ subnetId: 'subnet-pub-1' } as ec2.ISubnet],
          };
        },
        availabilityZones: ['us-east-1a', 'us-east-1b'],
      } as unknown as ec2.IVpc;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  const app = new cdk.App();
  const stack = new WebServerStack(app, 'TestWebServerStack', {
    vpcId: 'vpc-123456',
    environmentSuffix: 'test',
    env,
  });

  const template = Template.fromStack(stack);

  test('has security group with SSH and HTTP ingress rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Allow SSH and HTTP access',
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow SSH access from anywhere',
          FromPort: 22,
          IpProtocol: 'tcp',
          ToPort: 22,
        },
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow HTTP access from anywhere',
          FromPort: 80,
          IpProtocol: 'tcp',
          ToPort: 80,
        },
      ],
    });
  });

  test('creates IAM role with S3 and RDS policies', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/AmazonS3FullAccess',
            ],
          ],
        },
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/AmazonRDSReadOnlyAccess',
            ],
          ],
        },
      ],
    });
  });

  test('creates EC2 instance with correct instance type and UserData', () => {
    const resources = template.findResources('AWS::EC2::Instance');

    // Assert one EC2 instance created
    expect(Object.keys(resources)).toHaveLength(1);

    const ec2Props = Object.values(resources)[0].Properties;

    expect(ec2Props.InstanceType).toBe('t2.micro');
    expect(ec2Props.UserData).toHaveProperty('Fn::Base64');
    const userDataScript = ec2Props.UserData['Fn::Base64'];

    expect(typeof userDataScript).toBe('string');
    expect(userDataScript).toContain('yum install -y httpd');
    expect(userDataScript).toContain('systemctl enable httpd');
    // template.hasResourceProperties('AWS::EC2::Instance', {
    //   InstanceType: 't2.micro',
    //   UserData: expect.objectContaining({
    //     'Fn::Base64': expect.objectContaining({
    //       'Fn::Join': expect.arrayContaining([
    //         expect.any(String),
    //         expect.arrayContaining([
    //           expect.stringContaining('yum install -y httpd'),
    //         ]),
    //       ]),
    //     }),
    //   }),
    //   //   {
    //   //     'Fn::Base64': expect.stringContaining('#!/bin/bash\nyum update -y\nyum install -y httpd'),
    //   //   },
    // });
  });

  test('creates EIP associated with EC2 instance', () => {
    template.hasResourceProperties('AWS::EC2::EIP', {
      Domain: 'vpc',
    });
  });

  test('creates S3 bucket with block public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('creates RDS subnet group with private subnets', () => {
    const resources = template.findResources('AWS::RDS::DBSubnetGroup');

    // Assert one DBSubnetGroup exists
    expect(Object.keys(resources)).toHaveLength(1);

    const subnetGroupProps = Object.values(resources)[0].Properties;

    expect(subnetGroupProps.DBSubnetGroupDescription).toBe(
      'Subnet group for RDS'
    );

    expect(Array.isArray(subnetGroupProps.SubnetIds)).toBe(true);
    expect(subnetGroupProps.SubnetIds.length).toBeGreaterThan(0);
    subnetGroupProps.SubnetIds.forEach((id: any) => {
      expect(typeof id).toBe('string');
    });
  });

  test('creates RDS instance with correct engine and storage', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'mysql',
      EngineVersion: '8.0',
      DBName: 'MyDatabase',
      AllocatedStorage: '20',
      DBInstanceClass: 'db.t3.micro',
      MultiAZ: true,
      PubliclyAccessible: false,
    });
  });
});
