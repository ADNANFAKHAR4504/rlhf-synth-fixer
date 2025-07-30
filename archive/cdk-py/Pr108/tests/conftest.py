"""Pytest configuration file"""


def pytest_configure(config):
  """Configure pytest markers"""
  config.addinivalue_line(
      "markers", "aws_credentials: mark tests requiring valid AWS credentials"
  )
  config.addinivalue_line(
      "markers", "it: mark test with descriptive text"
  )
  config.addinivalue_line(
      "markers", "describe: mark test suite with descriptive text"
  )

# Add any other pytest configurations here
