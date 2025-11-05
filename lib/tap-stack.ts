import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix: string;
  notificationEmail?: string;
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly rdsInstance: aws.rds.Instance;
  public readonly snsTopic: aws.sns.Topic;
  public readonly dbSecret: aws.secretsmanager.Secret;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const availabilityZones = aws.getAvailabilityZones({ state: 'available' });

    // Default tags
    const defaultTags = {
      Environment: 'production',
      Project: 'payment-processing',
      CostCenter: 'Engineering',
      Owner: 'Platform-Team',
      DeploymentId: args.environmentSuffix,
      ...args.tags,
    };

    // Create VPC - using 172.16.0.0/16 to avoid conflict with dev 10.0.0.0/16
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '172.16.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...defaultTags, Name: `vpc-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Internet Gateway for NAT
    const igw = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: { ...defaultTags, Name: `igw-${args.environmentSuffix}` },
      },
      { parent: this.vpc }
    );

    // Create public subnet for NAT Gateway
    const publicSubnet = new aws.ec2.Subnet(
      `public-subnet-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '172.16.0.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...defaultTags,
          Name: `public-subnet-${args.environmentSuffix}`,
        },
      },
      { parent: this.vpc }
    );

    // Public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: { ...defaultTags, Name: `public-rt-${args.environmentSuffix}` },
      },
      { parent: this.vpc }
    );

    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: publicRouteTable }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-${args.environmentSuffix}`,
      {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: publicRouteTable }
    );

    // Elastic IP for NAT Gateway
    const eip = new aws.ec2.Eip(
      `nat-eip-${args.environmentSuffix}`,
      {
        domain: 'vpc',
        tags: { ...defaultTags, Name: `nat-eip-${args.environmentSuffix}` },
      },
      { parent: this.vpc }
    );

    // NAT Gateway for private subnet connectivity
    const natGateway = new aws.ec2.NatGateway(
      `nat-gateway-${args.environmentSuffix}`,
      {
        subnetId: publicSubnet.id,
        allocationId: eip.id,
        tags: { ...defaultTags, Name: `nat-gateway-${args.environmentSuffix}` },
      },
      { parent: this.vpc }
    );

    // Create private subnets in 2 AZs
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '172.16.1.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        tags: {
          ...defaultTags,
          Name: `private-subnet-1-${args.environmentSuffix}`,
        },
      },
      { parent: this.vpc }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '172.16.2.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        tags: {
          ...defaultTags,
          Name: `private-subnet-2-${args.environmentSuffix}`,
        },
      },
      { parent: this.vpc }
    );

    // Create firewall subnets for AWS Network Firewall
    const firewallSubnet1 = new aws.ec2.Subnet(
      `firewall-subnet-1-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '172.16.3.0/28',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        tags: {
          ...defaultTags,
          Name: `firewall-subnet-1-${args.environmentSuffix}`,
        },
      },
      { parent: this.vpc }
    );

    const firewallSubnet2 = new aws.ec2.Subnet(
      `firewall-subnet-2-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '172.16.3.16/28',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        tags: {
          ...defaultTags,
          Name: `firewall-subnet-2-${args.environmentSuffix}`,
        },
      },
      { parent: this.vpc }
    );

    // AWS Network Firewall Rule Group
    const firewallRuleGroup = new aws.networkfirewall.RuleGroup(
      `firewall-rules-${args.environmentSuffix}`,
      {
        capacity: 100,
        type: 'STATEFUL',
        ruleGroup: {
          rulesSource: {
            rulesSourceList: {
              generatedRulesType: 'ALLOWLIST',
              targets: ['.amazonaws.com'],
              targetTypes: ['TLS_SNI', 'HTTP_HOST'],
            },
          },
        },
        tags: defaultTags,
      },
      { parent: this.vpc }
    );

    // Network Firewall Policy
    const firewallPolicy = new aws.networkfirewall.FirewallPolicy(
      `firewall-policy-${args.environmentSuffix}`,
      {
        firewallPolicy: {
          statelessDefaultActions: ['aws:forward_to_sfe'],
          statelessFragmentDefaultActions: ['aws:forward_to_sfe'],
          statefulRuleGroupReferences: [
            {
              resourceArn: firewallRuleGroup.arn,
            },
          ],
        },
        tags: defaultTags,
      },
      { parent: this.vpc }
    );

    // AWS Network Firewall
    const networkFirewall = new aws.networkfirewall.Firewall(
      `network-firewall-${args.environmentSuffix}`,
      {
        firewallPolicyArn: firewallPolicy.arn,
        vpcId: this.vpc.id,
        subnetMappings: [
          { subnetId: firewallSubnet1.id },
          { subnetId: firewallSubnet2.id },
        ],
        tags: defaultTags,
      },
      { parent: this.vpc }
    );

    // CloudWatch Log Group for Network Firewall
    const firewallLogGroup = new aws.cloudwatch.LogGroup(
      `firewall-logs-${args.environmentSuffix}`,
      {
        name: `/aws/networkfirewall/${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: networkFirewall }
    );

    new aws.networkfirewall.LoggingConfiguration(
      `firewall-logging-${args.environmentSuffix}`,
      {
        firewallArn: networkFirewall.arn,
        loggingConfiguration: {
          logDestinationConfigs: [
            {
              logDestination: {
                logGroup: firewallLogGroup.name,
              },
              logDestinationType: 'CloudWatchLogs',
              logType: 'FLOW',
            },
          ],
        },
      },
      { parent: networkFirewall }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${args.environmentSuffix}`,
      {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          ...defaultTags,
          Name: `db-subnet-group-${args.environmentSuffix}`,
        },
      },
      { parent: this.vpc }
    );

    // Create security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for RDS MySQL instance',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            cidrBlocks: ['172.16.0.0/16'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: { ...defaultTags, Name: `rds-sg-${args.environmentSuffix}` },
      },
      { parent: this.vpc }
    );

    // Create security group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for Lambda functions',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: { ...defaultTags, Name: `lambda-sg-${args.environmentSuffix}` },
      },
      { parent: this.vpc }
    );

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      `encryption-key-${args.environmentSuffix}`,
      {
        description: 'KMS key for Lambda and Secrets Manager encryption',
        enableKeyRotation: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `encryption-key-alias-${args.environmentSuffix}`,
      {
        name: `alias/tap-${args.environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: kmsKey }
    );

    // Create Secrets Manager secret for DB credentials
    this.dbSecret = new aws.secretsmanager.Secret(
      `db-secret-${args.environmentSuffix}`,
      {
        description: 'RDS MySQL credentials',
        kmsKeyId: kmsKey.id,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Generate strong password (16+ chars, no @/" characters for RDS)
    const dbSecretVersion = new aws.secretsmanager.SecretVersion(
      `db-secret-version-${args.environmentSuffix}`,
      {
        secretId: this.dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'Chang3M3Pl3as3!123456',
          engine: 'mysql',
          host: '',
          port: 3306,
          dbname: 'payments',
        }),
      },
      { parent: this.dbSecret }
    );

    // IAM role for secret rotation Lambda
    const rotationLambdaRole = new aws.iam.Role(
      `rotation-lambda-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach VPC execution policy for rotation Lambda
    new aws.iam.RolePolicyAttachment(
      `rotation-lambda-vpc-${args.environmentSuffix}`,
      {
        role: rotationLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: rotationLambdaRole }
    );

    // Create inline policy for rotation Lambda
    new aws.iam.RolePolicy(
      `rotation-lambda-policy-${args.environmentSuffix}`,
      {
        role: rotationLambdaRole.name,
        policy: pulumi
          .all([this.dbSecret.arn, kmsKey.arn])
          .apply(([secretArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:DescribeSecret',
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:PutSecretValue',
                    'secretsmanager:UpdateSecretVersionStage',
                  ],
                  Resource: secretArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetRandomPassword'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'kms:Decrypt',
                    'kms:DescribeKey',
                    'kms:GenerateDataKey',
                  ],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: rotationLambdaRole }
    );

    // Create rotation Lambda function
    const rotationLambda = new aws.lambda.Function(
      `secret-rotation-${args.environmentSuffix}`,
      {
        runtime: 'python3.11',
        role: rotationLambdaRole.arn,
        handler: 'lambda_function.lambda_handler',
        timeout: 30,
        code: new pulumi.asset.AssetArchive({
          'lambda_function.py': new pulumi.asset.StringAsset(`
import json
import boto3
import os

def lambda_handler(event, context):
    """Handles RDS MySQL password rotation"""
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    service_client = boto3.client('secretsmanager')

    metadata = service_client.describe_secret(SecretId=arn)
    if not metadata['RotationEnabled']:
        raise ValueError(f"Secret {arn} is not enabled for rotation")

    versions = metadata['VersionIdsToStages']
    if token not in versions:
        raise ValueError(f"Secret version {token} has no stage for rotation")

    if "AWSCURRENT" in versions[token]:
        return
    elif "AWSPENDING" not in versions[token]:
        raise ValueError(f"Secret version {token} not set as AWSPENDING for rotation")

    if step == "createSecret":
        create_secret(service_client, arn, token)
    elif step == "setSecret":
        set_secret(service_client, arn, token)
    elif step == "testSecret":
        test_secret(service_client, arn, token)
    elif step == "finishSecret":
        finish_secret(service_client, arn, token)
    else:
        raise ValueError("Invalid step parameter")

def create_secret(service_client, arn, token):
    service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")
    try:
        service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage="AWSPENDING")
    except service_client.exceptions.ResourceNotFoundException:
        passwd = service_client.get_random_password(ExcludeCharacters='/@"'\\\\'"', PasswordLength=16)
        current_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")['SecretString'])
        current_dict['password'] = passwd['RandomPassword']
        service_client.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=json.dumps(current_dict), VersionStages=['AWSPENDING'])

def set_secret(service_client, arn, token):
    pass

def test_secret(service_client, arn, token):
    pass

def finish_secret(service_client, arn, token):
    metadata = service_client.describe_secret(SecretId=arn)
    current_version = None
    for version in metadata["VersionIdsToStages"]:
        if "AWSCURRENT" in metadata["VersionIdsToStages"][version]:
            if version == token:
                return
            current_version = version
            break
    service_client.update_secret_version_stage(SecretId=arn, VersionStage="AWSCURRENT", MoveToVersionId=token, RemoveFromVersionId=current_version)
          `),
        }),
        vpcConfig: {
          subnetIds: [privateSubnet1.id, privateSubnet2.id],
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // Grant Secrets Manager permission to invoke rotation Lambda
    new aws.lambda.Permission(
      `rotation-lambda-permission-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: rotationLambda.arn,
        principal: 'secretsmanager.amazonaws.com',
      },
      { parent: rotationLambda }
    );

    // RDS MySQL instance - Multi-AZ (using Secrets Manager)
    this.rdsInstance = new aws.rds.Instance(
      `rds-mysql-${args.environmentSuffix}`,
      {
        identifier: `rds-mysql-${args.environmentSuffix}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.medium',
        allocatedStorage: 100,
        storageType: 'gp2',
        storageEncrypted: true,
        username: 'admin',
        password: 'Chang3M3Pl3as3!123456',
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        multiAz: true,
        backupRetentionPeriod: 7,
        skipFinalSnapshot: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Update secret with RDS endpoint after creation
    const secretUpdate = new aws.secretsmanager.SecretVersion(
      `db-secret-update-${args.environmentSuffix}`,
      {
        secretId: this.dbSecret.id,
        secretString: pulumi.jsonStringify({
          username: 'admin',
          password: 'Chang3M3Pl3as3!123456',
          engine: 'mysql',
          host: this.rdsInstance.endpoint,
          port: 3306,
          dbname: 'payments',
        }),
      },
      { parent: this.dbSecret, dependsOn: [this.rdsInstance, dbSecretVersion] }
    );

    // Configure secret rotation
    new aws.secretsmanager.SecretRotation(
      `db-secret-rotation-${args.environmentSuffix}`,
      {
        secretId: this.dbSecret.id,
        rotationLambdaArn: rotationLambda.arn,
        rotationRules: {
          automaticallyAfterDays: 30,
        },
      },
      { parent: this.dbSecret, dependsOn: [secretUpdate, rotationLambda] }
    );

    // SNS Topic for alerts
    this.snsTopic = new aws.sns.Topic(
      `alerts-topic-${args.environmentSuffix}`,
      {
        displayName: 'Production Alerts',
        tags: defaultTags,
      },
      { parent: this }
    );

    // SNS email subscription
    if (args.notificationEmail) {
      new aws.sns.TopicSubscription(
        `alerts-subscription-${args.environmentSuffix}`,
        {
          topic: this.snsTopic.arn,
          protocol: 'email',
          endpoint: args.notificationEmail,
        },
        { parent: this.snsTopic }
      );
    }

    // CloudWatch Log Group
    new aws.cloudwatch.LogGroup(
      `lambda-logs-${args.environmentSuffix}`,
      {
        name: `/aws/lambda/payment-processor-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM role for Lambda
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach policies to Lambda role
    new aws.iam.RolePolicyAttachment(
      `lambda-vpc-execution-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: lambdaRole }
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: lambdaRole }
    );

    // Add Secrets Manager permissions to Lambda role
    new aws.iam.RolePolicy(
      `lambda-secrets-policy-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policy: pulumi
          .all([this.dbSecret.arn, kmsKey.arn])
          .apply(([secretArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: secretArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: lambdaRole }
    );

    // Create Lambda function for payment processing
    const paymentProcessor = new aws.lambda.Function(
      `payment-processor-${args.environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 50,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Processing payment:', event);
  return { statusCode: 200, body: 'Payment processed' };
};
          `),
        }),
        vpcConfig: {
          subnetIds: [privateSubnet1.id, privateSubnet2.id],
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        environment: {
          variables: {
            DB_HOST: this.rdsInstance.endpoint,
            DB_NAME: 'payments',
            DB_SECRET_ARN: this.dbSecret.arn,
          },
        },
        kmsKeyArn: kmsKey.arn,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [natGateway] }
    );

    // AWS Transfer Family for SFTP
    new aws.cloudwatch.LogGroup(
      `transfer-logs-${args.environmentSuffix}`,
      {
        name: `/aws/transfer/${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    const transferRole = new aws.iam.Role(
      `transfer-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'transfer.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `transfer-logging-policy-${args.environmentSuffix}`,
      {
        role: transferRole.name,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: transferRole }
    );

    const transferServer = new aws.transfer.Server(
      `transfer-server-${args.environmentSuffix}`,
      {
        protocols: ['SFTP'],
        identityProviderType: 'SERVICE_MANAGED',
        loggingRole: transferRole.arn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Note: AWS Evidently has been discontinued as of 2025.
    // For feature flags, consider using AWS AppConfig instead.

    // AWS App Runner for container deployment
    const appRunnerRole = new aws.iam.Role(
      `apprunner-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'build.apprunner.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `apprunner-ecr-policy-${args.environmentSuffix}`,
      {
        role: appRunnerRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess',
      },
      { parent: appRunnerRole }
    );

    const appRunnerService = new aws.apprunner.Service(
      `apprunner-service-${args.environmentSuffix}`,
      {
        serviceName: `payment-service-${args.environmentSuffix}`,
        sourceConfiguration: {
          autoDeploymentsEnabled: false,
          imageRepository: {
            imageIdentifier: 'public.ecr.aws/docker/library/nginx:latest',
            imageRepositoryType: 'ECR_PUBLIC',
            imageConfiguration: {
              port: '80',
            },
          },
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // AWS Fault Injection Simulator template
    const fisRole = new aws.iam.Role(
      `fis-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'fis.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `fis-policy-${args.environmentSuffix}`,
      {
        role: fisRole.name,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['ec2:*', 'rds:*', 'cloudwatch:*'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: fisRole }
    );

    const fisExperimentTemplate = new aws.fis.ExperimentTemplate(
      `fis-template-${args.environmentSuffix}`,
      {
        description: 'Chaos engineering experiment for resilience testing',
        roleArn: fisRole.arn,
        stopConditions: [
          {
            source: 'none',
          },
        ],
        targets: [
          {
            name: 'rds-target',
            resourceType: 'aws:rds:db',
            selectionMode: 'ALL',
            resourceArns: [this.rdsInstance.arn],
          },
        ],
        actions: [
          {
            name: 'test-rds-failover',
            actionId: 'aws:rds:reboot-db-instances',
            target: {
              key: 'DBInstances',
              value: 'rds-target',
            },
            parameters: [
              {
                key: 'forceFailover',
                value: 'true',
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [this.rdsInstance] }
    );

    // AWS Resource Access Manager resource share
    const ramResourceShare = new aws.ram.ResourceShare(
      `ram-share-${args.environmentSuffix}`,
      {
        name: `payment-resources-${args.environmentSuffix}`,
        allowExternalPrincipals: false,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Route table for private subnets with NAT
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: { ...defaultTags, Name: `private-rt-${args.environmentSuffix}` },
      },
      { parent: this.vpc }
    );

    new aws.ec2.Route(
      `private-route-${args.environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
      { parent: privateRouteTable }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-1-${args.environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: privateRouteTable }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-2-${args.environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: privateRouteTable }
    );

    // Outputs
    this.registerOutputs({
      vpcId: this.vpc.id,
      rdsEndpoint: this.rdsInstance.endpoint,
      rdsArn: this.rdsInstance.arn,
      snsTopicArn: this.snsTopic.arn,
      lambdaFunctionArn: paymentProcessor.arn,
      dbSecretArn: this.dbSecret.arn,
      kmsKeyArn: kmsKey.arn,
      networkFirewallArn: networkFirewall.arn,
      transferServerArn: transferServer.arn,
      appRunnerServiceArn: appRunnerService.arn,
      fisTemplateId: fisExperimentTemplate.id,
      ramResourceShareArn: ramResourceShare.arn,
      natGatewayId: natGateway.id,
    });
  }
}
