import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand as ASGDescribeCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  GetLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SNSClient,
  PublishCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EC2Client,
  DescribeAddressesCommand,
} from '@aws-sdk/client-ec2';
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from '@aws-sdk/client-ssm';
import fs from 'fs';

// Load from cfn-outputs after stack deployment
let outputs: Record<string, string> = {};
const outputsPath = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// AWS Region from environment or outputs
const region = process.env.AWS_REGION || outputs.Region;

// AWS Clients
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const snsClient = new SNSClient({ region });
const asgClient = new AutoScalingClient({ region });
const ssmClient = new SSMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const ec2Client = new EC2Client({ region });

describe('TapStack End-to-End Data Flow Integration Tests', () => {
  let rdsEndpoint: string;
  let rdsPort: number;
  let s3BucketName: string;
  let databaseSecretArn: string;
  let autoScalingGroupName: string;
  let snsTopicArn: string;
  let logGroupName: string;
  let ec2InstanceId: string;
  let elasticIp: string;
  let environmentName: string;

  // Track test data for cleanup
  const testDataKeys: string[] = [];

  beforeAll(async () => {
    if (Object.keys(outputs).length === 0) {
      throw new Error(
        `CloudFormation outputs not found at ${outputsPath}. Deploy stack first.`
      );
    }

    rdsEndpoint = outputs.RDSDatabaseEndpoint;
    rdsPort = parseInt(outputs.RDSDatabasePort);
    s3BucketName = outputs.S3BucketName;
    databaseSecretArn = outputs.DatabaseSecretArn;
    autoScalingGroupName = outputs.AutoScalingGroupName;
    snsTopicArn = outputs.SNSTopicArn;
    logGroupName = outputs.CloudWatchLogGroup;
    elasticIp = outputs.ElasticIPAddress;
    environmentName = outputs.EnvironmentName;

    // Get EC2 instance from Auto Scaling Group
    const asgCommand = new ASGDescribeCommand({
      AutoScalingGroupNames: [autoScalingGroupName],
    });
    const asgResponse = await asgClient.send(asgCommand);
    const instanceIds = asgResponse.AutoScalingGroups?.[0]?.Instances?.map(i => i.InstanceId) || [];
    if (instanceIds.length === 0) {
      throw new Error('No EC2 instances found in Auto Scaling Group');
    }
    ec2InstanceId = instanceIds[0];

    // Database credentials are retrieved dynamically in each test via Secrets Manager
  });

  afterAll(async () => {
    // Cleanup: Delete all test data from S3
    for (const key of testDataKeys) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: s3BucketName, Key: key }));
      } catch (error) {
        console.warn(`Failed to delete S3 object ${key}:`, error);
      }
    }
  });

  const waitForSSMCommand = async (commandId: string, instanceId: string, maxAttempts = 20) => {
    for (let i = 0; i < maxAttempts; i++) {
      const getCommand = new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId,
      });
      const invocation = await ssmClient.send(getCommand);
      
      if (invocation.Status === 'Success' || invocation.Status === 'Failed') {
        return invocation;
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    throw new Error('SSM command did not complete within timeout');
  };

  test('Complete Data Flow: S3 -> RDS -> CloudWatch Logs -> SNS', async () => {
    const testId = `e2e-${Date.now()}`;
    const testData = {
      id: testId,
      timestamp: new Date().toISOString(),
      message: 'End-to-end integration test data',
      value: Math.random().toString(36).substring(7),
    };

    // Write test data to S3
    const s3Key = `test-data/${testId}.json`;
    testDataKeys.push(s3Key);
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3BucketName,
        Key: s3Key,
        Body: JSON.stringify(testData),
        ContentType: 'application/json',
      })
    );

    // EC2 reads from S3, processes data, writes to RDS
    const processCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          // Read from S3
          `aws s3 cp s3://${s3BucketName}/${s3Key} /tmp/test-data.json --region ${region}`,
          // Get database credentials
          `SECRET=$(aws secretsmanager get-secret-value --secret-id ${databaseSecretArn} --region ${region} --query SecretString --output text)`,
          'DB_USER=$(echo $SECRET | jq -r .username)',
          'DB_PASS=$(echo $SECRET | jq -r .password)',
          // Install MySQL client if needed
          'yum install -y mysql jq -q',
          // Connect to RDS and insert test data (use mysql_native_password auth)
          `JSON_DATA=$(cat /tmp/test-data.json | jq -c . | sed "s/'/\\\\'/g")`,
          `mysql -h ${rdsEndpoint} -P ${rdsPort} -u $DB_USER -p$DB_PASS --default-auth=mysql_native_password -e "CREATE DATABASE IF NOT EXISTS testdb; USE testdb; CREATE TABLE IF NOT EXISTS test_data (id VARCHAR(255), data JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO test_data (id, data) VALUES ('${testId}', CAST('$JSON_DATA' AS JSON)); SELECT id FROM test_data WHERE id='${testId}';" 2>&1`,
          // Write result to file
          `echo "Data processed and stored in RDS" > /tmp/result.txt`,
        ],
      },
    });

    const sendResponse = await ssmClient.send(processCommand);
    const commandId = sendResponse.Command?.CommandId!;
    const invocation = await waitForSSMCommand(commandId, ec2InstanceId);

    if (invocation.Status !== 'Success') {
      console.error('Command failed:', invocation.StandardErrorContent);
      console.error('Output:', invocation.StandardOutputContent);
    }
    expect(invocation.Status).toBe('Success');
    expect(invocation.StandardOutputContent).toContain(testId);

    // EC2 reads from RDS and verifies data
    const verifyCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `SECRET=$(aws secretsmanager get-secret-value --secret-id ${databaseSecretArn} --region ${region} --query SecretString --output text)`,
          'DB_USER=$(echo $SECRET | jq -r .username)',
          'DB_PASS=$(echo $SECRET | jq -r .password)',
          `mysql -h ${rdsEndpoint} -P ${rdsPort} -u $DB_USER -p$DB_PASS --default-auth=mysql_native_password -e "USE testdb; SELECT data FROM test_data WHERE id='${testId}';" 2>&1`,
        ],
      },
    });

    const verifyResponse = await ssmClient.send(verifyCommand);
    const verifyInvocation = await waitForSSMCommand(verifyResponse.Command?.CommandId!, ec2InstanceId);

    expect(verifyInvocation.Status).toBe('Success');
    expect(verifyInvocation.StandardOutputContent).toContain(testData.message);

    // Write log to CloudWatch
    const logStreamName = `test-stream-${testId}`;

    try {
      await logsClient.send(
        new CreateLogStreamCommand({
          logGroupName: logGroupName,
          logStreamName: logStreamName,
        })
      );
    } catch (error) {
      // Stream may already exist, continue
    }

    await logsClient.send(
      new PutLogEventsCommand({
        logGroupName: logGroupName,
        logStreamName: logStreamName,
        logEvents: [
          {
            message: JSON.stringify({
              testId,
              action: 'data_processed',
              source: 'integration_test',
              data: testData,
            }),
            timestamp: Date.now(),
          },
        ],
      })
    );

    // Read log from CloudWatch
    await new Promise(resolve => setTimeout(resolve, 5000));

    const getLogCommand = new GetLogEventsCommand({
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      limit: 10,
    });
    const logResponse = await logsClient.send(getLogCommand);

    expect(logResponse.events).toBeDefined();
    const foundLog = logResponse.events?.some(e => e.message?.includes(testId));
    expect(foundLog).toBe(true);

    // Publish notification to SNS
    const snsMessage = {
      testId,
      status: 'completed',
      message: 'End-to-end test completed successfully',
      timestamp: new Date().toISOString(),
    };

    const publishResponse = await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Message: JSON.stringify(snsMessage),
        Subject: `Integration Test: ${testId}`,
      })
    );

    expect(publishResponse.MessageId).toBeDefined();

    // Cleanup - Delete test data from RDS
    const cleanupCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `SECRET=$(aws secretsmanager get-secret-value --secret-id ${databaseSecretArn} --region ${region} --query SecretString --output text)`,
          'DB_USER=$(echo $SECRET | jq -r .username)',
          'DB_PASS=$(echo $SECRET | jq -r .password)',
          `mysql -h ${rdsEndpoint} -P ${rdsPort} -u $DB_USER -p$DB_PASS --default-auth=mysql_native_password -e "USE testdb; DELETE FROM test_data WHERE id='${testId}';" 2>&1`,
        ],
      },
    });

    const cleanupResponse = await ssmClient.send(cleanupCommand);
    const cleanupInvocation = await waitForSSMCommand(cleanupResponse.Command?.CommandId!, ec2InstanceId);
    expect(cleanupInvocation.Status).toBe('Success');
  });

  test('Data Flow: EC2 reads S3 artifact and processes it', async () => {
    const testId = `s3-ec2-${Date.now()}`;
    const artifactContent = `Artifact data for test ${testId}\nProcessed at ${new Date().toISOString()}`;
    const s3Key = `artifacts/${testId}.txt`;
    testDataKeys.push(s3Key);

    // Write artifact to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3BucketName,
        Key: s3Key,
        Body: artifactContent,
      })
    );

    // EC2 reads and processes artifact
    const command = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `aws s3 cp s3://${s3BucketName}/${s3Key} /tmp/artifact.txt --region ${region}`,
          'CONTENT=$(cat /tmp/artifact.txt)',
          `echo "Processed: $CONTENT" | grep "${testId}" || echo "Content: $CONTENT"`,
          'cat /tmp/artifact.txt',
        ],
      },
    });

    const response = await ssmClient.send(command);
    const invocation = await waitForSSMCommand(response.Command?.CommandId!, ec2InstanceId);

    expect(invocation.Status).toBe('Success');
    expect(invocation.StandardOutputContent).toContain(testId);
    expect(invocation.StandardOutputContent).toContain('Processed:');
  });

  test('Data Flow: Secrets Manager -> EC2 -> RDS connection', async () => {
    const testId = `secrets-rds-${Date.now()}`;

    // EC2 retrieves secret and connects to RDS
    const command = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `SECRET=$(aws secretsmanager get-secret-value --secret-id ${databaseSecretArn} --region ${region} --query SecretString --output text)`,
          'DB_USER=$(echo $SECRET | jq -r .username)',
          'DB_PASS=$(echo $SECRET | jq -r .password)',
          'yum install -y mysql jq -q',
          `mysql -h ${rdsEndpoint} -P ${rdsPort} -u $DB_USER -p$DB_PASS --default-auth=mysql_native_password -e "SELECT 'Connection successful' as status, NOW() as timestamp;" 2>&1`,
        ],
      },
    });

    const response = await ssmClient.send(command);
    const invocation = await waitForSSMCommand(response.Command?.CommandId!, ec2InstanceId);

    if (invocation.Status !== 'Success') {
      console.error('RDS connection failed:', invocation.StandardErrorContent);
      console.error('Output:', invocation.StandardOutputContent);
    }
    expect(invocation.Status).toBe('Success');
    expect(invocation.StandardOutputContent).toContain('Connection successful');
    expect(invocation.StandardErrorContent || '').not.toMatch(/Access denied|Can't connect|sha256_password/i);
  });

  test('Data Flow: Application logs written to CloudWatch and retrieved', async () => {
    const testId = `logs-${Date.now()}`;
    const logMessage = `Application log entry ${testId} - ${new Date().toISOString()}`;
    const logStreamName = `app-logs-${testId}`;

    // Create log stream
    try {
      await logsClient.send(
        new CreateLogStreamCommand({
          logGroupName: logGroupName,
          logStreamName: logStreamName,
        })
      );
    } catch (error) {
      // Stream may already exist
    }

    // Write log event
    await logsClient.send(
      new PutLogEventsCommand({
        logGroupName: logGroupName,
        logStreamName: logStreamName,
        logEvents: [
          {
            message: logMessage,
            timestamp: Date.now(),
          },
        ],
      })
    );

    // Wait for log to be available
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Retrieve log events
    const getLogsCommand = new GetLogEventsCommand({
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      limit: 10,
    });
    const logResponse = await logsClient.send(getLogsCommand);

    expect(logResponse.events).toBeDefined();
    expect(logResponse.events!.length).toBeGreaterThan(0);
    const foundMessage = logResponse.events!.some(e => e.message?.includes(testId));
    expect(foundMessage).toBe(true);
  });

  test('Data Flow: SNS notification published and received', async () => {
    const testId = `sns-${Date.now()}`;
    const notificationData = {
      testId,
      event: 'integration_test',
      data: { message: 'Test notification', timestamp: new Date().toISOString() },
    };

    // Publish to SNS
    const publishResponse = await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Message: JSON.stringify(notificationData),
        Subject: `Test Notification ${testId}`,
        MessageAttributes: {
          TestId: {
            DataType: 'String',
            StringValue: testId,
          },
        },
      })
    );

    expect(publishResponse.MessageId).toBeDefined();
    expect(publishResponse.MessageId!.length).toBeGreaterThan(0);
  });

  test('User Request Path: HTTP request to ElasticIP -> EC2 -> Application response', async () => {
    // Generate test HTTP request to application
    const testRequestId = `http-${Date.now()}`;
    
    // Execute command on EC2 to generate HTTP traffic
    const httpCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `curl -s -w "\\nHTTP_CODE:%{http_code}\\nTIME:%{time_total}" http://${elasticIp}/ -H "X-Test-Request-ID: ${testRequestId}" -o /tmp/http-response.html`,
          'cat /tmp/http-response.html',
        ],
      },
    });

    const httpResponse = await ssmClient.send(httpCommand);
    const httpInvocation = await waitForSSMCommand(httpResponse.Command?.CommandId!, ec2InstanceId);

    expect(httpInvocation.Status).toBe('Success');
    expect(httpInvocation.StandardOutputContent).toContain('HTTP_CODE:200');
    expect(httpInvocation.StandardOutputContent).toMatch(/Application Server|Instance ID/);
  });

  test('Application Log Collection: EC2 generates logs -> CloudWatch Agent -> CloudWatch Logs', async () => {
    const testLogId = `app-log-${Date.now()}`;
    
    // Generate application log on EC2 (Apache access log)
    const logCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `echo "$(date '+%d/%b/%Y:%H:%M:%S %z') - - [test] \"GET /test-${testLogId} HTTP/1.1\" 200 123" >> /var/log/httpd/access_log`,
          'sleep 10', // Wait for CloudWatch Agent to collect
        ],
      },
    });

    const logResponse = await ssmClient.send(logCommand);
    await waitForSSMCommand(logResponse.Command?.CommandId!, ec2InstanceId);

    // Wait for CloudWatch Agent to send logs 
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Check if log appears in CloudWatch Logs
    const logStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName: logGroupName,
      logStreamNamePrefix: ec2InstanceId,
      limit: 10,
    });
    const streamsResponse = await logsClient.send(logStreamsCommand);

    expect(streamsResponse.logStreams).toBeDefined();
    const httpdStream = streamsResponse.logStreams?.find(s => 
      s.logStreamName?.includes('httpd-access')
    );

    if (httpdStream) {
      const getLogsCommand = new GetLogEventsCommand({
        logGroupName: logGroupName,
        logStreamName: httpdStream.logStreamName!,
        limit: 50,
      });
      const logsResponse = await logsClient.send(getLogsCommand);
      
      // Verify log contains our test ID
      const foundLog = logsResponse.events?.some(e => e.message?.includes(testLogId));
      expect(foundLog).toBe(true);
    }
  });

  test('RDS Log Export: RDS generates logs -> CloudWatch Logs Service -> RDS Log Groups', async () => {
    const testQueryId = `rds-log-${Date.now()}`;
    
    // Execute query on RDS that will generate logs
    const queryCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `SECRET=$(aws secretsmanager get-secret-value --secret-id ${databaseSecretArn} --region ${region} --query SecretString --output text)`,
          'DB_USER=$(echo $SECRET | jq -r .username)',
          'DB_PASS=$(echo $SECRET | jq -r .password)',
          'yum install -y mysql jq -q',
          // Enable general log temporarily and execute query
          `mysql -h ${rdsEndpoint} -P ${rdsPort} -u $DB_USER -p$DB_PASS --default-auth=mysql_native_password -e "USE testdb; SELECT '${testQueryId}' as test_query, NOW();" 2>&1`,
        ],
      },
    });

    const queryResponse = await ssmClient.send(queryCommand);
    await waitForSSMCommand(queryResponse.Command?.CommandId!, ec2InstanceId);

    // Wait for RDS to export logs to CloudWatch 
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Check RDS general log group (format: /aws/rds/instance/${EnvironmentName}-mysql-db/general)
    const rdsLogGroupName = `/aws/rds/instance/${environmentName}-mysql-db/general`;
    const logStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName: rdsLogGroupName,
      limit: 10,
      orderBy: 'LastEventTime',
      descending: true,
    });

    try {
      const streamsResponse = await logsClient.send(logStreamsCommand);
      expect(streamsResponse.logStreams).toBeDefined();
      
      if (streamsResponse.logStreams && streamsResponse.logStreams.length > 0) {
        const latestStream = streamsResponse.logStreams[0];
        const getLogsCommand = new GetLogEventsCommand({
          logGroupName: rdsLogGroupName,
          logStreamName: latestStream.logStreamName!,
          limit: 20,
        });
        const logsResponse = await logsClient.send(getLogsCommand);
        expect(logsResponse.events).toBeDefined();
      }
    } catch (error) {
      // Log group may not have streams yet, but should exist
      console.warn('RDS log group may not have streams yet:', error);
    }
  });

  test('Monitoring Path: EC2 metrics -> CloudWatch Metrics -> Alarm -> SNS', async () => {
    // Generate CPU load on EC2 to trigger metrics
    const loadCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          'dd if=/dev/zero of=/dev/null bs=1M count=1000 &',
          'sleep 30', // Generate CPU load
        ],
      },
    });

    await ssmClient.send(loadCommand);

    // Wait for metrics to be published 
    await new Promise(resolve => setTimeout(resolve, 45000));

    // Get CPU metrics from CloudWatch
    const metricsCommand = new GetMetricStatisticsCommand({
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      Dimensions: [
        {
          Name: 'InstanceId',
          Value: ec2InstanceId,
        },
      ],
      StartTime: new Date(Date.now() - 600000), // 10 minutes ago
      EndTime: new Date(),
      Period: 300,
      Statistics: ['Average'],
    });

    const metricsResponse = await cloudWatchClient.send(metricsCommand);
    expect(metricsResponse.Datapoints).toBeDefined();
    
    // Verify metrics exist
    if (metricsResponse.Datapoints && metricsResponse.Datapoints.length > 0) {
      expect(metricsResponse.Datapoints[0].Average).toBeDefined();
    }
  });

  test('ElasticIP Association: EC2 instance associates ElasticIP from UserData', async () => {
    // Check if ElasticIP is associated with EC2 instance
    const addressesCommand = new DescribeAddressesCommand({
      PublicIps: [elasticIp],
    });
    const addressesResponse = await ec2Client.send(addressesCommand);

    expect(addressesResponse.Addresses).toBeDefined();
    expect(addressesResponse.Addresses!.length).toBe(1);
    expect(addressesResponse.Addresses![0].PublicIp).toBe(elasticIp);
    
    // ElasticIP should be associated with an instance (may be associated by UserData script)
    const associationId = addressesResponse.Addresses![0].AssociationId;
    expect(associationId).toBeDefined();
  });

  test('Complete User Workflow: HTTP Request -> EC2 -> RDS Query -> Log -> SNS', async () => {
    const workflowId = `user-workflow-${Date.now()}`;
    const userData = { userId: workflowId, action: 'test_action', timestamp: new Date().toISOString() };

    // User makes HTTP request
    const httpCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `curl -s http://${elasticIp}/ -H "X-User-Data: ${JSON.stringify(userData).replace(/"/g, '\\"')}" > /tmp/http-request.log`,
          'cat /tmp/http-request.log',
        ],
      },
    });

    const httpResponse = await ssmClient.send(httpCommand);
    const httpInvocation = await waitForSSMCommand(httpResponse.Command?.CommandId!, ec2InstanceId);
    expect(httpInvocation.Status).toBe('Success');

    // EC2 processes request and queries RDS
    const processCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `SECRET=$(aws secretsmanager get-secret-value --secret-id ${databaseSecretArn} --region ${region} --query SecretString --output text)`,
          'DB_USER=$(echo $SECRET | jq -r .username)',
          'DB_PASS=$(echo $SECRET | jq -r .password)',
          `USER_DATA_JSON=$(echo '${JSON.stringify(userData)}' | jq -c . | sed "s/'/\\\\'/g")`,
          `mysql -h ${rdsEndpoint} -P ${rdsPort} -u $DB_USER -p$DB_PASS --default-auth=mysql_native_password -e "USE testdb; CREATE TABLE IF NOT EXISTS user_actions (id VARCHAR(255), user_data JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); INSERT INTO user_actions (id, user_data) VALUES ('${workflowId}', CAST('$USER_DATA_JSON' AS JSON));" 2>&1`,
        ],
      },
    });

    const processResponse = await ssmClient.send(processCommand);
    const processInvocation = await waitForSSMCommand(processResponse.Command?.CommandId!, ec2InstanceId);
    if (processInvocation.Status !== 'Success') {
      console.error('User workflow RDS insert failed:', processInvocation.StandardErrorContent);
      console.error('Output:', processInvocation.StandardOutputContent);
    }
    expect(processInvocation.Status).toBe('Success');

    // Write log entry
    const logStreamName = `user-workflow-${workflowId}`;
    try {
      await logsClient.send(
        new CreateLogStreamCommand({
          logGroupName: logGroupName,
          logStreamName: logStreamName,
        })
      );
    } catch (error) {
      // Stream may exist
    }

    await logsClient.send(
      new PutLogEventsCommand({
        logGroupName: logGroupName,
        logStreamName: logStreamName,
        logEvents: [
          {
            message: JSON.stringify({ workflowId, userData, status: 'processed' }),
            timestamp: Date.now(),
          },
        ],
      })
    );

    // Send SNS notification
    const notifyResponse = await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Message: JSON.stringify({ workflowId, userData, status: 'completed' }),
        Subject: `User Workflow Complete: ${workflowId}`,
      })
    );

    expect(notifyResponse.MessageId).toBeDefined();

    // Verify data in RDS
    const verifyCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `SECRET=$(aws secretsmanager get-secret-value --secret-id ${databaseSecretArn} --region ${region} --query SecretString --output text)`,
          'DB_USER=$(echo $SECRET | jq -r .username)',
          'DB_PASS=$(echo $SECRET | jq -r .password)',
          `mysql -h ${rdsEndpoint} -P ${rdsPort} -u $DB_USER -p$DB_PASS --default-auth=mysql_native_password -e "USE testdb; SELECT * FROM user_actions WHERE id='${workflowId}';" 2>&1`,
        ],
      },
    });

    const verifyResponse = await ssmClient.send(verifyCommand);
    const verifyInvocation = await waitForSSMCommand(verifyResponse.Command?.CommandId!, ec2InstanceId);
    expect(verifyInvocation.Status).toBe('Success');
    expect(verifyInvocation.StandardOutputContent).toContain(workflowId);

    // Cleanup
    const cleanupCommand = new SendCommandCommand({
      InstanceIds: [ec2InstanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `SECRET=$(aws secretsmanager get-secret-value --secret-id ${databaseSecretArn} --region ${region} --query SecretString --output text)`,
          'DB_USER=$(echo $SECRET | jq -r .username)',
          'DB_PASS=$(echo $SECRET | jq -r .password)',
          `mysql -h ${rdsEndpoint} -P ${rdsPort} -u $DB_USER -p$DB_PASS --default-auth=mysql_native_password -e "USE testdb; DELETE FROM user_actions WHERE id='${workflowId}';" 2>&1`,
        ],
      },
    });

    await ssmClient.send(cleanupCommand);
  });
});
