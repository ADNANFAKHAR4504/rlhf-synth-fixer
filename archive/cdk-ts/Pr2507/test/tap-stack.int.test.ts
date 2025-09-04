// @ts-nocheck
import fs from 'fs';
import AWS from 'aws-sdk';
import https from 'https';
import { promisify } from 'util';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const codepipeline = new AWS.CodePipeline({
  region: process.env.AWS_REGION || 'us-east-1',
});
const codebuild = new AWS.CodeBuild({
  region: process.env.AWS_REGION || 'us-east-1',
});
const codedeploy = new AWS.CodeDeploy({
  region: process.env.AWS_REGION || 'us-east-1',
});
const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });
const sns = new AWS.SNS({ region: process.env.AWS_REGION || 'us-east-1' });
const ec2 = new AWS.EC2({ region: process.env.AWS_REGION || 'us-east-1' });
const lambda = new AWS.Lambda({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Helper function for HTTP requests
const httpsRequest = promisify(https.request);

describe('TAP CI/CD Pipeline Integration Tests', () => {
  describe('Infrastructure Validation', () => {
    test('VPC and networking infrastructure exists', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const vpcData = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpcData.Vpcs).toBeDefined();
      expect(vpcData.Vpcs).toHaveLength(1);
      expect(vpcData.Vpcs[0].State).toBe('available');

      // Validate subnets
      const subnetsData = await ec2
        .describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();
      expect(subnetsData.Subnets).toBeDefined();
      expect(subnetsData.Subnets.length).toBeGreaterThanOrEqual(4); // 2 AZs * 2 subnet types
    });

    test('Security Groups have proper rules', async () => {
      const vpcId = outputs.VpcId;
      const securityGroupsData = await ec2
        .describeSecurityGroups({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: ['*WebServer*'] },
          ],
        })
        .promise();

      expect(securityGroupsData.SecurityGroups).toBeDefined();
      expect(securityGroupsData.SecurityGroups.length).toBeGreaterThan(0);

      const webServerSG = securityGroupsData.SecurityGroups[0];
      const httpRule = webServerSG.IpPermissions.find(
        rule => rule.FromPort === 80
      );
      const httpsRule = webServerSG.IpPermissions.find(
        rule => rule.FromPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(
        httpRule.IpRanges.some(range => range.CidrIp === '0.0.0.0/0')
      ).toBe(true);
    });
  });

  describe('S3 Artifacts Bucket', () => {
    test('S3 bucket exists and is properly configured', async () => {
      const bucketName = outputs.ArtifactsBucketName;
      expect(bucketName).toBeDefined();

      // Test bucket exists
      const bucketLocation = await s3
        .getBucketLocation({ Bucket: bucketName })
        .promise();
      expect(bucketLocation).toBeDefined();

      // Test encryption
      const encryption = await s3
        .getBucketEncryption({ Bucket: bucketName })
        .promise();
      expect(encryption.ServerSideEncryptionConfiguration.Rules).toHaveLength(
        1
      );
      expect(
        encryption.ServerSideEncryptionConfiguration.Rules[0]
          .ApplyServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');

      // Test versioning
      const versioning = await s3
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(versioning.Status).toBe('Enabled');

      // Test public access block
      const publicAccess = await s3
        .getPublicAccessBlock({ Bucket: bucketName })
        .promise();
      expect(publicAccess.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(
        true
      );
      expect(
        publicAccess.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
    });

    test('S3 bucket lifecycle configuration', async () => {
      const bucketName = outputs.ArtifactsBucketName;

      const lifecycle = await s3
        .getBucketLifecycleConfiguration({ Bucket: bucketName })
        .promise();
      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].ID).toBe('DeleteOldArtifacts');
      expect(lifecycle.Rules[0].Expiration.Days).toBe(30);
      expect(
        lifecycle.Rules[0].NoncurrentVersionExpiration.NoncurrentDays
      ).toBe(7);
    });
  });

  describe('SNS Topic and Notifications', () => {
    test('SNS topic exists and is properly configured', async () => {
      const topicArn = outputs.NotificationTopicArn;
      expect(topicArn).toBeDefined();

      const topicAttributes = await sns
        .getTopicAttributes({ TopicArn: topicArn })
        .promise();
      expect(topicAttributes.Attributes.DisplayName).toContain(
        'TAP Pipeline Notifications'
      );

      // Test subscriptions
      const subscriptions = await sns
        .listSubscriptionsByTopic({ TopicArn: topicArn })
        .promise();
      expect(subscriptions.Subscriptions.length).toBeGreaterThan(0);
      expect(
        subscriptions.Subscriptions.some(sub => sub.Protocol === 'email')
      ).toBe(true);
    });

    test('SNS topic can publish messages', async () => {
      const topicArn = outputs.NotificationTopicArn;

      const publishResult = await sns
        .publish({
          TopicArn: topicArn,
          Message: JSON.stringify({
            test: 'Integration test message',
            timestamp: new Date().toISOString(),
          }),
          Subject: 'TAP Integration Test',
        })
        .promise();

      expect(publishResult.MessageId).toBeDefined();
    });
  });

  describe('CodeBuild Project', () => {
    test('CodeBuild project exists and is properly configured', async () => {
      const buildProjectArn = outputs.BuildProjectArn;
      expect(buildProjectArn).toBeDefined();

      const projectName = buildProjectArn.split('/').pop();
      const project = await codebuild
        .batchGetProjects({ names: [projectName] })
        .promise();

      expect(project.projects).toHaveLength(1);
      expect(project.projects[0].name).toContain('tap-build-project');
      expect(project.projects[0].environment.type).toBe('LINUX_CONTAINER');
      expect(project.projects[0].environment.computeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
      expect(project.projects[0].environment.image).toBe(
        'aws/codebuild/standard:5.0'
      );
      expect(project.projects[0].environment.privilegedMode).toBe(false);
    });

    test('CodeBuild project has proper IAM permissions', async () => {
      const buildProjectArn = outputs.BuildProjectArn;
      const projectName = buildProjectArn.split('/').pop();
      const project = await codebuild
        .batchGetProjects({ names: [projectName] })
        .promise();

      expect(project.projects[0].serviceRole).toBeDefined();
      expect(project.projects[0].artifacts.type).toBe('S3');
    });
  });

  describe('EC2 Auto Scaling Group', () => {
    test('Auto Scaling Group exists with proper configuration', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();

      const autoscaling = new AWS.AutoScaling({
        region: process.env.AWS_REGION || 'us-east-1',
      });
      const asgData = await autoscaling
        .describeAutoScalingGroups({
          AutoScalingGroupNames: [asgName],
        })
        .promise();

      expect(asgData.AutoScalingGroups).toHaveLength(1);
      const asg = asgData.AutoScalingGroups[0];

      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(4);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('EC2');
    });

    test('EC2 instances are properly tagged', async () => {
      const asgName = outputs.AutoScalingGroupName;

      const autoscaling = new AWS.AutoScaling({
        region: process.env.AWS_REGION || 'us-east-1',
      });
      const asgData = await autoscaling
        .describeAutoScalingGroups({
          AutoScalingGroupNames: [asgName],
        })
        .promise();

      const asg = asgData.AutoScalingGroups[0];
      const tags = asg.Tags;

      expect(
        tags.some(
          tag => tag.Key === 'Environment' && tag.Value === 'Production'
        )
      ).toBe(true);
      expect(
        tags.some(tag => tag.Key === 'Application' && tag.Value === 'TAP')
      ).toBe(true);
    });
  });

  describe('Lambda Function for Boto3 Integration', () => {
    test('Lambda function exists and is properly configured', async () => {
      const lambdaArn = outputs.Boto3LambdaArn;
      expect(lambdaArn).toBeDefined();

      const functionName = lambdaArn.split(':').pop();
      const lambdaFunction = await lambda
        .getFunction({ FunctionName: functionName })
        .promise();

      expect(lambdaFunction.Configuration.Runtime).toBe('python3.9');
      expect(lambdaFunction.Configuration.Handler).toBe('index.handler');
      expect(lambdaFunction.Configuration.Timeout).toBe(300);
    });

    test('Lambda function can be invoked successfully', async () => {
      const lambdaArn = outputs.Boto3LambdaArn;
      const functionName = lambdaArn.split(':').pop();
      const topicArn = outputs.NotificationTopicArn;

      const invocation = await lambda
        .invoke({
          FunctionName: functionName,
          Payload: JSON.stringify({
            pipeline_name: 'tap-pipeline',
            topic_arn: topicArn,
          }),
        })
        .promise();

      expect(invocation.StatusCode).toBe(200);

      const response = JSON.parse(invocation.Payload.toString());
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Boto3 integration successful');
      expect(body.pipeline).toBe('tap-pipeline');
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('Pipeline artifacts bucket can store and retrieve build outputs', async () => {
      const bucketName = outputs.ArtifactsBucketName;
      const testKey = `test-artifacts/${Date.now()}/test-file.zip`;
      const testContent = Buffer.from(
        'Test artifact content for integration testing'
      );

      // Upload test artifact
      await s3
        .putObject({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ServerSideEncryption: 'AES256',
        })
        .promise();

      // Retrieve and verify
      const retrievedObject = await s3
        .getObject({
          Bucket: bucketName,
          Key: testKey,
        })
        .promise();

      expect(retrievedObject.Body).toEqual(testContent);
      expect(retrievedObject.ServerSideEncryption).toBe('AES256');

      // Cleanup
      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: testKey,
        })
        .promise();
    });

    test('Notification system integration works end-to-end', async () => {
      const topicArn = outputs.NotificationTopicArn;
      const lambdaArn = outputs.Boto3LambdaArn;
      const functionName = lambdaArn.split(':').pop();

      // Test Lambda → SNS integration
      const result = await lambda
        .invoke({
          FunctionName: functionName,
          Payload: JSON.stringify({
            pipeline_name: 'tap-pipeline-integration-test',
            topic_arn: topicArn,
            test_mode: true,
          }),
        })
        .promise();

      expect(result.StatusCode).toBe(200);

      const response = JSON.parse(result.Payload.toString());
      expect(response.statusCode).toBe(200);
    });

    test('Security configurations are properly enforced', async () => {
      const bucketName = outputs.ArtifactsBucketName;
      const vpcId = outputs.VpcId;

      // Test S3 bucket public access is blocked
      try {
        await s3
          .putBucketAcl({
            Bucket: bucketName,
            ACL: 'public-read',
          })
          .promise();
        fail('Should not be able to set public ACL');
      } catch (error: any) {
        expect(error.code).toBe('AccessDenied');
      }

      // Test VPC has private subnets
      const subnets = await ec2
        .describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      const privateSubnets = subnets.Subnets.filter(
        subnet =>
          !subnet.MapPublicIpOnLaunch &&
          subnet.Tags?.some(
            tag => tag.Key === 'Name' && tag.Value.includes('Private')
          )
      );

      expect(privateSubnets.length).toBeGreaterThan(0);
    });
  });
});
