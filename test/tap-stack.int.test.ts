// Configuration - These are coming from cfn-outputs after the CloudFormation deploy
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
} from '@aws-sdk/client-cloudtrail';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetDetectorCommand, GuardDutyClient } from '@aws-sdk/client-guardduty';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetWebACLCommand, WAFV2Client } from '@aws-sdk/client-wafv2';
import fs from 'fs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const cfnClient = new CloudFormationClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const rdsClient = new RDSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const guardDutyClient = new GuardDutyClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const cloudTrailClient = new CloudTrailClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const wafClient = new WAFV2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const elbClient = new ElasticLoadBalancingV2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

let outputs: any = {};

describe('Secure Web Application Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    try {
      if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
        outputs = JSON.parse(
          fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
        );
      } else {
        const stackResponse = await cfnClient.send(
          new DescribeStacksCommand({ StackName: stackName })
        );
        if (stackResponse.Stacks && stackResponse.Stacks[0]?.Outputs) {
          outputs = {};
          stackResponse.Stacks[0].Outputs.forEach(output => {
            if (output.OutputKey && output.OutputValue) {
              outputs[output.OutputKey] = output.OutputValue;
            }
          });
        }
      }
    } catch (error) {
      console.warn('Could not load stack outputs. Some tests may fail.', error);
    }
  }, 30000);

  describe('CloudFormation Stack Validation', () => {
    test('CloudFormation stack should exist and be in CREATE_COMPLETE status', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBeGreaterThan(0);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have all expected outputs', async () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'WebApplicationSecurityGroupId',
        'DatabaseSecurityGroupId',
        'ApplicationLoadBalancerDNS',
        'WebACLArn',
        'DatabaseEndpoint',
        'SecureDynamoTableName',
        'KMSKeyId',
        'CloudTrailArn',
        'GuardDutyDetectorId',
      ];

      for (const outputName of expectedOutputs) {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBe('');
      }
    });
  });

  describe('Network Infrastructure Validation', () => {
    test('VPC should exist with proper configuration', async () => {
      if (!outputs.VPCId) fail('VPC ID not available in outputs');
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      );
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
    });
  });

  describe('Data Storage Validation', () => {
    test('DynamoDB table should exist with encryption enabled', async () => {
      const tableName = outputs.SecureDynamoTableName;
      const result = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      expect(result.Table).toBeDefined();
      expect(result.Table!.SSEDescription?.Status).toBe('ENABLED');
    });

    test('RDS database should exist and be encrypted', async () => {
      const dbIdentifier = outputs.DatabaseEndpoint?.split('.')[0];
      const result = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
      );
      expect(result.DBInstances?.[0].StorageEncrypted).toBe(true);
    });
  });

  describe('Security Validation', () => {
    test('CloudTrail should be logging with encryption', async () => {
      const trailName = outputs.CloudTrailArn.split('/').pop();
      const result = await cloudTrailClient.send(
        new DescribeTrailsCommand({ trailNameList: [trailName] })
      );
      expect(result.trailList?.[0].KmsKeyId).toBeDefined();
    });

    test('GuardDuty should be enabled', async () => {
      const result = await guardDutyClient.send(
        new GetDetectorCommand({ DetectorId: outputs.GuardDutyDetectorId })
      );
      expect(result.Status).toBe('ENABLED');
    });

    test('WAF should be configured', async () => {
      const webAclId = outputs.WebACLArn.split('/').pop();
      const result = await wafClient.send(
        new GetWebACLCommand({ Scope: 'REGIONAL', Id: webAclId })
      );
      expect(result.WebACL).toBeDefined();
      expect(result.WebACL?.DefaultAction).toBeDefined();
    });
  });

  describe('Load Balancer Validation', () => {
    test('ALB DNS should be available', async () => {
      expect(outputs.ApplicationLoadBalancerDNS).toMatch(
        /\.elb\.amazonaws\.com$/
      );
    });
  });
});
