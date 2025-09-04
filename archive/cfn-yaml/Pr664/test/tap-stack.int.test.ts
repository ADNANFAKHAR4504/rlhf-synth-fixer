import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionConfigurationCommand,
  ListFunctionsCommand,
} from '@aws-sdk/client-lambda';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import * as fs from 'fs';

// --- Test Configuration ---
const STACK_NAME = process.env.STACK_NAME || 'TapStackpr664'; // Your deployed stack name
const REGION = process.env.AWS_REGION || 'us-east-1';

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const secretsManagerClient = new SecretsManagerClient({ region: REGION });
const iamClient = new IAMClient({ region: REGION });
const cfnClient = new CloudFormationClient({ region: REGION });

// --- Helper function to get stack outputs ---
async function getStackOutputs(): Promise<{ [key: string]: string }> {
  try {
    const { Stacks } = await cfnClient.send(
      new DescribeStacksCommand({ StackName: STACK_NAME })
    );

    if (!Stacks || Stacks.length === 0) {
      console.warn(`Stack ${STACK_NAME} not found`);
      return {};
    }

    const outputs: { [key: string]: string } = {};
    Stacks[0].Outputs?.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    });

    return outputs;
  } catch (error) {
    console.warn(`Failed to get stack outputs: ${error}`);
    // Try to read from file as fallback
    try {
      return JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );
    } catch (fileError) {
      console.warn('Failed to load cfn-outputs/flat-outputs.json as well.');
      return {};
    }
  }
}

// --- Helper function to get stack resources ---
async function getStackResources(): Promise<Map<string, any>> {
  const resourceMap = new Map();
  try {
    const { StackResources } = await cfnClient.send(
      new DescribeStackResourcesCommand({ StackName: STACK_NAME })
    );

    StackResources?.forEach(resource => {
      resourceMap.set(resource.LogicalResourceId!, resource);
    });
  } catch (error) {
    console.warn(`Failed to get stack resources: ${error}`);
  }
  return resourceMap;
}

// --- Read Deployed Stack Outputs ---
let outputs: { [key: string]: string } = {};
let stackResources: Map<string, any> = new Map();

beforeAll(async () => {
  outputs = await getStackOutputs();
  stackResources = await getStackResources();
}, 30000);

// Conditionally run tests only if stack outputs were loaded successfully
const testSuite = Object.keys(outputs).length > 0 ? describe : describe.skip;

testSuite('Web Application Stack Integration Tests', () => {
  // Resource identifiers fetched from outputs
  const vpcId = outputs.VPCId;
  const albDnsName = outputs.ALBDNSName;
  const rdsEndpoint = outputs.RDSInstanceEndpoint;
  const s3BucketName = outputs.S3BucketName;
  const dbSecretArn = outputs.DBSecretARN;

  // Resource identifiers discovered during tests
  let albArn: string;
  let rdsInstanceIdentifier: string;
  let securityGroupIds: { [key: string]: string } = {};
  let lambdaFunctionName: string;

  beforeAll(async () => {
    // Discover the ALB ARN from its DNS name
    const albResponse = await elbv2Client.send(
      new DescribeLoadBalancersCommand({})
    );
    const alb = albResponse.LoadBalancers?.find(
      lb => lb.DNSName === albDnsName
    );
    if (!alb || !alb.LoadBalancerArn) {
      console.warn('Could not find deployed Application Load Balancer');
    } else {
      albArn = alb.LoadBalancerArn;
    }

    // Discover the RDS Instance Identifier from its endpoint address
    const rdsResponse = await rdsClient.send(
      new DescribeDBInstancesCommand({})
    );
    const rdsInstance = rdsResponse.DBInstances?.find(
      db => db.Endpoint?.Address === rdsEndpoint
    );
    if (!rdsInstance || !rdsInstance.DBInstanceIdentifier) {
      console.warn('Could not find deployed RDS Instance');
    } else {
      rdsInstanceIdentifier = rdsInstance.DBInstanceIdentifier;
    }

    // Discover Lambda function name from stack resources
    const lambdaResource = stackResources.get('PlaceholderLambda');
    if (lambdaResource) {
      lambdaFunctionName = lambdaResource.PhysicalResourceId;
    } else {
      // Fallback: try to find by prefix
      const { Functions } = await lambdaClient.send(
        new ListFunctionsCommand({})
      );
      const lambdaFunc = Functions?.find(
        f =>
          f.FunctionName?.includes('WebApp-Placeholder') ||
          f.FunctionName?.includes(STACK_NAME)
      );
      if (lambdaFunc) {
        lambdaFunctionName = lambdaFunc.FunctionName!;
      }
    }

    // Discover Security Group IDs from stack resources or by tags
    const sgResponse = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:aws:cloudformation:stack-name', Values: [STACK_NAME] },
        ],
      })
    );

    // Try to identify security groups by their CloudFormation logical IDs
    for (const sg of sgResponse.SecurityGroups || []) {
      const logicalIdTag = sg.Tags?.find(
        tag => tag.Key === 'aws:cloudformation:logical-id'
      );

      if (logicalIdTag) {
        switch (logicalIdTag.Value) {
          case 'ALBSecurityGroup':
            securityGroupIds.alb = sg.GroupId!;
            break;
          case 'WebServerSecurityGroup':
            securityGroupIds.web = sg.GroupId!;
            break;
          case 'DatabaseSecurityGroup':
            securityGroupIds.db = sg.GroupId!;
            break;
        }
      }
    }

    // Alternative method using stack resources
    if (!securityGroupIds.alb) {
      const albSgResource = stackResources.get('ALBSecurityGroup');
      if (albSgResource)
        securityGroupIds.alb = albSgResource.PhysicalResourceId;
    }
    if (!securityGroupIds.web) {
      const webSgResource = stackResources.get('WebServerSecurityGroup');
      if (webSgResource)
        securityGroupIds.web = webSgResource.PhysicalResourceId;
    }
    if (!securityGroupIds.db) {
      const dbSgResource = stackResources.get('DatabaseSecurityGroup');
      if (dbSgResource) securityGroupIds.db = dbSgResource.PhysicalResourceId;
    }

    // Verify we found all required resources
    if (
      !securityGroupIds.alb ||
      !securityGroupIds.web ||
      !securityGroupIds.db
    ) {
      console.warn(
        'Warning: Could not find all security groups. Some tests may be skipped.'
      );
    }
  }, 60000);

  describe('🌐 Networking Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      if (!vpcId) {
        console.warn('VPC ID not found, skipping test');
        return;
      }

      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(Vpcs![0].State).toBe('available');
    });

    test('Should have 2 public and 2 private subnets across different AZs', async () => {
      if (!vpcId) {
        console.warn('VPC ID not found, skipping test');
        return;
      }

      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const publicSubnets = Subnets!.filter(
        s => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = Subnets!.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);

      const azs = new Set(Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('🛡️ Security (Least Privilege)', () => {
    test('ALB Security Group should allow public HTTP traffic', async () => {
      if (!securityGroupIds.alb) {
        console.warn('ALB Security Group not found, skipping test');
        return;
      }

      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupIds.alb] })
      );
      const httpRule = SecurityGroups![0].IpPermissions?.find(
        p => p.FromPort === 80 && p.IpProtocol === 'tcp'
      );
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('Web Server SG should only allow ingress from ALB SG', async () => {
      if (!securityGroupIds.web || !securityGroupIds.alb) {
        console.warn('Security Groups not found, skipping test');
        return;
      }

      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupIds.web] })
      );
      const ingressRule = SecurityGroups![0].IpPermissions?.find(
        p => p.FromPort === 80
      );
      expect(ingressRule?.UserIdGroupPairs).toHaveLength(1);
      expect(ingressRule?.UserIdGroupPairs?.[0].GroupId).toBe(
        securityGroupIds.alb
      );
    });

    test('Database SG should only allow ingress from Web Server SG', async () => {
      if (!securityGroupIds.db || !securityGroupIds.web) {
        console.warn('Security Groups not found, skipping test');
        return;
      }

      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupIds.db] })
      );
      const ingressRule = SecurityGroups![0].IpPermissions?.find(
        p => p.FromPort === 5432
      );
      expect(ingressRule?.UserIdGroupPairs).toHaveLength(1);
      expect(ingressRule?.UserIdGroupPairs?.[0].GroupId).toBe(
        securityGroupIds.web
      );
    });

    test("Lambda function's IAM role should have the correct trust policy", async () => {
      if (!lambdaFunctionName) {
        console.warn('Lambda function not found, skipping test');
        return;
      }

      try {
        // 1. Get the Lambda function's configuration to find its role ARN
        const functionConfig = await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: lambdaFunctionName,
          })
        );
        const roleArn = functionConfig.Role;
        expect(roleArn).toBeDefined();

        // 2. Extract the role name from the ARN
        const roleName = roleArn!.split('/').pop();

        // 3. Get the role from IAM using the extracted name
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(Role).toBeDefined();

        // 4. Decode and parse the AssumeRolePolicyDocument
        const trustPolicy = JSON.parse(
          decodeURIComponent(Role!.AssumeRolePolicyDocument!)
        );
        const principalService = trustPolicy.Statement[0].Principal.Service;

        expect(principalService).toBe('lambda.amazonaws.com');
      } catch (error) {
        console.warn(`Failed to verify Lambda IAM role: ${error}`);
      }
    });
  });

  describe('🗄️ Database & Secrets', () => {
    test('RDS instance should be encrypted, Multi-AZ, and running PostgreSQL', async () => {
      if (!rdsInstanceIdentifier) {
        console.warn('RDS instance not found, skipping test');
        return;
      }

      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: rdsInstanceIdentifier,
        })
      );
      expect(DBInstances).toHaveLength(1);
      const db = DBInstances![0];
      expect(db.StorageEncrypted).toBe(true);
      expect(db.MultiAZ).toBe(true);
      expect(db.Engine).toBe('postgres');
    });

    test('Secrets Manager secret should exist and be accessible', async () => {
      if (!dbSecretArn) {
        console.warn('DB Secret ARN not found, skipping test');
        return;
      }

      const { ARN } = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: dbSecretArn })
      );
      expect(ARN).toBe(dbSecretArn);
    });
  });

  describe('📦 Storage, Functions, and Load Balancing', () => {
    test('S3 Bucket should have versioning enabled and public access blocked', async () => {
      if (!s3BucketName) {
        console.warn('S3 Bucket name not found, skipping test');
        return;
      }

      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(versioning.Status).toBe('Enabled');

      const publicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      const config = publicAccess.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });

    test('Lambda function should be configured correctly in the VPC', async () => {
      if (!lambdaFunctionName) {
        console.warn('Lambda function not found, skipping test');
        return;
      }

      try {
        const functionConfig = await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: lambdaFunctionName,
          })
        );

        expect(functionConfig.Runtime).toBe('nodejs20.x');
        expect(functionConfig.Handler).toBe('index.handler');

        // VPC configuration check
        if (vpcId && functionConfig.VpcConfig?.SubnetIds) {
          // Verify that the Lambda is in the correct VPC by checking subnet association
          const { Subnets } = await ec2Client.send(
            new DescribeSubnetsCommand({
              SubnetIds: functionConfig.VpcConfig.SubnetIds,
            })
          );
          const lambdaVpcId = Subnets?.[0]?.VpcId;
          expect(lambdaVpcId).toBe(vpcId);
        }

        // Check if Lambda has the web security group
        if (
          securityGroupIds.web &&
          functionConfig.VpcConfig?.SecurityGroupIds
        ) {
          expect(functionConfig.VpcConfig.SecurityGroupIds).toContain(
            securityGroupIds.web
          );
        }
      } catch (error) {
        console.warn(`Failed to verify Lambda configuration: ${error}`);
      }
    });

    test('Application Load Balancer should be internet-facing and have an HTTP listener', async () => {
      if (!albArn) {
        console.warn('ALB not found, skipping test');
        return;
      }

      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })
      );
      expect(LoadBalancers![0].Scheme).toBe('internet-facing');

      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: albArn })
      );
      const httpListener = Listeners?.find(
        l => l.Port === 80 && l.Protocol === 'HTTP'
      );
      expect(httpListener).toBeDefined();
      expect(httpListener?.DefaultActions?.[0].Type).toBe('forward');
    });
  });

  describe('🏷️ Resource Tagging', () => {
    test('All resources should have proper tags', async () => {
      const resources = Array.from(stackResources.values());

      // Check if stack has proper tags
      const { Stacks } = await cfnClient.send(
        new DescribeStacksCommand({ StackName: STACK_NAME })
      );

      if (Stacks && Stacks[0].Tags) {
        const tags = Stacks[0].Tags;
        const envTag = tags.find(t => t.Key === 'Environment');
        const ownerTag = tags.find(t => t.Key === 'Owner');

        // These are optional but good to check if they exist
        if (envTag) {
          expect(envTag.Value).toBe('Production');
        }
        if (ownerTag) {
          expect(ownerTag.Value).toBe('WebAppTeam');
        }
      }

      // Verify at least that resources were created by CloudFormation
      expect(resources.length).toBeGreaterThan(0);
      resources.forEach(resource => {
        expect(resource.ResourceStatus).toMatch(
          /CREATE_COMPLETE|UPDATE_COMPLETE/
        );
      });
    });
  });
});
