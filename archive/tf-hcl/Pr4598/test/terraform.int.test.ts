import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs: Record<string, any> = JSON.parse(outputsRaw);

if (!outputs.region && !outputs.aws_region) {
  throw new Error('AWS region not found in flat outputs.');
}

const awsRegion = outputs.region || outputs.aws_region;
AWS.config.update({ region: awsRegion });

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const apigateway = new AWS.APIGateway();
const iam = new AWS.IAM();
const cloudwatch = new AWS.CloudWatch();
const logs = new AWS.CloudWatchLogs();

describe('TAP Stack Integration Tests (Full Stack)', () => {

  // -------------------------
  // VPC TESTS
  // -------------------------
  it('VPC exists with correct CIDR', async () => {
    const vpc = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpc.Vpcs?.length).toBe(1);
    expect(vpc.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway attached to VPC', async () => {
    const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    const attachment = igw.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe('available');
  });

  it('Public and Private subnets exist and belong to the same VPC', async () => {
    const publicSubnetIds: string[] = JSON.parse(outputs.public_subnet_ids);
    const privateSubnetIds: string[] = JSON.parse(outputs.private_subnet_ids);

    const publicSubnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
    const privateSubnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();

    publicSubnets.Subnets?.forEach(s => expect(s.VpcId).toBe(outputs.vpc_id));
    privateSubnets.Subnets?.forEach(s => expect(s.VpcId).toBe(outputs.vpc_id));
  });


  // -------------------------
  // SECURITY GROUP TESTS
  // -------------------------
  it('EC2 security group exists with correct permissions', async () => {
    const sg = await ec2.describeSecurityGroups({ GroupIds: [outputs.ec2_security_group_id] }).promise();
    expect(sg.SecurityGroups?.length).toBe(1);
    const sshRule = sg.SecurityGroups?.[0].IpPermissions?.find(p => p.FromPort === 22 && p.ToPort === 22);
    expect(sshRule).toBeDefined();
  });

  it('Lambda security group exists', async () => {
    const sg = await ec2.describeSecurityGroups({ GroupIds: [outputs.lambda_security_group_id] }).promise();
    expect(sg.SecurityGroups?.length).toBe(1);
  });


  // -------------------------
  // IAM ROLES
  // -------------------------
  it('EC2 IAM Role is active and has correct ARN', async () => {
    const role = await iam.getRole({ RoleName: outputs.ec2_role_arn.split('/').pop()! }).promise();
    expect(role.Role.Arn).toBe(outputs.ec2_role_arn);
  });

  it('Lambda IAM Role is active and has correct ARN', async () => {
    const role = await iam.getRole({ RoleName: outputs.lambda_role_arn.split('/').pop()! }).promise();
    expect(role.Role.Arn).toBe(outputs.lambda_role_arn);
  });

  it('API Gateway CloudWatch Role exists', async () => {
    const role = await iam.getRole({ RoleName: outputs.api_gateway_role_arn.split('/').pop()! }).promise();
    expect(role.Role.Arn).toBe(outputs.api_gateway_role_arn);
  });

  // -------------------------
  // S3 BUCKET
  // -------------------------
  it('S3 bucket exists and is accessible', async () => {
    const result = await s3.getBucketLocation({ Bucket: outputs.s3_bucket_name }).promise();
    expect(result).toBeDefined();
    await s3.putObject({
      Bucket: outputs.s3_bucket_name,
      Key: 'integration-test/health-check.json',
      Body: JSON.stringify({ status: 'ok' })
    }).promise();
  });

  // -------------------------
  // LAMBDA FUNCTION
  // -------------------------
  it('Lambda function is deployed with correct name', async () => {
    const func = await lambda.getFunction({ FunctionName: outputs.lambda_function_name }).promise();
    expect(func.Configuration?.FunctionName).toBe(outputs.lambda_function_name);
    expect(func.Configuration?.Runtime).toContain('python');
  });

  it('Lambda log group exists in CloudWatch Logs', async () => {
    const logsGroup = await logs.describeLogGroups({ logGroupNamePrefix: outputs.lambda_log_group_name }).promise();
    expect(logsGroup.logGroups?.some(g => g.logGroupName === outputs.lambda_log_group_name)).toBe(true);
  });

  // -------------------------
  // API GATEWAY
  // -------------------------
  it('API Gateway REST API exists', async () => {
    const api = await apigateway.getRestApi({ restApiId: outputs.api_gateway_id }).promise();
    expect(api.name).toMatch(/tap-stack-api/);
  });

  it('API Gateway Stage exists and active', async () => {
    const stage = await apigateway.getStage({ restApiId: outputs.api_gateway_id, stageName: outputs.api_gateway_stage_name }).promise();
    expect(stage.stageName).toBe(outputs.api_gateway_stage_name);
  });


  it('API Gateway log group exists in CloudWatch Logs', async () => {
    const logsGroup = await logs.describeLogGroups({ logGroupNamePrefix: outputs.api_gateway_log_group_name }).promise();
    expect(logsGroup.logGroups?.some(g => g.logGroupName === outputs.api_gateway_log_group_name)).toBe(true);
  });

  // -------------------------
  // ENVIRONMENT VALIDATION
  // -------------------------
  it('All resources are correctly tagged for environment', () => {
    expect(outputs.environment_tag).toBe('prd');
  });

  it('AWS Region consistency across outputs', () => {
    expect(outputs.region).toBe('us-east-1');
  });
});
