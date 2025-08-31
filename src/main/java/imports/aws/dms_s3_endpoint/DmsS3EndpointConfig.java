package imports.aws.dms_s3_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.020Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsS3Endpoint.DmsS3EndpointConfig")
@software.amazon.jsii.Jsii.Proxy(DmsS3EndpointConfig.Jsii$Proxy.class)
public interface DmsS3EndpointConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#bucket_name DmsS3Endpoint#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#endpoint_id DmsS3Endpoint#endpoint_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpointId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#endpoint_type DmsS3Endpoint#endpoint_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpointType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#service_access_role_arn DmsS3Endpoint#service_access_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceAccessRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_column_name DmsS3Endpoint#add_column_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAddColumnName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_trailing_padding_character DmsS3Endpoint#add_trailing_padding_character}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAddTrailingPaddingCharacter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#bucket_folder DmsS3Endpoint#bucket_folder}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketFolder() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#canned_acl_for_objects DmsS3Endpoint#canned_acl_for_objects}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCannedAclForObjects() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_and_updates DmsS3Endpoint#cdc_inserts_and_updates}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCdcInsertsAndUpdates() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_only DmsS3Endpoint#cdc_inserts_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCdcInsertsOnly() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_max_batch_interval DmsS3Endpoint#cdc_max_batch_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCdcMaxBatchInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_min_file_size DmsS3Endpoint#cdc_min_file_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCdcMinFileSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_path DmsS3Endpoint#cdc_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCdcPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#certificate_arn DmsS3Endpoint#certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#compression_type DmsS3Endpoint#compression_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCompressionType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_delimiter DmsS3Endpoint#csv_delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCsvDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_no_sup_value DmsS3Endpoint#csv_no_sup_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCsvNoSupValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_null_value DmsS3Endpoint#csv_null_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCsvNullValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_row_delimiter DmsS3Endpoint#csv_row_delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCsvRowDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#data_format DmsS3Endpoint#data_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#data_page_size DmsS3Endpoint#data_page_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDataPageSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_delimiter DmsS3Endpoint#date_partition_delimiter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatePartitionDelimiter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_enabled DmsS3Endpoint#date_partition_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDatePartitionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_sequence DmsS3Endpoint#date_partition_sequence}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatePartitionSequence() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_timezone DmsS3Endpoint#date_partition_timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatePartitionTimezone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#detach_target_on_lob_lookup_failure_parquet DmsS3Endpoint#detach_target_on_lob_lookup_failure_parquet}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDetachTargetOnLobLookupFailureParquet() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#dict_page_size_limit DmsS3Endpoint#dict_page_size_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDictPageSizeLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#enable_statistics DmsS3Endpoint#enable_statistics}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableStatistics() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#encoding_type DmsS3Endpoint#encoding_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncodingType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#encryption_mode DmsS3Endpoint#encryption_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#expected_bucket_owner DmsS3Endpoint#expected_bucket_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpectedBucketOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#external_table_definition DmsS3Endpoint#external_table_definition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExternalTableDefinition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#glue_catalog_generation DmsS3Endpoint#glue_catalog_generation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGlueCatalogGeneration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#id DmsS3Endpoint#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#ignore_header_rows DmsS3Endpoint#ignore_header_rows}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIgnoreHeaderRows() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#include_op_for_full_load DmsS3Endpoint#include_op_for_full_load}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeOpForFullLoad() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#kms_key_arn DmsS3Endpoint#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#max_file_size DmsS3Endpoint#max_file_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxFileSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_timestamp_in_millisecond DmsS3Endpoint#parquet_timestamp_in_millisecond}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParquetTimestampInMillisecond() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_version DmsS3Endpoint#parquet_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParquetVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#preserve_transactions DmsS3Endpoint#preserve_transactions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPreserveTransactions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#rfc_4180 DmsS3Endpoint#rfc_4180}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRfc4180() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#row_group_length DmsS3Endpoint#row_group_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRowGroupLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#server_side_encryption_kms_key_id DmsS3Endpoint#server_side_encryption_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerSideEncryptionKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#ssl_mode DmsS3Endpoint#ssl_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSslMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#tags DmsS3Endpoint#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#tags_all DmsS3Endpoint#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#timeouts DmsS3Endpoint#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_s3_endpoint.DmsS3EndpointTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#timestamp_column_name DmsS3Endpoint#timestamp_column_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimestampColumnName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_csv_no_sup_value DmsS3Endpoint#use_csv_no_sup_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseCsvNoSupValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_task_start_time_for_full_load_timestamp DmsS3Endpoint#use_task_start_time_for_full_load_timestamp}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseTaskStartTimeForFullLoadTimestamp() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsS3EndpointConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsS3EndpointConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsS3EndpointConfig> {
        java.lang.String bucketName;
        java.lang.String endpointId;
        java.lang.String endpointType;
        java.lang.String serviceAccessRoleArn;
        java.lang.Object addColumnName;
        java.lang.Object addTrailingPaddingCharacter;
        java.lang.String bucketFolder;
        java.lang.String cannedAclForObjects;
        java.lang.Object cdcInsertsAndUpdates;
        java.lang.Object cdcInsertsOnly;
        java.lang.Number cdcMaxBatchInterval;
        java.lang.Number cdcMinFileSize;
        java.lang.String cdcPath;
        java.lang.String certificateArn;
        java.lang.String compressionType;
        java.lang.String csvDelimiter;
        java.lang.String csvNoSupValue;
        java.lang.String csvNullValue;
        java.lang.String csvRowDelimiter;
        java.lang.String dataFormat;
        java.lang.Number dataPageSize;
        java.lang.String datePartitionDelimiter;
        java.lang.Object datePartitionEnabled;
        java.lang.String datePartitionSequence;
        java.lang.String datePartitionTimezone;
        java.lang.Object detachTargetOnLobLookupFailureParquet;
        java.lang.Number dictPageSizeLimit;
        java.lang.Object enableStatistics;
        java.lang.String encodingType;
        java.lang.String encryptionMode;
        java.lang.String expectedBucketOwner;
        java.lang.String externalTableDefinition;
        java.lang.Object glueCatalogGeneration;
        java.lang.String id;
        java.lang.Number ignoreHeaderRows;
        java.lang.Object includeOpForFullLoad;
        java.lang.String kmsKeyArn;
        java.lang.Number maxFileSize;
        java.lang.Object parquetTimestampInMillisecond;
        java.lang.String parquetVersion;
        java.lang.Object preserveTransactions;
        java.lang.Object rfc4180;
        java.lang.Number rowGroupLength;
        java.lang.String serverSideEncryptionKmsKeyId;
        java.lang.String sslMode;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.dms_s3_endpoint.DmsS3EndpointTimeouts timeouts;
        java.lang.String timestampColumnName;
        java.lang.Object useCsvNoSupValue;
        java.lang.Object useTaskStartTimeForFullLoadTimestamp;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#bucket_name DmsS3Endpoint#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getEndpointId}
         * @param endpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#endpoint_id DmsS3Endpoint#endpoint_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpointId(java.lang.String endpointId) {
            this.endpointId = endpointId;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getEndpointType}
         * @param endpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#endpoint_type DmsS3Endpoint#endpoint_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpointType(java.lang.String endpointType) {
            this.endpointType = endpointType;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getServiceAccessRoleArn}
         * @param serviceAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#service_access_role_arn DmsS3Endpoint#service_access_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceAccessRoleArn(java.lang.String serviceAccessRoleArn) {
            this.serviceAccessRoleArn = serviceAccessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getAddColumnName}
         * @param addColumnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_column_name DmsS3Endpoint#add_column_name}.
         * @return {@code this}
         */
        public Builder addColumnName(java.lang.Boolean addColumnName) {
            this.addColumnName = addColumnName;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getAddColumnName}
         * @param addColumnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_column_name DmsS3Endpoint#add_column_name}.
         * @return {@code this}
         */
        public Builder addColumnName(com.hashicorp.cdktf.IResolvable addColumnName) {
            this.addColumnName = addColumnName;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getAddTrailingPaddingCharacter}
         * @param addTrailingPaddingCharacter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_trailing_padding_character DmsS3Endpoint#add_trailing_padding_character}.
         * @return {@code this}
         */
        public Builder addTrailingPaddingCharacter(java.lang.Boolean addTrailingPaddingCharacter) {
            this.addTrailingPaddingCharacter = addTrailingPaddingCharacter;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getAddTrailingPaddingCharacter}
         * @param addTrailingPaddingCharacter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_trailing_padding_character DmsS3Endpoint#add_trailing_padding_character}.
         * @return {@code this}
         */
        public Builder addTrailingPaddingCharacter(com.hashicorp.cdktf.IResolvable addTrailingPaddingCharacter) {
            this.addTrailingPaddingCharacter = addTrailingPaddingCharacter;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getBucketFolder}
         * @param bucketFolder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#bucket_folder DmsS3Endpoint#bucket_folder}.
         * @return {@code this}
         */
        public Builder bucketFolder(java.lang.String bucketFolder) {
            this.bucketFolder = bucketFolder;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCannedAclForObjects}
         * @param cannedAclForObjects Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#canned_acl_for_objects DmsS3Endpoint#canned_acl_for_objects}.
         * @return {@code this}
         */
        public Builder cannedAclForObjects(java.lang.String cannedAclForObjects) {
            this.cannedAclForObjects = cannedAclForObjects;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCdcInsertsAndUpdates}
         * @param cdcInsertsAndUpdates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_and_updates DmsS3Endpoint#cdc_inserts_and_updates}.
         * @return {@code this}
         */
        public Builder cdcInsertsAndUpdates(java.lang.Boolean cdcInsertsAndUpdates) {
            this.cdcInsertsAndUpdates = cdcInsertsAndUpdates;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCdcInsertsAndUpdates}
         * @param cdcInsertsAndUpdates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_and_updates DmsS3Endpoint#cdc_inserts_and_updates}.
         * @return {@code this}
         */
        public Builder cdcInsertsAndUpdates(com.hashicorp.cdktf.IResolvable cdcInsertsAndUpdates) {
            this.cdcInsertsAndUpdates = cdcInsertsAndUpdates;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCdcInsertsOnly}
         * @param cdcInsertsOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_only DmsS3Endpoint#cdc_inserts_only}.
         * @return {@code this}
         */
        public Builder cdcInsertsOnly(java.lang.Boolean cdcInsertsOnly) {
            this.cdcInsertsOnly = cdcInsertsOnly;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCdcInsertsOnly}
         * @param cdcInsertsOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_only DmsS3Endpoint#cdc_inserts_only}.
         * @return {@code this}
         */
        public Builder cdcInsertsOnly(com.hashicorp.cdktf.IResolvable cdcInsertsOnly) {
            this.cdcInsertsOnly = cdcInsertsOnly;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCdcMaxBatchInterval}
         * @param cdcMaxBatchInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_max_batch_interval DmsS3Endpoint#cdc_max_batch_interval}.
         * @return {@code this}
         */
        public Builder cdcMaxBatchInterval(java.lang.Number cdcMaxBatchInterval) {
            this.cdcMaxBatchInterval = cdcMaxBatchInterval;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCdcMinFileSize}
         * @param cdcMinFileSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_min_file_size DmsS3Endpoint#cdc_min_file_size}.
         * @return {@code this}
         */
        public Builder cdcMinFileSize(java.lang.Number cdcMinFileSize) {
            this.cdcMinFileSize = cdcMinFileSize;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCdcPath}
         * @param cdcPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_path DmsS3Endpoint#cdc_path}.
         * @return {@code this}
         */
        public Builder cdcPath(java.lang.String cdcPath) {
            this.cdcPath = cdcPath;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCertificateArn}
         * @param certificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#certificate_arn DmsS3Endpoint#certificate_arn}.
         * @return {@code this}
         */
        public Builder certificateArn(java.lang.String certificateArn) {
            this.certificateArn = certificateArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCompressionType}
         * @param compressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#compression_type DmsS3Endpoint#compression_type}.
         * @return {@code this}
         */
        public Builder compressionType(java.lang.String compressionType) {
            this.compressionType = compressionType;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCsvDelimiter}
         * @param csvDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_delimiter DmsS3Endpoint#csv_delimiter}.
         * @return {@code this}
         */
        public Builder csvDelimiter(java.lang.String csvDelimiter) {
            this.csvDelimiter = csvDelimiter;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCsvNoSupValue}
         * @param csvNoSupValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_no_sup_value DmsS3Endpoint#csv_no_sup_value}.
         * @return {@code this}
         */
        public Builder csvNoSupValue(java.lang.String csvNoSupValue) {
            this.csvNoSupValue = csvNoSupValue;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCsvNullValue}
         * @param csvNullValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_null_value DmsS3Endpoint#csv_null_value}.
         * @return {@code this}
         */
        public Builder csvNullValue(java.lang.String csvNullValue) {
            this.csvNullValue = csvNullValue;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCsvRowDelimiter}
         * @param csvRowDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_row_delimiter DmsS3Endpoint#csv_row_delimiter}.
         * @return {@code this}
         */
        public Builder csvRowDelimiter(java.lang.String csvRowDelimiter) {
            this.csvRowDelimiter = csvRowDelimiter;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDataFormat}
         * @param dataFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#data_format DmsS3Endpoint#data_format}.
         * @return {@code this}
         */
        public Builder dataFormat(java.lang.String dataFormat) {
            this.dataFormat = dataFormat;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDataPageSize}
         * @param dataPageSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#data_page_size DmsS3Endpoint#data_page_size}.
         * @return {@code this}
         */
        public Builder dataPageSize(java.lang.Number dataPageSize) {
            this.dataPageSize = dataPageSize;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDatePartitionDelimiter}
         * @param datePartitionDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_delimiter DmsS3Endpoint#date_partition_delimiter}.
         * @return {@code this}
         */
        public Builder datePartitionDelimiter(java.lang.String datePartitionDelimiter) {
            this.datePartitionDelimiter = datePartitionDelimiter;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDatePartitionEnabled}
         * @param datePartitionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_enabled DmsS3Endpoint#date_partition_enabled}.
         * @return {@code this}
         */
        public Builder datePartitionEnabled(java.lang.Boolean datePartitionEnabled) {
            this.datePartitionEnabled = datePartitionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDatePartitionEnabled}
         * @param datePartitionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_enabled DmsS3Endpoint#date_partition_enabled}.
         * @return {@code this}
         */
        public Builder datePartitionEnabled(com.hashicorp.cdktf.IResolvable datePartitionEnabled) {
            this.datePartitionEnabled = datePartitionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDatePartitionSequence}
         * @param datePartitionSequence Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_sequence DmsS3Endpoint#date_partition_sequence}.
         * @return {@code this}
         */
        public Builder datePartitionSequence(java.lang.String datePartitionSequence) {
            this.datePartitionSequence = datePartitionSequence;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDatePartitionTimezone}
         * @param datePartitionTimezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_timezone DmsS3Endpoint#date_partition_timezone}.
         * @return {@code this}
         */
        public Builder datePartitionTimezone(java.lang.String datePartitionTimezone) {
            this.datePartitionTimezone = datePartitionTimezone;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDetachTargetOnLobLookupFailureParquet}
         * @param detachTargetOnLobLookupFailureParquet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#detach_target_on_lob_lookup_failure_parquet DmsS3Endpoint#detach_target_on_lob_lookup_failure_parquet}.
         * @return {@code this}
         */
        public Builder detachTargetOnLobLookupFailureParquet(java.lang.Boolean detachTargetOnLobLookupFailureParquet) {
            this.detachTargetOnLobLookupFailureParquet = detachTargetOnLobLookupFailureParquet;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDetachTargetOnLobLookupFailureParquet}
         * @param detachTargetOnLobLookupFailureParquet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#detach_target_on_lob_lookup_failure_parquet DmsS3Endpoint#detach_target_on_lob_lookup_failure_parquet}.
         * @return {@code this}
         */
        public Builder detachTargetOnLobLookupFailureParquet(com.hashicorp.cdktf.IResolvable detachTargetOnLobLookupFailureParquet) {
            this.detachTargetOnLobLookupFailureParquet = detachTargetOnLobLookupFailureParquet;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDictPageSizeLimit}
         * @param dictPageSizeLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#dict_page_size_limit DmsS3Endpoint#dict_page_size_limit}.
         * @return {@code this}
         */
        public Builder dictPageSizeLimit(java.lang.Number dictPageSizeLimit) {
            this.dictPageSizeLimit = dictPageSizeLimit;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getEnableStatistics}
         * @param enableStatistics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#enable_statistics DmsS3Endpoint#enable_statistics}.
         * @return {@code this}
         */
        public Builder enableStatistics(java.lang.Boolean enableStatistics) {
            this.enableStatistics = enableStatistics;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getEnableStatistics}
         * @param enableStatistics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#enable_statistics DmsS3Endpoint#enable_statistics}.
         * @return {@code this}
         */
        public Builder enableStatistics(com.hashicorp.cdktf.IResolvable enableStatistics) {
            this.enableStatistics = enableStatistics;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getEncodingType}
         * @param encodingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#encoding_type DmsS3Endpoint#encoding_type}.
         * @return {@code this}
         */
        public Builder encodingType(java.lang.String encodingType) {
            this.encodingType = encodingType;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getEncryptionMode}
         * @param encryptionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#encryption_mode DmsS3Endpoint#encryption_mode}.
         * @return {@code this}
         */
        public Builder encryptionMode(java.lang.String encryptionMode) {
            this.encryptionMode = encryptionMode;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getExpectedBucketOwner}
         * @param expectedBucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#expected_bucket_owner DmsS3Endpoint#expected_bucket_owner}.
         * @return {@code this}
         */
        public Builder expectedBucketOwner(java.lang.String expectedBucketOwner) {
            this.expectedBucketOwner = expectedBucketOwner;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getExternalTableDefinition}
         * @param externalTableDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#external_table_definition DmsS3Endpoint#external_table_definition}.
         * @return {@code this}
         */
        public Builder externalTableDefinition(java.lang.String externalTableDefinition) {
            this.externalTableDefinition = externalTableDefinition;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getGlueCatalogGeneration}
         * @param glueCatalogGeneration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#glue_catalog_generation DmsS3Endpoint#glue_catalog_generation}.
         * @return {@code this}
         */
        public Builder glueCatalogGeneration(java.lang.Boolean glueCatalogGeneration) {
            this.glueCatalogGeneration = glueCatalogGeneration;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getGlueCatalogGeneration}
         * @param glueCatalogGeneration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#glue_catalog_generation DmsS3Endpoint#glue_catalog_generation}.
         * @return {@code this}
         */
        public Builder glueCatalogGeneration(com.hashicorp.cdktf.IResolvable glueCatalogGeneration) {
            this.glueCatalogGeneration = glueCatalogGeneration;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#id DmsS3Endpoint#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getIgnoreHeaderRows}
         * @param ignoreHeaderRows Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#ignore_header_rows DmsS3Endpoint#ignore_header_rows}.
         * @return {@code this}
         */
        public Builder ignoreHeaderRows(java.lang.Number ignoreHeaderRows) {
            this.ignoreHeaderRows = ignoreHeaderRows;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getIncludeOpForFullLoad}
         * @param includeOpForFullLoad Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#include_op_for_full_load DmsS3Endpoint#include_op_for_full_load}.
         * @return {@code this}
         */
        public Builder includeOpForFullLoad(java.lang.Boolean includeOpForFullLoad) {
            this.includeOpForFullLoad = includeOpForFullLoad;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getIncludeOpForFullLoad}
         * @param includeOpForFullLoad Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#include_op_for_full_load DmsS3Endpoint#include_op_for_full_load}.
         * @return {@code this}
         */
        public Builder includeOpForFullLoad(com.hashicorp.cdktf.IResolvable includeOpForFullLoad) {
            this.includeOpForFullLoad = includeOpForFullLoad;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#kms_key_arn DmsS3Endpoint#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getMaxFileSize}
         * @param maxFileSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#max_file_size DmsS3Endpoint#max_file_size}.
         * @return {@code this}
         */
        public Builder maxFileSize(java.lang.Number maxFileSize) {
            this.maxFileSize = maxFileSize;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getParquetTimestampInMillisecond}
         * @param parquetTimestampInMillisecond Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_timestamp_in_millisecond DmsS3Endpoint#parquet_timestamp_in_millisecond}.
         * @return {@code this}
         */
        public Builder parquetTimestampInMillisecond(java.lang.Boolean parquetTimestampInMillisecond) {
            this.parquetTimestampInMillisecond = parquetTimestampInMillisecond;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getParquetTimestampInMillisecond}
         * @param parquetTimestampInMillisecond Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_timestamp_in_millisecond DmsS3Endpoint#parquet_timestamp_in_millisecond}.
         * @return {@code this}
         */
        public Builder parquetTimestampInMillisecond(com.hashicorp.cdktf.IResolvable parquetTimestampInMillisecond) {
            this.parquetTimestampInMillisecond = parquetTimestampInMillisecond;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getParquetVersion}
         * @param parquetVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_version DmsS3Endpoint#parquet_version}.
         * @return {@code this}
         */
        public Builder parquetVersion(java.lang.String parquetVersion) {
            this.parquetVersion = parquetVersion;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getPreserveTransactions}
         * @param preserveTransactions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#preserve_transactions DmsS3Endpoint#preserve_transactions}.
         * @return {@code this}
         */
        public Builder preserveTransactions(java.lang.Boolean preserveTransactions) {
            this.preserveTransactions = preserveTransactions;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getPreserveTransactions}
         * @param preserveTransactions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#preserve_transactions DmsS3Endpoint#preserve_transactions}.
         * @return {@code this}
         */
        public Builder preserveTransactions(com.hashicorp.cdktf.IResolvable preserveTransactions) {
            this.preserveTransactions = preserveTransactions;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getRfc4180}
         * @param rfc4180 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#rfc_4180 DmsS3Endpoint#rfc_4180}.
         * @return {@code this}
         */
        public Builder rfc4180(java.lang.Boolean rfc4180) {
            this.rfc4180 = rfc4180;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getRfc4180}
         * @param rfc4180 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#rfc_4180 DmsS3Endpoint#rfc_4180}.
         * @return {@code this}
         */
        public Builder rfc4180(com.hashicorp.cdktf.IResolvable rfc4180) {
            this.rfc4180 = rfc4180;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getRowGroupLength}
         * @param rowGroupLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#row_group_length DmsS3Endpoint#row_group_length}.
         * @return {@code this}
         */
        public Builder rowGroupLength(java.lang.Number rowGroupLength) {
            this.rowGroupLength = rowGroupLength;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getServerSideEncryptionKmsKeyId}
         * @param serverSideEncryptionKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#server_side_encryption_kms_key_id DmsS3Endpoint#server_side_encryption_kms_key_id}.
         * @return {@code this}
         */
        public Builder serverSideEncryptionKmsKeyId(java.lang.String serverSideEncryptionKmsKeyId) {
            this.serverSideEncryptionKmsKeyId = serverSideEncryptionKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getSslMode}
         * @param sslMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#ssl_mode DmsS3Endpoint#ssl_mode}.
         * @return {@code this}
         */
        public Builder sslMode(java.lang.String sslMode) {
            this.sslMode = sslMode;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#tags DmsS3Endpoint#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#tags_all DmsS3Endpoint#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#timeouts DmsS3Endpoint#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.dms_s3_endpoint.DmsS3EndpointTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getTimestampColumnName}
         * @param timestampColumnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#timestamp_column_name DmsS3Endpoint#timestamp_column_name}.
         * @return {@code this}
         */
        public Builder timestampColumnName(java.lang.String timestampColumnName) {
            this.timestampColumnName = timestampColumnName;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getUseCsvNoSupValue}
         * @param useCsvNoSupValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_csv_no_sup_value DmsS3Endpoint#use_csv_no_sup_value}.
         * @return {@code this}
         */
        public Builder useCsvNoSupValue(java.lang.Boolean useCsvNoSupValue) {
            this.useCsvNoSupValue = useCsvNoSupValue;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getUseCsvNoSupValue}
         * @param useCsvNoSupValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_csv_no_sup_value DmsS3Endpoint#use_csv_no_sup_value}.
         * @return {@code this}
         */
        public Builder useCsvNoSupValue(com.hashicorp.cdktf.IResolvable useCsvNoSupValue) {
            this.useCsvNoSupValue = useCsvNoSupValue;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getUseTaskStartTimeForFullLoadTimestamp}
         * @param useTaskStartTimeForFullLoadTimestamp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_task_start_time_for_full_load_timestamp DmsS3Endpoint#use_task_start_time_for_full_load_timestamp}.
         * @return {@code this}
         */
        public Builder useTaskStartTimeForFullLoadTimestamp(java.lang.Boolean useTaskStartTimeForFullLoadTimestamp) {
            this.useTaskStartTimeForFullLoadTimestamp = useTaskStartTimeForFullLoadTimestamp;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getUseTaskStartTimeForFullLoadTimestamp}
         * @param useTaskStartTimeForFullLoadTimestamp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_task_start_time_for_full_load_timestamp DmsS3Endpoint#use_task_start_time_for_full_load_timestamp}.
         * @return {@code this}
         */
        public Builder useTaskStartTimeForFullLoadTimestamp(com.hashicorp.cdktf.IResolvable useTaskStartTimeForFullLoadTimestamp) {
            this.useTaskStartTimeForFullLoadTimestamp = useTaskStartTimeForFullLoadTimestamp;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DmsS3EndpointConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DmsS3EndpointConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsS3EndpointConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsS3EndpointConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsS3EndpointConfig {
        private final java.lang.String bucketName;
        private final java.lang.String endpointId;
        private final java.lang.String endpointType;
        private final java.lang.String serviceAccessRoleArn;
        private final java.lang.Object addColumnName;
        private final java.lang.Object addTrailingPaddingCharacter;
        private final java.lang.String bucketFolder;
        private final java.lang.String cannedAclForObjects;
        private final java.lang.Object cdcInsertsAndUpdates;
        private final java.lang.Object cdcInsertsOnly;
        private final java.lang.Number cdcMaxBatchInterval;
        private final java.lang.Number cdcMinFileSize;
        private final java.lang.String cdcPath;
        private final java.lang.String certificateArn;
        private final java.lang.String compressionType;
        private final java.lang.String csvDelimiter;
        private final java.lang.String csvNoSupValue;
        private final java.lang.String csvNullValue;
        private final java.lang.String csvRowDelimiter;
        private final java.lang.String dataFormat;
        private final java.lang.Number dataPageSize;
        private final java.lang.String datePartitionDelimiter;
        private final java.lang.Object datePartitionEnabled;
        private final java.lang.String datePartitionSequence;
        private final java.lang.String datePartitionTimezone;
        private final java.lang.Object detachTargetOnLobLookupFailureParquet;
        private final java.lang.Number dictPageSizeLimit;
        private final java.lang.Object enableStatistics;
        private final java.lang.String encodingType;
        private final java.lang.String encryptionMode;
        private final java.lang.String expectedBucketOwner;
        private final java.lang.String externalTableDefinition;
        private final java.lang.Object glueCatalogGeneration;
        private final java.lang.String id;
        private final java.lang.Number ignoreHeaderRows;
        private final java.lang.Object includeOpForFullLoad;
        private final java.lang.String kmsKeyArn;
        private final java.lang.Number maxFileSize;
        private final java.lang.Object parquetTimestampInMillisecond;
        private final java.lang.String parquetVersion;
        private final java.lang.Object preserveTransactions;
        private final java.lang.Object rfc4180;
        private final java.lang.Number rowGroupLength;
        private final java.lang.String serverSideEncryptionKmsKeyId;
        private final java.lang.String sslMode;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.dms_s3_endpoint.DmsS3EndpointTimeouts timeouts;
        private final java.lang.String timestampColumnName;
        private final java.lang.Object useCsvNoSupValue;
        private final java.lang.Object useTaskStartTimeForFullLoadTimestamp;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointId = software.amazon.jsii.Kernel.get(this, "endpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointType = software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceAccessRoleArn = software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.addColumnName = software.amazon.jsii.Kernel.get(this, "addColumnName", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.addTrailingPaddingCharacter = software.amazon.jsii.Kernel.get(this, "addTrailingPaddingCharacter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.bucketFolder = software.amazon.jsii.Kernel.get(this, "bucketFolder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cannedAclForObjects = software.amazon.jsii.Kernel.get(this, "cannedAclForObjects", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cdcInsertsAndUpdates = software.amazon.jsii.Kernel.get(this, "cdcInsertsAndUpdates", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cdcInsertsOnly = software.amazon.jsii.Kernel.get(this, "cdcInsertsOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cdcMaxBatchInterval = software.amazon.jsii.Kernel.get(this, "cdcMaxBatchInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cdcMinFileSize = software.amazon.jsii.Kernel.get(this, "cdcMinFileSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cdcPath = software.amazon.jsii.Kernel.get(this, "cdcPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateArn = software.amazon.jsii.Kernel.get(this, "certificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.compressionType = software.amazon.jsii.Kernel.get(this, "compressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.csvDelimiter = software.amazon.jsii.Kernel.get(this, "csvDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.csvNoSupValue = software.amazon.jsii.Kernel.get(this, "csvNoSupValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.csvNullValue = software.amazon.jsii.Kernel.get(this, "csvNullValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.csvRowDelimiter = software.amazon.jsii.Kernel.get(this, "csvRowDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataFormat = software.amazon.jsii.Kernel.get(this, "dataFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataPageSize = software.amazon.jsii.Kernel.get(this, "dataPageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.datePartitionDelimiter = software.amazon.jsii.Kernel.get(this, "datePartitionDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.datePartitionEnabled = software.amazon.jsii.Kernel.get(this, "datePartitionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.datePartitionSequence = software.amazon.jsii.Kernel.get(this, "datePartitionSequence", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.datePartitionTimezone = software.amazon.jsii.Kernel.get(this, "datePartitionTimezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.detachTargetOnLobLookupFailureParquet = software.amazon.jsii.Kernel.get(this, "detachTargetOnLobLookupFailureParquet", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dictPageSizeLimit = software.amazon.jsii.Kernel.get(this, "dictPageSizeLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.enableStatistics = software.amazon.jsii.Kernel.get(this, "enableStatistics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.encodingType = software.amazon.jsii.Kernel.get(this, "encodingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionMode = software.amazon.jsii.Kernel.get(this, "encryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.expectedBucketOwner = software.amazon.jsii.Kernel.get(this, "expectedBucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.externalTableDefinition = software.amazon.jsii.Kernel.get(this, "externalTableDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.glueCatalogGeneration = software.amazon.jsii.Kernel.get(this, "glueCatalogGeneration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ignoreHeaderRows = software.amazon.jsii.Kernel.get(this, "ignoreHeaderRows", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.includeOpForFullLoad = software.amazon.jsii.Kernel.get(this, "includeOpForFullLoad", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxFileSize = software.amazon.jsii.Kernel.get(this, "maxFileSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.parquetTimestampInMillisecond = software.amazon.jsii.Kernel.get(this, "parquetTimestampInMillisecond", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parquetVersion = software.amazon.jsii.Kernel.get(this, "parquetVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preserveTransactions = software.amazon.jsii.Kernel.get(this, "preserveTransactions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.rfc4180 = software.amazon.jsii.Kernel.get(this, "rfc4180", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.rowGroupLength = software.amazon.jsii.Kernel.get(this, "rowGroupLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.serverSideEncryptionKmsKeyId = software.amazon.jsii.Kernel.get(this, "serverSideEncryptionKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sslMode = software.amazon.jsii.Kernel.get(this, "sslMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dms_s3_endpoint.DmsS3EndpointTimeouts.class));
            this.timestampColumnName = software.amazon.jsii.Kernel.get(this, "timestampColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.useCsvNoSupValue = software.amazon.jsii.Kernel.get(this, "useCsvNoSupValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.useTaskStartTimeForFullLoadTimestamp = software.amazon.jsii.Kernel.get(this, "useTaskStartTimeForFullLoadTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.endpointId = java.util.Objects.requireNonNull(builder.endpointId, "endpointId is required");
            this.endpointType = java.util.Objects.requireNonNull(builder.endpointType, "endpointType is required");
            this.serviceAccessRoleArn = java.util.Objects.requireNonNull(builder.serviceAccessRoleArn, "serviceAccessRoleArn is required");
            this.addColumnName = builder.addColumnName;
            this.addTrailingPaddingCharacter = builder.addTrailingPaddingCharacter;
            this.bucketFolder = builder.bucketFolder;
            this.cannedAclForObjects = builder.cannedAclForObjects;
            this.cdcInsertsAndUpdates = builder.cdcInsertsAndUpdates;
            this.cdcInsertsOnly = builder.cdcInsertsOnly;
            this.cdcMaxBatchInterval = builder.cdcMaxBatchInterval;
            this.cdcMinFileSize = builder.cdcMinFileSize;
            this.cdcPath = builder.cdcPath;
            this.certificateArn = builder.certificateArn;
            this.compressionType = builder.compressionType;
            this.csvDelimiter = builder.csvDelimiter;
            this.csvNoSupValue = builder.csvNoSupValue;
            this.csvNullValue = builder.csvNullValue;
            this.csvRowDelimiter = builder.csvRowDelimiter;
            this.dataFormat = builder.dataFormat;
            this.dataPageSize = builder.dataPageSize;
            this.datePartitionDelimiter = builder.datePartitionDelimiter;
            this.datePartitionEnabled = builder.datePartitionEnabled;
            this.datePartitionSequence = builder.datePartitionSequence;
            this.datePartitionTimezone = builder.datePartitionTimezone;
            this.detachTargetOnLobLookupFailureParquet = builder.detachTargetOnLobLookupFailureParquet;
            this.dictPageSizeLimit = builder.dictPageSizeLimit;
            this.enableStatistics = builder.enableStatistics;
            this.encodingType = builder.encodingType;
            this.encryptionMode = builder.encryptionMode;
            this.expectedBucketOwner = builder.expectedBucketOwner;
            this.externalTableDefinition = builder.externalTableDefinition;
            this.glueCatalogGeneration = builder.glueCatalogGeneration;
            this.id = builder.id;
            this.ignoreHeaderRows = builder.ignoreHeaderRows;
            this.includeOpForFullLoad = builder.includeOpForFullLoad;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.maxFileSize = builder.maxFileSize;
            this.parquetTimestampInMillisecond = builder.parquetTimestampInMillisecond;
            this.parquetVersion = builder.parquetVersion;
            this.preserveTransactions = builder.preserveTransactions;
            this.rfc4180 = builder.rfc4180;
            this.rowGroupLength = builder.rowGroupLength;
            this.serverSideEncryptionKmsKeyId = builder.serverSideEncryptionKmsKeyId;
            this.sslMode = builder.sslMode;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.timestampColumnName = builder.timestampColumnName;
            this.useCsvNoSupValue = builder.useCsvNoSupValue;
            this.useTaskStartTimeForFullLoadTimestamp = builder.useTaskStartTimeForFullLoadTimestamp;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getEndpointId() {
            return this.endpointId;
        }

        @Override
        public final java.lang.String getEndpointType() {
            return this.endpointType;
        }

        @Override
        public final java.lang.String getServiceAccessRoleArn() {
            return this.serviceAccessRoleArn;
        }

        @Override
        public final java.lang.Object getAddColumnName() {
            return this.addColumnName;
        }

        @Override
        public final java.lang.Object getAddTrailingPaddingCharacter() {
            return this.addTrailingPaddingCharacter;
        }

        @Override
        public final java.lang.String getBucketFolder() {
            return this.bucketFolder;
        }

        @Override
        public final java.lang.String getCannedAclForObjects() {
            return this.cannedAclForObjects;
        }

        @Override
        public final java.lang.Object getCdcInsertsAndUpdates() {
            return this.cdcInsertsAndUpdates;
        }

        @Override
        public final java.lang.Object getCdcInsertsOnly() {
            return this.cdcInsertsOnly;
        }

        @Override
        public final java.lang.Number getCdcMaxBatchInterval() {
            return this.cdcMaxBatchInterval;
        }

        @Override
        public final java.lang.Number getCdcMinFileSize() {
            return this.cdcMinFileSize;
        }

        @Override
        public final java.lang.String getCdcPath() {
            return this.cdcPath;
        }

        @Override
        public final java.lang.String getCertificateArn() {
            return this.certificateArn;
        }

        @Override
        public final java.lang.String getCompressionType() {
            return this.compressionType;
        }

        @Override
        public final java.lang.String getCsvDelimiter() {
            return this.csvDelimiter;
        }

        @Override
        public final java.lang.String getCsvNoSupValue() {
            return this.csvNoSupValue;
        }

        @Override
        public final java.lang.String getCsvNullValue() {
            return this.csvNullValue;
        }

        @Override
        public final java.lang.String getCsvRowDelimiter() {
            return this.csvRowDelimiter;
        }

        @Override
        public final java.lang.String getDataFormat() {
            return this.dataFormat;
        }

        @Override
        public final java.lang.Number getDataPageSize() {
            return this.dataPageSize;
        }

        @Override
        public final java.lang.String getDatePartitionDelimiter() {
            return this.datePartitionDelimiter;
        }

        @Override
        public final java.lang.Object getDatePartitionEnabled() {
            return this.datePartitionEnabled;
        }

        @Override
        public final java.lang.String getDatePartitionSequence() {
            return this.datePartitionSequence;
        }

        @Override
        public final java.lang.String getDatePartitionTimezone() {
            return this.datePartitionTimezone;
        }

        @Override
        public final java.lang.Object getDetachTargetOnLobLookupFailureParquet() {
            return this.detachTargetOnLobLookupFailureParquet;
        }

        @Override
        public final java.lang.Number getDictPageSizeLimit() {
            return this.dictPageSizeLimit;
        }

        @Override
        public final java.lang.Object getEnableStatistics() {
            return this.enableStatistics;
        }

        @Override
        public final java.lang.String getEncodingType() {
            return this.encodingType;
        }

        @Override
        public final java.lang.String getEncryptionMode() {
            return this.encryptionMode;
        }

        @Override
        public final java.lang.String getExpectedBucketOwner() {
            return this.expectedBucketOwner;
        }

        @Override
        public final java.lang.String getExternalTableDefinition() {
            return this.externalTableDefinition;
        }

        @Override
        public final java.lang.Object getGlueCatalogGeneration() {
            return this.glueCatalogGeneration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getIgnoreHeaderRows() {
            return this.ignoreHeaderRows;
        }

        @Override
        public final java.lang.Object getIncludeOpForFullLoad() {
            return this.includeOpForFullLoad;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.Number getMaxFileSize() {
            return this.maxFileSize;
        }

        @Override
        public final java.lang.Object getParquetTimestampInMillisecond() {
            return this.parquetTimestampInMillisecond;
        }

        @Override
        public final java.lang.String getParquetVersion() {
            return this.parquetVersion;
        }

        @Override
        public final java.lang.Object getPreserveTransactions() {
            return this.preserveTransactions;
        }

        @Override
        public final java.lang.Object getRfc4180() {
            return this.rfc4180;
        }

        @Override
        public final java.lang.Number getRowGroupLength() {
            return this.rowGroupLength;
        }

        @Override
        public final java.lang.String getServerSideEncryptionKmsKeyId() {
            return this.serverSideEncryptionKmsKeyId;
        }

        @Override
        public final java.lang.String getSslMode() {
            return this.sslMode;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.dms_s3_endpoint.DmsS3EndpointTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getTimestampColumnName() {
            return this.timestampColumnName;
        }

        @Override
        public final java.lang.Object getUseCsvNoSupValue() {
            return this.useCsvNoSupValue;
        }

        @Override
        public final java.lang.Object getUseTaskStartTimeForFullLoadTimestamp() {
            return this.useTaskStartTimeForFullLoadTimestamp;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("endpointId", om.valueToTree(this.getEndpointId()));
            data.set("endpointType", om.valueToTree(this.getEndpointType()));
            data.set("serviceAccessRoleArn", om.valueToTree(this.getServiceAccessRoleArn()));
            if (this.getAddColumnName() != null) {
                data.set("addColumnName", om.valueToTree(this.getAddColumnName()));
            }
            if (this.getAddTrailingPaddingCharacter() != null) {
                data.set("addTrailingPaddingCharacter", om.valueToTree(this.getAddTrailingPaddingCharacter()));
            }
            if (this.getBucketFolder() != null) {
                data.set("bucketFolder", om.valueToTree(this.getBucketFolder()));
            }
            if (this.getCannedAclForObjects() != null) {
                data.set("cannedAclForObjects", om.valueToTree(this.getCannedAclForObjects()));
            }
            if (this.getCdcInsertsAndUpdates() != null) {
                data.set("cdcInsertsAndUpdates", om.valueToTree(this.getCdcInsertsAndUpdates()));
            }
            if (this.getCdcInsertsOnly() != null) {
                data.set("cdcInsertsOnly", om.valueToTree(this.getCdcInsertsOnly()));
            }
            if (this.getCdcMaxBatchInterval() != null) {
                data.set("cdcMaxBatchInterval", om.valueToTree(this.getCdcMaxBatchInterval()));
            }
            if (this.getCdcMinFileSize() != null) {
                data.set("cdcMinFileSize", om.valueToTree(this.getCdcMinFileSize()));
            }
            if (this.getCdcPath() != null) {
                data.set("cdcPath", om.valueToTree(this.getCdcPath()));
            }
            if (this.getCertificateArn() != null) {
                data.set("certificateArn", om.valueToTree(this.getCertificateArn()));
            }
            if (this.getCompressionType() != null) {
                data.set("compressionType", om.valueToTree(this.getCompressionType()));
            }
            if (this.getCsvDelimiter() != null) {
                data.set("csvDelimiter", om.valueToTree(this.getCsvDelimiter()));
            }
            if (this.getCsvNoSupValue() != null) {
                data.set("csvNoSupValue", om.valueToTree(this.getCsvNoSupValue()));
            }
            if (this.getCsvNullValue() != null) {
                data.set("csvNullValue", om.valueToTree(this.getCsvNullValue()));
            }
            if (this.getCsvRowDelimiter() != null) {
                data.set("csvRowDelimiter", om.valueToTree(this.getCsvRowDelimiter()));
            }
            if (this.getDataFormat() != null) {
                data.set("dataFormat", om.valueToTree(this.getDataFormat()));
            }
            if (this.getDataPageSize() != null) {
                data.set("dataPageSize", om.valueToTree(this.getDataPageSize()));
            }
            if (this.getDatePartitionDelimiter() != null) {
                data.set("datePartitionDelimiter", om.valueToTree(this.getDatePartitionDelimiter()));
            }
            if (this.getDatePartitionEnabled() != null) {
                data.set("datePartitionEnabled", om.valueToTree(this.getDatePartitionEnabled()));
            }
            if (this.getDatePartitionSequence() != null) {
                data.set("datePartitionSequence", om.valueToTree(this.getDatePartitionSequence()));
            }
            if (this.getDatePartitionTimezone() != null) {
                data.set("datePartitionTimezone", om.valueToTree(this.getDatePartitionTimezone()));
            }
            if (this.getDetachTargetOnLobLookupFailureParquet() != null) {
                data.set("detachTargetOnLobLookupFailureParquet", om.valueToTree(this.getDetachTargetOnLobLookupFailureParquet()));
            }
            if (this.getDictPageSizeLimit() != null) {
                data.set("dictPageSizeLimit", om.valueToTree(this.getDictPageSizeLimit()));
            }
            if (this.getEnableStatistics() != null) {
                data.set("enableStatistics", om.valueToTree(this.getEnableStatistics()));
            }
            if (this.getEncodingType() != null) {
                data.set("encodingType", om.valueToTree(this.getEncodingType()));
            }
            if (this.getEncryptionMode() != null) {
                data.set("encryptionMode", om.valueToTree(this.getEncryptionMode()));
            }
            if (this.getExpectedBucketOwner() != null) {
                data.set("expectedBucketOwner", om.valueToTree(this.getExpectedBucketOwner()));
            }
            if (this.getExternalTableDefinition() != null) {
                data.set("externalTableDefinition", om.valueToTree(this.getExternalTableDefinition()));
            }
            if (this.getGlueCatalogGeneration() != null) {
                data.set("glueCatalogGeneration", om.valueToTree(this.getGlueCatalogGeneration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIgnoreHeaderRows() != null) {
                data.set("ignoreHeaderRows", om.valueToTree(this.getIgnoreHeaderRows()));
            }
            if (this.getIncludeOpForFullLoad() != null) {
                data.set("includeOpForFullLoad", om.valueToTree(this.getIncludeOpForFullLoad()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getMaxFileSize() != null) {
                data.set("maxFileSize", om.valueToTree(this.getMaxFileSize()));
            }
            if (this.getParquetTimestampInMillisecond() != null) {
                data.set("parquetTimestampInMillisecond", om.valueToTree(this.getParquetTimestampInMillisecond()));
            }
            if (this.getParquetVersion() != null) {
                data.set("parquetVersion", om.valueToTree(this.getParquetVersion()));
            }
            if (this.getPreserveTransactions() != null) {
                data.set("preserveTransactions", om.valueToTree(this.getPreserveTransactions()));
            }
            if (this.getRfc4180() != null) {
                data.set("rfc4180", om.valueToTree(this.getRfc4180()));
            }
            if (this.getRowGroupLength() != null) {
                data.set("rowGroupLength", om.valueToTree(this.getRowGroupLength()));
            }
            if (this.getServerSideEncryptionKmsKeyId() != null) {
                data.set("serverSideEncryptionKmsKeyId", om.valueToTree(this.getServerSideEncryptionKmsKeyId()));
            }
            if (this.getSslMode() != null) {
                data.set("sslMode", om.valueToTree(this.getSslMode()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTimestampColumnName() != null) {
                data.set("timestampColumnName", om.valueToTree(this.getTimestampColumnName()));
            }
            if (this.getUseCsvNoSupValue() != null) {
                data.set("useCsvNoSupValue", om.valueToTree(this.getUseCsvNoSupValue()));
            }
            if (this.getUseTaskStartTimeForFullLoadTimestamp() != null) {
                data.set("useTaskStartTimeForFullLoadTimestamp", om.valueToTree(this.getUseTaskStartTimeForFullLoadTimestamp()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dmsS3Endpoint.DmsS3EndpointConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsS3EndpointConfig.Jsii$Proxy that = (DmsS3EndpointConfig.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            if (!endpointId.equals(that.endpointId)) return false;
            if (!endpointType.equals(that.endpointType)) return false;
            if (!serviceAccessRoleArn.equals(that.serviceAccessRoleArn)) return false;
            if (this.addColumnName != null ? !this.addColumnName.equals(that.addColumnName) : that.addColumnName != null) return false;
            if (this.addTrailingPaddingCharacter != null ? !this.addTrailingPaddingCharacter.equals(that.addTrailingPaddingCharacter) : that.addTrailingPaddingCharacter != null) return false;
            if (this.bucketFolder != null ? !this.bucketFolder.equals(that.bucketFolder) : that.bucketFolder != null) return false;
            if (this.cannedAclForObjects != null ? !this.cannedAclForObjects.equals(that.cannedAclForObjects) : that.cannedAclForObjects != null) return false;
            if (this.cdcInsertsAndUpdates != null ? !this.cdcInsertsAndUpdates.equals(that.cdcInsertsAndUpdates) : that.cdcInsertsAndUpdates != null) return false;
            if (this.cdcInsertsOnly != null ? !this.cdcInsertsOnly.equals(that.cdcInsertsOnly) : that.cdcInsertsOnly != null) return false;
            if (this.cdcMaxBatchInterval != null ? !this.cdcMaxBatchInterval.equals(that.cdcMaxBatchInterval) : that.cdcMaxBatchInterval != null) return false;
            if (this.cdcMinFileSize != null ? !this.cdcMinFileSize.equals(that.cdcMinFileSize) : that.cdcMinFileSize != null) return false;
            if (this.cdcPath != null ? !this.cdcPath.equals(that.cdcPath) : that.cdcPath != null) return false;
            if (this.certificateArn != null ? !this.certificateArn.equals(that.certificateArn) : that.certificateArn != null) return false;
            if (this.compressionType != null ? !this.compressionType.equals(that.compressionType) : that.compressionType != null) return false;
            if (this.csvDelimiter != null ? !this.csvDelimiter.equals(that.csvDelimiter) : that.csvDelimiter != null) return false;
            if (this.csvNoSupValue != null ? !this.csvNoSupValue.equals(that.csvNoSupValue) : that.csvNoSupValue != null) return false;
            if (this.csvNullValue != null ? !this.csvNullValue.equals(that.csvNullValue) : that.csvNullValue != null) return false;
            if (this.csvRowDelimiter != null ? !this.csvRowDelimiter.equals(that.csvRowDelimiter) : that.csvRowDelimiter != null) return false;
            if (this.dataFormat != null ? !this.dataFormat.equals(that.dataFormat) : that.dataFormat != null) return false;
            if (this.dataPageSize != null ? !this.dataPageSize.equals(that.dataPageSize) : that.dataPageSize != null) return false;
            if (this.datePartitionDelimiter != null ? !this.datePartitionDelimiter.equals(that.datePartitionDelimiter) : that.datePartitionDelimiter != null) return false;
            if (this.datePartitionEnabled != null ? !this.datePartitionEnabled.equals(that.datePartitionEnabled) : that.datePartitionEnabled != null) return false;
            if (this.datePartitionSequence != null ? !this.datePartitionSequence.equals(that.datePartitionSequence) : that.datePartitionSequence != null) return false;
            if (this.datePartitionTimezone != null ? !this.datePartitionTimezone.equals(that.datePartitionTimezone) : that.datePartitionTimezone != null) return false;
            if (this.detachTargetOnLobLookupFailureParquet != null ? !this.detachTargetOnLobLookupFailureParquet.equals(that.detachTargetOnLobLookupFailureParquet) : that.detachTargetOnLobLookupFailureParquet != null) return false;
            if (this.dictPageSizeLimit != null ? !this.dictPageSizeLimit.equals(that.dictPageSizeLimit) : that.dictPageSizeLimit != null) return false;
            if (this.enableStatistics != null ? !this.enableStatistics.equals(that.enableStatistics) : that.enableStatistics != null) return false;
            if (this.encodingType != null ? !this.encodingType.equals(that.encodingType) : that.encodingType != null) return false;
            if (this.encryptionMode != null ? !this.encryptionMode.equals(that.encryptionMode) : that.encryptionMode != null) return false;
            if (this.expectedBucketOwner != null ? !this.expectedBucketOwner.equals(that.expectedBucketOwner) : that.expectedBucketOwner != null) return false;
            if (this.externalTableDefinition != null ? !this.externalTableDefinition.equals(that.externalTableDefinition) : that.externalTableDefinition != null) return false;
            if (this.glueCatalogGeneration != null ? !this.glueCatalogGeneration.equals(that.glueCatalogGeneration) : that.glueCatalogGeneration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ignoreHeaderRows != null ? !this.ignoreHeaderRows.equals(that.ignoreHeaderRows) : that.ignoreHeaderRows != null) return false;
            if (this.includeOpForFullLoad != null ? !this.includeOpForFullLoad.equals(that.includeOpForFullLoad) : that.includeOpForFullLoad != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.maxFileSize != null ? !this.maxFileSize.equals(that.maxFileSize) : that.maxFileSize != null) return false;
            if (this.parquetTimestampInMillisecond != null ? !this.parquetTimestampInMillisecond.equals(that.parquetTimestampInMillisecond) : that.parquetTimestampInMillisecond != null) return false;
            if (this.parquetVersion != null ? !this.parquetVersion.equals(that.parquetVersion) : that.parquetVersion != null) return false;
            if (this.preserveTransactions != null ? !this.preserveTransactions.equals(that.preserveTransactions) : that.preserveTransactions != null) return false;
            if (this.rfc4180 != null ? !this.rfc4180.equals(that.rfc4180) : that.rfc4180 != null) return false;
            if (this.rowGroupLength != null ? !this.rowGroupLength.equals(that.rowGroupLength) : that.rowGroupLength != null) return false;
            if (this.serverSideEncryptionKmsKeyId != null ? !this.serverSideEncryptionKmsKeyId.equals(that.serverSideEncryptionKmsKeyId) : that.serverSideEncryptionKmsKeyId != null) return false;
            if (this.sslMode != null ? !this.sslMode.equals(that.sslMode) : that.sslMode != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.timestampColumnName != null ? !this.timestampColumnName.equals(that.timestampColumnName) : that.timestampColumnName != null) return false;
            if (this.useCsvNoSupValue != null ? !this.useCsvNoSupValue.equals(that.useCsvNoSupValue) : that.useCsvNoSupValue != null) return false;
            if (this.useTaskStartTimeForFullLoadTimestamp != null ? !this.useTaskStartTimeForFullLoadTimestamp.equals(that.useTaskStartTimeForFullLoadTimestamp) : that.useTaskStartTimeForFullLoadTimestamp != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.endpointId.hashCode());
            result = 31 * result + (this.endpointType.hashCode());
            result = 31 * result + (this.serviceAccessRoleArn.hashCode());
            result = 31 * result + (this.addColumnName != null ? this.addColumnName.hashCode() : 0);
            result = 31 * result + (this.addTrailingPaddingCharacter != null ? this.addTrailingPaddingCharacter.hashCode() : 0);
            result = 31 * result + (this.bucketFolder != null ? this.bucketFolder.hashCode() : 0);
            result = 31 * result + (this.cannedAclForObjects != null ? this.cannedAclForObjects.hashCode() : 0);
            result = 31 * result + (this.cdcInsertsAndUpdates != null ? this.cdcInsertsAndUpdates.hashCode() : 0);
            result = 31 * result + (this.cdcInsertsOnly != null ? this.cdcInsertsOnly.hashCode() : 0);
            result = 31 * result + (this.cdcMaxBatchInterval != null ? this.cdcMaxBatchInterval.hashCode() : 0);
            result = 31 * result + (this.cdcMinFileSize != null ? this.cdcMinFileSize.hashCode() : 0);
            result = 31 * result + (this.cdcPath != null ? this.cdcPath.hashCode() : 0);
            result = 31 * result + (this.certificateArn != null ? this.certificateArn.hashCode() : 0);
            result = 31 * result + (this.compressionType != null ? this.compressionType.hashCode() : 0);
            result = 31 * result + (this.csvDelimiter != null ? this.csvDelimiter.hashCode() : 0);
            result = 31 * result + (this.csvNoSupValue != null ? this.csvNoSupValue.hashCode() : 0);
            result = 31 * result + (this.csvNullValue != null ? this.csvNullValue.hashCode() : 0);
            result = 31 * result + (this.csvRowDelimiter != null ? this.csvRowDelimiter.hashCode() : 0);
            result = 31 * result + (this.dataFormat != null ? this.dataFormat.hashCode() : 0);
            result = 31 * result + (this.dataPageSize != null ? this.dataPageSize.hashCode() : 0);
            result = 31 * result + (this.datePartitionDelimiter != null ? this.datePartitionDelimiter.hashCode() : 0);
            result = 31 * result + (this.datePartitionEnabled != null ? this.datePartitionEnabled.hashCode() : 0);
            result = 31 * result + (this.datePartitionSequence != null ? this.datePartitionSequence.hashCode() : 0);
            result = 31 * result + (this.datePartitionTimezone != null ? this.datePartitionTimezone.hashCode() : 0);
            result = 31 * result + (this.detachTargetOnLobLookupFailureParquet != null ? this.detachTargetOnLobLookupFailureParquet.hashCode() : 0);
            result = 31 * result + (this.dictPageSizeLimit != null ? this.dictPageSizeLimit.hashCode() : 0);
            result = 31 * result + (this.enableStatistics != null ? this.enableStatistics.hashCode() : 0);
            result = 31 * result + (this.encodingType != null ? this.encodingType.hashCode() : 0);
            result = 31 * result + (this.encryptionMode != null ? this.encryptionMode.hashCode() : 0);
            result = 31 * result + (this.expectedBucketOwner != null ? this.expectedBucketOwner.hashCode() : 0);
            result = 31 * result + (this.externalTableDefinition != null ? this.externalTableDefinition.hashCode() : 0);
            result = 31 * result + (this.glueCatalogGeneration != null ? this.glueCatalogGeneration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ignoreHeaderRows != null ? this.ignoreHeaderRows.hashCode() : 0);
            result = 31 * result + (this.includeOpForFullLoad != null ? this.includeOpForFullLoad.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.maxFileSize != null ? this.maxFileSize.hashCode() : 0);
            result = 31 * result + (this.parquetTimestampInMillisecond != null ? this.parquetTimestampInMillisecond.hashCode() : 0);
            result = 31 * result + (this.parquetVersion != null ? this.parquetVersion.hashCode() : 0);
            result = 31 * result + (this.preserveTransactions != null ? this.preserveTransactions.hashCode() : 0);
            result = 31 * result + (this.rfc4180 != null ? this.rfc4180.hashCode() : 0);
            result = 31 * result + (this.rowGroupLength != null ? this.rowGroupLength.hashCode() : 0);
            result = 31 * result + (this.serverSideEncryptionKmsKeyId != null ? this.serverSideEncryptionKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.sslMode != null ? this.sslMode.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.timestampColumnName != null ? this.timestampColumnName.hashCode() : 0);
            result = 31 * result + (this.useCsvNoSupValue != null ? this.useCsvNoSupValue.hashCode() : 0);
            result = 31 * result + (this.useTaskStartTimeForFullLoadTimestamp != null ? this.useTaskStartTimeForFullLoadTimestamp.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
