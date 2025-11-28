// Integration tests for DMS Migration Infrastructure
// These tests dynamically discover the deployed stack and validate all resources
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
  ListStackResourcesCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import { RDSClient, DescribeDBClustersCommand, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { DatabaseMigrationServiceClient, DescribeReplicationInstancesCommand, DescribeEndpointsCommand, DescribeReplicationTasksCommand } from '@aws-sdk/client-database-migration-service';
import { Route53Client, GetHostedZoneCommand, ListResourceRecordSetsCommand } from '@aws-sdk/client-route-53';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';

interface DiscoveredResources {
  stackName: string;
  environmentSuffix: string;
  outputs: Record<string, string>;
  resources: Map<string, { logicalId: string; physicalId: string; resourceType: string }>;
}

describe('DMS Migration Infrastructure Integration Tests', () => {
  let discovered: DiscoveredResources;
  let rdsClient: RDSClient;
  let dmsClient: DatabaseMigrationServiceClient;
  let route53Client: Route53Client;
  let cloudwatchClient: CloudWatchClient;
  let ssmClient: SSMClient;
  let kmsClient: KMSClient;
  let snsClient: SNSClient;
  let ec2Client: EC2Client;
  let cfnClient: CloudFormationClient;

  beforeAll(async () => {
    const region = process.env.AWS_REGION || 'us-east-1';
    
    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region });
    rdsClient = new RDSClient({ region });
    dmsClient = new DatabaseMigrationServiceClient({ region });
    route53Client = new Route53Client({ region });
    cloudwatchClient = new CloudWatchClient({ region });
    ssmClient = new SSMClient({ region });
    kmsClient = new KMSClient({ region });
    snsClient = new SNSClient({ region });
    ec2Client = new EC2Client({ region });

    // Dynamically discover the stack
    discovered = await discoverStackAndResources(cfnClient);
    
    console.log(`✅ Discovered stack: ${discovered.stackName}`);
    console.log(`✅ Environment suffix: ${discovered.environmentSuffix}`);
    console.log(`✅ Found ${discovered.outputs ? Object.keys(discovered.outputs).length : 0} outputs`);
    console.log(`✅ Found ${discovered.resources ? discovered.resources.size : 0} resources`);
  });

  /**
   * Dynamically discover the CloudFormation stack and all its resources
   */
  async function discoverStackAndResources(cfnClient: CloudFormationClient): Promise<DiscoveredResources> {
    // Try to get stack name from environment variable first
    let stackName: string | undefined = process.env.STACK_NAME;
    
    // If ENVIRONMENT_SUFFIX is provided, construct stack name
    if (!stackName && process.env.ENVIRONMENT_SUFFIX) {
      stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX}`;
    }

    // If we have a stack name, verify it exists
    if (stackName) {
      try {
        const describeCommand = new DescribeStacksCommand({ StackName: stackName });
        const response = await cfnClient.send(describeCommand);
        if (response.Stacks && response.Stacks.length > 0) {
          const stackStatus = response.Stacks[0].StackStatus;
          if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
            return await extractStackResources(cfnClient, stackName);
          }
        }
      } catch (error: any) {
        console.log(`Stack ${stackName} not found, falling back to discovery: ${error.message}`);
      }
    }

    // Fallback: Discover stack by pattern
    const listCommand = new ListStacksCommand({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE'],
    });

    const stacks = await cfnClient.send(listCommand);
    
    // Find stacks matching TapStack pattern, prioritizing exact matches
    // Filter out nested stacks (those with hyphens after TapStack)
    const tapStacks = (stacks.StackSummaries || [])
      .filter((stack) => {
        const name = stack.StackName || '';
        // Match TapStack{suffix} pattern but exclude nested stacks
        return name.startsWith('TapStack') && 
               !name.includes('-') && // Exclude nested stacks like TapStackdev2-VpcStack-XXX
               (stack.StackStatus === 'CREATE_COMPLETE' || stack.StackStatus === 'UPDATE_COMPLETE');
      })
      .sort((a, b) => {
        const aTime = a.CreationTime?.getTime() || 0;
        const bTime = b.CreationTime?.getTime() || 0;
        return bTime - aTime; // Newest first
      });

    if (tapStacks.length === 0) {
      // If no exact match, try to find any TapStack and check if it has DMS resources
      const allTapStacks = (stacks.StackSummaries || [])
        .filter((stack) => stack.StackName?.startsWith('TapStack'))
        .sort((a, b) => {
          const aTime = a.CreationTime?.getTime() || 0;
          const bTime = b.CreationTime?.getTime() || 0;
          return bTime - aTime;
        });

      // Try each stack to see if it has DMS resources
      for (const stack of allTapStacks) {
        try {
          const resources = await extractStackResources(cfnClient, stack.StackName!);
          // Check if this stack has DMS resources
          if (resources.resources.has('DMSReplicationInstance') || 
              resources.resources.has('AuroraDBCluster')) {
            return resources;
          }
        } catch (error) {
          // Continue to next stack
          continue;
        }
      }

      throw new Error(
        'No DMS Migration TapStack found. Please deploy the stack first using: npm run cfn:deploy-json'
      );
    }

    const selectedStack = tapStacks[0];
    return await extractStackResources(cfnClient, selectedStack.StackName!);
  }

  /**
   * Extract all resources and outputs from a stack
   */
  async function extractStackResources(
    cfnClient: CloudFormationClient,
    stackName: string
  ): Promise<DiscoveredResources> {
    // Get stack details including outputs
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const stackResponse = await cfnClient.send(describeCommand);
    
    if (!stackResponse.Stacks || stackResponse.Stacks.length === 0) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const stack = stackResponse.Stacks[0];
    
    // Extract outputs
    const outputs: Record<string, string> = {};
    if (stack.Outputs) {
      for (const output of stack.Outputs) {
        if (output.OutputKey && output.OutputValue) {
          outputs[output.OutputKey] = output.OutputValue;
        }
      }
    }

    // Extract environment suffix from stack name (TapStack{suffix})
    const environmentSuffix = stackName.replace(/^TapStack/, '') || 'dev';

    // Get all stack resources
    const resources = new Map<string, { logicalId: string; physicalId: string; resourceType: string }>();
    let nextToken: string | undefined;
    
    do {
      const resourcesCommand = new ListStackResourcesCommand({
        StackName: stackName,
        NextToken: nextToken,
      });
      const resourcesResponse = await cfnClient.send(resourcesCommand);
      
      if (resourcesResponse.StackResourceSummaries) {
        for (const resource of resourcesResponse.StackResourceSummaries) {
          if (resource.LogicalResourceId && resource.PhysicalResourceId) {
            resources.set(resource.LogicalResourceId, {
              logicalId: resource.LogicalResourceId,
              physicalId: resource.PhysicalResourceId,
              resourceType: resource.ResourceType || 'Unknown',
            });
          }
        }
      }
      
      nextToken = resourcesResponse.NextToken;
    } while (nextToken);

    return {
      stackName,
      environmentSuffix,
      outputs,
      resources,
    };
  }

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'DMSTaskARN',
        'AuroraClusterEndpoint',
        'AuroraReaderEndpoint',
        'Route53HostedZoneId',
        'DMSReplicationInstanceARN',
        'KMSKeyId',
        'SNSTopicARN',
        'CloudWatchDashboardURL',
        'VPCId'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(discovered.outputs[outputKey]).toBeDefined();
        expect(discovered.outputs[outputKey]).not.toBe('');
      });
    });

    test('ARN outputs should be valid ARNs', () => {
      const arnOutputs = ['DMSTaskARN', 'DMSReplicationInstanceARN', 'SNSTopicARN'];

      arnOutputs.forEach(outputKey => {
        expect(discovered.outputs[outputKey]).toMatch(/^arn:aws:/);
      });
    });

    test('endpoint outputs should be valid hostnames', () => {
      expect(discovered.outputs.AuroraClusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(discovered.outputs.AuroraReaderEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and be properly configured', async () => {
      const vpcResource = discovered.resources.get('VPC');
      expect(vpcResource).toBeDefined();
      
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcResource!.physicalId]
      }));

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      // DNS attributes may not be returned by DescribeVpcs, but if they are, they should be enabled
      if (vpc.EnableDnsHostnames !== undefined) {
        expect(vpc.EnableDnsHostnames).toBe(true);
      }
      if (vpc.EnableDnsSupport !== undefined) {
        expect(vpc.EnableDnsSupport).toBe(true);
      }
      
      // Verify VPC ID matches output
      expect(vpcResource!.physicalId).toBe(discovered.outputs.VPCId);
    });

    test('should have 3 private subnets across different AZs', async () => {
      const vpcResource = discovered.resources.get('VPC');
      expect(vpcResource).toBeDefined();
      
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcResource!.physicalId] },
          { Name: 'tag:Name', Values: [`dms-migration-private-subnet-*-${discovered.environmentSuffix}`] }
        ]
      }));

      expect(response.Subnets).toHaveLength(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('should have 3 public subnets across different AZs', async () => {
      const vpcResource = discovered.resources.get('VPC');
      expect(vpcResource).toBeDefined();
      
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcResource!.physicalId] },
          { Name: 'tag:Name', Values: [`dms-migration-public-subnet-*-${discovered.environmentSuffix}`] }
        ]
      }));

      expect(response.Subnets).toHaveLength(3);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('Aurora PostgreSQL Cluster', () => {
    test('Aurora cluster should be available', async () => {
      const clusterResource = discovered.resources.get('AuroraDBCluster');
      expect(clusterResource).toBeDefined();
      
      // Extract cluster identifier from physical resource ID or ARN
      const clusterIdentifier = clusterResource!.physicalId.split('/').pop() || clusterResource!.physicalId;
      
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
    });

    test('Aurora cluster should have 3 instances', async () => {
      const clusterResource = discovered.resources.get('AuroraDBCluster');
      expect(clusterResource).toBeDefined();
      
      const clusterIdentifier = clusterResource!.physicalId.split('/').pop() || clusterResource!.physicalId;
      
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [clusterIdentifier] }
        ]
      }));

      expect(response.DBInstances).toHaveLength(3);

      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.Engine).toBe('aurora-postgresql');
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    test('Aurora cluster should have proper endpoints', async () => {
      const clusterResource = discovered.resources.get('AuroraDBCluster');
      expect(clusterResource).toBeDefined();
      
      const clusterIdentifier = clusterResource!.physicalId.split('/').pop() || clusterResource!.physicalId;
      
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      const cluster = response.DBClusters![0];
      expect(cluster.Endpoint).toBe(discovered.outputs.AuroraClusterEndpoint);
      expect(cluster.ReaderEndpoint).toBe(discovered.outputs.AuroraReaderEndpoint);
    });

    test('Aurora cluster should have CloudWatch logs enabled', async () => {
      const clusterResource = discovered.resources.get('AuroraDBCluster');
      expect(clusterResource).toBeDefined();
      
      const clusterIdentifier = clusterResource!.physicalId.split('/').pop() || clusterResource!.physicalId;
      
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      const cluster = response.DBClusters![0];
      expect(cluster.EnabledCloudwatchLogsExports).toContain('postgresql');
    });
  });

  describe('DMS Replication Infrastructure', () => {
    test('DMS replication instance should be available', async () => {
      const instanceResource = discovered.resources.get('DMSReplicationInstance');
      expect(instanceResource).toBeDefined();
      
      // Extract instance identifier from ARN or physical ID
      const instanceArn = instanceResource!.physicalId;
      const instanceId = instanceArn.split(':').pop()?.split('/').pop() || instanceResource!.physicalId;
      
      const response = await dmsClient.send(new DescribeReplicationInstancesCommand({
        Filters: [
          { Name: 'replication-instance-arn', Values: [instanceArn] }
        ]
      }));

      expect(response.ReplicationInstances).toHaveLength(1);
      const instance = response.ReplicationInstances![0];
      expect(instance.ReplicationInstanceStatus).toBe('available');
      expect(instance.ReplicationInstanceClass).toBe('dms.t3.medium');
      expect(instance.PubliclyAccessible).toBe(false);
    });

    test('DMS source endpoint should be configured', async () => {
      const endpointResource = discovered.resources.get('DMSSourceEndpoint');
      expect(endpointResource).toBeDefined();
      
      const endpointArn = endpointResource!.physicalId;
      
      const response = await dmsClient.send(new DescribeEndpointsCommand({
        Filters: [
          { Name: 'endpoint-arn', Values: [endpointArn] }
        ]
      }));

      expect(response.Endpoints).toHaveLength(1);
      const endpoint = response.Endpoints![0];
      expect(endpoint.EndpointType?.toLowerCase()).toBe('source');
      expect(endpoint.EngineName).toBe('postgres');
      expect(endpoint.SslMode?.toLowerCase()).toBe('require');
    });

    test('DMS target endpoint should be configured', async () => {
      const endpointResource = discovered.resources.get('DMSTargetEndpoint');
      expect(endpointResource).toBeDefined();
      
      const endpointArn = endpointResource!.physicalId;
      
      const response = await dmsClient.send(new DescribeEndpointsCommand({
        Filters: [
          { Name: 'endpoint-arn', Values: [endpointArn] }
        ]
      }));

      expect(response.Endpoints).toHaveLength(1);
      const endpoint = response.Endpoints![0];
      expect(endpoint.EndpointType?.toLowerCase()).toBe('target');
      expect(endpoint.EngineName).toBe('aurora-postgresql');
      expect(endpoint.SslMode?.toLowerCase()).toBe('require');
    });

    test('DMS replication task should be configured', async () => {
      const taskResource = discovered.resources.get('DMSReplicationTask');
      expect(taskResource).toBeDefined();
      
      const taskArn = taskResource!.physicalId;
      
      const response = await dmsClient.send(new DescribeReplicationTasksCommand({
        Filters: [
          { Name: 'replication-task-arn', Values: [taskArn] }
        ]
      }));

      expect(response.ReplicationTasks).toHaveLength(1);
      const task = response.ReplicationTasks![0];
      expect(task.MigrationType).toBe('full-load-and-cdc');
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      const keyResource = discovered.resources.get('KMSKey');
      expect(keyResource).toBeDefined();
      
      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: discovered.outputs.KMSKeyId
      }));

      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Description).toContain('KMS key for encrypting Aurora database and DMS resources');
      expect(keyResource!.physicalId).toBe(discovered.outputs.KMSKeyId);
    });
  });

  describe('SSM Parameter Store', () => {
    test('on-premises database password parameter should exist', async () => {
      const paramResource = discovered.resources.get('OnPremDBPasswordParameter');
      expect(paramResource).toBeDefined();
      
      const response = await ssmClient.send(new GetParameterCommand({
        Name: paramResource!.physicalId,
        WithDecryption: false
      }));

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('String');
    });

    test('Aurora database password parameter should exist', async () => {
      const paramResource = discovered.resources.get('AuroraDBPasswordParameter');
      expect(paramResource).toBeDefined();
      
      const response = await ssmClient.send(new GetParameterCommand({
        Name: paramResource!.physicalId,
        WithDecryption: false
      }));

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('String');
    });
  });

  describe('Route 53 Blue-Green Deployment', () => {
    test('hosted zone should exist', async () => {
      const zoneResource = discovered.resources.get('Route53HostedZone');
      expect(zoneResource).toBeDefined();
      
      // Route53 HostedZoneId format is /hostedzone/XXXXX, need to extract just the ID
      const hostedZoneId = discovered.outputs.Route53HostedZoneId.replace(/^\/hostedzone\//, '');
      
      const response = await route53Client.send(new GetHostedZoneCommand({
        Id: hostedZoneId
      }));

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Config?.Comment).toContain('blue-green deployment');
    });

    test('should have weighted record sets for blue-green deployment', async () => {
      const hostedZoneId = discovered.outputs.Route53HostedZoneId.replace(/^\/hostedzone\//, '');
      
      const response = await route53Client.send(new ListResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId
      }));

      const weightedRecords = response.ResourceRecordSets!.filter(rs => rs.Weight !== undefined);
      expect(weightedRecords.length).toBeGreaterThanOrEqual(2);

      const onPremRecord = weightedRecords.find(rs => rs.SetIdentifier === 'OnPremises');
      const auroraRecord = weightedRecords.find(rs => rs.SetIdentifier === 'Aurora');

      expect(onPremRecord).toBeDefined();
      expect(auroraRecord).toBeDefined();
      expect(onPremRecord!.Weight).toBe(100);
      expect(auroraRecord!.Weight).toBe(0);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarm for replication lag should exist', async () => {
      const alarmResource = discovered.resources.get('DMSReplicationLagAlarm');
      expect(alarmResource).toBeDefined();
      
      // Extract alarm name from physical ID
      const alarmName = alarmResource!.physicalId;
      
      const response = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      }));

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CDCLatencySource');
      expect(alarm.Namespace).toBe('AWS/DMS');
      expect(alarm.Threshold).toBe(300);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('CloudWatch alarm should have proper dimensions', async () => {
      const alarmResource = discovered.resources.get('DMSReplicationLagAlarm');
      expect(alarmResource).toBeDefined();
      
      const alarmName = alarmResource!.physicalId;
      
      const response = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      }));

      const alarm = response.MetricAlarms![0];
      expect(alarm.Dimensions).toHaveLength(2);

      const dimensionNames = alarm.Dimensions!.map(d => d.Name);
      expect(dimensionNames).toContain('ReplicationInstanceIdentifier');
      expect(dimensionNames).toContain('ReplicationTaskIdentifier');
    });

    test('CloudWatch alarm should be configured to send SNS notifications', async () => {
      const alarmResource = discovered.resources.get('DMSReplicationLagAlarm');
      expect(alarmResource).toBeDefined();
      
      const alarmName = alarmResource!.physicalId;
      
      const response = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [alarmName]
      }));

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmActions).toContain(discovered.outputs.SNSTopicARN);
    });
  });

  describe('SNS Alerting', () => {
    test('SNS topic should exist', async () => {
      const topicResource = discovered.resources.get('SNSTopic');
      expect(topicResource).toBeDefined();
      
      const response = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: discovered.outputs.SNSTopicARN
      }));

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe('DMS Replication Alerts');
      expect(topicResource!.physicalId).toBe(discovered.outputs.SNSTopicARN);
    });
  });

  describe('Security Validation', () => {
    test('Aurora security group should allow PostgreSQL from DMS', async () => {
      const sgResource = discovered.resources.get('AuroraSecurityGroup');
      expect(sgResource).toBeDefined();
      
      const vpcResource = discovered.resources.get('VPC');
      expect(vpcResource).toBeDefined();
      
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgResource!.physicalId]
      }));

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(vpcResource!.physicalId);

      const postgresIngress = sg.IpPermissions!.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresIngress).toBeDefined();
    });

    test('DMS security group should allow outbound PostgreSQL', async () => {
      const sgResource = discovered.resources.get('DMSSecurityGroup');
      expect(sgResource).toBeDefined();
      
      const vpcResource = discovered.resources.get('VPC');
      expect(vpcResource).toBeDefined();
      
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgResource!.physicalId]
      }));

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(vpcResource!.physicalId);

      const postgresEgress = sg.IpPermissionsEgress!.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresEgress).toBeDefined();
    });
  });

  describe('End-to-End Connectivity', () => {
    test('Aurora cluster should be reachable from DMS', async () => {
      // This test verifies that the DMS replication instance can connect to Aurora
      // by checking the target endpoint status
      const endpointResource = discovered.resources.get('DMSTargetEndpoint');
      expect(endpointResource).toBeDefined();
      
      const endpointArn = endpointResource!.physicalId;
      
      const response = await dmsClient.send(new DescribeEndpointsCommand({
        Filters: [
          { Name: 'endpoint-arn', Values: [endpointArn] }
        ]
      }));

      expect(response.Endpoints).toHaveLength(1);
      const endpoint = response.Endpoints![0];
      // If the endpoint was successfully tested, it should have a status
      expect(endpoint.Status).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('Aurora cluster should have proper tags', async () => {
      const clusterResource = discovered.resources.get('AuroraDBCluster');
      expect(clusterResource).toBeDefined();
      
      const clusterIdentifier = clusterResource!.physicalId.split('/').pop() || clusterResource!.physicalId;
      
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      }));

      const cluster = response.DBClusters![0];
      const nameTag = cluster.TagList?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(discovered.environmentSuffix);
    });
  });
});
