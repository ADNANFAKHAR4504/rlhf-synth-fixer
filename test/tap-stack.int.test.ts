// test/integration.test.ts
import * as AWS from 'aws-sdk';
import { SecureVpcStack } from '../lib/secure-vpc-stack';
import * as cdk from 'aws-cdk-lib';

describe('Integration Tests', () => {
  let ec2: AWS.EC2;
  let cloudWatch: AWS.CloudWatch;
  let stackName: string;

  beforeAll(async () => {
    AWS.config.update({ region: 'us-west-2' });
    ec2 = new AWS.EC2();
    cloudWatch = new AWS.CloudWatch();
    stackName = 'SecureVpcStack';
  });

  test('VPC and subnets are accessible', async () => {
    const vpcs = await ec2.describeVpcs({
      Filters: [
        {
          Name: 'tag:Project',
          Values: ['SecureVPC'],
        },
      ],
    }).promise();

    expect(vpcs.Vpcs?.length).toBeGreaterThan(0);
    
    const vpc = vpcs.Vpcs![0];
    expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc.State).toBe('available');
  });

  test('EC2 instances are running', async () => {
    const instances = await ec2.describeInstances({
      Filters: [
        {
          Name: 'tag:Project',
          Values: ['SecureVPC'],
        },
        {
          Name: 'instance-state-name',
          Values: ['running'],
        },
      ],
    }).promise();

    expect(instances.Reservations?.length).toBeGreaterThan(0);
  });

  test('CloudWatch alarms are active', async () => {
    const alarms = await cloudWatch.describeAlarms({
      AlarmNamePrefix: 'SecureVpcStack-CPUAlarm',
    }).promise();

    expect(alarms.MetricAlarms?.length).toBeGreaterThan(0);
    
    alarms.MetricAlarms?.forEach(alarm => {
      expect(alarm.StateValue).toBeDefined();
      expect(alarm.Threshold).toBe(70);
    });
  });

  test('Security groups have correct rules', async () => {
    const securityGroups = await ec2.describeSecurityGroups({
      Filters: [
        {
          Name: 'tag:Project',
          Values: ['SecureVPC'],
        },
      ],
    }).promise();

    expect(securityGroups.SecurityGroups?.length).toBeGreaterThan(0);
    
    const sg = securityGroups.SecurityGroups![0];
    const sshRule = sg.IpPermissions?.find(rule => rule.FromPort === 22);
    expect(sshRule).toBeDefined();
    expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('203.0.113.0/24');
  });
});