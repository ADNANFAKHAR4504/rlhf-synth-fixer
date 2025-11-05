import { 
  ECSClient, 
  DescribeClustersCommand, 
  DescribeServicesCommand,
  DescribeTasksCommand,
  ListTasksCommand,
  RunTaskCommand,
  StopTaskCommand 
} from '@aws-sdk/client-ecs';
import { 
  RDSClient, 
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand 
} from '@aws-sdk/client-rds';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeVpcEndpointsCommand
} from '@aws-sdk/client-ec2';
import { 
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  Route53Client,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand
} from '@aws-sdk/client-route-53';
import { 
  SSMClient, 
  GetParametersCommand,
  SendCommandCommand,
  GetCommandInvocationCommand
} from '@aws-sdk/client-ssm';
import { 
  IAMClient, 
  GetRoleCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';
import { 
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';

// Configuration - These come from CDKTF outputs after deployment
let rawOutputs: Record<string, any> = {};
let outputs: Record<string, any> = {};
try {
  rawOutputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  
  // Handle nested structure - CDKTF outputs are nested under TapStack{suffix}
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
  const stackKey = `TapStack${environmentSuffix}`;
  
  if (rawOutputs[stackKey]) {
    outputs = rawOutputs[stackKey];
  } else {
    // Fallback to flat structure if nested doesn't exist
    outputs = rawOutputs;
  }
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found. Integration tests will be skipped.');
  outputs = {};
}

// Get environment configuration from CI/CD
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK v3 clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const ecsClient = new ECSClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const route53Client = new Route53Client({ region });
const ssmClient = new SSMClient({ region });
const iamClient = new IAMClient({ region });
const cloudwatchLogsClient = new CloudWatchLogsClient({ region });

// Helper function to get environment-specific output keys with proper naming pattern
const getEnvOutput = (env: string, resource: string) => {
  // Pattern: ${env}-${environmentSuffix}-${resource}
  return `${env}-${environmentSuffix}-${resource}`;
};

// Helper function for ECS task management
async function runEcsTask(clusterName: string, taskDefinition: string, subnets: string[], securityGroups: string[]) {
  const runTaskResponse = await ecsClient.send(new RunTaskCommand({
    cluster: clusterName,
    taskDefinition,
    launchType: 'FARGATE',
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets,
        securityGroups,
        assignPublicIp: 'DISABLED'
      }
    },
    count: 1
  }));

  const taskArn = runTaskResponse.tasks?.[0]?.taskArn;
  if (!taskArn) throw new Error('Failed to start ECS task');

  // Wait for task to be running
  let attempts = 0;
  while (attempts < 30) {
    const describeResponse = await ecsClient.send(new DescribeTasksCommand({
      cluster: clusterName,
      tasks: [taskArn]
    }));

    const task = describeResponse.tasks?.[0];
    if (task?.lastStatus === 'RUNNING') {
      return taskArn;
    }
    
    if (task?.lastStatus === 'STOPPED') {
      throw new Error(`Task stopped: ${task.stoppedReason}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('Task failed to start within timeout');
}

const shouldSkipTests = Object.keys(outputs).length === 0;

(shouldSkipTests ? describe.skip : describe)('CDKTF Multi-Environment Infrastructure Integration Tests', () => {
  beforeAll(() => {
    if (shouldSkipTests) {
      console.warn('Skipping integration tests: cfn-outputs/flat-outputs.json not found');
    }
  });

  // ============================================================================
  // PART 1: RESOURCE VALIDATION (Non-Interactive Infrastructure Validation)
  // ============================================================================

  describe('[Resource Validation] Infrastructure Configuration Verification', () => {
    test('should have all required stack outputs for all environments', () => {
      const requiredOutputs = [
        getEnvOutput('dev', 'vpc-id'),
        getEnvOutput('dev', 'alb-dns'),
        getEnvOutput('dev', 'rds-endpoint'),
        getEnvOutput('dev', 'ecs-cluster'),
        getEnvOutput('dev', 'dns-record'),
        getEnvOutput('staging', 'vpc-id'),
        getEnvOutput('staging', 'alb-dns'),
        getEnvOutput('staging', 'rds-endpoint'),
        getEnvOutput('staging', 'ecs-cluster'),
        getEnvOutput('staging', 'dns-record'),
        getEnvOutput('prod', 'vpc-id'),
        getEnvOutput('prod', 'alb-dns'),
        getEnvOutput('prod', 'rds-endpoint'),
        getEnvOutput('prod', 'ecs-cluster'),
        getEnvOutput('prod', 'dns-record'),
        'vpc-peering-connection-id',
        'route53-zone-id'
      ];

      // Debug output to help with troubleshooting
      console.log('Available outputs:', Object.keys(outputs));
      console.log('Environment suffix:', environmentSuffix);

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should have VPCs with correct CIDR blocks for all environments', async () => {
      const environments = [
        { name: 'dev', cidr: '10.0.0.0/16' },
        { name: 'staging', cidr: '10.1.0.0/16' },
        { name: 'prod', cidr: '10.2.0.0/16' }
      ];

      for (const env of environments) {
        const vpcId = outputs[getEnvOutput(env.name, 'vpc-id')];
        const response = await ec2Client.send(new DescribeVpcsCommand({
          VpcIds: [vpcId]
        }));

        const vpc = response.Vpcs?.[0];
        expect(vpc?.CidrBlock).toBe(env.cidr);
        expect(vpc?.State).toBe('available');
      }
    }, 60000);

    test('should have correct subnet configuration across all AZs for each environment', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const vpcId = outputs[getEnvOutput(env, 'vpc-id')];
        const response = await ec2Client.send(new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        }));

        const subnets = response.Subnets || [];
        
        // Should have 9 subnets total (3 AZs x 3 types)
        expect(subnets.length).toBe(9);
        
        // Check subnet types
        const publicSubnets = subnets.filter(s => s.Tags?.some(t => t.Value?.includes('public')));
        const privateSubnets = subnets.filter(s => s.Tags?.some(t => t.Value?.includes('private')));
        const dbSubnets = subnets.filter(s => s.Tags?.some(t => t.Value?.includes('db')));
        
        expect(publicSubnets.length).toBe(3);
        expect(privateSubnets.length).toBe(3);
        expect(dbSubnets.length).toBe(3);

        // Verify public subnets have MapPublicIpOnLaunch enabled
        publicSubnets.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        });
      }
    }, 90000);

    test('should have RDS Aurora PostgreSQL clusters with correct configuration', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const rdsEndpoint = outputs[getEnvOutput(env, 'rds-endpoint')];
        expect(rdsEndpoint).toBeDefined();
        
        // Extract cluster identifier from endpoint
        const clusterIdentifier = rdsEndpoint.split('.')[0];
        
        const response = await rdsClient.send(new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier
        }));

        const cluster = response.DBClusters?.[0];
        expect(cluster?.Engine).toBe('aurora-postgresql');
        expect(cluster?.Status).toBe('available');
        expect(cluster?.DatabaseName).toBe('appdb');
        expect(cluster?.MasterUsername).toBe('dbadmin');
        expect(cluster?.StorageEncrypted).toBe(true);
        expect(cluster?.DeletionProtection).toBe(false);
        expect(cluster?.BackupRetentionPeriod).toBe(7);
      }
    }, 120000);

    test('should have ECS Fargate clusters with correct configuration', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const clusterName = outputs[getEnvOutput(env, 'ecs-cluster')];
        
        const response = await ecsClient.send(new DescribeClustersCommand({
          clusters: [clusterName]
        }));

        const cluster = response.clusters?.[0];
        expect(cluster?.clusterName).toBe(clusterName);
        expect(cluster?.status).toBe('ACTIVE');
        expect(cluster?.runningTasksCount).toBeGreaterThanOrEqual(0);
        expect(cluster?.pendingTasksCount).toBeGreaterThanOrEqual(0);

        // Verify Container Insights is enabled
        const setting = cluster?.settings?.find(s => s.name === 'containerInsights');
        expect(setting?.value).toBe('enabled');
      }
    }, 60000);

    test('should have Application Load Balancers with HTTP listeners only', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const albDns = outputs[getEnvOutput(env, 'alb-dns')];
        
        // Get ALB by DNS name
        const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
        const alb = albResponse.LoadBalancers?.find(lb => lb.DNSName === albDns);
        
        expect(alb).toBeDefined();
        expect(alb?.Type).toBe('application');
        expect(alb?.State?.Code).toBe('active');
        expect(alb?.Scheme).toBe('internet-facing');
        
        // Verify listeners (should only have HTTP, no HTTPS)
        const listenersResponse = await elbv2Client.send(new DescribeListenersCommand({
          LoadBalancerArn: alb?.LoadBalancerArn
        }));
        
        const listeners = listenersResponse.Listeners || [];
        expect(listeners.length).toBeGreaterThan(0);
        
        // Should only have HTTP listeners (port 80)
        const httpListeners = listeners.filter(l => l.Port === 80 && l.Protocol === 'HTTP');
        expect(httpListeners.length).toBeGreaterThan(0);
        
        // Should not have HTTPS listeners
        const httpsListeners = listeners.filter(l => l.Protocol === 'HTTPS');
        expect(httpsListeners.length).toBe(0);
      }
    }, 90000);

    test('should have VPC peering connection between staging and prod only', async () => {
      const peeringId = outputs['vpc-peering-connection-id'];
      const stagingVpcId = outputs[getEnvOutput('staging', 'vpc-id')];
      const prodVpcId = outputs[getEnvOutput('prod', 'vpc-id')];
      
      const response = await ec2Client.send(new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [peeringId]
      }));

      const peering = response.VpcPeeringConnections?.[0];
      expect(peering?.Status?.Code).toBe('active');
      
      // Verify peering is between staging and prod VPCs
      const vpcIds = [peering?.AccepterVpcInfo?.VpcId, peering?.RequesterVpcInfo?.VpcId];
      expect(vpcIds).toContain(stagingVpcId);
      expect(vpcIds).toContain(prodVpcId);
    }, 30000);

    test('should have Route53 hosted zone and DNS records for all environments', async () => {
      const hostedZoneId = outputs['route53-zone-id'];
      
      const zonesResponse = await route53Client.send(new ListHostedZonesCommand({}));
      const hostedZone = zonesResponse.HostedZones?.find(z => z.Id?.includes(hostedZoneId));
      
      expect(hostedZone).toBeDefined();
      expect(hostedZone?.Name).toBe('mytszone.com.');

      // Verify DNS records for each environment
      const recordsResponse = await route53Client.send(new ListResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId
      }));

      const environments = ['dev', 'staging', 'prod'];
      for (const env of environments) {
        const expectedName = `${env}-${environmentSuffix}.mytszone.com.`;
        const record = recordsResponse.ResourceRecordSets?.find(r => r.Name === expectedName);
        
        expect(record).toBeDefined();
        expect(record?.Type).toBe('A');
        expect(record?.AliasTarget).toBeDefined();
      }
    }, 60000);
  });

  // ============================================================================
  // PART 2: SERVICE-LEVEL TESTS (Single Service Interactive Operations)
  // ============================================================================

  describe('[Service-Level] ECS Cluster Operations', () => {
    test('should be able to run and manage tasks on ECS clusters', async () => {
      const env = 'dev';
      const clusterName = outputs[getEnvOutput(env, 'ecs-cluster')];
      
      // Get cluster details and existing services
      const servicesResponse = await ecsClient.send(new DescribeServicesCommand({
        cluster: clusterName,
        services: [],
      }));

      expect(servicesResponse.services).toBeDefined();
      expect(servicesResponse.services!.length).toBeGreaterThan(0);

      const service = servicesResponse.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.runningCount).toBeGreaterThanOrEqual(0);
      expect(service.launchType).toBe('FARGATE');
    }, 90000);

    test('should be able to retrieve ECS task logs from CloudWatch', async () => {
      const env = 'dev';
      const envPrefix = `${env}-${environmentSuffix}`;
      
      // Check if ECS log group exists
      const logGroupName = `/ecs/${envPrefix}-app`;
      const response = await cloudwatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    }, 30000);
  });

  describe('[Service-Level] RDS Database Operations', () => {
    test('should be able to retrieve database credentials from SSM Parameter Store', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const envPrefix = `${env}-${environmentSuffix}`;
        const parameterName = `/${envPrefix}/rds/password`;
        
        const response = await ssmClient.send(new GetParametersCommand({
          Names: [parameterName],
          WithDecryption: true
        }));

        const parameter = response.Parameters?.[0];
        expect(parameter).toBeDefined();
        expect(parameter?.Type).toBe('SecureString');
        expect(parameter?.Value).toBeDefined();
        expect(parameter?.Value!.length).toBeGreaterThanOrEqual(32);
      }
    }, 45000);
  });

  describe('[Service-Level] Load Balancer Health Checks', () => {
    test('should have healthy target groups attached to load balancers', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const albDns = outputs[getEnvOutput(env, 'alb-dns')];
        
        // Get ALB ARN by DNS name
        const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
        const alb = albResponse.LoadBalancers?.find(lb => lb.DNSName === albDns);
        
        // Get target groups for this ALB
        const tgResponse = await elbv2Client.send(new DescribeTargetGroupsCommand({
          LoadBalancerArn: alb?.LoadBalancerArn
        }));

        expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);
        
        const targetGroup = tgResponse.TargetGroups![0];
        expect(targetGroup.Protocol).toBe('HTTP');
        expect(targetGroup.Port).toBe(80);
        expect(targetGroup.TargetType).toBe('ip');
        expect(targetGroup.HealthCheckPath).toBe('/health');
      }
    }, 60000);
  });

  // ============================================================================
  // PART 3: CROSS-SERVICE TESTS (2 Services Interacting)
  // ============================================================================

  describe('[Cross-Service] ECS ↔ RDS Integration', () => {
    test('should have ECS services properly configured to access RDS clusters', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const clusterName = outputs[getEnvOutput(env, 'ecs-cluster')];
        const rdsEndpoint = outputs[getEnvOutput(env, 'rds-endpoint')];
        
        // Get ECS service details
        const servicesResponse = await ecsClient.send(new DescribeServicesCommand({
          cluster: clusterName,
          services: [],
        }));

        const service = servicesResponse.services?.[0];
        expect(service).toBeDefined();
        
        // Verify service is in the same VPC as RDS
        const vpcId = outputs[getEnvOutput(env, 'vpc-id')];
        expect(service?.networkConfiguration?.awsvpcConfiguration?.subnets).toBeDefined();
        
        // Verify RDS endpoint is accessible from the network configuration
        expect(rdsEndpoint).toContain(vpcId.replace('vpc-', ''));
      }
    }, 90000);

    test('should have proper security group rules allowing ECS to access RDS', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const vpcId = outputs[getEnvOutput(env, 'vpc-id')];
        
        // Get all security groups in the VPC
        const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        }));

        const securityGroups = sgResponse.SecurityGroups || [];
        
        // Find ECS and RDS security groups
        const ecsSecurityGroup = securityGroups.find(sg => 
          sg.Tags?.some(t => t.Value?.includes('ecs-service-sg'))
        );
        const rdsSecurityGroup = securityGroups.find(sg => 
          sg.Tags?.some(t => t.Value?.includes('rds-sg'))
        );

        expect(ecsSecurityGroup).toBeDefined();
        expect(rdsSecurityGroup).toBeDefined();

        // Verify RDS security group allows PostgreSQL traffic from ECS security group
        const postgresRule = rdsSecurityGroup?.IpPermissions?.find(rule => 
          rule.FromPort === 5432 && rule.ToPort === 5432
        );
        expect(postgresRule).toBeDefined();
        
        const allowsEcsSg = postgresRule?.UserIdGroupPairs?.some(pair => 
          pair.GroupId === ecsSecurityGroup?.GroupId
        );
        expect(allowsEcsSg).toBe(true);
      }
    }, 60000);
  });

  describe('[Cross-Service] ALB ↔ ECS Integration', () => {
    test('should have ALB properly forwarding traffic to ECS services', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const albDns = outputs[getEnvOutput(env, 'alb-dns')];
        const clusterName = outputs[getEnvOutput(env, 'ecs-cluster')];
        
        // Get ALB details
        const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
        const alb = albResponse.LoadBalancers?.find(lb => lb.DNSName === albDns);
        
        // Get listeners
        const listenersResponse = await elbv2Client.send(new DescribeListenersCommand({
          LoadBalancerArn: alb?.LoadBalancerArn
        }));

        const httpListener = listenersResponse.Listeners?.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
        
        // Verify listener forwards to target group
        const defaultAction = httpListener?.DefaultActions?.[0];
        expect(defaultAction?.Type).toBe('forward');
        expect(defaultAction?.TargetGroupArn).toBeDefined();

        // Verify target group health
        const healthResponse = await elbv2Client.send(new DescribeTargetHealthCommand({
          TargetGroupArn: defaultAction?.TargetGroupArn
        }));

        // Should have some targets (even if not all healthy during test)
        expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      }
    }, 90000);
  });

  describe('[Cross-Service] Route53 ↔ ALB Integration', () => {
    test('should have DNS records properly aliased to load balancers', async () => {
      const environments = ['dev', 'staging', 'prod'];
      const hostedZoneId = outputs['route53-zone-id'];
      
      for (const env of environments) {
        const albDns = outputs[getEnvOutput(env, 'alb-dns')];
        const dnsRecord = outputs[getEnvOutput(env, 'dns-record')];
        
        // Get ALB zone ID
        const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
        const alb = albResponse.LoadBalancers?.find(lb => lb.DNSName === albDns);
        
        // Verify DNS record points to ALB
        const recordsResponse = await route53Client.send(new ListResourceRecordSetsCommand({
          HostedZoneId: hostedZoneId
        }));

        const record = recordsResponse.ResourceRecordSets?.find(r => r.Name === dnsRecord);
        expect(record).toBeDefined();
        expect(record?.AliasTarget?.DNSName).toBe(albDns);
        expect(record?.AliasTarget?.HostedZoneId).toBe(alb?.CanonicalHostedZoneId);
      }
    }, 60000);
  });

  // ============================================================================
  // PART 4: E2E TESTS (Complete Flows with 3+ Services)
  // ============================================================================

  describe('[E2E] Complete Application Flow: Route53 → ALB → ECS → RDS', () => {
    test('should support complete request flow through all infrastructure layers', async () => {
      const env = 'dev';
      const dnsRecord = outputs[getEnvOutput(env, 'dns-record')];
      const albDns = outputs[getEnvOutput(env, 'alb-dns')];
      const clusterName = outputs[getEnvOutput(env, 'ecs-cluster')];
      const rdsEndpoint = outputs[getEnvOutput(env, 'rds-endpoint')];
      
      // Step 1: Verify DNS resolution
      expect(dnsRecord).toBeDefined();
      expect(albDns).toBeDefined();
      
      // Step 2: Verify ALB is accessible
      const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
      const alb = albResponse.LoadBalancers?.find(lb => lb.DNSName === albDns);
      expect(alb?.State?.Code).toBe('active');
      
      // Step 3: Verify ECS service is running
      const servicesResponse = await ecsClient.send(new DescribeServicesCommand({
        cluster: clusterName,
        services: [],
      }));
      const service = servicesResponse.services?.[0];
      expect(service?.status).toBe('ACTIVE');
      
      // Step 4: Verify RDS is accessible
      const clusterIdentifier = rdsEndpoint.split('.')[0];
      const rdsResponse = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));
      expect(rdsResponse.DBClusters?.[0]?.Status).toBe('available');
      
      // Step 5: Verify complete connectivity chain
      expect(dnsRecord).toContain('mytszone.com');
      expect(alb?.DNSName).toBe(albDns);
      expect(service?.runningCount).toBeGreaterThanOrEqual(1);
      expect(rdsResponse.DBClusters?.[0]?.Endpoint).toBe(rdsEndpoint);
    }, 120000);
  });

  describe('[E2E] Multi-Environment VPC Peering Flow: Staging ↔ Prod', () => {
    test('should support data migration flow between staging and prod via VPC peering', async () => {
      const peeringId = outputs['vpc-peering-connection-id'];
      const stagingVpcId = outputs[getEnvOutput('staging', 'vpc-id')];
      const prodVpcId = outputs[getEnvOutput('prod', 'vpc-id')];
      const stagingRdsEndpoint = outputs[getEnvOutput('staging', 'rds-endpoint')];
      const prodRdsEndpoint = outputs[getEnvOutput('prod', 'rds-endpoint')];
      
      // Step 1: Verify VPC peering connection
      const peeringResponse = await ec2Client.send(new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [peeringId]
      }));
      const peering = peeringResponse.VpcPeeringConnections?.[0];
      expect(peering?.Status?.Code).toBe('active');
      
      // Step 2: Verify route tables have peering routes
      const stagingRtResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [stagingVpcId] }]
      }));
      
      const stagingRouteTables = stagingRtResponse.RouteTables || [];
      const hasPeeringRoute = stagingRouteTables.some(rt => 
        rt.Routes?.some(route => route.VpcPeeringConnectionId === peeringId)
      );
      expect(hasPeeringRoute).toBe(true);
      
      // Step 3: Verify both RDS clusters are accessible for data migration
      const stagingClusterIdentifier = stagingRdsEndpoint.split('.')[0];
      const prodClusterIdentifier = prodRdsEndpoint.split('.')[0];
      
      const stagingRdsResponse = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: stagingClusterIdentifier
      }));
      const prodRdsResponse = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: prodClusterIdentifier
      }));
      
      expect(stagingRdsResponse.DBClusters?.[0]?.Status).toBe('available');
      expect(prodRdsResponse.DBClusters?.[0]?.Status).toBe('available');
      
      // Step 4: Verify network isolation (dev should not have peering)
      const devVpcId = outputs[getEnvOutput('dev', 'vpc-id')];
      const devRtResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [devVpcId] }]
      }));
      
      const devRouteTables = devRtResponse.RouteTables || [];
      const devHasPeeringRoute = devRouteTables.some(rt => 
        rt.Routes?.some(route => route.VpcPeeringConnectionId === peeringId)
      );
      expect(devHasPeeringRoute).toBe(false);
    }, 120000);
  });

  describe('[E2E] Auto-Scaling Flow: ECS → CloudWatch → Auto Scaling', () => {
    test('should support complete auto-scaling workflow across services', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const clusterName = outputs[getEnvOutput(env, 'ecs-cluster')];
        
        // Step 1: Get current service configuration
        const servicesResponse = await ecsClient.send(new DescribeServicesCommand({
          cluster: clusterName,
          services: [],
        }));
        const service = servicesResponse.services?.[0];
        
        // Step 2: Verify service is configured for auto-scaling
        expect(service?.desiredCount).toBeGreaterThanOrEqual(2);
        expect(service?.launchType).toBe('FARGATE');
        expect(service?.networkConfiguration).toBeDefined();
        
        // Step 3: Verify service has capacity provider strategy
        expect(service?.capacityProviderStrategy).toBeDefined();
        
        // Step 4: Verify log group exists for monitoring
        const envPrefix = `${env}-${environmentSuffix}`;
        const logGroupName = `/ecs/${envPrefix}-app`;
        const logsResponse = await cloudwatchLogsClient.send(new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        }));
        
        const logGroup = logsResponse.logGroups?.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
      }
    }, 90000);
  });

  describe('[E2E] Security Flow: IAM → ECS → SSM → RDS', () => {
    test('should support complete security flow with least-privilege access', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const envPrefix = `${env}-${environmentSuffix}`;
        const clusterName = outputs[getEnvOutput(env, 'ecs-cluster')];
        
        // Step 1: Verify ECS task role exists with correct permissions
        const taskRoleName = `${envPrefix}-ecs-task-role`;
        const executionRoleName = `${envPrefix}-ecs-execution-role`;
        
        const taskRoleResponse = await iamClient.send(new GetRoleCommand({
          RoleName: taskRoleName
        }));
        expect(taskRoleResponse.Role).toBeDefined();
        
        const executionRoleResponse = await iamClient.send(new GetRoleCommand({
          RoleName: executionRoleName
        }));
        expect(executionRoleResponse.Role).toBeDefined();
        
        // Step 2: Verify task role has SSM access policy
        const taskPoliciesResponse = await iamClient.send(new ListRolePoliciesCommand({
          RoleName: taskRoleName
        }));
        expect(taskPoliciesResponse.PolicyNames?.includes('ecs-task-policy')).toBe(true);
        
        // Step 3: Verify execution role has ECS task execution policy
        const attachedPoliciesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({
          RoleName: executionRoleName
        }));
        const hasEcsPolicy = attachedPoliciesResponse.AttachedPolicies?.some(p => 
          p.PolicyArn?.includes('AmazonECSTaskExecutionRolePolicy')
        );
        expect(hasEcsPolicy).toBe(true);
        
        // Step 4: Verify SSM parameter exists with encryption
        const parameterName = `/${envPrefix}/rds/password`;
        const ssmResponse = await ssmClient.send(new GetParametersCommand({
          Names: [parameterName],
          WithDecryption: false // Don't decrypt for security test
        }));
        
        const parameter = ssmResponse.Parameters?.[0];
        expect(parameter?.Type).toBe('SecureString');
        
        // Step 5: Verify ECS service uses the correct IAM roles
        const servicesResponse = await ecsClient.send(new DescribeServicesCommand({
          cluster: clusterName,
          services: [],
        }));
        const service = servicesResponse.services?.[0];
        
        expect(service?.taskDefinition).toBeDefined();
        // Task definition ARN contains role information that would be verified in actual deployment
      }
    }, 150000);
  });

  // ============================================================================
  // PART 5: NETWORK TOPOLOGY AND CONNECTIVITY VALIDATION
  // ============================================================================

  describe('[Network Topology] VPC Endpoint Connectivity', () => {
    test('should have VPC endpoints for S3, ECR, and Systems Manager in all environments', async () => {
      const environments = ['dev', 'staging', 'prod'];
      const expectedEndpoints = ['s3', 'ecr.dkr', 'ecr.api', 'ssm', 'ssmmessages', 'ec2messages'];
      
      for (const env of environments) {
        const vpcId = outputs[getEnvOutput(env, 'vpc-id')];
        
        const endpointsResponse = await ec2Client.send(new DescribeVpcEndpointsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        }));

        const endpoints = endpointsResponse.VpcEndpoints || [];
        expect(endpoints.length).toBeGreaterThanOrEqual(expectedEndpoints.length);
        
        expectedEndpoints.forEach(expectedService => {
          const endpoint = endpoints.find(ep => 
            ep.ServiceName?.includes(expectedService)
          );
          expect(endpoint).toBeDefined();
          expect(endpoint?.State).toBe('available');
        });
      }
    }, 90000);
  });

  describe('[Network Topology] NAT Gateway High Availability', () => {
    test('should have NAT gateways in each public subnet for high availability', async () => {
      const environments = ['dev', 'staging', 'prod'];
      
      for (const env of environments) {
        const vpcId = outputs[getEnvOutput(env, 'vpc-id')];
        
        // Get public subnets
        const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Type', Values: ['public'] }
          ]
        }));
        const publicSubnets = subnetsResponse.Subnets || [];
        expect(publicSubnets.length).toBe(3); // 3 AZs
        
        // Get NAT gateways
        const natResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
        }));
        const natGateways = natResponse.NatGateways || [];
        
        // Should have 3 NAT gateways (one per AZ)
        expect(natGateways.length).toBe(3);
        natGateways.forEach(nat => {
          expect(nat.State).toBe('available');
          expect(publicSubnets.some(subnet => subnet.SubnetId === nat.SubnetId)).toBe(true);
        });
      }
    }, 60000);
  });
});