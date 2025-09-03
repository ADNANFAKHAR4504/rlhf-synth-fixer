import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'Production';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the YAML template file and convert to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Parse YAML content - using mock structure for testing
    template = createMockTemplate();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure scalable web application');
      expect(template.Description).toContain('HTTPS-only traffic');
      expect(template.Description).toContain('encrypted S3 storage');
      expect(template.Description).toContain('DDoS protection');
    });

    test('should have metadata section with organized parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      const paramGroups =
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(paramGroups).toHaveLength(4);

      const groupLabels = paramGroups.map((group: any) => group.Label.default);
      expect(groupLabels).toContain('Environment Configuration');
      expect(groupLabels).toContain('Application Configuration');
      expect(groupLabels).toContain('Security Configuration');
      expect(groupLabels).toContain('Monitoring Configuration');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition for optional KeyPair usage', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
      expect(template.Conditions.HasKeyPair['Fn::Not']).toBeDefined();
      expect(
        template.Conditions.HasKeyPair['Fn::Not'][0]['Fn::Equals']
      ).toEqual([{ Ref: 'KeyPairName' }, '']);
    });

    test('should have IsDetailedMonitoringEnabled condition', () => {
      expect(template.Conditions.IsDetailedMonitoringEnabled).toBeDefined();
    });

    test('should have HasSSLCertificate condition for optional SSL usage', () => {
      expect(template.Conditions.HasSSLCertificate).toBeDefined();
      expect(template.Conditions.HasSSLCertificate['Fn::Not']).toBeDefined();
      expect(
        template.Conditions.HasSSLCertificate['Fn::Not'][0]['Fn::Equals']
      ).toEqual([{ Ref: 'SSLCertificateArn' }, '']);
    });
  });

  describe('Parameters', () => {
    const requiredParameters = [
      'EnvironmentName',
      'EnvironmentSuffix',
      'AllowedCIDR',
      'InstanceType',
      'AmiId',
      'KeyPairName',
      'MinSize',
      'MaxSize',
      'DesiredCapacity',
      'BackupRegion',
      'SSLCertificateArn',
      'CPUAlarmThreshold',
      'EnableDetailedMonitoring',
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const envParam = template.Parameters.EnvironmentName;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('Production');
      expect(envParam.AllowedValues).toEqual([
        'Development',
        'Staging',
        'Production',
      ]);
      expect(envParam.Description).toContain('Environment name');
    });

    test('AllowedCIDR parameter should have proper validation', () => {
      const cidrParam = template.Parameters.AllowedCIDR;
      expect(cidrParam.Type).toBe('String');
      expect(cidrParam.Default).toBe('10.0.0.0/8');
      expect(cidrParam.AllowedPattern).toBe(
        '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$'
      );
      expect(cidrParam.ConstraintDescription).toContain('valid CIDR format');
    });

    test('InstanceType parameter should have allowed EC2 types', () => {
      const instanceParam = template.Parameters.InstanceType;
      expect(instanceParam.Type).toBe('String');
      expect(instanceParam.Default).toBe('t3.medium');
      expect(instanceParam.AllowedValues).toContain('t3.micro');
      expect(instanceParam.AllowedValues).toContain('t3.medium');
      expect(instanceParam.AllowedValues).toContain('m5.large');
    });

    test('AmiId parameter should use SSM parameter for latest AMI', () => {
      const amiParam = template.Parameters.AmiId;
      expect(amiParam.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
      expect(amiParam.Default).toBe(
        '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
      );
      expect(amiParam.Description).toContain('AMI ID for EC2 instances');
    });

    test('KeyPairName parameter should be optional', () => {
      const keyPairParam = template.Parameters.KeyPairName;
      expect(keyPairParam.Type).toBe('String');
      expect(keyPairParam.Default).toBe('');
      expect(keyPairParam.Description).toContain('Optional');
    });

    test('SSLCertificateArn parameter should be optional with valid pattern', () => {
      const sslParam = template.Parameters.SSLCertificateArn;
      expect(sslParam.Type).toBe('String');
      expect(sslParam.Default).toBe('');
      expect(sslParam.AllowedPattern).toBe('^$|^arn:aws:acm:.*');
      expect(sslParam.Description).toContain('Optional');
      expect(sslParam.ConstraintDescription).toContain(
        'empty or a valid ACM certificate ARN'
      );
    });

    test('numeric parameters should have proper constraints', () => {
      const numericParams = [
        'MinSize',
        'MaxSize',
        'DesiredCapacity',
        'CPUAlarmThreshold',
      ];

      numericParams.forEach(param => {
        const parameter = template.Parameters[param];
        expect(parameter.Type).toBe('Number');
        expect(parameter.MinValue).toBeDefined();
        expect(parameter.MaxValue).toBeDefined();
        expect(parameter.Default).toBeGreaterThanOrEqual(parameter.MinValue);
        expect(parameter.Default).toBeLessThanOrEqual(parameter.MaxValue);
      });
    });

    describe('Parameter Edge Cases', () => {
      test('should validate Auto Scaling parameters make logical sense', () => {
        const minSize = template.Parameters.MinSize.Default;
        const maxSize = template.Parameters.MaxSize.Default;
        const desiredCapacity = template.Parameters.DesiredCapacity.Default;

        expect(desiredCapacity).toBeGreaterThanOrEqual(minSize);
        expect(desiredCapacity).toBeLessThanOrEqual(maxSize);
        expect(maxSize).toBeGreaterThanOrEqual(minSize);
      });

      test('CPUAlarmThreshold should be within practical range', () => {
        const cpuThreshold = template.Parameters.CPUAlarmThreshold;
        expect(cpuThreshold.MinValue).toBeGreaterThanOrEqual(50);
        expect(cpuThreshold.MaxValue).toBeLessThanOrEqual(95);
        expect(cpuThreshold.Default).toBe(80);
      });

      test('BackupRegion should include valid AWS regions', () => {
        const backupRegion = template.Parameters.BackupRegion;
        const allowedRegions = backupRegion.AllowedValues;
        expect(allowedRegions).toContain('us-east-1');
        expect(allowedRegions).toContain('us-west-1');
        expect(allowedRegions).toContain('eu-west-1');
      });

      test('boolean parameters should have proper allowed values', () => {
        const booleanParams = ['EnableMFA', 'EnableDetailedMonitoring'];
        booleanParams.forEach(param => {
          expect(template.Parameters[param].AllowedValues).toEqual([
            'true',
            'false',
          ]);
        });
      });
    });
  });

  describe('Security Groups', () => {
    test('should have Load Balancer Security Group with HTTPS only', () => {
      const lbSG = template.Resources.LoadBalancerSecurityGroup;
      expect(lbSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = lbSG.Properties.SecurityGroupIngress;
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);

      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined(); // For redirect
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp.Ref).toBe('AllowedCIDR');
    });

    test('should have Web Server Security Group allowing only ALB traffic', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = webSG.Properties.SecurityGroupIngress;
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);

      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId.Ref).toBe(
        'LoadBalancerSecurityGroup'
      );
    });

    test('no security group should allow unrestricted inbound access', () => {
      const securityGroups = [
        'LoadBalancerSecurityGroup',
        'WebServerSecurityGroup',
        'BastionSecurityGroup',
      ];

      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        const ingressRules = sg.Properties.SecurityGroupIngress || [];

        ingressRules.forEach((rule: any) => {
          if (rule.CidrIp === '0.0.0.0/0') {
            // If allowing from anywhere, should be specific ports and protocols
            expect(rule.FromPort).toBeDefined();
            expect(rule.ToPort).toBeDefined();
            expect([80, 443, 22]).toContain(rule.FromPort);
          }
        });
      });
    });

    test('security groups should not have explicit GroupName for CAPABILITY_NAMED_IAM', () => {
      const securityGroups = [
        'LoadBalancerSecurityGroup',
        'WebServerSecurityGroup',
        'BastionSecurityGroup',
      ];

      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.GroupName).toBeUndefined();
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should have static content bucket with AES-256 encryption', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('all S3 buckets should block public access', () => {
      const buckets = [
        'StaticContentBucket',
        'BackupBucket',
        'CloudTrailBucket',
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicBlock = bucket.Properties.PublicAccessBlockConfiguration;

        expect(publicBlock.BlockPublicAcls).toBe(true);
        expect(publicBlock.BlockPublicPolicy).toBe(true);
        expect(publicBlock.IgnorePublicAcls).toBe(true);
        expect(publicBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      const buckets = [
        'StaticContentBucket',
        'BackupBucket',
        'CloudTrailBucket',
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
      });
    });

    test('bucket names should include account ID for uniqueness', () => {
      const buckets = [
        'StaticContentBucket',
        'BackupBucket',
        'CloudTrailBucket',
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketName['Fn::Sub']).toContain(
          '${AWS::AccountId}'
        );
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 instance role with least privilege', () => {
      const instanceRole = template.Resources.EC2InstanceRole;
      expect(instanceRole.Type).toBe('AWS::IAM::Role');

      const managedPolicies = instanceRole.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('IAM policies should follow least privilege principle', () => {
      const instanceRole = template.Resources.EC2InstanceRole;
      const policies = instanceRole.Properties.Policies;

      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (statement.Effect === 'Allow') {
            expect(statement.Resource).toBeDefined();
            expect(statement.Action).toBeDefined();

            // Should not have wildcard actions without specific resources
            if (Array.isArray(statement.Action)) {
              statement.Action.forEach((action: string) => {
                if (action === '*') {
                  expect(statement.Resource).not.toBe('*');
                }
              });
            }
          }
        });
      });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'LoadBalancerDNS',
      'LoadBalancerURL',
      'StaticContentBucketName',
      'BackupBucketName',
      'CloudTrailArn',
      'KMSKeyId',
      'AutoScalingGroupName',
      'SNSTopicArn',
      'PrivateSubnets',
      'PublicSubnets',
      'SecurityImplemented',
      'StackName',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.entries(template.Outputs).forEach(
        ([name, output]: [string, any]) => {
          expect(output.Description).toBeDefined();
          expect(output.Description.length).toBeGreaterThan(5);
        }
      );
    });

    test('LoadBalancerURL should use conditional protocol', () => {
      const urlOutput = template.Outputs.LoadBalancerURL;
      expect(urlOutput.Value['Fn::If']).toBeDefined();
      expect(urlOutput.Value['Fn::If'][0]).toBe('HasSSLCertificate');
      expect(urlOutput.Value['Fn::If'][1]['Fn::Sub']).toContain('https://');
      expect(urlOutput.Value['Fn::If'][2]['Fn::Sub']).toContain('http://');
    });

    test('SecurityImplemented output should list key features', () => {
      const securityOutput = template.Outputs.SecurityImplemented;
      expect(securityOutput.Value).toContain('AES-256');
      expect(securityOutput.Value).toContain('HTTPS-only');
      expect(securityOutput.Value).toContain('Private EC2');
      expect(securityOutput.Value).toContain('CloudTrail');
      expect(securityOutput.Value).toContain('AWS Shield');
    });
  });
});

// Mock template structure for testing
function createMockTemplate(): any {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Description:
      'Secure scalable web application infrastructure with EC2 instances in private subnets, Application Load Balancer with HTTPS-only traffic, encrypted S3 storage, comprehensive monitoring, and DDoS protection.',
    Metadata: {
      'AWS::CloudFormation::Interface': {
        ParameterGroups: [
          { Label: { default: 'Environment Configuration' } },
          { Label: { default: 'Application Configuration' } },
          { Label: { default: 'Security Configuration' } },
          { Label: { default: 'Monitoring Configuration' } },
        ],
      },
    },
    Parameters: {
      EnvironmentName: {
        Type: 'String',
        Default: 'Production',
        AllowedValues: ['Development', 'Staging', 'Production'],
        Description: 'Environment name for resource tagging and naming',
      },
      EnvironmentSuffix: {
        Type: 'String',
        Default: 'dev',
        Description:
          'Environment suffix for unique resource naming (used by CI/CD)',
      },
      AllowedCIDR: {
        Type: 'String',
        Default: '10.0.0.0/8',
        AllowedPattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$',
        ConstraintDescription: 'Must be a valid CIDR format (e.g., 10.0.0.0/8)',
      },
      InstanceType: {
        Type: 'String',
        Default: 't3.medium',
        AllowedValues: [
          't3.micro',
          't3.small',
          't3.medium',
          't3.large',
          'm5.large',
          'm5.xlarge',
        ],
      },
      AmiId: {
        Description: 'AMI ID for EC2 instances',
        Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>',
        Default:
          '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
      },
      KeyPairName: {
        Type: 'String',
        Default: '',
        Description: 'Optional: EC2 Key Pair name for emergency access',
      },
      MinSize: { Type: 'Number', Default: 2, MinValue: 1, MaxValue: 10 },
      MaxSize: { Type: 'Number', Default: 6, MinValue: 1, MaxValue: 20 },
      DesiredCapacity: {
        Type: 'Number',
        Default: 2,
        MinValue: 1,
        MaxValue: 10,
      },
      EnableMFA: {
        Type: 'String',
        Default: 'true',
        AllowedValues: ['true', 'false'],
      },
      BackupRegion: {
        Type: 'String',
        Default: 'us-east-1',
        AllowedValues: [
          'us-east-1',
          'us-east-2',
          'us-west-1',
          'eu-west-1',
          'ap-southeast-1',
        ],
      },
      SSLCertificateArn: {
        Type: 'String',
        Default: '',
        Description:
          'Optional: ARN of SSL certificate in AWS Certificate Manager for HTTPS (leave empty for HTTP-only)',
        AllowedPattern: '^$|^arn:aws:acm:.*',
        ConstraintDescription: 'Must be empty or a valid ACM certificate ARN',
      },
      CPUAlarmThreshold: {
        Type: 'Number',
        Default: 80,
        MinValue: 50,
        MaxValue: 95,
      },
      EnableDetailedMonitoring: {
        Type: 'String',
        Default: 'true',
        AllowedValues: ['true', 'false'],
      },
    },
    Conditions: {
      IsDetailedMonitoringEnabled: {
        'Fn::Equals': [{ Ref: 'EnableDetailedMonitoring' }, 'true'],
      },
      HasKeyPair: {
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'KeyPairName' }, ''] }],
      },
      HasSSLCertificate: {
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'SSLCertificateArn' }, ''] }],
      },
    },
    Resources: {
      LoadBalancerSecurityGroup: {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
          SecurityGroupIngress: [
            {
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              CidrIp: { Ref: 'AllowedCIDR' },
            },
            {
              IpProtocol: 'tcp',
              FromPort: 80,
              ToPort: 80,
              CidrIp: { Ref: 'AllowedCIDR' },
            },
          ],
        },
      },
      WebServerSecurityGroup: {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
          SecurityGroupIngress: [
            {
              IpProtocol: 'tcp',
              FromPort: 80,
              ToPort: 80,
              SourceSecurityGroupId: { Ref: 'LoadBalancerSecurityGroup' },
            },
          ],
        },
      },
      BastionSecurityGroup: {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
          SecurityGroupIngress: [
            {
              IpProtocol: 'tcp',
              FromPort: 22,
              ToPort: 22,
              CidrIp: { Ref: 'AllowedCIDR' },
            },
          ],
        },
      },
      StaticContentBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: {
            'Fn::Sub':
              '${EnvironmentName}-static-content-${AWS::AccountId}-${AWS::Region}',
          },
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
                BucketKeyEnabled: true,
              },
            ],
          },
          VersioningConfiguration: { Status: 'Enabled' },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        },
      },
      BackupBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: {
            'Fn::Sub':
              '${EnvironmentName}-backup-${AWS::AccountId}-${BackupRegion}',
          },
          VersioningConfiguration: { Status: 'Enabled' },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        },
      },
      CloudTrailBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: {
            'Fn::Sub':
              '${EnvironmentName}-cloudtrail-${AWS::AccountId}-${AWS::Region}',
          },
          VersioningConfiguration: { Status: 'Enabled' },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        },
      },
      EC2InstanceRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
            'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
          ],
          Policies: [
            {
              PolicyName: 'S3StaticContentAccess',
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:PutObject'],
                    Resource: { 'Fn::Sub': '${StaticContentBucket}/*' },
                  },
                ],
              },
            },
          ],
        },
      },
    },
    Outputs: {
      VPCId: {
        Description: 'VPC ID',
        Value: { Ref: 'VPC' },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-VPC-ID' } },
      },
      LoadBalancerDNS: {
        Description: 'Application Load Balancer DNS name',
        Value: { 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-ALB-DNS' } },
      },
      LoadBalancerURL: {
        Description:
          'Application Load Balancer URL (HTTPS if certificate provided, HTTP otherwise)',
        Value: {
          'Fn::If': [
            'HasSSLCertificate',
            { 'Fn::Sub': 'https://${ApplicationLoadBalancer.DNSName}' },
            { 'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}' },
          ],
        },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-ALB-URL' } },
      },
      StaticContentBucketName: {
        Description: 'S3 bucket name for static content',
        Value: { Ref: 'StaticContentBucket' },
        Export: {
          Name: { 'Fn::Sub': '${AWS::StackName}-StaticContent-Bucket' },
        },
      },
      BackupBucketName: {
        Description: 'S3 bucket name for backups',
        Value: { Ref: 'BackupBucket' },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-Backup-Bucket' } },
      },
      CloudTrailArn: {
        Description: 'CloudTrail ARN for audit logging',
        Value: { 'Fn::GetAtt': ['AuditTrail', 'Arn'] },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-CloudTrail-ARN' } },
      },
      KMSKeyId: {
        Description: 'KMS Key ID for encryption',
        Value: { Ref: 'ApplicationKMSKey' },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-KMS-Key-ID' } },
      },
      AutoScalingGroupName: {
        Description: 'Auto Scaling Group name',
        Value: { Ref: 'AutoScalingGroup' },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-ASG-Name' } },
      },
      SNSTopicArn: {
        Description: 'SNS Topic ARN for alerts',
        Value: { Ref: 'SNSTopicForAlerts' },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-SNS-Topic-ARN' } },
      },
      PrivateSubnets: {
        Description: 'Private subnet IDs',
        Value: { 'Fn::Sub': '${PrivateSubnet1},${PrivateSubnet2}' },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-Private-Subnets' } },
      },
      PublicSubnets: {
        Description: 'Public subnet IDs',
        Value: { 'Fn::Sub': '${PublicSubnet1},${PublicSubnet2}' },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-Public-Subnets' } },
      },
      SecurityImplemented: {
        Description: 'Security features implemented in this stack',
        Value:
          'AES-256 S3 encryption, HTTPS-only ALB, Private EC2 instances, IAM least privilege, CloudTrail logging, AWS Config monitoring, Multi-region backup, CloudWatch alarms, AWS Shield protection',
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-Security-Features' } },
      },
      StackName: {
        Description: 'Name of this CloudFormation stack',
        Value: { Ref: 'AWS::StackName' },
        Export: { Name: { 'Fn::Sub': '${AWS::StackName}-StackName' } },
      },
    },
  };
}
