import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  allowedIpCidr: string;
  permittedUserName: string;
  bucketBaseName: string;  
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        ...props.env,
        region: 'us-east-1', // Hard constraint: us-east-1 only
      },
    });

    const { allowedIpCidr, permittedUserName, bucketBaseName } = props;

    // Common tags applied to all resources
    const productionTags = {
      Environment: 'Production',
    };

    // 1) S3 Bucket with AES-256 SSE, no public access, SSL-only policy
    const secureBucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: `${bucketBaseName}-${this.account}-${this.region}`,
      
      // Encryption: AES-256 server-side encryption (S3-managed)
      encryption: s3.BucketEncryption.S3_MANAGED,
      
      // Block all public access - zero trust principle
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // Bucket owner enforced for ACLs
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      
      // Enable versioning for additional security
      versioned: true,
      
      // Lifecycle management for cost optimization
      lifecycleRules: [{
        id: 'prod-secure-lifecycle',
        enabled: true,
        noncurrentVersionExpiration: cdk.Duration.days(30),
      }],
      
      // Remove bucket on stack deletion (be cautious in production)
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      
      // Apply production tags
      ...productionTags,
    });

    // SSL-only bucket policy - enforce HTTPS
    secureBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'DenyInsecureConnections',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [
        secureBucket.bucketArn,
        `${secureBucket.bucketArn}/*`,
      ],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    }));

    // 2) Least-privilege managed policy for bucket access (List/Get only)
    const bucketReadOnlyPolicy = new iam.ManagedPolicy(this, 'BucketReadOnlyPolicy', {
      managedPolicyName: 'prod-secure-bucket-readonly',
      description: 'Least-privilege policy for read-only access to secure production bucket',
      statements: [
        // Allow listing bucket contents
        new iam.PolicyStatement({
          sid: 'AllowListBucket',
          effect: iam.Effect.ALLOW,
          actions: ['s3:ListBucket'],
          resources: [secureBucket.bucketArn],
        }),
        // Allow getting objects from bucket
        new iam.PolicyStatement({
          sid: 'AllowGetObject',
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject'],
          resources: [`${secureBucket.bucketArn}/*`],
        }),
      ],
    });

    // Apply tags to the managed policy
    cdk.Tags.of(bucketReadOnlyPolicy).add('Environment', 'Production');

    // 3) IAM role assumable only with MFA by specific IAM user
    const secureRole = new iam.Role(this, 'SecureRole', {
      roleName: 'prod-secure-role',
      description: 'Secure role requiring MFA for assumption by authorized user',
      
      // Trust policy: Only allow specified user with MFA
      assumedBy: new iam.AccountPrincipal(this.account).withConditions({
        // Require MFA for role assumption - zero trust principle
        Bool: {
          'aws:MultiFactorAuthPresent': 'true',
        },
        // Restrict to specific IAM user
        StringEquals: {
          'aws:username': permittedUserName,
        },
      }),
      
      // Attach the least-privilege bucket policy
      managedPolicies: [bucketReadOnlyPolicy],
      
      // Session duration - limit exposure window
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Apply tags to the role
    cdk.Tags.of(secureRole).add('Environment', 'Production');

    // 4) VPC Security Group - HTTPS from specified CIDR only, restricted egress
    // Assumption: Using default VPC since no VPC was specified
    const defaultVpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
      isDefault: true,
    });

    const secureSecurityGroup = new ec2.SecurityGroup(this, 'SecureSecurityGroup', {
      securityGroupName: 'prod-secure-sg',
      description: 'Secure SG allowing HTTPS from specified CIDR only',
      vpc: defaultVpc,
      
      // Deny all traffic by default
      allowAllOutbound: false,
    });

    // Ingress: Allow HTTPS (443) from specified CIDR only
    secureSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedIpCidr),
      ec2.Port.tcp(443),
      'Allow HTTPS from authorized IP range'
    );

    // Egress: Restrict to HTTPS only (secure baseline)
    secureSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS only'
    );

    // Apply tags to security group
    cdk.Tags.of(secureSecurityGroup).add('Environment', 'Production');

    // CloudFormation Outputs for operational visibility
    new cdk.CfnOutput(this, 'SecureBucketName', {
      description: 'Name of the secure S3 bucket',
      value: secureBucket.bucketName,
      exportName: 'prod-secure-bucket-name',
    });

    new cdk.CfnOutput(this, 'SecureBucketArn', {
      description: 'ARN of the secure S3 bucket',
      value: secureBucket.bucketArn,
      exportName: 'prod-secure-bucket-arn',
    });

    new cdk.CfnOutput(this, 'BucketReadOnlyPolicyArn', {
      description: 'ARN of the least-privilege bucket read-only policy',
      value: bucketReadOnlyPolicy.managedPolicyArn,
      exportName: 'prod-secure-policy-arn',
    });

    new cdk.CfnOutput(this, 'SecureRoleArn', {
      description: 'ARN of the MFA-required secure role',
      value: secureRole.roleArn,
      exportName: 'prod-secure-role-arn',
    });

    new cdk.CfnOutput(this, 'SecureSecurityGroupId', {
      description: 'ID of the secure security group',
      value: secureSecurityGroup.securityGroupId,
      exportName: 'prod-secure-sg-id',
    });

    new cdk.CfnOutput(this, 'AllowedIpCidr', {
      description: 'CIDR block allowed for HTTPS access',
      value: allowedIpCidr,
      exportName: 'prod-secure-allowed-cidr',
    });
  }  
}


// lib/secure-prod-stack.ts

export interface SecureProdStackProps extends cdk.StackProps {

}

export class SecureProdStack extends cdk.Stack {

}
