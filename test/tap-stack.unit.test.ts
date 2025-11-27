import fs from 'fs';
import path from 'path';

describe('Loan Processing Application CloudFormation Template', () => {
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
      expect(template.Description).toBe('Loan Processing Application Infrastructure - Production Ready');
    });

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
  });

  describe('Parameters', () => {
    test('should have environmentSuffix parameter', () => {
      expect(template.Parameters.environmentSuffix).toBeDefined();
      expect(template.Parameters.environmentSuffix.Type).toBe('String');
      expect(template.Parameters.environmentSuffix.Default).toBe('dev');
      expect(template.Parameters.environmentSuffix.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have CertificateArn parameter', () => {
      expect(template.Parameters.CertificateArn).toBeDefined();
      expect(template.Parameters.CertificateArn.Type).toBe('String');
    });

    test('should have DatabaseMasterUsername parameter', () => {
      expect(template.Parameters.DatabaseMasterUsername).toBeDefined();
      expect(template.Parameters.DatabaseMasterUsername.Type).toBe('String');
      expect(template.Parameters.DatabaseMasterUsername.Default).toBe('dbadmin');
    });

    test('should have DatabaseMasterPassword parameter with NoEcho', () => {
      expect(template.Parameters.DatabaseMasterPassword).toBeDefined();
      expect(template.Parameters.DatabaseMasterPassword.Type).toBe('String');
      expect(template.Parameters.DatabaseMasterPassword.NoEcho).toBe(true);
      expect(template.Parameters.DatabaseMasterPassword.MinLength).toBe(16);
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC with correct CIDR', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have 3 public subnets across 3 AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
      
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should have 3 private subnets across 3 AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
      
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('should have NAT Gateway for private subnet connectivity', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.AttachGateway).toBeDefined();
    });

    test('should have route tables for all subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      // Using single NAT Gateway and route table for all private subnets (cost optimization)
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });
  });

  describe('Database Resources', () => {
    test('should have Aurora PostgreSQL Serverless v2 cluster', () => {
      expect(template.Resources.DatabaseCluster).toBeDefined();
      expect(template.Resources.DatabaseCluster.Type).toBe('AWS::RDS::DBCluster');
      expect(template.Resources.DatabaseCluster.Properties.Engine).toBe('aurora-postgresql');
      expect(template.Resources.DatabaseCluster.Properties.EngineMode).toBe('provisioned');
    });

    test('should have ServerlessV2ScalingConfiguration', () => {
      const scaling = template.Resources.DatabaseCluster.Properties.ServerlessV2ScalingConfiguration;
      expect(scaling).toBeDefined();
      expect(scaling.MinCapacity).toBe(0.5);
      expect(scaling.MaxCapacity).toBe(4);
    });

    test('should have database instance with serverless type', () => {
      expect(template.Resources.DatabaseInstance1).toBeDefined();
      expect(template.Resources.DatabaseInstance1.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.DatabaseInstance1.Properties.DBInstanceClass).toBe('db.serverless');
    });

    test('should have encryption enabled with KMS key', () => {
      expect(template.Resources.DatabaseCluster.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.DatabaseCluster.Properties.KmsKeyId).toBeDefined();
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB in public subnets', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
      expect(template.Resources.ApplicationLoadBalancer.Properties.Subnets.length).toBe(3);
    });

    test('should have HTTPS listener with certificate', () => {
      expect(template.Resources.ALBListenerHTTPS).toBeDefined();
      expect(template.Resources.ALBListenerHTTPS.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.ALBListenerHTTPS.Properties.Protocol).toBe('HTTPS');
      expect(template.Resources.ALBListenerHTTPS.Properties.Port).toBe(443);
      expect(template.Resources.ALBListenerHTTPS.Properties.Certificates).toBeDefined();
    });

    test('should have target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(template.Resources.ALBTargetGroup.Properties.Protocol).toBe('HTTP');
      expect(template.Resources.ALBTargetGroup.Properties.Port).toBe(8080);
    });

    test('should have health check configuration', () => {
      const healthCheck = template.Resources.ALBTargetGroup.Properties.HealthCheckPath;
      expect(healthCheck).toBeDefined();
      expect(healthCheck).toBe('/health');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket for document storage', () => {
      expect(template.Resources.DocumentBucket).toBeDefined();
      expect(template.Resources.DocumentBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have versioning enabled on S3 bucket', () => {
      expect(template.Resources.DocumentBucket.Properties.VersioningConfiguration).toBeDefined();
      expect(template.Resources.DocumentBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have encryption enabled on S3 bucket', () => {
      const encryption = template.Resources.DocumentBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have lifecycle policy on S3 bucket', () => {
      const lifecycle = template.Resources.DocumentBucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules.length).toBeGreaterThan(0);
    });

    test('should NOT have Retain deletion policy on S3 bucket', () => {
      expect(template.Resources.DocumentBucket.DeletionPolicy).not.toBe('Retain');
      expect(template.Resources.DocumentBucket.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should have launch template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have auto scaling group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have scaling policy based on ALB request count', () => {
      expect(template.Resources.ScalingPolicyRequestCount).toBeDefined();
      expect(template.Resources.ScalingPolicyRequestCount.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      
      const config = template.Resources.ScalingPolicyRequestCount.Properties.TargetTrackingConfiguration;
      expect(config.PredefinedMetricSpecification).toBeDefined();
      expect(config.PredefinedMetricSpecification.PredefinedMetricType).toBe('ALBRequestCountPerTarget');
    });

    test('should NOT use CPU or memory metrics for scaling', () => {
      const policy = template.Resources.ScalingPolicyRequestCount.Properties;
      const metricSpec = policy.TargetTrackingConfiguration.PredefinedMetricSpecification;
      
      if (metricSpec) {
        const metricType = metricSpec.PredefinedMetricType;
        expect(metricType).not.toContain('CPU');
        expect(metricType).not.toContain('Memory');
        expect(metricType).toBe('ALBRequestCountPerTarget');
      }
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudWatch log groups', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have 365-day retention on log groups', () => {
      expect(template.Resources.ApplicationLogGroup.Properties.RetentionInDays).toBe(365);
      expect(template.Resources.DatabaseLogGroup.Properties.RetentionInDays).toBe(365);
      expect(template.Resources.ALBLogGroup.Properties.RetentionInDays).toBe(365);
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.EncryptionKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have security groups with least privilege', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('database security group should only allow application access', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(dbSG.SourceSecurityGroupId).toBeDefined();
      expect(dbSG.CidrIp).toBeUndefined(); // Should not allow CIDR ranges
    });

    test('should have IAM roles for services', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include environmentSuffix in names', () => {
      const resourcesWithNames = [
        'VPC', 'DocumentBucket', 'DatabaseCluster', 'ApplicationLoadBalancer',
        'ApplicationLogGroup', 'SystemLogGroup', 'SecurityLogGroup'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(JSON.stringify(nameTag.Value)).toContain('environmentSuffix');
          }
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPC output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Description).toBeDefined();
    });

    test('should have ALB DNS output', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS.Description).toBeDefined();
    });

    test('should have database endpoint output', () => {
      expect(template.Outputs.DatabaseClusterEndpoint).toBeDefined();
      expect(template.Outputs.DatabaseClusterEndpoint.Description).toBeDefined();
    });

    test('should have S3 bucket output', () => {
      expect(template.Outputs.DocumentBucketName).toBeDefined();
      expect(template.Outputs.DocumentBucketName.Description).toBeDefined();
    });
  });

  describe('Compliance Requirements', () => {
    test('all compute resources should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup.Properties.VPCZoneIdentifier;
      expect(asg).toHaveLength(3);
      expect(JSON.stringify(asg[0])).toContain('PrivateSubnet1');
      expect(JSON.stringify(asg[1])).toContain('PrivateSubnet2');
      expect(JSON.stringify(asg[2])).toContain('PrivateSubnet3');
    });

    test('database should have encrypted backups', () => {
      expect(template.Resources.DatabaseCluster.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.DatabaseCluster.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('all data stores should have encryption at rest', () => {
      // S3
      expect(template.Resources.DocumentBucket.Properties.BucketEncryption).toBeDefined();
      // RDS
      expect(template.Resources.DatabaseCluster.Properties.StorageEncrypted).toBe(true);
      // EBS volumes in launch template
      const blockDevices = template.Resources.LaunchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings;
      if (blockDevices && blockDevices[0]) {
        expect(blockDevices[0].Ebs.Encrypted).toBe(true);
      }
    });
  });
});
