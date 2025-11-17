exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Payment processing function',
      timestamp: new Date().toISOString()
    })
  };
};
