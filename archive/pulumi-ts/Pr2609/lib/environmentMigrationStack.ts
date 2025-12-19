import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

interface StackOutputs {
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  s3BucketName: pulumi.Output<string>;
  s3BucketArn: pulumi.Output<string>;
  rdsEndpoint: pulumi.Output<string>;
  lambdaFunctionArn: pulumi.Output<string>;
  lambdaFunctionName: pulumi.Output<string>;
  albDnsName: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  cloudFrontDomainName: pulumi.Output<string>;
  cloudFrontDistributionId: pulumi.Output<string>;
  ec2InstanceId: pulumi.Output<string>;
  ec2PublicIp: pulumi.Output<string>;
  dynamoTableName: pulumi.Output<string>;
  dynamoTableArn: pulumi.Output<string>;
  kmsKeyId: pulumi.Output<string>;
  kmsKeyArn: pulumi.Output<string>;
  secretArn: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
}

export class EnvironmentMigrationStack {
  private readonly provider: aws.Provider;
  private readonly environment: string;
  private readonly tags: pulumi.Input<{ [key: string]: string }>;

  public readonly outputs: StackOutputs;
  public readonly vpc: aws.ec2.Vpc;
  public readonly kmsKey: aws.kms.Key;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly secret: aws.secretsmanager.Secret;

  constructor(
    region: string,
    environment: string,
    tags: pulumi.Input<{ [key: string]: string }>
  ) {
    this.provider = new aws.Provider(`provider-${environment}`, { region });
    this.environment = environment;
    this.tags = { ...tags, Environment: environment };

    this.kmsKey = this.createKmsKey();
    this.vpc = this.createVpc();
    const { publicSubnets, privateSubnets } = this.createNetworking();
    const s3Bucket = this.createS3Bucket();
    const rdsInstance = this.createDatabase(privateSubnets);
    this.secret = this.createSecretsManager();
    const dynamoTable = this.createDynamoTable();
    const lambdaFunction = this.createLambda(privateSubnets);
    const { alb, targetGroup } = this.createLoadBalancer(publicSubnets);
    this.targetGroup = targetGroup;
    const cloudFrontDistribution = this.createCloudFront(alb);
    const ec2Instance = this.createEC2Instance(publicSubnets[0]);
    this.createTargetGroupAttachment(ec2Instance, targetGroup);

    this.outputs = {
      vpcId: this.vpc.id,
      publicSubnetIds: publicSubnets.map(s => s.id),
      privateSubnetIds: privateSubnets.map(s => s.id),
      s3BucketName: s3Bucket.bucket,
      s3BucketArn: s3Bucket.arn,
      rdsEndpoint: rdsInstance.endpoint,
      lambdaFunctionArn: lambdaFunction.arn,
      lambdaFunctionName: lambdaFunction.name,
      albDnsName: alb.dnsName,
      albArn: alb.arn,
      cloudFrontDomainName: cloudFrontDistribution.domainName,
      cloudFrontDistributionId: cloudFrontDistribution.id,
      ec2InstanceId: ec2Instance.id,
      ec2PublicIp: ec2Instance.publicIp,
      dynamoTableName: dynamoTable.name,
      dynamoTableArn: dynamoTable.arn,
      kmsKeyId: this.kmsKey.keyId,
      kmsKeyArn: this.kmsKey.arn,
      secretArn: this.secret.arn,
      targetGroupArn: targetGroup.arn,
    };
  }

  private createKmsKey(): aws.kms.Key {
    const key = new aws.kms.Key(
      `kms-key-${this.environment}`,
      {
        description: `KMS key for ${this.environment}`,
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.kms.Alias(
      `kms-alias-${this.environment}`,
      {
        name: `alias/${this.environment}-key`,
        targetKeyId: key.keyId,
      },
      { provider: this.provider }
    );

    return key;
  }

  private createVpc(): aws.ec2.Vpc {
    return new aws.ec2.Vpc(
      `vpc-${this.environment}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...this.tags, Name: `vpc-${this.environment}` },
      },
      { provider: this.provider }
    );
  }

  public getAvailabilityZone(
    names: string[] | undefined | null,
    index: number
  ): string {
    if (!names || names.length === 0) {
      return `us-east-1${String.fromCharCode(97 + index)}`;
    }
    return (
      names[index % names.length] ||
      `us-east-1${String.fromCharCode(97 + index)}`
    );
  }

  private createNetworking(): {
    publicSubnets: aws.ec2.Subnet[];
    privateSubnets: aws.ec2.Subnet[];
  } {
    const igw = new aws.ec2.InternetGateway(
      `igw-${this.environment}`,
      {
        vpcId: this.vpc.id,
        tags: { ...this.tags, Name: `igw-${this.environment}` },
      },
      { provider: this.provider }
    );

    const azs = aws.getAvailabilityZones(
      { state: 'available' },
      { provider: this.provider }
    );
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      publicSubnets.push(
        new aws.ec2.Subnet(
          `public-subnet-${i}-${this.environment}`,
          {
            vpcId: this.vpc.id,
            cidrBlock: `10.0.${i + 1}.0/24`,
            availabilityZone: azs.then(azs =>
              this.getAvailabilityZone(azs.names, i)
            ),
            mapPublicIpOnLaunch: true,
            tags: {
              ...this.tags,
              Name: `public-subnet-${i}-${this.environment}`,
            },
          },
          { provider: this.provider }
        )
      );

      privateSubnets.push(
        new aws.ec2.Subnet(
          `private-subnet-${i}-${this.environment}`,
          {
            vpcId: this.vpc.id,
            cidrBlock: `10.0.${i + 10}.0/24`,
            availabilityZone: azs.then(azs =>
              this.getAvailabilityZone(azs.names, i)
            ),
            tags: {
              ...this.tags,
              Name: `private-subnet-${i}-${this.environment}`,
            },
          },
          { provider: this.provider }
        )
      );
    }

    this.createRouting(igw, publicSubnets, privateSubnets);
    return { publicSubnets, privateSubnets };
  }

  private createRouting(
    igw: aws.ec2.InternetGateway,
    publicSubnets: aws.ec2.Subnet[],
    privateSubnets: aws.ec2.Subnet[]
  ): void {
    const eip = new aws.ec2.Eip(
      `nat-eip-${this.environment}`,
      {
        domain: 'vpc',
        tags: this.tags,
      },
      { provider: this.provider }
    );

    const natGw = new aws.ec2.NatGateway(
      `nat-gateway-${this.environment}`,
      {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: { ...this.tags, Name: `nat-gateway-${this.environment}` },
      },
      { provider: this.provider }
    );

    const publicRt = new aws.ec2.RouteTable(
      `public-rt-${this.environment}`,
      {
        vpcId: this.vpc.id,
        tags: { ...this.tags, Name: `public-rt-${this.environment}` },
      },
      { provider: this.provider }
    );

    new aws.ec2.Route(
      `public-route-${this.environment}`,
      {
        routeTableId: publicRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { provider: this.provider }
    );

    const privateRt = new aws.ec2.RouteTable(
      `private-rt-${this.environment}`,
      {
        vpcId: this.vpc.id,
        tags: { ...this.tags, Name: `private-rt-${this.environment}` },
      },
      { provider: this.provider }
    );

    new aws.ec2.Route(
      `private-route-${this.environment}`,
      {
        routeTableId: privateRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      },
      { provider: this.provider }
    );

    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${this.environment}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRt.id,
        },
        { provider: this.provider }
      );
    });

    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${this.environment}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRt.id,
        },
        { provider: this.provider }
      );
    });
  }

  private createS3Bucket(): aws.s3.Bucket {
    const bucket = new aws.s3.Bucket(
      `s3-bucket-${this.environment}`,
      {
        bucket: `s3-bucket-${this.environment}`,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
          },
        },
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.s3.BucketVersioning(
      `s3-bucket-versioning-${this.environment}`,
      {
        bucket: bucket.id,
        versioningConfiguration: { status: 'Enabled' },
      },
      { provider: this.provider }
    );

    new aws.s3.BucketPublicAccessBlock(
      `s3-bucket-pab-${this.environment}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider: this.provider }
    );

    return bucket;
  }

  private createDatabase(privateSubnets: aws.ec2.Subnet[]): aws.rds.Instance {
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${this.environment}`,
      {
        name: `db-subnet-group-${this.environment}`,
        subnetIds: privateSubnets.map(s => s.id),
        tags: { ...this.tags, Name: `db-subnet-group-${this.environment}` },
      },
      { provider: this.provider }
    );

    const dbSg = new aws.ec2.SecurityGroup(
      `db-security-group-${this.environment}`,
      {
        name: `db-security-group-${this.environment}`,
        vpcId: this.vpc.id,
        description: `Database security group for ${this.environment}`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            cidrBlocks: ['10.0.0.0/16'],
          },
        ],
        tags: { ...this.tags, Name: `db-security-group-${this.environment}` },
      },
      { provider: this.provider }
    );

    return new aws.rds.Instance(
      `rds-${this.environment}`,
      {
        identifier: `rds-${this.environment}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 30,
        storageEncrypted: true,
        kmsKeyId: this.kmsKey.arn,
        dbName: 'mydb',
        username: 'admin',
        manageMasterUserPassword: true,
        vpcSecurityGroupIds: [dbSg.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        multiAz: true,
        skipFinalSnapshot: true,
        tags: this.tags,
      },
      { provider: this.provider }
    );
  }

  private createLambda(privateSubnets: aws.ec2.Subnet[]): aws.lambda.Function {
    const role = new aws.iam.Role(
      `lambda-role-${this.environment}`,
      {
        path: '/service/',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
            },
          ],
        }),
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.iam.RolePolicy(
      `lambda-policy-${this.environment}`,
      {
        role: role.id,
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
              Resource: 'arn:aws:logs:*:*:*',
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { provider: this.provider }
    );

    const sg = new aws.ec2.SecurityGroup(
      `lambda-security-group-${this.environment}`,
      {
        name: `lambda-security-group-${this.environment}`,
        vpcId: this.vpc.id,
        description: `Lambda security group for ${this.environment}`,
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          ...this.tags,
          Name: `lambda-security-group-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    return new aws.lambda.Function(
      `lambda-${this.environment}`,
      {
        name: `lambda-${this.environment}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: role.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(
            'exports.handler = async () => ({ statusCode: 200, body: "Hello!" });'
          ),
        }),
        vpcConfig: {
          subnetIds: privateSubnets.map(s => s.id),
          securityGroupIds: [sg.id],
        },
        tags: this.tags,
      },
      { provider: this.provider }
    );
  }

  private createLoadBalancer(publicSubnets: aws.ec2.Subnet[]): {
    alb: aws.lb.LoadBalancer;
    targetGroup: aws.lb.TargetGroup;
  } {
    const sg = new aws.ec2.SecurityGroup(
      `alb-security-group-${this.environment}`,
      {
        name: `alb-security-group-${this.environment}`,
        vpcId: this.vpc.id,
        description: `ALB security group for ${this.environment}`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: { ...this.tags, Name: `alb-security-group-${this.environment}` },
      },
      { provider: this.provider }
    );

    const alb = new aws.lb.LoadBalancer(
      `alb-${this.environment}`,
      {
        name: `alb-${this.environment}`,
        loadBalancerType: 'application',
        subnets: publicSubnets.map(s => s.id),
        securityGroups: [sg.id],
        enableCrossZoneLoadBalancing: true,
        tags: this.tags,
      },
      { provider: this.provider }
    );

    const targetGroup = new aws.lb.TargetGroup(
      `tg-${this.environment}`,
      {
        name: `tg-${this.environment}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: this.vpc.id,
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
        },
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.lb.Listener(
      `alb-listener-${this.environment}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.cloudwatch.MetricAlarm(
      `alb-target-response-alarm-${this.environment}`,
      {
        name: `alb-target-response-alarm-${this.environment}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'This metric monitors ALB response time',
        dimensions: { LoadBalancer: alb.arnSuffix },
        tags: this.tags,
      },
      { provider: this.provider }
    );

    return { alb, targetGroup };
  }

  private createCloudFront(
    alb: aws.lb.LoadBalancer
  ): aws.cloudfront.Distribution {
    const logBucket = new aws.s3.Bucket(
      `cf-logs-${this.environment}`,
      {
        bucket: `cf-logs-${this.environment}`,
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.s3.BucketOwnershipControls(
      `cf-logs-ownership-${this.environment}`,
      {
        bucket: logBucket.id,
        rule: { objectOwnership: 'BucketOwnerPreferred' },
      },
      { provider: this.provider }
    );

    new aws.s3.BucketAcl(
      `cf-logs-acl-${this.environment}`,
      {
        bucket: logBucket.id,
        acl: 'private',
      },
      { provider: this.provider }
    );

    const distribution = new aws.cloudfront.Distribution(
      `cf-${this.environment}`,
      {
        origins: [
          {
            domainName: alb.dnsName,
            originId: `alb-${this.environment}`,
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'http-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],
        enabled: true,
        defaultCacheBehavior: {
          allowedMethods: [
            'DELETE',
            'GET',
            'HEAD',
            'OPTIONS',
            'PATCH',
            'POST',
            'PUT',
          ],
          cachedMethods: ['GET', 'HEAD'],
          targetOriginId: `alb-${this.environment}`,
          viewerProtocolPolicy: 'redirect-to-https',
          forwardedValues: { queryString: false, cookies: { forward: 'none' } },
        },
        restrictions: { geoRestriction: { restrictionType: 'none' } },
        viewerCertificate: { cloudfrontDefaultCertificate: true },
        loggingConfig: {
          bucket: logBucket.bucketDomainName,
          includeCookies: false,
          prefix: 'cloudfront-logs/',
        },
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.cloudwatch.MetricAlarm(
      `cf-error-rate-alarm-${this.environment}`,
      {
        name: `cf-error-rate-alarm-${this.environment}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '4xxErrorRate',
        namespace: 'AWS/CloudFront',
        period: 300,
        statistic: 'Average',
        threshold: 5,
        alarmDescription: 'This metric monitors CloudFront 4xx error rate',
        dimensions: { DistributionId: distribution.id },
        tags: this.tags,
      },
      { provider: this.provider }
    );

    return distribution;
  }

  private createDynamoTable(): aws.dynamodb.Table {
    new aws.kms.Grant(
      `dynamo-kms-grant-${this.environment}`,
      {
        keyId: this.kmsKey.keyId,
        granteePrincipal: 'dynamodb.amazonaws.com',
        operations: [
          'Encrypt',
          'Decrypt',
          'ReEncryptFrom',
          'ReEncryptTo',
          'GenerateDataKey',
          'DescribeKey',
        ],
      },
      { provider: this.provider }
    );

    return new aws.dynamodb.Table(
      `dynamo-table-${this.environment}`,
      {
        name: `dynamo-table-${this.environment}`,
        attributes: [{ name: 'id', type: 'S' }],
        hashKey: 'id',
        billingMode: 'PAY_PER_REQUEST',
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: this.kmsKey.arn,
        },
        tags: this.tags,
      },
      { provider: this.provider }
    );
  }

  private createEC2Instance(subnet: aws.ec2.Subnet): aws.ec2.Instance {
    const role = new aws.iam.Role(
      `ec2-role-${this.environment}`,
      {
        path: '/service/',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
            },
          ],
        }),
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.iam.RolePolicy(
      `ec2-policy-${this.environment}`,
      {
        role: role.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { provider: this.provider }
    );

    const instanceProfile = new aws.iam.InstanceProfile(
      `ec2-profile-${this.environment}`,
      {
        path: '/service/',
        role: role.name,
      },
      { provider: this.provider }
    );

    const sg = new aws.ec2.SecurityGroup(
      `ec2-security-group-${this.environment}`,
      {
        name: `ec2-security-group-${this.environment}`,
        vpcId: this.vpc.id,
        description: `EC2 security group for ${this.environment}`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: { ...this.tags, Name: `ec2-security-group-${this.environment}` },
      },
      { provider: this.provider }
    );

    const ami = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          { name: 'name', values: ['al2023-ami-*-x86_64'] },
          { name: 'state', values: ['available'] },
        ],
      },
      { provider: this.provider }
    );

    const instance = new aws.ec2.Instance(
      `ec2-instance-${this.environment}`,
      {
        ami: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        subnetId: subnet.id,
        vpcSecurityGroupIds: [sg.id],
        iamInstanceProfile: instanceProfile.name,
        tags: { ...this.tags, Name: `ec2-instance-${this.environment}` },
      },
      { provider: this.provider }
    );

    new aws.cloudwatch.MetricAlarm(
      `ec2-cpu-alarm-${this.environment}`,
      {
        name: `ec2-cpu-alarm-${this.environment}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: { InstanceId: instance.id },
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${this.environment}`,
      {
        name: `rds-cpu-alarm-${this.environment}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors rds cpu utilization',
        dimensions: { DBInstanceIdentifier: `rds-${this.environment}` },
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.cloudwatch.MetricAlarm(
      `lambda-error-alarm-${this.environment}`,
      {
        name: `lambda-error-alarm-${this.environment}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'This metric monitors lambda errors',
        dimensions: { FunctionName: `lambda-${this.environment}` },
        tags: this.tags,
      },
      { provider: this.provider }
    );

    return instance;
  }

  private createSecretsManager(): aws.secretsmanager.Secret {
    const password = new random.RandomPassword(`password-${this.environment}`, {
      length: 16,
      special: true,
    });

    const secret = new aws.secretsmanager.Secret(
      `secret-${this.environment}`,
      {
        name: `secret-${this.environment}`,
        kmsKeyId: this.kmsKey.arn,
        tags: this.tags,
      },
      { provider: this.provider }
    );

    new aws.secretsmanager.SecretVersion(
      `secret-version-${this.environment}`,
      {
        secretId: secret.id,
        secretString: pulumi.jsonStringify({
          username: 'admin',
          password: password.result,
        }),
      },
      { provider: this.provider }
    );

    return secret;
  }

  private createTargetGroupAttachment(
    instance: aws.ec2.Instance,
    targetGroup: aws.lb.TargetGroup
  ): void {
    new aws.lb.TargetGroupAttachment(
      `tg-attachment-${this.environment}`,
      {
        targetGroupArn: targetGroup.arn,
        targetId: instance.id,
        port: 80,
      },
      { provider: this.provider }
    );
  }
}
