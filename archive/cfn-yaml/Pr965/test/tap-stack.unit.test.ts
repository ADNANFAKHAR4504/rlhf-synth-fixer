import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template (NO AWS Config, CloudTrail disabled)', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have the expected description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready secure infrastructure with VPC, EC2 Auto Scaling, monitoring, and compliance features (NO AWS Config resources)'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Environment suffix');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only lowercase alphanumeric characters'
      );
    });

    test('should have all required parameters (no CreateConfigResources)', () => {
      const expected = [
        'EnvironmentSuffix',
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'InstanceType',
        'KeyPairName',
        'AlertEmail',
        'AmiId',
      ];
      expected.forEach((p) => expect(template.Parameters[p]).toBeDefined());
      expect(template.Parameters.CreateConfigResources).toBeUndefined();
    });

    test('KeyPairName should have default value', () => {
      expect(template.Parameters.KeyPairName.Default).toBe('myapp-keypair');
    });

    test('AlertEmail should have default value', () => {
      expect(template.Parameters.AlertEmail.Default).toBe('admin@example.com');
    });
  });

  describe('Mappings / AMI Source', () => {
    test('should use SSM parameter for AMI (AmiId param)', () => {
      expect(template.Parameters.AmiId).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1?.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2?.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1?.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2?.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have Web Server Security Group', () => {
      expect(template.Resources.WebServerSecurityGroup?.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have proper security group rules', () => {
      const ingress = template.Resources.WebServerSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(3);
      expect(ingress.some((r: any) => r.FromPort === 22)).toBe(true);
      expect(ingress.some((r: any) => r.FromPort === 80)).toBe(true);
      expect(ingress.some((r: any) => r.FromPort === 443)).toBe(true);
    });

    test('should have IAM roles and instance profile', () => {
      expect(template.Resources.EC2Role?.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EC2InstanceProfile?.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 application bucket with encryption', () => {
      expect(template.Resources.ApplicationS3Bucket).toBeDefined();

      const appBucket = template.Resources.ApplicationS3Bucket;
      expect(appBucket.Properties.BucketEncryption).toBeDefined();
      expect(appBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('should have DynamoDB table', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table?.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Compute Resources', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate?.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg?.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(1);
      expect(asg.Properties.MaxSize).toBe(4);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('launch template should have encrypted EBS volumes', () => {
      const bdm = template.Resources.LaunchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings;
      expect(bdm).toHaveLength(1);
      expect(bdm[0].Ebs.Encrypted).toBe(true);
      expect(bdm[0].Ebs.DeleteOnTermination).toBe(true);
    });
  });

  describe('Monitoring and Logging Resources', () => {
    test('should NOT define CloudTrail resources', () => {
      expect(template.Resources.CloudTrail).toBeUndefined();
      expect(template.Resources.CloudTrailLogGroup).toBeUndefined();
      expect(template.Resources.CloudTrailS3Bucket).toBeUndefined();
      expect(template.Resources.CloudTrailS3BucketPolicy).toBeUndefined();
    });

    test('should NOT define CloudTrail-driven metric filter & alarm', () => {
      expect(template.Resources.UnauthorizedAccessMetricFilter).toBeUndefined();
      expect(template.Resources.UnauthorizedAccessAlarm).toBeUndefined();
    });

    test('should have CloudWatch Log Groups for app and S3', () => {
      expect(template.Resources.CloudWatchLogGroup).toBeDefined();
      expect(template.Resources.S3LogGroup).toBeDefined();
      expect(template.Resources.CloudWatchLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have SNS topic and Lambda for alerts', () => {
      expect(template.Resources.SecurityAlertsTopic).toBeDefined();
      expect(template.Resources.SecurityAlertsSubscription).toBeDefined();
      expect(template.Resources.SecurityAlertFunction).toBeDefined();
      expect(template.Resources.SecurityAlertFunction.Properties.Runtime).toBe('python3.12');
    });
  });

  describe('Resource Naming Convention', () => {
    const getSubString = (val: any): string => {
      if (val && typeof val === 'object' && 'Fn::Sub' in val) return val['Fn::Sub'] as string;
      if (typeof val === 'string') return val;
      throw new Error('Expected value to be an Fn::Sub string');
    };

    test('S3 application bucket name should include environment suffix AND region', () => {
      const res = template.Resources.ApplicationS3Bucket;
      const sub = getSubString(res.Properties.BucketName);
      expect(sub).toEqual(expect.stringContaining('${EnvironmentSuffix}'));
      expect(sub).toEqual(expect.stringContaining('${AWS::Region}'));
      expect(sub).toEqual(expect.stringContaining('${AWS::AccountId}'));
    });

    test('resource names should include environment suffix in tags', () => {
      const withTags = ['VPC', 'InternetGateway', 'PublicSubnet1', 'NATGateway'];
      withTags.forEach((name) => {
        const res = template.Resources[name];
        expect(res).toBeDefined();
        const nameTag = res.Properties.Tags.find((t: any) => t.Key === 'Name');
        const tagSub = getSubString(nameTag.Value);
        expect(tagSub).toEqual(expect.stringContaining('${EnvironmentSuffix}'));
      });
    });

    test('service names should include environment suffix', () => {
      const resources: Record<string, string> = {
        DynamoDBTable: 'TableName',
        LaunchTemplate: 'LaunchTemplateName',
        AutoScalingGroup: 'AutoScalingGroupName',
      };
      Object.entries(resources).forEach(([resName, prop]) => {
        const res = template.Resources[resName];
        const sub = getSubString(res.Properties[prop]);
        expect(sub).toEqual(expect.stringContaining('${EnvironmentSuffix}'));
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs (no CloudTrail bucket name)', () => {
      const expected = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'AutoScalingGroupName',
        'ApplicationS3BucketName',
        'DynamoDBTableName',
        'SecurityAlertsTopicArn',
        'EnvironmentSuffixOut',
        'StackName',
        'NATGatewayEipAddress',
      ];
      expected.forEach((k) => expect(template.Outputs[k]).toBeDefined());

      // Ensure CloudTrail bucket output is not present
      expect(template.Outputs.CloudTrailS3BucketName).toBeUndefined();
    });

    test('EnvironmentSuffixOut output should be correct', () => {
      const out = template.Outputs.EnvironmentSuffixOut;
      expect(out.Description).toBe('Environment suffix used for this deployment');
      expect(out.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Template Security Validation', () => {
    test('S3 buckets should deny insecure connections (app bucket)', () => {
      const policy = template.Resources.ApplicationS3BucketPolicy;
      const stmts = policy.Properties.PolicyDocument.Statement;
      const deny = stmts.find((s: any) => s.Sid === 'DenyInsecureConnections');
      expect(deny).toBeDefined();
      expect(deny.Effect).toBe('Deny');
    });

    test('EBS volumes should be encrypted', () => {
      const bdm = template.Resources.LaunchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings;
      bdm.forEach((m: any) => expect(m.Ebs.Encrypted).toBe(true));
    });

    test('DynamoDB should have encryption enabled', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have expected diversity of resource types', () => {
      const types = Object.values(template.Resources).map((r: any) => r.Type);
      const unique = [...new Set(types)];
      expect(unique.length).toBeGreaterThan(15);
    });
  });

  describe('Compliance Features', () => {
    test('should NOT have AWS Config for compliance monitoring (by design)', () => {
      expect(template.Resources.ConfigurationRecorder).toBeUndefined();
      expect(template.Resources.ConfigDeliveryChannel).toBeUndefined();
      expect(template.Resources.ConfigServiceRole).toBeUndefined();
    });

    test('should NOT have CloudTrail (disabled by request)', () => {
      expect(template.Resources.CloudTrail).toBeUndefined();
    });
  });
});
