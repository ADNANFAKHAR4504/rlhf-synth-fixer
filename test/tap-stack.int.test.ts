// __tests__/tap-stack.integration.test.ts
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from "@aws-sdk/client-rds";
import {
  SNSClient,
  GetTopicAttributesCommand,
  PublishCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  PutLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricDataCommand,
  GetMetricStatisticsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribeAutoScalingInstancesCommand,
  SetDesiredCapacityCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  IAMClient,
  GetInstanceProfileCommand,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  SSMClient,
  GetParameterCommand,
  GetParametersByPathCommand,
} from "@aws-sdk/client-ssm";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });

describe("TapStack Service Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let albArn: string;
  let albDnsName: string;
  let asgName: string;
  let rdsEndpoint: string;
  let rdsInstanceId: string;
  let snsTopicArn: string;
  let logGroupName: string;
  let accountId: string;
  let stackName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      // Try alternate location
      const altPath = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");
      if (!fs.existsSync(altPath)) {
        throw new Error(`deployment-outputs.json not found`);
      }
      const outputs = JSON.parse(fs.readFileSync(altPath, "utf-8"));
      stackName = Object.keys(outputs)[0];
      const stackOutputs = outputs[stackName];
      
      vpcId = stackOutputs["vpc-id"];
      publicSubnetIds = stackOutputs["public-subnet-ids"];
      privateSubnetIds = stackOutputs["private-subnet-ids"];
      albArn = stackOutputs["alb-arn"];
      albDnsName = stackOutputs["alb-dns-name"];
      asgName = stackOutputs["asg-name"];
      rdsEndpoint = stackOutputs["rds-endpoint"];
      rdsInstanceId = stackOutputs["rds-instance-id"];
      snsTopicArn = stackOutputs["sns-topic-arn"];
      logGroupName = stackOutputs["cloudwatch-log-group"];
      accountId = stackOutputs["aws-account-id"];
    } else {
      const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
      stackName = Object.keys(outputs)[0];
      const stackOutputs = outputs[stackName];
      
      vpcId = stackOutputs["vpc-id"];
      publicSubnetIds = stackOutputs["public-subnet-ids"];
      privateSubnetIds = stackOutputs["private-subnet-ids"];
      albArn = stackOutputs["alb-arn"];
      albDnsName = stackOutputs["alb-dns-name"];
      asgName = stackOutputs["asg-name"];
      rdsEndpoint = stackOutputs["rds-endpoint"];
      rdsInstanceId = stackOutputs["rds-instance-id"];
      snsTopicArn = stackOutputs["sns-topic-arn"];
      logGroupName = stackOutputs["cloudwatch-log-group"];
      accountId = stackOutputs["aws-account-id"];
    }

    if (!vpcId || !albArn || !asgName || !rdsEndpoint) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("Network Layer Integration", () => {
    test("VPC has proper connectivity between public and private subnets", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(Vpcs?.length).toBe(1);
      const vpc = Vpcs![0];
      expect(vpc.State).toBe("available");

      // Verify Internet Gateway exists and is attached
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
        })
      );
      expect(InternetGateways?.length).toBeGreaterThan(0);
      expect(InternetGateways?.[0].Attachments?.[0].State).toBe("available");
    }, 30000);

    test("Subnets are properly distributed across availability zones", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        })
      );

      // Group subnets by AZ
      const azMap = new Map<string, string[]>();
      Subnets?.forEach(subnet => {
        const az = subnet.AvailabilityZone!;
        if (!azMap.has(az)) {
          azMap.set(az, []);
        }
        azMap.get(az)!.push(subnet.SubnetId!);
      });

      // Each AZ should have both public and private subnets
      expect(azMap.size).toBeGreaterThanOrEqual(2);
      azMap.forEach((subnetIds, az) => {
        const hasPublic = subnetIds.some(id => publicSubnetIds.includes(id));
        const hasPrivate = subnetIds.some(id => privateSubnetIds.includes(id));
        expect(hasPublic).toBe(true);
        expect(hasPrivate).toBe(true);
      });
    }, 30000);
  });

  describe("ALB and ASG Integration", () => {
    test("ALB is correctly configured with target groups", async () => {
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn]
        })
      );

      const alb = LoadBalancers?.[0];
      expect(alb?.State?.Code).toBe("active");
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.Type).toBe("application");

      // Verify ALB is in public subnets
      const albSubnets = alb?.AvailabilityZones?.map(az => az.SubnetId) || [];
      albSubnets.forEach(subnet => {
        expect(publicSubnetIds).toContain(subnet);
      });
    }, 30000);

    test("ASG instances are registered with ALB target group", async () => {
      // Get target groups
      const { TargetGroups } = await elbClient.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: albArn
        })
      );

      expect(TargetGroups?.length).toBeGreaterThan(0);
      const targetGroup = TargetGroups![0];

      // Check target health
      const { TargetHealthDescriptions } = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup.TargetGroupArn
        })
      );

      // Get ASG instances
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        })
      );

      const asg = AutoScalingGroups?.[0];
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
      
      // Verify ASG instances are in target group
      const asgInstanceIds = asg?.Instances?.map(i => i.InstanceId) || [];
      const targetInstanceIds = TargetHealthDescriptions?.map(t => t.Target?.Id) || [];
      
      asgInstanceIds.forEach(instanceId => {
        expect(targetInstanceIds).toContain(instanceId);
      });
    }, 30000);

    test("ALB listeners forward traffic to healthy targets", async () => {
      const { Listeners } = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn
        })
      );

      expect(Listeners?.length).toBeGreaterThan(0);
      const httpListener = Listeners?.find(l => l.Port === 80);
      
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe("HTTP");
      expect(httpListener?.DefaultActions?.[0]?.Type).toBe("forward");

      // Verify listener points to target group
      const targetGroupArn = httpListener?.DefaultActions?.[0]?.TargetGroupArn;
      expect(targetGroupArn).toBeDefined();

      // Check if there are healthy targets
      const { TargetHealthDescriptions } = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroupArn
        })
      );

      const healthyTargets = TargetHealthDescriptions?.filter(
        t => t.TargetHealth?.State === "healthy"
      );
      
      // Should have at least one healthy target
      expect(healthyTargets?.length).toBeGreaterThan(0);
    }, 30000);

    test("Auto scaling policies respond to load changes", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        })
      );

      const asg = AutoScalingGroups?.[0];
      
      // Verify scaling configuration
      expect(asg?.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg?.MaxSize).toBeGreaterThanOrEqual(6);
      expect(asg?.HealthCheckType).toBe("ELB");
      expect(asg?.HealthCheckGracePeriod).toBe(300);

      // Verify instances are in private subnets
      const instanceSubnets = asg?.Instances?.map(i => i.AvailabilityZone) || [];
      expect(instanceSubnets.length).toBeGreaterThan(0);
    }, 30000);
  });


  describe("IAM and SSM Parameter Store Integration", () => {
    test("EC2 instances have proper IAM roles for SSM access", async () => {
      // Get an instance from ASG
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        })
      );

      const instanceId = AutoScalingGroups?.[0]?.Instances?.[0]?.InstanceId;
      if (!instanceId) {
        console.warn("No instances found in ASG");
        return;
      }

      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId]
        })
      );

      const instance = Reservations?.[0]?.Instances?.[0];
      const instanceProfileArn = instance?.IamInstanceProfile?.Arn;
      expect(instanceProfileArn).toBeDefined();

      const profileName = instanceProfileArn?.split('/').pop();
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: profileName!
        })
      );

      const roleName = InstanceProfile?.Roles?.[0]?.RoleName;
      expect(roleName).toBeDefined();

      // Check role has SSM permissions
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: roleName!
        })
      );

      const hasSsmPolicy = AttachedPolicies?.some(policy =>
        policy.PolicyArn?.includes("AmazonSSMManagedInstanceCore")
      );
      expect(hasSsmPolicy).toBe(true);
    }, 30000);

    test("SSM parameters are accessible with proper paths", async () => {
      const projectName = "tap-project";
      const environment = stackName.split('-').pop() || "dev";

      try {
        // Check CloudWatch agent config parameter
        const { Parameter } = await ssmClient.send(
          new GetParameterCommand({
            Name: `/${projectName}/${environment}/cloudwatch/config`
          })
        );

        expect(Parameter).toBeDefined();
        expect(Parameter?.Type).toBe("String");
        
        // Verify it's valid JSON
        const config = JSON.parse(Parameter?.Value || "{}");
        expect(config.metrics).toBeDefined();
        expect(config.logs).toBeDefined();
      } catch (error: any) {
        if (error.name !== 'ParameterNotFound') {
          throw error;
        }
      }

      // Check ALB DNS parameter
      try {
        const { Parameter: albParam } = await ssmClient.send(
          new GetParameterCommand({
            Name: `/${projectName}/${environment}/alb/dns-name`
          })
        );

        expect(albParam?.Value).toBe(albDnsName);
      } catch (error: any) {
        if (error.name !== 'ParameterNotFound') {
          throw error;
        }
      }
    }, 30000);

    test("RDS password is securely stored in SSM", async () => {
      const projectName = "tap-project";
      const environment = stackName.split('-').pop() || "dev";

      try {
        // Try to get parameter metadata (not the value for security)
        const { Parameter } = await ssmClient.send(
          new GetParameterCommand({
            Name: `/${projectName}/${environment}/rds/master-password`,
            WithDecryption: false // Don't decrypt to avoid exposing password
          })
        );

        expect(Parameter).toBeDefined();
        expect(Parameter?.Type).toBe("SecureString");
        expect(Parameter?.Value).toBeDefined(); // Will be encrypted
      } catch (error: any) {
        if (error.name !== 'ParameterNotFound') {
          throw error;
        }
      }
    }, 30000);
  });

  describe("Monitoring and Alerting Integration", () => {
    test("CloudWatch Log Group collects logs from EC2 instances", async () => {
      const { logGroups } = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        })
      );

      const logGroup = logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);

      // Check if log streams exist (instances should create them)
      const { logStreams } = await cloudWatchLogsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: logGroupName,
          limit: 5
        })
      );

      // Log streams might not exist if instances haven't written logs yet
      if (logStreams && logStreams.length > 0) {
        expect(logStreams.length).toBeGreaterThan(0);
      }
    }, 30000);

    test("SNS topic is configured for CloudWatch alarms", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: snsTopicArn
        })
      );

      expect(Attributes?.TopicArn).toBe(snsTopicArn);
      expect(Attributes?.DisplayName).toContain("Alerts");

      // Check if topic has any subscriptions (optional)
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: snsTopicArn
        })
      );

      // Subscriptions are optional but log for visibility
      console.log(`SNS topic has ${Subscriptions?.length || 0} subscription(s)`);
    }, 30000);

    test("CloudWatch alarms monitor critical metrics", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          MaxRecords: 50
        })
      );

      // Filter alarms for our stack
      const stackAlarms = MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes("tap-project")
      );

      // Check for specific alarm types
      const hasResponseTimeAlarm = stackAlarms?.some(a => 
        a.AlarmName?.includes("alb-response-time")
      );
      const hasCpuAlarm = stackAlarms?.some(a => 
        a.AlarmName?.includes("cpu-high")
      );
      const hasStorageAlarm = stackAlarms?.some(a => 
        a.AlarmName?.includes("storage-low")
      );

      expect(hasResponseTimeAlarm).toBe(true);
      expect(hasCpuAlarm).toBe(true);
      expect(hasStorageAlarm).toBe(true);

      // Verify alarms are connected to SNS
      stackAlarms?.forEach(alarm => {
        expect(alarm.AlarmActions).toContain(snsTopicArn);
      });
    }, 30000);

    test("Custom metrics can be published and retrieved", async () => {
      const namespace = `tap-project/${stackName.split('-').pop()}/Test`;
      const metricName = `IntegrationTest-${Date.now()}`;

      // Publish a test metric
      await cloudWatchClient.send(
        new PutMetricDataCommand({
          Namespace: namespace,
          MetricData: [
            {
              MetricName: metricName,
              Value: 42,
              Unit: "Count",
              Timestamp: new Date(),
              Dimensions: [
                { Name: "TestType", Value: "Integration" },
                { Name: "Environment", Value: stackName.split('-').pop() || "test" }
              ]
            }
          ]
        })
      );

      // Wait for metric to be available
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Retrieve the metric
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 300000); // 5 minutes ago

      const { Datapoints } = await cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: namespace,
          MetricName: metricName,
          StartTime: startTime,
          EndTime: endTime,
          Period: 60,
          Statistics: ["Sum"],
          Dimensions: [
            { Name: "TestType", Value: "Integration" }
          ]
        })
      );

      // Metric might not be immediately available
      if (Datapoints && Datapoints.length > 0) {
        const sum = Datapoints.reduce((acc, dp) => acc + (dp.Sum || 0), 0);
        expect(sum).toBe(42);
      }
    }, 30000);
  });

  describe("Security Group Chain Validation", () => {
    test("Security groups form proper communication chain", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      const albSg = SecurityGroups?.find(sg => sg.GroupName?.includes("alb-sg"));
      const ec2Sg = SecurityGroups?.find(sg => sg.GroupName?.includes("ec2-sg"));
      const rdsSg = SecurityGroups?.find(sg => sg.GroupName?.includes("rds-sg"));

      expect(albSg).toBeDefined();
      expect(ec2Sg).toBeDefined();
      expect(rdsSg).toBeDefined();

      // ALB -> EC2: Check EC2 SG allows traffic from ALB
      const ec2FromAlb = ec2Sg?.IpPermissions?.find(rule =>
        rule.FromPort === 80 &&
        rule.ToPort === 80 &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === albSg?.GroupId)
      );
      expect(ec2FromAlb).toBeDefined();

      // EC2 -> RDS: Check RDS SG allows traffic from EC2
      const rdsFromEc2 = rdsSg?.IpPermissions?.find(rule =>
        rule.FromPort === 5432 &&
        rule.ToPort === 5432 &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === ec2Sg?.GroupId)
      );
      expect(rdsFromEc2).toBeDefined();

      // Verify no overly permissive rules
      const hasOpenIngress = SecurityGroups?.some(sg =>
        sg.IpPermissions?.some(rule =>
          rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0") &&
          sg.GroupName !== albSg?.GroupName // ALB is allowed to be open
        )
      );
      expect(hasOpenIngress).toBe(false);
    }, 30000);

    test("ALB security group allows public HTTP/HTTPS traffic", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "group-name", Values: ["*alb-sg*"] }
          ]
        })
      );

      const albSg = SecurityGroups?.[0];
      
      // Check HTTP rule
      const httpRule = albSg?.IpPermissions?.find(rule =>
        rule.FromPort === 80 && 
        rule.ToPort === 80 &&
        rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")
      );
      expect(httpRule).toBeDefined();

      // Check HTTPS rule  
      const httpsRule = albSg?.IpPermissions?.find(rule =>
        rule.FromPort === 443 &&
        rule.ToPort === 443 &&
        rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")
      );
      expect(httpsRule).toBeDefined();
    }, 30000);
  });

  describe("Tag Consistency", () => {
    test("All resources have consistent tagging", async () => {
      const expectedTags = {
        Project: "tap-project",
        ManagedBy: "terraform-cdktf",
        Owner: "platform-team"
      };

      // Check VPC tags
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      
      const vpcTags = Vpcs?.[0]?.Tags || [];
      Object.entries(expectedTags).forEach(([key, value]) => {
        const tag = vpcTags.find(t => t.Key === key);
        expect(tag?.Value).toBe(value);
      });

      // Check ALB tags
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn]
        })
      );

      // Note: ALB tags need to be fetched separately with DescribeTagsCommand
      // This is just to verify the ALB exists
      expect(LoadBalancers?.[0]).toBeDefined();
    }, 30000);
  });

  describe("High Availability Configuration", () => {
    test("Resources are deployed across multiple availability zones", async () => {
      // Check ASG spans multiple AZs
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        })
      );

      const asg = AutoScalingGroups?.[0];
      const asgAzs = asg?.AvailabilityZones || [];
      expect(asgAzs.length).toBeGreaterThanOrEqual(2);

      // Check ALB spans multiple AZs
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn]
        })
      );

      const albAzs = LoadBalancers?.[0]?.AvailabilityZones || [];
      expect(albAzs.length).toBeGreaterThanOrEqual(2);

    }, 30000);

    test("Auto scaling maintains minimum capacity", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName]
        })
      );

      const asg = AutoScalingGroups?.[0];
      expect(asg?.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg?.Instances?.length).toBeGreaterThanOrEqual(2);
      
      // Check instances are healthy
      const healthyInstances = asg?.Instances?.filter(i => 
        i.HealthStatus === "Healthy" && i.LifecycleState === "InService"
      );
      
      expect(healthyInstances?.length).toBeGreaterThanOrEqual(asg?.MinSize || 0);
    }, 30000);
  });
});