import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { IConstruct } from 'constructs';
import { ValidationRegistry } from '../core/validation-registry';

export class LambdaConfigAspect implements cdk.IAspect {
  private readonly RECOMMENDED_TIMEOUT = 30; // seconds
  private readonly MAX_TIMEOUT = 300; // 5 minutes
  private readonly MIN_MEMORY = 256; // MB
  private readonly REQUIRED_ENV_VARS = ['ENV', 'LOG_LEVEL']; // Example required vars

  visit(node: IConstruct): void {
    if (node instanceof lambda.CfnFunction) {
      this.validateLambdaConfig(node);
    }
  }

  private validateLambdaConfig(fn: lambda.CfnFunction): void {
    const startTime = Date.now();
    const functionName = fn.functionName || fn.logicalId;

    // Check timeout
    const timeout = fn.timeout || 3; // Default is 3 seconds
    if (timeout > this.MAX_TIMEOUT) {
      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'Lambda',
        resource: fn.node.path,
        message: `Lambda function timeout (${timeout}s) exceeds recommended maximum (${this.MAX_TIMEOUT}s)`,
        remediation: `Set timeout to ${this.RECOMMENDED_TIMEOUT}s or configure async processing for long-running tasks`,
        executionTime: Date.now() - startTime,
        metadata: {
          functionName,
          currentTimeout: timeout,
          recommendedTimeout: this.RECOMMENDED_TIMEOUT,
        },
      });
    }

    // Check memory
    const memory = fn.memorySize || 128; // Default is 128 MB
    if (memory < this.MIN_MEMORY) {
      ValidationRegistry.addFinding({
        severity: 'info',
        category: 'Lambda',
        resource: fn.node.path,
        message: `Lambda function memory (${memory}MB) is below recommended minimum (${this.MIN_MEMORY}MB)`,
        remediation: `Increase memory to at least ${this.MIN_MEMORY}MB for better performance and reduce execution time`,
        executionTime: Date.now() - startTime,
        metadata: {
          functionName,
          currentMemory: memory,
          recommendedMemory: this.MIN_MEMORY,
        },
      });
    }

    // Check environment variables
    const environment = fn.environment as any;
    const envVars = environment?.variables || {};
    const missingVars: string[] = [];

    for (const requiredVar of this.REQUIRED_ENV_VARS) {
      if (!(requiredVar in envVars)) {
        missingVars.push(requiredVar);
      }
    }

    if (missingVars.length > 0) {
      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'Lambda',
        resource: fn.node.path,
        message: `Lambda function is missing recommended environment variables: ${missingVars.join(', ')}`,
        remediation:
          'Add the missing environment variables to improve operational visibility',
        executionTime: Date.now() - startTime,
        metadata: {
          functionName,
          missingVariables: missingVars,
          currentVariables: Object.keys(envVars),
        },
      });
    }

    // Check runtime
    const runtime = fn.runtime;
    if (
      runtime &&
      (runtime.includes('python2') ||
        runtime.includes('nodejs10') ||
        runtime.includes('nodejs12'))
    ) {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'Lambda',
        resource: fn.node.path,
        message: `Lambda function is using a deprecated runtime: ${runtime}`,
        remediation: 'Update to a supported runtime version',
        executionTime: Date.now() - startTime,
        metadata: {
          functionName,
          currentRuntime: runtime,
        },
      });
    }
  }
}
