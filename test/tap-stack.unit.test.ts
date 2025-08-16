import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('SecureWebApp CloudFormation Template Unit Tests', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure and compliant web application environment with comprehensive security controls'
      );
    });

    test('should have all major sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'Environment',
      'ProjectName',
      'AllowedCIDR',
      'DBUsername',
      'SSMParameterPrefix',
      'LatestAmi'
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
      expect(Object.keys(template.Parameters).length).toBe(6);
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secure-web-app18');
      expect(param.Description).toBe('Project name for resource tagging');
    });

    test('AllowedCIDR parameter should have validation pattern', () => {
      const param = template.Parameters.AllowedCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBe('^(\\d{1,3}\\.){3}\\d{1,3}\\/([1-2][0-9]|3[0-2])$');
    });

    test('DBUsername parameter should have constraints', () => {
      const param = template.Parameters.DBUsername;
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9]*$');
    });

    test('LatestAmi parameter should use SSM parameter', () => {
      const param = template.Parameters.LatestAmi;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64');
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals']).toEqual([
        { Ref: 'Environment' },
        'production'
      ]);
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key with correct properties', () => {
      const kmsKey = template.Resources.ApplicationKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.Description).toBe('KMS key for application encryption');
    });

    test('KMS key should have comprehensive key policy', () => {
      const keyPolicy = template.Resources.ApplicationKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toHaveLength(4);
      
      const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');

      const s3Statement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow use of the key for S3');
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');

      const cloudWatchStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'AllowCloudWatchLogs');
      expect(cloudWatchStatement).toBeDefined();
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.ApplicationKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId.Ref).toBe('ApplicationKMSKey');
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Properties.VpcId.Ref).toBe('VPC');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(sg.Properties.SecurityGroupIngress[1].FromPort).toBe(443);
    });

    test('should have EC2 security group', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId.Ref).toBe('ALBSecurityGroup');
    });

    test('should have Lambda security group', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);
    });

    test('should have Database security group', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
    });
  });

  describe('SSM Parameters', () => {
    test('should have database password parameter', () => {
      const param = template.Resources.DBPasswordParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Type).toBe('String');
      expect(param.Properties.Name['Fn::Sub']).toContain('database/password');
    });

    test('should have API key parameter', () => {
      const param = template.Resources.APIKeyParameter;
      expect(param).toBeDefined();
      expect(param.Properties.Name['Fn::Sub']).toContain('api/key');
    });
  });

  describe('S3 Buckets', () => {
    test('should have application bucket with encryption', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('ApplicationKMSKey');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('should have application bucket with versioning and public access block', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have application bucket policy denying insecure connections', () => {
      const policy = template.Resources.ApplicationBucketPolicy;
      expect(policy).toBeDefined();
      
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('DenyInsecureConnections');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have logs bucket with lifecycle rules', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket).toBeDefined();
      
      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.Id).toBe('LogRetention');
      expect(rule.Status).toBe('Enabled');
      expect(rule.ExpirationInDays['Fn::If'][0]).toBe('IsProduction');
      expect(rule.NoncurrentVersionExpirationInDays).toBe(30);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have API Gateway log group', () => {
      const logGroup = template.Resources.APIGatewayLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays['Fn::If']).toEqual(['IsProduction', 365, 30]);
    });

    test('should have Lambda log groups', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.AuthLambdaLogGroup).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('should have security alerts topic', () => {
      const topic = template.Resources.SecurityAlertsTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName).toBe('Security Alerts');
    });
  });

  describe('RDS Database', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have database instance with encryption', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId.Ref).toBe('ApplicationKMSKey');
      expect(db.Properties.Engine).toBe('mysql');
    });

    test('should have database with managed master password', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.ManageMasterUserPassword).toBe(true);
      expect(db.Properties.MasterUserSecret.KmsKeyId.Ref).toBe('ApplicationKMSKey');
    });

    test('should have proper deletion and backup policies', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.DeletionPolicy).toBe('Snapshot');
      expect(db.UpdateReplacePolicy).toBe('Snapshot');
      expect(db.Properties.BackupRetentionPeriod['Fn::If']).toEqual(['IsProduction', 7, 1]);
      expect(db.Properties.DeletionProtection['Fn::If']).toEqual(['IsProduction', true, false]);
    });
  });

  describe('API Gateway', () => {
    test('should have REST API', () => {
      const api = template.Resources.RestAPI;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('should have auth resource and method', () => {
      expect(template.Resources.AuthResource).toBeDefined();
      expect(template.Resources.AuthMethod).toBeDefined();
      expect(template.Resources.AuthMethod.Properties.HttpMethod).toBe('GET');
      expect(template.Resources.AuthMethod.Properties.Integration.Type).toBe('MOCK');
    });

    test('should have API deployment', () => {
      const deployment = template.Resources.APIGatewayDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toEqual(['AuthMethod']);
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have ALB target group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckPath).toBe('/health');
    });

    test('should have ALB listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should have launch template', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
      expect(lt.Properties.LaunchTemplateData.ImageId.Ref).toBe('LatestAmi');
    });

    test('should have auto scaling group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(1);
      expect(asg.Properties.MaxSize).toBe(3);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });
  });

  describe('Scaling Policies and Alarms', () => {
    test('should have scale up and down policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Properties.ScalingAdjustment).toBe(1);
      expect(template.Resources.ScaleDownPolicy.Properties.ScalingAdjustment).toBe(-1);
    });

    test('should have CPU alarms', () => {
      const highCPU = template.Resources.HighCPUAlarm;
      expect(highCPU).toBeDefined();
      expect(highCPU.Properties.Threshold).toBe(80);
      expect(highCPU.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      const lowCPU = template.Resources.LowCPUAlarm;
      expect(lowCPU).toBeDefined();
      expect(lowCPU.Properties.Threshold).toBe(20);
      expect(lowCPU.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should have database connections alarm', () => {
      const alarm = template.Resources.DatabaseHighConnectionsAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
      expect(alarm.Properties.Threshold).toBe(50);
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'ALBDNSName',
      'APIGatewayURL',
      'ApplicationBucketName',
      'DatabaseEndpoint',
      'MasterSecretArn',
      'KMSKeyId',
      'SNSTopicArn'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
      expect(Object.keys(template.Outputs).length).toBe(8);
    });

    test('should have correct export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${ProjectName}');
        expect(output.Export.Name['Fn::Sub']).toContain('${Environment}');
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value.Ref).toBe('VPC');
      expect(output.Export.Name['Fn::Sub']).toBe('${ProjectName}-${Environment}-VPC-ID');
    });

    test('ALBDNSName output should be correct', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Value['Fn::GetAtt']).toEqual(['DatabaseInstance', 'Endpoint.Address']);
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(45);
      expect(resourceCount).toBeLessThanOrEqual(55);
    });

    test('should have all critical resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      
      // Critical resource types that must be present
      const criticalTypes = [
        'AWS::KMS::Key',
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBInstance',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::ApiGateway::RestApi',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::CloudWatch::Alarm'
      ];

      criticalTypes.forEach(type => {
        expect(resourceTypes).toContain(type);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const buckets = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket');

      buckets.forEach(([name, bucket]: [string, any]) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toMatch(/aws:kms|AES256/);
      });
    });

    test('all S3 buckets should block public access', () => {
      const buckets = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket');

      buckets.forEach(([name, bucket]: [string, any]) => {
        const config = bucket.Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });

    test('RDS should have encryption and backup enabled', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.BackupRetentionPeriod).toBeDefined();
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('security groups should not have unrestricted ingress', () => {
      const securityGroups = Object.entries(template.Resources)
        .filter(([_, resource]: [string, any]) => resource.Type === 'AWS::EC2::SecurityGroup');

      securityGroups.forEach(([name, sg]: [string, any]) => {
        if (sg.Properties.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            // ALB is the only one allowed to have 0.0.0.0/0 for HTTP/HTTPS
            if (rule.CidrIp === '0.0.0.0/0' && name !== 'ALBSecurityGroup') {
              expect(rule.FromPort).toBe(22); // Only SSH from restricted CIDR
            }
          });
        }
      });
    });
  });

  describe('Tagging Compliance', () => {
    test('all taggable resources should have Environment and ProjectName tags', () => {
      const taggableTypes = [
        'AWS::KMS::Key',
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::RDS::DBInstance',
        'AWS::ApiGateway::RestApi',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      ];

      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (taggableTypes.includes(resource.Type) && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const hasEnvironmentTag = tags.some((t: any) => t.Key === 'Environment');
          const hasProjectNameTag = tags.some((t: any) => t.Key === 'ProjectName');
          
          expect(hasEnvironmentTag).toBe(true);
          expect(hasProjectNameTag).toBe(true);
        }
      });
    });
  });
});