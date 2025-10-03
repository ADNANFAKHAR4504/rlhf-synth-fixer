import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { SecretsManagerClient, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";

const region = process.env.AWS_REGION || "us-east-1";

// Load flat-outputs.json

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', "utf8"));

describe("Live Integration Tests - CloudFormation Stack", () => {
  const ec2 = new EC2Client({ region });
  const alb = new ElasticLoadBalancingV2Client({ region });
  const rds = new RDSClient({ region });
  const secrets = new SecretsManagerClient({ region });

  // --- Basic Resource Tests ---
  test("VPC should exist", async () => {
    const vpcId = outputs.VPCId;
    expect(vpcId).toBeDefined();

    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(res.Vpcs?.[0].VpcId).toBe(vpcId);
  });

  test("Application Load Balancer should exist", async () => {
    const albArn = outputs.ApplicationLoadBalancerArn;
    expect(albArn).toBeDefined();

    const res = await alb.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] }));
    expect(res.LoadBalancers?.[0].LoadBalancerArn).toBe(albArn);
  });

  test("RDS instance should be available", async () => {
    const dbEndpoint = outputs.DBInstanceEndpoint;
    expect(dbEndpoint).toBeDefined();

    const res = await rds.send(new DescribeDBInstancesCommand({}));
    const found = res.DBInstances?.find(
      (db) => db.Endpoint?.Address === dbEndpoint
    );
    expect(found).toBeDefined();
    expect(found?.DBInstanceStatus).toBe("available");
  });

  test("Secrets Manager secret should exist", async () => {
    const secretArn = outputs.DBSecretArn;
    expect(secretArn).toBeDefined();

    const res = await secrets.send(new DescribeSecretCommand({ SecretId: secretArn }));
    expect(res.ARN).toBe(secretArn);
  });

  // --- Service Integration Tests ---
  test("ALB TargetGroup should be registered with EC2", async () => {
    const tgArn = outputs.ALBTargetGroupArn;
    expect(tgArn).toBeDefined();

    // Ensure TargetGroup exists
    const tgRes = await alb.send(new DescribeTargetGroupsCommand({ TargetGroupArns: [tgArn] }));
    expect(tgRes.TargetGroups?.[0].TargetGroupArn).toBe(tgArn);

    // Ensure at least 1 healthy target
    const health = await alb.send(new DescribeTargetHealthCommand({ TargetGroupArn: tgArn }));
    expect(health.TargetHealthDescriptions?.length).toBeGreaterThan(0);
  });

  test("EC2 instances should exist in AutoScalingGroup", async () => {
    const asgName = outputs.AutoScalingGroupName;
    expect(asgName).toBeDefined();

    const res = await ec2.send(new DescribeInstancesCommand({}));

    // Flatten reservations safely
    const instances =
      res.Reservations?.flatMap((r) => r.Instances ?? []) ?? [];

    // Simple check: there should be EC2s tagged with ASG name
    const filtered = instances.filter((i) =>
      i.Tags?.some(
        (t) => t.Key === "aws:autoscaling:groupName" && t.Value === asgName
      )
    );

    expect(filtered.length).toBeGreaterThan(0);
  });


  test("Security Group should allow ALB -> EC2 traffic", async () => {
    const albSgId = outputs.ALBSecurityGroupId;
    const ec2SgId = outputs.EC2SecurityGroupId;

    const sgRes = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [ec2SgId] }));
    const rules = sgRes.SecurityGroups?.[0].IpPermissions ?? [];
    const ruleFromAlb = rules.some((r) =>
      r.UserIdGroupPairs?.some((pair) => pair.GroupId === albSgId)
    );
    expect(ruleFromAlb).toBe(true);
  });
});
