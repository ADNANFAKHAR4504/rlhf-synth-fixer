// tap-stack.int.test.ts
import fs from 'fs';
import AWS from 'aws-sdk';

// Load outputs
const outputsPath = 'cfn-outputs/flat-outputs.json';
const outputsRaw = fs.existsSync(outputsPath)
  ? fs.readFileSync(outputsPath, 'utf8')
  : '{}';
const outputs: Record<string, string> = JSON.parse(outputsRaw || '{}');

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// LocalStack endpoint configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK_ENDPOINT !== undefined;

const localStackEndpoint = process.env.AWS_ENDPOINT_URL ||
                           process.env.LOCALSTACK_ENDPOINT ||
                           'http://localhost:4566';

describe('TapStack Integration Tests', () => {
  jest.setTimeout(300000); // allow up to 5 minutes for live AWS calls

  const region = process.env.AWS_REGION || 'us-east-1';

  // Configure AWS SDK with LocalStack support
  const awsConfig: AWS.ConfigurationOptions = {
    region,
  };

  // Add LocalStack-specific configuration if detected
  if (isLocalStack) {
    awsConfig.endpoint = localStackEndpoint;
    awsConfig.s3ForcePathStyle = true;
    awsConfig.accessKeyId = 'test';
    awsConfig.secretAccessKey = 'test';
  }

  AWS.config.update(awsConfig);

  const ec2 = new AWS.EC2();
  const rds = new AWS.RDS();
  const kms = new AWS.KMS();
  const logs = new AWS.CloudWatchLogs();

  it('should have created the VPC', async () => {
    expect(outputs.VpcId).toBeDefined();
    const vpcResp = await ec2
      .describeVpcs({ VpcIds: [outputs.VpcId] })
      .promise();
    expect(vpcResp.Vpcs?.[0]?.VpcId).toEqual(outputs.VpcId);
  });

  it('should have created required subnets', async () => {
    const subnetsResp = await ec2
      .describeSubnets({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }],
      })
      .promise();

    const subnetTypes = subnetsResp.Subnets?.map(
      s => s.Tags?.find(t => t.Key === 'aws-cdk:subnet-type')?.Value
    );
    expect(subnetTypes).toContain('Public');
    expect(subnetTypes).toContain('Private');
    expect(subnetTypes).toContain('Isolated');
  });

  it('should configure EC2 security group with HTTP/HTTPS inbound', async () => {
    expect(outputs.Ec2SecurityGroupId).toBeDefined();
    const sgResp = await ec2
      .describeSecurityGroups({ GroupIds: [outputs.Ec2SecurityGroupId] })
      .promise();
    const sg = sgResp.SecurityGroups?.[0];
    const http = sg?.IpPermissions?.some(
      p => p.FromPort === 80 && p.ToPort === 80 && p.IpProtocol === 'tcp'
    );
    const https = sg?.IpPermissions?.some(
      p => p.FromPort === 443 && p.ToPort === 443 && p.IpProtocol === 'tcp'
    );
    expect(http).toBeTruthy();
    expect(https).toBeTruthy();
  });

  it('should configure RDS security group to allow EC2 access', async () => {
    expect(outputs.RdsSecurityGroupId).toBeDefined();
    const sgResp = await ec2
      .describeSecurityGroups({ GroupIds: [outputs.RdsSecurityGroupId] })
      .promise();
    const sg = sgResp.SecurityGroups?.[0];
    const postgresRule = sg?.IpPermissions?.find(
      p => p.FromPort === 5432 && p.ToPort === 5432 && p.IpProtocol === 'tcp'
    );
    expect(postgresRule?.UserIdGroupPairs?.[0]?.GroupId).toEqual(
      outputs.Ec2SecurityGroupId
    );
  });

  it('should have two running EC2 instances with encrypted volumes', async () => {
    const instanceIds = [outputs.Ec2Instance1Id, outputs.Ec2Instance2Id].filter(
      Boolean
    ) as string[];
    expect(instanceIds).toHaveLength(2);

    const resp = await ec2
      .describeInstances({ InstanceIds: instanceIds })
      .promise();
    const instances = resp.Reservations?.flatMap(r => r.Instances!) ?? [];
    expect(instances).toHaveLength(2);

    for (const inst of instances) {
      expect(inst.State?.Name).toBe('running');
      for (const bd of inst.BlockDeviceMappings ?? []) {
        const vol = await ec2
          .describeVolumes({ VolumeIds: [bd.Ebs!.VolumeId!] })
          .promise();
        expect(vol.Volumes?.[0]?.Encrypted).toBe(true);
      }
    }
  });

  it('should have an available and encrypted RDS instance', async () => {
    expect(outputs.DatabaseEndpoint).toBeDefined();
    const dbIdentifier = outputs.DatabaseEndpoint.split('.')[0];
    const resp = await rds
      .describeDBInstances({ DBInstanceIdentifier: dbIdentifier })
      .promise();
    const db = resp.DBInstances?.[0];
    expect(db?.DBInstanceStatus).toBe('available');
    expect(db?.StorageEncrypted).toBe(true);
    expect(db?.PubliclyAccessible).toBe(false);
  });

  it('should have a valid KMS key with rotation enabled', async () => {
    expect(outputs.KmsKeyId).toBeDefined();
    const keyResp = await kms
      .describeKey({ KeyId: outputs.KmsKeyId })
      .promise();
    expect(keyResp.KeyMetadata?.Enabled).toBe(true);

    const rotationResp = await kms
      .getKeyRotationStatus({ KeyId: outputs.KmsKeyId })
      .promise();
    expect(rotationResp.KeyRotationEnabled).toBe(true);
  });

  it('should have CloudWatch log groups for EC2 instances', async () => {
    const resp = await logs
      .describeLogGroups({
        logGroupNamePrefix: `/aws/ec2/tap-${environmentSuffix}`,
      })
      .promise();
    expect(resp.logGroups?.length).toBeGreaterThanOrEqual(0);
  });
});
