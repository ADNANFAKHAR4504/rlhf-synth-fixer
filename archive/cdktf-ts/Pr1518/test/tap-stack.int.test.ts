// __tests__/tap-stack.int.test.ts
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand, DescribePoliciesCommand } from "@aws-sdk/client-auto-scaling";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let availabilityZones: string[];
  let webSecurityGroupId: string;
  let dbSecurityGroupId: string;
  let loadBalancerDns: string;
  let loadBalancerZoneId: string;
  let asgName: string;
  let asgArn: string;
  let rdsEndpoint: string;
  let rdsPort: number;
  let applicationUrl: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // only one stack in your output
    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc_id"];
    availabilityZones = stackOutputs["availability_zones"];
    webSecurityGroupId = stackOutputs["web_security_group_id"];
    dbSecurityGroupId = stackOutputs["db_security_group_id"];
    loadBalancerDns = stackOutputs["load_balancer_dns"];
    loadBalancerZoneId = stackOutputs["load_balancer_zone_id"];
    asgName = stackOutputs["asg_name"];
    asgArn = stackOutputs["asg_arn"];
    rdsEndpoint = stackOutputs["rds_endpoint"];
    rdsPort = stackOutputs["rds_port"];
    applicationUrl = stackOutputs["application_url"];

    if (!vpcId || !webSecurityGroupId || !dbSecurityGroupId || !loadBalancerDns || !asgName || !rdsEndpoint) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  test("VPC exists and has correct configuration", async () => {
    const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(Vpcs?.length).toBe(1);
    expect(Vpcs?.[0].VpcId).toBe(vpcId);
    expect(Vpcs?.[0].CidrBlock).toBe("10.0.0.0/16");
    expect(Vpcs?.[0].State).toBe("available");
  }, 20000);

  test("Public subnets exist and are configured correctly", async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
      Filters: [
        { Name: "vpc-id", Values: [vpcId] },
        { Name: "tag:Type", Values: ["Public"] }
      ]
    }));
    
    expect(Subnets?.length).toBe(3); // 3 AZs
    
    Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe("available");
      expect(availabilityZones).toContain(subnet.AvailabilityZone);
    });
  }, 20000);

  test("Private subnets exist and are configured correctly", async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
      Filters: [
        { Name: "vpc-id", Values: [vpcId] },
        { Name: "tag:Type", Values: ["Private"] }
      ]
    }));
    
    expect(Subnets?.length).toBe(3); // 3 AZs
    
    Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe("available");
      expect(availabilityZones).toContain(subnet.AvailabilityZone);
    });
  }, 20000);

  test("Web security group has correct HTTP/HTTPS access rules", async () => {
    const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [webSecurityGroupId] }));
    expect(SecurityGroups?.length).toBe(1);
    
    const securityGroup = SecurityGroups?.[0];
    expect(securityGroup?.GroupId).toBe(webSecurityGroupId);
    expect(securityGroup?.VpcId).toBe(vpcId);
    
    // Check for HTTP rule (port 80)
    const httpRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
    );
    expect(httpRule).toBeDefined();
    expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

    // Check for HTTPS rule (port 443)
    const httpsRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
    );
    expect(httpsRule).toBeDefined();
    expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
  }, 20000);

  test("Database security group has correct MySQL access rules", async () => {
    const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [dbSecurityGroupId] }));
    expect(SecurityGroups?.length).toBe(1);
    
    const securityGroup = SecurityGroups?.[0];
    expect(securityGroup?.GroupId).toBe(dbSecurityGroupId);
    expect(securityGroup?.VpcId).toBe(vpcId);
    
    // Check for MySQL rule (port 3306) from web security group
    const mysqlRule = securityGroup?.IpPermissions?.find(rule => 
      rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
    );
    expect(mysqlRule).toBeDefined();
    expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === webSecurityGroupId)).toBe(true);
  }, 20000);


  test("Auto Scaling Group exists and is configured correctly", async () => {
    const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
      AutoScalingGroupNames: [asgName]
    }));
    
    expect(AutoScalingGroups?.length).toBe(1);
    const asg = AutoScalingGroups?.[0];
    
    expect(asg?.AutoScalingGroupName).toBe(asgName);
    expect(asg?.AutoScalingGroupARN).toBe(asgArn);
    expect(asg?.MinSize).toBe(1);
    expect(asg?.MaxSize).toBe(3);
    expect(asg?.DesiredCapacity).toBe(1);
    expect(asg?.HealthCheckType).toBe("EC2");
    expect(asg?.HealthCheckGracePeriod).toBe(600);
    expect(asg?.VPCZoneIdentifier).toBeDefined();
  }, 20000);

  test("Auto Scaling Policies exist for scale up and scale down", async () => {
    const { ScalingPolicies } = await autoScalingClient.send(new DescribePoliciesCommand({
      AutoScalingGroupName: asgName
    }));
    
    expect(ScalingPolicies?.length).toBe(2);
    
    const scaleUpPolicy = ScalingPolicies?.find(policy => policy.PolicyName?.includes("scale-up"));
    const scaleDownPolicy = ScalingPolicies?.find(policy => policy.PolicyName?.includes("scale-down"));
    
    expect(scaleUpPolicy).toBeDefined();
    expect(scaleUpPolicy?.ScalingAdjustment).toBe(1);
    expect(scaleUpPolicy?.AdjustmentType).toBe("ChangeInCapacity");
    
    expect(scaleDownPolicy).toBeDefined();
    expect(scaleDownPolicy?.ScalingAdjustment).toBe(-1);
    expect(scaleDownPolicy?.AdjustmentType).toBe("ChangeInCapacity");
  }, 20000);

  test("CloudWatch alarms exist for CPU monitoring", async () => {
    const { MetricAlarms } = await cloudWatchClient.send(new DescribeAlarmsCommand({
      AlarmNames: [`tap-web-app-cpu-high`, `tap-web-app-cpu-low`]
    }));
    
    expect(MetricAlarms?.length).toBe(2);
    
    const cpuHighAlarm = MetricAlarms?.find(alarm => alarm.AlarmName?.includes("cpu-high"));
    const cpuLowAlarm = MetricAlarms?.find(alarm => alarm.AlarmName?.includes("cpu-low"));
    
    expect(cpuHighAlarm).toBeDefined();
    expect(cpuHighAlarm?.MetricName).toBe("CPUUtilization");
    expect(cpuHighAlarm?.Namespace).toBe("AWS/EC2");
    expect(cpuHighAlarm?.Threshold).toBe(70);
    expect(cpuHighAlarm?.ComparisonOperator).toBe("GreaterThanThreshold");
    
    expect(cpuLowAlarm).toBeDefined();
    expect(cpuLowAlarm?.MetricName).toBe("CPUUtilization");
    expect(cpuLowAlarm?.Namespace).toBe("AWS/EC2");
    expect(cpuLowAlarm?.Threshold).toBe(30);
    expect(cpuLowAlarm?.ComparisonOperator).toBe("LessThanThreshold");
  }, 20000);

  test("RDS database instance exists and is configured correctly", async () => {
    const dbIdentifier = rdsEndpoint.split('.')[0]; // Extract identifier from endpoint
    
    const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
      DBInstanceIdentifier: dbIdentifier
    }));
    
    expect(DBInstances?.length).toBe(1);
    const dbInstance = DBInstances?.[0];
    
    expect(dbInstance?.DBInstanceIdentifier).toBe(dbIdentifier);
    expect(dbInstance?.Engine).toBe("mysql");
    expect(dbInstance?.DBInstanceClass).toBe("db.t3.medium");
    expect(dbInstance?.AllocatedStorage).toBe(20);
    expect(dbInstance?.MultiAZ).toBe(true);
    expect(dbInstance?.StorageEncrypted).toBe(true);
    expect(dbInstance?.DBInstanceStatus).toBe("available");
    expect(dbInstance?.BackupRetentionPeriod).toBe(7);
    expect(dbInstance?.DeletionProtection).toBe(true);
  }, 30000);

  test("RDS database subnet group exists and spans multiple AZs", async () => {
    const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
      DBSubnetGroupName: "tap-web-app-db-subnet-group"
    }));
    
    expect(DBSubnetGroups?.length).toBe(1);
    const subnetGroup = DBSubnetGroups?.[0];
    
    expect(subnetGroup?.DBSubnetGroupName).toBe("tap-web-app-db-subnet-group");
    expect(subnetGroup?.VpcId).toBe(vpcId);
    expect(subnetGroup?.Subnets?.length).toBe(3); // 3 private subnets across 3 AZs
    
    // Verify subnets are in different AZs
    const subnetAZs = subnetGroup?.Subnets?.map(subnet => subnet.SubnetAvailabilityZone?.Name) || [];
    expect(new Set(subnetAZs).size).toBe(3); // All different AZs
  }, 20000);

  test("Application URL is accessible and returns expected format", async () => {
    expect(applicationUrl).toBe(`http://${loadBalancerDns}`);
    expect(applicationUrl).toMatch(/^http:\/\/tap-web-app-alb-\d+\.us-east-1\.elb\.amazonaws\.com$/);
  }, 5000);


  test("RDS endpoint and port are correctly configured", async () => {
    expect(rdsPort).toBe(3306);
    expect(rdsEndpoint).toMatch(/^tap-web-app-db\.[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com:3306$/);
  }, 5000);
});