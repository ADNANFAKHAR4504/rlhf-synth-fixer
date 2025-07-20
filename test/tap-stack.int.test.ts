import { CloudWatch, EC2, Lambda, SNS, SSM } from 'aws-sdk';
import axios from 'axios';
import fs from 'fs';

// Load outputs (adjust path if needed)
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const lambda = new Lambda();
const ec2 = new EC2();
const ssm = new SSM();
const cloudwatch = new CloudWatch();
const sns = new SNS();

// Fail fast if required outputs are missing
beforeAll(() => {
  [
    'VPC',
    'PrivateSubnet1',
    'PrivateSubnet2',
    'LambdaFunction1Arn',
    'LambdaFunction2Arn',
    'ApiEndpoint',
    'SSMParameterName',
    'CloudWatchAlarmName',
    'SNSTopicArn',
  ].forEach(key => {
    if (!outputs[key]) {
      throw new Error(
        `outputs.${key} is missing or undefined! Check your CloudFormation outputs and cfn-outputs/flat-outputs.json`
      );
    }
  });
});

describe('Serverless Stack Integration Tests', () => {
  describe('API Gateway & Lambda Integration', () => {
    test('API endpoint should return 200, 403, or 502', async () => {
      let url = outputs.ApiEndpoint;
      if (!url.endsWith('/')) url += '/';
      url += 'test';

      try {
        const response = await axios.get(url);
        expect([200, 403, 502]).toContain(response.status);
      } catch (err: any) {
        const status = err.response?.status;
        if (![200, 403, 502].includes(status)) {
          console.error('API error:', status, err.response?.data);
        }
        expect([200, 403, 502]).toContain(status);
      }
    });

    test('Lambda functions should exist and be active', async () => {
      const lambdaArns = [
        outputs.LambdaFunction1Arn,
        outputs.LambdaFunction2Arn,
      ];
      for (const arn of lambdaArns) {
        const { Configuration } = await lambda
          .getFunction({ FunctionName: arn })
          .promise();
        expect(Configuration?.State).toBe('Active');
        expect(Configuration?.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
        expect(
          Configuration?.VpcConfig?.SecurityGroupIds?.length
        ).toBeGreaterThan(0);
      }
    });

    test('LambdaFunction1 should return expected output', async () => {
      const functionName = outputs.LambdaFunction1Arn;
      const result = await lambda
        .invoke({
          FunctionName: functionName,
          Payload: JSON.stringify({}),
        })
        .promise();
      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();
      const payload = JSON.parse(result.Payload as string);
      expect(payload).toBe('Hello from Lambda 1');
    });

    test('LambdaFunction2 should return expected output', async () => {
      const functionName = outputs.LambdaFunction2Arn;
      const result = await lambda
        .invoke({
          FunctionName: functionName,
          Payload: JSON.stringify({}),
        })
        .promise();
      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();
      const payload = JSON.parse(result.Payload as string);
      expect(payload).toBe('Hello from Lambda 2');
    });
  });

  describe('VPC & Subnet Validation', () => {
    test('VPC should exist', async () => {
      const vpcId = outputs.VPC;
      const vpcs = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpcs.Vpcs?.length).toBe(1);
    });

    test('Private subnets should exist and be in different AZs', async () => {
      const privateSubnetIds = [outputs.PrivateSubnet1, outputs.PrivateSubnet2];
      const subnets = await ec2
        .describeSubnets({ SubnetIds: privateSubnetIds })
        .promise();
      expect(subnets.Subnets?.length).toBe(privateSubnetIds.length);
      const azs = new Set(subnets.Subnets?.map((s: any) => s.AvailabilityZone));
      expect(azs.size).toBe(privateSubnetIds.length);
    });
  });

  describe('SSM Parameter Store', () => {
    test('API key parameter should exist and be retrievable', async () => {
      const paramName = outputs.SSMParameterName;
      const param = await ssm.getParameter({ Name: paramName }).promise();
      expect(param.Parameter?.Value).toBeDefined();
      expect(param.Parameter?.Name).toBe(paramName);
    });
  });

  describe('CloudWatch Alarm', () => {
    test('CloudWatch alarm should exist and be in a known state', async () => {
      const alarmName = outputs.CloudWatchAlarmName;
      const alarms = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();
      expect(alarms.MetricAlarms?.length).toBe(1);
      expect(['OK', 'INSUFFICIENT_DATA', 'ALARM']).toContain(
        alarms.MetricAlarms![0].StateValue
      );
    });

    test('Billing alarm should exist in AWS/Billing namespace', async () => {
      // Billing alarms are usually available only in us-east-1
      const billingAlarms = await cloudwatch.describeAlarms({}).promise();
      const found = (billingAlarms.MetricAlarms || []).some(
        alarm =>
          alarm.Namespace === 'AWS/Billing' ||
          (alarm.MetricName &&
            alarm.MetricName.toLowerCase().includes('billing'))
      );
      expect(found).toBe(true);
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic should exist', async () => {
      const topicArn = outputs.SNSTopicArn;
      const topics = await sns.listTopics().promise();
      const arns = topics.Topics?.map(t => t.TopicArn);
      expect(arns).toContain(topicArn);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('Named resources should include environment suffix', () => {
      expect(outputs.SSMParameterName).toContain(environmentSuffix);
      // Add more checks for other named resources if needed
    });
  });
});
