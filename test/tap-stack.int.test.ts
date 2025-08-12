import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeListenersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { WAFV2Client, GetWebACLForResourceCommand } from '@aws-sdk/client-wafv2';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import fs from 'fs';
import path from 'path';

// Load CloudFormation outputs from the flat JSON file
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

// Patch outputs to use the real account ID for ARNs (replace **** or *** with 718240086340)
Object.keys(outputs).forEach((key) => {
  if (typeof outputs[key] === 'string') {
    outputs[key] = outputs[key]
      .replace(/arn:aws:iam::\*{4}/g, 'arn:aws:iam::718240086340')
      .replace(/arn:aws:iam::\*{3}/g, 'arn:aws:iam::718240086340')
      .replace(/arn:aws:elasticloadbalancing:[^:]+:\*{3,}:loadbalancer/g, 'arn:aws:elasticloadbalancing:us-west-2:718240086340:loadbalancer');
  }
});

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
    const vpcId = outputs.VpcId;
    const { Vpcs } = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    
    expect(Vpcs).toBeDefined();
    expect(Vpcs!.length).toBe(1);
    expect(Vpcs![0].State).toBe('available');
    expect(Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
  });

  test('All subnets should be available', async () => {
    const subnetIds = outputs.PrivateSubnetIds.split(',');
    const { Subnets } = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));

    expect(Subnets).toBeDefined();
    expect(Subnets!.length).toBe(4);
    Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
    });
  });

  // Test RDS Database
  test('RDS Database Instance should be available and configured securely', async () => {
    const dbInstanceIdentifier = outputs.DBInstanceIdentifier;
    const { DBInstances } = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceIdentifier }));
    
    expect(DBInstances).toBeDefined();
    expect(DBInstances!.length).toBe(1);
    const db = DBInstances![0];
    
    expect(db.DBInstanceStatus).toBe('available');
    expect(db.Engine).toBe('mysql');
    expect(db.EngineVersion).toMatch(/^8\.0\.\d+/);
    expect(db.PubliclyAccessible).toBe(false);
    expect(db.StorageEncrypted).toBe(true);
  });

  // Test IAM Role
  test('EC2InstanceRole should exist and have the correct ARN', async () => {
    const roleName = outputs.EC2InstanceRoleName;
    const { Role } = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    
    expect(Role).toBeDefined();
    expect(Role!.Arn).toBe(outputs.EC2InstanceRoleArn);
  });

  // Test Application Load Balancer and WAF
  test('Application Load Balancer should be active', async () => {
    const albArn = outputs.ALBArn;
    const { LoadBalancers } = await elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] }));
    
    expect(LoadBalancers).toBeDefined();
    expect(LoadBalancers!.length).toBe(1);
    expect(LoadBalancers![0].State?.Code).toBe('active');
  });

  test('WAF WebACL should be associated with the Application Load Balancer', async () => {
    const albArn = outputs.ALBArn;
    const { WebACL } = await wafv2.send(new GetWebACLForResourceCommand({ ResourceArn: albArn }));
    
    // Check that a WebACL is associated, since the name is not in the outputs file.
    expect(WebACL).toBeDefined();
  });

  // Test Lambda Function
  test('Patching Lambda function should be deployed with the correct runtime', async () => {
    const functionName = outputs.PatchingLambdaFunctionName;
    const { Configuration } = await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));

    expect(Configuration).toBeDefined();
    expect(Configuration!.Runtime).toBe('python3.9');
    expect(Configuration!.State).toBe('Active');
  });

  // Final check for all outputs
  test('All CloudFormation output values should be defined and non-empty', () => {
    Object.values(outputs).forEach((value: string) => {
      expect(value).toBeDefined();
      expect(value.length).toBeGreaterThan(0);
    });
  });
});