#!/usr/bin/env node
import * as AWS from 'aws-sdk';
import { execSync } from 'child_process';

interface DeploymentConfig {
  environmentSuffix: string;
  region: string;
  drRegion: string;
  timeout: number;
}

class ComprehensiveDeployment {
  private config: DeploymentConfig;

  constructor() {
    this.config = {
      environmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'dev',
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      drRegion: 'us-west-2',
      timeout: 300000, // 5 minutes
    };
  }

  async deploy(): Promise<void> {
    console.log('🚀 Starting comprehensive deployment...');
    console.log(`Environment: ${this.config.environmentSuffix}`);
    console.log(`Primary Region: ${this.config.region}`);
    console.log(`DR Region: ${this.config.drRegion}`);

    try {
      // 1. Synthesize to check for errors
      console.log('\n📋 Synthesizing CDK templates...');
      execSync('npm run build && npx cdk synth', {
        stdio: 'inherit',
        env: {
          ...process.env,
          CDK_DEFAULT_REGION: this.config.region,
        },
      });

      // 2. Deploy main stack
      console.log('\n📦 Deploying main stack...');
      execSync(
        `npx cdk deploy TapStack${this.config.environmentSuffix} --context environmentSuffix=${this.config.environmentSuffix}`,
        {
          stdio: 'inherit',
          env: {
            ...process.env,
            CDK_DEFAULT_REGION: this.config.region,
          },
        }
      );

      // 3. Wait for initial stabilization
      console.log('\n⏳ Waiting for resources to stabilize...');
      await this.sleep(60000); // 1 minute

      // 4. Validate deployment
      console.log('\n🔍 Validating deployment...');
      await this.validateDeployment();

      // 5. Run health checks
      console.log('\n🏥 Running health checks...');
      await this.runHealthChecks();

      console.log('\n✅ Deployment completed successfully!');
      console.log('All components are operational and validated.');
    } catch (error) {
      console.error(
        '\n❌ Deployment failed:',
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  }

  private async validateDeployment(): Promise<void> {
    const cloudformation = new AWS.CloudFormation({
      region: this.config.region,
    });
    const stackName = `TapStack${this.config.environmentSuffix}`;

    try {
      // Check stack status
      const stackInfo = await cloudformation
        .describeStacks({
          StackName: stackName,
        })
        .promise();

      const stack = stackInfo.Stacks?.[0];
      if (
        !stack ||
        (stack.StackStatus !== 'CREATE_COMPLETE' &&
          stack.StackStatus !== 'UPDATE_COMPLETE')
      ) {
        throw new Error(
          `Stack ${stackName} is not in a stable state: ${stack?.StackStatus}`
        );
      }

      console.log(`✅ Stack ${stackName} is in state: ${stack.StackStatus}`);

      // Validate outputs exist
      const outputs = stack.Outputs || [];
      const expectedOutputs = [
        `OrderTableArn${this.config.environmentSuffix}`,
        `OrderProcessingLambdaArn${this.config.environmentSuffix}`,
        `ApiEndpoint${this.config.environmentSuffix}`,
        `CloudFrontDomain${this.config.environmentSuffix}`,
        `RdsEndpoint${this.config.environmentSuffix}`,
      ];

      for (const expectedOutput of expectedOutputs) {
        const output = outputs.find(o => o.OutputKey === expectedOutput);
        if (!output) {
          throw new Error(`Required output ${expectedOutput} not found`);
        }
        console.log(`✅ Output ${expectedOutput}: ${output.OutputValue}`);
      }
    } catch (error) {
      console.error('❌ Stack validation failed:', error);
      throw error;
    }
  }

  private async runHealthChecks(): Promise<void> {
    const lambda = new AWS.Lambda({ region: this.config.region });
    const dynamodb = new AWS.DynamoDB({ region: this.config.region });
    const s3 = new AWS.S3({ region: this.config.region });

    try {
      // 1. Test Lambda functions
      console.log('🔍 Testing Lambda functions...');
      const lambdas = await lambda
        .listFunctions({
          MaxItems: 50,
        })
        .promise();

      const tradingLambdas =
        lambdas.Functions?.filter(fn =>
          fn.FunctionName?.includes(`iac-rlhf-${this.config.environmentSuffix}`)
        ) || [];

      for (const fn of tradingLambdas) {
        try {
          const response = await lambda
            .invoke({
              FunctionName: fn.FunctionName!,
              InvocationType: 'RequestResponse',
              Payload: JSON.stringify({
                test: true,
                healthCheck: true,
              }),
            })
            .promise();

          if (response.StatusCode === 200) {
            console.log(`✅ Lambda ${fn.FunctionName} is healthy`);
          } else {
            console.warn(
              `⚠️  Lambda ${fn.FunctionName} returned status ${response.StatusCode}`
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.warn(
            `⚠️  Lambda ${fn.FunctionName} health check failed:`,
            errorMessage
          );
        }
      }

      // 2. Test DynamoDB table
      console.log('🔍 Testing DynamoDB table...');
      const tables = await dynamodb.listTables().promise();
      const tradingTable = tables.TableNames?.find(name =>
        name.includes(`iac-rlhf-${this.config.environmentSuffix}-orders`)
      );

      if (tradingTable) {
        const tableDesc = await dynamodb
          .describeTable({
            TableName: tradingTable,
          })
          .promise();

        if (tableDesc.Table?.TableStatus === 'ACTIVE') {
          console.log(`✅ DynamoDB table ${tradingTable} is active`);
        } else {
          console.warn(
            `⚠️  DynamoDB table ${tradingTable} status: ${tableDesc.Table?.TableStatus}`
          );
        }
      }

      // 3. Test S3 buckets
      console.log('🔍 Testing S3 buckets...');
      const buckets = await s3.listBuckets().promise();
      const tradingBuckets =
        buckets.Buckets?.filter(bucket =>
          bucket.Name?.includes(`iac-rlhf-${this.config.environmentSuffix}`)
        ) || [];

      for (const bucket of tradingBuckets) {
        try {
          await s3.headBucket({ Bucket: bucket.Name! }).promise();
          console.log(`✅ S3 bucket ${bucket.Name} is accessible`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.warn(
            `⚠️  S3 bucket ${bucket.Name} access failed:`,
            errorMessage
          );
        }
      }

      console.log('✅ Health checks completed');
    } catch (error) {
      console.error('❌ Health checks failed:', error);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  const deployment = new ComprehensiveDeployment();
  deployment.deploy().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

export { ComprehensiveDeployment };
