import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { IConstruct } from 'constructs';
import { ValidationRegistry } from '../core/validation-registry';

export class IAMPolicyAspect implements cdk.IAspect {
  visit(node: IConstruct): void {
    // Check both L1 (CfnRole/CfnPolicy) and L2 (Role) constructs
    if (node instanceof iam.CfnRole) {
      this.validateIAMRole(node);
    } else if (node instanceof iam.CfnPolicy) {
      this.validateIAMPolicy(node);
    } else if (node instanceof iam.Role) {
      this.validateL2Role(node);
    }
  }

  private validateL2Role(role: iam.Role): void {
    const startTime = Date.now();

    // Check inline policies attached to the role
    // Access the underlying CFN resource to get the policy document
    const cfnRole = role.node.defaultChild as iam.CfnRole;
    if (cfnRole && cfnRole.policies) {
      const policies = (cfnRole.policies as any[]) || [];
      for (const policy of policies) {
        this.checkPolicyDocument(
          policy.policyDocument,
          role.node.path,
          startTime
        );
      }
    }

    // Also check for managed policies added via addToPolicy
    // These are typically attached as separate CfnPolicy resources
    // which will be caught by validateIAMPolicy
  }

  private validateIAMRole(role: iam.CfnRole): void {
    const startTime = Date.now();

    // Check inline policies
    const policies = (role.policies as any[]) || [];

    for (const policy of policies) {
      this.checkPolicyDocument(
        policy.policyDocument,
        role.node.path,
        startTime
      );
    }
  }

  private validateIAMPolicy(policy: iam.CfnPolicy): void {
    const startTime = Date.now();

    // Handle both plain objects and PolicyDocument objects
    let policyDoc = policy.policyDocument;

    // If it's a PolicyDocument object, we need to access its toJSON() method or resolve it
    // During synthesis, CDK may use tokens or objects that need resolution
    if (policyDoc && typeof policyDoc === 'object' && 'toJSON' in policyDoc) {
      policyDoc = (policyDoc as any).toJSON();
    }

    this.checkPolicyDocument(policyDoc, policy.node.path, startTime);
  }

  private checkPolicyDocument(
    policyDoc: any,
    resourcePath: string,
    startTime: number
  ): void {
    if (!policyDoc || !policyDoc.Statement) {
      return;
    }

    const statements = Array.isArray(policyDoc.Statement)
      ? policyDoc.Statement
      : [policyDoc.Statement];

    for (const statement of statements) {
      if (statement.Effect !== 'Allow') {
        continue;
      }

      const hasWildcardAction = this.hasWildcard(statement.Action);
      const hasWildcardResource = this.hasWildcard(statement.Resource);

      if (hasWildcardAction && hasWildcardResource) {
        ValidationRegistry.addFinding({
          severity: 'critical',
          category: 'IAM',
          resource: resourcePath,
          message: 'IAM policy has wildcard (*) for both actions and resources',
          remediation:
            'Replace wildcards with specific actions and resources following the principle of least privilege',
          executionTime: Date.now() - startTime,
          metadata: {
            statement: JSON.stringify(statement),
            actions: statement.Action,
            resources: statement.Resource,
          },
        });
      } else if (hasWildcardAction) {
        ValidationRegistry.addFinding({
          severity: 'warning',
          category: 'IAM',
          resource: resourcePath,
          message: 'IAM policy has wildcard (*) for actions',
          remediation:
            'Replace wildcard actions with specific API actions required for the use case',
          executionTime: Date.now() - startTime,
          metadata: {
            actions: statement.Action,
          },
        });
      } else if (hasWildcardResource) {
        ValidationRegistry.addFinding({
          severity: 'warning',
          category: 'IAM',
          resource: resourcePath,
          message: 'IAM policy has wildcard (*) for resources',
          remediation: 'Replace wildcard resources with specific ARNs',
          executionTime: Date.now() - startTime,
          metadata: {
            resources: statement.Resource,
          },
        });
      }
    }
  }

  private hasWildcard(value: any): boolean {
    if (!value) return false;
    if (value === '*') return true;
    if (Array.isArray(value)) {
      return value.some(v => v === '*');
    }
    return false;
  }
}
