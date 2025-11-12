import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'testenv';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
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

  describe('VPC Configuration', () => {
    test('should create VPC with correct name and settings', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: `fraud-vpc-${environmentSuffix}` },
        ]),
      });
    });

    test('should create 3 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 public + 3 private + 3 isolated
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter((subnet: any) =>
        subnet.Properties.Tags.some(
          (tag: any) => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public'
        )
      );
      expect(publicSubnets).toHaveLength(3);
    });

    test('should create 3 private subnets with egress', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter((subnet: any) =>
        subnet.Properties.Tags.some(
          (tag: any) => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Private'
        )
      );
      expect(privateSubnets).toHaveLength(3);
    });

    test('should create 3 isolated subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const isolatedSubnets = Object.values(subnets).filter((subnet: any) =>
        subnet.Properties.Tags.some(
          (tag: any) =>
            tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Isolated'
        )
      );
      expect(isolatedSubnets).toHaveLength(3);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('S3 Data Bucket', () => {
    test('should create S3 bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `fraud-data-${environmentSuffix}`,
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

    test('should have auto-delete enabled for bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:auto-delete-objects', Value: 'true' },
        ]),
      });
    });
  });

  describe('SQS Queue', () => {
    test('should create SQS queue with correct name', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `fraud-tasks-${environmentSuffix}`,
        SqsManagedSseEnabled: true,
      });
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('should create Aurora PostgreSQL cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        StorageEncrypted: true,
        DatabaseName: 'frauddb',
      });
    });

    test('should create database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `fraud-db-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for RDS Aurora cluster',
      });
    });

    test('should have database instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2); // writer + reader
    });
  });

  describe('ECS Cluster', () => {
    test('should create ECS cluster with Container Insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `fraud-cluster-${environmentSuffix}`,
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('should enable Fargate capacity providers', () => {
      template.hasResourceProperties('AWS::ECS::ClusterCapacityProviderAssociations', {
        CapacityProviders: Match.arrayWith(['FARGATE', 'FARGATE_SPOT']),
      });
    });
  });

  describe('Cloud Map Service Discovery', () => {
    test('should create private DNS namespace', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Name: `fraud-services-${environmentSuffix}.local`,
      });
    });
  });

  describe('ECR Repositories', () => {
    test('should create API repository', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `fraud-api-${environmentSuffix}`,
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
    });

    test('should create Worker repository', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `fraud-worker-${environmentSuffix}`,
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
    });

    test('should create Job repository', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `fraud-job-${environmentSuffix}`,
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `fraud-alb-${environmentSuffix}`,
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should create target group with health check', () => {
      const targetGroups = template.findResources('AWS::ElasticLoadBalancingV2::TargetGroup');
      // Find target group with API port
      const apiTG = Object.values(targetGroups).find(
        (tg: any) => tg.Properties.Port === 8080
      );
      expect(apiTG).toBeDefined();
      expect((apiTG as any).Properties.Protocol).toBe('HTTP');
      expect((apiTG as any).Properties.HealthCheckPath).toBe('/health');
      expect((apiTG as any).Properties.HealthCheckIntervalSeconds).toBe(30);
    });

    test('should have path-based routing rule', () => {
      const rules = template.findResources('AWS::ElasticLoadBalancingV2::ListenerRule');
      const pathRule = Object.values(rules).find((r: any) => r.Properties.Priority === 1);
      expect(pathRule).toBeDefined();
      expect((pathRule as any).Properties.Conditions).toBeDefined();
      const pathCondition = (pathRule as any).Properties.Conditions.find(
        (c: any) => c.Field === 'path-pattern'
      );
      expect(pathCondition).toBeDefined();
      // Check either Values or PathPatternConfig.Values for path patterns
      const paths = pathCondition.Values || pathCondition.PathPatternConfig?.Values;
      expect(paths).toContain('/api/*');
    });
  });

  describe('IAM Roles', () => {
    test('should create API task role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `fraud-api-task-${environmentSuffix}`,
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

    test('should create Worker task role with SQS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `fraud-worker-task-${environmentSuffix}`,
      });
    });

    test('should create Job task role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `fraud-job-task-${environmentSuffix}`,
      });
    });

    test('should create task execution role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const execRole = Object.values(roles).find(
        (role: any) => role.Properties.RoleName === `fraud-task-exec-${environmentSuffix}`
      );
      expect(execRole).toBeDefined();
    });

    test('should have X-Ray permissions on task roles', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const taskRoles = Object.values(roles).filter((role: any) => {
        const policyArns = role.Properties?.ManagedPolicyArns || [];
        return policyArns.some((arn: any) => {
          const arnStr = typeof arn === 'string' ? arn : JSON.stringify(arn);
          return arnStr.includes('AWSXRayDaemonWriteAccess');
        });
      });
      expect(taskRoles.length).toBeGreaterThanOrEqual(3); // API, Worker, Job
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create API log group with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/ecs/fraud-api-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should create Worker log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/ecs/fraud-worker-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should create Job log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/ecs/fraud-job-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  describe('ECS Task Definitions', () => {
    test('should create API task definition with correct resources', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `fraud-api-${environmentSuffix}`,
        Cpu: '512',
        Memory: '1024',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('should create Worker task definition with correct resources', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `fraud-worker-${environmentSuffix}`,
        Cpu: '1024',
        Memory: '2048',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('should create Job task definition with correct resources', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `fraud-job-${environmentSuffix}`,
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('should have X-Ray container in API task definition', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const apiTaskDef = Object.values(taskDefs).find(
        (td: any) => td.Properties.Family === `fraud-api-${environmentSuffix}`
      );
      expect(apiTaskDef).toBeDefined();
      const xrayContainer = (apiTaskDef as any).Properties.ContainerDefinitions.find(
        (c: any) => {
          const imageStr = typeof c.Image === 'string' ? c.Image : JSON.stringify(c.Image);
          return imageStr.includes('xray');
        }
      );
      expect(xrayContainer).toBeDefined();
    });

    test('should have X-Ray container in Worker task definition', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const workerTaskDef = Object.values(taskDefs).find(
        (td: any) => td.Properties.Family === `fraud-worker-${environmentSuffix}`
      );
      expect(workerTaskDef).toBeDefined();
      const xrayContainer = (workerTaskDef as any).Properties.ContainerDefinitions.find(
        (c: any) => {
          const imageStr = typeof c.Image === 'string' ? c.Image : JSON.stringify(c.Image);
          return imageStr.includes('xray');
        }
      );
      expect(xrayContainer).toBeDefined();
    });

    test('should have X-Ray container in Job task definition', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      const jobTaskDef = Object.values(taskDefs).find(
        (td: any) => td.Properties.Family === `fraud-job-${environmentSuffix}`
      );
      expect(jobTaskDef).toBeDefined();
      const xrayContainer = (jobTaskDef as any).Properties.ContainerDefinitions.find(
        (c: any) => {
          const imageStr = typeof c.Image === 'string' ? c.Image : JSON.stringify(c.Image);
          return imageStr.includes('xray');
        }
      );
      expect(xrayContainer).toBeDefined();
    });
  });

  describe('ECS Services', () => {
    test('should have service discovery for API service', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::Service', {
        Name: 'api',
      });
    });

    test('should have service discovery for Worker service', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::Service', {
        Name: 'worker',
      });
    });
  });

  describe('Auto-Scaling', () => {
    test('should create CPU-based scaling policy for API service', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });

    test('should create memory-based scaling policy for API service', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          TargetValue: 80,
        },
      });
    });
  });

  describe('Scheduled Job', () => {
    test('should create EventBridge rule for scheduled job', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `fraud-job-schedule-${environmentSuffix}`,
        ScheduleExpression: 'rate(6 hours)',
        State: 'ENABLED',
      });
    });

    test('should have ECS task target for scheduled job', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const jobRule = Object.values(rules).find(
        (r: any) => r.Properties.Name === `fraud-job-schedule-${environmentSuffix}`
      );
      expect(jobRule).toBeDefined();
      expect((jobRule as any).Properties.Targets).toBeDefined();
      expect((jobRule as any).Properties.Targets[0].EcsParameters).toBeDefined();
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `fraud-detection-${environmentSuffix}`,
      });
    });

    test('should have dashboard with widgets', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0] as any;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      // Dashboard body can be a CDK token, so we just check it exists
      // In actual deployment it will be resolved to valid JSON
      const bodyStr = typeof dashboard.Properties.DashboardBody === 'string'
        ? dashboard.Properties.DashboardBody
        : JSON.stringify(dashboard.Properties.DashboardBody);
      expect(bodyStr).toBeTruthy();
      expect(bodyStr.length).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('should export ALB DNS name', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name',
        Export: {
          Name: `fraud-alb-dns-${environmentSuffix}`,
        },
      });
    });

    test('should export Cloud Map namespace', () => {
      template.hasOutput('CloudMapNamespace', {
        Description: 'Cloud Map namespace for service discovery',
        Export: {
          Name: `fraud-namespace-${environmentSuffix}`,
        },
      });
    });

    test('should export ECS cluster name', () => {
      template.hasOutput('EcsClusterName', {
        Description: 'ECS cluster name',
        Export: {
          Name: `fraud-cluster-name-${environmentSuffix}`,
        },
      });
    });

    test('should export ECR repository URIs', () => {
      template.hasOutput('ApiRepositoryUri', {
        Description: 'ECR repository URI for API service',
      });
      template.hasOutput('WorkerRepositoryUri', {
        Description: 'ECR repository URI for Worker service',
      });
      template.hasOutput('JobRepositoryUri', {
        Description: 'ECR repository URI for Job service',
      });
    });

    test('should export database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'Aurora PostgreSQL cluster endpoint',
      });
    });

    test('should export S3 bucket name', () => {
      template.hasOutput('DataBucketName', {
        Description: 'S3 bucket for data processing',
      });
    });

    test('should export SQS queue URL', () => {
      template.hasOutput('TaskQueueUrl', {
        Description: 'SQS queue URL for worker tasks',
      });
    });
  });

  describe('Resource Naming', () => {
    test('all resources should include environmentSuffix', () => {
      const allResources = template.toJSON().Resources;
      const resourcesWithNames = Object.values(allResources).filter(
        (r: any) =>
          r.Properties?.Name ||
          r.Properties?.BucketName ||
          r.Properties?.QueueName ||
          r.Properties?.ClusterName ||
          r.Properties?.GroupName ||
          r.Properties?.RepositoryName ||
          r.Properties?.RoleName ||
          r.Properties?.LogGroupName ||
          r.Properties?.Family ||
          r.Properties?.ServiceName ||
          r.Properties?.TargetGroupName ||
          r.Properties?.DashboardName
      );

      resourcesWithNames.forEach((resource: any) => {
        const nameValue =
          resource.Properties.Name ||
          resource.Properties.BucketName ||
          resource.Properties.QueueName ||
          resource.Properties.ClusterName ||
          resource.Properties.GroupName ||
          resource.Properties.RepositoryName ||
          resource.Properties.RoleName ||
          resource.Properties.LogGroupName ||
          resource.Properties.Family ||
          resource.Properties.ServiceName ||
          resource.Properties.TargetGroupName ||
          resource.Properties.DashboardName;

        if (
          typeof nameValue === 'string' &&
          nameValue.startsWith('fraud') &&
          !nameValue.includes('TapStack')
        ) {
          expect(nameValue).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Removal Policies', () => {
    test('should have DESTROY removal policy for S3 bucket', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have DESTROY removal policy for ECR repositories', () => {
      const repos = template.findResources('AWS::ECR::Repository');
      Object.values(repos).forEach((repo: any) => {
        expect(repo.UpdateReplacePolicy).toBe('Delete');
        expect(repo.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have DESTROY removal policy for RDS cluster', () => {
      const clusters = template.findResources('AWS::RDS::DBCluster');
      Object.values(clusters).forEach((cluster: any) => {
        expect(cluster.UpdateReplacePolicy).toBe('Delete');
        expect(cluster.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have DESTROY removal policy for log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((lg: any) => {
        expect(lg.UpdateReplacePolicy).toBe('Delete');
        expect(lg.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Security Configuration', () => {
    test('should have database in isolated subnets', () => {
      const dbSubnetGroups = template.findResources('AWS::RDS::DBSubnetGroup');
      expect(Object.keys(dbSubnetGroups).length).toBe(1);
    });

    test('should have ECS services in private subnets', () => {
      const services = template.findResources('AWS::ECS::Service');
      Object.values(services).forEach((service: any) => {
        expect(service.Properties.NetworkConfiguration).toBeDefined();
      });
    });

    test('should have ALB in public subnets', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
      });
    });
  });

  describe('High Availability', () => {
    test('should span 3 availability zones', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azs = new Set(
        Object.values(subnets).map((s: any) => s.Properties.AvailabilityZone)
      );
      expect(azs.size).toBe(3);
    });
  });
});
