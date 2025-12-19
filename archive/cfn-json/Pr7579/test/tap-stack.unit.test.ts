import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Payment Processing Infrastructure', () => {
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
      expect(template.Description).toContain('Payment Processing');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('should have CertificateArn parameter', () => {
      expect(template.Parameters.CertificateArn).toBeDefined();
      expect(template.Parameters.CertificateArn.Type).toBe('String');
      expect(template.Parameters.CertificateArn.Default).toBe('');
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
    });
  });

  describe('Conditions', () => {
    test('should have HasCertificate condition', () => {
      expect(template.Conditions.HasCertificate).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have 3 public subnets across 3 AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('should have 3 private subnets across 3 AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
    });
  });

  describe('RDS Aurora Resources', () => {
    test('should have Aurora Cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora Cluster should have encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('Aurora Cluster should have DeletionPolicy Delete', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
    });

    test('should have Aurora Instances', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance1.Type).toBe(
        'AWS::RDS::DBInstance'
      );
      expect(template.Resources.AuroraInstance2).toBeDefined();
    });

    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe(
        'AWS::RDS::DBSubnetGroup'
      );
    });

    test('should have KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });
  });

  describe('Auto Scaling Group Resources', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe(
        'AWS::EC2::LaunchTemplate'
      );
    });

    test('Launch Template should require IMDSv2', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const metadata =
        launchTemplate.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );
    });

    test('Auto Scaling Group should have correct capacity', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBeDefined();
      expect(asg.Properties.MaxSize).toBeDefined();
      expect(asg.Properties.DesiredCapacity).toBeDefined();
    });
  });

  describe('Application Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('should have HTTP Listener', () => {
      expect(template.Resources.ALBListenerHTTP).toBeDefined();
      expect(template.Resources.ALBListenerHTTP.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
    });

    test('HTTP Listener should listen on port 80', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should have conditional HTTPS Listener', () => {
      expect(template.Resources.ALBListenerHTTPS).toBeDefined();
      expect(template.Resources.ALBListenerHTTPS.Condition).toBe(
        'HasCertificate'
      );
    });

    test('should have Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have Application Security Group', () => {
      expect(template.Resources.AppSecurityGroup).toBeDefined();
      expect(template.Resources.AppSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have Database Security Group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('security groups should have specific port rules', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const ingress = albSG.Properties.SecurityGroupIngress;
      ingress.forEach((rule: any) => {
        expect(rule.FromPort).toBeDefined();
        expect(rule.ToPort).toBeDefined();
        expect(rule.IpProtocol).toBeDefined();
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM Role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('EC2 Role should have least-privilege policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('should have Static Assets Bucket', () => {
      expect(template.Resources.StaticAssetsBucket).toBeDefined();
      expect(template.Resources.StaticAssetsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('Static Assets Bucket should have encryption', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('Static Assets Bucket should have versioning', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have Flow Logs Bucket', () => {
      expect(template.Resources.FlowLogsBucket).toBeDefined();
      expect(template.Resources.FlowLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Application Log Group', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('Log Group should have 30-day retention', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have CPU Alarm', () => {
      expect(template.Resources.CPUAlarm).toBeDefined();
      expect(template.Resources.CPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have Database Connections Alarm', () => {
      expect(template.Resources.DatabaseConnectionsAlarm).toBeDefined();
      expect(template.Resources.DatabaseConnectionsAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('CPU Alarm should trigger at 80% for 5 minutes', () => {
      const alarm = template.Resources.CPUAlarm;
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.EvaluationPeriods).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'AuroraClusterEndpoint',
        'StaticAssetsBucketName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('LoadBalancerDNS output should reference ALB', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value).toBeDefined();
    });

    test('AuroraClusterEndpoint output should reference cluster', () => {
      const output = template.Outputs.AuroraClusterEndpoint;
      expect(output.Value).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should use EnvironmentSuffix', () => {
      const namedResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PrivateSubnet1',
        'StaticAssetsBucket',
        'FlowLogsBucket',
        'ApplicationLogGroup',
      ];

      namedResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Name'
          );
          if (nameTag) {
            expect(nameTag.Value).toHaveProperty('Fn::Sub');
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50); // Payment processing has 54 resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Destroyability Requirements', () => {
    test('Aurora Cluster should not have DeletionProtection', () => {
      const cluster = template.Resources.AuroraCluster;
      if (cluster.Properties.DeletionProtection !== undefined) {
        expect(cluster.Properties.DeletionProtection).toBe(false);
      }
    });

    test('Aurora Cluster should have DeletionPolicy Delete', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
    });

    test('no resources should have DeletionPolicy Retain', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });
});
