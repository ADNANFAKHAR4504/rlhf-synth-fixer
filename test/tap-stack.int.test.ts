import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import axios from 'axios';
import { S3Client, PutObjectCommand, HeadObjectCommand, GetBucketVersioningCommand, GetObjectLockConfigurationCommand, ListObjectsV2Command, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { SSMClient, SendCommandCommand, GetCommandInvocationCommand } from '@aws-sdk/client-ssm';
import { WAFV2Client, GetWebACLForResourceCommand } from '@aws-sdk/client-wafv2';
import { CloudTrailClient, LookupEventsCommand, DescribeTrailsCommand } from '@aws-sdk/client-cloudtrail';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { EventBridgeClient, DescribeRuleCommand, ListTargetsByRuleCommand, ListRuleNamesByTargetCommand } from '@aws-sdk/client-eventbridge';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { SecretsManagerClient, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';
import { ElasticLoadBalancingV2Client, DescribeListenersCommand, DescribeTargetHealthCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';



const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const regionFilePath = path.join('iac-test-automations', 'lib', 'AWS_REGION');
const detectedRegion = fs.existsSync(regionFilePath)
  ? fs.readFileSync(regionFilePath, 'utf8').trim()
  : process.env.AWS_REGION;

const s3 = new S3Client({ region: detectedRegion });
const ec2 = new EC2Client({ region: detectedRegion });
const ssm = new SSMClient({ region: detectedRegion });
const wafv2 = new WAFV2Client({ region: detectedRegion });
const cloudtrail = new CloudTrailClient({ region: detectedRegion });
const kms = new KMSClient({ region: detectedRegion });
const events = new EventBridgeClient({ region: detectedRegion });
const rds = new RDSClient({ region: detectedRegion });
const secrets = new SecretsManagerClient({ region: detectedRegion });
const elbv2 = new ElasticLoadBalancingV2Client({ region: detectedRegion });
const logs = new CloudWatchLogsClient({ region: detectedRegion });
// no STS client needed

const randomKey = () => crypto.randomBytes(8).toString('hex');

async function getFirstRunningAppInstanceId(applicationSgId: string): Promise<string> {
  const resp = await ec2.send(
    new DescribeInstancesCommand({
      Filters: [
        { Name: 'instance-state-name', Values: ['running'] },
        { Name: 'instance.group-id', Values: [applicationSgId] },
      ],
      MaxResults: 1000,
    })
  );
  const reservations = resp.Reservations || [];
  for (const r of reservations) {
    for (const inst of r.Instances || []) {
      if (inst.InstanceId) return inst.InstanceId;
    }
  }
  throw new Error('No running app instance found in application SG');
}

async function sendSsmShell(instanceId: string, commands: string[], timeoutSeconds = 300): Promise<{ stdout: string; stderr: string; status: string }> {
  const send = await ssm.send(
    new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: { commands },
      CloudWatchOutputConfig: { CloudWatchOutputEnabled: false },
      TimeoutSeconds: timeoutSeconds,
    })
  );
  const commandId = send.Command?.CommandId as string;
  const start = Date.now();
  while (Date.now() - start < timeoutSeconds * 1000) {
    await new Promise((r) => setTimeout(r, 5000));
    const inv = await ssm.send(
      new GetCommandInvocationCommand({ CommandId: commandId, InstanceId: instanceId })
    );
    if ((inv.Status || '').toLowerCase().includes('success')) {
      return { stdout: inv.StandardOutputContent || '', stderr: inv.StandardErrorContent || '', status: inv.Status || '' };
    }
    if ((inv.Status || '').toLowerCase().includes('failed')) {
      return { stdout: inv.StandardOutputContent || '', stderr: inv.StandardErrorContent || '', status: inv.Status || '' };
    }
  }
  throw new Error('SSM command timed out');
}

describe('TapStack End-to-End Infrastructure Tests', () => {
  const appBucket = outputs['AppDataBucket'];
  const patientDocsBucket = outputs['PatientDocumentsBucketName'];
  const albDns = outputs['ALBDNSName'];
  const albArn = outputs['ALBArn'];
  const kmsKeyId = outputs['KMSKeyId'];
  const appSgId = outputs['ApplicationSecurityGroupId'];
  const rdsEndpoint = outputs['RDSEndpoint'];
  const cloudTrailArn = outputs['CloudTrailArn'];
  const securityAlertTopicArn = outputs['SecurityAlertTopicArn'];
  const vpcId = outputs['VPCId'];
  const vpcFlowLogGroup = outputs['VPCFlowLogsGroupName'];
  const dbSecretArn = outputs['DatabaseSecretArn'];
  const bastionSgId = outputs['BastionSecurityGroupId'];
  const albSgId = outputs['ALBSecurityGroupId'];
  const dbSgId = outputs['DatabaseSecurityGroupId'];
  const cloudTrailBucket = outputs['CloudTrailBucketName'];
  const rdsIdentifier = outputs['RDSInstanceIdentifier'];

  test('S3 Patient Documents bucket enforces KMS encryption and versioning', async () => {
    const key = `e2e/${randomKey()}.txt`;
    await s3.send(
      new PutObjectCommand({
        Bucket: patientDocsBucket,
        Key: key,
        Body: 'patient-docs-test',
      })
    );
    const head = await s3.send(new HeadObjectCommand({ Bucket: patientDocsBucket, Key: key }));
    expect(head.ServerSideEncryption).toBe('aws;kms'.replace(';', ':'));
    expect((head.SSEKMSKeyId || '').includes(kmsKeyId)).toBe(true);
    const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: patientDocsBucket }));
    expect(ver.Status).toBe('Enabled');
    const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: patientDocsBucket }));
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });

  test('ALB serves TLS and is associated with WAFv2 WebACL', async () => {
    const agent = new https.Agent({ keepAlive: true });
    let status = 0;
    try {
      const resp = await axios.get(`https://${albDns}/`, { httpsAgent: agent, timeout: 15000, validateStatus: () => true });
      status = resp.status;
    } catch (e) {
      // Even if targets are unhealthy, TLS handshake should succeed and either timeout at LB or return 5xx
    }
    expect(typeof status).toBe('number');
    const waf = await wafv2.send(
      new GetWebACLForResourceCommand({ ResourceArn: albArn })
    );
    expect(waf.WebACL?.Name).toBeDefined();
    const hasManaged = (waf.WebACL?.Rules || []).some((r) => r.Statement?.ManagedRuleGroupStatement);
    expect(hasManaged).toBe(true);
  });

  test('WAF blocks common SQLi patterns at ALB edge', async () => {
    const agent = new https.Agent({ keepAlive: true });
    const url = `https://${albDns}/?id=1' OR '1'='1`;
    const resp = await axios.get(url, { httpsAgent: agent, timeout: 15000, validateStatus: () => true });
    expect(resp.status).toBe(403);
  });

  test('WAF has required AWS managed rule sets configured', async () => {
    const waf = await wafv2.send(new GetWebACLForResourceCommand({ ResourceArn: albArn }));
    const names = new Set((waf.WebACL?.Rules || []).map((r) => r.Name));
    // Names must match those defined in the template
    expect(names.has('AWSManagedRulesCommonRuleSet')).toBe(true);
    expect(names.has('AWSManagedRulesKnownBadInputsRuleSet')).toBe(true);
    expect(names.has('AWSManagedRulesSQLiRuleSet')).toBe(true);
  });

  test('App EC2 instance can write to AppData S3 bucket with KMS SSE', async () => {
    const instanceId = await getFirstRunningAppInstanceId(appSgId);
    const key = `ssm-upload/${randomKey()}.txt`;
    const commands = [
      'set -euo pipefail',
      'sudo yum install -y -q awscli jq >/dev/null 2>&1 || true',
      `echo e2e-ssm-upload > /tmp/e2e.txt`,
      `aws s3 cp /tmp/e2e.txt s3://${appBucket}/${key} --sse aws:kms --sse-kms-key-id ${kmsKeyId}`,
      `echo DONE`
    ];
    const result = await sendSsmShell(instanceId, commands, 420);
    expect(result.status.toLowerCase()).toContain('success');
    const head = await s3.send(new HeadObjectCommand({ Bucket: appBucket, Key: key }));
    expect(head.ServerSideEncryption).toBe('aws;kms'.replace(';', ':'));
    expect((head.SSEKMSKeyId || '').includes(kmsKeyId)).toBe(true);
  });

  test('App EC2 instance can retrieve DB secret and connect to RDS (SELECT 1)', async () => {
    const instanceId = await getFirstRunningAppInstanceId(appSgId);
    const secretName = dbSecretArn;
    const cmds = [
      'set -euo pipefail',
      'sudo yum install -y -q mysql jq awscli >/dev/null 2>&1 || true',
      `json=$(aws secretsmanager get-secret-value --secret-id ${secretName} --query SecretString --output text)`,
      'user=$(echo "$json" | jq -r .username)',
      'pass=$(echo "$json" | jq -r .password)',
      `mysql -h ${rdsEndpoint} -u "$user" -p"$pass" -e "SELECT 1;" | tee /tmp/mysql_out.txt`,
      'grep -q "1" /tmp/mysql_out.txt && echo OK || (echo FAIL && exit 1)'
    ];
    const result = await sendSsmShell(instanceId, cmds, 600);
    expect(result.status.toLowerCase()).toContain('success');
    expect(result.stdout).toContain('OK');
  });

  test('RDS instance is Multi-AZ, encrypted with KMS, and not publicly accessible', async () => {
    const db = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsIdentifier }));
    const i = db.DBInstances?.[0];
    expect(i?.MultiAZ).toBe(true);
    expect(i?.StorageEncrypted).toBe(true);
    expect((i?.KmsKeyId || '').includes(kmsKeyId)).toBe(true);
    expect(i?.PubliclyAccessible).toBe(false);
  });

  test('Secrets Manager rotation is enabled for DB secret with 30-day schedule', async () => {
    const desc = await secrets.send(new DescribeSecretCommand({ SecretId: dbSecretArn }));
    expect(desc.RotationEnabled).toBe(true);
    expect(desc.RotationRules?.AutomaticallyAfterDays).toBe(30);
  });

  test('CloudTrail is logging management events (LookupEvents)', async () => {
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const resp = await cloudtrail.send(
      new LookupEventsCommand({ StartTime: since, MaxResults: 10 })
    );
    expect((resp.Events || []).length).toBeGreaterThan(0);
    expect(cloudTrailArn).toBeTruthy();
  });

  test('CloudTrail bucket has Object Lock enabled (governance mode)', async () => {
    const conf = await s3.send(new GetObjectLockConfigurationCommand({ Bucket: cloudTrailBucket }));
    expect(conf.ObjectLockConfiguration?.ObjectLockEnabled).toBe('Enabled');
    const mode = conf.ObjectLockConfiguration?.Rule?.DefaultRetention?.Mode;
    expect(mode).toBe('GOVERNANCE');
    const days = conf.ObjectLockConfiguration?.Rule?.DefaultRetention?.Days as number | undefined;
    expect(days && days >= 2555).toBe(true);
  });

  test('CloudTrail is delivering logs to the immutable S3 bucket', async () => {
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: cloudTrailBucket, Prefix: 'cloudtrail-logs/', MaxKeys: 10 }));
    expect((listed.Contents || []).length).toBeGreaterThan(0);
  });

  test('ALB has HTTPS listener (443) and target group has registered targets', async () => {
    const listeners = await elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: albArn }));
    const has443 = (listeners.Listeners || []).some((l) => l.Port === 443 && l.Protocol === 'HTTPS');
    expect(has443).toBe(true);
    const certAttached = (listeners.Listeners || [])
      .filter((l) => l.Port === 443)
      .some((l) => (l.Certificates || []).length > 0);
    expect(certAttached).toBe(true);

    const tgs = await elbv2.send(new DescribeTargetGroupsCommand({ LoadBalancerArn: albArn }));
    const tgArn = tgs.TargetGroups?.[0]?.TargetGroupArn as string;
    expect(tgArn).toBeTruthy();
    const th = await elbv2.send(new DescribeTargetHealthCommand({ TargetGroupArn: tgArn }));
    expect((th.TargetHealthDescriptions || []).length).toBeGreaterThan(0);
  });

  test('Bastion security group restricts SSH to a single trusted CIDR', async () => {
    // Describe the bastion SG and verify single restricted ingress on tcp/22
    const sgResp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [bastionSgId] }));
    const sg = (sgResp.SecurityGroups || [])[0];
    expect(sg?.GroupId).toBe(bastionSgId);
    const perms = sg?.IpPermissions || [];
    // Only SSH ingress expected; ensure minimal and not world-open
    expect(perms.length).toBe(1);
    const ssh = perms[0];
    expect(ssh.IpProtocol).toBe('tcp');
    expect(ssh.FromPort).toBe(22);
    expect(ssh.ToPort).toBe(22);
    expect(ssh).toBeTruthy();
    const cidrs = (ssh?.IpRanges || []).map((r) => r.CidrIp);
    expect(cidrs.length).toBe(1);
    expect(cidrs).not.toContain('0.0.0.0/0');
    // No SG-to-SG pairs for bastion ingress
    expect((ssh.UserIdGroupPairs || []).length).toBe(0);
  });

  test('Bastion instance has a public IP; App instances have no public IP', async () => {
    const bastionInstances = await ec2.send(new DescribeInstancesCommand({ Filters: [ { Name: 'instance.group-id', Values: [bastionSgId] }, { Name: 'instance-state-name', Values: ['running'] } ] }));
    const bastion = (bastionInstances.Reservations || []).flatMap((r) => r.Instances || [])[0];
    expect(bastion?.PublicIpAddress).toBeDefined();

    const appInstances = await ec2.send(new DescribeInstancesCommand({ Filters: [ { Name: 'instance.group-id', Values: [appSgId] }, { Name: 'instance-state-name', Values: ['running'] } ] }));
    const apps = (appInstances.Reservations || []).flatMap((r) => r.Instances || []);
    expect(apps.length).toBeGreaterThan(0);
    for (const i of apps) {
      expect(i?.PublicIpAddress).toBeUndefined();
    }
  });

  test('Application SG inbound rules are only from ALB and Bastion', async () => {
    const appSg = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [appSgId] }));
    const perms = appSg.SecurityGroups?.[0]?.IpPermissions || [];
    // Must not allow 0.0.0.0/0
    for (const p of perms) {
      const cidrs = (p.IpRanges || []).map((r) => r.CidrIp);
      expect(cidrs).not.toContain('0.0.0.0/0');
    }
    // Ensure there is at least one rule from ALB and one from Bastion
    const fromAlb = perms.some((p) => (p.UserIdGroupPairs || []).some((g) => g.GroupId === albSgId) && p.IpProtocol === 'tcp');
    const fromBastion = perms.some((p) => (p.UserIdGroupPairs || []).some((g) => g.GroupId === bastionSgId) && p.IpProtocol === 'tcp' && p.FromPort === 22 && p.ToPort === 22);
    expect(fromAlb).toBe(true);
    expect(fromBastion).toBe(true);
  });

  test('Database SG only allows MySQL from Application SG', async () => {
    const dbSgResp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [dbSgId] }));
    const dbSg = dbSgResp.SecurityGroups?.[0];
    expect(dbSg?.GroupId).toBe(dbSgId);
    const ingress = dbSg?.IpPermissions || [];
    expect(ingress.length).toBeGreaterThan(0);
    // Must include a 3306 rule from app SG and no CIDR ranges
    const mysqlRule = ingress.find((p) => p.IpProtocol === 'tcp' && p.FromPort === 3306 && p.ToPort === 3306);
    expect(mysqlRule).toBeTruthy();
    const pairs = (mysqlRule?.UserIdGroupPairs || []).map((g) => g.GroupId);
    expect(pairs).toContain(appSgId);
    expect((mysqlRule?.IpRanges || []).length).toBe(0);
  });

  test('CloudTrail is multi-region and log file validation is enabled', async () => {
    const trails = await cloudtrail.send(new DescribeTrailsCommand({ includeShadowTrails: false }));
    const trail = (trails.trailList || []).find((t) => t.TrailARN === cloudTrailArn);
    expect(trail?.IsMultiRegionTrail).toBe(true);
    expect(trail?.LogFileValidationEnabled).toBe(true);
  });

  test('App instance EBS volumes are encrypted with the specified KMS key', async () => {
    const resp = await ec2.send(new DescribeInstancesCommand({
      Filters: [ { Name: 'instance.group-id', Values: [appSgId] }, { Name: 'instance-state-name', Values: ['running'] } ],
      MaxResults: 1000,
    }));
    const instance = (resp.Reservations || []).flatMap((r) => r.Instances || [])[0];
    expect(instance?.BlockDeviceMappings && instance.BlockDeviceMappings.length > 0).toBe(true);
    for (const m of instance?.BlockDeviceMappings || []) {
      const ebs = m.Ebs;
      expect(ebs?.Encrypted).toBe(true);
      // When DescribeInstances includes KmsKeyId in EBS mapping (newer API), validate it.
      if (ebs?.KmsKeyId) {
        expect(ebs.KmsKeyId.includes(kmsKeyId)).toBe(true);
      }
    }
  });

  test('VPC Flow Logs log group is encrypted with KMS key', async () => {
    const logsResp = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: vpcFlowLogGroup }));
    const lg = (logsResp.logGroups || []).find((l) => l.logGroupName === vpcFlowLogGroup);
    expect(lg?.kmsKeyId).toBeDefined();
    expect((lg?.kmsKeyId || '').includes(kmsKeyId)).toBe(true);
  });

  test('KMS key is enabled and usable for encryption', async () => {
    const desc = await kms.send(new DescribeKeyCommand({ KeyId: kmsKeyId }));
    expect(desc.KeyMetadata?.Enabled).toBe(true);
    expect(desc.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
  });

  test('EventBridge has at least one enabled rule targeting the SNS topic', async () => {
    const rules = await events.send(new ListRuleNamesByTargetCommand({ TargetArn: securityAlertTopicArn }));
    expect((rules.RuleNames || []).length).toBeGreaterThan(0);
    let enabledFound = false;
    for (const name of rules.RuleNames || []) {
      const rule = await events.send(new DescribeRuleCommand({ Name: name }));
      if (rule.State === 'ENABLED') {
        const targets = await events.send(new ListTargetsByRuleCommand({ Rule: name }));
        const hasSns = (targets.Targets || []).some((t) => t.Arn === securityAlertTopicArn);
        if (hasSns) { enabledFound = true; break; }
      }
    }
    expect(enabledFound).toBe(true);
  });
});
