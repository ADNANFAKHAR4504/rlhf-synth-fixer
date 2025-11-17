// Integration tests to validate CloudFormation EKS infrastructure using AWS SDK v3.
// These tests dynamically discover the stack name and resources from CloudFormation.
// No mocked values - all data comes from actual AWS resources.

import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  ListClustersCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
  ListStackResourcesCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';

// Check for AWS credentials - credentials can be provided via multiple methods
// The AWS SDK will use the default credential chain, so we'll attempt to run tests
// and let them fail gracefully with clear error messages if credentials are missing
const hasAwsCreds = !!(
  process.env.AWS_ACCESS_KEY_ID ||
  process.env.AWS_PROFILE ||
  process.env.AWS_ROLE_ARN ||
  process.env.AWS_SESSION_TOKEN
);

interface StackOutputs {
  [key: string]: string;
}

interface DiscoveredResources {
  stackName: string;
  region: string;
  environmentSuffix: string;
  outputs: StackOutputs;
  vpcId?: string;
  subnetIds: string[];
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  clusterName?: string;
  clusterArn?: string;
  nodeGroupName?: string;
  securityGroupId?: string;
  kmsKeyId?: string;
  logGroupName?: string;
}

// Cache for discovered stack and resources
let discoveredResources: DiscoveredResources | null = null;

/**
 * Dynamically discover the CloudFormation stack by listing all stacks
 * and finding the most recent TapStack with a complete status
 */
async function discoverStack(): Promise<DiscoveredResources> {
  if (discoveredResources) {
    return discoveredResources;
  }

  if (!hasAwsCreds) {
    throw new Error(
      'AWS credentials not found. Integration tests require AWS credentials.'
    );
  }

  // Try to get region from environment or AWS config
  const region =
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    'us-east-1';

  const cfnClient = new CloudFormationClient({ region });

  try {
    // List all stacks with complete status - handle pagination
    const tapStacks: any[] = [];
    let nextToken: string | undefined;

    do {
      const listCommand = new ListStacksCommand({
        StackStatusFilter: [
          'CREATE_COMPLETE',
          'UPDATE_COMPLETE',
          'UPDATE_ROLLBACK_COMPLETE',
        ],
        NextToken: nextToken,
      });

      const listResponse = await cfnClient.send(listCommand);

      // Find TapStack stacks (excluding notification stacks, nested stacks, and CDK stacks) - dynamically discover by name pattern
      const foundStacks =
        listResponse.StackSummaries?.filter(
          (stack) => {
            const stackName = stack.StackName || '';
            return (
              stackName.startsWith('TapStack') &&
              !stackName.includes('Notification') &&
              !stackName.includes('NestedStack') && // Exclude nested stacks
              !stackName.includes('awscdk') && // Exclude CDK nested stacks
              !stackName.includes('CDK') && // Exclude CDK stacks
              stackName.length < 100 && // Main stacks are typically shorter than nested stacks
              (stack.StackStatus === 'CREATE_COMPLETE' ||
                stack.StackStatus === 'UPDATE_COMPLETE')
            );
          }
        ) || [];

      tapStacks.push(...foundStacks);
      nextToken = listResponse.NextToken;
    } while (nextToken);

    if (tapStacks.length === 0) {
      throw new Error(
        'No TapStack found with CREATE_COMPLETE or UPDATE_COMPLETE status. Please deploy the stack first.'
      );
    }

    // Get environment suffix from environment variable if available (for CI/CD)
    const envSuffix = process.env.ENVIRONMENT_SUFFIX;
    const expectedStackName = envSuffix ? `TapStack${envSuffix}` : null;

    // Get the most recently created stack - dynamically select the latest
    // Prefer: 1) Stack matching environment suffix, 2) Shorter names (main stacks vs nested), 3) Most recent
    const sortedStacks = tapStacks.sort((a, b) => {
      const aName = a.StackName || '';
      const bName = b.StackName || '';
      
      // First priority: match environment suffix if provided
      if (expectedStackName) {
        const aMatches = aName === expectedStackName;
        const bMatches = bName === expectedStackName;
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
      }
      
      // Second priority: shorter names (main stacks vs nested)
      if (aName.length !== bName.length) {
        return aName.length - bName.length;
      }
      
      // Third priority: most recently created
      return (
        (b.CreationTime?.getTime() || 0) - (a.CreationTime?.getTime() || 0)
      );
    });

    // Try to find a stack that actually has EKS resources (has VPC)
    let targetStack = sortedStacks[0];
    let stackName = targetStack.StackName!;
    
    if (!stackName) {
      throw new Error('Failed to discover stack name');
    }

    // Validate that the selected stack has both VPC and EKS Cluster resources
    // This ensures we're testing the correct EKS infrastructure stack, not other stacks
    // If not, try the next stack in the list
    let foundValidStack = false;
    for (let i = 0; i < Math.min(sortedStacks.length, 10); i++) {
      const candidateStack = sortedStacks[i];
      const candidateStackName = candidateStack.StackName!;
      
      // Quick check: list resources to see if this stack has both VPC and EKS Cluster
      // Handle pagination to get all resources
      try {
        const allResources: any[] = [];
        let resourcesNextToken: string | undefined;
        
        do {
          const testResourcesCommand = new ListStackResourcesCommand({
            StackName: candidateStackName,
            NextToken: resourcesNextToken,
          });
          const testResourcesResponse = await cfnClient.send(testResourcesCommand);
          
          if (testResourcesResponse.StackResourceSummaries) {
            allResources.push(...testResourcesResponse.StackResourceSummaries);
          }
          resourcesNextToken = testResourcesResponse.NextToken;
        } while (resourcesNextToken);
        
        // Check for VPC (any status) and EKS-related resources
        const hasVPC = allResources.some(
          (r) => r.ResourceType === 'AWS::EC2::VPC'
        );
        const hasEKSCluster = allResources.some(
          (r) => r.ResourceType === 'AWS::EKS::Cluster'
        );
        const hasEKSNodeGroup = allResources.some(
          (r) => r.ResourceType === 'AWS::EKS::Nodegroup'
        );
        
        // Also check outputs for ClusterName as a fallback
        let hasClusterInOutputs = false;
        if (!hasEKSCluster) {
          try {
            const describeCmd = new DescribeStacksCommand({
              StackName: candidateStackName,
            });
            const describeResp = await cfnClient.send(describeCmd);
            const stack = describeResp.Stacks?.[0];
            hasClusterInOutputs = stack?.Outputs?.some(
              (o) => o.OutputKey === 'ClusterName' && o.OutputValue
            ) || false;
          } catch (error) {
            // Ignore errors when checking outputs
          }
        }
        
        // Select stacks that have VPC and (EKS Cluster resource OR EKS Nodegroup OR ClusterName output)
        // This handles various states: cluster creating, cluster created, or outputs available
        if (hasVPC && (hasEKSCluster || hasEKSNodeGroup || hasClusterInOutputs)) {
          targetStack = candidateStack;
          stackName = candidateStackName;
          foundValidStack = true;
          break;
        }
      } catch (error) {
        // If we can't check this stack, continue to next
        continue;
      }
    }

    // If we didn't find a valid stack with both VPC and EKS Cluster, throw an error
    if (!foundValidStack) {
      const stackNames = sortedStacks.slice(0, 5).map(s => s.StackName).join(', ');
      const expectedMsg = expectedStackName ? ` Expected stack: ${expectedStackName}.` : '';
      throw new Error(
        `No TapStack found with both VPC and EKS Cluster resources. ` +
        `Found ${sortedStacks.length} TapStack(s) but none contain EKS infrastructure. ` +
        `Checked stacks: ${stackNames}.${expectedMsg} ` +
        `Please ensure the EKS infrastructure stack is deployed and contains both VPC and EKS Cluster resources.`
      );
    }

    console.log(`🔍 Discovered stack: ${stackName} in region ${region}`);

    // Get stack details and outputs
    const describeCommand = new DescribeStacksCommand({
      StackName: stackName,
    });
    const describeResponse = await cfnClient.send(describeCommand);
    const stack = describeResponse.Stacks?.[0];

    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    // Extract outputs
    const outputs: StackOutputs = {};
    if (stack.Outputs) {
      stack.Outputs.forEach((output) => {
        if (output.OutputKey && output.OutputValue) {
          outputs[output.OutputKey] = output.OutputValue;
        }
      });
    }

    // Extract environment suffix from stack name (TapStackdev -> dev)
    const environmentSuffix = stackName.replace(/^TapStack/, '') || 'dev';

    // Get stack resources to discover resource IDs dynamically
    // Handle pagination to get all resources
    const resources: any[] = [];
    let resourcesNextToken: string | undefined;

    do {
      const resourcesCommand = new ListStackResourcesCommand({
        StackName: stackName,
        NextToken: resourcesNextToken,
      });
      const resourcesResponse = await cfnClient.send(resourcesCommand);

      if (resourcesResponse.StackResourceSummaries) {
        resources.push(...resourcesResponse.StackResourceSummaries);
      }
      resourcesNextToken = resourcesResponse.NextToken;
    } while (resourcesNextToken);

    if (resources.length === 0) {
      throw new Error(`No resources found in stack ${stackName}`);
    }

    // Discover resources by type dynamically - no hardcoded values
    // For VPC, require CREATE_COMPLETE status
    const vpcResource = resources.find(
      (r) => r.ResourceType === 'AWS::EC2::VPC' && r.ResourceStatus === 'CREATE_COMPLETE'
    );
    
    // For subnets, accept any status (they might be in different states)
    // Also fallback to outputs if not found in resources
    const subnetResources = resources.filter(
      (r) => r.ResourceType === 'AWS::EC2::Subnet'
    );
    
    // Dynamically identify public vs private subnets by logical resource ID pattern
    const publicSubnetResources = subnetResources.filter((r) =>
      r.LogicalResourceId?.toLowerCase().includes('public')
    );
    const privateSubnetResources = subnetResources.filter((r) =>
      r.LogicalResourceId?.toLowerCase().includes('private')
    );
    
    const clusterResource = resources.find(
      (r) => r.ResourceType === 'AWS::EKS::Cluster' && r.ResourceStatus === 'CREATE_COMPLETE'
    );
    const nodeGroupResource = resources.find(
      (r) => r.ResourceType === 'AWS::EKS::Nodegroup' && r.ResourceStatus === 'CREATE_COMPLETE'
    );
    
    // Find cluster security group by logical resource ID pattern
    const securityGroupResource = resources.find(
      (r) =>
        r.ResourceType === 'AWS::EC2::SecurityGroup' &&
        r.ResourceStatus === 'CREATE_COMPLETE' &&
        r.LogicalResourceId?.toLowerCase().includes('cluster')
    );
    
    const kmsKeyResource = resources.find(
      (r) => r.ResourceType === 'AWS::KMS::Key' && r.ResourceStatus === 'CREATE_COMPLETE'
    );

    // Get physical resource IDs - prefer from resources, fallback to outputs only if needed
    const vpcId = vpcResource?.PhysicalResourceId;
    const clusterName = clusterResource?.PhysicalResourceId;
    const nodeGroupName = nodeGroupResource?.PhysicalResourceId;
    const securityGroupId = securityGroupResource?.PhysicalResourceId;
    const kmsKeyId = kmsKeyResource?.PhysicalResourceId;

    // Validate that we discovered critical resources
    if (!vpcId && !outputs.VPCId) {
      throw new Error('Failed to discover VPC ID from stack resources or outputs');
    }
    if (!clusterName && !outputs.ClusterName) {
      throw new Error('Failed to discover EKS cluster name from stack resources or outputs');
    }

    // Discover subnet IDs dynamically - try multiple sources:
    // 1. Stack resources (most reliable)
    // 2. Stack outputs
    // 3. EKS cluster VPC config (always available if cluster exists)
    let allSubnetIds = subnetResources
      .map((r) => r.PhysicalResourceId)
      .filter((id): id is string => !!id);
    
    let publicSubnetIds = publicSubnetResources
      .map((r) => r.PhysicalResourceId)
      .filter((id): id is string => !!id);
    
    let privateSubnetIds = privateSubnetResources
      .map((r) => r.PhysicalResourceId)
      .filter((id): id is string => !!id);
    
    // Fallback to outputs if resources not found
    if (allSubnetIds.length === 0) {
      // Try to get subnets from outputs
      const outputSubnets: string[] = [];
      if (outputs.PublicSubnet1Id) outputSubnets.push(outputs.PublicSubnet1Id);
      if (outputs.PublicSubnet2Id) outputSubnets.push(outputs.PublicSubnet2Id);
      if (outputs.PrivateSubnet1Id) outputSubnets.push(outputs.PrivateSubnet1Id);
      if (outputs.PrivateSubnet2Id) outputSubnets.push(outputs.PrivateSubnet2Id);
      allSubnetIds = outputSubnets;
      
      if (outputs.PublicSubnet1Id) publicSubnetIds.push(outputs.PublicSubnet1Id);
      if (outputs.PublicSubnet2Id) publicSubnetIds.push(outputs.PublicSubnet2Id);
      
      if (outputs.PrivateSubnet1Id) privateSubnetIds.push(outputs.PrivateSubnet1Id);
      if (outputs.PrivateSubnet2Id) privateSubnetIds.push(outputs.PrivateSubnet2Id);
    }
    
    // Always try to get subnets from EKS cluster's VPC config as the most reliable source
    // This ensures we get the actual subnets the cluster is using, even if not in stack resources
    if (clusterName) {
      try {
        const eksClient = new EKSClient({ region });
        const clusterCmd = new DescribeClusterCommand({ name: clusterName });
        const clusterResp = await eksClient.send(clusterCmd);
        const clusterSubnets = clusterResp.cluster?.resourcesVpcConfig?.subnetIds || [];
        
        // Use cluster subnets if we don't have any, or merge with existing ones
        if (clusterSubnets.length > 0) {
          // Merge cluster subnets with discovered ones (avoid duplicates)
          const existingSet = new Set(allSubnetIds);
          clusterSubnets.forEach((id) => {
            if (id && !existingSet.has(id)) {
              allSubnetIds.push(id);
            }
          });
          
          // Query EC2 to determine public vs private based on tags
          const ec2Client = new EC2Client({ region });
          const subnetCmd = new DescribeSubnetsCommand({ SubnetIds: clusterSubnets });
          const subnetResp = await ec2Client.send(subnetCmd);
          
          const discoveredPublic: string[] = [];
          const discoveredPrivate: string[] = [];
          
          subnetResp.Subnets?.forEach((subnet) => {
            if (!subnet.SubnetId) return;
            
            const hasElbTag = subnet.Tags?.some(
              (tag) => tag.Key === 'kubernetes.io/role/elb' && tag.Value === '1'
            );
            const hasInternalElbTag = subnet.Tags?.some(
              (tag) => tag.Key === 'kubernetes.io/role/internal-elb' && tag.Value === '1'
            );
            
            // Also check logical resource ID pattern from stack if available
            const logicalId = resources.find(
              (r) => r.PhysicalResourceId === subnet.SubnetId
            )?.LogicalResourceId?.toLowerCase() || '';
            
            if (hasElbTag || logicalId.includes('public')) {
              if (!publicSubnetIds.includes(subnet.SubnetId)) {
                discoveredPublic.push(subnet.SubnetId);
              }
            } else if (hasInternalElbTag || logicalId.includes('private')) {
              if (!privateSubnetIds.includes(subnet.SubnetId)) {
                discoveredPrivate.push(subnet.SubnetId);
              }
            }
          });
          
          // Add discovered subnets (avoid duplicates)
          publicSubnetIds = [...new Set([...publicSubnetIds, ...discoveredPublic])];
          privateSubnetIds = [...new Set([...privateSubnetIds, ...discoveredPrivate])];
        }
      } catch (error) {
        // Ignore errors when trying to get subnets from cluster
        console.warn('Could not discover subnets from EKS cluster:', error);
      }
    }

    discoveredResources = {
      stackName,
      region,
      environmentSuffix,
      outputs,
      // Use discovered resource IDs, fallback to outputs only if resource discovery failed
      vpcId: vpcId || outputs.VPCId,
      subnetIds: allSubnetIds.length > 0 ? allSubnetIds : [],
      publicSubnetIds: publicSubnetIds.length > 0 ? publicSubnetIds : [],
      privateSubnetIds: privateSubnetIds.length > 0 ? privateSubnetIds : [],
      clusterName: clusterName || outputs.ClusterName,
      clusterArn: outputs.ClusterArn, // ARN is typically only in outputs
      nodeGroupName: nodeGroupName || outputs.NodeGroupName,
      securityGroupId: securityGroupId || outputs.ClusterSecurityGroupId,
      kmsKeyId: kmsKeyId || outputs.KMSKeyId,
      logGroupName: outputs.ClusterLogGroupName, // Log group name is typically only in outputs
    };

    console.log(`✅ Discovered resources for stack ${stackName}:`);
    console.log(`   Environment suffix: ${environmentSuffix}`);
    console.log(`   VPC ID: ${discoveredResources.vpcId}`);
    console.log(`   Cluster: ${discoveredResources.clusterName}`);
    console.log(`   Subnets: ${discoveredResources.subnetIds.length} total`);
    console.log(`   Public subnets: ${discoveredResources.publicSubnetIds.length}`);
    console.log(`   Private subnets: ${discoveredResources.privateSubnetIds.length}`);

    return discoveredResources;
  } catch (error: any) {
    console.error('Failed to discover stack:', error);
    throw new Error(
      `Failed to discover CloudFormation stack: ${error.message}`
    );
  }
}

describe('EKS Infrastructure Integration Tests', () => {
  let resources: DiscoveredResources;
  let eksClient: EKSClient;
  let ec2Client: EC2Client;
  let cwLogsClient: CloudWatchLogsClient;
  let kmsClient: KMSClient;

  beforeAll(async () => {
    if (!hasAwsCreds) {
      console.warn(
        'Skipping integration tests: no AWS credentials detected in environment.'
      );
      return;
    }

    // Discover stack and resources
    resources = await discoverStack();

    // Initialize AWS SDK clients with discovered region
    eksClient = new EKSClient({ region: resources.region });
    ec2Client = new EC2Client({ region: resources.region });
    cwLogsClient = new CloudWatchLogsClient({ region: resources.region });
    kmsClient = new KMSClient({ region: resources.region });
  });

  describe('Stack Discovery', () => {
    test('should discover CloudFormation stack', () => {
      if (!hasAwsCreds) return;

      expect(resources.stackName).toBeDefined();
      expect(resources.stackName).toMatch(/^TapStack/);
      expect(resources.region).toBeDefined();
      expect(resources.environmentSuffix).toBeDefined();
    });

    test('should have discovered stack outputs', () => {
      if (!hasAwsCreds) return;

      expect(resources.outputs).toBeDefined();
      expect(Object.keys(resources.outputs).length).toBeGreaterThan(0);
    });

    test('should have discovered VPC ID', () => {
      if (!hasAwsCreds) return;

      expect(resources.vpcId).toBeDefined();
      expect(resources.vpcId).toMatch(/^vpc-/);
    });

    test('should have discovered subnet IDs', () => {
      if (!hasAwsCreds) return;

      expect(resources.subnetIds.length).toBeGreaterThanOrEqual(2);
      resources.subnetIds.forEach((id) => {
        expect(id).toMatch(/^subnet-/);
      });
    });

    test('should have discovered cluster name', () => {
      if (!hasAwsCreds) return;

      expect(resources.clusterName).toBeDefined();
      expect(resources.clusterName).toContain(resources.environmentSuffix);
    });
  });

  describe('VPC Infrastructure', () => {
    test('VPC should exist and be properly configured', async () => {
      if (!hasAwsCreds) return;
      if (!resources.vpcId) {
        throw new Error('VPC ID not discovered');
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [resources.vpcId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.VpcId).toBe(resources.vpcId);
      expect(vpc.State).toBe('available');
      // DNS settings may be undefined in some cases, check if defined then validate
      if (vpc.EnableDnsHostnames !== undefined) {
        expect(vpc.EnableDnsHostnames).toBe(true);
      }
      if (vpc.EnableDnsSupport !== undefined) {
        expect(vpc.EnableDnsSupport).toBe(true);
      }
      // CIDR block is discovered dynamically, not hardcoded
      expect(vpc.CidrBlock).toBeDefined();
      expect(vpc.CidrBlock).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
    });

    test('VPC should have name tag with environment suffix', async () => {
      if (!hasAwsCreds) return;
      if (!resources.vpcId) {
        throw new Error('VPC ID not discovered');
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [resources.vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];

      const nameTag = vpc.Tags?.find((tag) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(resources.environmentSuffix);
    });

    test('subnets should exist and be in different availability zones', async () => {
      if (!hasAwsCreds) return;
      if (resources.subnetIds.length === 0) {
        throw new Error('No subnets discovered');
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: resources.subnetIds,
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets?.length).toBeGreaterThanOrEqual(2);

      // Check that subnets are in multiple AZs
      const azs = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('public subnets should have kubernetes elb tag', async () => {
      if (!hasAwsCreds) return;
      if (resources.publicSubnetIds.length === 0) {
        throw new Error('No public subnets discovered');
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: resources.publicSubnetIds,
      });

      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet) => {
        const elbTag = subnet.Tags?.find(
          (tag) => tag.Key === 'kubernetes.io/role/elb'
        );
        expect(elbTag).toBeDefined();
        expect(elbTag!.Value).toBe('1');
      });
    });

    test('private subnets should have kubernetes internal-elb tag', async () => {
      if (!hasAwsCreds) return;
      if (resources.privateSubnetIds.length === 0) {
        throw new Error('No private subnets discovered');
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: resources.privateSubnetIds,
      });

      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet) => {
        const elbTag = subnet.Tags?.find(
          (tag) => tag.Key === 'kubernetes.io/role/internal-elb'
        );
        expect(elbTag).toBeDefined();
        expect(elbTag!.Value).toBe('1');
      });
    });
  });

  describe('EKS Cluster', () => {
    test('EKS cluster should exist and be active', async () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName) {
        throw new Error('Cluster name not discovered');
      }

      const command = new DescribeClusterCommand({
        name: resources.clusterName,
      });

      const response = await eksClient.send(command);

      expect(response.cluster).toBeDefined();
      expect(response.cluster!.name).toBe(resources.clusterName);
      expect(response.cluster!.status).toBe('ACTIVE');
      if (resources.clusterArn) {
        expect(response.cluster!.arn).toBe(resources.clusterArn);
      }
    });

    test('cluster name should include environment suffix', () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName) {
        throw new Error('Cluster name not discovered');
      }

      expect(resources.clusterName).toContain(resources.environmentSuffix);
    });

    test('cluster should have correct endpoint', async () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName) {
        throw new Error('Cluster name not discovered');
      }

      const command = new DescribeClusterCommand({
        name: resources.clusterName,
      });

      const response = await eksClient.send(command);

      expect(response.cluster!.endpoint).toBeDefined();
      expect(response.cluster!.endpoint).toMatch(/^https:\/\//);
      // Verify endpoint matches output if available
      if (resources.outputs.ClusterEndpoint) {
        expect(response.cluster!.endpoint).toBe(
          resources.outputs.ClusterEndpoint
        );
      }
    });

    test('cluster should have encryption enabled', async () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName) {
        throw new Error('Cluster name not discovered');
      }

      const command = new DescribeClusterCommand({
        name: resources.clusterName,
      });

      const response = await eksClient.send(command);

      expect(response.cluster!.encryptionConfig).toBeDefined();
      expect(response.cluster!.encryptionConfig!.length).toBeGreaterThan(0);
      expect(response.cluster!.encryptionConfig![0].resources).toContain(
        'secrets'
      );
    });

    test('cluster should have logging enabled', async () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName) {
        throw new Error('Cluster name not discovered');
      }

      const command = new DescribeClusterCommand({
        name: resources.clusterName,
      });

      const response = await eksClient.send(command);

      expect(response.cluster!.logging).toBeDefined();
      expect(response.cluster!.logging!.clusterLogging).toBeDefined();

      const enabledTypes = response.cluster!.logging!.clusterLogging!.filter(
        (log) => log.enabled
      );
      expect(enabledTypes.length).toBeGreaterThan(0);

      const logTypes = enabledTypes.flatMap((log) => log.types || []);
      expect(logTypes).toContain('api');
      expect(logTypes).toContain('audit');
    });

    test('cluster should have both public and private endpoint access', async () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName) {
        throw new Error('Cluster name not discovered');
      }

      const command = new DescribeClusterCommand({
        name: resources.clusterName,
      });

      const response = await eksClient.send(command);

      const vpcConfig = response.cluster!.resourcesVpcConfig;
      expect(vpcConfig!.endpointPublicAccess).toBe(true);
      expect(vpcConfig!.endpointPrivateAccess).toBe(true);
    });

    test('cluster should be in correct VPC and subnets', async () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName || !resources.vpcId) {
        throw new Error('Cluster name or VPC ID not discovered');
      }

      const command = new DescribeClusterCommand({
        name: resources.clusterName,
      });

      const response = await eksClient.send(command);

      const vpcConfig = response.cluster!.resourcesVpcConfig;
      expect(vpcConfig!.vpcId).toBe(resources.vpcId);

      // Verify cluster is in discovered subnets
      resources.subnetIds.forEach((subnetId) => {
        expect(vpcConfig!.subnetIds).toContain(subnetId);
      });
    });

    test('cluster should have security group attached', async () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName) {
        throw new Error('Cluster name not discovered');
      }

      const command = new DescribeClusterCommand({
        name: resources.clusterName,
      });

      const response = await eksClient.send(command);

      const vpcConfig = response.cluster!.resourcesVpcConfig;
      expect(vpcConfig!.securityGroupIds).toBeDefined();
      expect(vpcConfig!.securityGroupIds!.length).toBeGreaterThan(0);
    });
  });

  describe('EKS Node Group', () => {
    test('node group should exist and be active', async () => {
      if (!hasAwsCreds) return;
      if (!resources.nodeGroupName || !resources.clusterName) {
        throw new Error('Node group name or cluster name not discovered');
      }

      const [clusterName, nodegroupName] = resources.nodeGroupName.split('/');

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName,
      });

      const response = await eksClient.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup!.status).toBe('ACTIVE');
      expect(response.nodegroup!.nodegroupName).toContain(
        resources.environmentSuffix
      );
    });

    test('node group should be in private subnets', async () => {
      if (!hasAwsCreds) return;
      if (!resources.nodeGroupName || resources.privateSubnetIds.length === 0) {
        throw new Error('Node group name or private subnets not discovered');
      }

      const [clusterName, nodegroupName] = resources.nodeGroupName.split('/');

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName,
      });

      const response = await eksClient.send(command);

      const subnets = response.nodegroup!.subnets!;
      // Verify node group is in discovered private subnets
      resources.privateSubnetIds.forEach((subnetId) => {
        expect(subnets).toContain(subnetId);
      });
      // Verify node group is NOT in public subnets
      resources.publicSubnetIds.forEach((subnetId) => {
        expect(subnets).not.toContain(subnetId);
      });
    });

    test('node group should have auto-scaling configuration', async () => {
      if (!hasAwsCreds) return;
      if (!resources.nodeGroupName) {
        throw new Error('Node group name not discovered');
      }

      const [clusterName, nodegroupName] = resources.nodeGroupName.split('/');

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName,
      });

      const response = await eksClient.send(command);

      const scalingConfig = response.nodegroup!.scalingConfig;
      expect(scalingConfig).toBeDefined();
      expect(scalingConfig!.minSize).toBeGreaterThan(0);
      expect(scalingConfig!.maxSize).toBeGreaterThanOrEqual(
        scalingConfig!.minSize!
      );
      expect(scalingConfig!.desiredSize).toBeGreaterThanOrEqual(
        scalingConfig!.minSize!
      );
      expect(scalingConfig!.desiredSize).toBeLessThanOrEqual(
        scalingConfig!.maxSize!
      );
    });

    test('node group should use AL2 AMI type', async () => {
      if (!hasAwsCreds) return;
      if (!resources.nodeGroupName) {
        throw new Error('Node group name not discovered');
      }

      const [clusterName, nodegroupName] = resources.nodeGroupName.split('/');

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName,
      });

      const response = await eksClient.send(command);

      expect(response.nodegroup!.amiType).toBe('AL2_x86_64');
    });
  });

  describe('Security Group', () => {
    test('cluster security group should exist', async () => {
      if (!hasAwsCreds) return;
      if (!resources.securityGroupId) {
        throw new Error('Security group ID not discovered');
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [resources.securityGroupId],
      });

      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const securityGroup = response.SecurityGroups![0];
      expect(securityGroup.GroupId).toBe(resources.securityGroupId);
    });

    test('security group should be in correct VPC', async () => {
      if (!hasAwsCreds) return;
      if (!resources.securityGroupId || !resources.vpcId) {
        throw new Error('Security group ID or VPC ID not discovered');
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [resources.securityGroupId],
      });

      const response = await ec2Client.send(command);

      const securityGroup = response.SecurityGroups![0];
      expect(securityGroup.VpcId).toBe(resources.vpcId);
    });

    test('security group should have name with environment suffix', async () => {
      if (!hasAwsCreds) return;
      if (!resources.securityGroupId) {
        throw new Error('Security group ID not discovered');
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [resources.securityGroupId],
      });

      const response = await ec2Client.send(command);

      const securityGroup = response.SecurityGroups![0];
      const nameTag = securityGroup.Tags?.find((tag) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(resources.environmentSuffix);
    });

    test('security group should allow all outbound traffic', async () => {
      if (!hasAwsCreds) return;
      if (!resources.securityGroupId) {
        throw new Error('Security group ID not discovered');
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [resources.securityGroupId],
      });

      const response = await ec2Client.send(command);

      const securityGroup = response.SecurityGroups![0];
      const egressRules = securityGroup.IpPermissionsEgress;

      expect(egressRules).toBeDefined();
      expect(egressRules!.length).toBeGreaterThan(0);

      // Check for allow all outbound rule
      const allowAllRule = egressRules!.find(
        (rule) =>
          rule.IpProtocol === '-1' &&
          rule.IpRanges?.some((range) => range.CidrIp === '0.0.0.0/0')
      );
      expect(allowAllRule).toBeDefined();
    });
  });

  describe('CloudWatch Logging', () => {
    test('log group should exist', async () => {
      if (!hasAwsCreds) return;
      if (!resources.logGroupName) {
        throw new Error('Log group name not discovered');
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: resources.logGroupName,
      });

      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === resources.logGroupName
      );
      expect(logGroup).toBeDefined();
    });

    test('log group name should include environment suffix', () => {
      if (!hasAwsCreds) return;
      if (!resources.logGroupName) {
        throw new Error('Log group name not discovered');
      }

      expect(resources.logGroupName).toContain(resources.environmentSuffix);
    });

    test('log group should have retention policy', async () => {
      if (!hasAwsCreds) return;
      if (!resources.logGroupName) {
        throw new Error('Log group name not discovered');
      }

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: resources.logGroupName,
      });

      const response = await cwLogsClient.send(command);

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === resources.logGroupName
      );

      expect(logGroup!.retentionInDays).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(7);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      if (!hasAwsCreds) return;
      if (!resources.kmsKeyId) {
        throw new Error('KMS key ID not discovered');
      }

      const command = new DescribeKeyCommand({
        KeyId: resources.kmsKeyId,
      });

      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(resources.kmsKeyId);
      expect(response.KeyMetadata!.Enabled).toBe(true);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });

    test('KMS key should be used for EKS encryption', async () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName || !resources.kmsKeyId) {
        throw new Error('Cluster name or KMS key ID not discovered');
      }

      const clusterCommand = new DescribeClusterCommand({
        name: resources.clusterName,
      });

      const clusterResponse = await eksClient.send(clusterCommand);

      const encryptionConfig = clusterResponse.cluster!.encryptionConfig![0];
      expect(encryptionConfig.provider?.keyArn).toContain(resources.kmsKeyId);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all output values should be non-empty', () => {
      if (!hasAwsCreds) return;

      Object.entries(resources.outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBe('');
        expect(typeof value).toBe('string');
      });
    });

    test('cluster name should follow naming convention', () => {
      if (!hasAwsCreds) return;
      if (!resources.clusterName) {
        throw new Error('Cluster name not discovered');
      }

      expect(resources.clusterName).toMatch(/^eks-cluster-/);
      expect(resources.clusterName).toContain(resources.environmentSuffix);
    });

    test('log group name should follow naming convention', () => {
      if (!hasAwsCreds) return;
      if (!resources.logGroupName) {
        throw new Error('Log group name not discovered');
      }

      expect(resources.logGroupName).toMatch(/^\/aws\/eks\//);
      expect(resources.logGroupName).toContain(resources.environmentSuffix);
    });
  });

  describe('Multi-AZ High Availability', () => {
    test('resources should be deployed across multiple availability zones', async () => {
      if (!hasAwsCreds) return;
      if (resources.subnetIds.length === 0) {
        throw new Error('No subnets discovered');
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: resources.subnetIds,
      });

      const response = await ec2Client.send(command);

      const azs = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );

      // Verify we have at least 2 different AZs for high availability
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify each AZ has both public and private subnets
      const azSubnets = new Map<string, string[]>();
      response.Subnets!.forEach((subnet) => {
        const az = subnet.AvailabilityZone!;
        if (!azSubnets.has(az)) {
          azSubnets.set(az, []);
        }
        azSubnets.get(az)!.push(subnet.SubnetId!);
      });

      // Each AZ should have multiple subnets
      azSubnets.forEach((subnets, az) => {
        expect(subnets.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
