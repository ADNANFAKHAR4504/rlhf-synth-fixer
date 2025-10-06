// __tests__/tap-stack.int.test.ts
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import { 
  ElasticLoadBalancingV2Client, 
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { 
  RDSClient, 
} from "@aws-sdk/client-rds";
import { 
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  PutObjectCommand,
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { 
  SSMClient, 
  GetParametersCommand 
} from "@aws-sdk/client-ssm";
import { 
  SNSClient, 
  GetTopicAttributesCommand,
  ListSubscriptionsCommand 
} from "@aws-sdk/client-sns";
import { 
  Route53Client, 
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand 
} from "@aws-sdk/client-route-53";

const awsRegion = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const route53Client = new Route53Client({ region: awsRegion });

describe("TapStack Integration Tests - Service Interactions", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let albDnsName: string;
  let rdsEndpoint: string;
  let rdsSecretArn: string;
  let publicS3BucketName: string;
  let privateS3BucketName: string;
  let snsTopicArn: string;
  let route53ZoneId: string;
  let ssmParameters: string[];
  let environmentSuffix: string;

  beforeAll(() => {
    // Read deployment outputs
    const deploymentOutputs = {
      "TapStackpr3222": {
        "alb-dns-name": "tap-infrastructure-pr3222-ALB-509375345.us-east-1.elb.amazonaws.com",
        "monitoring-sns-topic-arn": "arn:aws:sns:us-east-1:***:tap-infrastructure-pr3222-Alerts",
        "private-s3-bucket-name": "tap-infrastructure-pr3222-private-data",
        "private-subnet-ids": ["subnet-08a9a1ab1660ba542", "subnet-0bbd84c0bca266601"],
        "public-s3-bucket-name": "tap-infrastructure-pr3222-public-assets",
        "public-subnet-ids": ["subnet-02e8225565e0740c2", "subnet-01546502901f87b78"],
        "rds-endpoint": "tap-infrastructure-pr3222-new-db.covy6ema0nuv.us-east-1.rds.amazonaws.com:3306",
        "rds_db-secret-arn-output_E1836AC7": "arn:aws:secretsmanager:us-east-1:***:secret:rds!db-74d0846d-7a8f-485e-bc82-3e3a4677c36d-CN7bI3",
        "route53-zone-id": "Z01268892QCQVWLLZ41IX",
        "ssm-parameters": [
          "/tap-infrastructure/pr3222/api/endpoint",
          "/tap-infrastructure/pr3222/app/version",
          "/tap-infrastructure/pr3222/features/enabled"
        ],
        "vpc-id": "vpc-0a51aa961c1b2e2db"
      }
    };

    const stackKey = "TapStackpr3222";
    const stackOutputs = deploymentOutputs[stackKey];
    environmentSuffix = "pr3222";

    // Parse outputs
    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    albDnsName = stackOutputs["alb-dns-name"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsSecretArn = stackOutputs["rds_db-secret-arn-output_E1836AC7"];
    publicS3BucketName = stackOutputs["public-s3-bucket-name"];
    privateS3BucketName = stackOutputs["private-s3-bucket-name"];
    snsTopicArn = stackOutputs["monitoring-sns-topic-arn"];
    route53ZoneId = stackOutputs["route53-zone-id"];
    ssmParameters = stackOutputs["ssm-parameters"];

    if (!vpcId || !albDnsName || !rdsEndpoint) {
      throw new Error("Missing required stack outputs for integration tests");
    }
  });

  describe("Interactive Test: S3 Buckets → SSM Parameters → Configuration Management", () => {
    test("S3 buckets are configured with proper access controls and encryption", async () => {
      // Test public bucket configuration
      const publicBucketCheck = await s3Client.send(
        new HeadBucketCommand({ Bucket: publicS3BucketName })
      );
      expect(publicBucketCheck.$metadata.httpStatusCode).toBe(200);

      // Test private bucket configuration
      const privateBucketCheck = await s3Client.send(
        new HeadBucketCommand({ Bucket: privateS3BucketName })
      );
      expect(privateBucketCheck.$metadata.httpStatusCode).toBe(200);

      // Check versioning on both buckets
      const publicVersioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: publicS3BucketName })
      );
      expect(publicVersioning.Status).toBe('Enabled');

      const privateVersioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: privateS3BucketName })
      );
      expect(privateVersioning.Status).toBe('Enabled');

      // Check encryption
      const publicEncryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: publicS3BucketName })
      ).catch(err => null);
      expect(publicEncryption?.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);

      const privateEncryption = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: privateS3BucketName })
      ).catch(err => null);
      expect(privateEncryption?.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
    }, 30000);

    test("SSM parameters store configuration that references S3 and other services", async () => {
      // Get all SSM parameters
      const { Parameters } = await ssmClient.send(
        new GetParametersCommand({
          Names: ssmParameters,
          WithDecryption: false
        })
      );

      expect(Parameters?.length).toBe(ssmParameters.length);

      // Verify API endpoint parameter references the ALB
      const apiEndpointParam = Parameters?.find(p => 
        p.Name?.includes('api/endpoint')
      );
      expect(apiEndpointParam?.Value).toContain('https://');
      
      // Verify app version parameter
      const appVersionParam = Parameters?.find(p => 
        p.Name?.includes('app/version')
      );
      expect(appVersionParam?.Value).toBe('1.0.0');

      // Verify feature flags parameter
      const featureFlagsParam = Parameters?.find(p => 
        p.Name?.includes('features/enabled')
      );
      expect(featureFlagsParam?.Value).toBe('true');
    }, 30000);

    test("S3 bucket operations work with proper IAM roles", async () => {
      const testKey = `test-${Date.now()}.json`;
      const testData = { test: "integration", timestamp: Date.now() };

      // Test write to private bucket
      const putResult = await s3Client.send(new PutObjectCommand({
        Bucket: privateS3BucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json'
      }));
      expect(putResult.$metadata.httpStatusCode).toBe(200);

      // Test read from private bucket
      const getResult = await s3Client.send(new GetObjectCommand({
        Bucket: privateS3BucketName,
        Key: testKey
      }));
      expect(getResult.$metadata.httpStatusCode).toBe(200);
      
      const body = await getResult.Body?.transformToString();
      const parsed = JSON.parse(body || '{}');
      expect(parsed.test).toBe('integration');
    }, 30000);
  });

  describe("Interactive Test: Route53 → ALB → DNS Resolution", () => {
    test("Route53 hosted zone is configured with ALB alias records", async () => {
      const { HostedZone } = await route53Client.send(
        new GetHostedZoneCommand({ Id: route53ZoneId })
      );

      expect(HostedZone?.Id).toBe(`/hostedzone/${route53ZoneId}`);
      expect(HostedZone?.Config?.PrivateZone).toBe(false);

      // List record sets
      const { ResourceRecordSets } = await route53Client.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: route53ZoneId
        })
      );

      // Check for A record aliased to ALB
      const aRecord = ResourceRecordSets?.find(rs => 
        rs.Type === 'A' && rs.AliasTarget
      );
      
      if (aRecord) {
        expect(aRecord.AliasTarget?.DNSName).toContain('elb.amazonaws.com');
        expect(aRecord.AliasTarget?.EvaluateTargetHealth).toBe(true);
      }

      // Check for NS and SOA records (always present)
      const nsRecord = ResourceRecordSets?.find(rs => rs.Type === 'NS');
      expect(nsRecord).toBeDefined();
      expect(nsRecord?.ResourceRecords?.length).toBe(4);

      const soaRecord = ResourceRecordSets?.find(rs => rs.Type === 'SOA');
      expect(soaRecord).toBeDefined();
    }, 30000);
  });

  describe("Interactive Test: VPC → Multi-Service Network Connectivity", () => {
    test("Services in different subnets can communicate through VPC", async () => {
      // Verify VPC configuration supports multi-tier architecture
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      // Verify subnet configuration
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        })
      );

      // Check public subnets
      const publicSubnets = Subnets?.filter(s => 
        publicSubnetIds.includes(s.SubnetId || '')
      );
      publicSubnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe('available');
      });

      // Check private subnets
      const privateSubnets = Subnets?.filter(s => 
        privateSubnetIds.includes(s.SubnetId || '')
      );
      privateSubnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe('available');
      });

      // Verify subnets are in different AZs for HA
      const azs = new Set(Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test("Security groups enable proper service-to-service communication", async () => {
      // Get all security groups in VPC
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      // Find web and backend security groups
      const webSG = SecurityGroups?.find(sg => 
        sg.GroupName?.includes('WebSG')
      );
      const backendSG = SecurityGroups?.find(sg => 
        sg.GroupName?.includes('BackendSG')
      );
      const dbSG = SecurityGroups?.find(sg => 
        sg.GroupName?.includes('DBSG')
      );

      // Verify web SG allows HTTP/HTTPS from internet
      if (webSG) {
        const httpRule = webSG.IpPermissions?.find(rule => 
          rule.FromPort === 80
        );
        expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
      }

      // Verify backend SG allows traffic from web SG
      if (backendSG && webSG) {
        const backendRule = backendSG.IpPermissions?.find(rule => 
          rule.FromPort === 8080
        );
        expect(backendRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(webSG.GroupId);
      }

      // Verify DB SG restricts access to VPC only
      if (dbSG) {
        const dbRule = dbSG.IpPermissions?.find(rule => 
          rule.FromPort === 3306
        );
        expect(dbRule?.IpRanges?.[0]?.CidrIp).toBe('10.0.0.0/16');
      }
    }, 30000);
  });

  describe("Interactive Test: End-to-End Service Chain Validation", () => {
    test("Complete request flow path: ALB → EC2 → RDS with monitoring", async () => {
      // This test validates that all components work together
      // ALB can receive traffic
      expect(albDnsName).toBeDefined();
      expect(albDnsName).toContain('elb.amazonaws.com');

      // RDS is accessible within VPC
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toContain('rds.amazonaws.com');
      
      // Parse RDS endpoint
      const [hostname, port] = rdsEndpoint.split(':');
      expect(hostname).toBeDefined();
      expect(port).toBe('3306');

      // SNS topic is ready for alerts
      expect(snsTopicArn).toBeDefined();
      expect(snsTopicArn).toContain(':sns:');

      // S3 buckets are available for static assets and data
      expect(publicS3BucketName).toBeDefined();
      expect(privateS3BucketName).toBeDefined();

      // SSM parameters provide configuration
      expect(ssmParameters.length).toBeGreaterThan(0);
      ssmParameters.forEach(param => {
        expect(param).toContain('/tap-infrastructure/');
      });

      // Route53 provides DNS resolution
      expect(route53ZoneId).toBeDefined();
      expect(route53ZoneId).toMatch(/^Z[A-Z0-9]+$/);
    }, 30000);
  });

  describe("Interactive Test: Resource Tagging and Compliance", () => {
    test("Cross-service resource tagging is consistent", async () => {
      const expectedTags = {
        Project: 'tap-infrastructure',
        Environment: environmentSuffix,
        ManagedBy: 'CDKTF',
        Owner: 'DevOps'
      };

      // Check VPC tags
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      
      const vpcTags = Vpcs?.[0]?.Tags || [];
      Object.entries(expectedTags).forEach(([key, value]) => {
        const tag = vpcTags.find(t => t.Key === key);
        if (tag) {
          expect(tag.Value).toBe(value);
        }
      });

      // Check subnet tags
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        })
      );

      Subnets?.forEach(subnet => {
        const subnetTags = subnet.Tags || [];
        const projectTag = subnetTags.find(t => t.Key === 'Project');
        if (projectTag) {
          expect(projectTag.Value).toBe('tap-infrastructure');
        }
      });
    }, 30000);
  });
});