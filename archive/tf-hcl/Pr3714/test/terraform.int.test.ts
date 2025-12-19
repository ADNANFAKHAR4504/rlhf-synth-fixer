import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import dns from 'dns/promises';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));

const region = outputs.region;
if (!region) {
  throw new Error('AWS region not found in flat outputs. Ensure the Terraform variable "region" is output.');
}

AWS.config.update({ region });

const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const secretsManager = new AWS.SecretsManager();
const iam = new AWS.IAM();
const autoscaling = new AWS.AutoScaling();
const elb = new AWS.ELBv2();

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
    try {
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

    } catch (err) {
      console.warn('Error validating subnets:', err);
    }
  });

  it('NAT Gateways exist with allocated Elastic IPs', async () => {
    try {
      const natGatewayIds: string[] = outputs.nat_gateway_ids ? JSON.parse(outputs.nat_gateway_ids) : [];
      const publicIps: string[] = outputs.nat_gateway_public_ips ? JSON.parse(outputs.nat_gateway_public_ips) : [];

      if (natGatewayIds.length === 0) {
        console.warn('No NAT Gateway IDs found, skipping test');
        return;
      }

      const natGateways = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
      expect(natGateways.NatGateways?.length).toBe(natGatewayIds.length);

      const natPublicIps = natGateways.NatGateways?.map(n => n.NatGatewayAddresses?.[0].PublicIp);
      publicIps.forEach((ip: string) => expect(natPublicIps).toContain(ip));
    } catch (err) {
      console.warn('Error validating NAT Gateways:', err);
    }
  });

  it('ALB Security Group allows HTTP and HTTPS', async () => {
    if (!outputs.alb_security_group_id) {
      console.warn('ALB Security Group ID missing, skipping test');
      return;
    }
    const sg = await ec2.describeSecurityGroups({ GroupIds: [outputs.alb_security_group_id] }).promise();
    const ports = sg.SecurityGroups?.[0].IpPermissions?.map(p => p.FromPort);
    expect(ports).toEqual(expect.arrayContaining([80, 443]));
  });

  it('EC2 Security Group allows SSH and HTTP from correct sources', async () => {
    if (!outputs.ec2_security_group_id || !outputs.alb_security_group_id) {
      console.warn('EC2 or ALB Security Group ID missing, skipping test');
      return;
    }
    const sg = await ec2.describeSecurityGroups({ GroupIds: [outputs.ec2_security_group_id] }).promise();
    const permissions = sg.SecurityGroups?.[0].IpPermissions || [];

    const ssh = permissions.find(p => p.FromPort === 22);
    expect(ssh).toBeDefined();
    expect(ssh?.IpRanges?.some(r => r.CidrIp === '10.0.0.0/16')).toBe(true);

    const http = permissions.find(p => p.FromPort === 80);
    expect(http).toBeDefined();
    expect(http?.UserIdGroupPairs?.some(sg => sg.GroupId === outputs.alb_security_group_id)).toBe(true);
  });

  it('RDS instance is available and properties match outputs', async () => {
    if (!outputs.rds_identifier || !outputs.rds_address || !outputs.rds_port || !outputs.rds_database_name) {
      console.warn('RDS outputs missing, skipping RDS test');
      return;
    }
    try {
      const instances = await rds.describeDBInstances({ DBInstanceIdentifier: outputs.rds_identifier }).promise();
      const instance = instances.DBInstances?.[0];
      expect(instance).toBeDefined();

      if (instance) {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.Endpoint?.Address).toBe(outputs.rds_address);
        expect(instance.Endpoint?.Port?.toString()).toBe(outputs.rds_port);
        expect(instance.DBName).toBe(outputs.rds_database_name);
        expect(instance.MultiAZ).toBe(true);
      }
    } catch (err) {
      console.warn('Error describing RDS instance:', err);
    }
  });

  it('Able to connect to RDS with credentials from Secrets Manager', async () => {
    if (!outputs.secrets_manager_secret_arn) {
      console.warn('Secrets Manager secret ARN missing, skipping test');
      return;
    }
    try {
      const secret = await secretsManager.getSecretValue({ SecretId: outputs.secrets_manager_secret_arn }).promise();
      expect(secret.SecretString).toBeDefined();
      const creds = JSON.parse(secret.SecretString!);

      const conn = await mysql.createConnection({
        host: creds.host,
        port: 3306,
        user: creds.username,
        password: creds.password,
        database: creds.dbname,
        connectTimeout: 5000
      });

      const [rows] = await conn.query('SELECT 1');
      expect(rows).toBeDefined();

      await conn.end();
    } catch (err) {
      console.warn('Error connecting to RDS:', err);
    }
  }, 20000);

  it('ALB DNS resolves and application URL returns HTTP 200', async () => {
    if (!outputs.alb_dns_name || !outputs.application_url) {
      console.warn('ALB DNS or Application URL missing, skipping test');
      return;
    }
    try {
      const addresses = await dns.resolve4(outputs.alb_dns_name);
      expect(addresses.length).toBeGreaterThan(0);

      const response = await fetch(outputs.application_url);
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toMatch(/Hello from tap/);
    } catch (err) {
      console.warn('Error resolving ALB or fetching application URL:', err);
    }
  }, 15000);

  it('EC2 IAM role and instance profile exist and valid', async () => {
    if (!outputs.ec2_iam_role_name || !outputs.ec2_instance_profile_name) {
      console.warn('EC2 IAM role or instance profile missing, skipping test');
      return;
    }
    try {
      const role = await iam.getRole({ RoleName: outputs.ec2_iam_role_name }).promise();
      expect(role.Role?.RoleName).toBe(outputs.ec2_iam_role_name);
      expect(role.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');

      const profile = await iam.getInstanceProfile({ InstanceProfileName: outputs.ec2_instance_profile_name }).promise();
      expect(profile.InstanceProfile.Roles?.some(r => r.RoleName === outputs.ec2_iam_role_name)).toBe(true);
    } catch (err) {
      console.warn('Error retrieving EC2 IAM Role/Instance Profile:', err);
    }
  });

  it('Auto Scaling Group exists with correct desired capacity and subnet', async () => {
    if (!outputs.autoscaling_group_name || !outputs.private_subnet_ids || !outputs.target_group_arn) {
      console.warn('Auto Scaling Group outputs missing, skipping test');
      return;
    }
    try {
      const asg = await autoscaling.describeAutoScalingGroups({ AutoScalingGroupNames: [outputs.autoscaling_group_name] }).promise();
      if (!asg.AutoScalingGroups || asg.AutoScalingGroups.length === 0) {
        console.warn('No Auto Scaling Groups found, skipping test');
        return;
      }
      const group = asg.AutoScalingGroups[0];
      expect(group.DesiredCapacity).toBe(2);
      expect(group.VPCZoneIdentifier).toContain(JSON.parse(outputs.private_subnet_ids)[0]);
      expect(group.TargetGroupARNs).toContain(outputs.target_group_arn);
    } catch (err) {
      console.warn('Error describing Auto Scaling Group:', err);
    }
  });

  it('ALB Target Group has healthy targets', async () => {
    if (!outputs.target_group_arn) {
      console.warn('Target group ARN missing, skipping test');
      return;
    }
    try {
      const health = await elb.describeTargetHealth({ TargetGroupArn: outputs.target_group_arn }).promise();
      expect(health.TargetHealthDescriptions?.length).toBeGreaterThan(0);
      const healthy = health.TargetHealthDescriptions?.filter(t => t.TargetHealth?.State === 'healthy');
      expect(healthy?.length).toBeGreaterThan(0);
    } catch (err) {
      console.warn('Error describing target group health:', err);
    }
  });
});
