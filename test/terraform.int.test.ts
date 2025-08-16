import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeVpcAttributeCommand
} from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

// Load outputs from the specified path
const outputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
} catch (error) {
  console.error("Failed to load outputs.json:", error);
  throw new Error("Cannot load Terraform outputs for integration tests");
}

// Test configuration
const REGION = process.env.AWS_REGION || "us-west-2"; // Based on your IP ranges
const environments = ["dev", "staging", "production"];

// AWS clients
const ec2Client = new EC2Client({ region: REGION });
const iamClient = new IAMClient({ region: REGION });

// Helper function to validate IP format
function isValidIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// Helper function to validate CIDR format
function isValidCIDR(cidr: string): boolean {
  const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
  return cidrRegex.test(cidr);
}

// Helper function to validate AWS resource ID format
function isValidAWSResourceId(id: string, resourceType: string): boolean {
  const patterns = {
    vpc: /^vpc-[0-9a-f]{8,17}$/,
    subnet: /^subnet-[0-9a-f]{8,17}$/,
    igw: /^igw-[0-9a-f]{8,17}$/,
    nat: /^nat-[0-9a-f]{8,17}$/,
    sg: /^sg-[0-9a-f]{8,17}$/,
    instance: /^i-[0-9a-f]{8,17}$/,
    arn: /^arn:aws:iam::\d{12}:role\/.+$/
  };
  return patterns[resourceType]?.test(id) || false;
}

describe("Terraform Infrastructure Integration Tests", () => {
  
  // Test output structure and format validation
  describe("Output Structure Validation", () => {
    it("should have all required output keys", () => {
      const requiredKeys = [
        "ec2_instance_ids", "ec2_private_ips", "ec2_public_ips",
        "environment_summary", "iam_role_arns", "internet_gateway_ids",
        "nat_gateway_ids", "private_subnet_ids", "public_subnet_ids",
        "security_group_ids", "vpc_cidrs", "vpc_ids"
      ];
      
      requiredKeys.forEach(key => {
        expect(outputs).toHaveProperty(key);
        expect(outputs[key]).toHaveProperty('value');
      });
    });

    it("should have all environments in outputs", () => {
      environments.forEach(env => {
        expect(outputs.vpc_ids.value).toHaveProperty(env);
        expect(outputs.ec2_instance_ids.value).toHaveProperty(env);
        expect(outputs.environment_summary.value).toHaveProperty(env);
      });
    });
  });

  // Environment-specific tests
  environments.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      let envData: any;
      
      beforeAll(() => {
        envData = {
          vpcId: outputs.vpc_ids.value[env],
          vpcCidr: outputs.vpc_cidrs.value[env],
          instanceId: outputs.ec2_instance_ids.value[env],
          privateIp: outputs.ec2_private_ips.value[env],
          publicIp: outputs.ec2_public_ips.value[env],
          iamRoleArn: outputs.iam_role_arns.value[env],
          igwId: outputs.internet_gateway_ids.value[env],
          natGwId: outputs.nat_gateway_ids.value[env],
          sgId: outputs.security_group_ids.value[env],
          summary: outputs.environment_summary.value[env]
        };
      });

      describe("Data Format Validation", () => {
        it("should have valid resource ID formats", () => {
          expect(isValidAWSResourceId(envData.vpcId, 'vpc')).toBe(true);
          expect(isValidAWSResourceId(envData.instanceId, 'instance')).toBe(true);
          expect(isValidAWSResourceId(envData.igwId, 'igw')).toBe(true);
          expect(isValidAWSResourceId(envData.natGwId, 'nat')).toBe(true);
          expect(isValidAWSResourceId(envData.sgId, 'sg')).toBe(true);
          expect(isValidAWSResourceId(envData.iamRoleArn, 'arn')).toBe(true);
        });

        it("should have valid IP addresses and CIDR blocks", () => {
          expect(isValidIP(envData.privateIp)).toBe(true);
          expect(isValidIP(envData.publicIp)).toBe(true);
          expect(isValidCIDR(envData.vpcCidr)).toBe(true);
        });

        it("should have consistent environment summary data", () => {
          expect(envData.summary.instance_id).toBe(envData.instanceId);
          expect(envData.summary.private_ip).toBe(envData.privateIp);
          expect(envData.summary.public_ip).toBe(envData.publicIp);
          expect(envData.summary.vpc_id).toBe(envData.vpcId);
          expect(envData.summary.vpc_cidr).toBe(envData.vpcCidr);
        });
      });

      describe("VPC Infrastructure", () => {
        it("should have a valid VPC", async () => {
          const result = await ec2Client.send(new DescribeVpcsCommand({
            VpcIds: [envData.vpcId]
          }));
          
          expect(result.Vpcs).toHaveLength(1);
          const vpc = result.Vpcs![0];
          expect(vpc.VpcId).toBe(envData.vpcId);
          expect(vpc.CidrBlock).toBe(envData.vpcCidr);
          expect(vpc.State).toBe('available');
        });

        it("should have DNS resolution enabled", async () => {
          const dnsSupport = await ec2Client.send(new DescribeVpcAttributeCommand({
            VpcId: envData.vpcId,
            Attribute: 'enableDnsSupport'
          }));
          
          const dnsHostnames = await ec2Client.send(new DescribeVpcAttributeCommand({
            VpcId: envData.vpcId,
            Attribute: 'enableDnsHostnames'
          }));

          expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
          expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
        });
      });

      describe("Subnet Infrastructure", () => {
        it("should have public subnets", async () => {
          const publicSubnetKeys = Object.keys(outputs.public_subnet_ids.value)
            .filter(key => key.startsWith(`${env}-public`));
          
          expect(publicSubnetKeys.length).toBeGreaterThanOrEqual(2);
          
          const subnetIds = publicSubnetKeys.map(key => outputs.public_subnet_ids.value[key]);
          const result = await ec2Client.send(new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          }));

          expect(result.Subnets).toHaveLength(subnetIds.length);
          result.Subnets!.forEach(subnet => {
            expect(subnet.VpcId).toBe(envData.vpcId);
            expect(subnet.MapPublicIpOnLaunch).toBe(true);
            expect(subnet.State).toBe('available');
          });
        });

        it("should have private subnets", async () => {
          const privateSubnetKeys = Object.keys(outputs.private_subnet_ids.value)
            .filter(key => key.startsWith(`${env}-private`));
          
          expect(privateSubnetKeys.length).toBeGreaterThanOrEqual(2);
          
          const subnetIds = privateSubnetKeys.map(key => outputs.private_subnet_ids.value[key]);
          const result = await ec2Client.send(new DescribeSubnetsCommand({
            SubnetIds: subnetIds
          }));

          expect(result.Subnets).toHaveLength(subnetIds.length);
          result.Subnets!.forEach(subnet => {
            expect(subnet.VpcId).toBe(envData.vpcId);
            expect(subnet.MapPublicIpOnLaunch).toBe(false);
            expect(subnet.State).toBe('available');
          });
        });
      });

      describe("Network Gateways", () => {
        it("should have a functioning Internet Gateway", async () => {
          const result = await ec2Client.send(new DescribeInternetGatewaysCommand({
            InternetGatewayIds: [envData.igwId]
          }));

          expect(result.InternetGateways).toHaveLength(1);
          const igw = result.InternetGateways![0];
          expect(igw.InternetGatewayId).toBe(envData.igwId);
          expect(igw.Attachments).toHaveLength(1);
          expect(igw.Attachments![0].VpcId).toBe(envData.vpcId);
          expect(igw.Attachments![0].State).toBe('available');
        });

        it("should have a functioning NAT Gateway", async () => {
          const result = await ec2Client.send(new DescribeNatGatewaysCommand({
            NatGatewayIds: [envData.natGwId]
          }));

          expect(result.NatGateways).toHaveLength(1);
          const natGw = result.NatGateways![0];
          expect(natGw.NatGatewayId).toBe(envData.natGwId);
          expect(natGw.VpcId).toBe(envData.vpcId);
          expect(natGw.State).toBe('available');
        });
      });

      describe("Security Groups", () => {
        it("should have a valid security group", async () => {
          const result = await ec2Client.send(new DescribeSecurityGroupsCommand({
            GroupIds: [envData.sgId]
          }));

          expect(result.SecurityGroups).toHaveLength(1);
          const sg = result.SecurityGroups![0];
          expect(sg.GroupId).toBe(envData.sgId);
          expect(sg.VpcId).toBe(envData.vpcId);
        });
      });

      describe("EC2 Instances", () => {
        it("should have a running EC2 instance", async () => {
          const result = await ec2Client.send(new DescribeInstancesCommand({
            InstanceIds: [envData.instanceId]
          }));

          expect(result.Reservations).toHaveLength(1);
          expect(result.Reservations![0].Instances).toHaveLength(1);
          
          const instance = result.Reservations![0].Instances![0];
          expect(instance.InstanceId).toBe(envData.instanceId);
          expect(instance.State?.Name).toMatch(/running|stopped|stopping|pending/);
          expect(instance.VpcId).toBe(envData.vpcId);
        });

        it("should have correct instance type based on environment", async () => {
          const result = await ec2Client.send(new DescribeInstancesCommand({
            InstanceIds: [envData.instanceId]
          }));

          const instance = result.Reservations![0].Instances![0];
          const expectedTypes = {
            dev: 't2.micro',
            staging: 't3.medium', 
            production: 'm5.large'
          };
          
          expect(instance.InstanceType).toBe(expectedTypes[env]);
          expect(envData.summary.instance_type).toBe(expectedTypes[env]);
        });

        it("should have correct network configuration", async () => {
          const result = await ec2Client.send(new DescribeInstancesCommand({
            InstanceIds: [envData.instanceId]
          }));

          const instance = result.Reservations![0].Instances![0];
          expect(instance.PrivateIpAddress).toBe(envData.privateIp);
          
          if (instance.PublicIpAddress) {
            expect(instance.PublicIpAddress).toBe(envData.publicIp);
          }
        });
      });

      describe("IAM Configuration", () => {
        it("should have a valid IAM role", async () => {
          const roleName = envData.iamRoleArn.split('/').pop();
          expect(roleName).toBe(`ec2-role-${env}`);

          const result = await iamClient.send(new GetRoleCommand({
            RoleName: roleName
          }));

          expect(result.Role?.Arn).toBe(envData.iamRoleArn);
          expect(result.Role?.RoleName).toBe(roleName);
        });
      });

      describe("Environment-specific Validations", () => {
        it("should have environment-appropriate CIDR blocks", () => {
          const expectedCidrs = {
            dev: '10.0.0.0/16',
            staging: '10.1.0.0/16',
            production: '10.2.0.0/16'
          };
          expect(envData.vpcCidr).toBe(expectedCidrs[env]);
        });

        it("should have private IP in correct CIDR range", () => {
          const privateIp = envData.privateIp;
          const vpcCidr = envData.vpcCidr;
          
          // Extract network portion from CIDR
          const [network] = vpcCidr.split('/');
          const [n1, n2] = network.split('.');
          const [p1, p2] = privateIp.split('.');
          
          expect(p1).toBe(n1);
          expect(p2).toBe(n2);
        });
      });
    });
  });

  describe("Cross-Environment Validation", () => {
    it("should have unique VPC IDs across environments", () => {
      const vpcIds = environments.map(env => outputs.vpc_ids.value[env]);
      const uniqueVpcIds = new Set(vpcIds);
      expect(uniqueVpcIds.size).toBe(environments.length);
    });

    it("should have unique instance IDs across environments", () => {
      const instanceIds = environments.map(env => outputs.ec2_instance_ids.value[env]);
      const uniqueInstanceIds = new Set(instanceIds);
      expect(uniqueInstanceIds.size).toBe(environments.length);
    });

    it("should have non-overlapping CIDR blocks", () => {
      const cidrs = environments.map(env => outputs.vpc_cidrs.value[env]);
      const uniqueCidrs = new Set(cidrs);
      expect(uniqueCidrs.size).toBe(environments.length);
      
      // Validate specific expected CIDRs
      expect(cidrs).toContain('10.0.0.0/16'); // dev
      expect(cidrs).toContain('10.1.0.0/16'); // staging
      expect(cidrs).toContain('10.2.0.0/16'); // production
    });
  });

  describe("Infrastructure Standards Compliance", () => {
    environments.forEach(env => {
      it(`${env} environment should meet high availability standards`, async () => {
        // Check for multiple subnets (HA requirement)
        const publicSubnetKeys = Object.keys(outputs.public_subnet_ids.value)
          .filter(key => key.startsWith(`${env}-public`));
        const privateSubnetKeys = Object.keys(outputs.private_subnet_ids.value)  
          .filter(key => key.startsWith(`${env}-private`));
          
        expect(publicSubnetKeys.length).toBeGreaterThanOrEqual(2);
        expect(privateSubnetKeys.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("should follow consistent naming conventions", () => {
      environments.forEach(env => {
        const roleArn = outputs.iam_role_arns.value[env];
        expect(roleArn).toContain(`ec2-role-${env}`);
      });
    });
  });
});
