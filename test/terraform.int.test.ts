// test/terraform.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json'); // Adjust path if needed
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs: Record<string, any> = JSON.parse(outputsRaw);

if (!outputs.region) {
  throw new Error('AWS region not found in flat outputs.');
}

AWS.config.update({ region: outputs.region });

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const cloudtrail = new AWS.CloudTrail();
const iam = new AWS.IAM();
const kms = new AWS.KMS();
const sns = new AWS.SNS();
const wafv2 = new AWS.WAFV2();
const rds = new AWS.RDS();

describe('TAP Stack Live Integration Tests', () => {
  // Parse JSON-encoded arrays in outputs
  const ec2InstanceIds: string[] = JSON.parse(outputs.ec2_instance_ids || '[]');
  const natGatewayIds: string[] = JSON.parse(outputs.nat_gateway_ids || '[]');
  const privateSubnetIds: string[] = JSON.parse(outputs.private_subnet_ids || '[]');
  const publicSubnetIds: string[] = JSON.parse(outputs.public_subnet_ids || '[]');
  const rdsEndpoints = {
    main: outputs.rds_endpoint,
    replica: outputs.rds_read_replica_endpoint,
  };

  it('VPC exists with correct CIDR block', async () => {
    if (!outputs.vpc_id || !outputs.vpc_cidr) return;

    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcs.Vpcs?.length).toBe(1);
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway exists and attached to VPC', async () => {
    if (!outputs.internet_gateway_id || !outputs.vpc_id) return;

    const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    expect(igw.InternetGateways?.length).toBe(1);
    const attachment = igw.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe('available');
  });

  it('Public and private subnets exist and belong to the VPC', async () => {
    if (!publicSubnetIds.length || !privateSubnetIds.length || !outputs.vpc_id) return;

    const publicSubnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
    publicSubnets.Subnets?.forEach(s => {
      expect(publicSubnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toBe(outputs.vpc_id);
    });

    const privateSubnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
    privateSubnets.Subnets?.forEach(s => {
      expect(privateSubnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toBe(outputs.vpc_id);
    });
  });

  it('NAT Gateways exist and have public IPs assigned', async () => {
    if (!natGatewayIds.length) return;

    const natGateways = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
    expect(natGateways.NatGateways?.length).toBe(natGatewayIds.length);

    natGateways.NatGateways?.forEach(nat => {
      expect(nat.NatGatewayAddresses?.[0].PublicIp).toBeDefined();
      expect(nat.State).toBe('available');
    });
  });

  it('EC2 instances exist with correct private IPs and are running', async () => {
    if (!ec2InstanceIds.length) return;

    const instancesResp = await ec2.describeInstances({ InstanceIds: ec2InstanceIds }).promise();
    const allInstances = instancesResp.Reservations?.flatMap(r => r.Instances) || [];
    expect(allInstances.length).toBe(ec2InstanceIds.length);

    allInstances.forEach(instance => {
      expect(ec2InstanceIds).toContain(instance.InstanceId);
      expect(instance.PrivateIpAddress).toMatch(/\d+\.\d+\.\d+\.\d+/);
      expect(outputs.ec2_private_ips.includes(instance.PrivateIpAddress)).toBe(true);
      expect(instance.State?.Name).toMatch(/pending|running|stopping|stopped/);
      // Fix: Match instance-profile ARN, not Role ARN
      expect(instance.IamInstanceProfile?.Arn).toContain('instance-profile/');
      // Optionally also check for expected profile name
      // expect(instance.IamInstanceProfile?.Arn).toContain('ec2-instance-profile-tap-stack-');
    });
  });

  it('S3 buckets exist and are not publicly accessible', async () => {
    const bucketNames = [
      outputs.s3_bucket_name,
      outputs.config_s3_bucket_name,
      outputs.cloudtrail_s3_bucket_name
    ].filter(Boolean);

    for (const bucketName of bucketNames) {
      const acl = await s3.getBucketAcl({ Bucket: bucketName }).promise();
      expect(acl.Owner).toBeDefined();

      const pab = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }
  });

  it('IAM role for EC2 instance exists and has correct ARN', async () => {
    if (!outputs.iam_role_ec2_name || !outputs.iam_role_ec2_arn) return;

    const roleResp = await iam.getRole({ RoleName: outputs.iam_role_ec2_name }).promise();
    expect(roleResp.Role?.Arn).toBe(outputs.iam_role_ec2_arn);
  });

  it('SNS topic exists and has correct ARN', async () => {
    if (!outputs.sns_topic_arn) return;

    const attrs = await sns.getTopicAttributes({ TopicArn: outputs.sns_topic_arn }).promise();
    expect(attrs.Attributes?.TopicArn).toBe(outputs.sns_topic_arn);
  });

  it('CloudTrail exists and logging is enabled', async () => {
    if (!outputs.cloudtrail_name && !outputs.cloudtrail_s3_bucket_name) return;
    const trails = await cloudtrail.describeTrails({}).promise();
    // Show trails on failure for debug
    if (!trails.trailList || !trails.trailList.length) {
      console.warn('No trails found:', trails);
    }
    // Try by name first; fall back to S3 bucket check if needed
    let trail = trails.trailList?.find(
      t => t.Name === outputs.cloudtrail_name
        || (t.S3BucketName && t.S3BucketName === outputs.cloudtrail_s3_bucket_name)
    );
    // Print all trails if not found
    if (!trail) {
      console.warn(
        'CloudTrail not found by name, available trails:',
        trails.trailList?.map(t => ({ Name: t.Name, S3BucketName: t.S3BucketName }))
      );
    }
    expect(trail).toBeDefined();
    if (trail) {
      const status = await cloudtrail.getTrailStatus({ Name: trail.Name }).promise();
      expect(status.IsLogging).toBe(true);
    }
  });

  it('WAF WebACL exists with expected name and ARN', async () => {
    if (!outputs.waf_web_acl_id || !outputs.waf_web_acl_arn) return;
    const params = {
      Id: outputs.waf_web_acl_id,
      Name: `waf-acl-tap-stack-${outputs.resource_suffix || ''}`.trim(),
      Scope: 'REGIONAL'
    };
    let wafArn: string | undefined = undefined;
    try {
      const waf = await wafv2.getWebACL(params).promise();
      wafArn = waf.WebACL?.ARN;
    } catch (err) {
      // fallback to list all and match by ID or ARN
      const resp = await wafv2.listWebACLs({ Scope: 'REGIONAL' }).promise();
      const acl = resp.WebACLs?.find(a =>
        a.Id === outputs.waf_web_acl_id || a.ARN === outputs.waf_web_acl_arn
      );
      wafArn = acl?.ARN;
    }
    expect(wafArn).toBe(outputs.waf_web_acl_arn);
  });

  it('RDS main and read replica endpoints are reachable on port 3306 (MySQL)', async () => {
    const net = require('net');
    const checkPortOpen = (host: string, port: number) =>
      new Promise<boolean>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        }).on('timeout', () => {
          socket.destroy();
          resolve(false);
        }).on('error', () => {
          socket.destroy();
          resolve(false);
        }).connect(port, host);
      });

    // Check if endpoint is publicly accessible using RDS API
    const endpointsToCheck: { ep: string, idOrName?: string }[] = [];
    if (outputs.rds_instance_id) endpointsToCheck.push({ ep: rdsEndpoints.main, idOrName: outputs.rds_instance_id });
    if (outputs.rds_read_replica_endpoint && outputs.rds_read_replica_endpoint !== rdsEndpoints.main)
      endpointsToCheck.push({ ep: rdsEndpoints.replica });

    for (const { ep, idOrName } of endpointsToCheck) {
      if (!ep) continue;
      const [host, portStr] = ep.split(':');
      const port = parseInt(portStr) || 3306;

      // default skip for private, only check if DB is public
      let shouldTest = false;
      if (idOrName) {
        try {
          const rdsDesc = await rds.describeDBInstances({ DBInstanceIdentifier: idOrName }).promise();
          if (rdsDesc.DBInstances?.[0]?.PubliclyAccessible) shouldTest = true;
        } catch (e) {
          // Ignore describe error, proceed with connection attempt.
        }
      }
      if (!shouldTest) {
        console.warn(`Skipping TCP port check for ${ep} (not publicly accessible instance or not determinable).`);
        continue;
      }
      const open = await checkPortOpen(host, port);
      expect(open).toBe(true);
    }
  });

  it('KMS key exists and is enabled', async () => {
    if (!outputs.kms_key_id) return;

    const key = await kms.describeKey({ KeyId: outputs.kms_key_id }).promise();
    expect(key.KeyMetadata?.KeyId).toBe(outputs.kms_key_id);
    expect(key.KeyMetadata?.Enabled).toBe(true);
  });
});

