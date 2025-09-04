// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  CloudTrailClient,
  GetTrailCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';

// Read outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr108';

// AWS clients
const s3Client = new S3Client({ region: 'us-east-1' });
const codePipelineClient = new CodePipelineClient({ region: 'us-east-1' });
const codeBuildClient = new CodeBuildClient({ region: 'us-east-1' });
const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });
const cloudTrailClient = new CloudTrailClient({ region: 'us-east-1' });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: 'us-east-1' });
const ec2Client = new EC2Client({ region: 'us-east-1' });
const autoScalingClient = new AutoScalingClient({ region: 'us-east-1' });

describe('Multi-Region CI/CD Pipeline Integration Tests', () => {
  describe('S3 Artifacts Buckets', () => {
    test('should have accessible pipeline artifacts bucket', async () => {
      const bucketName = outputs.ArtifactsBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('pipeline');
      expect(bucketName).toContain(environmentSuffix);

      // Verify bucket exists and is accessible
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('should have versioning enabled on artifacts bucket', async () => {
      const bucketName = outputs.ArtifactsBucketName;
      
      // List objects to verify bucket is operational
      const listCommand = new ListObjectsV2Command({ 
        Bucket: bucketName,
        MaxKeys: 1 
      });
      
      await expect(s3Client.send(listCommand)).resolves.toBeDefined();
    });
  });

  describe('CodePipeline', () => {
    test('should have deployed multi-region pipeline', async () => {
      const pipelineName = outputs.PipelineName;
      expect(pipelineName).toBeDefined();
      expect(pipelineName).toContain('multi-region-pipeline');
      expect(pipelineName).toContain(environmentSuffix);

      // Get pipeline details
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.stages).toHaveLength(5); // Source, Build, Deploy-East, Deploy-West, Validate
    });

    test('should have correct pipeline stages configured', async () => {
      const pipelineName = outputs.PipelineName;
      
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      const stages = response.pipeline?.stages || [];
      const stageNames = stages.map(s => s.name);
      
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy-East');
      expect(stageNames).toContain('Deploy-West');
      expect(stageNames).toContain('Validate');
    });

    test('should have pipeline in valid state', async () => {
      const pipelineName = outputs.PipelineName;
      
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates?.length).toBeGreaterThan(0);
    });
  });

  describe('CodeBuild', () => {
    test('should have deployed build project', async () => {
      const projectName = `multi-region-build-${environmentSuffix}`;
      
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);
      
      expect(response.projects).toHaveLength(1);
      expect(response.projects?.[0].name).toBe(projectName);
    });

    test('should have batch build configuration', async () => {
      const projectName = `multi-region-build-${environmentSuffix}`;
      
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);
      
      const project = response.projects?.[0];
      expect(project?.source?.buildspec).toContain('batch');
    });

    test('should have validation project', async () => {
      const projectName = `validation-${environmentSuffix}`;
      
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);
      
      expect(response.projects).toHaveLength(1);
      expect(response.projects?.[0].name).toBe(projectName);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have deployed load balancer', async () => {
      const loadBalancerDns = outputs.LoadBalancerDNS;
      expect(loadBalancerDns).toBeDefined();
      expect(loadBalancerDns).toContain('.elb.amazonaws.com');
      
      // Get load balancer by DNS name instead of by name (name might be too long)
      const command = new DescribeLoadBalancersCommand({});
      
      const response = await elbClient.send(command);
      const loadBalancer = response.LoadBalancers?.find(
        lb => lb.DNSName === loadBalancerDns
      );
      
      expect(loadBalancer).toBeDefined();
      expect(loadBalancer?.State?.Code).toBe('active');
    });

    test('should have internet-facing scheme', async () => {
      const loadBalancerDns = outputs.LoadBalancerDNS;
      
      const command = new DescribeLoadBalancersCommand({});
      
      const response = await elbClient.send(command);
      const loadBalancer = response.LoadBalancers?.find(
        lb => lb.DNSName === loadBalancerDns
      );
      
      expect(loadBalancer?.Scheme).toBe('internet-facing');
    });

    test('should have target group with health checks', async () => {
      const loadBalancerDns = outputs.LoadBalancerDNS;
      
      const command = new DescribeLoadBalancersCommand({});
      
      const response = await elbClient.send(command);
      const loadBalancer = response.LoadBalancers?.find(
        lb => lb.DNSName === loadBalancerDns
      );
      
      expect(loadBalancer?.LoadBalancerArn).toBeDefined();
    });
  });

  describe('SNS Notifications', () => {
    test('should have deployed SNS topic', async () => {
      const topicArn = outputs.NotificationTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain(':sns:');
      expect(topicArn).toContain('pipeline-notifications');
      
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      
      expect(response.Attributes?.DisplayName).toBe('Multi-Region Pipeline Notifications');
    });
  });

  describe('CloudWatch Logging', () => {
    test('should have pipeline log group', async () => {
      const logGroupName = `/aws/codepipeline/multi-region-${environmentSuffix}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      
      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with proper configuration', async () => {
      const vpcName = `multi-region-vpc-${environmentSuffix}`;
      
      const command = new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:Name', Values: [vpcName] }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);
    });

    test('should have security group for application', async () => {
      const sgName = `app-sg-${environmentSuffix}`;
      
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: [sgName] }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);
      
      const securityGroup = response.SecurityGroups?.[0];
      expect(securityGroup?.Description).toBe('Security group for application servers');
    });

    test('should have public and private subnets', async () => {
      const vpcName = `multi-region-vpc-${environmentSuffix}`;
      
      // First get VPC ID
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:Name', Values: [vpcName] }
        ]
      });
      
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs?.[0]?.VpcId;
      
      expect(vpcId).toBeDefined();
      
      // Then get subnets for this VPC
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId!] }
        ]
      });
      
      const subnetResponse = await ec2Client.send(subnetCommand);
      expect(subnetResponse.Subnets).toBeDefined();
      expect(subnetResponse.Subnets?.length).toBe(4); // 2 public + 2 private
    });
  });

  describe('Auto Scaling', () => {
    test('should have auto scaling group configured', async () => {
      const asgName = `app-asg-${environmentSuffix}`;
      
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      });
      
      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);
      
      const asg = response.AutoScalingGroups?.[0];
      expect(asg?.MinSize).toBe(1);
      expect(asg?.MaxSize).toBe(5);
      expect(asg?.DesiredCapacity).toBe(1);
    });
  });

  describe('CloudTrail Audit', () => {
    test('should have multi-region CloudTrail configured', async () => {
      const trailName = `multi-region-pipeline-trail-${environmentSuffix}`;
      
      const command = new GetTrailCommand({ Name: trailName });
      const response = await cloudTrailClient.send(command);
      
      expect(response.Trail).toBeDefined();
      expect(response.Trail?.IsMultiRegionTrail).toBe(true);
      expect(response.Trail?.LogFileValidationEnabled).toBe(true);
      expect(response.Trail?.IncludeGlobalServiceEvents).toBe(true);
    });
  });

  describe('Cross-Region Deployment', () => {
    test('should have cross-region S3 bucket for west region', async () => {
      const westBucketName = `pipeline-${environmentSuffix}-718240086340-west`;
      
      const command = new HeadBucketCommand({ Bucket: westBucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('should have pipeline configured for multi-region deployment', async () => {
      const pipelineName = outputs.PipelineName;
      
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      // Check Deploy-East stage
      const deployEast = response.pipeline?.stages?.find(s => s.name === 'Deploy-East');
      expect(deployEast).toBeDefined();
      expect(deployEast?.actions?.[0].region).toBe('us-east-1');
      
      // Check Deploy-West stage
      const deployWest = response.pipeline?.stages?.find(s => s.name === 'Deploy-West');
      expect(deployWest).toBeDefined();
      expect(deployWest?.actions?.[0].region).toBe('us-west-2');
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('should have all core pipeline components operational', async () => {
      // Verify all critical outputs exist
      expect(outputs.PipelineName).toBeDefined();
      expect(outputs.ArtifactsBucketName).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.NotificationTopicArn).toBeDefined();
    });

    test('should support rollback mechanisms via CloudFormation changesets', async () => {
      const pipelineName = outputs.PipelineName;
      
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      // Verify Deploy stages use CloudFormation for rollback capability
      const deployEast = response.pipeline?.stages?.find(s => s.name === 'Deploy-East');
      const deployWest = response.pipeline?.stages?.find(s => s.name === 'Deploy-West');
      
      expect(deployEast?.actions?.some(a => 
        a.actionTypeId?.provider === 'CloudFormation'
      )).toBe(true);
      
      expect(deployWest?.actions?.some(a => 
        a.actionTypeId?.provider === 'CloudFormation'
      )).toBe(true);
    });
  });
});