package imports.aws.dynamodb_table_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.055Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTableExport.DynamodbTableExportConfig")
@software.amazon.jsii.Jsii.Proxy(DynamodbTableExportConfig.Jsii$Proxy.class)
public interface DynamodbTableExportConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_bucket DynamodbTableExport#s3_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#table_arn DynamodbTableExport#table_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_format DynamodbTableExport#export_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExportFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_time DynamodbTableExport#export_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExportTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_type DynamodbTableExport#export_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExportType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#id DynamodbTableExport#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * incremental_export_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#incremental_export_specification DynamodbTableExport#incremental_export_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification getIncrementalExportSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_bucket_owner DynamodbTableExport#s3_bucket_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3BucketOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_prefix DynamodbTableExport#s3_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Prefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_sse_algorithm DynamodbTableExport#s3_sse_algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3SseAlgorithm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_sse_kms_key_id DynamodbTableExport#s3_sse_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3SseKmsKeyId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#timeouts DynamodbTableExport#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table_export.DynamodbTableExportTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DynamodbTableExportConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DynamodbTableExportConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DynamodbTableExportConfig> {
        java.lang.String s3Bucket;
        java.lang.String tableArn;
        java.lang.String exportFormat;
        java.lang.String exportTime;
        java.lang.String exportType;
        java.lang.String id;
        imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification incrementalExportSpecification;
        java.lang.String s3BucketOwner;
        java.lang.String s3Prefix;
        java.lang.String s3SseAlgorithm;
        java.lang.String s3SseKmsKeyId;
        imports.aws.dynamodb_table_export.DynamodbTableExportTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_bucket DynamodbTableExport#s3_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getTableArn}
         * @param tableArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#table_arn DynamodbTableExport#table_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableArn(java.lang.String tableArn) {
            this.tableArn = tableArn;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getExportFormat}
         * @param exportFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_format DynamodbTableExport#export_format}.
         * @return {@code this}
         */
        public Builder exportFormat(java.lang.String exportFormat) {
            this.exportFormat = exportFormat;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getExportTime}
         * @param exportTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_time DynamodbTableExport#export_time}.
         * @return {@code this}
         */
        public Builder exportTime(java.lang.String exportTime) {
            this.exportTime = exportTime;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getExportType}
         * @param exportType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_type DynamodbTableExport#export_type}.
         * @return {@code this}
         */
        public Builder exportType(java.lang.String exportType) {
            this.exportType = exportType;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#id DynamodbTableExport#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getIncrementalExportSpecification}
         * @param incrementalExportSpecification incremental_export_specification block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#incremental_export_specification DynamodbTableExport#incremental_export_specification}
         * @return {@code this}
         */
        public Builder incrementalExportSpecification(imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification incrementalExportSpecification) {
            this.incrementalExportSpecification = incrementalExportSpecification;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getS3BucketOwner}
         * @param s3BucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_bucket_owner DynamodbTableExport#s3_bucket_owner}.
         * @return {@code this}
         */
        public Builder s3BucketOwner(java.lang.String s3BucketOwner) {
            this.s3BucketOwner = s3BucketOwner;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getS3Prefix}
         * @param s3Prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_prefix DynamodbTableExport#s3_prefix}.
         * @return {@code this}
         */
        public Builder s3Prefix(java.lang.String s3Prefix) {
            this.s3Prefix = s3Prefix;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getS3SseAlgorithm}
         * @param s3SseAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_sse_algorithm DynamodbTableExport#s3_sse_algorithm}.
         * @return {@code this}
         */
        public Builder s3SseAlgorithm(java.lang.String s3SseAlgorithm) {
            this.s3SseAlgorithm = s3SseAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getS3SseKmsKeyId}
         * @param s3SseKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_sse_kms_key_id DynamodbTableExport#s3_sse_kms_key_id}.
         * @return {@code this}
         */
        public Builder s3SseKmsKeyId(java.lang.String s3SseKmsKeyId) {
            this.s3SseKmsKeyId = s3SseKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#timeouts DynamodbTableExport#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.dynamodb_table_export.DynamodbTableExportTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getDependsOn}
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
         * Sets the value of {@link DynamodbTableExportConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DynamodbTableExportConfig#getProvisioners}
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
         * @return a new instance of {@link DynamodbTableExportConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DynamodbTableExportConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DynamodbTableExportConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DynamodbTableExportConfig {
        private final java.lang.String s3Bucket;
        private final java.lang.String tableArn;
        private final java.lang.String exportFormat;
        private final java.lang.String exportTime;
        private final java.lang.String exportType;
        private final java.lang.String id;
        private final imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification incrementalExportSpecification;
        private final java.lang.String s3BucketOwner;
        private final java.lang.String s3Prefix;
        private final java.lang.String s3SseAlgorithm;
        private final java.lang.String s3SseKmsKeyId;
        private final imports.aws.dynamodb_table_export.DynamodbTableExportTimeouts timeouts;
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
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableArn = software.amazon.jsii.Kernel.get(this, "tableArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exportFormat = software.amazon.jsii.Kernel.get(this, "exportFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exportTime = software.amazon.jsii.Kernel.get(this, "exportTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exportType = software.amazon.jsii.Kernel.get(this, "exportType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.incrementalExportSpecification = software.amazon.jsii.Kernel.get(this, "incrementalExportSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification.class));
            this.s3BucketOwner = software.amazon.jsii.Kernel.get(this, "s3BucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Prefix = software.amazon.jsii.Kernel.get(this, "s3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3SseAlgorithm = software.amazon.jsii.Kernel.get(this, "s3SseAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3SseKmsKeyId = software.amazon.jsii.Kernel.get(this, "s3SseKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table_export.DynamodbTableExportTimeouts.class));
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
            this.s3Bucket = java.util.Objects.requireNonNull(builder.s3Bucket, "s3Bucket is required");
            this.tableArn = java.util.Objects.requireNonNull(builder.tableArn, "tableArn is required");
            this.exportFormat = builder.exportFormat;
            this.exportTime = builder.exportTime;
            this.exportType = builder.exportType;
            this.id = builder.id;
            this.incrementalExportSpecification = builder.incrementalExportSpecification;
            this.s3BucketOwner = builder.s3BucketOwner;
            this.s3Prefix = builder.s3Prefix;
            this.s3SseAlgorithm = builder.s3SseAlgorithm;
            this.s3SseKmsKeyId = builder.s3SseKmsKeyId;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getS3Bucket() {
            return this.s3Bucket;
        }

        @Override
        public final java.lang.String getTableArn() {
            return this.tableArn;
        }

        @Override
        public final java.lang.String getExportFormat() {
            return this.exportFormat;
        }

        @Override
        public final java.lang.String getExportTime() {
            return this.exportTime;
        }

        @Override
        public final java.lang.String getExportType() {
            return this.exportType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification getIncrementalExportSpecification() {
            return this.incrementalExportSpecification;
        }

        @Override
        public final java.lang.String getS3BucketOwner() {
            return this.s3BucketOwner;
        }

        @Override
        public final java.lang.String getS3Prefix() {
            return this.s3Prefix;
        }

        @Override
        public final java.lang.String getS3SseAlgorithm() {
            return this.s3SseAlgorithm;
        }

        @Override
        public final java.lang.String getS3SseKmsKeyId() {
            return this.s3SseKmsKeyId;
        }

        @Override
        public final imports.aws.dynamodb_table_export.DynamodbTableExportTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            data.set("tableArn", om.valueToTree(this.getTableArn()));
            if (this.getExportFormat() != null) {
                data.set("exportFormat", om.valueToTree(this.getExportFormat()));
            }
            if (this.getExportTime() != null) {
                data.set("exportTime", om.valueToTree(this.getExportTime()));
            }
            if (this.getExportType() != null) {
                data.set("exportType", om.valueToTree(this.getExportType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncrementalExportSpecification() != null) {
                data.set("incrementalExportSpecification", om.valueToTree(this.getIncrementalExportSpecification()));
            }
            if (this.getS3BucketOwner() != null) {
                data.set("s3BucketOwner", om.valueToTree(this.getS3BucketOwner()));
            }
            if (this.getS3Prefix() != null) {
                data.set("s3Prefix", om.valueToTree(this.getS3Prefix()));
            }
            if (this.getS3SseAlgorithm() != null) {
                data.set("s3SseAlgorithm", om.valueToTree(this.getS3SseAlgorithm()));
            }
            if (this.getS3SseKmsKeyId() != null) {
                data.set("s3SseKmsKeyId", om.valueToTree(this.getS3SseKmsKeyId()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.dynamodbTableExport.DynamodbTableExportConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DynamodbTableExportConfig.Jsii$Proxy that = (DynamodbTableExportConfig.Jsii$Proxy) o;

            if (!s3Bucket.equals(that.s3Bucket)) return false;
            if (!tableArn.equals(that.tableArn)) return false;
            if (this.exportFormat != null ? !this.exportFormat.equals(that.exportFormat) : that.exportFormat != null) return false;
            if (this.exportTime != null ? !this.exportTime.equals(that.exportTime) : that.exportTime != null) return false;
            if (this.exportType != null ? !this.exportType.equals(that.exportType) : that.exportType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.incrementalExportSpecification != null ? !this.incrementalExportSpecification.equals(that.incrementalExportSpecification) : that.incrementalExportSpecification != null) return false;
            if (this.s3BucketOwner != null ? !this.s3BucketOwner.equals(that.s3BucketOwner) : that.s3BucketOwner != null) return false;
            if (this.s3Prefix != null ? !this.s3Prefix.equals(that.s3Prefix) : that.s3Prefix != null) return false;
            if (this.s3SseAlgorithm != null ? !this.s3SseAlgorithm.equals(that.s3SseAlgorithm) : that.s3SseAlgorithm != null) return false;
            if (this.s3SseKmsKeyId != null ? !this.s3SseKmsKeyId.equals(that.s3SseKmsKeyId) : that.s3SseKmsKeyId != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.s3Bucket.hashCode();
            result = 31 * result + (this.tableArn.hashCode());
            result = 31 * result + (this.exportFormat != null ? this.exportFormat.hashCode() : 0);
            result = 31 * result + (this.exportTime != null ? this.exportTime.hashCode() : 0);
            result = 31 * result + (this.exportType != null ? this.exportType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.incrementalExportSpecification != null ? this.incrementalExportSpecification.hashCode() : 0);
            result = 31 * result + (this.s3BucketOwner != null ? this.s3BucketOwner.hashCode() : 0);
            result = 31 * result + (this.s3Prefix != null ? this.s3Prefix.hashCode() : 0);
            result = 31 * result + (this.s3SseAlgorithm != null ? this.s3SseAlgorithm.hashCode() : 0);
            result = 31 * result + (this.s3SseKmsKeyId != null ? this.s3SseKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
