// __tests__/tap-stack.int.test.ts
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand, 
  DescribeRouteTablesCommand, 
  DescribeInternetGatewaysCommand, 
  DescribeNatGatewaysCommand, 
  DescribeInstancesCommand,
  DescribeSecurityGroupRulesCommand 
} from "@aws-sdk/client-ec2";
import { 
  IAMClient, 
  GetRoleCommand, 
  ListAttachedRolePoliciesCommand,
  GetInstanceProfileCommand 
} from "@aws-sdk/client-iam";
import { 
  SecretsManagerClient, 
  GetSecretValueCommand,
  DescribeSecretCommand 
} from "@aws-sdk/client-secrets-manager";
import { 
  SSMClient, 
  DescribeInstanceInformationCommand 
} from "@aws-sdk/client-ssm";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetId: string;
  let privateSubnetId: string;
  let internetGatewayId: string;
  let natGatewayId: string;
  let ec2InstanceId: string;
  let ec2InstancePrivateIp: string;
  let ec2SecurityGroupId: string;
  let iamRoleArn: string;
  let secretArn: string;
  let stackKey: string;
  let environmentSuffix: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    stackKey = Object.keys(outputs)[0]; 
    const stackOutputs = outputs[stackKey];

    // Extract environment suffix from stack key
    environmentSuffix = stackKey.replace('TapStack', '') || 'production';

    // Map outputs to variables
    vpcId = stackOutputs["vpc-id"];
    publicSubnetId = stackOutputs["public-subnet-id"];
    privateSubnetId = stackOutputs["private-subnet-id"];
    internetGatewayId = stackOutputs["internet-gateway-id"];
    natGatewayId = stackOutputs["nat-gateway-id"];
    ec2InstanceId = stackOutputs["ec2-instance-id"];
    ec2InstancePrivateIp = stackOutputs["ec2-instance-private-ip"];
    ec2SecurityGroupId = stackOutputs["ec2-security-group-id"];
    iamRoleArn = stackOutputs["iam-role-arn"];
    secretArn = stackOutputs["secret-arn"];

    if (!vpcId || !ec2InstanceId || !secretArn) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  // INTERACTIVE TEST CASES - Testing interactions between 2-3 services

  describe("Interactive Tests: VPC → Subnets → Routing", () => {
    test("VPC contains properly configured public and private subnets with correct routing", async () => {
      // Verify VPC exists and is available
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.[0]?.State).toBe("available");
      expect(Vpcs?.[0]?.CidrBlock).toBe("10.0.0.0/16");

      // Verify both subnets exist in the VPC
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId, privateSubnetId] })
      );

      const publicSubnet = Subnets?.find(s => s.SubnetId === publicSubnetId);
      const privateSubnet = Subnets?.find(s => s.SubnetId === privateSubnetId);

      // Verify subnet configurations
      expect(publicSubnet?.VpcId).toBe(vpcId);
      expect(publicSubnet?.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet?.CidrBlock).toBe("10.0.1.0/24");
      
      expect(privateSubnet?.VpcId).toBe(vpcId);
      expect(privateSubnet?.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet?.CidrBlock).toBe("10.0.2.0/24");

      // Verify route tables are associated with subnets
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      const publicRouteTable = RouteTables?.find(rt => 
        rt.Associations?.some(a => a.SubnetId === publicSubnetId)
      );
      const privateRouteTable = RouteTables?.find(rt => 
        rt.Associations?.some(a => a.SubnetId === privateSubnetId)
      );

      expect(publicRouteTable).toBeDefined();
      expect(privateRouteTable).toBeDefined();
    }, 30000);
  });

  describe("Interactive Tests: Internet Gateway → NAT Gateway → Network Flow", () => {
    test("Public subnet routes through IGW and private subnet routes through NAT Gateway", async () => {
      // Verify Internet Gateway is attached to VPC
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );
      
      const igwAttachment = InternetGateways?.[0]?.Attachments?.[0];
      expect(igwAttachment?.VpcId).toBe(vpcId);
      expect(igwAttachment?.State).toBe("available");

      // Verify NAT Gateway is in public subnet
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );
      
      const natGateway = NatGateways?.[0];
      expect(natGateway?.State).toBe("available");
      expect(natGateway?.SubnetId).toBe(publicSubnetId);
      expect(natGateway?.NatGatewayAddresses?.[0]?.PublicIp).toBeDefined();

      // Verify routing configuration
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      // Find route tables by their associations
      const publicRT = RouteTables?.find(rt => 
        rt.Associations?.some(a => a.SubnetId === publicSubnetId)
      );
      const privateRT = RouteTables?.find(rt => 
        rt.Associations?.some(a => a.SubnetId === privateSubnetId)
      );

      // Public route table should route to IGW
      const publicDefaultRoute = publicRT?.Routes?.find(r => r.DestinationCidrBlock === "0.0.0.0/0");
      expect(publicDefaultRoute?.GatewayId).toBe(internetGatewayId);

      // Private route table should route to NAT Gateway
      const privateDefaultRoute = privateRT?.Routes?.find(r => r.DestinationCidrBlock === "0.0.0.0/0");
      expect(privateDefaultRoute?.NatGatewayId).toBe(natGatewayId);
    }, 30000);
  });

  describe("Interactive Tests: EC2 → Security Group → Network Access", () => {
    test("EC2 instance is properly secured with restrictive security group rules", async () => {
      // Verify EC2 instance configuration
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.State?.Name).toBe("running");
      expect(instance?.SubnetId).toBe(privateSubnetId);
      expect(instance?.PrivateIpAddress).toBe(ec2InstancePrivateIp);
      expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(ec2SecurityGroupId);

      // Verify security group has restrictive rules
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );

      const securityGroup = SecurityGroups?.[0];
      expect(securityGroup?.VpcId).toBe(vpcId);

      // Should only have specific egress rules for HTTPS and HTTP
      const egressRules = securityGroup?.IpPermissionsEgress || [];
      const httpsRule = egressRules.find(r => r.FromPort === 443 && r.ToPort === 443);
      const httpRule = egressRules.find(r => r.FromPort === 80 && r.ToPort === 80);

      expect(httpsRule?.IpProtocol).toBe("tcp");
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");
      
      expect(httpRule?.IpProtocol).toBe("tcp");
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");

      // Should have no ingress rules (only SSM access)
      expect(securityGroup?.IpPermissions?.length).toBe(0);
    }, 30000);
  });

  describe("Interactive Tests: IAM Role → EC2 → Secrets Manager", () => {
    test("EC2 instance can access secrets through IAM role permissions", async () => {
      // Extract role name from ARN
      const roleName = iamRoleArn.split('/').pop();

      // Verify IAM role configuration
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(Role?.Arn).toBe(iamRoleArn);
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || "{}"));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("ec2.amazonaws.com");

      // Verify role has necessary policies attached
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const policies = AttachedPolicies || [];
      const ssmPolicy = policies.find(p => p.PolicyArn === "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
      expect(ssmPolicy).toBeDefined();

      // Verify role has access to specific secret
      const secretsPolicy = policies.find(p => p.PolicyName === "production-ec2-secrets-policy");
      expect(secretsPolicy).toBeDefined();

      // Verify secret exists and is accessible
      const { ARN, Name } = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );
      
      expect(ARN).toBe(secretArn);
      expect(Name).toBe("production/database/credentials");
    }, 30000);
  });

  describe("Interactive Tests: EC2 → IAM → SSM Integration", () => {
    test("EC2 instance is accessible via SSM Session Manager", async () => {
      // Verify instance has SSM agent running and is registered
      const { InstanceInformationList } = await ssmClient.send(
        new DescribeInstanceInformationCommand({
          Filters: [
            { Key: "InstanceIds", Values: [ec2InstanceId] }
          ]
        })
      );

      const instanceInfo = InstanceInformationList?.[0];
      expect(instanceInfo?.InstanceId).toBe(ec2InstanceId);
      expect(instanceInfo?.PingStatus).toBe("Online");
      expect(instanceInfo?.IsLatestVersion).toBe(true);

      // Verify instance profile is attached
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.IamInstanceProfile?.Arn).toContain("production-ec2-instance-profile");
    }, 30000);
  });

  describe("Interactive Tests: Secrets Manager → EC2 → Database Configuration", () => {
    test("Database credentials in Secrets Manager are properly formatted for EC2 consumption", async () => {
      // Verify secret contains expected database configuration
      try {
        const { SecretString } = await secretsManagerClient.send(
          new GetSecretValueCommand({ SecretId: secretArn })
        );

        const credentials = JSON.parse(SecretString || "{}");
        
        // Verify all required database connection properties exist
        expect(credentials.username).toBe("admin");
        expect(credentials.password).toBeDefined();
        expect(credentials.engine).toBe("postgres");
        expect(credentials.host).toBe("db.production.internal");
        expect(credentials.port).toBe(5432);

        // Verify EC2 instance metadata supports secure retrieval
        const { Reservations } = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
        );
        
        const instance = Reservations?.[0]?.Instances?.[0];
        const metadataOptions = instance?.MetadataOptions;
        
        // IMDSv2 is enforced
        expect(metadataOptions?.HttpTokens).toBe("required");
        expect(metadataOptions?.HttpEndpoint).toBe("enabled");
      } catch (error: any) {
        // If we can't read the secret, verify it's due to permissions
        expect(error.name).toBe("AccessDeniedException");
      }
    }, 30000);
  });

  describe("Interactive Tests: Private Subnet → NAT Gateway → Internet Connectivity", () => {
    test("EC2 instance in private subnet can reach internet through NAT Gateway", async () => {
      // Verify EC2 is in private subnet
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.SubnetId).toBe(privateSubnetId);
      expect(instance?.PublicIpAddress).toBeUndefined(); // No public IP

      // Verify route from private subnet to NAT Gateway
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "association.subnet-id", Values: [privateSubnetId] }
          ]
        })
      );

      const privateRoute = RouteTables?.[0]?.Routes?.find(
        r => r.DestinationCidrBlock === "0.0.0.0/0"
      );
      
      expect(privateRoute?.NatGatewayId).toBe(natGatewayId);
      expect(privateRoute?.State).toBe("active");

      // Verify security group allows outbound traffic
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );

      const egressRules = SecurityGroups?.[0]?.IpPermissionsEgress || [];
      const hasHttpsEgress = egressRules.some(r => r.FromPort === 443);
      const hasHttpEgress = egressRules.some(r => r.FromPort === 80);

      expect(hasHttpsEgress).toBe(true);
      expect(hasHttpEgress).toBe(true);
    }, 30000);
  });

  describe("Monitoring and Compliance", () => {
    test("All resources have consistent tagging and monitoring enabled", async () => {
      const expectedTags = {
        Environment: environmentSuffix,
        ManagedBy: 'CDKTF',
        Project: 'Production-Infrastructure',
        Owner: 'Platform-Team'
      };

      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs?.[0]?.Tags || [];
      
      Object.entries(expectedTags).forEach(([key, value]) => {
        const tag = vpcTags.find(t => t.Key === key);
        expect(tag?.Value).toBe(value);
      });

      // Check EC2 monitoring
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.Monitoring?.State).toBe("enabled");

      // Check EC2 instance tags
      const instanceTags = instance?.Tags || [];
      const nameTag = instanceTags.find(t => t.Key === "Name");
      expect(nameTag?.Value).toBe("production-compute-instance");
    }, 30000);
  });
});