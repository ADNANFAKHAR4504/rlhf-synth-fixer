exports.handler = async (event) => {
  console.log('Transaction processor invoked:', JSON.stringify(event, null, 2));
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Transaction processed successfully',
      transactionId: `txn_${Date.now()}`,
      timestamp: new Date().toISOString()
    })
  };
};
