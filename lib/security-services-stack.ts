/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
// import * as aws from "..." - not needed in stub
import { InspectorStack } from './inspector-stack';
import { SecurityHubStack } from './security-hub-stack';
import { AuditManagerStack } from './audit-manager-stack';
import { DetectiveStack } from './detective-stack';
import { DevOpsGuruStack } from './devops-guru-stack';
import { ComputeOptimizerStack } from './compute-optimizer-stack';
import { HealthDashboardStack } from './health-dashboard-stack';
import { WellArchitectedStack } from './well-architected-stack';

export interface SecurityServicesStackArgs {
  environmentSuffix: string;
  snsTopicArn: pulumi.Input<string>;
  vpcSubnetIds: pulumi.Input<string>[];
  vpcSecurityGroupIds: pulumi.Input<string>[];
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityServicesStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: SecurityServicesStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:ServicesStack', name, args, opts);

    const suffix = args.environmentSuffix;
    const tags = args.tags;

    // AWS Security Hub
    const _securityHub = new SecurityHubStack(
      `security-hub-${suffix}`,
      {
        environmentSuffix: suffix,
        tags: tags,
      },
      { parent: this }
    );

    // AWS Inspector
    const _inspector = new InspectorStack(
      `inspector-${suffix}`,
      {
        environmentSuffix: suffix,
        tags: tags,
      },
      { parent: this }
    );

    // AWS Audit Manager
    const _auditManager = new AuditManagerStack(
      `audit-manager-${suffix}`,
      {
        environmentSuffix: suffix,
        tags: tags,
      },
      { parent: this }
    );

    // AWS Detective
    const _detective = new DetectiveStack(
      `detective-${suffix}`,
      {
        environmentSuffix: suffix,
        tags: tags,
      },
      { parent: this }
    );

    // Amazon DevOps Guru
    const _devopsGuru = new DevOpsGuruStack(
      `devops-guru-${suffix}`,
      {
        environmentSuffix: suffix,
        snsTopicArn: args.snsTopicArn,
        tags: tags,
      },
      { parent: this }
    );

    // AWS Compute Optimizer
    const _computeOptimizer = new ComputeOptimizerStack(
      `compute-optimizer-${suffix}`,
      {
        environmentSuffix: suffix,
        tags: tags,
      },
      { parent: this }
    );

    // AWS Health Dashboard
    const _healthDashboard = new HealthDashboardStack(
      `health-dashboard-${suffix}`,
      {
        environmentSuffix: suffix,
        snsTopicArn: args.snsTopicArn,
        vpcSubnetIds: args.vpcSubnetIds,
        vpcSecurityGroupIds: args.vpcSecurityGroupIds,
        tags: tags,
      },
      { parent: this }
    );

    // AWS Well-Architected Tool
    const _wellArchitected = new WellArchitectedStack(
      `well-architected-${suffix}`,
      {
        environmentSuffix: suffix,
        tags: tags,
      },
      { parent: this }
    );

    this.registerOutputs({});
  }
}
