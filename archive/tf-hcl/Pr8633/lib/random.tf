# Generate random external ID for cross-account assume role
resource "random_string" "external_id" {
  length  = 32
  special = false
}
