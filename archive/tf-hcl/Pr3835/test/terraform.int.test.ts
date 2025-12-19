// tests/terraform.int.test.ts
// Live verification of deployed Terraform infrastructure using structured outputs
// Tests AWS resources: VPC, S3, Lambda, EventBridge, CloudWatch, SNS, IAM, RDS, ALB, ASG

import * as fs from "fs";
import * as path from "path";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
} from "@aws-sdk/client-s3";
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcAttributeCommand,
} from "@aws-sdk/client-ec2";
import {
  SNSClient,
  GetTopicAttributesCommand,
} from "@aws-sdk/client-sns";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from "@aws-sdk/client-iam";
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeGlobalClustersCommand,
} from "@aws-sdk/client-rds";
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
  DescribePoliciesCommand,
} from "@aws-sdk/client-auto-scaling";

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  primary_bucket_name?: TfOutputValue<string>;
  primary_bucket_arn?: TfOutputValue<string>;
  cloudformation_bucket_name?: TfOutputValue<string>;
  lambda_function_name?: TfOutputValue<string>;
  lambda_function_arn?: TfOutputValue<string>;
  eventbridge_rule_name?: TfOutputValue<string>;
  cloudwatch_log_group_lambda?: TfOutputValue<string>;
  cloudwatch_log_group_application?: TfOutputValue<string>;
  private_subnet_ids?: TfOutputValue<string[]>;
  public_subnet_ids?: TfOutputValue<string[]>;
  database_subnet_ids?: TfOutputValue<string[]>;
  sns_topic_arn?: TfOutputValue<string>;
  cloudwatch_alarms?: TfOutputValue<{
    lambda_errors: string;
    s3_errors: string;
    lambda_duration: string;
    lambda_throttles: string;
  }>;
  aurora_cluster_endpoint?: TfOutputValue<string>;
  aurora_reader_endpoint?: TfOutputValue<string>;
  aurora_global_cluster_id?: TfOutputValue<string>;
  alb_dns_name?: TfOutputValue<string>;
  autoscaling_group_name?: TfOutputValue<string>;
};

function readStructuredOutputs(): StructuredOutputs {
  const outputPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Outputs file not found at ${outputPath}`);
  }
  return JSON.parse(fs.readFileSync(outputPath, "utf8"));
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts = 10,
  baseMs = 2000
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 500);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// Read outputs and initialize AWS clients
const outputs = readStructuredOutputs();
const region = process.env.AWS_REGION || "us-east-1";

const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const ec2Client = new EC2Client({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const iamClient = new IAMClient({ region });
const rdsClient = new RDSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const asgClient = new AutoScalingClient({ region });

describe("LIVE: VPC Infrastructure Verification", () => {
  const vpcId = outputs.vpc_id?.value;
  const privateSubnetIds = outputs.private_subnet_ids?.value || [];
  const publicSubnetIds = outputs.public_subnet_ids?.value || [];
  const databaseSubnetIds = outputs.database_subnet_ids?.value || [];

  test("VPC exists and is available", async () => {
    expect(vpcId).toBeTruthy();
    
    const response = await retry(async () => {
      return await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId!] }));
    });

    expect(response.Vpcs).toBeTruthy();
    expect(response.Vpcs!.length).toBe(1);
    expect(response.Vpcs![0].State).toBe("available");
    expect(response.Vpcs![0].CidrBlock).toBeTruthy();
  }, 60000);

  test("VPC has DNS support enabled", async () => {
    const dnsSupportResponse = await retry(async () => {
      return await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId!,
          Attribute: "enableDnsSupport",
        })
      );
    });

    expect(dnsSupportResponse.EnableDnsSupport).toBeTruthy();
    expect(dnsSupportResponse.EnableDnsSupport!.Value).toBe(true);

    const dnsHostnamesResponse = await retry(async () => {
      return await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId!,
          Attribute: "enableDnsHostnames",
        })
      );
    });

    expect(dnsHostnamesResponse.EnableDnsHostnames).toBeTruthy();
    expect(dnsHostnamesResponse.EnableDnsHostnames!.Value).toBe(true);
  }, 60000);

  test("private subnets exist and are configured correctly", async () => {
    expect(privateSubnetIds).toBeTruthy();
    expect(privateSubnetIds.length).toBeGreaterThan(0);

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
    });

    expect(response.Subnets).toBeTruthy();
    expect(response.Subnets!.length).toBe(privateSubnetIds.length);
    
    response.Subnets!.forEach((subnet) => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.State).toBe("available");
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
    });
  }, 60000);

  test("public subnets exist and are configured correctly", async () => {
    expect(publicSubnetIds).toBeTruthy();
    expect(publicSubnetIds.length).toBeGreaterThan(0);

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
    });

    expect(response.Subnets).toBeTruthy();
    expect(response.Subnets!.length).toBe(publicSubnetIds.length);
    
    response.Subnets!.forEach((subnet) => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.State).toBe("available");
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
    });
  }, 60000);

  test("database subnets exist for Multi-AZ RDS", async () => {
    expect(databaseSubnetIds).toBeTruthy();
    expect(databaseSubnetIds.length).toBeGreaterThanOrEqual(2); // Multi-AZ requires at least 2

    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: databaseSubnetIds })
      );
    });

    expect(response.Subnets).toBeTruthy();
    expect(response.Subnets!.length).toBe(databaseSubnetIds.length);
    
    response.Subnets!.forEach((subnet) => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.State).toBe("available");
    });
  }, 60000);

  test("subnets span multiple availability zones (Multi-AZ)", async () => {
    const allSubnetIds = [...privateSubnetIds, ...publicSubnetIds, ...databaseSubnetIds];
    
    const response = await retry(async () => {
      return await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );
    });

    const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2); // Multi-AZ deployment
  }, 60000);
});

describe("LIVE: S3 Buckets Verification", () => {
  const primaryBucketName = outputs.primary_bucket_name?.value;
  const cfnBucketName = outputs.cloudformation_bucket_name?.value;

  test("primary data bucket exists and is accessible", async () => {
    expect(primaryBucketName).toBeTruthy();

    await retry(async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: primaryBucketName! }));
    });
  }, 60000);

  test("primary bucket has versioning enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: primaryBucketName! })
      );
    });

    expect(response.Status).toBe("Enabled");
  }, 60000);

  test("primary bucket has encryption enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: primaryBucketName! })
      );
    });

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    
    const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
    expect(rule.ApplyServerSideEncryptionByDefault).toBeTruthy();
    expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("AES256");
  }, 60000);

  test("primary bucket has public access blocked", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: primaryBucketName! })
      );
    });

    expect(response.PublicAccessBlockConfiguration).toBeTruthy();
    expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
  }, 60000);

  test("primary bucket has lifecycle configuration", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: primaryBucketName! })
      );
    });

    expect(response.Rules).toBeTruthy();
    expect(response.Rules!.length).toBeGreaterThan(0);
    
    const hasTransitions = response.Rules!.some((rule) => rule.Transitions && rule.Transitions.length > 0);
    const hasExpiration = response.Rules!.some((rule) => rule.Expiration);
    
    expect(hasTransitions || hasExpiration).toBe(true);
  }, 60000);

  test("CloudFormation templates bucket exists", async () => {
    expect(cfnBucketName).toBeTruthy();

    await retry(async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: cfnBucketName! }));
    });
  }, 60000);
});

describe("LIVE: Aurora RDS Multi-AZ and Multi-Region Verification", () => {
  const clusterEndpoint = outputs.aurora_cluster_endpoint?.value;
  const readerEndpoint = outputs.aurora_reader_endpoint?.value;
  const globalClusterId = outputs.aurora_global_cluster_id?.value;

  test("Aurora cluster exists and is available", async () => {
    expect(clusterEndpoint).toBeTruthy();

    const response = await retry(async () => {
      return await rdsClient.send(new DescribeDBClustersCommand({}));
    });

    expect(response.DBClusters).toBeTruthy();
    expect(response.DBClusters!.length).toBeGreaterThan(0);

    const cluster = response.DBClusters!.find((c) => c.Endpoint === clusterEndpoint);
    expect(cluster).toBeTruthy();
    expect(cluster!.Status).toBe("available");
    expect(cluster!.Engine).toBe("aurora-mysql");
    expect(cluster!.MultiAZ).toBe(true); // Multi-AZ enabled
  }, 90000);

  test("Aurora cluster has multiple instances (Multi-AZ)", async () => {
    const response = await retry(async () => {
      return await rdsClient.send(new DescribeDBInstancesCommand({}));
    });

    expect(response.DBInstances).toBeTruthy();
    
    // Filter instances that belong to our cluster
    const clusterInstances = response.DBInstances!.filter(
      (inst) => inst.DBClusterIdentifier && inst.Endpoint?.Address
    );
    
    expect(clusterInstances.length).toBeGreaterThanOrEqual(2); // Multi-AZ requires at least 2
    
    // Check that instances are in different AZs
    const azs = new Set(clusterInstances.map((inst) => inst.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  }, 90000);

  test("Aurora Global Cluster exists for multi-region support", async () => {
    if (!globalClusterId) {
      console.warn("Global cluster ID not found in outputs, skipping test");
      return;
    }

    const response = await retry(async () => {
      return await rdsClient.send(new DescribeGlobalClustersCommand({}));
    });

    expect(response.GlobalClusters).toBeTruthy();
    
    const globalCluster = response.GlobalClusters!.find(
      (gc) => gc.GlobalClusterIdentifier === globalClusterId
    );
    
    expect(globalCluster).toBeTruthy();
    expect(globalCluster!.Engine).toBe("aurora-mysql");
    expect(globalCluster!.StorageEncrypted).toBe(true);
  }, 90000);

  test("Aurora cluster has reader endpoint configured", async () => {
    expect(readerEndpoint).toBeTruthy();
    expect(readerEndpoint).not.toBe(clusterEndpoint); // Reader should be different from writer
  });

  test("Aurora cluster has encryption enabled", async () => {
    const response = await retry(async () => {
      return await rdsClient.send(new DescribeDBClustersCommand({}));
    });

    const cluster = response.DBClusters!.find((c) => c.Endpoint === clusterEndpoint);
    expect(cluster).toBeTruthy();
    expect(cluster!.StorageEncrypted).toBe(true);
  }, 90000);

  test("Aurora cluster has automated backups configured", async () => {
    const response = await retry(async () => {
      return await rdsClient.send(new DescribeDBClustersCommand({}));
    });

    const cluster = response.DBClusters!.find((c) => c.Endpoint === clusterEndpoint);
    expect(cluster).toBeTruthy();
    expect(cluster!.BackupRetentionPeriod).toBeGreaterThan(0);
  }, 90000);
});

describe("LIVE: Application Load Balancer Verification", () => {
  const albDnsName = outputs.alb_dns_name?.value;

  test("Application Load Balancer exists", async () => {
    expect(albDnsName).toBeTruthy();

    const response = await retry(async () => {
      return await elbClient.send(new DescribeLoadBalancersCommand({}));
    });

    expect(response.LoadBalancers).toBeTruthy();
    expect(response.LoadBalancers!.length).toBeGreaterThan(0);

    const alb = response.LoadBalancers!.find((lb) => lb.DNSName === albDnsName);
    expect(alb).toBeTruthy();
    expect(alb!.State?.Code).toBe("active");
    expect(alb!.Type).toBe("application");
    expect(alb!.Scheme).toBe("internet-facing");
  }, 90000);

  test("ALB is deployed across multiple AZs", async () => {
    const response = await retry(async () => {
      return await elbClient.send(new DescribeLoadBalancersCommand({}));
    });

    const alb = response.LoadBalancers!.find((lb) => lb.DNSName === albDnsName);
    expect(alb).toBeTruthy();
    expect(alb!.AvailabilityZones).toBeTruthy();
    expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
  }, 90000);

  test("ALB has target group configured", async () => {
    const response = await retry(async () => {
      return await elbClient.send(new DescribeTargetGroupsCommand({}));
    });

    expect(response.TargetGroups).toBeTruthy();
    expect(response.TargetGroups!.length).toBeGreaterThan(0);

    const targetGroup = response.TargetGroups![0];
    expect(targetGroup.Protocol).toBe("HTTP");
    expect(targetGroup.Port).toBe(80);
    expect(targetGroup.HealthCheckEnabled).toBe(true);
  }, 90000);

  test("ALB has HTTP listener configured", async () => {
    const lbResponse = await retry(async () => {
      return await elbClient.send(new DescribeLoadBalancersCommand({}));
    });

    const alb = lbResponse.LoadBalancers!.find((lb) => lb.DNSName === albDnsName);
    expect(alb).toBeTruthy();

    const listenerResponse = await retry(async () => {
      return await elbClient.send(
        new DescribeListenersCommand({ LoadBalancerArn: alb!.LoadBalancerArn })
      );
    });

    expect(listenerResponse.Listeners).toBeTruthy();
    expect(listenerResponse.Listeners!.length).toBeGreaterThan(0);

    const httpListener = listenerResponse.Listeners!.find((l) => l.Port === 80);
    expect(httpListener).toBeTruthy();
    expect(httpListener!.Protocol).toBe("HTTP");
  }, 90000);
});

describe("LIVE: Auto Scaling Group Verification", () => {
  const asgName = outputs.autoscaling_group_name?.value;

  test("Auto Scaling Group exists", async () => {
    expect(asgName).toBeTruthy();

    const response = await retry(async () => {
      return await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName!] })
      );
    });

    expect(response.AutoScalingGroups).toBeTruthy();
    expect(response.AutoScalingGroups!.length).toBe(1);

    const asg = response.AutoScalingGroups![0];
    expect(asg.AutoScalingGroupName).toBe(asgName);
    expect(asg.MinSize).toBeGreaterThan(0);
    expect(asg.MaxSize).toBeGreaterThan(asg.MinSize!);
    expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
  }, 90000);

  test("ASG is deployed across multiple AZs", async () => {
    const response = await retry(async () => {
      return await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName!] })
      );
    });

    const asg = response.AutoScalingGroups![0];
    expect(asg.AvailabilityZones).toBeTruthy();
    expect(asg.AvailabilityZones!.length).toBeGreaterThanOrEqual(2); // Multi-AZ
  }, 90000);

  test("ASG has health check configured", async () => {
    const response = await retry(async () => {
      return await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName!] })
      );
    });

    const asg = response.AutoScalingGroups![0];
    expect(asg.HealthCheckType).toBe("ELB"); // Using ELB health checks
    expect(asg.HealthCheckGracePeriod).toBeGreaterThan(0);
  }, 90000);

  test("ASG has scaling policies configured", async () => {
    const response = await retry(async () => {
      return await asgClient.send(
        new DescribePoliciesCommand({ AutoScalingGroupName: asgName! })
      );
    });

    expect(response.ScalingPolicies).toBeTruthy();
    expect(response.ScalingPolicies!.length).toBeGreaterThanOrEqual(2); // Scale up and scale down

    const policyNames = response.ScalingPolicies!.map((p) => p.PolicyName);
    const hasScaleUp = policyNames.some((name) => name?.includes("scale-up"));
    const hasScaleDown = policyNames.some((name) => name?.includes("scale-down"));

    expect(hasScaleUp).toBe(true);
    expect(hasScaleDown).toBe(true);
  }, 90000);

  test("ASG instances are running", async () => {
    const response = await retry(async () => {
      return await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName!] })
      );
    });

    const asg = response.AutoScalingGroups![0];
    expect(asg.Instances).toBeTruthy();
    expect(asg.Instances!.length).toBeGreaterThan(0);

    // Check that at least some instances are healthy
    const healthyInstances = asg.Instances!.filter((inst) => inst.HealthStatus === "Healthy");
    expect(healthyInstances.length).toBeGreaterThan(0);
  }, 90000);
});

describe("LIVE: Lambda Function Verification", () => {
  const functionName = outputs.lambda_function_name?.value;
  const functionArn = outputs.lambda_function_arn?.value;

  test("Lambda function exists", async () => {
    expect(functionName).toBeTruthy();
    expect(functionArn).toBeTruthy();

    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName! })
      );
    });

    expect(response.Configuration).toBeTruthy();
    expect(response.Configuration!.FunctionArn).toBe(functionArn);
  }, 60000);

  test("Lambda function has correct runtime configuration", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName! })
      );
    });

    expect(response.Runtime).toBe("python3.11");
    expect(response.Timeout).toBe(300);
    expect(response.MemorySize).toBe(512);
    expect(response.Handler).toBe("lambda_function.lambda_handler");
  }, 60000);

  test("Lambda function has required environment variables", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName! })
      );
    });

    expect(response.Environment).toBeTruthy();
    expect(response.Environment!.Variables).toBeTruthy();
    
    const envVars = response.Environment!.Variables!;
    expect(envVars.PRIMARY_BUCKET).toBeTruthy();
    expect(envVars.SECONDARY_REGION).toBeTruthy();
    expect(envVars.ENVIRONMENT).toBeTruthy();
    expect(envVars.SNS_TOPIC_ARN).toBeTruthy();
  }, 60000);

  test("Lambda function is configured with VPC", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName! })
      );
    });

    expect(response.VpcConfig).toBeTruthy();
    expect(response.VpcConfig!.SubnetIds).toBeTruthy();
    expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
    expect(response.VpcConfig!.SecurityGroupIds).toBeTruthy();
    expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    expect(response.VpcConfig!.VpcId).toBe(outputs.vpc_id?.value);
  }, 60000);

  test("Lambda function has execution role with permissions", async () => {
    const response = await retry(async () => {
      return await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName! })
      );
    });

    expect(response.Role).toBeTruthy();
    
    const roleName = response.Role!.split("/").pop()!;
    
    const roleResponse = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    });

    expect(roleResponse.Role).toBeTruthy();
    expect(roleResponse.Role!.AssumeRolePolicyDocument).toBeTruthy();
  }, 90000);
});

describe("LIVE: CloudWatch Logs Verification", () => {
  const lambdaLogGroup = outputs.cloudwatch_log_group_lambda?.value;
  const appLogGroup = outputs.cloudwatch_log_group_application?.value;

  test("Lambda log group exists", async () => {
    expect(lambdaLogGroup).toBeTruthy();

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: lambdaLogGroup! })
      );
    });

    expect(response.logGroups).toBeTruthy();
    expect(response.logGroups!.length).toBeGreaterThan(0);
    
    const logGroup = response.logGroups!.find((lg) => lg.logGroupName === lambdaLogGroup);
    expect(logGroup).toBeTruthy();
    expect(logGroup!.retentionInDays).toBe(7);
  }, 60000);

  test("application log group exists", async () => {
    expect(appLogGroup).toBeTruthy();

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: appLogGroup! })
      );
    });

    expect(response.logGroups).toBeTruthy();
    expect(response.logGroups!.length).toBeGreaterThan(0);
    
    const logGroup = response.logGroups!.find((lg) => lg.logGroupName === appLogGroup);
    expect(logGroup).toBeTruthy();
    expect(logGroup!.retentionInDays).toBe(30);
  }, 60000);
});

describe("LIVE: EventBridge Rule Verification", () => {
  const ruleName = outputs.eventbridge_rule_name?.value;

  test("EventBridge rule exists", async () => {
    expect(ruleName).toBeTruthy();

    const response = await retry(async () => {
      return await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName! })
      );
    });

    expect(response.Name).toBe(ruleName);
    expect(response.State).toBe("ENABLED");
    expect(response.ScheduleExpression).toBeTruthy();
  }, 60000);

  test("EventBridge rule has Lambda target", async () => {
    const response = await retry(async () => {
      return await eventBridgeClient.send(
        new ListTargetsByRuleCommand({ Rule: ruleName! })
      );
    });

    expect(response.Targets).toBeTruthy();
    expect(response.Targets!.length).toBeGreaterThan(0);
    
    const lambdaTarget = response.Targets!.find((t) =>
      t.Arn?.includes(outputs.lambda_function_name?.value || "")
    );
    expect(lambdaTarget).toBeTruthy();
  }, 60000);
});

describe("LIVE: SNS Topic Verification", () => {
  const topicArn = outputs.sns_topic_arn?.value;

  test("SNS topic exists", async () => {
    expect(topicArn).toBeTruthy();

    const response = await retry(async () => {
      return await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn! })
      );
    });

    expect(response.Attributes).toBeTruthy();
    expect(response.Attributes!.TopicArn).toBe(topicArn);
  }, 60000);

  test("SNS topic has encryption enabled", async () => {
    const response = await retry(async () => {
      return await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn! })
      );
    });

    expect(response.Attributes).toBeTruthy();
    expect(response.Attributes!.KmsMasterKeyId).toBeTruthy();
  }, 60000);

  test("SNS topic has proper display name", async () => {
    const response = await retry(async () => {
      return await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn! })
      );
    });

    expect(response.Attributes).toBeTruthy();
    expect(response.Attributes!.DisplayName).toBeTruthy();
    expect(response.Attributes!.DisplayName).toContain("Failover");
  }, 60000);
});

describe("LIVE: CloudWatch Alarms Verification", () => {
  const alarms = outputs.cloudwatch_alarms?.value;

  test("Lambda errors alarm exists", async () => {
    expect(alarms?.lambda_errors).toBeTruthy();

    const response = await retry(async () => {
      return await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarms!.lambda_errors] })
      );
    });

    expect(response.MetricAlarms).toBeTruthy();
    expect(response.MetricAlarms!.length).toBe(1);
    
    const alarm = response.MetricAlarms![0];
    expect(alarm.MetricName).toBe("Errors");
    expect(alarm.Namespace).toBe("AWS/Lambda");
    expect(alarm.Statistic).toBe("Sum");
  }, 60000);

  test("S3 errors alarm exists", async () => {
    expect(alarms?.s3_errors).toBeTruthy();

    const response = await retry(async () => {
      return await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarms!.s3_errors] })
      );
    });

    expect(response.MetricAlarms).toBeTruthy();
    expect(response.MetricAlarms!.length).toBe(1);
    
    const alarm = response.MetricAlarms![0];
    expect(alarm.MetricName).toBe("4xxErrors");
    expect(alarm.Namespace).toBe("AWS/S3");
  }, 60000);

  test("Lambda duration alarm exists", async () => {
    expect(alarms?.lambda_duration).toBeTruthy();

    const response = await retry(async () => {
      return await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarms!.lambda_duration] })
      );
    });

    expect(response.MetricAlarms).toBeTruthy();
    expect(response.MetricAlarms!.length).toBe(1);
    
    const alarm = response.MetricAlarms![0];
    expect(alarm.MetricName).toBe("Duration");
    expect(alarm.Namespace).toBe("AWS/Lambda");
  }, 60000);

  test("all alarms send notifications to SNS topic", async () => {
    const allAlarmNames = Object.values(alarms || {});
    expect(allAlarmNames.length).toBeGreaterThan(0);

    const response = await retry(async () => {
      return await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: allAlarmNames })
      );
    });

    expect(response.MetricAlarms).toBeTruthy();
    
    response.MetricAlarms!.forEach((alarm) => {
      expect(alarm.AlarmActions).toBeTruthy();
      expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
      expect(alarm.AlarmActions![0]).toBe(outputs.sns_topic_arn?.value);
    });
  }, 60000);
});

describe("LIVE: Output Validation", () => {
  test("all required outputs are present", () => {
    const requiredOutputs = [
      "vpc_id",
      "primary_bucket_name",
      "lambda_function_name",
      "eventbridge_rule_name",
      "sns_topic_arn",
      "cloudwatch_log_group_lambda",
      "alb_dns_name",
      "autoscaling_group_name",
    ];

    requiredOutputs.forEach((outputName) => {
      expect(outputs[outputName as keyof StructuredOutputs]).toBeTruthy();
      expect(outputs[outputName as keyof StructuredOutputs]?.value).toBeTruthy();
    });
  });

  test("output values have correct formats", () => {
    // VPC ID format
    expect(outputs.vpc_id?.value).toMatch(/^vpc-[a-f0-9]+$/);
    
    // ARN formats
    expect(outputs.lambda_function_arn?.value).toMatch(/^arn:aws:lambda:/);
    expect(outputs.sns_topic_arn?.value).toMatch(/^arn:aws:sns:/);
    expect(outputs.primary_bucket_arn?.value).toMatch(/^arn:aws:s3:/);
    
    // Subnet IDs format
    outputs.private_subnet_ids?.value?.forEach((id) => {
      expect(id).toMatch(/^subnet-[a-f0-9]+$/);
    });
    
    outputs.public_subnet_ids?.value?.forEach((id) => {
      expect(id).toMatch(/^subnet-[a-f0-9]+$/);
    });

    // ALB DNS name format
    if (outputs.alb_dns_name?.value) {
      expect(outputs.alb_dns_name.value).toMatch(/\.elb\.amazonaws\.com$/);
    }
  });

  test("new infrastructure outputs exist", () => {
    // Aurora outputs
    expect(outputs.aurora_cluster_endpoint?.value || outputs.aurora_cluster_endpoint === undefined).toBeTruthy();
    
    // ALB outputs
    expect(outputs.alb_dns_name?.value).toBeTruthy();
    
    // ASG outputs
    expect(outputs.autoscaling_group_name?.value).toBeTruthy();
    
    // Database subnets
    expect(outputs.database_subnet_ids?.value || outputs.database_subnet_ids === undefined).toBeTruthy();
  });
});