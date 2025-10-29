/**
 * Terraform Integration Tests for Three-Tier VPC Architecture
 * 
 * Tests real AWS resources deployed via Terraform.
 * Uses cfn-outputs/flat-outputs.json for dynamic resource references.
 * No mocking - validates actual AWS SDK calls and resource interactions.
 */

import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const TEST_TIMEOUT = 90000; // 90 seconds
let deployedResources: any = {};
let awsRegion: string = 'us-west-2';

// AWS SDK service clients
let ec2: AWS.EC2;
let rds: AWS.RDS;

describe('Terraform Integration Tests - Three-Tier VPC Architecture', () => {
  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      const rawOutputs = JSON.parse(outputsContent);
      
      // Parse Terraform tuple outputs into proper arrays
      deployedResources = {
        vpc_id: rawOutputs.vpc_id,
        internet_gateway_id: rawOutputs.internet_gateway_id,
        db_subnet_group_name: rawOutputs.db_subnet_group_name,
        // Convert tuples to arrays
        public_subnet_ids: Array.isArray(rawOutputs.public_subnet_ids) 
          ? rawOutputs.public_subnet_ids 
          : JSON.parse(rawOutputs.public_subnet_ids || '[]'),
        private_subnet_ids: Array.isArray(rawOutputs.private_subnet_ids)
          ? rawOutputs.private_subnet_ids
          : JSON.parse(rawOutputs.private_subnet_ids || '[]'),
        database_subnet_ids: Array.isArray(rawOutputs.database_subnet_ids)
          ? rawOutputs.database_subnet_ids
          : JSON.parse(rawOutputs.database_subnet_ids || '[]'),
        nat_gateway_ids: Array.isArray(rawOutputs.nat_gateway_ids)
          ? rawOutputs.nat_gateway_ids
          : JSON.parse(rawOutputs.nat_gateway_ids || '[]')
      };
      
      console.log('✓ Loaded deployed resources from outputs');
    } else {
      console.warn('⚠ No cfn-outputs/flat-outputs.json found');
      throw new Error('Missing outputs file');
    }
    
    AWS.config.update({ region: awsRegion });
    console.log(`✓ AWS SDK configured for region: ${awsRegion}`);
    
    ec2 = new AWS.EC2();
    rds = new AWS.RDS();
    console.log('✓ AWS service clients initialized');
  });

  describe('Output Validation Tests', () => {
    test('should have all required outputs defined', () => {
      expect(deployedResources).toBeDefined();
      console.log('✓ Deployed Resources:', Object.keys(deployedResources));
    });

    test('should have VPC ID output', () => {
      expect(deployedResources.vpc_id).toBeDefined();
      expect(typeof deployedResources.vpc_id).toBe('string');
      expect(deployedResources.vpc_id).toMatch(/^vpc-/);
      console.log('✓ VPC ID:', deployedResources.vpc_id);
    });

    test('should have 3 public subnet IDs', () => {
      expect(deployedResources.public_subnet_ids).toBeDefined();
      expect(Array.isArray(deployedResources.public_subnet_ids)).toBe(true);
      expect(deployedResources.public_subnet_ids.length).toBe(3);
      deployedResources.public_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-/);
      });
      console.log('✓ Public Subnets:', deployedResources.public_subnet_ids);
    });

    test('should have 3 private subnet IDs', () => {
      expect(deployedResources.private_subnet_ids).toBeDefined();
      expect(Array.isArray(deployedResources.private_subnet_ids)).toBe(true);
      expect(deployedResources.private_subnet_ids.length).toBe(3);
      console.log('✓ Private Subnets:', deployedResources.private_subnet_ids);
    });

    test('should have 3 database subnet IDs', () => {
      expect(deployedResources.database_subnet_ids).toBeDefined();
      expect(Array.isArray(deployedResources.database_subnet_ids)).toBe(true);
      expect(deployedResources.database_subnet_ids.length).toBe(3);
      console.log('✓ Database Subnets:', deployedResources.database_subnet_ids);
    });

    test('should have Internet Gateway ID', () => {
      expect(deployedResources.internet_gateway_id).toBeDefined();
      expect(deployedResources.internet_gateway_id).toMatch(/^igw-/);
      console.log('✓ Internet Gateway:', deployedResources.internet_gateway_id);
    });

    test('should have 3 NAT Gateway IDs', () => {
      expect(deployedResources.nat_gateway_ids).toBeDefined();
      expect(Array.isArray(deployedResources.nat_gateway_ids)).toBe(true);
      expect(deployedResources.nat_gateway_ids.length).toBe(3);
      console.log('✓ NAT Gateways:', deployedResources.nat_gateway_ids);
    });

    test('should have DB subnet group name', () => {
      expect(deployedResources.db_subnet_group_name).toBeDefined();
      expect(deployedResources.db_subnet_group_name.length).toBeGreaterThan(0);
      console.log('✓ DB Subnet Group:', deployedResources.db_subnet_group_name);
    });
  });

  describe('VPC Resource Validation', () => {
    test('should verify VPC exists and is accessible', async () => {
      const response = await ec2.describeVpcs({
        VpcIds: [deployedResources.vpc_id]
      }).promise();
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      console.log('✓ VPC exists and is accessible');
    });

    test('should verify VPC uses 10.0.0.0/16 CIDR block', async () => {
      const response = await ec2.describeVpcs({
        VpcIds: [deployedResources.vpc_id]
      }).promise();
      
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      console.log('✓ VPC CIDR block verified: 10.0.0.0/16');
    });

    test('should verify VPC has DNS support enabled', async () => {
      const response = await ec2.describeVpcAttribute({
        VpcId: deployedResources.vpc_id,
        Attribute: 'enableDnsSupport'
      }).promise();
      
      expect(response.EnableDnsSupport?.Value).toBe(true);
      console.log('✓ DNS support enabled');
    });

    test('should verify VPC has DNS hostnames enabled', async () => {
      const response = await ec2.describeVpcAttribute({
        VpcId: deployedResources.vpc_id,
        Attribute: 'enableDnsHostnames'
      }).promise();
      
      expect(response.EnableDnsHostnames?.Value).toBe(true);
      console.log('✓ DNS hostnames enabled');
    });

    test('should verify VPC has proper tags', async () => {
      const response = await ec2.describeVpcs({
        VpcIds: [deployedResources.vpc_id]
      }).promise();
      
      const tags = response.Vpcs![0].Tags || [];
      const tagKeys = tags.map(tag => tag.Key);
      
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      console.log('✓ VPC has required tags');
    });
  });

  describe('Subnet Configuration Validation', () => {
    test('should verify all 9 subnets exist', async () => {
      const allSubnetIds = [
        ...deployedResources.public_subnet_ids,
        ...deployedResources.private_subnet_ids,
        ...deployedResources.database_subnet_ids
      ];
      
      const response = await ec2.describeSubnets({
        SubnetIds: allSubnetIds
      }).promise();
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(9);
      console.log('✓ All 9 subnets exist');
    });

    test('should verify subnets are distributed across 3 availability zones', async () => {
      const allSubnetIds = [
        ...deployedResources.public_subnet_ids,
        ...deployedResources.private_subnet_ids,
        ...deployedResources.database_subnet_ids
      ];
      
      const response = await ec2.describeSubnets({
        SubnetIds: allSubnetIds
      }).promise();
      
      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBe(3);
      console.log('✓ Subnets distributed across 3 AZs:', Array.from(azs));
    });

    test('should verify public subnets use correct CIDR blocks', async () => {
      const response = await ec2.describeSubnets({
        SubnetIds: deployedResources.public_subnet_ids
      }).promise();
      
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
      console.log('✓ Public subnet CIDRs verified');
    });

    test('should verify private subnets use correct CIDR blocks', async () => {
      const response = await ec2.describeSubnets({
        SubnetIds: deployedResources.private_subnet_ids
      }).promise();
      
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']);
      console.log('✓ Private subnet CIDRs verified');
    });

    test('should verify database subnets use correct CIDR blocks', async () => {
      const response = await ec2.describeSubnets({
        SubnetIds: deployedResources.database_subnet_ids
      }).promise();
      
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']);
      console.log('✓ Database subnet CIDRs verified');
    });

    test('should verify public subnets have auto-assign public IP enabled', async () => {
      const response = await ec2.describeSubnets({
        SubnetIds: deployedResources.public_subnet_ids
      }).promise();
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
      console.log('✓ Public subnets auto-assign public IPs');
    });
  });

  describe('Internet Gateway Validation', () => {
    test('should verify Internet Gateway exists', async () => {
      const response = await ec2.describeInternetGateways({
        InternetGatewayIds: [deployedResources.internet_gateway_id]
      }).promise();
      
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);
      console.log('✓ Internet Gateway exists');
    });

    test('should verify Internet Gateway is attached to VPC', async () => {
      const response = await ec2.describeInternetGateways({
        InternetGatewayIds: [deployedResources.internet_gateway_id]
      }).promise();
      
      const attachments = response.InternetGateways![0].Attachments || [];
      expect(attachments.length).toBe(1);
      expect(attachments[0].VpcId).toBe(deployedResources.vpc_id);
      expect(attachments[0].State).toBe('available');
      console.log('✓ Internet Gateway attached to VPC');
    });
  });

  describe('NAT Gateway Validation', () => {
    test('should verify all 3 NAT Gateways exist', async () => {
      const response = await ec2.describeNatGateways({
        NatGatewayIds: deployedResources.nat_gateway_ids
      }).promise();
      
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(3);
      console.log('✓ All 3 NAT Gateways exist');
    });

    test('should verify NAT Gateways are in available state', async () => {
      const response = await ec2.describeNatGateways({
        NatGatewayIds: deployedResources.nat_gateway_ids
      }).promise();
      
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
      console.log('✓ All NAT Gateways are available');
    });

    test('should verify NAT Gateways are in public subnets', async () => {
      const response = await ec2.describeNatGateways({
        NatGatewayIds: deployedResources.nat_gateway_ids
      }).promise();
      
      response.NatGateways!.forEach(nat => {
        expect(deployedResources.public_subnet_ids).toContain(nat.SubnetId);
      });
      console.log('✓ NAT Gateways are in public subnets');
    });
  });

  describe('DB Subnet Group Validation', () => {
    test('should verify DB subnet group exists', async () => {
      const response = await rds.describeDBSubnetGroups({
        DBSubnetGroupName: deployedResources.db_subnet_group_name
      }).promise();
      
      expect(response.DBSubnetGroups).toBeDefined();
      expect(response.DBSubnetGroups!.length).toBe(1);
      console.log('✓ DB subnet group exists');
    });

    test('should verify DB subnet group contains all 3 database subnets', async () => {
      const response = await rds.describeDBSubnetGroups({
        DBSubnetGroupName: deployedResources.db_subnet_group_name
      }).promise();
      
      const subnetGroup = response.DBSubnetGroups![0];
      const subnetIds = subnetGroup.Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
      
      expect(subnetIds.length).toBe(3);
      deployedResources.database_subnet_ids.forEach((id: string) => {
        expect(subnetIds).toContain(id);
      });
      console.log('✓ DB subnet group contains all database subnets');
    });

    test('should verify DB subnet group is in correct VPC', async () => {
      const response = await rds.describeDBSubnetGroups({
        DBSubnetGroupName: deployedResources.db_subnet_group_name
      }).promise();
      
      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.VpcId).toBe(deployedResources.vpc_id);
      console.log('✓ DB subnet group is in correct VPC');
    });
  });

  describe('Security Validation', () => {
    test('should verify VPC has proper compliance tags', async () => {
      const response = await ec2.describeVpcs({
        VpcIds: [deployedResources.vpc_id]
      }).promise();
      
      const tags = response.Vpcs![0].Tags || [];
      const tagMap: { [key: string]: string } = {};
      tags.forEach(tag => {
        if (tag.Key) tagMap[tag.Key] = tag.Value || '';
      });
      
      expect(tagMap['Environment']).toBeDefined();
      expect(tagMap['Project']).toBeDefined();
      expect(tagMap['ManagedBy']).toBe('Terraform');
      console.log('✓ VPC has proper compliance tags');
    });
  });
});
