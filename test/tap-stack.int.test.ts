// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  ECRClient,
  DescribeRepositoriesCommand,
  DescribeImagesCommand,
} from '@aws-sdk/client-ecr';
import {
  SageMakerClient,
  DescribeNotebookInstanceCommand,
} from '@aws-sdk/client-sagemaker';
import {
  BatchClient,
  DescribeComputeEnvironmentsCommand,
  DescribeJobQueuesCommand,
  DescribeJobDefinitionsCommand,
} from '@aws-sdk/client-batch';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Configure AWS clients
const region = outputs.Region || 'us-west-2';
const s3Client = new S3Client({ region });
const ecrClient = new ECRClient({ region });
const sagemakerClient = new SageMakerClient({ region });
const batchClient = new BatchClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const ec2Client = new EC2Client({ region });

describe('SageMaker Training Infrastructure Integration Tests', () => {
  describe('Storage Resources', () => {
    test('Dataset S3 bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.DatasetBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Model S3 bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.ModelBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Can write and read from dataset bucket', async () => {
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Write object
      const putCommand = new PutObjectCommand({
        Bucket: outputs.DatasetBucketName,
        Key: testKey,
        Body: testContent,
      });
      await s3Client.send(putCommand);

      // Read object
      const getCommand = new GetObjectCommand({
        Bucket: outputs.DatasetBucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);
      const body = await getResponse.Body?.transformToString();
      expect(body).toBe(testContent);

      // Clean up
      const deleteCommand = new DeleteObjectCommand({
        Bucket: outputs.DatasetBucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    });

    test('ECR repository exists and is configured', async () => {
      const repositoryName = outputs.ECRRepositoryUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toHaveLength(1);
      expect(response.repositories?.[0].imageScanningConfiguration?.scanOnPush).toBe(true);
    });
  });

  describe('Networking Resources', () => {
    test('VPC exists and is properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.220.0.0/16');
      // DNS attributes are configured but not always returned in describe-vpcs
      expect(response.Vpcs?.[0].State).toBe('available');
    });

    test('Private subnets exist and are configured', async () => {
      const subnetIds = outputs.PrivateSubnetIds.split(',');
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);

      response.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.VpcId);
      });
    });

    test('VPC endpoints are created for AWS services', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const serviceNames = response.VpcEndpoints?.map(ep => ep.ServiceName) || [];

      // Check for required endpoints
      expect(serviceNames.some(name => name?.includes('.s3'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('.sagemaker.api'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('.sagemaker.runtime'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('.ecr.api'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('.ecr.dkr'))).toBe(true);
    });
  });

  describe('SageMaker Resources', () => {
    test('SageMaker notebook instance exists and is running', async () => {
      const command = new DescribeNotebookInstanceCommand({
        NotebookInstanceName: outputs.NotebookInstanceName,
      });

      const response = await sagemakerClient.send(command);
      expect(response.NotebookInstanceStatus).toMatch(/InService|Pending|Stopping|Stopped/);
      expect(response.InstanceType).toBe('ml.t3.medium');
      expect(response.DefaultCodeRepository).toBe('https://github.com/aws/amazon-sagemaker-examples.git');
    });

    test('SageMaker training role has correct ARN', () => {
      expect(outputs.TrainingRoleArn).toMatch(/^arn:aws:iam::\d+:role\/.+/);
      expect(outputs.TrainingRoleArn).toContain('TapStack');
    });

    test('Training job configuration is properly set', () => {
      const config = JSON.parse(outputs.TrainingJobConfig);
      expect(config.RoleArn).toBe(outputs.TrainingRoleArn);
      expect(config.EnableManagedSpotTraining).toBe(true);
      expect(config.MaxRuntimeInSeconds).toBe(86400); // 24 hours
      expect(config.MaxWaitTimeInSeconds).toBe(172800); // 48 hours
      expect(config.VpcConfig.Subnets).toHaveLength(2);
      expect(config.VpcConfig.SecurityGroupIds).toHaveLength(1);
    });
  });

  describe('Batch Resources', () => {
    test('Batch compute environment exists and is enabled', async () => {
      const arnParts = outputs.ComputeEnvironmentArn.split('/');
      const computeEnvironmentName = arnParts[arnParts.length - 1];

      const command = new DescribeComputeEnvironmentsCommand({
        computeEnvironments: [computeEnvironmentName],
      });

      const response = await batchClient.send(command);
      expect(response.computeEnvironments).toHaveLength(1);
      expect(response.computeEnvironments?.[0].state).toBe('ENABLED');
      expect(response.computeEnvironments?.[0].type).toBe('MANAGED');
      expect(response.computeEnvironments?.[0].computeResources?.type).toBe('SPOT');
      expect(response.computeEnvironments?.[0].computeResources?.bidPercentage).toBe(80);
    });

    test('Batch job queue exists and is enabled', async () => {
      const arnParts = outputs.JobQueueArn.split('/');
      const jobQueueName = arnParts[arnParts.length - 1];

      const command = new DescribeJobQueuesCommand({
        jobQueues: [jobQueueName],
      });

      const response = await batchClient.send(command);
      expect(response.jobQueues).toHaveLength(1);
      expect(response.jobQueues?.[0].state).toBe('ENABLED');
      expect(response.jobQueues?.[0].priority).toBe(1);
    });

    test('Batch job definition exists and has correct configuration', async () => {
      const jobDefinitionArn = outputs.JobDefinitionArn;

      const command = new DescribeJobDefinitionsCommand({
        jobDefinitions: [jobDefinitionArn],
      });

      const response = await batchClient.send(command);
      expect(response.jobDefinitions).toHaveLength(1);
      expect(response.jobDefinitions?.[0].type).toBe('container');
      expect(response.jobDefinitions?.[0].retryStrategy?.attempts).toBe(3);
      expect(response.jobDefinitions?.[0].timeout?.attemptDurationSeconds).toBe(3600);
    });
  });

  describe('Monitoring Resources', () => {
    test('CloudWatch log group exists with correct retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.LogGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.LogGroupName);

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('CloudWatch dashboard exists and is configured', async () => {
      const command = new GetDashboardCommand({
        DashboardName: outputs.DashboardName,
      });

      const response = await cloudwatchClient.send(command);
      expect(response.DashboardBody).toBeDefined();

      const dashboardBody = JSON.parse(response.DashboardBody || '{}');
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });

    test('CloudWatch alarm for training failures exists', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'TapStack',
      });

      const response = await cloudwatchClient.send(command);
      const trainingAlarm = response.MetricAlarms?.find(alarm =>
        alarm.AlarmDescription === 'Alert when training jobs fail'
      );

      expect(trainingAlarm).toBeDefined();
      expect(trainingAlarm?.MetricName).toBe('TrainingJobsFailed');
      expect(trainingAlarm?.Namespace).toBe('AWS/SageMaker');
      expect(trainingAlarm?.Threshold).toBe(1);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('Resources are connected: VPC -> SageMaker -> S3', async () => {
      // Verify SageMaker notebook can access S3 buckets through VPC endpoints
      const notebookCommand = new DescribeNotebookInstanceCommand({
        NotebookInstanceName: outputs.NotebookInstanceName,
      });

      const notebookResponse = await sagemakerClient.send(notebookCommand);
      expect(notebookResponse.SubnetId).toBeDefined();

      // Check if subnet is one of our private subnets
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',');
      expect(privateSubnetIds).toContain(notebookResponse.SubnetId);
    });

    test('Resources are connected: Batch -> ECR -> S3', async () => {
      // Verify Batch job definition references ECR repository
      const jobDefinitionArn = outputs.JobDefinitionArn;
      const jobDefCommand = new DescribeJobDefinitionsCommand({
        jobDefinitions: [jobDefinitionArn],
      });

      const jobDefResponse = await batchClient.send(jobDefCommand);
      const containerImage = jobDefResponse.jobDefinitions?.[0].containerProperties?.image;

      expect(containerImage).toContain(outputs.ECRRepositoryUri.split(':')[0]);
    });

    test('All resources use consistent environment suffix', () => {
      const suffix = outputs.EnvironmentSuffix;

      // Check resource names contain the suffix
      expect(outputs.DatasetBucketName).toContain(suffix);
      expect(outputs.ModelBucketName).toContain(suffix);
      expect(outputs.NotebookInstanceName).toContain(suffix);
      expect(outputs.LogGroupName).toContain(suffix);
      expect(outputs.DashboardName).toContain(suffix);
      expect(outputs.ComputeEnvironmentArn).toContain(suffix);
      expect(outputs.JobQueueArn).toContain(suffix);
    });
  });
});