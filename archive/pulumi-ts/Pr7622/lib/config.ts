/**
 * Configuration values and constants for the compliance monitoring system
 */

export const COMPLIANCE_CONFIG = {
  // S3 Configuration
  S3_ENCRYPTION_ALGORITHM: 'AES256',
  S3_FORCE_DESTROY: true,

  // IAM Configuration
  CONFIG_ROLE_POLICY_ARN: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',

  // Lambda Configuration
  LAMBDA_RUNTIME: 'nodejs18.x',
  LAMBDA_TIMEOUT: 180, // 3 minutes

  // CloudWatch Configuration
  LOG_RETENTION_DAYS: 14,

  // SQS Configuration
  MESSAGE_RETENTION_SECONDS: 1209600, // 14 days
  VISIBILITY_TIMEOUT_SECONDS: 300, // 5 minutes

  // SNS Configuration
  SNS_PROTOCOL: 'email',
  SNS_ENDPOINT: 'security-team@example.com',

  // AWS Config Configuration
  CONFIG_ALL_SUPPORTED: true,
  CONFIG_INCLUDE_GLOBAL_RESOURCES: true,
  S3_ENCRYPTION_RULE_ID: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
  RDS_PUBLIC_ACCESS_RULE_ID: 'RDS_INSTANCE_PUBLIC_ACCESS_CHECK',

  // Step Functions Configuration
  STEP_FUNCTION_RETRY_MAX_ATTEMPTS: 3,
  STEP_FUNCTION_RETRY_INTERVAL: 2,
  STEP_FUNCTION_RETRY_BACKOFF_RATE: 2,

  // EventBridge Configuration
  DAILY_SCHEDULE: 'rate(1 day)',

  // CloudWatch Dashboard Configuration
  METRIC_NAMESPACE: 'ComplianceMonitoring',
  METRIC_NAMES: ['CompliancePercentage', 'CompliantRules', 'NonCompliantRules'],

  // Default Region
  DEFAULT_REGION: 'us-east-1',
};

export const getResourceName = (
  resourceType: string,
  environmentSuffix: string
): string => {
  return `${resourceType}-${environmentSuffix}`;
};

export const validateEnvironmentSuffix = (suffix: string): boolean => {
  if (!suffix || suffix.trim() === '') {
    throw new Error('environmentSuffix is required and cannot be empty');
  }
  return true;
};

export const getLogGroupName = (functionName: string): string => {
  return `/aws/lambda/${functionName}`;
};

export const getDashboardWidgets = (
  environmentSuffix: string,
  region: string
) => {
  return [
    {
      type: 'metric',
      properties: {
        metrics: [[COMPLIANCE_CONFIG.METRIC_NAMESPACE, 'CompliancePercentage']],
        period: 300,
        stat: 'Average',
        region,
        title: 'Compliance Percentage',
        yAxis: {
          left: {
            min: 0,
            max: 100,
          },
        },
      },
      width: 12,
      height: 6,
      x: 0,
      y: 0,
    },
    {
      type: 'metric',
      properties: {
        metrics: [
          [
            COMPLIANCE_CONFIG.METRIC_NAMESPACE,
            'CompliantRules',
            { color: '#2ca02c' },
          ],
          ['.', 'NonCompliantRules', { color: '#d62728' }],
        ],
        period: 300,
        stat: 'Sum',
        region,
        title: 'Compliance Rules Status',
      },
      width: 12,
      height: 6,
      x: 12,
      y: 0,
    },
    {
      type: 'log',
      properties: {
        query: `SOURCE '/aws/lambda/compliance-analyzer-${environmentSuffix}' | fields @timestamp, @message | sort @timestamp desc | limit 20`,
        region,
        title: 'Recent Compliance Analysis Logs',
      },
      width: 24,
      height: 6,
      x: 0,
      y: 6,
    },
  ];
};

export const getStepFunctionDefinition = (
  analyzerArn: string,
  taggerArn: string
) => {
  return {
    Comment: 'Compliance monitoring workflow',
    StartAt: 'AnalyzeCompliance',
    States: {
      AnalyzeCompliance: {
        Type: 'Task',
        Resource: analyzerArn,
        Next: 'CheckComplianceStatus',
        Retry: [
          {
            ErrorEquals: ['States.ALL'],
            IntervalSeconds: COMPLIANCE_CONFIG.STEP_FUNCTION_RETRY_INTERVAL,
            MaxAttempts: COMPLIANCE_CONFIG.STEP_FUNCTION_RETRY_MAX_ATTEMPTS,
            BackoffRate: COMPLIANCE_CONFIG.STEP_FUNCTION_RETRY_BACKOFF_RATE,
          },
        ],
      },
      CheckComplianceStatus: {
        Type: 'Choice',
        Choices: [
          {
            Variable: '$.nonCompliantRules',
            NumericGreaterThan: 0,
            Next: 'TagNonCompliantResources',
          },
        ],
        Default: 'Success',
      },
      TagNonCompliantResources: {
        Type: 'Task',
        Resource: taggerArn,
        Next: 'Success',
        Retry: [
          {
            ErrorEquals: ['States.ALL'],
            IntervalSeconds: COMPLIANCE_CONFIG.STEP_FUNCTION_RETRY_INTERVAL,
            MaxAttempts: COMPLIANCE_CONFIG.STEP_FUNCTION_RETRY_MAX_ATTEMPTS,
            BackoffRate: COMPLIANCE_CONFIG.STEP_FUNCTION_RETRY_BACKOFF_RATE,
          },
        ],
      },
      Success: {
        Type: 'Succeed',
      },
    },
  };
};
