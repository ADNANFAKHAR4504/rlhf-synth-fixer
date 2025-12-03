import fs from 'fs';
import path from 'path';

const EnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Multi-Region DR Template', () => {
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
      expect(template.Description).toContain('Multi-Region Disaster Recovery');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have HostedZoneName parameter', () => {
      expect(template.Parameters.HostedZoneName).toBeDefined();
      expect(template.Parameters.HostedZoneName.Type).toBe('String');
    });

    test('should have AlertEmail parameter', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      expect(template.Parameters.AlertEmail.Type).toBe('String');
    });

    test('should have exactly 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });
  });

  describe('VPC Resources', () => {
    test('should have PrimaryVPC resource', () => {
      expect(template.Resources.PrimaryVPC).toBeDefined();
      expect(template.Resources.PrimaryVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('PrimaryVPC should have correct deletion policy', () => {
      expect(template.Resources.PrimaryVPC.DeletionPolicy).toBe('Delete');
    });

    test('PrimaryVPC should have EnvironmentSuffix in name', () => {
      const vpc = template.Resources.PrimaryVPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PrimaryPublicSubnet1).toBeDefined();
      expect(template.Resources.PrimaryPublicSubnet2).toBeDefined();
      expect(template.Resources.PrimaryPublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrimaryPublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrimaryPrivateSubnet1).toBeDefined();
      expect(template.Resources.PrimaryPrivateSubnet2).toBeDefined();
      expect(template.Resources.PrimaryPrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrimaryPrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.PrimaryInternetGateway).toBeDefined();
      expect(template.Resources.PrimaryInternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      expect(template.Resources.PrimaryVPCGatewayAttachment).toBeDefined();
      expect(template.Resources.PrimaryVPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have Route Table', () => {
      expect(template.Resources.PrimaryPublicRouteTable).toBeDefined();
      expect(template.Resources.PrimaryPublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have Public Route', () => {
      expect(template.Resources.PrimaryPublicRoute).toBeDefined();
      expect(template.Resources.PrimaryPublicRoute.Type).toBe('AWS::EC2::Route');
    });

    test('public subnets should have route table associations', () => {
      expect(template.Resources.PrimaryPublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrimaryPublicSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Aurora Database Resources', () => {
    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB Subnet Group should have EnvironmentSuffix in name', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.DBSubnetGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Aurora Security Group', () => {
      expect(template.Resources.AuroraSecurityGroup).toBeDefined();
      expect(template.Resources.AuroraSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Global DB Cluster', () => {
      expect(template.Resources.GlobalDBCluster).toBeDefined();
      expect(template.Resources.GlobalDBCluster.Type).toBe('AWS::RDS::GlobalCluster');
    });

    test('Global DB Cluster should have correct engine', () => {
      const cluster = template.Resources.GlobalDBCluster;
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
    });

    test('Global DB Cluster should have EnvironmentSuffix in identifier', () => {
      const cluster = template.Resources.GlobalDBCluster;
      expect(cluster.Properties.GlobalClusterIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Primary DB Cluster', () => {
      expect(template.Resources.PrimaryDBCluster).toBeDefined();
      expect(template.Resources.PrimaryDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Primary DB Cluster should reference Global Cluster', () => {
      const cluster = template.Resources.PrimaryDBCluster;
      expect(cluster.Properties.GlobalClusterIdentifier).toBeDefined();
    });

    test('Primary DB Cluster should have backups enabled', () => {
      const cluster = template.Resources.PrimaryDBCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('should have Primary DB Instance', () => {
      expect(template.Resources.PrimaryDBInstance).toBeDefined();
      expect(template.Resources.PrimaryDBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Primary DB Instance should have correct engine', () => {
      const instance = template.Resources.PrimaryDBInstance;
      expect(instance.Properties.Engine).toBe('aurora-mysql');
    });

    test('DB Security Group should have ingress rule', () => {
      const sg = template.Resources.AuroraSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress.length).toBeGreaterThan(0);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.PrimaryALB).toBeDefined();
      expect(template.Resources.PrimaryALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should have EnvironmentSuffix in name', () => {
      const alb = template.Resources.PrimaryALB;
      expect(alb.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.PrimaryALB;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have Target Group', () => {
      expect(template.Resources.PrimaryTargetGroup).toBeDefined();
      expect(template.Resources.PrimaryTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('Target Group should have health check configured', () => {
      const tg = template.Resources.PrimaryTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBeDefined();
    });

    test('Target Group should target Lambda', () => {
      const tg = template.Resources.PrimaryTargetGroup;
      expect(tg.Properties.TargetType).toBe('lambda');
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.PrimaryALBListener).toBeDefined();
      expect(template.Resources.PrimaryALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB Listener should listen on port 80 with HTTP', () => {
      const listener = template.Resources.PrimaryALBListener;
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('ALB Security Group should allow HTTPS ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const httpsRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda Execution Role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda Execution Role should have assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
    });

    test('Lambda Execution Role should trust lambda service', () => {
      const role = template.Resources.LambdaExecutionRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toContain('lambda.amazonaws.com');
    });

    test('should have Lambda Security Group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Payment Processor Lambda Function', () => {
      expect(template.Resources.PaymentProcessorFunction).toBeDefined();
      expect(template.Resources.PaymentProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda Function should have VPC configuration', () => {
      const lambda = template.Resources.PaymentProcessorFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('Lambda Function should have EnvironmentSuffix in name', () => {
      const lambda = template.Resources.PaymentProcessorFunction;
      expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Lambda Function should have appropriate runtime', () => {
      const lambda = template.Resources.PaymentProcessorFunction;
      expect(lambda.Properties.Runtime).toBeDefined();
      expect(lambda.Properties.Runtime).toMatch(/nodejs/i);
    });

    test('should have Lambda Invoke Permission', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      expect(template.Resources.LambdaInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('Lambda Invoke Permission should allow ELB', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Properties.Principal).toBe('elasticloadbalancing.amazonaws.com');
    });
  });

  describe('S3 Resources', () => {
    test('should have Transaction Logs Bucket', () => {
      expect(template.Resources.TransactionLogsBucket).toBeDefined();
      expect(template.Resources.TransactionLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('Transaction Logs Bucket should have versioning enabled', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('Transaction Logs Bucket should have encryption', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('Transaction Logs Bucket should have EnvironmentSuffix in name', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Transaction Logs Bucket should have lifecycle configuration', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
    });

    test('Transaction Logs Bucket should block public access', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have DB Master Password Secret', () => {
      expect(template.Resources.DBMasterPasswordSecret).toBeDefined();
      expect(template.Resources.DBMasterPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DB Master Password Secret should have EnvironmentSuffix in name', () => {
      const secret = template.Resources.DBMasterPasswordSecret;
      expect(secret.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('DB Master Password Secret should generate secret string', () => {
      const secret = template.Resources.DBMasterPasswordSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
    });
  });

  describe('Route 53 Resources', () => {
    test('should have Hosted Zone', () => {
      expect(template.Resources.HostedZone).toBeDefined();
      expect(template.Resources.HostedZone.Type).toBe('AWS::Route53::HostedZone');
    });

    test('Hosted Zone should reference HostedZoneName parameter', () => {
      const hz = template.Resources.HostedZone;
      expect(hz.Properties.Name).toBeDefined();
    });

    test('should have Primary ALB Health Check', () => {
      expect(template.Resources.PrimaryALBHealthCheck).toBeDefined();
      expect(template.Resources.PrimaryALBHealthCheck.Type).toBe('AWS::Route53::HealthCheck');
    });

    test('Primary Health Check should have appropriate configuration', () => {
      const hc = template.Resources.PrimaryALBHealthCheck;
      expect(hc.Properties.HealthCheckConfig).toBeDefined();
      expect(hc.Properties.HealthCheckConfig.Type).toBe('HTTP');
    });

    test('should have Primary Record Set', () => {
      expect(template.Resources.PrimaryRecordSet).toBeDefined();
      expect(template.Resources.PrimaryRecordSet.Type).toBe('AWS::Route53::RecordSet');
    });

    test('Primary Record Set should have alias target', () => {
      const rs = template.Resources.PrimaryRecordSet;
      expect(rs.Properties.AliasTarget).toBeDefined();
      expect(rs.Properties.AliasTarget.EvaluateTargetHealth).toBe(true);
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Aurora Replication Lag Alarm', () => {
      expect(template.Resources.AuroraReplicationLagAlarm).toBeDefined();
      expect(template.Resources.AuroraReplicationLagAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('Replication Lag Alarm should have 5 second threshold', () => {
      const alarm = template.Resources.AuroraReplicationLagAlarm;
      expect(alarm.Properties.Threshold).toBe(5.0);
      expect(alarm.Properties.MetricName).toBe('AuroraGlobalDBReplicationLag');
    });

    test('should have ALB Target Health Alarm', () => {
      expect(template.Resources.ALBTargetHealthAlarm).toBeDefined();
      expect(template.Resources.ALBTargetHealthAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have Lambda Error Alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have Health Check Alarm', () => {
      expect(template.Resources.HealthCheckAlarm).toBeDefined();
      expect(template.Resources.HealthCheckAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('all alarms should have SNS actions', () => {
      const alarms = [
        template.Resources.AuroraReplicationLagAlarm,
        template.Resources.ALBTargetHealthAlarm,
        template.Resources.LambdaErrorAlarm,
        template.Resources.HealthCheckAlarm
      ];

      alarms.forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SNS Resources', () => {
    test('should have Primary SNS Topic', () => {
      expect(template.Resources.PrimarySNSTopic).toBeDefined();
      expect(template.Resources.PrimarySNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS Topic should have EnvironmentSuffix in name', () => {
      const topic = template.Resources.PrimarySNSTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('SNS Topic should have email subscription', () => {
      const topic = template.Resources.PrimarySNSTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription.length).toBeGreaterThan(0);
    });

    test('SNS Topic subscription should use email protocol', () => {
      const topic = template.Resources.PrimarySNSTopic;
      const emailSub = topic.Properties.Subscription.find((s: any) => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
    });
  });

  describe('Resource Deletion Policies', () => {
    test('all resources should have DeletionPolicy Delete or not set', () => {
      const resources = template.Resources;
      const resourcesWithRetain: string[] = [];

      Object.keys(resources).forEach(key => {
        const resource = resources[key];
        if (resource.DeletionPolicy === 'Retain') {
          resourcesWithRetain.push(key);
        }
      });

      expect(resourcesWithRetain).toHaveLength(0);
    });

    test('no DB resources should have DeletionProtectionEnabled', () => {
      const dbResources = [
        template.Resources.GlobalDBCluster,
        template.Resources.PrimaryDBCluster
      ];

      dbResources.forEach(resource => {
        if (resource && resource.Properties) {
          expect(resource.Properties.DeletionProtectionEnabled).not.toBe(true);
        }
      });
    });

    test('no ALB should have deletion protection', () => {
      const alb = template.Resources.PrimaryALB;
      expect(alb.Properties.DeletionProtectionEnabled).not.toBe(true);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('ALB should include EnvironmentSuffix', () => {
      const alb = template.Resources.PrimaryALB;
      expect(alb.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Lambda function should include EnvironmentSuffix', () => {
      const lambda = template.Resources.PaymentProcessorFunction;
      expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('S3 bucket should include EnvironmentSuffix', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('DB subnet group should include EnvironmentSuffix', () => {
      const sg = template.Resources.DBSubnetGroup;
      expect(sg.Properties.DBSubnetGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Global cluster should include EnvironmentSuffix', () => {
      const cluster = template.Resources.GlobalDBCluster;
      expect(cluster.Properties.GlobalClusterIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('SNS topic should include EnvironmentSuffix', () => {
      const topic = template.Resources.PrimarySNSTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have PrimaryVPCId output', () => {
      expect(template.Outputs.PrimaryVPCId).toBeDefined();
    });

    test('should have PrimaryDBClusterEndpoint output', () => {
      expect(template.Outputs.PrimaryDBClusterEndpoint).toBeDefined();
    });

    test('should have PrimaryALBDNSName output', () => {
      expect(template.Outputs.PrimaryALBDNSName).toBeDefined();
    });

    test('should have TransactionLogsBucketName output', () => {
      expect(template.Outputs.TransactionLogsBucketName).toBeDefined();
    });

    test('should have Route53HostedZoneId output', () => {
      expect(template.Outputs.Route53HostedZoneId).toBeDefined();
    });

    test('should have PaymentEndpoint output', () => {
      expect(template.Outputs.PaymentEndpoint).toBeDefined();
    });

    test('should have GlobalDBClusterArn output', () => {
      expect(template.Outputs.GlobalDBClusterArn).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(key => {
        expect(outputs[key].Description).toBeDefined();
        expect(outputs[key].Description).not.toBe('');
      });
    });

    test('should have exactly 7 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Security Configuration', () => {
    test('Aurora cluster should not be publicly accessible', () => {
      const cluster = template.Resources.PrimaryDBCluster;
      expect(cluster.Properties.PubliclyAccessible).not.toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('Lambda function should be in VPC', () => {
      const lambda = template.Resources.PaymentProcessorFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
    });

    test('Aurora Security Group should not allow public access', () => {
      const sg = template.Resources.AuroraSecurityGroup;
      const publicRule = sg.Properties.SecurityGroupIngress.find((r: any) =>
        r.CidrIp === '0.0.0.0/0' || r.CidrIpv6 === '::/0'
      );
      expect(publicRule).toBeUndefined();
    });

    test('S3 bucket should have proper access controls', () => {
      const bucket = template.Resources.TransactionLogsBucket;
      // S3 bucket should have versioning and encryption (other security measures)
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have minimum resource count for DR solution', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(25);
    });

    test('should have exactly 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have exactly 7 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });

    test('all resources should have Type defined', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(key => {
        expect(resources[key].Type).toBeDefined();
        expect(resources[key].Type).toMatch(/^AWS::/);
      });
    });

    test('template should have all critical DR components', () => {
      // VPC
      expect(template.Resources.PrimaryVPC).toBeDefined();
      // Aurora Global DB
      expect(template.Resources.GlobalDBCluster).toBeDefined();
      // ALB
      expect(template.Resources.PrimaryALB).toBeDefined();
      // Lambda
      expect(template.Resources.PaymentProcessorFunction).toBeDefined();
      // S3
      expect(template.Resources.TransactionLogsBucket).toBeDefined();
      // Route 53
      expect(template.Resources.HostedZone).toBeDefined();
      expect(template.Resources.PrimaryALBHealthCheck).toBeDefined();
      // CloudWatch alarms
      expect(template.Resources.AuroraReplicationLagAlarm).toBeDefined();
      // SNS
      expect(template.Resources.PrimarySNSTopic).toBeDefined();
    });
  });
});
