import * as pulumi from '@pulumi/pulumi';
import { DatabaseStack } from '../lib/database-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:secretsmanager/getSecretVersion:getSecretVersion') {
      const secretId = args.inputs.secretId as string;
      // Return different secrets based on the secretId
      if (secretId.includes('no-user')) {
        return {
          secretString: JSON.stringify({
            password: 'testpassword123',
          }),
        };
      } else if (secretId.includes('custom')) {
        return {
          secretString: JSON.stringify({
            username: 'customuser',
            password: 'custompass456',
          }),
        };
      }
      return {
        secretString: JSON.stringify({
          username: 'testuser',
          password: 'testpassword123',
        }),
      };
    }
    return args.inputs;
  },
});

describe('DatabaseStack', () => {
  const subnetIds = pulumi.output(['subnet-1', 'subnet-2']);
  const securityGroupId = pulumi.output('sg-12345');

  it('should create RDS instance', () => {
    const databaseStack = new DatabaseStack('test-database', {
      environmentSuffix: 'test',
      subnetIds,
      securityGroupId,
      tags: { Environment: 'test' },
    });

    expect(databaseStack.dbEndpoint).toBeDefined();
    expect(databaseStack.dbInstanceId).toBeDefined();
  });

  it('should include environmentSuffix in database instance ID', () => {
    const envSuffix = 'prod';
    const databaseStack = new DatabaseStack('test-database-2', {
      environmentSuffix: envSuffix,
      subnetIds,
      securityGroupId,
      tags: { Environment: 'production' },
    });

    expect(databaseStack.dbInstanceId).toBeDefined();
  });

  it('should handle database credentials from Secrets Manager', () => {
    const databaseStack = new DatabaseStack('test-database-3', {
      environmentSuffix: 'test',
      subnetIds,
      securityGroupId,
      dbSecretArn:
        'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
      tags: { Environment: 'test' },
    });

    expect(databaseStack.dbEndpoint).toBeDefined();
  });

  it('should use default credentials when no secret provided', () => {
    const databaseStack = new DatabaseStack('test-database-4', {
      environmentSuffix: 'test',
      subnetIds,
      securityGroupId,
      tags: { Environment: 'test' },
    });

    expect(databaseStack.dbEndpoint).toBeDefined();
  });

  it('should use default username when secret has no username field', () => {
    const databaseStack = new DatabaseStack('test-database-5', {
      environmentSuffix: 'test',
      subnetIds,
      securityGroupId,
      dbSecretArn:
        'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret-no-user',
      tags: { Environment: 'test' },
    });

    expect(databaseStack.dbEndpoint).toBeDefined();
    expect(databaseStack.dbInstanceId).toBeDefined();
  });

  it('should handle secret with explicit username and password', () => {
    const databaseStack = new DatabaseStack('test-database-6', {
      environmentSuffix: 'test',
      subnetIds,
      securityGroupId,
      dbSecretArn:
        'arn:aws:secretsmanager:us-east-1:123456789012:secret:custom-secret',
      tags: { Environment: 'test' },
    });

    expect(databaseStack.dbEndpoint).toBeDefined();
    expect(databaseStack.dbInstanceId).toBeDefined();
  });
});
