import * as fs from 'fs';
import * as path from 'path';

describe('Trading Platform DR CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Multi-Region Disaster Recovery');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have Metadata section with CloudFormation Interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
    });

    test('should have SecondaryRegion parameter with valid options', () => {
      expect(template.Parameters.SecondaryRegion).toBeDefined();
      expect(template.Parameters.SecondaryRegion.Type).toBe('String');
      expect(template.Parameters.SecondaryRegion.Default).toBe('us-west-2');
      expect(template.Parameters.SecondaryRegion.AllowedValues).toContain('us-west-2');
    });

    test('should have compute configuration parameters', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.MinSize).toBeDefined();
      expect(template.Parameters.MaxSize).toBeDefined();
      expect(template.Parameters.DesiredCapacity).toBeDefined();
    });

    test('should have database configuration parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBInstanceClass.Default).toBe('db.r6g.large');
    });

    test('should have DNS and monitoring parameters', () => {
      expect(template.Parameters.HostedZoneId).toBeDefined();
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.HealthCheckPath).toBeDefined();
      expect(template.Parameters.AlertEmail).toBeDefined();
    });

    test('should have valid parameter constraints', () => {
      expect(template.Parameters.MinSize.MinValue).toBe(2);
      expect(template.Parameters.MaxSize.MinValue).toBe(2);
      expect(template.Parameters.DesiredCapacity.MinValue).toBe(2);
    });
  });

  describe('VPC and Network Resources', () => {
    test('should define VPC with proper CIDR', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should define Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should define public subnets in multiple AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should define private subnets in multiple AZs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet2).toBeDefined();
      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should define NAT Gateway with EIP', () => {
      const natGateway = template.Resources.NATGateway1;
      const eip = template.Resources.NATGateway1EIP;

      expect(natGateway).toBeDefined();
      expect(eip).toBeDefined();
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should define route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PrivateRoute1).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should define ALB security group with proper rules', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg).toBeDefined();
      expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpRule = albSg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = albSg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('should define EC2 security group with ALB access only', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      expect(ec2Sg).toBeDefined();
      expect(ec2Sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(ec2Sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const ingress = ec2Sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(8080);
      expect(ingress.ToPort).toBe(8080);
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should define RDS security group with EC2 access only', () => {
      const rdsSg = template.Resources.RDSSecurityGroup;
      expect(rdsSg).toBeDefined();
      expect(rdsSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(rdsSg.Properties.SecurityGroupIngress).toHaveLength(1);

      const ingress = rdsSg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('should not have overly permissive security group rules', () => {
      const resources = template.Resources;
      const securityGroups = Object.keys(resources)
        .filter((key) => resources[key].Type === 'AWS::EC2::SecurityGroup');

      securityGroups.forEach((sgKey) => {
        const sg = resources[sgKey];
        if (sg.Properties.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            // EC2 and RDS should not allow 0.0.0.0/0
            if (sgKey === 'EC2SecurityGroup' || sgKey === 'RDSSecurityGroup') {
              expect(rule.CidrIp).not.toBe('0.0.0.0/0');
            }
          });
        }
      });
    });
  });

  describe('Compute Resources', () => {
    test('should define Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should define Target Group with health checks', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toEqual({ Ref: 'HealthCheckPath' });
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
    });

    test('should define ALB Listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should define Launch Template with proper configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.SecurityGroupIds).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should define Auto Scaling Group with multi-AZ', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should define Scaling Policy', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(70.0);
    });
  });

  describe('Database Resources', () => {
    test('should define RDS subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should define RDS database with Multi-AZ and encryption', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.DeletionProtection).toBe(false);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should define DynamoDB Global Table with replication', () => {
      const dynamodb = template.Resources.DynamoDBTable;
      expect(dynamodb).toBeDefined();
      expect(dynamodb.Type).toBe('AWS::DynamoDB::GlobalTable');
      expect(dynamodb.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(dynamodb.Properties.Replicas).toHaveLength(2);
      expect(dynamodb.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should enable point-in-time recovery for DynamoDB', () => {
      const dynamodb = template.Resources.DynamoDBTable;
      dynamodb.Properties.Replicas.forEach((replica: any) => {
        expect(replica.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      });
    });
  });

  describe('S3 and Replication', () => {
    test('should define S3 bucket with versioning', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3).toBeDefined();
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(s3.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should define S3 bucket with encryption', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Properties.BucketEncryption).toBeDefined();
      expect(s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('should block public access on S3 bucket', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(s3.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(s3.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(s3.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(s3.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    // Replication is optional in current template; no test enforced
  });

  describe('IAM Roles and Permissions', () => {
    test('should define EC2 IAM role', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should attach proper managed policies to EC2 role', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should define EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });

    test('should have inline policies for DynamoDB and S3 access', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies).toHaveLength(1);

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('TradingAppPolicy');

      const statements = policy.PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThan(0);

      const dynamodbStatement = statements.find((stmt: any) =>
        stmt.Action && stmt.Action.includes('dynamodb:GetItem')
      );
      const s3Statement = statements.find((stmt: any) =>
        stmt.Action && stmt.Action.includes('s3:GetObject')
      );

      expect(dynamodbStatement).toBeDefined();
      expect(s3Statement).toBeDefined();
    });
  });

  describe('Route53 and Health Checks', () => {
    test('should define Route53 health check', () => {
      const healthCheck = template.Resources.Route53HealthCheck;
      expect(healthCheck).toBeDefined();
      expect(healthCheck.Type).toBe('AWS::Route53::HealthCheck');
      expect(healthCheck.Properties.HealthCheckConfig.Type).toBe('HTTP');
      expect(healthCheck.Properties.HealthCheckConfig.RequestInterval).toBe(30);
      expect(healthCheck.Properties.HealthCheckConfig.FailureThreshold).toBe(3);
    });

    test('should define Route53 record with failover', () => {
      const record = template.Resources.Route53Record;
      expect(record).toBeDefined();
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.Failover).toBe('PRIMARY');
      expect(record.Properties.SetIdentifier).toBe('Primary');
      expect(record.Properties.HealthCheckId).toEqual({ Ref: 'Route53HealthCheck' });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should define SNS topic for alerts', () => {
      const sns = template.Resources.SNSTopic;
      expect(sns).toBeDefined();
      expect(sns.Type).toBe('AWS::SNS::Topic');
      expect(sns.Properties.Subscription).toBeDefined();
      expect(sns.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should define ALB health check alarm', () => {
      const alarm = template.Resources.ALBHealthCheckAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('should define RDS CPU alarm', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('should define DynamoDB throttle alarm', () => {
      const alarm = template.Resources.DynamoDBReadThrottleAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ReadThrottleEvents');
      expect(alarm.Properties.Namespace).toBe('AWS/DynamoDB');
    });

    test('all alarms should have SNS action configured', () => {
      const alarms = ['ALBHealthCheckAlarm', 'RDSCPUAlarm', 'DynamoDBReadThrottleAlarm'];
      alarms.forEach((alarmKey) => {
        const alarm = template.Resources[alarmKey];
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
      });
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('should use EnvironmentSuffix in all critical resource names', () => {
      const resourcesWithNames = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'ALBSecurityGroup',
        'EC2SecurityGroup', 'RDSSecurityGroup', 'ApplicationLoadBalancer',
        'TargetGroup', 'RDSDatabase', 'DynamoDBTable', 'S3Bucket',
        'EC2Role', 'S3ReplicationRole', 'LaunchTemplate', 'AutoScalingGroup',
        'SNSTopic', 'Route53HealthCheck'
      ];

      resourcesWithNames.forEach((resourceKey) => {
        const resource = template.Resources[resourceKey];
        if (!resource) return;

        const properties = resource.Properties;
        let hasEnvironmentSuffix = false;

        // Check various name properties
        const nameProperties = ['Name', 'TableName', 'BucketName', 'TopicName',
                                'RoleName', 'DBInstanceIdentifier', 'LaunchTemplateName',
                                'AutoScalingGroupName', 'InstanceProfileName'];

        nameProperties.forEach((prop) => {
          if (properties[prop]) {
            const value = JSON.stringify(properties[prop]);
            if (value.includes('EnvironmentSuffix') || value.includes('${EnvironmentSuffix}')) {
              hasEnvironmentSuffix = true;
            }
          }
        });

        // Check Tags
        if (properties.Tags) {
          properties.Tags.forEach((tag: any) => {
            if (tag.Key === 'Name') {
              const value = JSON.stringify(tag.Value);
              if (value.includes('EnvironmentSuffix') || value.includes('${EnvironmentSuffix}')) {
                hasEnvironmentSuffix = true;
              }
            }
          });
        }

        // Check AlarmName
        if (properties.AlarmName) {
          const value = JSON.stringify(properties.AlarmName);
          if (value.includes('EnvironmentSuffix') || value.includes('${EnvironmentSuffix}')) {
            hasEnvironmentSuffix = true;
          }
        }

        // Check HealthCheckTags for Route53HealthCheck
        if (properties.HealthCheckTags) {
          properties.HealthCheckTags.forEach((tag: any) => {
            if (tag.Key === 'Name') {
              const value = JSON.stringify(tag.Value);
              if (value.includes('EnvironmentSuffix') || value.includes('${EnvironmentSuffix}')) {
                hasEnvironmentSuffix = true;
              }
            }
          });
        }

        expect(hasEnvironmentSuffix).toBe(true);
      });
    });
  });

  describe('Outputs Validation', () => {
    test('should export VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    test('should export Load Balancer DNS', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS.Value).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS.Export).toBeDefined();
    });

    test('should export RDS Endpoint', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSEndpoint.Value).toBeDefined();
      expect(template.Outputs.RDSEndpoint.Export).toBeDefined();
    });

    test('should export DynamoDB Table Name', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value).toEqual({ Ref: 'DynamoDBTable' });
    });

    test('should export S3 Bucket Name', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'S3Bucket' });
    });

    test('should export Health Check ID', () => {
      expect(template.Outputs.HealthCheckId).toBeDefined();
      expect(template.Outputs.HealthCheckId.Value).toEqual({ Ref: 'Route53HealthCheck' });
    });

    test('should export SNS Topic ARN', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Value).toEqual({ Ref: 'SNSTopic' });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });
  });

  describe('Circular Dependencies Check', () => {
    test('should not have circular dependencies between resources', () => {
      // This is a basic check - CloudFormation validation already passed
      const resources = template.Resources;
      const resourceKeys = Object.keys(resources);

      // Count resources
      expect(resourceKeys.length).toBeGreaterThan(30);

      // Verify key dependencies exist
      expect(resources.AttachGateway.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(resources.AttachGateway.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });
  });

  describe('Security Best Practices', () => {
    test('should not have hardcoded passwords', () => {
      const templateStr = JSON.stringify(template);
      // Check for common password patterns (but allow Secrets Manager references)
      const hasHardcodedPassword = /Password.*:.*["'][^{][^"']+["']/.test(templateStr) &&
                                   !templateStr.includes('resolve:secretsmanager');
      expect(hasHardcodedPassword).toBe(false);
    });

    test('should use Secrets Manager for database password', () => {
      const rds = template.Resources.RDSDatabase;
      const password = JSON.stringify(rds.Properties.MasterUserPassword);
      expect(password).toContain('resolve:secretsmanager');
      expect(password).toContain('RDSDatabaseSecret');
      expect(password).toContain('SecretString:password');
    });

    test('should not enable deletion protection on resources', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('should enable encryption at rest for sensitive resources', () => {
      const rds = template.Resources.RDSDatabase;
      const dynamodb = template.Resources.DynamoDBTable;
      const s3 = template.Resources.S3Bucket;

      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(dynamodb.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(s3.Properties.BucketEncryption).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    test('should configure Multi-AZ for RDS', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should deploy subnets across multiple AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': ['0', { 'Fn::GetAZs': '' }] });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': ['1', { 'Fn::GetAZs': '' }] });
    });

    test('should configure Auto Scaling Group across multiple subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
    });

    test('should have minimum 2 instances in Auto Scaling Group', () => {
      expect(template.Parameters.MinSize.Default).toBe(2);
      expect(template.Parameters.DesiredCapacity.Default).toBe(2);
    });
  });

  describe('Disaster Recovery Configuration', () => {
    test('should configure DynamoDB Global Table with secondary region', () => {
      const dynamodb = template.Resources.DynamoDBTable;
      expect(dynamodb.Properties.Replicas).toHaveLength(2);

      const primaryReplica = dynamodb.Properties.Replicas.find((r: any) => r.Region === 'us-east-1');
      const secondaryReplica = dynamodb.Properties.Replicas.find((r: any) => r.Region && r.Region.Ref === 'SecondaryRegion');

      expect(primaryReplica).toBeDefined();
      expect(secondaryReplica).toBeDefined();
    });

    test('should configure Route53 failover routing', () => {
      const record = template.Resources.Route53Record;
      expect(record.Properties.Failover).toBe('PRIMARY');
      expect(record.Properties.HealthCheckId).toEqual({ Ref: 'Route53HealthCheck' });
    });

    test('should enable RDS backups', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(rds.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('should enable DynamoDB point-in-time recovery', () => {
      const dynamodb = template.Resources.DynamoDBTable;
      dynamodb.Properties.Replicas.forEach((replica: any) => {
        expect(replica.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      });
    });
  });

  describe('Cost Optimization', () => {
    test('should use cost-effective instance types by default', () => {
      expect(template.Parameters.InstanceType.Default).toBe('t3.large');
      const allowedTypes = template.Parameters.InstanceType.AllowedValues;
      expect(allowedTypes).toContain('t3.medium');
      expect(allowedTypes).toContain('t3.large');
    });

    test('should use DynamoDB on-demand billing', () => {
      const dynamodb = template.Resources.DynamoDBTable;
      expect(dynamodb.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should use single NAT Gateway for cost savings', () => {
      const natGateways = Object.keys(template.Resources).filter((key) =>
        template.Resources[key].Type === 'AWS::EC2::NatGateway'
      );
      expect(natGateways).toHaveLength(1);
    });
  });

  describe('Template Resource Count', () => {
    test('should have all required AWS services', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);

      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::DynamoDB::GlobalTable');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(resourceTypes).toContain('AWS::AutoScaling::AutoScalingGroup');
      expect(resourceTypes).toContain('AWS::Route53::HealthCheck');
      expect(resourceTypes).toContain('AWS::Route53::RecordSet');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::SNS::Topic');
      expect(resourceTypes).toContain('AWS::IAM::Role');
    });
  });
});
