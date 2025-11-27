/**
 * Unit tests for TapStack CloudFormation template
 * Platform: CloudFormation (CFN)
 * Language: JSON
 */

const fs = require('fs');
const path = require('path');

describe('TapStack CloudFormation Template', () => {
  let template, resources, parameters, outputs;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../../lib/TapStack.json');
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    resources = template.Resources || {};
    parameters = template.Parameters || {};
    outputs = template.Outputs || {};
  });

  describe('Template Structure', () => {
    test('has valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
    test('has description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description.length).toBeGreaterThan(0);
    });
    test('has Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });
    test('has Resources section with content', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });
    test('has Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('has environmentSuffix parameter with constraints', () => {
      expect(parameters.environmentSuffix).toBeDefined();
      expect(parameters.environmentSuffix.Type).toBe('String');
      expect(parameters.environmentSuffix.AllowedPattern).toBeDefined();
    });
    test('has CertificateArn parameter', () => {
      expect(parameters.CertificateArn).toBeDefined();
      expect(parameters.CertificateArn.Type).toBe('String');
    });
    test('has DatabaseMasterPassword parameter with NoEcho', () => {
      expect(parameters.DatabaseMasterPassword).toBeDefined();
      expect(parameters.DatabaseMasterPassword.NoEcho).toBe(true);
      expect(parameters.DatabaseMasterPassword.MinLength).toBeGreaterThanOrEqual(16);
    });
  });

  describe('VPC and Networking', () => {
    test('has VPC with correct CIDR', () => {
      expect(resources.VPC).toBeDefined();
      expect(resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });
    test('has 3 public subnets in different AZs', () => {
      expect(resources.PublicSubnet1).toBeDefined();
      expect(resources.PublicSubnet2).toBeDefined();
      expect(resources.PublicSubnet3).toBeDefined();
      const az1 = resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0];
      const az2 = resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0];
      const az3 = resources.PublicSubnet3.Properties.AvailabilityZone['Fn::Select'][0];
      expect([az1, az2, az3]).toEqual([0, 1, 2]);
    });
    test('has 3 private subnets without public IPs', () => {
      expect(resources.PrivateSubnet1).toBeDefined();
      expect(resources.PrivateSubnet2).toBeDefined();
      expect(resources.PrivateSubnet3).toBeDefined();
      expect(resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });
    test('has Internet Gateway and 3 NAT Gateways', () => {
      expect(resources.InternetGateway).toBeDefined();
      expect(resources.NatGateway1).toBeDefined();
      expect(resources.NatGateway2).toBeDefined();
      expect(resources.NatGateway3).toBeDefined();
    });
    test('has route tables for private subnets', () => {
      expect(resources.PrivateRouteTable1).toBeDefined();
      expect(resources.PrivateRouteTable2).toBeDefined();
      expect(resources.PrivateRouteTable3).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('has ALB security group allowing HTTPS', () => {
      expect(resources.ALBSecurityGroup).toBeDefined();
      const ingress = resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress.find(r => r.FromPort === 443)).toBeDefined();
    });
    test('has Application security group restricted to ALB', () => {
      expect(resources.ApplicationSecurityGroup).toBeDefined();
      const ingress = resources.ApplicationSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });
    test('has Database security group restricted to Application', () => {
      expect(resources.DatabaseSecurityGroup).toBeDefined();
      const ingress = resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(5432);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ApplicationSecurityGroup' });
    });
  });

  describe('KMS Encryption', () => {
    test('has KMS key with rotation enabled', () => {
      expect(resources.EncryptionKey).toBeDefined();
      expect(resources.EncryptionKey.Properties.EnableKeyRotation).toBe(true);
    });
    test('has KMS key alias', () => {
      expect(resources.EncryptionKeyAlias).toBeDefined();
    });
  });

  describe('RDS Aurora Database', () => {
    test('has Aurora PostgreSQL cluster with Serverless v2', () => {
      expect(resources.DatabaseCluster).toBeDefined();
      expect(resources.DatabaseCluster.Properties.Engine).toBe('aurora-postgresql');
      expect(resources.DatabaseCluster.Properties.EngineMode).toBe('provisioned');
      const scaling = resources.DatabaseCluster.Properties.ServerlessV2ScalingConfiguration;
      expect(scaling.MinCapacity).toBe(0.5);
      expect(scaling.MaxCapacity).toBe(4);
    });
    test('database cluster is encrypted with KMS', () => {
      expect(resources.DatabaseCluster.Properties.StorageEncrypted).toBe(true);
      expect(resources.DatabaseCluster.Properties.KmsKeyId).toEqual({ Ref: 'EncryptionKey' });
    });
    test('has database instance not publicly accessible', () => {
      expect(resources.DatabaseInstance1).toBeDefined();
      expect(resources.DatabaseInstance1.Properties.PubliclyAccessible).toBe(false);
    });
    test('has DB subnet group with all private subnets', () => {
      expect(resources.DBSubnetGroup).toBeDefined();
      const subnets = resources.DBSubnetGroup.Properties.SubnetIds;
      expect(subnets).toHaveLength(3);
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
    });
  });

  describe('S3 Bucket', () => {
    test('has S3 bucket with encryption and versioning', () => {
      expect(resources.DocumentBucket).toBeDefined();
      expect(resources.DocumentBucket.Properties.BucketEncryption).toBeDefined();
      expect(resources.DocumentBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
    test('S3 bucket blocks public access', () => {
      const config = resources.DocumentBucket.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
    });
    test('S3 bucket has lifecycle policies', () => {
      expect(resources.DocumentBucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('Application Load Balancer', () => {
    test('has ALB in public subnets', () => {
      expect(resources.ApplicationLoadBalancer).toBeDefined();
      expect(resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
      const subnets = resources.ApplicationLoadBalancer.Properties.Subnets;
      expect(subnets).toHaveLength(3);
    });
    test('has target group with health check', () => {
      expect(resources.ALBTargetGroup).toBeDefined();
      expect(resources.ALBTargetGroup.Properties.HealthCheckEnabled).toBe(true);
      expect(resources.ALBTargetGroup.Properties.HealthCheckPath).toBe('/health');
    });
    test('has HTTPS listener with certificate', () => {
      expect(resources.ALBListenerHTTPS).toBeDefined();
      expect(resources.ALBListenerHTTPS.Properties.Port).toBe(443);
      expect(resources.ALBListenerHTTPS.Properties.Certificates[0].CertificateArn).toEqual({ Ref: 'CertificateArn' });
    });
    test('has HTTP listener redirecting to HTTPS', () => {
      expect(resources.ALBListenerHTTP).toBeDefined();
      expect(resources.ALBListenerHTTP.Properties.DefaultActions[0].Type).toBe('redirect');
    });
  });

  describe('EC2 Auto Scaling', () => {
    test('has Launch Template with IAM profile', () => {
      expect(resources.LaunchTemplate).toBeDefined();
      expect(resources.LaunchTemplate.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
    });
    test('has ASG in private subnets', () => {
      expect(resources.AutoScalingGroup).toBeDefined();
      const subnets = resources.AutoScalingGroup.Properties.VPCZoneIdentifier;
      expect(subnets).toHaveLength(3);
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
    });
    test('ASG depends on database instance', () => {
      expect(resources.AutoScalingGroup.DependsOn).toContain('DatabaseInstance1');
    });
    test('has scaling policy based on ALB request count', () => {
      expect(resources.ScalingPolicyRequestCount).toBeDefined();
      const metric = resources.ScalingPolicyRequestCount.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification;
      expect(metric.PredefinedMetricType).toBe('ALBRequestCountPerTarget');
    });
  });

  describe('IAM Roles', () => {
    test('has EC2 role with CloudWatch policy', () => {
      expect(resources.EC2Role).toBeDefined();
      expect(resources.EC2Role.Properties.ManagedPolicyArns).toContainEqual(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });
    test('EC2 role has S3 access to document bucket', () => {
      const policies = resources.EC2Role.Properties.Policies;
      const s3Policy = policies.find(p => p.PolicyName === 'S3DocumentAccess');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('all log groups have 365-day retention', () => {
      expect(resources.ApplicationLogGroup.Properties.RetentionInDays).toBe(365);
      expect(resources.DatabaseLogGroup.Properties.RetentionInDays).toBe(365);
      expect(resources.ALBLogGroup.Properties.RetentionInDays).toBe(365);
    });
    test('all log groups have deletion policy', () => {
      expect(resources.ApplicationLogGroup.DeletionPolicy).toBe('Delete');
      expect(resources.DatabaseLogGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Resource Naming', () => {
    test('resources include environmentSuffix in names', () => {
      const vpcNameTag = resources.VPC.Properties.Tags.find(t => t.Key === 'Name');
      expect(vpcNameTag.Value['Fn::Sub']).toContain('${environmentSuffix}');
      expect(resources.DocumentBucket.Properties.BucketName['Fn::Sub']).toContain('${environmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('has required outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.DocumentBucketName).toBeDefined();
      expect(outputs.DatabaseClusterEndpoint).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
    });
    test('all outputs have descriptions', () => {
      Object.keys(outputs).forEach(key => {
        expect(outputs[key].Description).toBeDefined();
        expect(outputs[key].Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no Retain deletion policies', () => {
      Object.values(resources).forEach(resource => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
    test('no hardcoded credentials', () => {
      const templateStr = JSON.stringify(template);
      // Check for actual hardcoded passwords (not parameter descriptions or references)
      expect(templateStr).not.toMatch(/["']password["']\s*:\s*["'][a-z0-9]/i);
      expect(templateStr).not.toMatch(/["']secret_key["']\s*:\s*["'][a-z0-9]/i);
      expect(templateStr).not.toMatch(/["']api_key["']\s*:\s*["'][a-z0-9]/i);
    });
  });
});
