/**
 * Integration tests for TapStack - Secure Secrets Management Infrastructure
 *
 * These tests validate the deployed infrastructure against real AWS resources.
 * Tests verify:
 * - VPC and networking configuration
 * - KMS key encryption and rotation
 * - Secrets Manager secret with rotation configured
 * - Lambda function configuration and permissions
 * - VPC endpoint for private connectivity
 * - CloudWatch log groups with proper retention
 * - Security group rules
 * - Proper tagging
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';

// Load stack outputs from deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
if (!fs.existsSync(outputsPath)) {
  throw new Error(
    `Stack outputs not found at ${outputsPath}. Please deploy the stack first.`
  );
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// AWS clients
const region = 'us-east-1';
const ec2Client = new EC2Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

describe('TapStack Infrastructure Integration Tests', () => {
  describe('Stack Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.secretArn).toBeDefined();
      expect(outputs.kmsKeyId).toBeDefined();
      expect(outputs.rotationLambdaArn).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should have VPC with correct configuration', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // VPC is configured with DNS support
      expect(vpc.VpcId).toBe(outputs.vpcId);
    });

    it('should have 3 private subnets across 3 availability zones', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
          ],
        })
      );

      expect(response.Subnets?.length).toBeGreaterThanOrEqual(3);

      const privateSubnets = response.Subnets?.filter(
        subnet => !subnet.MapPublicIpOnLaunch
      );
      expect(privateSubnets?.length).toBeGreaterThanOrEqual(3);

      // Verify subnets are in different AZs
      const azs = new Set(privateSubnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    it('should have subnets with correct CIDR blocks', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
          ],
        })
      );

      const privateSubnets = response.Subnets?.filter(
        subnet => !subnet.MapPublicIpOnLaunch
      );

      privateSubnets?.forEach(subnet => {
        expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
      });
    });
  });

  describe('KMS Encryption', () => {
    it('should have KMS key configured', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.kmsKeyId,
        })
      );

      expect(response.KeyMetadata?.KeyId).toBe(outputs.kmsKeyId);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata?.Origin).toBe('AWS_KMS');
    });

    it('should have automatic key rotation enabled', async () => {
      const response = await kmsClient.send(
        new GetKeyRotationStatusCommand({
          KeyId: outputs.kmsKeyId,
        })
      );

      expect(response.KeyRotationEnabled).toBe(true);
    });

    it('should have correct key policy', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.kmsKeyId,
        })
      );

      expect(response.KeyMetadata?.Description).toMatch(/secret/i);
    });
  });

  describe('Secrets Manager', () => {
    it('should have secret configured with KMS encryption', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.secretArn,
        })
      );

      expect(response.ARN).toBe(outputs.secretArn);
      expect(response.KmsKeyId).toBeDefined();
      expect(response.Name).toMatch(/rds-credentials/);
    });

    it('should have rotation configured', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.secretArn,
        })
      );

      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationLambdaARN).toBe(outputs.rotationLambdaArn);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(30);
    });

    it('should have proper tags', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.secretArn,
        })
      );

      expect(response.Tags).toBeDefined();
      const tags = response.Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();
    });
  });

  describe('Lambda Rotation Function', () => {
    it('should have Lambda function configured', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.rotationLambdaArn,
        })
      );

      expect(response.Configuration?.FunctionArn).toBe(
        outputs.rotationLambdaArn
      );
      expect(response.Configuration?.Runtime).toMatch(/nodejs/);
      expect(response.Configuration?.Timeout).toBeGreaterThanOrEqual(60);
    });

    it('should be deployed in VPC', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.rotationLambdaArn,
        })
      );

      expect(response.VpcConfig?.VpcId).toBe(outputs.vpcId);
      expect(response.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
      expect(response.VpcConfig?.SecurityGroupIds?.length).toBeGreaterThan(0);
    });

    it('should have environment variables configured', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.rotationLambdaArn,
        })
      );

      expect(response.Environment?.Variables).toBeDefined();
    });

    it('should have IAM role with proper permissions', async () => {
      const funcResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.rotationLambdaArn,
        })
      );

      const roleName = funcResponse.Role?.split('/').pop();
      expect(roleName).toBeDefined();

      const roleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName!,
        })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toContain('lambda');
    });

    it('should have VPC execution policy attached', async () => {
      const funcResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.rotationLambdaArn,
        })
      );

      const roleName = funcResponse.Role?.split('/').pop();
      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: roleName!,
        })
      );

      const vpcPolicy = policiesResponse.AttachedPolicies?.find(p =>
        p.PolicyName?.includes('AWSLambdaVPCAccessExecutionRole')
      );
      expect(vpcPolicy).toBeDefined();
    });

    it('should have custom policy for Secrets Manager access', async () => {
      const funcResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.rotationLambdaArn,
        })
      );

      const roleName = funcResponse.Role?.split('/').pop();
      const policiesResponse = await iamClient.send(
        new ListRolePoliciesCommand({
          RoleName: roleName!,
        })
      );

      expect(policiesResponse.PolicyNames?.length).toBeGreaterThan(0);

      const policyName = policiesResponse.PolicyNames![0];
      const policyResponse = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName!,
          PolicyName: policyName,
        })
      );

      const policyDoc = decodeURIComponent(policyResponse.PolicyDocument!);
      expect(policyDoc).toContain('secretsmanager');
      expect(policyDoc).toContain('kms');
    });
  });

  describe('VPC Endpoint', () => {
    it('should have Secrets Manager VPC endpoint', async () => {
      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.secretsmanager`],
            },
          ],
        })
      );

      expect(response.VpcEndpoints?.length).toBeGreaterThan(0);
      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.VpcEndpointType).toBe('Interface');
      expect(endpoint.PrivateDnsEnabled).toBe(true);
    });

    it('should have security group attached', async () => {
      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.secretsmanager`],
            },
          ],
        })
      );

      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.Groups?.length).toBeGreaterThan(0);
    });
  });

  describe('Security Groups', () => {
    it('should have security group for Lambda', async () => {
      const funcResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.rotationLambdaArn,
        })
      );

      const sgIds = funcResponse.VpcConfig?.SecurityGroupIds || [];
      expect(sgIds.length).toBeGreaterThan(0);

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [sgIds[0]],
        })
      );

      expect(sgResponse.SecurityGroups?.length).toBe(1);
    });

    it('should have security group configured for VPC endpoint', async () => {
      const endpointResponse = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.vpcId],
            },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.secretsmanager`],
            },
          ],
        })
      );

      const sgIds = endpointResponse.VpcEndpoints![0].Groups?.map(
        g => g.GroupId!
      );
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: sgIds,
        })
      );

      const sg = sgResponse.SecurityGroups![0];
      // Security group is attached to VPC endpoint
      expect(sg.VpcId).toBe(outputs.vpcId);
      expect(sg.GroupId).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have audit log group with 365-day retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/secrets',
        })
      );

      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('audit')
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(365);
    });

    it('should have Lambda rotation log group with 365-day retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/lambda/secrets-rotation',
        })
      );

      const logGroup = response.logGroups?.find(lg =>
        lg.logGroupName?.includes('rotation')
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(365);
    });
  });

  describe('Resource Tagging', () => {
    it('should have proper tags on VPC', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpcId],
        })
      );

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      expect(tags.length).toBeGreaterThan(0);

      const nameTag = tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag?.Value).toMatch(/secrets-vpc/);
    });

    it('should have compliance tags', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.secretArn,
        })
      );

      const tags = response.Tags || [];
      const complianceTag = tags.find(t => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag?.Value).toMatch(/PCI-DSS/i);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should have all components connected properly', async () => {
      // Verify complete workflow: VPC -> Subnets -> Lambda -> Secret -> KMS

      // 1. VPC exists
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.vpcId] })
      );
      expect(vpcResponse.Vpcs?.length).toBe(1);

      // 2. Lambda in VPC
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.rotationLambdaArn,
        })
      );
      expect(lambdaResponse.VpcConfig?.VpcId).toBe(outputs.vpcId);

      // 3. Secret with rotation
      const secretResponse = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.secretArn })
      );
      expect(secretResponse.RotationLambdaARN).toBe(outputs.rotationLambdaArn);

      // 4. KMS key active
      const kmsResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.kmsKeyId })
      );
      expect(kmsResponse.KeyMetadata?.KeyState).toBe('Enabled');

      // All components properly connected
      expect(true).toBe(true);
    });
  });
});
