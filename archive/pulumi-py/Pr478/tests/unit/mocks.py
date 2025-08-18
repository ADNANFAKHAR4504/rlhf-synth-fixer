import pulumi

class MyMocks(pulumi.runtime.Mocks):
  def new_resource(self, type_, name, inputs, provider, id_):
    mock_outputs = inputs.copy()

    # Add common mocked outputs for known component resources
    mock_outputs.update({
      "vpc_id": "vpc-12345",
      "vpc_cidr": "10.0.0.0/16",
      "public_subnet_ids": ["subnet-abc", "subnet-def"],
      "private_subnet_ids": ["subnet-ghi", "subnet-jkl"],
      "alb_security_group_id": "sg-alb",
      "eb_security_group_id": "sg-eb",
      "application_name": "mock-eb-app",
      "environment_name": "mock-env",
      "environment_url": "http://mock-url",
      "environment_cname": "mock-cname",
      "dashboard_name": "mock-dashboard",
      "sns_topic_arn": "arn:aws:sns:mock",
      "arn": "arn:aws:iam::123456789012:role/mock-role",
      "name": "mock-profile-name"
    })

    return [f"{name}_id", mock_outputs]

  def call(self, args, provider):
    return {"result": "mocked-call-result"}
