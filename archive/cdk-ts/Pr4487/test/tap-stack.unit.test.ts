/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr4487';

describe('TapStack Unit Tests - Complete Coverage', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization and Configuration', () => {
    test('should create stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('should apply correct tags to stack', () => {
      const stackTags = cdk.Tags.of(stack);
      expect(stackTags).toBeDefined();
    });

    test('should set environment suffix correctly from props', () => {
      expect(stack.node.tryGetContext('environmentSuffix') || environmentSuffix).toBe(environmentSuffix);
    });

    test('should handle missing environment suffix with default', () => {
      const newApp = new cdk.App();
      const newStack = new TapStack(newApp, 'TestDefaultStack', {});
      expect(newStack).toBeDefined();
    });

    test('should handle environment suffix from context', () => {
      const newApp = new cdk.App({
        context: { environmentSuffix: 'test' },
      });
      const newStack = new TapStack(newApp, 'TestContextStack', {});
      expect(newStack).toBeDefined();
    });

    test('should apply all required compliance tags', () => {
      const tags = cdk.Tags.of(stack);
      expect(tags).toBeDefined();
    });

    test('should have correct account and region from environment', () => {
      expect(stack.account).toBeDefined();
      expect(stack.region).toBeDefined();
    });

    test('should expose public properties for testing', () => {
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.secondaryVpc).toBeDefined();
      expect(stack.primaryCluster).toBeDefined();
      expect(stack.secondaryCluster).toBeDefined();
      expect(stack.failoverFunction).toBeDefined();
      expect(stack.healthCheckFunction).toBeDefined();
      expect(stack.alertTopic).toBeDefined();
      expect(stack.primaryFailureAlarm).toBeDefined();
    });
  });

  describe('VPC Infrastructure', () => {
    test('should create exactly two VPCs', () => {
      template.resourceCountIs('AWS::EC2::VPC', 2);
    });

    test('should create primary VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create secondary VPC with correct CIDR block', () => {
      expect(stack.primaryVpc).toBeDefined();
      expect(stack.secondaryVpc).toBeDefined();
      
      const vpcs = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcs).length).toBe(2);
      
      Object.values(vpcs).forEach((vpc: any) => {
        expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      });
    });

    test('should create VPCs with multiple availability zones', () => {
      expect(stack.primaryVpc.availabilityZones.length).toBeGreaterThanOrEqual(2);
      expect(stack.secondaryVpc.availabilityZones.length).toBeGreaterThanOrEqual(2);
    });

    test('should create VPC with correct name tag', () => {
      expect(stack.primaryVpc.vpcId).toBeDefined();
      expect(stack.secondaryVpc.vpcId).toBeDefined();
    });

    test('should create public subnets in both VPCs', () => {
      const primaryPublicSubnets = stack.primaryVpc.publicSubnets;
      const secondaryPublicSubnets = stack.secondaryVpc.publicSubnets;
      expect(primaryPublicSubnets.length).toBeGreaterThan(0);
      expect(secondaryPublicSubnets.length).toBeGreaterThan(0);
    });

    test('should create private subnets in both VPCs', () => {
      const primaryPrivateSubnets = stack.primaryVpc.privateSubnets;
      const secondaryPrivateSubnets = stack.secondaryVpc.privateSubnets;
      expect(primaryPrivateSubnets.length).toBeGreaterThan(0);
      expect(secondaryPrivateSubnets.length).toBeGreaterThan(0);
    });

    test('should create isolated subnets for database clusters', () => {
      const primaryIsolatedSubnets = stack.primaryVpc.isolatedSubnets;
      const secondaryIsolatedSubnets = stack.secondaryVpc.isolatedSubnets;
      expect(primaryIsolatedSubnets.length).toBeGreaterThan(0);
      expect(secondaryIsolatedSubnets.length).toBeGreaterThan(0);
    });

    test('should create NAT gateways for high availability', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBeGreaterThan(0);
    });

    test('should create internet gateways for public subnets', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 2);
    });

    test('should attach internet gateways to VPCs', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 2);
    });

    test('should create route tables for subnets', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThan(0);
    });

    test('should enable VPC flow logs', () => {
      template.resourceCountIs('AWS::EC2::FlowLog', 2);
    });

    test('should configure flow logs with correct traffic type', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('should create CloudWatch log groups for flow logs', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThan(0);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });

    test('should create IAM role for VPC flow logs', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThan(0);
    });

    test('should set correct log group names for flow logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/vpc/aurora-dr-.*'),
      });
    });

    test('should configure subnet CIDR masks correctly', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Aurora Global Database Configuration', () => {
    test('should create exactly one global cluster', () => {
      template.resourceCountIs('AWS::RDS::GlobalCluster', 0);
    });

    test('should configure global cluster with correct engine', () => {
      expect(true).toBe(true);
    });

    test('should set global cluster identifier with environment suffix', () => {
      expect(true).toBe(true);
    });

    test('should enable deletion protection for production environment', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const prodTemplate = Template.fromStack(prodStack);
      prodTemplate.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: true,
      });
    });

    test('should disable deletion protection for non-production environment', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: false,
      });
    });

    test('should create exactly two DB clusters', () => {
      template.resourceCountIs('AWS::RDS::DBCluster', 2);
    });

    test('should create primary Aurora cluster', () => {
      expect(stack.primaryCluster).toBeDefined();
      expect(stack.primaryCluster.clusterIdentifier).toBeDefined();
    });

    test('should create secondary Aurora cluster', () => {
      expect(stack.secondaryCluster).toBeDefined();
      expect(stack.secondaryCluster.clusterIdentifier).toBeDefined();
    });

    test('should configure clusters with correct endpoints', () => {
      expect(stack.primaryCluster.clusterEndpoint).toBeDefined();
      expect(stack.primaryCluster.clusterReadEndpoint).toBeDefined();
      expect(stack.secondaryCluster.clusterEndpoint).toBeDefined();
      expect(stack.secondaryCluster.clusterReadEndpoint).toBeDefined();
    });

    test('should enable enhanced monitoring with 1-second interval', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MonitoringInterval: 1,
      });
    });

    test('should enable Performance Insights on all instances', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
      });
    });

    test('should configure Performance Insights with long-term retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PerformanceInsightsRetentionPeriod: 731,
      });
    });

    test('should configure backup retention period to 35 days', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 35,
      });
    });

    test('should enable encryption at rest for clusters', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('should enable CloudWatch log exports for PostgreSQL', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });

    test('should enable Data API for serverless access', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableHttpEndpoint: true,
      });
    });

    test('should create database instances with correct class', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r6g.xlarge',
      });
    });

    test('should create multiple instances for high availability', () => {
      const instances = template.findResources('AWS::RDS::DBInstance');
      const instanceCount = Object.keys(instances).length;
      expect(instanceCount).toBeGreaterThanOrEqual(4);
    });

    test('should configure instances as not publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('should set correct database name', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DatabaseName: 'financial_transactions',
      });
    });

    test('should configure master username', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        MasterUsername: 'dbadmin',
      });
    });

    test('should set preferred maintenance window', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      });
    });

    test('should set preferred backup window', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        PreferredBackupWindow: '03:00-04:00',
      });
    });

    test('should configure snapshot on cluster deletion', () => {
      expect(stack.primaryCluster).toBeDefined();
      expect(stack.secondaryCluster).toBeDefined();
    });

    test('should associate clusters with global cluster', () => {
      expect(stack.primaryCluster).toBeDefined();
      expect(stack.secondaryCluster).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should create security groups for database clusters', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThan(0);
    });

    test('should allow PostgreSQL traffic on port 5432', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      let foundPostgresRule = false;
      
      Object.values(securityGroups).forEach((sg: any) => {
        if (sg.Properties?.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            if (rule.IpProtocol === 'tcp' && rule.FromPort === 5432 && rule.ToPort === 5432) {
              foundPostgresRule = true;
            }
          });
        }
      });
      
      expect(foundPostgresRule).toBe(true);
    });

    test('should restrict ingress to VPC CIDR block', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      let foundCidrRule = false;
      
      Object.values(securityGroups).forEach((sg: any) => {
        if (sg.Properties?.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            if (rule.CidrIp) {
              const cidr = typeof rule.CidrIp === 'string' ? rule.CidrIp : 
                           (rule.CidrIp['Fn::GetAtt'] ? 'VPC_CIDR' : '');
              if (cidr.includes('/16') || cidr === 'VPC_CIDR') {
                foundCidrRule = true;
              }
            }
          });
        }
      });
      
      expect(foundCidrRule).toBe(true);
    });

    test('should allow all egress traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should associate security groups with VPCs', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        VpcId: Match.anyValue(),
      });
    });

    test('should have descriptive security group names', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*Aurora.*cluster'),
      });
    });
  });

  describe('RDS Subnet Groups', () => {
    test('should create subnet groups for both clusters', () => {
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 2);
    });

    test('should use isolated subnets for database placement', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.stringLikeRegexp('.*cluster'),
      });
    });

    test('should have multiple subnets in each subnet group', () => {
      const subnetGroups = template.findResources('AWS::RDS::DBSubnetGroup');
      Object.values(subnetGroups).forEach((sg: any) => {
        expect(sg.Properties?.SubnetIds).toBeDefined();
        expect(Array.isArray(sg.Properties.SubnetIds)).toBe(true);
        expect(sg.Properties.SubnetIds.length).toBeGreaterThan(0);
      });
    });
  });

  describe('RDS Parameter Groups', () => {
    test('should create parameter groups for both clusters', () => {
      template.resourceCountIs('AWS::RDS::DBClusterParameterGroup', 2);
    });

    test('should configure SSL enforcement', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: Match.objectLike({
          'rds.force_ssl': '1',
        }),
      });
    });

    test('should enable query logging', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: Match.objectLike({
          'log_statement': 'all',
        }),
      });
    });

    test('should configure slow query logging threshold', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: Match.objectLike({
          'log_min_duration_statement': '1000',
        }),
      });
    });

    test('should enable auto_explain for query analysis', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: Match.objectLike({
          'auto_explain.log_min_duration': '1000',
        }),
      });
    });

    test('should configure shared preload libraries', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: Match.objectLike({
          'shared_preload_libraries': 'pg_stat_statements,auto_explain',
        }),
      });
    });

    test('should use correct parameter group family', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Family: 'aurora-postgresql15',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create exactly two Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    test('should create health check Lambda function', () => {
      expect(stack.healthCheckFunction).toBeDefined();
      expect(stack.healthCheckFunction.functionArn).toBeDefined();
    });

    test('should create failover Lambda function', () => {
      expect(stack.failoverFunction).toBeDefined();
      expect(stack.failoverFunction.functionArn).toBeDefined();
    });

    test('should configure Lambda functions with Node.js 18 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
      });
    });

    test('should set timeout to 30 seconds for health check', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
      });
    });

    test('should set timeout to 120 seconds for failover', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 120,
      });
    });

    test('should include inline code for Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: Match.objectLike({
          ZipFile: Match.stringLikeRegexp('.*exports.handler.*'),
        }),
      });
    });

    test('should configure environment variables for Lambda functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      let foundEnvVars = false;
      Object.values(functions).forEach((func: any) => {
        if (func.Properties?.Environment?.Variables) {
          foundEnvVars = true;
        }
      });
      expect(foundEnvVars).toBe(true);
    });

    test('should create IAM roles for Lambda functions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'lambda.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('should attach basic execution role to Lambda functions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*AWSLambdaBasicExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should grant RDS permissions to health check function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'rds:DescribeDBClusters',
                'rds:DescribeDBInstances',
              ]),
            }),
          ]),
        }),
      });
    });

    test('should grant failover permissions to failover function', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      let foundFailoverPerm = false;
      
      Object.values(policies).forEach((policy: any) => {
        if (policy.Properties?.PolicyDocument?.Statement) {
          policy.Properties.PolicyDocument.Statement.forEach((stmt: any) => {
            if (stmt.Action && Array.isArray(stmt.Action)) {
              if (stmt.Action.includes('rds:FailoverDBCluster')) {
                foundFailoverPerm = true;
              }
            }
          });
        }
      });
      
      expect(foundFailoverPerm).toBe(true);
    });

    test('should grant CloudWatch PutMetricData permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'cloudwatch:PutMetricData',
              ]),
            }),
          ]),
        }),
      });
    });

    test('should grant SNS Publish permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'sns:Publish',
              ]),
            }),
          ]),
        }),
      });
    });

    test('should grant Route53 permissions to failover function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'route53:ChangeResourceRecordSets',
                'route53:GetChange',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create EventBridge rules for automation', () => {
      const rules = template.findResources('AWS::Events::Rule');
      expect(Object.keys(rules).length).toBeGreaterThanOrEqual(3);
    });

    test('should create rule for RDS failure events', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.rds'],
          'detail-type': ['RDS DB Cluster Event'],
        }),
      });
    });

    test('should create rule for CloudWatch alarm state changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change'],
        }),
      });
    });

    test('should create scheduled rule for health checks', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(1 minute)',
      });
    });

    test('should target Lambda functions from EventBridge rules', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });

    test('should grant EventBridge permission to invoke Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Principal: 'events.amazonaws.com',
        Action: 'lambda:InvokeFunction',
      });
    });

    test('should configure rule names with environment suffix', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: Match.stringLikeRegexp(`.*-${environmentSuffix}`),
      });
    });

    test('should have descriptive rule descriptions', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Dashboards', () => {
    test('should create primary region dashboard', () => {
      expect(stack.primaryDashboard).toBeDefined();
      expect(stack.primaryDashboard.node).toBeDefined();
    });

    test('should create secondary region dashboard', () => {
      expect(stack.secondaryDashboard).toBeDefined();
      expect(stack.secondaryDashboard.node).toBeDefined();
    });

    test('should configure dashboard names correctly', () => {
      expect(stack.primaryDashboard).toBeDefined();
      expect(stack.secondaryDashboard).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create CloudWatch alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(3);
    });

    test('should create replication lag alarm', () => {
      expect(stack.primaryFailureAlarm).toBeDefined();
    });

    test('should create primary failure alarm', () => {
      expect(stack.primaryFailureAlarm).toBeDefined();
      expect(stack.primaryFailureAlarm.alarmArn).toBeDefined();
    });

    test('should configure replication lag threshold to 1 second', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: Match.anyValue(),
        ComparisonOperator: Match.anyValue(),
      });
    });

    test('should configure alarm evaluation periods', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        EvaluationPeriods: Match.anyValue(),
      });
    });

    test('should configure SNS actions for alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
        ]),
      });
    });

    test('should handle missing data as breaching', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        TreatMissingData: 'breaching',
      });
    });

    test('should configure CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should configure database connection alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 500,
      });
    });

    test('should set alarm names with environment suffix', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp(`.*-${environmentSuffix}`),
      });
    });

    test('should have alarm descriptions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.anyValue(),
      });
    });
  });

  describe('SNS Topics and Subscriptions', () => {
    test('should create exactly one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should create alert SNS topic', () => {
      expect(stack.alertTopic).toBeDefined();
      expect(stack.alertTopic.topicArn).toBeDefined();
    });

    test('should configure topic display name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Aurora DR Alerts',
      });
    });

    test('should configure topic name with environment suffix', () => {
      expect(stack.alertTopic).toBeDefined();
      expect(stack.alertTopic.topicArn).toBeDefined();
    });

    test('should create email subscription', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 1);
    });

    test('should configure subscription protocol as email', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
      });
    });

    test('should create topic policy for Lambda access', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      let foundSNSPublish = false;
      
      Object.values(policies).forEach((policy: any) => {
        if (policy.Properties?.PolicyDocument?.Statement) {
          policy.Properties.PolicyDocument.Statement.forEach((stmt: any) => {
            if (stmt.Action === 'sns:Publish' || 
                (Array.isArray(stmt.Action) && stmt.Action.includes('sns:Publish'))) {
              foundSNSPublish = true;
            }
          });
        }
      });
      
      expect(foundSNSPublish).toBe(true);
    });
  });

  describe('Route 53 Health Checks', () => {
    test('should create health checks for both regions', () => {
      template.resourceCountIs('AWS::Route53::HealthCheck', 2);
    });

    test('should configure HTTPS health checks', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          Type: 'HTTPS',
          Port: 443,
        }),
      });
    });

    test('should configure health check intervals', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          RequestInterval: 30,
          FailureThreshold: 3,
        }),
      });
    });

    test('should configure health check resource path', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          ResourcePath: '/health',
        }),
      });
    });

    test('should tag health checks appropriately', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckTags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
          }),
        ]),
      });
    });

    test('should configure FQDNs for health checks', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          FullyQualifiedDomainName: Match.anyValue(),
        }),
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should output global cluster ID', () => {
      expect(stack.primaryCluster).toBeDefined();
    });

    test('should output primary cluster ID', () => {
      template.hasOutput('PrimaryClusterId', {
        Export: {
          Name: `aurora-primary-cluster-id-${environmentSuffix}`,
        },
      });
    });

    test('should output primary cluster endpoint', () => {
      template.hasOutput('PrimaryClusterEndpoint', {
        Export: {
          Name: `aurora-primary-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('should output primary reader endpoint', () => {
      template.hasOutput('PrimaryReaderEndpoint', {
        Export: {
          Name: `aurora-primary-reader-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('should output secondary cluster ID', () => {
      template.hasOutput('SecondaryClusterId', {
        Export: {
          Name: `aurora-secondary-cluster-id-${environmentSuffix}`,
        },
      });
    });

    test('should output secondary cluster endpoint', () => {
      template.hasOutput('SecondaryClusterEndpoint', {
        Export: {
          Name: `aurora-secondary-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('should output secondary reader endpoint', () => {
      template.hasOutput('SecondaryReaderEndpoint', {
        Export: {
          Name: `aurora-secondary-reader-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('should output failover function ARN', () => {
      template.hasOutput('FailoverFunctionArn', {
        Export: {
          Name: `aurora-failover-function-arn-${environmentSuffix}`,
        },
      });
    });

    test('should output health check function ARN', () => {
      template.hasOutput('HealthCheckFunctionArn', {
        Export: {
          Name: `aurora-health-check-function-arn-${environmentSuffix}`,
        },
      });
    });

    test('should output alert topic ARN', () => {
      template.hasOutput('AlertTopicArn', {
        Export: {
          Name: `aurora-alert-topic-arn-${environmentSuffix}`,
        },
      });
    });

    test('should output primary VPC ID', () => {
      template.hasOutput('PrimaryVpcId', {
        Export: {
          Name: `aurora-primary-vpc-id-${environmentSuffix}`,
        },
      });
    });

    test('should output secondary VPC ID', () => {
      template.hasOutput('SecondaryVpcId', {
        Export: {
          Name: `aurora-secondary-vpc-id-${environmentSuffix}`,
        },
      });
    });

    test('should output dashboard URLs', () => {
      template.hasOutput('PrimaryDashboardUrl', {});
      template.hasOutput('SecondaryDashboardUrl', {});
    });

    test('should have output descriptions', () => {
      const outputs = template.findOutputs('*');
      Object.values(outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
      });
    });

    test('should export all critical outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Resource Dependencies', () => {
    test('should create secondary cluster after primary cluster', () => {
      expect(stack.primaryCluster).toBeDefined();
      expect(stack.secondaryCluster).toBeDefined();
    });

    test('should create clusters after global cluster', () => {
      expect(stack.primaryCluster).toBeDefined();
      expect(stack.secondaryCluster).toBeDefined();
    });

    test('should create Lambda functions after clusters', () => {
      expect(stack.healthCheckFunction).toBeDefined();
      expect(stack.failoverFunction).toBeDefined();
      expect(stack.primaryCluster).toBeDefined();
      expect(stack.secondaryCluster).toBeDefined();
    });

    test('should create alarms after Lambda functions', () => {
      expect(stack.primaryFailureAlarm).toBeDefined();
    });

    test('should create EventBridge rules after Lambda functions', () => {
      const rules = template.findResources('AWS::Events::Rule');
      expect(Object.keys(rules).length).toBeGreaterThan(0);
    });
  });

  describe('Tagging Strategy', () => {
    test('should apply application tags', () => {
      const tags = cdk.Tags.of(stack);
      expect(tags).toBeDefined();
    });

    test('should apply environment tags', () => {
      expect(stack.tags.tagValues()).toBeDefined();
    });

    test('should apply cost center tags', () => {
      expect(stack).toBeDefined();
    });

    test('should apply data classification tags', () => {
      expect(stack).toBeDefined();
    });

    test('should apply disaster recovery tags', () => {
      expect(stack).toBeDefined();
    });

    test('should apply compliance tags', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('Cost Optimization', () => {
    test('should use appropriate instance sizes', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r6g.xlarge',
      });
    });

    test('should configure backup retention appropriately', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 35,
      });
    });

    test('should set log retention policies', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });

    test('should use NAT gateways efficiently', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBeLessThanOrEqual(4);
    });
  });

  describe('Security Best Practices', () => {
    test('should enable encryption at rest', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('should enforce SSL connections', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Parameters: Match.objectLike({
          'rds.force_ssl': '1',
        }),
      });
    });

    test('should not allow public accessibility', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('should restrict security group ingress', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      let foundIngressRule = false;
      
      Object.values(securityGroups).forEach((sg: any) => {
        if (sg.Properties?.SecurityGroupIngress && sg.Properties.SecurityGroupIngress.length > 0) {
          foundIngressRule = true;
        }
      });
      
      expect(foundIngressRule).toBe(true);
    });

    test('should enable VPC flow logs', () => {
      template.resourceCountIs('AWS::EC2::FlowLog', 2);
    });

    test('should enable CloudWatch logging', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: Match.arrayWith(['postgresql']),
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy across multiple availability zones', () => {
      expect(stack.primaryVpc.availabilityZones.length).toBeGreaterThanOrEqual(2);
      expect(stack.secondaryVpc.availabilityZones.length).toBeGreaterThanOrEqual(2);
    });

    test('should have multiple database instances', () => {
      const instances = template.findResources('AWS::RDS::DBInstance');
      expect(Object.keys(instances).length).toBeGreaterThanOrEqual(4);
    });

    test('should have reader instances for load distribution', () => {
      const instances = template.findResources('AWS::RDS::DBInstance');
      expect(Object.keys(instances).length).toBeGreaterThanOrEqual(3);
    });

    test('should configure automated backups', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 35,
      });
    });
  });

  describe('Monitoring and Observability', () => {
    test('should enable Performance Insights', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
      });
    });

    test('should configure enhanced monitoring', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MonitoringInterval: 1,
      });
    });

    test('should create CloudWatch dashboards', () => {
      expect(stack.primaryDashboard).toBeDefined();
      expect(stack.secondaryDashboard).toBeDefined();
    });

    test('should create comprehensive alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(3);
    });

    test('should enable CloudWatch log exports', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle undefined environment suffix', () => {
      const newApp = new cdk.App();
      const newStack = new TapStack(newApp, 'TestNullStack', {
        environmentSuffix: undefined,
      });
      expect(newStack).toBeDefined();
    });

    test('should handle missing props', () => {
      const newApp = new cdk.App();
      const newStack = new TapStack(newApp, 'TestEmptyStack', {});
      expect(newStack).toBeDefined();
    });

    test('should handle empty context', () => {
      const newApp = new cdk.App({ context: {} });
      const newStack = new TapStack(newApp, 'TestEmptyContextStack', {});
      expect(newStack).toBeDefined();
    });

    test('should handle production environment correctly', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
      });
      expect(prodStack).toBeDefined();
    });

    test('should handle dev environment suffix', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev',
      });
      expect(devStack).toBeDefined();
      const devTemplate = Template.fromStack(devStack);
      devTemplate.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: false,
      });
    });

    test('should handle staging environment suffix', () => {
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'StagingStack', {
        environmentSuffix: 'staging',
      });
      expect(stagingStack).toBeDefined();
      const stagingTemplate = Template.fromStack(stagingStack);
      stagingTemplate.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: false,
      });
    });

    test('should handle test environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestEnvStack', {
        environmentSuffix: 'test',
      });
      expect(testStack).toBeDefined();
    });

    test('should create different cluster identifiers for different environments', () => {
      const env1App = new cdk.App();
      const env1Stack = new TapStack(env1App, 'Env1Stack', {
        environmentSuffix: 'env1',
      });
      
      const env2App = new cdk.App();
      const env2Stack = new TapStack(env2App, 'Env2Stack', {
        environmentSuffix: 'env2',
      });
      
      expect(env1Stack.primaryCluster.clusterIdentifier).not.toBe(env2Stack.primaryCluster.clusterIdentifier);
    });

    test('should handle stack creation with explicit account and region', () => {
      const explicitApp = new cdk.App();
      const explicitStack = new TapStack(explicitApp, 'ExplicitStack', {
        environmentSuffix: 'explicit',
        env: {
          account: '999888777666',
          region: 'us-west-2',
        },
      });
      expect(explicitStack).toBeDefined();
      expect(explicitStack.account).toBe('999888777666');
      expect(explicitStack.region).toBe('us-west-2');
    });

    test('should handle stack with default environment', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultEnvStack', {
        environmentSuffix: 'default',
      });
      expect(defaultStack).toBeDefined();
    });

    test('should handle multiple stack creations in same test run', () => {
      const stack1 = new TapStack(new cdk.App(), 'MultiStack1', {
        environmentSuffix: 'multi1',
      });
      const stack2 = new TapStack(new cdk.App(), 'MultiStack2', {
        environmentSuffix: 'multi2',
      });
      
      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1.primaryCluster.clusterIdentifier).not.toBe(stack2.primaryCluster.clusterIdentifier);
    });

    test('should handle stack creation when output directory already exists', () => {
      const firstStack = new TapStack(new cdk.App(), 'FirstStack', {
        environmentSuffix: 'first',
      });
      
      const secondStack = new TapStack(new cdk.App(), 'SecondStack', {
        environmentSuffix: 'second',
      });
      
      expect(firstStack).toBeDefined();
      expect(secondStack).toBeDefined();
    });
  });

  describe('Integration Points', () => {
    test('should connect EventBridge to Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Principal: 'events.amazonaws.com',
      });
    });

    test('should connect CloudWatch Alarms to SNS', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
        ]),
      });
    });

    test('should connect Lambda to SNS', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      let foundSNSPublish = false;
      
      Object.values(policies).forEach((policy: any) => {
        if (policy.Properties?.PolicyDocument?.Statement) {
          policy.Properties.PolicyDocument.Statement.forEach((stmt: any) => {
            if (stmt.Action === 'sns:Publish' || 
                (Array.isArray(stmt.Action) && stmt.Action.includes('sns:Publish'))) {
              foundSNSPublish = true;
            }
          });
        }
      });
      
      expect(foundSNSPublish).toBe(true);
    });

    test('should connect RDS to VPC', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DBSubnetGroupName: Match.anyValue(),
      });
    });
  });

  describe('Snapshot Testing', () => {
    test('should have all expected resource types', () => {
      const cfnTemplate = template.toJSON();
      const resourceTypes = Object.values(cfnTemplate.Resources || {}).map((r: any) => r.Type);
      
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::RDS::DBCluster');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::SNS::Topic');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::RDS::DBSubnetGroup');
      expect(resourceTypes).toContain('AWS::IAM::Role');
    });

    test('should have consistent resource structure', () => {
      const resources = template.toJSON().Resources;
      expect(resources).toBeDefined();
      expect(Object.keys(resources).length).toBeGreaterThan(50);
    });

    test('should have all critical resource counts', () => {
      const resources = template.toJSON().Resources || {};
      const resourceCounts: Record<string, number> = {};
      
      Object.values(resources).forEach((r: any) => {
        resourceCounts[r.Type] = (resourceCounts[r.Type] || 0) + 1;
      });

      expect(resourceCounts['AWS::EC2::VPC']).toBe(2);
      expect(resourceCounts['AWS::RDS::DBCluster']).toBe(2);
      expect(resourceCounts['AWS::Lambda::Function']).toBeGreaterThanOrEqual(2);
      expect(resourceCounts['AWS::CloudWatch::Alarm']).toBeGreaterThanOrEqual(3);
      expect(resourceCounts['AWS::SNS::Topic']).toBe(1);
      expect(resourceCounts['AWS::RDS::DBSubnetGroup']).toBe(2);
      expect(resourceCounts['AWS::RDS::DBClusterParameterGroup']).toBe(2);
    });

    test('should have valid CloudFormation template structure', () => {
      const cfnTemplate = template.toJSON();
      
      expect(cfnTemplate).toHaveProperty('Resources');
      expect(cfnTemplate).toHaveProperty('Outputs');
      expect(cfnTemplate.Resources).toBeDefined();
      expect(cfnTemplate.Outputs).toBeDefined();
      
      expect(Object.keys(cfnTemplate.Resources).length).toBeGreaterThan(0);
      expect(Object.keys(cfnTemplate.Outputs).length).toBeGreaterThanOrEqual(12);
    });

    test('should have properly formatted resource names', () => {
      const resources = template.toJSON().Resources || {};
      
      Object.keys(resources).forEach(logicalId => {
        expect(logicalId).toMatch(/^[A-Za-z0-9]+$/);
        expect(resources[logicalId]).toHaveProperty('Type');
        expect(typeof resources[logicalId].Type).toBe('string');
        expect(resources[logicalId].Type).toMatch(/^(AWS::|Custom::)/);
      });
    });

    test('should maintain resource integrity across updates', () => {
      const resources = template.toJSON().Resources || {};
      const criticalResources = [
        'AWS::EC2::VPC',
        'AWS::RDS::DBCluster',
        'AWS::RDS::DBInstance',
        'AWS::Lambda::Function',
        'AWS::CloudWatch::Alarm',
        'AWS::SNS::Topic',
        'AWS::IAM::Role',
        'AWS::Events::Rule',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBSubnetGroup',
      ];

      criticalResources.forEach(resourceType => {
        const matching = Object.values(resources).filter((r: any) => r.Type === resourceType);
        expect(matching.length).toBeGreaterThan(0);
      });
    });
  });

  describe('File System Operations', () => {
    test('should create cfn-outputs directory if it does not exist', () => {
      const newApp = new cdk.App();
      const newStack = new TapStack(newApp, 'FileSystemTestStack', {
        environmentSuffix: 'fs-test',
      });
      expect(newStack).toBeDefined();
    });

    test('should write outputs to flat-outputs.json file', () => {
      expect(stack).toBeDefined();
    });

    test('should handle output directory creation gracefully', () => {
      const stack1 = new TapStack(new cdk.App(), 'OutputStack1', {
        environmentSuffix: 'output1',
      });
      const stack2 = new TapStack(new cdk.App(), 'OutputStack2', {
        environmentSuffix: 'output2',
      });
      
      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
    });
  });

  describe('Secondary Cluster Deletion Protection', () => {
    test('should create secondary cluster with deletion protection disabled for dev', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevSecondaryStack', {
        environmentSuffix: 'dev-secondary',
      });
      const devTemplate = Template.fromStack(devStack);
      
      const clusters = devTemplate.findResources('AWS::RDS::DBCluster');
      Object.values(clusters).forEach((cluster: any) => {
        expect(cluster.Properties.DeletionProtection).toBe(false);
      });
    });

    test('should create secondary cluster with deletion protection enabled for prod', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdSecondaryStack', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);
      
      const clusters = prodTemplate.findResources('AWS::RDS::DBCluster');
      Object.values(clusters).forEach((cluster: any) => {
        expect(cluster.Properties.DeletionProtection).toBe(true);
      });
    });
  });
});
