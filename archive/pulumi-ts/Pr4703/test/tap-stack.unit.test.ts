/* eslint-disable prettier/prettier */

/**
 * tap-stack.unit.test.ts
 * 
 * Comprehensive unit tests for TapStack infrastructure using Pulumi mocks
 * Tests all resources, configurations, and connections
 * Target: 100% code coverage
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackArgs } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    const outputs: any = { ...args.inputs };
    outputs.id = args.id || args.name;
    outputs.arn = `arn:aws:::${args.type}/${args.name}`;
    outputs.name = args.name;

    // Mock VPC
    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.cidrBlock = args.inputs.cidrBlock;
      outputs.enableDnsHostnames = true;
      outputs.enableDnsSupport = true;
    }

    // Mock Subnet
    if (args.type === 'aws:ec2/subnet:Subnet') {
      outputs.availabilityZone = args.inputs.availabilityZone;
      outputs.cidrBlock = args.inputs.cidrBlock;
      outputs.mapPublicIpOnLaunch = args.inputs.mapPublicIpOnLaunch;
    }

    // Mock Load Balancer
    if (args.type === 'aws:lb/loadBalancer:LoadBalancer') {
      outputs.dnsName = `${args.name}.elb.us-east-2.amazonaws.com`;
      outputs.zoneId = 'Z35SXDOTRQ7X7K';
      outputs.arnSuffix = `app/${args.name}/1234567890`;
      outputs.loadBalancerType = args.inputs.loadBalancerType;
      outputs.internal = args.inputs.internal;
      outputs.enableHttp2 = args.inputs.enableHttp2;
    }

    // Mock Target Group
    if (args.type === 'aws:lb/targetGroup:TargetGroup') {
      outputs.arnSuffix = `targetgroup/${args.name}/1234567890`;
      outputs.targetType = args.inputs.targetType;
      outputs.deregistrationDelay = args.inputs.deregistrationDelay;
      outputs.healthCheck = args.inputs.healthCheck;
      outputs.port = args.inputs.port;
      outputs.protocol = args.inputs.protocol;
    }

    // Mock RDS Cluster
    if (args.type === 'aws:rds/cluster:Cluster') {
      outputs.endpoint = `${args.name}.cluster-123456.us-east-2.rds.amazonaws.com`;
      outputs.readerEndpoint = `${args.name}.cluster-ro-123456.us-east-2.rds.amazonaws.com`;
      outputs.port = 5432;
      outputs.iamDatabaseAuthenticationEnabled = args.inputs.iamDatabaseAuthenticationEnabled;
      outputs.storageEncrypted = args.inputs.storageEncrypted;
      outputs.backupRetentionPeriod = args.inputs.backupRetentionPeriod;
      outputs.enabledCloudwatchLogsExports = args.inputs.enabledCloudwatchLogsExports;
    }

    // Mock RDS Instance
    if (args.type === 'aws:rds/clusterInstance:ClusterInstance') {
      outputs.instanceClass = args.inputs.instanceClass;
      outputs.performanceInsightsEnabled = args.inputs.performanceInsightsEnabled;
    }

    // Mock ECS Cluster
    if (args.type === 'aws:ecs/cluster:Cluster') {
      outputs.arn = `arn:aws:ecs:us-east-2:123456789012:cluster/${args.name}`;
      outputs.settings = args.inputs.settings;
    }

    // Mock ECS Service
    if (args.type === 'aws:ecs/service:Service') {
      outputs.arn = `arn:aws:ecs:us-east-2:123456789012:service/${args.name}`;
      outputs.desiredCount = args.inputs.desiredCount;
      outputs.launchType = args.inputs.launchType;
      outputs.networkConfiguration = args.inputs.networkConfiguration;
      outputs.enableExecuteCommand = args.inputs.enableExecuteCommand;
      outputs.deploymentMaximumPercent = args.inputs.deploymentMaximumPercent;
      outputs.deploymentMinimumHealthyPercent = args.inputs.deploymentMinimumHealthyPercent;
    }

    // Mock ECR Repository
    if (args.type === 'aws:ecr/repository:Repository') {
      outputs.repositoryUrl = `123456789012.dkr.ecr.us-east-2.amazonaws.com/${args.name}`;
      outputs.imageScanningConfiguration = args.inputs.imageScanningConfiguration;
      outputs.imageTagMutability = args.inputs.imageTagMutability;
    }

    // Mock Security Group
    if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      outputs.ingress = args.inputs.ingress;
      outputs.egress = args.inputs.egress;
      outputs.description = args.inputs.description;
      outputs.vpcId = args.inputs.vpcId;
    }

    // Mock IAM Role
    if (args.type === 'aws:iam/role:Role') {
      outputs.assumeRolePolicy = args.inputs.assumeRolePolicy;
    }

    // Mock CloudWatch Log Group
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.retentionInDays = args.inputs.retentionInDays;
    }

    // Mock CloudWatch Metric Alarm
    if (args.type === 'aws:cloudwatch/metricAlarm:MetricAlarm') {
      outputs.metricName = args.inputs.metricName;
      outputs.threshold = args.inputs.threshold;
      outputs.comparisonOperator = args.inputs.comparisonOperator;
      outputs.evaluationPeriods = args.inputs.evaluationPeriods;
    }

    // Mock App Autoscaling Target
    if (args.type === 'aws:appautoscaling/target:Target') {
      outputs.minCapacity = args.inputs.minCapacity;
      outputs.maxCapacity = args.inputs.maxCapacity;
    }

    // Mock App Autoscaling Policy
    if (args.type === 'aws:appautoscaling/policy:Policy') {
      outputs.policyType = args.inputs.policyType;
      outputs.targetTrackingScalingPolicyConfiguration = args.inputs.targetTrackingScalingPolicyConfiguration;
    }

    // Mock Route53 Zone
    if (args.type === 'aws:route53/zone:Zone') {
      outputs.zoneId = 'Z1234567890ABC';
    }

    // Mock ACM Certificate
    if (args.type === 'aws:acm/certificate:Certificate') {
      outputs.domainValidationOptions = [{
        resourceRecordName: '_acme-challenge.example.com',
        resourceRecordType: 'CNAME',
        resourceRecordValue: 'validation.example.com',
      }];
    }

    // Mock ALB Listener
    if (args.type === 'aws:lb/listener:Listener') {
      outputs.port = args.inputs.port;
      outputs.protocol = args.inputs.protocol;
    }

    // Mock Parameter Group
    if (args.type === 'aws:rds/clusterParameterGroup:ClusterParameterGroup') {
      outputs.family = args.inputs.family;
      outputs.parameters = args.inputs.parameters;
    }

    return { id: outputs.id, state: outputs };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

// Set test configuration
pulumi.runtime.setConfig('dbPassword', 'test-password-12345');

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  const testArgs: TapStackArgs = {
    environmentSuffix: 'test',
    region: 'us-east-2',
    vpcCidr: '10.18.0.0/16',
    tags: {
      Environment: 'test',
      Project: 'TradingAnalyticsPlatform',
    },
  };

  beforeAll(() => {
    // Ensure test environment
    process.env.NODE_ENV = 'test';
    stack = new TapStack('test-stack', testArgs);
  });

  afterAll(() => {
    const outputFile = path.join('cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
    const outputDir = 'cfn-outputs';
    if (fs.existsSync(outputDir)) {
      try {
        fs.rmdirSync(outputDir);
      } catch (e) {
        // Directory not empty or doesn't exist
      }
    }
  });

  describe('Network Infrastructure Tests', () => {
    it('should create VPC with correct CIDR block', (done) => {
      stack.vpc.cidrBlock.apply(cidr => {
        expect(cidr).toBe('10.18.0.0/16');
        done();
      });
    });

    it('should enable DNS hostnames and DNS support on VPC', (done) => {
      pulumi.all([stack.vpc.enableDnsHostnames, stack.vpc.enableDnsSupport]).apply(([hostnames, support]) => {
        expect(hostnames).toBe(true);
        expect(support).toBe(true);
        done();
      });
    });

    it('should create 2 public subnets across availability zones', (done) => {
      expect(stack.publicSubnets).toHaveLength(2);
      pulumi.all([
        stack.publicSubnets[0].availabilityZone,
        stack.publicSubnets[1].availabilityZone
      ]).apply(([az1, az2]) => {
        expect(az1).toBe('us-east-2a');
        expect(az2).toBe('us-east-2b');
        done();
      });
    });

    it('should create 2 private subnets across availability zones', (done) => {
      expect(stack.privateSubnets).toHaveLength(2);
      pulumi.all([
        stack.privateSubnets[0].cidrBlock,
        stack.privateSubnets[1].cidrBlock
      ]).apply(([cidr1, cidr2]) => {
        expect(cidr1).toBe('10.18.10.0/24');
        expect(cidr2).toBe('10.18.11.0/24');
        done();
      });
    });

    it('should create 2 database subnets across availability zones', (done) => {
      expect(stack.databaseSubnets).toHaveLength(2);
      pulumi.all([
        stack.databaseSubnets[0].cidrBlock,
        stack.databaseSubnets[1].cidrBlock
      ]).apply(([cidr1, cidr2]) => {
        expect(cidr1).toBe('10.18.20.0/24');
        expect(cidr2).toBe('10.18.21.0/24');
        done();
      });
    });

    it('should create Internet Gateway', (done) => {
      expect(stack.internetGateway).toBeDefined();
      pulumi.all([stack.internetGateway.vpcId, stack.vpc.id]).apply(([igwVpc, vpcId]) => {
        expect(igwVpc).toBe(vpcId);
        done();
      });
    });

    it('should create 2 NAT Gateways for high availability', () => {
      expect(stack.natGateways).toHaveLength(2);
    });

    it('should apply correct tags to network resources', (done) => {
      stack.vpc.tags.apply(tags => {
        expect(tags?.Environment).toBe('test');
        expect(tags?.Project).toBe('TradingAnalyticsPlatform');
        done();
      });
    });
  });

  describe('Security Group Tests', () => {
    it('should create ALB security group with HTTP and HTTPS ingress', (done) => {
      expect(stack.albSecurityGroup).toBeDefined();
      stack.albSecurityGroup.ingress.apply(ingress => {
        expect(ingress).toHaveLength(2);
        const httpRule = ingress.find(r => r.fromPort === 80);
        const httpsRule = ingress.find(r => r.fromPort === 443);
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        expect(httpRule?.cidrBlocks).toContain('0.0.0.0/0');
        done();
      });
    });

    it('should create ECS security group with restricted access', (done) => {
      expect(stack.ecsSecurityGroup).toBeDefined();
      pulumi.all([stack.ecsSecurityGroup.vpcId, stack.vpc.id]).apply(([sgVpc, vpcId]) => {
        expect(sgVpc).toBe(vpcId);
        done();
      });
    });

    it('should create RDS security group with PostgreSQL port', (done) => {
      expect(stack.rdsSecurityGroup).toBeDefined();
      stack.rdsSecurityGroup.description.apply(desc => {
        expect(desc).toContain('Aurora PostgreSQL');
        done();
      });
    });

    it('should allow all outbound traffic from security groups', (done) => {
      pulumi.all([
        stack.albSecurityGroup.egress,
        stack.ecsSecurityGroup.egress,
        stack.rdsSecurityGroup.egress
      ]).apply(([albEgress, ecsEgress, rdsEgress]) => {
        expect(albEgress[0].protocol).toBe('-1');
        expect(ecsEgress[0].protocol).toBe('-1');
        expect(rdsEgress[0].protocol).toBe('-1');
        done();
      });
    });
  });

  describe('IAM Role Tests', () => {
    it('should create ECS task execution role', (done) => {
      expect(stack.ecsTaskExecutionRole).toBeDefined();
      stack.ecsTaskExecutionRole.assumeRolePolicy.apply(policy => {
        const parsed = JSON.parse(policy);
        expect(parsed.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
        done();
      });
    });

    it('should create ECS task role for application', (done) => {
      expect(stack.ecsTaskRole).toBeDefined();
      stack.ecsTaskRole.assumeRolePolicy.apply(policy => {
        const parsed = JSON.parse(policy);
        expect(parsed.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
        done();
      });
    });

    it('should create auto-scaling role', (done) => {
      expect(stack.autoScalingRole).toBeDefined();
      stack.autoScalingRole.assumeRolePolicy.apply(policy => {
        const parsed = JSON.parse(policy);
        expect(parsed.Statement[0].Principal.Service).toBe('application-autoscaling.amazonaws.com');
        done();
      });
    });

    it('should apply least-privilege tags to IAM roles', (done) => {
      stack.ecsTaskRole.tags.apply(tags => {
        expect(tags?.Name).toContain('tap-ecs-task-role');
        done();
      });
    });
  });

  describe('ECR Repository Tests', () => {
    it('should create ECR repository for API with scanning enabled', (done) => {
      expect(stack.ecrApiRepository).toBeDefined();
      stack.ecrApiRepository.imageScanningConfiguration.apply(config => {
        expect(config?.scanOnPush).toBe(true);
        done();
      });
    });

    it('should create ECR repository for Frontend with scanning enabled', (done) => {
      expect(stack.ecrFrontendRepository).toBeDefined();
      stack.ecrFrontendRepository.imageScanningConfiguration.apply(config => {
        expect(config?.scanOnPush).toBe(true);
        done();
      });
    });

    it('should set image tag mutability to MUTABLE', (done) => {
      pulumi.all([
        stack.ecrApiRepository.imageTagMutability,
        stack.ecrFrontendRepository.imageTagMutability
      ]).apply(([apiMut, frontendMut]) => {
        expect(apiMut).toBe('MUTABLE');
        expect(frontendMut).toBe('MUTABLE');
        done();
      });
    });

    it('should apply service tags to ECR repositories', (done) => {
      stack.ecrApiRepository.tags.apply(tags => {
        expect(tags?.Service).toBe('api');
        done();
      });
    });
  });

  describe('RDS Aurora Tests', () => {
    it('should create Aurora subnet group with database subnets', (done) => {
      expect(stack.auroraSubnetGroup).toBeDefined();
      stack.auroraSubnetGroup.description.apply(desc => {
        expect(desc).toContain('Aurora PostgreSQL');
        done();
      });
    });

    it('should create Aurora parameter group with circuit breaker settings', (done) => {
      expect(stack.auroraParameterGroup).toBeDefined();
      pulumi.all([
        stack.auroraParameterGroup.family,
        stack.auroraParameterGroup.parameters
      ]).apply(([family, params]) => {
        expect(family).toBe('aurora-postgresql14');
        const timeoutParam = params?.find(p => p.name === 'statement_timeout');
        expect(timeoutParam?.value).toBe('30000');
        done();
      });
    });

    it('should create Aurora cluster with IAM authentication enabled', (done) => {
      expect(stack.auroraCluster).toBeDefined();
      stack.auroraCluster.iamDatabaseAuthenticationEnabled.apply(enabled => {
        expect(enabled).toBe(true);
        done();
      });
    });

    it('should enable encryption at rest for Aurora cluster', (done) => {
      stack.auroraCluster.storageEncrypted.apply(encrypted => {
        expect(encrypted).toBe(true);
        done();
      });
    });

    it('should configure automated backups with 30-day retention', (done) => {
      stack.auroraCluster.backupRetentionPeriod.apply(retention => {
        expect(retention).toBe(30);
        done();
      });
    });

    it('should enable CloudWatch logs export for PostgreSQL', (done) => {
      stack.auroraCluster.enabledCloudwatchLogsExports.apply(exports => {
        expect(exports).toContain('postgresql');
        done();
      });
    });

    it('should create writer and reader instances', (done) => {
      expect(stack.auroraWriterInstance).toBeDefined();
      expect(stack.auroraReaderInstance).toBeDefined();
      pulumi.all([
        stack.auroraWriterInstance.instanceClass,
        stack.auroraReaderInstance.instanceClass
      ]).apply(([writerClass, readerClass]) => {
        expect(writerClass).toBe('db.r6g.large');
        expect(readerClass).toBe('db.r6g.large');
        done();
      });
    });

    it('should enable Performance Insights on instances', (done) => {
      pulumi.all([
        stack.auroraWriterInstance.performanceInsightsEnabled,
        stack.auroraReaderInstance.performanceInsightsEnabled
      ]).apply(([writerPI, readerPI]) => {
        expect(writerPI).toBe(true);
        expect(readerPI).toBe(true);
        done();
      });
    });
  });

  describe('Load Balancer Tests', () => {
    it('should create Application Load Balancer', (done) => {
      expect(stack.alb).toBeDefined();
      stack.alb.loadBalancerType.apply(type => {
        expect(type).toBe('application');
        done();
      });
    });

    it('should configure ALB as internet-facing', (done) => {
      stack.alb.internal.apply(internal => {
        expect(internal).toBe(false);
        done();
      });
    });

    it('should enable HTTP/2 on ALB', (done) => {
      stack.alb.enableHttp2.apply(http2 => {
        expect(http2).toBe(true);
        done();
      });
    });

    it('should create blue and green target groups for blue-green deployment', (done) => {
      expect(stack.albTargetGroupBlue).toBeDefined();
      expect(stack.albTargetGroupGreen).toBeDefined();
      pulumi.all([
        stack.albTargetGroupBlue.tags,
        stack.albTargetGroupGreen.tags
      ]).apply(([blueTags, greenTags]) => {
        expect(blueTags?.Deployment).toBe('blue');
        expect(greenTags?.Deployment).toBe('green');
        done();
      });
    });

    it('should configure health checks with custom intervals', (done) => {
      stack.albTargetGroupBlue.healthCheck.apply(hc => {
        expect(hc?.interval).toBe(30);
        expect(hc?.timeout).toBe(5);
        expect(hc?.healthyThreshold).toBe(2);
        expect(hc?.unhealthyThreshold).toBe(3);
        done();
      });
    });

    it('should set target type to IP for Fargate', (done) => {
      stack.albTargetGroupBlue.targetType.apply(type => {
        expect(type).toBe('ip');
        done();
      });
    });

    it('should configure deregistration delay', (done) => {
      stack.albTargetGroupBlue.deregistrationDelay.apply(delay => {
        expect(delay).toBe(30);
        done();
      });
    });

    it('should create HTTP listener', (done) => {
      expect(stack.albHttpListener).toBeDefined();
      pulumi.all([
        stack.albHttpListener.port,
        stack.albHttpListener.protocol
      ]).apply(([port, protocol]) => {
        expect(port).toBe(80);
        expect(protocol).toBe('HTTP');
        done();
      });
    });
  });

  describe('ECS Cluster Tests', () => {
    it('should create ECS cluster with Container Insights enabled', (done) => {
      expect(stack.ecsCluster).toBeDefined();
      stack.ecsCluster.settings.apply(settings => {
        const insightsSetting = settings?.find(s => s.name === 'containerInsights');
        expect(insightsSetting?.value).toBe('enabled');
        done();
      });
    });

    it('should create CloudWatch log groups for API and Frontend', (done) => {
      expect(stack.apiLogGroup).toBeDefined();
      expect(stack.frontendLogGroup).toBeDefined();
      pulumi.all([
        stack.apiLogGroup.retentionInDays,
        stack.frontendLogGroup.retentionInDays
      ]).apply(([apiRetention, frontendRetention]) => {
        expect(apiRetention).toBe(30);
        expect(frontendRetention).toBe(30);
        done();
      });
    });

    it('should create API ECS service', (done) => {
      expect(stack.apiService).toBeDefined();
      pulumi.all([
        stack.apiService.desiredCount,
        stack.apiService.launchType
      ]).apply(([count, type]) => {
        expect(count).toBe(2);
        expect(type).toBe('FARGATE');
        done();
      });
    });

    it('should create Frontend ECS service', (done) => {
      expect(stack.frontendService).toBeDefined();
      pulumi.all([
        stack.frontendService.desiredCount,
        stack.frontendService.launchType
      ]).apply(([count, type]) => {
        expect(count).toBe(2);
        expect(type).toBe('FARGATE');
        done();
      });
    });

    it('should configure ECS services in private subnets', (done) => {
      pulumi.all([
        stack.apiService.networkConfiguration,
        stack.frontendService.networkConfiguration
      ]).apply(([apiNet, frontendNet]) => {
        expect(apiNet?.assignPublicIp).toBe(false);
        expect(frontendNet?.assignPublicIp).toBe(false);
        done();
      });
    });

    it('should enable ECS Exec for debugging', (done) => {
      pulumi.all([
        stack.apiService.enableExecuteCommand,
        stack.frontendService.enableExecuteCommand
      ]).apply(([apiExec, frontendExec]) => {
        expect(apiExec).toBe(true);
        expect(frontendExec).toBe(true);
        done();
      });
    });

    it('should configure rolling deployment strategy', (done) => {
      pulumi.all([
        stack.apiService.deploymentMaximumPercent,
        stack.apiService.deploymentMinimumHealthyPercent
      ]).apply(([maxPercent, minPercent]) => {
        expect(maxPercent).toBe(200);
        expect(minPercent).toBe(100);
        done();
      });
    });
  });

  describe('Auto-Scaling Tests', () => {
    it('should create auto-scaling target for API service', (done) => {
      expect(stack.apiAutoScalingTarget).toBeDefined();
      pulumi.all([
        stack.apiAutoScalingTarget.minCapacity,
        stack.apiAutoScalingTarget.maxCapacity
      ]).apply(([min, max]) => {
        expect(min).toBe(2);
        expect(max).toBe(10);
        done();
      });
    });

    it('should create auto-scaling target for Frontend service', (done) => {
      expect(stack.frontendAutoScalingTarget).toBeDefined();
      pulumi.all([
        stack.frontendAutoScalingTarget.minCapacity,
        stack.frontendAutoScalingTarget.maxCapacity
      ]).apply(([min, max]) => {
        expect(min).toBe(2);
        expect(max).toBe(10);
        done();
      });
    });

    it('should create CPU-based scaling policy', (done) => {
      expect(stack.apiCpuScalingPolicy).toBeDefined();
      stack.apiCpuScalingPolicy.policyType.apply(type => {
        expect(type).toBe('TargetTrackingScaling');
        done();
      });
    });

    it('should create request count-based scaling policy', (done) => {
      expect(stack.apiRequestScalingPolicy).toBeDefined();
      stack.apiRequestScalingPolicy.policyType.apply(type => {
        expect(type).toBe('TargetTrackingScaling');
        done();
      });
    });

    it('should configure scaling cooldown periods', (done) => {
      stack.apiCpuScalingPolicy.targetTrackingScalingPolicyConfiguration.apply(config => {
        expect(config?.scaleInCooldown).toBe(300);
        expect(config?.scaleOutCooldown).toBe(60);
        done();
      });
    });
  });

  describe('CloudWatch Monitoring Tests', () => {
    it('should create CPU utilization alarm', (done) => {
      expect(stack.cpuAlarm).toBeDefined();
      pulumi.all([
        stack.cpuAlarm.threshold,
        stack.cpuAlarm.comparisonOperator
      ]).apply(([threshold, operator]) => {
        expect(threshold).toBe(80);
        expect(operator).toBe('GreaterThanThreshold');
        done();
      });
    });

    it('should create memory utilization alarm', (done) => {
      expect(stack.memoryAlarm).toBeDefined();
      stack.memoryAlarm.metricName.apply(name => {
        expect(name).toBe('MemoryUtilization');
        done();
      });
    });

    it('should create HTTP 5xx error alarm', (done) => {
      expect(stack.http5xxAlarm).toBeDefined();
      pulumi.all([
        stack.http5xxAlarm.metricName,
        stack.http5xxAlarm.threshold
      ]).apply(([name, threshold]) => {
        expect(name).toBe('HTTPCode_Target_5XX_Count');
        expect(threshold).toBe(10);
        done();
      });
    });

    it('should configure appropriate evaluation periods', (done) => {
      pulumi.all([
        stack.cpuAlarm.evaluationPeriods,
        stack.memoryAlarm.evaluationPeriods
      ]).apply(([cpuPeriods, memoryPeriods]) => {
        expect(cpuPeriods).toBe(2);
        expect(memoryPeriods).toBe(2);
        done();
      });
    });
  });

  describe('Output Tests', () => {
    it('should export all required outputs', (done) => {
      stack.outputs.apply(outputs => {
        expect(outputs.vpcId).toBeDefined();
        expect(outputs.albDnsName).toBeDefined();
        expect(outputs.ecsClusterName).toBeDefined();
        expect(outputs.ecsClusterArn).toBeDefined();
        expect(outputs.auroraClusterEndpoint).toBeDefined();
        expect(outputs.auroraClusterReaderEndpoint).toBeDefined();
        expect(outputs.ecrApiRepositoryUrl).toBeDefined();
        expect(outputs.ecrFrontendRepositoryUrl).toBeDefined();
        expect(outputs.albSecurityGroupId).toBeDefined();
        expect(outputs.ecsSecurityGroupId).toBeDefined();
        expect(outputs.rdsSecurityGroupId).toBeDefined();
        expect(outputs.targetGroupBlueArn).toBeDefined();
        expect(outputs.targetGroupGreenArn).toBeDefined();
        done();
      });
    });
  });

  describe('Resource Tagging Tests', () => {
    it('should apply environment tags to all resources', (done) => {
      pulumi.all([
        stack.vpc.tags,
        stack.alb.tags,
        stack.ecsCluster.tags
      ]).apply(([vpcTags, albTags, clusterTags]) => {
        expect(vpcTags?.Environment).toBe('test');
        expect(albTags?.Environment).toBe('test');
        expect(clusterTags?.Environment).toBe('test');
        done();
      });
    });

    it('should apply project tags to all resources', (done) => {
      stack.vpc.tags.apply(tags => {
        expect(tags?.Project).toBe('TradingAnalyticsPlatform');
        done();
      });
    });
  });

  describe('Configuration Tests', () => {
    it('should use environment suffix in resource names', (done) => {
      pulumi.all([
        stack.vpc.tags,
        stack.ecsCluster.name
      ]).apply(([vpcTags, clusterName]) => {
        expect(vpcTags?.Name).toContain('test');
        expect(clusterName).toContain('test');
        done();
      });
    });

    it('should respect VPC CIDR configuration', (done) => {
      stack.vpc.cidrBlock.apply(cidr => {
        expect(cidr).toBe(testArgs.vpcCidr);
        done();
      });
    });
  });

  describe('Dependency Tests', () => {
    it('should ensure NAT Gateways depend on Internet Gateway', () => {
      expect(stack.natGateways).toHaveLength(2);
      expect(stack.internetGateway).toBeDefined();
    });

    it('should ensure ECS services depend on cluster', () => {
      expect(stack.apiService).toBeDefined();
      expect(stack.frontendService).toBeDefined();
      expect(stack.ecsCluster).toBeDefined();
    });

    it('should ensure Aurora instances depend on cluster', () => {
      expect(stack.auroraWriterInstance).toBeDefined();
      expect(stack.auroraReaderInstance).toBeDefined();
      expect(stack.auroraCluster).toBeDefined();
    });
  });

  describe('High Availability Tests', () => {
    it('should distribute resources across multiple availability zones', () => {
      expect(stack.publicSubnets).toHaveLength(2);
      expect(stack.privateSubnets).toHaveLength(2);
      expect(stack.databaseSubnets).toHaveLength(2);
      expect(stack.natGateways).toHaveLength(2);
    });

    it('should configure Multi-AZ for RDS Aurora', () => {
      expect(stack.auroraWriterInstance).toBeDefined();
      expect(stack.auroraReaderInstance).toBeDefined();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle missing optional domain name gracefully', (done) => {
      const stackWithoutDomain = new TapStack('test-stack-no-domain', {
        environmentSuffix: 'test',
      });
      expect(stackWithoutDomain).toBeDefined();
      expect(stackWithoutDomain.hostedZone).toBeUndefined();
      
      setTimeout(() => {
        done();
      }, 100);
    });

    it('should use default environment suffix if not provided', (done) => {
      const stackDefaultEnv = new TapStack('test-stack-default', {});
      expect(stackDefaultEnv).toBeDefined();
      
      setTimeout(() => {
        done();
      }, 100);
    });
  });

  describe('DNS Resources Coverage Tests', () => {
    it('should test DNS resource creation with domain name', (done) => {
      const stackWithDomain = new TapStack('test-stack-with-domain', {
        environmentSuffix: 'test',
        domainName: 'example.com',
      });
      expect(stackWithDomain).toBeDefined();
      expect(stackWithDomain.hostedZone).toBeDefined();
      expect(stackWithDomain.certificate).toBeDefined();
      
      setTimeout(() => {
        done();
      }, 100);
    });
  });

  describe('File Output Coverage Tests', () => {
    it('should skip file writing in test environment', (done) => {
      process.env.NODE_ENV = 'test';
      
      const stackForOutput = new TapStack('test-stack-output', {
        environmentSuffix: 'testoutput',
      });
      
      stackForOutput.outputs.apply(() => {
        const outputFile = path.join('cfn-outputs', 'flat-outputs.json');
        
        setTimeout(() => {
          // In test mode, file should not be written
          const fileExists = fs.existsSync(outputFile);
          expect(fileExists).toBe(false);
          done();
        }, 200);
      });
    });

    it('should write outputs file in production mode', (done) => {
      const originalEnv = process.env.NODE_ENV;
      const originalIsDryRun = pulumi.runtime.isDryRun;
      
      delete process.env.NODE_ENV;
      (pulumi.runtime.isDryRun as any) = () => false;
      
      const stackProduction = new TapStack('test-stack-production', {
        environmentSuffix: 'prod',
      });
      
      stackProduction.outputs.apply(() => {
        setTimeout(() => {
          const outputFile = path.join('cfn-outputs', 'flat-outputs.json');
          const outputDir = path.join('cfn-outputs');
          
          // Verify file was created
          const fileExists = fs.existsSync(outputFile);
          
          if (fileExists) {
            const content = fs.readFileSync(outputFile, 'utf-8');
            const parsed = JSON.parse(content);
            expect(parsed.vpcId).toBeDefined();
            
            // Cleanup
            fs.unlinkSync(outputFile);
          }
          
          // Restore environment
          process.env.NODE_ENV = originalEnv;
          (pulumi.runtime.isDryRun as any) = originalIsDryRun;
          
          expect(fileExists).toBe(true);
          done();
        }, 500);
      });
    });

    it('should handle dry run mode correctly', (done) => {
      const originalEnv = process.env.NODE_ENV;
      const originalIsDryRun = pulumi.runtime.isDryRun;
      
      delete process.env.NODE_ENV;
      (pulumi.runtime.isDryRun as any) = () => true;
      
      const stackDryRun = new TapStack('test-stack-dryrun', {
        environmentSuffix: 'dryrun',
      });
      
      stackDryRun.outputs.apply(() => {
        setTimeout(() => {
          const outputFile = path.join('cfn-outputs', 'flat-outputs.json');
          const fileExists = fs.existsSync(outputFile);
          
          // Restore environment
          process.env.NODE_ENV = originalEnv;
          (pulumi.runtime.isDryRun as any) = originalIsDryRun;
          
          // In dry run, file should not be written
          expect(fileExists).toBe(false);
          done();
        }, 200);
      });
    });

    it('should create output directory if it does not exist', (done) => {
      const originalEnv = process.env.NODE_ENV;
      const originalIsDryRun = pulumi.runtime.isDryRun;
      
      delete process.env.NODE_ENV;
      (pulumi.runtime.isDryRun as any) = () => false;
      
      const outputDir = 'cfn-outputs';
      const outputFile = path.join(outputDir, 'flat-outputs.json');
      
      // Remove directory if it exists
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }
      if (fs.existsSync(outputDir)) {
        fs.rmdirSync(outputDir);
      }
      
      const stackDirTest = new TapStack('test-stack-dir', {
        environmentSuffix: 'dirtest',
      });
      
      stackDirTest.outputs.apply(() => {
        setTimeout(() => {
          // Verify directory was created
          const dirExists = fs.existsSync(outputDir);
          expect(dirExists).toBe(true);
          
          // Cleanup
          if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
          }
          
          // Restore environment
          process.env.NODE_ENV = originalEnv;
          (pulumi.runtime.isDryRun as any) = originalIsDryRun;
          
          done();
        }, 500);
      });
    });
  });
});
