import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));

if (!outputs.region) {
  throw new Error('AWS region not found in outputs. Cannot proceed with tests.');
}

AWS.config.update({ region: outputs.region });

const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const s3 = new AWS.S3();
const cloudtrail = new AWS.CloudTrail();
const config = new AWS.ConfigService();
const secretsManager = new AWS.SecretsManager();
const iam = new AWS.IAM();

describe('Comprehensive TAP Stack Live Integration Tests', () => {

  // VPC Tests
  test('VPC exists with correct CIDR and DNS support enabled', async () => {
    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    const vpc = vpcs.Vpcs?.[0];
    expect(vpc).toBeDefined();
    expect(vpc?.CidrBlock).toBe(outputs.vpc_cidr);
    expect(vpc?.DhcpOptionsId).toBeDefined();
  });

  // Internet Gateway Tests
  test('Internet Gateway is attached to the correct VPC', async () => {
    const igwRes = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    const igw = igwRes.InternetGateways?.[0];
    expect(igw).toBeDefined();
    const attachment = igw.Attachments?.find(att => att.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe('available');
  });

  // Subnets Tests
  test('Public and private subnets exist and reside in the VPC', async () => {
    const publicSubnetIds: string[] = JSON.parse(outputs.public_subnet_ids);
    const privateSubnetIds: string[] = JSON.parse(outputs.private_subnet_ids);

    const publicSubnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
    publicSubnets.Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(outputs.vpc_id);
    });

    const privateSubnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
    privateSubnets.Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(outputs.vpc_id);
    });
  });

  // Route Tables Tests
  test('Public route table routes 0.0.0.0/0 to Internet Gateway', async () => {
    const rtRes = await ec2.describeRouteTables({ RouteTableIds: [outputs.public_route_table_id] }).promise();
    const rt = rtRes.RouteTables?.[0];
    expect(rt).toBeDefined();
    const route = rt.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
    expect(route).toBeDefined();
    expect(route?.GatewayId).toBe(outputs.internet_gateway_id);
  });

  test('Private route tables route 0.0.0.0/0 to NAT Gateways', async () => {
    const privateRtIds: string[] = JSON.parse(outputs.private_route_table_ids);
    const natIds: string[] = JSON.parse(outputs.nat_gateway_ids);

    for (const rtId of privateRtIds) {
      const rtRes = await ec2.describeRouteTables({ RouteTableIds: [rtId] }).promise();
      const rt = rtRes.RouteTables?.[0];
      expect(rt).toBeDefined();
      const natRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0' && r.NatGatewayId !== undefined);
      expect(natRoute).toBeDefined();
      expect(natIds).toContain(natRoute?.NatGatewayId);
    }
  });

  // NAT Gateways Tests
  test('NAT Gateways exist and have elastic IPs assigned', async () => {
    const natIds: string[] = JSON.parse(outputs.nat_gateway_ids);
    const elasticIps: string[] = JSON.parse(outputs.elastic_ip_addresses);

    const natRes = await ec2.describeNatGateways({ NatGatewayIds: natIds }).promise();
    natRes.NatGateways?.forEach(nat => {
      expect(nat.NatGatewayAddresses?.length).toBeGreaterThan(0);
      const pubIp = nat.NatGatewayAddresses?.[0].PublicIp || '';
      expect(elasticIps).toContain(pubIp);
    });
  });

  // Security Groups Tests
  test('Web security group allows HTTP and HTTPS from VPC CIDR', async () => {
    const sgRes = await ec2.describeSecurityGroups({ GroupIds: [outputs.web_security_group_id] }).promise();
    const sg = sgRes.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    const httpRule = sg.IpPermissions?.find(p => p.FromPort === 80 && p.ToPort === 80);
    const httpsRule = sg.IpPermissions?.find(p => p.FromPort === 443 && p.ToPort === 443);
    expect(httpRule).toBeDefined();
    expect(httpsRule).toBeDefined();
  });

  test('RDS security group allows MySQL traffic from web security group', async () => {
    const sgRes = await ec2.describeSecurityGroups({ GroupIds: [outputs.rds_security_group_id] }).promise();
    const sg = sgRes.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    const mysqlRule = sg.IpPermissions?.find(p => p.FromPort === 3306 && p.ToPort === 3306);
    expect(mysqlRule).toBeDefined();
    expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.web_security_group_id)).toBe(true);
  });

  // EC2 Instance Tests
  test('EC2 instance is running in correct subnet and AZ', async () => {
    const instRes = await ec2.describeInstances({ InstanceIds: [outputs.ec2_instance_id] }).promise();
    const instance = instRes.Reservations?.[0].Instances?.[0];
    expect(instance).toBeDefined();
    expect(instance?.State?.Name).toBe('running');
    expect(instance?.SubnetId).toBe(JSON.parse(outputs.private_subnet_ids)[0]);
    expect(instance?.Placement?.AvailabilityZone).toBe(outputs.ec2_instance_availability_zone);
    expect(instance?.IamInstanceProfile?.Arn).toContain(outputs.ec2_iam_role_arn.split(':role/')[1].split('-')[0]);
  });

  // IAM Role Tests
  test('EC2 IAM role exists and attached to instance profile', async () => {
    const instanceProfile = await iam.getInstanceProfile({ InstanceProfileName: outputs.ec2_instance_profile_name }).promise();
    expect(instanceProfile.InstanceProfile?.Roles?.some(role => role.Arn === outputs.ec2_iam_role_arn)).toBe(true);
  });

  test('Config IAM role exists and has attached managed policy', async () => {
    const rolePolicies = await iam.listAttachedRolePolicies({ RoleName: outputs.config_iam_role_arn.split('/').pop()! }).promise();
    expect(rolePolicies.AttachedPolicies?.some(p => p.PolicyArn.includes('ConfigRole'))).toBe(true);
  });

  // S3 Bucket Tests
  test('S3 buckets exist and have public access blocked', async () => {
    const buckets = [outputs.s3_bucket_id, outputs.cloudtrail_s3_bucket_id, outputs.config_s3_bucket_id];
    for (const bucketName of buckets) {
      const acl = await s3.getBucketAcl({ Bucket: bucketName }).promise();
      expect(acl.Owner).toBeDefined();

      const pab = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }
  });

  // CloudTrail Tests
  test('CloudTrail exists and logging enabled', async () => {
    const trails = await cloudtrail.describeTrails().promise();
    const trail = trails.trailList?.find(t => t.Name === outputs.cloudtrail_name);
    expect(trail).toBeDefined();
    if (trail && trail.Name) {
      const status = await cloudtrail.getTrailStatus({ Name: trail.Name }).promise();
      expect(status.IsLogging).toBe(true);
    }
  });

  // AWS Config Tests
  test('AWS Config recorder and delivery channel exist and recording is enabled', async () => {
    const recorders = await config.describeConfigurationRecorders().promise();
    const recorder = recorders.ConfigurationRecorders?.find(r => r.name === outputs.config_recorder_name);
    expect(recorder).toBeDefined();

    const deliveryChannels = await config.describeDeliveryChannels().promise();
    const deliveryChannel = deliveryChannels.DeliveryChannels?.find(c => c.name === outputs.config_delivery_channel_name);
    expect(deliveryChannel).toBeDefined();

    if (recorder?.name) {
      const status = await config.describeConfigurationRecorderStatus({ ConfigurationRecorderNames: [recorder.name] }).promise();
      expect(status.ConfigurationRecordersStatus?.[0].recording).toBe(true);
    }
  });

  // RDS Database & Secrets Manager Tests
  test('RDS instance is available and credentials secret exists in Secrets Manager', async () => {
    const dbInstances = await rds.describeDBInstances({ DBInstanceIdentifier: outputs.rds_instance_id }).promise();
    const instance = dbInstances.DBInstances?.[0];
    expect(instance?.DBInstanceStatus).toBe('available');

    const secret = await secretsManager.describeSecret({ SecretId: outputs.rds_credentials_secret_arn }).promise();
    expect(secret.Name).toBe(outputs.rds_credentials_secret_name);
  });

  // VPC Peering
  test('VPC Peering connection exists and is active', async () => {
    const vpcPeering = await ec2.describeVpcPeeringConnections({ VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id] }).promise();
    const connection = vpcPeering.VpcPeeringConnections?.[0];
    expect(connection).toBeDefined();
    expect(connection.Status?.Code).toBe('active');
  });

});

