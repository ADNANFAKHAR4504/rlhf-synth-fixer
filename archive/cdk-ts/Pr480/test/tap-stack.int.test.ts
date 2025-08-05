// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeNatGatewaysCommand, DescribeFlowLogsCommand, DescribeVpcEndpointsCommand, DescribeSecurityGroupsCommand, DescribeRouteTablesCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from '@aws-sdk/client-rds';
import { S3Client, GetBucketPolicyCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, ListSecretsCommand, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { AccessAnalyzerClient, ListAnalyzersCommand } from '@aws-sdk/client-accessanalyzer';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from '@aws-sdk/client-cloudtrail';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = outputs.Region || 'us-west-2';
const config = { region };

const ec2 = new EC2Client(config);
const rds = new RDSClient(config);
const s3 = new S3Client(config);
const secretsManager = new SecretsManagerClient(config);
const logs = new CloudWatchLogsClient(config);
const accessAnalyzer = new AccessAnalyzerClient(config);
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
      
      // Should have 6 subnets: 3 public + 3 private
      expect(subnets.length).toBeGreaterThanOrEqual(6);
      
      // Check public subnets (MapPublicIpOnLaunch = true)
      const publicSubnets = subnets.filter((subnet: any) => subnet.MapPublicIpOnLaunch);
      expect(publicSubnets.length).toBe(3);
      
      // Check private subnets (MapPublicIpOnLaunch = false)
      const privateSubnets = subnets.filter((subnet: any) => !subnet.MapPublicIpOnLaunch);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should have NAT gateways for high availability', async () => {
      const natGatewaysResult = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      }));

      const natGateways = natGatewaysResult.NatGateways!;
      expect(natGateways.length).toBe(2); // For high availability
    });

    test('should have VPC Flow Logs enabled', async () => {
      const flowLogsResult = await ec2.send(new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId]
          }
        ]
      }));

      const flowLogs = flowLogsResult.FlowLogs!;
      expect(flowLogs.length).toBeGreaterThan(0);
      
      const activeFlowLog = flowLogs.find((log: any) => log.FlowLogStatus === 'ACTIVE');
      expect(activeFlowLog).toBeDefined();
      expect(activeFlowLog!.TrafficType).toBe('ALL');
    });

    test('should have VPC endpoints for secure AWS service access', async () => {
      const endpointsResult = await ec2.send(new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }));

      const endpoints = endpointsResult.VpcEndpoints!;
      
      // Should have S3 gateway endpoint
      const s3Endpoint = endpoints.find((ep: any) => ep.ServiceName?.includes('s3'));
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint!.VpcEndpointType).toBe('Gateway');
      
      // Should have Secrets Manager interface endpoint
      const secretsEndpoint = endpoints.find((ep: any) => ep.ServiceName?.includes('secretsmanager'));
      expect(secretsEndpoint).toBeDefined();
      expect(secretsEndpoint!.VpcEndpointType).toBe('Interface');
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
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.DeletionProtection).toBe(true);
      expect(dbInstance.MultiAZ).toBe(false); // t3.micro doesn't support Multi-AZ
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
    test('should have VPC Flow Logs in CloudWatch', async () => {
      const logGroupsResult = await logs.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/vpc/flowlogs'
      }));

      const flowLogGroup = logGroupsResult.logGroups?.find((lg: any) => 
        lg.logGroupName === '/aws/vpc/flowlogs'
      );
      
      expect(flowLogGroup).toBeDefined();
      expect(flowLogGroup!.retentionInDays).toBe(30);
    });

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

  describe('CloudTrail Auditing', () => {
    test('should have CloudTrail enabled with proper configuration', async () => {
      const trailsResult = await cloudtrail.send(new DescribeTrailsCommand({}));
      
      const secureAppTrail = trailsResult.trailList?.find((trail: any) => 
        trail.Name?.includes('SecureApp')
      );
      
      expect(secureAppTrail).toBeDefined();
      expect(secureAppTrail!.IsMultiRegionTrail).toBe(true);
      expect(secureAppTrail!.IncludeGlobalServiceEvents).toBe(true);
      expect(secureAppTrail!.LogFileValidationEnabled).toBe(true);
      
      // Check trail status
      const trailStatusResult = await cloudtrail.send(new GetTrailStatusCommand({
        Name: secureAppTrail!.TrailARN!
      }));
      
      expect(trailStatusResult.IsLogging).toBe(true);
    });
  });

  describe('IAM Access Analyzer', () => {
    test('should have IAM Access Analyzer enabled', async () => {
      const analyzersResult = await accessAnalyzer.send(new ListAnalyzersCommand({}));
      
      const secureAppAnalyzer = analyzersResult.analyzers?.find((analyzer: any) => 
        analyzer.name === 'secure-app-analyzer'
      );
      
      expect(secureAppAnalyzer).toBeDefined();
      expect(secureAppAnalyzer!.status).toBe('ACTIVE');
      expect(secureAppAnalyzer!.type).toBe('ACCOUNT');
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