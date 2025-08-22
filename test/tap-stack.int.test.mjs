import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeImagesCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVolumesCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// ------------------------------
// Config: outputs + environment
// ------------------------------
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = 'us-east-1';

// ------------------------------
// AWS SDK clients
// ------------------------------
const ec2 = new EC2Client({ region });
const logs = new CloudWatchLogsClient({ region });
const iam = new IAMClient({ region });
const s3 = new S3Client({ region });

// ------------------------------
// Helpers
// ------------------------------
function collectOutputKeys(prefix) {
  return Object.keys(outputs).filter(k => k.startsWith(prefix));
}

function getOutputValueBySuffix(suffix) {
  const key = Object.keys(outputs).find(k => k.endsWith(suffix));
  return key ? outputs[key] : undefined;
}

function definedOrSkip(condition, messageIfSkip) {
  if (!condition) {
    console.log(`SKIP: ${messageIfSkip}`);
    return false;
  }
  return true;
}

async function getAllInstancesFromOutputs() {
  // Find all Instance IDs from outputs: Instance1Id, Instance2Id, ...
  const instanceIdKeys = collectOutputKeys('Instance').filter(k => k.endsWith('Id'));
  const instanceIds = instanceIdKeys.map(k => outputs[k]).filter(Boolean);
  if (instanceIds.length === 0) return [];
  const resp = await ec2.send(new DescribeInstancesCommand({ InstanceIds: instanceIds }));
  const instances = (resp.Reservations || []).flatMap(r => r.Instances || []);
  return instances;
}

// ------------------------------
// Tests
// ------------------------------
describe('TapStack: Deployment Integration Tests', () => {
  // ------------------------------
  // Sanity: Outputs present
  // ------------------------------
  test('Stack outputs exist and are minimally complete', async () => {
    expect(outputs).toBeDefined();
    expect(outputs.SecurityGroupId).toBeDefined();
    expect(outputs.LogGroupName).toBeDefined();

    // There should be one or more instance outputs:
    const instanceIds = collectOutputKeys('Instance').filter(k => k.endsWith('Id'));
    expect(instanceIds.length).toBeGreaterThanOrEqual(1);
  });

  // ------------------------------
  // VPC & Networking (Existing VPC)
  // ------------------------------
  describe('VPC & Networking', () => {
    test('Uses an existing VPC (reachable in us-east-1) — optional if existingVpcId output exists', async () => {
      const existingVpcId = outputs.existingVpcId; // optional, if you add CfnOutput
      if (!definedOrSkip(existingVpcId, 'existingVpcId not found in outputs; add CfnOutput if you want strict VPC validation')) return;

      const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [existingVpcId] }));
      expect(resp.Vpcs).toHaveLength(1);
      const vpc = resp.Vpcs[0];
      expect(vpc).toBeDefined();
      // Optional additional checks (CIDR, DNS) can go here if you know expected values
    });

    test('EC2 instances land in multiple Availability Zones (>=2 for prod, >=1 otherwise)', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      const azs = new Set(instances.map(i => i.Placement?.AvailabilityZone).filter(Boolean));
      const required = environmentSuffix === 'prod' ? 2 : 1;
      expect(azs.size).toBeGreaterThanOrEqual(required);
    });

    test('Instances are in private subnets (no public IPs)', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      for (const i of instances) {
        // If instances are truly private, they should *not* have PublicIpAddress set.
        expect(i.PublicIpAddress).toBeUndefined();

        // Check subnet is private by attribute (MapPublicIpOnLaunch === false)
        if (i.SubnetId) {
          const subnetResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [i.SubnetId] }));
          const subnet = subnetResp.Subnets?.[0];
          expect(subnet).toBeDefined();
          if (subnet && 'MapPublicIpOnLaunch' in subnet) {
            expect(subnet.MapPublicIpOnLaunch).toBe(false);
          }
        }
      }
    });
  });

  // ------------------------------
  // Security Group
  // ------------------------------
  describe('Security Group', () => {
    test('SG ingress allows only HTTP(80) from anywhere and SSH(22) from restricted CIDR', async () => {
      const sgId = outputs.SecurityGroupId;
      expect(sgId).toMatch(/^sg-/);

      const resp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      expect(resp.SecurityGroups).toHaveLength(1);

      const sg = resp.SecurityGroups[0];

      // Ingress Rules
      const ingress = sg.IpPermissions || [];
      const seenPorts = new Set(
        ingress.flatMap(rule =>
          (rule.FromPort != null ? [rule.FromPort] : []).concat(rule.ToPort != null ? [rule.ToPort] : []),
        ),
      );

      // Must include 80 and 22
      expect(seenPorts.has(80)).toBe(true);
      expect(seenPorts.has(22)).toBe(true);

      // No other open ports other than 80 or 22
      for (const p of seenPorts) {
        if (p !== 80 && p !== 22) {
          throw new Error(`Unexpected ingress port open: ${p}`);
        }
      }

      // 80 should be 0.0.0.0/0, 22 must NOT be 0.0.0.0/0
      const hasHttpOpen = ingress.some(
        r => r.IpProtocol === 'tcp' && r.FromPort === 80 && r.IpRanges?.some(x => x.CidrIp === '0.0.0.0/0'),
      );
      expect(hasHttpOpen).toBe(true);

      const sshRules = ingress.filter(r => r.IpProtocol === 'tcp' && r.FromPort === 22);
      expect(sshRules.length).toBeGreaterThan(0);
      const sshTooOpen = sshRules.some(r => r.IpRanges?.some(x => x.CidrIp === '0.0.0.0/0'));
      expect(sshTooOpen).toBe(false);
    });

    test('SG egress is restricted: no allow-all (-1 to 0.0.0.0/0)', async () => {
      const sgId = outputs.SecurityGroupId;
      const resp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      const sg = resp.SecurityGroups?.[0];
      expect(sg).toBeDefined();

      const egress = sg.IpPermissionsEgress || [];
      // Ensure no "all traffic to 0.0.0.0/0"
      const hasAllowAll = egress.some(
        r =>
          (r.IpProtocol === '-1' || (r.FromPort == null && r.ToPort == null)) &&
          (r.IpRanges || []).some(x => x.CidrIp === '0.0.0.0/0'),
      );
      expect(hasAllowAll).toBe(false);

      // Expect explicit egress for 443, 80, and UDP 53 (per your construct)
      const has443 = egress.some(r => r.IpProtocol === 'tcp' && r.FromPort === 443);
      const has80 = egress.some(r => r.IpProtocol === 'tcp' && r.FromPort === 80);
      const hasDns = egress.some(r => r.IpProtocol === 'udp' && r.FromPort === 53);
      expect(has443).toBe(true);
      expect(has80).toBe(true);
      expect(hasDns).toBe(true);
    });
  });

  // ------------------------------
  // EC2 Instances
  // ------------------------------
  describe('EC2 Instances', () => {
    test('Instances are t2.micro, IMDSv2 required (if available), and Amazon Linux 2', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      for (const i of instances) {
        expect(i.InstanceType).toBe('t2.micro');

        // IMDSv2 required
        const tokens = i.MetadataOptions?.HttpTokens;
        if (tokens) expect(tokens).toBe('required');

        // Verify AMI is Amazon Linux 2 (via DescribeImages)
        if (i.ImageId) {
          const imgResp = await ec2.send(new DescribeImagesCommand({ ImageIds: [i.ImageId] }));
          const img = imgResp.Images?.[0];
          expect(img).toBeDefined();
          if (img?.OwnerId) expect(['137112412989', 'amazon']).toContain(img.OwnerId);
          if (img?.Name) expect(img.Name).toMatch(/amzn2|amazon linux 2/i);
          if (img?.PlatformDetails) expect(img.PlatformDetails.toLowerCase()).toContain('linux');
        }
      }
    });

    test('Root EBS volumes are encrypted (CIS requirement)', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      const volumeIds = instances
        .flatMap(i => (i.BlockDeviceMappings || []))
        .filter(bd => bd.Ebs?.VolumeId)
        .map(bd => bd.Ebs.VolumeId);

      if (!definedOrSkip(volumeIds.length > 0, 'No EBS volumes found for instances')) return;

      const volResp = await ec2.send(new DescribeVolumesCommand({ VolumeIds: volumeIds }));
      for (const v of volResp.Volumes || []) {
        expect(v.Encrypted).toBe(true);
      }
    });

    test('Instances carry Environment tag = Production', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      for (const i of instances) {
        const envTag = (i.Tags || []).find(t => t.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');
      }
    });
  });

  // ------------------------------
  // IAM & Instance Profile
  // ------------------------------
  describe('IAM: Instance Profile & Role', () => {
    test('Instances have an instance profile with a role attached', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      for (const i of instances) {
        expect(i.IamInstanceProfile?.Arn).toBeDefined();

        const profArn = i.IamInstanceProfile.Arn;
        const profName = profArn.split('/').slice(-1)[0];
        const profResp = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: profName }));
        const roles = profResp.InstanceProfile?.Roles || [];
        expect(roles.length).toBeGreaterThan(0);
      }
    });

    test('Role has CloudWatchAgentServerPolicy and restrictive inline policies', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      for (const i of instances) {
        const profName = i.IamInstanceProfile?.Arn?.split('/').slice(-1)[0];
        if (!profName) continue;

        const profResp = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: profName }));
        const role = (profResp.InstanceProfile?.Roles || [])[0];
        if (!role) continue;

        // Check managed policies (CloudWatchAgentServerPolicy)
        const attached = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: role.RoleName }));
        const hasCwAgent = (attached.AttachedPolicies || []).some(p => p.PolicyName === 'CloudWatchAgentServerPolicy');
        expect(hasCwAgent).toBe(true);

        // Inspect inline policies (parse JSON instead of regex)
        const inlineList = await iam.send(new ListRolePoliciesCommand({ RoleName: role.RoleName }));
        expect(inlineList.PolicyNames).toBeDefined();
        expect(inlineList.PolicyNames.length).toBeGreaterThanOrEqual(1); // expect at least one inline policy as per design

        // Collect actions across all inline policies
        const collectedActions = [];
        for (const polName of inlineList.PolicyNames || []) {
          const policyResp = await iam.send(new GetRolePolicyCommand({ RoleName: role.RoleName, PolicyName: polName }));
          const raw = policyResp.PolicyDocument;
          let doc;
          try {
            // AWS returns URL-encoded JSON for PolicyDocument in some SDK responses
            doc = JSON.parse(decodeURIComponent(raw));
          } catch (err) {
            // fallback if not encoded
            doc = JSON.parse(raw);
          }

          const statements = Array.isArray(doc.Statement) ? doc.Statement : [doc.Statement];
          for (const s of statements) {
            const acts = Array.isArray(s.Action) ? s.Action : [s.Action];
            for (const a of acts) {
              if (typeof a === 'string') collectedActions.push(a.toLowerCase());
            }
          }
        }

        // Ensure expected least-privilege actions are present somewhere in inline policies
        const hasS3Put = collectedActions.some(a => a.includes('s3:putobject'));
        const hasLogsPut = collectedActions.some(a => a.includes('logs:putlogevents'));
        const hasSsmGet = collectedActions.some(a => a.includes('ssm:getparameter'));

        expect(hasS3Put).toBe(true);
        expect(hasLogsPut).toBe(true);
        expect(hasSsmGet).toBe(true);
      }
    });
  });

  // ------------------------------
  // CloudWatch Logs (centralized logging)
  // ------------------------------
  describe('CloudWatch Logs', () => {
    test('Log group exists with retention ~90 days', async () => {
      const logGroupName = outputs.LogGroupName;
      expect(typeof logGroupName).toBe('string');

      const resp = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName }));
      const lg = (resp.logGroups || []).find(g => g.logGroupName === logGroupName);
      expect(lg).toBeDefined();

      if ('retentionInDays' in lg) {
        expect([90, 91, 92]).toContain(lg.retentionInDays);
      }
    });

    test('Instances are producing log streams in the log group', async () => {
      const logGroupName = outputs.LogGroupName;
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      for (const i of instances) {
        const resp = await logs.send(
          new DescribeLogStreamsCommand({ logGroupName, logStreamNamePrefix: `${i.InstanceId}/` }),
        );
        expect((resp.logStreams || []).length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ------------------------------
  // S3 (logs bucket) — optional unless you output LogsBucketName
  // ------------------------------
  describe('S3: Logs bucket (optional)', () => {
    test('Logs bucket exists + block public access + encryption + versioning', async () => {
      const bucket = outputs.LogsBucketName || process.env.LOGS_BUCKET_NAME;
      if (!definedOrSkip(bucket, 'No LogsBucketName in outputs; set LOGS_BUCKET_NAME env to enable this test')) return;

      // Existence
      await expect(s3.send(new HeadBucketCommand({ Bucket: bucket }))).resolves.toBeDefined();

      // Encryption
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      expect(enc.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThanOrEqual(1);

      // Versioning
      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      expect(ver.Status).toBe('Enabled');

      // Public access block
      const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
      const cfg = pab.PublicAccessBlockConfiguration;
      expect(cfg?.BlockPublicAcls).toBe(true);
      expect(cfg?.IgnorePublicAcls).toBe(true);
      expect(cfg?.BlockPublicPolicy).toBe(true);
      expect(cfg?.RestrictPublicBuckets).toBe(true);
    });
  });

  // ------------------------------
  // Cross-wiring & End-to-End
  // ------------------------------
  describe('Cross-wiring & End-to-End', () => {
    test('Instances are associated with the stack Security Group', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      const sgId = outputs.SecurityGroupId;
      for (const i of instances) {
        const attachedSgs = (i.SecurityGroups || []).map(g => g.GroupId);
        expect(attachedSgs).toContain(sgId);
      }
    });

    test('Region is correct (us-east-1)', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      for (const i of instances) {
        const az = i.Placement?.AvailabilityZone || '';
        expect(az.startsWith('us-east-1')).toBe(true);
      }
    });

    test('Infrastructure follows naming conventions (LogsBucketName contains env suffix)', async () => {
      const bucketName = outputs.LogsBucketName || process.env.LOGS_BUCKET_NAME;
      if (!definedOrSkip(bucketName, 'No LogsBucketName in outputs, skipping naming convention test')) return;
      expect(bucketName).toContain(environmentSuffix);
    });

    test('Naming/tagging conventions adhered (Environment tag everywhere possible)', async () => {
      const instances = await getAllInstancesFromOutputs();
      if (!definedOrSkip(instances.length > 0, 'No instance IDs in outputs')) return;

      for (const i of instances) {
        const envTag = (i.Tags || []).find(t => t.Key === 'Environment');
        expect(envTag?.Value).toBe('Production');
      }
    });
  });
});
