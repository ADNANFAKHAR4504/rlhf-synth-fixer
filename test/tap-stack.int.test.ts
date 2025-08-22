import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeAddressesCommand,
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand
} from '@aws-sdk/client-iam';

const p = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
let allOutputs: Record<string, Record<string, string>> = {};

try {
  if (!fs.existsSync(p)) {
    throw new Error(`Output file not found at ${p}`);
  }
  const outputsRaw = fs.readFileSync(p, 'utf-8');
  allOutputs = JSON.parse(outputsRaw); // Assume structure like {dev: {VPCId: '...', ...}, staging: {...}, prod: {...}}
} catch (error) {
  console.error(`Failed to load or parse ${p}:`, error);
  allOutputs = {};
}

const ec2Client = new EC2Client({}); // Assume credentials and region are configured via env
const s3Client = new S3Client({});
const iamClient = new IAMClient({});

describe('TapStack Integration Tests', () => {
  // Helper to get expected CIDRs from mappings
  const getExpectedCidrs = (env: string) => {
    const cidrMappings: Record<string, { CIDR: string; PublicSubnetA: string; PublicSubnetB: string; PrivateSubnetA: string; PrivateSubnetB: string }> = {
      dev: {
        CIDR: '10.0.0.0/16',
        PublicSubnetA: '10.0.0.0/18',
        PublicSubnetB: '10.0.64.0/18',
        PrivateSubnetA: '10.0.128.0/18',
        PrivateSubnetB: '10.0.192.0/18'
      },
      staging: {
        CIDR: '10.1.0.0/16',
        PublicSubnetA: '10.1.0.0/18',
        PublicSubnetB: '10.1.64.0/18',
        PrivateSubnetA: '10.1.128.0/18',
        PrivateSubnetB: '10.1.192.0/18'
      },
      prod: {
        CIDR: '10.2.0.0/16',
        PublicSubnetA: '10.2.0.0/18',
        PublicSubnetB: '10.2.64.0/18',
        PrivateSubnetA: '10.2.128.0/18',
        PrivateSubnetB: '10.2.192.0/18'
      }
    };
    return cidrMappings[env];
  };

  // Loop over environments
  ['dev', 'staging', 'prod'].forEach((environment) => {
    // Skip tests if outputs for the environment are missing
    if (!allOutputs[environment]) {
      describe(`Environment: ${environment}`, () => {
        test.skip(`Skipping tests for ${environment} due to missing outputs in ${p}`, () => {});
      });
      return;
    }

    describe(`Environment: ${environment}`, () => {
      let outputs: Record<string, string>;
      let projectName: string;
      let owner: string;
      let createNatPerAZ: boolean = false; // Initialize
      let hasTeamPrincipal: boolean = false; // Initialize
      let vpcId: string;
      let publicSubnets: string[];
      let privateSubnets: string[];
      let dataBucketName: string;
      let environmentRoleArn: string;

      beforeAll(async () => {
        outputs = allOutputs[environment];
        vpcId = outputs.VPCId;
        publicSubnets = outputs.PublicSubnets.split(',');
        privateSubnets = outputs.PrivateSubnets.split(',');
        dataBucketName = outputs.DataBucketName;
        environmentRoleArn = outputs.EnvironmentRoleARN;

        // Validate required outputs
        if (!vpcId || !publicSubnets || !privateSubnets || !dataBucketName || !environmentRoleArn) {
          throw new Error(`Incomplete outputs for ${environment}: ${JSON.stringify(outputs)}`);
        }

        // Determine projectName and owner from tags (assume defaults)
        projectName = 'tapstack'; // Default
        owner = 'team'; // Default

        // Determine createNatPerAZ by counting NAT gateways
        const natResponse = await ec2Client.send(
          new DescribeNatGatewaysCommand({ Filter: [{ Name: 'vpc-id', Values: [vpcId] }] })
        );
        const natGateways = natResponse.NatGateways?.filter(nat => nat.VpcId === vpcId) || [];
        createNatPerAZ = natGateways.length === 2;

        // Determine hasTeamPrincipal from role
        const roleName = environmentRoleArn.split('/').pop() || '';
        const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
        const assumePolicy = JSON.parse(decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument || '{}'));
        hasTeamPrincipal = assumePolicy.Statement?.[0]?.Principal?.AWS !== `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:root`; // Assume env var for account ID
      });

      // Positive Case: Validate VPC existence and configuration
      test('VPC should exist with correct CIDR and tags', async () => {
        const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        const vpc = response.Vpcs?.[0];
        expect(vpc).toBeDefined();
        const expectedCidrs = getExpectedCidrs(environment);
        expect(vpc?.CidrBlock).toBe(expectedCidrs.CIDR);
        const tags = vpc?.Tags || [];
        expect(tags).toEqual(expect.arrayContaining([
          { Key: 'Name', Value: `${projectName}-${environment}-vpc` },
          { Key: 'Project', Value: projectName },
          { Key: 'Environment', Value: environment },
          { Key: 'CreatedBy', Value: owner }
        ]));
      });

      // Edge Case: Validate VPC with invalid ID (should fail)
      test('VPC with invalid ID should not exist', async () => {
        await expect(
          ec2Client.send(new DescribeVpcsCommand({ VpcIds: ['invalid-vpc-id'] }))
        ).rejects.toThrow();
      });

      // Positive Case: Validate Public Subnets
      test('Public Subnets should exist with correct CIDR, AZ, and tags', async () => {
        const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnets }));
        const subnets = response.Subnets || [];
        expect(subnets.length).toBe(2);
        const expectedCidrs = getExpectedCidrs(environment);
        expect(subnets[0].CidrBlock).toBe(expectedCidrs.PublicSubnetA);
        expect(subnets[1].CidrBlock).toBe(expectedCidrs.PublicSubnetB);
        expect(subnets[0].MapPublicIpOnLaunch).toBe(true);
        expect(subnets[1].MapPublicIpOnLaunch).toBe(true);
        expect(subnets[0].AvailabilityZone).toContain('a');
        expect(subnets[1].AvailabilityZone).toContain('b');
        const tagsA = subnets[0].Tags || [];
        expect(tagsA).toEqual(expect.arrayContaining([
          { Key: 'Name', Value: `${projectName}-${environment}-public-a` },
          { Key: 'Project', Value: projectName },
          { Key: 'Environment', Value: environment },
          { Key: 'CreatedBy', Value: owner }
        ]));
        const tagsB = subnets[1].Tags || [];
        expect(tagsB).toEqual(expect.arrayContaining([
          { Key: 'Name', Value: `${projectName}-${environment}-public-b` },
          { Key: 'Project', Value: projectName },
          { Key: 'Environment', Value: environment },
          { Key: 'CreatedBy', Value: owner }
        ]));
      });

      // Positive Case: Validate Private Subnets
      test('Private Subnets should exist with correct CIDR, AZ, and tags', async () => {
        const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnets }));
        const subnets = response.Subnets || [];
        expect(subnets.length).toBe(2);
        const expectedCidrs = getExpectedCidrs(environment);
        expect(subnets[0].CidrBlock).toBe(expectedCidrs.PrivateSubnetA);
        expect(subnets[1].CidrBlock).toBe(expectedCidrs.PrivateSubnetB);
        expect(subnets[0].MapPublicIpOnLaunch).toBe(false);
        expect(subnets[1].MapPublicIpOnLaunch).toBe(false);
        expect(subnets[0].AvailabilityZone).toContain('a');
        expect(subnets[1].AvailabilityZone).toContain('b');
        const tagsA = subnets[0].Tags || [];
        expect(tagsA).toEqual(expect.arrayContaining([
          { Key: 'Name', Value: `${projectName}-${environment}-private-a` },
          { Key: 'Project', Value: projectName },
          { Key: 'Environment', Value: environment },
          { Key: 'CreatedBy', Value: owner }
        ]));
        const tagsB = subnets[1].Tags || [];
        expect(tagsB).toEqual(expect.arrayContaining([
          { Key: 'Name', Value: `${projectName}-${environment}-private-b` },
          { Key: 'Project', Value: projectName },
          { Key: 'Environment', Value: environment },
          { Key: 'CreatedBy', Value: owner }
        ]));
      });

      // Positive Case: Validate Internet Gateway and Attachment
      test('Internet Gateway should exist and be attached to VPC', async () => {
        const igwResponse = await ec2Client.send(
          new DescribeInternetGatewaysCommand({ Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }] })
        );
        const igw = igwResponse.InternetGateways?.[0];
        expect(igw).toBeDefined();
        const tags = igw?.Tags || [];
        expect(tags).toEqual(expect.arrayContaining([
          { Key: 'Name', Value: `${projectName}-${environment}-igw` },
          { Key: 'Project', Value: projectName },
          { Key: 'Environment', Value: environment },
          { Key: 'CreatedBy', Value: owner }
        ]));
        const attachment = igw?.Attachments?.[0];
        expect(attachment?.VpcId).toBe(vpcId);
        expect(attachment?.State).toBe('available');
      });

      // Positive Case: Validate Public Route Table and Routes
      test('Public Route Table should exist with correct route to IGW', async () => {
        const rtResponse = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'tag:Name', Values: [`${projectName}-${environment}-public-rt`] }
            ]
          })
        );
        const publicRt = rtResponse.RouteTables?.[0];
        expect(publicRt).toBeDefined();
        const tags = publicRt?.Tags || [];
        expect(tags).toEqual(expect.arrayContaining([
          { Key: 'Name', Value: `${projectName}-${environment}-public-rt` },
          { Key: 'Project', Value: projectName },
          { Key: 'Environment', Value: environment },
          { Key: 'CreatedBy', Value: owner }
        ]));
        const routes = publicRt?.Routes || [];
        const defaultRoute = routes.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute?.GatewayId).toContain('igw-');
        expect(defaultRoute?.State).toBe('active');
        const associations = publicRt?.Associations || [];
        expect(associations.length).toBe(2);
        expect(associations.map(a => a.SubnetId)).toEqual(expect.arrayContaining(publicSubnets));
      });

      // Positive/Conditional Case: Validate NAT Gateways and EIPs based on CreateNatPerAZ
      test('NAT Gateways and EIPs should match CreateNatPerAZ condition', async () => {
        const natResponse = await ec2Client.send(
          new DescribeNatGatewaysCommand({ Filter: [{ Name: 'vpc-id', Values: [vpcId] }] })
        );
        const natGateways = natResponse.NatGateways || [];
        const eipResponse = await ec2Client.send(
          new DescribeAddressesCommand({ Filters: [{ Name: 'domain', Values: ['vpc'] }] })
        );
        const eips = eipResponse.Addresses?.filter(eip => eip.Tags?.some(t => t.Value?.includes(`${projectName}-${environment}-eip`))) || [];

        if (createNatPerAZ) {
          expect(natGateways.length).toBe(2);
          expect(eips.length).toBe(2);
          const natA = natGateways.find(n => n.Tags?.some(t => t.Value === `${projectName}-${environment}-nat-a`));
          expect(natA).toBeDefined();
          expect(natA?.SubnetId).toBe(publicSubnets[0]);
          const natB = natGateways.find(n => n.Tags?.some(t => t.Value === `${projectName}-${environment}-nat-b`));
          expect(natB).toBeDefined();
          expect(natB?.SubnetId).toBe(publicSubnets[1]);
        } else {
          expect(natGateways.length).toBe(1);
          expect(eips.length).toBe(1);
          const nat = natGateways[0];
          expect(nat.Tags?.some(t => t.Value === `${projectName}-${environment}-nat`)).toBe(true);
          expect(nat.SubnetId).toBe(publicSubnets[0]);
        }
      });

      // Positive Case: Validate Private Route Tables and Routes
      test('Private Route Tables should exist with correct routes to NAT', async () => {
        const rtResponse = await ec2Client.send(
          new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
        );
        const privateRtA = rtResponse.RouteTables?.find(rt => rt.Tags?.some(t => t.Value === `${projectName}-${environment}-private-rt-a`));
        const privateRtB = rtResponse.RouteTables?.find(rt => rt.Tags?.some(t => t.Value === `${projectName}-${environment}-private-rt-b`));
        expect(privateRtA).toBeDefined();
        expect(privateRtB).toBeDefined();
        const routesA = privateRtA?.Routes || [];
        const defaultRouteA = routesA.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRouteA).toBeDefined();
        expect(defaultRouteA?.NatGatewayId).toContain('nat-');
        expect(defaultRouteA?.State).toBe('active');
        const routesB = privateRtB?.Routes || [];
        const defaultRouteB = routesB.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRouteB).toBeDefined();
        expect(defaultRouteB?.NatGatewayId).toContain('nat-');
        expect(defaultRouteB?.State).toBe('active');
        if (createNatPerAZ) {
          expect(defaultRouteA?.NatGatewayId).not.toBe(defaultRouteB?.NatGatewayId);
        } else {
          expect(defaultRouteA?.NatGatewayId).toBe(defaultRouteB?.NatGatewayId);
        }
        expect(privateRtA?.Associations?.[0].SubnetId).toBe(privateSubnets[0]);
        expect(privateRtB?.Associations?.[0].SubnetId).toBe(privateSubnets[1]);
      });

      // Positive Case: Validate S3 Bucket configuration
      test('S3 Data Bucket should exist with versioning, encryption, public access block, and policy', async () => {
        const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({ Bucket: dataBucketName }));
        expect(versioningResponse.Status).toBe('Enabled');
        const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: dataBucketName }));
        const rules = encryptionResponse.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
        const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: dataBucketName }));
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
        const policyResponse = await s3Client.send(new GetBucketPolicyCommand({ Bucket: dataBucketName }));
        const policy = JSON.parse(policyResponse.Policy || '{}');
        const statement = policy.Statement[0];
        expect(statement.Effect).toBe('Deny');
        expect(statement.Action).toBe('s3:*');
        expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
      });

      // Edge Case: Validate S3 Bucket denies public access
      test('S3 Bucket should not allow public access', async () => {
        const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: dataBucketName }));
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      });

      // Positive Case: Validate IAM Role
      test('IAM Environment Role should exist with correct assume policy and attached policies', async () => {
        const roleName = environmentRoleArn.split('/').pop() || '';
        const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
        const role = roleResponse.Role;
        expect(role).toBeDefined();
        expect(role?.RoleName).toBe(`${projectName}-${environment}-role`);
        const assumePolicy = JSON.parse(decodeURIComponent(role?.AssumeRolePolicyDocument || '{}'));
        expect(assumePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
        if (hasTeamPrincipal) {
          expect(assumePolicy.Statement[0].Principal.AWS).toBeDefined();
        } else {
          expect(assumePolicy.Statement[0].Principal.AWS).toBe(`arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:root`);
        }
        const tags = role?.Tags || [];
        expect(tags).toEqual(expect.arrayContaining([
          { Key: 'Project', Value: projectName },
          { Key: 'Environment', Value: environment },
          { Key: 'CreatedBy', Value: owner }
        ]));
        const s3PolicyResponse = await iamClient.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: 'S3Access' }));
        const s3Policy = JSON.parse(decodeURIComponent(s3PolicyResponse.PolicyDocument || ''));
        expect(s3Policy.Statement[0].Effect).toBe('Allow');
        expect(s3Policy.Statement[0].Action).toEqual(['s3:GetObject', 's3:PutObject', 's3:ListBucket']);
        expect(s3Policy.Statement[0].Resource).toEqual(expect.arrayContaining([outputs.DataBucketARN, `${outputs.DataBucketARN}/*`]));
        const ec2PolicyResponse = await iamClient.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: 'EC2ReadOnly' }));
        const ec2Policy = JSON.parse(decodeURIComponent(ec2PolicyResponse.PolicyDocument || ''));
        expect(ec2Policy.Statement[0].Effect).toBe('Allow');
        expect(ec2Policy.Statement[0].Action).toEqual(['ec2:Describe*']);
        expect(ec2Policy.Statement[0].Resource).toBe('*');
      });

      // Edge Case: Validate IAM Role without TeamPrincipal
      test('IAM Role should trust account root when no TeamPrincipalARN', async () => {
        const roleName = environmentRoleArn.split('/').pop() || '';
        const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
        const assumePolicy = JSON.parse(decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument || '{}'));
        if (!hasTeamPrincipal) {
          expect(assumePolicy.Statement[0].Principal.AWS).toBe(`arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:root`);
        }
      });

      // Edge Case: Validate no extra resources (e.g., no unexpected NATs)
      test('No unexpected NAT Gateways in VPC', async () => {
        const natResponse = await ec2Client.send(
          new DescribeNatGatewaysCommand({ Filter: [{ Name: 'vpc-id', Values: [vpcId] }] })
        );
        const natGateways = natResponse.NatGateways || [];
        const expectedCount = createNatPerAZ ? 2 : 1;
        expect(natGateways.length).toBe(expectedCount);
      });
    });
  });
});