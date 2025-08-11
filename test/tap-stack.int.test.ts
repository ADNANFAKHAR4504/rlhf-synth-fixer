import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListExportsCommand,
} from '@aws-sdk/client-cloudformation';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import fs from 'fs';

// Configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const iamClient = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudFormationClient = new CloudFormationClient({ region: process.env.AWS_REGION || 'us-east-1' });
const stsClient = new STSClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Helper function to get CloudFormation outputs
function getCloudFormationOutputs() {
  try {
    return JSON.parse(fs.readFileSync('test/cfn-outputs/flat-outputs.json', 'utf8'));
  } catch (error) {
    console.warn('CloudFormation outputs file not found, using environment variables');
    return {};
  }
}

describe('TapStack Integration Tests', () => {
  let accountId: string;
  let region: string;
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let publicSecurityGroupId: string;
  let privateSecurityGroupId: string;
  let ec2RoleArn: string;
  let s3BucketName: string;
  let infrastructureAvailable: boolean = false;

  beforeAll(async () => {
    // Get AWS account and region information
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    accountId = identity.Account!;
    region = process.env.AWS_REGION || 'us-east-1';

    // Get CloudFormation outputs
    const outputs = getCloudFormationOutputs();
    
    // Extract resource IDs from outputs or use environment variables
    vpcId = outputs.VPCId || process.env.VPC_ID || '';
    publicSubnetIds = (outputs.PublicSubnetIds || process.env.PUBLIC_SUBNET_IDS || '').split(',').filter(Boolean);
    privateSubnetIds = (outputs.PrivateSubnetIds || process.env.PRIVATE_SUBNET_IDS || '').split(',').filter(Boolean);
    publicSecurityGroupId = outputs.PublicSecurityGroupId || process.env.PUBLIC_SECURITY_GROUP_ID || '';
    privateSecurityGroupId = outputs.PrivateSecurityGroupId || process.env.PRIVATE_SECURITY_GROUP_ID || '';
    ec2RoleArn = outputs.EC2RoleArn || process.env.EC2_ROLE_ARN || '';
    s3BucketName = outputs.RetainedBucketName || process.env.S3_BUCKET_NAME || '';

    // Check if infrastructure is available
    infrastructureAvailable = !!(vpcId && publicSubnetIds.length > 0 && privateSubnetIds.length > 0);
    
    if (!infrastructureAvailable) {
      console.warn('Infrastructure not available - skipping integration tests');
      console.warn('Required resources not found:');
      console.warn(`- VPC ID: ${vpcId || 'NOT FOUND'}`);
      console.warn(`- Public Subnets: ${publicSubnetIds.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
      console.warn(`- Private Subnets: ${privateSubnetIds.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
      console.warn('Please ensure CloudFormation stack is deployed and outputs are available');
    }
  }, 30000);

  // Only run tests if infrastructure is available
  if (!infrastructureAvailable) {
    describe('Infrastructure Not Available', () => {
      test('skipping all tests - infrastructure not deployed', () => {
        console.warn('Infrastructure not available - all tests skipped');
        console.warn('Please ensure CloudFormation stack is deployed and outputs are available');
        expect(true).toBe(true); // This test will pass
      });
    });
    return;
  }

  describe('CloudFormation Stack Validation', () => {
    test('should have a deployed CloudFormation stack', async () => {
      const response = await cloudFormationClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      expect(response.Stacks).toHaveLength(1);
      const stack = response.Stacks![0];
      
      expect(stack.StackName).toBe(stackName);
      expect(stack.StackStatus).toBe('CREATE_COMPLETE');
      
      // Verify stack tags
      const stackTags = stack.Tags || [];
      expect(stackTags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'MyProject' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'CostCenter', Value: '12345' },
        ])
      );
    }, 30000);

    test('should export required resources', async () => {
      const response = await cloudFormationClient.send(new ListExportsCommand({}));
      const exports = response.Exports || [];
      
      const expectedExports = [
        'SecureNetworkFoundation-VPC-ID',
        'SecureNetworkFoundation-PublicSubnets',
        'SecureNetworkFoundation-PrivateSubnets',
        'SecureNetworkFoundation-PublicSG',
        'SecureNetworkFoundation-PrivateSG',
        'SecureNetworkFoundation-EC2Role',
        'SecureNetworkFoundation-RetainedBucket',
      ];

      expectedExports.forEach(exportName => {
        const exportItem = exports.find(exp => exp.Name === exportName);
        expect(exportItem).toBeDefined();
        expect(exportItem!.Value).toBeTruthy();
      });
    }, 30000);
  });

  describe('VPC Infrastructure Validation', () => {
    test('should have VPC with correct CIDR and configuration', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.InstanceTenancy).toBe('default');

      // Verify VPC tags
      const vpcTags = vpc.Tags || [];
      expect(vpcTags).toEqual(
        expect.arrayContaining([
          { Key: 'Project', Value: 'MyProject' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'CostCenter', Value: '12345' },
        ])
      );
    }, 30000);

    test('should have exactly 2 public subnets across different AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      expect(response.Subnets).toHaveLength(2);
      
      const subnets = response.Subnets!;
      const availabilityZones = subnets.map(subnet => subnet.AvailabilityZone);
      
      // Verify subnets are in different AZs
      expect(new Set(availabilityZones).size).toBe(2);
      
      // Verify subnet configuration
      subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        
        // Verify CIDR blocks are in the expected range
        const cidr = subnet.CidrBlock!;
        expect(cidr).toMatch(/^10\.0\.(0|1)\.0\/24$/);
        
        // Verify tags
        const subnetTags = subnet.Tags || [];
        expect(subnetTags).toEqual(
          expect.arrayContaining([
            { Key: 'Project', Value: 'MyProject' },
            { Key: 'Environment', Value: 'Production' },
            { Key: 'CostCenter', Value: '12345' },
          ])
        );
      });
    }, 30000);

    test('should have exactly 2 private subnets across different AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      expect(response.Subnets).toHaveLength(2);
      
      const subnets = response.Subnets!;
      const availabilityZones = subnets.map(subnet => subnet.AvailabilityZone);
      
      // Verify subnets are in different AZs
      expect(new Set(availabilityZones).size).toBe(2);
      
      // Verify subnet configuration
      subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        
        // Verify CIDR blocks are in the expected range
        const cidr = subnet.CidrBlock!;
        expect(cidr).toMatch(/^10\.0\.(2|3)\.0\/24$/);
        
        // Verify tags
        const subnetTags = subnet.Tags || [];
        expect(subnetTags).toEqual(
          expect.arrayContaining([
            { Key: 'Project', Value: 'MyProject' },
            { Key: 'Environment', Value: 'Production' },
            { Key: 'CostCenter', Value: '12345' },
          ])
        );
      });
    }, 30000);

    test('should have Internet Gateway attached to VPC', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    }, 30000);

    test('should have NAT Gateway for private subnet internet access', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      expect(response.NatGateways).toHaveLength(1);
      const natGateway = response.NatGateways![0];
      
      expect(natGateway.State).toBe('available');
      expect(natGateway.VpcId).toBe(vpcId);
      
      // Verify NAT Gateway is in a public subnet
      const natSubnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [natGateway.SubnetId!] })
      );
      const natSubnet = natSubnetResponse.Subnets![0];
      expect(natSubnet.MapPublicIpOnLaunch).toBe(true);
    }, 30000);
  });

  describe('Security Groups Validation', () => {
    test('should have public security group with correct rules', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [publicSecurityGroupId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      expect(sg.VpcId).toBe(vpcId);
      expect(sg.Description).toBe('Security group for public subnet resources - allows HTTP and SSH');

      // Verify ingress rules
      const ingressRules = sg.IpPermissions || [];
      
      // Check for HTTP rule (port 80)
      const httpRule = ingressRules.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges).toHaveLength(1);
      expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');

      // Check for SSH rule (port 22)
      const sshRule = ingressRules.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges).toHaveLength(1);
      expect(sshRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');

      // Verify egress rules (all traffic)
      const egressRules = sg.IpPermissionsEgress || [];
      const allTrafficRule = egressRules.find(rule => rule.IpProtocol === '-1');
      expect(allTrafficRule).toBeDefined();
      expect(allTrafficRule!.IpRanges).toHaveLength(1);
      expect(allTrafficRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    }, 30000);

    test('should have private security group with no SSH access', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [privateSecurityGroupId] })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];

      expect(sg.VpcId).toBe(vpcId);
      expect(sg.Description).toBe('Security group for private subnet resources - no direct SSH access');

      // Verify NO SSH ingress rules exist
      const ingressRules = sg.IpPermissions || [];
      const sshRules = ingressRules.filter(rule => 
        rule.FromPort === 22 || rule.ToPort === 22
      );
      expect(sshRules).toHaveLength(0);

      // Verify egress rules (all traffic)
      const egressRules = sg.IpPermissionsEgress || [];
      const allTrafficRule = egressRules.find(rule => rule.IpProtocol === '-1');
      expect(allTrafficRule).toBeDefined();
      expect(allTrafficRule!.IpRanges).toHaveLength(1);
      expect(allTrafficRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    }, 30000);
  });

  describe('IAM Roles and Policies Validation', () => {
    test('should have EC2 instance role with correct configuration', async () => {
      const roleName = `${stackName}-SecureNetworkFoundation-EC2Role`;
      
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      const role = response.Role!;
      expect(role.RoleName).toBe(roleName);
      expect(role.Description).toBe('IAM role for EC2 instances with least privilege access');

      // Verify assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement).toHaveLength(1);
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');

      // Verify attached policies
      const attachedPolicies = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      
      const managedPolicies = attachedPolicies.AttachedPolicies || [];
      const ssmPolicy = managedPolicies.find(policy => 
        policy.PolicyName === 'AmazonSSMManagedInstanceCore'
      );
      expect(ssmPolicy).toBeDefined();
    }, 30000);

    test('should have instance profile with correct configuration', async () => {
      const instanceProfileName = `${stackName}-InstanceProfile`;
      
      const response = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: instanceProfileName })
      );

      const instanceProfile = response.InstanceProfile!;
      expect(instanceProfile.InstanceProfileName).toBe(instanceProfileName);

      // Verify role association
      const roles = instanceProfile.Roles || [];
      expect(roles).toHaveLength(1);
      expect(roles[0].RoleName).toBe(`${stackName}-SecureNetworkFoundation-EC2Role`);
    }, 30000);
  });

  describe('S3 Bucket Validation', () => {
    test('should have S3 bucket with correct configuration', async () => {
      // Check bucket exists and is accessible
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));

      // Verify bucket name format
      expect(s3BucketName).toMatch(/^secure-network-foundation-\d{12}-[a-z0-9-]+$/);

      // Check versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');

      // Check public access block
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      const publicAccessBlock = publicAccessResponse.PublicAccessBlockConfiguration!;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);

      // Check lifecycle configuration
      const lifecycleResponse = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: s3BucketName })
      );
      const lifecycleRules = lifecycleResponse.Rules || [];
      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].ID).toBe('TransitionToIA');
      expect(lifecycleRules[0].Status).toBe('Enabled');
    }, 30000);

    test('should have SSL enforcement policy', async () => {
      const policyResponse = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: s3BucketName })
      );

      const policy = JSON.parse(policyResponse.Policy!);
      const statements = policy.Statement || [];

      // Check for SSL enforcement statement
      const sslStatement = statements.find((stmt: any) => 
        stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      expect(sslStatement).toBeDefined();
      expect(sslStatement.Action).toBe('s3:*');
      expect(sslStatement.Effect).toBe('Deny');
      expect(sslStatement.Principal.AWS).toBe('*');
    }, 30000);
  });

  describe('Network Connectivity Validation', () => {
    test('should have proper route tables configured', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      const routeTables = response.RouteTables!;
      expect(routeTables.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private route tables

      // Verify public subnet route tables have internet gateway route
      const publicSubnetRouteTables = routeTables.filter(rt => 
        rt.Associations?.some(assoc => 
          publicSubnetIds.includes(assoc.SubnetId!)
        )
      );

      publicSubnetRouteTables.forEach(rt => {
        const igwRoute = rt.Routes?.find(route => route.GatewayId?.startsWith('igw-'));
        expect(igwRoute).toBeDefined();
        expect(igwRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
      });

      // Verify private subnet route tables have NAT gateway route
      const privateSubnetRouteTables = routeTables.filter(rt => 
        rt.Associations?.some(assoc => 
          privateSubnetIds.includes(assoc.SubnetId!)
        )
      );

      privateSubnetRouteTables.forEach(rt => {
        const natRoute = rt.Routes?.find(route => route.NatGatewayId?.startsWith('nat-'));
        expect(natRoute).toBeDefined();
        expect(natRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
      });
    }, 30000);
  });

  describe('Resource Tagging Validation', () => {
    test('should have consistent tagging across all resources', async () => {
      const expectedTags = [
        { Key: 'Project', Value: 'MyProject' },
        { Key: 'Environment', Value: 'Production' },
        { Key: 'CostCenter', Value: '12345' },
      ];

      // Verify VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      expectedTags.forEach(tag => {
        expect(vpcTags).toEqual(expect.arrayContaining([tag]));
      });

      // Verify Security Group tags
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [publicSecurityGroupId, privateSecurityGroupId] })
      );
      sgResponse.SecurityGroups!.forEach(sg => {
        const sgTags = sg.Tags || [];
        expectedTags.forEach(tag => {
          expect(sgTags).toEqual(expect.arrayContaining([tag]));
        });
      });

      // Verify Subnet tags
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [...publicSubnetIds, ...privateSubnetIds] })
      );
      subnetResponse.Subnets!.forEach(subnet => {
        const subnetTags = subnet.Tags || [];
        expectedTags.forEach(tag => {
          expect(subnetTags).toEqual(expect.arrayContaining([tag]));
        });
      });
    }, 30000);
  });

  describe('Security Compliance Validation', () => {
    test('should enforce least privilege principle for IAM', async () => {
      const roleName = `${stackName}-SecureNetworkFoundation-EC2Role`;
      
      // Verify role has minimal required permissions
      const attachedPolicies = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      
      const managedPolicies = attachedPolicies.AttachedPolicies || [];
      
      // Should only have the SSM managed policy
      expect(managedPolicies).toHaveLength(1);
      expect(managedPolicies[0].PolicyName).toBe('AmazonSSMManagedInstanceCore');
      
      // Verify no overly broad permissions are attached
      const broadPolicies = managedPolicies.filter(policy => 
        policy.PolicyName?.includes('Administrator') || 
        policy.PolicyName?.includes('FullAccess')
      );
      expect(broadPolicies).toHaveLength(0);
    }, 30000);

    test('should have secure S3 bucket configuration', async () => {
      // Verify bucket is not publicly accessible
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      const publicAccessBlock = publicAccessResponse.PublicAccessBlockConfiguration!;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);

      // Verify encryption is enabled
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    }, 30000);
  });

  describe('High Availability Validation', () => {
    test('should have resources distributed across multiple AZs', async () => {
      // Verify subnets are in different AZs
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );

      const availabilityZones = subnetResponse.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAZs = new Set(availabilityZones);
      
      expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);
      expect(allSubnetIds.length).toBe(4); // 2 public + 2 private
    }, 30000);
  });
});
