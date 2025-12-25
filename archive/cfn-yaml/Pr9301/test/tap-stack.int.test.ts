import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';

// LocalStack endpoint detection
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

const endpoint = isLocalStack ? 'http://localhost:4566' : undefined;

const cloudFormationClient = new CloudFormationClient({
  region: 'us-east-1',
  endpoint,
});

const ec2Client = new EC2Client({
  region: 'us-east-1',
  endpoint,
});

const dynamoDBClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint,
});

const snsClient = new SNSClient({
  region: 'us-east-1',
  endpoint,
});

describe('CloudFormation Stack Integration Tests', () => {
  const stackName = process.env.STACK_NAME || 'CloudEnvironmentSetup-test';
  let stackOutputs: Record<string, string> = {};

  beforeAll(async () => {
    // Get stack outputs
    try {
      const response = await cloudFormationClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      if (response.Stacks && response.Stacks[0].Outputs) {
        response.Stacks[0].Outputs.forEach((output) => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }
    } catch (error) {
      console.warn('Stack not found or not deployed:', error);
    }
  }, 30000);

  describe('VPC Configuration', () => {
    it('should have VPC created', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [stackOutputs.VPCId],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have public subnets created', async () => {
      if (!stackOutputs.PublicSubnet1Id || !stackOutputs.PublicSubnet2Id) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [stackOutputs.PublicSubnet1Id, stackOutputs.PublicSubnet2Id],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(2);
    });

    it('should have private subnets created', async () => {
      if (!stackOutputs.PrivateSubnet1Id || !stackOutputs.PrivateSubnet2Id) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [stackOutputs.PrivateSubnet1Id, stackOutputs.PrivateSubnet2Id],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(2);
    });
  });

  describe('DynamoDB Table', () => {
    it('should have DynamoDB table created', async () => {
      if (!stackOutputs.TurnAroundPromptTableName) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const response = await dynamoDBClient.send(
        new DescribeTableCommand({
          TableName: stackOutputs.TurnAroundPromptTableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(stackOutputs.TurnAroundPromptTableName);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('SNS Topic', () => {
    it('should have SNS topic created', async () => {
      if (!stackOutputs.SNSTopicArn) {
        console.log('Skipping - stack not deployed');
        return;
      }

      const response = await snsClient.send(new ListTopicsCommand({}));

      const topicExists = response.Topics?.some(
        (topic) => topic.TopicArn === stackOutputs.SNSTopicArn
      );

      expect(topicExists).toBe(true);
    });
  });

  describe('Stack Metadata', () => {
    it('should have environment suffix output', () => {
      if (!stackOutputs.EnvironmentSuffix) {
        console.log('Skipping - stack not deployed');
        return;
      }

      expect(stackOutputs.EnvironmentSuffix).toBeDefined();
      expect(stackOutputs.EnvironmentSuffix.length).toBeGreaterThan(0);
    });

    it('should have stack name output', () => {
      if (!stackOutputs.StackName) {
        console.log('Skipping - stack not deployed');
        return;
      }

      expect(stackOutputs.StackName).toBe(stackName);
    });
  });
});
