import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ACMClient, ImportCertificateCommand } from '@aws-sdk/client-acm';
import {
  SSMClient,
  PutParameterCommand,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';

const DOMAIN = 'example.com';
const REGION = 'us-east-1';
const OUT_DIR = './certs';
const SSM_PARAM = '/app/certArn';

const KEY_FILE = path.join(OUT_DIR, `${DOMAIN}.key`);
const CSR_FILE = path.join(OUT_DIR, `${DOMAIN}.csr`);
const CRT_FILE = path.join(OUT_DIR, `${DOMAIN}.crt`);

export async function generateSelfSignedCertAndStore(): Promise<void> {
  const ssm = new SSMClient({ region: REGION });

  // Check if cert already exists in SSM
  try {
    const existing = await ssm.send(
      new GetParameterCommand({ Name: SSM_PARAM })
    );
    console.log(`ℹ️ Certificate already exists: ${existing.Parameter?.Value}`);
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

  const acm = new ACMClient({ region: REGION });

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
}
