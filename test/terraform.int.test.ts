import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import dns from 'dns/promises';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));

AWS.config.update({ region: 'us-west-2' }); // Adjust or get dynamically if required

const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const secretsManager = new AWS.SecretsManager();
const iam = new AWS.IAM();
const autoscaling = new AWS.AutoScaling();
const elb = new AWS.ELBv2();

describe('TAP Stack Live Integration Tests', () => {

  it('VPC exists with correct CIDR', async () => {
    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcs.Vpcs?.length).toBe(1);
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway attached to VPC', async () => {
    const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    expect(igw.InternetGateways?.length).toBe(1);
    const attachment = igw.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe('available');
  });

  it('Public and Private subnets exist with expected CIDRs', async () => {
    const publicSubnets = await ec2.describeSubnets({ SubnetIds: JSON.parse(outputs.public_subnet_ids) }).promise();
    publicSubnets.Subnets?.forEach(s => {
      expect(JSON.parse(outputs.public_subnet_cidrs)).toContain(s.CidrBlock);
      expect(s.VpcId).toBe(outputs.vpc_id);
    });

    const privateSubnets = await ec2.describeSubnets({ SubnetIds: JSON.parse(outputs.private_subnet_ids) }).promise();
    privateSubnets.Subnets?.forEach(s => {
      expect(JSON.parse(outputs.private_subnet_cidrs)).toContain(s.CidrBlock);
      expect(s.VpcId).toBe(outputs.vpc_id);
    });
  });

  it('NAT Gateways exist with allocated Elastic IPs', async () => {
    const natGateways = await ec2.describeNatGateways({ NatGatewayIds: JSON.parse(outputs.nat_gateway_ids) }).promise();
    expect(natGateways.NatGateways?.length).toBe(JSON.parse(outputs.nat_gateway_ids).length);

    const natPublicIps = natGateways.NatGateways?.map(n => n.NatGatewayAddresses?.[0].PublicIp);
    const expectedIps = JSON.parse(outputs.nat_gateway_public_ips);
    expectedIps.forEach(ip => expect(natPublicIps).toContain(ip));
  });

  it('ALB Security Group allows HTTP(80) and HTTPS(443)', async () => {
    const sg = await ec2.describeSecurityGroups({ GroupIds: [outputs.alb_security_group_id] }).promise();
    const ports = sg.SecurityGroups?.[0].IpPermissions?.map(p => p.FromPort);
    expect(ports).toEqual(expect.arrayContaining([80, 443]));
  });

  it('EC2 Security Group allows SSH(22) and HTTP(80) from correct sources', async () => {
    const sg = await ec2.describeSecurityGroups({ GroupIds: [outputs.ec2_security_group_id] }).promise();
    const permissions = sg.SecurityGroups?.[0].IpPermissions || [];

    const ssh = permissions.find(p => p.FromPort === 22);
    expect(ssh).toBeDefined();
    expect(ssh.IpRanges?.some(r => r.CidrIp === '10.0.0.0/16')).toBe(true);

    const http = permissions.find(p => p.FromPort === 80);
    expect(http).toBeDefined();
    expect(http.UserIdGroupPairs?.some(sg => sg.GroupId === outputs.alb_security_group_id)).toBe(true);
  });

  it('RDS instance is available and properties match outputs', async () => {
    const instances = await rds.describeDBInstances({ DBInstanceIdentifier: outputs.rds_identifier }).promise();
    const instance = instances.DBInstances?.[0];
    expect(instance).toBeDefined();
    expect(instance.DBInstanceStatus).toBe('available');
    expect(instance.Endpoint?.Address).toBe(outputs.rds_address);
    expect(instance.Endpoint?.Port?.toString()).toBe(outputs.rds_port);
    expect(instance.DBName).toBe(outputs.rds_database_name);
    expect(instance.MultiAZ).toBe(true);
  });

  it('Able to connect to RDS with credentials from Secrets Manager', async () => {
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
  }, 20000);

  it('ALB DNS resolves and application URL returns HTTP 200', async () => {
    const addresses = await dns.resolve4(outputs.alb_dns_name);
    expect(addresses.length).toBeGreaterThan(0);

    const response = await fetch(outputs.application_url);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/Hello from tap/);
  }, 15000);

  it('EC2 IAM role and instance profile exist and valid', async () => {
    const role = await iam.getRole({ RoleName: outputs.ec2_iam_role_name }).promise();
    expect(role.Role?.RoleName).toBe(outputs.ec2_iam_role_name);
    expect(role.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');

    const profile = await iam.getInstanceProfile({ InstanceProfileName: outputs.ec2_instance_profile_name }).promise();
    expect(profile.InstanceProfile.Roles?.some(r => r.RoleName === outputs.ec2_iam_role_name)).toBe(true);
  });

  it('Auto Scaling Group exists with correct desired capacity and subnet', async () => {
    const asg = await autoscaling.describeAutoScalingGroups({ AutoScalingGroupNames: [outputs.autoscaling_group_name] }).promise();
    expect(asg.AutoScalingGroups?.length).toBe(1);
    const group = asg.AutoScalingGroups![0];
    expect(group.DesiredCapacity).toBe(2);
    expect(group.VPCZoneIdentifier).toContain(JSON.parse(outputs.private_subnet_ids)[0]);
    expect(group.TargetGroupARNs).toContain(outputs.target_group_arn);
  });

  it('ALB Target Group has healthy targets', async () => {
    const health = await elb.describeTargetHealth({ TargetGroupArn: outputs.target_group_arn }).promise();
    expect(health.TargetHealthDescriptions?.length).toBeGreaterThan(0);
    const healthy = health.TargetHealthDescriptions?.filter(t => t.TargetHealth?.State === 'healthy');
    expect(healthy?.length).toBeGreaterThan(0);
  });
});
