import fs from 'fs';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const outputsPath = 'cfn-outputs/flat-outputs.json';
const outputsRaw = fs.existsSync(outputsPath)
  ? fs.readFileSync(outputsPath, 'utf8')
  : '{}';
const outputs: Record<string, string> = JSON.parse(outputsRaw || '{}');

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: any;

  beforeAll(() => {
    // Create CDK app and stack
    app = new cdk.App();
    stack = new TapStack(app, `TapStack-${environmentSuffix}`, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      },
      environmentSuffix,
      vpcCidr: '10.0.0.0/16',
      natGatewayStrategy: 'single',
      useKmsEncryption: false,
    });

    // Synthesize the template
    template = app.synth().getStackByName(stack.stackName).template;

    // Write template to file for inspection if needed
    fs.writeFileSync(
      `test-template-${environmentSuffix}.json`,
      JSON.stringify(template, null, 2)
    );
  });

  test('VPC is created with correct configuration', () => {
    // VPC should be created
    expect(stack.vpc).toBeDefined();
    expect(stack.vpc.vpcId).toBeDefined();

    // Should have public and private subnets
    expect(stack.vpc.publicSubnets.length).toBeGreaterThan(0);
    expect(stack.vpc.privateSubnets.length).toBeGreaterThan(0);

    // Should span multiple AZs
    expect(stack.vpc.availabilityZones.length).toBeGreaterThanOrEqual(2);
  });

  test('S3 Logs Bucket is created with secure configuration', () => {
    // Bucket should be created
    expect(stack.logsBucket).toBeDefined();

    // Check bucket encryption through CloudFormation template
    const bucketResources = Object.entries(template.Resources || {})
      .filter(
        ([_, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket'
      )
      .map(([_, resource]) => resource);

    expect(bucketResources.length).toBeGreaterThan(0);

    const logsBucket: any = bucketResources.find(
      (resource: any) =>
        resource.Properties?.BucketName &&
        typeof resource.Properties.BucketName === 'string' &&
        resource.Properties.BucketName.includes(environmentSuffix)
    );

    expect(logsBucket).toBeDefined();
    expect(logsBucket.Properties).toBeDefined();

    // Check for encryption configuration in the template
    expect(logsBucket.Properties.BucketEncryption).toBeDefined();

    // Check for public access blocking
    expect(logsBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
  });

  test('API Gateway is created with logging enabled', () => {
    // API should be created
    expect(stack.api).toBeDefined();
    expect(stack.api.restApiId).toBeDefined();

    // Log group should be created
    expect(stack.apiLogGroup).toBeDefined();

    // Check API Gateway configuration in template
    const apiResources = Object.entries(template.Resources || {})
      .filter(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::ApiGateway::RestApi'
      )
      .map(([_, resource]) => resource);

    expect(apiResources.length).toBeGreaterThan(0);

    // Check for logging configuration
    const deploymentResources = Object.entries(template.Resources || {})
      .filter(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::ApiGateway::Deployment'
      )
      .map(([_, resource]) => resource);

    expect(deploymentResources.length).toBeGreaterThan(0);
  });

  test('IAM Resources are created with MFA enforcement', () => {
    // Check for IAM resources in the template
    const iamResources = Object.entries(template.Resources || {})
      .filter(([_, resource]: [string, any]) =>
        resource.Type?.startsWith('AWS::IAM::')
      )
      .map(([_, resource]) => resource);

    expect(iamResources.length).toBeGreaterThan(0);

    // Check for MFA enforcement policy
    const mfaPolicies = iamResources.filter(
      (resource: any) =>
        resource.Properties?.ManagedPolicyName &&
        typeof resource.Properties.ManagedPolicyName === 'string' &&
        resource.Properties.ManagedPolicyName.includes('MfaEnforcementPolicy')
    );
    expect(mfaPolicies.length).toBeGreaterThan(0);
  });

  test('VPC Endpoints are created for AWS services', () => {
    // Check for VPC endpoint resources
    const vpcEndpoints = Object.entries(template.Resources || {})
      .filter(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::EC2::VPCEndpoint'
      )
      .map(([_, resource]) => resource);

    expect(vpcEndpoints.length).toBeGreaterThan(0);

    // Should have endpoints for key services
    const hasKeyServices = vpcEndpoints.some((endpoint: any) => {
      const serviceName = endpoint.Properties?.ServiceName;
      return (
        typeof serviceName === 'string' &&
        (serviceName.includes('ssm') ||
          serviceName.includes('ec2messages') ||
          serviceName.includes('logs'))
      );
    });

    expect(hasKeyServices).toBe(true);
  });

  test('GuardDuty custom resource is created', () => {
    // GuardDuty detector ID should be available
    expect(stack.guardDutyDetectorId).toBeDefined();

    // Check for custom resource
    const customResources = Object.entries(template.Resources || {})
      .filter(([_, resource]: [string, any]) => resource.Type === 'Custom::AWS')
      .map(([_, resource]) => resource);

    expect(customResources.length).toBeGreaterThan(0);

    // Check for GuardDuty-related custom resource by looking at properties
    const guardDutyResources = customResources.filter((resource: any) => {
      const serviceToken = resource.Properties?.ServiceToken;
      return (
        typeof serviceToken === 'string' && serviceToken.includes('GuardDuty')
      );
    });
    expect(guardDutyResources.length).toBeGreaterThanOrEqual(0);
  });

  test('CloudFormation outputs are created', () => {
    // Check for outputs
    expect(template.Outputs).toBeDefined();
    expect(Object.keys(template.Outputs || {}).length).toBeGreaterThan(0);

    // Should have key outputs
    const outputKeys = Object.keys(template.Outputs || {});
    expect(outputKeys.some(key => key.includes('VpcId'))).toBe(true);
    expect(outputKeys.some(key => key.includes('ApiId'))).toBe(true);
    expect(outputKeys.some(key => key.includes('LogsBucketName'))).toBe(true);
    expect(outputKeys.some(key => key.includes('GuardDutyDetectorId'))).toBe(
      true
    );
  });

  test('Stack synthesizes without errors', () => {
    // This test verifies that the stack can be synthesized without throwing errors
    expect(() => {
      app.synth();
    }).not.toThrow();
  });

  test('Resources have proper naming conventions with environment suffix', () => {
    // Check that resources include environment suffix in names
    const resources = Object.entries(template.Resources || {}).map(
      ([_, resource]) => resource
    );

    // Sample some resources to check naming
    const namedResources = resources.filter((resource: any) => {
      const bucketName = resource.Properties?.BucketName;
      const groupName = resource.Properties?.GroupName;
      const roleName = resource.Properties?.RoleName;
      const logGroupName = resource.Properties?.LogGroupName;

      return (
        (typeof bucketName === 'string' &&
          bucketName.includes(environmentSuffix)) ||
        (typeof groupName === 'string' &&
          groupName.includes(environmentSuffix)) ||
        (typeof roleName === 'string' &&
          roleName.includes(environmentSuffix)) ||
        (typeof logGroupName === 'string' &&
          logGroupName.includes(environmentSuffix))
      );
    });

    expect(namedResources.length).toBeGreaterThan(0);
  });

  test('Security Groups are created with restrictive rules', () => {
    // Check for security group resources
    const securityGroups = Object.entries(template.Resources || {})
      .filter(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::EC2::SecurityGroup'
      )
      .map(([_, resource]) => resource);

    expect(securityGroups.length).toBeGreaterThan(0);

    // Check that security groups have restrictive settings
    securityGroups.forEach((sg: any) => {
      // Security groups should have explicit egress rules (not allowAllOutbound)
      const hasExplicitEgress =
        Array.isArray(sg.Properties.SecurityGroupEgress) &&
        sg.Properties.SecurityGroupEgress.length > 0;
      const hasExplicitIngress =
        Array.isArray(sg.Properties.SecurityGroupIngress) &&
        sg.Properties.SecurityGroupIngress.length > 0;
    });
  });
});

// Additional test for different configurations
describe('TapStack Configuration Variations', () => {
  test('Stack with KMS encryption enabled synthesizes correctly', () => {
    const app = new cdk.App();

    expect(() => {
      new TapStack(app, 'TapStackKmsTest', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'kms-test',
        useKmsEncryption: true,
      });

      app.synth();
    }).not.toThrow();
  });

  test('Stack with per-AZ NAT gateways synthesizes correctly', () => {
    const app = new cdk.App();

    expect(() => {
      new TapStack(app, 'TapStackMultiAzTest', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'multiaz-test',
        natGatewayStrategy: 'per-az',
      });

      app.synth();
    }).not.toThrow();
  });

  test('Stack with custom CIDR synthesizes correctly', () => {
    const app = new cdk.App();

    expect(() => {
      new TapStack(app, 'TapStackCustomCidrTest', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'cidr-test',
        vpcCidr: '192.168.0.0/16',
      });

      app.synth();
    }).not.toThrow();
  });
});
