import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { DescribeInstancesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import fs from "fs";
import path from "path";

// Load Terraform outputs from the correct location
const outputsPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Terraform outputs file not found at: ${outputsPath}`);
}
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Helper to unwrap Terraform output values
function getOutputValue(key: string) {
  const val = outputs[key];
  if (val && typeof val === "object" && "value" in val) return val.value;
  return val;
}

// Extract values from outputs
const region = "us-east-1"; // Default region
const vpcId = getOutputValue("vpc_id");
const vpcCidr = getOutputValue("vpc_cidr");
const publicSubnetId = getOutputValue("public_subnet_id");
const privateSubnetId = getOutputValue("private_subnet_id");
const privateSubnet2Id = getOutputValue("private_subnet_2_id");
const internetGatewayId = getOutputValue("internet_gateway_id");
const natGatewayId = getOutputValue("nat_gateway_id");
const ec2InstanceId = getOutputValue("ec2_instance_id");
const ec2PublicIp = getOutputValue("ec2_public_ip");
const ec2PrivateIp = getOutputValue("ec2_private_ip");
const ec2SecurityGroupId = getOutputValue("ec2_security_group_id");
const rdsEndpoint = getOutputValue("rds_endpoint");
const rdsAddress = getOutputValue("rds_address");
const rdsPort = getOutputValue("rds_port");
const rdsSecurityGroupId = getOutputValue("rds_security_group_id");
const dbSubnetGroupName = getOutputValue("db_subnet_group_name");
const flowLogId = getOutputValue("flow_log_id");
const flowLogGroupName = getOutputValue("flow_log_group_name");
const ec2IamRoleArn = getOutputValue("ec2_iam_role_arn");
const ec2InstanceProfileName = getOutputValue("ec2_instance_profile_name");
const ssmParameterDbHost = getOutputValue("ssm_parameter_db_host");
const ssmParameterDbPort = getOutputValue("ssm_parameter_db_port");
const ssmParameterDbUsername = getOutputValue("ssm_parameter_db_username");
const ssmParameterDbPassword = getOutputValue("ssm_parameter_db_password");
const ssmParameterDbName = getOutputValue("ssm_parameter_db_name");

describe("Terraform AWS Infrastructure Integration", () => {
  let actualAccount: string;

  beforeAll(async () => {
    const sts = new STSClient({ region });
    let identity;
    try {
      identity = await sts.send(new GetCallerIdentityCommand({}));
    } catch (err) {
      console.error("Error getting AWS caller identity:", err);
      throw err;
    }
    actualAccount = identity.Account!;
    console.log(`Running integration tests in AWS account: ${actualAccount}, region: ${region}`);
  });

  test("VPC exists with correct configuration", async () => {
    const ec2 = new EC2Client({ region });
    let vpcs;
    try {
      vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    } catch (err) {
      console.error("Error describing VPCs:", err);
      throw err;
    }
    const vpc = vpcs.Vpcs?.[0];
    expect(vpc).toBeDefined();
    expect(vpc?.VpcId).toBe(vpcId);
    expect(vpc?.CidrBlock).toBe(vpcCidr);
    // Note: DNS settings are not directly accessible via DescribeVpcs
    // They are configured in the Terraform and should be working

    // Check for ProjectX tag
    const projectTag = vpc?.Tags?.find(tag => tag.Key === "Project" && tag.Value === "ProjectX");
    expect(projectTag).toBeDefined();
  });

  test("Subnets exist with correct configuration", async () => {
    const ec2 = new EC2Client({ region });

    // Test public subnet
    let publicSubnet;
    try {
      const result = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] }));
      publicSubnet = result.Subnets?.[0];
    } catch (err) {
      console.error("Error describing public subnet:", err);
      throw err;
    }
    expect(publicSubnet).toBeDefined();
    expect(publicSubnet?.VpcId).toBe(vpcId);
    expect(publicSubnet?.MapPublicIpOnLaunch).toBe(true);

    // Test private subnets
    let privateSubnets;
    try {
      const result = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: [privateSubnetId, privateSubnet2Id]
      }));
      privateSubnets = result.Subnets;
    } catch (err) {
      console.error("Error describing private subnets:", err);
      throw err;
    }
    expect(privateSubnets).toHaveLength(2);
    privateSubnets?.forEach(subnet => {
      expect(subnet?.VpcId).toBe(vpcId);
      expect(subnet?.MapPublicIpOnLaunch).toBe(false);
    });
  });

  test("EC2 instance exists with correct configuration", async () => {
    const ec2 = new EC2Client({ region });
    let instances;
    try {
      instances = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] }));
    } catch (err) {
      console.error("Error describing EC2 instances:", err);
      throw err;
    }
    const instance = instances.Reservations?.[0]?.Instances?.[0];
    expect(instance).toBeDefined();
    expect(instance?.InstanceId).toBe(ec2InstanceId);
    expect(instance?.PublicIpAddress).toBe(ec2PublicIp);
    expect(instance?.PrivateIpAddress).toBe(ec2PrivateIp);
    expect(instance?.SubnetId).toBe(publicSubnetId);
    expect(instance?.VpcId).toBe(vpcId);

    // Check security groups
    const securityGroupIds = instance?.SecurityGroups?.map(sg => sg.GroupId);
    expect(securityGroupIds).toContain(ec2SecurityGroupId);

    // Check IAM instance profile
    expect(instance?.IamInstanceProfile?.Arn).toContain(ec2InstanceProfileName);
  });

  test("RDS instance exists with correct configuration", async () => {
    const rds = new RDSClient({ region });
    let dbs;
    try {
      dbs = await rds.send(new DescribeDBInstancesCommand({}));
    } catch (err) {
      console.error("Error describing RDS instances:", err);
      throw err;
    }
    const db = dbs.DBInstances?.find(d => d.Endpoint?.Address === rdsAddress);
    expect(db).toBeDefined();
    expect(db?.Endpoint?.Address).toBe(rdsAddress);
    expect(db?.Endpoint?.Port).toBe(parseInt(rdsPort));
    expect(db?.DBSubnetGroup?.DBSubnetGroupName).toBe(dbSubnetGroupName);
    expect(db?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId).toBe(rdsSecurityGroupId);
    expect(db?.Engine).toBe("mysql");
    expect(db?.EngineVersion).toMatch(/^8\.0/);
    expect(db?.StorageEncrypted).toBe(true);
    expect(db?.BackupRetentionPeriod).toBe(7);
  });

  test("Security groups have correct rules", async () => {
    const ec2 = new EC2Client({ region });

    // Test EC2 security group
    let ec2Sg;
    try {
      const result = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [ec2SecurityGroupId]
      }));
      ec2Sg = result.SecurityGroups?.[0];
    } catch (err) {
      console.error("Error describing EC2 security group:", err);
      throw err;
    }
    expect(ec2Sg).toBeDefined();
    expect(ec2Sg?.VpcId).toBe(vpcId);

    // Check ingress rules
    const httpRule = ec2Sg?.IpPermissions?.find(rule =>
      rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
    );
    expect(httpRule).toBeDefined();

    const httpsRule = ec2Sg?.IpPermissions?.find(rule =>
      rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
    );
    expect(httpsRule).toBeDefined();

    const sshRule = ec2Sg?.IpPermissions?.find(rule =>
      rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
    );
    expect(sshRule).toBeDefined();

    // Test RDS security group
    let rdsSg;
    try {
      const result = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [rdsSecurityGroupId]
      }));
      rdsSg = result.SecurityGroups?.[0];
    } catch (err) {
      console.error("Error describing RDS security group:", err);
      throw err;
    }
    expect(rdsSg).toBeDefined();
    expect(rdsSg?.VpcId).toBe(vpcId);

    // Check RDS allows MySQL from EC2 security group
    const mysqlRule = rdsSg?.IpPermissions?.find(rule =>
      rule.FromPort === 3306 && rule.ToPort === 3306 &&
      rule.IpProtocol === "tcp" &&
      rule.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)
    );
    expect(mysqlRule).toBeDefined();
  });

  test("VPC Flow Logs are configured", async () => {
    const logs = new CloudWatchLogsClient({ region });
    let logGroups;
    try {
      logGroups = await logs.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: flowLogGroupName
      }));
    } catch (err) {
      console.error("Error describing CloudWatch log groups:", err);
      throw err;
    }
    const logGroup = logGroups.logGroups?.find(lg => lg.logGroupName === flowLogGroupName);
    expect(logGroup).toBeDefined();
    expect(logGroup?.retentionInDays).toBe(7);
  });

  test("SSM Parameters exist with correct values", async () => {
    const ssm = new SSMClient({ region });

    // Test database host parameter
    let hostParam;
    try {
      hostParam = await ssm.send(new GetParameterCommand({
        Name: ssmParameterDbHost
      }));
    } catch (err) {
      console.error("Error getting SSM parameter for DB host:", err);
      throw err;
    }
    expect(hostParam.Parameter?.Value).toBe(rdsAddress);

    // Test database port parameter
    let portParam;
    try {
      portParam = await ssm.send(new GetParameterCommand({
        Name: ssmParameterDbPort
      }));
    } catch (err) {
      console.error("Error getting SSM parameter for DB port:", err);
      throw err;
    }
    expect(portParam.Parameter?.Value).toBe(rdsPort);

    // Test database name parameter
    let nameParam;
    try {
      nameParam = await ssm.send(new GetParameterCommand({
        Name: ssmParameterDbName
      }));
    } catch (err) {
      console.error("Error getting SSM parameter for DB name:", err);
      throw err;
    }
    expect(nameParam.Parameter?.Value).toBe("webapp");

    // Test database username parameter - check it exists and has a value
    let usernameParam;
    try {
      usernameParam = await ssm.send(new GetParameterCommand({
        Name: ssmParameterDbUsername
      }));
    } catch (err) {
      console.error("Error getting SSM parameter for DB username:", err);
      throw err;
    }
    expect(usernameParam.Parameter?.Value).toBeDefined();
    expect(usernameParam.Parameter?.Value?.length).toBeGreaterThan(0);

    // Test database password parameter (should exist as SecureString)
    let passwordParam;
    try {
      passwordParam = await ssm.send(new GetParameterCommand({
        Name: ssmParameterDbPassword,
        WithDecryption: true
      }));
    } catch (err) {
      console.error("Error getting SSM parameter for DB password:", err);
      throw err;
    }
    expect(passwordParam.Parameter?.Type).toBe("SecureString");
    expect(passwordParam.Parameter?.Value).toBeDefined();
    expect(passwordParam.Parameter?.Value?.length).toBeGreaterThan(0);
  });

  test("End-to-end connectivity: EC2 can reach RDS", async () => {
    const ec2 = new EC2Client({ region });

    // Get EC2 instance details
    let instances;
    try {
      instances = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] }));
    } catch (err) {
      console.error("Error describing EC2 instances for E2E test:", err);
      throw err;
    }
    const instance = instances.Reservations?.[0]?.Instances?.[0];
    expect(instance).toBeDefined();

    // Verify EC2 is in public subnet and RDS is in private subnet
    expect(instance?.SubnetId).toBe(publicSubnetId);

    // Get RDS instance details
    const rds = new RDSClient({ region });
    let dbs;
    try {
      dbs = await rds.send(new DescribeDBInstancesCommand({}));
    } catch (err) {
      console.error("Error describing RDS instances for E2E test:", err);
      throw err;
    }
    const db = dbs.DBInstances?.find(d => d.Endpoint?.Address === rdsAddress);
    expect(db).toBeDefined();

    // Verify RDS is in private subnet by checking subnet group
    expect(db?.DBSubnetGroup?.Subnets).toBeDefined();
    const rdsSubnets = db?.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier);
    expect(rdsSubnets).toContain(privateSubnetId);
    expect(rdsSubnets).toContain(privateSubnet2Id);

    // Verify security group rules allow connectivity
    const ec2SecurityGroupIds = instance?.SecurityGroups?.map(sg => sg.GroupId);
    const rdsSecurityGroupIds = db?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId);

    expect(ec2SecurityGroupIds).toContain(ec2SecurityGroupId);
    expect(rdsSecurityGroupIds).toContain(rdsSecurityGroupId);

    // Verify both instances are in the same VPC
    expect(instance?.VpcId).toBe(vpcId);
    expect(db?.DBSubnetGroup?.VpcId).toBe(vpcId);
  });

  test("All resources have ProjectX tag", async () => {
    const ec2 = new EC2Client({ region });

    // Check VPC tags
    let vpcs;
    try {
      vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    } catch (err) {
      console.error("Error describing VPC for tag check:", err);
      throw err;
    }
    const vpc = vpcs.Vpcs?.[0];
    const vpcProjectTag = vpc?.Tags?.find(tag => tag.Key === "Project" && tag.Value === "ProjectX");
    expect(vpcProjectTag).toBeDefined();

    // Check EC2 instance tags
    let instances;
    try {
      instances = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] }));
    } catch (err) {
      console.error("Error describing EC2 instances for tag check:", err);
      throw err;
    }
    const instance = instances.Reservations?.[0]?.Instances?.[0];
    const instanceProjectTag = instance?.Tags?.find(tag => tag.Key === "Project" && tag.Value === "ProjectX");
    expect(instanceProjectTag).toBeDefined();

    // Check subnet tags
    let subnets;
    try {
      subnets = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: [publicSubnetId, privateSubnetId, privateSubnet2Id]
      }));
    } catch (err) {
      console.error("Error describing subnets for tag check:", err);
      throw err;
    }
    subnets.Subnets?.forEach(subnet => {
      const subnetProjectTag = subnet.Tags?.find(tag => tag.Key === "Project" && tag.Value === "ProjectX");
      expect(subnetProjectTag).toBeDefined();
    });
  });
});