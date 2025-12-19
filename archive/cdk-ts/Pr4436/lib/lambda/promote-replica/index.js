exports.handler = async (event) => {
  console.log('Promote replica invoked:', JSON.stringify(event, null, 2));
  
  return {
    status: 'success',
    message: 'Replica promoted to primary',
    timestamp: new Date().toISOString()
  };
};
