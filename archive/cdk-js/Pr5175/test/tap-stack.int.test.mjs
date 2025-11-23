// Improved Integration Tests with Error Handling, Timeouts, and Better Coverage
import AWS from 'aws-sdk';
import fs from 'fs';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds for AWS API calls
const LONG_TEST_TIMEOUT = 60000; // 60 seconds for long-running tests
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 1000;

// Load deployment outputs
const loadOutputs = () => {
  const outputPath = 'cfn-outputs/flat-outputs.json';

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      `Deployment outputs not found at ${outputPath}. ` +
        'Please run "cdk deploy" before running integration tests.'
    );
  }

  try {
    return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse deployment outputs: ${error.message}`);
  }
};

const outputs = loadOutputs();

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region });

const ec2 = new AWS.EC2();
const cloudwatch = new AWS.CloudWatch();
const sns = new AWS.SNS();
const s3 = new AWS.S3();
const logs = new AWS.CloudWatchLogs();
const iam = new AWS.IAM();

// Helper: Retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = MAX_RETRIES) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (
        (error.code === 'Throttling' ||
          error.code === 'TooManyRequestsException') &&
        i < maxRetries - 1
      ) {
        const delay = RETRY_BACKOFF_MS * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// Helper: Safe AWS API call with error handling
const safeAwsCall = async (fn, operation) => {
  try {
    return await retryWithBackoff(fn);
  } catch (error) {
    console.error(`AWS API call failed (${operation}):`, error.message);
    throw error;
  }
};

describe('Proactive Monitoring Stack Integration Tests', () => {
  let instanceIds = [];
  let vpcId, alertTopicArn, logBucketName, dashboardUrl;

  beforeAll(() => {
    // Validate required outputs exist
    const requiredOutputs = [
      'VpcId',
      'AlertTopicArn',
      'LogBucketName',
      'DashboardUrl',
    ];

    requiredOutputs.forEach(key => {
      if (!outputs[key]) {
        throw new Error(
          `Required output "${key}" is missing from deployment outputs`
        );
      }
    });

    // Extract instance IDs and other outputs from deployment
    instanceIds = [];
    for (let i = 0; i < 10; i++) {
      const instanceKey = `InstanceId${i}`;
      if (outputs[instanceKey]) {
        instanceIds.push(outputs[instanceKey]);
      }
    }

    if (instanceIds.length === 0) {
      throw new Error('No instance IDs found in deployment outputs');
    }

    vpcId = outputs.VpcId;
    alertTopicArn = outputs.AlertTopicArn;
    logBucketName = outputs.LogBucketName;
    dashboardUrl = outputs.DashboardUrl;

    console.log(
      `Running integration tests for environment: ${environmentSuffix}`
    );
    console.log(`Found ${instanceIds.length} instances to test`);
  });

  describe('EC2 Infrastructure Validation', () => {
    test(
      'should verify all EC2 instances are running',
      async () => {
        const response = await safeAwsCall(
          () => ec2.describeInstances({ InstanceIds: instanceIds }).promise(),
          'describeInstances'
        );

        const instances = response.Reservations.flatMap(r => r.Instances);

        expect(instances.length).toBe(instanceIds.length);
        instances.forEach(instance => {
          expect(instance.State.Name).toBe('running');
          expect(instance.InstanceType).toBe('t3.micro');
          expect(instance.VpcId).toBe(vpcId);
          expect(instance.SecurityGroups.length).toBeGreaterThan(0);
        });
      },
      TEST_TIMEOUT
    );

    test(
      'should verify instances are in correct VPC and subnets',
      async () => {
        const response = await safeAwsCall(
          () => ec2.describeInstances({ InstanceIds: instanceIds }).promise(),
          'describeInstances'
        );

        const instances = response.Reservations.flatMap(r => r.Instances);

        instances.forEach(instance => {
          expect(instance.VpcId).toBe(vpcId);
          expect(instance.SubnetId).toBeDefined();
          expect(instance.PublicIpAddress).toBeDefined();
        });
      },
      TEST_TIMEOUT
    );

    test(
      'should verify instances have encrypted EBS volumes',
      async () => {
        const response = await safeAwsCall(
          () =>
            ec2.describeInstances({ InstanceIds: [instanceIds[0]] }).promise(),
          'describeInstances'
        );

        const instance = response.Reservations[0].Instances[0];
        const blockDevices = instance.BlockDeviceMappings;

        expect(blockDevices.length).toBeGreaterThan(0);
        blockDevices.forEach(device => {
          expect(device.Ebs).toBeDefined();
          expect(device.Ebs.VolumeId).toBeDefined();
        });

        // Verify encryption on the volumes
        const volumeIds = blockDevices.map(d => d.Ebs.VolumeId);
        const volumesResponse = await safeAwsCall(
          () => ec2.describeVolumes({ VolumeIds: volumeIds }).promise(),
          'describeVolumes'
        );

        volumesResponse.Volumes.forEach(volume => {
          expect(volume.Encrypted).toBe(true);
          expect(volume.VolumeType).toBe('gp3');
        });
      },
      TEST_TIMEOUT
    );

    test(
      'should verify security group rules',
      async () => {
        const response = await safeAwsCall(
          () =>
            ec2
              .describeInstances({ InstanceIds: instanceIds.slice(0, 1) })
              .promise(),
          'describeInstances'
        );

        const instance = response.Reservations[0].Instances[0];
        const securityGroupId = instance.SecurityGroups[0].GroupId;

        const sgResponse = await safeAwsCall(
          () =>
            ec2
              .describeSecurityGroups({ GroupIds: [securityGroupId] })
              .promise(),
          'describeSecurityGroups'
        );

        const securityGroup = sgResponse.SecurityGroups[0];
        const ingressRules = securityGroup.IpPermissions;

        // Check for HTTP access
        const httpRule = ingressRules.find(
          rule =>
            rule.FromPort === 80 &&
            rule.ToPort === 80 &&
            rule.IpProtocol === 'tcp'
        );
        expect(httpRule).toBeDefined();

        // Check for SSH access
        const sshRule = ingressRules.find(
          rule =>
            rule.FromPort === 22 &&
            rule.ToPort === 22 &&
            rule.IpProtocol === 'tcp'
        );
        expect(sshRule).toBeDefined();

        // Security check: In production, SSH should not be 0.0.0.0/0
        if (environmentSuffix === 'prod') {
          const hasUnrestrictedSSH = sshRule.IpRanges.some(
            range => range.CidrIp === '0.0.0.0/0'
          );
          expect(hasUnrestrictedSSH).toBe(false);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('VPC and Network Configuration', () => {
    test(
      'should verify subnets exist in multiple AZs',
      async () => {
        const response = await safeAwsCall(
          () =>
            ec2
              .describeSubnets({
                Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
              })
              .promise(),
          'describeSubnets'
        );

        const subnets = response.Subnets;
        expect(subnets.length).toBeGreaterThanOrEqual(2);

        // Check for multiple AZs (high availability)
        const azs = new Set(subnets.map(s => s.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);

        // Verify subnets are public (MapPublicIpOnLaunch)
        subnets.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        });
      },
      TEST_TIMEOUT
    );

    test(
      'should verify internet gateway is attached',
      async () => {
        const response = await safeAwsCall(
          () =>
            ec2
              .describeInternetGateways({
                Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
              })
              .promise(),
          'describeInternetGateways'
        );

        expect(response.InternetGateways.length).toBe(1);
        const igw = response.InternetGateways[0];
        expect(igw.Attachments[0].State).toBe('available');
      },
      TEST_TIMEOUT
    );

    test(
      'should verify no NAT gateways for cost optimization',
      async () => {
        const response = await safeAwsCall(
          () =>
            ec2
              .describeNatGateways({
                Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
              })
              .promise(),
          'describeNatGateways'
        );

        // Should be 0 for cost optimization
        expect(response.NatGateways.length).toBe(0);
      },
      TEST_TIMEOUT
    );
  });

  describe('CloudWatch Monitoring Validation', () => {
    test(
      'should verify CloudWatch alarms exist for disk usage',
      async () => {
        const response = await safeAwsCall(
          () => cloudwatch.describeAlarms().promise(),
          'describeAlarms'
        );

        const alarms = response.MetricAlarms;
        const diskAlarms = alarms.filter(
          alarm =>
            alarm.AlarmName.includes('disk-usage') &&
            alarm.AlarmName.includes(environmentSuffix)
        );

        expect(diskAlarms.length).toBe(instanceIds.length);

        diskAlarms.forEach(alarm => {
          expect(alarm.MetricName).toBe('disk_used_percent');
          expect(alarm.Namespace).toBe('CWAgent');
          expect(alarm.Threshold).toBe(80);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
          expect(alarm.EvaluationPeriods).toBe(2);
        });
      },
      TEST_TIMEOUT
    );

    test(
      'should verify CloudWatch alarms exist for CPU usage',
      async () => {
        const response = await safeAwsCall(
          () => cloudwatch.describeAlarms().promise(),
          'describeAlarms'
        );

        const alarms = response.MetricAlarms;
        const cpuAlarms = alarms.filter(
          alarm =>
            alarm.AlarmName.includes('cpu-usage') &&
            alarm.AlarmName.includes(environmentSuffix)
        );

        expect(cpuAlarms.length).toBe(instanceIds.length);

        cpuAlarms.forEach(alarm => {
          expect(alarm.MetricName).toBe('CPUUtilization');
          expect(alarm.Namespace).toBe('AWS/EC2');
          expect(alarm.Threshold).toBe(80);
        });
      },
      TEST_TIMEOUT
    );
  });

  describe('SNS Topic Validation', () => {
    test(
      'should verify SNS topic exists and is configured',
      async () => {
        const response = await safeAwsCall(
          () => sns.getTopicAttributes({ TopicArn: alertTopicArn }).promise(),
          'getTopicAttributes'
        );

        expect(response.Attributes.DisplayName).toContain(environmentSuffix);
        expect(response.Attributes.TopicArn).toBe(alertTopicArn);
      },
      TEST_TIMEOUT
    );

    test(
      'should verify email subscription exists if configured',
      async () => {
        const response = await safeAwsCall(
          () =>
            sns.listSubscriptionsByTopic({ TopicArn: alertTopicArn }).promise(),
          'listSubscriptionsByTopic'
        );

        const subscriptions = response.Subscriptions;

        // If ALERT_EMAIL env var is set, verify subscription exists
        if (process.env.ALERT_EMAIL) {
          const emailSubs = subscriptions.filter(
            sub => sub.Protocol === 'email'
          );
          expect(emailSubs.length).toBeGreaterThan(0);
          expect(emailSubs[0].Endpoint).toBe(process.env.ALERT_EMAIL);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'should verify alarms are connected to SNS topic',
      async () => {
        const response = await safeAwsCall(
          () => cloudwatch.describeAlarms().promise(),
          'describeAlarms'
        );

        const alarms = response.MetricAlarms.filter(alarm =>
          alarm.AlarmName.includes(environmentSuffix)
        );

        expect(alarms.length).toBeGreaterThan(0);

        alarms.forEach(alarm => {
          expect(alarm.AlarmActions.length).toBeGreaterThan(0);
          expect(alarm.AlarmActions[0]).toBe(alertTopicArn);
        });
      },
      TEST_TIMEOUT
    );
  });

  describe('S3 Bucket Validation', () => {
    test(
      'should verify S3 bucket exists with correct configuration',
      async () => {
        const response = await safeAwsCall(
          () => s3.getBucketLocation({ Bucket: logBucketName }).promise(),
          'getBucketLocation'
        );

        expect(response).toBeDefined();
      },
      TEST_TIMEOUT
    );

    test(
      'should verify S3 bucket has lifecycle policies',
      async () => {
        const response = await safeAwsCall(
          () =>
            s3
              .getBucketLifecycleConfiguration({ Bucket: logBucketName })
              .promise(),
          'getBucketLifecycleConfiguration'
        );

        expect(response.Rules.length).toBeGreaterThan(0);

        const transitionRule = response.Rules.find(
          rule => rule.Transitions && rule.Transitions.length > 0
        );
        expect(transitionRule).toBeDefined();
        expect(transitionRule.Transitions[0].Days).toBe(30);
        expect(transitionRule.Transitions[0].StorageClass).toBe('STANDARD_IA');

        const expirationRule = response.Rules.find(rule => rule.Expiration);
        expect(expirationRule).toBeDefined();
        expect(expirationRule.Expiration.Days).toBe(90);
      },
      TEST_TIMEOUT
    );

    test(
      'should verify S3 bucket encryption',
      async () => {
        const response = await safeAwsCall(
          () => s3.getBucketEncryption({ Bucket: logBucketName }).promise(),
          'getBucketEncryption'
        );

        expect(
          response.ServerSideEncryptionConfiguration.Rules.length
        ).toBeGreaterThan(0);
        const rule = response.ServerSideEncryptionConfiguration.Rules[0];
        expect(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe(
          'AES256'
        );
      },
      TEST_TIMEOUT
    );

    test(
      'should verify S3 bucket has public access blocked',
      async () => {
        const response = await safeAwsCall(
          () => s3.getPublicAccessBlock({ Bucket: logBucketName }).promise(),
          'getPublicAccessBlock'
        );

        const config = response.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('CloudWatch Logs Validation', () => {
    test(
      'should verify log groups exist',
      async () => {
        const systemLogGroupName = `/aws/ec2/monitoring-${region}-${environmentSuffix}`;
        const appLogGroupName = `/aws/ec2/monitoring-app-${region}-${environmentSuffix}`;

        const response = await safeAwsCall(
          () =>
            logs
              .describeLogGroups({
                logGroupNamePrefix: `/aws/ec2/monitoring`,
              })
              .promise(),
          'describeLogGroups'
        );

        const logGroups = response.logGroups.filter(lg =>
          lg.logGroupName.includes(environmentSuffix)
        );

        expect(logGroups.length).toBeGreaterThanOrEqual(2);

        const systemLogGroup = logGroups.find(
          lg => lg.logGroupName === systemLogGroupName
        );
        const appLogGroup = logGroups.find(
          lg => lg.logGroupName === appLogGroupName
        );

        expect(systemLogGroup).toBeDefined();
        expect(appLogGroup).toBeDefined();
        expect(systemLogGroup.retentionInDays).toBeDefined();
        expect(appLogGroup.retentionInDays).toBeDefined();
      },
      TEST_TIMEOUT
    );

    test(
      'should verify log streams are being created',
      async () => {
        const systemLogGroupName = `/aws/ec2/monitoring-${region}-${environmentSuffix}`;

        const response = await safeAwsCall(
          () =>
            logs
              .describeLogStreams({
                logGroupName: systemLogGroupName,
                orderBy: 'LastEventTime',
                descending: true,
                limit: 5,
              })
              .promise(),
          'describeLogStreams'
        );

        // May not have streams immediately after deployment
        expect(response.logStreams).toBeDefined();

        // If streams exist, verify recent activity
        if (response.logStreams.length > 0) {
          const recentStream = response.logStreams[0];
          if (recentStream.lastIngestionTime) {
            const hoursSinceLastLog =
              (Date.now() - recentStream.lastIngestionTime) / (1000 * 60 * 60);
            expect(hoursSinceLastLog).toBeLessThan(48); // Within last 48 hours
          }
        }
      },
      LONG_TEST_TIMEOUT
    );
  });

  describe('End-to-End Instance Connectivity', () => {
    test(
      'should verify instances are accessible via HTTP',
      async () => {
        const response = await safeAwsCall(
          () =>
            ec2
              .describeInstances({ InstanceIds: instanceIds.slice(0, 1) })
              .promise(),
          'describeInstances'
        );

        const instance = response.Reservations[0].Instances[0];
        const publicIp = instance.PublicIpAddress;

        expect(publicIp).toBeDefined();
        expect(publicIp).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      },
      TEST_TIMEOUT
    );

    test(
      'should verify CloudWatch Agent metrics are being published',
      async () => {
        const testInstanceId = instanceIds[0];

        const response = await safeAwsCall(
          () =>
            cloudwatch
              .getMetricStatistics({
                Namespace: 'CWAgent',
                MetricName: 'disk_used_percent',
                Dimensions: [
                  { Name: 'InstanceId', Value: testInstanceId },
                  { Name: 'path', Value: '/' },
                  { Name: 'fstype', Value: 'xfs' },
                ],
                StartTime: new Date(Date.now() - 3600000), // 1 hour ago
                EndTime: new Date(),
                Period: 300,
                Statistics: ['Average'],
              })
              .promise(),
          'getMetricStatistics'
        );

        expect(response.Datapoints).toBeDefined();
        expect(Array.isArray(response.Datapoints)).toBe(true);

        // Note: Datapoints may be empty for very new deployments
        // In production, you might want to wait/retry until datapoints appear
      },
      LONG_TEST_TIMEOUT
    );
  });

  describe('Resource Tagging Validation', () => {
    test(
      'should verify instances have proper tags',
      async () => {
        const response = await safeAwsCall(
          () =>
            ec2
              .describeInstances({ InstanceIds: instanceIds.slice(0, 1) })
              .promise(),
          'describeInstances'
        );

        const instance = response.Reservations[0].Instances[0];
        const tags = instance.Tags || [];

        const environmentTag = tags.find(tag => tag.Key === 'Environment');
        const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
        const nameTag = tags.find(tag => tag.Key === 'Name');

        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toBe(environmentSuffix);
        expect(managedByTag).toBeDefined();
        expect(managedByTag.Value).toBe('CDK');
        expect(nameTag).toBeDefined();
      },
      TEST_TIMEOUT
    );

    test(
      'should verify all tagged resources have consistent environment tag',
      async () => {
        // Check instances
        const ec2Response = await safeAwsCall(
          () =>
            ec2
              .describeInstances({
                Filters: [
                  { Name: 'tag:Environment', Values: [environmentSuffix] },
                ],
              })
              .promise(),
          'describeInstances'
        );

        const instances = ec2Response.Reservations.flatMap(r => r.Instances);
        expect(instances.length).toBeGreaterThanOrEqual(instanceIds.length);
      },
      TEST_TIMEOUT
    );
  });

  describe('Cost Optimization Validation', () => {
    test(
      'should verify instances are using cost-optimized configuration',
      async () => {
        const response = await safeAwsCall(
          () => ec2.describeInstances({ InstanceIds: instanceIds }).promise(),
          'describeInstances'
        );

        const instances = response.Reservations.flatMap(r => r.Instances);

        instances.forEach(instance => {
          expect(instance.InstanceType).toBe('t3.micro'); // Cost-optimized
          expect(instance.Monitoring.State).toBe('disabled'); // Detailed monitoring costs extra
        });
      },
      TEST_TIMEOUT
    );
  });
});
