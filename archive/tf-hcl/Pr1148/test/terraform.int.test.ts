import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Integration tests require actual AWS deployment and cfn-outputs/flat-outputs.json
describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: any = {};
  let ec2: AWS.EC2;
  let cloudTrail: AWS.CloudTrail;
  let s3: AWS.S3;
  let secretsManager: AWS.SecretsManager;
  let logs: AWS.CloudWatchLogs;
  let iam: AWS.IAM;

  beforeAll(() => {
    // Load deployment outputs (generated during terraform apply)
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    }

    // Initialize AWS clients
    AWS.config.update({ region: 'us-west-2' });
    ec2 = new AWS.EC2();
    cloudTrail = new AWS.CloudTrail();
    s3 = new AWS.S3();
    secretsManager = new AWS.SecretsManager();
    logs = new AWS.CloudWatchLogs();
    iam = new AWS.IAM();
  });

  // Integration Test 1: VPC exists and is properly configured
  test('VPC exists with correct CIDR and DNS settings', async () => {
    if (!outputs.vpc_id) {
      console.warn('Skipping VPC test - no vpc_id in outputs');
      return;
    }

    const response = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    const vpc = response.Vpcs?.[0];
    
    expect(vpc).toBeDefined();
    expect(vpc?.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
    
    // Get VPC attributes separately
    const attributesResponse = await ec2.describeVpcAttribute({
      VpcId: outputs.vpc_id,
      Attribute: 'enableDnsHostnames'
    }).promise();
    expect(attributesResponse.EnableDnsHostnames?.Value).toBe(true);
    
    const supportResponse = await ec2.describeVpcAttribute({
      VpcId: outputs.vpc_id,
      Attribute: 'enableDnsSupport'
    }).promise();
    expect(supportResponse.EnableDnsSupport?.Value).toBe(true);
  });

  // Integration Test 2: Subnets are properly distributed across AZs
  test('Subnets exist in multiple availability zones', async () => {
    if (!outputs.vpc_id) {
      console.warn('Skipping subnet test - no vpc_id in outputs');
      return;
    }

    const response = await ec2.describeSubnets({
      Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_id] }]
    }).promise();
    
    const subnets = response.Subnets || [];
    expect(subnets.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private
    
    const azs = [...new Set(subnets.map(s => s.AvailabilityZone))];
    expect(azs.length).toBeGreaterThanOrEqual(2); // Multiple AZs
  });

  // Integration Test 3: Security Groups have restrictive ingress rules
  test('Security Groups implement restrictive access controls', async () => {
    if (!outputs.web_security_group_id && !outputs.security_group_id) {
      console.warn('Skipping security group test - no security group IDs in outputs');
      return;
    }

    const sgId = outputs.web_security_group_id || outputs.security_group_id;
    const response = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
    const sg = response.SecurityGroups?.[0];
    
    expect(sg).toBeDefined();
    
    // Check that no ingress rule allows all traffic from 0.0.0.0/0
    const dangerousRules = sg?.IpPermissions?.filter(rule => 
      rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
    );
    
    expect(dangerousRules?.length || 0).toBe(0);
  });

  // Integration Test 4: CloudTrail is properly configured
  test('CloudTrail is enabled and logging to S3', async () => {
    if (!outputs.cloudtrail_name && !outputs.trail_name) {
      console.warn('Skipping CloudTrail test - no trail name in outputs');
      return;
    }

    const trailName = outputs.cloudtrail_name || outputs.trail_name;
    const response = await cloudTrail.getTrail({ Name: trailName }).promise();
    const trail = response.Trail;
    
    expect(trail).toBeDefined();
    expect(trail?.IsMultiRegionTrail).toBe(true);
    expect(trail?.S3BucketName).toBeTruthy();
    expect(trail?.IncludeGlobalServiceEvents).toBe(true);
  });

  // Integration Test 5: VPC Flow Logs are enabled
  test('VPC Flow Logs are active and logging', async () => {
    if (!outputs.vpc_id) {
      console.warn('Skipping VPC Flow Logs test - no vpc_id in outputs');
      return;
    }

    const response = await ec2.describeFlowLogs({
      Filter: [{ Name: 'resource-id', Values: [outputs.vpc_id] }]
    }).promise();
    
    const flowLogs = response.FlowLogs || [];
    expect(flowLogs.length).toBeGreaterThan(0);
    expect(flowLogs[0].FlowLogStatus).toBe('ACTIVE');
  });

  // Integration Test 6: S3 buckets have encryption and versioning
  test('S3 buckets are properly secured with encryption and versioning', async () => {
    if (!outputs.s3_bucket_name && !outputs.log_bucket_name) {
      console.warn('Skipping S3 test - no bucket name in outputs');
      return;
    }

    const bucketName = outputs.s3_bucket_name || outputs.log_bucket_name;
    
    // Check encryption
    const encryptionResponse = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
    expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    
    // Check versioning
    const versioningResponse = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
    expect(versioningResponse.Status).toBe('Enabled');
  });

  // Integration Test 7: Secrets Manager secret exists and is encrypted
  test('AWS Secrets Manager secrets are properly configured', async () => {
    if (!outputs.secret_arn && !outputs.secret_name) {
      console.warn('Skipping Secrets Manager test - no secret identifier in outputs');
      return;
    }

    const secretId = outputs.secret_arn || outputs.secret_name;
    const response = await secretsManager.describeSecret({ SecretId: secretId }).promise();
    
    expect(response.Name).toBeTruthy();
    expect(response.KmsKeyId).toBeTruthy(); // Encrypted with KMS
  });

  // Integration Test 8: IAM roles exist with proper policies
  test('IAM roles are configured with appropriate policies', async () => {
    if (!outputs.ec2_role_name && !outputs.iam_role_name) {
      console.warn('Skipping IAM test - no role name in outputs');
      return;
    }

    const roleName = outputs.ec2_role_name || outputs.iam_role_name;
    const response = await iam.getRole({ RoleName: roleName }).promise();
    
    expect(response.Role).toBeDefined();
    expect(response.Role.AssumeRolePolicyDocument).toBeTruthy();
    
    // Check attached policies
    const policiesResponse = await iam.listAttachedRolePolicies({ RoleName: roleName }).promise();
    expect(policiesResponse.AttachedPolicies?.length).toBeGreaterThan(0);
  });

  // Integration Test 9: Internet Gateway attached to VPC
  test('Internet Gateway is properly attached to VPC', async () => {
    if (!outputs.vpc_id) {
      console.warn('Skipping IGW test - no vpc_id in outputs');
      return;
    }

    const response = await ec2.describeInternetGateways({
      Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpc_id] }]
    }).promise();
    
    const igws = response.InternetGateways || [];
    expect(igws.length).toBe(1);
    expect(igws[0].Attachments?.[0]?.State).toBe('available');
  });

  // Integration Test 10: NAT Gateways exist for private subnets
  test('NAT Gateways are configured for private subnet internet access', async () => {
    if (!outputs.vpc_id) {
      console.warn('Skipping NAT Gateway test - no vpc_id in outputs');
      return;
    }

    const response = await ec2.describeNatGateways({
      Filter: [{ Name: 'vpc-id', Values: [outputs.vpc_id] }]
    }).promise();
    
    const natGateways = response.NatGateways || [];
    expect(natGateways.length).toBeGreaterThan(0);
    expect(natGateways[0].State).toBe('available');
  });

  // Integration Test 11: Route tables properly configured
  test('Route tables are properly configured for public and private subnets', async () => {
    if (!outputs.vpc_id) {
      console.warn('Skipping route table test - no vpc_id in outputs');
      return;
    }

    const response = await ec2.describeRouteTables({
      Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_id] }]
    }).promise();
    
    const routeTables = response.RouteTables || [];
    expect(routeTables.length).toBeGreaterThanOrEqual(3); // 1 public + 2 private + main
    
    // Check for internet gateway routes
    const igwRoutes = routeTables.filter(rt => 
      rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
    );
    expect(igwRoutes.length).toBeGreaterThan(0);
  });

  // Integration Test 12: Network ACLs are configured
  test('Network ACLs provide subnet-level security', async () => {
    if (!outputs.vpc_id) {
      console.warn('Skipping NACL test - no vpc_id in outputs');
      return;
    }

    const response = await ec2.describeNetworkAcls({
      Filters: [{ Name: 'vpc-id', Values: [outputs.vpc_id] }]
    }).promise();
    
    const nacls = response.NetworkAcls || [];
    expect(nacls.length).toBeGreaterThan(1); // Default + custom NACLs
    
    // Check for custom rules (not just default)
    const customNacls = nacls.filter(nacl => !nacl.IsDefault);
    expect(customNacls.length).toBeGreaterThan(0);
  });

  // Integration Test 13: CloudWatch Log Groups exist for VPC Flow Logs
  test('CloudWatch Log Groups are configured for VPC Flow Logs', async () => {
    if (!outputs.log_group_name && !outputs.flow_log_group_name) {
      console.warn('Skipping CloudWatch test - no log group name in outputs');
      return;
    }

    const logGroupName = outputs.log_group_name || outputs.flow_log_group_name;
    const response = await logs.describeLogGroups({ 
      logGroupNamePrefix: logGroupName 
    }).promise();
    
    const logGroups = response.logGroups || [];
    expect(logGroups.length).toBeGreaterThan(0);
    expect(logGroups[0].logGroupName).toContain('flow-log');
  });

  // Integration Test 14: KMS keys exist for encryption
  test('KMS keys are configured for encryption services', async () => {
    if (!outputs.kms_key_id && !outputs.kms_key_arn) {
      console.warn('Skipping KMS test - no KMS key in outputs');
      return;
    }

    const kms = new AWS.KMS({ region: 'us-west-2' });
    const keyId = outputs.kms_key_id || outputs.kms_key_arn;
    
    const response = await kms.describeKey({ KeyId: keyId }).promise();
    expect(response.KeyMetadata).toBeDefined();
    expect(response.KeyMetadata?.KeyState).toBe('Enabled');
  });

  // Integration Test 15: All resources are properly tagged
  test('Infrastructure resources have required tags', async () => {
    if (!outputs.vpc_id) {
      console.warn('Skipping tag test - no vpc_id in outputs');
      return;
    }

    const response = await ec2.describeTags({
      Filters: [{ Name: 'resource-id', Values: [outputs.vpc_id] }]
    }).promise();
    
    const tags = response.Tags || [];
    const tagKeys = tags.map(tag => tag.Key);
    
    expect(tagKeys).toContain('Name');
    expect(tagKeys).toContain('Environment');
    expect(tagKeys).toContain('Owner');
    expect(tagKeys).toContain('ManagedBy');
  });

  // Integration Test 16: End-to-end connectivity test
  test('Network connectivity flows work as expected', async () => {
    if (!outputs.vpc_id) {
      console.warn('Skipping connectivity test - no vpc_id in outputs');
      return;
    }

    // Verify public subnets can reach internet via IGW
    const subnetsResponse = await ec2.describeSubnets({
      Filters: [
        { Name: 'vpc-id', Values: [outputs.vpc_id] },
        { Name: 'map-public-ip-on-launch', Values: ['true'] }
      ]
    }).promise();
    
    const publicSubnets = subnetsResponse.Subnets || [];
    expect(publicSubnets.length).toBeGreaterThan(0);
    
    // Verify route tables for public subnets have IGW routes
    for (const subnet of publicSubnets) {
      const rtResponse = await ec2.describeRouteTables({
        Filters: [{ Name: 'association.subnet-id', Values: [subnet.SubnetId!] }]
      }).promise();
      
      const routeTable = rtResponse.RouteTables?.[0];
      const hasIgwRoute = routeTable?.Routes?.some(route => 
        route.GatewayId?.startsWith('igw-') && route.DestinationCidrBlock === '0.0.0.0/0'
      );
      
      expect(hasIgwRoute).toBe(true);
    }
  });
});
