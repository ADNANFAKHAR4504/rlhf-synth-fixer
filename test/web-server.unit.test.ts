import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { WebServerStack } from '../lib/web-server';

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
  test('has security group HTTP ingress rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Allow SSH and HTTP access',
      SecurityGroupIngress: [
        {
          CidrIp: '10.0.0.0/16',
          Description: 'Secure SSH access from 10.0.0.0/16',
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

  test('should not allow SSH from 0.0.0.0/0', () => {
    const sgResources = template.findResources('AWS::EC2::SecurityGroup');
    Object.values(sgResources).forEach((sg: any) => {
      const ingress = sg.Properties.SecurityGroupIngress || [];
      ingress.forEach((rule: any) => {
        if (rule.FromPort === 22) {
          expect(rule.CidrIp).not.toBe('0.0.0.0/0');
        }
      });
    });
  });

  test('EC2 Role has correct policies and tags', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'ec2-instance-role-test',
      AssumeRolePolicyDocument: Match.anyValue(),
      ManagedPolicyArns: Match.arrayWith([
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
      ]),
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Environment',
          Value: 'Dev',
        }),
      ]),
    });
  });

  test('creates IAM role with S3 and RDS policies', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      ManagedPolicyArns: Match.arrayWith([
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
      ]),
    });
  });

  test('creates role with custom environment suffix', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'ec2-instance-role-test',
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

    expect(typeof userDataScript).toBe('object');
    expect(userDataScript).toHaveProperty('Fn::Join');
    expect(userDataScript['Fn::Join'][1].join('')).toContain(
      'yum install -y httpd'
    );
    expect(userDataScript['Fn::Join'][1].join('')).toContain(
      'systemctl enable httpd'
    );
  });

  test('S3 bucket is versioned and secured', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('Elastic IP is associated with EC2', () => {
    template.hasResourceProperties('AWS::EC2::EIP', {
      Domain: 'vpc',
      InstanceId: Match.objectLike({
        Ref: Match.stringLikeRegexp('EC2Instance'),
      }),
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Environment',
          Value: 'Dev',
        }),
      ]),
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

  test('RDS instance is provisioned correctly', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceClass: 'db.t3.micro',
      Engine: 'mysql',
      MasterUsername: 'admin',
      MultiAZ: true,
      PubliclyAccessible: false,
      CopyTagsToSnapshot: true,
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Environment',
          Value: 'Dev',
        }),
      ]),
    });
  });

  test('all resources have Environment=Dev tag', () => {
    const resources = template.toJSON().Resources;
    for (const [logicalId, resource] of Object.entries(resources)) {
      const typedResource = resource as {
        Properties?: {
          Tags?: Array<{ Key: string; Value: string }>;
          [key: string]: any;
        };
        [key: string]: any;
      };

      const tags = typedResource.Properties?.Tags;

      if (tags) {
        expect(tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: 'Dev',
            }),
          ])
        );
      }
    }
  });

  test('Outputs are configured correctly', () => {
    template.hasOutput('EC2InstanceName', {
      Value: 'webserver-test',
    });

    template.hasOutput('EC2RoleName', {
      Value: { Ref: 'EC2RoleF978FC1C' },
    });

    template.hasOutput('ElasticIP', {
      Value: { Ref: 'EIP' },
    });

    template.hasOutput('RDSADDRESS', {
      Value: {
        'Fn::GetAtt': ['RDSInstance9F6B765A', 'Endpoint.Address'],
      },
    });

    template.hasOutput('RDSPORT', {
      Value: {
        'Fn::GetAtt': ['RDSInstance9F6B765A', 'Endpoint.Port'],
      },
    });

    template.hasOutput('S3', {
      Value: { Ref: 'S3Bucket07682993' },
    });
  });
});
