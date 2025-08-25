import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand
} from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

interface RegionOutputs {
  vpc_id: string;
  vpc_cidr_block: string;
  public_subnet_ids: string[];
  private_subnet_ids: string[];
  public_security_group_id: string;
  private_security_group_id: string;
  availability_zones: string[];
}

interface TerraformOutputs {
  us_east_1?: RegionOutputs;
  eu_central_1?: RegionOutputs;
  ap_southeast_2?: RegionOutputs;
  summary?: {
    total_vpcs: number;
    regions_deployed: string[];
  };
  [key: string]: any; // Allow dynamic access while maintaining type safety for known properties
}

describe('Multi-Region VPC Infrastructure Integration Tests', () => {
  let outputs: TerraformOutputs | null = null;
  const regions = ['us-east-1', 'eu-central-1', 'ap-southeast-2'];

  beforeAll(async () => {
    // Try to load outputs from deployment
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      // Try to get outputs from terraform directly
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const { stdout } = await execAsync('terraform -chdir=lib output -json');
        if (stdout && stdout.trim()) {
          outputs = JSON.parse(stdout);
        }
      } catch (error) {
        console.warn('Could not load terraform outputs. Deployment may not be complete.');
      }
    }
  });

  describe('Infrastructure Deployment Validation', () => {
    test('deployment outputs should be available', () => {
      // If outputs are not available, this test will fail and indicate that deployment is needed
      expect(outputs).toBeDefined();
      expect(outputs).not.toBeNull();
      if (!outputs) {
        throw new Error('Terraform outputs not available. Please run terraform apply first.');
      }
    });

    test.each(regions)('should have valid VPC in region %s', (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }
      
      const regionKey = region.replace(/-/g, '_');
      expect(outputs[regionKey]).toBeDefined();
      expect(outputs[regionKey].vpc_id).toBeDefined();
      expect(outputs[regionKey].vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test.each(regions)('should have correct VPC CIDR blocks in region %s', (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      const expectedCidrs: Record<string, string> = {
        'us_east_1': '10.0.0.0/16',
        'eu_central_1': '10.1.0.0/16',
        'ap_southeast_2': '10.2.0.0/16'
      };
      
      expect(outputs[regionKey]?.vpc_cidr_block).toBe(expectedCidrs[regionKey]);
    });

    test.each(regions)('should have public and private subnets in region %s', (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      expect(outputs[regionKey].public_subnet_ids).toBeDefined();
      expect(outputs[regionKey].private_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs[regionKey].public_subnet_ids)).toBe(true);
      expect(Array.isArray(outputs[regionKey].private_subnet_ids)).toBe(true);
      expect(outputs[regionKey].public_subnet_ids.length).toBeGreaterThan(0);
      expect(outputs[regionKey].private_subnet_ids.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Resource Validation', () => {
    test.each(regions)('VPC should exist and be in available state in region %s', async (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      const vpcId = outputs[regionKey].vpc_id;
      
      const ec2Client = new EC2Client({ region });
      
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBeDefined();
    });

    test.each(regions)('public subnets should be configured correctly in region %s', async (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      const publicSubnetIds = outputs[regionKey].public_subnet_ids;
      
      const ec2Client = new EC2Client({ region });
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(publicSubnetIds.length);
      
      // All public subnets should have map_public_ip_on_launch = true
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });
    });

    test.each(regions)('private subnets should be configured correctly in region %s', async (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      const privateSubnetIds = outputs[regionKey].private_subnet_ids;
      
      const ec2Client = new EC2Client({ region });
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(privateSubnetIds.length);
      
      // All private subnets should have map_public_ip_on_launch = false
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });
    });

    test.each(regions)('internet gateway should exist and be attached in region %s', async (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      const vpcId = outputs[regionKey].vpc_id;
      
      const ec2Client = new EC2Client({ region });
      
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);
      expect(response.InternetGateways![0].Attachments![0].State).toBe('available');
    });

    test.each(regions)('public security group should have correct rules in region %s', async (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      const publicSgId = outputs[regionKey].public_security_group_id;
      
      const ec2Client = new EC2Client({ region });
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [publicSgId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
      
      const sg = response.SecurityGroups![0];
      
      // Check for HTTP (port 80) and HTTPS (port 443) ingress rules
      const httpRule = sg.IpPermissions!.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );
      const httpsRule = sg.IpPermissions!.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      );
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule!.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
      expect(httpsRule!.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
    });

    test.each(regions)('private security group should allow VPC internal traffic in region %s', async (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      const privateSgId = outputs[regionKey].private_security_group_id;
      const vpcCidr = outputs[regionKey].vpc_cidr_block;
      
      const ec2Client = new EC2Client({ region });
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [privateSgId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
      
      const sg = response.SecurityGroups![0];
      
      // Check for rule allowing all traffic from VPC CIDR
      const vpcRule = sg.IpPermissions!.find(rule => 
        rule.IpProtocol === '-1' && 
        rule.IpRanges!.some(range => range.CidrIp === vpcCidr)
      );
      
      expect(vpcRule).toBeDefined();
    });
  });

  describe('Multi-AZ Configuration Validation', () => {
    test.each(regions)('should use multiple availability zones in region %s', async (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      const availabilityZones = outputs[regionKey].availability_zones;
      
      expect(Array.isArray(availabilityZones)).toBe(true);
      expect(availabilityZones.length).toBeGreaterThanOrEqual(2);
      
      // Verify AZs are unique
      const uniqueAzs = new Set(availabilityZones);
      expect(uniqueAzs.size).toBe(availabilityZones.length);
    });

    test.each(regions)('subnets should be distributed across multiple AZs in region %s', async (region) => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const regionKey = region.replace(/-/g, '_');
      const publicSubnetIds = outputs[regionKey].public_subnet_ids;
      const privateSubnetIds = outputs[regionKey].private_subnet_ids;
      
      const ec2Client = new EC2Client({ region });
      
      // Check public subnets
      const publicCommand = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      });
      const publicResponse = await ec2Client.send(publicCommand);
      const publicAzs = publicResponse.Subnets!.map(subnet => subnet.AvailabilityZone);
      
      // Check private subnets
      const privateCommand = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      });
      const privateResponse = await ec2Client.send(privateCommand);
      const privateAzs = privateResponse.Subnets!.map(subnet => subnet.AvailabilityZone);
      
      // Should have at least 2 AZs represented
      expect(new Set(publicAzs).size).toBeGreaterThanOrEqual(2);
      expect(new Set(privateAzs).size).toBeGreaterThanOrEqual(2);
      
      // Public and private subnets should use the same AZs
      expect(new Set(publicAzs)).toEqual(new Set(privateAzs));
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('should have deployed infrastructure in exactly 3 regions', () => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      const expectedRegions = ['us_east_1', 'eu_central_1', 'ap_southeast_2'];
      expectedRegions.forEach(region => {
        expect(outputs![region]).toBeDefined();
      });

      expect(outputs.summary).toBeDefined();
      if (outputs.summary) {
        expect(outputs.summary.total_vpcs).toBe(3);
        expect(outputs.summary.regions_deployed).toContain('us-east-1');
        expect(outputs.summary.regions_deployed).toContain('eu-central-1');
        expect(outputs.summary.regions_deployed).toContain('ap-southeast-2');
      }
    });

    test('CIDR blocks should not overlap between regions', () => {
      if (!outputs) {
        expect(outputs).toBeDefined();
        return;
      }

      if (!outputs.us_east_1 || !outputs.eu_central_1 || !outputs.ap_southeast_2) {
        expect(outputs.us_east_1).toBeDefined();
        expect(outputs.eu_central_1).toBeDefined();
        expect(outputs.ap_southeast_2).toBeDefined();
        return;
      }

      const cidrs = [
        outputs.us_east_1.vpc_cidr_block,
        outputs.eu_central_1.vpc_cidr_block,
        outputs.ap_southeast_2.vpc_cidr_block
      ];

      // Verify all CIDRs are different
      const uniqueCidrs = new Set(cidrs);
      expect(uniqueCidrs.size).toBe(3);

      // Verify expected CIDR ranges
      expect(cidrs).toContain('10.0.0.0/16');
      expect(cidrs).toContain('10.1.0.0/16');
      expect(cidrs).toContain('10.2.0.0/16');
    });
  });
});
