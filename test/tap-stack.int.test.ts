import fs from 'fs';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand,
  SimulatePrincipalPolicyCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  STSClient,
  AssumeRoleCommand,
  GetCallerIdentityCommand,
} from '@aws-sdk/client-sts';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  DescribeLogGroupsCommand,
  DeleteLogGroupCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SSMClient,
  GetParameterCommand,
  GetParametersCommand,
  PutParameterCommand,
  DeleteParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  LambdaClient,
  CreateFunctionCommand,
  InvokeCommand,
  DeleteFunctionCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  TerminateInstancesCommand,
  CreateSecurityGroupCommand,
  DeleteSecurityGroupCommand,
} from '@aws-sdk/client-ec2';

// Configuration - These are coming from cfn-outputs after deployment
let outputs: any = {};
let stackName: string;
let region: string;

// AWS clients
const cloudFormationClient = new CloudFormationClient({ region: process.env.AWS_REGION || 'us-east-1' });
const iamClient = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const stsClient = new STSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

beforeAll(async () => {
  // Ensure outputs file exists and read stack outputs
  const outputsPath = 'cfn-outputs/flat-outputs.json';
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Outputs file not found at ${outputsPath}. Ensure stack is deployed before running integration tests.`);
  }
  
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  stackName = `TapStack${environmentSuffix}`;
  region = process.env.AWS_REGION || 'us-east-1';
  
  // Verify required outputs exist
  const requiredOutputs = [
    'EC2ApplicationRoleARN',
    'LambdaExecutionRoleARN', 
    'PermissionBoundaryPolicyARN'
  ];
  
  requiredOutputs.forEach(output => {
    if (!outputs[output]) {
      throw new Error(`Required output ${output} not found in flat-outputs.json`);
    }
  });
}, 30000);

describe('Least-Privilege IAM Design - Integration Test Scenarios', () => {
  // 1. Deployment and Resource Verification
  describe('1. Deployment and Resource Verification', () => {
    test('1.1: CloudFormation Stack Deployment', async () => {
      // Verify stack exists and is in CREATE_COMPLETE state
      const stackResponse = await cloudFormationClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      
      expect(stackResponse.Stacks).toHaveLength(1);
      const stack = stackResponse.Stacks![0];
      expect(stack.StackStatus).toBe('CREATE_COMPLETE');
      
      // Verify all required resources are created
      const resourcesResponse = await cloudFormationClient.send(
        new ListStackResourcesCommand({ StackName: stackName })
      );
      
      const resources = resourcesResponse.StackResourceSummaries || [];
      const resourceTypes = resources.map(r => r.ResourceType);
      
      expect(resourceTypes).toContain('AWS::IAM::ManagedPolicy');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resources.filter(r => r.ResourceType === 'AWS::IAM::Role')).toHaveLength(2);
      
      // Verify outputs contain correct ARNs
      expect(outputs.EC2ApplicationRoleARN).toMatch(/^arn:aws:iam::[0-9]+:role\//);
      expect(outputs.LambdaExecutionRoleARN).toMatch(/^arn:aws:iam::[0-9]+:role\//);
      expect(outputs.PermissionBoundaryPolicyARN).toMatch(/^arn:aws:iam::[0-9]+:policy\//);
    }, 30000);

    test('1.2: Resource Naming and Tagging Verification', async () => {
      // Get resource details from CloudFormation
      const resourcesResponse = await cloudFormationClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      
      const resources = resourcesResponse.StackResources || [];
      
      // Verify EC2ApplicationRole tags
      const ec2Role = resources.find(r => r.LogicalResourceId === 'EC2ApplicationRole');
      expect(ec2Role).toBeDefined();
      
      const ec2RoleDetails = await iamClient.send(
        new GetRoleCommand({ RoleName: ec2Role!.PhysicalResourceId! })
      );
      
      const ec2Tags = ec2RoleDetails.Role!.Tags || [];
      expect(ec2Tags.find(t => t.Key === 'Name' && t.Value!.includes('EC2ApplicationRole'))).toBeDefined();
      expect(ec2Tags.find(t => t.Key === 'Purpose' && t.Value === 'Application')).toBeDefined();
      expect(ec2Tags.find(t => t.Key === 'SecurityCompliance' && t.Value === 'LeastPrivilege')).toBeDefined();
      
      // Verify LambdaExecutionRole tags
      const lambdaRole = resources.find(r => r.LogicalResourceId === 'LambdaExecutionRole');
      expect(lambdaRole).toBeDefined();
      
      const lambdaRoleDetails = await iamClient.send(
        new GetRoleCommand({ RoleName: lambdaRole!.PhysicalResourceId! })
      );
      
      const lambdaTags = lambdaRoleDetails.Role!.Tags || [];
      expect(lambdaTags.find(t => t.Key === 'Name' && t.Value!.includes('LambdaExecutionRole'))).toBeDefined();
      expect(lambdaTags.find(t => t.Key === 'Purpose' && t.Value === 'Serverless')).toBeDefined();
      expect(lambdaTags.find(t => t.Key === 'SecurityCompliance' && t.Value === 'LeastPrivilege')).toBeDefined();
      
      // Verify role paths are set to '/'
      expect(ec2RoleDetails.Role!.Path).toBe('/');
      expect(lambdaRoleDetails.Role!.Path).toBe('/');
    }, 30000);
  });

  // 2. Permission Boundary Tests
  describe('2. Permission Boundary Tests', () => {
    test('2.1: Permission Boundary Enforcement', async () => {
      // Get permission boundary policy document
      const boundaryPolicyArn = outputs.PermissionBoundaryPolicyARN;
      const policyResponse = await iamClient.send(
        new GetPolicyCommand({ PolicyArn: boundaryPolicyArn })
      );
      
      expect(policyResponse.Policy).toBeDefined();
      expect(policyResponse.Policy!.PolicyName).toMatch(/PermissionBoundary/);
      
      // Verify boundary is attached to both roles
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      const lambdaRoleArn = outputs.LambdaExecutionRoleARN;
      
      const ec2RoleName = ec2RoleArn.split('/').pop()!;
      const lambdaRoleName = lambdaRoleArn.split('/').pop()!;
      
      const ec2RoleDetails = await iamClient.send(
        new GetRoleCommand({ RoleName: ec2RoleName })
      );
      const lambdaRoleDetails = await iamClient.send(
        new GetRoleCommand({ RoleName: lambdaRoleName })
      );
      
      expect(ec2RoleDetails.Role!.PermissionsBoundary?.PermissionsBoundaryArn).toBe(boundaryPolicyArn);
      expect(lambdaRoleDetails.Role!.PermissionsBoundary?.PermissionsBoundaryArn).toBe(boundaryPolicyArn);
      
      // Test privilege escalation prevention using policy simulation
      const deniedActions = ['iam:CreateRole', 'iam:CreateUser', 'iam:CreatePolicy', 'organizations:CreateAccount'];
      
      for (const action of deniedActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [action],
            ResourceArns: ['*'],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('implicitDeny' || 'explicitDeny');
      }
    }, 45000);

    test('2.2: Permission Boundary Scope Validation', async () => {
      // Use policy simulation to verify boundary allows only specified actions
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      
      // Test allowed actions
      const allowedActions = [
        'logs:CreateLogGroup',
        's3:GetObject', 
        'dynamodb:GetItem',
        'ssm:GetParameter'
      ];
      
      for (const action of allowedActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [action],
            ResourceArns: [`arn:aws:logs:${region}:*:log-group:/aws/ec2/*`],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        // Should be allowed or at least not explicitly denied by boundary
        expect(evaluation.EvalDecision).not.toBe('explicitDeny');
      }
      
      // Test that boundary doesn't allow overly permissive actions
      const restrictedActions = ['iam:*', 'sts:*', 'organizations:*'];
      
      for (const action of restrictedActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [action],
            ResourceArns: ['*'],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('explicitDeny');
      }
    }, 45000);
  });

  // 3. EC2 Application Role Tests
  describe('3. EC2 Application Role Tests', () => {
    test('3.1: EC2 Role Trust Relationship', async () => {
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      const roleName = ec2RoleArn.split('/').pop()!;
      
      // Verify trust policy allows EC2 service
      const roleDetails = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      
      const trustPolicy = JSON.parse(decodeURIComponent(roleDetails.Role!.AssumeRolePolicyDocument!));
      const trustStatement = trustPolicy.Statement[0];
      
      expect(trustStatement.Effect).toBe('Allow');
      expect(trustStatement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(trustStatement.Action).toBe('sts:AssumeRole');
      
      // Test policy simulation for EC2 assume role
      const simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: 'arn:aws:iam::aws:root',
          ActionNames: ['sts:AssumeRole'],
          ResourceArns: [ec2RoleArn],
          CallerArn: 'arn:aws:sts::123456789012:assumed-role/ec2-instance-role/i-1234567890abcdef0'
        })
      );
      
      const evaluation = simulationResponse.EvaluationResults![0];
      expect(evaluation.EvalDecision).not.toBe('explicitDeny');
    }, 30000);

    test('3.2: EC2 Role CloudWatch Logs Access', async () => {
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      
      // Test allowed CloudWatch Logs operations
      const allowedLogActions = [
        'logs:CreateLogGroup',
        'logs:CreateLogStream', 
        'logs:PutLogEvents'
      ];
      
      const allowedLogResource = `arn:aws:logs:${region}:*:log-group:/aws/ec2/*`;
      
      for (const action of allowedLogActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [action],
            ResourceArns: [allowedLogResource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed');
      }
      
      // Test denied operations on non-allowed paths
      const deniedLogResource = `arn:aws:logs:${region}:*:log-group:/aws/lambda/*`;
      
      const simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: ec2RoleArn,
          ActionNames: ['logs:CreateLogGroup'],
          ResourceArns: [deniedLogResource],
        })
      );
      
      const evaluation = simulationResponse.EvaluationResults![0];
      expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
    }, 30000);

    test('3.3: EC2 Role S3 Read-Only Access', async () => {
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      
      // Test allowed S3 read operations
      const allowedS3Resource = `arn:aws:s3:::app-config-${stackName}-*`;
      const readActions = ['s3:GetObject', 's3:ListBucket'];
      
      for (const action of readActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [action],
            ResourceArns: [allowedS3Resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed');
      }
      
      // Test denied write operations
      const writeActions = ['s3:PutObject', 's3:DeleteObject'];
      
      for (const action of writeActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [action],
            ResourceArns: [allowedS3Resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
      }
      
      // Test access to non-allowed bucket
      const deniedS3Resource = 'arn:aws:s3:::lambda-data-*';
      const simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: ec2RoleArn,
          ActionNames: ['s3:GetObject'],
          ResourceArns: [deniedS3Resource],
        })
      );
      
      const evaluation = simulationResponse.EvaluationResults![0];
      expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
    }, 30000);

    test('3.4: EC2 Role DynamoDB Read-Only Access', async () => {
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      
      // Test allowed DynamoDB read operations
      const allowedDynamoResource = `arn:aws:dynamodb:${region}:*:table/AppTable-${stackName}`;
      const readActions = ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'];
      
      for (const action of readActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [action],
            ResourceArns: [allowedDynamoResource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed');
      }
      
      // Test denied write operations
      const writeActions = ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem'];
      
      for (const action of writeActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [action],
            ResourceArns: [allowedDynamoResource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
      }
      
      // Test access to non-allowed table
      const deniedDynamoResource = `arn:aws:dynamodb:${region}:*:table/LambdaTable-${stackName}`;
      const simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: ec2RoleArn,
          ActionNames: ['dynamodb:GetItem'],
          ResourceArns: [deniedDynamoResource],
        })
      );
      
      const evaluation = simulationResponse.EvaluationResults![0];
      expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
    }, 30000);

    test('3.5: EC2 Role SSM Parameter Access', async () => {
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      
      // Test allowed SSM parameter operations
      const allowedSSMResource = `arn:aws:ssm:${region}:*:parameter/app/${stackName}/*`;
      const readActions = ['ssm:GetParameter', 'ssm:GetParameters'];
      
      for (const action of readActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [action],
            ResourceArns: [allowedSSMResource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed');
      }
      
      // Test denied write operations (read-only access)
      const simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: ec2RoleArn,
          ActionNames: ['ssm:PutParameter'],
          ResourceArns: [allowedSSMResource],
        })
      );
      
      const evaluation = simulationResponse.EvaluationResults![0];
      expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
      
      // Test access to non-allowed parameter path
      const deniedSSMResource = `arn:aws:ssm:${region}:*:parameter/lambda/*`;
      const deniedResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: ec2RoleArn,
          ActionNames: ['ssm:GetParameter'],
          ResourceArns: [deniedSSMResource],
        })
      );
      
      const deniedEvaluation = deniedResponse.EvaluationResults![0];
      expect(['implicitDeny', 'explicitDeny']).toContain(deniedEvaluation.EvalDecision);
    }, 30000);
  });

  // 4. Lambda Execution Role Tests
  describe('4. Lambda Execution Role Tests', () => {
    test('4.1: Lambda Role Trust Relationship', async () => {
      const lambdaRoleArn = outputs.LambdaExecutionRoleARN;
      const roleName = lambdaRoleArn.split('/').pop()!;
      
      // Verify trust policy allows Lambda service
      const roleDetails = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      
      const trustPolicy = JSON.parse(decodeURIComponent(roleDetails.Role!.AssumeRolePolicyDocument!));
      const trustStatement = trustPolicy.Statement[0];
      
      expect(trustStatement.Effect).toBe('Allow');
      expect(trustStatement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustStatement.Action).toBe('sts:AssumeRole');
      
      // Verify Lambda can assume this role (simulation)
      const simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: 'arn:aws:iam::aws:root',
          ActionNames: ['sts:AssumeRole'],
          ResourceArns: [lambdaRoleArn],
          CallerArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function'
        })
      );
      
      const evaluation = simulationResponse.EvaluationResults![0];
      expect(evaluation.EvalDecision).not.toBe('explicitDeny');
    }, 30000);

    test('4.2: Lambda Role CloudWatch Logs Access', async () => {
      const lambdaRoleArn = outputs.LambdaExecutionRoleARN;
      
      // Test allowed CloudWatch Logs operations for Lambda
      const allowedLogActions = [
        'logs:CreateLogGroup',
        'logs:CreateLogStream', 
        'logs:PutLogEvents'
      ];
      
      const allowedLogResource = `arn:aws:logs:${region}:*:log-group:/aws/lambda/*`;
      
      for (const action of allowedLogActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [action],
            ResourceArns: [allowedLogResource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed');
      }
      
      // Test denied operations on non-allowed paths (EC2 log paths)
      const deniedLogResource = `arn:aws:logs:${region}:*:log-group:/aws/ec2/*`;
      
      const simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: lambdaRoleArn,
          ActionNames: ['logs:CreateLogGroup'],
          ResourceArns: [deniedLogResource],
        })
      );
      
      const evaluation = simulationResponse.EvaluationResults![0];
      expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
    }, 30000);

    test('4.3: Lambda Role DynamoDB Access', async () => {
      const lambdaRoleArn = outputs.LambdaExecutionRoleARN;
      
      // Test allowed DynamoDB operations (full CRUD)
      const allowedDynamoResource = `arn:aws:dynamodb:${region}:*:table/LambdaTable-${stackName}`;
      const crudActions = [
        'dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 
        'dynamodb:DeleteItem', 'dynamodb:Query', 'dynamodb:Scan'
      ];
      
      for (const action of crudActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [action],
            ResourceArns: [allowedDynamoResource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed');
      }
      
      // Test access to non-allowed table (EC2 table)
      const deniedDynamoResource = `arn:aws:dynamodb:${region}:*:table/AppTable-${stackName}`;
      
      for (const action of crudActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [action],
            ResourceArns: [deniedDynamoResource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
      }
    }, 30000);

    test('4.4: Lambda Role S3 Access', async () => {
      const lambdaRoleArn = outputs.LambdaExecutionRoleARN;
      
      // Test allowed S3 operations (read/write)
      const allowedS3Resource = `arn:aws:s3:::lambda-data-${stackName}-*`;
      const s3Actions = ['s3:GetObject', 's3:PutObject'];
      
      for (const action of s3Actions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [action],
            ResourceArns: [allowedS3Resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed');
      }
      
      // Test access to non-allowed bucket (EC2 bucket)
      const deniedS3Resource = `arn:aws:s3:::app-config-${stackName}-*`;
      
      for (const action of s3Actions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [action],
            ResourceArns: [deniedS3Resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
      }
    }, 30000);
  });

  // 5. Policy Strictness Tests
  describe('5. Policy Strictness Tests', () => {
    test('5.1: No Privilege Escalation', async () => {
      const roles = [outputs.EC2ApplicationRoleARN, outputs.LambdaExecutionRoleARN];
      
      // Test privilege escalation attempts for both roles
      for (const roleArn of roles) {
        const privilegeEscalationActions = [
          'iam:CreateUser',
          'iam:CreateRole', 
          'iam:CreatePolicy',
          'iam:AttachUserPolicy',
          'iam:AttachRolePolicy',
          'iam:PutUserPolicy',
          'iam:PutRolePolicy',
          'iam:DetachRolePolicy',
          'iam:DeleteRolePermissionsBoundary',
          'sts:AssumeRole',
          'organizations:CreateAccount'
        ];
        
        for (const action of privilegeEscalationActions) {
          const simulationResponse = await iamClient.send(
            new SimulatePrincipalPolicyCommand({
              PolicySourceArn: roleArn,
              ActionNames: [action],
              ResourceArns: ['*'],
            })
          );
          
          const evaluation = simulationResponse.EvaluationResults![0];
          expect(evaluation.EvalDecision).toBe('explicitDeny');
        }
      }
    }, 45000);

    test('5.2: Resource-Specific Permission Enforcement', async () => {
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      const lambdaRoleArn = outputs.LambdaExecutionRoleARN;
      
      // Test EC2 role can only access app-config bucket, not lambda-data bucket
      const ec2AllowedS3 = `arn:aws:s3:::app-config-${stackName}-*/*`;
      const ec2DeniedS3 = `arn:aws:s3:::lambda-data-${stackName}-*/*`;
      
      // EC2 role should access app-config bucket
      let simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: ec2RoleArn,
          ActionNames: ['s3:GetObject'],
          ResourceArns: [ec2AllowedS3],
        })
      );
      expect(simulationResponse.EvaluationResults![0].EvalDecision).toBe('allowed');
      
      // EC2 role should NOT access lambda-data bucket
      simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: ec2RoleArn,
          ActionNames: ['s3:GetObject'],
          ResourceArns: [ec2DeniedS3],
        })
      );
      expect(['implicitDeny', 'explicitDeny']).toContain(simulationResponse.EvaluationResults![0].EvalDecision);
      
      // Test DynamoDB table access isolation
      const ec2AllowedDynamo = `arn:aws:dynamodb:${region}:*:table/AppTable-${stackName}`;
      const ec2DeniedDynamo = `arn:aws:dynamodb:${region}:*:table/LambdaTable-${stackName}`;
      
      // EC2 role should access AppTable
      simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: ec2RoleArn,
          ActionNames: ['dynamodb:GetItem'],
          ResourceArns: [ec2AllowedDynamo],
        })
      );
      expect(simulationResponse.EvaluationResults![0].EvalDecision).toBe('allowed');
      
      // EC2 role should NOT access LambdaTable
      simulationResponse = await iamClient.send(
        new SimulatePrincipalPolicyCommand({
          PolicySourceArn: ec2RoleArn,
          ActionNames: ['dynamodb:GetItem'],
          ResourceArns: [ec2DeniedDynamo],
        })
      );
      expect(['implicitDeny', 'explicitDeny']).toContain(simulationResponse.EvaluationResults![0].EvalDecision);
    }, 30000);

    test('5.3: Action-Specific Permission Enforcement', async () => {
      // Test that only explicitly allowed actions are permitted
      const testCases = [
        {
          role: outputs.EC2ApplicationRoleARN,
          allowedActions: ['s3:GetObject', 's3:ListBucket', 'dynamodb:GetItem', 'dynamodb:Query'],
          deniedActions: ['s3:PutObject', 's3:DeleteObject', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
          resource: `arn:aws:s3:::app-config-${stackName}-*`
        },
        {
          role: outputs.LambdaExecutionRoleARN,
          allowedActions: ['s3:GetObject', 's3:PutObject', 'dynamodb:GetItem', 'dynamodb:PutItem'],
          deniedActions: ['s3:DeleteBucket', 'dynamodb:CreateTable', 'dynamodb:DeleteTable'],
          resource: `arn:aws:s3:::lambda-data-${stackName}-*`
        }
      ];
      
      for (const testCase of testCases) {
        // Test allowed actions
        for (const action of testCase.allowedActions) {
          const simulationResponse = await iamClient.send(
            new SimulatePrincipalPolicyCommand({
              PolicySourceArn: testCase.role,
              ActionNames: [action],
              ResourceArns: [testCase.resource],
            })
          );
          
          const evaluation = simulationResponse.EvaluationResults![0];
          expect(evaluation.EvalDecision).toBe('allowed');
        }
        
        // Test denied actions
        for (const action of testCase.deniedActions) {
          const simulationResponse = await iamClient.send(
            new SimulatePrincipalPolicyCommand({
              PolicySourceArn: testCase.role,
              ActionNames: [action],
              ResourceArns: [testCase.resource],
            })
          );
          
          const evaluation = simulationResponse.EvaluationResults![0];
          expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
        }
      }
    }, 45000);
  });

  // 6. Wildcard Absence Tests
  describe('6. Wildcard Absence Tests', () => {
    test('6.1: Resource Wildcard Absence', async () => {
      // Get all IAM policies from deployed resources
      const stackResources = await cloudFormationClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      
      const policies = [];
      
      // Get permission boundary policy
      const boundaryPolicy = await iamClient.send(
        new GetPolicyCommand({ PolicyArn: outputs.PermissionBoundaryPolicyARN })
      );
      
      // Get the policy version document
      const boundaryPolicyVersion = await iamClient.send(
        new GetPolicyCommand({ 
          PolicyArn: outputs.PermissionBoundaryPolicyARN,
          // Get the default version
        })
      );
      
      // Get inline policies from roles
      const roles = stackResources.StackResources?.filter(r => r.ResourceType === 'AWS::IAM::Role') || [];
      
      for (const role of roles) {
        const roleName = role.PhysicalResourceId!;
        const roleDetails = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        
        // Get inline policies
        if (roleDetails.Role?.RolePolicyList) {
          for (const policyName of roleDetails.Role.RolePolicyList) {
            const inlinePolicy = await iamClient.send(
              new GetRolePolicyCommand({ RoleName: roleName, PolicyName: policyName })
            );
            
            const policyDoc = JSON.parse(decodeURIComponent(inlinePolicy.PolicyDocument!));
            policies.push(policyDoc);
          }
        }
      }
      
      // Check all policies for wildcard usage
      policies.forEach(policy => {
        policy.Statement.forEach((statement: any) => {
          if (statement.Effect === 'Allow') {
            // Resource should not be standalone wildcard
            if (Array.isArray(statement.Resource)) {
              statement.Resource.forEach((resource: any) => {
                expect(resource).not.toBe('*');
              });
            } else if (statement.Resource) {
              expect(statement.Resource).not.toBe('*');
            }
          }
        });
      });
    }, 30000);

    test('6.2: Action Wildcard Absence', async () => {
      // Get role policies and check for service-level wildcards
      const stackResources = await cloudFormationClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      
      const roles = stackResources.StackResources?.filter(r => r.ResourceType === 'AWS::IAM::Role') || [];
      
      for (const role of roles) {
        const roleName = role.PhysicalResourceId!;
        const roleDetails = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        
        // Get inline policies
        if (roleDetails.Role?.RolePolicyList) {
          for (const policyName of roleDetails.Role.RolePolicyList) {
            const inlinePolicy = await iamClient.send(
              new GetRolePolicyCommand({ RoleName: roleName, PolicyName: policyName })
            );
            
            const policyDoc = JSON.parse(decodeURIComponent(inlinePolicy.PolicyDocument!));
            
            policyDoc.Statement.forEach((statement: any) => {
              if (statement.Effect === 'Allow' && statement.Action) {
                const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
                
                actions.forEach((action: string) => {
                  // Should not have service-level wildcards like 's3:*', 'dynamodb:*'
                  const serviceWildcardPattern = /^[a-zA-Z0-9-]+:\*$/;
                  expect(action).not.toMatch(serviceWildcardPattern);
                });
              }
            });
          }
        }
      }
    }, 30000);
  });

  // 7. Cross-Role Security Tests
  describe('7. Cross-Role Security Tests', () => {
    test('7.1: Role Isolation', async () => {
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      const lambdaRoleArn = outputs.LambdaExecutionRoleARN;
      
      // Test that EC2 role cannot access Lambda-specific resources
      const lambdaSpecificResources = [
        `arn:aws:s3:::lambda-data-${stackName}-*/*`,
        `arn:aws:dynamodb:${region}:*:table/LambdaTable-${stackName}`,
        `arn:aws:logs:${region}:*:log-group:/aws/lambda/*`
      ];
      
      const lambdaSpecificActions = [
        's3:PutObject',
        'dynamodb:PutItem',
        'logs:CreateLogGroup'
      ];
      
      for (let i = 0; i < lambdaSpecificResources.length; i++) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [lambdaSpecificActions[i]],
            ResourceArns: [lambdaSpecificResources[i]],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
      }
      
      // Test that Lambda role cannot access EC2-specific resources inappropriately
      const ec2SpecificResources = [
        `arn:aws:s3:::app-config-${stackName}-*/*`,
        `arn:aws:dynamodb:${region}:*:table/AppTable-${stackName}`,
        `arn:aws:logs:${region}:*:log-group:/aws/ec2/*`
      ];
      
      const ec2SpecificActions = [
        's3:GetObject',
        'dynamodb:GetItem', 
        'logs:CreateLogGroup'
      ];
      
      for (let i = 0; i < ec2SpecificResources.length; i++) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [ec2SpecificActions[i]],
            ResourceArns: [ec2SpecificResources[i]],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
      }
    }, 30000);

    test('7.2: Permission Boundary Override Test', async () => {
      // Test that permission boundary cannot be overridden by role policies
      const roles = [outputs.EC2ApplicationRoleARN, outputs.LambdaExecutionRoleARN];
      
      // Actions explicitly denied by permission boundary
      const boundaryDeniedActions = [
        'iam:CreateRole',
        'iam:CreateUser',
        'iam:DeleteRole',
        'iam:DetachRolePolicy',
        'iam:DeleteRolePermissionsBoundary',
        'sts:AssumeRoleWithWebIdentity',
        'organizations:CreateAccount'
      ];
      
      for (const roleArn of roles) {
        for (const action of boundaryDeniedActions) {
          // Even if role policy would allow it, boundary should deny
          const simulationResponse = await iamClient.send(
            new SimulatePrincipalPolicyCommand({
              PolicySourceArn: roleArn,
              ActionNames: [action],
              ResourceArns: ['*'],
            })
          );
          
          const evaluation = simulationResponse.EvaluationResults![0];
          // Permission boundary enforces explicit deny
          expect(evaluation.EvalDecision).toBe('explicitDeny');
        }
      }
      
      // Verify that role policies cannot grant permissions beyond boundary scope
      const crossServiceActions = [
        'rds:CreateDBInstance',
        'ec2:RunInstances',
        'lambda:CreateFunction',
        'apigateway:CreateRestApi'
      ];
      
      for (const roleArn of roles) {
        for (const action of crossServiceActions) {
          const simulationResponse = await iamClient.send(
            new SimulatePrincipalPolicyCommand({
              PolicySourceArn: roleArn,
              ActionNames: [action],
              ResourceArns: ['*'],
            })
          );
          
          const evaluation = simulationResponse.EvaluationResults![0];
          // Should be denied (either implicit or explicit)
          expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision);
        }
      }
    }, 30000);
  });

  // 8. Real-World Workflow Tests
  describe('8. Real-World Workflow Tests', () => {
    test('8.1: EC2 Application Workflow', async () => {
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      
      // Simulate a typical EC2 application workflow
      const workflowActions = [
        {
          action: 's3:GetObject',
          resource: `arn:aws:s3:::app-config-${stackName}-*/config.json`,
          description: 'Read configuration from S3'
        },
        {
          action: 'dynamodb:Query',
          resource: `arn:aws:dynamodb:${region}:*:table/AppTable-${stackName}`,
          description: 'Query application data from DynamoDB'
        },
        {
          action: 'logs:PutLogEvents',
          resource: `arn:aws:logs:${region}:*:log-group:/aws/ec2/app:*`,
          description: 'Write application logs to CloudWatch'
        },
        {
          action: 'ssm:GetParameter',
          resource: `arn:aws:ssm:${region}:*:parameter/app/${stackName}/database-url`,
          description: 'Get database URL from SSM Parameter Store'
        }
      ];
      
      // Test each step of the workflow
      for (const step of workflowActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [step.action],
            ResourceArns: [step.resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed', 
          `Failed workflow step: ${step.description} (${step.action} on ${step.resource})`);
      }
      
      // Verify that operations outside the scope fail
      const unauthorizedOperations = [
        {
          action: 's3:PutObject',
          resource: `arn:aws:s3:::app-config-${stackName}-*/config.json`,
          description: 'Attempt to write configuration to S3 (should be read-only)'
        },
        {
          action: 'dynamodb:PutItem',
          resource: `arn:aws:dynamodb:${region}:*:table/AppTable-${stackName}`,
          description: 'Attempt to write data to DynamoDB (should be read-only)'
        }
      ];
      
      for (const operation of unauthorizedOperations) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [operation.action],
            ResourceArns: [operation.resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision, 
          `Unauthorized operation should be denied: ${operation.description}`);
      }
    }, 30000);

    test('8.2: Lambda Function Workflow', async () => {
      const lambdaRoleArn = outputs.LambdaExecutionRoleARN;
      
      // Simulate a typical Lambda function workflow
      const workflowActions = [
        {
          action: 's3:GetObject',
          resource: `arn:aws:s3:::lambda-data-${stackName}-*/input-data.json`,
          description: 'Read input data from S3'
        },
        {
          action: 'dynamodb:GetItem',
          resource: `arn:aws:dynamodb:${region}:*:table/LambdaTable-${stackName}`,
          description: 'Read existing data from DynamoDB'
        },
        {
          action: 'dynamodb:PutItem',
          resource: `arn:aws:dynamodb:${region}:*:table/LambdaTable-${stackName}`,
          description: 'Write processed data to DynamoDB'
        },
        {
          action: 's3:PutObject',
          resource: `arn:aws:s3:::lambda-data-${stackName}-*/output-data.json`,
          description: 'Write results to S3'
        },
        {
          action: 'logs:PutLogEvents',
          resource: `arn:aws:logs:${region}:*:log-group:/aws/lambda/my-function:*`,
          description: 'Write Lambda logs to CloudWatch'
        }
      ];
      
      // Test each step of the Lambda workflow
      for (const step of workflowActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [step.action],
            ResourceArns: [step.resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed', 
          `Failed workflow step: ${step.description} (${step.action} on ${step.resource})`);
      }
      
      // Verify Lambda cannot access EC2 resources
      const unauthorizedOperations = [
        {
          action: 's3:GetObject',
          resource: `arn:aws:s3:::app-config-${stackName}-*/config.json`,
          description: 'Attempt to access EC2 S3 bucket'
        },
        {
          action: 'dynamodb:GetItem',
          resource: `arn:aws:dynamodb:${region}:*:table/AppTable-${stackName}`,
          description: 'Attempt to access EC2 DynamoDB table'
        }
      ];
      
      for (const operation of unauthorizedOperations) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [operation.action],
            ResourceArns: [operation.resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision, 
          `Cross-role access should be denied: ${operation.description}`);
      }
    }, 30000);

    test('8.3: End-to-End Integration Workflow', async () => {
      const ec2RoleArn = outputs.EC2ApplicationRoleARN;
      const lambdaRoleArn = outputs.LambdaExecutionRoleARN;
      
      // Simulate end-to-end workflow where EC2 triggers processing and Lambda processes data
      
      // Step 1: EC2 application reads configuration and prepares data
      const ec2WorkflowSteps = [
        {
          action: 's3:GetObject',
          resource: `arn:aws:s3:::app-config-${stackName}-*/processing-config.json`,
          description: 'EC2 reads processing configuration'
        },
        {
          action: 'dynamodb:Query',
          resource: `arn:aws:dynamodb:${region}:*:table/AppTable-${stackName}`,
          description: 'EC2 queries data to be processed'
        },
        {
          action: 'logs:PutLogEvents',
          resource: `arn:aws:logs:${region}:*:log-group:/aws/ec2/processor:*`,
          description: 'EC2 logs workflow initiation'
        }
      ];
      
      // Test EC2 workflow steps
      for (const step of ec2WorkflowSteps) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [step.action],
            ResourceArns: [step.resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed', 
          `EC2 workflow step failed: ${step.description}`);
      }
      
      // Step 2: Lambda processes data and stores results
      const lambdaWorkflowSteps = [
        {
          action: 'dynamodb:GetItem',
          resource: `arn:aws:dynamodb:${region}:*:table/LambdaTable-${stackName}`,
          description: 'Lambda reads processing queue'
        },
        {
          action: 's3:GetObject',
          resource: `arn:aws:s3:::lambda-data-${stackName}-*/raw-data.json`,
          description: 'Lambda reads raw data'
        },
        {
          action: 'dynamodb:PutItem',
          resource: `arn:aws:dynamodb:${region}:*:table/LambdaTable-${stackName}`,
          description: 'Lambda writes processed results'
        },
        {
          action: 's3:PutObject',
          resource: `arn:aws:s3:::lambda-data-${stackName}-*/processed-data.json`,
          description: 'Lambda stores processed data'
        }
      ];
      
      // Test Lambda workflow steps
      for (const step of lambdaWorkflowSteps) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [step.action],
            ResourceArns: [step.resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(evaluation.EvalDecision).toBe('allowed', 
          `Lambda workflow step failed: ${step.description}`);
      }
      
      // Step 3: Verify proper isolation - each component operates within boundaries
      
      // EC2 should NOT be able to modify Lambda's processing data
      const ec2ProhibitedActions = [
        {
          action: 's3:PutObject',
          resource: `arn:aws:s3:::lambda-data-${stackName}-*/processed-data.json`,
          description: 'EC2 should not modify Lambda processing results'
        },
        {
          action: 'dynamodb:PutItem',
          resource: `arn:aws:dynamodb:${region}:*:table/LambdaTable-${stackName}`,
          description: 'EC2 should not write to Lambda processing table'
        }
      ];
      
      for (const prohibition of ec2ProhibitedActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: ec2RoleArn,
            ActionNames: [prohibition.action],
            ResourceArns: [prohibition.resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision, 
          `Cross-service access should be denied: ${prohibition.description}`);
      }
      
      // Lambda should NOT be able to read EC2's configuration data
      const lambdaProhibitedActions = [
        {
          action: 's3:GetObject',
          resource: `arn:aws:s3:::app-config-${stackName}-*/processing-config.json`,
          description: 'Lambda should not read EC2 configuration'
        },
        {
          action: 'dynamodb:GetItem',
          resource: `arn:aws:dynamodb:${region}:*:table/AppTable-${stackName}`,
          description: 'Lambda should not read EC2 application data'
        }
      ];
      
      for (const prohibition of lambdaProhibitedActions) {
        const simulationResponse = await iamClient.send(
          new SimulatePrincipalPolicyCommand({
            PolicySourceArn: lambdaRoleArn,
            ActionNames: [prohibition.action],
            ResourceArns: [prohibition.resource],
          })
        );
        
        const evaluation = simulationResponse.EvaluationResults![0];
        expect(['implicitDeny', 'explicitDeny']).toContain(evaluation.EvalDecision, 
          `Cross-service access should be denied: ${prohibition.description}`);
      }
    }, 45000);
  });
});
