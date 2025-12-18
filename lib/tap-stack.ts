import * as cdk from 'aws-cdk-lib';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ACMClient, ImportCertificateCommand } from '@aws-sdk/client-acm';
import {
  SSMClient,
  PutParameterCommand,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import { Construct } from 'constructs';

// Detect LocalStack environment
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.LOCALSTACK === 'true';

// Configure AWS SDK clients for LocalStack
const awsClientConfig = isLocalStack
  ? {
      endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    }
  : {
      region: process.env.AWS_REGION || 'us-east-1',
    };

// ? Import your stacks here
import { MultiEnvEcsStack, EnvironmentConfig } from './multienv-ecs-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

const DOMAIN = 'example.com';
const REGION = 'us-east-1';
const OUT_DIR = './certs';
const SSM_PARAM = '/app/certArn';

const KEY_FILE = path.join(OUT_DIR, `${DOMAIN}.key`);
const CSR_FILE = path.join(OUT_DIR, `${DOMAIN}.csr`);
const CRT_FILE = path.join(OUT_DIR, `${DOMAIN}.crt`);
if (require.main === module) {
  (async function generateSelfSignedCertAndStore(): Promise<void> {
    // Skip certificate generation for LocalStack (use HTTP instead)
    if (isLocalStack) {
      console.log(
        'ℹ️ LocalStack detected - skipping certificate generation (using HTTP)'
      );
      return;
    }

    const ssm = new SSMClient({ ...awsClientConfig, region: REGION });

    // Check if cert already exists in SSM
    try {
      const existing = await ssm.send(
        new GetParameterCommand({ Name: SSM_PARAM })
      );
      console.log(
        `ℹ️ Certificate already exists: ${existing.Parameter?.Value}`
      );
      return;
    } catch (err) {
      const e = err as Record<string, unknown>;
      if (e.name !== 'ParameterNotFound') {
        console.error('❌ Error checking SSM parameter:', err);
        throw err;
      }
      console.log('📎 No existing cert ARN, generating new one...');
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    console.log('🔧 Generating private key...');
    execSync(`openssl genrsa -out "${KEY_FILE}" 2048`);

    console.log('🔧 Creating CSR...');
    execSync(
      `openssl req -new -key "${KEY_FILE}" -out "${CSR_FILE}" -subj "/C=US/ST=Dev/L=Dev/O=Dev/OU=Dev/CN=${DOMAIN}"`
    );

    console.log('🔧 Creating self-signed certificate...');
    execSync(
      `openssl x509 -req -in "${CSR_FILE}" -signkey "${KEY_FILE}" -out "${CRT_FILE}" -days 365`
    );

    console.log('✅ Self-signed certificate generated in', OUT_DIR);

    const certificate = fs.readFileSync(CRT_FILE);
    const privateKey = fs.readFileSync(KEY_FILE);

    const acm = new ACMClient({ ...awsClientConfig, region: REGION });

    console.log('📤 Importing certificate to AWS ACM...');
    const importResp = await acm.send(
      new ImportCertificateCommand({
        Certificate: certificate,
        PrivateKey: privateKey,
      })
    );

    const certArn = importResp.CertificateArn;
    if (!certArn) {
      throw new Error('❌ Certificate ARN was not returned from ACM.');
    }

    console.log(`✅ Certificate imported. ARN: ${certArn}`);

    console.log(`📦 Storing ARN to SSM: ${SSM_PARAM}`);
    await ssm.send(
      new PutParameterCommand({
        Name: SSM_PARAM,
        Type: 'String',
        Value: certArn,
        Overwrite: true,
      })
    );

    console.log(`✅ ARN stored in SSM: ${SSM_PARAM}`);
  })();
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    const imageName = process.env.IMAGE_NAME || 'nginx';
    const imageTag = process.env.IMAGE_TAG || '1.25.3';
    const port = Number(process.env.PORT) || 80;
    const hostedZoneName = process.env.HOSTED_ZONE_NAME; // you should have this domain in route53
    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Define configurations for each environment
    let config: EnvironmentConfig;
    if (environmentSuffix === 'dev') {
      config = {
        hostedZoneName,
        imageName,
        imageTag,
        port,
        domainName: process.env.DOMAIN_NAME || 'api.dev.local',
        envName: 'dev',
        vpcCidr: '10.0.0.0/16',
        cpu: Number(process.env.CPU_VALUE) || 256,
        memoryLimit: Number(process.env.MEMORY_LIMIT) || 512,
      };
    } else {
      config = {
        hostedZoneName,
        imageName,
        imageTag,
        port,
        domainName: process.env.DOMAIN_NAME || `api.${environmentSuffix}.local`,
        envName: environmentSuffix,
        vpcCidr: '10.1.0.0/16',
        cpu: Number(process.env.CPU_VALUE) || 512,
        memoryLimit: Number(process.env.MEMORY_LIMIT) || 1024,
      };
    }

    // Deploy stacks for each environment
    function capitalize(str: string): string {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Create the environment-specific stack (dev/prod/etc.)
    new MultiEnvEcsStack(
      this,
      capitalize(`${environmentSuffix}Stack`),
      config,
      {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: process.env.CDK_DEFAULT_REGION,
        },
      }
    );

    // Add simple parent-level outputs to satisfy deploy script requirements
    // The outputs are defined in the nested MultiEnvEcsStack, but we add a summary here
    new cdk.CfnOutput(this, 'DeploymentStatus', {
      value: 'deployed',
      description: 'Deployment status indicator',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for this deployment',
    });

    new cdk.CfnOutput(this, 'Platform', {
      value: 'cdk',
      description: 'IaC platform',
    });
  }
}
