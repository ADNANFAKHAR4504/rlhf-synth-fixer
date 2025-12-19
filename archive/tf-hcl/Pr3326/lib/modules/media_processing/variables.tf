variable "source_bucket_arn" {
  description = "ARN of the source S3 bucket"
  type        = string
  default     = ""
}

variable "source_bucket_id" {
  description = "ID of the source S3 bucket"
  type        = string
  default     = ""
}

variable "destination_bucket_arn" {
  description = "ARN of the destination S3 bucket"
  type        = string
  default     = ""
}

variable "destination_bucket" {
  description = "Name of the destination S3 bucket"
  type        = string
  default     = ""
}

variable "mediaconvert_endpoint" {
  description = "MediaConvert endpoint URL"
  type        = string
  default     = ""
}
