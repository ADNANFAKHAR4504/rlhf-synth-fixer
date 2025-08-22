

``` typescript
// lib/config/environments.ts
export interface EnvironmentConfig {
  account: string;
  region: string;
  stage: 'dev' | 'staging' | 'prod';
  rollbackConfig: RollbackConfig;
}

export interface RollbackConfig {
  enableTerminationProtection: boolean;
  rollbackTriggers: CloudFormationRollbackTrigger[];
  monitoringTimeInMinutes: number;
}

export const environments: Record<string, EnvironmentConfig> = {
  'prod-us-east-1': {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: 'us-east-1',
    stage: 'prod',
    rollbackConfig: {
      enableTerminationProtection: true,
      rollbackTriggers: [
        {
          arn: `arn:aws:cloudwatch:us-east-1:${process.env.CDK_DEFAULT_ACCOUNT}:alarm:IAMRoleCreationFailure`,
          type: 'AWS::CloudWatch::Alarm'
        }
      ],
      monitoringTimeInMinutes: 10
    }
  },
  'prod-us-east-2': {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: 'us-east-2',
    stage: 'prod',
    rollbackConfig: {
      enableTerminationProtection: true,
      rollbackTriggers: [
        {
          arn: `arn:aws:cloudwatch:us-east-2:${process.env.CDK_DEFAULT_ACCOUNT}:alarm:IAMRoleCreationFailure`,
          type: 'AWS::CloudWatch::Alarm'
        }
      ],
      monitoringTimeInMinutes: 10
    }
  }
};
```

### 2. Secure IAM Role Construct

```typescript
// lib/constructs/secure-iam-role.ts
import { Construct } from 'constructs';
import { 
  Role, 
  PolicyDocument, 
  PolicyStatement, 
  Effect, 
  ServicePrincipal,
  ManagedPolicy,
  Policy
} from 'aws-cdk-lib/aws-iam';
import { Duration, Tags } from 'aws-cdk-lib';

export interface SecureIamRoleProps {
  roleName: string;
  description: string;
  servicePrincipal: string;
  maxSessionDuration?: Duration;
  inlinePolicies?: Record<string, PolicyDocument>;
  managedPolicies?: string[];
  tags?: Record<string, string>;
  externalId?: string;
  conditions?: Record<string, any>;
}

export class SecureIamRole extends Construct {
  public readonly role: Role;

  constructor(scope: Construct, id: string, props: SecureIamRoleProps) {
    super(scope, id);

    // Build assume role policy with conditions
    const assumeRolePolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          principals: [new ServicePrincipal(props.servicePrincipal)],
          actions: ['sts:AssumeRole'],
          conditions: {
            ...props.conditions,
            // Always include session duration limits
            'NumericLessThan': {
              'aws:TokenIssueTime': Math.floor(Date.now() / 1000) + 3600,
              ...props.conditions?.['NumericLessThan']
            }
          }
        })
      ]
    });

    // Create role with strict settings
    this.role = new Role(this, 'Role', {
      roleName: props.roleName,
      description: props.description,
      assumedBy: new ServicePrincipal(props.servicePrincipal),
      maxSessionDuration: props.maxSessionDuration || Duration.hours(1),
      inlinePolicies: props.inlinePolicies,
      // Override the assume role policy to include our conditions
      assumeRolePolicy
    });

    // Attach managed policies if specified
    props.managedPolicies?.forEach(policyArn => {
      this.role.addManagedPolicy(
        ManagedPolicy.fromManagedPolicyArn(this, `Policy-${policyArn.split('/').pop()}`, policyArn)
      );
    });

    // Add security tags
    const allTags = {
      'Security:Compliance': 'Required',
      'Security:LeastPrivilege': 'Enforced',
      'CreatedBy': 'CDK',
      'Environment': 'Production',
      ...props.tags
    };

    Object.entries(allTags).forEach(([key, value]) => {
      Tags.of(this.role).add(key, value);
    });

    // Add deletion protection through policy
    this.addDeletionProtection();
  }

  private addDeletionProtection(): void {
    const deletionProtectionPolicy = new Policy(this, 'DeletionProtection', {
      policyName: `${this.role.roleName}-DeletionProtection`,
      statements: [
        new PolicyStatement({
          effect: Effect.DENY,
          actions: [
            'iam:DeleteRole',
            'iam:DetachRolePolicy',
            'iam:DeleteRolePolicy'
          ],
          resources: [this.role.roleArn],
          conditions: {
            'Bool': {
              'aws:MultiFactorAuthPresent': 'false'
            }
          }
        })
      ]
    });

    this.role.attachInlinePolicy(deletionProtectionPolicy);
  }

  public addLeastPrivilegePolicy(policyName: string, statements: PolicyStatement[]): void {
    // Validate statements for least privilege
    statements.forEach(statement => {
      this.validatePolicyStatement(statement);
    });

    const policy = new Policy(this, policyName, {
      policyName,
      statements
    });

    this.role.attachInlinePolicy(policy);
  }

  private validatePolicyStatement(statement: PolicyStatement): void {
    const actions = statement.actions || [];
    const resources = statement.resources || [];

    // Check for wildcard actions
    const hasWildcardActions = actions.some(action => action.includes('*'));
    if (hasWildcardActions) {
      console.warn(`Warning: Wildcard action detected in policy statement. Ensure this is necessary.`);
    }

    // Check for wildcard resources
    const hasWildcardResources = resources.some(resource => resource === '*');
    if (hasWildcardResources) {
      throw new Error('Wildcard resources (*) are not allowed. Specify explicit resource ARNs.');
    }

    // Ensure conditions are present for sensitive actions
    const sensitiveActions = [
      'iam:CreateRole',
      'iam:DeleteRole',
      'iam:AttachRolePolicy',
      'iam:DetachRolePolicy',
      'sts:AssumeRole'
    ];

    const hasSensitiveActions = actions.some(action => 
      sensitiveActions.some(sensitive => action.includes(sensitive))
    );

    if (hasSensitiveActions && !statement.conditions) {
      console.warn('Warning: Sensitive IAM actions detected without conditions. Consider adding restrictions.');
    }
  }
}
```



```typescript
// lib/constructs/rollback-protection.ts
import { Construct } from 'constructs';
import { CfnStack } from 'aws-cdk-lib';
import { Alarm, Metric } from 'aws-cdk-lib/aws-cloudwatch';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

export interface RollbackProtectionProps {
  enableTerminationProtection: boolean;
  monitoringTimeInMinutes: number;
  notificationEmail?: string;
  customMetrics?: Metric[];
}

export class RollbackProtection extends Construct {
  public readonly rollbackTriggers: any[];
  public readonly monitoringAlarm: Alarm;

  constructor(scope: Construct, id: string, props: RollbackProtectionProps) {
    super(scope, id);

    // Create SNS topic for notifications
    const alertTopic = new Topic(this, 'RollbackAlerts', {
      displayName: 'IAM Stack Rollback Alerts'
    });

    if (props.notificationEmail) {
      alertTopic.addSubscription(new EmailSubscription(props.notificationEmail));
    }

    // Create CloudWatch alarm for stack failures
    this.monitoringAlarm = new Alarm(this, 'StackFailureAlarm', {
      alarmName: 'IAMRoleCreationFailure',
      alarmDescription: 'Triggers rollback when IAM role creation fails',
      metric: new Metric({
        namespace: 'AWS/CloudFormation',
        metricName: 'StackCreationFailures',
        dimensionsMap: {
          StackName: scope.node.id
        }
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: 'notBreaching'
    });

    this.monitoringAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: alertTopic.topicArn })
    });

    // Set up rollback triggers
    this.rollbackTriggers = [
      {
        Arn: this.monitoringAlarm.alarmArn,
        Type: 'AWS::CloudWatch::Alarm'
      }
    ];

    // Add custom metrics if provided
    props.customMetrics?.forEach((metric, index) => {
      const customAlarm = new Alarm(this, `CustomAlarm${index}`, {
        alarmName: `CustomRollbackTrigger${index}`,
        metric,
        threshold: 1,
        evaluationPeriods: 1
      });

      this.rollbackTriggers.push({
        Arn: customAlarm.alarmArn,
        Type: 'AWS::CloudWatch::Alarm'
      });
    });

    // Configure stack-level protection
    this.configureStackProtection(props);
  }

  private configureStackProtection(props: RollbackProtectionProps): void {
    const stack = this.node.root as CfnStack;
    
    // Enable termination protection
    if (props.enableTerminationProtection) {
      stack.terminationProtection = true;
    }

    // Add rollback configuration to stack metadata
    stack.addMetadata('RollbackConfiguration', {
      RollbackTriggers: this.rollbackTriggers,
      MonitoringTimeInMinutes: props.monitoringTimeInMinutes
    });
  }
}
```


```typescript
// lib/stacks/iam-regional-stack.ts
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureIamRole } from '../constructs/secure-iam-role';
import { RollbackProtection } from '../constructs/rollback-protection';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { EnvironmentConfig } from '../config/environments';

export interface IamRegionalStackProps extends StackProps {
  environmentConfig: EnvironmentConfig;
  notificationEmail?: string;
}

export class IamRegionalStack extends Stack {
  constructor(scope: Construct, id: string, props: IamRegionalStackProps) {
    super(scope, id, props);

    const { environmentConfig } = props;

    // Add rollback protection
    const rollbackProtection = new RollbackProtection(this, 'RollbackProtection', {
      enableTerminationProtection: environmentConfig.rollbackConfig.enableTerminationProtection,
      monitoringTimeInMinutes: environmentConfig.rollbackConfig.monitoringTimeInMinutes,
      notificationEmail: props.notificationEmail
    });

    // Example: Application Service Role
    const appServiceRole = new SecureIamRole(this, 'AppServiceRole', {
      roleName: `app-service-role-${environmentConfig.region}`,
      description: 'Role for application services with least privilege access',
      servicePrincipal: 'ec2.amazonaws.com',
      conditions: {
        'StringEquals': {
          'aws:RequestedRegion': environmentConfig.region
        },
        'IpAddress': {
          'aws:SourceIp': ['10.0.0.0/8', '172.16.0.0/12'] // VPC CIDR ranges
        }
      },
      tags: {
        'Region': environmentConfig.region,
        'Stage': environmentConfig.stage
      }
    });

    // Add specific permissions with least privilege
    appServiceRole.addLeastPrivilegePolicy('S3AccessPolicy', [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject'
        ],
        resources: [
          `arn:aws:s3:::my-app-bucket-${environmentConfig.region}/*`
        ],
        conditions: {
          'StringEquals': {
            's3:x-amz-server-side-encryption': 'AES256'
          }
        }
      })
    ]);

    // Example: Lambda Execution Role
    const lambdaRole = new SecureIamRole(this, 'LambdaExecutionRole', {
      roleName: `lambda-execution-role-${environmentConfig.region}`,
      description: 'Role for Lambda functions with minimal required permissions',
      servicePrincipal: 'lambda.amazonaws.com',
      managedPolicies: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      ],
      conditions: {
        'StringEquals': {
          'aws:RequestedRegion': environmentConfig.region
        }
      }
    });

    // Add CloudWatch Logs permissions
    lambdaRole.addLeastPrivilegePolicy('CloudWatchLogsPolicy', [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents'
        ],
        resources: [
          `arn:aws:logs:${environmentConfig.region}:${this.account}:log-group:/aws/lambda/*`
        ]
      })
    ]);

    // Configure rollback triggers at stack level
    const cfnStack = this.node.defaultChild as any;
    cfnStack.addPropertyOverride('RollbackConfiguration', {
      RollbackTriggers: rollbackProtection.rollbackTriggers,
      MonitoringTimeInMinutes: environmentConfig.rollbackConfig.monitoringTimeInMinutes
    });

    // Outputs
    new CfnOutput(this, 'AppServiceRoleArn', {
      value: appServiceRole.role.roleArn,
      description: 'ARN of the application service role',
      exportName: `AppServiceRole-${environmentConfig.region}`
    });

    new CfnOutput(this, 'LambdaExecutionRoleArn', {
      value: lambdaRole.role.roleArn,
      description: 'ARN of the Lambda execution role',
      exportName: `LambdaExecutionRole-${environmentConfig.region}`
    });
  }
}
```


```typescript
// bin/iam-app.ts
import { App, Tags } from 'aws-cdk-lib';
import { IamRegionalStack } from '../lib/stacks/iam-regional-stack';
import { environments } from '../lib/config/environments';

const app = new App();

// Deploy to multiple regions
Object.entries(environments).forEach(([envName, config]) => {
  const stack = new IamRegionalStack(app, `IamStack-${envName}`, {
    env: {
      account: config.account,
      region: config.region
    },
    environmentConfig: config,
    notificationEmail: process.env.NOTIFICATION_EMAIL,
    description: `IAM roles and policies for ${config.stage} environment in ${config.region}`,
    tags: {
      Environment: config.stage,
      Region: config.region,
      ManagedBy: 'CDK'
    }
  });

  // Add global tags
  Tags.of(stack).add('Project', 'IAM-Management');
  Tags.of(stack).add('Owner', 'Platform-Team');
});
```



```bash
#!/bin/bash
# scripts/validate-templates.sh

set -e

echo "Validating CloudFormation templates..."

# Synthesize templates
npx cdk synth --all

# Validate each template
for template in cdk.out/*.template.json; do
    echo "Validating $template..."
    aws cloudformation validate-template --template-body file://$template
    
    # Check for security best practices
    echo "Checking security practices in $template..."
    
    # Check for wildcard resources
    if grep -q '"Resource": "\*"' "$template"; then
        echo "WARNING: Wildcard resources found in $template"
        grep -n '"Resource": "\*"' "$template"
    fi
    
    # Check for overly permissive actions
    if grep -q '"Action": "\*"' "$template"; then
        echo "ERROR: Wildcard actions found in $template"
        exit 1
    fi
done

echo "All templates validated successfully!"
```


```typescript
// test/integration/rollback.test.ts
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { IamRegionalStack } from '../../lib/stacks/iam-regional-stack';

describe('Rollback Protection Integration', () => {
  test('Stack includes rollback configuration', () => {
    const app = new App();
    const stack = new IamRegionalStack(app, 'TestStack', {
      environmentConfig: {
        account: '123456789012',
        region: 'us-east-1',
        stage: 'prod',
        rollbackConfig: {
          enableTerminationProtection: true,
          rollbackTriggers: [],
          monitoringTimeInMinutes: 5
        }
      }
    });

    const template = Template.fromStack(stack);
    
    // Verify rollback configuration exists
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'IAMRoleCreationFailure'
    });
  });

  test('IAM roles have proper least privilege policies', () => {
    const app = new App();
    const stack = new IamRegionalStack(app, 'TestStack', {
      environmentConfig: {
        account: '123456789012',
        region: 'us-east-1',
        stage: 'prod',
        rollbackConfig: {
          enableTerminationProtection: true,
          rollbackTriggers: [],
          monitoringTimeInMinutes: 5
        }
      }
    });

    const template = Template.fromStack(stack);
    
    // Verify no wildcard resources
    const roles = template.findResources('AWS::IAM::Role');
    Object.values(roles).forEach(role => {
      const policies = role.Properties?.Policies || [];
      policies.forEach((policy: any) => {
        const statements = policy.PolicyDocument?.Statement || [];
        statements.forEach((statement: any) => {
          if (statement.Resource) {
            expect(statement.Resource).not.toBe('*');
          }
        });
      });
    });
  });
});
```




```json
{
  "app": "npx ts-node --prefer-ts-exts bin/iam-app.ts",
  "requireApproval": "broadening",
  "context": {
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:enableStackNameDuplicates": false,
    "@aws-cdk/core:stackRelativeExports": true
  },
  "rollback": true,
  "terminationProtection": true
}
```


