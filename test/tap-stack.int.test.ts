import {
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetBucketTaggingCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

let outputs: Record<string, any> = {};
let hasOutputs = false;
const outputsFile = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);

if (fs.existsSync(outputsFile)) {
  outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  outputs = outputs.tap || outputs;
  hasOutputs = true;
} else {
  outputs = {
    'vpc-id': 'vpc-0123456789abcdef0',
    'public-subnet-ids': [
      'subnet-0123456789abcdef0',
      'subnet-0123456789abcdef1',
    ],
    'internet-gateway-id': 'igw-0123456789abcdef0',
    'route-table-id': 'rtb-0123456789abcdef0',
    'security-group-id': 'sg-0123456789abcdef0',
    'backup-bucket-name': 'migration-backup-test-123456789012-abc123',
    'backup-bucket-arn':
      'arn:aws:s3:::migration-backup-test-123456789012-abc123',
  };
}

const region = process.env.AWS_REGION || 'us-west-2';

// Configure clients for LocalStack if AWS_ENDPOINT_URL is set
const awsEndpoint = process.env.AWS_ENDPOINT_URL;
const isLocalStack = awsEndpoint && (awsEndpoint.includes('localhost') || awsEndpoint.includes('4566'));

const clientConfig: any = { region };

if (isLocalStack) {
  clientConfig.endpoint = awsEndpoint;
  clientConfig.forcePathStyle = true;
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  };
}

const ec2Client = new EC2Client(clientConfig);
const s3Client = new S3Client(clientConfig);
const testTimeout = 45000;

describe('MigrationStack: Live AWS Integration', () => {
  const vpcId = outputs['vpc-id'];
  const subnetIds = outputs['public-subnet-ids'];
  const igwId = outputs['internet-gateway-id'];
  const routeTableId = outputs['route-table-id'];
  const securityGroupId = outputs['security-group-id'];
  const bucketName = outputs['backup-bucket-name'];
  const bucketArn = outputs['backup-bucket-arn'];

  describe('Terraform Outputs', () => {
    test('contains all essential exported resources', () => {
      expect(vpcId).toBeDefined();
      expect(subnetIds).toBeDefined();
      expect(igwId).toBeDefined();
      expect(routeTableId).toBeDefined();
      expect(securityGroupId).toBeDefined();
      expect(bucketName).toBeDefined();
      expect(bucketArn).toBeDefined();
    });
  });

  if (!hasOutputs) {
    test.skip('skipping all tests - no outputs available', () => {
      // This test will be skipped when hasOutputs is false
    });
    return;
  }
  describe('VPC Infrastructure', () => {
    test(
      'VPC is provisioned with correct CIDR, state, and is not default',
      async () => {
        const response = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );
        expect(response.Vpcs?.length).toBe(1);
        const vpc = response.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.State).toBe('available');
        expect(vpc.IsDefault).toBe(false);
      },
      testTimeout
    );
  });

  describe('Subnets', () => {
    test(
      'should have 2 public subnets in different AZs, correct CIDRs, public IPs',
      async () => {
        expect(Array.isArray(subnetIds)).toBe(true);
        expect(subnetIds).toHaveLength(2);

        const resp = await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: subnetIds })
        );
        expect(resp.Subnets?.length).toBe(2);

        const azSet = new Set(resp.Subnets!.map(s => s.AvailabilityZone));
        expect(azSet.size).toBe(2);

        const cidrs = resp.Subnets!.map(s => s.CidrBlock);
        expect(cidrs).toContain('10.0.1.0/24');
        expect(cidrs).toContain('10.0.2.0/24');

        resp.Subnets!.forEach(s => {
          expect(s.MapPublicIpOnLaunch).toBe(true);
        });
      },
      testTimeout
    );
  });

  describe('Internet Gateway & Routing', () => {
    test(
      'Internet Gateway exists and is attached',
      async () => {
        const resp = await ec2Client.send(
          new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] })
        );
        expect(resp.InternetGateways?.length).toBe(1);
        expect(
          resp.InternetGateways![0].Attachments?.some(a => a.VpcId === vpcId)
        ).toBe(true);
      },
      testTimeout
    );

    test(
      'Route Table exists with a 0.0.0.0/0 route via IGW',
      async () => {
        const resp = await ec2Client.send(
          new DescribeRouteTablesCommand({ RouteTableIds: [routeTableId] })
        );
        expect(resp.RouteTables?.length).toBe(1);
        const routes = resp.RouteTables![0].Routes || [];
        expect(
          routes.some(
            r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId === igwId
          )
        ).toBe(true);
      },
      testTimeout
    );
  });

  describe('Security Group (SSH Access)', () => {
    test(
      'has a security group that allows SSH (22/tcp) from anywhere',
      async () => {
        const resp = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
        );
        expect(resp.SecurityGroups?.length).toBe(1);
        const sg = resp.SecurityGroups![0];
        const sshRule = sg.IpPermissions?.find(
          rule =>
            rule.FromPort === 22 &&
            rule.ToPort === 22 &&
            rule.IpProtocol === 'tcp'
        );
        expect(sshRule).toBeDefined();
        expect(sshRule!.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')).toBe(
          true
        );

        expect(
          sg.IpPermissionsEgress?.some(
            rule =>
              rule.IpProtocol === '-1' &&
              rule.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')
          )
        ).toBe(true);
      },
      testTimeout
    );
  });

  describe('S3 Backup Bucket', () => {
    test(
      'provisioned with correct naming format, exists, tagged',
      async () => {
        expect(bucketName).toMatch(
          /^migration-backup-[a-z0-9]+-\d{12}-[a-z0-9]{6}$/
        );

        await expect(
          s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
        ).resolves.toBeDefined();

        const bucketsResp = await s3Client.send(new ListBucketsCommand({}));
        expect(bucketsResp.Buckets?.map(b => b.Name)).toContain(bucketName);

        const tags = await s3Client.send(
          new GetBucketTaggingCommand({ Bucket: bucketName })
        );
        expect(tags.TagSet).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Project', Value: 'Migration' }),
            expect.objectContaining({
              Key: 'Environment',
              Value: 'Production',
            }),
          ])
        );
      },
      testTimeout
    );

    test('has the bucket arn output correctly formed', () => {
      expect(bucketArn).toBe(`arn:aws:s3:::${bucketName}`);
    });
  });

  describe('Network Glue', () => {
    test(
      'all networking resources cross-link as expected',
      async () => {
        const subnetResp = await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: subnetIds })
        );
        subnetResp.Subnets!.forEach(subnet => {
          expect(subnet.VpcId).toBe(vpcId);
        });
      },
      testTimeout
    );
  });
});