# sample-content.tf

# Sample index.html file for initial deployment
resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.website.id
  key          = "index.html"
  content_type = "text/html"

  content = <<-EOT
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donation Platform</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            margin-bottom: 1rem;
        }
        p {
            color: #666;
            margin-bottom: 2rem;
        }
        .donate-btn {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .donate-btn:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Our Donation Platform</h1>
        <p>Your generosity makes a difference. Help us support those in need.</p>
        <a href="#" class="donate-btn">Make a Donation</a>
    </div>
</body>
</html>
EOT

  tags = var.tags
}

# Sample 404 error page
resource "aws_s3_object" "error_404" {
  bucket       = aws_s3_bucket.website.id
  key          = "404.html"
  content_type = "text/html"

  content = <<-EOT
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
            margin: 0;
        }
        .error-container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 72px;
            color: #667eea;
            margin: 0;
        }
        h2 {
            color: #333;
            margin: 1rem 0;
        }
        p {
            color: #666;
            margin-bottom: 2rem;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist.</p>
        <a href="/">Return to Home</a>
    </div>
</body>
</html>
EOT

  tags = var.tags
}

# Sample 403 error page
resource "aws_s3_object" "error_403" {
  bucket       = aws_s3_bucket.website.id
  key          = "403.html"
  content_type = "text/html"

  content = <<-EOT
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Forbidden</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
            margin: 0;
        }
        .error-container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 72px;
            color: #e74c3c;
            margin: 0;
        }
        h2 {
            color: #333;
            margin: 1rem 0;
        }
        p {
            color: #666;
            margin-bottom: 2rem;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>403</h1>
        <h2>Access Forbidden</h2>
        <p>You don't have permission to access this resource.</p>
        <a href="/">Return to Home</a>
    </div>
</body>
</html>
EOT

  tags = var.tags
}