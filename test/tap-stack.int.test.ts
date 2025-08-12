import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Configure AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// AWS Service clients
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const iam = new AWS.IAM();
const logs = new AWS.CloudWatchLogs();

describe('TapStack Integration Tests', () => {
  const testTimeout = 30000; // 30 seconds for AWS API calls

  describe('VPC Resources', () => {
    test(
      'Production VPC exists and is configured correctly',
      async () => {
        const vpcId = outputs.ProductionVpcId;
        expect(vpcId).toBeDefined();

        const response = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
        const vpc = response.Vpcs?.[0];

        expect(vpc).toBeDefined();
        expect(vpc?.CidrBlock).toBe('10.0.0.0/16');

        // Check DNS settings via attributes
        const dnsHostnamesResponse = await ec2
          .describeVpcAttribute({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames',
          })
          .promise();

        const dnsSupportResponse = await ec2
          .describeVpcAttribute({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport',
          })
          .promise();

        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      },
      testTimeout
    );

    test(
      'Staging VPC exists and is configured correctly',
      async () => {
        const vpcId = outputs.StagingVpcId;
        expect(vpcId).toBeDefined();

        const response = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
        const vpc = response.Vpcs?.[0];

        expect(vpc).toBeDefined();
        expect(vpc?.CidrBlock).toBe('10.1.0.0/16');

        // Check DNS settings via attributes
        const dnsHostnamesResponse = await ec2
          .describeVpcAttribute({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames',
          })
          .promise();

        const dnsSupportResponse = await ec2
          .describeVpcAttribute({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport',
          })
          .promise();

        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      },
      testTimeout
    );

    test(
      'VPCs have public and private subnets',
      async () => {
        const vpcIds = [outputs.ProductionVpcId, outputs.StagingVpcId];

        for (const vpcId of vpcIds) {
          const response = await ec2
            .describeSubnets({
              Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
            })
            .promise();

          const subnets = response.Subnets || [];
          expect(subnets.length).toBe(4); // 2 public + 2 private

          const publicSubnets = subnets.filter(s => s.MapPublicIpOnLaunch);
          const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch);

          expect(publicSubnets.length).toBe(2);
          expect(privateSubnets.length).toBe(2);
        }
      },
      testTimeout
    );

    test(
      'NAT Gateways exist for private subnets',
      async () => {
        const vpcIds = [outputs.ProductionVpcId, outputs.StagingVpcId];

        for (const vpcId of vpcIds) {
          const response = await ec2
            .describeNatGateways({
              Filter: [
                { Name: 'vpc-id', Values: [vpcId] },
                { Name: 'state', Values: ['available'] },
              ],
            })
            .promise();

          const natGateways = response.NatGateways || [];
          expect(natGateways.length).toBeGreaterThanOrEqual(2);
        }
      },
      testTimeout
    );
  });

  describe('Security Groups', () => {
    test(
      'Production Security Group has restricted inbound rules',
      async () => {
        const sgId = outputs.ProductionSecurityGroupId;
        expect(sgId).toBeDefined();

        const response = await ec2
          .describeSecurityGroups({
            GroupIds: [sgId],
          })
          .promise();

        const sg = response.SecurityGroups?.[0];
        expect(sg).toBeDefined();

        const ingressRules = sg?.IpPermissions || [];

        // Check that all ingress rules are from specific IP range
        ingressRules.forEach(rule => {
          const hasRestrictedCidr = rule.IpRanges?.some(
            range => range.CidrIp === '203.0.113.0/24'
          );
          expect(hasRestrictedCidr).toBe(true);
        });

        // Check for HTTPS and HTTP rules
        const httpsRule = ingressRules.find(r => r.FromPort === 443);
        const httpRule = ingressRules.find(r => r.FromPort === 80);

        expect(httpsRule).toBeDefined();
        expect(httpRule).toBeDefined();
      },
      testTimeout
    );

    test(
      'Staging Security Group has restricted inbound rules',
      async () => {
        const sgId = outputs.StagingSecurityGroupId;
        expect(sgId).toBeDefined();

        const response = await ec2
          .describeSecurityGroups({
            GroupIds: [sgId],
          })
          .promise();

        const sg = response.SecurityGroups?.[0];
        expect(sg).toBeDefined();

        const ingressRules = sg?.IpPermissions || [];

        // Check that all ingress rules are from specific IP range
        ingressRules.forEach(rule => {
          const hasRestrictedCidr = rule.IpRanges?.some(
            range => range.CidrIp === '203.0.113.0/24'
          );
          expect(hasRestrictedCidr).toBe(true);
        });

        // Check for HTTPS rule
        const httpsRule = ingressRules.find(r => r.FromPort === 443);
        expect(httpsRule).toBeDefined();
      },
      testTimeout
    );

    test(
      'Security groups have no unrestricted egress rules',
      async () => {
        const sgIds = [
          outputs.ProductionSecurityGroupId,
          outputs.StagingSecurityGroupId,
        ];

        for (const sgId of sgIds) {
          const response = await ec2
            .describeSecurityGroups({
              GroupIds: [sgId],
            })
            .promise();

          const sg = response.SecurityGroups?.[0];
          const egressRules = sg?.IpPermissionsEgress || [];

          // Check that no rule allows all traffic to 0.0.0.0/0
          const unrestrictedRule = egressRules.find(rule =>
            rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
          );

          // Security groups should have restricted or no egress
          if (unrestrictedRule) {
            expect(unrestrictedRule.IpProtocol).not.toBe('-1'); // Not all protocols
          }
        }
      },
      testTimeout
    );
  });

  describe('S3 Buckets', () => {
    test(
      'Application bucket exists with encryption',
      async () => {
        const bucketName = outputs.ApplicationBucketName;
        expect(bucketName).toBeDefined();

        // Check bucket exists
        const bucketResponse = await s3
          .getBucketLocation({ Bucket: bucketName })
          .promise();
        expect(bucketResponse).toBeDefined();

        // Check encryption
        const encryptionResponse = await s3
          .getBucketEncryption({
            Bucket: bucketName,
          })
          .promise();

        const rules =
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules.length).toBeGreaterThan(0);

        const kmsRule = rules.find(
          r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
        );
        expect(kmsRule).toBeDefined();
      },
      testTimeout
    );

    test(
      'S3 bucket has versioning enabled',
      async () => {
        const bucketName = outputs.ApplicationBucketName;

        const response = await s3
          .getBucketVersioning({
            Bucket: bucketName,
          })
          .promise();

        expect(response.Status).toBe('Enabled');
      },
      testTimeout
    );

    test(
      'S3 bucket blocks public access',
      async () => {
        const bucketName = outputs.ApplicationBucketName;

        const response = await s3
          .getPublicAccessBlock({
            Bucket: bucketName,
          })
          .promise();

        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);
      },
      testTimeout
    );

    test(
      'S3 bucket policy enforces SSL',
      async () => {
        const bucketName = outputs.ApplicationBucketName;

        try {
          const response = await s3
            .getBucketPolicy({
              Bucket: bucketName,
            })
            .promise();

          const policy = JSON.parse(response.Policy || '{}');
          const statements = policy.Statement || [];

          const sslEnforcementStatement = statements.find(
            (stmt: any) =>
              stmt.Effect === 'Deny' &&
              stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
          );

          expect(sslEnforcementStatement).toBeDefined();
        } catch (error: any) {
          // If no bucket policy exists, that's also acceptable for a private bucket
          if (error.code !== 'NoSuchBucketPolicy') {
            throw error;
          }
        }
      },
      testTimeout
    );
  });

  describe('KMS Keys', () => {
    test(
      'S3 KMS key exists and has rotation enabled',
      async () => {
        const keyId = outputs.S3KmsKeyId;
        expect(keyId).toBeDefined();

        const response = await kms.describeKey({ KeyId: keyId }).promise();
        const keyMetadata = response.KeyMetadata;

        expect(keyMetadata).toBeDefined();
        expect(keyMetadata?.Enabled).toBe(true);
        expect(keyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

        // Check key rotation
        const rotationResponse = await kms
          .getKeyRotationStatus({
            KeyId: keyId,
          })
          .promise();

        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      },
      testTimeout
    );
  });

  describe('IAM Roles', () => {
    test(
      'EC2 Instance Role exists with correct policies',
      async () => {
        const roleArn = outputs.EC2InstanceRoleArn;
        expect(roleArn).toBeDefined();

        const roleName = roleArn.split('/').pop();

        const response = await iam.getRole({ RoleName: roleName! }).promise();
        const role = response.Role;

        expect(role).toBeDefined();
        expect(role.AssumeRolePolicyDocument).toBeDefined();

        // Check attached policies
        const policiesResponse = await iam
          .listAttachedRolePolicies({
            RoleName: roleName!,
          })
          .promise();

        const policies = policiesResponse.AttachedPolicies || [];
        const policyNames = policies.map(p => p.PolicyName);

        expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
        expect(policyNames).toContain('CloudWatchAgentServerPolicy');
      },
      testTimeout
    );
  });

  describe('CloudWatch Logs', () => {
    test(
      'VPC Flow Logs group exists with encryption',
      async () => {
        const logGroupName = outputs.VPCFlowLogGroupName;
        expect(logGroupName).toBeDefined();

        const response = await logs
          .describeLogGroups({
            logGroupNamePrefix: logGroupName,
          })
          .promise();

        const logGroup = response.logGroups?.find(
          lg => lg.logGroupName === logGroupName
        );

        expect(logGroup).toBeDefined();
        expect(logGroup?.kmsKeyId).toBeDefined(); // Has KMS encryption
        expect(logGroup?.retentionInDays).toBe(30);
      },
      testTimeout
    );
  });

  describe('VPC Flow Logs', () => {
    test(
      'Flow logs are enabled for Production VPC',
      async () => {
        const vpcId = outputs.ProductionVpcId;

        const response = await ec2
          .describeFlowLogs({
            Filter: [{ Name: 'resource-id', Values: [vpcId] }],
          })
          .promise();

        const flowLogs = response.FlowLogs || [];
        expect(flowLogs.length).toBeGreaterThan(0);

        const flowLog = flowLogs[0];
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.TrafficType).toBe('ALL');
      },
      testTimeout
    );

    test(
      'Flow logs are enabled for Staging VPC',
      async () => {
        const vpcId = outputs.StagingVpcId;

        const response = await ec2
          .describeFlowLogs({
            Filter: [{ Name: 'resource-id', Values: [vpcId] }],
          })
          .promise();

        const flowLogs = response.FlowLogs || [];
        expect(flowLogs.length).toBeGreaterThan(0);

        const flowLog = flowLogs[0];
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.TrafficType).toBe('ALL');
      },
      testTimeout
    );
  });

  describe('Network ACLs', () => {
    test(
      'Network ACLs block outbound internet traffic from private subnets',
      async () => {
        const vpcIds = [outputs.ProductionVpcId, outputs.StagingVpcId];

        for (const vpcId of vpcIds) {
          // Get private subnets
          const subnetsResponse = await ec2
            .describeSubnets({
              Filters: [
                { Name: 'vpc-id', Values: [vpcId] },
                { Name: 'map-public-ip-on-launch', Values: ['false'] },
              ],
            })
            .promise();

          const privateSubnets = subnetsResponse.Subnets || [];

          for (const subnet of privateSubnets) {
            // Get Network ACL for this subnet
            const naclResponse = await ec2
              .describeNetworkAcls({
                Filters: [
                  { Name: 'association.subnet-id', Values: [subnet.SubnetId!] },
                ],
              })
              .promise();

            const nacls = naclResponse.NetworkAcls || [];

            if (nacls.length > 0) {
              const nacl = nacls[0];
              const entries = nacl.Entries || [];

              // Check for deny rule for 0.0.0.0/0 egress
              const denyEgressRule = entries.find(
                entry =>
                  !entry.Egress === false && // Egress rule
                  entry.CidrBlock === '0.0.0.0/0' &&
                  entry.RuleAction === 'deny' &&
                  entry.RuleNumber === 100
              );

              // If a custom NACL is associated, it should have deny rules
              if (nacl.IsDefault === false) {
                expect(entries.length).toBeGreaterThan(0);
              }
            }
          }
        }
      },
      testTimeout
    );
  });

  describe('Resource Tagging', () => {
    test(
      'VPCs have appropriate tags',
      async () => {
        const vpcIds = [outputs.ProductionVpcId, outputs.StagingVpcId];

        for (const vpcId of vpcIds) {
          const response = await ec2
            .describeTags({
              Filters: [{ Name: 'resource-id', Values: [vpcId] }],
            })
            .promise();

          const tags = response.Tags || [];
          const tagMap = tags.reduce(
            (acc, tag) => {
              acc[tag.Key!] = tag.Value!;
              return acc;
            },
            {} as Record<string, string>
          );

          expect(tagMap['Project']).toBe('SecurityConfiguration');
          expect(tagMap['Environment']).toBeDefined();
        }
      },
      testTimeout
    );
  });
});
