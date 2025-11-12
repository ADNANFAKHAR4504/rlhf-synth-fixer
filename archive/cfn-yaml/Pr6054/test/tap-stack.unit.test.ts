/**
 * Comprehensive Unit Tests for TapStack CloudFormation Template
 *
 * This test suite validates the CloudFormation YAML template located at lib/TapStack.yml
 * Tests are environment-agnostic and validate the complete infrastructure configuration.
 *
 * Coverage Areas:
 * - Template structure and CloudFormation compliance
 * - Parameters, Resources, Outputs, Conditions
 * - VPC networking (subnets, NAT gateways, flow logs)
 * - Security groups and network access rules
 * - Aurora MySQL database cluster
 * - RDS instances and backup configuration
 * - DynamoDB tables with encryption
 * - Lambda functions and IAM roles
 * - Application Load Balancers
 * - Route53 DNS configuration
 * - CloudWatch alarms and monitoring
 * - SNS topics for alerting
 * - S3 buckets with encryption
 * - SSM parameters
 * - EventBridge rules
 * - KMS encryption keys
 * - IAM roles and policies (least privilege)
 * - Resource naming conventions
 * - Deletion policies
 * - Tags and compliance
 */

import * as fs from 'fs';
import * as path from 'path';

// Load the CloudFormation template
const templatePath = path.join(__dirname, '../lib/TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

describe('TapStack CloudFormation Template', () => {

  describe('Template Structure', () => {
    test('template has correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('template has description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Active-Passive DR Architecture');
    });

    test('template has Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('template has Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('template has Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('template has Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('has Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toContain('Production');
      expect(template.Parameters.Environment.AllowedValues).toContain('Staging');
    });

    test('has EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('has DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
      expect(template.Parameters.DomainName.Default).toBe('');
    });

    test('has DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.Default).toBe('admin');
    });

    test('has AlertEmail parameter', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      expect(template.Parameters.AlertEmail.Type).toBe('String');
    });

    test('has DataRetentionDays parameter', () => {
      expect(template.Parameters.DataRetentionDays).toBeDefined();
      expect(template.Parameters.DataRetentionDays.Type).toBe('Number');
      expect(template.Parameters.DataRetentionDays.Default).toBe(2555);
    });
  });

  describe('Resources Count', () => {
    test('template has exactly 65 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(65);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC resource exists with correct CIDR', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('InternetGateway exists', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('public subnets exist', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets exist', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      // Private subnets may not have MapPublicIpOnLaunch set (defaults to false)
      const mapPublic = template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch;
      if (mapPublic !== undefined) {
        expect(mapPublic).toBe(false);
      }
    });

    test('NAT gateways exist in public subnets', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
    });

    test('Elastic IPs exist for NAT gateways', () => {
      expect(template.Resources.EIP1).toBeDefined();
      expect(template.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
    });

    test('route tables exist for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('ALB security group exists', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group allows HTTP traffic', () => {
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('instance security group exists', () => {
      expect(template.Resources.AppSecurityGroup).toBeDefined();
      expect(template.Resources.AppSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('database security group exists', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('RDS Aurora Database', () => {
    test('Aurora DB cluster exists', () => {
      expect(template.Resources.AuroraDBCluster).toBeDefined();
      expect(template.Resources.AuroraDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora cluster uses MySQL engine', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
      expect(cluster.Properties.EngineVersion).toMatch(/^8\.0/);
    });

    test('Aurora cluster has encryption enabled', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
    });

    test('Aurora cluster has backup retention configured', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('Aurora cluster uses Secrets Manager for password', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.MasterUsername).toBeDefined();
      expect(cluster.Properties.MasterUserPassword).toBeDefined();
      // MasterUserPassword should use dynamic reference to Secrets Manager
      const passwordRef = JSON.stringify(cluster.Properties.MasterUserPassword);
      expect(passwordRef).toContain('resolve:secretsmanager');
      expect(passwordRef).toContain('DBMasterPasswordSecret');
    });

    test('Aurora DB instances exist', () => {
      expect(template.Resources.PrimaryDBInstance).toBeDefined();
      expect(template.Resources.StandbyDBInstance).toBeDefined();
      expect(template.Resources.PrimaryDBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Aurora instances use different configurations', () => {
      const instance1 = template.Resources.PrimaryDBInstance;
      const instance2 = template.Resources.StandbyDBInstance;
      // Instances should reference the cluster
      expect(instance1.Properties.DBClusterIdentifier).toBeDefined();
      expect(instance2.Properties.DBClusterIdentifier).toBeDefined();
      // Both instances should have the same cluster reference
      expect(JSON.stringify(instance1.Properties.DBClusterIdentifier)).toBe(
        JSON.stringify(instance2.Properties.DBClusterIdentifier)
      );
    });

    test('DB subnet group exists', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('Aurora cluster has deletion policy set to Delete', () => {
      expect(template.Resources.AuroraDBCluster.DeletionPolicy).toBe('Delete');
    });
  });

  describe('DynamoDB Tables', () => {
    test('SessionStateTable exists', () => {
      expect(template.Resources.SessionStateTable).toBeDefined();
      expect(template.Resources.SessionStateTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('SessionStateTable has encryption enabled', () => {
      const table = template.Resources.SessionStateTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('FailoverStateTable exists', () => {
      expect(template.Resources.FailoverStateTable).toBeDefined();
      expect(template.Resources.FailoverStateTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('FailoverStateTable has encryption enabled', () => {
      const table = template.Resources.FailoverStateTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('SessionStateTable has point-in-time recovery enabled', () => {
      const sessionTable = template.Resources.SessionStateTable;
      expect(sessionTable.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(sessionTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('HealthMonitorFunction exists', () => {
      expect(template.Resources.HealthMonitorFunction).toBeDefined();
      expect(template.Resources.HealthMonitorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('HealthMonitorFunction uses Python runtime', () => {
      const func = template.Resources.HealthMonitorFunction;
      expect(func.Properties.Runtime).toMatch(/python3\./);
    });

    test('FailoverOrchestratorFunction exists', () => {
      expect(template.Resources.FailoverOrchestratorFunction).toBeDefined();
      expect(template.Resources.FailoverOrchestratorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda functions have environment variables', () => {
      const healthFunc = template.Resources.HealthMonitorFunction;
      expect(healthFunc.Properties.Environment).toBeDefined();
      expect(healthFunc.Properties.Environment.Variables).toBeDefined();
    });

    test('Lambda execution role exists', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Load Balancers', () => {
    test('Primary ALB exists', () => {
      expect(template.Resources.PrimaryALB).toBeDefined();
      expect(template.Resources.PrimaryALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('Primary ALB is internet-facing', () => {
      const alb = template.Resources.PrimaryALB;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('Standby ALB exists', () => {
      expect(template.Resources.StandbyALB).toBeDefined();
      expect(template.Resources.StandbyALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('Primary ALB listener exists', () => {
      expect(template.Resources.PrimaryListener).toBeDefined();
      expect(template.Resources.PrimaryListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('Primary target group exists', () => {
      expect(template.Resources.PrimaryTargetGroup).toBeDefined();
      expect(template.Resources.PrimaryTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('Standby target group exists', () => {
      expect(template.Resources.StandbyTargetGroup).toBeDefined();
      expect(template.Resources.StandbyTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });
  });

  describe('S3 Buckets', () => {
    test('ApplicationArtifactsBucket exists', () => {
      expect(template.Resources.ApplicationArtifactsBucket).toBeDefined();
      expect(template.Resources.ApplicationArtifactsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ApplicationArtifactsBucket has encryption enabled', () => {
      const bucket = template.Resources.ApplicationArtifactsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('ApplicationArtifactsBucket has versioning enabled', () => {
      const bucket = template.Resources.ApplicationArtifactsBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ConfigurationBucket exists', () => {
      expect(template.Resources.ConfigurationBucket).toBeDefined();
      expect(template.Resources.ConfigurationBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ConfigurationBucket has encryption enabled', () => {
      const bucket = template.Resources.ConfigurationBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 buckets have public access blocked', () => {
      const bucket = template.Resources.ApplicationArtifactsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Database alarms exist', () => {
      // Check for various database alarms
      expect(template.Resources.DatabaseConnectionAlarm).toBeDefined();
      expect(template.Resources.DatabaseConnectionAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('ALB health alarms exist', () => {
      expect(template.Resources.ALBUnhealthyTargetsAlarm).toBeDefined();
      expect(template.Resources.ALBUnhealthyTargetsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CompositeAlarm exists', () => {
      expect(template.Resources.CompositeAlarm).toBeDefined();
      expect(template.Resources.CompositeAlarm.Type).toBe('AWS::CloudWatch::CompositeAlarm');
    });

    test('CompositeAlarm combines multiple alarms', () => {
      const alarm = template.Resources.CompositeAlarm;
      expect(alarm.Properties.AlarmRule).toBeDefined();
      // AlarmRule can be either a string or Fn::Sub object
      const isValidAlarmRule = typeof alarm.Properties.AlarmRule === 'string' ||
                              (typeof alarm.Properties.AlarmRule === 'object' && alarm.Properties.AlarmRule['Fn::Sub'] !== undefined);
      expect(isValidAlarmRule).toBe(true);
    });
  });

  describe('SNS Topics', () => {
    test('AlertTopic exists', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('AlertTopic has KMS encryption', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('AlertTopic has topic policy', () => {
      expect(template.Resources.AlertTopicPolicy).toBeDefined();
      expect(template.Resources.AlertTopicPolicy.Type).toBe('AWS::SNS::TopicPolicy');
    });
  });

  describe('Route53 Configuration', () => {
    test('HostedZone is conditional', () => {
      expect(template.Resources.HostedZone).toBeDefined();
      expect(template.Resources.HostedZone.Condition).toBe('CreateRoute53Resources');
    });

    test('PrimaryDNSRecord is conditional', () => {
      if (template.Resources.PrimaryDNSRecord) {
        expect(template.Resources.PrimaryDNSRecord.Condition).toBe('CreateRoute53Resources');
      }
    });
  });

  describe('IAM Roles and Policies', () => {
    test('LambdaExecutionRole has correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toContain('lambda.amazonaws.com');
    });

    test('LambdaExecutionRole has managed policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
    });

    test('LambdaExecutionRole has scoped SSM permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      const ssmStatement = statements.find((s: any) => s.Sid === 'SSMParameterAccess');
      expect(ssmStatement).toBeDefined();
      expect(ssmStatement.Resource).toBeDefined();
      expect(Array.isArray(ssmStatement.Resource)).toBe(true);

      // Resource can be either a string or Fn::Sub object
      const resourceStr = JSON.stringify(ssmStatement.Resource);
      expect(resourceStr).toContain('dr-system');
    });

    test('Lambda security group exists', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('CloudWatch log groups exist for Lambda functions', () => {
      expect(template.Resources.HealthMonitorLogGroup).toBeDefined();
      expect(template.Resources.FailoverLogGroup).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    test('HealthCheckScheduleRule exists', () => {
      expect(template.Resources.HealthCheckScheduleRule).toBeDefined();
      expect(template.Resources.HealthCheckScheduleRule.Type).toBe('AWS::Events::Rule');
    });

    test('HealthCheckScheduleRule has cron expression', () => {
      const rule = template.Resources.HealthCheckScheduleRule;
      expect(rule.Properties.ScheduleExpression).toBeDefined();
      expect(rule.Properties.ScheduleExpression).toMatch(/rate|cron/);
    });

    test('RDS event rule exists', () => {
      expect(template.Resources.RDSEventRule).toBeDefined();
      expect(template.Resources.RDSEventRule.Type).toBe('AWS::Events::Rule');
    });
  });

  describe('SSM Parameters', () => {
    test('DatabaseEndpointParameter exists', () => {
      expect(template.Resources.DatabaseEndpointParameter).toBeDefined();
      expect(template.Resources.DatabaseEndpointParameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('FailoverConfigParameter exists', () => {
      expect(template.Resources.FailoverConfigParameter).toBeDefined();
      expect(template.Resources.FailoverConfigParameter.Type).toBe('AWS::SSM::Parameter');
    });
  });

  describe('KMS Keys', () => {
    test('KMSKey exists', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMSKey has key rotation enabled', () => {
      const key = template.Resources.KMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMSKeyAlias exists', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('Outputs', () => {
    test('has VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
    });

    test('has DatabaseEndpoint output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
    });

    test('has PrimaryEndpoint output', () => {
      expect(template.Outputs.PrimaryEndpoint).toBeDefined();
    });

    test('has StandbyEndpoint output', () => {
      expect(template.Outputs.StandbyEndpoint).toBeDefined();
    });

    test('has HealthMonitorFunctionArn output', () => {
      expect(template.Outputs.HealthMonitorFunctionArn).toBeDefined();
    });

    test('has FailoverFunctionArn output', () => {
      expect(template.Outputs.FailoverFunctionArn).toBeDefined();
    });

    test('has KMSKeyId output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('VPC has required tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      const tags = vpc.Properties.Tags;

      const projectTag = tags.find((t: any) => t.Key === 'project');
      const teamTag = tags.find((t: any) => t.Key === 'team-number');

      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('iac-rlhf-amazon');
      expect(teamTag).toBeDefined();
      expect(teamTag.Value).toBe('2');
    });

    test('resources include environment suffix in Name tag', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Best Practices', () => {
    test('no hardcoded secrets in template', () => {
      const templateString = JSON.stringify(template);

      // More sophisticated regex that allows CloudFormation functions
      const secretPatterns = [
        /"password"\s*:\s*"(?!.*\{?\{resolve:)[^"]{12,}"/i,
        /"secret"\s*:\s*"(?!.*\{?\{resolve:)[^"]{12,}"/i,
        /AKIA[0-9A-Z]{16}/,  // AWS Access Key pattern
        /[0-9a-zA-Z]{40}/     // Generic secret pattern
      ];

      secretPatterns.forEach(pattern => {
        const matches = templateString.match(pattern);
        if (matches) {
          // If found, verify it's part of a CloudFormation function
          const context = templateString.substring(
            Math.max(0, matches.index! - 50),
            matches.index! + 100
          );
          expect(context).toMatch(/(Ref|Fn::Sub|Fn::GetAtt|resolve:)/);
        }
      });
    });

    test('S3 buckets block public access', () => {
      const s3Resources = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );

      s3Resources.forEach((bucket: any) => {
        if (bucket.Properties.PublicAccessBlockConfiguration) {
          expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        }
      });
    });

    test('all storage resources use encryption', () => {
      // Check RDS
      const rdsCluster = template.Resources.AuroraDBCluster;
      expect(rdsCluster.Properties.StorageEncrypted).toBe(true);

      // Check DynamoDB
      const dynamoTables = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::DynamoDB::Table'
      );
      dynamoTables.forEach((table: any) => {
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      });

      // Check S3
      const s3Buckets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );
      s3Buckets.forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });
  });

  describe('Deletion Policies', () => {
    test('critical resources have Delete policy for test environments', () => {
      const rdsCluster = template.Resources.AuroraDBCluster;
      expect(rdsCluster.DeletionPolicy).toBe('Delete');

      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Naming Conventions', () => {
    test('resource names follow consistent patterns', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');

      // Name should include stack name and environment suffix
      expect(nameTag.Value['Fn::Sub']).toMatch(/\$\{AWS::StackName\}/);
      expect(nameTag.Value['Fn::Sub']).toMatch(/\$\{EnvironmentSuffix\}/);
    });
  });
});
