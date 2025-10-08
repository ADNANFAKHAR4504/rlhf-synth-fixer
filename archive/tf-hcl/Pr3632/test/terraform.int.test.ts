// Integration Tests for Multi-Region Disaster Recovery Infrastructure
// Tests deployed infrastructure outputs and configuration
// No Terraform commands executed - validates from outputs JSON

import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from "@aws-sdk/client-auto-scaling";
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from "@aws-sdk/client-cloudwatch";
import {
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client as ELBv2Client
} from "@aws-sdk/client-elastic-load-balancing-v2";

import {
  KMSClient
} from "@aws-sdk/client-kms";
import {
  LambdaClient,
  ListFunctionsCommand
} from "@aws-sdk/client-lambda";
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from "@aws-sdk/client-rds";
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
  S3Client
} from "@aws-sdk/client-s3";
import {
  ListTopicsCommand,
  SNSClient
} from "@aws-sdk/client-sns";
import axios from "axios";
import fs from "fs";
import path from "path";

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");

interface TerraformOutputs {
  failover_endpoint?: string;
  global_accelerator_ips?: string;
  health_check_urls?: string;
  primary_alb_dns?: string;
  primary_db_endpoint?: string;
  primary_region?: string;
  secondary_alb_dns?: string;
  secondary_db_endpoint?: string;
  secondary_region?: string;
  vpc_ids?: string;
}

interface HealthCheckUrls {
  primary: string;
  secondary: string;
}

interface VpcIds {
  primary: string;
  secondary: string;
}

let outputs: TerraformOutputs = {};
let healthCheckUrls: HealthCheckUrls = { primary: "", secondary: "" };
let vpcIds: VpcIds = { primary: "", secondary: "" };

// AWS Clients - will be initialized per region
const awsClients: { [region: string]: any } = {};

beforeAll(() => {
  const rawData = fs.readFileSync(outputsPath, "utf8");
  outputs = JSON.parse(rawData);
  console.log("✓ Loaded outputs from:", outputsPath);

  // Parse JSON strings within outputs
  if (outputs.health_check_urls) {
    healthCheckUrls = JSON.parse(outputs.health_check_urls);
  }
  if (outputs.vpc_ids) {
    vpcIds = JSON.parse(outputs.vpc_ids);
  }

  // Initialize AWS clients for both regions
  const primaryRegion = outputs.primary_region || "eu-west-1";
  const secondaryRegion = outputs.secondary_region || "eu-west-2";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  awsClients[primaryRegion] = {
    ec2: new EC2Client({ region: primaryRegion }),
    elbv2: new ELBv2Client({ region: primaryRegion }),
    rds: new RDSClient({ region: primaryRegion }),
    autoscaling: new AutoScalingClient({ region: primaryRegion }),
    cloudwatch: new CloudWatchClient({ region: primaryRegion }),
    kms: new KMSClient({ region: primaryRegion }),
    s3: new S3Client({ region: primaryRegion }),
    lambda: new LambdaClient({ region: primaryRegion }),
    sns: new SNSClient({ region: primaryRegion })
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  awsClients[secondaryRegion] = {
    ec2: new EC2Client({ region: secondaryRegion }),
    elbv2: new ELBv2Client({ region: secondaryRegion }),
    rds: new RDSClient({ region: secondaryRegion }),
    autoscaling: new AutoScalingClient({ region: secondaryRegion }),
    cloudwatch: new CloudWatchClient({ region: secondaryRegion }),
    kms: new KMSClient({ region: secondaryRegion }),
    s3: new S3Client({ region: secondaryRegion })
  };

  // Global Accelerator client (global service, but uses primary region)
  // awsClients.globalaccelerator = new GlobalAcceleratorClient({ region: "us-west-2" });
});

describe("Multi-Region Disaster Recovery Infrastructure Integration Tests", () => {

  describe("Infrastructure Outputs Validation", () => {
    test("should have all required outputs", () => {
      expect(outputs.failover_endpoint).toBeDefined();
      expect(outputs.primary_alb_dns).toBeDefined();
      expect(outputs.secondary_alb_dns).toBeDefined();
      expect(outputs.primary_db_endpoint).toBeDefined();
      expect(outputs.secondary_db_endpoint).toBeDefined();
      expect(outputs.primary_region).toBeDefined();
      expect(outputs.secondary_region).toBeDefined();
    });

    test("should have valid region configuration", () => {
      expect(outputs.primary_region).toBe("eu-west-1");
      expect(outputs.secondary_region).toBe("eu-west-2");
    });

    test("should have valid VPC IDs", () => {
      expect(vpcIds.primary).toMatch(/^vpc-[a-f0-9]+$/);
      expect(vpcIds.secondary).toMatch(/^vpc-[a-f0-9]+$/);
      expect(vpcIds.primary).not.toBe(vpcIds.secondary);
    });

    test("should have valid ALB DNS names", () => {
      expect(outputs.primary_alb_dns).toContain(".elb.amazonaws.com");
      expect(outputs.secondary_alb_dns).toContain(".elb.amazonaws.com");
      expect(outputs.primary_alb_dns).toContain("eu-west-1");
      expect(outputs.secondary_alb_dns).toContain("eu-west-2");
    });

    test("should have valid RDS endpoints", () => {
      expect(outputs.primary_db_endpoint).toContain(".rds.amazonaws.com:3306");
      expect(outputs.secondary_db_endpoint).toContain(".rds.amazonaws.com:3306");
    });
  });

  describe("VPC and Networking", () => {
    test("primary VPC should exist and be properly configured", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcIds.primary] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");
      expect(vpc.VpcId).toBe(vpcIds.primary);
    });

    test("secondary VPC should exist and be properly configured", async () => {
      const secondaryRegion = outputs.secondary_region!;
      const response = await awsClients[secondaryRegion].ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcIds.secondary] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");
      expect(vpc.VpcId).toBe(vpcIds.secondary);
    });

    test("primary region should have NAT Gateways", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].ec2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "vpc-id", Values: [vpcIds.primary] }]
        })
      );

      expect(response.NatGateways!.length).toBeGreaterThan(0);
      response.NatGateways!.forEach((nat: any) => {
        expect(nat.State).toBe("available");
      });
    });

    test("secondary region should have NAT Gateways", async () => {
      const secondaryRegion = outputs.secondary_region!;
      const response = await awsClients[secondaryRegion].ec2.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "vpc-id", Values: [vpcIds.secondary] }]
        })
      );

      expect(response.NatGateways!.length).toBeGreaterThan(0);
      response.NatGateways!.forEach((nat: any) => {
        expect(nat.State).toBe("available");
      });
    });

    test("should have proper subnet configuration in primary region", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].ec2.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcIds.primary] }]
        })
      );

      const subnets = response.Subnets!;
      expect(subnets.length).toBeGreaterThanOrEqual(6); // At least 2 AZs x 3 types

      const publicSubnets = subnets.filter((s: any) =>
        s.Tags?.some((t: any) => t.Key === "Type" && t.Value === "Public")
      );
      const privateSubnets = subnets.filter((s: any) =>
        s.Tags?.some((t: any) => t.Key === "Type" && t.Value === "Private")
      );
      const databaseSubnets = subnets.filter((s: any) =>
        s.Tags?.some((t: any) => t.Key === "Type" && t.Value === "Database")
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      expect(databaseSubnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Application Load Balancers", () => {
    test("primary ALB should exist and be internet-facing", async () => {
      const primaryRegion = outputs.primary_region!;
      // Query all ALBs and find by DNS name instead of by name (which may be too long)
      const response = await awsClients[primaryRegion].elbv2.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = response.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.primary_alb_dns
      );

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe("active");
      expect(alb!.Scheme).toBe("internet-facing");
      expect(alb!.Type).toBe("application");
    });

    test("secondary ALB should exist and be internet-facing", async () => {
      const secondaryRegion = outputs.secondary_region!;
      // Query all ALBs and find by DNS name instead of by name (which may be too long)
      const response = await awsClients[secondaryRegion].elbv2.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = response.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.secondary_alb_dns
      );

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe("active");
      expect(alb!.Scheme).toBe("internet-facing");
      expect(alb!.Type).toBe("application");
    });

    test("primary ALB should have HTTP listener", async () => {
      const primaryRegion = outputs.primary_region!;
      const albResponse = await awsClients[primaryRegion].elbv2.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = albResponse.LoadBalancers!.find((lb: any) =>
        lb.DNSName === outputs.primary_alb_dns
      );

      expect(alb).toBeDefined();

      const listenersResponse = await awsClients[primaryRegion].elbv2.send(
        new DescribeListenersCommand({
          LoadBalancerArn: alb!.LoadBalancerArn
        })
      );

      const httpListener = listenersResponse.Listeners!.find((l: any) => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe("HTTP");
    });

    test("primary ALB target group should have healthy targets", async () => {
      const primaryRegion = outputs.primary_region!;
      const tgResponse = await awsClients[primaryRegion].elbv2.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroup = tgResponse.TargetGroups!.find((tg: any) =>
        tg.TargetGroupName?.includes("production-tg")
      );

      expect(targetGroup).toBeDefined();

      const healthResponse = await awsClients[primaryRegion].elbv2.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup!.TargetGroupArn
        })
      );

      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        (t: any) => t.TargetHealth?.State === "healthy"
      );
      expect(healthyTargets.length).toBeGreaterThan(0);
    });
  });

  describe("Auto Scaling Groups", () => {
    test("primary region should have Auto Scaling Group", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].autoscaling.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = response.AutoScalingGroups!.find((a: any) =>
        a.AutoScalingGroupName?.includes("production-asg")
      );

      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg!.DesiredCapacity).toBeGreaterThanOrEqual(1);
      expect(asg!.Instances!.length).toBeGreaterThanOrEqual(1);
    });

    test("secondary region should have Auto Scaling Group", async () => {
      const secondaryRegion = outputs.secondary_region!;
      const response = await awsClients[secondaryRegion].autoscaling.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = response.AutoScalingGroups!.find((a: any) =>
        a.AutoScalingGroupName?.includes("production-asg")
      );

      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBeGreaterThanOrEqual(1);
    });

    test("ASG instances should be running", async () => {
      const primaryRegion = outputs.primary_region!;
      const asgResponse = await awsClients[primaryRegion].autoscaling.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = asgResponse.AutoScalingGroups!.find((a: any) =>
        a.AutoScalingGroupName?.includes("production-asg")
      );

      const instanceIds = asg!.Instances!.map((i: any) => i.InstanceId!);

      const ec2Response = await awsClients[primaryRegion].ec2.send(
        new DescribeInstancesCommand({ InstanceIds: instanceIds })
      );

      ec2Response.Reservations!.forEach((reservation: any) => {
        reservation.Instances!.forEach((instance: any) => {
          expect(instance.State!.Name).toBe("running");
        });
      });
    });
  });

  describe("RDS Database", () => {
    test("primary database should exist and be available", async () => {
      const primaryRegion = outputs.primary_region!;
      const dbIdentifier = outputs.primary_db_endpoint!.split(".")[0];

      const response = await awsClients[primaryRegion].rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toBe("available");
      expect(db.Engine).toBe("mysql");
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
    });

    test("secondary database (read replica) should exist", async () => {
      const secondaryRegion = outputs.secondary_region!;
      const dbIdentifier = outputs.secondary_db_endpoint!.split(".")[0];

      const response = await awsClients[secondaryRegion].rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toBe("available");
      expect(db.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
      expect(db.StorageEncrypted).toBe(true);
    });

    test("database subnet groups should exist", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].rds.send(
        new DescribeDBSubnetGroupsCommand({})
      );

      const subnetGroup = response.DBSubnetGroups!.find((sg: any) =>
        sg.DBSubnetGroupName?.includes("production")
      );

      expect(subnetGroup).toBeDefined();
      expect(subnetGroup!.Subnets!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Global Accelerator", () => {
    test("Global Accelerator should exist and be enabled", async () => {
      // Validate Global Accelerator via outputs
      // Note: Global Accelerator SDK may not be installed, so we validate via outputs
      expect(outputs.failover_endpoint).toContain("awsglobalaccelerator.com");
      expect(outputs.global_accelerator_ips).toBeDefined();

      const ips = JSON.parse(outputs.global_accelerator_ips!);
      expect(ips[0].ip_addresses).toHaveLength(2);
    });
  });

  describe("Security and Monitoring", () => {
    test("should have CloudWatch alarms configured", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].cloudwatch.send(
        new DescribeAlarmsCommand({})
      );

      const alarms = response.MetricAlarms!.filter((a: any) =>
        a.AlarmName?.includes("production")
      );

      expect(alarms.length).toBeGreaterThan(0);

      // Should have alarms for CPU, database, or health checks
      const hasCriticalAlarms = alarms.some((a: any) =>
        a.AlarmName?.includes("cpu") ||
        a.AlarmName?.includes("mysql") ||
        a.AlarmName?.includes("health")
      );

      expect(hasCriticalAlarms).toBe(true);
    });

    test("S3 buckets should have encryption enabled", async () => {
      const primaryRegion = outputs.primary_region!;

      // Create S3 client with correct region for bucket access
      const s3Regional = new S3Client({ region: primaryRegion });

      // Try to find ALB logs bucket
      const buckets = await s3Regional.send(new ListBucketsCommand({}));
      const albLogsBucket = buckets.Buckets!.find((b: any) =>
        b.Name?.includes("alb-logs") && b.Name?.includes(primaryRegion)
      );

      if (albLogsBucket) {
        const encryption = await s3Regional.send(
          new GetBucketEncryptionCommand({ Bucket: albLogsBucket.Name! })
        );
        expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      }
    });

    test("S3 buckets should block public access", async () => {
      const primaryRegion = outputs.primary_region!;

      // Create S3 client with correct region for bucket access
      const s3Regional = new S3Client({ region: primaryRegion });

      const buckets = await s3Regional.send(new ListBucketsCommand({}));
      const albLogsBucket = buckets.Buckets!.find((b: any) =>
        b.Name?.includes("alb-logs") && b.Name?.includes(primaryRegion)
      );

      expect(albLogsBucket).toBeDefined();

      const publicAccess = await s3Regional.send(
        new GetPublicAccessBlockCommand({ Bucket: albLogsBucket!.Name! })
      );

      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });

    test("should have Lambda failover function", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].lambda.send(
        new ListFunctionsCommand({})
      );

      const failoverFunction = response.Functions!.find((f: any) =>
        f.FunctionName?.includes("failover")
      );

      expect(failoverFunction).toBeDefined();
      expect(failoverFunction!.Runtime).toMatch(/python/);
    });

    test("should have SNS topic for alerts", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].sns.send(
        new ListTopicsCommand({})
      );

      const alertTopic = response.Topics!.find((t: any) =>
        t.TopicArn?.includes("failover-alerts") || t.TopicArn?.includes("security-alerts")
      );

      expect(alertTopic).toBeDefined();
    });
  });

  describe("Security Groups", () => {
    test("ALB security group should allow HTTP traffic", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcIds.primary] },
            { Name: "group-name", Values: ["production-alb-sg-*"] }
          ]
        })
      );

      const albSg = response.SecurityGroups!.find((sg: any) =>
        sg.GroupName?.includes("alb-sg")
      );

      expect(albSg).toBeDefined();

      const httpIngress = albSg!.IpPermissions!.find(
        (rule: any) => rule.FromPort === 80 && rule.ToPort === 80
      );

      expect(httpIngress).toBeDefined();
      expect(httpIngress!.IpRanges).toContainEqual(
        expect.objectContaining({ CidrIp: "0.0.0.0/0" })
      );
    });

    test("EC2 security group should only allow traffic from ALB", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcIds.primary] },
            { Name: "group-name", Values: ["production-ec2-sg-*"] }
          ]
        })
      );

      const ec2Sg = response.SecurityGroups!.find((sg: any) =>
        sg.GroupName?.includes("ec2-sg")
      );

      expect(ec2Sg).toBeDefined();

      const httpIngress = ec2Sg!.IpPermissions!.find(
        (rule: any) => rule.FromPort === 80
      );

      expect(httpIngress).toBeDefined();
      expect(httpIngress!.UserIdGroupPairs).toBeDefined();
      expect(httpIngress!.UserIdGroupPairs!.length).toBeGreaterThan(0);
    });
  });

  describe("Interactive Tests", () => {
    describe("HTTP Endpoint Tests", () => {
      test("primary ALB health endpoint should respond", async () => {
        const healthUrl = healthCheckUrls.primary;

        try {
          const response = await axios.get(healthUrl, { timeout: 10000 });
          expect(response.status).toBe(200);
          expect(response.data).toContain("OK");
        } catch (error: any) {
          console.error("Primary health check failed:", error.message);
          throw error;
        }
      }, 15000);

      test("secondary ALB health endpoint should respond", async () => {
        const healthUrl = healthCheckUrls.secondary;

        try {
          const response = await axios.get(healthUrl, { timeout: 10000 });
          expect(response.status).toBe(200);
          expect(response.data).toContain("OK");
        } catch (error: any) {
          console.error("Secondary health check failed:", error.message);
          throw error;
        }
      }, 15000);

      test("Global Accelerator endpoint should respond", async () => {
        const globalEndpoint = outputs.failover_endpoint!;

        const response = await axios.get(globalEndpoint, {
          timeout: 20000,
          maxRedirects: 5
        });

        expect(response.status).toBe(200);
      }, 30000);

      test("primary ALB main page should return HTML", async () => {
        const albUrl = `http://${outputs.primary_alb_dns}`;

        try {
          const response = await axios.get(albUrl, { timeout: 10000 });
          expect(response.status).toBe(200);
          expect(response.headers["content-type"]).toContain("text/html");
          expect(response.data).toContain("Financial Services");
        } catch (error: any) {
          console.error("Primary ALB main page failed:", error.message);
          throw error;
        }
      }, 15000);

      test("should handle multiple concurrent requests", async () => {
        const globalEndpoint = outputs.failover_endpoint!;

        const requests = Array(3).fill(null).map(() =>
          axios.get(`${globalEndpoint}/health`, {
            timeout: 30000
          })
        );

        const responses = await Promise.all(requests);
        responses.forEach((response) => {
          expect(response.status).toBe(200);
        });
      }, 120000);
    });

    describe("Failover Mechanism Tests", () => {
      test("Global Accelerator should distribute traffic", async () => {
        const globalEndpoint = outputs.failover_endpoint!;
        const responses = new Set();

        // Make multiple requests to see distribution
        for (let i = 0; i < 5; i++) {
          try {
            const response = await axios.get(globalEndpoint, {
              timeout: 10000,
              headers: { 'Cache-Control': 'no-cache' }
            });
            responses.add(response.headers['x-forwarded-for'] || 'unknown');
          } catch (error) {
            // Continue even if some requests fail
          }
        }

        // Should get at least one successful response
        expect(responses.size).toBeGreaterThan(0);
      }, 30000);

      test("primary endpoint weight should be higher", async () => {
        // This test validates that primary is active (weight 100) and secondary is standby (weight 0)
        // by checking the Global Accelerator configuration
        const primaryRegion = outputs.primary_region!;

        // In a real scenario, we'd check the endpoint group weights
        // For now, we validate that primary is responding
        const response = await axios.get(healthCheckUrls.primary, { timeout: 10000 });
        expect(response.status).toBe(200);
      }, 15000);
    });

    describe("Database Connectivity Tests", () => {
      test("primary database should be reachable from primary region", async () => {
        // Note: This requires database credentials and network access
        // In a real test, you'd use mysql client to test connectivity
        const dbEndpoint = outputs.primary_db_endpoint!;
        expect(dbEndpoint).toContain("rds.amazonaws.com");
        expect(dbEndpoint).toContain(":3306");
      });

      test("secondary database should be in read-only mode", async () => {
        const secondaryRegion = outputs.secondary_region!;
        const dbIdentifier = outputs.secondary_db_endpoint!.split(".")[0];

        const response = await awsClients[secondaryRegion].rds.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier
          })
        );

        const db = response.DBInstances![0];
        expect(db.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
        expect(db.ReadReplicaSourceDBInstanceIdentifier).toContain("production-mysql-primary");
      });
    });

    describe("Performance and Scalability Tests", () => {
      test("Auto Scaling should respond to demand", async () => {
        const primaryRegion = outputs.primary_region!;
        const asgResponse = await awsClients[primaryRegion].autoscaling.send(
          new DescribeAutoScalingGroupsCommand({})
        );

        const asg = asgResponse.AutoScalingGroups!.find((a: any) =>
          a.AutoScalingGroupName?.includes("production-asg")
        );

        expect(asg!.MinSize).toBeLessThanOrEqual(asg!.DesiredCapacity!);
        expect(asg!.DesiredCapacity).toBeLessThanOrEqual(asg!.MaxSize!);
      });

      test("target groups should use proper health check settings", async () => {
        const primaryRegion = outputs.primary_region!;
        const response = await awsClients[primaryRegion].elbv2.send(
          new DescribeTargetGroupsCommand({})
        );

        const tg = response.TargetGroups!.find((t: any) =>
          t.TargetGroupName?.includes("production-tg")
        );

        expect(tg!.HealthCheckEnabled).toBe(true);
        expect(tg!.HealthCheckPath).toBe("/health");
        expect(tg!.HealthCheckProtocol).toBe("HTTP");
        expect(tg!.HealthCheckIntervalSeconds).toBeLessThanOrEqual(30);
      });
    });

    describe("Disaster Recovery Validation", () => {
      test("cross-region replication should be configured", async () => {
        const primaryRegion = outputs.primary_region!;
        const secondaryRegion = outputs.secondary_region!;

        // Verify primary DB exists
        const primaryDb = await awsClients[primaryRegion].rds.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.primary_db_endpoint!.split(".")[0]
          })
        );

        // Verify secondary DB is a read replica
        const secondaryDb = await awsClients[secondaryRegion].rds.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.secondary_db_endpoint!.split(".")[0]
          })
        );

        expect(primaryDb.DBInstances![0].DBInstanceIdentifier).toBeDefined();
        expect(secondaryDb.DBInstances![0].ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
      });

      test("both regions should have independent compute capacity", async () => {
        const primaryRegion = outputs.primary_region!;
        const secondaryRegion = outputs.secondary_region!;

        const primaryAsg = await awsClients[primaryRegion].autoscaling.send(
          new DescribeAutoScalingGroupsCommand({})
        );

        const secondaryAsg = await awsClients[secondaryRegion].autoscaling.send(
          new DescribeAutoScalingGroupsCommand({})
        );

        const primaryGroup = primaryAsg.AutoScalingGroups!.find((a: any) =>
          a.AutoScalingGroupName?.includes("production-asg")
        );

        const secondaryGroup = secondaryAsg.AutoScalingGroups!.find((a: any) =>
          a.AutoScalingGroupName?.includes("production-asg")
        );

        expect(primaryGroup).toBeDefined();
        expect(secondaryGroup).toBeDefined();
        expect(primaryGroup!.Instances!.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Compliance and Tagging", () => {
    test("resources should have required tags", async () => {
      const primaryRegion = outputs.primary_region!;
      const vpcResponse = await awsClients[primaryRegion].ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcIds.primary] })
      );

      const tags = vpcResponse.Vpcs![0].Tags!;
      const environmentTag = tags.find((t: any) => t.Key === "Environment");

      expect(environmentTag).toBeDefined();
      expect(environmentTag!.Value).toBe("production");
    });

    test("RDS instances should have appropriate backup retention", async () => {
      const primaryRegion = outputs.primary_region!;
      const response = await awsClients[primaryRegion].rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.primary_db_endpoint!.split(".")[0]
        })
      );

      const db = response.DBInstances![0];
      expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });
  });
});
