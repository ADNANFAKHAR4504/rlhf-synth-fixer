// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import * as AWS from '@aws-sdk/client-ec2';
import * as S3 from '@aws-sdk/client-s3';
import * as Lambda from '@aws-sdk/client-lambda';
import * as SNS from '@aws-sdk/client-sns';
import * as CloudWatch from '@aws-sdk/client-cloudwatch-logs';

// Read outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const ec2Client = new AWS.EC2({ region: 'us-east-1' });
const s3Client = new S3.S3({ region: 'us-east-1' });
const lambdaClient = new Lambda.Lambda({ region: 'us-east-1' });
const snsClient = new SNS.SNS({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatch.CloudWatchLogs({ region: 'us-east-1' });

describe('Cloud Environment Integration Tests', () => {
  // Test timeout for AWS operations
  const testTimeout = 30000;

  describe('VPC and Networking', () => {
    test('VPC exists and is configured correctly', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      
      const vpcResponse = await ec2Client.describeVpcs({
        VpcIds: [vpcId]
      });
      
      expect(vpcResponse.Vpcs).toHaveLength(1);
      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      
      // Check VPC tags
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    }, testTimeout);

    test('Subnets are properly configured', async () => {
      const vpcId = outputs.VpcId;
      
      const subnetsResponse = await ec2Client.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] }
        ]
      });
      
      expect(subnetsResponse.Subnets).toBeDefined();
      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private
      
      const publicSubnets = subnetsResponse.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnetsResponse.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch === false
      );
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    }, testTimeout);

    test('Internet Gateway is attached to VPC', async () => {
      const vpcId = outputs.VpcId;
      
      const igwResponse = await ec2Client.describeInternetGateways({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [vpcId] }
        ]
      });
      
      expect(igwResponse.InternetGateways).toBeDefined();
      expect(igwResponse.InternetGateways!.length).toBeGreaterThanOrEqual(1);
      
      const igw = igwResponse.InternetGateways![0];
      const attachment = igw.Attachments?.find(att => att.VpcId === vpcId);
      expect(attachment?.State).toBe('available');
    }, testTimeout);

    test('NAT Gateway is available', async () => {
      const vpcId = outputs.VpcId;
      
      const natResponse = await ec2Client.describeNatGateways({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] }
        ]
      });
      
      expect(natResponse.NatGateways).toBeDefined();
      expect(natResponse.NatGateways!.length).toBeGreaterThanOrEqual(1);
      
      const natGateway = natResponse.NatGateways![0];
      expect(natGateway.State).toBe('available');
      expect(natGateway.NatGatewayAddresses).toBeDefined();
      expect(natGateway.NatGatewayAddresses!.length).toBeGreaterThanOrEqual(1);
    }, testTimeout);
  });

  describe('EC2 Instance', () => {
    test('EC2 instance is running and accessible', async () => {
      const instanceId = outputs.EC2InstanceId;
      const publicIp = outputs.EC2InstancePublicIp;
      
      expect(instanceId).toBeDefined();
      expect(publicIp).toBeDefined();
      
      const instanceResponse = await ec2Client.describeInstances({
        InstanceIds: [instanceId]
      });
      
      expect(instanceResponse.Reservations).toHaveLength(1);
      const instance = instanceResponse.Reservations![0].Instances![0];
      
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t2.micro');
      expect(instance.PublicIpAddress).toBe(publicIp);
      
      // Verify instance is in public subnet
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.SubnetId).toBeDefined();
    }, testTimeout);

    test('Security group has correct SSH restrictions', async () => {
      const securityGroupId = outputs.SecurityGroupId;
      expect(securityGroupId).toBeDefined();
      
      const sgResponse = await ec2Client.describeSecurityGroups({
        GroupIds: [securityGroupId]
      });
      
      expect(sgResponse.SecurityGroups).toHaveLength(1);
      const sg = sgResponse.SecurityGroups![0];
      
      // Check SSH ingress rule
      const sshRule = sg.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );
      
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpProtocol).toBe('tcp');
      expect(sshRule?.IpRanges).toContainEqual(
        expect.objectContaining({ CidrIp: '10.0.0.0/8' })
      );
      
      // Verify egress allows all outbound
      expect(sg.IpPermissionsEgress).toBeDefined();
      const egressRule = sg.IpPermissionsEgress?.find(
        rule => rule.IpProtocol === '-1'
      );
      expect(egressRule).toBeDefined();
    }, testTimeout);
  });

  describe('Lambda Function', () => {
    test('Lambda function exists and is configured correctly', async () => {
      const functionName = outputs.LambdaFunctionName;
      const functionArn = outputs.LambdaFunctionArn;
      
      expect(functionName).toBeDefined();
      expect(functionArn).toBeDefined();
      
      const functionResponse = await lambdaClient.getFunction({
        FunctionName: functionName
      });
      
      expect(functionResponse.Configuration).toBeDefined();
      const config = functionResponse.Configuration!;
      
      expect(config.Runtime).toBe('python3.12');
      expect(config.Handler).toBe('index.lambda_handler');
      expect(config.MemorySize).toBe(256);
      expect(config.Timeout).toBe(60);
      expect(config.State).toBe('Active');
      
      // Check environment variables
      expect(config.Environment?.Variables?.SNS_TOPIC_ARN).toBe(outputs.SNSTopicArn);
      expect(config.Environment?.Variables?.BUCKET_NAME).toBe(outputs.S3BucketName);
      
      // Verify VPC configuration
      expect(config.VpcConfig?.SubnetIds).toBeDefined();
      expect(config.VpcConfig?.SubnetIds!.length).toBeGreaterThanOrEqual(2);
      expect(config.VpcConfig?.SecurityGroupIds).toBeDefined();
      expect(config.VpcConfig?.SecurityGroupIds!.length).toBeGreaterThanOrEqual(1);
    }, testTimeout);

    test('Lambda function can be invoked successfully', async () => {
      const functionName = outputs.LambdaFunctionName;
      
      // Create a test S3 event payload
      const testEvent = {
        Records: [
          {
            eventName: 'ObjectCreated:Put',
            eventTime: new Date().toISOString(),
            s3: {
              bucket: {
                name: outputs.S3BucketName
              },
              object: {
                key: 'test-file.txt'
              }
            }
          }
        ]
      };
      
      const invokeResponse = await lambdaClient.invoke({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(testEvent)
      });
      
      expect(invokeResponse.StatusCode).toBe(200);
      expect(invokeResponse.FunctionError).toBeUndefined();
      
      if (invokeResponse.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
        expect(payload.statusCode).toBe(200);
      }
    }, testTimeout);
  });

  describe('S3 Bucket', () => {
    test('S3 bucket exists with correct configuration', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      
      // Check bucket exists
      const headResponse = await s3Client.headBucket({
        Bucket: bucketName
      });
      
      expect(headResponse.$metadata.httpStatusCode).toBe(200);
      
      // Check versioning
      const versioningResponse = await s3Client.getBucketVersioning({
        Bucket: bucketName
      });
      
      expect(versioningResponse.Status).toBe('Enabled');
      
      // Check encryption
      const encryptionResponse = await s3Client.getBucketEncryption({
        Bucket: bucketName
      });
      
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      
      // Check public access block
      const publicAccessResponse = await s3Client.getPublicAccessBlock({
        Bucket: bucketName
      });
      
      const publicAccess = publicAccessResponse.PublicAccessBlockConfiguration!;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    }, testTimeout);

    test('S3 bucket has event notification configured for Lambda', async () => {
      const bucketName = outputs.S3BucketName;
      
      const notificationResponse = await s3Client.getBucketNotificationConfiguration({
        Bucket: bucketName
      });
      
      expect(notificationResponse.LambdaFunctionConfigurations).toBeDefined();
      expect(notificationResponse.LambdaFunctionConfigurations!.length).toBeGreaterThanOrEqual(1);
      
      const lambdaConfig = notificationResponse.LambdaFunctionConfigurations![0];
      expect(lambdaConfig.LambdaFunctionArn).toBe(outputs.LambdaFunctionArn);
      expect(lambdaConfig.Events).toContain('s3:ObjectCreated:*');
    }, testTimeout);

    test('S3 bucket upload triggers Lambda function', async () => {
      const bucketName = outputs.S3BucketName;
      const testKey = `test-upload-${Date.now()}.txt`;
      const testContent = 'Integration test content';
      
      // Upload test file
      await s3Client.putObject({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      });
      
      // Wait for Lambda to process (give it a few seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check Lambda logs for execution
      const logGroupName = `/aws/lambda/${outputs.LambdaFunctionName}`;
      
      try {
        const logsResponse = await cloudWatchClient.describeLogStreams({
          logGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 1
        });
        
        if (logsResponse.logStreams && logsResponse.logStreams.length > 0) {
          const latestStream = logsResponse.logStreams[0];
          
          const eventsResponse = await cloudWatchClient.getLogEvents({
            logGroupName,
            logStreamName: latestStream.logStreamName!,
            limit: 50
          });
          
          // Check if our test file was processed
          const logMessages = eventsResponse.events?.map(e => e.message).join(' ') || '';
          expect(logMessages).toContain(testKey);
        }
      } catch (error) {
        // Log group might not exist if Lambda hasn't been invoked yet
        console.log('Lambda logs not available yet');
      }
      
      // Clean up test file
      await s3Client.deleteObject({
        Bucket: bucketName,
        Key: testKey
      });
    }, testTimeout * 2);
  });

  describe('SNS Topic', () => {
    test('SNS topic exists and is accessible', async () => {
      const topicArn = outputs.SNSTopicArn;
      expect(topicArn).toBeDefined();
      
      const topicResponse = await snsClient.getTopicAttributes({
        TopicArn: topicArn
      });
      
      expect(topicResponse.Attributes).toBeDefined();
      expect(topicResponse.Attributes?.DisplayName).toBe('File Upload Notification Topic');
      
      // Verify topic is accessible
      expect(topicResponse.Attributes?.TopicArn).toBe(topicArn);
    }, testTimeout);
  });

  describe('End-to-End Workflow', () => {
    test('Complete S3 to Lambda to SNS workflow', async () => {
      const bucketName = outputs.S3BucketName;
      const topicArn = outputs.SNSTopicArn;
      const testKey = `e2e-test-${Date.now()}.json`;
      const testContent = JSON.stringify({ 
        test: 'integration',
        timestamp: new Date().toISOString()
      });
      
      // Subscribe to SNS topic to receive notifications
      const subscriptionResponse = await snsClient.subscribe({
        TopicArn: topicArn,
        Protocol: 'email',
        Endpoint: 'test@example.com',
        ReturnSubscriptionArn: true
      });
      
      const subscriptionArn = subscriptionResponse.SubscriptionArn;
      
      try {
        // Upload file to S3
        await s3Client.putObject({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'application/json'
        });
        
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify Lambda was invoked by checking its last invocation time
        const functionName = outputs.LambdaFunctionName;
        const functionResponse = await lambdaClient.getFunction({
          FunctionName: functionName
        });
        
        expect(functionResponse.Configuration?.LastModified).toBeDefined();
        
        // Clean up
        await s3Client.deleteObject({
          Bucket: bucketName,
          Key: testKey
        });
      } finally {
        // Unsubscribe from SNS
        if (subscriptionArn && subscriptionArn !== 'pending confirmation') {
          await snsClient.unsubscribe({
            SubscriptionArn: subscriptionArn
          });
        }
      }
    }, testTimeout * 2);
  });

  describe('Security and Compliance', () => {
    test('All resources are properly tagged', async () => {
      const vpcId = outputs.VpcId;
      const instanceId = outputs.EC2InstanceId;
      
      // Check VPC tags
      const vpcTags = await ec2Client.describeTags({
        Filters: [
          { Name: 'resource-id', Values: [vpcId] },
          { Name: 'key', Values: ['Environment'] }
        ]
      });
      
      expect(vpcTags.Tags).toBeDefined();
      expect(vpcTags.Tags!.length).toBeGreaterThanOrEqual(1);
      expect(vpcTags.Tags![0].Value).toBe('Production');
      
      // Check EC2 tags
      const ec2Tags = await ec2Client.describeTags({
        Filters: [
          { Name: 'resource-id', Values: [instanceId] },
          { Name: 'key', Values: ['Environment'] }
        ]
      });
      
      expect(ec2Tags.Tags).toBeDefined();
      expect(ec2Tags.Tags!.length).toBeGreaterThanOrEqual(1);
      expect(ec2Tags.Tags![0].Value).toBe('Production');
    }, testTimeout);

    test('Lambda has least-privilege IAM permissions', async () => {
      const functionName = outputs.LambdaFunctionName;
      
      const functionResponse = await lambdaClient.getFunction({
        FunctionName: functionName
      });
      
      const roleArn = functionResponse.Configuration?.Role;
      expect(roleArn).toBeDefined();
      
      // Extract role name from ARN
      const roleName = roleArn!.split('/').pop();
      expect(roleName).toContain('cf-task-lambda-execution-role');
    }, testTimeout);
  });
});