import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const elbv2 = new AWS.ELBv2();
const cloudtrail = new AWS.CloudTrail();
const iam = new AWS.IAM();
const autoscaling = new AWS.AutoScaling();
const configservice = new AWS.ConfigService();

async function validateVpc(vpcId: string) {
  const res = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
  if (!res.Vpcs || res.Vpcs.length === 0) throw new Error('VPC not found');
  expect(res.Vpcs!.length).toBe(1);
}

async function validateSubnet(subnetId: string, vpcId?: string) {
  const res = await ec2.describeSubnets({ SubnetIds: [subnetId] }).promise();
  if (!res.Subnets || res.Subnets.length === 0)
    throw new Error('Subnet not found');
  expect(res.Subnets!.length).toBe(1);
  if (vpcId) expect(res.Subnets![0].VpcId).toBe(vpcId);
}

async function validateS3Bucket(bucketName: string) {
  await expect(
    s3.headBucket({ Bucket: bucketName }).promise()
  ).resolves.toBeDefined();
  const versioning = await s3
    .getBucketVersioning({ Bucket: bucketName })
    .promise();
  expect(versioning.Status).toBe('Enabled');
  const encryption = await s3
    .getBucketEncryption({ Bucket: bucketName })
    .promise();
  if (
    !encryption.ServerSideEncryptionConfiguration ||
    !encryption.ServerSideEncryptionConfiguration.Rules ||
    encryption.ServerSideEncryptionConfiguration.Rules.length === 0
  ) {
    throw new Error('Bucket encryption rules not configured');
  }
  expect(
    encryption.ServerSideEncryptionConfiguration!.Rules![0]
      .ApplyServerSideEncryptionByDefault.SSEAlgorithm
  ).toBe('aws:kms');
}

async function validateKmsKey(keyId: string) {
  const res = await kms.describeKey({ KeyId: keyId }).promise();
  if (!res.KeyMetadata) throw new Error('KMS KeyMetadata not found');
  expect(res.KeyMetadata!.KeyId).toBeDefined();
  expect(res.KeyMetadata!.Enabled).toBe(true);
}

async function validateAlb(albDns: string) {
  const res = await elbv2.describeLoadBalancers({}).promise();
  if (!res.LoadBalancers || res.LoadBalancers.length === 0)
    throw new Error('No load balancers found');
  const found = res.LoadBalancers!.find((lb: any) => lb.DNSName === albDns);
  if (!found) throw new Error('ALB not found');
  expect(found.Scheme).toBe('internet-facing');
}

async function validateCloudTrail(
  trailName: string,
  bucketName: string,
  kmsKeyId: string
) {
  const res = await cloudtrail
    .describeTrails({ trailNameList: [trailName] })
    .promise();
  if (!res.trailList || res.trailList.length === 0)
    throw new Error('CloudTrail not found');
  expect(res.trailList!.length).toBe(1);
  const trail = res.trailList![0];
  expect(trail.S3BucketName).toBe(bucketName);
  expect(trail.KmsKeyId).toBe(kmsKeyId);
  const status = await cloudtrail.getTrailStatus({ Name: trailName }).promise();
  expect(status.IsLogging).toBe(true);
}

async function validateSecurityGroup(sgId: string, vpcId: string) {
  const res = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
  if (!res.SecurityGroups || res.SecurityGroups.length === 0)
    throw new Error('Security group not found');
  expect(res.SecurityGroups!.length).toBe(1);
  expect(res.SecurityGroups![0].VpcId).toBe(vpcId);
}

async function validateIamRole(roleName: string) {
  const res = await iam.getRole({ RoleName: roleName }).promise();
  if (!res.Role) throw new Error('IAM Role not found');
  expect(res.Role!.RoleName).toBe(roleName);
}

async function validateInstanceProfile(profileName: string) {
  const res = await iam
    .getInstanceProfile({ InstanceProfileName: profileName })
    .promise();
  if (!res.InstanceProfile) throw new Error('Instance profile not found');
  expect(res.InstanceProfile!.InstanceProfileName).toBe(profileName);
}

async function validateAsg(asgName: string) {
  const res = await autoscaling
    .describeAutoScalingGroups({ AutoScalingGroupNames: [asgName] })
    .promise();
  if (!res.AutoScalingGroups || res.AutoScalingGroups.length === 0)
    throw new Error('ASG not found');
  expect(res.AutoScalingGroups!.length).toBe(1);
  expect(res.AutoScalingGroups![0].HealthCheckType).toBeDefined();
}

async function validateLaunchTemplate(ltName: string) {
  const res = await ec2
    .describeLaunchTemplates({ LaunchTemplateNames: [ltName] })
    .promise();
  if (!res.LaunchTemplates || res.LaunchTemplates.length === 0)
    throw new Error('Launch template not found');
  expect(res.LaunchTemplates!.length).toBe(1);
}

async function validateConfigRecorder(name: string) {
  const res = await configservice
    .describeConfigurationRecorders({ ConfigurationRecorderNames: [name] })
    .promise();
  if (!res.ConfigurationRecorders || res.ConfigurationRecorders.length === 0)
    throw new Error('Config recorder not found');
  expect(res.ConfigurationRecorders!.length).toBe(1);
}

async function validateConfigDeliveryChannel(name: string) {
  const res = await configservice
    .describeDeliveryChannels({ DeliveryChannelNames: [name] })
    .promise();
  if (!res.DeliveryChannels || res.DeliveryChannels.length === 0)
    throw new Error('Config delivery channel not found');
  expect(res.DeliveryChannels!.length).toBe(1);
}

async function validateNatGateway(natGatewayId: string) {
  const res = await ec2
    .describeNatGateways({ NatGatewayIds: [natGatewayId] })
    .promise();
  if (!res.NatGateways || res.NatGateways.length === 0)
    throw new Error('NAT Gateway not found');
  expect(res.NatGateways!.length).toBe(1);
  expect(res.NatGateways![0].State).toBe('available');
}

async function validateRouteTable(routeTableId: string) {
  const res = await ec2
    .describeRouteTables({ RouteTableIds: [routeTableId] })
    .promise();
  if (!res.RouteTables || res.RouteTables.length === 0)
    throw new Error('Route table not found');
  expect(res.RouteTables!.length).toBe(1);
}

async function validateLambda(functionName: string) {
  const lambda = new AWS.Lambda();
  const res = await lambda
    .getFunction({ FunctionName: functionName })
    .promise();
  if (!res.Configuration)
    throw new Error('Lambda function configuration not found');
  expect(res.Configuration!.FunctionName).toBe(functionName);
}

describe('TapStack Enterprise Integration Tests', () => {
  // VPC
  if (outputs.VPCId) {
    test('VPC exists', async () => {
      await validateVpc(outputs.VPCId);
    });
  }
  // Subnets
  if (outputs.PublicSubnets) {
    outputs.PublicSubnets.split(',').forEach((subnetId: string) => {
      test(`Public Subnet ${subnetId} exists`, async () => {
        await validateSubnet(subnetId, outputs.VPCId);
      });
    });
  }
  if (outputs.PrivateSubnets) {
    outputs.PrivateSubnets.split(',').forEach((subnetId: string) => {
      test(`Private Subnet ${subnetId} exists`, async () => {
        await validateSubnet(subnetId, outputs.VPCId);
      });
    });
  }
  // S3 Bucket
  const bucketName = outputs.ALBEndpoint
    ? outputs.ALBEndpoint.split('.')[0]
    : `prod-cloudtrail-bucket-${process.env.AWS_ACCOUNT_ID}`;
  test('S3 Bucket exists, is versioned, and encrypted', async () => {
    await validateS3Bucket(bucketName);
  });
  // KMS Key
  if (outputs.CloudTrailKMSKeyId) {
    test('KMS Key exists and is enabled', async () => {
      await validateKmsKey(outputs.CloudTrailKMSKeyId);
    });
  }
  // ALB
  if (outputs.ALBEndpoint) {
    test('ALB exists and is internet-facing', async () => {
      await validateAlb(outputs.ALBEndpoint);
    });
  }
  // CloudTrail
  if (outputs.ProdCloudTrailName && outputs.CloudTrailKMSKeyId && bucketName) {
    test('CloudTrail exists, is logging, and is configured correctly', async () => {
      await validateCloudTrail(
        outputs.ProdCloudTrailName,
        bucketName,
        outputs.CloudTrailKMSKeyId
      );
    });
  }
  // Security Group
  if (outputs.ProdSecurityGroupId && outputs.VPCId) {
    test('Security Group exists and is in the correct VPC', async () => {
      await validateSecurityGroup(outputs.ProdSecurityGroupId, outputs.VPCId);
    });
  }
  // IAM Role
  if (outputs.EC2RoleName) {
    test('EC2 IAM Role exists', async () => {
      await validateIamRole(outputs.EC2RoleName);
    });
  }
  // Instance Profile
  if (outputs.EC2InstanceProfileName) {
    test('EC2 Instance Profile exists', async () => {
      await validateInstanceProfile(outputs.EC2InstanceProfileName);
    });
  }
  // ASG
  if (outputs.ProdASGName) {
    test('Auto Scaling Group exists and is healthy', async () => {
      await validateAsg(outputs.ProdASGName);
    });
  }
  // Launch Template
  if (outputs.ProdLaunchTemplateName) {
    test('Launch Template exists', async () => {
      await validateLaunchTemplate(outputs.ProdLaunchTemplateName);
    });
  }
  // Config Recorder
  if (outputs.ConfigRecorderName) {
    test('Config Recorder exists', async () => {
      await validateConfigRecorder(outputs.ConfigRecorderName);
    });
  }
  // Config Delivery Channel
  if (outputs.ConfigDeliveryChannelName) {
    test('Config Delivery Channel exists', async () => {
      await validateConfigDeliveryChannel(outputs.ConfigDeliveryChannelName);
    });
  }
  // NAT Gateways
  if (outputs.NatGW1Id) {
    test('NAT Gateway 1 exists and is available', async () => {
      await validateNatGateway(outputs.NatGW1Id);
    });
  }
  if (outputs.NatGW2Id) {
    test('NAT Gateway 2 exists and is available', async () => {
      await validateNatGateway(outputs.NatGW2Id);
    });
  }
  // Route Tables
  if (outputs.PublicRouteTableId) {
    test('Public Route Table exists', async () => {
      await validateRouteTable(outputs.PublicRouteTableId);
    });
  }
  if (outputs.PrivateRouteTableAId) {
    test('Private Route Table A exists', async () => {
      await validateRouteTable(outputs.PrivateRouteTableAId);
    });
  }
  if (outputs.PrivateRouteTableBId) {
    test('Private Route Table B exists', async () => {
      await validateRouteTable(outputs.PrivateRouteTableBId);
    });
  }
  // Lambda
  if (outputs.S3BucketCleanupFunctionName) {
    test('S3BucketCleanup Lambda exists', async () => {
      await validateLambda(outputs.S3BucketCleanupFunctionName);
    });
  }
  // Config IAM Role
  if (outputs.ConfigRoleName) {
    test('Config IAM Role exists', async () => {
      await validateIamRole(outputs.ConfigRoleName);
    });
  }
  // Warn for missing outputs
  [
    'NatGW1Id',
    'NatGW2Id',
    'PublicRouteTableId',
    'PrivateRouteTableAId',
    'PrivateRouteTableBId',
    'S3BucketCleanupFunctionName',
    'ConfigRoleName',
  ].forEach(key => {
    if (!outputs[key]) {
      test.skip(`${key} not found in outputs. Skipping live validation.`, () => {
        console.warn(`${key} not found in outputs. Skipping live validation.`);
      });
    }
  });
});
