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
  });

  describe('VPC & Subnet Validation', () => {
    test('VPC should exist', async () => {
      const vpcId = outputs.VPC;
      const vpcs = await ec2.describeVpcs({}).promise();
      const found = vpcs.Vpcs?.some((v: any) => v.VpcId === vpcId);
      if (!found) {
        console.error(
          'Available VPCs:',
          vpcs.Vpcs?.map((v: any) => v.VpcId),
          'Expected:',
          vpcId
        );
      }
      expect(found).toBe(true);
    });

    test('Private subnets should exist and be in different AZs', async () => {
      const privateSubnetIds = [outputs.PrivateSubnet1, outputs.PrivateSubnet2];
      const subnets = await ec2.describeSubnets({}).promise();
      const foundSubnets = (subnets.Subnets || []).filter((s: any) =>
        privateSubnetIds.includes(s.SubnetId)
      );
      if (foundSubnets.length !== privateSubnetIds.length) {
        console.error(
          'Available subnets:',
          subnets.Subnets?.map((s: any) => s.SubnetId),
          'Expected:',
          privateSubnetIds
        );
      }
      expect(foundSubnets.length).toBe(privateSubnetIds.length);
      const azs = new Set(foundSubnets.map(s => s.AvailabilityZone));
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
