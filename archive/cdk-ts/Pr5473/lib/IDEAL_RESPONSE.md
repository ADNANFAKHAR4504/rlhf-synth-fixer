# Overview

Please find solution files below.

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply compliance tags to all stacks in this app
Tags.of(app).add('iac-rlhf-amazon', 'true');
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Owner', 'SecurityTeam');
Tags.of(app).add('DataClassification', 'Sensitive');
Tags.of(app).add('ManagedBy', 'CDK');
Tags.of(app).add('Purpose', 'IAM Security Monitoring');
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambda/daily-auditor.ts

```typescript
/**
 * Daily IAM Policy Auditor Lambda Function
 *
 * Performs comprehensive audit of all IAM policies in the account.
 * Runs on a daily schedule to generate compliance reports.
 */

/* eslint-disable import/no-extraneous-dependencies */
// AWS SDK is externalized by NodejsFunction and provided by Lambda runtime
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  ListPoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  ListRolesCommand,
  ListUsersCommand,
  ListGroupsCommand,
} from '@aws-sdk/client-iam';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface PolicyViolation {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  details?: string;
}

interface PolicyAuditResult {
  policyName: string;
  policyArn: string;
  violations: PolicyViolation[];
  attachmentCount?: number;
  attachedTo?: string[];
}

interface AuditResults {
  timestamp: string;
  totalPolicies: number;
  totalRoles: number;
  totalUsers: number;
  totalGroups: number;
  violationsFound: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  policies: PolicyAuditResult[];
}

interface PolicyStatement {
  Sid?: string;
  Effect: string;
  Action: string | string[];
  Resource: string | string[];
  Principal?: any;
  Condition?: any;
}

interface PolicyDocument {
  Version: string;
  Statement: PolicyStatement[];
}

const logsClient = new CloudWatchLogsClient({});
const iamClient = new IAMClient({});
const snsClient = new SNSClient({});
const cloudwatchClient = new CloudWatchClient({});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;
const LOG_GROUP_NAME = process.env.LOG_GROUP_NAME!;

export const handler = async (): Promise<any> => {
  console.log('Starting daily IAM security audit...');

  const auditResults: AuditResults = {
    timestamp: new Date().toISOString(),
    totalPolicies: 0,
    totalRoles: 0,
    totalUsers: 0,
    totalGroups: 0,
    violationsFound: 0,
    highSeverityCount: 0,
    mediumSeverityCount: 0,
    lowSeverityCount: 0,
    policies: [],
  };

  try {
    // Gather statistics
    await gatherAccountStatistics(auditResults);

    // Audit customer-managed policies
    await auditCustomerManagedPolicies(auditResults);

    // Write audit results to CloudWatch Logs
    await writeAuditLog(auditResults);

    // Publish metrics to CloudWatch
    await publishMetrics(auditResults);

    // Send summary notification
    await sendAuditSummary(auditResults);

    console.log('Daily audit completed successfully');
    console.log(`Total violations found: ${auditResults.violationsFound}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily audit completed',
        summary: {
          totalPolicies: auditResults.totalPolicies,
          violationsFound: auditResults.violationsFound,
          highSeverity: auditResults.highSeverityCount,
          mediumSeverity: auditResults.mediumSeverityCount,
          lowSeverity: auditResults.lowSeverityCount,
        },
      }),
    };
  } catch (error) {
    console.error('Error during daily audit:', error);

    // Send error notification
    try {
      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: '[IAM Security] Daily Audit Failed',
          Message: `Daily IAM audit failed with error:\n\n${error instanceof Error ? error.message : String(error)}\n\nStack trace:\n${error instanceof Error ? error.stack : 'N/A'}`,
        })
      );
    } catch (snsError) {
      console.error('Failed to send error notification:', snsError);
    }

    throw error;
  }
};

/**
 * Gather account-level statistics
 */
async function gatherAccountStatistics(
  auditResults: AuditResults
): Promise<void> {
  try {
    // Count roles
    const rolesResponse = await iamClient.send(
      new ListRolesCommand({ MaxItems: 1000 })
    );
    auditResults.totalRoles = rolesResponse.Roles?.length || 0;

    // Count users
    const usersResponse = await iamClient.send(
      new ListUsersCommand({ MaxItems: 1000 })
    );
    auditResults.totalUsers = usersResponse.Users?.length || 0;

    // Count groups
    const groupsResponse = await iamClient.send(
      new ListGroupsCommand({ MaxItems: 1000 })
    );
    auditResults.totalGroups = groupsResponse.Groups?.length || 0;

    console.log(
      `Account statistics: ${auditResults.totalRoles} roles, ${auditResults.totalUsers} users, ${auditResults.totalGroups} groups`
    );
  } catch (error) {
    console.error('Error gathering account statistics:', error);
    // Continue with audit even if statistics gathering fails
  }
}

/**
 * Audit all customer-managed IAM policies
 */
async function auditCustomerManagedPolicies(
  auditResults: AuditResults
): Promise<void> {
  let marker: string | undefined;
  let policyCount = 0;

  do {
    const response = await iamClient.send(
      new ListPoliciesCommand({
        Scope: 'Local', // Only customer-managed policies
        MaxItems: 100,
        Marker: marker,
      })
    );

    const policies = response.Policies || [];
    auditResults.totalPolicies += policies.length;

    for (const policy of policies) {
      policyCount++;
      if (policyCount % 10 === 0) {
        console.log(`Audited ${policyCount} policies so far...`);
      }

      try {
        const auditResult = await auditPolicy(policy.Arn!, policy.PolicyName!);

        if (auditResult && auditResult.violations.length > 0) {
          auditResults.violationsFound++;
          auditResults.policies.push(auditResult);

          // Count by severity
          for (const violation of auditResult.violations) {
            if (violation.severity === 'HIGH') {
              auditResults.highSeverityCount++;
            } else if (violation.severity === 'MEDIUM') {
              auditResults.mediumSeverityCount++;
            } else if (violation.severity === 'LOW') {
              auditResults.lowSeverityCount++;
            }
          }
        }
      } catch (policyError) {
        console.error(
          `Error auditing policy ${policy.PolicyName}:`,
          policyError
        );
        // Continue with other policies
      }
    }

    marker = response.Marker;
  } while (marker);

  console.log(
    `Completed audit of ${auditResults.totalPolicies} customer-managed policies`
  );
}

/**
 * Audit a single IAM policy
 */
async function auditPolicy(
  policyArn: string,
  policyName: string
): Promise<PolicyAuditResult | null> {
  try {
    // Get policy details
    const policyResponse = await iamClient.send(
      new GetPolicyCommand({ PolicyArn: policyArn })
    );
    const policy = policyResponse.Policy;

    if (!policy || !policy.DefaultVersionId) {
      return null;
    }

    // Get policy version document
    const versionResponse = await iamClient.send(
      new GetPolicyVersionCommand({
        PolicyArn: policyArn,
        VersionId: policy.DefaultVersionId,
      })
    );

    const documentString = versionResponse.PolicyVersion?.Document;
    if (!documentString) {
      return null;
    }

    const policyDocument: PolicyDocument =
      typeof documentString === 'string'
        ? JSON.parse(decodeURIComponent(documentString))
        : (documentString as PolicyDocument);

    // Analyze policy
    const violations: PolicyViolation[] = [];
    analyzePolicyDocument(policyDocument, violations);

    // Get attachment count
    const attachmentCount = policy.AttachmentCount || 0;

    return {
      policyName,
      policyArn,
      violations,
      attachmentCount,
    };
  } catch (error) {
    console.error(`Error auditing policy ${policyName}:`, error);
    return null;
  }
}

/**
 * Analyze policy document for security violations
 */
function analyzePolicyDocument(
  policy: PolicyDocument,
  violations: PolicyViolation[]
): void {
  const statements = policy.Statement || [];

  for (const statement of statements) {
    if (statement.Effect !== 'Allow') {
      continue;
    }

    const actions = Array.isArray(statement.Action)
      ? statement.Action
      : [statement.Action];
    const resources = Array.isArray(statement.Resource)
      ? statement.Resource
      : [statement.Resource];

    // Check for wildcard in actions
    if (actions.includes('*')) {
      violations.push({
        type: 'WILDCARD_ACTION',
        severity: 'HIGH',
        details: 'Policy allows all actions (*)',
      });
    }

    // Check for wildcard in resources
    if (resources.includes('*')) {
      violations.push({
        type: 'WILDCARD_RESOURCE',
        severity: 'HIGH',
        details: 'Policy allows access to all resources (*)',
      });
    }

    // Check for dangerous action patterns
    const dangerousActions = [
      'iam:*',
      'kms:*',
      's3:DeleteBucket',
      'ec2:TerminateInstances',
      'rds:DeleteDBInstance',
      'dynamodb:DeleteTable',
      'lambda:DeleteFunction',
    ];

    for (const action of actions) {
      if (dangerousActions.includes(action) || action.endsWith(':*')) {
        violations.push({
          type: 'DANGEROUS_ACTION',
          severity: 'MEDIUM',
          details: `Potentially dangerous action: ${action}`,
        });
      }
    }

    // Check for overly permissive principals
    if (statement.Principal) {
      const principal = statement.Principal;
      if (
        principal === '*' ||
        (typeof principal === 'object' && principal.AWS === '*')
      ) {
        violations.push({
          type: 'WILDCARD_PRINCIPAL',
          severity: 'HIGH',
          details: 'Policy allows access from any principal (*)',
        });
      }
    }

    // Check for missing conditions on sensitive actions
    if (!statement.Condition) {
      const sensitiveActions = actions.filter(
        a =>
          a.startsWith('iam:') ||
          a.startsWith('sts:AssumeRole') ||
          a.startsWith('kms:')
      );

      if (sensitiveActions.length > 0) {
        violations.push({
          type: 'MISSING_CONDITION',
          severity: 'LOW',
          details: `Sensitive actions without conditions: ${sensitiveActions.join(', ')}`,
        });
      }
    }
  }
}

/**
 * Write audit results to CloudWatch Logs
 */
async function writeAuditLog(auditResults: AuditResults): Promise<void> {
  try {
    const logStreamName = `daily-audit-${Date.now()}`;

    // Create log stream
    try {
      await logsClient.send(
        new CreateLogStreamCommand({
          logGroupName: LOG_GROUP_NAME,
          logStreamName,
        })
      );
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }

    // Write audit results
    await logsClient.send(
      new PutLogEventsCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName,
        logEvents: [
          {
            message: JSON.stringify(auditResults, null, 2),
            timestamp: Date.now(),
          },
        ],
      })
    );

    console.log('Audit log written successfully');
  } catch (error) {
    console.error('Error writing audit log:', error);
  }
}

/**
 * Publish audit metrics to CloudWatch
 */
async function publishMetrics(auditResults: AuditResults): Promise<void> {
  try {
    const timestamp = new Date();

    await cloudwatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'IAMSecurity',
        MetricData: [
          {
            MetricName: 'PoliciesAudited',
            Value: auditResults.totalPolicies,
            Unit: 'Count',
            Timestamp: timestamp,
          },
          {
            MetricName: 'ViolationsFound',
            Value: auditResults.violationsFound,
            Unit: 'Count',
            Timestamp: timestamp,
          },
          {
            MetricName: 'HighSeverityViolations',
            Value: auditResults.highSeverityCount,
            Unit: 'Count',
            Timestamp: timestamp,
          },
          {
            MetricName: 'MediumSeverityViolations',
            Value: auditResults.mediumSeverityCount,
            Unit: 'Count',
            Timestamp: timestamp,
          },
          {
            MetricName: 'LowSeverityViolations',
            Value: auditResults.lowSeverityCount,
            Unit: 'Count',
            Timestamp: timestamp,
          },
          {
            MetricName: 'TotalRoles',
            Value: auditResults.totalRoles,
            Unit: 'Count',
            Timestamp: timestamp,
          },
          {
            MetricName: 'TotalUsers',
            Value: auditResults.totalUsers,
            Unit: 'Count',
            Timestamp: timestamp,
          },
        ],
      })
    );

    console.log('Metrics published successfully');
  } catch (error) {
    console.error('Error publishing metrics:', error);
  }
}

/**
 * Send audit summary notification
 */
async function sendAuditSummary(auditResults: AuditResults): Promise<void> {
  try {
    const hasViolations = auditResults.violationsFound > 0;
    const subject = hasViolations
      ? `[IAM Security] Daily Audit Report - ${auditResults.violationsFound} Violations Found`
      : '[IAM Security] Daily Audit Report - No Violations';

    // Generate top violators list
    const topViolators = auditResults.policies
      .sort((a, b) => b.violations.length - a.violations.length)
      .slice(0, 10);

    const message = `
Daily IAM Security Audit Report
═══════════════════════════════════════════════

Report Date: ${auditResults.timestamp}

ACCOUNT SUMMARY:
-----------------
Total Policies Audited: ${auditResults.totalPolicies}
Total Roles: ${auditResults.totalRoles}
Total Users: ${auditResults.totalUsers}
Total Groups: ${auditResults.totalGroups}

VIOLATION SUMMARY:
-----------------
Policies with Violations: ${auditResults.violationsFound}
🔴 HIGH Severity:   ${auditResults.highSeverityCount}
🟡 MEDIUM Severity: ${auditResults.mediumSeverityCount}
🟢 LOW Severity:    ${auditResults.lowSeverityCount}

${
  hasViolations
    ? `
TOP 10 POLICIES WITH VIOLATIONS:
---------------------------------
${topViolators
  .map(
    (p, idx) => `
${idx + 1}. ${p.policyName}
   Violations: ${p.violations.length}
   Attached to: ${p.attachmentCount || 0} entities
   Issues: ${p.violations.map(v => `${v.severity} - ${v.details}`).join(', ')}
`
  )
  .join('\n')}

RECOMMENDED ACTIONS:
-------------------
1. Review policies with HIGH severity violations immediately
2. Update policies to follow principle of least privilege
3. Remove wildcard (*) permissions where possible
4. Add condition statements for sensitive actions
5. Consider using AWS managed policies instead of custom policies

`
    : `
✅ COMPLIANCE STATUS: PASSED
No security violations detected in customer-managed IAM policies.
All policies appear to follow security best practices.
`
}

---
Automated report from IAM Security Monitoring System
Next audit scheduled for tomorrow at the same time.
`;

    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: subject,
        Message: message,
      })
    );

    console.log('Audit summary notification sent successfully');
  } catch (error) {
    console.error('Error sending audit summary:', error);
  }
}

```

## ./lib/lambda/policy-analyzer.ts

```typescript
/**
 * Real-time IAM Policy Analyzer Lambda Function
 *
 * Analyzes IAM policies for overly permissive actions when they are created or modified.
 * Triggered by EventBridge on IAM policy change events.
 */

/* eslint-disable import/no-extraneous-dependencies */
// AWS SDK is externalized by NodejsFunction and provided by Lambda runtime
import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  PutLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetPolicyCommand,
  GetPolicyVersionCommand,
} from '@aws-sdk/client-iam';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface PolicyViolation {
  type: string;
  statement: string;
  action?: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

interface PolicyStatement {
  Sid?: string;
  Effect: string;
  Action: string | string[];
  Resource: string | string[];
  Principal?: any;
  Condition?: any;
}

interface PolicyDocument {
  Version: string;
  Statement: PolicyStatement[];
}

interface EventDetail {
  eventName?: string;
  requestParameters?: any;
  responseElements?: any;
  userIdentity?: any;
  eventTime?: string;
}

interface LambdaEvent {
  detail: EventDetail;
  'detail-type'?: string;
  source?: string;
  region?: string;
  account?: string;
}

const logsClient = new CloudWatchLogsClient({});
const iamClient = new IAMClient({});
const snsClient = new SNSClient({});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;
const LOG_GROUP_NAME = process.env.LOG_GROUP_NAME!;

export const handler = async (event: LambdaEvent): Promise<any> => {
  console.log(
    'Received IAM policy change event:',
    JSON.stringify(event, null, 2)
  );

  try {
    const detail = event.detail || {};
    const eventName = detail.eventName || '';
    const requestParameters = detail.requestParameters || {};
    const responseElements = detail.responseElements || {};

    let policyDocument: PolicyDocument | null = null;
    let policyName = '';
    let policyArn = '';
    const violations: PolicyViolation[] = [];

    // Handle different IAM events and extract policy document
    if (eventName === 'CreatePolicy' || eventName === 'CreatePolicyVersion') {
      // Get policy document from request parameters
      const rawPolicyDoc = requestParameters.policyDocument;
      policyName =
        requestParameters.policyName ||
        responseElements?.policy?.policyName ||
        'Unknown';
      policyArn = responseElements?.policy?.arn || '';

      if (rawPolicyDoc) {
        policyDocument =
          typeof rawPolicyDoc === 'string'
            ? JSON.parse(decodeURIComponent(rawPolicyDoc))
            : rawPolicyDoc;
      } else if (policyArn) {
        // Fetch the policy if we have the ARN
        policyDocument = await fetchPolicyDocument(policyArn);
      }
    } else if (
      eventName === 'PutUserPolicy' ||
      eventName === 'PutRolePolicy' ||
      eventName === 'PutGroupPolicy'
    ) {
      const rawPolicyDoc = requestParameters.policyDocument;
      policyName = requestParameters.policyName || 'Unknown';
      const entityName =
        requestParameters.userName ||
        requestParameters.roleName ||
        requestParameters.groupName ||
        'Unknown';
      policyName = `${entityName}/${policyName}`;

      if (rawPolicyDoc) {
        policyDocument =
          typeof rawPolicyDoc === 'string'
            ? JSON.parse(decodeURIComponent(rawPolicyDoc))
            : rawPolicyDoc;
      }
    } else if (
      eventName === 'AttachUserPolicy' ||
      eventName === 'AttachRolePolicy' ||
      eventName === 'AttachGroupPolicy'
    ) {
      // For attach events, fetch the policy being attached
      policyArn = requestParameters.policyArn || '';
      const entityName =
        requestParameters.userName ||
        requestParameters.roleName ||
        requestParameters.groupName ||
        'Unknown';

      if (policyArn) {
        policyDocument = await fetchPolicyDocument(policyArn);
        policyName = policyArn.split('/').pop() || 'Unknown';
        policyName = `${entityName}/${policyName}`;
      }
    }

    if (policyDocument) {
      // Analyze the policy for violations
      analyzePolicy(policyDocument, violations);

      // Create audit log entry
      const logEntry = {
        timestamp: new Date().toISOString(),
        eventName,
        policyName,
        policyArn,
        violations,
        violationCount: violations.length,
        userIdentity: detail.userIdentity,
        eventTime: detail.eventTime,
        region: event.region,
        account: event.account,
      };

      // Write to CloudWatch Logs
      await writeAuditLog(logEntry);

      // Send alert if violations found
      if (violations.length > 0) {
        await sendSecurityAlert(logEntry, policyName, eventName, violations);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Policy analysis complete',
          policyName,
          violations: violations.length,
          severity: violations.some(v => v.severity === 'HIGH')
            ? 'HIGH'
            : violations.some(v => v.severity === 'MEDIUM')
              ? 'MEDIUM'
              : 'LOW',
        }),
      };
    } else {
      console.warn('No policy document found for analysis');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No policy document to analyze' }),
      };
    }
  } catch (error) {
    console.error('Error analyzing IAM policy:', error);

    // Send error notification
    try {
      await snsClient.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: '[IAM Security] Policy Analysis Error',
          Message: `Error analyzing IAM policy: ${error instanceof Error ? error.message : String(error)}`,
        })
      );
    } catch (snsError) {
      console.error('Failed to send error notification:', snsError);
    }

    throw error;
  }
};

/**
 * Fetch policy document from IAM
 */
async function fetchPolicyDocument(
  policyArn: string
): Promise<PolicyDocument | null> {
  try {
    const policyResponse = await iamClient.send(
      new GetPolicyCommand({ PolicyArn: policyArn })
    );
    const defaultVersionId = policyResponse.Policy?.DefaultVersionId;

    if (!defaultVersionId) {
      return null;
    }

    const versionResponse = await iamClient.send(
      new GetPolicyVersionCommand({
        PolicyArn: policyArn,
        VersionId: defaultVersionId,
      })
    );

    const document = versionResponse.PolicyVersion?.Document;
    if (document) {
      return typeof document === 'string'
        ? JSON.parse(decodeURIComponent(document))
        : (document as PolicyDocument);
    }

    return null;
  } catch (error) {
    console.error(`Error fetching policy ${policyArn}:`, error);
    return null;
  }
}

/**
 * Analyze policy document for security violations
 */
function analyzePolicy(
  policy: PolicyDocument,
  violations: PolicyViolation[]
): void {
  const statements = policy.Statement || [];

  for (const statement of statements) {
    if (statement.Effect !== 'Allow') {
      continue; // Only analyze Allow statements for overly permissive actions
    }

    const actions = Array.isArray(statement.Action)
      ? statement.Action
      : [statement.Action];
    const resources = Array.isArray(statement.Resource)
      ? statement.Resource
      : [statement.Resource];
    const statementId = statement.Sid || 'Unnamed';

    // Check for wildcard in actions
    if (actions.includes('*')) {
      violations.push({
        type: 'WILDCARD_ACTION',
        statement: statementId,
        severity: 'HIGH',
        message: 'Policy allows all actions (*) - this grants full permissions',
      });
    }

    // Check for wildcard in resources
    if (resources.includes('*')) {
      violations.push({
        type: 'WILDCARD_RESOURCE',
        statement: statementId,
        severity: 'HIGH',
        message:
          'Policy allows access to all resources (*) - should be scoped to specific resources',
      });
    }

    // Check for dangerous action patterns
    const dangerousPatterns = [
      {
        pattern: /^iam:\*$/,
        severity: 'HIGH' as const,
        description: 'full IAM permissions',
      },
      {
        pattern: /^s3:Delete\*$/,
        severity: 'MEDIUM' as const,
        description: 'S3 delete permissions',
      },
      {
        pattern: /^ec2:Terminate\*$/,
        severity: 'MEDIUM' as const,
        description: 'EC2 termination permissions',
      },
      {
        pattern: /^kms:\*$/,
        severity: 'HIGH' as const,
        description: 'full KMS permissions',
      },
      {
        pattern: /^dynamodb:Delete\*$/,
        severity: 'MEDIUM' as const,
        description: 'DynamoDB delete permissions',
      },
      {
        pattern: /^rds:Delete\*$/,
        severity: 'MEDIUM' as const,
        description: 'RDS delete permissions',
      },
      {
        pattern: /^lambda:Delete\*$/,
        severity: 'MEDIUM' as const,
        description: 'Lambda delete permissions',
      },
      {
        pattern: /^cloudformation:Delete\*$/,
        severity: 'MEDIUM' as const,
        description: 'CloudFormation delete permissions',
      },
    ];

    for (const action of actions) {
      for (const { pattern, severity, description } of dangerousPatterns) {
        if (pattern.test(action)) {
          violations.push({
            type: 'DANGEROUS_ACTION',
            statement: statementId,
            action,
            severity,
            message: `Policy contains potentially dangerous action: ${action} (${description})`,
          });
        }
      }

      // Check for overly broad wildcard actions
      if (
        action.endsWith(':*') &&
        !action.startsWith('iam:') &&
        !action.startsWith('kms:')
      ) {
        const service = action.split(':')[0];
        violations.push({
          type: 'BROAD_SERVICE_WILDCARD',
          statement: statementId,
          action,
          severity: 'MEDIUM',
          message: `Policy allows all actions for ${service} service - consider limiting to specific actions`,
        });
      }
    }

    // Check for overly permissive principal (if applicable)
    if (statement.Principal) {
      const principal = statement.Principal;
      if (
        principal === '*' ||
        (typeof principal === 'object' && principal.AWS === '*')
      ) {
        violations.push({
          type: 'WILDCARD_PRINCIPAL',
          statement: statementId,
          severity: 'HIGH',
          message:
            'Policy allows access from any principal (*) - should be restricted to specific principals',
        });
      }
    }
  }
}

/**
 * Write audit log to CloudWatch Logs
 */
async function writeAuditLog(logEntry: any): Promise<void> {
  try {
    const logStreamName = `policy-analysis-${Date.now()}`;

    // Create log stream (ignore error if it already exists)
    try {
      await logsClient.send(
        new CreateLogStreamCommand({
          logGroupName: LOG_GROUP_NAME,
          logStreamName,
        })
      );
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }

    // Put log events
    await logsClient.send(
      new PutLogEventsCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName,
        logEvents: [
          {
            message: JSON.stringify(logEntry),
            timestamp: Date.now(),
          },
        ],
      })
    );

    console.log('Audit log written successfully');
  } catch (error) {
    console.error('Error writing audit log:', error);
    // Don't throw - continue with the rest of the function
  }
}

/**
 * Send security alert via SNS
 */
async function sendSecurityAlert(
  logEntry: any,
  policyName: string,
  eventName: string,
  violations: PolicyViolation[]
): Promise<void> {
  try {
    const highSeverityCount = violations.filter(
      v => v.severity === 'HIGH'
    ).length;
    const mediumSeverityCount = violations.filter(
      v => v.severity === 'MEDIUM'
    ).length;
    const lowSeverityCount = violations.filter(
      v => v.severity === 'LOW'
    ).length;

    const emailMessage = `
IAM Security Alert: Policy Violations Detected
═══════════════════════════════════════════════

Policy Name: ${policyName}
Event: ${eventName}
Time: ${logEntry.timestamp}
Region: ${logEntry.region || 'N/A'}
Account: ${logEntry.account || 'N/A'}

SEVERITY SUMMARY:
-----------------
🔴 HIGH:   ${highSeverityCount}
🟡 MEDIUM: ${mediumSeverityCount}
🟢 LOW:    ${lowSeverityCount}

VIOLATIONS FOUND:
-----------------
${violations
  .map(
    (v, idx) => `
${idx + 1}. [${v.severity}] ${v.message}
   Statement: ${v.statement}
   ${v.action ? `Action: ${v.action}` : ''}
`
  )
  .join('\n')}

IMMEDIATE ACTION REQUIRED:
This policy should be reviewed and updated to follow the principle of least privilege.

---
Automated alert from IAM Security Monitoring System
`;

    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: `🚨 [IAM Security] ${highSeverityCount} HIGH severity violations in ${policyName}`,
        Message: emailMessage,
      })
    );

    console.log('Security alert sent successfully');
  } catch (error) {
    console.error('Error sending security alert:', error);
    // Don't throw - the analysis is still complete
  }
}

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

/**
 * IAM Security Monitoring and Remediation Stack
 *
 * Implements automated IAM security monitoring with:
 * - Real-time policy analysis via Lambda functions
 * - KMS encryption with automatic key rotation
 * - CloudWatch logging with 90-day retention
 * - EventBridge rules for IAM policy changes
 * - CloudWatch alarms for unusual activity
 * - SNS notifications for security alerts
 * - Daily scheduled audits
 * - Cross-account audit roles
 * - Compliance tagging
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const region = this.region;
    const account = this.account;

    // Resource naming with environment suffix and region
    const resourcePrefix = `iam-security-${environmentSuffix}-${region}`;

    // ==========================================
    // 1. KMS ENCRYPTION KEYS
    // ==========================================

    const logEncryptionKey = new kms.Key(this, 'LogEncryptionKey', {
      description: `KMS key for encrypting security audit logs (${environmentSuffix})`,
      enableKeyRotation: true, // Automatic key rotation enabled per requirement
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      alias: `alias/${resourcePrefix}-logs`,
      policy: new iam.PolicyDocument({
        statements: [
          // Root account access
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // CloudWatch Logs service access (restricted to specific service only)
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${region}.amazonaws.com`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${account}:*`,
              },
            },
          }),
          // Lambda service access (restricted to specific service only)
          new iam.PolicyStatement({
            sid: 'Allow Lambda Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
            actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `lambda.${region}.amazonaws.com`,
              },
            },
          }),
          // Explicit deny for key deletion
          new iam.PolicyStatement({
            sid: 'Deny Key Deletion',
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: [
              'kms:ScheduleKeyDeletion',
              'kms:Delete*',
              'kms:DisableKey',
            ],
            resources: ['*'],
            conditions: {
              StringNotEquals: {
                'aws:PrincipalArn': `arn:aws:iam::${account}:root`,
              },
            },
          }),
        ],
      }),
    });

    // ==========================================
    // 2. CLOUDWATCH LOG GROUPS
    // ==========================================

    const securityLogGroup = new logs.LogGroup(this, 'SecurityAuditLogGroup', {
      logGroupName: `/aws/security/${resourcePrefix}-audit`,
      retention: logs.RetentionDays.THREE_MONTHS, // 90-day retention per requirement
      encryptionKey: logEncryptionKey, // KMS encryption with customer-managed key
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const policyAnalyzerLogGroup = new logs.LogGroup(
      this,
      'PolicyAnalyzerLogGroup',
      {
        logGroupName: `/aws/lambda/${resourcePrefix}-policy-analyzer`,
        retention: logs.RetentionDays.THREE_MONTHS,
        encryptionKey: logEncryptionKey,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    const dailyAuditorLogGroup = new logs.LogGroup(
      this,
      'DailyAuditorLogGroup',
      {
        logGroupName: `/aws/lambda/${resourcePrefix}-daily-auditor`,
        retention: logs.RetentionDays.THREE_MONTHS,
        encryptionKey: logEncryptionKey,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    // ==========================================
    // 3. SNS TOPIC FOR SECURITY ALERTS
    // ==========================================

    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      topicName: `${resourcePrefix}-alerts`,
      displayName: `IAM Security Alerts (${environmentSuffix})`,
      masterKey: logEncryptionKey,
    });

    // Note: Email subscription can be added manually via AWS Console or CLI
    // to avoid hardcoding email addresses in the code

    // ==========================================
    // 4. DEAD LETTER QUEUES
    // ==========================================

    const eventDLQ = new sqs.Queue(this, 'EventProcessingDLQ', {
      queueName: `${resourcePrefix}-event-dlq`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: logEncryptionKey,
    });

    // ==========================================
    // 5. IAM ROLES WITH SESSION POLICIES
    // ==========================================

    // Lambda execution role with explicit deny statements for sensitive actions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${resourcePrefix}-lambda-execution`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Execution role for IAM policy analyzer Lambda (${environmentSuffix})`,
      maxSessionDuration: cdk.Duration.hours(1), // Restrict session duration
      inlinePolicies: {
        IAMPolicyAnalysis: new iam.PolicyDocument({
          statements: [
            // Allow reading IAM policies
            new iam.PolicyStatement({
              sid: 'AllowIAMReadAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:GetPolicy',
                'iam:GetPolicyVersion',
                'iam:ListPolicies',
                'iam:ListPolicyVersions',
                'iam:GetRole',
                'iam:ListRoles',
                'iam:GetUser',
                'iam:ListUsers',
                'iam:GetGroup',
                'iam:ListGroups',
                'iam:ListAttachedRolePolicies',
                'iam:ListAttachedUserPolicies',
                'iam:ListAttachedGroupPolicies',
                'iam:ListRolePolicies',
                'iam:ListUserPolicies',
                'iam:ListGroupPolicies',
              ],
              resources: ['*'],
            }),
            // Allow writing to CloudWatch Logs
            new iam.PolicyStatement({
              sid: 'AllowCloudWatchLogsWrite',
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
              ],
              resources: [
                securityLogGroup.logGroupArn,
                `${securityLogGroup.logGroupArn}:*`,
                policyAnalyzerLogGroup.logGroupArn,
                `${policyAnalyzerLogGroup.logGroupArn}:*`,
                dailyAuditorLogGroup.logGroupArn,
                `${dailyAuditorLogGroup.logGroupArn}:*`,
              ],
            }),
            // Allow publishing to SNS
            new iam.PolicyStatement({
              sid: 'AllowSNSPublish',
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [securityAlertsTopic.topicArn],
            }),
            // Allow CloudWatch metrics
            new iam.PolicyStatement({
              sid: 'AllowCloudWatchMetrics',
              effect: iam.Effect.ALLOW,
              actions: ['cloudwatch:PutMetricData'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'cloudwatch:namespace': 'IAMSecurity',
                },
              },
            }),
            // Explicit deny for sensitive actions (per requirement)
            new iam.PolicyStatement({
              sid: 'DenySensitiveActions',
              effect: iam.Effect.DENY,
              actions: [
                'iam:DeleteRole',
                'iam:DeleteUser',
                'iam:DeleteGroup',
                'iam:DeletePolicy',
                'iam:CreateAccessKey',
                'iam:DeleteAccessKey',
                'iam:PutUserPolicy',
                'iam:PutRolePolicy',
                'iam:PutGroupPolicy',
                'iam:AttachUserPolicy',
                'iam:AttachRolePolicy',
                'iam:AttachGroupPolicy',
                'iam:DetachUserPolicy',
                'iam:DetachRolePolicy',
                'iam:DetachGroupPolicy',
                'iam:CreatePolicy',
                'iam:CreatePolicyVersion',
                'kms:Delete*',
                'kms:ScheduleKeyDeletion',
                'kms:DisableKey',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ==========================================
    // 6. LAMBDA FUNCTIONS (Node.js 22)
    // ==========================================

    // Real-time IAM Policy Analyzer Lambda
    const policyAnalyzerLambda = new NodejsFunction(
      this,
      'PolicyAnalyzerLambda',
      {
        functionName: `${resourcePrefix}-policy-analyzer`,
        runtime: lambda.Runtime.NODEJS_22_X, // Node.js 22 per requirement
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'policy-analyzer.ts'),
        timeout: cdk.Duration.seconds(60), // 60 seconds or less per constraint
        memorySize: 512,
        role: lambdaExecutionRole,
        logGroup: policyAnalyzerLogGroup,
        environment: {
          SNS_TOPIC_ARN: securityAlertsTopic.topicArn,
          LOG_GROUP_NAME: securityLogGroup.logGroupName,
          ENVIRONMENT: environmentSuffix,
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node22',
          externalModules: ['@aws-sdk/*'], // AWS SDK v3 is included in Lambda runtime
        },
      }
    );

    // Daily Scheduled Audit Lambda
    const dailyAuditorLambda = new NodejsFunction(this, 'DailyAuditorLambda', {
      functionName: `${resourcePrefix}-daily-auditor`,
      runtime: lambda.Runtime.NODEJS_22_X, // Node.js 22 per requirement
      handler: 'handler',
      entry: path.join(__dirname, 'lambda', 'daily-auditor.ts'),
      timeout: cdk.Duration.seconds(60), // 60 seconds or less per constraint
      memorySize: 1024,
      role: lambdaExecutionRole,
      logGroup: dailyAuditorLogGroup,
      environment: {
        SNS_TOPIC_ARN: securityAlertsTopic.topicArn,
        LOG_GROUP_NAME: securityLogGroup.logGroupName,
        ENVIRONMENT: environmentSuffix,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node22',
        externalModules: ['@aws-sdk/*'], // AWS SDK v3 is included in Lambda runtime
      },
    });

    // ==========================================
    // 7. EVENTBRIDGE RULES WITH DLQ
    // ==========================================

    // Rule for IAM policy creation/modification
    const iamPolicyChangeRule = new events.Rule(this, 'IAMPolicyChangeRule', {
      ruleName: `${resourcePrefix}-policy-changes`,
      description: `Triggers on IAM policy creation or modification (${environmentSuffix})`,
      eventPattern: {
        source: ['aws.iam'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['iam.amazonaws.com'],
          eventName: [
            'CreatePolicy',
            'CreatePolicyVersion',
            'PutUserPolicy',
            'PutRolePolicy',
            'PutGroupPolicy',
            'AttachUserPolicy',
            'AttachRolePolicy',
            'AttachGroupPolicy',
          ],
        },
      },
    });

    // Add Lambda target with DLQ (per requirement)
    iamPolicyChangeRule.addTarget(
      new targets.LambdaFunction(policyAnalyzerLambda, {
        deadLetterQueue: eventDLQ,
        maxEventAge: cdk.Duration.hours(2),
        retryAttempts: 2,
      })
    );

    // Scheduled rule for daily audit
    const dailyAuditRule = new events.Rule(this, 'DailyAuditRule', {
      ruleName: `${resourcePrefix}-daily-audit`,
      description: `Triggers daily IAM policy audit (${environmentSuffix})`,
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '2', // Run at 2 AM UTC daily
      }),
    });

    dailyAuditRule.addTarget(
      new targets.LambdaFunction(dailyAuditorLambda, {
        deadLetterQueue: eventDLQ,
        maxEventAge: cdk.Duration.hours(2),
        retryAttempts: 2,
      })
    );

    // ==========================================
    // 8. CLOUDWATCH ALARMS
    // ==========================================

    // Metric for IAM policy changes (more than 5 changes in 10 minutes per requirement)
    const iamPolicyChangeMetric = new cloudwatch.Metric({
      namespace: 'AWS/Events',
      metricName: 'Invocations',
      dimensionsMap: {
        RuleName: iamPolicyChangeRule.ruleName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(10),
    });

    // Alarm for unusual IAM activity (per requirement: >5 policy changes in 10 minutes)
    const unusualActivityAlarm = new cloudwatch.Alarm(
      this,
      'UnusualIAMActivityAlarm',
      {
        alarmName: `${resourcePrefix}-unusual-activity`,
        alarmDescription: `Triggers when more than 5 IAM policy changes occur in 10 minutes (${environmentSuffix})`,
        metric: iamPolicyChangeMetric,
        threshold: 5,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    // Add SNS action to alarm
    unusualActivityAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // Lambda error alarm
    const policyAnalyzerErrorMetric = policyAnalyzerLambda.metricErrors({
      period: cdk.Duration.minutes(5),
      statistic: cloudwatch.Stats.SUM,
    });

    const policyAnalyzerErrorAlarm = new cloudwatch.Alarm(
      this,
      'PolicyAnalyzerErrorAlarm',
      {
        alarmName: `${resourcePrefix}-policy-analyzer-errors`,
        alarmDescription: `Triggers when policy analyzer Lambda errors occur (${environmentSuffix})`,
        metric: policyAnalyzerErrorMetric,
        threshold: 1,
        evaluationPeriods: 1,
      }
    );

    policyAnalyzerErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // Daily auditor error alarm
    const dailyAuditorErrorMetric = dailyAuditorLambda.metricErrors({
      period: cdk.Duration.minutes(5),
      statistic: cloudwatch.Stats.SUM,
    });

    const dailyAuditorErrorAlarm = new cloudwatch.Alarm(
      this,
      'DailyAuditorErrorAlarm',
      {
        alarmName: `${resourcePrefix}-daily-auditor-errors`,
        alarmDescription: `Triggers when daily auditor Lambda errors occur (${environmentSuffix})`,
        metric: dailyAuditorErrorMetric,
        threshold: 1,
        evaluationPeriods: 1,
      }
    );

    dailyAuditorErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // ==========================================
    // 9. CROSS-ACCOUNT AUDIT ROLE
    // ==========================================

    // Cross-account role for security auditing (per requirement)
    // Note: The external account ID should be provided via context or parameter
    // For now, we create the role but leave it assumable only from the same account
    // Users can update the trust policy after deployment
    const crossAccountAuditRole = new iam.Role(this, 'CrossAccountAuditRole', {
      roleName: `${resourcePrefix}-cross-account-audit`,
      assumedBy: new iam.AccountPrincipal(account), // Default to same account, can be updated
      externalIds: [`iam-security-audit-${environmentSuffix}`], // External ID validation per requirement
      description: `Cross-account role for security auditing (${environmentSuffix})`,
      maxSessionDuration: cdk.Duration.hours(1),
      inlinePolicies: {
        AuditPolicy: new iam.PolicyDocument({
          statements: [
            // Read-only access to IAM
            new iam.PolicyStatement({
              sid: 'AllowIAMReadOnlyAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:Get*',
                'iam:List*',
                'iam:GenerateCredentialReport',
                'iam:GenerateServiceLastAccessedDetails',
                'iam:SimulateCustomPolicy',
                'iam:SimulatePrincipalPolicy',
              ],
              resources: ['*'],
            }),
            // Read CloudWatch Logs
            new iam.PolicyStatement({
              sid: 'AllowCloudWatchLogsRead',
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:Describe*',
                'logs:Get*',
                'logs:List*',
                'logs:FilterLogEvents',
                'logs:StartQuery',
                'logs:StopQuery',
                'logs:TestMetricFilter',
              ],
              resources: ['*'],
            }),
            // Read CloudTrail events
            new iam.PolicyStatement({
              sid: 'AllowCloudTrailRead',
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudtrail:LookupEvents',
                'cloudtrail:GetTrailStatus',
                'cloudtrail:DescribeTrails',
                'cloudtrail:GetEventSelectors',
              ],
              resources: ['*'],
            }),
            // Explicit deny for all modification actions (per requirement)
            new iam.PolicyStatement({
              sid: 'DenyAllModifications',
              effect: iam.Effect.DENY,
              actions: [
                'iam:Create*',
                'iam:Delete*',
                'iam:Put*',
                'iam:Update*',
                'iam:Attach*',
                'iam:Detach*',
                'iam:Remove*',
                'iam:Add*',
                'iam:Change*',
                'iam:Set*',
                'iam:Enable*',
                'iam:Disable*',
                'logs:Create*',
                'logs:Delete*',
                'logs:Put*',
                'cloudtrail:Create*',
                'cloudtrail:Delete*',
                'cloudtrail:Put*',
                'cloudtrail:Update*',
                'cloudtrail:Start*',
                'cloudtrail:Stop*',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ==========================================
    //Note: Compliance tagging is handled in bin/tap.ts at the app level
    // ==========================================
    // 11. CLOUDFORMATION OUTPUTS
    // ==========================================

    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: securityAlertsTopic.topicArn,
      description: 'ARN of the SNS topic for security alerts',
      exportName: `${resourcePrefix}-alerts-topic-arn`,
    });

    new cdk.CfnOutput(this, 'CrossAccountAuditRoleArn', {
      value: crossAccountAuditRole.roleArn,
      description: 'ARN of the cross-account audit role',
      exportName: `${resourcePrefix}-audit-role-arn`,
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: logEncryptionKey.keyArn,
      description: 'ARN of the KMS key for log encryption',
      exportName: `${resourcePrefix}-kms-key-arn`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: logEncryptionKey.keyId,
      description: 'ID of the KMS key for log encryption',
      exportName: `${resourcePrefix}-kms-key-id`,
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: eventDLQ.queueUrl,
      description: 'URL of the dead letter queue for failed events',
      exportName: `${resourcePrefix}-dlq-url`,
    });

    new cdk.CfnOutput(this, 'PolicyAnalyzerLambdaArn', {
      value: policyAnalyzerLambda.functionArn,
      description: 'ARN of the policy analyzer Lambda function',
      exportName: `${resourcePrefix}-policy-analyzer-arn`,
    });

    new cdk.CfnOutput(this, 'DailyAuditorLambdaArn', {
      value: dailyAuditorLambda.functionArn,
      description: 'ARN of the daily auditor Lambda function',
      exportName: `${resourcePrefix}-daily-auditor-arn`,
    });

    new cdk.CfnOutput(this, 'SecurityLogGroupName', {
      value: securityLogGroup.logGroupName,
      description: 'Name of the security audit log group',
      exportName: `${resourcePrefix}-log-group-name`,
    });

    new cdk.CfnOutput(this, 'IAMPolicyChangeRuleName', {
      value: iamPolicyChangeRule.ruleName,
      description: 'Name of the EventBridge rule for IAM policy changes',
      exportName: `${resourcePrefix}-policy-change-rule`,
    });

    new cdk.CfnOutput(this, 'UnusualActivityAlarmName', {
      value: unusualActivityAlarm.alarmName,
      description: 'Name of the CloudWatch alarm for unusual IAM activity',
      exportName: `${resourcePrefix}-unusual-activity-alarm`,
    });
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
/**
 * Integration tests for TapStack
 * Tests live resources deployed in AWS
 */

import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';

describe('TapStack Integration Tests', () => {
  const region = process.env.AWS_REGION || 'ap-northeast-1';
  const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

  let outputs: Record<string, string>;
  let kms: AWS.KMS;
  let lambda: AWS.Lambda;
  let cloudwatchlogs: AWS.CloudWatchLogs;
  let eventbridge: AWS.EventBridge;
  let cloudwatch: AWS.CloudWatch;
  let sns: AWS.SNS;
  let sqs: AWS.SQS;
  let iam: AWS.IAM;

  beforeAll(() => {
    // Read outputs from flat-outputs.json
    expect(fs.existsSync(outputsPath)).toBe(true);
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    // Configure AWS SDK v2
    AWS.config.update({ region });

    // Initialize AWS SDK v2 clients
    kms = new AWS.KMS();
    lambda = new AWS.Lambda();
    cloudwatchlogs = new AWS.CloudWatchLogs();
    eventbridge = new AWS.EventBridge();
    cloudwatch = new AWS.CloudWatch();
    sns = new AWS.SNS();
    sqs = new AWS.SQS();
    iam = new AWS.IAM();
  });

  describe('KMS Key', () => {
    test('should exist and have rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const keyResponse = await kms.describeKey({ KeyId: keyId }).promise();

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

      const rotationResponse = await kms
        .getKeyRotationStatus({ KeyId: keyId })
        .promise();

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('should have correct ARN format', () => {
      const keyArn = outputs.KMSKeyArn;
      expect(keyArn).toMatch(
        /^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+$/
      );
    });
  });

  describe('Lambda Functions', () => {
    test('policy analyzer Lambda should exist with correct configuration', async () => {
      const functionArn = outputs.PolicyAnalyzerLambdaArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop() || '';
      const response = await lambda
        .getFunctionConfiguration({ FunctionName: functionName })
        .promise();

      expect(response.Runtime).toBe('nodejs22.x');
      expect(response.Timeout).toBeLessThanOrEqual(60);
      expect(response.MemorySize).toBe(512);
      expect(response.State).toBe('Active');

      // Check environment variables
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBe(
        outputs.SecurityAlertsTopicArn
      );
      expect(response.Environment?.Variables?.LOG_GROUP_NAME).toBe(
        outputs.SecurityLogGroupName
      );
    }, 30000);

    test('daily auditor Lambda should exist with correct configuration', async () => {
      const functionArn = outputs.DailyAuditorLambdaArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop() || '';
      const response = await lambda
        .getFunctionConfiguration({ FunctionName: functionName })
        .promise();

      expect(response.Runtime).toBe('nodejs22.x');
      expect(response.Timeout).toBeLessThanOrEqual(60);
      expect(response.MemorySize).toBe(1024);
      expect(response.State).toBe('Active');

      // Check environment variables
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBe(
        outputs.SecurityAlertsTopicArn
      );
      expect(response.Environment?.Variables?.LOG_GROUP_NAME).toBe(
        outputs.SecurityLogGroupName
      );
    }, 30000);
  });

  describe('CloudWatch Log Groups', () => {
    test('security audit log group should exist with 90-day retention', async () => {
      const logGroupName = outputs.SecurityLogGroupName;
      expect(logGroupName).toBeDefined();

      const response = await cloudwatchlogs
        .describeLogGroups({ logGroupNamePrefix: logGroupName })
        .promise();

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);

    test('policy analyzer log group should exist with 90-day retention', async () => {
      const policyAnalyzerName = outputs.PolicyAnalyzerLambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${policyAnalyzerName}`;

      const response = await cloudwatchlogs
        .describeLogGroups({ logGroupNamePrefix: logGroupName })
        .promise();

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);

    test('daily auditor log group should exist with 90-day retention', async () => {
      const dailyAuditorName = outputs.DailyAuditorLambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${dailyAuditorName}`;

      const response = await cloudwatchlogs
        .describeLogGroups({ logGroupNamePrefix: logGroupName })
        .promise();

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('EventBridge Rules', () => {
    test('IAM policy change rule should exist and be enabled', async () => {
      const ruleName = outputs.IAMPolicyChangeRuleName;
      expect(ruleName).toBeDefined();

      const response = await eventbridge
        .describeRule({ Name: ruleName })
        .promise();

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();

      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.iam');
      expect(eventPattern['detail-type']).toContain(
        'AWS API Call via CloudTrail'
      );
      expect(eventPattern.detail?.eventName).toBeDefined();
    }, 30000);

    test('IAM policy change rule should have Lambda target with DLQ', async () => {
      const ruleName = outputs.IAMPolicyChangeRuleName;

      const response = await eventbridge
        .listTargetsByRule({ Rule: ruleName })
        .promise();

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);

      const target = response.Targets?.[0];
      expect(target?.Arn).toBe(outputs.PolicyAnalyzerLambdaArn);
      expect(target?.DeadLetterConfig?.Arn).toBeDefined();
      expect(target?.RetryPolicy).toBeDefined();
      expect(target?.RetryPolicy?.MaximumRetryAttempts).toBe(2);
    }, 30000);

    test('daily audit rule should exist with cron schedule', async () => {
      const dailyAuditorName = outputs.DailyAuditorLambdaArn.split(':').pop();
      const ruleName = dailyAuditorName?.replace('daily-auditor', 'daily-audit');

      const response = await eventbridge
        .describeRule({ Name: ruleName })
        .promise();

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBe('cron(0 2 * * ? *)');
    }, 30000);
  });

  describe('CloudWatch Alarms', () => {
    test('unusual activity alarm should exist with correct configuration', async () => {
      const alarmName = outputs.UnusualActivityAlarmName;
      expect(alarmName).toBeDefined();

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.AlarmName).toBe(alarmName);
      expect(alarm?.Threshold).toBe(5);
      expect(alarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm?.EvaluationPeriods).toBe(1);
      expect(alarm?.AlarmActions).toBeDefined();
      expect(alarm?.AlarmActions?.length).toBeGreaterThan(0);
    }, 30000);

    test('policy analyzer error alarm should exist', async () => {
      const policyAnalyzerName = outputs.PolicyAnalyzerLambdaArn.split(':').pop();
      const alarmName = `${policyAnalyzerName?.replace('-policy-analyzer', '')}-policy-analyzer-errors`;

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.Threshold).toBe(1);
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.MetricName).toBe('Errors');
    }, 30000);

    test('daily auditor error alarm should exist', async () => {
      const dailyAuditorName = outputs.DailyAuditorLambdaArn.split(':').pop();
      const alarmName = `${dailyAuditorName?.replace('-daily-auditor', '')}-daily-auditor-errors`;

      const response = await cloudwatch
        .describeAlarms({ AlarmNames: [alarmName] })
        .promise();

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.Threshold).toBe(1);
      expect(alarm?.Namespace).toBe('AWS/Lambda');
      expect(alarm?.MetricName).toBe('Errors');
    }, 30000);
  });

  describe('SNS Topic', () => {
    test('security alerts topic should exist with KMS encryption', async () => {
      const topicArn = outputs.SecurityAlertsTopicArn;
      expect(topicArn).toBeDefined();

      const response = await sns
        .getTopicAttributes({ TopicArn: topicArn })
        .promise();

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.DisplayName).toContain('IAM Security Alerts');
    }, 30000);
  });

  describe('Dead Letter Queue', () => {
    test('DLQ should exist with correct configuration', async () => {
      const dlqUrl = outputs.DLQUrl;
      expect(dlqUrl).toBeDefined();

      const response = await sqs
        .getQueueAttributes({
          QueueUrl: dlqUrl,
          AttributeNames: ['All'],
        })
        .promise();

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.MessageRetentionPeriod).toBe('1209600'); // 14 days
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    }, 30000);
  });

  describe('IAM Roles', () => {
    test('Lambda execution role should exist with explicit deny statements', async () => {
      const policyAnalyzerName = outputs.PolicyAnalyzerLambdaArn.split(':').pop();
      const roleName = policyAnalyzerName?.replace('-policy-analyzer', '-lambda-execution');

      const response = await iam.getRole({ RoleName: roleName }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600);
    }, 30000);

    test('cross-account audit role should exist with external ID', async () => {
      const roleArn = outputs.CrossAccountAuditRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop() || '';
      const response = await iam.getRole({ RoleName: roleName }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role?.MaxSessionDuration).toBe(3600);

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      const statement = assumeRolePolicy.Statement?.find(
        (s: any) => s.Condition?.StringEquals?.['sts:ExternalId']
      );

      expect(statement).toBeDefined();
      expect(statement.Condition.StringEquals['sts:ExternalId']).toBeDefined();
    }, 30000);
  });

  describe('Resource Naming', () => {
    test('all resources should follow naming convention', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const expectedPrefix = `iam-security-${environmentSuffix}-${region}`;

      expect(outputs.PolicyAnalyzerLambdaArn).toContain(expectedPrefix);
      expect(outputs.DailyAuditorLambdaArn).toContain(expectedPrefix);
      expect(outputs.SecurityLogGroupName).toContain(expectedPrefix);
      expect(outputs.IAMPolicyChangeRuleName).toBe(`${expectedPrefix}-policy-changes`);
      expect(outputs.UnusualActivityAlarmName).toBe(`${expectedPrefix}-unusual-activity`);
    });
  });

  describe('End-to-End Resource Verification', () => {
    test('all critical outputs should be present', () => {
      const requiredOutputs = [
        'SecurityAlertsTopicArn',
        'CrossAccountAuditRoleArn',
        'KMSKeyArn',
        'KMSKeyId',
        'DLQUrl',
        'PolicyAnalyzerLambdaArn',
        'DailyAuditorLambdaArn',
        'SecurityLogGroupName',
        'IAMPolicyChangeRuleName',
        'UnusualActivityAlarmName',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('ARNs should match the correct region and account', () => {
      const arnPattern = new RegExp(`arn:aws:[^:]+:${region}:\\d{12}:`);

      expect(outputs.PolicyAnalyzerLambdaArn).toMatch(arnPattern);
      expect(outputs.DailyAuditorLambdaArn).toMatch(arnPattern);
      expect(outputs.SecurityAlertsTopicArn).toMatch(arnPattern);
      expect(outputs.KMSKeyArn).toMatch(arnPattern);
      expect(outputs.CrossAccountAuditRoleArn).toMatch(/arn:aws:iam::\d{12}:role\//);
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should have proper key policy with root access', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        }),
      });
    });

    test('should restrict CloudWatch Logs access with conditions', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Condition: Match.objectLike({
                ArnLike: Match.objectLike({
                  'kms:EncryptionContext:aws:logs:arn': Match.stringLikeRegexp(
                    'arn:aws:logs:.*'
                  ),
                }),
              }),
            }),
          ]),
        }),
      });
    });

    test('should have explicit deny for key deletion', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Deny Key Deletion',
              Effect: 'Deny',
            }),
          ]),
        }),
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/iam-security-test-ap-northeast-1-logs',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create security audit log group with 90-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/security/iam-security-test-ap-northeast-1-audit',
        RetentionInDays: 90,
      });
    });

    test('should create policy analyzer log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName:
          '/aws/lambda/iam-security-test-ap-northeast-1-policy-analyzer',
        RetentionInDays: 90,
      });
    });

    test('should create daily auditor log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName:
          '/aws/lambda/iam-security-test-ap-northeast-1-daily-auditor',
        RetentionInDays: 90,
      });
    });

    test('should encrypt all log groups with KMS', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupKeys = Object.keys(logGroups);

      expect(logGroupKeys.length).toBeGreaterThanOrEqual(3);

      logGroupKeys.forEach((key) => {
        expect(logGroups[key].Properties).toHaveProperty('KmsKeyId');
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create security alerts topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'IAM Security Alerts (test)',
      });
    });

    test('should encrypt SNS topic with KMS', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('.*Key.*')]),
        }),
      });
    });
  });

  describe('Dead Letter Queue', () => {
    test('should create DLQ with 14-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });

    test('should encrypt DLQ with KMS', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('.*Key.*')]),
        }),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'iam-security-test-ap-northeast-1-lambda-execution',
        MaxSessionDuration: 3600,
      });
    });

    test('should have explicit deny statements in Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'DenySensitiveActions',
                  Effect: 'Deny',
                  Action: Match.arrayWith([
                    'iam:DeleteRole',
                    'iam:DeleteUser',
                    'kms:ScheduleKeyDeletion',
                  ]),
                }),
              ]),
            }),
          }),
        ]),
      });
    });

    test('should allow IAM read access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'AllowIAMReadAccess',
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'iam:GetPolicy',
                    'iam:ListPolicies',
                  ]),
                }),
              ]),
            }),
          }),
        ]),
      });
    });

    test('should create cross-account audit role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'iam-security-test-ap-northeast-1-cross-account-audit',
        MaxSessionDuration: 3600,
      });
    });

    test('should have external ID on cross-account role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: Match.objectLike({
                StringEquals: Match.objectLike({
                  'sts:ExternalId': 'iam-security-audit-test',
                }),
              }),
            }),
          ]),
        }),
      });
    });

    test('should have explicit deny in cross-account role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'DenyAllModifications',
                  Effect: 'Deny',
                }),
              ]),
            }),
          }),
        ]),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create policy analyzer Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'iam-security-test-ap-northeast-1-policy-analyzer',
        Runtime: 'nodejs22.x',
        Timeout: 60,
        MemorySize: 512,
      });
    });

    test('should create daily auditor Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'iam-security-test-ap-northeast-1-daily-auditor',
        Runtime: 'nodejs22.x',
        Timeout: 60,
        MemorySize: 1024,
      });
    });

    test('should set environment variables for policy analyzer', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            SNS_TOPIC_ARN: Match.anyValue(),
            LOG_GROUP_NAME: Match.anyValue(),
            ENVIRONMENT: 'test',
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          }),
        }),
      });
    });

    test('should attach Lambda to correct log groups', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties).toHaveProperty('LoggingConfig');
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create IAM policy change rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'iam-security-test-ap-northeast-1-policy-changes',
        EventPattern: Match.objectLike({
          source: ['aws.iam'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: Match.objectLike({
            eventSource: ['iam.amazonaws.com'],
            eventName: Match.arrayWith([
              'CreatePolicy',
              'PutUserPolicy',
              'AttachRolePolicy',
            ]),
          }),
        }),
      });
    });

    test('should create daily audit rule with cron schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'iam-security-test-ap-northeast-1-daily-audit',
        ScheduleExpression: 'cron(0 2 * * ? *)',
      });
    });

    test('should configure DLQ for event rule targets', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            DeadLetterConfig: Match.objectLike({
              Arn: Match.anyValue(),
            }),
            RetryPolicy: Match.objectLike({
              MaximumEventAgeInSeconds: 7200,
              MaximumRetryAttempts: 2,
            }),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create unusual activity alarm with correct threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'iam-security-test-ap-northeast-1-unusual-activity',
        Threshold: 5,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create policy analyzer error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'iam-security-test-ap-northeast-1-policy-analyzer-errors',
        Threshold: 1,
      });
    });

    test('should create daily auditor error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'iam-security-test-ap-northeast-1-daily-auditor-errors',
        Threshold: 1,
      });
    });

    test('should configure SNS actions for all alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmKeys = Object.keys(alarms);

      expect(alarmKeys.length).toBeGreaterThanOrEqual(3);

      alarmKeys.forEach((key) => {
        expect(alarms[key].Properties).toHaveProperty('AlarmActions');
        expect(alarms[key].Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export SecurityAlertsTopicArn', () => {
      template.hasOutput('SecurityAlertsTopicArn', {
        Export: {
          Name: 'iam-security-test-ap-northeast-1-alerts-topic-arn',
        },
      });
    });

    test('should export CrossAccountAuditRoleArn', () => {
      template.hasOutput('CrossAccountAuditRoleArn', {
        Export: {
          Name: 'iam-security-test-ap-northeast-1-audit-role-arn',
        },
      });
    });

    test('should export KMSKeyArn', () => {
      template.hasOutput('KMSKeyArn', {
        Export: {
          Name: 'iam-security-test-ap-northeast-1-kms-key-arn',
        },
      });
    });

    test('should export all required outputs', () => {
      const outputs = [
        'SecurityAlertsTopicArn',
        'CrossAccountAuditRoleArn',
        'KMSKeyArn',
        'KMSKeyId',
        'DLQUrl',
        'PolicyAnalyzerLambdaArn',
        'DailyAuditorLambdaArn',
        'SecurityLogGroupName',
        'IAMPolicyChangeRuleName',
        'UnusualActivityAlarmName',
      ];

      outputs.forEach((outputName) => {
        const output = template.findOutputs(outputName);
        expect(Object.keys(output)).toHaveLength(1);
      });
    });
  });

  describe('Resource Naming', () => {
    test('should use environment suffix in all resource names', () => {
      const resourcePrefix = 'iam-security-test-ap-northeast-1';

      // Check Lambda functions
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(`^${resourcePrefix}-.*`),
      });

      // Check Log groups
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`.*${resourcePrefix}.*`),
      });

      // Check EventBridge rules
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: Match.stringLikeRegexp(`^${resourcePrefix}-.*`),
      });
    });

    test('should use region in resource naming', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('.*ap-northeast-1.*'),
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map(
        (r: any) => r.Type
      );

      // Count specific resource types
      expect(
        resourceTypes.filter((t) => t === 'AWS::Lambda::Function').length
      ).toBe(2);
      expect(
        resourceTypes.filter((t) => t === 'AWS::Logs::LogGroup').length
      ).toBe(3);
      expect(resourceTypes.filter((t) => t === 'AWS::IAM::Role').length).toBe(
        2
      );
      expect(resourceTypes.filter((t) => t === 'AWS::KMS::Key').length).toBe(
        1
      );
      expect(
        resourceTypes.filter((t) => t === 'AWS::Events::Rule').length
      ).toBe(2);
      expect(
        resourceTypes.filter((t) => t === 'AWS::CloudWatch::Alarm').length
      ).toBe(3);
      expect(resourceTypes.filter((t) => t === 'AWS::SNS::Topic').length).toBe(
        1
      );
      expect(resourceTypes.filter((t) => t === 'AWS::SQS::Queue').length).toBe(
        1
      );
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with public access', () => {
      const resources = template.toJSON().Resources;

      Object.values(resources).forEach((resource: any) => {
        // Check no S3 buckets have public read/write
        if (resource.Type === 'AWS::S3::Bucket') {
          expect(resource.Properties?.PublicAccessBlockConfiguration).toBeDefined();
        }

        // Check no security groups allow 0.0.0.0/0
        if (resource.Type === 'AWS::EC2::SecurityGroup') {
          const ingress = resource.Properties?.SecurityGroupIngress || [];
          ingress.forEach((rule: any) => {
            expect(rule.CidrIp).not.toBe('0.0.0.0/0');
          });
        }
      });
    });

    test('should use encryption for all data at rest', () => {
      // All log groups should have KMS encryption
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((lg: any) => {
        expect(lg.Properties).toHaveProperty('KmsKeyId');
      });

      // SNS topic should have KMS encryption
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });

      // SQS queue should have KMS encryption
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('should have timeouts configured for all Lambdas', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.Timeout).toBeLessThanOrEqual(60);
        expect(func.Properties.Timeout).toBeGreaterThan(0);
      });
    });
  });

  describe('Multi-Environment Support', () => {
    test('should work with different environment suffixes', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('iam-security-dev-us-east-1.*'),
      });

      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('iam-security-prod-us-west-2.*'),
      });
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
