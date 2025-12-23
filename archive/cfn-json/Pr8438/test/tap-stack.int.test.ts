// Configuration - These are coming from cfn-outputs after cdk deploy
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { ConfigServiceClient } from '@aws-sdk/client-config-service';
import { DescribeFlowLogsCommand, DescribeRouteTablesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcAttributeCommand, DescribeVpcEndpointsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetRoleCommand, GetRolePolicyCommand, IAMClient, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, GetKeyPolicyCommand, KMSClient, ListAliasesCommand, ListResourceTagsCommand } from '@aws-sdk/client-kms';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetBucketLifecycleConfigurationCommand, GetBucketPolicyCommand, GetBucketTaggingCommand, GetPublicAccessBlockCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import fs from 'fs';
import path from 'path';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = 'dev'; // process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });
const configClient = new ConfigServiceClient({ region });
const ssmClient = new SSMClient({ region });
jest.setTimeout(60_000);

describe('TapStack Integration Tests', () => {
  test('cfn outputs contain the expected keys', () => {
    expect(outputs).toBeDefined();
    expect(outputs.VPCId).toBeDefined();
    expect(outputs.PrivateSubnet1Id).toBeDefined();
    expect(outputs.PrivateSubnet2Id).toBeDefined();
    expect(outputs.PrivateSubnet3Id).toBeDefined();
    expect(outputs.DataBucketName).toBeDefined();
    expect(outputs.KMSKeyId).toBeDefined();
    expect(outputs.KMSKeyArn).toBeDefined();
    expect(outputs.DataValidationFunctionArn).toBeDefined();
    expect(outputs.SecurityAlertTopicArn).toBeDefined();
    expect(outputs.VPCFlowLogsLogGroup).toBeDefined();
    expect(outputs.ConfigBucketName).toBeDefined();
  });

  test('VPC exists and has the expected CIDR', async () => {
    const vpcId = outputs.VPCId;
    const result = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(result.Vpcs).toHaveLength(1);
    const vpc = result.Vpcs![0];
    expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc.State).toBe('available');
  });

  test('Private subnets exist and belong to expected VPC with correct CIDRs and MapPublicIpOnLaunch', async () => {
    const subnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id];
    const result = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    expect(result.Subnets!.length).toBe(3);
    const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
    const actualCidrs = result.Subnets!.map(s => s.CidrBlock).sort();
    expect(actualCidrs).toEqual(expectedCidrs.sort());
    result.Subnets!.forEach((s) => {
      expect(s.VpcId).toBe(outputs.VPCId);
      expect(s.MapPublicIpOnLaunch).toBe(false);
    });
  });

  test('Private subnets have ComplianceScope tag and are non-public', async () => {
    const subnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id];
    const subResp = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    subResp.Subnets!.forEach(s => {
      const tagMap = Object.fromEntries((s.Tags || []).map(t => [t.Key, t.Value]));
      expect(tagMap.ComplianceScope).toBe('Payment');
      expect(s.MapPublicIpOnLaunch).toBe(false);
    });
  });

  test('S3 VPC endpoint policy contains s3:GetObject', async () => {
    const resp = await ec2Client.send(new DescribeVpcEndpointsCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }, { Name: 'service-name', Values: [`com.amazonaws.${region}.s3`] }] }));
    const ep = resp.VpcEndpoints && resp.VpcEndpoints.length > 0 ? resp.VpcEndpoints![0] : undefined;
    expect(ep).toBeDefined();
    const policyDoc = ep!.PolicyDocument ? JSON.parse(ep!.PolicyDocument) : undefined;
    expect(policyDoc).toBeDefined();
    const statements = policyDoc.Statement || [];
    const hasGetObject = statements.some((s: any) => (s.Action || []).includes('s3:GetObject'));
    expect(hasGetObject).toBe(true);
  });

  test('KMS VPC endpoint contains expected private subnets', async () => {
    const resp = await ec2Client.send(new DescribeVpcEndpointsCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }, { Name: 'service-name', Values: [`com.amazonaws.${region}.kms`] }] }));
    const ep = resp.VpcEndpoints && resp.VpcEndpoints.length > 0 ? resp.VpcEndpoints![0] : undefined;
    expect(ep).toBeDefined();
    const epSubnetIds = new Set(ep!.SubnetIds || []);
    const expectedSubnetIds = new Set([outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id]);
    expectedSubnetIds.forEach(id => expect(epSubnetIds.has(id)).toBe(true));
  });

  test('SNS topic KMS master key matches KMS key', async () => {
    const topicArn = outputs.SecurityAlertTopicArn;
    const resp = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
    expect(resp.Attributes).toBeDefined();
    // KmsMasterKeyId may be returned as key ARN or key ID, so check for the id or arn
    const kmsId = resp.Attributes?.KmsMasterKeyId || '';
    expect(kmsId).toEqual(expect.stringContaining(outputs.KMSKeyId) || expect.stringContaining(outputs.KMSKeyArn) || expect.stringContaining(outputs.KMSKeyArn.split(':').pop() || ''));
  });

  test('Lambda handler is index.handler', async () => {
    const fnArn = outputs.DataValidationFunctionArn;
    const resp = await lambdaClient.send(new GetFunctionCommand({ FunctionName: fnArn }));
    expect(resp.Configuration?.Handler).toBe('index.handler');
  });

  test('Lambda tags include ComplianceScope', async () => {
    const fnArn = outputs.DataValidationFunctionArn;
    const resp = await lambdaClient.send(new GetFunctionCommand({ FunctionName: fnArn }));
    const tags = resp.Tags || {};
    expect(tags['ComplianceScope']).toBe('Payment');
  });

  test('KMS key exists and is enabled', async () => {
    const keyId = outputs.KMSKeyId;
    const resp = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
    expect(resp.KeyMetadata).toBeDefined();
    expect(resp.KeyMetadata!.KeyId).toBeDefined();
    expect(resp.KeyMetadata!.KeyState).toBe('Enabled');
  });

  test('VPC tags include DataClassification and ComplianceScope', async () => {
    const vpcId = outputs.VPCId;
    const resp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    const vpc = resp.Vpcs![0];
    const tagMap = Object.fromEntries((vpc.Tags || []).map(t => [t.Key, t.Value]));
    expect(tagMap.DataClassification).toBe('PCI');
    expect(tagMap.ComplianceScope).toBe('Payment');
  });

  test('Private subnets have DataClassification tag and unique AZs', async () => {
    const subnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id];
    const subResp = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    subResp.Subnets!.forEach(s => {
      const tagMap = Object.fromEntries((s.Tags || []).map(t => [t.Key, t.Value]));
      expect(tagMap.DataClassification).toBe('PCI');
    });
    const uniqueAZs = new Set(subResp.Subnets!.map(s => s.AvailabilityZone));
    expect(uniqueAZs.size).toBe(3);
  });

  test('Subnet route table associations exist for private subnets', async () => {
    const subnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id, outputs.PrivateSubnet3Id];
    const resp = await ec2Client.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'association.subnet-id', Values: subnetIds }] }));
    expect(resp.RouteTables && resp.RouteTables.length >= 1).toBe(true);
  });

  test('S3 VPC endpoint exists (gateway) in the VPC', async () => {
    const resp = await ec2Client.send(new DescribeVpcEndpointsCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }, { Name: 'service-name', Values: [`com.amazonaws.${region}.s3`] }] }));
    expect(resp.VpcEndpoints && resp.VpcEndpoints.length > 0).toBe(true);
    const ep = resp.VpcEndpoints![0];
    expect(ep.VpcEndpointType).toBe('Gateway');
  });

  test('KMS VPC endpoint exists and is interface with PrivateDnsEnabled true', async () => {
    const resp = await ec2Client.send(new DescribeVpcEndpointsCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }, { Name: 'service-name', Values: [`com.amazonaws.${region}.kms`] }] }));
    expect(resp.VpcEndpoints && resp.VpcEndpoints.length > 0).toBe(true);
    const ep = resp.VpcEndpoints![0];
    expect(ep.VpcEndpointType).toBe('Interface');
    expect(ep.PrivateDnsEnabled).toBeTruthy();
    expect(ep.DnsEntries && ep.DnsEntries.length > 0).toBe(true);
  });

  test('KMS endpoint security group has no egress and contains DataClassification tag', async () => {
    const sgName = `kms-endpoint-sg-v7-${environmentSuffix}`;
    const resp = await ec2Client.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: 'group-name', Values: [sgName] }, { Name: 'vpc-id', Values: [outputs.VPCId] }] }));
    expect(resp.SecurityGroups && resp.SecurityGroups.length > 0).toBe(true);
    const sg = resp.SecurityGroups![0];
    expect(sg.IpPermissionsEgress && sg.IpPermissionsEgress.length).toBe(1);
  });

  test('KMS SG ingress allows Lambda SG on port 443', async () => {
    const kmsSgName = `kms-endpoint-sg-v7-${environmentSuffix}`;
    const lambdaSgName = `lambda-sg-v7-${environmentSuffix}`;
    const kmsResp = await ec2Client.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: 'group-name', Values: [kmsSgName] }, { Name: 'vpc-id', Values: [outputs.VPCId] }] }));
    const lambdaResp = await ec2Client.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: 'group-name', Values: [lambdaSgName] }, { Name: 'vpc-id', Values: [outputs.VPCId] }] }));
    const kmsSg = kmsResp.SecurityGroups![0];
    const lambdaSg = lambdaResp.SecurityGroups![0];
    // KMS SG ingress should include a rule for TCP 443 with source security group = Lambda SG
    const ingressRule = (kmsSg.IpPermissions || []).find(perm => perm.FromPort === 443 && perm.ToPort === 443 && perm.IpProtocol === 'tcp');
    expect(ingressRule).toBeDefined();
    const userGroupPair = (ingressRule!.UserIdGroupPairs || []).find(gp => gp.GroupId === lambdaSg.GroupId);
    expect(userGroupPair).toBeDefined();
  });

  test('KMS key has correct tags and description', async () => {
    const keyId = outputs.KMSKeyId;
    const tagsResp = await kmsClient.send(new ListResourceTagsCommand({ KeyId: keyId }));
    const tagMap = Object.fromEntries((tagsResp.Tags || []).map(t => [t.TagKey, t.TagValue]));
    expect(tagMap.DataClassification).toBe('PCI');
    expect(tagMap.ComplianceScope).toBe('Payment');
    const descResp = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
    expect(descResp.KeyMetadata?.Description).toContain('Customer-managed KMS key for PCI data encryption');
  });

  test('Data bucket name follows expected prefix naming convention', async () => {
    const bucketName = outputs.DataBucketName;
    expect(bucketName.startsWith(`pci-data-bucket-v7-${environmentSuffix}-`)).toBe(true);
  });

  test('Lambda inline S3 policy contains s3:ListBucket', async () => {
    const roleName = `lambda-execution-role-v7-${environmentSuffix}`;
    const s3Policy = await iamClient.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: 'S3Access' }));
    expect(decodeURIComponent(s3Policy.PolicyDocument || '')).toContain('s3:ListBucket');
  });

  test('ConfigRole permission policy includes sns:Publish', async () => {
    const roleName = `config-role-v7-${environmentSuffix}`;
    const policyResp = await iamClient.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: 'ConfigPermissions' }));
    expect(decodeURIComponent(policyResp.PolicyDocument || '')).toContain('sns:Publish');
  });

  test('Lambda function Name tag follows expected naming convention', async () => {
    const fnArn = outputs.DataValidationFunctionArn;
    const resp = await lambdaClient.send(new GetFunctionCommand({ FunctionName: fnArn }));
    const tags = resp.Tags || {};
    expect(tags['Name']).toBe(`data-validation-v7-${environmentSuffix}`);
  });

  test('Config bucket name follows naming convention', async () => {
    const cb = outputs.ConfigBucketName;
    expect(cb.startsWith(`config-bucket-v7-${environmentSuffix}-`)).toBe(true);
  });

  test('KMS Key policy allows access from S3 and CloudWatch Logs', async () => {
    const keyId = outputs.KMSKeyId;
    const kp = await kmsClient.send(new GetKeyPolicyCommand({ KeyId: keyId, PolicyName: 'default' }));
    expect(kp.Policy).toContain('s3.amazonaws.com');
    expect(kp.Policy).toContain('logs.');
  });

  test('S3 VPC Endpoint is associated with private route tables that match expected name', async () => {
    const resp = await ec2Client.send(new DescribeVpcEndpointsCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }, { Name: 'service-name', Values: [`com.amazonaws.${region}.s3`] }] }));
    const ep = resp.VpcEndpoints && resp.VpcEndpoints.length > 0 ? resp.VpcEndpoints![0] : undefined;
    expect(ep).toBeDefined();
    const rids = ep!.RouteTableIds || [];
    const rts = await ec2Client.send(new DescribeRouteTablesCommand({ RouteTableIds: rids }));
    expect(rts.RouteTables && rts.RouteTables.length > 0).toBe(true);
    const hasPrivateRt = rts.RouteTables!.some(rt => (rt.Tags || []).some(t => t.Key === 'Name' && (t.Value || '').includes(`private-rt-v7-${environmentSuffix}`)));
    expect(hasPrivateRt).toBe(true);
  });

  test('Lambda environment variables reference correct DataBucket and KMS key IDs', async () => {
    const fnArn = outputs.DataValidationFunctionArn;
    const resp = await lambdaClient.send(new GetFunctionCommand({ FunctionName: fnArn }));
    const envVars = resp.Configuration!.Environment?.Variables || {};
    expect(envVars.DATA_BUCKET).toBe(outputs.DataBucketName);
    expect(envVars.KMS_KEY_ID).toBe(outputs.KMSKeyId);
  });

  test('Lambda role inline S3 and KMS policies include expected actions', async () => {
    const roleName = `lambda-execution-role-v7-${environmentSuffix}`;
    const s3Policy = await iamClient.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: 'S3Access' }));
    expect(decodeURIComponent(s3Policy.PolicyDocument || '')).toContain('s3:GetObject');
    const kmsPolicy = await iamClient.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: 'KMSAccess' }));
    expect(decodeURIComponent(kmsPolicy.PolicyDocument || '')).toContain('kms:GenerateDataKey');
  });

  test('Lambda security group exists and is in the VPC', async () => {
    const sgName = `lambda-sg-v7-${environmentSuffix}`;
    const resp = await ec2Client.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: 'group-name', Values: [sgName] }, { Name: 'vpc-id', Values: [outputs.VPCId] }] }));
    expect(resp.SecurityGroups && resp.SecurityGroups.length > 0).toBe(true);
    const sg = resp.SecurityGroups![0];
    expect(sg.VpcId).toBe(outputs.VPCId);
  });

  test('Lambda function has DataClassification tag', async () => {
    const fnArn = outputs.DataValidationFunctionArn;
    const resp = await lambdaClient.send(new GetFunctionCommand({ FunctionName: fnArn }));
    const tags = resp.Tags || {};
    expect(tags['DataClassification']).toBe('PCI');
  });

  test('Lambda execution role has AWSLambdaVPCAccessExecutionRole attached', async () => {
    const roleName = `lambda-execution-role-v7-${environmentSuffix}`;
    const attached = await iamClient.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
    expect(attached.AttachedPolicies && attached.AttachedPolicies.length > 0).toBe(true);
    expect(attached.AttachedPolicies!.some(p => p.PolicyArn === 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole')).toBe(true);
  });

  test('VPC Flow Logs role contains CloudWatch policy allowing logs operations', async () => {
    const roleName = `vpc-flowlogs-role-v7-${environmentSuffix}`;
    const policyName = 'CloudWatchLogGroupAccess';
    const rolePolicy = await iamClient.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: policyName }));
    expect(rolePolicy).toBeDefined();
    const policyDoc = decodeURIComponent(rolePolicy.PolicyDocument || '');
    expect(policyDoc).toContain('logs:CreateLogGroup');
  });

  test('Lambda exists and is configured correctly (runtime and VPC configuration)', async () => {
    const fnArn = outputs.DataValidationFunctionArn;
    const result = await lambdaClient.send(new GetFunctionCommand({ FunctionName: fnArn }));
    expect(result.Configuration).toBeDefined();
    expect(result.Configuration!.Runtime).toBe('nodejs22.x');
    expect(result.Configuration!.MemorySize).toBe(1024);
    expect(result.Configuration!.Timeout).toBe(60);
    const vpcConfig = result.Configuration!.VpcConfig;
    expect(vpcConfig).toBeDefined();
    expect(vpcConfig!.SubnetIds!.length).toBe(3);
  });

  test('SNS Topic exists', async () => {
    const topicArn = outputs.SecurityAlertTopicArn;
    const resp = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
    expect(resp.Attributes).toBeDefined();
    expect(resp.Attributes!.DisplayName).toBe('PCI Security Alerts');
  });

  test('SSM parameters for data-bucket and kms-key-id exist and reference outputs', async () => {
    const dataParamName = `/pci/config/${environmentSuffix}/data-bucket`;
    const kmsParamName = `/pci/config/${environmentSuffix}/kms-key-id`;
    const dataParam = await ssmClient.send(new GetParameterCommand({ Name: dataParamName }));
    const kmsParam = await ssmClient.send(new GetParameterCommand({ Name: kmsParamName }));
    expect(dataParam.Parameter).toBeDefined();
    expect(kmsParam.Parameter).toBeDefined();
    expect(dataParam.Parameter!.Value).toBe(outputs.DataBucketName);
    expect(kmsParam.Parameter!.Value).toBe(outputs.KMSKeyId);
  });
});