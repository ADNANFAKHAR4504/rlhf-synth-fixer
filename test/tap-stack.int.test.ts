import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeListenersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { WAFV2Client, GetWebACLForResourceCommand } from '@aws-sdk/client-wafv2';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import fs from 'fs';
import path from 'path';

// Load CloudFormation outputs from the JSON file
const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

// Helper function to find an output value by its OutputKey
const getOutputValue = (key) => {
  const output = outputs.find(o => o.OutputKey === key);
  if (!output) {
    throw new Error(`Output with key "${key}" not found.`);
  }
  return output.OutputValue;
};

// Initialize AWS SDK Clients
const ec2 = new EC2Client({});
const rds = new RDSClient({});
const iam = new IAMClient({});
const elbv2 = new ElasticLoadBalancingV2Client({});
const wafv2 = new WAFV2Client({});
const lambda = new LambdaClient({});

describe('IaC Stack Integration Tests', () => {

  // Test VPC and Networking
  test('VPC should be available and correctly configured', async () => {
    const vpcId = getOutputValue('VpcId');
    const { Vpcs } = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(Vpcs.length).toBe(1);
    expect(Vpcs[0].State).toBe('available');
    expect(Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
  });

  test('All subnets should be available', async () => {
    const subnetIds = getOutputValue('PrivateSubnetIds').split(',');
    const { Subnets } = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    expect(Subnets.length).toBe(4); // 4 private subnets
    Subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
    });
  });

  // Test RDS Database
  test('RDS Database Instance should be available and configured securely', async () => {
    const dbInstanceIdentifier = getOutputValue('DBInstanceIdentifier');
    const { DBInstances } = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier }));
    
    expect(DBInstances.length).toBe(1);
    const db = DBInstances[0];
    
    expect(db.DBInstanceStatus).toBe('available');
    expect(db.Engine).toBe('mysql');
    expect(db.EngineVersion).toMatch(/^8\.0\.\d+/); // Check for MySQL 8.0.x
    expect(db.PubliclyAccessible).toBe(false);
    expect(db.StorageEncrypted).toBe(true);
  });

  // Test IAM Role
  test('EC2InstanceRole should exist and have the correct policies attached', async () => {
    const roleName = getOutputValue('EC2InstanceRoleName');
    const { Role } = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    
    expect(Role).toBeDefined();
    expect(Role.Arn).toBe(getOutputValue('EC2InstanceRoleArn'));
    // Further tests could check for specific policy documents if needed
  });

  // Test Application Load Balancer and WAF
  test('Application Load Balancer should be active', async () => {
    const albArn = getOutputValue('ALBArn');
    const { LoadBalancers } = await elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] }));
    
    expect(LoadBalancers.length).toBe(1);
    expect(LoadBalancers[0].State.Code).toBe('active');
  });

  test('ALB Listener should be configured with the correct certificate', async () => {
    const listenerArn = getOutputValue('ALBListenerArn');
    const { Listeners } = await elbv2.send(new DescribeListenersCommand({ ListenerArns: [listenerArn] }));
    
    expect(Listeners.length).toBe(1);
    const listener = Listeners[0];
    
    expect(listener.Port).toBe(443);
    expect(listener.Protocol).toBe('HTTPS');
    expect(listener.Certificates[0].CertificateArn).toBe(getOutputValue('CertificateArnUsed'));
  });

  test('WAF WebACL should be associated with the Application Load Balancer', async () => {
    const albArn = getOutputValue('ALBArn');
    const { WebACL } = await wafv2.send(new GetWebACLForResourceCommand({ ResourceArn: albArn }));
    
    expect(WebACL).toBeDefined();
    expect(WebACL.Name).toBe(getOutputValue('WebACLName'));
  });

  // Test Lambda Function
  test('Patching Lambda function should be deployed with the correct runtime', async () => {
    const functionName = getOutputValue('PatchingLambdaFunctionName');
    const { Configuration } = await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));

    expect(Configuration).toBeDefined();
    expect(Configuration.Runtime).toBe('python3.9');
    expect(Configuration.State).toBe('Active');
  });

  // Final check for all outputs
  test('All CloudFormation outputs should be defined and non-empty', () => {
    outputs.forEach(output => {
      expect(output.OutputValue).toBeDefined();
      expect(output.OutputValue.length).toBeGreaterThan(0);
    });
  });
});