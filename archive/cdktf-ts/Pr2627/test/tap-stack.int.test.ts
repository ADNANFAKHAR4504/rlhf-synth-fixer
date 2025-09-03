// __tests__/tap-stack.int.test.ts
import { IAMClient, GetRoleCommand, ListRolePoliciesCommand, GetRolePolicyCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeListenersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { SecretsManagerClient, DescribeSecretCommand, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { Route53Client, GetHostedZoneCommand, ListResourceRecordSetsCommand } from "@aws-sdk/client-route-53";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const route53Client = new Route53Client({ region: awsRegion });

describe("TapStack Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackOutputs: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // Get the first (and likely only) stack
    stackOutputs = outputs[stackKey];

    // Validate required outputs exist
    const requiredOutputs = [
      "vpc-id",
      "load-balancer-dns",
      "auto-scaling-group-name",
      "secrets-manager-arn",
      "route53-zone-id"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists with correct CIDR and DNS settings", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
    }, 20000);

    test("Public subnets exist and are properly configured", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Get all subnets in the VPC
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Filter public subnets by tag
      const publicSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")
      );
      
      expect(publicSubnets).toHaveLength(2);
      
      publicSubnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[1-2]\.0\/24$/);
        
      });
    }, 20000);

    test("Private subnets exist and are properly configured", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Get all subnets in the VPC
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Filter private subnets by tag
      const privateSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")
      );
      
      expect(privateSubnets).toHaveLength(2);
      
      privateSubnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.1[0-1]\.0\/24$/);
      
      });
    }, 20000);

    test("Internet Gateway is attached to VPC", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
      
    }, 20000);

    test("Route tables are properly configured", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Get all subnets to identify public ones
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const publicSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")
      );
      const publicSubnetIds = publicSubnets?.map(subnet => subnet.SubnetId) || [];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have at least 2 route tables: default + public
      expect(RouteTables!.length).toBeGreaterThanOrEqual(2);
      
      // Check for public route table with internet gateway route
      const publicRouteTable = RouteTables?.find(rt =>
        rt.Associations?.some(assoc => publicSubnetIds.includes(assoc.SubnetId))
      );
      expect(publicRouteTable).toBeDefined();
      
      const publicInternetRoute = publicRouteTable?.Routes?.find(route =>
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
      );
      expect(publicInternetRoute).toBeDefined();
    }, 20000);

    test("Subnets are distributed across different availability zones", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      
      // Should have at least 2 different AZs
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      
      // Verify AZs are in the correct region
      availabilityZones.forEach(az => {
        expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
      });
    }, 20000);
  });

  describe("Security Groups", () => {
    test("ALB security group allows HTTP traffic", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Find ALB security group by name pattern
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["alb-security-group"] }
        ]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const albSg = SecurityGroups![0];
      
      expect(albSg.GroupName).toBe("alb-security-group");
      expect(albSg.Description).toBe("Security group for Application Load Balancer");
      
      // Check HTTP ingress rule
      const httpRule = albSg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check egress allows all outbound
      const egressRule = albSg.IpPermissionsEgress?.find(rule =>
        rule.FromPort === 0 && rule.ToPort === 65535 && rule.IpProtocol === "tcp"
      );
      expect(egressRule).toBeDefined();
    }, 20000);

    test("EC2 security group allows traffic only from ALB", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Find security groups
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const ec2Sg = SecurityGroups?.find(sg => sg.GroupName === "ec2-security-group");
      const albSg = SecurityGroups?.find(sg => sg.GroupName === "alb-security-group");
      
      expect(ec2Sg).toBeDefined();
      expect(albSg).toBeDefined();
      
      // Check HTTP ingress rule from ALB security group
      const httpRule = ec2Sg?.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs).toHaveLength(1);
      expect(httpRule?.UserIdGroupPairs![0].GroupId).toBe(albSg?.GroupId);
    }, 20000);

    test("RDS security group allows traffic only from EC2 security group", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Find security groups
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const rdsSg = SecurityGroups?.find(sg => sg.GroupName === "rds-security-group");
      const ec2Sg = SecurityGroups?.find(sg => sg.GroupName === "ec2-security-group");
      
      expect(rdsSg).toBeDefined();
      expect(ec2Sg).toBeDefined();
      
      // Check MySQL ingress rule (port 3306) from EC2 security group
      const mysqlRule = rdsSg?.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs).toHaveLength(1);
      expect(mysqlRule?.UserIdGroupPairs![0].GroupId).toBe(ec2Sg?.GroupId);
    }, 20000);
  });

  describe("Load Balancer", () => {
    test("Application Load Balancer is properly configured", async () => {
      const albDns = stackOutputs["load-balancer-dns"];
      
      // Extract ALB name from DNS
      const albName = albDns.split('-').slice(0, 3).join('-'); // "main-application-lb"
      
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [albName]
      }));
      
      expect(LoadBalancers).toHaveLength(1);
      const alb = LoadBalancers![0];
      
      expect(alb.LoadBalancerName).toBe("main-application-lb");
      expect(alb.Type).toBe("application");
      expect(alb.Scheme).toBe("internet-facing");
      expect(alb.State?.Code).toBe("active");
    }, 20000);

    test("Target group is properly configured", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { TargetGroups } = await elbv2Client.send(new DescribeTargetGroupsCommand({
        Names: ["ec2-target-group"]
      }));
      
      expect(TargetGroups).toHaveLength(1);
      const targetGroup = TargetGroups![0];
      
      expect(targetGroup.TargetGroupName).toBe("ec2-target-group");
      expect(targetGroup.Protocol).toBe("HTTP");
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.VpcId).toBe(vpcId);
      expect(targetGroup.TargetType).toBe("instance");
      
      // Check health check configuration
      expect(targetGroup.HealthCheckPath).toBe("/health");
      expect(targetGroup.HealthCheckProtocol).toBe("HTTP");
      expect(targetGroup.HealthyThresholdCount).toBe(2);
      expect(targetGroup.UnhealthyThresholdCount).toBe(3);
      expect(targetGroup.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.Matcher?.HttpCode).toBe("200");
    }, 20000);

    test("Load balancer listener is configured", async () => {
      const albDns = stackOutputs["load-balancer-dns"];
      const albName = albDns.split('-').slice(0, 3).join('-');
      
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [albName]
      }));
      
      const { Listeners } = await elbv2Client.send(new DescribeListenersCommand({
        LoadBalancerArn: LoadBalancers![0].LoadBalancerArn
      }));
      
      expect(Listeners).toHaveLength(1);
      const listener = Listeners![0];
      
      expect(listener.Protocol).toBe("HTTP");
      expect(listener.Port).toBe(80);
      expect(listener.DefaultActions).toHaveLength(1);
      expect(listener.DefaultActions![0].Type).toBe("forward");
    }, 20000);
  });

  describe("Auto Scaling Group", () => {
    test("Auto Scaling Group is properly configured", async () => {
      const asgName = stackOutputs["auto-scaling-group-name"];
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));
      
      expect(AutoScalingGroups).toHaveLength(1);
      const asg = AutoScalingGroups![0];
      
      expect(asg.AutoScalingGroupName).toBe(asgName);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(5);
      expect(asg.HealthCheckType).toBe("ELB");
      expect(asg.HealthCheckGracePeriod).toBe(300);
      expect(asg.LaunchTemplate).toBeDefined();
      
      // Verify ASG is in private subnets (based on your code)
      const asgSubnetIds = asg.VPCZoneIdentifier?.split(',');
      expect(asgSubnetIds).toHaveLength(2);
      
    }, 20000);
  });

  describe("RDS Database", () => {
    test("RDS instance is properly configured", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Find RDS instance by identifier pattern
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({}));
      
      const rdsInstance = DBInstances?.find(db => 
        db.DBInstanceIdentifier === "main-database"
      );
      
      expect(rdsInstance).toBeDefined();
      expect(rdsInstance?.Engine).toBe("mysql");
      expect(rdsInstance?.DBInstanceClass).toBe("db.t3.micro");
      expect(rdsInstance?.AllocatedStorage).toBe(20);
      expect(rdsInstance?.StorageType).toBe("gp2");
      expect(rdsInstance?.DBName).toBe("webapp");
      expect(rdsInstance?.MasterUsername).toBe("admin");
      expect(rdsInstance?.MultiAZ).toBe(true);
      expect(rdsInstance?.PubliclyAccessible).toBe(false);
      expect(rdsInstance?.StorageEncrypted).toBe(true);
      expect(rdsInstance?.BackupRetentionPeriod).toBe(7);
    }, 30000);
  });

  describe("Secrets Manager", () => {
    test("Secrets Manager secret exists and is properly configured", async () => {
      const secretArn = stackOutputs["secrets-manager-arn"];
      
      const { ARN, Name, Description } = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );
      
      expect(ARN).toBe(secretArn);
      expect(Name).toBe("rds-database-credentials");
      expect(Description).toBe("RDS database credentials");
    }, 20000);

    test("Secrets Manager secret contains valid credentials", async () => {
      const secretArn = stackOutputs["secrets-manager-arn"];
      
      const { SecretString } = await secretsManagerClient.send(
        new GetSecretValueCommand({ SecretId: secretArn })
      );
      
      expect(SecretString).toBeDefined();
      const credentials = JSON.parse(SecretString!);
      
      expect(credentials.username).toBe("admin");
      expect(credentials.password).toBeDefined();
      expect(typeof credentials.password).toBe("string");
      expect(credentials.password.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Route 53 DNS", () => {
    test("Route 53 hosted zone exists", async () => {
      const zoneId = stackOutputs["route53-zone-id"];
      
      const { HostedZone } = await route53Client.send(
        new GetHostedZoneCommand({ Id: zoneId })
      );
      
      expect(HostedZone?.Id).toBe(`/hostedzone/${zoneId}`);
      expect(HostedZone?.Name).toBe("iacnova.com.");
      expect(HostedZone?.Config?.PrivateZone).toBe(false);
    }, 20000);

    test("Route 53 A record points to load balancer", async () => {
      const zoneId = stackOutputs["route53-zone-id"];
      const albDns = stackOutputs["load-balancer-dns"];
      
      const { ResourceRecordSets } = await route53Client.send(
        new ListResourceRecordSetsCommand({ HostedZoneId: zoneId })
      );
      
      const aRecord = ResourceRecordSets?.find(record => 
        record.Name === "iacnova.com." && record.Type === "A"
      );
      
      expect(aRecord).toBeDefined();
      expect(aRecord?.AliasTarget).toBeDefined();
      expect(aRecord?.AliasTarget?.DNSName).toBe(`${albDns}.`);
      expect(aRecord?.AliasTarget?.EvaluateTargetHealth).toBe(true);
    }, 20000);
  });

  describe("IAM Roles and Policies", () => {
    test("EC2 IAM role exists with proper assume role policy", async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({ 
        RoleName: "ec2-cloudwatch-secrets-role" 
      }));
      
      expect(Role?.RoleName).toBe("ec2-cloudwatch-secrets-role");
      
      // Verify assume role policy allows EC2
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
      expect(
        assumeRolePolicy.Statement.some(
          (statement: any) =>
            statement.Effect === "Allow" &&
            statement.Principal.Service === "ec2.amazonaws.com" &&
            statement.Action === "sts:AssumeRole"
        )
      ).toBe(true);
    }, 20000);

    test("EC2 role has CloudWatch and Secrets Manager policies", async () => {
      const { PolicyNames } = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: "ec2-cloudwatch-secrets-role"
      }));
      
      expect(PolicyNames?.some(name => name === "CloudWatchMetricsPolicy")).toBe(true);
      expect(PolicyNames?.some(name => name === "SecretsManagerPolicy")).toBe(true);
      
      // Verify CloudWatch policy
      const { PolicyDocument: cloudwatchPolicy } = await iamClient.send(new GetRolePolicyCommand({
        RoleName: "ec2-cloudwatch-secrets-role",
        PolicyName: "CloudWatchMetricsPolicy"
      }));
      
      const cwPolicy = JSON.parse(decodeURIComponent(cloudwatchPolicy || ""));
      const cwStatement = cwPolicy.Statement[0];
      expect(cwStatement.Action).toContain("cloudwatch:PutMetricData");
      expect(cwStatement.Action).toContain("logs:CreateLogGroup");
      
      // Verify Secrets Manager policy
      const { PolicyDocument: secretsPolicy } = await iamClient.send(new GetRolePolicyCommand({
        RoleName: "ec2-cloudwatch-secrets-role",
        PolicyName: "SecretsManagerPolicy"
      }));
      
      const smPolicy = JSON.parse(decodeURIComponent(secretsPolicy || ""));
      const smStatement = smPolicy.Statement[0];
      expect(smStatement.Action).toContain("secretsmanager:GetSecretValue");
      expect(smStatement.Action).toContain("secretsmanager:DescribeSecret");
    }, 20000);
  });

  describe("CloudWatch Monitoring", () => {
    test("CloudWatch alarms exist and are properly configured", async () => {
      const asgName = stackOutputs["auto-scaling-group-name"];
      
      // Get all alarms
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({}));
      
      // Find ASG unhealthy hosts alarm
      const asgAlarm = MetricAlarms?.find(alarm => 
        alarm.AlarmName === "asg-unhealthy-hosts"
      );
      
      expect(asgAlarm).toBeDefined();
      expect(asgAlarm?.MetricName).toBe("UnHealthyHostCount");
      expect(asgAlarm?.Namespace).toBe("AWS/ApplicationELB");
      expect(asgAlarm?.Statistic).toBe("Average");
      expect(asgAlarm?.Period).toBe(60);
      expect(asgAlarm?.EvaluationPeriods).toBe(2);
      expect(asgAlarm?.Threshold).toBe(0);
      expect(asgAlarm?.ComparisonOperator).toBe("GreaterThanThreshold");
      
      // Find RDS CPU alarm
      const rdsAlarm = MetricAlarms?.find(alarm => 
        alarm.AlarmName === "rds-high-cpu"
      );
      
      expect(rdsAlarm).toBeDefined();
      expect(rdsAlarm?.MetricName).toBe("CPUUtilization");
      expect(rdsAlarm?.Namespace).toBe("AWS/RDS");
      expect(rdsAlarm?.Threshold).toBe(80);
      expect(rdsAlarm?.ComparisonOperator).toBe("GreaterThanThreshold");
    }, 20000);
  });

    describe("Output Validation", () => {
    test("All required outputs are present and valid", () => {
      expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["load-balancer-dns"]).toMatch(/^main-application-lb-\d+\.us-west-2\.elb\.amazonaws\.com$/);
      expect(stackOutputs["auto-scaling-group-name"]).toMatch(/^web-server-asg-\d+$/);
      expect(stackOutputs["secrets-manager-arn"]).toMatch(/^arn:aws:secretsmanager:us-west-2:\d+:secret:rds-database-credentials-[A-Za-z0-9]+$/);
      expect(stackOutputs["route53-zone-id"]).toMatch(/^Z[A-Z0-9]+$/);
    });

    test("Load balancer DNS name follows expected pattern", () => {
      const albDns = stackOutputs["load-balancer-dns"];
      expect(albDns).toMatch(/^main-application-lb-\d+\.us-west-2\.elb\.amazonaws\.com$/);
      expect(albDns).toContain("us-west-2.elb.amazonaws.com");
    });

    test("Auto Scaling Group name follows expected pattern", () => {
      const asgName = stackOutputs["auto-scaling-group-name"];
      expect(asgName).toContain("web-server-asg");
    });

    test("Secrets Manager ARN is properly formatted", () => {
      const secretArn = stackOutputs["secrets-manager-arn"];
      expect(secretArn).toMatch(/^arn:aws:secretsmanager:us-west-2:\d+:secret:rds-database-credentials-[A-Za-z0-9]+$/);
      expect(secretArn).toContain("rds-database-credentials");
    });

    test("Route 53 zone ID is valid format", () => {
      const zoneId = stackOutputs["route53-zone-id"];
      expect(zoneId).toMatch(/^Z[A-Z0-9]+$/);
      expect(zoneId.length).toBeGreaterThan(10);
    });
  });

  describe("High Availability and Resilience", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      
      // Should have exactly 2 different AZs for this configuration
      expect(availabilityZones.size).toBe(2);
      
      // Verify AZs are in the correct region
      availabilityZones.forEach(az => {
        expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
      });
    }, 20000);

    test("Auto Scaling Group can scale across multiple subnets", async () => {
      const asgName = stackOutputs["auto-scaling-group-name"];
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));
      
      const asg = AutoScalingGroups![0];
      const asgSubnetIds = asg.VPCZoneIdentifier?.split(',');
      
      expect(asgSubnetIds).toHaveLength(2);
      
      // Verify subnets are in different AZs
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: asgSubnetIds
      }));
      
      const azs = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBe(2);
    }, 20000);

    test("RDS is configured for Multi-AZ deployment", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({}));
      
      const rdsInstance = DBInstances?.find(db => 
        db.DBInstanceIdentifier === "main-database"
      );
      
      expect(rdsInstance?.MultiAZ).toBe(true);
    }, 20000);
  });

  describe("Security Best Practices", () => {
    test("RDS instance follows security best practices", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({}));
      
      const rdsInstance = DBInstances?.find(db => 
        db.DBInstanceIdentifier === "main-database"
      );
      
      expect(rdsInstance).toBeDefined();
      
      // Verify security configurations
      expect(rdsInstance?.PubliclyAccessible).toBe(false);
      expect(rdsInstance?.StorageEncrypted).toBe(true);
      expect(rdsInstance?.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(rdsInstance?.VpcSecurityGroups).toHaveLength(1);
    }, 20000);

    test("Security groups follow least privilege principle", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const albSg = SecurityGroups?.find(sg => sg.GroupName === "alb-security-group");
      const ec2Sg = SecurityGroups?.find(sg => sg.GroupName === "ec2-security-group");
      const rdsSg = SecurityGroups?.find(sg => sg.GroupName === "rds-security-group");
      
      // ALB SG should only allow HTTP inbound
      const albInboundRules = albSg?.IpPermissions || [];
      expect(albInboundRules).toHaveLength(1); // Only HTTP
      
      albInboundRules.forEach(rule => {
        expect(rule.FromPort).toBe(80);
        expect(rule.IpProtocol).toBe("tcp");
      });
      
      // EC2 SG should only allow HTTP from ALB SG
      const ec2InboundRules = ec2Sg?.IpPermissions || [];
      expect(ec2InboundRules).toHaveLength(1); // Only HTTP from ALB
      expect(ec2InboundRules[0].FromPort).toBe(80);
      expect(ec2InboundRules[0].UserIdGroupPairs).toHaveLength(1);
      expect(ec2InboundRules[0].UserIdGroupPairs![0].GroupId).toBe(albSg?.GroupId);
      
      // RDS SG should only allow MySQL from EC2 SG
      const rdsInboundRules = rdsSg?.IpPermissions || [];
      expect(rdsInboundRules).toHaveLength(1); // Only MySQL
      expect(rdsInboundRules[0].FromPort).toBe(3306);
      expect(rdsInboundRules[0].UserIdGroupPairs).toHaveLength(1);
      expect(rdsInboundRules[0].UserIdGroupPairs![0].GroupId).toBe(ec2Sg?.GroupId);
    }, 20000);
  });

  describe("Performance and Monitoring", () => {
    test("CloudWatch alarms are properly configured for monitoring", async () => {
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({}));
      
      // Find alarms created by the stack
      const stackAlarms = MetricAlarms?.filter(alarm => 
        alarm.AlarmName === "asg-unhealthy-hosts" || alarm.AlarmName === "rds-high-cpu"
      );
      
      expect(stackAlarms).toHaveLength(2);
      
      // Verify ASG alarm
      const asgAlarm = stackAlarms?.find(alarm => alarm.AlarmName === "asg-unhealthy-hosts");
      expect(asgAlarm).toBeDefined();
      expect(asgAlarm?.MetricName).toBe("UnHealthyHostCount");
      expect(asgAlarm?.Namespace).toBe("AWS/ApplicationELB");
      
      // Verify RDS alarm
      const rdsAlarm = stackAlarms?.find(alarm => alarm.AlarmName === "rds-high-cpu");
      expect(rdsAlarm).toBeDefined();
      expect(rdsAlarm?.MetricName).toBe("CPUUtilization");
      expect(rdsAlarm?.Namespace).toBe("AWS/RDS");
    }, 20000);

    test("Auto Scaling Group is configured for proper scaling", async () => {
      const asgName = stackOutputs["auto-scaling-group-name"];
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));
      
      const asg = AutoScalingGroups![0];
      
      // Verify scaling configuration allows for growth
      expect(asg.MinSize).toBeLessThan(asg.MaxSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeLessThanOrEqual(asg.MaxSize!);
      
      // Verify health check configuration
      expect(asg.HealthCheckType).toBe("ELB");
      expect(asg.HealthCheckGracePeriod).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Cost Optimization", () => {
    test("RDS instance uses appropriate size for environment", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({}));
      
      const rdsInstance = DBInstances?.find(db => 
        db.DBInstanceIdentifier === "main-database"
      );
      
      // For dev environment, should use cost-effective instance class
      expect(rdsInstance?.DBInstanceClass).toBe("db.t3.micro");
      expect(rdsInstance?.AllocatedStorage).toBe(20); // Minimal storage for dev
    }, 20000);

    test("EC2 instances use cost-effective instance types", async () => {
      const asgName = stackOutputs["auto-scaling-group-name"];
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));
      
      const asg = AutoScalingGroups![0];
      const launchTemplateId = asg.LaunchTemplate?.LaunchTemplateId;
      
      // We can't directly check instance type from ASG, but we can verify the launch template exists
      expect(launchTemplateId).toBeDefined();
      expect(asg.MinSize).toBe(2); // Reasonable minimum for dev
      expect(asg.MaxSize).toBe(5); // Reasonable maximum for dev
    }, 20000);
  });

  describe("DNS and Domain Configuration", () => {
    test("Route 53 hosted zone is properly configured", async () => {
      const zoneId = stackOutputs["route53-zone-id"];
      
      const { HostedZone } = await route53Client.send(
        new GetHostedZoneCommand({ Id: zoneId })
      );
      
      expect(HostedZone?.Name).toBe("iacnova.com.");
      expect(HostedZone?.Config?.PrivateZone).toBe(false);
      expect(HostedZone?.ResourceRecordSetCount).toBeGreaterThan(2); // At least NS and SOA records
    }, 20000);

    test("DNS record correctly points to load balancer", async () => {
      const zoneId = stackOutputs["route53-zone-id"];
      const albDns = stackOutputs["load-balancer-dns"];
      
      const { ResourceRecordSets } = await route53Client.send(
        new ListResourceRecordSetsCommand({ HostedZoneId: zoneId })
      );
      
      const aRecord = ResourceRecordSets?.find(record => 
        record.Name === "iacnova.com." && record.Type === "A"
      );
      
      expect(aRecord).toBeDefined();
      expect(aRecord?.AliasTarget).toBeDefined();
      expect(aRecord?.AliasTarget?.DNSName).toBe(`${albDns}.`);
      expect(aRecord?.AliasTarget?.EvaluateTargetHealth).toBe(true);
    }, 20000);
  });

  describe("Infrastructure State Validation", () => {
    test("All critical resources are in active/available state", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const asgName = stackOutputs["auto-scaling-group-name"];
      const albDns = stackOutputs["load-balancer-dns"];
      
      // Check VPC state
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs![0].State).toBe("available");
      
      // Check ASG state
      const { AutoScalingGroups } = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));
      expect(AutoScalingGroups![0].Instances?.length).toBeGreaterThanOrEqual(2);
      
      // Check ALB state
      const albName = albDns.split('-').slice(0, 3).join('-');
      const { LoadBalancers } = await elbv2Client.send(new DescribeLoadBalancersCommand({
        Names: [albName]
      }));
      expect(LoadBalancers![0].State?.Code).toBe("active");
      
      // Check RDS state
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const rdsInstance = DBInstances?.find(db => db.DBInstanceIdentifier === "main-database");
      expect(rdsInstance?.DBInstanceStatus).toBe("available");
    }, 30000);
  });
});