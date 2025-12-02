import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { Construct } from 'constructs';

export interface KmsStackProps {
  environmentSuffix: string;
}

export class KmsStack extends Construct {
  public readonly key: KmsKey;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create KMS key for encryption
    this.key = new KmsKey(this, 'kms-key', {
      description: `Encryption key for student assessment data ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      tags: {
        Name: `assessment-kms-key-${environmentSuffix}`,
      },
    });

    // Create KMS alias
    new KmsAlias(this, 'kms-alias', {
      name: `alias/assessment-${environmentSuffix}`,
      targetKeyId: this.key.id,
    });
  }
}
