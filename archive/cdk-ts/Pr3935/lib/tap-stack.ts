import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { NetworkingStack } from './stacks/networking-stack';
import { SecurityStack } from './stacks/security-stack';
import { StorageStack } from './stacks/storage-stack';
import { DatabaseStack } from './stacks/database-stack';
import { ComputeStack } from './stacks/compute-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { WAFStack } from './stacks/waf-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Common tags for all resources
    const commonTags = {
      'iac-rlhf-amazon': 'true',
      Environment: environmentSuffix,
      ManagedBy: 'AWS-CDK',
    };

    // Apply tags to this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // 1. Security Stack - KMS keys and IAM roles
    const securityStack = new SecurityStack(
      this,
      `SecurityStack-${environmentSuffix}`,
      {
        environmentSuffix,
        tags: commonTags,
      }
    );

    // 2. Networking Stack - VPC, Subnets, Security Groups
    const networkingStack = new NetworkingStack(
      this,
      `NetworkingStack-${environmentSuffix}`,
      {
        environmentSuffix,
        tags: commonTags,
      }
    );

    // 3. Storage Stack - S3 buckets with encryption
    const storageStack = new StorageStack(
      this,
      `StorageStack-${environmentSuffix}`,
      {
        environmentSuffix,
        kmsKey: securityStack.kmsKey,
        tags: commonTags,
      }
    );

    // 4. Database Stack - RDS with Multi-AZ
    const databaseStack = new DatabaseStack(
      this,
      `DatabaseStack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: networkingStack.vpc,
        kmsKey: securityStack.kmsKey,
        databaseSecurityGroup: networkingStack.databaseSecurityGroup,
        tags: commonTags,
      }
    );

    // 5. WAF Stack - Web Application Firewall
    const wafStack = new WAFStack(this, `WAFStack-${environmentSuffix}`, {
      environmentSuffix,
      tags: commonTags,
    });

    // 6. Compute Stack - EC2, Auto Scaling, ALB
    const computeStack = new ComputeStack(
      this,
      `ComputeStack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: networkingStack.vpc,
        applicationSecurityGroup: networkingStack.applicationSecurityGroup,
        albSecurityGroup: networkingStack.albSecurityGroup,
        kmsKey: securityStack.kmsKey,
        instanceRole: securityStack.ec2InstanceRole,
        logBucket: storageStack.logBucket,
        databaseSecret: databaseStack.databaseSecret,
        webAcl: wafStack.webAcl,
        tags: commonTags,
      }
    );

    // 7. Monitoring Stack - CloudTrail, Config, Inspector
    const monitoringStack = new MonitoringStack(
      this,
      `MonitoringStack-${environmentSuffix}`,
      {
        environmentSuffix,
        cloudTrailBucket: storageStack.cloudTrailBucket,
        kmsKey: securityStack.kmsKey,
        vpc: networkingStack.vpc,
        ec2InstanceRole: securityStack.ec2InstanceRole,
        tags: commonTags,
      }
    );

    // Add stack dependencies
    databaseStack.addDependency(networkingStack);
    databaseStack.addDependency(securityStack);
    computeStack.addDependency(networkingStack);
    computeStack.addDependency(securityStack);
    computeStack.addDependency(storageStack);
    computeStack.addDependency(databaseStack);
    computeStack.addDependency(wafStack);
    monitoringStack.addDependency(storageStack);
    monitoringStack.addDependency(securityStack);
    monitoringStack.addDependency(networkingStack);

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: computeStack.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'ALBArn', {
      value: computeStack.alb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: computeStack.asg.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.dbInstanceEndpointAddress,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseStack.databaseSecret.secretArn,
      description: 'Database Secret ARN',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: securityStack.kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: securityStack.kmsKey.keyArn,
      description: 'KMS Key ARN',
    });

    new cdk.CfnOutput(this, 'CloudTrailName', {
      value: monitoringStack.trail.trailArn,
      description: 'CloudTrail ARN',
    });

    new cdk.CfnOutput(this, 'ALBLogBucketName', {
      value: storageStack.logBucket.bucketName,
      description: 'ALB Log Bucket Name',
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: storageStack.cloudTrailBucket.bucketName,
      description: 'CloudTrail Bucket Name',
    });

    new cdk.CfnOutput(this, 'ApplicationSecurityGroupId', {
      value: networkingStack.applicationSecurityGroup.securityGroupId,
      description: 'Application Security Group ID',
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: networkingStack.databaseSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: wafStack.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'EC2InstanceRoleArn', {
      value: securityStack.ec2InstanceRole.roleArn,
      description: 'EC2 Instance Role ARN',
    });
  }
}
