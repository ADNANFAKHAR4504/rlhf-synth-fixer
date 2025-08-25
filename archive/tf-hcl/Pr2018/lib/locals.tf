# Reusable random suffix for uniqueness
resource "random_id" "deployment" {
  byte_length = 4
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}