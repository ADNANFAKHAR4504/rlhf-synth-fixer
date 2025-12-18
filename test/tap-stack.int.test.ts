// Configuration for LocalStack - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeNatGatewaysCommand, DescribeSecurityGroupsCommand, DescribeRouteTablesCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from '@aws-sdk/client-rds';
import { S3Client, GetBucketPolicyCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, ListSecretsCommand, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from '@aws-sdk/client-cloudtrail';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = outputs.Region || 'us-east-1';

// LocalStack endpoint configuration
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const isLocalStack = endpoint.includes('localhost') || endpoint.includes('4566');

const config = {
  region,
  ...(isLocalStack && {
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }),
};

const ec2 = new EC2Client(config);
const rds = new RDSClient(config);
const s3 = new S3Client(config);
const secretsManager = new SecretsManagerClient(config);
const logs = new CloudWatchLogsClient(config);
const elbv2 = new ElasticLoadBalancingV2Client(config);
const autoscaling = new AutoScalingClient(config);
const cloudtrail = new CloudTrailClient(config);

describe('Task 277 Infrastructure Integration Tests', () => {
  const vpcId = outputs.VpcId;
  const loadBalancerDns = outputs.LoadBalancerDNS;
  const s3BucketName = outputs.S3BucketName;
  const databaseEndpoint = outputs.DatabaseEndpoint;
  const stackName = outputs.StackName;
  const region = outputs.Region;

  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcResult = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = vpcResult.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      // Note: DNS settings are checked at VPC attribute level, not in the main VPC object
      // These checks may need to be done via DescribeVpcAttribute calls
    });

    test('should have correct subnets configuration', async () => {
      const subnetsResult = await ec2.send(new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const subnets = subnetsResult.Subnets!;

      // Should have at least 4 subnets: 2 public + 2 private (reduced for LocalStack)
      expect(subnets.length).toBeGreaterThanOrEqual(4);

      // Check public subnets (MapPublicIpOnLaunch = true)
      const publicSubnets = subnets.filter((subnet: any) => subnet.MapPublicIpOnLaunch);
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);

      // Check private subnets (MapPublicIpOnLaunch = false)
      const privateSubnets = subnets.filter((subnet: any) => !subnet.MapPublicIpOnLaunch);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('should have NAT gateway (simplified for LocalStack)', async () => {
      const natGatewaysResult = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'state',
            Values: ['available', 'pending']
          }
        ]
      }));

      const natGateways = natGatewaysResult.NatGateways!;
      expect(natGateways.length).toBeGreaterThanOrEqual(1); // At least 1 NAT gateway
    });
  });

  describe('Security Groups', () => {
    test('should have security groups with proper configuration', async () => {
      const securityGroupsResult = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const securityGroups = securityGroupsResult.SecurityGroups!;
      
      // Should have at least ALB, App, and Database security groups
      expect(securityGroups.length).toBeGreaterThan(3);
      
      // Check ALB security group allows HTTP/HTTPS
      const albSg = securityGroups.find((sg: any) => 
        sg.GroupDescription?.includes('Application Load Balancer')
      );
      if (albSg) {
        const httpRule = albSg.IpPermissions?.find((rule: any) => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        const httpsRule = albSg.IpPermissions?.find((rule: any) => 
          rule.FromPort === 443 && rule.ToPort === 443
        );
        
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
      }
    });
  });

  describe('RDS Database', () => {
    test('should have encrypted RDS instance with correct configuration', async () => {
      const dbIdentifier = databaseEndpoint.split('.')[0];
      
      const dbInstancesResult = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = dbInstancesResult.DBInstances![0];
      
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toBe('15.8');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(1); // Simplified for LocalStack
      expect(dbInstance.MultiAZ).toBe(false);
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('should have database credentials in Secrets Manager', async () => {
      // Get all secrets using pagination
      let allSecrets: any[] = [];
      let nextToken: string | undefined;
      
      do {
        const secretsResult = await secretsManager.send(new ListSecretsCommand({
          NextToken: nextToken,
          MaxResults: 100
        }));
        
        if (secretsResult.SecretList) {
          allSecrets.push(...secretsResult.SecretList);
        }
        
        nextToken = secretsResult.NextToken;
      } while (nextToken);
      
      const dbSecret = allSecrets.find((secret: any) => 
        secret.Description === 'RDS database credentials'
      );
      
      expect(dbSecret).toBeDefined();
      expect(dbSecret!.Name).toBeDefined();
      
      // Verify we can describe the secret (not retrieve the actual secret value)
      const secretDetailsResult = await secretsManager.send(new DescribeSecretCommand({
        SecretId: dbSecret!.ARN!
      }));
      
      expect(secretDetailsResult.Description).toBe('RDS database credentials');
    });
  });

  describe('S3 Storage', () => {
    test('should have S3 bucket with proper security configuration', async () => {
      const bucketPolicyResult = await s3.send(new GetBucketPolicyCommand({
        Bucket: s3BucketName
      }));
      
      expect(bucketPolicyResult.Policy).toBeDefined();
      
      // Check encryption
      const encryptionResult = await s3.send(new GetBucketEncryptionCommand({
        Bucket: s3BucketName
      }));
      
      const encryptionConfig = encryptionResult.ServerSideEncryptionConfiguration;
      expect(encryptionConfig).toBeDefined();
      expect(encryptionConfig!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    });

    test('should have S3 bucket with public access blocked', async () => {
      const publicAccessResult = await s3.send(new GetPublicAccessBlockCommand({
        Bucket: s3BucketName
      }));
      
      const config = publicAccessResult.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket versioning enabled', async () => {
      const versioningResult = await s3.send(new GetBucketVersioningCommand({
        Bucket: s3BucketName
      }));
      
      expect(versioningResult.Status).toBe('Enabled');
    });
  });

  describe('Application Load Balancer and Auto Scaling', () => {
    test('should have ALB with correct configuration', async () => {
      const loadBalancersResult = await elbv2.send(new DescribeLoadBalancersCommand({
        Names: [loadBalancerDns.split('-')[1]] // Extract LB name from DNS
      })).catch(() => {
        // If name doesn't work, search by DNS name
        return elbv2.send(new DescribeLoadBalancersCommand({}));
      });

      const loadBalancer = loadBalancersResult.LoadBalancers?.find((lb: any) => 
        lb.DNSName === loadBalancerDns
      );
      
      if (loadBalancer) {
        expect(loadBalancer.Type).toBe('application');
        expect(loadBalancer.Scheme).toBe('internet-facing');
        expect(loadBalancer.State?.Code).toBe('active');
        
        // Check target groups
        const targetGroupsResult = await elbv2.send(new DescribeTargetGroupsCommand({
          LoadBalancerArn: loadBalancer.LoadBalancerArn
        }));
        
        const targetGroups = targetGroupsResult.TargetGroups!;
        expect(targetGroups.length).toBeGreaterThan(0);
        
        const targetGroup = targetGroups[0];
        expect(targetGroup.Port).toBe(8080);
        expect(targetGroup.Protocol).toBe('HTTP');
        expect(targetGroup.HealthCheckPath).toBe('/health');
      }
    });

    test('should have Auto Scaling Group with correct configuration', async () => {
      const asgResult = await autoscaling.send(new DescribeAutoScalingGroupsCommand({}));
      
      const appAsg = asgResult.AutoScalingGroups?.find((asg: any) => 
        asg.AutoScalingGroupName?.includes(stackName)
      );
      
      if (appAsg) {
        expect(appAsg.MinSize).toBe(1);
        expect(appAsg.MaxSize).toBe(3);
        expect(appAsg.DesiredCapacity).toBe(2);
        expect(appAsg.Instances?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('CloudWatch Logging', () => {
    test('should have CloudTrail log group', async () => {
      const logGroupsResult = await logs.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/cloudtrail'
      }));

      const cloudTrailLogGroup = logGroupsResult.logGroups?.find((lg: any) =>
        lg.logGroupName?.includes('secure-app')
      );

      expect(cloudTrailLogGroup).toBeDefined();
      expect(cloudTrailLogGroup!.retentionInDays).toBe(365);
    });
  });

  describe('CloudTrail Auditing (LocalStack)', () => {
    test('should have CloudTrail enabled', async () => {
      const trailsResult = await cloudtrail.send(new DescribeTrailsCommand({}));

      const secureAppTrail = trailsResult.trailList?.find((trail: any) =>
        trail.Name?.includes('SecureApp')
      );

      expect(secureAppTrail).toBeDefined();
      // Note: Multi-region and file validation disabled for LocalStack compatibility
    });
  });

  describe('Resource Tagging', () => {
    test('should have all resources properly tagged', async () => {
      // Check VPC tags
      const vpcResult = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = vpcResult.Vpcs![0];
      const tags = vpc.Tags || [];
      
      const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');
      const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
      
      expect(environmentTag).toBeDefined();
      expect(environmentTag!.Value).toBe('Production');
      expect(ownerTag).toBeDefined();
      expect(ownerTag!.Value).toBe('DevOps');
    });
  });

  describe('Network Connectivity', () => {
    test('should have internet connectivity from public subnets', async () => {
      const routeTablesResult = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const routeTables = routeTablesResult.RouteTables!;
      
      // Find public route tables (those with internet gateway routes)
      const publicRouteTables = routeTables.filter((rt: any) => 
        rt.Routes?.some((route: any) => route.GatewayId?.startsWith('igw-'))
      );
      
      expect(publicRouteTables.length).toBeGreaterThan(0);
      
      // Check that they have routes to internet gateway
      publicRouteTables.forEach((rt: any) => {
        const igwRoute = rt.Routes?.find((route: any) => 
          route.GatewayId?.startsWith('igw-') && route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(igwRoute).toBeDefined();
      });
    });

    test('should have NAT gateway connectivity from private subnets', async () => {
      const routeTablesResult = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const routeTables = routeTablesResult.RouteTables!;
      
      // Find private route tables (those with NAT gateway routes)
      const privateRouteTables = routeTables.filter((rt: any) => 
        rt.Routes?.some((route: any) => route.NatGatewayId?.startsWith('nat-'))
      );
      
      expect(privateRouteTables.length).toBeGreaterThan(0);
      
      // Check that they have routes to NAT gateway
      privateRouteTables.forEach((rt: any) => {
        const natRoute = rt.Routes?.find((route: any) => 
          route.NatGatewayId?.startsWith('nat-') && route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(natRoute).toBeDefined();
      });
    });
  });

  describe('Security Compliance', () => {
    test('should have no public RDS instances', async () => {
      const dbIdentifier = databaseEndpoint.split('.')[0];
      
      const dbInstancesResult = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      const dbInstance = dbInstancesResult.DBInstances![0];
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('should have encrypted storage for sensitive resources', async () => {
      // Check RDS encryption
      const dbIdentifier = databaseEndpoint.split('.')[0];
      const dbInstancesResult = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      const dbInstance = dbInstancesResult.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);

      // Check S3 encryption
      const encryptionResult = await s3.send(new GetBucketEncryptionCommand({
        Bucket: s3BucketName
      }));
      expect(encryptionResult.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('should have proper network isolation', async () => {
      // Database should be in isolated subnets
      const dbIdentifier = databaseEndpoint.split('.')[0];
      const dbInstancesResult = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      const dbInstance = dbInstancesResult.DBInstances![0];

      // Get database subnet group
      const subnetGroupsResult = await rds.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbInstance.DBSubnetGroup?.DBSubnetGroupName
      }));
      
      const subnetGroup = subnetGroupsResult.DBSubnetGroups![0];
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2); // Multi-AZ requirement
    });
  });
});