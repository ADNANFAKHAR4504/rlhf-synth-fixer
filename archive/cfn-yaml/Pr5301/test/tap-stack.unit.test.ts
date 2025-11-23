import fs from 'fs';
import path from 'path';

describe('NovaFintech TapStack CloudFormation Template', () => {
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

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['DomainName', 'HostedZoneId', 'KeyPairName', 'Environment', 'LatestAmiId'];
      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('DomainName parameter should have correct properties', () => {
      const param = template.Parameters.DomainName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('bankingapp.novafintech.com');
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9\\-\\.]*[a-z0-9]$');
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.AllowedValues).toEqual(['Production', 'Staging', 'Development']);
    });
  });

  describe('Conditions Validation', () => {
    test('should have HasHostedZoneId and HasKeyPair conditions', () => {
      expect(template.Conditions.HasHostedZoneId).toBeDefined();
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have NovaVPC with correct properties', () => {
      expect(template.Resources.NovaVPC).toBeDefined();
      expect(template.Resources.NovaVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.NovaVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have two public subnets in different AZs', () => {
      expect(template.Resources.NovaPublicSubnet).toBeDefined();
      expect(template.Resources.NovaPublicSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.NovaPublicSubnet;
      const subnet2 = template.Resources.NovaPublicSubnet2;
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('should have Internet Gateway and routing', () => {
      expect(template.Resources.NovaInternetGateway).toBeDefined();
      expect(template.Resources.NovaPublicRouteTable).toBeDefined();
      expect(template.Resources.NovaPublicRoute).toBeDefined();
    });
  });

  describe('Security Group Configuration', () => {
    test('should have NovaWebSecurityGroup with HTTP and SSH access', () => {
      const sg = template.Resources.NovaWebSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress;
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const sshRule = ingress.find((rule: any) => rule.FromPort === 22);
      
      expect(httpRule).toBeDefined();
      expect(sshRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(sshRule.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have NovaEC2Role with correct trust policy', () => {
      const role = template.Resources.NovaEC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('EC2 role should have S3 and CloudWatch permissions', () => {
      const role = template.Resources.NovaEC2Role;
      const policies = role.Properties.Policies;
      
      expect(policies).toHaveLength(1);
      const statements = policies[0].PolicyDocument.Statement;
      expect(statements).toHaveLength(3);
      
      const listBucketStmt = statements.find((s: any) => s.Action.includes('s3:ListBucket'));
      const objectStmt = statements.find((s: any) => s.Action.includes('s3:GetObject'));
      const logsStmt = statements.find((s: any) => s.Action.includes('logs:CreateLogGroup'));
      
      expect(listBucketStmt).toBeDefined();
      expect(objectStmt).toBeDefined();
      expect(logsStmt).toBeDefined();
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have NovaLogsBucket with correct properties', () => {
      const bucket = template.Resources.NovaLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName['Fn::Sub']).toBe('novafintech-bankingapp-logs-${AWS::Region}');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption and public access blocked', () => {
      const bucket = template.Resources.NovaLogsBucket;
      const encryption = bucket.Properties.BucketEncryption;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
    });
  });

  describe('EC2 Launch Template', () => {
    test('should have NovaLaunchTemplate with correct configuration', () => {
      const launchTemplate = template.Resources.NovaLaunchTemplate;
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      
      const launchData = launchTemplate.Properties.LaunchTemplateData;
      expect(launchData.ImageId.Ref).toBe('LatestAmiId');
      expect(launchData.InstanceType).toBe('t2.micro');
    });

    test('launch template should conditionally include key pair', () => {
      const launchTemplate = template.Resources.NovaLaunchTemplate;
      const launchData = launchTemplate.Properties.LaunchTemplateData;
      
      expect(launchData.KeyName['Fn::If']).toBeDefined();
      expect(launchData.KeyName['Fn::If'][0]).toBe('HasKeyPair');
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have NovaAutoScalingGroup with correct scaling configuration', () => {
      const asg = template.Resources.NovaAutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      
      expect(asg.Properties.MinSize).toBe(1);
      expect(asg.Properties.MaxSize).toBe(1);
      expect(asg.Properties.DesiredCapacity).toBe(1);
      expect(asg.Properties.HealthCheckType).toBe('EC2');
    });

    test('ASG should use both subnets', () => {
      const asg = template.Resources.NovaAutoScalingGroup;
      const vpcZoneId = asg.Properties.VPCZoneIdentifier;
      
      expect(vpcZoneId).toHaveLength(2);
      expect(vpcZoneId[0].Ref).toBe('NovaPublicSubnet');
      expect(vpcZoneId[1].Ref).toBe('NovaPublicSubnet2');
    });
  });

  describe('Elastic IP and Association', () => {
    test('should have NovaElasticIP and association Lambda', () => {
      expect(template.Resources.NovaElasticIP).toBeDefined();
      expect(template.Resources.EIPAssociationLambda).toBeDefined();
      expect(template.Resources.NovaASGLifecycleHook).toBeDefined();
    });

    test('Lambda should have correct runtime and configuration', () => {
      const lambda = template.Resources.EIPAssociationLambda;
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(300);
    });
  });

  describe('Route 53 Configuration', () => {
    test('should have conditional DNS record', () => {
      const dnsRecord = template.Resources.NovaDNSRecord;
      expect(dnsRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(dnsRecord.Condition).toBe('HasHostedZoneId');
      expect(dnsRecord.Properties.Type).toBe('A');
      expect(dnsRecord.Properties.ResourceRecords[0].Ref).toBe('NovaElasticIP');
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'WebsiteURL', 'InstancePublicIP', 'S3BucketName', 'SecurityGroupId',
        'IAMRoleARN', 'VPCId', 'AutoScalingGroupName', 'LaunchTemplateId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CPU alarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should not be publicly accessible', () => {
      const bucket = template.Resources.NovaLogsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('IAM policies should follow least privilege', () => {
      const role = template.Resources.NovaEC2Role;
      const policies = role.Properties.Policies;
      
      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (statement.Action.includes('s3:')) {
            expect(statement.Resource).toBeDefined();
            expect(statement.Resource[0]['Fn::Sub']).toContain('NovaLogsBucket');
          }
        });
      });
    });
  });
});