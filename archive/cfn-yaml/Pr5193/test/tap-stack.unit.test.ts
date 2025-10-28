import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const yamlPath = join(__dirname, '..', 'lib', 'TapStack.yml');
    const jsonPath = join(__dirname, '..', 'lib', 'TapStack.json');

    // Convert YAML to JSON if JSON doesn't exist
    if (!existsSync(jsonPath)) {
      const yamlContent = readFileSync(yamlPath, 'utf8');
      const jsonContent = yaml.load(yamlContent);
      writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));
    }

    const templateContent = readFileSync(jsonPath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('HealthTech');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have network configuration parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBAllocatedStorage).toBeDefined();
      expect(template.Parameters.DBSecretName).toBeDefined();
    });

    test('should have ECS configuration parameters', () => {
      expect(template.Parameters.ContainerImage).toBeDefined();
      expect(template.Parameters.ContainerPort).toBeDefined();
      expect(template.Parameters.TaskCPU).toBeDefined();
      expect(template.Parameters.TaskMemory).toBeDefined();
      expect(template.Parameters.DesiredCount).toBeDefined();
    });
  });

  describe('VPC and Network Resources', () => {
    test('should create VPC with DNS enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should create NAT Gateway', () => {
      const nat = template.Resources.NatGateway;
      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should create 2 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should create 2 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have public route table with internet gateway route', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const publicRoute = template.Resources.DefaultPublicRoute;
      expect(publicRT).toBeDefined();
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have private route table with NAT gateway route', () => {
      const privateRT = template.Resources.PrivateRouteTable;
      const privateRoute = template.Resources.DefaultPrivateRoute;
      expect(privateRT).toBeDefined();
      expect(privateRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRoute).toBeDefined();
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have VPC Flow Logs configured', () => {
      const flowLog = template.Resources.VPCFlowLog;
      const flowLogGroup = template.Resources.VPCFlowLogsLogGroup;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogGroup).toBeDefined();
      expect(flowLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
    });

    test('should create ECS security group', () => {
      const sg = template.Resources.ECSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
    });

    test('should create RDS security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(5432);
      expect(ingress.ToPort).toBe(5432);
    });

    test('should create EFS security group', () => {
      const sg = template.Resources.EFSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(2049);
      expect(ingress.ToPort).toBe(2049);
    });

    test('should have proper security group references', () => {
      const ecsIngress = template.Resources.ECSSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ecsIngress.SourceSecurityGroupId).toBeDefined();
      expect(ecsIngress.SourceSecurityGroupId.Ref).toBe('ALBSecurityGroup');
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('postgres');
    });

    test('should have encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toBeDefined();
    });

    test('should have MultiAZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should have DeletionPolicy Delete', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have DeletionProtection disabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('should create DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have CloudWatch logs enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
    });
  });

  describe('EFS File System', () => {
    test('should create EFS file system', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs).toBeDefined();
      expect(efs.Type).toBe('AWS::EFS::FileSystem');
    });

    test('should have encryption enabled', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Properties.Encrypted).toBe(true);
      expect(efs.Properties.KmsKeyId).toBeDefined();
    });

    test('should create mount targets in private subnets', () => {
      expect(template.Resources.EFSMountTarget1).toBeDefined();
      expect(template.Resources.EFSMountTarget2).toBeDefined();
      expect(template.Resources.EFSMountTarget1.Type).toBe('AWS::EFS::MountTarget');
      expect(template.Resources.EFSMountTarget2.Type).toBe('AWS::EFS::MountTarget');
    });
  });

  describe('Load Balancer', () => {
    test('should create Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should create target group', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.TargetType).toBe('ip');
    });

    test('should create ALB listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should have health check configured', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });
  });

  describe('ECS Cluster and Services', () => {
    test('should create ECS cluster', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should have container insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterSettings[0].Name).toBe('containerInsights');
      expect(cluster.Properties.ClusterSettings[0].Value).toBe('enabled');
    });

    test('should create ECS task execution role', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should create ECS task role with proper permissions', () => {
      const role = template.Resources.ECSTaskRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThanOrEqual(2);
    });

    test('should create ECS task definition', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef).toBeDefined();
      expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
    });

    test('should have EFS volume configured in task definition', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.Volumes).toBeDefined();
      expect(taskDef.Properties.Volumes.length).toBeGreaterThan(0);
      const efsVolume = taskDef.Properties.Volumes.find((v: any) => v.EFSVolumeConfiguration);
      expect(efsVolume).toBeDefined();
      expect(efsVolume.EFSVolumeConfiguration.TransitEncryption).toBe('ENABLED');
    });

    test('should use Secrets Manager for DB credentials in task', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.Secrets).toBeDefined();
      expect(container.Secrets.length).toBeGreaterThanOrEqual(2);
    });

    test('should create ECS service', () => {
      const service = template.Resources.ECSService;
      expect(service).toBeDefined();
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });

    test('should deploy ECS tasks in private subnets', () => {
      const service = template.Resources.ECSService;
      const config = service.Properties.NetworkConfiguration.AwsvpcConfiguration;
      expect(config.AssignPublicIp).toBe('DISABLED');
      expect(config.Subnets).toBeDefined();
    });

    test('should create CloudWatch log group', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Auto Scaling', () => {
    test('should create ECS service scaling target', () => {
      const target = template.Resources.ECSServiceScalingTarget;
      expect(target).toBeDefined();
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
      expect(target.Properties.MinCapacity).toBe(1);
      expect(target.Properties.MaxCapacity).toBe(10);
    });

    test('should create ECS service scaling policy', () => {
      const policy = template.Resources.ECSServiceScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('CodePipeline and CodeBuild', () => {
    test('should create S3 artifact bucket', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('should have S3 bucket encryption enabled', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should block public access on S3 bucket', () => {
      const bucket = template.Resources.ArtifactBucket;
      const config = bucket.Properties.PublicAccessBlockConfiguration;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should create CodePipeline', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline).toBeDefined();
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('should have Source, Build, and Deploy stages', () => {
      const pipeline = template.Resources.Pipeline;
      const stages = pipeline.Properties.Stages;
      expect(stages).toHaveLength(3);
      expect(stages[0].Name).toBe('Source');
      expect(stages[1].Name).toBe('Build');
      expect(stages[2].Name).toBe('Deploy');
    });

    test('should create CodeBuild project', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project).toBeDefined();
      expect(project.Type).toBe('AWS::CodeBuild::Project');
    });

    test('should have privileged mode for Docker builds', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Environment.PrivilegedMode).toBe(true);
    });

    test('should create CodePipeline IAM role', () => {
      const role = template.Resources.CodePipelineRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should create CodeBuild IAM role', () => {
      const role = template.Resources.CodeBuildRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should create CodeBuild log group', () => {
      const logGroup = template.Resources.CodeBuildLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create high CPU alarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('should create database connections alarm', () => {
      const alarm = template.Resources.DatabaseConnectionsAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    const resourcesToCheck = [
      { name: 'VPC', prop: 'Tags' },
      { name: 'InternetGateway', prop: 'Tags' },
      { name: 'RDSInstance', prop: 'DBInstanceIdentifier' },
      { name: 'ECSCluster', prop: 'ClusterName' },
      { name: 'ApplicationLoadBalancer', prop: 'Name' },
      { name: 'Pipeline', prop: 'Name' },
    ];

    resourcesToCheck.forEach(({ name, prop }) => {
      test(`should use EnvironmentSuffix in ${name}`, () => {
        const resource = template.Resources[name];
        expect(resource).toBeDefined();

        if (prop === 'Tags') {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
        } else {
          const property = resource.Properties[prop];
          if (property && typeof property === 'object' && property['Fn::Sub']) {
            expect(property['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should export VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    test('should export subnet IDs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should export RDS endpoint', () => {
      expect(template.Outputs.RDSInstanceEndpoint).toBeDefined();
      expect(template.Outputs.RDSInstancePort).toBeDefined();
    });

    test('should export EFS file system ID', () => {
      expect(template.Outputs.EFSFileSystemId).toBeDefined();
    });

    test('should export Load Balancer DNS', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
    });

    test('should export ECS cluster name', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
    });

    test('should export Pipeline name', () => {
      expect(template.Outputs.PipelineName).toBeDefined();
    });

    test('should export KMS key IDs', () => {
      expect(template.Outputs.RDSKMSKeyId).toBeDefined();
      expect(template.Outputs.EFSKMSKeyId).toBeDefined();
    });

    test('should export EnvironmentSuffix', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
    });

    test('should export StackName', () => {
      expect(template.Outputs.StackName).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with Retain deletion policy', () => {
      Object.keys(template.Resources).forEach((resourceKey) => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('should have proper IAM role trust policies', () => {
      const roles = ['ECSTaskExecutionRole', 'ECSTaskRole', 'CodePipelineRole', 'CodeBuildRole', 'VPCFlowLogsRole'];
      roles.forEach((roleName) => {
        const role = template.Resources[roleName];
        expect(role).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
      });
    });

    test('should have encryption at rest for all storage', () => {
      expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.EFSFileSystem.Properties.Encrypted).toBe(true);
      expect(template.Resources.ArtifactBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have encryption in transit for EFS', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const efsVolume = taskDef.Properties.Volumes.find((v: any) => v.EFSVolumeConfiguration);
      expect(efsVolume.EFSVolumeConfiguration.TransitEncryption).toBe('ENABLED');
    });
  });

  describe('Template Resource Count', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(50);
    });

    test('should have all critical AWS services', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::ECS::Cluster');
      expect(resourceTypes).toContain('AWS::ECS::Service');
      expect(resourceTypes).toContain('AWS::CodePipeline::Pipeline');
      expect(resourceTypes).toContain('AWS::EFS::FileSystem');
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });
  });
});
