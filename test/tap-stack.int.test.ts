import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const STACK_NAME = `TapStack-${Date.now()}`;
const TEMPLATE_PATH = 'lib/TapStack.yml';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
const TRUSTED_CIDR = process.env.TRUSTED_CIDR || '10.0.0.0/8';
const DB_USERNAME = process.env.DB_USERNAME || 'dbadmin';
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'test@example.com';

// LocalStack configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ENDPOINT = process.env.AWS_ENDPOINT || 'http://localhost:4566';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test';

describe('TapStack CloudFormation Template - Integration Tests', () => {
  beforeAll(async () => {
    // Ensure LocalStack is running
    try {
      await execAsync(`curl -f ${AWS_ENDPOINT}/_localstack/health`);
    } catch (error) {
      throw new Error('LocalStack is not running. Please start LocalStack first.');
    }

    // Deploy the stack
    console.log(`Deploying stack: ${STACK_NAME}`);
    const deployCommand = `
      aws cloudformation deploy \
        --template-file ${TEMPLATE_PATH} \
        --stack-name ${STACK_NAME} \
        --parameter-overrides \
          EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
          TrustedCidrBlock=${TRUSTED_CIDR} \
          DBUsername=${DB_USERNAME} \
          NotificationEmail=${NOTIFICATION_EMAIL} \
        --capabilities CAPABILITY_IAM \
        --region ${AWS_REGION} \
        --endpoint-url ${AWS_ENDPOINT}
    `;

    try {
      const { stdout, stderr } = await execAsync(deployCommand, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      console.log('Stack deployment output:', stdout);
      if (stderr) console.log('Stack deployment stderr:', stderr);
    } catch (error) {
      console.error('Stack deployment failed:', error);
      throw error;
    }

    // Wait for stack to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  }, 120000);

  afterAll(async () => {
    // Clean up the stack
    try {
      console.log(`Deleting stack: ${STACK_NAME}`);
      const deleteCommand = `aws cloudformation delete-stack --stack-name ${STACK_NAME} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT}`;
      await execAsync(deleteCommand, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      console.log('Stack deletion initiated');
    } catch (error) {
      console.error('Stack deletion failed:', error);
    }
  }, 60000);

  describe('Stack Deployment', () => {
    test('stack should be created successfully', async () => {
      const { stdout } = await execAsync(`aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'Stacks[0].StackStatus' --output text`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      expect(stdout.trim()).toBe('CREATE_COMPLETE');
    });

    test('stack should have all outputs', async () => {
      const { stdout } = await execAsync(`aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'Stacks[0].Outputs' --output json`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      const outputs = JSON.parse(stdout);
      expect(outputs).toHaveLength(6);

      const outputKeys = outputs.map((o: any) => o.OutputKey);
      expect(outputKeys).toEqual(expect.arrayContaining([
        'VPCId',
        'SecurityGroupId',
        'S3BucketName',
        'RDSEndpoint',
        'SNSTopicArn',
        'DBPasswordSecretArn'
      ]));
    });
  });

  describe('VPC and Network Resources', () => {
    let vpcId: string;
    let publicSubnetIds: string[];
    let privateSubnetIds: string[];

    beforeAll(async () => {
      const { stdout } = await execAsync(`aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'Stacks[0].Outputs[?OutputKey==\`VPCId\`].OutputValue' --output text`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      vpcId = stdout.trim();
    });

    test('VPC should exist with correct configuration', async () => {
      const { stdout } = await execAsync(`aws ec2 describe-vpcs --vpc-ids ${vpcId} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'Vpcs[0]' --output json`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      const vpc = JSON.parse(stdout);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.IsDefault).toBe(false);
    });

    test('subnets should exist and be properly configured', async () => {
      const { stdout } = await execAsync(`aws ec2 describe-subnets --filters Name=vpc-id,Values=${vpcId} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'Subnets[*].[SubnetId,CidrBlock,MapPublicIpOnLaunch]' --output json`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      const subnets = JSON.parse(stdout);
      expect(subnets).toHaveLength(4);

      const publicSubnets = subnets.filter((s: any) => s[2] === true);
      const privateSubnets = subnets.filter((s: any) => s[2] === false);

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);

      publicSubnetIds = publicSubnets.map((s: any) => s[0]);
      privateSubnetIds = privateSubnets.map((s: any) => s[0]);
    });

    test('internet gateway should be attached to VPC', async () => {
      const { stdout } = await execAsync(`aws ec2 describe-internet-gateways --filters Name=attachment.vpc-id,Values=${vpcId} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'InternetGateways' --output json`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      const igws = JSON.parse(stdout);
      expect(igws).toHaveLength(1);
    });
  });


  describe('SNS Topic', () => {
    let snsTopicArn: string;

    beforeAll(async () => {
      const { stdout } = await execAsync(`aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'Stacks[0].Outputs[?OutputKey==\`SNSTopicArn\`].OutputValue' --output text`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      snsTopicArn = stdout.trim();
    });

    test('SNS topic should exist', async () => {
      const { stdout } = await execAsync(`aws sns get-topic-attributes --topic-arn ${snsTopicArn} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'Attributes.DisplayName' --output text`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      expect(stdout.trim()).toBe('Security Compliance Alerts');
    });
  });

  describe('Secrets Manager', () => {
    let secretArn: string;

    beforeAll(async () => {
      const { stdout } = await execAsync(`aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'Stacks[0].Outputs[?OutputKey==\`DBPasswordSecretArn\`].OutputValue' --output text`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      secretArn = stdout.trim();
    });

    test('database password secret should exist', async () => {
      const { stdout } = await execAsync(`aws secretsmanager describe-secret --secret-id ${secretArn} --region ${AWS_REGION} --endpoint-url ${AWS_ENDPOINT} --query 'Name' --output text`, {
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          AWS_REGION,
        }
      });
      expect(stdout.trim()).toBe(`${STACK_NAME}-DBPassword`);
    });
  });
});
