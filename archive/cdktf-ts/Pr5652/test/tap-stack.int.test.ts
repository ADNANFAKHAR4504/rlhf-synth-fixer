import AWS from 'aws-sdk'; // Using AWS SDK v2
import * as fs from 'fs';
import * as path from 'path';

// Conditionally run tests only if the output file exists
const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const cfnOutputsExist = fs.existsSync(outputsFilePath);
const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

// Define the outputs we expect from the stack for testing
interface StackOutputs {
  AlbDnsName: string; // Used for basic check
  AsgName: string;
  DynamoDbTableName: string;
  RecoveryLambdaArn: string;
  CloudWatchAlarmName: string;
  // Add other outputs from tap-stack.ts if needed for more tests
}

// Wrap the entire suite in the conditional describe block
describeIf(cfnOutputsExist)('Multi-AZ Failure Recovery Live Infrastructure Tests', () => {

  let outputs: StackOutputs;
  const region = 'us-east-1'; // Single region for this stack

  // Set a longer timeout for AWS API calls
  jest.setTimeout(600000); // 10 minutes

  // beforeAll runs once to read the output file
  beforeAll(() => {
    try {
      const outputsFile = fs.readFileSync(outputsFilePath, 'utf8');
      const outputsJson = JSON.parse(outputsFile);
      // Assumes the stack name is the top-level key in the outputs file
      const stackName = Object.keys(outputsJson)[0];
      outputs = outputsJson[stackName];

      // Verify all required outputs for these specific tests are present
      if (!outputs || !outputs.AsgName || !outputs.DynamoDbTableName || !outputs.RecoveryLambdaArn || !outputs.CloudWatchAlarmName || !outputs.AlbDnsName) {
        throw new Error(`Required outputs for integration testing are missing from ${outputsFilePath}`);
      }
      console.log("Successfully loaded outputs for integration tests:", outputs);
    } catch (error) {
      console.error("CRITICAL ERROR reading or parsing outputs file:", error);
      process.exit(1);
    }
  });

  // Initialize AWS SDK v2 clients for the single region
  const autoscaling = new AWS.AutoScaling({ region: region });
  const dynamodb = new AWS.DynamoDB({ region: region });
  const lambda = new AWS.Lambda({ region: region });
  const cloudwatch = new AWS.CloudWatch({ region: region });
  const elbv2 = new AWS.ELBv2({ region: region }); // For getting ALB ARN from DNS

  let albArn: string | undefined; // To store the ALB ARN discovered via DNS

  describe('Load Balancer Checks (SDK)', () => {
    it('should find the ALB by DNS name and check its state', async () => {
      console.log(`Checking ALB state using DNS: ${outputs.AlbDnsName}`);
      try {
        // Finding ALB by DNS is indirect; list all ALBs and find the matching DNS
        const lbsResponse = await elbv2.describeLoadBalancers().promise();
        const matchingAlb = lbsResponse.LoadBalancers?.find(lb => lb.DNSName === outputs.AlbDnsName);

        expect(matchingAlb).toBeDefined(); // Check if an ALB with that DNS name exists
        expect(matchingAlb?.State?.Code).toBe('active');
        albArn = matchingAlb?.LoadBalancerArn; // Store ARN for later tests if needed
        console.log(` ALB found with ARN ${albArn} and is active.`);
      } catch (error) {
        console.error(`Error finding or describing ALB: ${error}`);
        throw error;
      }
    });
  });

  describe('Compute Checks (SDK)', () => {
    it('should have the Auto Scaling Group with correct desired capacity', async () => {
      console.log(`Checking ASG: ${outputs.AsgName}`);
      try {
        const response = await autoscaling.describeAutoScalingGroups({ AutoScalingGroupNames: [outputs.AsgName] }).promise();
        expect(response.AutoScalingGroups).toHaveLength(1);
        // Check against the min_healthy_instances from the prompt's config (which is 2)
        expect(response.AutoScalingGroups?.[0]?.DesiredCapacity).toBe(2);
        expect(response.AutoScalingGroups?.[0]?.MinSize).toBe(2);
        console.log(` ASG found with desired capacity of 2.`);
      } catch (error) {
        console.error(`Error describing ASG: ${error}`);
        throw error;
      }
    });
  });

  describe('State Storage Checks (SDK)', () => {
    it('should have created the DynamoDB table', async () => {
      console.log(`Checking DynamoDB table: ${outputs.DynamoDbTableName}`);
      try {
        const response = await dynamodb.describeTable({ TableName: outputs.DynamoDbTableName }).promise();
        expect(response.Table).toBeDefined();
        expect(response.Table?.TableStatus).toBe('ACTIVE');
        console.log(` DynamoDB table ${outputs.DynamoDbTableName} is ACTIVE.`);
      } catch (error) {
        console.error(`Error describing DynamoDB table: ${error}`);
        throw error;
      }
    });
  });

  describe('Recovery Automation Checks (SDK)', () => {
    it('should have created the recovery Lambda function', async () => {
      console.log(`Checking Lambda function: ${outputs.RecoveryLambdaArn}`);
      try {
        // Extract function name from ARN
        const functionName = outputs.RecoveryLambdaArn.split(':').pop();
        expect(functionName).toBeDefined(); // Ensure ARN parsing worked

        const response = await lambda.getFunction({ FunctionName: functionName! }).promise();
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionArn).toBe(outputs.RecoveryLambdaArn);
        expect(response.Configuration?.Runtime).toBe('python3.9');
        console.log(` Lambda function ${functionName} found.`);
      } catch (error) {
        console.error(`Error getting Lambda function: ${error}`);
        throw error;
      }
    });

    it('should have created the CloudWatch alarm targeting the ALB/TargetGroup', async () => {
      console.log(`Checking CloudWatch alarm: ${outputs.CloudWatchAlarmName}`);
      try {
        const response = await cloudwatch.describeAlarms({ AlarmNames: [outputs.CloudWatchAlarmName] }).promise();
        expect(response.MetricAlarms).toHaveLength(1);
        const alarm = response.MetricAlarms?.[0];
        expect(alarm).toBeDefined();
        expect(alarm?.Namespace).toBe('AWS/ApplicationELB');
        expect(alarm?.MetricName).toBe('HealthyHostCount');
        // Verify dimensions point to the correct ALB/TG (requires ALB ARN from previous test)
        expect(albArn).toBeDefined(); // Ensure ALB ARN was found
        const albDimension = alarm?.Dimensions?.find(d => d.Name === 'LoadBalancer');
        const tgDimension = alarm?.Dimensions?.find(d => d.Name === 'TargetGroup');
        // Note: Dimension values are suffixes (e.g., app/alb-name/id, targetgroup/tg-name/id)
        expect(albDimension?.Value).toContain(albArn?.split('/')[1]); // Check if ALB suffix matches
        expect(tgDimension).toBeDefined(); // Check if TG dimension exists
        console.log(` CloudWatch alarm ${outputs.CloudWatchAlarmName} found and configured.`);

      } catch (error) {
        console.error(`Error describing CloudWatch alarm: ${error}`);
        throw error;
      }
    });
  });

  // Add non-SDK output format checks if desired
  describe('Output Format Checks (Non-SDK)', () => {
    it('should have a valid ALB DNS name', () => {
      expect(outputs.AlbDnsName).toContain('elb.amazonaws.com');
      console.log(` ALB DNS format is valid.`);
    });
  });

});