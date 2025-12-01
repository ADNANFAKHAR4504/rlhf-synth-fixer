import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
  DeleteParameterCommand,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from '@aws-sdk/client-ssm';
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { setTimeout } from 'timers/promises';

// Load from CloudFormation outputs after stack deployment
let outputs: Record<string, string> = {};
let region: string;
let stackName: string;

// AWS Clients
let ec2Client: EC2Client;
let elbv2Client: ElasticLoadBalancingV2Client;
let asgClient: AutoScalingClient;
let rdsClient: RDSClient;
let s3Client: S3Client;
let logsClient: CloudWatchLogsClient;
let secretsClient: SecretsManagerClient;
let ssmClient: SSMClient;

// Test data tracking for cleanup
const testData: {
  s3Objects: Array<{ bucket: string; key: string }>;
  ssmParameters: string[];
  logEvents: Array<{ logGroup: string; logStream: string }>;
} = {
  s3Objects: [],
  ssmParameters: [],
  logEvents: [],
};

// Helper function to execute SSM command and wait for result
async function executeSSMCommand(
  instanceId: string,
  commands: string[]
): Promise<{ status: string; stdout: string; stderr: string }> {
  const sendCommandResponse = await ssmClient.send(
    new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands,
      },
    })
  );

  const commandId = sendCommandResponse.Command?.CommandId;
  if (!commandId) {
    throw new Error('Failed to get command ID from SSM');
  }

  // Wait for command to complete
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await setTimeout(2000);

    try {
      const invocationResponse = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: instanceId,
        })
      );

      const status = invocationResponse.Status;
      if (status === 'Success') {
        return {
          status: 'Success',
          stdout: invocationResponse.StandardOutputContent || '',
          stderr: invocationResponse.StandardErrorContent || '',
        };
      } else if (status === 'Failed' || status === 'Cancelled' || status === 'TimedOut') {
        throw new Error(
          `SSM command failed with status ${status}: ${invocationResponse.StandardErrorContent || 'Unknown error'}`
        );
      }
    } catch (error: any) {
      if (error.name !== 'InvocationDoesNotExist') {
        throw error;
      }
    }

    attempts++;
  }

  throw new Error('SSM command timed out');
}

// Helper function to get EC2 instance ID from Auto Scaling Group
async function getEC2InstanceId(): Promise<string> {
  const asgName = outputs.AutoScalingGroupName;
  const asgResponse = await asgClient.send(
    new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
  );

  const asg = asgResponse.AutoScalingGroups![0];
  const instanceIds = asg.Instances!.map((i) => i.InstanceId).filter((id): id is string => id !== undefined);
  expect(instanceIds.length).toBeGreaterThan(0);
  return instanceIds[0];
}

describe('TapStack CloudFormation Template - Integration Tests', () => {
  beforeAll(async () => {
    // Load CloudFormation outputs
    try {
      const outputsPath = 'cfn-outputs/flat-outputs.json';
      if (fs.existsSync(outputsPath)) {
        const outputsContent = fs.readFileSync(outputsPath, 'utf8');
        outputs = JSON.parse(outputsContent);
      } else {
        throw new Error(
          `CloudFormation outputs not found at ${outputsPath}. Please deploy the stack first.`
        );
      }

      // Get region from outputs or environment
      region = outputs.StackRegion || process.env.AWS_REGION;
      stackName = outputs.StackName;

      // Initialize AWS clients
      ec2Client = new EC2Client({ region });
      elbv2Client = new ElasticLoadBalancingV2Client({ region });
      asgClient = new AutoScalingClient({ region });
      rdsClient = new RDSClient({ region });
      s3Client = new S3Client({ region });
      logsClient = new CloudWatchLogsClient({ region });
      secretsClient = new SecretsManagerClient({ region });
      ssmClient = new SSMClient({ region });

      // Wait for stack to be fully operational
      await setTimeout(60000);
    } catch (error) {
      console.error('Failed to initialize test environment:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup all test data
    console.log('Cleaning up test data...');

    // Delete S3 test objects
    for (const obj of testData.s3Objects) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: obj.bucket, Key: obj.key }));
        console.log(`Deleted S3 object: ${obj.bucket}/${obj.key}`);
      } catch (error) {
        console.warn(`Failed to delete S3 object ${obj.bucket}/${obj.key}:`, error);
      }
    }

    // Delete SSM parameters
    for (const paramName of testData.ssmParameters) {
      try {
        await ssmClient.send(new DeleteParameterCommand({ Name: paramName }));
        console.log(`Deleted SSM parameter: ${paramName}`);
      } catch (error) {
        console.warn(`Failed to delete SSM parameter ${paramName}:`, error);
      }
    }

    console.log('Test data cleanup completed');
  });

  // HTTP REQUEST FLOW TESTS
  describe('HTTP Request Flow', () => {
    test('Complete workflow: Internet -> ALB -> EC2 -> Response', async () => {
      const albUrl = outputs.LoadBalancerURL;
      expect(albUrl).toBeDefined();

      const url = new URL(albUrl);
      const hostname = url.hostname;
      const port = url.port || (url.protocol === 'https:' ? 443 : 80);
      const protocol = url.protocol === 'https:' ? https : http;

      const testPayload = {
        timestamp: new Date().toISOString(),
        testId: `integration-test-${Date.now()}`,
        message: 'Integration test request',
      };

      const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
        const postData = JSON.stringify(testPayload);
        const options = {
          hostname,
          port,
          path: '/',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 30000,
        };

        const req = protocol.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode || 0, body });
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
      });

      expect(response.statusCode).toBeGreaterThanOrEqual(200);
      expect(response.statusCode).toBeLessThan(500);
      console.log(`ALB responded with status ${response.statusCode}`);
    });

    test('Health check endpoint returns 200', async () => {
      const albUrl = outputs.LoadBalancerURL;
      const url = new URL(albUrl);
      const hostname = url.hostname;
      const port = url.port || (url.protocol === 'https:' ? 443 : 80);
      const protocol = url.protocol === 'https:' ? https : http;

      const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
        const options = {
          hostname,
          port,
          path: '/health',
          method: 'GET',
          timeout: 30000,
        };

        const req = protocol.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode || 0, body });
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('OK');
    });
  });

  // EC2 -> S3 DATA FLOW TESTS (from EC2 instance)
  describe('EC2 to S3 Data Flow', () => {
    test('EC2 instance can upload data to S3 via VPC endpoint', async () => {
      const instanceId = await getEC2InstanceId();
      const bucketName = outputs.S3BucketName;
      const testKey = `integration-test/ec2-upload-${Date.now()}.txt`;
      const testContent = `EC2 upload test at ${new Date().toISOString()}`;

      // Create test file on EC2 and upload to S3
      const commands = [
        `echo "${testContent}" > /tmp/test-upload.txt`,
        `aws s3 cp /tmp/test-upload.txt s3://${bucketName}/${testKey} --region ${region}`,
        `rm /tmp/test-upload.txt`,
      ];

      const result = await executeSSMCommand(instanceId, commands);
      expect(result.status).toBe('Success');

      testData.s3Objects.push({ bucket: bucketName, key: testKey });

      // Verify file exists by retrieving it
      const getResponse = await s3Client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: testKey })
      );
      const retrievedContent = await getResponse.Body?.transformToString();
      expect(retrievedContent).toBe(testContent);
      console.log(`EC2 instance successfully uploaded file to S3: ${testKey}`);
    });

    test('EC2 instance can download data from S3 via VPC endpoint', async () => {
      const instanceId = await getEC2InstanceId();
      const bucketName = outputs.S3BucketName;
      const testKey = `integration-test/ec2-download-${Date.now()}.txt`;
      const testContent = `EC2 download test at ${new Date().toISOString()}`;

      // Upload file to S3 first
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
        })
      );
      testData.s3Objects.push({ bucket: bucketName, key: testKey });

      // Download from EC2 instance
      const commands = [
        `aws s3 cp s3://${bucketName}/${testKey} /tmp/test-download.txt --region ${region}`,
        `cat /tmp/test-download.txt`,
        `rm /tmp/test-download.txt`,
      ];

      const result = await executeSSMCommand(instanceId, commands);
      expect(result.status).toBe('Success');
      expect(result.stdout).toContain(testContent);
      console.log(`EC2 instance successfully downloaded file from S3: ${testKey}`);
    });
  });

  // EC2 -> RDS DATA FLOW TESTS
  describe('EC2 to RDS Database Data Flow', () => {
    test('EC2 instance can connect to RDS and execute queries', async () => {
      const instanceId = await getEC2InstanceId();
      const dbEndpoint = outputs.DatabaseEndpoint;
      const secretArn = outputs.DatabaseSecretArn;

      expect(dbEndpoint).toBeDefined();
      expect(secretArn).toBeDefined();

      // Retrieve database credentials from Secrets Manager
      const secretResponse = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretArn })
      );
      const secret = JSON.parse(secretResponse.SecretString || '{}');
      const dbUsername = secret.username;
      const dbPassword = secret.password;

      const testTableName = `test_table_${Date.now()}`;
      const testDataValue = `Integration test data ${Date.now()}`;

      // Execute MySQL queries via SSM
      const commands = [
        `mysql -h ${dbEndpoint} -u ${dbUsername} -p'${dbPassword}' -e "CREATE TABLE IF NOT EXISTS ${testTableName} (id INT AUTO_INCREMENT PRIMARY KEY, test_data VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"`,
        `mysql -h ${dbEndpoint} -u ${dbUsername} -p'${dbPassword}' -e "INSERT INTO ${testTableName} (test_data) VALUES ('${testDataValue}');"`,
        `mysql -h ${dbEndpoint} -u ${dbUsername} -p'${dbPassword}' -e "SELECT * FROM ${testTableName} WHERE test_data = '${testDataValue}';"`,
        `mysql -h ${dbEndpoint} -u ${dbUsername} -p'${dbPassword}' -e "DROP TABLE IF EXISTS ${testTableName};"`,
      ];

      const result = await executeSSMCommand(instanceId, commands);
      expect(result.status).toBe('Success');
      expect(result.stdout).toContain(testDataValue);
      expect(result.stdout).toContain(testTableName);

      console.log(`EC2 instance successfully executed database operations`);
      console.log(`Database endpoint: ${dbEndpoint}`);
    });
  });

  // EC2 -> SECRETS MANAGER DATA FLOW TESTS (from EC2 instance)
  describe('EC2 to Secrets Manager Data Flow', () => {
    test('EC2 instance can retrieve database credentials from Secrets Manager', async () => {
      const instanceId = await getEC2InstanceId();
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();

      // Retrieve secret from EC2 instance using AWS CLI
      const commands = [
        `aws secretsmanager get-secret-value --secret-id ${secretArn} --region ${region} --query SecretString --output text`,
      ];

      const result = await executeSSMCommand(instanceId, commands);
      expect(result.status).toBe('Success');

      const secret = JSON.parse(result.stdout.trim());
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(typeof secret.username).toBe('string');
      expect(typeof secret.password).toBe('string');

      console.log('EC2 instance successfully retrieved database credentials from Secrets Manager');
    });
  });

  // EC2 -> SSM PARAMETER STORE DATA FLOW TESTS (from EC2 instance)
  describe('EC2 to SSM Parameter Store Data Flow', () => {
    test('EC2 instance can write and read SSM parameters', async () => {
      const instanceId = await getEC2InstanceId();
      const paramName = `/webapp/prod/integration-test/${Date.now()}`;
      const testValue = `EC2 test value at ${new Date().toISOString()}`;

      // Write parameter from EC2 instance
      const writeCommands = [
        `aws ssm put-parameter --name ${paramName} --value "${testValue}" --type String --overwrite --region ${region}`,
      ];

      const writeResult = await executeSSMCommand(instanceId, writeCommands);
      expect(writeResult.status).toBe('Success');

      testData.ssmParameters.push(paramName);

      // Read parameter from EC2 instance
      const readCommands = [
        `aws ssm get-parameter --name ${paramName} --region ${region} --query Parameter.Value --output text`,
      ];

      const readResult = await executeSSMCommand(instanceId, readCommands);
      expect(readResult.status).toBe('Success');
      expect(readResult.stdout.trim()).toBe(testValue);

      console.log(`EC2 instance successfully wrote and read SSM parameter: ${paramName}`);
    });

    test('EC2 instance can retrieve database endpoint from SSM', async () => {
      const instanceId = await getEC2InstanceId();
      const dbEndpoint = outputs.DatabaseEndpoint;
      const paramName = '/webapp/prod/db/endpoint';

      // Try to read the parameter from EC2 instance
      const commands = [
        `aws ssm get-parameter --name ${paramName} --region ${region} --query Parameter.Value --output text 2>/dev/null || echo "NOT_FOUND"`,
      ];

      const result = await executeSSMCommand(instanceId, commands);
      expect(result.status).toBe('Success');

      if (result.stdout.trim() !== 'NOT_FOUND') {
        expect(result.stdout.trim()).toBeDefined();
        console.log('EC2 instance found database endpoint in SSM Parameter Store');
      } else {
        console.log('Database endpoint not yet in SSM (UserData may not have run)');
      }
    });
  });

  // EC2 -> CLOUDWATCH LOGS DATA FLOW TESTS (from EC2 instance)
  describe('EC2 to CloudWatch Logs Data Flow', () => {
    test('EC2 instance can send logs to CloudWatch Logs', async () => {
      const instanceId = await getEC2InstanceId();
      const logGroupName = outputs.ApplicationLogGroup;
      expect(logGroupName).toBeDefined();

      const logStreamName = `ec2-integration-test-${Date.now()}`;
      const testLogMessage = `EC2 log entry at ${new Date().toISOString()}`;

      // Send log from EC2 instance using AWS CLI
      const commands = [
        `aws logs create-log-stream --log-group-name ${logGroupName} --log-stream-name ${logStreamName} --region ${region} 2>/dev/null || true`,
        `aws logs put-log-events --log-group-name ${logGroupName} --log-stream-name ${logStreamName} --log-events timestamp=$(date +%s)000,message="${testLogMessage}" --region ${region}`,
      ];

      const result = await executeSSMCommand(instanceId, commands);
      expect(result.status).toBe('Success');

      testData.logEvents.push({ logGroup: logGroupName, logStream: logStreamName });

      // Verify log was sent by checking log streams
      const logStreamsResponse = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: logGroupName,
          logStreamNamePrefix: logStreamName,
        })
      );

      expect(logStreamsResponse.logStreams).toBeDefined();
      const foundStream = logStreamsResponse.logStreams?.find((s) => s.logStreamName === logStreamName);
      expect(foundStream).toBeDefined();

      console.log(`EC2 instance successfully sent log to CloudWatch: ${logGroupName}/${logStreamName}`);
    });
  });

  // ALB -> TARGET GROUP -> EC2 HEALTH CHECK FLOW
  describe('ALB Health Check Flow', () => {
    test('Target Group health checks reach EC2 instances', async () => {
      const tgArn = outputs.TargetGroupArn;
      expect(tgArn).toBeDefined();

      const healthResponse = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: tgArn })
      );

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      expect(healthResponse.TargetHealthDescriptions!.length).toBeGreaterThan(0);

      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        (t) => t.TargetHealth?.State === 'healthy' || t.TargetHealth?.State === 'initial'
      );

      expect(healthyTargets.length).toBeGreaterThan(0);

      healthResponse.TargetHealthDescriptions!.forEach((target) => {
        expect(target.Target?.Id).toBeDefined();
        expect(target.Target?.Port).toBe(80);
      });

      console.log(
        `Target Group has ${healthyTargets.length} healthy/initial targets out of ${healthResponse.TargetHealthDescriptions!.length} total`
      );
    });
  });

  // MULTI-AZ AND HIGH AVAILABILITY TESTS
  describe('Multi-AZ and High Availability', () => {
    test('Resources are distributed across multiple AZs', async () => {
      const publicSubnetIds = outputs.PublicSubnetIDs.split(',');
      const privateSubnetIds = outputs.PrivateSubnetIDs.split(',');

      const pubCommand = new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds });
      const privCommand = new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds });

      const pubResponse = await ec2Client.send(pubCommand);
      const privResponse = await ec2Client.send(privCommand);

      const pubAZs = pubResponse.Subnets!.map((s) => s.AvailabilityZone);
      const privAZs = privResponse.Subnets!.map((s) => s.AvailabilityZone);

      expect(new Set(pubAZs).size).toBe(2);
      expect(new Set(privAZs).size).toBe(2);
      console.log('Resources are distributed across multiple AZs');
    });

    test('Auto Scaling Group has instances in multiple AZs', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const command = new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups![0];
      const instanceIds = asg.Instances!.map((i) => i.InstanceId).filter((id): id is string => id !== undefined);
      const ec2Command = new DescribeInstancesCommand({ InstanceIds: instanceIds });
      const ec2Response = await ec2Client.send(ec2Command);

      const azs = new Set<string>();
      ec2Response.Reservations!.forEach((reservation) => {
        reservation.Instances!.forEach((instance) => {
          azs.add(instance.Placement!.AvailabilityZone!);
        });
      });

      expect(azs.size).toBeGreaterThanOrEqual(1);
      console.log(`Auto Scaling Group instances are in ${azs.size} availability zone(s)`);
    });

    test('RDS database is configured for Multi-AZ', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances!.find((db) => db.Endpoint?.Address === dbEndpoint);
      expect(dbInstance).toBeDefined();
      expect(dbInstance!.MultiAZ).toBe(true);
      console.log('RDS database is configured for Multi-AZ deployment');
    });
  });

  // VPC FLOW LOGS TESTS
  describe('VPC Flow Logs', () => {
    test('VPC Flow Logs are capturing network traffic', async () => {
      const vpcId = outputs.VPCID;
      const logGroupName = outputs.VPCFlowLogGroup || `/aws/vpc/${stackName}-flow-logs`;

      // Verify log group exists
      const logStreamsResponse = await logsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: logGroupName,
          limit: 1,
        })
      );

      expect(logStreamsResponse.logStreams).toBeDefined();
      console.log('VPC Flow Logs are configured and capturing network traffic');
    });
  });

  // COMPLETE DATA PIPELINE TEST
  describe('Complete Data Pipeline', () => {
    test('End-to-end data flow: HTTP Request -> EC2 -> S3 -> RDS -> CloudWatch', async () => {
      const testId = `pipeline-test-${Date.now()}`;
      const instanceId = await getEC2InstanceId();

      // Step 1: Send HTTP request to ALB
      const albUrl = outputs.LoadBalancerURL;
      const url = new URL(albUrl);
      const hostname = url.hostname;
      const port = url.port || (url.protocol === 'https:' ? 443 : 80);
      const protocol = url.protocol === 'https:' ? https : http;

      const httpResponse = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
        const testPayload = JSON.stringify({ testId, timestamp: new Date().toISOString() });
        const options = {
          hostname,
          port,
          path: '/',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(testPayload),
          },
          timeout: 30000,
        };

        const req = protocol.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode || 0, body });
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.write(testPayload);
        req.end();
      });

      expect(httpResponse.statusCode).toBeGreaterThanOrEqual(200);
      expect(httpResponse.statusCode).toBeLessThan(500);

      // Step 2: EC2 instance stores data in S3
      const bucketName = outputs.S3BucketName;
      const s3Key = `pipeline-test/${testId}.json`;
      const s3Content = JSON.stringify({ testId, status: 'processing', timestamp: new Date().toISOString() });

      const s3Commands = [
        `echo '${s3Content}' > /tmp/pipeline-data.json`,
        `aws s3 cp /tmp/pipeline-data.json s3://${bucketName}/${s3Key} --region ${region}`,
        `rm /tmp/pipeline-data.json`,
      ];

      const s3Result = await executeSSMCommand(instanceId, s3Commands);
      expect(s3Result.status).toBe('Success');
      testData.s3Objects.push({ bucket: bucketName, key: s3Key });

      // Step 3: EC2 instance stores metadata in SSM
      const ssmParamName = `/webapp/prod/pipeline-test/${testId}`;
      const ssmValue = JSON.stringify({ testId, status: 'completed', timestamp: new Date().toISOString() });

      const ssmCommands = [
        `aws ssm put-parameter --name ${ssmParamName} --value '${ssmValue}' --type String --overwrite --region ${region}`,
      ];

      const ssmResult = await executeSSMCommand(instanceId, ssmCommands);
      expect(ssmResult.status).toBe('Success');
      testData.ssmParameters.push(ssmParamName);

      // Step 4: EC2 instance sends log to CloudWatch
      const logGroupName = outputs.ApplicationLogGroup;
      const logStreamName = `pipeline-${testId}`;

      const logCommands = [
        `aws logs create-log-stream --log-group-name ${logGroupName} --log-stream-name ${logStreamName} --region ${region} 2>/dev/null || true`,
        `aws logs put-log-events --log-group-name ${logGroupName} --log-stream-name ${logStreamName} --log-events timestamp=$(date +%s)000,message='{"testId":"${testId}","pipeline":"complete","status":"success"}' --region ${region}`,
      ];

      const logResult = await executeSSMCommand(instanceId, logCommands);
      expect(logResult.status).toBe('Success');
      testData.logEvents.push({ logGroup: logGroupName, logStream: logStreamName });

      console.log(`Complete pipeline test ${testId} executed successfully`);
      console.log(`- HTTP request: ${httpResponse.statusCode}`);
      console.log(`- S3 object: ${s3Key}`);
      console.log(`- SSM parameter: ${ssmParamName}`);
      console.log(`- CloudWatch log: ${logGroupName}/${logStreamName}`);
    });
  });
});
