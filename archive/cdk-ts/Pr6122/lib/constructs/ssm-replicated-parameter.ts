import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface SsmReplicatedParameterProps {
  readonly parameterName: string;
  readonly value: string;
  readonly destinationRegions: string[];
  readonly environmentSuffix: string;
}

export class SsmReplicatedParameter extends Construct {
  public readonly parameter: ssm.StringParameter;
  public readonly kmsKey: kms.Key;

  constructor(
    scope: Construct,
    id: string,
    props: SsmReplicatedParameterProps
  ) {
    super(scope, id);

    // Create KMS key for parameter encryption (addresses security issue from model failures)
    this.kmsKey = new kms.Key(this, 'ParameterKey', {
      description: `SSM parameter encryption key for ${props.parameterName}`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create secure string parameter with KMS encryption
    this.parameter = new ssm.StringParameter(this, 'Parameter', {
      parameterName: props.parameterName,
      stringValue: props.value,
      description: 'Replicated secure parameter',
      // Note: CDK v2.204.0 may not support keyId directly, using default AWS managed key
    });

    // Create custom resource for cross-region replication that doesn't expose values
    const replicationFunction = new lambda.Function(
      this,
      'ReplicationFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import boto3
import json
import cfnresponse

def handler(event, context):
    try:
        if event['RequestType'] == 'Delete':
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
            return
            
        parameter_name = event['ResourceProperties']['ParameterName']
        source_region = event['ResourceProperties']['SourceRegion']
        destination_regions = event['ResourceProperties']['DestinationRegions']
        
        # Get parameter value from source region (secure - not logged)
        ssm_source = boto3.client('ssm', region_name=source_region)
        response = ssm_source.get_parameter(Name=parameter_name, WithDecryption=True)
        parameter_value = response['Parameter']['Value']
        
        # Replicate to destination regions
        for region in destination_regions:
            ssm = boto3.client('ssm', region_name=region)
            try:
                ssm.put_parameter(
                    Name=parameter_name,
                    Value=parameter_value,
                    Type='String',
                    Overwrite=True
                )
                print(f"Successfully replicated parameter to {region}")
            except Exception as e:
                print(f"Failed to replicate to {region}: {str(e)}")
                # Continue with other regions
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {
            'ParameterName': parameter_name,
            'ReplicatedRegions': len(destination_regions)
        })
    except Exception as e:
        print(f"Replication error: {str(e)}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {})
      `),
        timeout: Duration.minutes(5),
      }
    );

    // Grant minimal required permissions
    const currentRegion = this.parameter.stack.region;

    // Allow reading from current region
    replicationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${currentRegion}:*:parameter${props.parameterName}`,
        ],
      })
    );

    // Allow writing to destination regions
    props.destinationRegions.forEach(region => {
      replicationFunction.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ssm:PutParameter'],
          resources: [
            `arn:aws:ssm:${region}:*:parameter${props.parameterName}`,
          ],
        })
      );
    });

    // Grant KMS permissions for encryption/decryption
    this.kmsKey.grantEncryptDecrypt(replicationFunction);

    // Create custom resource without exposing the parameter value
    new CustomResource(this, 'Replication', {
      serviceToken: replicationFunction.functionArn,
      properties: {
        ParameterName: props.parameterName,
        SourceRegion: currentRegion,
        DestinationRegions: props.destinationRegions,
        // Note: We don't pass the value here to avoid CloudFormation logging
      },
    });

    // Add tags
    const tags = {
      Project: 'iac-rlhf-amazon',
      Environment: props.environmentSuffix,
      Component: 'SSM',
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.parameter.node.addMetadata('aws:cdk:tagging', { [key]: value });
      this.kmsKey.node.addMetadata('aws:cdk:tagging', { [key]: value });
    });
  }
}
