import { IConstruct } from 'constructs';
import { IAspect } from 'aws-cdk-lib';
import { Stack, Tags } from 'aws-cdk-lib';

/**
 * CDK Aspect for validating infrastructure best practices
 */
export class ResourceValidationAspect implements IAspect {
  private resourceCount = 0;
  private readonly maxResources: number;

  constructor(maxResources = 200) {
    this.maxResources = maxResources;
  }

  visit(node: IConstruct): void {
    // Count all constructs (simplified approach)
    this.resourceCount++;

    // Check resource count limit (rough estimate)
    if (this.resourceCount > this.maxResources) {
      console.warn(
        `Approaching maximum resource limit of ${this.maxResources}. ` +
          `Current count: ${this.resourceCount}. Consider splitting into multiple stacks.`
      );
    }

    // Apply consistent tagging
    this.applyConsistentTagging(node);
  }

  private applyConsistentTagging(node: IConstruct): void {
    if (node instanceof Stack) {
      // Apply stack-level tags
      Tags.of(node).add('Project', 'PaymentProcessing');
      Tags.of(node).add(
        'Environment',
        node.node.tryGetContext('environmentSuffix') || 'dev'
      );
      Tags.of(node).add('ManagedBy', 'CDK');
      Tags.of(node).add('Owner', 'PaymentTeam');
    }
  }
}

/**
 * CDK Aspect for IAM policy validation (simplified)
 */
export class IamValidationAspect implements IAspect {
  visit(node: IConstruct): void {
    // Simplified IAM validation - in a real implementation, this would analyze IAM resources
    // For now, just log that we're visiting constructs
    console.log(`IAM validation aspect visiting: ${node.constructor.name}`);
  }
}
