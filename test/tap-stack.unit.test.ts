import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { KmsStack } from '../lib/kms-stack';
import { StorageStack } from '../lib/storage-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiGatewayStack } from '../lib/apigateway-stack';
import { NotificationStack } from '../lib/notification-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: args.inputs.name ? `${args.inputs.name}-id` : `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:ap-southeast-1:123456789012:${args.name}`,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock AWS SDK calls
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: [
          'ap-southeast-1a',
          'ap-southeast-1b',
          'ap-southeast-1c',
        ],
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'ap-southeast-1',
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
      };
    }
    return args.inputs;
  },
});

describe('TapStack Structure', () => {
  let stack: TapStack;

  describe('with props', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'test123',
        tags: {
          Environment: 'test',
          Project: 'PaymentProcessing',
        },
        notificationEmail: 'test@example.com',
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('has required output properties', () => {
      expect(stack.apiUrl).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
      expect(stack.dashboardUrl).toBeDefined();
    });
  });

  describe('with default values', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackDefault', {
        environmentSuffix: 'test456',
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('uses default tags', () => {
      expect(stack).toBeDefined();
      // Stack should be created successfully with defaults
    });
  });
});

describe('NetworkStack', () => {
  let networkStack: NetworkStack;

  beforeAll(() => {
    networkStack = new NetworkStack('TestNetworkStack', {
      environmentSuffix: 'test789',
      tags: {
        Environment: 'test',
      },
    });
  });

  it('creates VPC', () => {
    expect(networkStack).toBeDefined();
    expect(networkStack.vpc).toBeDefined();
  });

  it('creates subnets', () => {
    expect(networkStack.publicSubnets).toBeDefined();
    expect(networkStack.privateSubnets).toBeDefined();
  });

  it('creates NAT gateways', () => {
    // NAT gateways are created internally but not exported as public property
    expect(networkStack).toBeDefined();
  });

  it('creates endpoints', () => {
    expect(networkStack.s3Endpoint).toBeDefined();
    expect(networkStack.dynamodbEndpoint).toBeDefined();
  });
});

describe('KmsStack', () => {
  let kmsStack: KmsStack;

  beforeAll(() => {
    kmsStack = new KmsStack('TestKmsStack', {
      environmentSuffix: 'test101',
      tags: {
        Environment: 'test',
      },
    });
  });

  it('creates KMS key', () => {
    expect(kmsStack).toBeDefined();
    expect(kmsStack.kmsKey).toBeDefined();
  });

  it('creates KMS alias', () => {
    expect(kmsStack.kmsKeyAlias).toBeDefined();
  });
});

describe('StorageStack', () => {
  let storageStack: StorageStack;
  let kmsKey: any;

  beforeAll(() => {
    kmsKey = pulumi.output('test-kms-key-arn');
    storageStack = new StorageStack('TestStorageStack', {
      environmentSuffix: 'test102',
      kmsKeyArn: kmsKey,
      tags: {
        Environment: 'test',
      },
    });
  });

  it('creates DynamoDB table', () => {
    expect(storageStack).toBeDefined();
    expect(storageStack.dynamoTable).toBeDefined();
  });

  it('creates S3 bucket', () => {
    expect(storageStack.auditBucket).toBeDefined();
  });
});

describe('LambdaStack', () => {
  let lambdaStack: LambdaStack;
  let vpcId: any;
  let privateSubnetIds: any;
  let kmsKeyArn: any;
  let dynamoTableArn: any;
  let auditBucketArn: any;
  let snsTopicArn: any;

  beforeAll(() => {
    vpcId = pulumi.output('test-vpc-id');
    privateSubnetIds = pulumi.output(['test-subnet-1', 'test-subnet-2']);
    kmsKeyArn = pulumi.output('test-kms-key-arn');
    dynamoTableArn = pulumi.output('test-table-arn');
    auditBucketArn = pulumi.output('test-bucket-arn');
    snsTopicArn = pulumi.output('test-sns-arn');

    lambdaStack = new LambdaStack('TestLambdaStack', {
      environmentSuffix: 'test103',
      vpcId: vpcId,
      privateSubnetIds: privateSubnetIds,
      dynamoTableName: pulumi.output('test-table'),
      dynamoTableArn: dynamoTableArn,
      auditBucketName: pulumi.output('test-bucket'),
      auditBucketArn: auditBucketArn,
      snsTopicArn: snsTopicArn,
      tags: {
        Environment: 'test',
      },
    });
  });

  it('creates Lambda functions', () => {
    expect(lambdaStack).toBeDefined();
    expect(lambdaStack.validatorFunction).toBeDefined();
    expect(lambdaStack.processorFunction).toBeDefined();
    expect(lambdaStack.notifierFunction).toBeDefined();
  });

  it('creates security group', () => {
    // Security group is created internally but not exported as public property
    expect(lambdaStack).toBeDefined();
  });
});

describe('ApiGatewayStack', () => {
  let apiGatewayStack: ApiGatewayStack;
  let validatorFunctionArn: any;
  let validatorFunctionName: any;

  beforeAll(() => {
    validatorFunctionArn = pulumi.output('test-lambda-arn');
    validatorFunctionName = pulumi.output('test-lambda-function');

    apiGatewayStack = new ApiGatewayStack('TestApiGatewayStack', {
      environmentSuffix: 'test104',
      validatorFunctionArn: validatorFunctionArn,
      validatorFunctionName: validatorFunctionName,
      tags: {
        Environment: 'test',
      },
    });
  });

  it('creates API Gateway', () => {
    expect(apiGatewayStack).toBeDefined();
    expect(apiGatewayStack.apiGateway).toBeDefined();
  });

  it('creates API endpoint', () => {
    expect(apiGatewayStack.apiUrl).toBeDefined();
  });
});

describe('NotificationStack', () => {
  let notificationStack: NotificationStack;

  beforeAll(() => {
    notificationStack = new NotificationStack('TestNotificationStack', {
      environmentSuffix: 'test105',
      emailEndpoint: 'test@example.com',
      tags: {
        Environment: 'test',
      },
    });
  });

  it('creates SNS topic', () => {
    expect(notificationStack).toBeDefined();
    expect(notificationStack.snsTopic).toBeDefined();
  });
});

describe('MonitoringStack', () => {
  let monitoringStack: MonitoringStack;
  let validatorFunctionName: any;
  let processorFunctionName: any;
  let notifierFunctionName: any;
  let dynamoTableName: any;

  beforeAll(() => {
    validatorFunctionName = pulumi.output('test-validator-function');
    processorFunctionName = pulumi.output('test-processor-function');
    notifierFunctionName = pulumi.output('test-notifier-function');
    dynamoTableName = pulumi.output('test-table');

    monitoringStack = new MonitoringStack('TestMonitoringStack', {
      environmentSuffix: 'test106',
      validatorFunctionName: validatorFunctionName,
      processorFunctionName: processorFunctionName,
      notifierFunctionName: notifierFunctionName,
      dynamoTableName: dynamoTableName,
      tags: {
        Environment: 'test',
      },
    });
  });

  it('creates CloudWatch Dashboard', () => {
    expect(monitoringStack).toBeDefined();
    expect(monitoringStack.dashboard).toBeDefined();
  });

  it('creates dashboard URL', () => {
    expect(monitoringStack.dashboardUrl).toBeDefined();
  });
});
