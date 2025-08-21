import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly networkStack: NetworkStack;
  public readonly securityStack: SecurityStack;
  public readonly storageStack: StorageStack;
  public readonly databaseStack: DatabaseStack;
  public readonly computeStack: ComputeStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Network Infrastructure
    this.networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
    });

    // Security and Monitoring
    this.securityStack = new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
    });

    // Storage with CloudFront
    this.storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      kmsKey: this.securityStack.kmsKey,
      s3AccessRole: this.securityStack.s3AccessRole,
    });

    // Database
    this.databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      vpc: this.networkStack.vpc,
      databaseSecurityGroup: this.networkStack.databaseSecurityGroup,
      kmsKey: this.securityStack.kmsKey,
      alertsTopic: this.securityStack.alertsTopic,
    });

    // Compute with Auto Scaling
    this.computeStack = new ComputeStack(this, 'ComputeStack', {
      environmentSuffix,
      vpc: this.networkStack.vpc,
      webSecurityGroup: this.networkStack.webSecurityGroup,
      loadBalancerSecurityGroup: this.networkStack.loadBalancerSecurityGroup,
      ec2Role: this.securityStack.ec2Role,
      alertsTopic: this.securityStack.alertsTopic,
    });

    // Add dependencies
    this.securityStack.addDependency(this.networkStack);
    this.storageStack.addDependency(this.securityStack);
    this.databaseStack.addDependency(this.networkStack);
    this.databaseStack.addDependency(this.securityStack);
    this.computeStack.addDependency(this.networkStack);
    this.computeStack.addDependency(this.securityStack);

    // Output important values
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.computeStack.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistribution', {
      value: this.storageStack.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.databaseStack.database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });
  }
}
