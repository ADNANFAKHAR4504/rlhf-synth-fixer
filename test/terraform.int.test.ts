import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand
} from "@aws-sdk/client-auto-scaling";
import {
  CloudTrailClient,
  DescribeTrailsCommand
} from "@aws-sdk/client-cloudtrail";
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  GetLogEventsCommand
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  GetFunctionConfigurationCommand,
  LambdaClient
} from "@aws-sdk/client-lambda";
import {
  DescribeDBInstancesCommand,
  RDSClient
} from "@aws-sdk/client-rds";
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketNotificationConfigurationCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import fs from "fs";
import path from "path";

jest.setTimeout(300000);

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Terraform outputs file not found at: ${outputsPath}`);
}
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

const region = "us-west-2";

function getOutputValue(key: string): any {
  const value = outputs[key];
  if (value && typeof value === "object" && "value" in value) {
    return value.value;
  }
  return value;
}

function parseIdList(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return raw
      .replace(/[\[\]\s]/g, "")
      .split(",")
      .filter(Boolean);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const vpcId: string = getOutputValue("vpc_id");
const albDnsName: string = getOutputValue("alb_dns");
const albSecurityGroupId: string = getOutputValue("alb_security_group_id");
const webSecurityGroupId: string = getOutputValue("web_security_group_id");
const dbSecurityGroupId: string = getOutputValue("db_security_group_id");
const asgName: string = getOutputValue("asg_name");
const appBucketName: string = getOutputValue("s3_bucket_name");
const cloudtrailBucketName: string = getOutputValue("cloudtrail_bucket_name");
const cloudtrailName: string = getOutputValue("cloudtrail_name");
const lambdaFunctionName: string = getOutputValue("lambda_function_name");
const lambdaFunctionArn: string = getOutputValue("lambda_function_arn");
const rdsArn: string = getOutputValue("rds_arn");
const rdsEndpointRaw: string = getOutputValue("rds_endpoint");
const publicSubnetIds: string[] = parseIdList(getOutputValue("public_subnet_ids"));
const privateSubnetIds: string[] = parseIdList(getOutputValue("private_subnet_ids"));

const namePrefix = typeof appBucketName === "string" && appBucketName.endsWith("secure-app-bucket")
  ? appBucketName.slice(0, appBucketName.length - "secure-app-bucket".length)
  : "";

const [rdsEndpointHost, rdsEndpointPort] = typeof rdsEndpointRaw === "string"
  ? rdsEndpointRaw.split(":")
  : [undefined, undefined];

const rdsIdentifier = rdsArn?.split(":db:")?.[1];

let stsClient: STSClient;
let ec2Client: EC2Client;
let elbClient: ElasticLoadBalancingV2Client;
let asgClient: AutoScalingClient;
let cloudwatchClient: CloudWatchClient;
let cloudwatchLogsClient: CloudWatchLogsClient;
let s3Client: S3Client;
let cloudtrailClient: CloudTrailClient;
let rdsClient: RDSClient;
let lambdaClient: LambdaClient;

beforeAll(async () => {
  stsClient = new STSClient({ region });
  ec2Client = new EC2Client({ region });
  elbClient = new ElasticLoadBalancingV2Client({ region });
  asgClient = new AutoScalingClient({ region });
  cloudwatchClient = new CloudWatchClient({ region });
  cloudwatchLogsClient = new CloudWatchLogsClient({ region });
  s3Client = new S3Client({ region });
  cloudtrailClient = new CloudTrailClient({ region });
  rdsClient = new RDSClient({ region });
  lambdaClient = new LambdaClient({ region });

  const identity = await stsClient.send(new GetCallerIdentityCommand({}));
  console.log(`Running integration tests in account ${identity.Account}, region ${region}`);
});

afterAll(async () => {
  await Promise.all([
    stsClient.destroy?.(),
    ec2Client.destroy?.(),
    elbClient.destroy?.(),
    asgClient.destroy?.(),
    cloudwatchClient.destroy?.(),
    cloudwatchLogsClient.destroy?.(),
    s3Client.destroy?.(),
    cloudtrailClient.destroy?.(),
    rdsClient.destroy?.(),
    lambdaClient.destroy?.()
  ]);
});

describe("Terraform infrastructure integration", () => {
  test("VPC and subnets are provisioned correctly", async () => {
    const vpcResult = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    const vpc = vpcResult.Vpcs?.[0];
    expect(vpc).toBeDefined();
    expect(vpc?.VpcId).toBe(vpcId);
    expect(namePrefix).toBeTruthy();
    const envTag = vpc?.Tags?.find(tag => tag.Key === "Environment");
    expect(envTag?.Value).toBeTruthy();
    const nameTag = vpc?.Tags?.find(tag => tag.Key === "Name");
    expect(nameTag?.Value?.startsWith(namePrefix)).toBe(true);

    const subnetsResult = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: [...publicSubnetIds, ...privateSubnetIds] })
    );
    const subnets = subnetsResult.Subnets ?? [];
    const publicSubnets = subnets.filter(subnet => publicSubnetIds.includes(subnet.SubnetId ?? ""));
    const privateSubnets = subnets.filter(subnet => privateSubnetIds.includes(subnet.SubnetId ?? ""));

    expect(publicSubnets.length).toBe(publicSubnetIds.length);
    publicSubnets.forEach(subnet => {
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.VpcId).toBe(vpcId);
    });

    expect(privateSubnets.length).toBe(privateSubnetIds.length);
    privateSubnets.forEach(subnet => {
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.VpcId).toBe(vpcId);
    });
  });

  test("Security groups restrict ingress to HTTPS and SSH", async () => {
    const albSgResult = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [albSecurityGroupId] })
    );
    const albSg = albSgResult.SecurityGroups?.[0];
    expect(albSg).toBeDefined();
    expect(albSg?.GroupName?.startsWith(namePrefix)).toBe(true);
    expect(albSg?.IpPermissions?.length).toBe(1);
    const albRule = albSg?.IpPermissions?.[0];
    expect(albRule?.FromPort).toBe(443);
    expect(albRule?.ToPort).toBe(443);
    expect(albRule?.IpProtocol).toBe("tcp");
    const albCidrs = albRule?.IpRanges?.map(range => range.CidrIp) ?? [];
    expect(albCidrs).toContain("0.0.0.0/0");

    const webSgResult = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [webSecurityGroupId] })
    );
    const webSg = webSgResult.SecurityGroups?.[0];
    expect(webSg).toBeDefined();
    expect(webSg?.GroupName?.startsWith(namePrefix)).toBe(true);
    expect(webSg?.IpPermissions?.length).toBe(2);

    const httpsFromAlb = webSg?.IpPermissions?.find(permission =>
      permission.FromPort === 443 &&
      permission.ToPort === 443 &&
      (permission.UserIdGroupPairs ?? []).some(pair => pair.GroupId === albSecurityGroupId)
    );
    expect(httpsFromAlb).toBeDefined();

    const sshRule = webSg?.IpPermissions?.find(permission =>
      permission.FromPort === 22 &&
      permission.ToPort === 22 &&
      permission.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")
    );
    expect(sshRule).toBeDefined();

    const dbSgResult = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [dbSecurityGroupId] })
    );
    const dbSg = dbSgResult.SecurityGroups?.[0];
    expect(dbSg).toBeDefined();
    const dbIngressFromWeb = dbSg?.IpPermissions?.find(permission =>
      permission.FromPort === 5432 &&
      permission.ToPort === 5432 &&
      (permission.UserIdGroupPairs ?? []).some(pair => pair.GroupId === webSecurityGroupId)
    );
    expect(dbIngressFromWeb).toBeDefined();
  });

  test("Load balancer, target group, and autoscaling group are wired together", async () => {
    const loadBalancers = await elbClient.send(new DescribeLoadBalancersCommand({}));
    const loadBalancer = loadBalancers.LoadBalancers?.find(lb => lb.DNSName === albDnsName);
    expect(loadBalancer).toBeDefined();
    const loadBalancerArn = loadBalancer?.LoadBalancerArn;
    expect(loadBalancer?.SecurityGroups).toContain(albSecurityGroupId);

    const listenersResult = await elbClient.send(
      new DescribeListenersCommand({ LoadBalancerArn: loadBalancerArn })
    );
    const httpsListener = listenersResult.Listeners?.find(listener => listener.Port === 443);
    expect(httpsListener).toBeDefined();

    const targetGroupsResult = await elbClient.send(
      new DescribeTargetGroupsCommand({ LoadBalancerArn: loadBalancerArn })
    );
    const targetGroup = targetGroupsResult.TargetGroups?.[0];
    expect(targetGroup).toBeDefined();
    expect(targetGroup?.Port).toBe(443);

    const asgResult = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
    );
    const asg = asgResult.AutoScalingGroups?.[0];
    expect(asg).toBeDefined();
    expect(asg?.TargetGroupARNs).toContain(targetGroup?.TargetGroupArn ?? "");

    const asgSubnetIds = (asg?.VPCZoneIdentifier ?? "").split(",").filter(Boolean);
    privateSubnetIds.forEach(subnetId => {
      expect(asgSubnetIds).toContain(subnetId);
    });
  });

  test("CloudWatch alarms trigger scaling policies on CPU thresholds", async () => {
    const policiesResult = await asgClient.send(new DescribePoliciesCommand({
      AutoScalingGroupName: asgName,
    }));
    const scalingPolicies = policiesResult.ScalingPolicies ?? [];
    console.log("Retrieved scaling policies", { count: scalingPolicies.length, scalingPolicies });
    const scaleUpPolicy = scalingPolicies.find(policy => policy.PolicyName === "iac-350039-prod-scale-up");
    const scaleDownPolicy = scalingPolicies.find(policy => policy.PolicyName === "iac-350039-prod-scale-down");
    const scaleUpPolicyArn = scaleUpPolicy?.PolicyARN ?? "";
    const scaleDownPolicyArn = scaleDownPolicy?.PolicyARN ?? "";
    expect(scaleUpPolicyArn).not.toBe("");
    expect(scaleDownPolicyArn).not.toBe("");

    const alarmsResult = await cloudwatchClient.send(new DescribeAlarmsCommand({
      AlarmNames: ["high-cpu-utilization", "low-cpu-utilization"]
    }));
    const alarms = alarmsResult.MetricAlarms ?? [];
    const highCpuAlarm = alarms.find(alarm => alarm.AlarmName === "high-cpu-utilization");
    const lowCpuAlarm = alarms.find(alarm => alarm.AlarmName === "low-cpu-utilization");
    expect(highCpuAlarm).toBeDefined();
    expect(lowCpuAlarm).toBeDefined();

    expect(highCpuAlarm?.Namespace).toBe("AWS/EC2");
    expect(lowCpuAlarm?.Namespace).toBe("AWS/EC2");
    expect(highCpuAlarm?.MetricName).toBe("CPUUtilization");
    expect(lowCpuAlarm?.MetricName).toBe("CPUUtilization");
    expect(highCpuAlarm?.ComparisonOperator).toBe("GreaterThanThreshold");
    expect(lowCpuAlarm?.ComparisonOperator).toBe("LessThanThreshold");
    expect(highCpuAlarm?.Threshold).toBe(80);
    expect(lowCpuAlarm?.Threshold).toBe(20);
    expect(highCpuAlarm?.EvaluationPeriods).toBe(2);
    expect(lowCpuAlarm?.EvaluationPeriods).toBe(2);
    expect(highCpuAlarm?.Period).toBe(120);
    expect(lowCpuAlarm?.Period).toBe(120);
    expect(highCpuAlarm?.Statistic).toBe("Average");
    expect(lowCpuAlarm?.Statistic).toBe("Average");

    const highAlarmActions = highCpuAlarm?.AlarmActions ?? [];
    const lowAlarmActions = lowCpuAlarm?.AlarmActions ?? [];
    expect(highAlarmActions).toContain(scaleUpPolicyArn);
    expect(lowAlarmActions).toContain(scaleDownPolicyArn);

    const highAsgDimension = highCpuAlarm?.Dimensions?.find(dim => dim.Name === "AutoScalingGroupName")?.Value;
    const lowAsgDimension = lowCpuAlarm?.Dimensions?.find(dim => dim.Name === "AutoScalingGroupName")?.Value;
    expect(highAsgDimension).toBe(asgName);
    expect(lowAsgDimension).toBe(asgName);

    expect(highCpuAlarm?.AlarmDescription).toBe("This metric monitors ec2 cpu utilization");
    expect(lowCpuAlarm?.AlarmDescription).toBe("This metric monitors ec2 cpu utilization");
  });

  test("S3 buckets enforce encryption and public access blocks", async () => {
    const appEncryption = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: appBucketName })
    );
    const appRules = appEncryption.ServerSideEncryptionConfiguration?.Rules ?? [];
    expect(appRules.length).toBeGreaterThan(0);
    const appSseAlgorithm = appRules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(appSseAlgorithm).toBe("AES256");

    const appPublicAccess = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: appBucketName })
    );
    const appBlock = appPublicAccess.PublicAccessBlockConfiguration;
    expect(appBlock?.BlockPublicAcls).toBe(true);
    expect(appBlock?.BlockPublicPolicy).toBe(true);
    expect(appBlock?.RestrictPublicBuckets).toBe(true);
    expect(appBlock?.IgnorePublicAcls).toBe(true);

    const cloudtrailEncryption = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: cloudtrailBucketName })
    );
    const trailRules = cloudtrailEncryption.ServerSideEncryptionConfiguration?.Rules ?? [];
    expect(trailRules.length).toBeGreaterThan(0);
    const trailSseAlgorithm = trailRules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(trailSseAlgorithm).toBe("AES256");

    const cloudtrailPublicAccess = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: cloudtrailBucketName })
    );
    const trailBlock = cloudtrailPublicAccess.PublicAccessBlockConfiguration;
    expect(trailBlock?.BlockPublicAcls).toBe(true);
    expect(trailBlock?.BlockPublicPolicy).toBe(true);
    expect(trailBlock?.RestrictPublicBuckets).toBe(true);
    expect(trailBlock?.IgnorePublicAcls).toBe(true);

    const bucketPolicy = await s3Client.send(
      new GetBucketPolicyCommand({ Bucket: cloudtrailBucketName })
    );
    const policyDocument = JSON.parse(bucketPolicy.Policy ?? "{}");
    const statements = policyDocument.Statement ?? [];
    const allowsCloudTrail = statements.some((statement: any) => {
      const principal = statement.Principal ?? {};
      const service = principal?.Service ?? principal?.AWS;
      return typeof service === "string" && service.includes("cloudtrail.amazonaws.com");
    });
    expect(allowsCloudTrail).toBe(true);
  });

  test("CloudTrail trail delivers to secure bucket", async () => {
    const trailsResult = await cloudtrailClient.send(
      new DescribeTrailsCommand({ trailNameList: [cloudtrailName], includeShadowTrails: false })
    );
    const trail = trailsResult.trailList?.[0];
    expect(trail).toBeDefined();
    expect(trail?.Name).toBe(cloudtrailName);
    expect(trail?.S3BucketName).toBe(cloudtrailBucketName);
    expect(trail?.LogFileValidationEnabled).toBe(true);
    expect(trail?.IsMultiRegionTrail).toBe(true);
  });

  test("RDS instance meets security and resiliency requirements", async () => {
    const rdsResult = await rdsClient.send(
      new DescribeDBInstancesCommand({
        DBInstanceIdentifier: rdsIdentifier
      })
    );
    const dbInstance = rdsResult.DBInstances?.[0];
    expect(dbInstance).toBeDefined();
    expect(dbInstance?.Endpoint?.Address).toBe(rdsEndpointHost);
    expect(dbInstance?.Endpoint?.Port).toBe(parseInt(rdsEndpointPort ?? "0", 10));
    expect(dbInstance?.MultiAZ).toBe(true);
    expect(dbInstance?.StorageEncrypted).toBe(true);
    expect(dbInstance?.AutoMinorVersionUpgrade).toBe(true);
    const securityGroupIds = (dbInstance?.VpcSecurityGroups ?? []).map(sg => sg.VpcSecurityGroupId);
    expect(securityGroupIds).toContain(dbSecurityGroupId);

    const subnetIds = (dbInstance?.DBSubnetGroup?.Subnets ?? []).map(subnet => subnet.SubnetIdentifier);
    privateSubnetIds.forEach(subnetId => {
      expect(subnetIds).toContain(subnetId);
    });
  });

  test("Lambda function is configured and subscribed to S3 events", async () => {
    const functionConfig = await lambdaClient.send(
      new GetFunctionConfigurationCommand({ FunctionName: lambdaFunctionName })
    );
    expect(functionConfig.FunctionName).toBe(lambdaFunctionName);
    expect(functionConfig.Runtime).toBe("nodejs18.x");
    expect(functionConfig.Environment?.Variables?.BUCKET_NAME).toBe(appBucketName);

    const notificationConfig = await s3Client.send(
      new GetBucketNotificationConfigurationCommand({ Bucket: appBucketName })
    );
    const lambdaConfigurations = notificationConfig.LambdaFunctionConfigurations ?? [];
    const hasExpectedTrigger = lambdaConfigurations.some(config =>
      (config.LambdaFunctionArn === lambdaFunctionArn || config.LambdaFunctionArn?.endsWith(lambdaFunctionName)) &&
      (config.Events ?? []).includes("s3:ObjectCreated:*")
    );
    expect(hasExpectedTrigger).toBe(true);
  });

  test("Lambda processes S3 object uploads end-to-end", async () => {
    const objectKey = `lambda-int-${Date.now()}.txt`;
    const numbers = [1, 2, 3, 4, 5];
    const payload = numbers.join(",");
    const expectedCount = numbers.length;
    const expectedSum = numbers.reduce((total, value) => total + value, 0);
    const expectedAvg = expectedSum / expectedCount;
    const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
    const timeoutMs = 180000;
    const pollIntervalMs = 5000;
    const startTime = Date.now();

    await s3Client.send(new PutObjectCommand({
      Bucket: appBucketName,
      Key: objectKey,
      Body: payload
    }));

    let found = false;
    try {
      while (!found && Date.now() - startTime < timeoutMs) {
        const logStreamsResult = await cloudwatchLogsClient.send(
          new DescribeLogStreamsCommand({
            logGroupName,
            orderBy: "LastEventTime",
            descending: true,
            limit: 10
          })
        );
        const logStreams = logStreamsResult.logStreams ?? [];

        for (const stream of logStreams) {
          const logStreamName = stream.logStreamName;
          if (!logStreamName) continue;

          const eventsResult = await cloudwatchLogsClient.send(
            new GetLogEventsCommand({
              logGroupName,
              logStreamName,
              limit: 50,
              startFromHead: false
            })
          );

          const events = eventsResult.events ?? [];
          console.log("Retrieved log events", {
            logStreamName,
            eventCount: events.length
          });
          const hasMatch = events.some(event => {
            const message = event.message ?? "";
            console.log("Inspecting log message", message);
            return message.includes(`s3://execution`) &&
              message.includes(`count=${expectedCount}`) &&
              message.includes(`sum=${expectedSum}`) &&
              message.includes(`avg=${expectedAvg}`);
          });

          if (hasMatch) {
            found = true;
            break;
          }
        }

        if (!found) {
          await sleep(pollIntervalMs);
        }
      }
    } finally {
      await s3Client.send(new DeleteObjectCommand({ Bucket: appBucketName, Key: objectKey })).catch(() => undefined);
    }

    expect(found).toBe(true);
  });
});
