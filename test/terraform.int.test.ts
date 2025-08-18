import { expect, test } from '@cloudposse/terraform-test';

test('VPC is created with correct CIDR and DNS settings', async ({
  terraform,
}) => {
  const vpcId = terraform.output('vpc_id');
  expect(vpcId).toBeTruthy();
  const vpc = await terraform.aws.ec2.getVpc({ id: vpcId });
  expect(vpc.cidrBlock).toBe(terraform.var('vpc_cidr'));
  expect(vpc.enableDnsHostnames).toBe(true);
  expect(vpc.enableDnsSupport).toBe(true);
});

test('S3 data bucket is created, versioned, encrypted, and private', async ({
  terraform,
}) => {
  const dataBucketName = terraform.output('s3_data_bucket_name');
  expect(dataBucketName).toBeTruthy();

  // Check versioning is enabled
  const dataVer = await terraform.aws.s3.getBucketVersioning({
    bucket: dataBucketName,
  });
  expect(dataVer.status).toBe('Enabled');

  // Check encryption
  const dataEnc = await terraform.aws.s3.getBucketEncryption({
    bucket: dataBucketName,
  });
  expect(
    dataEnc.rules.some(
      rule =>
        rule.applyServerSideEncryptionByDefault?.sseAlgorithm === 'aws:kms'
    )
  ).toBe(true);

  // Check public access block
  const dataPab = await terraform.aws.s3.getPublicAccessBlock({
    bucket: dataBucketName,
  });
  expect(dataPab.blockPublicAcls).toBe(true);
  expect(dataPab.blockPublicPolicy).toBe(true);
  expect(dataPab.ignorePublicAcls).toBe(true);
  expect(dataPab.restrictPublicBuckets).toBe(true);
});
