import { Handler } from 'aws-lambda';

interface Transaction {
  transactionId?: string;
  customerId?: string;
}

interface EvidenceArchiverInput {
  investigationId: string;
  transaction: Transaction;
  summary: string;
  riskScore: number;
  athenaResults: Record<string, unknown>;
  neptuneResults: Record<string, unknown>;
}

export const handler: Handler = async (event: EvidenceArchiverInput) => {
  console.log('Evidence Archiver Lambda invoked');

  try {
    const endpoint = process.env.OPENSEARCH_ENDPOINT!;
    const collection = process.env.OPENSEARCH_COLLECTION!;

    // Prepare evidence package
    const evidencePackage = {
      investigationId: event.investigationId,
      transaction: event.transaction,
      summary: event.summary,
      riskScore: event.riskScore,
      athenaResults: event.athenaResults,
      neptuneResults: event.neptuneResults,
      archivedAt: new Date().toISOString(),
    };

    console.log(
      'Archiving evidence to OpenSearch:',
      JSON.stringify(evidencePackage, null, 2)
    );

    // In production, this would use AWS SDK to write to OpenSearch Serverless
    // For now, we'll simulate the archiving
    const result = {
      status: 'archived',
      investigationId: event.investigationId,
      endpoint: endpoint,
      collection: collection,
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Evidence archived successfully',
        result,
      }),
    };
  } catch (error) {
    console.error('Error archiving evidence:', error);
    throw error;
  }
};
