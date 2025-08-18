import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('General Structure', () => {
    test('should have AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have Description', () => {
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters, Resources, Outputs', () => {
      expect(typeof template.Parameters).toBe('object');
      expect(typeof template.Resources).toBe('object');
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(typeof template.Mappings).toBe('object');
    });
  });

  describe('Parameters', () => {
    const expectedParams = [
      'ProjectName', 'Environment', 'VpcCidr', 'PublicSubnetCidr1', 'PublicSubnetCidr2',
      'PrivateSubnetCidr1', 'PrivateSubnetCidr2', 'InstanceType', 'KeyName', 'DBUsername'
    ];
    test('should have all expected parameters', () => {
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should have correct default values and types', () => {
      expect(template.Parameters.ProjectName.Default).toBe('myapp');
      expect(template.Parameters.Environment.Default).toBe('prod');
      expect(template.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(template.Parameters.InstanceType.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
      expect(template.Parameters.KeyName.Type).toBe('String');
      expect(template.Parameters.DBUsername.NoEcho).toBe(true);
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap with expected AMIs', () => {
      expect(template.Mappings.RegionMap['us-east-1'].AMI).toMatch(/^ami-/);
      expect(template.Mappings.RegionMap['us-west-2'].AMI).toMatch(/^ami-/);
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'VPC', 'InternetGateway', 'AttachGateway', 'PublicSubnet1', 'PublicSubnet2',
      'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable', 'PublicRoute',
      'PublicSubnetRouteTableAssociation1', 'PublicSubnetRouteTableAssociation2',
      'NATGatewayEIP', 'NATGateway', 'PrivateRouteTable', 'PrivateRoute',
      'PrivateSubnetRouteTableAssociation1', 'PrivateSubnetRouteTableAssociation2',
      'WebSecurityGroup', 'ALBSecurityGroup', 'DatabaseSecurityGroup',
      'ApplicationBucket', 'CloudTrailBucket', 'CloudTrailBucketPolicy', 'CloudFrontLogsBucket',
      'EC2Role', 'EC2InstanceProfile', 'MFAEnforcementPolicy', 'WebServerLaunchTemplate',
      'WebServerInstance', 'CPUAlarm', 'SNSTopicForAlarms', 'ApplicationLoadBalancer',
      'ALBTargetGroup', 'ALBListener', 'WebACL', 'WebACLAssociation', 'DBSubnetGroup',
      'DatabaseInstance', 'CloudFrontDistribution', 'CloudTrail', 'GuardDutyDetector',
      'LambdaExecutionRole', 'SampleLambdaFunction'
    ];
    test('should have all expected resources', () => {
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBeDefined();
    });

    test('DatabaseInstance should have deletion protection and correct engine version', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.DeletionProtection).toBe(true);
      expect(db.Properties.EngineVersion).toMatch(/^8\./);
      expect(db.DeletionPolicy).toBe('Retain');
      expect(db.UpdateReplacePolicy).toBe('Retain');
    });

    test('ApplicationBucket should have encryption and versioning enabled', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('WebSecurityGroup should allow SSH and HTTP', () => {
      const sg = template.Resources.WebSecurityGroup.Properties.SecurityGroupIngress;
      const ports = sg.map((rule: any) => rule.FromPort);
      expect(ports).toContain(22);
      expect(ports).toContain(80);
    });

    test('CloudTrailBucketPolicy should allow CloudTrail service principal', () => {
      const policy = template.Resources.CloudTrailBucketPolicy.Properties.PolicyDocument.Statement;
      expect(policy.some((s: any) => s.Principal?.Service === 'cloudtrail.amazonaws.com')).toBe(true);
    });

    test('MFAEnforcementPolicy should have DenyAllExceptUnlessSignedInWithMFA statement', () => {
      const statements = template.Resources.MFAEnforcementPolicy.Properties.PolicyDocument.Statement;
      expect(statements.some((s: any) => s.Sid === 'DenyAllExceptUnlessSignedInWithMFA')).toBe(true);
    });

    test('WebServerLaunchTemplate should use correct AMI mapping', () => {
      const lt = template.Resources.WebServerLaunchTemplate.Properties.LaunchTemplateData.ImageId;
      expect(lt['Fn::FindInMap']).toBeDefined();
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId', 'PublicSubnetIds', 'PrivateSubnetIds', 'ApplicationBucketName',
      'DatabaseEndpoint', 'LoadBalancerDNS', 'CloudFrontDomainName', 'WebACLArn',
      'CloudTrailArn', 'GuardDutyDetectorId', 'ComplianceStatus', 'SecurityFeatures'
    ];
    test('should have all expected outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      expect(template.Outputs.VPCId.Value).toBeDefined();
    });

    test('ComplianceStatus output should list all compliance constraints', () => {
      const value = template.Outputs.ComplianceStatus.Value;
      expect(value).toMatch(/S3 server-side encryption enabled/);
      expect(value).toMatch(/IAM least privilege roles implemented/);
      expect(value).toMatch(/CloudFront access logging enabled/);
      expect(value).toMatch(/RDS in private subnets only/);
      expect(value).toMatch(/Multi-AZ VPC subnets configured/);
    });

    test('SecurityFeatures output should mention encryption, network, monitoring, protection, compliance', () => {
      const value = template.Outputs.SecurityFeatures.Value;
      expect(value).toMatch(/Encryption:/);
      expect(value).toMatch(/Network:/);
      expect(value).toMatch(/Monitoring:/);
      expect(value).toMatch(/Protection:/);
      expect(value).toMatch(/Compliance:/);
    });
  });

  describe('Advanced Validations', () => {
    test('All resources should have tags if applicable', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Properties && resource.Properties.Tags) {
          expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        }
      });
    });

    test('All buckets should have PublicAccessBlockConfiguration', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Type === 'AWS::S3::Bucket') {
          expect(resource.Properties.PublicAccessBlockConfiguration).toBeDefined();
        }
      });
    });

    test('All security groups should reference VPC', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Type === 'AWS::EC2::SecurityGroup') {
          expect(resource.Properties.VpcId).toBeDefined();
        }
      });
    });

    test('All IAM roles should have AssumeRolePolicyDocument', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Type === 'AWS::IAM::Role') {
          expect(resource.Properties.AssumeRolePolicyDocument).toBeDefined();
        }
      });
    });
  });
});
