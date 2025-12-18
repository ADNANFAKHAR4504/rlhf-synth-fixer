**Flaw 1**
Warning error

[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.

**Flaw 2**

import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
// route53Targets Dependency was missing
=======================
Unused dependencies
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as appscaling from 'aws-cdk-lib/aws-applicationautoscaling';
=============================

**Flaw 3**

[Error at /DevStack] Found zones: [] for dns:example.com, privateZone:undefined, vpcId:undefined, but wanted exactly 1 zone
[Warning at /DevStack/devFargateService/Service] minHealthyPercent has not been configured so the default value of 50% is used. The number of running tasks will decrease below the desired count during deployments etc. See https://github.com/aws/aws-cdk/issues/31705 [ack: @aws-cdk/aws-ecs:minHealthyPercent]
[Error at /ProdStack] Found zones: [] for dns:example.com, privateZone:undefined, vpcId:undefined, but wanted exactly 1 zone
[Warning at /ProdStack/prodFargateService/Service] minHealthyPercent has not been configured so the default value of 50% is used. The number of running tasks will decrease below the desired count during deployments etc. See https://github.com/aws/aws-cdk/issues/31705 [ack: @aws-cdk/aws-ecs:minHealthyPercent]

**Flaw 4**

environment: { it is impossible to inject secret value using the environment attribute
    CONFIG_PARAMETER: ecs.Secret.fromSecretsManager(configSecret, 'environment') //secret.parameterName,
},

**Flaw 5**

constructor(scope: cdk.Construct, id: string, config: EnvironmentConfig, props?: cdk.StackProps) {
super(scope, id, props);

**Flaw 6**

[Error at /DevStack] Found zones: [] for dns:example.com, privateZone:undefined, vpcId:undefined, but wanted exactly 1 zone
[Error at /ProdStack] Found zones: [] for dns:example.com, privateZone:undefined, vpcId:undefined, but wanted exactly 1 zone

**Flaw 7**

[Warning at /DevStack/devFargateService/Service] minHealthyPercent has not been configured so the default value of 50% is used. The number of running tasks will decrease below the desired count during deployments etc. See https://github.com/aws/aws-cdk/issues/31705 [ack: @aws-cdk/aws-ecs:minHealthyPercent]
[Warning at /ProdStack/prodFargateService/Service] minHealthyPercent has not been configured so the default value of 50% is used. The number of running tasks will decrease below the desired count during deployments etc. See https://github.com/aws/aws-cdk/issues/31705 [ack: @aws-cdk/aws-ecs:minHealthyPercent]

**Flaw 8**

ssm.ParameterType.SECURE_STRING is deprecated

// Store environment-specific configurations in SSM Parameter Store
const ssmParameter = new ssm.StringParameter(this, `${config.envName}ConfigParameter`, {
    parameterName: `/${config.envName}/config`,
    stringValue: JSON.stringify({ environment: config.envName }),
    // encryptionKey: kmsKey,
    type: ssm.ParameterType.SECURE_STRING,
    simpleName: false,
});


**Flaw 9**

Since this app includes more than a single stack, specify which stacks to use (wildcards are supported) or specify `--all`
Stacks: DevStack · ProdStack

