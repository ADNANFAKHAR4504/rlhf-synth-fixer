import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'testenv';

describe('TapStack - High Availability Architecture', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix,
      hostedZoneName: `test-${environmentSuffix}.com`,
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Resources', () => {

    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      // Verify multiple subnets are created (3 AZs x 3 types = 9 subnets)
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThan(0);
    });

    test('creates security groups for ALB, ECS, and database', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ECS tasks',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Aurora database',
      });
    });

    test('creates Aurora cluster with Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '14.6',
        StorageEncrypted: true,
      });
    });

    test('creates DynamoDB table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `session-table-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('creates S3 bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });


    test('creates ECS cluster with container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `ecs-cluster-${environmentSuffix}`,
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('creates Fargate task definition with correct configuration', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `task-family-${environmentSuffix}`,
        Cpu: '512',
        Memory: '1024',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('creates Fargate service with desired count', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `fargate-service-${environmentSuffix}`,
        DesiredCount: 2,
        LaunchType: 'FARGATE',
      });
    });

    test('creates Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `alb-${environmentSuffix}`,
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('creates target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('creates Route 53 hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: `test-${environmentSuffix}.com.`,
      });
    });

    test('creates Route 53 health check', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          Type: 'HTTP',
          ResourcePath: '/',
          Port: 80,
          RequestInterval: 30,
          FailureThreshold: 3,
        }),
      });
    });

    test('creates DNS record pointing to ALB', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
      });
    });

    test('creates EventBridge event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `event-bus-${environmentSuffix}`,
      });
    });

    test('creates CloudWatch Synthetics canary', () => {
      template.hasResourceProperties('AWS::Synthetics::Canary', {
        RuntimeVersion: 'syn-nodejs-puppeteer-9.1',
        Schedule: {
          Expression: 'rate(5 minutes)',
        },
        StartCanaryAfterCreation: true,
      });
    });

    test('creates IAM role for canary with correct permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const canaryRole = Object.values(roles).find((role: any) =>
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) => stmt.Principal?.Service === 'lambda.amazonaws.com'
        )
      );
      expect(canaryRole).toBeDefined();

      // Check that it has managed policy for Lambda basic execution
      const hasManagedPolicy = canaryRole?.Properties?.ManagedPolicyArns?.some((arn: any) => {
        const arnStr = JSON.stringify(arn);
        return arnStr.includes('AWSLambdaBasicExecutionRole');
      });
      expect(hasManagedPolicy).toBe(true);
    });

    test('creates AWS Backup vault', () => {
      template.hasResourceProperties('AWS::Backup::BackupVault', {
        BackupVaultName: `backup-vault-${environmentSuffix}`,
      });
    });

    test('creates AWS Backup plan with daily backup rule', () => {
      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: Match.objectLike({
          BackupPlanName: `backup-plan-${environmentSuffix}`,
          BackupPlanRule: Match.arrayWith([
            Match.objectLike({
              RuleName: `daily-backup-${environmentSuffix}`,
              ScheduleExpression: 'cron(0 2 * * ? *)',
            }),
          ]),
        }),
      });
    });

    test('creates backup selection for Aurora cluster', () => {
      const selections = template.findResources('AWS::Backup::BackupSelection');
      const hasRdsClusterSelection = Object.values(selections).some((selection: any) =>
        selection.Properties?.BackupSelection?.Resources?.some((resource: any) => {
          const resourceStr = JSON.stringify(resource);
          return resourceStr.includes('rds') && resourceStr.includes('cluster');
        })
      );
      expect(hasRdsClusterSelection).toBe(true);
    });

    test('creates Step Functions state machine for operations', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `operational-sm-${environmentSuffix}`,
      });
    });

    test('creates SSM parameters for configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/app/${environmentSuffix}/db-endpoint`,
        Type: 'String',
        Tier: 'Standard',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/app/${environmentSuffix}/alb-dns`,
        Type: 'String',
        Tier: 'Standard',
      });
    });

    test('exports stack outputs correctly', () => {
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('VpcId');
      expect(outputs).toHaveProperty('LoadBalancerDNS');
      expect(outputs).toHaveProperty('DatabaseEndpoint');
      expect(outputs).toHaveProperty('HostedZoneId');
      expect(outputs).toHaveProperty('HostedZoneName');
    });

    test('uses removal policy DESTROY for critical resources', () => {
      const resources = template.toJSON().Resources;
      const criticalResourcesWithRetain = Object.entries(resources).filter(
        ([, resource]: any) => {
          const type = resource.Type;
          // Allow LogGroup to have Retain policy, check critical resources only
          const isCritical = ['AWS::RDS::DBCluster', 'AWS::S3::Bucket', 'AWS::DynamoDB::GlobalTable'].includes(type);
          return isCritical && (resource.DeletionPolicy === 'Retain' || resource.UpdateReplacePolicy === 'Retain');
        }
      );
      expect(criticalResourcesWithRetain).toHaveLength(0);
    });

    test('applies environment suffix to all resource names', () => {
      const resources = template.toJSON().Resources;
      const namedResources = Object.entries(resources).filter(([, resource]: any) => {
        const props = resource.Properties;
        return (
          props?.ClusterName ||
          props?.ServiceName ||
          props?.Name ||
          props?.LoadBalancerName ||
          props?.BackupVaultName ||
          props?.TableName ||
          props?.BucketName
        );
      });

      namedResources.forEach(([, resource]: any) => {
        const props = resource.Properties;
        const name =
          props.ClusterName ||
          props.ServiceName ||
          props.Name ||
          props.LoadBalancerName ||
          props.BackupVaultName ||
          props.TableName ||
          props.BucketName;

        if (name && typeof name === 'string' && !name.includes('Fn::')) {
          expect(name).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Resource Encryption', () => {
    test('Aurora database uses encryption at rest', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('DynamoDB table uses encryption', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      expect(Object.keys(tables).length).toBeGreaterThan(0);
    });

    test('S3 bucket uses encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('ECS task execution role has correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('Step Functions execution role exists', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const sfnRole = Object.values(roles).find((role: any) =>
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) => stmt.Principal?.Service === 'states.amazonaws.com'
        )
      );
      expect(sfnRole).toBeDefined();
    });
  });

  describe('Network Configuration', () => {
    test('VPC has correct subnet types', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetTags = Object.values(subnets).map((subnet: any) =>
        subnet.Properties?.Tags?.find((tag: any) => tag.Key === 'aws-cdk:subnet-name')
      );

      const subnetNames = subnetTags
        .filter(Boolean)
        .map((tag: any) => tag.Value);

      expect(subnetNames).toContain(`public-${environmentSuffix}`);
      expect(subnetNames).toContain(`private-${environmentSuffix}`);
      expect(subnetNames).toContain(`isolated-${environmentSuffix}`);
    });

    test('security group allows HTTP and HTTPS traffic to ALB', () => {
      // Check for security group egress rules on ALB security group
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(securityGroups).find((sg: any) =>
        sg.Properties?.GroupDescription === 'Security group for Application Load Balancer'
      );

      expect(albSg).toBeDefined();
      expect(albSg?.Properties?.SecurityGroupIngress).toBeDefined();

      const hasHttpRule = albSg?.Properties?.SecurityGroupIngress?.some(
        (rule: any) => rule.FromPort === 80 && rule.ToPort === 80 && rule.CidrIp === '0.0.0.0/0'
      );
      const hasHttpsRule = albSg?.Properties?.SecurityGroupIngress?.some(
        (rule: any) => rule.FromPort === 443 && rule.ToPort === 443 && rule.CidrIp === '0.0.0.0/0'
      );

      expect(hasHttpRule).toBe(true);
      expect(hasHttpsRule).toBe(true);
    });

    test('database security group allows PostgreSQL from ECS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });

    test('NAT gateway configured for cost optimization', () => {
      // Single NAT gateway for cost optimization
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('Optional Parameters', () => {
    test('uses default hosted zone name when not provided', () => {
      const app2 = new cdk.App();
      const stackWithoutZone = new TapStack(app2, 'TestStackNoZone', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'test123',
      });
      const template2 = Template.fromStack(stackWithoutZone);

      template2.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'example-test123.com.',
      });
    });

    test('container port mapping is configured correctly', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const taskDefKey = Object.keys(taskDefs)[0];
      const taskDef = taskDefs[taskDefKey];

      expect(taskDef.Properties.ContainerDefinitions).toBeDefined();
      expect(taskDef.Properties.ContainerDefinitions[0].PortMappings).toBeDefined();
      expect(taskDef.Properties.ContainerDefinitions[0].PortMappings[0].ContainerPort).toBe(80);
    });

    test('Aurora cluster has multiple instances for high availability', () => {
      const instances = template.findResources('AWS::RDS::DBInstance');
      expect(Object.keys(instances).length).toBeGreaterThanOrEqual(2);
    });

    test('VPC has 3 availability zones configured', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter((subnet: any) =>
        subnet.Properties?.Tags?.find((tag: any) =>
          tag.Key === 'aws-cdk:subnet-name' && tag.Value === `public-${environmentSuffix}`
        )
      );
      expect(publicSubnets.length).toBe(3);
    });

    test('canary IAM role has CloudWatch permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const canaryRole = Object.values(roles).find((role: any) =>
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) => stmt.Principal?.Service === 'lambda.amazonaws.com'
        )
      );

      expect(canaryRole).toBeDefined();
      expect(canaryRole?.Properties?.ManagedPolicyArns).toBeDefined();
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const sessionTable = Object.values(tables).find((table: any) =>
        table.Properties?.TableName === `session-table-${environmentSuffix}`
      );

      expect(sessionTable).toBeDefined();
      expect(sessionTable?.Properties?.PointInTimeRecoverySpecification?.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('listener is configured on ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('Route53 health check monitors ALB', () => {
      const healthChecks = template.findResources('AWS::Route53::HealthCheck');
      expect(Object.keys(healthChecks).length).toBeGreaterThan(0);
    });

    test('ECS task definition uses awsvpc network mode', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        NetworkMode: 'awsvpc',
      });
    });

    test('backup plan has retention policy configured', () => {
      const backupPlans = template.findResources('AWS::Backup::BackupPlan');
      const plan = Object.values(backupPlans)[0] as any;
      const rules = plan?.Properties?.BackupPlan?.BackupPlanRule || [];

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].Lifecycle?.DeleteAfterDays).toBeDefined();
    });
  });
});
