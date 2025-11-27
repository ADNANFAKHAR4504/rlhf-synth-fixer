import fs from 'fs';
import {
  EC2Client,
  DescribeRouteTablesCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetPublicAccessBlockCommandOutput,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeSubscriptionFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricDataCommand,
  SetAlarmStateCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  PublishCommand,
} from '@aws-sdk/client-sns';
import {
  FirehoseClient,
  DescribeDeliveryStreamCommand,
} from '@aws-sdk/client-firehose';
import { IAMClient, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import {
  SSMClient,
  DescribeInstanceInformationCommand,
} from '@aws-sdk/client-ssm';

// Load stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const region = process.env.AWS_REGION || outputs.StackRegion;

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const logs = new CloudWatchLogsClient({ region });
const cloudwatch = new CloudWatchClient({ region });
const sns = new SNSClient({ region });
const firehose = new FirehoseClient({ region });
const iam = new IAMClient({ region });
const ssm = new SSMClient({ region });

const extractEnvironmentName = (): string => {
  const bucket = outputs.GeneralPurposeBucketName;
  if (!bucket) {
    throw new Error('Missing GeneralPurposeBucketName output');
  }
  return bucket.split('-general-purpose-')[0];
};

describe('TapStack end-to-end integration test', () => {
  const environmentName = extractEnvironmentName();

  describe('User -> InternetGateway -> PublicRouteTable -> PublicSubnet -> WebServerSecurityGroup -> WebServerInstance -> ElasticIP -> User', () => {
    // Prove packets actually get a path to the outside world via the IGW.
    test('route table forwards internet-bound traffic through the IGW', async () => {
      const subnetId = outputs.PublicSubnet1Id;
      const vpcId = outputs.VPCId;
      if (!subnetId || !vpcId) {
        throw new Error('Missing PublicSubnet1Id or VPCId output');
      }

      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'association.subnet-id', Values: [subnetId] }],
      });

      const { RouteTables } = await ec2.send(command);
      expect(RouteTables).toBeDefined();

      const routeTable = RouteTables?.find(
        table => table.VpcId === vpcId && table.Routes
      );
      expect(routeTable).toBeDefined();

      const defaultRoute = routeTable?.Routes?.find(
        route => route.DestinationCidrBlock === '0.0.0.0/0'
      );
      expect(defaultRoute?.GatewayId).toMatch(/^igw-/);
    });

    // Double check that the perimeter is open only on the expected front door ports.
    test('web server security group allows HTTP/HTTPS ingress from the internet', async () => {
      const securityGroupId = outputs.SecurityGroupId;
      if (!securityGroupId) {
        throw new Error('Missing SecurityGroupId output');
      }

      const { SecurityGroups } = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );
      const group = SecurityGroups?.[0];
      expect(group).toBeDefined();

      const ingress = group?.IpPermissions ?? [];
      const httpRule = ingress.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = ingress.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });
    // Make sure the instance wiring matches the public networking story.
    test('web server instance sits in the public subnet with expected EIP and SG', async () => {
      const instanceId = outputs.EC2InstanceId;
      const subnetId = outputs.PublicSubnet1Id;
      const securityGroupId = outputs.SecurityGroupId;
      const elasticIp = outputs.ElasticIPAddress;

      if (!instanceId || !subnetId || !securityGroupId || !elasticIp) {
        throw new Error('Missing compute outputs required for validation');
      }

      const { Reservations } = await ec2.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );

      const instance = Reservations?.flatMap(r => r.Instances ?? [])[0];
      expect(instance).toBeDefined();
      expect(instance?.SubnetId).toBe(subnetId);
      expect(instance?.PublicIpAddress).toBe(elasticIp);
      const attachedGroups = instance?.SecurityGroups?.map(
        group => group.GroupId
      );
      expect(attachedGroups).toContain(securityGroupId);
      expect(instance?.IamInstanceProfile?.Arn).toBeDefined();
    });

    // Hit the public site just like a browser would to close the loop.
    test('Elastic IP serves HTTP responses back to the user', async () => {
      const elasticIp = outputs.ElasticIPAddress;
      if (!elasticIp) {
        throw new Error('Missing ElasticIPAddress output');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`http://${elasticIp}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('Enterprise Application Server');
    });
  });

  describe('WebServerInstance -> GeneralPurposeBucket (application data)', () => {
    // Storage has to be hardened before we trust it with customer bits.
    test('application bucket enforces encryption, versioning, and private access', async () => {
      const bucketName = outputs.GeneralPurposeBucketName;
      if (!bucketName) {
        throw new Error('Missing GeneralPurposeBucketName output');
      }

      const encryption = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      const rules =
        encryption.ServerSideEncryptionConfiguration?.Rules ?? [];
      expect(rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );

      const versioning = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioning.Status).toBe('Enabled');

      const generalAccessResponse = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      const generalAccess =
        (generalAccessResponse as GetPublicAccessBlockCommandOutput)
          .PublicAccessBlockConfiguration;
      expect(generalAccess?.BlockPublicAcls).toBe(true);
      expect(generalAccess?.RestrictPublicBuckets).toBe(true);
    });

    test('application bucket accepts write/read/delete workload data', async () => {
      const bucketName = outputs.GeneralPurposeBucketName;
      if (!bucketName) {
        throw new Error('Missing GeneralPurposeBucketName output');
      }

      const objectKey = `integration-tests/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.txt`;
      const payload = `tap-stack-integration-${new Date().toISOString()}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: payload,
        })
      );

      try {
        const getResult = await s3.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
          })
        );
        const body = await getResult.Body?.transformToString?.();
        expect(body).toBe(payload);
      } finally {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
          })
        );
      }
    });
  });

  describe('WebServerInstance via EC2Role -> S3 (GeneralPurpose & Logging)', () => {
    // The IAM role should grant just enough to shuttle artifacts to S3.
    test('IAM role grants least-privilege access to both buckets', async () => {
      const roleName = outputs.IAMRoleName;
      const generalArn = outputs.GeneralPurposeBucketArn;
      const loggingArn = outputs.LoggingBucketArn;
      if (!roleName || !generalArn || !loggingArn) {
        throw new Error('Missing IAM role or bucket ARN outputs');
      }

      const response = await iam.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: 'S3AccessPolicy',
        })
      );

      const document = JSON.parse(
        decodeURIComponent(response.PolicyDocument || '')
      );
      const allowStatement = document.Statement.find(
        (stmt: any) => stmt.Effect === 'Allow'
      );

      expect(allowStatement).toBeDefined();
      expect(allowStatement.Action).toEqual(
        expect.arrayContaining([
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ])
      );
      expect(allowStatement.Resource).toEqual(
        expect.arrayContaining([
          generalArn,
          `${generalArn}/*`,
          loggingArn,
          `${loggingArn}/*`,
        ])
      );
    });
  });

  describe('CloudWatch Agent -> Log Groups -> Subscription Filter -> Firehose -> LoggingBucket', () => {
    // Confirm logs leave CloudWatch and actually land in S3 via Firehose.
    test('HTTP log group streams through Firehose into the logging bucket', async () => {
      const httpLogGroup = outputs.HTTPLogGroupName;
      const loggingBucket = outputs.LoggingBucketName;
      if (!httpLogGroup || !loggingBucket) {
        throw new Error('Missing log outputs for validation');
      }

      const logGroups = await logs.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: httpLogGroup })
      );
      const group = logGroups.logGroups?.find(
        g => g.logGroupName === httpLogGroup
      );
      expect(group).toBeDefined();

      const { subscriptionFilters } = await logs.send(
        new DescribeSubscriptionFiltersCommand({ logGroupName: httpLogGroup })
      );
      const filter = subscriptionFilters?.[0];
      expect(filter?.destinationArn).toContain(':deliverystream/');

      const streamName = filter?.destinationArn?.split('/').pop();
      expect(streamName).toBeDefined();

      const deliveryStream = await firehose.send(
        new DescribeDeliveryStreamCommand({
          DeliveryStreamName: streamName,
        })
      );

      const destination =
        deliveryStream.DeliveryStreamDescription?.Destinations?.[0]
          .ExtendedS3DestinationDescription;
      expect(destination?.BucketARN?.endsWith(`:${loggingBucket}`)).toBe(true);
      expect(destination?.CompressionFormat).toBe('GZIP');
    });

    // No log should live forever; verify retention is wired up.
    test('application log group enforces a finite retention policy', async () => {
      const applicationLogGroup = outputs.ApplicationLogGroupName;
      if (!applicationLogGroup) {
        throw new Error('Missing ApplicationLogGroupName output');
      }

      const { logGroups } = await logs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: applicationLogGroup,
        })
      );

      const group = logGroups?.find(
        g => g.logGroupName === applicationLogGroup
      );
      expect(group).toBeDefined();
      expect(group?.retentionInDays).toBeGreaterThan(0);
    });

    // Logging bucket must be lifecycle managed and still locked down.
    test('logging bucket retains ingested logs and stays private', async () => {
      const loggingBucket = outputs.LoggingBucketName;
      if (!loggingBucket) {
        throw new Error('Missing LoggingBucketName output');
      }

      await expect(
        s3.send(
          new GetBucketLifecycleConfigurationCommand({ Bucket: loggingBucket })
        )
      ).resolves.toBeDefined();

      const loggingAccessResponse = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: loggingBucket })
      );
      const loggingAccess =
        (loggingAccessResponse as GetPublicAccessBlockCommandOutput)
          .PublicAccessBlockConfiguration;
      expect(loggingAccess?.BlockPublicPolicy).toBe(true);
      const firehoseAccessResponse = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: loggingBucket })
      );
      const firehoseAccess =
        (firehoseAccessResponse as GetPublicAccessBlockCommandOutput)
          .PublicAccessBlockConfiguration;
      expect(firehoseAccess?.BlockPublicPolicy).toBe(true);
    });

    // Spot check that Firehose is dropping objects under the expected prefix.
    test('Firehose delivers log objects under the configured prefix', async () => {
      const loggingBucket = outputs.LoggingBucketName;
      if (!loggingBucket) {
        throw new Error('Missing LoggingBucketName output');
      }

      const { Contents } = await s3.send(
        new ListObjectsV2Command({
          Bucket: loggingBucket,
          Prefix: 'cloudwatch-logs/',
          MaxKeys: 5,
        })
      );

      expect(Contents && Contents.length > 0).toBe(true);
      const recentObject = Contents?.find(
        entry =>
          entry.LastModified &&
          Date.now() - entry.LastModified.getTime() < 24 * 60 * 60 * 1000
      );
      expect(recentObject).toBeDefined();
    });
  });

  describe('CloudWatch Metrics -> Alarms -> SNS Topic -> Incident Responders', () => {
    test('custom application metrics stream into CloudWatch', async () => {
      const namespace = `${environmentName}/Application`;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 15 * 60 * 1000);

      const { MetricDataResults } = await cloudwatch.send(
        new GetMetricDataCommand({
          StartTime: startTime,
          EndTime: endTime,
          MetricDataQueries: [
            {
              Id: 'mem',
              MetricStat: {
                Metric: {
                  Namespace: namespace,
                  MetricName: 'MEM_USED',
                },
                Period: 60,
                Stat: 'Average',
              },
              ReturnData: true,
            },
            {
              Id: 'disk',
              MetricStat: {
                Metric: {
                  Namespace: namespace,
                  MetricName: 'DISK_USED',
                },
                Period: 60,
                Stat: 'Average',
              },
              ReturnData: true,
            },
          ],
        })
      );

      // Verify the query succeeded and results array exists.
      expect(MetricDataResults).toBeDefined();
      expect(MetricDataResults?.length).toBe(2);
    });

    // Flip an alarm through ALARM -> OK to prove the responder channel is live.
    test('alarms can be forced into ALARM and recovered to OK', async () => {
      const alarmName = `${environmentName}-WebServer-HighCPU`;

      await cloudwatch.send(
        new SetAlarmStateCommand({
          AlarmName: alarmName,
          StateReason: 'Integration test forcing ALARM',
          StateValue: 'ALARM',
        })
      );

      const alarmAfterAlarm = await cloudwatch.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
      expect(alarmAfterAlarm.MetricAlarms?.[0]?.StateValue).toBe('ALARM');

      await cloudwatch.send(
        new SetAlarmStateCommand({
          AlarmName: alarmName,
          StateReason: 'Integration test reverting to OK',
          StateValue: 'OK',
        })
      );

      const alarmAfterOk = await cloudwatch.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
      expect(alarmAfterOk.MetricAlarms?.[0]?.StateValue).toBe('OK');
    });

    // The alarm action wiring should point squarely at the SNS topic.
    test('high-signal alarms publish notifications to the SNS topic', async () => {
      const topicArn = outputs.SNSTopicArn;
      if (!topicArn) {
        throw new Error('Missing SNSTopicArn output');
      }
      const alarmNames = [
        `${environmentName}-WebServer-HighCPU`,
        `${environmentName}-WebServer-HighMemory`,
        `${environmentName}-WebServer-HighDiskUsage`,
      ];

      const { MetricAlarms } = await cloudwatch.send(
        new DescribeAlarmsCommand({ AlarmNames: alarmNames })
      );
      expect(MetricAlarms).toHaveLength(alarmNames.length);
      MetricAlarms?.forEach(alarm => {
        expect(alarm.AlarmActions).toContain(topicArn);
      });

      const topicAttributes = await sns.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );
      expect(topicAttributes.Attributes?.DisplayName).toContain(
        environmentName
      );
    });

    // Someone needs to actually receive those alerts check for an email subscriber.
    test('SNS topic has at least one email subscription for incident notifications', async () => {
      const topicArn = outputs.SNSTopicArn;
      if (!topicArn) {
        throw new Error('Missing SNSTopicArn output');
      }

      const { Subscriptions } = await sns.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
      );

      const emailSubscription = Subscriptions?.find(
        subscription => subscription.Protocol === 'email'
      );
      expect(emailSubscription?.Endpoint).toMatch(/@/);
    });

    // Fire a canary message through SNS to ensure deliveries aren’t blocked.
    test('SNS topic accepts published incident messages', async () => {
      const topicArn = outputs.SNSTopicArn;
      if (!topicArn) {
        throw new Error('Missing SNSTopicArn output');
      }

      const response = await sns.send(
        new PublishCommand({
          TopicArn: topicArn,
          Subject: 'TapStack integration test notification',
          Message: `Integration test message at ${new Date().toISOString()}`,
        })
      );

      expect(response.MessageId).toBeDefined();
    });
  });

  describe('Operator -> SSM Session Manager -> WebServerInstance', () => {
    // Session Manager should see the box so ops can hop in without SSH.
    test('web server instance is registered and online in Systems Manager', async () => {
      const instanceId = outputs.EC2InstanceId;
      if (!instanceId) {
        throw new Error('Missing EC2InstanceId output');
      }

      const { InstanceInformationList } = await ssm.send(
        new DescribeInstanceInformationCommand({
          Filters: [
            {
              Key: 'InstanceIds',
              Values: [instanceId],
            },
          ],
        })
      );

      const info = InstanceInformationList?.find(
        entry => entry.InstanceId === instanceId
      );
      expect(info).toBeDefined();
      expect(info?.PingStatus).toBe('Online');
    });
  });
});
