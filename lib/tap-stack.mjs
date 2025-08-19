import * as cdk from 'aws-cdk-lib';

// Import modular stacks
import { VpcStack } from './vpc-stack.mjs';
import { KmsStack } from './kms-stack.mjs';
import { SecurityGroupsStack } from './security-groups-stack.mjs';
import { DatabaseStack } from './database-stack.mjs';
import { AutoScalingStack } from './autoscaling-stack.mjs';
import { LoadBalancerStack } from './load-balancer-stack.mjs';
import { StorageStack } from './storage-stack.mjs';
import { MonitoringStack } from './monitoring-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create modular stacks following the high-availability web architecture requirements

    // 1. Security Foundation - KMS Key
    const kmsStack = new KmsStack(scope, `KmsStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
    });

    // 2. VPC and Networking
    const vpcStack = new VpcStack(scope, `VpcStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
    });

    // 3. Security Groups (depends on VPC)
    const securityGroupsStack = new SecurityGroupsStack(scope, `SecurityGroupsStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      vpc: vpcStack.vpc,
    });
    securityGroupsStack.addDependency(vpcStack);

    // 4. Database Tier - Multi-AZ RDS (depends on VPC, KMS, Security Groups)
    const databaseStack = new DatabaseStack(scope, `DatabaseStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      vpc: vpcStack.vpc,
      kmsKey: kmsStack.kmsKey,
      dbSecurityGroup: securityGroupsStack.dbSecurityGroup,
    });
    databaseStack.addDependency(vpcStack);
    databaseStack.addDependency(kmsStack);
    databaseStack.addDependency(securityGroupsStack);

    // 5. Application Tier - EC2 Auto Scaling (depends on VPC, Security Groups)
    const autoScalingStack = new AutoScalingStack(scope, `AutoScalingStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      vpc: vpcStack.vpc,
      appSecurityGroup: securityGroupsStack.appSecurityGroup,
    });
    autoScalingStack.addDependency(vpcStack);
    autoScalingStack.addDependency(securityGroupsStack);

    // 6. Storage - Secure S3 Bucket (depends on KMS)
    const storageStack = new StorageStack(scope, `StorageStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      kmsKey: kmsStack.kmsKey,
    });
    storageStack.addDependency(kmsStack);

    // 7. Web Tier - Application Load Balancer (depends on VPC, Security Groups, Auto Scaling)
    const loadBalancerStack = new LoadBalancerStack(scope, `LoadBalancerStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      vpc: vpcStack.vpc,
      albSecurityGroup: securityGroupsStack.albSecurityGroup,
      targetGroup: autoScalingStack.targetGroup,
    });
    loadBalancerStack.addDependency(vpcStack);
    loadBalancerStack.addDependency(securityGroupsStack);
    loadBalancerStack.addDependency(autoScalingStack);

    // 8. Monitoring and Alerting (depends on Auto Scaling, Load Balancer, Database)
    const monitoringStack = new MonitoringStack(scope, `MonitoringStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      autoScalingGroup: autoScalingStack.autoScalingGroup,
      targetGroup: loadBalancerStack.targetGroup,
      database: databaseStack.database,
    });
    monitoringStack.addDependency(autoScalingStack);
    monitoringStack.addDependency(loadBalancerStack);
    monitoringStack.addDependency(databaseStack);

    // Main stack outputs for integration testing
    new cdk.CfnOutput(this, `WebAppURL${environmentSuffix}`, {
      value: `https://${loadBalancerStack.alb.loadBalancerDnsName}`,
      description: `Web application URL - ${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `StackStatus${environmentSuffix}`, {
      value: 'DEPLOYED',
      description: `High-availability web architecture deployment status - ${environmentSuffix}`,
    });
  }
}

export { TapStack };
