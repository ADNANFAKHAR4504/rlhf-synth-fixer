import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

const outputsPath = path.resolve(process.cwd(), "terraform.tfstate");
let outputs: any = {};

beforeAll(() => {
  // Skip tests if terraform.tfstate doesn't exist (development environment)
  if (!fs.existsSync(outputsPath)) {
    console.log("⚠️  Skipping Terraform integration tests - terraform.tfstate not found");
    return;
  }

  const state = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  outputs = Object.fromEntries(
    Object.entries(state.outputs || {}).map(([k, v]: [string, any]) => [
      k,
      v.value,
    ])
  );

  const region = outputs?.aws_region || "us-west-2";
  AWS.config.update({ region });
});

describe("AWS Region Migration Infrastructure Tests", () => {
  describe("VPC and Networking", () => {
    it("should have VPC with correct CIDR block", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping VPC test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const vpcId = outputs?.vpc_id;
      expect(vpcId).toBeDefined();

      const vpc = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpc.Vpcs).toBeDefined();
      expect(vpc.Vpcs).toHaveLength(1);
      expect(vpc.Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      // Note: DNS settings are not directly accessible via describeVpcs
    });

    it("should have public subnets with auto-assign public IPs", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping public subnet test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const publicSubnetIds = outputs?.public_subnet_ids;
      expect(publicSubnetIds).toBeDefined();
      expect(publicSubnetIds).toHaveLength(2);

      const subnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets).toHaveLength(2);

      subnets.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]\.0\/24$/);
      });
    });

    it("should have private subnets", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping private subnet test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const privateSubnetIds = outputs?.private_subnet_ids;
      expect(privateSubnetIds).toBeDefined();
      expect(privateSubnetIds).toHaveLength(2);

      const subnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets).toHaveLength(2);

      subnets.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.1[02]0\.0\/24$/);
      });
    });

    it("should have internet gateway attached to VPC", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping internet gateway test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const vpcId = outputs?.vpc_id;
      const igwId = outputs?.internet_gateway_id;
      expect(igwId).toBeDefined();

      const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [igwId] }).promise();
      expect(igw.InternetGateways).toBeDefined();
      expect(igw.InternetGateways).toHaveLength(1);
      expect(igw.InternetGateways![0].Attachments).toBeDefined();
      expect(igw.InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
      expect(igw.InternetGateways![0].Attachments![0].State).toBe("available");
    });

    it("should have NAT gateway in public subnet", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping NAT gateway test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const natGatewayId = outputs?.nat_gateway_id;
      const publicSubnetIds = outputs?.public_subnet_ids;
      expect(natGatewayId).toBeDefined();

      const natGateway = await ec2.describeNatGateways({ NatGatewayIds: [natGatewayId] }).promise();
      expect(natGateway.NatGateways).toBeDefined();
      expect(natGateway.NatGateways).toHaveLength(1);
      expect(natGateway.NatGateways![0].State).toBe("available");
      expect(publicSubnetIds).toContain(natGateway.NatGateways![0].SubnetId);
    });
  });

  describe("Security Groups", () => {
    it("should have web security group with correct rules", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping web security group test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const webSgId = outputs?.web_security_group_id;
      expect(webSgId).toBeDefined();

      const sg = await ec2.describeSecurityGroups({ GroupIds: [webSgId] }).promise();
      expect(sg.SecurityGroups).toBeDefined();
      expect(sg.SecurityGroups).toHaveLength(1);

      const securityGroup = sg.SecurityGroups![0];
      expect(securityGroup.GroupName).toBe("myapp-web-sg");

      // Check ingress rules
      const ingressPorts = securityGroup.IpPermissions?.map(rule => rule.FromPort).filter(port => port !== undefined) || [];
      expect(ingressPorts).toContain(80);  // HTTP
      expect(ingressPorts).toContain(443); // HTTPS
      expect(ingressPorts).toContain(22);  // SSH

      // Check egress rule
      expect(securityGroup.IpPermissionsEgress).toBeDefined();
      expect(securityGroup.IpPermissionsEgress).toHaveLength(1);
      expect(securityGroup.IpPermissionsEgress![0].IpProtocol).toBe("-1");
    });

    it("should have app security group with internal access", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping app security group test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const appSgId = outputs?.app_security_group_id;
      expect(appSgId).toBeDefined();

      const sg = await ec2.describeSecurityGroups({ GroupIds: [appSgId] }).promise();
      expect(sg.SecurityGroups).toBeDefined();
      expect(sg.SecurityGroups).toHaveLength(1);

      const securityGroup = sg.SecurityGroups![0];
      expect(securityGroup.GroupName).toBe("myapp-app-sg");

      // Check ingress rules
      const ingressPorts = securityGroup.IpPermissions?.map(rule => rule.FromPort).filter(port => port !== undefined) || [];
      expect(ingressPorts).toContain(8080); // Application port
      expect(ingressPorts).toContain(22);   // SSH
    });

    it("should have database security group with restricted access", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping database security group test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const dbSgId = outputs?.database_security_group_id;
      expect(dbSgId).toBeDefined();

      const sg = await ec2.describeSecurityGroups({ GroupIds: [dbSgId] }).promise();
      expect(sg.SecurityGroups).toBeDefined();
      expect(sg.SecurityGroups).toHaveLength(1);

      const securityGroup = sg.SecurityGroups![0];
      expect(securityGroup.GroupName).toBe("myapp-db-sg");

      // Check ingress rules
      const ingressPorts = securityGroup.IpPermissions?.map(rule => rule.FromPort).filter(port => port !== undefined) || [];
      expect(ingressPorts).toContain(3306); // MySQL
    });
  });

  describe("Database Resources", () => {
    it("should have RDS instance with correct configuration", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping RDS test - no terraform state available");
        return;
      }

      const rds = new AWS.RDS();
      const dbEndpoint = outputs?.db_instance_endpoint;
      const dbIdentifier = outputs?.db_instance_identifier;
      expect(dbEndpoint).toBeDefined();
      expect(dbIdentifier).toBeDefined();

      const dbInstances = await rds.describeDBInstances({ DBInstanceIdentifier: dbIdentifier }).promise();
      expect(dbInstances.DBInstances).toBeDefined();
      expect(dbInstances.DBInstances).toHaveLength(1);

      const dbInstance = dbInstances.DBInstances![0];
      expect(dbInstance.Engine).toBe("mysql");
      expect(dbInstance.EngineVersion).toBe("8.0");
      expect(dbInstance.DBInstanceClass).toBe("db.t3.micro");
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.MultiAZ).toBe(false);
      expect(dbInstance.DBInstanceStatus).toBe("available");
    });

    it("should have DB subnet group in private subnets", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping DB subnet group test - no terraform state available");
        return;
      }

      const rds = new AWS.RDS();
      const privateSubnetIds = outputs?.private_subnet_ids;
      expect(privateSubnetIds).toBeDefined();

      const subnetGroups = await rds.describeDBSubnetGroups({ DBSubnetGroupName: "myapp-db-subnet-group" }).promise();
      expect(subnetGroups.DBSubnetGroups).toBeDefined();
      expect(subnetGroups.DBSubnetGroups).toHaveLength(1);

      const subnetGroup = subnetGroups.DBSubnetGroups![0];
      expect(subnetGroup.Subnets).toBeDefined();
      expect(subnetGroup.Subnets).toHaveLength(2);
      
      const subnetIds = subnetGroup.Subnets!.map(subnet => subnet.SubnetIdentifier);
      expect(subnetIds).toEqual(expect.arrayContaining(privateSubnetIds));
    });
  });

  describe("S3 Resources", () => {
    it("should have S3 bucket with correct configuration", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping S3 bucket test - no terraform state available");
        return;
      }

    const s3 = new AWS.S3();
      const bucketName = outputs?.s3_bucket_name;
      expect(bucketName).toBeDefined();

      // Check bucket exists
      const bucket = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(bucket).toBeDefined();

      // Check bucket versioning
      const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioning.Status).toBe("Enabled");

      // Check bucket encryption
      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      const sseAlg = encryption.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(sseAlg).toBe("AES256");

      // Check public access block
      const publicAccessBlock = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      const pab = publicAccessBlock.PublicAccessBlockConfiguration;
      expect(pab?.BlockPublicAcls).toBe(true);
      expect(pab?.BlockPublicPolicy).toBe(true);
      expect(pab?.IgnorePublicAcls).toBe(true);
      expect(pab?.RestrictPublicBuckets).toBe(true);
    });

    it("should have test file in S3 bucket", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping S3 object test - no terraform state available");
        return;
      }

      const s3 = new AWS.S3();
    const bucketName = outputs?.s3_bucket_name;
    expect(bucketName).toBeDefined();

    const objects = await s3.listObjectsV2({ Bucket: bucketName }).promise();
      const contents = objects.Contents ?? [];
      expect(contents.length).toBeGreaterThan(0);

      const testFile = contents.find(obj => obj.Key === "test.txt");
      expect(testFile).toBeDefined();
      expect(testFile!.Size).toBeGreaterThan(0);
    });
  });

  describe("Region Migration Validation", () => {
    it("should be deployed in target region (us-west-2)", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping region validation test - no terraform state available");
        return;
      }

      const region = outputs?.aws_region;
      expect(region).toBe("us-west-2");
    });

    it("should have resources tagged for migration", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping migration tags test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const vpcId = outputs?.vpc_id;
      expect(vpcId).toBeDefined();

      const vpc = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpc.Vpcs).toBeDefined();
      const tags = vpc.Vpcs![0].Tags;
      
      const migrationTag = tags?.find(tag => tag.Key === "Migration");
      expect(migrationTag).toBeDefined();
      expect(migrationTag!.Value).toBe("us-west-1-to-us-west-2");
    });

    it("should have availability zones in target region", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping availability zones test - no terraform state available");
        return;
      }

      const availabilityZones: string[] = outputs?.availability_zones;
      expect(availabilityZones).toBeDefined();
      expect(availabilityZones.length).toBeGreaterThanOrEqual(2);

      // Verify all AZs are in us-west-2
      availabilityZones.forEach((az: string) => {
        expect(az).toMatch(/^us-west-2[a-z]$/);
      });
    });
  });

  describe("Network Connectivity", () => {
    it("should have proper route table configuration", async () => {
      if (!fs.existsSync(outputsPath)) {
        console.log("⏭️  Skipping route table test - no terraform state available");
        return;
      }

      const ec2 = new AWS.EC2();
      const vpcId = outputs?.vpc_id;
      expect(vpcId).toBeDefined();

      const routeTables = await ec2.describeRouteTables({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }).promise();
      expect(routeTables.RouteTables).toBeDefined();
      expect(routeTables.RouteTables!.length).toBeGreaterThanOrEqual(2); // Public and private route tables

      // Check public route table has internet gateway route
      const publicRouteTable = routeTables.RouteTables!.find(rt => 
        (rt.Routes || []).some(route => route.GatewayId && route.DestinationCidrBlock === "0.0.0.0/0")
      );
      expect(publicRouteTable).toBeDefined();

      // Check private route table has NAT gateway route
      const privateRouteTable = routeTables.RouteTables!.find(rt => 
        (rt.Routes || []).some(route => route.NatGatewayId && route.DestinationCidrBlock === "0.0.0.0/0")
      );
      expect(privateRouteTable).toBeDefined();
    });
  });
});
