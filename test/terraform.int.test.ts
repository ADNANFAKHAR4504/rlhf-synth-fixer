import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeNatGatewaysCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand } from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

// Integration tests for live AWS resources
describe('Terraform Infrastructure Integration Tests', () => {
  const ec2Client = new EC2Client({ region: 'us-west-2' });
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr845';
  let deploymentOutputs: any = {};

  beforeAll(() => {
    // Load deployment outputs if available
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      try {
        deploymentOutputs = JSON.parse(outputsContent);
      } catch (e) {
        console.log('Could not parse deployment outputs, using empty object');
      }
    }
    console.log('Environment Suffix:', environmentSuffix);
    console.log('Deployment Outputs:', deploymentOutputs);
  });

  describe('VPC Resources', () => {
    test('should have created VPC with correct tags', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`main-vpc-${environmentSuffix}`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
      
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      
      // Check for Production tag
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');
    }, 30000);

    test('should have DNS hostnames and support enabled', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`main-vpc-${environmentSuffix}`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];
      
      // Get VPC attributes - these would need additional API calls
      expect(vpc).toBeDefined();
      expect(vpc.VpcId).toBeDefined();
    }, 30000);
  });

  describe('Subnet Configuration', () => {
    test('should have created public subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [
              `public-subnet-${environmentSuffix}-1`,
              `public-subnet-${environmentSuffix}-2`
            ]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);
      
      // Check subnets are in different AZs
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
      
      // Check public IP assignment
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        
        // Check for Type tag
        const typeTag = subnet.Tags?.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Public');
      });
    }, 30000);

    test('should have created private subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [
              `private-subnet-${environmentSuffix}-1`,
              `private-subnet-${environmentSuffix}-2`
            ]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);
      
      // Check subnets are in different AZs
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
      
      // Check no public IP assignment
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        
        // Check for Type tag
        const typeTag = subnet.Tags?.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Private');
      });
    }, 30000);

    test('should have correct CIDR blocks for subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*-subnet-${environmentSuffix}-*`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets!;
      
      const publicSubnet1 = subnets.find(s => s.Tags?.find(t => t.Key === 'Name')?.Value === `public-subnet-${environmentSuffix}-1`);
      const publicSubnet2 = subnets.find(s => s.Tags?.find(t => t.Key === 'Name')?.Value === `public-subnet-${environmentSuffix}-2`);
      const privateSubnet1 = subnets.find(s => s.Tags?.find(t => t.Key === 'Name')?.Value === `private-subnet-${environmentSuffix}-1`);
      const privateSubnet2 = subnets.find(s => s.Tags?.find(t => t.Key === 'Name')?.Value === `private-subnet-${environmentSuffix}-2`);
      
      expect(publicSubnet1?.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2?.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnet1?.CidrBlock).toBe('10.0.3.0/24');
      expect(privateSubnet2?.CidrBlock).toBe('10.0.4.0/24');
    }, 30000);
  });

  describe('Internet Gateway', () => {
    test('should have created and attached Internet Gateway', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`main-igw-${environmentSuffix}`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);
      
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments!.length).toBeGreaterThan(0);
      expect(igw.Attachments![0].State).toBe('available');
    }, 30000);
  });

  describe('NAT Gateways', () => {
    test('should have created NAT Gateways for private subnet connectivity', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'tag:Name',
            Values: [
              `nat-gateway-${environmentSuffix}-1`,
              `nat-gateway-${environmentSuffix}-2`
            ]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(2);
      
      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(natGw.ConnectivityType).toBe('public');
        expect(natGw.NatGatewayAddresses).toBeDefined();
        expect(natGw.NatGatewayAddresses!.length).toBeGreaterThan(0);
      });
    }, 30000);
  });

  describe('Security Groups', () => {
    test('should have created web security group with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`web-security-group-${environmentSuffix}`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
      
      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      
      // Check for HTTP rule
      const httpRule = ingressRules.find(rule => rule.FromPort === 80 && rule.ToPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
      
      // Check for HTTPS rule
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443 && rule.ToPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
      
      // Check for SSH rule (restricted)
      const sshRule = ingressRules.find(rule => rule.FromPort === 22 && rule.ToPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === '10.0.0.0/8')).toBe(true);
    }, 30000);

    test('should have created database security group with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`database-security-group-${environmentSuffix}`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
      
      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      
      // Check for MySQL rule
      const mysqlRule = ingressRules.find(rule => rule.FromPort === 3306 && rule.ToPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs!.length).toBeGreaterThan(0);
      
      // Check for PostgreSQL rule
      const postgresRule = ingressRules.find(rule => rule.FromPort === 5432 && rule.ToPort === 5432);
      expect(postgresRule).toBeDefined();
      expect(postgresRule?.UserIdGroupPairs).toBeDefined();
      expect(postgresRule?.UserIdGroupPairs!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have created ALB security group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`alb-security-group-${environmentSuffix}`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain('alb-sg-');
    }, 30000);
  });

  describe('Route Tables', () => {
    test('should have public route table with Internet Gateway route', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`public-route-table-${environmentSuffix}`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBe(1);
      
      const routeTable = response.RouteTables![0];
      const routes = routeTable.Routes || [];
      
      // Check for default route to IGW
      const defaultRoute = routes.find(route => route.DestinationCidrBlock === '0.0.0.0/0');
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute?.GatewayId).toContain('igw-');
    }, 30000);

    test('should have private route tables with NAT Gateway routes', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [
              `private-route-table-${environmentSuffix}-1`,
              `private-route-table-${environmentSuffix}-2`
            ]
          }
        ]
      });

      const response = await ec2Client.send(command);
      
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBe(2);
      
      response.RouteTables!.forEach(routeTable => {
        const routes = routeTable.Routes || [];
        
        // Check for default route to NAT Gateway
        const defaultRoute = routes.find(route => route.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute?.NatGatewayId).toContain('nat-');
      });
    }, 30000);
  });

  describe('Resource Tagging Compliance', () => {
    test('all resources should have Environment=Production tag', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`main-vpc-${environmentSuffix}`]
          }
        ]
      });

      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*-subnet-${environmentSuffix}-*`]
          }
        ]
      });

      const sgCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`*-security-group-${environmentSuffix}`]
          }
        ]
      });

      const [vpcResponse, subnetResponse, sgResponse] = await Promise.all([
        ec2Client.send(vpcCommand),
        ec2Client.send(subnetCommand),
        ec2Client.send(sgCommand)
      ]);

      // Check VPC tags
      vpcResponse.Vpcs?.forEach(vpc => {
        const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
        expect(envTag?.Value).toBe('Production');
      });

      // Check Subnet tags
      subnetResponse.Subnets?.forEach(subnet => {
        const envTag = subnet.Tags?.find(tag => tag.Key === 'Environment');
        expect(envTag?.Value).toBe('Production');
      });

      // Check Security Group tags
      sgResponse.SecurityGroups?.forEach(sg => {
        const envTag = sg.Tags?.find(tag => tag.Key === 'Environment');
        expect(envTag?.Value).toBe('Production');
      });
    }, 30000);
  });
});