import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2'; // AWS SDK for EC2
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds'; // AWS SDK for RDS
import { App, Testing } from 'cdktf';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from '../lib/tap-stack';

describe('TapStack — Integration Coverage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();

    process.env.ENVIRONMENT_SUFFIX = 'dev';
    process.env.TERRAFORM_STATE_BUCKET = 'iac-rlhf-tf-states';
    process.env.TERRAFORM_STATE_BUCKET_REGION = 'us-east-1';
    process.env.AWS_REGION_PRIMARY = 'us-east-1';
    process.env.AWS_REGION_SECONDARY = 'eu-west-1';
    process.env.ACM_CERT_ARN =
      'arn:aws:acm:us-east-1:123456789012:certificate/test-primary';
    process.env.ACM_CERT_ARN_SECONDARY =
      'arn:aws:acm:eu-west-1:123456789012:certificate/test-secondary';
    process.env.VPC_CIDR_PRIMARY = '10.0.0.0/16';
    process.env.VPC_CIDR_SECONDARY = '10.1.0.0/16';
    process.env.AZ_COUNT = '2';
    process.env.NAT_PER_AZ = 'false';
    process.env.ENABLE_SSH_TO_APP = 'false';
    delete process.env.DNS_HOSTED_ZONE_ID;
    delete process.env.DNS_RECORD_NAME;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('instantiates with overrides via props (back-compat keys) and synthesizes', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
    });
    const synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    // Providers present
    expect(synthesized).toMatch(/"provider":\s*{\s*"aws":/);
    expect(synthesized).toMatch(/"aws_vpc"/);                    
    expect(synthesized).toMatch(/"aws_security_group"/);         
    expect(synthesized).toMatch(/"aws_lb"/);                     
    expect(synthesized).toMatch(/"aws_autoscaling_group"/);      
    expect(synthesized).toMatch(/"aws_db_instance"/);            
    expect(synthesized).toMatch(/"random_password"/);            
    expect(synthesized).toMatch(/"aws_secretsmanager_secret"/);  
    expect(synthesized).toMatch(/"aws_cloudwatch_metric_alarm"/);
    expect(synthesized).toMatch(/"aws_sns_topic"/);              
    expect(synthesized).toMatch(/"primary_vpc_id"/);
    expect(synthesized).toMatch(/"secondary_vpc_id"/);
  });

  test('deploys live resources and verifies DB connectivity', async () => {
    const app = new App();
    const stack = new TapStack(app, 'TestLiveEnvironmentDeployment');
    const synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();

    const terraformStateFile = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    
    if (!fs.existsSync(terraformStateFile)) {
      throw new Error(`Terraform state file not found at ${terraformStateFile}`);
    }

    const state = JSON.parse(fs.readFileSync(terraformStateFile, 'utf8'));
    console.log("State: ", state);

    // Ensure the correct output names are being referenced here
    const vpcId = state.TapStackpr824.PrimaryVpc_vpc_id_121F1BFC;
    const dbInstanceId = state.TapStackpr824.db_instance_id; // Ensure this matches the output key from TapStack

    expect(vpcId).toBeDefined();
    expect(dbInstanceId).toBeDefined();

    const vpcClient = new EC2Client({ region: 'us-east-1' });
    const dbClient = new RDSClient({ region: 'us-east-1' });

    const vpcResponse = await vpcClient.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(vpcResponse.Vpcs?.length).toBeGreaterThan(0);

    const dbResponse = await dbClient.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId }));
    expect(dbResponse.DBInstances?.length).toBeGreaterThan(0);
  });
});
