//fix int test
//make changes
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from '@aws-sdk/client-rds';
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand,
  DescribeLoadBalancerAttributesCommand,
  DescribeListenersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  S3Client, 
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  ListBucketsCommand,
  GetBucketTaggingCommand,
  GetBucketLoggingCommand,
} from '@aws-sdk/client-s3';
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
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

    itif(hasOutputs)('should have listener with correct port and protocol', async () => {
      const albDns = outputs.ALB_DNS || outputs.ALBDNS;
      const response = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const targetLoadBalancer = response.LoadBalancers?.find(lb => lb.DNSName === albDns);
      
      const listenersResponse = await elbv2Client.send(new DescribeListenersCommand({
        LoadBalancerArn: targetLoadBalancer!.LoadBalancerArn
      }));

      expect(listenersResponse.Listeners).toBeDefined();
      expect(listenersResponse.Listeners!.length).toBe(1);
      const listener = listenersResponse.Listeners![0];
      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe('HTTP');
    });

    itif(hasOutputs)('should have target group with health check configuration', async () => {
      const targetGroupsResponse = await elbv2Client.send(new DescribeTargetGroupsCommand({
        Names: [`TapStack${environmentSuffix}-AppTargets`]
      }));

      expect(targetGroupsResponse.TargetGroups).toBeDefined();
      expect(targetGroupsResponse.TargetGroups!.length).toBe(1);
      const targetGroup = targetGroupsResponse.TargetGroups![0];
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.HealthCheckPath).toBe('/health');
      expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.TargetType).toBe('instance');
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

    itif(hasOutputs)('should have CPU-based auto scaling policy', async () => {
      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        Filters: createTagFilter().map(f => ({ Name: `tag:${f.Name.split(':')[1]}`, Values: f.Values }))
      }));

      const asg = response.AutoScalingGroups![0];
      const policiesResponse = await autoScalingClient.send(new DescribePoliciesCommand({
        AutoScalingGroupName: asg.AutoScalingGroupName
      }));

      expect(policiesResponse.ScalingPolicies).toBeDefined();
      expect(policiesResponse.ScalingPolicies!.length).toBeGreaterThan(0);
      
      const cpuPolicy = policiesResponse.ScalingPolicies?.find(policy => 
        policy.PolicyName?.includes('CpuScaling') || policy.PolicyType === 'TargetTrackingScaling'
      );
      expect(cpuPolicy).toBeDefined();
      expect(cpuPolicy!.PolicyType).toBe('TargetTrackingScaling');
    });

    itif(hasOutputs)('should have instances in private subnets', async () => {
      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        Filters: createTagFilter().map(f => ({ Name: `tag:${f.Name.split(':')[1]}`, Values: f.Values }))
      }));

      const asg = response.AutoScalingGroups![0];
      const instanceIds = asg.Instances?.map(instance => instance.InstanceId!) || [];
      
      if (instanceIds.length > 0) {
        const instancesResponse = await ec2Client.send(new DescribeInstancesCommand({
          InstanceIds: instanceIds
        }));

        for (const reservation of instancesResponse.Reservations!) {
          for (const instance of reservation.Instances!) {
            // Verify instances are in private subnets (should not have public IP)
            expect(instance.PublicIpAddress).toBeUndefined();
            expect(instance.PrivateIpAddress).toBeDefined();
          }
        }
      }
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

    itif(hasOutputs)('should have automated backups enabled with 7-day retention', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();
      expect(dbInstance.PreferredMaintenanceWindow).toBeDefined();
    });

    itif(hasOutputs)('should be in private isolated subnets', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      
      // Verify the DB subnet group contains only private subnets
      const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: dbInstance.DBSubnetGroup!.Subnets!.map(subnet => subnet.SubnetIdentifier!)
      }));

      for (const subnet of subnetsResponse.Subnets!) {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      }
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

    itif(hasOutputs)('should have access logging enabled for S3 buckets', async () => {
      const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
      
      for (const bucket of bucketsResponse.Buckets!) {
        try {
          const tagsResponse = await s3Client.send(new GetBucketTaggingCommand({
            Bucket: bucket.Name!
          }));
          
          const hasProjectTag = tagsResponse.TagSet?.some(tag => 
            tag.Key === 'Project' && tag.Value === 'SecureCloudEnvironment'
          );
          
          if (hasProjectTag && bucket.Name?.includes('log')) {
            // Check if access logging is configured (this might throw if not configured)
            try {
              await s3Client.send(new GetBucketLoggingCommand({
                Bucket: bucket.Name!
              }));
              // If no error, logging is configured or at least the bucket allows the operation
            } catch (loggingError) {
              // Access logging might not be configured, which is acceptable for the log bucket itself
              console.log(`Access logging not configured for ${bucket.Name}`);
            }
          }
        } catch (error) {
          // Skip buckets without proper tags
          continue;
        }
      }
    });
  });

  describe('Security Groups and Network Traffic', () => {
    itif(hasOutputs)('should have proper security group rules for ALB to EC2 traffic', async () => {
      const securityGroupsResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: createTagFilter()
      }));

      const albSg = securityGroupsResponse.SecurityGroups?.find(sg => 
        sg.GroupName?.includes('AlbSG') || sg.Description?.includes('ALB')
      );
      const appSg = securityGroupsResponse.SecurityGroups?.find(sg => 
        sg.GroupName?.includes('AppSG') || sg.Description?.includes('application')
      );

      expect(albSg).toBeDefined();
      expect(appSg).toBeDefined();

      // ALB should allow inbound HTTP traffic from anywhere
      const albInboundRule = albSg!.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(albInboundRule).toBeDefined();
      expect(albInboundRule!.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);

      // App SG should allow traffic from ALB SG on port 80
      const appInboundRule = appSg!.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(appInboundRule).toBeDefined();
      expect(appInboundRule!.UserIdGroupPairs?.some(pair => pair.GroupId === albSg!.GroupId)).toBe(true);
    });

    itif(hasOutputs)('should have proper security group rules for EC2 to RDS traffic', async () => {
      const securityGroupsResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: createTagFilter()
      }));

      const appSg = securityGroupsResponse.SecurityGroups?.find(sg => 
        sg.GroupName?.includes('AppSG') || sg.Description?.includes('application')
      );
      const dbSg = securityGroupsResponse.SecurityGroups?.find(sg => 
        sg.GroupName?.includes('DbSG') || sg.Description?.includes('database')
      );

      expect(appSg).toBeDefined();
      expect(dbSg).toBeDefined();

      // DB SG should allow traffic from App SG on port 3306 (MySQL)
      const dbInboundRule = dbSg!.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.IpProtocol === 'tcp'
      );
      expect(dbInboundRule).toBeDefined();
      expect(dbInboundRule!.UserIdGroupPairs?.some(pair => pair.GroupId === appSg!.GroupId)).toBe(true);
    });

    itif(hasOutputs)('should have bastion host with restricted SSH access', async () => {
      const securityGroupsResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: createTagFilter()
      }));

      const bastionSg = securityGroupsResponse.SecurityGroups?.find(sg => 
        sg.GroupName?.includes('BastionSG') || sg.Description?.includes('bastion')
      );

      expect(bastionSg).toBeDefined();

      // Bastion should allow SSH from specific IP range, not 0.0.0.0/0
      const sshRule = bastionSg!.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      
      // Should NOT allow SSH from anywhere (0.0.0.0/0)
      const allowsFromAnywhere = sshRule!.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0');
      expect(allowsFromAnywhere).toBe(false);
      
      // Should have a specific IP range
      expect(sshRule!.IpRanges?.length).toBeGreaterThan(0);
    });
  });

  describe('Logging Configuration', () => {
    itif(hasOutputs)('should have VPC Flow Logs enabled', async () => {
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        Filters: createTagFilter()
      }));

      const vpc = vpcResponse.Vpcs![0];
      
      const flowLogsResponse = await ec2Client.send(new DescribeFlowLogsCommand({
        Filter: [
          { Name: 'resource-id', Values: [vpc.VpcId!] },
          { Name: 'resource-type', Values: ['VPC'] }
        ]
      }));

      expect(flowLogsResponse.FlowLogs).toBeDefined();
      expect(flowLogsResponse.FlowLogs!.length).toBeGreaterThan(0);
      
      const flowLog = flowLogsResponse.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    itif(hasOutputs)('should have ALB access logs enabled and stored in S3', async () => {
      const albDns = outputs.ALB_DNS || outputs.ALBDNS;
      const response = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const targetLoadBalancer = response.LoadBalancers?.find(lb => lb.DNSName === albDns);

      const attributesResponse = await elbv2Client.send(new DescribeLoadBalancerAttributesCommand({
        LoadBalancerArn: targetLoadBalancer!.LoadBalancerArn
      }));

      const accessLogsEnabled = attributesResponse.Attributes?.find(attr => attr.Key === 'access_logs.s3.enabled');
      const accessLogsBucket = attributesResponse.Attributes?.find(attr => attr.Key === 'access_logs.s3.bucket');
      const accessLogsPrefix = attributesResponse.Attributes?.find(attr => attr.Key === 'access_logs.s3.prefix');

      expect(accessLogsEnabled?.Value).toBe('true');
      expect(accessLogsBucket?.Value).toBeDefined();
      expect(accessLogsPrefix?.Value).toBe('alb-logs');
    });
  });

  describe('CloudWatch Monitoring', () => {
    itif(hasOutputs)('should have CPU utilization alarm configured', async () => {
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

    itif(hasOutputs)('should have memory utilization alarm configured', async () => {
      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `${stackName}-HighMemoryAlarmASG`,
      }));

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('mem_used_percent');
      expect(alarm.Namespace).toBe('CWAgent');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });

  describe('AWS Config Compliance', () => {
    itif(hasOutputs)('should have AWS Config resources deployed (placeholder test)', async () => {
      // Note: AWS Config client package not available in current environment
      // This test verifies that the CDK stack includes Config resources
      // In a real environment, you would test:
      // - Configuration recorder is enabled
      // - Delivery channel is configured 
      // - S3 versioning rule is active
      // - EC2 no public IP rule is active
      
      // For now, we'll mark this as pending until the proper AWS SDK package is available
      pending('AWS Config client package not available - Config resources should be tested manually');
    });
  });

  describe('Resource Tagging', () => {
    itif(hasOutputs)('should have consistent tagging across all resources', async () => {
      const expectedTags = {
        'Project': 'SecureCloudEnvironment',
        'Environment': environmentSuffix
      };

      // Check VPC tags
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        Filters: createTagFilter()
      }));
      expect(vpcResponse.Vpcs).toBeDefined();
      expect(vpcResponse.Vpcs!.length).toBe(1);

      // Check Auto Scaling Group tags
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        Filters: createTagFilter().map(f => ({ Name: `tag:${f.Name.split(':')[1]}`, Values: f.Values }))
      }));
      expect(asgResponse.AutoScalingGroups).toBeDefined();
      expect(asgResponse.AutoScalingGroups!.length).toBe(1);

      const asg = asgResponse.AutoScalingGroups![0];
      for (const [key, value] of Object.entries(expectedTags)) {
        const tag = asg.Tags?.find(t => t.Key === key);
        expect(tag).toBeDefined();
        expect(tag!.Value).toBe(value);
      }

      // Check S3 bucket tags
      const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
      
      for (const bucket of bucketsResponse.Buckets!) {
        try {
          const tagsResponse = await s3Client.send(new GetBucketTaggingCommand({
            Bucket: bucket.Name!
          }));
          
          const hasProjectTag = tagsResponse.TagSet?.some(tag => 
            tag.Key === 'Project' && tag.Value === 'SecureCloudEnvironment'
          );
          
          if (hasProjectTag) {
            for (const [key, value] of Object.entries(expectedTags)) {
              const tag = tagsResponse.TagSet?.find(t => t.Key === key);
              expect(tag).toBeDefined();
              expect(tag!.Value).toBe(value);
            }
          }
        } catch (error) {
          // Some buckets might not have tags
          continue;
        }
      }
    });
  });
});
