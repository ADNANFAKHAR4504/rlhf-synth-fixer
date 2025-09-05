package terraform.validation

# Ensure EC2 instances are t2.micro only
deny[msg] {
    input.resource.aws_instance[name].instance_type != "t2.micro"
    msg := sprintf("EC2 instance %v must use t2.micro instance type", [name])
}

# Ensure EBS volumes are encrypted
deny[msg] {
    instance := input.resource.aws_instance[name]
    block_device := instance.root_block_device[_]
    block_device.encrypted != true
    msg := sprintf("EBS volume for instance %v must be encrypted", [name])
}

# Ensure public security groups only allow ports 22 and 80
deny[msg] {
    sg := input.resource.aws_security_group[name]
    contains(name, "public")
    ingress := sg.ingress[_]
    not ingress.from_port in [22, 80]
    msg := sprintf("Public security group %v can only have ports 22 and 80 open", [name])
}

# Ensure SNS subscriptions use HTTPS
deny[msg] {
    sub := input.resource.aws_sns_topic_subscription[name]
    sub.protocol != "https"
    msg := sprintf("SNS subscription %v must use HTTPS protocol", [name])
}

# Ensure MFA policy exists
deny[msg] {
    count([x | input.resource.aws_iam_policy[x]; contains(x, "mfa")]) == 0
    msg := "MFA policy must be defined"
}

# Ensure Lambda function exists for shutdown
deny[msg] {
    count([x | input.resource.aws_lambda_function[x]; contains(x, "shutdown")]) == 0
    msg := "Lambda shutdown function must be defined"
}

# Ensure EventBridge schedule exists
deny[msg] {
    count([x | input.resource.aws_cloudwatch_event_rule[x]; contains(x, "shutdown")]) == 0
    msg := "EventBridge schedule for Lambda shutdown must be defined"
}

# Ensure all resources have Project tag
deny[msg] {
    resource := input.resource[resource_type][name]
    resource_type != "random_id"
    resource_type != "local_file"
    resource_type != "data"
    not resource.tags.Project
    msg := sprintf("Resource %v of type %v must have Project tag", [name, resource_type])
}