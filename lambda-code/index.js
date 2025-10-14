exports.handler = async (event) => {
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Patient record processed successfully',
      requestId: event.requestContext?.requestId,
    }),
  };
  return response;
};
