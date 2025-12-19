exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  const apiVersion = process.env.API_VERSION || '1.0.0';
  const ratePrecision = parseInt(process.env.RATE_PRECISION || '4', 10);

  try {
    const body = JSON.parse(event.body || '{}');
    const { fromCurrency, toCurrency, amount } = body;

    if (!fromCurrency || !toCurrency || !amount) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*.example.com'
        },
        body: JSON.stringify({
          error: 'Missing required parameters: fromCurrency, toCurrency, amount',
          apiVersion
        })
      };
    }

    const exchangeRates = {
      'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'INR': 74.5 },
      'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 129.5, 'INR': 87.8 },
      'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 150.7, 'INR': 102.1 }
    };

    if (!exchangeRates[fromCurrency] || !exchangeRates[fromCurrency][toCurrency]) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*.example.com'
        },
        body: JSON.stringify({
          error: `Unsupported currency pair: ${fromCurrency} to ${toCurrency}`,
          apiVersion
        })
      };
    }

    const rate = exchangeRates[fromCurrency][toCurrency];
    const convertedAmount = (amount * rate).toFixed(ratePrecision);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*.example.com'
      },
      body: JSON.stringify({
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount),
        rate,
        convertedAmount: parseFloat(convertedAmount),
        timestamp: new Date().toISOString(),
        apiVersion
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*.example.com'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        apiVersion
      })
    };
  }
};
