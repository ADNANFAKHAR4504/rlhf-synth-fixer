import * as cdk from 'aws-cdk-lib';
import { IamStack } from '../lib/stacks/iam-stack';
import { KmsStack } from '../lib/stacks/kms-stack';
import { MfaEnforcementScpStack } from '../lib/stacks/mfa-scp-stack';
import { RdsStack } from '../lib/stacks/rds-stack';
import { S3Stack } from '../lib/stacks/s3-stack';
import { VpcStack } from '../lib/stacks/vpc-stack';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('TAP Integration', () => {
    const dept = 'eng';
    const envName = 'int';
    const purpose = 'integration';
    const orgTargetId = 'ou-9999';
    const regions = ['us-east-1', 'us-west-2'];

    regions.forEach(region => {
      it(`provisions KmsStack in ${region}`, () => {
        const app = new cdk.App();
        const stack = new KmsStack(
          app,
          `${dept}-${envName}-${purpose}-kms-${region}`,
          {
            env: { account: '123456789012', region },
            dept,
            envName,
            purpose,
          }
        );
        expect(stack).toBeDefined();
        expect(stack.key).toBeDefined();
      });

      it(`provisions S3Stack in ${region}`, () => {
        const app = new cdk.App();
        const stack = new S3Stack(
          app,
          `${dept}-${envName}-${purpose}-s3-${region}`,
          {
            env: { account: '123456789012', region },
            dept,
            envName,
            purpose,
          }
        );
        expect(stack).toBeDefined();
        expect(stack.bucket).toBeDefined();
      });

      it(`provisions VpcStack in ${region}`, () => {
        const app = new cdk.App();
        const stack = new VpcStack(
          app,
          `${dept}-${envName}-${purpose}-vpc-${region}`,
          {
            env: { account: '123456789012', region },
            dept,
            envName,
            purpose,
          }
        );
        expect(stack).toBeDefined();
        expect(stack.vpc).toBeDefined();
      });

      it(`provisions RdsStack in ${region}`, () => {
        const app = new cdk.App();
        const vpc = new VpcStack(
          app,
          `${dept}-${envName}-${purpose}-vpc-${region}`,
          {
            env: { account: '123456789012', region },
            dept,
            envName,
            purpose,
          }
        );
        const stack = new RdsStack(
          app,
          `${dept}-${envName}-${purpose}-rds-${region}`,
          {
            env: { account: '123456789012', region },
            dept,
            envName,
            purpose,
            vpc: vpc.vpc,
          }
        );
        expect(stack).toBeDefined();
        expect(stack.instance).toBeDefined();
      });

      it(`provisions IamStack in ${region}`, () => {
        const app = new cdk.App();
        const stack = new IamStack(
          app,
          `${dept}-${envName}-${purpose}-iam-${region}`,
          {
            env: { account: '123456789012', region },
            dept,
            envName,
            purpose,
          }
        );
        expect(stack).toBeDefined();
        expect(stack.roleDev).toBeDefined();
        expect(stack.roleProd).toBeDefined();
      });
    });

    it('provisions MfaEnforcementScpStack if enabled', () => {
      const app = new cdk.App();
      const stack = new MfaEnforcementScpStack(
        app,
        `${dept}-${envName}-${purpose}-mfa-scp`,
        {
          env: { account: '123456789012', region: 'us-east-1' },
          dept,
          envName,
          purpose,
          orgTargetId,
        }
      );
      expect(stack).toBeDefined();
    });
  });
});
