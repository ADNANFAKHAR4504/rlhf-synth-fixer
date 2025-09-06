environment = "dev"
owner       = "platform-team"
purpose     = "web-application"

account_ids = {
  dev  = "111111111111"
  test = "222222222222"
  prod = "333333333333"
}

ip_allowlist = ["203.0.113.0/24", "198.51.100.0/24"]

tags_common = {
  Project    = "tap-stack"
  CostCenter = "engineering"
}