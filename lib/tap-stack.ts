import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeStack } from './stacks/compute-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { NetworkingStack } from './stacks/networking-stack';
import { SecurityStack } from './stacks/security-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  allowedSshCidr?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const allowedSshCidr = props?.allowedSshCidr || '10.0.0.0/8';

    // Common stack props - use passed env or fall back to process.env
    const commonProps = {
      env: props?.env || {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      environmentSuffix,
    };

    // Create Networking Stack - VPC, Subnets, NAT Gateways, VPC Endpoints
    const networkingStack = new NetworkingStack(
      scope,
      `NetworkingStack-${environmentSuffix}`,
      {
        ...commonProps,
        vpcCidr: '10.0.0.0/16',
        description: `Networking infrastructure for TapStack ${environmentSuffix}`,
      }
    );

    // Create Security Stack - Security Groups, IAM Roles, KMS, Secrets Manager
    const securityStack = new SecurityStack(
      scope,
      `SecurityStack-${environmentSuffix}`,
      {
        ...commonProps,
        vpc: networkingStack.vpc,
        allowedSshCidr,
        description: `Security infrastructure for TapStack ${environmentSuffix}`,
      }
    );

    // Create Compute Stack - Auto Scaling Groups, ALB, Launch Templates, EFS
    const computeStack = new ComputeStack(
      scope,
      `ComputeStack-${environmentSuffix}`,
      {
        ...commonProps,
        vpc: networkingStack.vpc,
        webAppSecurityGroup: securityStack.webAppSecurityGroup,
        albSecurityGroup: securityStack.albSecurityGroup,
        ec2Role: securityStack.ec2Role,
        description: `Compute infrastructure for TapStack ${environmentSuffix}`,
      }
    );

    // Create Monitoring Stack - CloudTrail, CloudWatch, AWS Config, SNS
    const monitoringStack = new MonitoringStack(
      scope,
      `MonitoringStack-${environmentSuffix}`,
      {
        ...commonProps,
        vpc: networkingStack.vpc,
        webAppAutoScalingGroup: computeStack.webAppAutoScalingGroup,
        description: `Monitoring and compliance infrastructure for TapStack ${environmentSuffix}`,
      }
    );

    // Add dependencies to ensure proper stack deployment order
    securityStack.addDependency(networkingStack);
    computeStack.addDependency(securityStack);
    monitoringStack.addDependency(computeStack);

    // Add comprehensive tags to all stacks
    const tags = {
      Environment: environmentSuffix,
      Project: 'TapStack',
      ManagedBy: 'AWS CDK',
      CostCenter: 'Infrastructure',
      Compliance: 'SOC2',
      Owner: 'DevOps Team',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(networkingStack).add(key, value);
      cdk.Tags.of(securityStack).add(key, value);
      cdk.Tags.of(computeStack).add(key, value);
      cdk.Tags.of(monitoringStack).add(key, value);
    });

    // Export all child stack outputs to main stack for comprehensive testing

    // Networking Stack Outputs
    new cdk.CfnOutput(this, `VpcId-${environmentSuffix}`, {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID from Networking Stack',
      exportName: `main-tf-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `PublicSubnetIds-${environmentSuffix}`, {
      value: networkingStack.publicSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Public Subnet IDs from Networking Stack',
      exportName: `main-tf-public-subnet-ids-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `PrivateSubnetIds-${environmentSuffix}`, {
      value: networkingStack.privateSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Private Subnet IDs from Networking Stack',
      exportName: `main-tf-private-subnet-ids-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `S3VpcEndpointId-${environmentSuffix}`, {
      value: networkingStack.s3VpcEndpoint.vpcEndpointId,
      description: 'S3 VPC Endpoint ID from Networking Stack',
      exportName: `main-tf-s3-endpoint-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `DynamoDbVpcEndpointId-${environmentSuffix}`, {
      value: networkingStack.dynamodbVpcEndpoint.vpcEndpointId,
      description: 'DynamoDB VPC Endpoint ID from Networking Stack',
      exportName: `main-tf-dynamodb-endpoint-id-${environmentSuffix}`,
    });

    // Security Stack Outputs
    new cdk.CfnOutput(this, `WebAppSecurityGroupId-${environmentSuffix}`, {
      value: securityStack.webAppSecurityGroup.securityGroupId,
      description: 'Web-App Security Group ID from Security Stack',
      exportName: `main-tf-web-app-sg-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ALBSecurityGroupId-${environmentSuffix}`, {
      value: securityStack.albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID from Security Stack',
      exportName: `main-tf-alb-sg-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `EC2RoleArn-${environmentSuffix}`, {
      value: securityStack.ec2Role.roleArn,
      description: 'EC2 IAM Role ARN from Security Stack',
      exportName: `main-tf-ec2-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `EC2RoleName-${environmentSuffix}`, {
      value: securityStack.ec2Role.roleName,
      description: 'EC2 IAM Role Name from Security Stack',
      exportName: `main-tf-ec2-role-name-${environmentSuffix}`,
    });

    // Compute Stack Outputs
    new cdk.CfnOutput(this, `ALBDnsName-${environmentSuffix}`, {
      value: computeStack.applicationLoadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name from Compute Stack',
      exportName: `main-tf-alb-dns-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ALBArn-${environmentSuffix}`, {
      value: computeStack.applicationLoadBalancer.loadBalancerArn,
      description: 'Application Load Balancer ARN from Compute Stack',
      exportName: `main-tf-alb-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `WebAppAutoScalingGroupName-${environmentSuffix}`, {
      value: computeStack.webAppAutoScalingGroup.autoScalingGroupName,
      description: 'Web-App Auto Scaling Group Name from Compute Stack',
      exportName: `main-tf-web-app-asg-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `WebAppAutoScalingGroupArn-${environmentSuffix}`, {
      value: computeStack.webAppAutoScalingGroup.autoScalingGroupArn,
      description: 'Web-App Auto Scaling Group ARN from Compute Stack',
      exportName: `main-tf-web-app-asg-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `WebAppLaunchTemplateId-${environmentSuffix}`, {
      value: computeStack.webAppLaunchTemplate.launchTemplateId!,
      description: 'Web-App Launch Template ID from Compute Stack',
      exportName: `main-tf-web-app-lt-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `EFSFileSystemId-${environmentSuffix}`, {
      value: computeStack.efsFileSystem!.fileSystemId,
      description: 'EFS File System ID from Compute Stack',
      exportName: `main-tf-efs-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `EFSFileSystemArn-${environmentSuffix}`, {
      value: computeStack.efsFileSystem!.fileSystemArn,
      description: 'EFS File System ARN from Compute Stack',
      exportName: `main-tf-efs-arn-${environmentSuffix}`,
    });

    // Monitoring Stack Outputs
    new cdk.CfnOutput(this, `CloudTrailArn-${environmentSuffix}`, {
      value: monitoringStack.cloudTrail.trailArn,
      description: 'CloudTrail ARN from Monitoring Stack',
      exportName: `main-tf-cloudtrail-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `AlertingTopicArn-${environmentSuffix}`, {
      value: monitoringStack.alertingTopic.topicArn,
      description: 'SNS Alerting Topic ARN from Monitoring Stack',
      exportName: `main-tf-alerts-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `CloudWatchDashboardName-${environmentSuffix}`, {
      value: monitoringStack.cloudWatchDashboard.dashboardName,
      description: 'CloudWatch Dashboard Name from Monitoring Stack',
      exportName: `main-tf-dashboard-name-${environmentSuffix}`,
    });

    // Main stack deployment summary with all key resource IDs
    new cdk.CfnOutput(this, `DeploymentSummary-${environmentSuffix}`, {
      value: JSON.stringify({
        region: this.region,
        environment: environmentSuffix,
        deploymentTime: new Date().toISOString(),
        infrastructure: {
          networking: {
            vpcId: networkingStack.vpc.vpcId,
            publicSubnets: networkingStack.publicSubnets.length,
            privateSubnets: networkingStack.privateSubnets.length,
          },
          security: {
            webAppSecurityGroupId:
              securityStack.webAppSecurityGroup.securityGroupId,
            albSecurityGroupId: securityStack.albSecurityGroup.securityGroupId,
            ec2RoleName: securityStack.ec2Role.roleName,
          },
          compute: {
            albDnsName:
              computeStack.applicationLoadBalancer.loadBalancerDnsName,
            asgName: computeStack.webAppAutoScalingGroup.autoScalingGroupName,
            efsId: computeStack.efsFileSystem?.fileSystemId,
          },
          stacks: [
            networkingStack.stackName,
            securityStack.stackName,
            computeStack.stackName,
            monitoringStack.stackName,
          ],
        },
      }),
      description:
        'Complete TapStack deployment summary with all resource details',
    });
  }
}
