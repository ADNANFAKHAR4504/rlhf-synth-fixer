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
