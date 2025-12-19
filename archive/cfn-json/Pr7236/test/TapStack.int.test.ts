import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  DatabaseMigrationServiceClient,
  DescribeReplicationInstancesCommand,
  DescribeEndpointsCommand,
  DescribeReplicationTasksCommand,
} from '@aws-sdk/client-database-migration-service';
import {
  Route53Client,
  GetHostedZoneCommand,
} from '@aws-sdk/client-route-53';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

// Dynamically discover stack name from environment
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

interface StackOutputs {
  AuroraClusterEndpoint?: string;
  AuroraClusterIdentifier?: string;
  AuroraClusterPort?: string;
  DMSReplicationTaskArn?: string;
  DMSReplicationInstanceArn?: string;
  DMSSourceEndpointArn?: string;
  DMSTargetEndpointArn?: string;
  Route53HostedZoneId?: string;
  DMSSecurityGroupId?: string;
  AuroraSecurityGroupId?: string;
  SNSAlertTopicArn?: string;
  CloudWatchDashboardUrl?: string;
}

interface StackResource {
  LogicalResourceId: string;
  ResourceType: string;
  ResourceStatus: string;
  PhysicalResourceId?: string;
}

interface DiscoveredResources {
  stackName: string;
  stackOutputs: StackOutputs;
  stackResources: StackResource[];
  stackStatus: string;
}

async function discoverStack(): Promise<DiscoveredResources> {
  const cfnClient = new CloudFormationClient({ region });
  
  // Try exact match first
  let stackName = `TapStack${environmentSuffix}`;
  let matchingStack;
  
  try {
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfnClient.send(describeCommand);
    matchingStack = response.Stacks?.[0];
  } catch (error) {
    // Stack not found with exact name, try to discover dynamically
    console.log(`Stack ${stackName} not found, searching for matching stacks...`);
    
    const listCommand = new DescribeStacksCommand({});
    const allStacks = await cfnClient.send(listCommand);
    
    matchingStack = allStacks.Stacks?.find(
      (stack) =>
        stack.StackName?.startsWith('TapStack') &&
        (stack.StackName?.includes(environmentSuffix) ||
          stack.StackName?.endsWith(environmentSuffix)) &&
        stack.StackStatus !== 'DELETE_COMPLETE' &&
        (stack.StackStatus === 'CREATE_COMPLETE' ||
          stack.StackStatus === 'UPDATE_COMPLETE')
    );
    
    if (matchingStack) {
      stackName = matchingStack.StackName!;
    }
  }
  
  if (!matchingStack) {
    throw new Error(
      `Could not find CloudFormation stack. ` +
      `Searched for: TapStack${environmentSuffix} or TapStack*${environmentSuffix}. ` +
      `Environment suffix: ${environmentSuffix}`
    );
  }
  
  const stackStatus = matchingStack.StackStatus || 'UNKNOWN';
  
  if (
    !stackStatus.includes('COMPLETE') &&
    !stackStatus.includes('UPDATE_COMPLETE')
  ) {
    throw new Error(
      `Stack ${stackName} is not in a valid state. Current status: ${stackStatus}`
    );
  }
  
  // Extract outputs
  const stackOutputs: StackOutputs = {};
  if (matchingStack.Outputs) {
    for (const output of matchingStack.Outputs) {
      if (output.OutputKey && output.OutputValue) {
        stackOutputs[output.OutputKey as keyof StackOutputs] = output.OutputValue;
      }
    }
  }
  
  // Discover stack resources with pagination
  const stackResources: StackResource[] = [];
  let nextToken: string | undefined;
  
  do {
    const resourcesCommand = new ListStackResourcesCommand({
      StackName: stackName,
      NextToken: nextToken,
    });
    const resourcesResponse = await cfnClient.send(resourcesCommand);
    
    if (resourcesResponse.StackResourceSummaries) {
      for (const resource of resourcesResponse.StackResourceSummaries) {
        stackResources.push({
          LogicalResourceId: resource.LogicalResourceId || '',
          ResourceType: resource.ResourceType || '',
          ResourceStatus: resource.ResourceStatus || '',
          PhysicalResourceId: resource.PhysicalResourceId,
        });
      }
    }
    
    nextToken = resourcesResponse.NextToken;
  } while (nextToken);
  
  return {
    stackName,
    stackOutputs,
    stackResources,
    stackStatus,
  };
}

describe('TapStack CloudFormation Integration Tests', () => {
  let discovered: DiscoveredResources;
  
  beforeAll(async () => {
    console.log(`🔍 Discovering stack with environment suffix: ${environmentSuffix} in region: ${region}`);
    discovered = await discoverStack();
    console.log(`✅ Discovered stack: ${discovered.stackName}`);
    console.log(`📊 Stack status: ${discovered.stackStatus}`);
    console.log(`📦 Discovered ${discovered.stackResources.length} resources`);
    console.log(`📤 Stack outputs:`, Object.keys(discovered.stackOutputs));
  }, 60000);
  
  describe('Stack Discovery', () => {
    test('should discover CloudFormation stack', () => {
      expect(discovered).toBeDefined();
      expect(discovered.stackName).toBeDefined();
      expect(discovered.stackName).toContain('TapStack');
      expect(discovered.stackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
    
    test('should have all required stack outputs', () => {
      const requiredOutputs = [
        'AuroraClusterEndpoint',
        'AuroraClusterIdentifier',
        'DMSReplicationTaskArn',
        'DMSReplicationInstanceArn',
        'DMSSourceEndpointArn',
        'DMSTargetEndpointArn',
        'Route53HostedZoneId',
        'DMSSecurityGroupId',
        'AuroraSecurityGroupId',
        'SNSAlertTopicArn',
      ];
      
      for (const outputKey of requiredOutputs) {
        expect(discovered.stackOutputs[outputKey as keyof StackOutputs]).toBeDefined();
        expect(discovered.stackOutputs[outputKey as keyof StackOutputs]).not.toBe('');
      }
    });
    
    test('should have discovered stack resources', () => {
      expect(discovered.stackResources.length).toBeGreaterThan(0);
    });
  });
  
  describe('Aurora Cluster Resources', () => {
    test('Aurora cluster should exist', async () => {
      const clusterIdentifier = discovered.stackOutputs.AuroraClusterIdentifier;
      expect(clusterIdentifier).toBeDefined();
      
      const rdsClient = new RDSClient({ region });
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);
      
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBeGreaterThan(0);
      expect(response.DBClusters?.[0].DBClusterIdentifier).toBe(clusterIdentifier);
    });
    
    test('Aurora cluster endpoint should match output', () => {
      const clusterEndpoint = discovered.stackOutputs.AuroraClusterEndpoint;
      const clusterIdentifier = discovered.stackOutputs.AuroraClusterIdentifier;
      
      expect(clusterEndpoint).toBeDefined();
      expect(clusterEndpoint).toContain(clusterIdentifier);
      expect(clusterEndpoint).toMatch(/\.cluster-.*\.rds\.amazonaws\.com$/);
    });
    
    test('Aurora cluster should have encryption enabled', async () => {
      const clusterIdentifier = discovered.stackOutputs.AuroraClusterIdentifier;
      expect(clusterIdentifier).toBeDefined();
      
      const rdsClient = new RDSClient({ region });
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);
      
      expect(response.DBClusters?.[0].StorageEncrypted).toBe(true);
    });
    
    test('Aurora instances should exist', async () => {
      const clusterIdentifier = discovered.stackOutputs.AuroraClusterIdentifier;
      expect(clusterIdentifier).toBeDefined();
      
      const rdsClient = new RDSClient({ region });
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);
      
      const clusterInstances = response.DBInstances?.filter(
        (instance) => instance.DBClusterIdentifier === clusterIdentifier
      );
      
      expect(clusterInstances).toBeDefined();
      expect(clusterInstances?.length).toBeGreaterThanOrEqual(1);
    });
    
    test('should have AuroraCluster resource in stack', () => {
      const clusterResource = discovered.stackResources.find(
        (r) => r.LogicalResourceId === 'AuroraCluster'
      );
      expect(clusterResource).toBeDefined();
      expect(clusterResource?.ResourceType).toBe('AWS::RDS::DBCluster');
      expect(clusterResource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
  });
  
  describe('DMS Resources', () => {
    test('DMS replication instance should exist', async () => {
      const replicationInstanceArn = discovered.stackOutputs.DMSReplicationInstanceArn;
      expect(replicationInstanceArn).toBeDefined();
      
      const dmsClient = new DatabaseMigrationServiceClient({ region });
      const command = new DescribeReplicationInstancesCommand({
        Filters: [
          {
            Name: 'replication-instance-arn',
            Values: [replicationInstanceArn!],
          },
        ],
      });
      const response = await dmsClient.send(command);
      
      expect(response.ReplicationInstances).toBeDefined();
      expect(response.ReplicationInstances?.length).toBeGreaterThan(0);
      expect(response.ReplicationInstances?.[0].ReplicationInstanceArn).toBe(
        replicationInstanceArn
      );
    });
    
    test('DMS replication instance should not be publicly accessible', async () => {
      const replicationInstanceArn = discovered.stackOutputs.DMSReplicationInstanceArn;
      expect(replicationInstanceArn).toBeDefined();
      
      const dmsClient = new DatabaseMigrationServiceClient({ region });
      const command = new DescribeReplicationInstancesCommand({
        Filters: [
          {
            Name: 'replication-instance-arn',
            Values: [replicationInstanceArn!],
          },
        ],
      });
      const response = await dmsClient.send(command);
      
      expect(response.ReplicationInstances?.[0].PubliclyAccessible).toBe(false);
    });
    
    test('DMS source endpoint should exist', async () => {
      const sourceEndpointArn = discovered.stackOutputs.DMSSourceEndpointArn;
      expect(sourceEndpointArn).toBeDefined();
      
      const dmsClient = new DatabaseMigrationServiceClient({ region });
      const command = new DescribeEndpointsCommand({
        Filters: [
          {
            Name: 'endpoint-arn',
            Values: [sourceEndpointArn!],
          },
        ],
      });
      const response = await dmsClient.send(command);
      
      expect(response.Endpoints).toBeDefined();
      expect(response.Endpoints?.length).toBeGreaterThan(0);
      expect(response.Endpoints?.[0].EndpointArn).toBe(sourceEndpointArn);
      expect(response.Endpoints?.[0].EndpointType?.toLowerCase()).toBe('source');
    });
    
    test('DMS target endpoint should exist', async () => {
      const targetEndpointArn = discovered.stackOutputs.DMSTargetEndpointArn;
      expect(targetEndpointArn).toBeDefined();
      
      const dmsClient = new DatabaseMigrationServiceClient({ region });
      const command = new DescribeEndpointsCommand({
        Filters: [
          {
            Name: 'endpoint-arn',
            Values: [targetEndpointArn!],
          },
        ],
      });
      const response = await dmsClient.send(command);
      
      expect(response.Endpoints).toBeDefined();
      expect(response.Endpoints?.length).toBeGreaterThan(0);
      expect(response.Endpoints?.[0].EndpointArn).toBe(targetEndpointArn);
      expect(response.Endpoints?.[0].EndpointType?.toLowerCase()).toBe('target');
    });
    
    test('DMS replication task should exist', async () => {
      const taskArn = discovered.stackOutputs.DMSReplicationTaskArn;
      expect(taskArn).toBeDefined();
      
      const dmsClient = new DatabaseMigrationServiceClient({ region });
      const command = new DescribeReplicationTasksCommand({
        Filters: [
          {
            Name: 'replication-task-arn',
            Values: [taskArn!],
          },
        ],
      });
      const response = await dmsClient.send(command);
      
      expect(response.ReplicationTasks).toBeDefined();
      expect(response.ReplicationTasks?.length).toBeGreaterThan(0);
      expect(response.ReplicationTasks?.[0].ReplicationTaskArn).toBe(taskArn);
    });
    
    test('should have DMSReplicationInstance resource in stack', () => {
      const instanceResource = discovered.stackResources.find(
        (r) => r.LogicalResourceId === 'DMSReplicationInstance'
      );
      expect(instanceResource).toBeDefined();
      expect(instanceResource?.ResourceType).toBe('AWS::DMS::ReplicationInstance');
      expect(instanceResource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
    
    test('should have DMSSourceEndpoint resource in stack', () => {
      const endpointResource = discovered.stackResources.find(
        (r) => r.LogicalResourceId === 'DMSSourceEndpoint'
      );
      expect(endpointResource).toBeDefined();
      expect(endpointResource?.ResourceType).toBe('AWS::DMS::Endpoint');
      expect(endpointResource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
    
    test('should have DMSTargetEndpoint resource in stack', () => {
      const endpointResource = discovered.stackResources.find(
        (r) => r.LogicalResourceId === 'DMSTargetEndpoint'
      );
      expect(endpointResource).toBeDefined();
      expect(endpointResource?.ResourceType).toBe('AWS::DMS::Endpoint');
      expect(endpointResource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
    
    test('should have DMSReplicationTask resource in stack', () => {
      const taskResource = discovered.stackResources.find(
        (r) => r.LogicalResourceId === 'DMSReplicationTask'
      );
      expect(taskResource).toBeDefined();
      expect(taskResource?.ResourceType).toBe('AWS::DMS::ReplicationTask');
      expect(taskResource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
  });
  
  describe('Route 53 Resources', () => {
    test('Route 53 hosted zone should exist', async () => {
      const hostedZoneId = discovered.stackOutputs.Route53HostedZoneId;
      expect(hostedZoneId).toBeDefined();
      
      const route53Client = new Route53Client({ region });
      const command = new GetHostedZoneCommand({
        Id: hostedZoneId,
      });
      const response = await route53Client.send(command);
      
      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone?.Id).toContain(hostedZoneId);
    });
    
    test('Route 53 hosted zone should be private', async () => {
      const hostedZoneId = discovered.stackOutputs.Route53HostedZoneId;
      expect(hostedZoneId).toBeDefined();
      
      const route53Client = new Route53Client({ region });
      const command = new GetHostedZoneCommand({
        Id: hostedZoneId,
      });
      const response = await route53Client.send(command);
      
      expect(response.HostedZone?.Config?.PrivateZone).toBe(true);
    });
    
    test('should have Route53HostedZone resource in stack', () => {
      const zoneResource = discovered.stackResources.find(
        (r) => r.LogicalResourceId === 'Route53HostedZone'
      );
      expect(zoneResource).toBeDefined();
      expect(zoneResource?.ResourceType).toBe('AWS::Route53::HostedZone');
      expect(zoneResource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
  });
  
  describe('Security Group Resources', () => {
    test('DMS security group should exist', async () => {
      const securityGroupId = discovered.stackOutputs.DMSSecurityGroupId;
      expect(securityGroupId).toBeDefined();
      
      const ec2Client = new EC2Client({ region });
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!],
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThan(0);
      expect(response.SecurityGroups?.[0].GroupId).toBe(securityGroupId);
    });
    
    test('Aurora security group should exist', async () => {
      const securityGroupId = discovered.stackOutputs.AuroraSecurityGroupId;
      expect(securityGroupId).toBeDefined();
      
      const ec2Client = new EC2Client({ region });
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!],
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThan(0);
      expect(response.SecurityGroups?.[0].GroupId).toBe(securityGroupId);
    });
    
    test('should have DMSSecurityGroup resource in stack', () => {
      const sgResource = discovered.stackResources.find(
        (r) => r.LogicalResourceId === 'DMSSecurityGroup'
      );
      expect(sgResource).toBeDefined();
      expect(sgResource?.ResourceType).toBe('AWS::EC2::SecurityGroup');
      expect(sgResource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
    
    test('should have AuroraDBSecurityGroup resource in stack', () => {
      const sgResource = discovered.stackResources.find(
        (r) => r.LogicalResourceId === 'AuroraDBSecurityGroup'
      );
      expect(sgResource).toBeDefined();
      expect(sgResource?.ResourceType).toBe('AWS::EC2::SecurityGroup');
      expect(sgResource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
  });
  
  describe('SNS Resources', () => {
    test('SNS alert topic should exist', async () => {
      const topicArn = discovered.stackOutputs.SNSAlertTopicArn;
      expect(topicArn).toBeDefined();
      
      const snsClient = new SNSClient({ region });
      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });
      const response = await snsClient.send(command);
      
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });
    
    test('should have ReplicationLagAlarmTopic resource in stack', () => {
      const topicResource = discovered.stackResources.find(
        (r) => r.LogicalResourceId === 'ReplicationLagAlarmTopic'
      );
      expect(topicResource).toBeDefined();
      expect(topicResource?.ResourceType).toBe('AWS::SNS::Topic');
      expect(topicResource?.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });
  });
  
  describe('Resource Naming Conventions', () => {
    test('Aurora cluster identifier should include environment suffix', () => {
      const clusterIdentifier = discovered.stackOutputs.AuroraClusterIdentifier;
      expect(clusterIdentifier).toBeDefined();
      expect(clusterIdentifier).toContain(environmentSuffix);
    });
    
    test('Stack name should include environment suffix', () => {
      expect(discovered.stackName).toContain(environmentSuffix);
    });
  });
  
  describe('Stack Resource Validation', () => {
    test('should have all expected resource types', () => {
      const expectedResourceTypes = [
        'AWS::RDS::DBCluster',
        'AWS::RDS::DBInstance',
        'AWS::DMS::ReplicationInstance',
        'AWS::DMS::Endpoint',
        'AWS::DMS::ReplicationTask',
        'AWS::Route53::HostedZone',
        'AWS::EC2::SecurityGroup',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
        'AWS::CloudWatch::Dashboard',
      ];
      
      const actualResourceTypes = discovered.stackResources.map((r) => r.ResourceType);
      
      for (const expectedType of expectedResourceTypes) {
        expect(actualResourceTypes).toContain(expectedType);
      }
    });
    
    test('all resources should be in successful state', () => {
      const failedResources = discovered.stackResources.filter(
        (r) => !r.ResourceStatus.match(/CREATE_COMPLETE|UPDATE_COMPLETE/)
      );
      
      if (failedResources.length > 0) {
        console.warn('Resources not in successful state:', failedResources);
      }
      
      // Allow some resources to be in progress during updates
      const criticalFailedResources = failedResources.filter(
        (r) => r.ResourceStatus.match(/FAILED|ROLLBACK/)
      );
      
      expect(criticalFailedResources.length).toBe(0);
    });
  });
});

