// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketPolicyCommand, GetPublicAccessBlockCommand,} from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";
import { IAMClient, GetInstanceProfileCommand, GetRoleCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeListenersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { AutoScalingClient, DescribeAutoScalingGroupsCommand} from "@aws-sdk/client-auto-scaling";
import { CloudFrontClient, GetDistributionCommand, GetOriginAccessControlCommand } from "@aws-sdk/client-cloudfront";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const cloudFrontClient = new CloudFrontClient({ region: "us-east-1" }); // CloudFront is always us-east-1

describe("TapStack Integration Tests", () => {
  let awsAccountId: string;
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let internetGatewayId: string;
  let natGatewayIds: string[];
  let s3BucketName: string;
  let s3BucketArn: string;
  let cloudfrontDistributionId: string;
  let cloudfrontDistributionDomainName: string;
  let cloudfrontDistributionArn: string;
  let iamRoleName: string;
  let iamRoleArn: string;
  let iamInstanceProfileName: string;
  let loadBalancerArn: string;
  let loadBalancerDnsName: string;
  let autoScalingGroupName: string;
  let autoScalingGroupArn: string;

  beforeAll(async () => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackKey];

    // Get AWS account ID
    const { Account } = await stsClient.send(new GetCallerIdentityCommand({}));
    awsAccountId = Account!;

    // Extract outputs from deployment
    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    internetGatewayId = stackOutputs["internet-gateway-id"];
    natGatewayIds = stackOutputs["nat-gateway-ids"];
    s3BucketName = stackOutputs["s3-bucket-name"];
    s3BucketArn = stackOutputs["s3-bucket-arn"];
    cloudfrontDistributionId = stackOutputs["cloudfront-distribution-id"];
    cloudfrontDistributionDomainName = stackOutputs["cloudfront-distribution-domain-name"];
    cloudfrontDistributionArn = stackOutputs["cloudfront-distribution-arn"];
    iamRoleName = stackOutputs["iam-role-name"];
    iamRoleArn = stackOutputs["iam-role-arn"];
    iamInstanceProfileName = stackOutputs["iam-instance-profile-name"];
    loadBalancerArn = stackOutputs["load-balancer-arn"];
    loadBalancerDnsName = stackOutputs["load-balancer-dns-name"];
    autoScalingGroupName = stackOutputs["auto-scaling-group-name"];
    autoScalingGroupArn = stackOutputs["auto-scaling-group-arn"];

    if (!vpcId || !publicSubnetIds || !privateSubnetIds || !s3BucketName || !awsAccountId || 
        !internetGatewayId || !natGatewayIds || !cloudfrontDistributionId || !iamRoleName || 
        !loadBalancerArn || !autoScalingGroupName) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("AWS Account Verification", () => {
    test("AWS account ID matches expected value", async () => {
      const { Account } = await stsClient.send(new GetCallerIdentityCommand({}));
      expect(Account).toBe(awsAccountId);
    }, 20000);
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists and has correct CIDR block configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");
      expect(vpc?.DhcpOptionsId).toBeDefined();
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("vpc"))).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
    }, 20000);

    test("Public subnets exist with correct configuration and availability zones", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(Subnets?.length).toBe(2);

      const expectedCidrs = ["10.0.1.0/24", "10.0.2.0/24"];
      const expectedAzs = [`${awsRegion}a`, `${awsRegion}b`];
      
      Subnets?.forEach((subnet) => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(expectedCidrs).toContain(subnet?.CidrBlock);
        expect(expectedAzs).toContain(subnet?.AvailabilityZone);
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
        expect(subnet?.State).toBe("available");
        expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "public")).toBe(true);
        expect(subnet?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("public-subnet"))).toBe(true);
      });
    }, 20000);

    test("Private subnets exist with correct configuration and availability zones", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(Subnets?.length).toBe(2);

      const expectedCidrs = ["10.0.10.0/24", "10.0.20.0/24"];
      const expectedAzs = [`${awsRegion}a`, `${awsRegion}b`];
      
      Subnets?.forEach((subnet) => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(expectedCidrs).toContain(subnet?.CidrBlock);
        expect(expectedAzs).toContain(subnet?.AvailabilityZone);
        expect(subnet?.MapPublicIpOnLaunch).toBe(false);
        expect(subnet?.State).toBe("available");
        expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "private")).toBe(true);
        expect(subnet?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("private-subnet"))).toBe(true);
      });
    }, 20000);

    test("Internet Gateway exists and is properly attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );
      expect(InternetGateways?.length).toBe(1);

      const igw = InternetGateways?.[0];
      expect(igw?.InternetGatewayId).toBe(internetGatewayId);
      expect(igw?.Attachments?.length).toBe(1);
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
      expect(igw?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("igw"))).toBe(true);
    }, 20000);

    test("NAT Gateways exist in public subnets with proper configuration", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: natGatewayIds })
      );
      expect(NatGateways?.length).toBe(2);

      NatGateways?.forEach((natGw, index) => {
        expect(natGw?.NatGatewayId).toBe(natGatewayIds[index]);
        expect(publicSubnetIds).toContain(natGw?.SubnetId);
        expect(natGw?.State).toBe("available");
        expect(natGw?.ConnectivityType).toBe("public");
        expect(natGw?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("nat-gateway"))).toBe(true);
        expect(natGw?.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
      });
    }, 20000);

    test("Route tables are configured correctly for public and private subnets", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      // Should have at least 4 route tables (default + public + 2 private)
      expect(RouteTables?.length).toBeGreaterThanOrEqual(4);

      // Check for public route table with IGW route
      const publicRouteTable = RouteTables?.find(rt => 
        rt.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("public-rt"))
      );
      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable?.Routes?.some(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId === internetGatewayId
      )).toBe(true);

      // Check for private route tables with NAT Gateway routes
      const privateRouteTables = RouteTables?.filter(rt => 
        rt.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("private-rt"))
      );
      expect(privateRouteTables?.length).toBe(2);

      privateRouteTables?.forEach((privateRt) => {
        const hasNatRoute = privateRt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && 
          natGatewayIds.includes(route.NatGatewayId || "")
        );
        expect(hasNatRoute).toBe(true);
      });
    }, 20000);
  });

  describe("S3 and CloudFront Configuration", () => {
    test("S3 bucket exists with correct configuration for static website hosting", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));

      // Verify bucket name pattern
      expect(s3BucketName).toMatch(/^my-static-website-.*-\d+$/);

      // Check public access is blocked appropriately for CloudFront
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(false); // Allow CloudFront policy
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(false); // Allow CloudFront access
    }, 20000);

    test("S3 bucket policy allows CloudFront Origin Access Control", async () => {
      const { Policy } = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: s3BucketName })
      );
      
      expect(Policy).toBeDefined();
      const policyDoc = JSON.parse(Policy!);
      
      // Check for CloudFront service principal statement
      const cloudfrontStatement = policyDoc.Statement.find((stmt: any) => 
        stmt.Principal?.Service?.includes("cloudfront.amazonaws.com")
      );
      expect(cloudfrontStatement).toBeDefined();
      expect(cloudfrontStatement.Action).toContain("s3:GetObject");
      expect(cloudfrontStatement.Resource).toBe(`${s3BucketArn}/*`);
      
      // Check for condition with distribution ARN
      expect(cloudfrontStatement.Condition).toBeDefined();
      expect(cloudfrontStatement.Condition.StringEquals).toBeDefined();
      expect(cloudfrontStatement.Condition.StringEquals["AWS:SourceArn"]).toContain(cloudfrontDistributionArn);
    }, 20000);

    test("CloudFront distribution is properly configured with S3 origin", async () => {
      const { Distribution } = await cloudFrontClient.send(
        new GetDistributionCommand({ Id: cloudfrontDistributionId })
      );

      expect(Distribution?.Id).toBe(cloudfrontDistributionId);
      expect(Distribution?.DomainName).toBe(cloudfrontDistributionDomainName);
      expect(Distribution?.Status).toBe("Deployed");
      expect(Distribution?.DistributionConfig?.Enabled).toBe(true);
      expect(Distribution?.DistributionConfig?.DefaultRootObject).toBe("index.html");

      // Check origin configuration
      const origin = Distribution?.DistributionConfig?.Origins?.Items?.[0];
      expect(origin?.Id).toBe("s3-origin");
      expect(origin?.DomainName).toContain(s3BucketName);
      expect(origin?.OriginAccessControlId).toBeDefined();

      // Check default cache behavior
      const defaultCacheBehavior = Distribution?.DistributionConfig?.DefaultCacheBehavior;
      expect(defaultCacheBehavior?.TargetOriginId).toBe("s3-origin");
      expect(defaultCacheBehavior?.ViewerProtocolPolicy).toBe("redirect-to-https");
      expect(defaultCacheBehavior?.AllowedMethods?.Items).toContain("GET");
      expect(defaultCacheBehavior?.AllowedMethods?.Items).toContain("HEAD");
      expect(defaultCacheBehavior?.Compress).toBe(true);
    }, 30000);
  });

  describe("IAM Configuration", () => {
    test("IAM role exists with correct assume role policy for EC2", async () => {
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: iamRoleName })
      );
      
      expect(Role?.RoleName).toBe(iamRoleName);
      expect(Role?.Tags?.some(tag => tag.Key === "Name" && tag.Value === iamRoleName)).toBe(true);
      expect(Role?.Tags?.some(tag => tag.Key === "Purpose" && tag.Value === "ec2-web-server-role")).toBe(true);

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Effect).toBe("Allow");
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain("ec2.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Action).toBe("sts:AssumeRole");
    }, 20000);

    test("IAM role has required AWS managed policies attached", async () => {
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: iamRoleName })
      );

      expect(AttachedPolicies?.length).toBeGreaterThanOrEqual(2);

      // Check for SSM policy
      const ssmPolicy = AttachedPolicies?.find(policy => 
        policy.PolicyArn === "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      );
      expect(ssmPolicy).toBeDefined();

      // Check for CloudWatch policy
      const cloudwatchPolicy = AttachedPolicies?.find(policy => 
        policy.PolicyArn === "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
      );
      expect(cloudwatchPolicy).toBeDefined();
    }, 20000);

    test("IAM instance profile is correctly configured", async () => {
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: iamInstanceProfileName })
      );

      expect(InstanceProfile?.InstanceProfileName).toBe(iamInstanceProfileName);
      expect(InstanceProfile?.Roles?.length).toBe(1);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe(iamRoleName);
    }, 20000);
  });

  describe("Auto Scaling and Load Balancer Configuration", () => {
    test("Application Load Balancer is properly configured", async () => {
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [loadBalancerArn] })
      );

      expect(LoadBalancers?.length).toBe(1);
      const alb = LoadBalancers?.[0];
      
      expect(alb?.LoadBalancerArn).toBe(loadBalancerArn);
      expect(alb?.DNSName).toBe(loadBalancerDnsName);
      expect(alb?.Type).toBe("application");
      expect(alb?.State?.Code).toBe("active");
      expect(alb?.Scheme).toBe("internet-facing");
      
      // Check subnets - should be in public subnets
      const albSubnetIds = alb?.AvailabilityZones?.map(az => az.SubnetId) || [];
      publicSubnetIds.forEach(subnetId => {
        expect(albSubnetIds).toContain(subnetId);
      });

      // Check security groups
      expect(alb?.SecurityGroups?.length).toBeGreaterThan(0);
    }, 20000);

    test("Target group is configured with proper health checks", async () => {
      const { TargetGroups } = await elbClient.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: loadBalancerArn
        })
      );

      expect(TargetGroups?.length).toBeGreaterThanOrEqual(1);
      const targetGroup = TargetGroups?.[0];

      expect(targetGroup?.Port).toBe(80);
      expect(targetGroup?.Protocol).toBe("HTTP");
      expect(targetGroup?.VpcId).toBe(vpcId);
      expect(targetGroup?.HealthCheckEnabled).toBe(true);
      expect(targetGroup?.HealthCheckPath).toBe("/");
      expect(targetGroup?.HealthCheckProtocol).toBe("HTTP");
      expect(targetGroup?.HealthyThresholdCount).toBe(2);
      expect(targetGroup?.UnhealthyThresholdCount).toBe(2);
      expect(targetGroup?.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup?.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup?.Matcher?.HttpCode).toBe("200");
    }, 20000);

    test("ALB listener is configured to forward traffic to target group", async () => {
      const { Listeners } = await elbClient.send(
        new DescribeListenersCommand({
          LoadBalancerArn: loadBalancerArn
        })
      );

      expect(Listeners?.length).toBeGreaterThanOrEqual(1);
      const listener = Listeners?.[0];

      expect(listener?.Port).toBe(80);
      expect(listener?.Protocol).toBe("HTTP");
      expect(listener?.DefaultActions?.length).toBe(1);
      expect(listener?.DefaultActions?.[0]?.Type).toBe("forward");
      expect(listener?.DefaultActions?.[0]?.TargetGroupArn).toBeDefined();
    }, 20000);

    test("Auto Scaling Group is properly configured with launch template", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoScalingGroupName]
        })
      );

      expect(AutoScalingGroups?.length).toBe(1);
      const asg = AutoScalingGroups?.[0];

      expect(asg?.AutoScalingGroupName).toBe(autoScalingGroupName);
      expect(asg?.AutoScalingGroupARN).toBe(autoScalingGroupArn);
      expect(asg?.MinSize).toBe(1);
      expect(asg?.MaxSize).toBe(3);
      expect(asg?.DesiredCapacity).toBe(2);
      expect(asg?.HealthCheckType).toBe("ELB");
      expect(asg?.HealthCheckGracePeriod).toBe(300);

      // Check VPC zone identifiers (should be private subnets)
      const asgSubnetIds = asg?.VPCZoneIdentifier?.split(",") || [];
      privateSubnetIds.forEach(subnetId => {
        expect(asgSubnetIds).toContain(subnetId);
      });

      // Check target group ARNs
      expect(asg?.TargetGroupARNs?.length).toBeGreaterThan(0);

      // Check launch template
      expect(asg?.LaunchTemplate?.LaunchTemplateId).toBeDefined();
      expect(asg?.LaunchTemplate?.Version).toBe("$Latest");
    }, 20000);
  });

  describe("Security Group Configuration", () => {
    test("ALB security group allows HTTP and HTTPS traffic from internet", async () => {
      // Get ALB security groups
      const { LoadBalancers } = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [loadBalancerArn] })
      );
      const albSecurityGroupIds = LoadBalancers?.[0]?.SecurityGroups || [];

      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: albSecurityGroupIds })
      );

      const albSg = SecurityGroups?.find(sg => 
        sg.GroupName?.includes("alb-sg")
      );
      expect(albSg).toBeDefined();

      // Check HTTP ingress rule
      const httpRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

      // Check HTTPS ingress rule
      const httpsRule = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

      // Check egress rules allow all outbound traffic
      expect(albSg?.IpPermissionsEgress?.length).toBeGreaterThan(0);
    }, 20000);

    test("Instance security group allows traffic only from ALB security group", async () => {
      // Get all security groups in VPC
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      const instanceSg = SecurityGroups?.find(sg => 
        sg.GroupName?.includes("instance-sg")
      );
      expect(instanceSg).toBeDefined();

      const albSg = SecurityGroups?.find(sg => 
        sg.GroupName?.includes("alb-sg")
      );
      expect(albSg).toBeDefined();

      // Check HTTP ingress rule from ALB security group
      const httpRule = instanceSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === albSg?.GroupId
      )).toBe(true);

      // Check egress rules allow all outbound traffic
      expect(instanceSg?.IpPermissionsEgress?.length).toBeGreaterThan(0);
    }, 20000);
  });
});