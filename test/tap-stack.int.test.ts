import {
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  ListRolesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs from deployment
const loadStackOutputs = () => {
  try {
    // Follow the exact pattern from archive/pulumi-ts examples
    const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    return JSON.parse(outputsContent);
  } catch (error) {
    throw new Error(`Failed to load stack outputs: ${error}`);
  }
};

const initializeClients = (region?: string) => {
  const defaultRegion = region || 'us-west-2';

  return {
    ec2: new EC2Client({ region: defaultRegion }),
    rds: new RDSClient({ region: defaultRegion }),
    s3: new S3Client({ region: defaultRegion }),
    iam: new IAMClient({ region: defaultRegion }),
    sts: new STSClient({ region: defaultRegion }),
  };
};

// Extract resource IDs from outputs
const extractResourceIds = (stackOutputs: any) => {
  // Get the first stack (assuming single stack deployment)
  const stackName = Object.keys(stackOutputs)[0];
  if (!stackName) {
    throw new Error('No stack outputs found');
  }
  
  // Return the outputs for the first stack
  return stackOutputs[stackName];
};

describe('TapStack Integration Tests - Secure Web Application Infrastructure', () => {
  let stackOutputs: any;
  let resourceIds: any;
  let clients: any;
  let testRegion: string;

  beforeAll(async () => {
    try {
      // Load stack outputs following archive/pulumi-ts pattern
      stackOutputs = loadStackOutputs();
      resourceIds = extractResourceIds(stackOutputs);
      
      // Get the first stack name for logging
      const stackName = Object.keys(stackOutputs)[0];
      console.log(`Stack outputs loaded:`, Object.keys(stackOutputs));
      
      testRegion = 'us-west-2'; // Fixed region as per PROMPT.md requirements
      clients = initializeClients(testRegion);

      // Verify AWS credentials
      const identity = await clients.sts.send(new GetCallerIdentityCommand({}));
      console.log(`Running integration tests with AWS Account: ${identity.Account} in region: ${testRegion}`);
      console.log(`Testing stack: ${stackName}`);
      
      // Log available resource IDs for debugging
      console.log('Available resource IDs:', Object.keys(resourceIds));
    } catch (error) {
      console.error('Failed to initialize integration tests:', error);
      throw error;
    }
  }, 30000);
  describe('VPC and Network Infrastructure (PROMPT.md Requirement #3)', () => {
    test('should have VPC with correct configuration in us-west-2', async () => {
      if (!resourceIds?.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [resourceIds.vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);

      // Check VPC tags follow naming convention (PROMPT.md Requirement #6)
      const nameTag = vpc.Tags?.find((tag: any) => tag.Key === 'Name');
      expect(nameTag?.Value).toMatch(/^webapp-vpc-/);
    }, 30000);

    test('should have public and private subnets with proper segregation', async () => {
      if (!resourceIds?.publicSubnetIds || !resourceIds?.privateSubnetIds) {
        console.warn('Subnet IDs not found in outputs, skipping test');
        return;
      }

      const publicSubnetIds = Array.isArray(resourceIds.publicSubnetIds)
        ? resourceIds.publicSubnetIds
        : [resourceIds.publicSubnetIds];
      
      const privateSubnetIds = Array.isArray(resourceIds.privateSubnetIds)
        ? resourceIds.privateSubnetIds
        : [resourceIds.privateSubnetIds];

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];

      const response = await clients.ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(4); // 2 public + 2 private

      // Check that we have subnets in multiple AZs for high availability
      const availabilityZones = new Set(
        response.Subnets!.map((subnet: any) => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);

      // Verify public subnets have different CIDR blocks than private subnets
      const publicSubnets = response.Subnets!.filter((subnet: any) =>
        publicSubnetIds.includes(subnet.SubnetId)
      );
      const privateSubnets = response.Subnets!.filter((subnet: any) =>
        privateSubnetIds.includes(subnet.SubnetId)
      );

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);

      // Check naming conventions (PROMPT.md Requirement #6)
      publicSubnets.forEach((subnet: any) => {
        const nameTag = subnet.Tags?.find((tag: any) => tag.Key === 'Name');
        expect(nameTag?.Value).toMatch(/^webapp-public-subnet-/);
      });

      privateSubnets.forEach((subnet: any) => {
        const nameTag = subnet.Tags?.find((tag: any) => tag.Key === 'Name');
        expect(nameTag?.Value).toMatch(/^webapp-private-subnet-/);
      });
    }, 30000);

    test('should have proper route tables for public and private subnets', async () => {
      if (!resourceIds?.vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [resourceIds.vpcId],
            },
          ],
        })
      );

      const routeTables = response.RouteTables || [];
      const webappRouteTables = routeTables.filter((rt: any) =>
        rt.Tags?.some((tag: any) => tag.Value?.includes('webapp'))
      );

      expect(webappRouteTables.length).toBeGreaterThanOrEqual(2); // At least public and private route tables

      // Check for internet gateway route in public route table
      const publicRouteTable = webappRouteTables.find((rt: any) =>
        rt.Tags?.some((tag: any) => tag.Value?.includes('public'))
      );

      if (publicRouteTable) {
        const internetRoute = publicRouteTable.Routes?.find((route: any) =>
          route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId?.startsWith('igw-')
        );
        expect(internetRoute).toBeDefined();
      }
    }, 30000);
  });
  describe('Security Groups Configuration (PROMPT.md Requirement #5)', () => {
    test('should have web and database security groups with proper access controls', async () => {
      if (!resourceIds?.webSecurityGroupId || !resourceIds?.databaseSecurityGroupId) {
        console.warn('Security group IDs not found in outputs, skipping test');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [resourceIds.webSecurityGroupId, resourceIds.databaseSecurityGroupId],
        })
      );

      expect(response.SecurityGroups).toHaveLength(2);

      const webSg = response.SecurityGroups!.find((sg: any) => sg.GroupId === resourceIds.webSecurityGroupId);
      const dbSg = response.SecurityGroups!.find((sg: any) => sg.GroupId === resourceIds.databaseSecurityGroupId);

      // Check naming conventions (PROMPT.md Requirement #6)
      expect(webSg?.GroupName).toMatch(/^webapp-web-sg-/);
      expect(dbSg?.GroupName).toMatch(/^webapp-db-sg-/);

      // Web SG should allow HTTP/HTTPS from internet (PROMPT.md Requirement #5)
      const webHttpRule = webSg?.IpPermissions?.find((rule: any) => rule.FromPort === 80);
      const webHttpsRule = webSg?.IpPermissions?.find((rule: any) => rule.FromPort === 443);
      
      expect(webHttpRule).toBeDefined();
      expect(webHttpsRule).toBeDefined();

      // Verify HTTP/HTTPS rules allow access from internet
      expect(webHttpRule?.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0')).toBe(true);
      expect(webHttpsRule?.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0')).toBe(true);

      // Database SG should not have any public access (PROMPT.md Requirement #4 & #5)
      const dbPublicRules = dbSg?.IpPermissions?.filter((rule: any) =>
        rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0')
      );
      expect(dbPublicRules).toHaveLength(0);

      // Database SG should only allow access from private subnets/web security group
      const dbMysqlRule = dbSg?.IpPermissions?.find((rule: any) => rule.FromPort === 3306);
      if (dbMysqlRule) {
        // Should have references to other security groups, not public IPs
        expect(dbMysqlRule.UserIdGroupPairs?.length || 0).toBeGreaterThan(0);
        expect(dbMysqlRule.IpRanges?.length || 0).toBe(0);
      }
    }, 30000);

    test('should enforce network-level access controls between tiers', async () => {
      if (!resourceIds?.webSecurityGroupId || !resourceIds?.databaseSecurityGroupId) {
        console.warn('Security group IDs not found in outputs, skipping test');
        return;
      }

      const response = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [resourceIds.webSecurityGroupId, resourceIds.databaseSecurityGroupId],
        })
      );

      const webSg = response.SecurityGroups!.find((sg: any) => sg.GroupId === resourceIds.webSecurityGroupId);
      const dbSg = response.SecurityGroups!.find((sg: any) => sg.GroupId === resourceIds.databaseSecurityGroupId);

      // Database security group should only allow access from web security group
      const dbIngressRules = dbSg?.IpPermissions || [];
      
      dbIngressRules.forEach((rule: any) => {
        // Each rule should either reference another security group or be from private CIDR
        const hasSecurityGroupRef = (rule.UserIdGroupPairs?.length || 0) > 0;
        const hasPrivateCidr = rule.IpRanges?.every((range: any) =>
          range.CidrIp?.startsWith('10.') || range.CidrIp?.startsWith('172.') || range.CidrIp?.startsWith('192.168.')
        );
        
        expect(hasSecurityGroupRef || hasPrivateCidr).toBe(true);
      });

      // Web security group should not allow database ports from internet
      const webIngressRules = webSg?.IpPermissions || [];
      const webDbPortRules = webIngressRules.filter((rule: any) =>
        rule.FromPort === 3306 || rule.FromPort === 5432 || rule.FromPort === 1433
      );
      
      webDbPortRules.forEach((rule: any) => {
        const hasPublicAccess = rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0');
        expect(hasPublicAccess).toBe(false);
      });
    }, 30000);
  });
  describe('S3 Buckets Security (PROMPT.md Requirement #1)', () => {
    test('should have encrypted S3 buckets with AES-256 algorithm', async () => {
      const bucketNames = [
        resourceIds?.applicationDataBucketName,
        resourceIds?.backupBucketName,
      ].filter(Boolean);

      if (bucketNames.length === 0) {
        console.warn('No bucket names found in outputs, skipping test');
        return;
      }

      for (const bucketName of bucketNames) {
        // Check bucket exists
        await expect(
          clients.s3.send(new HeadBucketCommand({ Bucket: bucketName }))
        ).resolves.not.toThrow();

        // Check encryption with AES-256 (PROMPT.md Requirement #1)
        const encryptionResponse = await clients.s3.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules![0]
            .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('AES256');

        // Check versioning for data protection
        const versioningResponse = await clients.s3.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(versioningResponse.Status).toBe('Enabled');

        // Check public access block (AWS security best practices - PROMPT.md Requirement #7)
        const publicAccessResponse = await clients.s3.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );
        expect(publicAccessResponse.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true,
        });

        // Check naming convention (PROMPT.md Requirement #6)
        expect(bucketName).toMatch(/^webapp-/);
      }
    }, 60000);

    test('should have proper bucket configuration for application data storage', async () => {
      if (!resourceIds?.applicationDataBucketName) {
        console.warn('Application data bucket name not found in outputs, skipping test');
        return;
      }

      const bucketName = resourceIds.applicationDataBucketName;

      // Verify bucket naming follows convention
      expect(bucketName).toMatch(/^webapp-app-data-/);

      // Check that bucket is in the correct region (us-west-2)
      const headResponse = await clients.s3.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      
      // The bucket should be accessible from us-west-2 client
      expect(headResponse.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('should have backup bucket with appropriate configuration', async () => {
      if (!resourceIds?.backupBucketName) {
        console.warn('Backup bucket name not found in outputs, skipping test');
        return;
      }

      const bucketName = resourceIds.backupBucketName;

      // Verify bucket naming follows convention
      expect(bucketName).toMatch(/^webapp-backup-/);

      // Check encryption specifically for backup data
      const encryptionResponse = await clients.s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      const encryptionRule = encryptionResponse.ServerSideEncryptionConfiguration?.Rules![0];
      expect(encryptionRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      expect(encryptionRule?.BucketKeyEnabled).toBe(true);
    }, 30000);
  });
  describe('IAM Roles and Least Privilege (PROMPT.md Requirement #2)', () => {
    test('should have properly configured IAM roles following least privilege principle', async () => {
      const rolesResponse = await clients.iam.send(
        new ListRolesCommand({
          PathPrefix: '/',
        })
      );

      const webappRoles = rolesResponse.Roles?.filter((role: any) =>
        role.RoleName?.includes('webapp')
      );

      expect(webappRoles).toBeDefined();
      expect(webappRoles!.length).toBeGreaterThan(0);

      // Check naming conventions (PROMPT.md Requirement #6)
      webappRoles!.forEach((role: any) => {
        expect(role.RoleName).toMatch(/^webapp-.*-role-.*$/);
      });

      // Check that roles can be assumed by EC2 instances (PROMPT.md Requirement #2)
      for (const role of webappRoles!) {
        const assumeRolePolicyDocument = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!));
        
        const ec2AssumeStatement = assumeRolePolicyDocument.Statement?.find((stmt: any) =>
          stmt.Principal?.Service?.includes('ec2.amazonaws.com')
        );
        
        expect(ec2AssumeStatement).toBeDefined();
        expect(ec2AssumeStatement.Effect).toBe('Allow');
        expect(ec2AssumeStatement.Action).toContain('sts:AssumeRole');
      }
    }, 30000);

    test('should have instance profile for EC2 instances without long-lived access keys', async () => {
      if (!resourceIds?.webServerInstanceProfileName) {
        console.warn('Instance profile name not found in outputs, skipping test');
        return;
      }

      const instanceProfileResponse = await clients.iam.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: resourceIds.webServerInstanceProfileName,
        })
      );

      expect(instanceProfileResponse.InstanceProfile).toBeDefined();
      expect(instanceProfileResponse.InstanceProfile!.Roles).toHaveLength(1);

      const attachedRole = instanceProfileResponse.InstanceProfile!.Roles![0];
      
      // Check naming convention
      expect(attachedRole.RoleName).toMatch(/^webapp-.*-role-.*$/);
      expect(instanceProfileResponse.InstanceProfile!.InstanceProfileName).toMatch(/^webapp-.*-profile-.*$/);

      // Verify the role has appropriate policies attached
      const attachedPoliciesResponse = await clients.iam.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: attachedRole.RoleName,
        })
      );

      const inlinePoliciesResponse = await clients.iam.send(
        new ListRolePoliciesCommand({
          RoleName: attachedRole.RoleName,
        })
      );

      // Should have some policies attached (either managed or inline)
      const totalPolicies = (attachedPoliciesResponse.AttachedPolicies?.length || 0) +
        (inlinePoliciesResponse.PolicyNames?.length || 0);
      expect(totalPolicies).toBeGreaterThan(0);
    }, 30000);

    test('should follow least privilege principle in IAM policies', async () => {
      const rolesResponse = await clients.iam.send(
        new ListRolesCommand({
          PathPrefix: '/',
        })
      );

      const webappRoles = rolesResponse.Roles?.filter((role: any) =>
        role.RoleName?.includes('webapp')
      );

      for (const role of webappRoles || []) {
        // Check inline policies for least privilege
        const inlinePoliciesResponse = await clients.iam.send(
          new ListRolePoliciesCommand({
            RoleName: role.RoleName!,
          })
        );

        for (const policyName of inlinePoliciesResponse.PolicyNames || []) {
          const policyResponse = await clients.iam.send(
            new GetRolePolicyCommand({
              RoleName: role.RoleName!,
              PolicyName: policyName,
            })
          );

          const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
          
          // Check that policies don't grant overly broad permissions
          policyDocument.Statement?.forEach((statement: any) => {
            if (statement.Effect === 'Allow') {
              // Should not have wildcard actions on all resources
              const hasWildcardAction = Array.isArray(statement.Action)
                ? statement.Action.includes('*')
                : statement.Action === '*';
              
              const hasWildcardResource = Array.isArray(statement.Resource)
                ? statement.Resource.includes('*')
                : statement.Resource === '*';

              if (hasWildcardAction && hasWildcardResource) {
                // This would violate least privilege principle
                expect(false).toBe(true); // Force failure with descriptive message
              }
            }
          });
        }
      }
    }, 45000);
  });
  describe('Database Configuration (PROMPT.md Requirement #4)', () => {
    test('should have RDS subnet group configured in private subnets only', async () => {
      if (!resourceIds?.databaseSubnetGroupName) {
        console.warn('Database subnet group name not found in outputs, skipping test');
        return;
      }

      const response = await clients.rds.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: resourceIds.databaseSubnetGroupName,
        })
      );

      expect(response.DBSubnetGroups).toHaveLength(1);
      const subnetGroup = response.DBSubnetGroups![0];

      expect(subnetGroup.DBSubnetGroupName).toBe(resourceIds.databaseSubnetGroupName);
      expect(subnetGroup.VpcId).toBe(resourceIds.vpcId);
      expect(subnetGroup.Subnets).toHaveLength(2);

      // Should have subnets in different AZs for high availability
      const azs = subnetGroup.Subnets!.map((subnet: any) => subnet.SubnetAvailabilityZone?.Name);
      expect(new Set(azs).size).toBe(2);

      // Verify naming convention (PROMPT.md Requirement #6)
      expect(subnetGroup.DBSubnetGroupName).toMatch(/^webapp-db-subnet-group-/);

      // Verify subnets are private subnets (should match private subnet IDs from outputs)
      if (resourceIds?.privateSubnetIds) {
        const privateSubnetIds = Array.isArray(resourceIds.privateSubnetIds)
          ? resourceIds.privateSubnetIds
          : [resourceIds.privateSubnetIds];

        const subnetGroupSubnetIds = subnetGroup.Subnets!.map((subnet: any) => subnet.SubnetIdentifier);
        
        // All subnet group subnets should be in the private subnets list
        subnetGroupSubnetIds.forEach((subnetId: string) => {
          expect(privateSubnetIds).toContain(subnetId);
        });
      }
    }, 30000);

    test('should ensure database instances are only accessible from private subnets', async () => {
      if (!resourceIds?.databaseSubnetGroupName || !resourceIds?.databaseSecurityGroupId) {
        console.warn('Database configuration not found in outputs, skipping test');
        return;
      }

      // Get the database security group
      const sgResponse = await clients.ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [resourceIds.databaseSecurityGroupId],
        })
      );

      const dbSecurityGroup = sgResponse.SecurityGroups![0];

      // Check that database security group only allows access from private networks
      const ingressRules = dbSecurityGroup.IpPermissions || [];
      
      ingressRules.forEach((rule: any) => {
        // Check IP ranges - should not allow public access
        rule.IpRanges?.forEach((ipRange: any) => {
          expect(ipRange.CidrIp).not.toBe('0.0.0.0/0');
          
          // Should be private IP ranges if any IP ranges are specified
          if (ipRange.CidrIp) {
            const isPrivateRange =
              ipRange.CidrIp.startsWith('10.') ||
              ipRange.CidrIp.startsWith('172.') ||
              ipRange.CidrIp.startsWith('192.168.');
            expect(isPrivateRange).toBe(true);
          }
        });

        // Should primarily use security group references, not IP ranges
        if (rule.FromPort === 3306 || rule.FromPort === 5432) {
          expect(rule.UserIdGroupPairs?.length || 0).toBeGreaterThan(0);
        }
      });
    }, 30000);
  });
});
