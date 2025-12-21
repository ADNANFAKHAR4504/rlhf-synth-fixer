# Infrastructure Analysis and Validation Tool - Implementation

This implementation provides a comprehensive CDK TypeScript framework for analyzing and validating infrastructure configurations during synthesis. The tool uses CDK aspects, custom validators, and a YAML-based rule engine to detect security issues and configuration drift without deploying resources.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { S3EncryptionAspect } from './aspects/s3-encryption-aspect';
import { IAMPolicyAspect } from './aspects/iam-policy-aspect';
import { LambdaConfigAspect } from './aspects/lambda-config-aspect';
import { RDSConfigAspect } from './aspects/rds-config-aspect';
import { ValidationReporter } from './reporters/validation-reporter';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create example infrastructure for validation testing
    // Note: This is minimal infrastructure to demonstrate the validation framework

    // Example S3 bucket with encryption (compliant)
    const compliantBucket = new s3.Bucket(this, 'CompliantBucket', {
      bucketName: `compliant-bucket-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Example S3 bucket without encryption (non-compliant for testing)
    const nonCompliantBucket = new s3.Bucket(this, 'NonCompliantBucket', {
      bucketName: `non-compliant-bucket-${environmentSuffix}`,
      encryption: s3.BucketEncryption.UNENCRYPTED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Example Lambda function for validation testing
    const exampleFunction = new lambda.Function(this, 'ExampleFunction', {
      functionName: `example-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return { statusCode: 200, body: 'OK' };
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ENV: 'test',
        REGION: this.region,
      },
    });

    // Example Lambda with issues (for testing)
    const problematicFunction = new lambda.Function(this, 'ProblematicFunction', {
      functionName: `problematic-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return { statusCode: 200, body: 'OK' };
        };
      `),
      timeout: cdk.Duration.seconds(900), // Excessive timeout
      memorySize: 128, // Low memory
      // Missing environment variables
    });

    // Example IAM role with overly permissive policy (for testing)
    const problematicRole = new iam.Role(this, 'ProblematicRole', {
      roleName: `problematic-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    problematicRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['*'], // Wildcard action
      resources: ['*'], // Wildcard resource
    }));

    // Apply validation aspects to the stack
    cdk.Aspects.of(this).add(new S3EncryptionAspect());
    cdk.Aspects.of(this).add(new IAMPolicyAspect());
    cdk.Aspects.of(this).add(new LambdaConfigAspect());
    cdk.Aspects.of(this).add(new RDSConfigAspect());

    // Generate validation report after synthesis
    const reporter = new ValidationReporter(this, 'ValidationReporter', {
      environmentSuffix,
      outputPath: './validation-report.json',
    });

    // Outputs for testing
    new cdk.CfnOutput(this, 'CompliantBucketName', {
      value: compliantBucket.bucketName,
      description: 'Name of the compliant S3 bucket',
    });

    new cdk.CfnOutput(this, 'NonCompliantBucketName', {
      value: nonCompliantBucket.bucketName,
      description: 'Name of the non-compliant S3 bucket',
    });
  }
}
```


## File: lib/aspects/s3-encryption-aspect.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { IConstruct } from 'constructs';
import { ValidationRegistry } from '../core/validation-registry';

export class S3EncryptionAspect implements cdk.IAspect {
  visit(node: IConstruct): void {
    if (node instanceof s3.CfnBucket) {
      this.validateS3Encryption(node);
    }
  }

  private validateS3Encryption(bucket: s3.CfnBucket): void {
    const startTime = Date.now();

    // Check if encryption is configured
    const hasEncryption = bucket.bucketEncryption !== undefined;
    const encryptionConfig = bucket.bucketEncryption as any;

    if (!hasEncryption || !encryptionConfig?.serverSideEncryptionConfiguration) {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'S3',
        resource: bucket.node.path,
        message: 'S3 bucket does not have encryption enabled',
        remediation: 'Enable encryption on the S3 bucket using S3_MANAGED, KMS_MANAGED, or DSSE encryption',
        executionTime: Date.now() - startTime,
        metadata: {
          bucketName: bucket.bucketName || 'unknown',
          logicalId: bucket.logicalId,
        },
      });
    } else {
      // Validate encryption configuration
      const rules = encryptionConfig.serverSideEncryptionConfiguration;
      if (!Array.isArray(rules) || rules.length === 0) {
        ValidationRegistry.addFinding({
          severity: 'critical',
          category: 'S3',
          resource: bucket.node.path,
          message: 'S3 bucket encryption configuration is invalid',
          remediation: 'Configure valid server-side encryption rules',
          executionTime: Date.now() - startTime,
          metadata: {
            bucketName: bucket.bucketName || 'unknown',
          },
        });
      } else {
        // Encryption is properly configured
        ValidationRegistry.addFinding({
          severity: 'info',
          category: 'S3',
          resource: bucket.node.path,
          message: 'S3 bucket has encryption enabled',
          remediation: 'No action required',
          executionTime: Date.now() - startTime,
          metadata: {
            bucketName: bucket.bucketName || 'unknown',
            encryptionType: rules[0]?.serverSideEncryptionByDefault?.sseAlgorithm || 'unknown',
          },
        });
      }
    }
  }
}
```

## File: lib/aspects/iam-policy-aspect.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { IConstruct } from 'constructs';
import { ValidationRegistry } from '../core/validation-registry';

export class IAMPolicyAspect implements cdk.IAspect {
  visit(node: IConstruct): void {
    if (node instanceof iam.CfnRole) {
      this.validateIAMRole(node);
    } else if (node instanceof iam.CfnPolicy) {
      this.validateIAMPolicy(node);
    }
  }

  private validateIAMRole(role: iam.CfnRole): void {
    const startTime = Date.now();

    // Check inline policies
    const policies = role.policies as any[] || [];

    for (const policy of policies) {
      this.checkPolicyDocument(policy.policyDocument, role.node.path, startTime);
    }
  }

  private validateIAMPolicy(policy: iam.CfnPolicy): void {
    const startTime = Date.now();
    this.checkPolicyDocument(policy.policyDocument, policy.node.path, startTime);
  }

  private checkPolicyDocument(policyDoc: any, resourcePath: string, startTime: number): void {
    if (!policyDoc || !policyDoc.Statement) {
      return;
    }

    const statements = Array.isArray(policyDoc.Statement) ? policyDoc.Statement : [policyDoc.Statement];

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
          remediation: 'Replace wildcards with specific actions and resources following the principle of least privilege',
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
          remediation: 'Replace wildcard actions with specific API actions required for the use case',
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
```

## File: lib/aspects/lambda-config-aspect.ts

```typescript
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
        remediation: `Review if such a long timeout is necessary. Consider reducing to ${this.RECOMMENDED_TIMEOUT}s or using async processing`,
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
        remediation: `Consider increasing memory to at least ${this.MIN_MEMORY}MB for better performance`,
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
        remediation: `Add the missing environment variables to improve operational visibility`,
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
    if (runtime && (runtime.includes('python2') || runtime.includes('nodejs10') || runtime.includes('nodejs12'))) {
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
```

## File: lib/aspects/rds-config-aspect.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import { IConstruct } from 'constructs';
import { ValidationRegistry } from '../core/validation-registry';

export class RDSConfigAspect implements cdk.IAspect {
  private readonly MIN_BACKUP_RETENTION = 7; // days

  visit(node: IConstruct): void {
    if (node instanceof rds.CfnDBInstance) {
      this.validateRDSInstance(node);
    } else if (node instanceof rds.CfnDBCluster) {
      this.validateRDSCluster(node);
    }
  }

  private validateRDSInstance(instance: rds.CfnDBInstance): void {
    const startTime = Date.now();
    const instanceId = instance.dbInstanceIdentifier || instance.logicalId;

    // Check encryption
    const storageEncrypted = instance.storageEncrypted;
    if (!storageEncrypted) {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'RDS',
        resource: instance.node.path,
        message: 'RDS instance does not have encryption enabled',
        remediation: 'Enable storage encryption on the RDS instance',
        executionTime: Date.now() - startTime,
        metadata: {
          instanceId,
        },
      });
    }

    // Check backup retention
    const backupRetention = instance.backupRetentionPeriod || 1;
    if (backupRetention < this.MIN_BACKUP_RETENTION) {
      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'RDS',
        resource: instance.node.path,
        message: `RDS instance backup retention (${backupRetention} days) is below recommended minimum (${this.MIN_BACKUP_RETENTION} days)`,
        remediation: `Increase backup retention to at least ${this.MIN_BACKUP_RETENTION} days for production databases`,
        executionTime: Date.now() - startTime,
        metadata: {
          instanceId,
          currentRetention: backupRetention,
          recommendedRetention: this.MIN_BACKUP_RETENTION,
        },
      });
    }

    // Check Multi-AZ
    const multiAz = instance.multiAz;
    if (!multiAz) {
      ValidationRegistry.addFinding({
        severity: 'info',
        category: 'RDS',
        resource: instance.node.path,
        message: 'RDS instance is not configured for Multi-AZ',
        remediation: 'Enable Multi-AZ for production databases to improve availability',
        executionTime: Date.now() - startTime,
        metadata: {
          instanceId,
        },
      });
    }
  }

  private validateRDSCluster(cluster: rds.CfnDBCluster): void {
    const startTime = Date.now();
    const clusterId = cluster.dbClusterIdentifier || cluster.logicalId;

    // Check encryption
    const storageEncrypted = cluster.storageEncrypted;
    if (!storageEncrypted) {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'RDS',
        resource: cluster.node.path,
        message: 'RDS cluster does not have encryption enabled',
        remediation: 'Enable storage encryption on the RDS cluster',
        executionTime: Date.now() - startTime,
        metadata: {
          clusterId,
        },
      });
    }

    // Check backup retention
    const backupRetention = cluster.backupRetentionPeriod || 1;
    if (backupRetention < this.MIN_BACKUP_RETENTION) {
      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'RDS',
        resource: cluster.node.path,
        message: `RDS cluster backup retention (${backupRetention} days) is below recommended minimum (${this.MIN_BACKUP_RETENTION} days)`,
        remediation: `Increase backup retention to at least ${this.MIN_BACKUP_RETENTION} days`,
        executionTime: Date.now() - startTime,
        metadata: {
          clusterId,
          currentRetention: backupRetention,
          recommendedRetention: this.MIN_BACKUP_RETENTION,
        },
      });
    }
  }
}
```


## File: lib/core/validation-registry.ts

```typescript
export type ValidationSeverity = 'critical' | 'warning' | 'info';

export interface ValidationFinding {
  severity: ValidationSeverity;
  category: string;
  resource: string;
  message: string;
  remediation: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

export class ValidationRegistry {
  private static findings: ValidationFinding[] = [];

  static addFinding(finding: ValidationFinding): void {
    this.findings.push(finding);
  }

  static getFindings(): ValidationFinding[] {
    return [...this.findings];
  }

  static getFindingsBySeverity(severity: ValidationSeverity): ValidationFinding[] {
    return this.findings.filter(f => f.severity === severity);
  }

  static getFindingsByCategory(category: string): ValidationFinding[] {
    return this.findings.filter(f => f.category === category);
  }

  static clear(): void {
    this.findings = [];
  }

  static getSummary(): {
    total: number;
    critical: number;
    warning: number;
    info: number;
    categories: Record<string, number>;
  } {
    return {
      total: this.findings.length,
      critical: this.findings.filter(f => f.severity === 'critical').length,
      warning: this.findings.filter(f => f.severity === 'warning').length,
      info: this.findings.filter(f => f.severity === 'info').length,
      categories: this.findings.reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
```

## File: lib/reporters/validation-reporter.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationRegistry, ValidationFinding } from '../core/validation-registry';

export interface ValidationReporterProps {
  environmentSuffix: string;
  outputPath: string;
}

export interface ValidationReport {
  timestamp: string;
  environmentSuffix: string;
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    categories: Record<string, number>;
  };
  findings: ValidationFinding[];
  executionMetrics: {
    totalExecutionTime: number;
    averageExecutionTime: number;
  };
}

export class ValidationReporter extends Construct {
  constructor(scope: Construct, id: string, props: ValidationReporterProps) {
    super(scope, id);

    // Generate report after synthesis
    const node = this.node.root as cdk.App;

    node.node.addValidation({
      validate: () => {
        this.generateReport(props);
        return [];
      },
    });
  }

  private generateReport(props: ValidationReporterProps): void {
    const findings = ValidationRegistry.getFindings();
    const summary = ValidationRegistry.getSummary();

    const totalExecutionTime = findings.reduce((sum, f) => sum + f.executionTime, 0);
    const averageExecutionTime = findings.length > 0 ? totalExecutionTime / findings.length : 0;

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      environmentSuffix: props.environmentSuffix,
      summary,
      findings,
      executionMetrics: {
        totalExecutionTime,
        averageExecutionTime,
      },
    };

    // Write report to file
    const outputDir = path.dirname(props.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(props.outputPath, JSON.stringify(report, null, 2));

    // Print summary to console
    console.log('\n' + '='.repeat(80));
    console.log('INFRASTRUCTURE VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Environment: ${props.environmentSuffix}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log('\nSummary:');
    console.log(`  Total Findings: ${summary.total}`);
    console.log(`  Critical: ${summary.critical}`);
    console.log(`  Warning: ${summary.warning}`);
    console.log(`  Info: ${summary.info}`);
    console.log('\nCategories:');
    for (const [category, count] of Object.entries(summary.categories)) {
      console.log(`  ${category}: ${count}`);
    }
    console.log('\nExecution Metrics:');
    console.log(`  Total Time: ${totalExecutionTime.toFixed(2)}ms`);
    console.log(`  Average Time: ${averageExecutionTime.toFixed(2)}ms`);
    console.log(`\nDetailed report written to: ${props.outputPath}`);
    console.log('='.repeat(80) + '\n');

    // Exit with error code if critical findings exist
    if (summary.critical > 0) {
      console.error(`\nValidation failed with ${summary.critical} critical finding(s)\n`);
      // Don't exit here to allow report generation, but log the issue
    }
  }
}
```


## File: lib/comparator/stack-comparator.ts

```typescript
import * as fs from 'fs';

export interface StackDifference {
  type: 'added' | 'removed' | 'modified';
  path: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export class StackComparator {
  /**
   * Compare two CloudFormation templates and identify differences
   */
  static compareTemplates(
    template1Path: string,
    template2Path: string
  ): StackDifference[] {
    const template1 = JSON.parse(fs.readFileSync(template1Path, 'utf-8'));
    const template2 = JSON.parse(fs.readFileSync(template2Path, 'utf-8'));

    const differences: StackDifference[] = [];

    // Compare Resources
    differences.push(...this.compareResources(template1.Resources || {}, template2.Resources || {}));

    // Compare Outputs
    differences.push(...this.compareOutputs(template1.Outputs || {}, template2.Outputs || {}));

    // Compare Parameters
    differences.push(...this.compareParameters(template1.Parameters || {}, template2.Parameters || {}));

    return differences;
  }

  private static compareResources(
    resources1: Record<string, any>,
    resources2: Record<string, any>
  ): StackDifference[] {
    const differences: StackDifference[] = [];
    const allResourceIds = new Set([...Object.keys(resources1), ...Object.keys(resources2)]);

    for (const resourceId of allResourceIds) {
      const resource1 = resources1[resourceId];
      const resource2 = resources2[resourceId];

      if (!resource1) {
        differences.push({
          type: 'added',
          path: `Resources.${resourceId}`,
          newValue: resource2,
          description: `Resource ${resourceId} (${resource2.Type}) was added`,
        });
      } else if (!resource2) {
        differences.push({
          type: 'removed',
          path: `Resources.${resourceId}`,
          oldValue: resource1,
          description: `Resource ${resourceId} (${resource1.Type}) was removed`,
        });
      } else {
        // Resource exists in both, check for property differences
        const propDiffs = this.compareObjects(
          resource1.Properties || {},
          resource2.Properties || {},
          `Resources.${resourceId}.Properties`
        );
        differences.push(...propDiffs);
      }
    }

    return differences;
  }

  private static compareOutputs(
    outputs1: Record<string, any>,
    outputs2: Record<string, any>
  ): StackDifference[] {
    return this.compareObjects(outputs1, outputs2, 'Outputs');
  }

  private static compareParameters(
    params1: Record<string, any>,
    params2: Record<string, any>
  ): StackDifference[] {
    return this.compareObjects(params1, params2, 'Parameters');
  }

  private static compareObjects(
    obj1: Record<string, any>,
    obj2: Record<string, any>,
    basePath: string
  ): StackDifference[] {
    const differences: StackDifference[] = [];
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
      const value1 = obj1[key];
      const value2 = obj2[key];
      const currentPath = `${basePath}.${key}`;

      if (value1 === undefined) {
        differences.push({
          type: 'added',
          path: currentPath,
          newValue: value2,
          description: `Property ${currentPath} was added`,
        });
      } else if (value2 === undefined) {
        differences.push({
          type: 'removed',
          path: currentPath,
          oldValue: value1,
          description: `Property ${currentPath} was removed`,
        });
      } else if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        differences.push({
          type: 'modified',
          path: currentPath,
          oldValue: value1,
          newValue: value2,
          description: `Property ${currentPath} was modified`,
        });
      }
    }

    return differences;
  }

  /**
   * Generate a human-readable report of differences
   */
  static generateReport(differences: StackDifference[]): string {
    if (differences.length === 0) {
      return 'No differences found between stacks';
    }

    let report = `Stack Comparison Report\n`;
    report += `Found ${differences.length} difference(s)\n\n`;

    const byType = {
      added: differences.filter(d => d.type === 'added'),
      removed: differences.filter(d => d.type === 'removed'),
      modified: differences.filter(d => d.type === 'modified'),
    };

    if (byType.added.length > 0) {
      report += `Added (${byType.added.length}):\n`;
      for (const diff of byType.added) {
        report += `  + ${diff.path}\n`;
      }
      report += '\n';
    }

    if (byType.removed.length > 0) {
      report += `Removed (${byType.removed.length}):\n`;
      for (const diff of byType.removed) {
        report += `  - ${diff.path}\n`;
      }
      report += '\n';
    }

    if (byType.modified.length > 0) {
      report += `Modified (${byType.modified.length}):\n`;
      for (const diff of byType.modified) {
        report += `  ~ ${diff.path}\n`;
      }
      report += '\n';
    }

    return report;
  }
}
```

## File: lib/rules/rule-engine.ts

```typescript
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { IConstruct } from 'constructs';
import { ValidationRegistry } from '../core/validation-registry';

export interface ValidationRule {
  name: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  resourceType: string;
  condition: {
    property: string;
    operator: 'equals' | 'notEquals' | 'exists' | 'notExists' | 'contains' | 'greaterThan' | 'lessThan';
    value?: any;
  };
  message: string;
  remediation: string;
}

export interface RuleConfig {
  rules: ValidationRule[];
}

export class RuleEngine {
  private rules: ValidationRule[] = [];

  constructor(configPath?: string) {
    if (configPath && fs.existsSync(configPath)) {
      this.loadRules(configPath);
    }
  }

  loadRules(configPath: string): void {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(content) as RuleConfig;
    this.rules = config.rules || [];
  }

  evaluateRules(node: IConstruct, resourceType: string, properties: Record<string, any>): void {
    const applicableRules = this.rules.filter(r => r.resourceType === resourceType);

    for (const rule of applicableRules) {
      const startTime = Date.now();
      const result = this.evaluateCondition(rule.condition, properties);

      if (!result.pass) {
        ValidationRegistry.addFinding({
          severity: rule.severity,
          category: rule.category,
          resource: node.node.path,
          message: rule.message,
          remediation: rule.remediation,
          executionTime: Date.now() - startTime,
          metadata: {
            rule: rule.name,
            property: rule.condition.property,
            actualValue: result.actualValue,
          },
        });
      }
    }
  }

  private evaluateCondition(
    condition: ValidationRule['condition'],
    properties: Record<string, any>
  ): { pass: boolean; actualValue: any } {
    const actualValue = this.getPropertyValue(properties, condition.property);

    switch (condition.operator) {
      case 'equals':
        return { pass: actualValue === condition.value, actualValue };
      case 'notEquals':
        return { pass: actualValue !== condition.value, actualValue };
      case 'exists':
        return { pass: actualValue !== undefined, actualValue };
      case 'notExists':
        return { pass: actualValue === undefined, actualValue };
      case 'contains':
        return {
          pass: Array.isArray(actualValue) && actualValue.includes(condition.value),
          actualValue,
        };
      case 'greaterThan':
        return { pass: Number(actualValue) > Number(condition.value), actualValue };
      case 'lessThan':
        return { pass: Number(actualValue) < Number(condition.value), actualValue };
      default:
        return { pass: true, actualValue };
    }
  }

  private getPropertyValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }
}
```


## File: lib/cli/analyze-cli.ts

```typescript
import * as yargs from 'yargs';
import * as fs from 'fs';
import { StackComparator } from '../comparator/stack-comparator';
import { ValidationRegistry } from '../core/validation-registry';

interface AnalyzeOptions {
  command: 'compare' | 'validate' | 'report';
  template1?: string;
  template2?: string;
  reportPath?: string;
  severity?: 'critical' | 'warning' | 'info';
  category?: string;
}

export class AnalyzeCLI {
  static run(): void {
    const argv = yargs(process.argv.slice(2))
      .command('compare <template1> <template2>', 'Compare two CloudFormation templates', (yargs) => {
        return yargs
          .positional('template1', {
            describe: 'Path to first template',
            type: 'string',
          })
          .positional('template2', {
            describe: 'Path to second template',
            type: 'string',
          })
          .option('output', {
            alias: 'o',
            describe: 'Output file for comparison report',
            type: 'string',
          });
      })
      .command('validate <reportPath>', 'Check validation report for issues', (yargs) => {
        return yargs
          .positional('reportPath', {
            describe: 'Path to validation report JSON',
            type: 'string',
          })
          .option('severity', {
            alias: 's',
            describe: 'Minimum severity level to report',
            choices: ['critical', 'warning', 'info'],
            default: 'warning',
          })
          .option('category', {
            alias: 'c',
            describe: 'Filter by category',
            type: 'string',
          });
      })
      .command('report', 'Generate validation report from current findings', (yargs) => {
        return yargs
          .option('output', {
            alias: 'o',
            describe: 'Output file for report',
            type: 'string',
            default: './validation-report.json',
          });
      })
      .demandCommand(1, 'You must provide a command')
      .help()
      .argv as any;

    const command = argv._[0];

    switch (command) {
      case 'compare':
        this.handleCompare(argv.template1, argv.template2, argv.output);
        break;
      case 'validate':
        this.handleValidate(argv.reportPath, argv.severity, argv.category);
        break;
      case 'report':
        this.handleReport(argv.output);
        break;
    }
  }

  private static handleCompare(template1: string, template2: string, outputPath?: string): void {
    if (!fs.existsSync(template1)) {
      console.error(`Error: Template not found: ${template1}`);
      process.exit(1);
    }
    if (!fs.existsSync(template2)) {
      console.error(`Error: Template not found: ${template2}`);
      process.exit(1);
    }

    const differences = StackComparator.compareTemplates(template1, template2);
    const report = StackComparator.generateReport(differences);

    console.log(report);

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(differences, null, 2));
      console.log(`\nDetailed comparison written to: ${outputPath}`);
    }

    process.exit(differences.length > 0 ? 1 : 0);
  }

  private static handleValidate(reportPath: string, minSeverity: string, category?: string): void {
    if (!fs.existsSync(reportPath)) {
      console.error(`Error: Report not found: ${reportPath}`);
      process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    let findings = report.findings || [];

    // Filter by category if specified
    if (category) {
      findings = findings.filter((f: any) => f.category === category);
    }

    // Filter by severity
    const severityLevels = ['info', 'warning', 'critical'];
    const minLevel = severityLevels.indexOf(minSeverity);
    findings = findings.filter((f: any) => severityLevels.indexOf(f.severity) >= minLevel);

    console.log(`\nValidation Report: ${reportPath}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Environment: ${report.environmentSuffix}\n`);

    if (findings.length === 0) {
      console.log('No issues found matching the specified criteria');
      process.exit(0);
    }

    console.log(`Found ${findings.length} issue(s):\n`);

    for (const finding of findings) {
      const severityLabel = finding.severity.toUpperCase();
      console.log(`[${severityLabel}] ${finding.category}: ${finding.message}`);
      console.log(`  Resource: ${finding.resource}`);
      console.log(`  Remediation: ${finding.remediation}`);
      console.log('');
    }

    // Exit with error code if critical findings exist
    const criticalCount = findings.filter((f: any) => f.severity === 'critical').length;
    process.exit(criticalCount > 0 ? 1 : 0);
  }

  private static handleReport(outputPath: string): void {
    const findings = ValidationRegistry.getFindings();
    const summary = ValidationRegistry.getSummary();

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      findings,
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`Report written to: ${outputPath}`);
    console.log(`Total findings: ${summary.total}`);
    console.log(`Critical: ${summary.critical}, Warning: ${summary.warning}, Info: ${summary.info}`);

    process.exit(summary.critical > 0 ? 1 : 0);
  }
}
```

## File: lib/validation-rules.yaml

```yaml
rules:
  - name: s3-versioning-enabled
    severity: warning
    category: S3
    resourceType: AWS::S3::Bucket
    condition:
      property: VersioningConfiguration.Status
      operator: equals
      value: Enabled
    message: S3 bucket should have versioning enabled
    remediation: Enable versioning on the S3 bucket to protect against accidental deletion

  - name: s3-public-access-blocked
    severity: critical
    category: S3
    resourceType: AWS::S3::Bucket
    condition:
      property: PublicAccessBlockConfiguration
      operator: exists
    message: S3 bucket must have public access block configuration
    remediation: Add PublicAccessBlockConfiguration to prevent public access

  - name: lambda-reserved-concurrency
    severity: info
    category: Lambda
    resourceType: AWS::Lambda::Function
    condition:
      property: ReservedConcurrentExecutions
      operator: exists
    message: Consider setting reserved concurrency for production Lambda functions
    remediation: Set ReservedConcurrentExecutions to prevent function from consuming all account concurrency

  - name: rds-deletion-protection
    severity: warning
    category: RDS
    resourceType: AWS::RDS::DBInstance
    condition:
      property: DeletionProtection
      operator: equals
      value: true
    message: Production RDS instances should have deletion protection enabled
    remediation: Enable DeletionProtection to prevent accidental database deletion

  - name: lambda-dlq-configured
    severity: warning
    category: Lambda
    resourceType: AWS::Lambda::Function
    condition:
      property: DeadLetterConfig
      operator: exists
    message: Lambda function should have a dead letter queue configured
    remediation: Configure a Dead Letter Queue (SQS or SNS) to capture failed invocations

  - name: rds-monitoring-enabled
    severity: info
    category: RDS
    resourceType: AWS::RDS::DBInstance
    condition:
      property: MonitoringInterval
      operator: greaterThan
      value: 0
    message: Enhanced monitoring should be enabled for RDS instances
    remediation: Set MonitoringInterval to 60 seconds or less for better insights
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix = app.node.tryGetContext('environmentSuffix')
  || process.env.ENVIRONMENT_SUFFIX
  || 'dev';

new TapStack(app, 'TapStack', {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Infrastructure Analysis and Validation Stack - ${environmentSuffix}`,
});

app.synth();
```


## File: package.json

```json
{
  "name": "infrastructure-analysis-tool",
  "version": "0.1.0",
  "description": "CDK TypeScript framework for infrastructure analysis and validation",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/js-yaml": "^4.0.5",
    "@types/node": "20.8.0",
    "@types/yargs": "^17.0.24",
    "aws-cdk": "2.100.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.2.0"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
    "constructs": "^10.0.0",
    "js-yaml": "^4.1.0",
    "source-map-support": "^0.5.21",
    "yargs": "^17.7.2"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ],
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

## File: cdk.json

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
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
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
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false
  }
}
```

## File: .gitignore

```
*.js
!jest.config.js
*.d.ts
node_modules

# CDK asset staging directory
.cdk.staging
cdk.out

# Reports
validation-report.json
comparison-report.json
```

## File: lib/README.md

```markdown
# Infrastructure Analysis and Validation Tool

A comprehensive CDK TypeScript framework for analyzing and validating infrastructure configurations during the synthesis phase. This tool helps identify security issues, configuration drift, and compliance violations before deployment.

## Features

- CDK Aspects for Validation: Custom aspects that traverse the construct tree to validate resources
- S3 Encryption Validation: Ensures all S3 buckets have encryption enabled
- IAM Policy Analysis: Detects overly permissive policies with wildcard actions or resources
- Lambda Configuration Checks: Validates timeout settings, memory allocation, and environment variables
- RDS Security Validation: Verifies encryption, backup retention, and Multi-AZ configuration
- Stack Comparison: Compare CloudFormation templates to detect configuration drift
- Custom Rule Engine: Load validation rules from YAML configuration files
- Structured JSON Reports: Categorized findings with severity levels and remediation steps
- CLI Tool: Command-line interface for CI/CD integration with proper exit codes

## Installation

```bash
npm install
```

## Dependencies

The required dependencies are specified in package.json. Install them with npm install.

## Usage

### Running Validation During Synthesis

```bash
# Synthesize stack with validation
cdk synth -c environmentSuffix=dev

# The validation report will be generated at ./validation-report.json
```

### CLI Commands

Compare Templates:
```bash
npx ts-node lib/cli/analyze-cli.ts compare \
  cdk.out/TapStack.template.json \
  other-template.json \
  --output comparison-report.json
```

Validate Report:
```bash
# Check for critical issues only
npx ts-node lib/cli/analyze-cli.ts validate \
  validation-report.json \
  --severity critical

# Filter by category
npx ts-node lib/cli/analyze-cli.ts validate \
  validation-report.json \
  --category S3
```

Generate Report:
```bash
npx ts-node lib/cli/analyze-cli.ts report \
  --output custom-report.json
```

### Custom Validation Rules

The lib/validation-rules.yaml file contains custom validation rules. You can add your own rules following the same format.

## Architecture

### Components

1. Aspects (lib/aspects/): CDK aspects that traverse the construct tree
   - S3EncryptionAspect: Validates S3 bucket encryption
   - IAMPolicyAspect: Detects overly permissive IAM policies
   - LambdaConfigAspect: Checks Lambda configuration
   - RDSConfigAspect: Validates RDS security settings

2. Core (lib/core/): Core validation framework
   - ValidationRegistry: Central registry for storing findings
   - Provides methods to query and summarize findings

3. Reporters (lib/reporters/): Generate validation reports
   - ValidationReporter: Creates JSON reports with findings

4. Comparator (lib/comparator/): Stack comparison utilities
   - StackComparator: Compares CloudFormation templates
   - Identifies added, removed, and modified resources

5. Rule Engine (lib/rules/): Custom validation rules
   - RuleEngine: Loads and evaluates YAML-based rules
   - Supports various operators (equals, exists, greaterThan, etc.)

6. CLI (lib/cli/): Command-line interface
   - AnalyzeCLI: Provides compare, validate, and report commands

## Validation Report Format

The generated JSON report includes:
- timestamp: When the validation was run
- environmentSuffix: Environment identifier
- summary: Total findings by severity and category
- findings: Detailed list of all validation findings
- executionMetrics: Performance metrics for each check

Each finding includes:
- severity: critical, warning, or info
- category: Resource category (S3, IAM, Lambda, RDS, etc.)
- resource: Full path to the resource
- message: Description of the issue
- remediation: Actionable steps to fix the issue
- executionTime: Time taken to perform the check
- metadata: Additional contextual information

## CI/CD Integration

Add validation to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Synthesize and Validate
  run: |
    npm install
    cdk synth -c environmentSuffix=${{ github.ref_name }}

- name: Check Validation Report
  run: |
    npx ts-node lib/cli/analyze-cli.ts validate \
      validation-report.json \
      --severity critical
```

The CLI returns:
- Exit code 0: No critical issues found
- Exit code 1: Critical issues found or command failed

## Testing

Run the example stack to see validation in action:

```bash
# Synthesize the stack
cdk synth -c environmentSuffix=test

# Review the validation report
cat validation-report.json

# Deploy (optional - for testing actual resources)
cdk deploy -c environmentSuffix=test

# Destroy when done
cdk destroy -c environmentSuffix=test
```

## Extending the Framework

### Adding a Custom Aspect

Create a new aspect in lib/aspects/ that implements cdk.IAspect interface and uses ValidationRegistry to record findings.

### Adding Custom Rules

Edit lib/validation-rules.yaml to add new rules without modifying code.

## Performance

The framework is designed to complete analysis within 60 seconds for stacks with up to 100 resources. Execution time metrics are included in every report.

## Limitations

- Analysis is read-only and does not modify infrastructure
- Some validations require the L2 construct to be converted to L1 (CFN) for property access
- Custom resources may require specialized handling
- Report generation happens during synthesis, not deployment

## License

This tool is part of the infrastructure analysis framework.
```

