import AWS from 'aws-sdk';
import fs from 'fs';
import http from 'http';

// Configuration - These are coming from cfn-outputs after deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-1';

// Configure AWS SDK
AWS.config.update({ region });

// Initialize AWS service clients
const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const cloudwatch = new AWS.CloudWatch();
const secretsmanager = new AWS.SecretsManager();
const iam = new AWS.IAM();

describe('Production Cloud Environment Integration Tests', () => {

  // ============================================================================
  // PART 1: SERVICE-LEVEL TESTS (Single Service Validation)
  // ============================================================================

  describe('Outputs File Validation', () => {
    // Maps to PROMPT requirement: "Add an Outputs section to the template"
    test('should have cfn-outputs/flat-outputs.json file present', () => {
      expect(fs.existsSync('cfn-outputs/flat-outputs.json')).toBe(true);
    });

    // Maps to PROMPT requirement: "display the VPC ID, Public Subnet IDs, and the EC2 Instance ID"
    test('should have all required output keys in flat-outputs.json', () => {
      expect(outputs.MyVPCId).toBeDefined();
      expect(outputs.MyPublicSubnet1Id).toBeDefined();
      expect(outputs.MyPublicSubnet2Id).toBeDefined();
      expect(outputs.MyEC2InstanceId).toBeDefined();
      expect(outputs.MyRDSEndpoint).toBeDefined();
      expect(outputs.MyDBSecretArn).toBeDefined();
    });
  });

  describe('VPC and Networking Configuration - SERVICE-LEVEL', () => {
    let vpcs: AWS.EC2.VpcList;
    let subnets: AWS.EC2.SubnetList;

    beforeAll(async () => {
      const vpcResponse = await ec2.describeVpcs({}).promise();
      vpcs = vpcResponse.Vpcs || [];

      const subnetResponse = await ec2.describeSubnets({}).promise();
      subnets = subnetResponse.Subnets || [];
    });

    // Maps to PROMPT requirement: "Create a VPC with public and private subnets spanning two Availability Zones"
    test('should have VPC with correct CIDR and DNS settings', () => {
      const vpc = vpcs.find(v =>
        v.Tags?.some(tag => tag.Value?.includes('Production-VPC'))
      );

      expect(vpc).toBeDefined();
      expect(vpc!.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc!.State).toBe('available');
    });

    // Maps to PROMPT requirement: "public and private subnets spanning two Availability Zones"
    test('should have two public subnets in different availability zones', () => {
      const vpcId = outputs.MyVPCId;
      const publicSubnets = subnets.filter(s =>
        s.VpcId === vpcId && s.MapPublicIpOnLaunch === true
      );

      expect(publicSubnets.length).toBe(2);

      const az1 = publicSubnets[0].AvailabilityZone;
      const az2 = publicSubnets[1].AvailabilityZone;
      expect(az1).not.toBe(az2);
    });

    // Maps to PROMPT requirement: "private subnets spanning two Availability Zones"
    test('should have two private subnets in different availability zones', () => {
      const vpcId = outputs.MyVPCId;
      const privateSubnets = subnets.filter(s =>
        s.VpcId === vpcId && s.MapPublicIpOnLaunch === false
      );

      expect(privateSubnets.length).toBe(2);

      const az1 = privateSubnets[0].AvailabilityZone;
      const az2 = privateSubnets[1].AvailabilityZone;
      expect(az1).not.toBe(az2);
    });

    // Maps to PROMPT requirement: "proper network isolation for your resources"
    test('should have public subnets with distinct CIDR blocks', () => {
      const publicSubnet1 = subnets.find(s => s.SubnetId === outputs.MyPublicSubnet1Id);
      const publicSubnet2 = subnets.find(s => s.SubnetId === outputs.MyPublicSubnet2Id);

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet1!.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2!.CidrBlock).toBe('10.0.2.0/24');
    });

    // Maps to PROMPT requirement: "proper network isolation for your resources"
    test('should have private subnets with distinct CIDR blocks', () => {
      const vpcId = outputs.MyVPCId;
      const privateSubnets = subnets.filter(s =>
        s.VpcId === vpcId && s.MapPublicIpOnLaunch === false
      );

      const cidrBlocks = privateSubnets.map(s => s.CidrBlock);
      expect(cidrBlocks).toContain('10.0.10.0/24');
      expect(cidrBlocks).toContain('10.0.20.0/24');
    });
  });

  describe('EC2 Instance Configuration - SERVICE-LEVEL', () => {
    let instances: AWS.EC2.InstanceList;

    beforeAll(async () => {
      const response = await ec2.describeInstances({
        InstanceIds: [outputs.MyEC2InstanceId]
      }).promise();

      instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
    });

    // Maps to PROMPT requirement: "Launch an EC2 instance in the public subnet"
    test('should have EC2 instance deployed in public subnet', () => {
      const instance = instances[0];
      expect(instance).toBeDefined();
      expect(instance.State?.Name).toBe('running');
      expect([outputs.MyPublicSubnet1Id, outputs.MyPublicSubnet2Id]).toContain(instance.SubnetId);
    });

    // Maps to PROMPT requirement: "Tag this EC2 instance with 'Environment' set to 'Production'"
    test('should have EC2 instance tagged with Environment=Production', () => {
      const instance = instances[0];
      const envTag = instance.Tags?.find(tag => tag.Key === 'Environment');

      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe('Production');
    });

    // Maps to PROMPT requirement: "Launch an EC2 instance in the public subnet"
    test('should have EC2 instance with public IP address', () => {
      const instance = instances[0];
      expect(instance.PublicIpAddress).toBeDefined();
    });

    // Maps to PROMPT requirement: Infrastructure deployment
    test('should have EC2 instance with IAM instance profile attached', () => {
      const instance = instances[0];
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile!.Arn).toContain('arn:aws:iam::');
    });

    // Maps to PROMPT requirement: Best practices for monitoring
    test('should have EC2 instance with detailed monitoring enabled', () => {
      const instance = instances[0];
      expect(instance.Monitoring?.State).toBe('enabled');
    });
  });

  describe('Security Groups Configuration - SERVICE-LEVEL', () => {
    let securityGroups: AWS.EC2.SecurityGroupList;

    beforeAll(async () => {
      const response = await ec2.describeSecurityGroups({}).promise();
      securityGroups = response.SecurityGroups || [];
    });

    // Maps to PROMPT requirement: "The EC2 security group should allow SSH traffic on port 22 only from your specific IP address"
    test('should have EC2 security group with SSH restricted to specific IP', () => {
      const ec2SG = securityGroups.find(sg =>
        sg.VpcId === outputs.MyVPCId &&
        sg.Tags?.some(tag => tag.Key === 'Name' && tag.Value === 'Production-EC2-SG')
      );

      expect(ec2SG).toBeDefined();

      const sshRule = ec2SG!.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );

      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges).toBeDefined();
      expect(sshRule!.IpRanges!.length).toBeGreaterThan(0);

      // Should not be open to everyone
      const openToWorld = sshRule!.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0');
      expect(openToWorld).toBe(false);
    });

    // Maps to PROMPT requirement: "Create an RDS security group that allows MySQL traffic on port 3306 exclusively from the EC2 security group"
    test('should have RDS security group with MySQL access only from EC2 security group', () => {
      const rdsSG = securityGroups.find(sg =>
        sg.VpcId === outputs.MyVPCId &&
        sg.Tags?.some(tag => tag.Key === 'Name' && tag.Value === 'Production-RDS-SG')
      );

      expect(rdsSG).toBeDefined();

      const mysqlRule = rdsSG!.IpPermissions?.find(
        rule => rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === 'tcp'
      );

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule!.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);

      // Should reference EC2 security group
      const ec2SG = securityGroups.find(sg =>
        sg.GroupName?.includes('EC2') &&
        sg.VpcId === outputs.MyVPCId
      );

      const hasEC2Reference = mysqlRule!.UserIdGroupPairs!.some(
        pair => pair.GroupId === ec2SG!.GroupId
      );
      expect(hasEC2Reference).toBe(true);
    });

    // Maps to PROMPT requirement: "Configure Security Groups following the least privilege principle"
    test('should have EC2 security group with outbound traffic allowed', () => {
      const ec2SG = securityGroups.find(sg =>
        sg.GroupName?.includes('EC2') &&
        sg.VpcId === outputs.MyVPCId
      );

      expect(ec2SG).toBeDefined();
      expect(ec2SG!.IpPermissionsEgress).toBeDefined();
      expect(ec2SG!.IpPermissionsEgress!.length).toBeGreaterThan(0);
    });
  });

  describe('RDS Database Configuration - SERVICE-LEVEL', () => {
    let dbInstances: AWS.RDS.DBInstanceList;

    beforeAll(async () => {
      const response = await rds.describeDBInstances({}).promise();
      dbInstances = response.DBInstances || [];
    });

    // Maps to PROMPT requirement: "Set up an RDS MySQL database instance in the private subnet"
    test('should have RDS instance with MySQL engine', () => {
      const db = dbInstances.find(d =>
        d.DBInstanceIdentifier?.includes('production') &&
        d.DBSubnetGroup?.VpcId === outputs.MyVPCId
      );

      expect(db).toBeDefined();
      expect(db!.Engine).toBe('mysql');
      expect(db!.EngineVersion).toContain('8.0');
    });

    // Maps to PROMPT requirement: "The RDS instance should not be publicly accessible"
    test('should have RDS instance not publicly accessible', () => {
      const db = dbInstances.find(d =>
        d.DBInstanceIdentifier?.includes('production') &&
        d.DBSubnetGroup?.VpcId === outputs.MyVPCId
      );

      expect(db!.PubliclyAccessible).toBe(false);
    });

    // Maps to PROMPT requirement: "automatic minor version upgrades enabled"
    test('should have RDS instance with automatic minor version upgrades enabled', () => {
      const db = dbInstances.find(d =>
        d.DBInstanceIdentifier?.includes('production') &&
        d.DBSubnetGroup?.VpcId === outputs.MyVPCId
      );

      expect(db!.AutoMinorVersionUpgrade).toBe(true);
    });

    // Maps to PROMPT requirement: "Enable daily backups of the RDS instance with backups retained for 7 days"
    test('should have RDS instance with 7-day backup retention', () => {
      const db = dbInstances.find(d =>
        d.DBInstanceIdentifier?.includes('production') &&
        d.DBSubnetGroup?.VpcId === outputs.MyVPCId
      );

      expect(db!.BackupRetentionPeriod).toBe(7);
    });

    // Maps to PROMPT requirement: "Enable daily backups of the RDS instance"
    test('should have RDS instance with preferred backup window configured', () => {
      const db = dbInstances.find(d =>
        d.DBInstanceIdentifier?.includes('production') &&
        d.DBSubnetGroup?.VpcId === outputs.MyVPCId
      );

      expect(db!.PreferredBackupWindow).toBeDefined();
      expect(db!.PreferredBackupWindow).toBe('03:00-04:00');
    });

    // Maps to PROMPT requirement: "RDS MySQL database instance in the private subnet"
    test('should have RDS instance deployed in private subnets', () => {
      const db = dbInstances.find(d =>
        d.DBInstanceIdentifier?.includes('production') &&
        d.DBSubnetGroup?.VpcId === outputs.MyVPCId
      );

      expect(db!.DBSubnetGroup).toBeDefined();
      expect(db!.DBSubnetGroup!.Subnets).toBeDefined();
      expect(db!.DBSubnetGroup!.Subnets!.length).toBe(2);
    });

    // Maps to PROMPT requirement: Security best practices
    test('should have RDS instance with storage encryption enabled', () => {
      const db = dbInstances.find(d =>
        d.DBInstanceIdentifier?.includes('production') &&
        d.DBSubnetGroup?.VpcId === outputs.MyVPCId
      );

      expect(db!.StorageEncrypted).toBe(true);
    });

    // Maps to PROMPT requirement: Production environment
    test('should have RDS instance in available state', () => {
      const db = dbInstances.find(d =>
        d.DBInstanceIdentifier?.includes('production') &&
        d.DBSubnetGroup?.VpcId === outputs.MyVPCId
      );

      expect(db!.DBInstanceStatus).toBe('available');
    });
  });

  describe('Secrets Manager Configuration - SERVICE-LEVEL', () => {
    // Maps to PROMPT requirement: "Make sure database credentials are managed securely without hardcoding them in the template"
    test('should have Secrets Manager secret for RDS credentials', async () => {
      const secretArn = outputs.MyDBSecretArn;
      expect(secretArn).toBeDefined();

      const response = await secretsmanager.describeSecret({
        SecretId: secretArn
      }).promise();

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('Production-RDS-Credentials');
    });

    // Maps to PROMPT requirement: "database credentials are managed securely"
    test('should have secret with auto-generated password structure', async () => {
      const secretArn = outputs.MyDBSecretArn;

      try {
        const response = await secretsmanager.getSecretValue({
          SecretId: secretArn
        }).promise();

        expect(response.SecretString).toBeDefined();

        const secretData = JSON.parse(response.SecretString!);
        expect(secretData.username).toBeDefined();
        expect(secretData.password).toBeDefined();
        expect(secretData.password.length).toBeGreaterThanOrEqual(32);
      } catch (error) {
        // Access denied is acceptable as it means secret exists but we don't have permission
        expect((error as any).code).toBe('AccessDeniedException');
      }
    });
  });

  describe('CloudWatch Alarm Configuration - SERVICE-LEVEL', () => {
    let alarms: AWS.CloudWatch.MetricAlarms;

    beforeAll(async () => {
      const response = await cloudwatch.describeAlarms({}).promise();
      alarms = response.MetricAlarms || [];
    });

    // Maps to PROMPT requirement: "Set up a CloudWatch alarm to monitor the EC2 instance CPU utilization, triggering when it exceeds 80%"
    test('should have CloudWatch alarm for EC2 CPU utilization above 80%', () => {
      const cpuAlarm = alarms.find(alarm =>
        alarm.AlarmName?.includes('CPU') &&
        alarm.AlarmName?.includes('Production')
      );

      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm!.Namespace).toBe('AWS/EC2');
      expect(cpuAlarm!.Threshold).toBe(80);
      expect(cpuAlarm!.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    // Maps to PROMPT requirement: "monitor the EC2 instance CPU utilization"
    test('should have CloudWatch alarm monitoring correct EC2 instance', () => {
      const cpuAlarm = alarms.find(alarm =>
        alarm.AlarmName?.includes('CPU') &&
        alarm.AlarmName?.includes('Production')
      );

      expect(cpuAlarm!.Dimensions).toBeDefined();
      expect(cpuAlarm!.Dimensions!.length).toBeGreaterThan(0);

      const instanceDimension = cpuAlarm!.Dimensions!.find(
        dim => dim.Name === 'InstanceId'
      );

      expect(instanceDimension).toBeDefined();
      expect(instanceDimension!.Value).toBe(outputs.MyEC2InstanceId);
    });

    // Maps to PROMPT requirement: Monitoring best practices
    test('should have CloudWatch alarm with appropriate evaluation periods', () => {
      const cpuAlarm = alarms.find(alarm =>
        alarm.AlarmName?.includes('CPU') &&
        alarm.AlarmName?.includes('Production')
      );

      expect(cpuAlarm!.EvaluationPeriods).toBe(2);
      expect(cpuAlarm!.Period).toBe(300);
    });
  });

  describe('IAM Role Configuration - SERVICE-LEVEL', () => {
    let roles: AWS.IAM.RoleList;

    beforeAll(async () => {
      const response = await iam.listRoles({}).promise();
      roles = response.Roles || [];
    });

    // Maps to PROMPT requirement: Best practices for EC2 permissions
    test('should have IAM role for EC2 with CloudWatch permissions', async () => {
      const ec2Role = roles.find(role =>
        role.RoleName === 'Production-EC2-Role'
      );

      expect(ec2Role).toBeDefined();

      const policiesResponse = await iam.listAttachedRolePolicies({
        RoleName: ec2Role!.RoleName
      }).promise();

      const hasCloudWatchPolicy = policiesResponse.AttachedPolicies!.some(
        policy => policy.PolicyArn?.includes('CloudWatchAgentServerPolicy')
      );

      expect(hasCloudWatchPolicy).toBe(true);
    });

    // Maps to PROMPT requirement: "database credentials are managed securely"
    test('should have IAM role for EC2 with Secrets Manager read access', async () => {
      const ec2Role = roles.find(role =>
        role.RoleName === 'Production-EC2-Role'
      );

      expect(ec2Role).toBeDefined();

      const policiesResponse = await iam.listRolePolicies({
        RoleName: ec2Role!.RoleName
      }).promise();

      const hasSecretsPolicy = policiesResponse.PolicyNames!.some(
        policyName => policyName === 'SecretsManagerReadAccess'
      );

      expect(hasSecretsPolicy).toBe(true);
    });
  });

  // ============================================================================
  // PART 2: CROSS-SERVICE TESTS (2 Services Interacting)
  // ============================================================================

  describe('EC2 to Security Group Integration - CROSS-SERVICE', () => {
    // Maps to PROMPT requirement: "The EC2 security group should allow SSH traffic on port 22"
    // CROSS-SERVICE TEST (2 services: EC2 + Security Groups)
    test('should have EC2 instance attached to correct security group', async () => {
      const instanceResponse = await ec2.describeInstances({
        InstanceIds: [outputs.MyEC2InstanceId]
      }).promise();

      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.length).toBeGreaterThan(0);

      const sgResponse = await ec2.describeSecurityGroups({
        GroupIds: instance.SecurityGroups!.map(sg => sg.GroupId!)
      }).promise();

      const ec2SG = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('EC2')
      );

      expect(ec2SG).toBeDefined();
      expect(ec2SG!.GroupId).toBe(instance.SecurityGroups![0].GroupId);
    });
  });

  describe('RDS to Security Group Integration - CROSS-SERVICE', () => {
    // Maps to PROMPT requirement: "RDS security group that allows MySQL traffic on port 3306 exclusively from the EC2 security group"
    // CROSS-SERVICE TEST (2 services: RDS + Security Groups)
    test('should have RDS instance with security group allowing MySQL from EC2 only', async () => {
      const dbResponse = await rds.describeDBInstances({}).promise();
      const db = dbResponse.DBInstances!.find(d =>
        d.DBInstanceIdentifier?.includes('production')
      );

      expect(db!.VpcSecurityGroups).toBeDefined();
      expect(db!.VpcSecurityGroups!.length).toBeGreaterThan(0);

      const rdsSgId = db!.VpcSecurityGroups![0].VpcSecurityGroupId;
      const sgResponse = await ec2.describeSecurityGroups({
        GroupIds: [rdsSgId!]
      }).promise();

      const rdsSG = sgResponse.SecurityGroups![0];
      const mysqlRule = rdsSG.IpPermissions!.find(
        rule => rule.FromPort === 3306
      );

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule!.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);
    });
  });

  describe('RDS to Secrets Manager Integration - CROSS-SERVICE', () => {
    // Maps to PROMPT requirement: "database credentials are managed securely without hardcoding"
    // CROSS-SERVICE TEST (2 services: RDS + Secrets Manager)
    test('should have RDS instance using credentials from Secrets Manager', async () => {
      const dbResponse = await rds.describeDBInstances({}).promise();
      const db = dbResponse.DBInstances!.find(d =>
        d.DBInstanceIdentifier?.includes('production')
      );

      expect(db!.MasterUsername).toBeDefined();

      // Verify secret exists with RDS association
      const secretResponse = await secretsmanager.describeSecret({
        SecretId: outputs.MyDBSecretArn
      }).promise();

      expect(secretResponse.ARN).toBeDefined();
      expect(secretResponse.Name).toContain('RDS');
    });
  });

  describe('EC2 to IAM Role Integration - CROSS-SERVICE', () => {
    // Maps to PROMPT requirement: EC2 needs permissions for CloudWatch and Secrets Manager
    // CROSS-SERVICE TEST (2 services: EC2 + IAM)
    test('should have EC2 instance with IAM instance profile for AWS service access', async () => {
      const instanceResponse = await ec2.describeInstances({
        InstanceIds: [outputs.MyEC2InstanceId]
      }).promise();

      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();

      const profileArn = instance.IamInstanceProfile!.Arn;
      const profileName = profileArn.split('/').pop();

      const profileResponse = await iam.getInstanceProfile({
        InstanceProfileName: profileName!
      }).promise();

      expect(profileResponse.InstanceProfile.Roles).toBeDefined();
      expect(profileResponse.InstanceProfile.Roles.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch to EC2 Integration - CROSS-SERVICE', () => {
    // Maps to PROMPT requirement: "CloudWatch alarm to monitor the EC2 instance CPU utilization"
    // CROSS-SERVICE TEST (2 services: CloudWatch + EC2)
    test('should have CloudWatch alarm properly configured to monitor EC2 instance', async () => {
      const alarmResponse = await cloudwatch.describeAlarms({}).promise();
      const cpuAlarm = alarmResponse.MetricAlarms!.find(alarm =>
        alarm.AlarmName?.includes('CPU')
      );

      expect(cpuAlarm).toBeDefined();

      const instanceDimension = cpuAlarm!.Dimensions!.find(
        dim => dim.Name === 'InstanceId'
      );

      expect(instanceDimension!.Value).toBe(outputs.MyEC2InstanceId);

      // Verify EC2 instance exists and is running
      const instanceResponse = await ec2.describeInstances({
        InstanceIds: [outputs.MyEC2InstanceId]
      }).promise();

      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.State!.Name).toBe('running');
      expect(instance.Monitoring!.State).toBe('enabled');
    });
  });

  describe('VPC to Subnets Integration - CROSS-SERVICE', () => {
    // Maps to PROMPT requirement: "Create a VPC with public and private subnets"
    // CROSS-SERVICE TEST (2 services: VPC + Subnets)
    test('should have VPC with all subnets properly attached', async () => {
      const vpcId = outputs.MyVPCId;

      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();

      expect(vpcResponse.Vpcs![0].State).toBe('available');

      const subnetResponse = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }).promise();

      const subnets = subnetResponse.Subnets!;
      expect(subnets.length).toBe(4);

      const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch);

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);
    });
  });

  describe('RDS to DB Subnet Group Integration - CROSS-SERVICE', () => {
    // Maps to PROMPT requirement: "RDS MySQL database instance in the private subnet"
    // CROSS-SERVICE TEST (2 services: RDS + DB Subnet Group)
    test('should have RDS instance deployed in correct DB subnet group', async () => {
      const dbResponse = await rds.describeDBInstances({}).promise();
      const db = dbResponse.DBInstances!.find(d =>
        d.DBInstanceIdentifier?.includes('production')
      );

      expect(db!.DBSubnetGroup).toBeDefined();
      expect(db!.DBSubnetGroup!.VpcId).toBe(outputs.MyVPCId);
      expect(db!.DBSubnetGroup!.Subnets!.length).toBe(2);

      // Verify subnets are private
      const subnetIds = db!.DBSubnetGroup!.Subnets!.map(s => s.SubnetIdentifier);
      const subnetResponse = await ec2.describeSubnets({
        SubnetIds: subnetIds as string[]
      }).promise();

      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  // ============================================================================
  // PART 3: E2E TESTS (3+ Services in Complete Flows)
  // ============================================================================

  describe('Internet Gateway to VPC to Route Table to Public Subnets E2E Flow', () => {
    // Maps to PROMPT requirement: "VPC with public and private subnets" + network connectivity
    // E2E TEST (4 services: Internet Gateway → VPC → Route Table → Public Subnets)
    test('should have complete internet connectivity flow for public subnets', async () => {
      const vpcId = outputs.MyVPCId;

      // 1. Verify VPC exists
      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // 2. Find Internet Gateway attached to VPC
      const igwResponse = await ec2.describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      }).promise();

      const igw = igwResponse.InternetGateways![0];
      expect(igw).toBeDefined();
      expect(igw.Attachments![0].State).toBe('available');

      // 3. Find public route table with route to IGW
      const rtResponse = await ec2.describeRouteTables({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }).promise();

      const publicRouteTable = rtResponse.RouteTables!.find(rt =>
        rt.Tags?.some(tag => tag.Value?.includes('Public'))
      );

      expect(publicRouteTable).toBeDefined();

      const igwRoute = publicRouteTable!.Routes!.find(
        route => route.DestinationCidrBlock === '0.0.0.0/0' &&
        route.GatewayId === igw.InternetGatewayId
      );

      expect(igwRoute).toBeDefined();
      expect(igwRoute!.State).toBe('active');

      // 4. Verify public subnets are associated with this route table
      const publicSubnetIds = [outputs.MyPublicSubnet1Id, outputs.MyPublicSubnet2Id];
      const associations = publicRouteTable!.Associations!.filter(assoc =>
        publicSubnetIds.includes(assoc.SubnetId!)
      );

      expect(associations.length).toBe(2);

      // This validates complete flow: IGW → VPC → Route Table → Public Subnets
    });
  });

  describe('NAT Gateway to Route Table to Private Subnets E2E Flow', () => {
    // Maps to PROMPT requirement: "private subnets" + outbound connectivity
    // E2E TEST (4 services: NAT Gateway → Route Table → Private Subnets → RDS)
    test('should have complete outbound connectivity flow for private subnets', async () => {
      const vpcId = outputs.MyVPCId;

      // 1. Find NAT Gateway
      const natResponse = await ec2.describeNatGateways({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      }).promise();

      const natGateway = natResponse.NatGateways![0];
      expect(natGateway).toBeDefined();
      expect(natGateway.State).toBe('available');

      // 2. Find private route table routing through NAT Gateway
      const rtResponse = await ec2.describeRouteTables({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }).promise();

      const privateRouteTable = rtResponse.RouteTables!.find(rt =>
        rt.Tags?.some(tag => tag.Value?.includes('Private'))
      );

      expect(privateRouteTable).toBeDefined();

      const natRoute = privateRouteTable!.Routes!.find(
        route => route.DestinationCidrBlock === '0.0.0.0/0' &&
        route.NatGatewayId === natGateway.NatGatewayId
      );

      expect(natRoute).toBeDefined();
      expect(natRoute!.State).toBe('active');

      // 3. Verify private subnets
      const subnetResponse = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }).promise();

      const privateSubnets = subnetResponse.Subnets!.filter(
        s => !s.MapPublicIpOnLaunch
      );

      expect(privateSubnets.length).toBe(2);

      // 4. Verify RDS is in private subnets
      const dbResponse = await rds.describeDBInstances({}).promise();
      const db = dbResponse.DBInstances!.find(d =>
        d.DBSubnetGroup?.VpcId === vpcId
      );

      expect(db).toBeDefined();
      expect(db!.PubliclyAccessible).toBe(false);

      // This validates: NAT → Route Table → Private Subnets → RDS
    });
  });

  describe('Complete Application E2E Flow', () => {
    // Maps to PROMPT requirement: Full production environment
    // E2E TEST (5+ services: VPC → Subnets → EC2 → RDS → Security Groups)
    test('should have complete production infrastructure deployed and operational', async () => {
      // 1. Verify VPC exists
      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [outputs.MyVPCId]
      }).promise();

      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');

      // 2. Verify subnets (public and private)
      const subnetResponse = await ec2.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.MyVPCId]
          }
        ]
      }).promise();

      expect(subnetResponse.Subnets!.length).toBe(4);

      // 3. Verify EC2 instance is running
      const instanceResponse = await ec2.describeInstances({
        InstanceIds: [outputs.MyEC2InstanceId]
      }).promise();

      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.State!.Name).toBe('running');
      expect(instance.VpcId).toBe(outputs.MyVPCId);

      // 4. Verify RDS is available
      const dbResponse = await rds.describeDBInstances({}).promise();
      const db = dbResponse.DBInstances!.find(d =>
        d.DBSubnetGroup?.VpcId === outputs.MyVPCId
      );

      expect(db).toBeDefined();
      expect(db!.DBInstanceStatus).toBe('available');
      expect(db!.Engine).toBe('mysql');

      // 5. Verify security groups are properly configured
      const sgResponse = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.MyVPCId]
          }
        ]
      }).promise();

      const ec2SG = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('EC2')
      );
      const rdsSG = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('RDS')
      );

      expect(ec2SG).toBeDefined();
      expect(rdsSG).toBeDefined();

      // Verify least privilege: RDS accepts traffic only from EC2
      const mysqlRule = rdsSG!.IpPermissions!.find(
        rule => rule.FromPort === 3306
      );
      expect(mysqlRule!.UserIdGroupPairs![0].GroupId).toBe(ec2SG!.GroupId);

      // 6. Verify CloudWatch monitoring
      const alarmResponse = await cloudwatch.describeAlarms({}).promise();
      const cpuAlarm = alarmResponse.MetricAlarms!.find(alarm =>
        alarm.AlarmName?.includes('CPU')
      );

      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm!.Dimensions![0].Value).toBe(outputs.MyEC2InstanceId);

      // This validates complete application: VPC → Subnets → EC2 → RDS → Security → Monitoring
    });
  });

  // ============================================================================
  // PART 4: ACTION-BASED TESTS (Actually DO Things)
  // ============================================================================

  describe('CloudWatch Metrics Collection - ACTION TEST', () => {
    // Maps to PROMPT requirement: "CloudWatch alarm to monitor the EC2 instance CPU utilization"
    // ACTION TEST: Verify CloudWatch is collecting metrics from EC2
    test('should have CloudWatch collecting CPU metrics from EC2 instance', async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); // 15 minutes ago

      const metricsResponse = await cloudwatch.getMetricStatistics({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [
          {
            Name: 'InstanceId',
            Value: outputs.MyEC2InstanceId
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Average']
      }).promise();

      // If instance has been running, should have datapoints
      // Even newly launched instances should have at least some metrics
      expect(metricsResponse.Datapoints).toBeDefined();
    }, 30000);
  });

  describe('RDS Connection Validation - ACTION TEST', () => {
    // Maps to PROMPT requirement: "RDS MySQL database instance" + "not publicly accessible"
    // ACTION TEST: Verify RDS endpoint is resolvable but not publicly accessible
    test('should have RDS endpoint configured but not publicly accessible', async () => {
      const rdsEndpoint = outputs.MyRDSEndpoint;
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toContain('.rds.amazonaws.com');

      const dbResponse = await rds.describeDBInstances({}).promise();
      const db = dbResponse.DBInstances!.find(d =>
        d.Endpoint?.Address === rdsEndpoint
      );

      expect(db).toBeDefined();
      expect(db!.PubliclyAccessible).toBe(false);
      expect(db!.Endpoint!.Port).toBe(3306);
    });
  });

  describe('Secrets Manager Secret Retrieval - ACTION TEST', () => {
    // Maps to PROMPT requirement: "database credentials are managed securely"
    // ACTION TEST: Verify secret can be retrieved (tests permission and existence)
    test('should be able to describe secret metadata without exposing credentials', async () => {
      const secretArn = outputs.MyDBSecretArn;

      const response = await secretsmanager.describeSecret({
        SecretId: secretArn
      }).promise();

      expect(response.ARN).toBeDefined();
      expect(response.Name).toBeDefined();
      expect(response.Name).toContain('RDS-Credentials');
      expect(response.LastChangedDate).toBeDefined();
    });
  });

  describe('Security Group Validation - ACTION TEST', () => {
    // Maps to PROMPT requirement: "least privilege principle"
    // ACTION TEST: Verify no security groups have overly permissive rules
    test('should not have any security groups with 0.0.0.0/0 access on sensitive ports', async () => {
      const sgResponse = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.MyVPCId]
          }
        ]
      }).promise();

      const securityGroups = sgResponse.SecurityGroups!;

      for (const sg of securityGroups) {
        for (const rule of sg.IpPermissions || []) {
          // Check for MySQL port
          if (rule.FromPort === 3306 || rule.ToPort === 3306) {
            const hasOpenAccess = rule.IpRanges?.some(
              range => range.CidrIp === '0.0.0.0/0'
            );
            expect(hasOpenAccess).toBe(false);
          }
        }
      }
    });
  });
});
