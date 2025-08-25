import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: any;
  const ec2Client = new EC2Client({ region: 'us-east-1' });
  const s3Client = new S3Client({ region: 'us-east-1' });

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found. Please deploy infrastructure first using: cd lib && terraform apply');
    }
    
    const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    
    // Handle potential string arrays by parsing them if they're stringified JSON
    outputs = {};
    for (const [key, value] of Object.entries(rawOutputs)) {
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          outputs[key] = JSON.parse(value);
        } catch (e) {
          outputs[key] = value;
        }
      } else {
        outputs[key] = value;
      }
    }
  });

  describe('VPC and Networking', () => {
    test('should have created VPC with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      
      // Check tags
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      // VPC name should contain the project name, and may contain environment suffix
      expect(nameTag?.Value).toMatch(/(secure-infrastructure|trainr840|synthtrainr840)/);
    });

    test('should have created public subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids,
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      
      const availabilityZones = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(2);
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('should have created private subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnet_ids,
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      
      const availabilityZones = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(2);
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('should have created Internet Gateway', async () => {
      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.internet_gateway_id],
      });
      const response = await ec2Client.send(command);
      
      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('should have created NAT Gateway with Elastic IP', async () => {
      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id],
      });
      const response = await ec2Client.send(command);
      
      expect(response.NatGateways).toHaveLength(1);
      const natGateway = response.NatGateways![0];
      
      expect(natGateway.State).toBe('available');
      expect(natGateway.VpcId).toBe(outputs.vpc_id);
      expect(natGateway.SubnetId).toBe(outputs.public_subnet_ids[0]);
      expect(natGateway.NatGatewayAddresses).toHaveLength(1);
      expect(natGateway.NatGatewayAddresses![0].PublicIp).toBe(outputs.nat_gateway_ip);
    });

    test('should have proper route tables configured', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
        ],
      });
      const response = await ec2Client.send(command);
      
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);
      
      // Check for routes to Internet Gateway and NAT Gateway
      const hasInternetRoute = response.RouteTables!.some(rt =>
        rt.Routes?.some(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' &&
          route.GatewayId === outputs.internet_gateway_id
        )
      );
      
      const hasNatRoute = response.RouteTables!.some(rt =>
        rt.Routes?.some(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' &&
          route.NatGatewayId === outputs.nat_gateway_id
        )
      );
      
      expect(hasInternetRoute).toBe(true);
      expect(hasNatRoute).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    test('should have SSH security group with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ssh_security_group_id],
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      
      // Check ingress rules
      const sshIngress = sg.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshIngress).toBeDefined();
      expect(sshIngress!.IpProtocol).toBe('tcp');
      expect(sshIngress!.IpRanges).toHaveLength(1);
      expect(sshIngress!.IpRanges![0].CidrIp).toBe('192.168.1.0/24');
      
      // Check egress rules
      const allEgress = sg.IpPermissionsEgress?.find(rule =>
        rule.IpProtocol === '-1'
      );
      expect(allEgress).toBeDefined();
      expect(allEgress!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have S3 VPC Gateway Endpoint', async () => {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [outputs.s3_vpc_endpoint_id],
      });
      const response = await ec2Client.send(command);
      
      expect(response.VpcEndpoints).toHaveLength(1);
      const endpoint = response.VpcEndpoints![0];
      
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.ServiceName).toContain('s3');
      expect(endpoint.VpcId).toBe(outputs.vpc_id);
      expect(endpoint.State).toBe('available');
      expect(endpoint.RouteTableIds).toBeDefined();
      expect(endpoint.RouteTableIds!.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have S3 bucket with versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('should have S3 bucket with AES256 encryption', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      expect(rule.BucketKeyEnabled).toBe(true);
    });

    test('should have S3 bucket with public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy enforcing encryption', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const response = await s3Client.send(command);
      
      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);
      
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);
      
      // Check for deny insecure connections
      const denyInsecure = policy.Statement.find((s: any) =>
        s.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
      
      // Check for deny unencrypted uploads
      const denyUnencrypted = policy.Statement.find((s: any) =>
        s.Sid === 'DenyUnencryptedUploads'
      );
      expect(denyUnencrypted).toBeDefined();
      expect(denyUnencrypted.Effect).toBe('Deny');
    });
  });

  describe('Resource Tagging', () => {
    test('should have Production environment tags on VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await ec2Client.send(command);
      
      const vpc = response.Vpcs![0];
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      const managedByTag = vpc.Tags?.find(tag => tag.Key === 'ManagedBy');
      const projectTag = vpc.Tags?.find(tag => tag.Key === 'Project');
      const suffixTag = vpc.Tags?.find(tag => tag.Key === 'EnvironmentSuffix');
      
      expect(envTag?.Value).toBe('Production');
      expect(managedByTag?.Value).toBe('Terraform');
      expect(projectTag?.Value).toBe('secure-infrastructure');
      // Environment suffix could be 'synthtrainr840', 'trainr840', or 'default' depending on deployment
      expect(['synthtrainr840', 'trainr840', 'default']).toContain(suffixTag?.Value);
    });

    test('should have consistent tagging across subnets', async () => {
      const allSubnetIds = [...outputs.public_subnet_ids, ...outputs.private_subnet_ids];
      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);
      
      response.Subnets!.forEach(subnet => {
        const envTag = subnet.Tags?.find(tag => tag.Key === 'Environment');
        const managedByTag = subnet.Tags?.find(tag => tag.Key === 'ManagedBy');
        
        expect(envTag?.Value).toBe('Production');
        expect(managedByTag?.Value).toBe('Terraform');
      });
    });
  });

  describe('Infrastructure Requirements Validation', () => {
    test('should meet multi-AZ requirement', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [...outputs.public_subnet_ids, ...outputs.private_subnet_ids],
      });
      const response = await ec2Client.send(command);
      
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
      expect(azs.has('us-east-1a')).toBe(true);
      expect(azs.has('us-east-1b')).toBe(true);
    });

    test('should provide NAT Gateway for private subnet internet access', async () => {
      const natCommand = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.nat_gateway_id],
      });
      const natResponse = await ec2Client.send(natCommand);
      
      expect(natResponse.NatGateways![0].State).toBe('available');
      
      // Verify NAT Gateway is in a public subnet
      const publicSubnetIds = outputs.public_subnet_ids;
      expect(publicSubnetIds).toContain(natResponse.NatGateways![0].SubnetId);
    });

    test('should enforce S3 encryption requirements', async () => {
      // Check encryption configuration
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      
      // Check bucket policy
      const policyCommand = new GetBucketPolicyCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const policyResponse = await s3Client.send(policyCommand);
      const policy = JSON.parse(policyResponse.Policy!);
      
      const hasDenyUnencrypted = policy.Statement.some((s: any) =>
        s.Sid === 'DenyUnencryptedUploads' && s.Effect === 'Deny'
      );
      expect(hasDenyUnencrypted).toBe(true);
    });

    test('should restrict SSH access to specified CIDR', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ssh_security_group_id],
      });
      const response = await ec2Client.send(command);
      
      const sg = response.SecurityGroups![0];
      const sshRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22
      );
      
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges![0].CidrIp).toBe('192.168.1.0/24');
      // Ensure no other SSH access is allowed
      expect(sshRule!.IpRanges).toHaveLength(1);
    });

    test('should have Production environment tagging', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      
      const envTag = vpcResponse.Vpcs![0].Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    });
  });

  describe('Enhanced Security Features', () => {
    test('should have S3 VPC endpoint properly configured', async () => {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [outputs.s3_vpc_endpoint_id],
      });
      const response = await ec2Client.send(command);
      
      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.PolicyDocument).toBeDefined();
      
      // Verify endpoint is associated with route tables
      expect(endpoint.RouteTableIds).toBeDefined();
      expect(endpoint.RouteTableIds!.length).toBeGreaterThan(0);
    });

    test('should have comprehensive S3 security configuration', async () => {
      // Test versioning
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
      
      // Test public access block
      const publicBlockCommand = new GetPublicAccessBlockCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const publicBlockResponse = await s3Client.send(publicBlockCommand);
      const publicBlock = publicBlockResponse.PublicAccessBlockConfiguration!;
      expect(publicBlock.BlockPublicAcls).toBe(true);
      expect(publicBlock.BlockPublicPolicy).toBe(true);
      expect(publicBlock.IgnorePublicAcls).toBe(true);
      expect(publicBlock.RestrictPublicBuckets).toBe(true);
      
      // Test policy for secure transport
      const policyCommand = new GetBucketPolicyCommand({
        Bucket: outputs.s3_bucket_name,
      });
      const policyResponse = await s3Client.send(policyCommand);
      expect(policyResponse.Policy).toContain('aws:SecureTransport');
    });
  });

  describe('Output Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_cidr).toBe('10.0.0.0/16');
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(outputs.public_subnet_ids).toHaveLength(2);
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.private_subnet_ids).toHaveLength(2);
      expect(outputs.internet_gateway_id).toBeDefined();
      expect(outputs.nat_gateway_id).toBeDefined();
      expect(outputs.nat_gateway_ip).toBeDefined();
      expect(outputs.ssh_security_group_id).toBeDefined();
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(outputs.s3_bucket_arn).toBeDefined();
      expect(outputs.s3_vpc_endpoint_id).toBeDefined();
    });

    test('should have valid AWS resource IDs', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.internet_gateway_id).toMatch(/^igw-[a-f0-9]+$/);
      expect(outputs.nat_gateway_id).toMatch(/^nat-[a-f0-9]+$/);
      expect(outputs.ssh_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
      expect(outputs.s3_bucket_arn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.s3_vpc_endpoint_id).toMatch(/^vpce-[a-f0-9]+$/);
    });
  });
});