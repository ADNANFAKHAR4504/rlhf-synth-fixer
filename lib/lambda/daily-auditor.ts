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
