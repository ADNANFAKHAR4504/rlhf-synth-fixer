import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import * as aws from '@cdktf/provider-aws';

export interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps = {}) {
    super(scope, id);

    const awsRegion = props.awsRegion ?? 'us-east-1';
    new aws.provider.AwsProvider(this, 'AWS', { region: awsRegion });

    new TerraformOutput(this, 'ExampleOutput', {
      value: `Stack ${id} in ${awsRegion}`,
    });
  }
}
