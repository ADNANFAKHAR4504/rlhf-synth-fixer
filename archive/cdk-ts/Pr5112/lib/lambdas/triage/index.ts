import { KinesisStreamEvent, KinesisStreamRecord, Context } from 'aws-lambda';

// Note: In production, these clients would be properly initialized with the actual SDKs
// For build purposes, we're using simplified mock implementations

interface Transaction {
  transactionId: string;
  customerId: string;
  amount: number;
  currency: string;
  type: string;
  destinationCountry?: string;
  timestamp: string;
}

interface BatchItemFailure {
  itemIdentifier: string;
}

interface HandlerResponse {
  batchItemFailures: BatchItemFailure[];
}

export const handler = async (
  event: KinesisStreamEvent,
  _context: Context
): Promise<HandlerResponse> => {
  const startTime = Date.now();
  console.log('Triage Lambda invoked with', event.Records.length, 'records');

  const batchItemFailures: BatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error('Error processing record:', error);
      batchItemFailures.push({ itemIdentifier: record.kinesis.sequenceNumber });
    }
  }

  // Ensure we complete within 200ms
  const processingTime = Date.now() - startTime;
  console.log(`Batch processing completed in ${processingTime}ms`);

  return {
    batchItemFailures,
  };
};

async function processRecord(record: KinesisStreamRecord): Promise<void> {
  const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
  const transaction: Transaction = JSON.parse(payload);

  // Parallel execution of all three checks
  const [velocityCheck, permissionsCheck, mlScore] = await Promise.all([
    checkVelocityFraud(transaction),
    checkRiskProfile(transaction),
    getMLScore(transaction),
  ]);

  const riskScore = calculateRiskScore(
    velocityCheck,
    permissionsCheck,
    mlScore
  );

  if (riskScore >= 70) {
    // High risk threshold
    await triggerInvestigation(transaction, {
      velocityCheck,
      permissionsCheck,
      mlScore,
      riskScore,
    });
  }
}

// Exported for testing purposes
export async function checkVelocityFraud(
  transaction: Transaction
): Promise<boolean> {
  console.log('Checking velocity fraud for customer:', transaction.customerId);
  // In production, this would query Redis for velocity checks
  // For now, return false (no fraud detected)
  return false;
}

export interface RiskProfile {
  allowed: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Exported for testing purposes
export async function checkRiskProfile(
  transaction: Transaction
): Promise<RiskProfile> {
  console.log('Checking risk profile for customer:', transaction.customerId);
  // In production, this would query DynamoDB and Verified Permissions
  return {
    allowed: true,
    riskLevel: 'LOW',
  };
}

// Exported for testing purposes
export async function getMLScore(transaction: Transaction): Promise<number> {
  console.log('Getting ML score for transaction:', transaction.transactionId);
  // In production, this would call SageMaker endpoint
  // For now, return a mock score
  return 25; // Low risk score
}

// Exported for testing purposes
export function calculateRiskScore(
  velocityFraud: boolean,
  permissionsCheck: RiskProfile,
  mlScore: number
): number {
  let score = mlScore;

  if (velocityFraud) score += 20;
  if (!permissionsCheck.allowed) score += 15;
  if (permissionsCheck.riskLevel === 'HIGH') score += 15;
  if (permissionsCheck.riskLevel === 'MEDIUM') score += 10;

  return Math.min(100, score);
}

interface RiskAnalysis {
  velocityCheck: boolean;
  permissionsCheck: RiskProfile;
  mlScore: number;
  riskScore: number;
}

async function triggerInvestigation(
  transaction: Transaction,
  analysis: RiskAnalysis
): Promise<void> {
  console.log(
    'Triggering investigation for transaction:',
    transaction.transactionId
  );
  console.log('Risk analysis:', analysis);
  // In production, this would trigger Step Functions workflow
}
