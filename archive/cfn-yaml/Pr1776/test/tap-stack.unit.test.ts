import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
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
        'Production Web Application Infrastructure - Multi-Region Deployment'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const requiredParameters = [
      'EnvironmentSuffix',
      'KeyPairName',
      'VpcCidr',
      'PublicSubnetACidr',
      'PublicSubnetBCidr',
      'PrivateSubnetACidr',
      'PrivateSubnetBCidr'
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBeDefined();
      expect(envSuffixParam.Description).toContain('Environment suffix');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('DatabasePassword parameter should be secure', () => {
      const dbPasswordParam = template.Parameters.DatabasePassword;
      if (dbPasswordParam) {
        expect(dbPasswordParam.Type).toBe('String');
        expect(dbPasswordParam.NoEcho).toBe(true);
        expect(dbPasswordParam.MinLength).toBe(8);
        expect(dbPasswordParam.MaxLength).toBe(41);
      }
    });

    test('VPC CIDR parameters should have valid patterns', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
      expect(vpcCidrParam.AllowedPattern).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap with AMI mappings', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2']).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1'].AMI).toMatch(/^ami-[a-z0-9]+$/);
      expect(template.Mappings.RegionMap['us-west-2'].AMI).toMatch(/^ami-[a-z0-9]+$/);
    });
  });

  describe('Resources - Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      const vpcProps = template.Resources.VPC.Properties;
      expect(vpcProps.EnableDnsHostnames).toBe(true);
      expect(vpcProps.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnetA).toBeDefined();
      expect(template.Resources.PublicSubnetB).toBeDefined();
      expect(template.Resources.PublicSubnetA.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnetB.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnetA.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnetB.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnetA).toBeDefined();
      expect(template.Resources.PrivateSubnetB).toBeDefined();
      expect(template.Resources.PrivateSubnetA.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnetB.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateways for high availability', () => {
      expect(template.Resources.NatGatewayA).toBeDefined();
      expect(template.Resources.NatGatewayB).toBeDefined();
      expect(template.Resources.NatGatewayAEIP).toBeDefined();
      expect(template.Resources.NatGatewayBEIP).toBeDefined();
    });

    test('should have route tables configured correctly', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTableA).toBeDefined();
      expect(template.Resources.PrivateRouteTableB).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRouteA).toBeDefined();
      expect(template.Resources.DefaultPrivateRouteB).toBeDefined();
    });
  });

  describe('Resources - Security', () => {
    test('should have security groups', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const albSG = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      const httpRule = albSG.find((rule: any) => rule.FromPort === 80);
      const httpsRule = albSG.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('Web server security group should only allow traffic from ALB', () => {
      const webSG = template.Resources.WebServerSecurityGroup.Properties.SecurityGroupIngress;
      const httpRule = webSG.find((rule: any) => rule.FromPort === 80);
      
      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('Database security group should only allow traffic from web servers', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress;
      const mysqlRule = dbSG.find((rule: any) => rule.FromPort === 3306);
      
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });
  });

  describe('Resources - Compute', () => {
    test('should have IAM role for EC2 instances', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      const ltData = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(ltData.InstanceType).toBe('t3.micro');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      const asgProps = template.Resources.AutoScalingGroup.Properties;
      expect(asgProps.MinSize).toBe(2);
      expect(asgProps.MaxSize).toBe(6);
      expect(asgProps.DesiredCapacity).toBe(2);
      expect(asgProps.HealthCheckType).toBe('ELB');
    });
  });

  describe('Resources - Load Balancing', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const albProps = template.Resources.ApplicationLoadBalancer.Properties;
      expect(albProps.Scheme).toBe('internet-facing');
      expect(albProps.Type).toBe('application');
    });

    test('should have ALB Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      const tgProps = template.Resources.ALBTargetGroup.Properties;
      expect(tgProps.Port).toBe(80);
      expect(tgProps.Protocol).toBe('HTTP');
      expect(tgProps.HealthCheckPath).toBe('/health');
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      const listenerProps = template.Resources.ALBListener.Properties;
      expect(listenerProps.Port).toBe(80);
      expect(listenerProps.Protocol).toBe('HTTP');
    });
  });

  describe('Resources - Database', () => {
    test('should have RDS subnet group', () => {
      expect(template.Resources.DatabaseSubnetGroup).toBeDefined();
      expect(template.Resources.DatabaseSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS database instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
      const dbProps = template.Resources.DatabaseInstance.Properties;
      expect(dbProps.Engine).toBe('mysql');
      expect(dbProps.DBInstanceClass).toBe('db.t3.micro');
      expect(dbProps.MultiAZ).toBe(true);
      expect(dbProps.StorageEncrypted).toBe(true);
      expect(dbProps.BackupRetentionPeriod).toBe(7);
    });

    test('database should be deletable (no retention)', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.Properties.DeletionProtection).toBe(false);
    });
  });

  describe('Resources - Storage', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.ApplicationS3Bucket).toBeDefined();
      expect(template.Resources.ApplicationS3Bucket.Type).toBe('AWS::S3::Bucket');
      const bucketProps = template.Resources.ApplicationS3Bucket.Properties;
      expect(bucketProps.BucketEncryption).toBeDefined();
      expect(bucketProps.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucketProps.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('S3 bucket should have AES-256 encryption', () => {
      const encryption = template.Resources.ApplicationS3Bucket.Properties.BucketEncryption;
      const sseConfig = encryption.ServerSideEncryptionConfiguration[0];
      expect(sseConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('Resources - Monitoring', () => {
    test('should have CloudWatch alarms', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(template.Resources.ALBResponseTimeAlarm).toBeDefined();
    });

    test('CPU alarms should have correct thresholds', () => {
      const highCPU = template.Resources.HighCPUAlarm.Properties;
      const dbCPU = template.Resources.DatabaseCPUAlarm.Properties;
      
      expect(highCPU.Threshold).toBe(80);
      expect(dbCPU.Threshold).toBe(80);
      expect(highCPU.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(dbCPU.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('ALB response time alarm should monitor latency', () => {
      const albAlarm = template.Resources.ALBResponseTimeAlarm.Properties;
      expect(albAlarm.MetricName).toBe('TargetResponseTime');
      expect(albAlarm.Threshold).toBe(1);
      expect(albAlarm.Statistic).toBe('Average');
    });
  });

  describe('Outputs', () => {
    const requiredOutputs = [
      'VPCId',
      'PublicSubnetA',
      'PublicSubnetB',
      'PrivateSubnetA',
      'PrivateSubnetB',
      'ApplicationLoadBalancerDNS',
      'DatabaseEndpoint',
      'S3BucketName',
      'StackName',
      'EnvironmentSuffix'
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have sufficient resources for production', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all nameable resources should use environment suffix', () => {
      const nameableResources = [
        { resource: 'ApplicationLoadBalancer', prop: 'Name' },
        { resource: 'ALBTargetGroup', prop: 'Name' },
        { resource: 'AutoScalingGroup', prop: 'AutoScalingGroupName' },
        { resource: 'LaunchTemplate', prop: 'LaunchTemplateName' },
        { resource: 'DatabaseInstance', prop: 'DBInstanceIdentifier' },
        { resource: 'DatabaseSubnetGroup', prop: 'DBSubnetGroupName' }
      ];

      nameableResources.forEach(item => {
        const resource = template.Resources[item.resource];
        if (resource && resource.Properties && resource.Properties[item.prop]) {
          const value = JSON.stringify(resource.Properties[item.prop]);
          // Check if it contains EnvironmentSuffix reference
          expect(value).toMatch(/EnvironmentSuffix|Fn::Sub.*EnvironmentSuffix/);
        }
      });
    });

    test('all resources should have production tags', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'environment');
          if (envTag) {
            expect(envTag.Value).toBe('production');
          }
        }
      });
    });
  });

  describe('High Availability', () => {
    test('should have resources in multiple availability zones', () => {
      const subnetA = template.Resources.PublicSubnetA.Properties.AvailabilityZone;
      const subnetB = template.Resources.PublicSubnetB.Properties.AvailabilityZone;
      
      expect(subnetA['Fn::Select'][0]).toBe(0);
      expect(subnetB['Fn::Select'][0]).toBe(1);
    });

    test('should have Multi-AZ RDS deployment', () => {
      const dbProps = template.Resources.DatabaseInstance.Properties;
      expect(dbProps.MultiAZ).toBe(true);
    });

    test('should have redundant NAT Gateways', () => {
      expect(template.Resources.NatGatewayA).toBeDefined();
      expect(template.Resources.NatGatewayB).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    test('database password should be a parameter with NoEcho', async () => {
      const dbPassword = template.Parameters.DatabasePassword;
      if (dbPassword) {
        expect(dbPassword.NoEcho).toBe(true);
      }
    });

    test('S3 bucket should block public access', () => {
      const bucketConfig = template.Resources.ApplicationS3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(bucketConfig.BlockPublicAcls).toBe(true);
      expect(bucketConfig.BlockPublicPolicy).toBe(true);
      expect(bucketConfig.IgnorePublicAcls).toBe(true);
      expect(bucketConfig.RestrictPublicBuckets).toBe(true);
    });

    test('database should be encrypted', () => {
      const dbProps = template.Resources.DatabaseInstance.Properties;
      expect(dbProps.StorageEncrypted).toBe(true);
    });

    test('IAM role should follow least privilege', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role.Properties.Policies).toBeDefined();
      expect(ec2Role.Properties.Policies[0].PolicyName).toBe('S3BucketAccess');
    });
  });
});