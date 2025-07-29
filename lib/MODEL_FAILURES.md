Insert here the model's failures

    listener.addRedirectResponse('HttpsRedirect', {
      statusCode: 'HTTP_301',
      protocol: 'HTTPS',
      port: '443',
    });