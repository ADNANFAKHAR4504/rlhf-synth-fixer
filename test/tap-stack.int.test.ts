//fix int test
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from '@aws-sdk/client-rds';
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand,
  DescribeLoadBalancerAttributesCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  S3Client, 
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  ListBucketsCommand,
  GetBucketTaggingCommand
} from '@aws-sdk/client-s3';
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand 
} from '@aws-sdk/client-auto-scaling';
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand 
} from '@aws-sdk/client-cloudwatch';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
let hasOutputs = false;

try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
    hasOutputs = true;
  }
} catch (error) {
  console.log('No deployment outputs found, integration tests will be skipped');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// AWS clients configured for us-west-2 region from the prompt
const awsConfig = { region: 'us-west-2' };
const ec2Client = new EC2Client(awsConfig);
const rdsClient = new RDSClient(awsConfig);
const elbv2Client = new ElasticLoadBalancingV2Client(awsConfig);
const s3Client = new S3Client(awsConfig);
const autoScalingClient = new AutoScalingClient(awsConfig);
const cloudWatchClient = new CloudWatchClient(awsConfig);

// Helper function to create a filter for querying resources by tags
const createTagFilter = () => [
  { Name: 'tag:Project', Values: ['SecureCloudEnvironment'] },
  { Name: 'tag:Environment', Values: [environmentSuffix] }
];

describe('TapStack Integration Tests', () => {
  // Conditional test execution based on whether outputs file exists
  const itif = (condition: boolean) => (condition ? it : it.skip);

  describe('VPC Infrastructure', () => {
    itif(hasOutputs)('should have VPC in us-west-2 region with correct configuration', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        Filters: createTagFilter()
      }));

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
    });

    itif(hasOutputs)('should have subnets distributed across multiple AZs', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: createTagFilter()
      }));

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(6); // 2 public + 2 private-app + 2 private-db

      const availabilityZones = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Bastion Host', () => {
    itif(hasOutputs)('should have bastion host running', async () => {
        const response = await ec2Client.send(new DescribeInstancesCommand({
            Filters: [
                ...createTagFilter(),
                { Name: 'tag:aws:cloudformation:logical-id', Values: ['BastionHost*'] },
                { Name: 'instance-state-name', Values: ['running'] }
            ]
        }));

        expect(response.Reservations).toBeDefined();
        expect(response.Reservations!.length).toBeGreaterThan(0);
        const instance = response.Reservations![0].Instances![0];
        expect(instance.InstanceType).toBe('t3.nano');
    });
  });
  
  describe('Application Load Balancer', () => {
    itif(hasOutputs)('should have ALB running and logging enabled', async () => {
      // Get the ALB DNS from outputs to identify the correct load balancer
      const albDns = outputs.ALB_DNS || outputs.ALBDNS;
      expect(albDns).toBeDefined();
      
      const response = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      
      const allLoadBalancers = response.LoadBalancers || [];
      const targetLoadBalancer = allLoadBalancers.find(lb => lb.DNSName === albDns);

      expect(targetLoadBalancer).toBeDefined();
      const alb = targetLoadBalancer!;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State?.Code).toBe('active');
      
      const attributesResponse = await elbv2Client.send(new DescribeLoadBalancerAttributesCommand({
        LoadBalancerArn: alb.LoadBalancerArn
      }));
      
      const accessLogsEnabled = attributesResponse.Attributes?.find((attr: any) => attr.Key === 'access_logs.s3.enabled');
      expect(accessLogsEnabled?.Value).toBe('true');
    });
  });

  describe('Auto Scaling Group', () => {
    itif(hasOutputs)('should have ASG with correct configuration', async () => {
      // FIX: Find the ASG using tags
      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        Filters: createTagFilter().map(f => ({ Name: `tag:${f.Name.split(':')[1]}`, Values: f.Values }))
      }));

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBe(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(5);
      expect(asg.DesiredCapacity).toBe(2);
    });
  });

  describe('RDS Database', () => {
    itif(hasOutputs)('should have MySQL database with correct configuration', async () => {
      // Use the database endpoint to find the database instance
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();
      
      // Extract the identifier from the endpoint (it's the part before the first dot)
      const dbIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });
  });

  describe('S3 Storage', () => {
    itif(hasOutputs)('should have S3 bucket with versioning and encryption enabled', async () => {
      // Find the log bucket using tags since there's no output for it currently
      const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
      expect(bucketsResponse.Buckets).toBeDefined();
      
      let logBucket = null;
      for (const bucket of bucketsResponse.Buckets!) {
        try {
          const tagsResponse = await s3Client.send(new GetBucketTaggingCommand({
            Bucket: bucket.Name!
          }));
          
          const hasProjectTag = tagsResponse.TagSet?.some(tag => 
            tag.Key === 'Project' && tag.Value === 'SecureCloudEnvironment'
          );
          const hasEnvTag = tagsResponse.TagSet?.some(tag => 
            tag.Key === 'Environment' && tag.Value === environmentSuffix
          );
          
          if (hasProjectTag && hasEnvTag) {
            logBucket = bucket.Name;
            break;
          }
        } catch (error) {
          // Bucket might not have tags, continue
          continue;
        }
      }
      
      expect(logBucket).toBeDefined();

      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: logBucket!
      }));
      expect(versioningResponse.Status).toBe('Enabled');

      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: logBucket!
      }));
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('CloudWatch Monitoring', () => {
    itif(hasOutputs)('should have CloudWatch alarms configured', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `${stackName}-HighCpuAlarmASG`,
      }));

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      // FIX: The namespace for ASG CPU metrics is AWS/EC2, aggregated by ASG name.
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Threshold).toBe(85);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });
});
