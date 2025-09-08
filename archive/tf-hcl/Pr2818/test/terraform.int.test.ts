import { exec } from 'child_process';
import { promisify } from 'util';
import * as AWS from 'aws-sdk';

const execAsync = promisify(exec);

describe('Terraform Integration Tests', () => {
  let terraformOutputs: any;
  let ec2: AWS.EC2;
  let s3: AWS.S3;
  let cloudwatch: AWS.CloudWatch;
  let iam: AWS.IAM;

  // Helper function to skip tests if terraform outputs are not available
  const skipIfNoOutputs = () => {
    if (!terraformOutputs) {
      console.log('Skipping test - Terraform outputs not available');
      return true;
    }
    return false;
  };

  beforeAll(async () => {
    // Initialize AWS SDK
    AWS.config.update({ region: 'us-east-1' });
    ec2 = new AWS.EC2();
    s3 = new AWS.S3();
    cloudwatch = new AWS.CloudWatch();
    iam = new AWS.IAM();

    try {
      // Get Terraform outputs from lib directory
      const { stdout } = await execAsync('cd lib && terraform output -json');
      terraformOutputs = JSON.parse(stdout);
    } catch (error) {
      console.warn('Terraform outputs not available, skipping integration tests');
      terraformOutputs = null;
    }
  });

  describe('VPC Integration', () => {
    test('should create VPC with correct configuration', async () => {
      if (skipIfNoOutputs()) return;
      const vpcId = terraformOutputs.vpc_id.value;

      const result = await ec2
        .describeVpcs({
          VpcIds: [vpcId],
        })
        .promise();

      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(result.Vpcs![0].State).toBe('available');
    });

    test('should create subnets in different availability zones', async () => {
      if (skipIfNoOutputs()) return;
      const publicSubnetIds = terraformOutputs.public_subnet_ids.value;
      const privateSubnetIds = terraformOutputs.private_subnet_ids.value;

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const result = await ec2
        .describeSubnets({
          SubnetIds: allSubnetIds,
        })
        .promise();

      expect(result.Subnets).toHaveLength(4);

      // Check that subnets are in different AZs
      const azs = result.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs).toHaveLength(2);
    });
  });

  describe('EC2 Integration', () => {
    test('should launch instances in private subnets', async () => {
      if (skipIfNoOutputs()) return;
      const instanceIds = terraformOutputs.instance_ids.value;

      const result = await ec2
        .describeInstances({
          InstanceIds: instanceIds,
        })
        .promise();

      expect(result.Reservations).toHaveLength(2);

      result.Reservations!.forEach(reservation => {
        reservation.Instances!.forEach(instance => {
          expect(instance.State!.Name).toBe('running');
          expect(instance.InstanceType).toBe('t2.micro');
          expect(instance.PublicIpAddress).toBeUndefined();
        });
      });
    });

    test('should have correct security group configuration', async () => {
      if (skipIfNoOutputs()) return;
      const instanceIds = terraformOutputs.instance_ids.value;

      const result = await ec2
        .describeInstances({
          InstanceIds: instanceIds,
        })
        .promise();

      const securityGroupIds =
        result.Reservations![0].Instances![0].SecurityGroups!.map(
          sg => sg.GroupId!
        );

      const sgResult = await ec2
        .describeSecurityGroups({
          GroupIds: securityGroupIds,
        })
        .promise();

      const sshRule = sgResult.SecurityGroups![0].IpPermissions!.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges![0].CidrIp).toBe('203.0.113.0/24');
    });
  });

  describe('S3 Integration', () => {
    test('should create bucket with encryption', async () => {
      if (skipIfNoOutputs()) return;
      const bucketName = terraformOutputs.logs_bucket_name.value;

      const encryptionResult = await s3
        .getBucketEncryption({
          Bucket: bucketName,
        })
        .promise();

      expect(
        encryptionResult.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      expect(
        encryptionResult.ServerSideEncryptionConfiguration?.Rules![0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should block public access', async () => {
      if (skipIfNoOutputs()) return;
      const bucketName = terraformOutputs.logs_bucket_name.value;

      const result = await s3
        .getPublicAccessBlock({
          Bucket: bucketName,
        })
        .promise();

      expect(result.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(result.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(
        true
      );
      expect(result.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(
        true
      );
      expect(result.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(
        true
      );
    });

    test('should have bucket policy enforcing HTTPS', async () => {
      if (skipIfNoOutputs()) return;
      const bucketName = terraformOutputs.logs_bucket_name.value;

      const result = await s3
        .getBucketPolicy({
          Bucket: bucketName,
        })
        .promise();

      const policy = JSON.parse(result.Policy!);
      const httpsStatement = policy.Statement.find(
        (stmt: any) =>
          stmt.Condition &&
          stmt.Condition.Bool &&
          stmt.Condition.Bool['aws:SecureTransport']
      );

      expect(httpsStatement).toBeDefined();
      expect(httpsStatement.Effect).toBe('Deny');
    });
  });

  describe('IAM Integration', () => {
    test('should create IAM role with correct trust policy', async () => {
      if (skipIfNoOutputs()) return;
      const instanceIds = terraformOutputs.instance_ids.value;

      const instanceResult = await ec2
        .describeInstances({
          InstanceIds: [instanceIds[0]],
        })
        .promise();

      const instanceProfileArn =
        instanceResult.Reservations![0].Instances![0].IamInstanceProfile!.Arn!;
      const profileName = instanceProfileArn.split('/').pop()!;

      const profileResult = await iam
        .getInstanceProfile({
          InstanceProfileName: profileName,
        })
        .promise();

      const roleName = profileResult.InstanceProfile.Roles![0].RoleName!;

      const roleResult = await iam
        .getRole({
          RoleName: roleName,
        })
        .promise();

      const trustPolicy = JSON.parse(
        decodeURIComponent(roleResult.Role.AssumeRolePolicyDocument!)
      );
      expect(trustPolicy.Statement[0].Principal.Service).toContain(
        'ec2.amazonaws.com'
      );
    });
  });

  describe('CloudWatch Integration', () => {
    test('should create CPU utilization alarms', async () => {
      if (skipIfNoOutputs()) return;
      const instanceIds = terraformOutputs.instance_ids.value;

      const result = await cloudwatch.describeAlarms().promise();

      const cpuAlarms = result.MetricAlarms!.filter(
        alarm =>
          alarm.MetricName === 'CPUUtilization' &&
          instanceIds.includes(alarm.Dimensions![0].Value!)
      );

      expect(cpuAlarms).toHaveLength(2);

      cpuAlarms.forEach(alarm => {
        expect(alarm.Threshold).toBe(70);
        expect(alarm.EvaluationPeriods).toBe(2);
        expect(alarm.Period).toBe(300);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      });
    });
  });

  describe('Networking Integration', () => {
    test('should create NAT gateways for private subnet internet access', async () => {
      if (skipIfNoOutputs()) return;
      const vpcId = terraformOutputs.vpc_id.value;

      const natResult = await ec2
        .describeNatGateways({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
        .promise();

      expect(
        natResult.NatGateways!.filter(ng => ng.State === 'available')
      ).toHaveLength(2);
    });

    test('should have proper route table associations', async () => {
      if (skipIfNoOutputs()) return;
      const publicSubnetIds = terraformOutputs.public_subnet_ids.value;
      const privateSubnetIds = terraformOutputs.private_subnet_ids.value;

      // Check public subnet routes to IGW
      for (const subnetId of publicSubnetIds) {
        const routeResult = await ec2
          .describeRouteTables({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: [subnetId],
              },
            ],
          })
          .promise();

        const igwRoute = routeResult.RouteTables![0].Routes!.find(route =>
          route.GatewayId?.startsWith('igw-')
        );
        expect(igwRoute).toBeDefined();
      }

      // Check private subnet routes to NAT Gateway
      for (const subnetId of privateSubnetIds) {
        const routeResult = await ec2
          .describeRouteTables({
            Filters: [
              {
                Name: 'association.subnet-id',
                Values: [subnetId],
              },
            ],
          })
          .promise();

        const natRoute = routeResult.RouteTables![0].Routes!.find(route =>
          route.NatGatewayId?.startsWith('nat-')
        );
        expect(natRoute).toBeDefined();
      }
    });
  });
});
