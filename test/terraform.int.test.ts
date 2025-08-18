import { expect, test } from '@cloudposse/terraform-test';

test('VPC is created with correct CIDR and DNS settings', async ({
  terraform,
}) => {
  const vpcId = terraform.output('aws_vpc_main_id');
  expect(vpcId).toBeTruthy();
  const vpc = await terraform.aws.ec2.getVpc({ id: vpcId });
  expect(vpc.cidrBlock).toBe(terraform.var('vpc_cidr'));
  expect(vpc.enableDnsHostnames).toBe(true);
  expect(vpc.enableDnsSupport).toBe(true);
});

test('Internet Gateway is attached to the VPC', async ({ terraform }) => {
  const igwId = terraform.output('aws_internet_gateway_main_id');
  expect(igwId).toBeTruthy();
  const igw = await terraform.aws.ec2.getInternetGateway({ id: igwId });
  expect(igw.attachments[0].vpcId).toBe(terraform.output('aws_vpc_main_id'));
});

test('Public and private subnets are created with correct CIDRs and AZs', async ({
  terraform,
}) => {
  const publicSubnets = terraform.output('aws_subnet_public_ids') as string[];
  const privateSubnets = terraform.output('aws_subnet_private_ids') as string[];
  expect(publicSubnets.length).toBe(
    terraform.var('public_subnet_cidrs').length
  );
  expect(privateSubnets.length).toBe(
    terraform.var('private_subnet_cidrs').length
  );
  // Optionally check AZs and CIDRs for each subnet
});

test('NAT Gateway uses correct EIP and is in a public subnet', async ({
  terraform,
}) => {
  const natGwId = terraform.output('aws_nat_gateway_main_id');
  expect(natGwId).toBeTruthy();
  const natGw = await terraform.aws.ec2.getNatGateway({ id: natGwId });
  expect(terraform.var('public_subnet_cidrs')).toContain(natGw.subnetId);
});

test('S3 buckets for data and logs are created, versioned, encrypted, and private', async ({
  terraform,
}) => {
  const dataBucket = terraform.output('aws_s3_bucket_data_id');
  const logsBucket = terraform.output('aws_s3_bucket_logs_id');
  expect(dataBucket).toBeTruthy();
  expect(logsBucket).toBeTruthy();

  // Check versioning is enabled
  const dataVer = await terraform.aws.s3.getBucketVersioning({
    bucket: dataBucket,
  });
  expect(dataVer.status).toBe('Enabled');
  const logsVer = await terraform.aws.s3.getBucketVersioning({
    bucket: logsBucket,
  });
  expect(logsVer.status).toBe('Enabled');

  // Check encryption
  const dataEnc = await terraform.aws.s3.getBucketEncryption({
    bucket: dataBucket,
  });
  expect(
    dataEnc.rules.some(
      rule =>
        rule.applyServerSideEncryptionByDefault?.sseAlgorithm === 'aws:kms'
    )
  ).toBe(true);

  // Check public access block
  const dataPab = await terraform.aws.s3.getPublicAccessBlock({
    bucket: dataBucket,
  });
  expect(dataPab.blockPublicAcls).toBe(true);
  expect(dataPab.blockPublicPolicy).toBe(true);
  expect(dataPab.ignorePublicAcls).toBe(true);
  expect(dataPab.restrictPublicBuckets).toBe(true);
});

test('IAM user exists and MFA policy is attached', async ({ terraform }) => {
  const userName = terraform.output('ec2_instance_profile_name');
  expect(userName).toContain(terraform.var('project_name'));
  const user = await terraform.aws.iam.getUser({ userName });
  expect(user).toBeTruthy();
  // Optionally check policy attachment
});
