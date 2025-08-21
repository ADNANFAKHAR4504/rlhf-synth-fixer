import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface IamConstructProps {
  environmentSuffix: string;
  enableLogging: boolean;
}

export class IamConstruct extends Construct {
  public readonly s3ReplicationRole: iam.Role;
  // public readonly eksClusterRole: iam.Role;
  // public readonly eksNodeGroupRole: iam.Role;
  public readonly loggingRole?: iam.Role;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    // S3 Cross-Region Replication Role
    this.s3ReplicationRole = new iam.Role(this, 'S3ReplicationRole', {
      roleName: `s3-replication-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      inlinePolicies: {
        ReplicationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // EKS Cluster Service Role (Commented out for simplified deployment)
    // this.eksClusterRole = new iam.Role(this, 'EksClusterRole', {
    //   roleName: `eks-cluster-role-${props.environmentSuffix}`,
    //   assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
    //   managedPolicies: [
    //     iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
    //   ],
    // });

    // // EKS Node Group Role (Commented out for simplified deployment)
    // this.eksNodeGroupRole = new iam.Role(this, 'EksNodeGroupRole', {
    //   roleName: `eks-node-group-role-${props.environmentSuffix}`,
    //   assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    //   managedPolicies: [
    //     iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
    //     iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
    //     iam.ManagedPolicy.fromAwsManagedPolicyName(
    //       'AmazonEC2ContainerRegistryReadOnly'
    //     ),
    //   ],
    // });

    // CloudWatch Logging Role (if logging enabled)
    if (props.enableLogging) {
      this.loggingRole = new iam.Role(this, 'CloudWatchLoggingRole', {
        roleName: `cloudwatch-logging-role-${props.environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
        inlinePolicies: {
          LoggingPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogStreams',
                  'logs:DescribeLogGroups',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      });
    }

    // Add common tags
    const allRoles = [this.s3ReplicationRole];
    // if (this.eksClusterRole) allRoles.push(this.eksClusterRole);
    // if (this.eksNodeGroupRole) allRoles.push(this.eksNodeGroupRole);
    if (this.loggingRole) allRoles.push(this.loggingRole);

    allRoles.forEach(role => {
      role.node.addMetadata('Environment', props.environmentSuffix);
      role.node.addMetadata('Component', 'IAM');
    });
  }
}
