import * as aws from '@pulumi/aws';
import { commonTags, primaryRegion, secondaryRegion } from './config';

// Primary region KMS key
export const primaryKmsKey = new aws.kms.Key(
  'primary-kms-key',
  {
    description: 'KMS key for encryption in primary region',
    tags: {
      ...commonTags,
      Region: primaryRegion,
    },
  },
  { provider: new aws.Provider('primary-provider', { region: primaryRegion }) }
);

export const primaryKmsAlias = new aws.kms.Alias(
  'primary-kms-alias',
  {
    name: 'alias/primary-region-key',
    targetKeyId: primaryKmsKey.keyId,
  },
  { provider: new aws.Provider('primary-provider', { region: primaryRegion }) }
);

// Secondary region KMS key
export const secondaryKmsKey = new aws.kms.Key(
  'secondary-kms-key',
  {
    description: 'KMS key for encryption in secondary region',
    tags: {
      ...commonTags,
      Region: secondaryRegion,
    },
  },
  {
    provider: new aws.Provider('secondary-provider', {
      region: secondaryRegion,
    }),
  }
);

export const secondaryKmsAlias = new aws.kms.Alias(
  'secondary-kms-alias',
  {
    name: 'alias/secondary-region-key',
    targetKeyId: secondaryKmsKey.keyId,
  },
  {
    provider: new aws.Provider('secondary-provider', {
      region: secondaryRegion,
    }),
  }
);
