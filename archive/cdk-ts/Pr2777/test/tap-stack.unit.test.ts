import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      createCertificate: false
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    test('should create NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `ALBSecurityGroup-${environmentSuffix}`,
        GroupDescription: `Security group for Application Load Balancer - ${environmentSuffix}`,
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          }
        ]
      });
    });

    test('should create EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `EC2SecurityGroup-${environmentSuffix}`,
        GroupDescription: `Security group for EC2 instances - ${environmentSuffix}`
      });
    });

    test('should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `RDSSecurityGroup-${environmentSuffix}`,
        GroupDescription: `Security group for RDS PostgreSQL database - ${environmentSuffix}`
      });
    });

    test('should have security group ingress rules', () => {
      // Check for EC2 to ALB rule
      template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 2); // EC2<->ALB and RDS<->EC2
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 instance role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `EC2InstanceRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole'
            }
          ],
          Version: '2012-10-17'
        }
      });
    });

    test('should create instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `EC2InstanceProfile-${environmentSuffix}`
      });
    });

    test('should have managed policies attached', () => {
      // Check that EC2 role has managed policies (structure may vary due to CDK generation)
      const resources = template.toJSON().Resources;
      const ec2Role = Object.values(resources).find((resource: any) =>
        resource.Type === 'AWS::IAM::Role' &&
        resource.Properties?.RoleName === `EC2InstanceRole-${environmentSuffix}`
      );

      expect(ec2Role).toBeDefined();
      expect((ec2Role as any).Properties.ManagedPolicyArns).toHaveLength(2);
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create launch template', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `LaunchTemplate-${environmentSuffix}`,
        LaunchTemplateData: {
          InstanceType: 't3.medium',
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                VolumeSize: 20,
                VolumeType: 'gp3',
                Encrypted: true
              }
            }
          ]
        }
      });
    });

    test('should create auto scaling group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `AutoScalingGroup-${environmentSuffix}`,
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '3',
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300
      });
    });

    test('should create CPU scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization'
          }
        }
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create application load balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `ApplicationLoadBalancer-${environmentSuffix}`,
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should create target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `TargetGroup-${environmentSuffix}`,
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 10,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 5
      });
    });

    test('should create HTTP listener without certificate', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          {
            Type: 'forward',
            TargetGroupArn: Match.anyValue()
          }
        ]
      });
    });

    test('should not create HTTPS listener when certificate is disabled', () => {
      const listeners = template.findResources('AWS::ElasticLoadBalancingV2::Listener');
      const httpsListener = Object.values(listeners).find((listener: any) =>
        listener.Properties?.Port === 443
      );
      expect(httpsListener).toBeUndefined();
    });
  });

  describe('RDS Database', () => {
    test('should create DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: `dbsubnetgroup-${environmentSuffix}`,
        DBSubnetGroupDescription: `Subnet group for RDS PostgreSQL database - ${environmentSuffix}`
      });
    });

    test('should create DB parameter group', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        DBParameterGroupName: `DBParameterGroup-${environmentSuffix}`,
        Family: 'postgres15',
        Description: `Parameter group for PostgreSQL 14.9 - ${environmentSuffix}`
      });
    });

    test('should create PostgreSQL database', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `postgresqldatabase-${environmentSuffix}`,
        Engine: 'postgres',
        EngineVersion: '15',
        AllocatedStorage: '20',
        StorageType: 'gp2',
        StorageEncrypted: true,
        MultiAZ: true,
        AutoMinorVersionUpgrade: true,
        BackupRetentionPeriod: 7,
        MonitoringInterval: 60,
        EnablePerformanceInsights: true,
        DBName: 'productiondb'
      });
    });

    test('should create database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `production-db-credentials-${environmentSuffix}`,
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"postgres"}',
          GenerateStringKey: 'password',
          PasswordLength: 30,
          ExcludeCharacters: Match.anyValue()
        }
      });
    });
  });

  describe('Certificate Configuration', () => {
    test('should not create certificate when disabled', () => {
      template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: { Name: `ProductionVPCId-${environmentSuffix}` }
      });

      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name',
        Export: { Name: `ProductionALBDNS-${environmentSuffix}` }
      });

      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS PostgreSQL database endpoint',
        Export: { Name: `ProductionDBEndpoint-${environmentSuffix}` }
      });

      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group name',
        Export: { Name: `ProductionASGName-${environmentSuffix}` }
      });

      template.hasOutput('AccessUrl', {
        Description: 'Application access URL',
        Export: { Name: `ProductionAccessUrl-${environmentSuffix}` }
      });
    });

    test('should not output certificate ARN when certificate disabled', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.CertificateArn).toBeUndefined();
    });
  });

  describe('Resource Tagging', () => {
    test('should apply common tags to stack', () => {
      expect(stack.tags.tagValues()).toEqual(
        expect.objectContaining({
          'Environment': environmentSuffix,
          'Project': 'WebApplication',
          'ManagedBy': 'CDK',
          'CostCenter': 'Engineering',
          'Owner': 'Platform-Team'
        })
      );
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use provided environment suffix in resource names', () => {
      // Test that our current stack uses the environment suffix
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `AutoScalingGroup-${environmentSuffix}`
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `ApplicationLoadBalancer-${environmentSuffix}`
      });
    });

    test('should handle different environment suffixes', () => {
      const customEnv = 'staging';
      const appCustom = new cdk.App();
      const stackCustom = new TapStack(appCustom, 'TestTapStackCustom', {
        environmentSuffix: customEnv,
        createCertificate: false
      });
      const templateCustom = Template.fromStack(stackCustom);

      templateCustom.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `AutoScalingGroup-${customEnv}`
      });
    });


    test('should use context value when no props provided', () => {
      const appContext = new cdk.App();
      appContext.node.setContext('environmentSuffix', 'ctx');
      const stackContext = new TapStack(appContext, 'TestTapStackContext', {
        createCertificate: false
      });
      const templateContext = Template.fromStack(stackContext);

      templateContext.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'AutoScalingGroup-ctx'
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;

      const vpcs = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::EC2::VPC'
      );
      const securityGroups = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::EC2::SecurityGroup'
      );
      const loadBalancers = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      const autoScalingGroups = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::AutoScaling::AutoScalingGroup'
      );
      const rdsInstances = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::RDS::DBInstance'
      );

      expect(vpcs).toHaveLength(1);
      expect(securityGroups.length).toBeGreaterThanOrEqual(3); // ALB, EC2, RDS
      expect(loadBalancers).toHaveLength(1);
      expect(autoScalingGroups).toHaveLength(1);
      expect(rdsInstances).toHaveLength(1);
    });
  });

  describe('Security Configuration', () => {
    test('should enable encryption for EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [
            {
              Ebs: {
                Encrypted: true
              }
            }
          ]
        }
      });
    });

    test('should enable encryption for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });

    test('should have proper deletion policy for RDS', () => {
      const resources = template.toJSON().Resources;
      const rdsInstance = Object.values(resources).find((resource: any) =>
        resource.Type === 'AWS::RDS::DBInstance'
      );

      expect(rdsInstance).toBeDefined();
      if (rdsInstance) {
        expect((rdsInstance as any).DeletionPolicy).toBe('Snapshot');
      }
    });
  });

  describe('Certificate Flag Testing', () => {
    test('should create certificate when flag is enabled', () => {
      // Use completely separate app to avoid conflicts
      const certApp = new cdk.App();
      const certStack = new TapStack(certApp, 'CertTestStack', {
        environmentSuffix: 'cert',
        createCertificate: true
      });
      const certTemplate = Template.fromStack(certStack);

      certTemplate.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'yourdomain.com',
        SubjectAlternativeNames: ['*.yourdomain.com']
      });
    });
  });
});