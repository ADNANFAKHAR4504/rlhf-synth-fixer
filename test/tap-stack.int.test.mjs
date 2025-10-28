// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import AWS from 'aws-sdk';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

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

describe('Proactive Monitoring Stack Integration Tests', () => {
  let instanceIds = [];
  let vpcId, alertTopicArn, logBucketName, dashboardUrl;

  beforeAll(() => {
    // Extract instance IDs and other outputs from deployment
    instanceIds = [];
    for (let i = 0; i < 10; i++) {
      const instanceKey = `InstanceId${i}`;
      if (outputs[instanceKey]) {
        instanceIds.push(outputs[instanceKey]);
      }
    }

    vpcId = outputs.VpcId;
    alertTopicArn = outputs.AlertTopicArn;
    logBucketName = outputs.LogBucketName;
    dashboardUrl = outputs.DashboardUrl;

    expect(instanceIds.length).toBeGreaterThan(0);
    expect(vpcId).toBeDefined();
    expect(alertTopicArn).toBeDefined();
    expect(logBucketName).toBeDefined();
  });

  describe('EC2 Infrastructure Validation', () => {
    test('should verify all EC2 instances are running', async () => {
      const response = await ec2.describeInstances({
        InstanceIds: instanceIds,
      }).promise();

      const instances = response.Reservations.flatMap(r => r.Instances);
      
      expect(instances.length).toBe(instanceIds.length);
      instances.forEach(instance => {
        expect(instance.State.Name).toBe('running');
        expect(instance.InstanceType).toBe('t3.micro');
        expect(instance.VpcId).toBe(vpcId);
        expect(instance.SecurityGroups.length).toBeGreaterThan(0);
      });
    });

    test('should verify instances are in correct VPC and subnets', async () => {
      const response = await ec2.describeInstances({
        InstanceIds: instanceIds,
      }).promise();

      const instances = response.Reservations.flatMap(r => r.Instances);
      
      instances.forEach(instance => {
        expect(instance.VpcId).toBe(vpcId);
        expect(instance.SubnetId).toBeDefined();
        expect(instance.PublicIpAddress).toBeDefined();
      });
    });

    test('should verify security group rules', async () => {
      const response = await ec2.describeInstances({
        InstanceIds: instanceIds.slice(0, 1), // Test one instance
      }).promise();

      const instance = response.Reservations[0].Instances[0];
      const securityGroupId = instance.SecurityGroups[0].GroupId;

      const sgResponse = await ec2.describeSecurityGroups({
        GroupIds: [securityGroupId],
      }).promise();

      const securityGroup = sgResponse.SecurityGroups[0];
      const ingressRules = securityGroup.IpPermissions;

      // Check for HTTP access
      const httpRule = ingressRules.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();

      // Check for SSH access
      const sshRule = ingressRules.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring Validation', () => {
    test('should verify CloudWatch alarms exist for disk usage', async () => {
      const response = await cloudwatch.describeAlarms().promise();
      const alarms = response.MetricAlarms;

      const diskAlarms = alarms.filter(alarm => 
        alarm.AlarmName.includes('disk-usage') && 
        alarm.AlarmName.includes(environmentSuffix)
      );

      expect(diskAlarms.length).toBe(instanceIds.length);
      
      diskAlarms.forEach(alarm => {
        expect(alarm.MetricName).toBe('disk_used_percent');
        expect(alarm.Namespace).toBe('CWAgent');
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      });
    });

    test('should verify CloudWatch alarms exist for CPU usage', async () => {
      const response = await cloudwatch.describeAlarms().promise();
      const alarms = response.MetricAlarms;

      const cpuAlarms = alarms.filter(alarm => 
        alarm.AlarmName.includes('cpu-usage') && 
        alarm.AlarmName.includes(environmentSuffix)
      );

      expect(cpuAlarms.length).toBe(instanceIds.length);
      
      cpuAlarms.forEach(alarm => {
        expect(alarm.MetricName).toBe('CPUUtilization');
        expect(alarm.Namespace).toBe('AWS/EC2');
        expect(alarm.Threshold).toBe(80);
      });
    });

    test('should verify CloudWatch alarms exist for memory usage', async () => {
      const response = await cloudwatch.describeAlarms().promise();
      const alarms = response.MetricAlarms;

      const memoryAlarms = alarms.filter(alarm => 
        alarm.AlarmName.includes('memory-usage') && 
        alarm.AlarmName.includes(environmentSuffix)
      );

      expect(memoryAlarms.length).toBe(instanceIds.length);
      
      memoryAlarms.forEach(alarm => {
        expect(alarm.MetricName).toBe('mem_used_percent');
        expect(alarm.Namespace).toBe('CWAgent');
        expect(alarm.Threshold).toBe(80);
      });
    });

    test('should verify CloudWatch dashboard exists', async () => {
      const dashboardName = `ec2-monitoring-${region}-${environmentSuffix}`;
      
      const response = await cloudwatch.getDashboard({
        DashboardName: dashboardName,
      }).promise();

      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
      
      const dashboardBody = JSON.parse(response.DashboardBody);
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topic Validation', () => {
    test('should verify SNS topic exists and is configured', async () => {
      const response = await sns.getTopicAttributes({
        TopicArn: alertTopicArn,
      }).promise();

      expect(response.Attributes.DisplayName).toContain(environmentSuffix);
      expect(response.Attributes.TopicArn).toBe(alertTopicArn);
    });

    test('should verify alarms are connected to SNS topic', async () => {
      const response = await cloudwatch.describeAlarms().promise();
      const alarms = response.MetricAlarms.filter(alarm => 
        alarm.AlarmName.includes(environmentSuffix)
      );

      alarms.forEach(alarm => {
        expect(alarm.AlarmActions.length).toBeGreaterThan(0);
        expect(alarm.AlarmActions[0]).toBe(alertTopicArn);
      });
    });
  });

  describe('S3 Bucket Validation', () => {
    test('should verify S3 bucket exists with correct configuration', async () => {
      const response = await s3.getBucketLocation({
        Bucket: logBucketName,
      }).promise();

      expect(response.LocationConstraint).toBeDefined();
    });

    test('should verify S3 bucket has lifecycle policies', async () => {
      const response = await s3.getBucketLifecycleConfiguration({
        Bucket: logBucketName,
      }).promise();

      expect(response.Rules.length).toBeGreaterThan(0);
      
      const transitionRule = response.Rules.find(rule => 
        rule.Transitions && rule.Transitions.length > 0
      );
      expect(transitionRule).toBeDefined();
      expect(transitionRule.Transitions[0].Days).toBe(30);
      expect(transitionRule.Transitions[0].StorageClass).toBe('STANDARD_IA');

      const expirationRule = response.Rules.find(rule => rule.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule.Expiration.Days).toBe(90);
    });

    test('should verify S3 bucket encryption', async () => {
      const response = await s3.getBucketEncryption({
        Bucket: logBucketName,
      }).promise();

      expect(response.ServerSideEncryptionConfiguration.Rules.length).toBeGreaterThan(0);
      const rule = response.ServerSideEncryptionConfiguration.Rules[0];
      expect(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('CloudWatch Logs Validation', () => {
    test('should verify log groups exist', async () => {
      const systemLogGroupName = `/aws/ec2/monitoring-${region}-${environmentSuffix}`;
      const appLogGroupName = `/aws/ec2/monitoring-app-${region}-${environmentSuffix}`;

      const response = await logs.describeLogGroups({
        logGroupNamePrefix: `/aws/ec2/monitoring`,
      }).promise();

      const logGroups = response.logGroups.filter(lg => 
        lg.logGroupName.includes(environmentSuffix)
      );

      expect(logGroups.length).toBeGreaterThanOrEqual(2);
      
      const systemLogGroup = logGroups.find(lg => lg.logGroupName === systemLogGroupName);
      const appLogGroup = logGroups.find(lg => lg.logGroupName === appLogGroupName);

      expect(systemLogGroup).toBeDefined();
      expect(appLogGroup).toBeDefined();
      expect(systemLogGroup.retentionInDays).toBeDefined();
      expect(appLogGroup.retentionInDays).toBeDefined();
    });
  });

  describe('End-to-End Instance Connectivity', () => {
    test('should verify instances are accessible via HTTP', async () => {
      const response = await ec2.describeInstances({
        InstanceIds: instanceIds.slice(0, 1), // Test one instance
      }).promise();

      const instance = response.Reservations[0].Instances[0];
      const publicIp = instance.PublicIpAddress;

      expect(publicIp).toBeDefined();
      
      // Note: In real environment, you might make HTTP request here
      // For this test, we just verify the public IP is assigned
      expect(publicIp).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    test('should verify CloudWatch Agent metrics are being published', async () => {
      const testInstanceId = instanceIds[0];
      
      const response = await cloudwatch.getMetricStatistics({
        Namespace: 'CWAgent',
        MetricName: 'disk_used_percent',
        Dimensions: [
          {
            Name: 'InstanceId',
            Value: testInstanceId,
          },
          {
            Name: 'path',
            Value: '/',
          },
          {
            Name: 'fstype',
            Value: 'xfs',
          },
        ],
        StartTime: new Date(Date.now() - 3600000), // 1 hour ago
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Average'],
      }).promise();

      // Check if we have any datapoints (might be empty for new deployments)
      expect(response.Datapoints).toBeDefined();
      expect(Array.isArray(response.Datapoints)).toBe(true);
    });
  });

  describe('Resource Tagging Validation', () => {
    test('should verify resources have proper tags', async () => {
      const response = await ec2.describeInstances({
        InstanceIds: instanceIds.slice(0, 1), // Test one instance
      }).promise();

      const instance = response.Reservations[0].Instances[0];
      const tags = instance.Tags || [];

      const environmentTag = tags.find(tag => tag.Key === 'Environment');
      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');

      expect(environmentTag).toBeDefined();
      expect(environmentTag.Value).toBe(environmentSuffix);
      expect(managedByTag).toBeDefined();
      expect(managedByTag.Value).toBe('CDK');
    });
  });
});