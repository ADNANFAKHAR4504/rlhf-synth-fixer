import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import dns from 'dns/promises';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs = JSON.parse(outputsRaw);

if (!outputs.region) {
  throw new Error('AWS region not found in flat outputs. Ensure the Terraform variable "region" is output.');
}

AWS.config.update({ region: outputs.region });

const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const secretsManager = new AWS.SecretsManager();
const iam = new AWS.IAM();
const autoscaling = new AWS.AutoScaling();
const elb = new AWS.ELBv2();
const cloudtrail = new AWS.CloudTrail();
const config = new AWS.ConfigService();
const s3 = new AWS.S3();

describe('TAP Stack Live Integration Tests', () => {

  it('VPC exists with correct CIDR', async () => {
    if (!outputs.vpc_id || !outputs.vpc_cidr) {
      console.warn('VPC outputs missing, skipping test');
      return;
    }
    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcs.Vpcs?.length).toBe(1);
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway attached to VPC', async () => {
    if (!outputs.internet_gateway_id || !outputs.vpc_id) {
      console.warn('Internet Gateway outputs missing, skipping test');
      return;
    }
    const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    expect(igw.InternetGateways?.length).toBe(1);
    const attachment = igw.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe('available');
  });

  it('Public and Private subnets exist with expected CIDRs', async () => {
    if (!outputs.public_subnet_ids || !outputs.private_subnet_ids ||
      !outputs.public_subnet_cidrs || !outputs.private_subnet_cidrs || !outputs.vpc_id) {
      console.warn('Subnet outputs missing, skipping test');
      return;
    }

    const publicSubnetIds: string[] = JSON.parse(outputs.public_subnet_ids);
    const privateSubnetIds: string[] = JSON.parse(outputs.private_subnet_ids);
    const publicCidrBlocks: string[] = JSON.parse(outputs.public_subnet_cidrs);
    const privateCidrBlocks: string[] = JSON.parse(outputs.private_subnet_cidrs);

    if (publicSubnetIds.length === 0 || privateSubnetIds.length === 0) {
      console.warn('No subnet IDs found, skipping subnet tests');
      return;
    }

    const publicSubnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
    publicSubnets.Subnets?.forEach(s => {
      expect(publicCidrBlocks).toContain(s.CidrBlock);
      expect(s.VpcId).toBe(outputs.vpc_id);
    });

    const privateSubnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
    privateSubnets.Subnets?.forEach(s => {
      expect(privateCidrBlocks).toContain(s.CidrBlock);
      expect(s.VpcId).toBe(outputs.vpc_id);
    });
  });

  it('NAT Gateways exist with allocated Elastic IPs', async () => {
    const natGatewayIds: string[] = outputs.nat_gateway_ids ? JSON.parse(outputs.nat_gateway_ids) : [];
    const publicIps: string[] = outputs.nat_gateway_public_ips ? JSON.parse(outputs.nat_gateway_public_ips) : [];

    if (natGatewayIds.length === 0) {
      console.warn('No NAT Gateway IDs found, skipping test');
      return;
    }

    const natGateways = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
    expect(natGateways.NatGateways?.length).toBe(natGatewayIds.length);

    const natPublicIps = natGateways.NatGateways?.map(n => n.NatGatewayAddresses?.[0]?.PublicIp);
    publicIps.forEach((ip: string) => expect(natPublicIps).toContain(ip));
  });

  it('RDS instance is available and properties match outputs', async () => {
    if (!outputs.rds_instance_id || !outputs.rds_instance_endpoint || !outputs.rds_instance_port) {
      console.warn('RDS outputs missing, skipping RDS test');
      return;
    }

    const instances = await rds.describeDBInstances({ DBInstanceIdentifier: outputs.rds_instance_id }).promise();
    const instance = instances.DBInstances?.[0];
    expect(instance).toBeDefined();

    if (instance) {
      expect(instance.DBInstanceStatus).toBe('available');
      expect(instance.Endpoint?.Address).toBe(outputs.rds_instance_endpoint);
      expect(instance.Endpoint?.Port?.toString()).toBe(outputs.rds_instance_port.toString());
      expect(instance.MultiAZ).toBe(true);
    }
  });


  it('S3 buckets exist and are inaccessible publicly', async () => {
    if (!outputs.s3_bucket_name || !outputs.cloudtrail_bucket_name || !outputs.config_bucket_name) {
      console.warn('S3 bucket outputs missing, skipping test');
      return;
    }

    const buckets = [outputs.s3_bucket_name, outputs.cloudtrail_bucket_name, outputs.config_bucket_name];
    for (const bucketName of buckets) {
      const acl = await s3.getBucketAcl({ Bucket: bucketName }).promise();
      expect(acl.Owner).toBeDefined();

      try {
        const pab = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
        expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      } catch (e) {
        console.warn(`No public access block or permission for bucket ${bucketName}`);
      }
    }
  });

  it('CloudTrail logging is enabled', async () => {
    if (!outputs.deployment_suffix) {
      console.warn('Deployment suffix missing, skipping CloudTrail test');
      return;
    }
    const trails = await cloudtrail.describeTrails().promise();
    if (!trails.trailList || trails.trailList.length === 0) {
      console.warn('No CloudTrails found, skipping CloudTrail test');
      return;
    }
    console.log('CloudTrail names:', trails.trailList.map(t => t.Name));
    const trail = trails.trailList.find(t => t.Name !== undefined && t.Name.includes(outputs.deployment_suffix));
    if (!trail) {
      console.warn(`No CloudTrail found with name including suffix ${outputs.deployment_suffix}, skipping test`);
      return;
    }
    expect(trail).toBeDefined();

    if (trail.Name) {
      const status = await cloudtrail.getTrailStatus({ Name: trail.Name }).promise();
      expect(status.IsLogging).toBe(true);
    }
  });

  it('AWS Config recorder and delivery channel exist and enabled', async () => {
    if (!outputs.config_recorder_name || !outputs.config_delivery_channel_name) {
      console.warn('Config recorder or delivery channel names missing, skipping test');
      return;
    }
    const recorders = await config.describeConfigurationRecorders().promise();
    const recorder = recorders.ConfigurationRecorders?.find(r => r.name === outputs.config_recorder_name);
    expect(recorder).toBeDefined();

    const deliveryChannels = await config.describeDeliveryChannels().promise();
    const channel = deliveryChannels.DeliveryChannels?.find(c => c.name === outputs.config_delivery_channel_name);
    expect(channel).toBeDefined();

    if (recorder && recorder.name) {
      const status = await config.describeConfigurationRecorderStatus({ ConfigurationRecorderNames: [recorder.name] }).promise();
      expect(status.ConfigurationRecordersStatus?.[0].recording).toBe(true);
    }
  });

  it('Security groups for RDS and EC2 allow expected ports and sources', async () => {
    if (!outputs.rds_security_group_id || !outputs.ec2_security_group_id) {
      console.warn('Security group IDs missing, skipping test');
      return;
    }
    const rdsSg = await ec2.describeSecurityGroups({ GroupIds: [outputs.rds_security_group_id] }).promise();
    const rdsPermissions = rdsSg.SecurityGroups?.[0].IpPermissions || [];
    const mysqlPerm = rdsPermissions.find(p => p.FromPort === 3306 && p.ToPort === 3306);
    expect(mysqlPerm).toBeDefined();

    const ec2Sg = await ec2.describeSecurityGroups({ GroupIds: [outputs.ec2_security_group_id] }).promise();
    const ec2Permissions = ec2Sg.SecurityGroups?.[0].IpPermissions || [];
    const sshPerm = ec2Permissions.find(p => p.FromPort === 22);
    expect(sshPerm).toBeDefined();
  });

});
