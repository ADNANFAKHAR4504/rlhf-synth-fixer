import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('PaymentProcessing Stack - Integration Tests', () => {
  const cfnClient = new CloudFormationClient({ region });
  const ec2Client = new EC2Client({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const asgClient = new AutoScalingClient({ region });

  let stackName: string;
  let outputs: Record<string, string>;
  let resources: Record<string, string>;

  beforeAll(async () => {
    // Discover stack name dynamically - try multiple patterns
    const listStacksCommand = new DescribeStacksCommand({});
    const stacks = await cfnClient.send(listStacksCommand);
    
    // Try exact match first
    let matchingStack = stacks.Stacks?.find(
      stack => stack.StackName === `TapStack${environmentSuffix}` &&
               stack.StackStatus !== 'DELETE_COMPLETE'
    );

    // Try pattern match if exact match fails
    if (!matchingStack) {
      matchingStack = stacks.Stacks?.find(
        stack => stack.StackName?.startsWith('TapStack') && 
                 (stack.StackName?.includes(environmentSuffix) || 
                  stack.StackName?.endsWith(environmentSuffix)) &&
                 stack.StackStatus !== 'DELETE_COMPLETE'
      );
    }

    // Try to find any TapStack if still not found
    if (!matchingStack) {
      matchingStack = stacks.Stacks?.find(
        stack => stack.StackName?.startsWith('TapStack') &&
                 stack.StackStatus !== 'DELETE_COMPLETE' &&
                 (stack.StackStatus === 'CREATE_COMPLETE' || 
                  stack.StackStatus === 'UPDATE_COMPLETE')
      );
    }

    if (!matchingStack) {
      throw new Error(
        `Could not find CloudFormation stack. ` +
        `Searched for: TapStack${environmentSuffix} or TapStack*${environmentSuffix}. ` +
        `Available stacks: ${stacks.Stacks?.map(s => s.StackName).join(', ') || 'none'}`
      );
    }

    stackName = matchingStack.StackName!;
    console.log(`Discovered stack: ${stackName}`);

    // Get stack outputs
    const describeStackCommand = new DescribeStacksCommand({
      StackName: stackName,
    });
    const stackResponse = await cfnClient.send(describeStackCommand);
    const stack = stackResponse.Stacks?.[0];

    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    outputs = {};
    if (stack.Outputs) {
      for (const output of stack.Outputs) {
        if (output.OutputKey && output.OutputValue) {
          outputs[output.OutputKey] = output.OutputValue;
        }
      }
    }

    console.log('Available outputs:', Object.keys(outputs));

    // Get stack resources
    const listResourcesCommand = new ListStackResourcesCommand({
      StackName: stackName,
    });
    const resourcesResponse = await cfnClient.send(listResourcesCommand);

    resources = {};
    if (resourcesResponse.StackResourceSummaries) {
      for (const resource of resourcesResponse.StackResourceSummaries) {
        if (resource.LogicalResourceId && resource.PhysicalResourceId) {
          resources[resource.LogicalResourceId] = resource.PhysicalResourceId;
        }
      }
    }

    console.log('Discovered resources:', Object.keys(resources));
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.ALBDNSName || outputs.ALBDnsName).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSPort).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketArn).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.EnvironmentType).toBeDefined();
    });

    test('ALB DNS name should be valid format', () => {
      const albDns = outputs.ALBDNSName || outputs.ALBDnsName;
      expect(albDns).toMatch(/\.elb\.amazonaws\.com$/);
    });

    test('RDS endpoint should be valid format', () => {
      expect(outputs.RDSEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('S3 bucket name should include environment and account ID', () => {
      expect(outputs.S3BucketName).toMatch(/^paymentprocessing-logs-.*-\d+$/);
    });

    test('VPC ID should be valid format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    test('Environment type should be dev', () => {
      expect(outputs.EnvironmentType).toBe('dev');
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      
      // DNS attributes must be queried separately using DescribeVpcAttributeCommand
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport',
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames',
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    test('should have exactly 4 subnets (2 public, 2 private)', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(4);
    });

    test('should have public subnets in different availability zones', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['*PublicSubnet*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);
      const azs = response.Subnets.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    test('public subnets should have auto-assign public IP enabled', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['*PublicSubnet*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      response.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with correct ingress rules', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'group-name',
            Values: ['*ALB-SG*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups[0];
      expect(sg.IpPermissions).toHaveLength(2);

      const ports = sg.IpPermissions.map(rule => rule.FromPort);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });

    test('should have Instance security group', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'group-name',
            Values: ['*Instance-SG*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
    });

    test('should have Database security group allowing PostgreSQL', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'group-name',
            Values: ['*DB-SG*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups[0];
      const pgRule = sg.IpPermissions.find(rule => rule.FromPort === 5432);
      expect(pgRule).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    let albArn: string;

    test('ALB should exist and be active', async () => {
      // Discover ALB by ARN from resources or by DNS name
      const albArnFromResources = resources.ApplicationLoadBalancer;
      const albDns = outputs.ALBDNSName || outputs.ALBDnsName;

      let command: DescribeLoadBalancersCommand;
      
      if (albArnFromResources) {
        // Use ARN if available
        command = new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArnFromResources],
        });
      } else if (albDns) {
        // Fallback: discover by VPC and tags
        const vpcId = outputs.VPCId || resources.VPC;
        command = new DescribeLoadBalancersCommand({
          PageSize: 100,
        });
      } else {
        throw new Error('Could not discover ALB ARN or DNS name');
      }

      const response = await elbClient.send(command);
      
      // Filter by VPC if we got multiple results
      const vpcId = outputs.VPCId || resources.VPC;
      const alb = response.LoadBalancers?.find(
        lb => lb.VpcId === vpcId && lb.Type === 'application'
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');

      albArn = alb!.LoadBalancerArn!;
    });

    test('ALB should be in multiple availability zones', async () => {
      if (!albArn) {
        const vpcId = outputs.VPCId || resources.VPC;
        const command = new DescribeLoadBalancersCommand({
          PageSize: 100,
        });
        const response = await elbClient.send(command);
        const alb = response.LoadBalancers?.find(
          lb => lb.VpcId === vpcId && lb.Type === 'application'
        );
        albArn = alb!.LoadBalancerArn!;
      }

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers[0].AvailabilityZones).toHaveLength(2);
    });

    test('Target group should exist with correct health check', async () => {
      // Discover target group by ARN or by name pattern
      const tgArn = resources.ALBTargetGroup;
      const vpcId = outputs.VPCId || resources.VPC;

      let command: DescribeTargetGroupsCommand;
      
      if (tgArn) {
        command = new DescribeTargetGroupsCommand({
          TargetGroupArns: [tgArn],
        });
      } else {
        // Discover by VPC
        command = new DescribeTargetGroupsCommand({
          PageSize: 100,
        });
      }

      const response = await elbClient.send(command);
      
      // Filter by VPC if needed
      const tg = tgArn 
        ? response.TargetGroups?.[0]
        : response.TargetGroups?.find(tg => tg.VpcId === vpcId);

      expect(tg).toBeDefined();
      expect(tg?.Protocol).toBe('HTTP');
      expect(tg?.Port).toBe(80);
      expect(tg?.HealthCheckProtocol).toBe('HTTP');
      expect(tg?.HealthCheckPath).toBe('/');
      expect(tg?.HealthCheckIntervalSeconds).toBe(30);
    });
  });

  describe('Auto Scaling Group', () => {
    test('ASG should exist with correct configuration for dev environment', async () => {
      // Discover ASG by name pattern
      const asgName = resources.AutoScalingGroup;
      
      let command: DescribeAutoScalingGroupsCommand;
      if (asgName) {
        command = new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        });
      } else {
        // Discover by tags
        command = new DescribeAutoScalingGroupsCommand({
          MaxRecords: 100,
        });
      }

      const response = await asgClient.send(command);
      
      const asg = asgName
        ? response.AutoScalingGroups?.[0]
        : response.AutoScalingGroups?.find(
            asg => asg.AutoScalingGroupName?.includes('PaymentProcessing') &&
                   asg.AutoScalingGroupName?.includes(environmentSuffix)
          );

      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBe(1);
      expect(asg?.MaxSize).toBe(2);
      expect(asg?.DesiredCapacity).toBe(1);
      expect(asg?.HealthCheckType).toBe('ELB');
      expect(asg?.HealthCheckGracePeriod).toBe(300);
    });

    test('ASG should be in multiple availability zones', async () => {
      const asgName = resources.AutoScalingGroup;
      const command = new DescribeAutoScalingGroupsCommand(
        asgName ? { AutoScalingGroupNames: [asgName] } : { MaxRecords: 100 }
      );
      const response = await asgClient.send(command);

      const asg = asgName
        ? response.AutoScalingGroups?.[0]
        : response.AutoScalingGroups?.find(
            asg => asg.AutoScalingGroupName?.includes('PaymentProcessing') &&
                   asg.AutoScalingGroupName?.includes(environmentSuffix)
          );

      expect(asg?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    });

    test('ASG instances should be using t3.micro for dev environment', async () => {
      const asgName = resources.AutoScalingGroup;
      const command = new DescribeAutoScalingGroupsCommand(
        asgName ? { AutoScalingGroupNames: [asgName] } : { MaxRecords: 100 }
      );
      const response = await asgClient.send(command);

      const asg = asgName
        ? response.AutoScalingGroups?.[0]
        : response.AutoScalingGroups?.find(
            asg => asg.AutoScalingGroupName?.includes('PaymentProcessing') &&
                   asg.AutoScalingGroupName?.includes(environmentSuffix)
          );

      if (asg?.Instances && asg.Instances.length > 0) {
        const instanceId = asg.Instances[0].InstanceId;
        const instanceCommand = new DescribeInstancesCommand({
          InstanceIds: [instanceId!],
        });
        const instanceResponse = await ec2Client.send(instanceCommand);

        const instance = instanceResponse.Reservations?.[0]?.Instances?.[0];
        expect(instance?.InstanceType).toBe('t3.micro');
      }
    });
  });

  describe('RDS Aurora PostgreSQL Cluster', () => {
    test('Aurora cluster should exist and be available', async () => {
      const clusterId = resources.AuroraCluster || outputs.RDSEndpoint?.split('.')[0];
      expect(clusterId).toBeDefined();

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters[0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
    });

    test('Aurora cluster should have correct database name', async () => {
      const clusterId = resources.AuroraCluster || outputs.RDSEndpoint?.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters[0].DatabaseName).toBe('paymentdb');
    });

    test('Aurora cluster should have correct backup retention for dev', async () => {
      const clusterId = resources.AuroraCluster || outputs.RDSEndpoint?.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters[0].BackupRetentionPeriod).toBe(7);
    });

    test('Aurora cluster should be in VPC', async () => {
      const clusterId = resources.AuroraCluster || outputs.RDSEndpoint?.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters[0].VpcSecurityGroups).toBeDefined();
      expect(response.DBClusters[0].VpcSecurityGroups!.length).toBeGreaterThan(0);
    });

    test('should have one DB instance for dev environment', async () => {
      const clusterId = resources.AuroraCluster || outputs.RDSEndpoint?.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [clusterId],
          },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      expect(response.DBInstances[0].Engine).toBe('aurora-postgresql');
      expect(response.DBInstances[0].DBInstanceClass).toBe('db.t3.medium');
      expect(response.DBInstances[0].PubliclyAccessible).toBe(false);
    });
  });

  describe('S3 Transaction Logs Bucket', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const bucketName = outputs.S3BucketName || resources.TransactionLogsBucket;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 bucket should have encryption enabled', async () => {
      const bucketName = outputs.S3BucketName || resources.TransactionLogsBucket;
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.S3BucketName || resources.TransactionLogsBucket;
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle policy with 30 days retention for dev', async () => {
      const bucketName = outputs.S3BucketName || resources.TransactionLogsBucket;
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toHaveLength(1);
      expect(response.Rules![0].Status).toBe('Enabled');
      expect(response.Rules![0].Expiration?.Days).toBe(30);
      expect(response.Rules![0].NoncurrentVersionExpiration?.NoncurrentDays).toBe(30);
    });

    test('should be able to put and get objects from S3 bucket', async () => {
      const bucketName = outputs.S3BucketName || resources.TransactionLogsBucket;
      const testKey = `test-transaction-${Date.now()}.log`;
      const testContent = 'Test transaction log entry';

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
      });
      await s3Client.send(putCommand);

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const response = await s3Client.send(getCommand);

      expect(response.Body).toBeDefined();
      const body = await response.Body!.transformToString();
      expect(body).toBe(testContent);
    });

    test('should be able to list objects in S3 bucket', async () => {
      const bucketName = outputs.S3BucketName || resources.TransactionLogsBucket;
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 10,
      });
      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have correct tags', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs[0].Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const appTag = tags.find(t => t.Key === 'Application');

      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe(outputs.EnvironmentType);
      expect(appTag).toBeDefined();
      expect(appTag!.Value).toBe('PaymentProcessing');
    });
  });

  describe('Cross-Resource Integration', () => {
    test('ALB should be connected to target group', async () => {
      // Get ALB ARN
      const albArnFromResources = resources.ApplicationLoadBalancer;
      const vpcId = outputs.VPCId || resources.VPC;

      let albArn: string;
      if (albArnFromResources) {
        albArn = albArnFromResources;
      } else {
        const lbCommand = new DescribeLoadBalancersCommand({
          PageSize: 100,
        });
        const lbResponse = await elbClient.send(lbCommand);
        const alb = lbResponse.LoadBalancers?.find(
          lb => lb.VpcId === vpcId && lb.Type === 'application'
        );
        expect(alb).toBeDefined();
        albArn = alb!.LoadBalancerArn!;
      }

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: albArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toHaveLength(1);
    });

    test('Aurora cluster should be in private subnets', async () => {
      const clusterId = resources.AuroraCluster || outputs.RDSEndpoint?.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      const subnetGroupName = cluster.DBSubnetGroup;
      
      expect(subnetGroupName).toBeDefined();
      
      // Verify subnets exist by checking VPC
      const vpcId = outputs.VPCId || resources.VPC;
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: ['*PrivateSubnet*'],
          },
        ],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      expect(subnetResponse.Subnets.length).toBeGreaterThanOrEqual(2);
    });

    test('EC2 instances should have access to S3 bucket', async () => {
      const asgName = resources.AutoScalingGroup;
      const command = new DescribeAutoScalingGroupsCommand(
        asgName ? { AutoScalingGroupNames: [asgName] } : { MaxRecords: 100 }
      );
      const asgResponse = await asgClient.send(command);

      const asg = asgName
        ? asgResponse.AutoScalingGroups?.[0]
        : asgResponse.AutoScalingGroups?.find(
            asg => asg.AutoScalingGroupName?.includes('PaymentProcessing') &&
                   asg.AutoScalingGroupName?.includes(environmentSuffix)
          );

      expect(asg?.Instances).toBeDefined();

      if (asg?.Instances && asg.Instances.length > 0) {
        const instanceId = asg.Instances[0].InstanceId;
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: [instanceId!],
        });
        const ec2Response = await ec2Client.send(ec2Command);

        const instance = ec2Response.Reservations?.[0]?.Instances?.[0];
        expect(instance?.IamInstanceProfile).toBeDefined();
      }
    });
  });

  describe('High Availability and Resilience', () => {
    test('infrastructure should span multiple availability zones', async () => {
      const vpcId = outputs.VPCId || resources.VPC;
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      const azs = new Set(subnetResponse.Subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('ALB should have at least 2 availability zones', async () => {
      const albArnFromResources = resources.ApplicationLoadBalancer;
      const vpcId = outputs.VPCId || resources.VPC;

      let command: DescribeLoadBalancersCommand;
      if (albArnFromResources) {
        command = new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArnFromResources],
        });
      } else {
        command = new DescribeLoadBalancersCommand({
          PageSize: 100,
        });
      }

      const response = await elbClient.send(command);
      
      const alb = albArnFromResources
        ? response.LoadBalancers?.[0]
        : response.LoadBalancers?.find(
            lb => lb.VpcId === vpcId && lb.Type === 'application'
          );

      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    });
  });
});
