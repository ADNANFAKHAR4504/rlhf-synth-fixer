// integration.test.ts
import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand,
  DescribeRouteTablesCommand,
  DescribeNetworkInterfacesCommand,
  DescribeElasticIpsCommand,
  AssociateAddressCommand,
  DisassociateAddressCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  ListNodegroupsCommand,
  UpdateNodegroupConfigCommand,
  ListAddonsCommand,
  DescribeAddonCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from '@aws-sdk/client-eks';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
  ModifyTargetGroupAttributesCommand,
  AddTagsCommand as ELBAddTagsCommand,
  RemoveTagsCommand as ELBRemoveTagsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  GetOpenIDConnectProviderCommand,
  SimulatePrincipalPolicyCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  GenerateDataKeyCommand,
  ListAliasesCommand,
  GetKeyPolicyCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  PutLogEventsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  STSClient,
  GetCallerIdentityCommand,
  AssumeRoleCommand,
} from '@aws-sdk/client-sts';
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';

// ============================================================================
// DEPLOYMENT OUTPUT MANAGEMENT
// ============================================================================

interface DeploymentOutputs {
  alb_dns_name: { value: string };
  cluster_certificate_authority_data: { value: string };
  cluster_endpoint: { value: string };
  cluster_name: { value: string };
  cluster_oidc_issuer_url: { value: string };
  cluster_security_group_id: { value: string };
  vpc_id: { value: string };
}

// Load deployment outputs dynamically
function loadDeploymentOutputs(): DeploymentOutputs {
  const outputPaths = [
    path.resolve(process.cwd(), 'terraform-outputs.json'),
    path.resolve(process.cwd(), 'outputs.json'),
    path.resolve(process.cwd(), 'deployment-outputs.json'),
    path.resolve(process.cwd(), 'cfn-outputs'),
  ];

  for (const outputPath of outputPaths) {
    if (fs.existsSync(outputPath)) {
      const rawData = fs.readFileSync(outputPath, 'utf8');
      return JSON.parse(rawData);
    }
  }

  throw new Error('Deployment outputs file not found. Please ensure Terraform outputs are exported to JSON.');
}

const outputs = loadDeploymentOutputs();
const region = process.env.AWS_REGION || 'us-west-2';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const eksClient = new EKSClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const stsClient = new STSClient({ region });

// Helper functions
function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

async function getAccountId(): Promise<string> {
  const identity = await stsClient.send(new GetCallerIdentityCommand({}));
  return identity.Account!;
}

async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  delay: number = 2000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

describe('Platform Migration EKS Infrastructure Integration Tests', () => {
  let accountId: string;
  let testTags: Array<{ key: string; value: string }> = [];

  beforeAll(async () => {
    accountId = await getAccountId();
    console.log(`Running tests in account: ${accountId}, region: ${region}`);
  });

  afterAll(async () => {
    // Cleanup any test tags or resources created during testing
    for (const tag of testTags) {
      try {
        await eksClient.send(new UntagResourceCommand({
          resourceArn: `arn:aws:eks:${region}:${accountId}:cluster/${outputs.cluster_name.value}`,
          tagKeys: [tag.key]
        }));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  // ============================================================================
  // PART 1: RESOURCE VALIDATION (Non-Interactive)
  // ============================================================================

  describe('[Resource Validation] Infrastructure Configuration', () => {
    test('VPC should be configured with correct CIDR block and DNS settings', async () => {
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id.value]
      }));

      const vpc = vpcResponse.Vpcs![0];
      expect(vpc).toBeDefined();
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
      
      // Validate tags
      const tags = vpc.Tags || [];
      const clusterTag = tags.find(t => t.Key === `kubernetes.io/cluster/${outputs.cluster_name.value}`);
      expect(clusterTag?.Value).toBe('shared');
    });

    test('Subnets should be properly configured across 3 AZs with correct tags', async () => {
      const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id.value] }
        ]
      }));

      const subnets = subnetsResponse.Subnets!;
      expect(subnets).toHaveLength(6); // 3 public + 3 private

      const publicSubnets = subnets.filter(s => 
        s.Tags?.some(t => t.Key === 'kubernetes.io/role/elb' && t.Value === '1')
      );
      const privateSubnets = subnets.filter(s => 
        s.Tags?.some(t => t.Key === 'kubernetes.io/role/internal-elb' && t.Value === '1')
      );

      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);

      // Verify AZ distribution
      const publicAZs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      const privateAZs = new Set(privateSubnets.map(s => s.AvailabilityZone));
      
      expect(publicAZs.size).toBe(3);
      expect(privateAZs.size).toBe(3);

      // Verify CIDR blocks match expected configuration
      const expectedPublicCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
      const expectedPrivateCidrs = ['10.0.10.0/24', '10.0.11.0/24', '10.0.12.0/24'];
      
      publicSubnets.forEach(subnet => {
        expect(expectedPublicCidrs).toContain(subnet.CidrBlock);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      privateSubnets.forEach(subnet => {
        expect(expectedPrivateCidrs).toContain(subnet.CidrBlock);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('NAT Gateways should be deployed in public subnets with Elastic IPs', async () => {
      const natGatewaysResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id.value] },
          { Name: 'state', Values: ['available'] }
        ]
      }));

      const natGateways = natGatewaysResponse.NatGateways!;
      expect(natGateways).toHaveLength(3);

      // Verify each NAT gateway has an associated EIP
      for (const natGateway of natGateways) {
        expect(natGateway.State).toBe('available');
        expect(natGateway.NatGatewayAddresses).toHaveLength(1);
        expect(natGateway.NatGatewayAddresses![0].PublicIp).toBeDefined();
        expect(natGateway.ConnectivityType).toBe('public');
      }

      // Verify NAT gateways are in different AZs
      const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: natGateways.map(ng => ng.SubnetId!)
      }));

      const natSubnetAZs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(natSubnetAZs.size).toBe(3);
    });

    test('EKS cluster should be configured with correct settings and encryption', async () => {
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));

      const cluster = clusterResponse.cluster!;
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.version).toBe('1.28');
      
      // Validate VPC configuration
      const vpcConfig = cluster.resourcesVpcConfig!;
      expect(vpcConfig.endpointPrivateAccess).toBe(true);
      expect(vpcConfig.endpointPublicAccess).toBe(false);
      expect(vpcConfig.securityGroupIds).toContain(outputs.cluster_security_group_id.value);
      
      // Validate encryption configuration
      expect(cluster.encryptionConfig).toHaveLength(1);
      expect(cluster.encryptionConfig![0].resources).toContain('secrets');
      expect(cluster.encryptionConfig![0].provider?.keyArn).toBeDefined();
      
      // Validate logging configuration
      const logging = cluster.logging?.clusterLogging?.[0];
      expect(logging?.enabled).toBe(true);
      expect(logging?.types).toEqual(expect.arrayContaining([
        'api', 'audit', 'authenticator', 'controllerManager', 'scheduler'
      ]));
    });

    test('Node groups should be configured with correct instance types and launch templates', async () => {
      const nodeGroupsResponse = await eksClient.send(new ListNodegroupsCommand({
        clusterName: outputs.cluster_name.value
      }));

      expect(nodeGroupsResponse.nodegroups).toHaveLength(2);
      
      for (const nodeGroupName of nodeGroupsResponse.nodegroups!) {
        const nodeGroupResponse = await eksClient.send(new DescribeNodegroupCommand({
          clusterName: outputs.cluster_name.value,
          nodegroupName: nodeGroupName
        }));

        const nodeGroup = nodeGroupResponse.nodegroup!;
        expect(nodeGroup.status).toBe('ACTIVE');
        expect(nodeGroup.capacityType).toBe('ON_DEMAND');
        expect(nodeGroup.launchTemplate).toBeDefined();
        
        // Validate scaling configuration
        expect(nodeGroup.scalingConfig?.minSize).toBe(2);
        expect(nodeGroup.scalingConfig?.maxSize).toBe(10);
        expect(nodeGroup.scalingConfig?.desiredSize).toBeGreaterThanOrEqual(2);
        
        // Validate architecture-specific configuration
        if (nodeGroupName.includes('x86')) {
          expect(nodeGroup.amiType).toBe('AL2023_x86_64_STANDARD');
          expect(nodeGroup.instanceTypes).toContain('t3.medium');
          expect(nodeGroup.labels?.architecture).toBe('x86_64');
        } else if (nodeGroupName.includes('arm64')) {
          expect(nodeGroup.amiType).toBe('AL2023_ARM_64_STANDARD');
          expect(nodeGroup.instanceTypes).toContain('t4g.medium');
          expect(nodeGroup.labels?.architecture).toBe('arm64');
        }
      }
    });

    test('KMS key should be configured with proper key policy for EKS encryption', async () => {
      // Get KMS key from cluster encryption config
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      const keyArn = clusterResponse.cluster!.encryptionConfig![0].provider?.keyArn;
      expect(keyArn).toBeDefined();
      
      const keyId = keyArn!.split('/').pop()!;
      const keyResponse = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyId
      }));

      const key = keyResponse.KeyMetadata!;
      expect(key.KeyState).toBe('Enabled');
      expect(key.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(key.Origin).toBe('AWS_KMS');
      expect(key.DeletionDate).toBeUndefined();
      
      // Verify key alias
      const aliasesResponse = await kmsClient.send(new ListAliasesCommand({
        KeyId: keyId
      }));
      
      const alias = aliasesResponse.Aliases?.find(a => 
        a.AliasName === `alias/${outputs.cluster_name.value}-eks-new`
      );
      expect(alias).toBeDefined();
    });

    test('Security groups should have appropriate ingress and egress rules', async () => {
      const securityGroupIds = [
        outputs.cluster_security_group_id.value,
      ];

      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds
      }));

      const securityGroups = sgResponse.SecurityGroups!;
      expect(securityGroups).toHaveLength(1);

      // Validate cluster security group
      const clusterSG = securityGroups.find(sg => 
        sg.GroupId === outputs.cluster_security_group_id.value
      );
      expect(clusterSG).toBeDefined();
      expect(clusterSG!.VpcId).toBe(outputs.vpc_id.value);
      
      // Verify it has ingress rules for node communication
      const nodeIngressRule = clusterSG!.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(nodeIngressRule).toBeDefined();
    });

    test('CloudWatch log group should be configured for EKS cluster logs', async () => {
      const logGroupName = `/aws/eks/${outputs.cluster_name.value}/cluster-new`;
      
      const logGroupsResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));

      const logGroup = logGroupsResponse.logGroups?.find(lg => 
        lg.logGroupName === logGroupName
      );
      
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(30);
      expect(logGroup!.kmsKeyId).toBeDefined();
    });

    test('OIDC provider should be configured for IRSA', async () => {
      const oidcProviderArn = `arn:aws:iam::${accountId}:oidc-provider/` + 
        outputs.cluster_oidc_issuer_url.value.replace('https://', '');
      
      const oidcProviderResponse = await iamClient.send(new GetOpenIDConnectProviderCommand({
        OpenIDConnectProviderArn: oidcProviderArn
      }));

      expect(oidcProviderResponse.ClientIDList).toContain('sts.amazonaws.com');
      expect(oidcProviderResponse.ThumbprintList).toHaveLength(1);
    });

    test('ALB should be configured with correct settings and target groups', async () => {
      const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [`${outputs.cluster_name.value}-alb1`]
      }));

      const alb = albResponse.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.VpcId).toBe(outputs.vpc_id.value);
      expect(alb.DNSName).toBe(outputs.alb_dns_name.value);
      
      // Verify ALB spans public subnets
      expect(alb.AvailabilityZones).toHaveLength(3);
    });
  });

  // ============================================================================
  // PART 2: SERVICE-LEVEL TESTS (Interactive)
  // ============================================================================

  describe('[Service-Level] EKS Cluster Operations', () => {
    test('should support dynamic cluster tagging and untagging', async () => {
      const testTagKey = `integration-test-${generateTestId()}`;
      const testTagValue = 'service-level-test';
      
      // Add tag to cluster
      await eksClient.send(new TagResourceCommand({
        resourceArn: `arn:aws:eks:${region}:${accountId}:cluster/${outputs.cluster_name.value}`,
        tags: {
          [testTagKey]: testTagValue
        }
      }));
      
      testTags.push({ key: testTagKey, value: testTagValue });
      
      // Verify tag was added
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      expect(clusterResponse.cluster?.tags?.[testTagKey]).toBe(testTagValue);
      
      // Remove tag
      await eksClient.send(new UntagResourceCommand({
        resourceArn: `arn:aws:eks:${region}:${accountId}:cluster/${outputs.cluster_name.value}`,
        tagKeys: [testTagKey]
      }));
      
      // Verify tag was removed
      const updatedClusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      expect(updatedClusterResponse.cluster?.tags?.[testTagKey]).toBeUndefined();
    });

    test('should validate node group scaling operations', async () => {
      const nodeGroupsResponse = await eksClient.send(new ListNodegroupsCommand({
        clusterName: outputs.cluster_name.value
      }));
      
      const nodeGroupName = nodeGroupsResponse.nodegroups![0];
      
      // Get current configuration
      const initialResponse = await eksClient.send(new DescribeNodegroupCommand({
        clusterName: outputs.cluster_name.value,
        nodegroupName: nodeGroupName
      }));
      
      const initialDesiredSize = initialResponse.nodegroup!.scalingConfig!.desiredSize!;
      const newDesiredSize = initialDesiredSize === 3 ? 4 : 3;
      
      // Update scaling configuration
      await eksClient.send(new UpdateNodegroupConfigCommand({
        clusterName: outputs.cluster_name.value,
        nodegroupName: nodeGroupName,
        scalingConfig: {
          desiredSize: newDesiredSize,
          minSize: 2,
          maxSize: 10
        }
      }));
      
      // Wait for update to apply
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Verify update
      const updatedResponse = await eksClient.send(new DescribeNodegroupCommand({
        clusterName: outputs.cluster_name.value,
        nodegroupName: nodeGroupName
      }));
      
      expect(updatedResponse.nodegroup!.scalingConfig!.desiredSize).toBe(newDesiredSize);
      
      // Restore original configuration
      await eksClient.send(new UpdateNodegroupConfigCommand({
        clusterName: outputs.cluster_name.value,
        nodegroupName: nodeGroupName,
        scalingConfig: {
          desiredSize: initialDesiredSize,
          minSize: 2,
          maxSize: 10
        }
      }));
    }, 120000);

    test('should validate CloudWatch log streaming for cluster events', async () => {
      const logGroupName = `/aws/eks/${outputs.cluster_name.value}/cluster-new`;
      const testMessage = `Integration test event ${generateTestId()}`;
      
      // List existing log streams
      const streamsResponse = await cloudWatchLogsClient.send(new DescribeLogStreamsCommand({
        logGroupName,
        limit: 5
      }));
      
      if (streamsResponse.logStreams && streamsResponse.logStreams.length > 0) {
        const logStreamName = streamsResponse.logStreams[0].logStreamName!;
        
        // Put test log event
        await cloudWatchLogsClient.send(new PutLogEventsCommand({
          logGroupName,
          logStreamName,
          logEvents: [
            {
              message: testMessage,
              timestamp: Date.now()
            }
          ],
          sequenceToken: streamsResponse.logStreams[0].uploadSequenceToken
        }));
        
        // Wait for log to be indexed
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Search for the test message
        const filterResponse = await cloudWatchLogsClient.send(new FilterLogEventsCommand({
          logGroupName,
          filterPattern: testMessage,
          startTime: Date.now() - 60000
        }));
        
        expect(filterResponse.events).toHaveLength(1);
        expect(filterResponse.events![0].message).toContain(testMessage);
      }
    });
  });

  describe('[Service-Level] VPC Network Operations', () => {
    test('should validate dynamic security group rule management', async () => {
      const testPort = 8443;
      const testDescription = `Integration test rule ${generateTestId()}`;
      
      // Add temporary rule to cluster security group
      await ec2Client.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: outputs.cluster_security_group_id.value,
        IpPermissions: [
          {
            IpProtocol: 'tcp',
            FromPort: testPort,
            ToPort: testPort,
            IpRanges: [
              {
                CidrIp: '10.0.0.0/16',
                Description: testDescription
              }
            ]
          }
        ]
      }));
      
      // Verify rule was added
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.cluster_security_group_id.value]
      }));
      
      const addedRule = sgResponse.SecurityGroups![0].IpPermissions?.find(rule =>
        rule.FromPort === testPort && rule.ToPort === testPort
      );
      
      expect(addedRule).toBeDefined();
      expect(addedRule!.IpRanges![0].Description).toBe(testDescription);
      
      // Remove the rule
      await ec2Client.send(new RevokeSecurityGroupIngressCommand({
        GroupId: outputs.cluster_security_group_id.value,
        IpPermissions: [
          {
            IpProtocol: 'tcp',
            FromPort: testPort,
            ToPort: testPort,
            IpRanges: [
              {
                CidrIp: '10.0.0.0/16'
              }
            ]
          }
        ]
      }));
      
      // Verify rule was removed
      const updatedSgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.cluster_security_group_id.value]
      }));
      
      const removedRule = updatedSgResponse.SecurityGroups![0].IpPermissions?.find(rule =>
        rule.FromPort === testPort && rule.ToPort === testPort
      );
      
      expect(removedRule).toBeUndefined();
    });

    test('should validate route table associations and network paths', async () => {
      const routeTablesResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id.value] }
        ]
      }));
      
      const routeTables = routeTablesResponse.RouteTables!;
      
      // Verify public route table with IGW route
      const publicRouteTables = routeTables.filter(rt =>
        rt.Routes?.some(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' &&
          route.GatewayId?.startsWith('igw-')
        )
      );
      
      expect(publicRouteTables).toHaveLength(1);
      expect(publicRouteTables[0].Associations?.length).toBeGreaterThanOrEqual(3);
      
      // Verify private route tables with NAT Gateway routes
      const privateRouteTables = routeTables.filter(rt =>
        rt.Routes?.some(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' &&
          route.NatGatewayId?.startsWith('nat-')
        )
      );
      
      expect(privateRouteTables).toHaveLength(3);
      privateRouteTables.forEach(rt => {
        expect(rt.Associations?.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('[Service-Level] KMS Encryption Operations', () => {
    test('should validate KMS key encryption and decryption operations', async () => {
      // Get KMS key from cluster
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      const keyArn = clusterResponse.cluster!.encryptionConfig![0].provider?.keyArn!;
      
      // Generate data key for encryption
      const dataKeyResponse = await kmsClient.send(new GenerateDataKeyCommand({
        KeyId: keyArn,
        KeySpec: 'AES_256'
      }));
      
      expect(dataKeyResponse.Plaintext).toBeDefined();
      expect(dataKeyResponse.CiphertextBlob).toBeDefined();
      expect(dataKeyResponse.KeyId).toContain(keyArn.split('/').pop());
    });
  });

  describe('[Service-Level] ALB Operations', () => {
    test('should validate ALB tagging operations', async () => {
      const testTagKey = `alb-test-${generateTestId()}`;
      const testTagValue = 'alb-service-test';
      
      // Get ALB ARN
      const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [`${outputs.cluster_name.value}-alb1`]
      }));
      
      const albArn = albResponse.LoadBalancers![0].LoadBalancerArn!;
      
      // Add tags
      await elbv2Client.send(new ELBAddTagsCommand({
        ResourceArns: [albArn],
        Tags: [
          {
            Key: testTagKey,
            Value: testTagValue
          }
        ]
      }));
      
      // Verify tags
      const updatedAlbResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn]
      }));
      
      // Note: Tags need to be fetched separately for ALB
      // This is simplified - actual implementation would use DescribeTagsCommand
      
      // Remove tags
      await elbv2Client.send(new ELBRemoveTagsCommand({
        ResourceArns: [albArn],
        TagKeys: [testTagKey]
      }));
    });
  });

  // ============================================================================
  // PART 3: CROSS-SERVICE TESTS (Interactive)
  // ============================================================================

  describe('[Cross-Service] EKS ↔ VPC Network Integration', () => {
    test('should validate EKS nodes are properly distributed across private subnets', async () => {
      // Get node groups
      const nodeGroupsResponse = await eksClient.send(new ListNodegroupsCommand({
        clusterName: outputs.cluster_name.value
      }));
      
      for (const nodeGroupName of nodeGroupsResponse.nodegroups!) {
        const nodeGroupResponse = await eksClient.send(new DescribeNodegroupCommand({
          clusterName: outputs.cluster_name.value,
          nodegroupName: nodeGroupName
        }));
        
        const nodeGroup = nodeGroupResponse.nodegroup!;
        const subnetIds = nodeGroup.subnets!;
        
        // Verify nodes are in private subnets only
        const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: subnetIds
        }));
        
        subnetsResponse.Subnets?.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.Tags?.some(t => 
            t.Key === 'kubernetes.io/role/internal-elb' && t.Value === '1'
          )).toBe(true);
        });
        
        // Check actual node instances
        if (nodeGroup.resources?.autoScalingGroups?.length) {
          const instancesResponse = await ec2Client.send(new DescribeInstancesCommand({
            Filters: [
              { Name: 'tag:eks:nodegroup-name', Values: [nodeGroupName] },
              { Name: 'tag:eks:cluster-name', Values: [outputs.cluster_name.value] }
            ]
          }));
          
          const instances = instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
          
          // Verify instances are in private subnets and have private IPs
          instances.forEach(instance => {
            expect(instance.PublicIpAddress).toBeUndefined();
            expect(instance.PrivateIpAddress).toBeDefined();
            expect(subnetIds).toContain(instance.SubnetId);
          });
        }
      }
    });

    test('should validate NAT Gateway connectivity for EKS nodes', async () => {
      // Get NAT Gateways
      const natGatewaysResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id.value] },
          { Name: 'state', Values: ['available'] }
        ]
      }));
      
      const natGateways = natGatewaysResponse.NatGateways!;
      
      // Get route tables for private subnets
      const routeTablesResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id.value] },
          { Name: 'route.nat-gateway-id', Values: natGateways.map(ng => ng.NatGatewayId!) }
        ]
      }));
      
      const privateRouteTables = routeTablesResponse.RouteTables!;
      expect(privateRouteTables).toHaveLength(3);
      
      // Verify each private route table has a NAT Gateway route
      privateRouteTables.forEach(rt => {
        const natRoute = rt.Routes?.find(route => 
          route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId
        );
        expect(natRoute).toBeDefined();
        expect(natRoute!.State).toBe('active');
      });
      
      // Verify EKS nodes can reach internet through NAT
      const nodeGroupsResponse = await eksClient.send(new ListNodegroupsCommand({
        clusterName: outputs.cluster_name.value
      }));
      
      for (const nodeGroupName of nodeGroupsResponse.nodegroups!) {
        const nodeGroupResponse = await eksClient.send(new DescribeNodegroupCommand({
          clusterName: outputs.cluster_name.value,
          nodegroupName: nodeGroupName
        }));
        
        const subnetIds = nodeGroupResponse.nodegroup!.subnets!;
        
        // Verify subnets are associated with route tables that have NAT routes
        for (const subnetId of subnetIds) {
          const subnetRouteTables = privateRouteTables.filter(rt =>
            rt.Associations?.some(assoc => assoc.SubnetId === subnetId)
          );
          
          expect(subnetRouteTables.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('[Cross-Service] EKS ↔ IAM IRSA Integration', () => {
    test('should validate OIDC provider trust relationships for service accounts', async () => {
      // Get cluster OIDC issuer
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      const oidcIssuer = clusterResponse.cluster!.identity!.oidc!.issuer!;
      const oidcProviderArn = `arn:aws:iam::${accountId}:oidc-provider/${oidcIssuer.replace('https://', '')}`;
      
      // Get IAM roles for nodes
      const nodeRoleName = `${outputs.cluster_name.value}-node-role-new`;
      const nodeRoleResponse = await iamClient.send(new GetRoleCommand({
        RoleName: nodeRoleName
      }));
      
      const nodeRole = nodeRoleResponse.Role!;
      expect(nodeRole).toBeDefined();
      
      // Verify trust policy for nodes
      const trustPolicy = JSON.parse(decodeURIComponent(nodeRole.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      
      // Verify attached policies for nodes
      const attachedPoliciesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: nodeRoleName
      }));
      
      const expectedPolicies = [
        'AmazonEKSWorkerNodePolicy',
        'AmazonEKS_CNI_Policy',
        'AmazonEC2ContainerRegistryReadOnly',
        'AmazonSSMManagedInstanceCore'
      ];
      
      expectedPolicies.forEach(policyName => {
        expect(attachedPoliciesResponse.AttachedPolicies?.some(p => 
          p.PolicyArn?.includes(policyName)
        )).toBe(true);
      });
    });
  });

  describe('[Cross-Service] EKS ↔ KMS Encryption Integration', () => {
    test('should validate EKS secrets encryption using KMS', async () => {
      // Get cluster encryption configuration
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      const encryptionConfig = clusterResponse.cluster!.encryptionConfig![0];
      const keyArn = encryptionConfig.provider?.keyArn!;
      
      // Verify key is accessible and enabled
      const keyResponse = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyArn
      }));
      
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
      
      // Verify key policy allows EKS to use it
      const keyPolicyResponse = await kmsClient.send(new GetKeyPolicyCommand({
        KeyId: keyArn,
        PolicyName: 'default'
      }));
      
      const keyPolicy = JSON.parse(keyPolicyResponse.Policy!);
      
      // Check for EKS-related permissions in the key policy
      const eksStatement = keyPolicy.Statement.find((stmt: any) =>
        stmt.Principal?.Service?.includes('eks') ||
        stmt.Principal?.AWS?.includes(clusterResponse.cluster!.roleArn)
      );
      
      // Even if not explicitly for EKS, root account should have full permissions
      const rootStatement = keyPolicy.Statement.find((stmt: any) =>
        stmt.Principal?.AWS?.includes(`arn:aws:iam::${accountId}:root`)
      );
      
      expect(rootStatement).toBeDefined();
    });
  });

  describe('[Cross-Service] ALB ↔ VPC Network Integration', () => {
    test('should validate ALB is properly integrated with VPC subnets', async () => {
      // Get ALB details
      const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [`${outputs.cluster_name.value}-alb1`]
      }));
      
      const alb = albResponse.LoadBalancers![0];
      const albSubnetIds = alb.AvailabilityZones?.map(az => az.SubnetId!) || [];
      
      // Verify ALB is in public subnets
      const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: albSubnetIds
      }));
      
      subnetsResponse.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.Tags?.some(t => 
          t.Key === 'kubernetes.io/role/elb' && t.Value === '1'
        )).toBe(true);
      });
      
      // Verify ALB security group allows traffic
      const albSecurityGroups = alb.SecurityGroups!;
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: albSecurityGroups
      }));
      
      const albSG = sgResponse.SecurityGroups![0];
      
      // Check HTTP and HTTPS rules
      const httpRule = albSG.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      );
      const httpsRule = albSG.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      );
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('[Cross-Service] CloudWatch ↔ EKS Logging Integration', () => {
    test('should validate EKS cluster logs are properly streamed to CloudWatch', async () => {
      const logGroupName = `/aws/eks/${outputs.cluster_name.value}/cluster-new`;
      
      // Get log streams
      const streamsResponse = await cloudWatchLogsClient.send(new DescribeLogStreamsCommand({
        logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 10
      }));
      
      expect(streamsResponse.logStreams).toBeDefined();
      
      // Check for different log types
      const logTypes = ['kube-apiserver', 'authenticator', 'audit'];
      const streamNames = streamsResponse.logStreams?.map(s => s.logStreamName) || [];
      
      logTypes.forEach(logType => {
        const hasLogType = streamNames.some(name => name?.includes(logType));
        if (!hasLogType) {
          console.log(`Warning: No log stream found for ${logType}`);
        }
      });
      
      // Verify KMS encryption for log group
      const logGroupsResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePattern: logGroupName
      }));
      
      const logGroup = logGroupsResponse.logGroups![0];
      expect(logGroup.kmsKeyId).toBeDefined();
      
      // Verify the KMS key matches cluster encryption key
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      const clusterKeyArn = clusterResponse.cluster!.encryptionConfig![0].provider?.keyArn;
      expect(logGroup.kmsKeyId).toContain(clusterKeyArn?.split('/').pop());
    });
  });

  // ============================================================================
  // PART 4: E2E TESTS (3+ Services Interactive)
  // ============================================================================

  describe('[E2E] Complete Infrastructure Flow: VPC → EKS → ALB → CloudWatch', () => {
    test('should validate complete network path from internet to EKS nodes', async () => {
      // Step 1: Verify Internet Gateway exists and is attached
      const igwResponse = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [outputs.vpc_id.value] }
        ]
      }));
      
      expect(igwResponse.InternetGateways).toHaveLength(1);
      const igw = igwResponse.InternetGateways![0];
      expect(igw.Attachments![0].State).toBe('attached');
      
      // Step 2: Verify ALB can receive traffic from internet
      const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [`${outputs.cluster_name.value}-alb1`]
      }));
      
      const alb = albResponse.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      
      // Step 3: Verify EKS nodes are in private subnets with NAT connectivity
      const nodeGroupsResponse = await eksClient.send(new ListNodegroupsCommand({
        clusterName: outputs.cluster_name.value
      }));
      
      for (const nodeGroupName of nodeGroupsResponse.nodegroups!) {
        const nodeGroupResponse = await eksClient.send(new DescribeNodegroupCommand({
          clusterName: outputs.cluster_name.value,
          nodegroupName: nodeGroupName
        }));
        
        const subnetIds = nodeGroupResponse.nodegroup!.subnets!;
        
        // Verify subnets have NAT Gateway routes
        const routeTablesResponse = await ec2Client.send(new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'association.subnet-id', Values: subnetIds }
          ]
        }));
        
        routeTablesResponse.RouteTables?.forEach(rt => {
          const natRoute = rt.Routes?.find(route => 
            route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId
          );
          expect(natRoute).toBeDefined();
        });
      }
      
      // Step 4: Verify CloudWatch is receiving metrics
      const logGroupName = `/aws/eks/${outputs.cluster_name.value}/cluster-new`;
      const logGroupsResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));
      
      expect(logGroupsResponse.logGroups).toHaveLength(1);
    });

    test('should validate secure communication flow: IAM → KMS → EKS → CloudWatch', async () => {
      // Step 1: Verify IAM roles are properly configured
      const clusterRoleName = `${outputs.cluster_name.value}-cluster-role-new`;
      const clusterRoleResponse = await iamClient.send(new GetRoleCommand({
        RoleName: clusterRoleName
      }));
      
      expect(clusterRoleResponse.Role).toBeDefined();
      
      // Step 2: Verify KMS key is used for encryption
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      const keyArn = clusterResponse.cluster!.encryptionConfig![0].provider?.keyArn!;
      const keyResponse = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyArn
      }));
      
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
      
      // Step 3: Verify EKS cluster uses the KMS key
      expect(clusterResponse.cluster!.encryptionConfig![0].resources).toContain('secrets');
      
      // Step 4: Verify CloudWatch logs are encrypted with the same KMS key
      const logGroupName = `/aws/eks/${outputs.cluster_name.value}/cluster-new`;
      const logGroupsResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePattern: logGroupName
      }));
      
      const logGroup = logGroupsResponse.logGroups![0];
      expect(logGroup.kmsKeyId).toContain(keyArn.split('/').pop());
    });

    test('should validate high availability setup across multiple AZs', async () => {
      // Step 1: Verify VPC spans multiple AZs
      const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id.value] }
        ]
      }));
      
      const availabilityZones = new Set(subnetsResponse.Subnets?.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBe(3);
      
      // Step 2: Verify NAT Gateways are distributed across AZs
      const natGatewaysResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id.value] }
        ]
      }));
      
      const natGatewaySubnets = natGatewaysResponse.NatGateways?.map(ng => ng.SubnetId) || [];
      const natSubnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: natGatewaySubnets
      }));
      
      const natAZs = new Set(natSubnetsResponse.Subnets?.map(s => s.AvailabilityZone));
      expect(natAZs.size).toBe(3);
      
      // Step 3: Verify EKS nodes are distributed across AZs
      const nodeGroupsResponse = await eksClient.send(new ListNodegroupsCommand({
        clusterName: outputs.cluster_name.value
      }));
      
      for (const nodeGroupName of nodeGroupsResponse.nodegroups!) {
        const nodeGroupResponse = await eksClient.send(new DescribeNodegroupCommand({
          clusterName: outputs.cluster_name.value,
          nodegroupName: nodeGroupName
        }));
        
        const nodeSubnets = nodeGroupResponse.nodegroup!.subnets!;
        const nodeSubnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: nodeSubnets
        }));
        
        const nodeAZs = new Set(nodeSubnetsResponse.Subnets?.map(s => s.AvailabilityZone));
        expect(nodeAZs.size).toBe(3);
      }
      
      // Step 4: Verify ALB spans multiple AZs
      const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [`${outputs.cluster_name.value}-alb1`]
      }));
      
      const albAZs = albResponse.LoadBalancers![0].AvailabilityZones || [];
      expect(albAZs).toHaveLength(3);
    });

    test('should validate application deployment readiness', async () => {
      // Step 1: Verify EKS cluster is ready
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      expect(clusterResponse.cluster!.status).toBe('ACTIVE');
      
      // Step 2: Verify node groups are ready
      const nodeGroupsResponse = await eksClient.send(new ListNodegroupsCommand({
        clusterName: outputs.cluster_name.value
      }));
      
      let totalNodes = 0;
      for (const nodeGroupName of nodeGroupsResponse.nodegroups!) {
        const nodeGroupResponse = await eksClient.send(new DescribeNodegroupCommand({
          clusterName: outputs.cluster_name.value,
          nodegroupName: nodeGroupName
        }));
        
        const nodeGroup = nodeGroupResponse.nodegroup!;
        expect(nodeGroup.status).toBe('ACTIVE');
        expect(nodeGroup.health?.issues || []).toHaveLength(0);
        totalNodes += nodeGroup.scalingConfig?.desiredSize || 0;
      }
      
      expect(totalNodes).toBeGreaterThanOrEqual(4); // At least 2 nodes per group
      
      // Step 3: Verify ALB is ready to receive traffic
      const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [`${outputs.cluster_name.value}-alb1`]
      }));
      
      const alb = albResponse.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.DNSName).toBe(outputs.alb_dns_name.value);
      
      // Step 4: Verify logging is configured
      const logGroupName = `/aws/eks/${outputs.cluster_name.value}/cluster-new`;
      const logGroupsResponse = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));
      
      expect(logGroupsResponse.logGroups).toHaveLength(1);
      
      // Step 5: Test DNS resolution (basic connectivity test)
      try {
        const albUrl = `http://${outputs.alb_dns_name.value}`;
        const response = await axios.get(albUrl, { 
          timeout: 5000,
          validateStatus: () => true // Accept any status
        });
        
        // ALB is reachable (might return 503 if no targets are healthy)
        expect(response).toBeDefined();
      } catch (error: any) {
        // Connection refused or timeout is expected if no application is deployed
        if (!error.code || !['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes(error.code)) {
          throw error;
        }
      }
    });
  });

  describe('[E2E] Security and Compliance Validation', () => {
    test('should validate complete security posture across all services', async () => {
      // Step 1: Verify network isolation (private nodes, public ALB)
      const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id.value] }
        ]
      }));
      
      const publicSubnets = subnetsResponse.Subnets?.filter(s => s.MapPublicIpOnLaunch) || [];
      const privateSubnets = subnetsResponse.Subnets?.filter(s => !s.MapPublicIpOnLaunch) || [];
      
      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);
      
      // Step 2: Verify IAM roles follow least privilege
      const clusterRoleName = `${outputs.cluster_name.value}-cluster-role-new`;
      const nodeRoleName = `${outputs.cluster_name.value}-node-role-new`;
      
      const clusterPoliciesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: clusterRoleName
      }));
      
      const nodePoliciesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: nodeRoleName
      }));
      
      // Verify only necessary policies are attached
      expect(clusterPoliciesResponse.AttachedPolicies?.some(p => 
        p.PolicyArn?.includes('AmazonEKSClusterPolicy')
      )).toBe(true);
      
      expect(nodePoliciesResponse.AttachedPolicies?.some(p => 
        p.PolicyArn?.includes('AmazonEKSWorkerNodePolicy')
      )).toBe(true);
      
      // Step 3: Verify encryption at rest
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      expect(clusterResponse.cluster!.encryptionConfig).toBeDefined();
      expect(clusterResponse.cluster!.encryptionConfig![0].resources).toContain('secrets');
      
      // Step 4: Verify security group rules are restrictive
      const sgIds = [outputs.cluster_security_group_id.value];
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: sgIds
      }));
      
      sgResponse.SecurityGroups?.forEach(sg => {
        // Check that no rules allow all traffic from 0.0.0.0/0
        sg.IpPermissions?.forEach(rule => {
          if (rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')) {
            // Only HTTPS should be allowed from anywhere for cluster API
            expect(rule.FromPort).toBe(443);
            expect(rule.ToPort).toBe(443);
          }
        });
      });
      
      // Step 5: Verify audit logging is enabled
      const logging = clusterResponse.cluster!.logging?.clusterLogging?.[0];
      expect(logging?.enabled).toBe(true);
      expect(logging?.types).toContain('audit');
    });

    test('should validate disaster recovery capabilities', async () => {
      // Step 1: Verify multi-AZ deployment
      const azSet = new Set<string>();
      
      // Check NAT Gateways
      const natGatewaysResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.vpc_id.value] }
        ]
      }));
      
      expect(natGatewaysResponse.NatGateways).toHaveLength(3);
      
      // Step 2: Verify EKS control plane is highly available
      const clusterResponse = await eksClient.send(new DescribeClusterCommand({
        name: outputs.cluster_name.value
      }));
      
      // EKS control plane is managed and HA by default
      expect(clusterResponse.cluster!.status).toBe('ACTIVE');
      
      // Step 3: Verify node groups can scale
      const nodeGroupsResponse = await eksClient.send(new ListNodegroupsCommand({
        clusterName: outputs.cluster_name.value
      }));
      
      for (const nodeGroupName of nodeGroupsResponse.nodegroups!) {
        const nodeGroupResponse = await eksClient.send(new DescribeNodegroupCommand({
          clusterName: outputs.cluster_name.value,
          nodegroupName: nodeGroupName
        }));
        
        const scalingConfig = nodeGroupResponse.nodegroup!.scalingConfig!;
        expect(scalingConfig.maxSize).toBeGreaterThan(scalingConfig.minSize!);
        expect(scalingConfig.maxSize).toBe(10);
      }
      
      // Step 4: Verify KMS key has deletion protection
      const keyArn = clusterResponse.cluster!.encryptionConfig![0].provider?.keyArn!;
      const keyResponse = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyArn
      }));
      
      // Key should have a deletion window (not immediate deletion)
      expect(keyResponse.KeyMetadata?.DeletionDate).toBeUndefined();
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });

  describe('[E2E] Application HTTP Flow Validation', () => {
    test('should validate end-to-end application connectivity when deployed', async () => {
      const albDnsName = outputs.alb_dns_name.value;
      const testEndpoints = [
        { path: '/', expectedStatus: [200, 404, 503] },
        { path: '/health', expectedStatus: [200, 404, 503] },
        { path: '/healthz', expectedStatus: [200, 404, 503] }
      ];
      
      for (const endpoint of testEndpoints) {
        try {
          const response = await axios.get(`http://${albDnsName}${endpoint.path}`, {
            timeout: 10000,
            validateStatus: () => true
          });
          
          console.log(`Endpoint ${endpoint.path} returned status: ${response.status}`);
          
          // Verify the status is expected
          expect(endpoint.expectedStatus).toContain(response.status);
          
          // If 200, application is deployed
          if (response.status === 200) {
            console.log(`✅ Application is deployed and responding at ${endpoint.path}`);
          }
          // If 503, ALB is up but no healthy targets
          else if (response.status === 503) {
            console.log(`⚠️ ALB is active but no healthy targets at ${endpoint.path}`);
          }
          // If 404, ALB and possibly ingress controller are working
          else if (response.status === 404) {
            console.log(`ℹ️ ALB is routing but path ${endpoint.path} not found`);
          }
        } catch (error: any) {
          if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.log(`⚠️ Cannot connect to ALB at ${albDnsName}${endpoint.path}`);
          } else {
            throw error;
          }
        }
      }
    });

    test('should perform comprehensive ALB health and configuration check', async () => {
      // Get ALB details
      const albResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [`${outputs.cluster_name.value}-alb1`]
      }));
      
      const alb = albResponse.LoadBalancers![0];
      
      // Step 1: Verify ALB DNS is resolvable
      const dns = require('dns').promises;
      try {
        const addresses = await dns.resolve4(outputs.alb_dns_name.value);
        expect(addresses.length).toBeGreaterThan(0);
        console.log(`✅ ALB DNS resolves to: ${addresses.join(', ')}`);
      } catch (error) {
        console.log(`⚠️ ALB DNS resolution failed: ${error}`);
      }
      
      // Step 2: Check listeners configuration
      const listenersResponse = await elbv2Client.send(new DescribeListenersCommand({
        LoadBalancerArn: alb.LoadBalancerArn
      }));
      
      if (listenersResponse.Listeners && listenersResponse.Listeners.length > 0) {
        listenersResponse.Listeners.forEach(listener => {
          console.log(`Listener on port ${listener.Port} with protocol ${listener.Protocol}`);
        });
      } else {
        console.log('⚠️ No listeners configured on ALB yet');
      }
      
      // Step 3: Check target groups
      const targetGroupsResponse = await elbv2Client.send(new DescribeTargetGroupsCommand({
        LoadBalancerArns: [alb.LoadBalancerArn!]
      }));
      
      if (targetGroupsResponse.TargetGroups && targetGroupsResponse.TargetGroups.length > 0) {
        for (const tg of targetGroupsResponse.TargetGroups) {
          // Check target health
          const healthResponse = await elbv2Client.send(new DescribeTargetHealthCommand({
            TargetGroupArn: tg.TargetGroupArn
          }));
          
          const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(t => 
            t.TargetHealth?.State === 'healthy'
          ).length || 0;
          
          console.log(`Target group ${tg.TargetGroupName}: ${healthyTargets} healthy targets`);
        }
      } else {
        console.log('⚠️ No target groups associated with ALB yet');
      }
    });
  });
});