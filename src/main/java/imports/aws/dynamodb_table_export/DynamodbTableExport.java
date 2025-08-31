package imports.aws.dynamodb_table_export;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export aws_dynamodb_table_export}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.055Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dynamodbTableExport.DynamodbTableExport")
public class DynamodbTableExport extends com.hashicorp.cdktf.TerraformResource {

    protected DynamodbTableExport(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DynamodbTableExport(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.dynamodb_table_export.DynamodbTableExport.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export aws_dynamodb_table_export} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DynamodbTableExport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table_export.DynamodbTableExportConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DynamodbTableExport resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DynamodbTableExport to import. This parameter is required.
     * @param importFromId The id of the existing DynamodbTableExport that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DynamodbTableExport to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dynamodb_table_export.DynamodbTableExport.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DynamodbTableExport resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DynamodbTableExport to import. This parameter is required.
     * @param importFromId The id of the existing DynamodbTableExport that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dynamodb_table_export.DynamodbTableExport.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putIncrementalExportSpecification(final @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putIncrementalExportSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table_export.DynamodbTableExportTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetExportFormat() {
        software.amazon.jsii.Kernel.call(this, "resetExportFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExportTime() {
        software.amazon.jsii.Kernel.call(this, "resetExportTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExportType() {
        software.amazon.jsii.Kernel.call(this, "resetExportType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncrementalExportSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetIncrementalExportSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3BucketOwner() {
        software.amazon.jsii.Kernel.call(this, "resetS3BucketOwner", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Prefix() {
        software.amazon.jsii.Kernel.call(this, "resetS3Prefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3SseAlgorithm() {
        software.amazon.jsii.Kernel.call(this, "resetS3SseAlgorithm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3SseKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetS3SseKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBilledSizeInBytes() {
        return software.amazon.jsii.Kernel.get(this, "billedSizeInBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndTime() {
        return software.amazon.jsii.Kernel.get(this, "endTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExportStatus() {
        return software.amazon.jsii.Kernel.get(this, "exportStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecificationOutputReference getIncrementalExportSpecification() {
        return software.amazon.jsii.Kernel.get(this, "incrementalExportSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getItemCount() {
        return software.amazon.jsii.Kernel.get(this, "itemCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getManifestFilesS3Key() {
        return software.amazon.jsii.Kernel.get(this, "manifestFilesS3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartTime() {
        return software.amazon.jsii.Kernel.get(this, "startTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dynamodb_table_export.DynamodbTableExportTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table_export.DynamodbTableExportTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExportFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "exportFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExportTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "exportTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExportTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "exportTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification getIncrementalExportSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "incrementalExportSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketOwnerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3PrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "s3PrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3SseAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "s3SseAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3SseKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "s3SseKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTableArnInput() {
        return software.amazon.jsii.Kernel.get(this, "tableArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExportFormat() {
        return software.amazon.jsii.Kernel.get(this, "exportFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExportFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exportFormat", java.util.Objects.requireNonNull(value, "exportFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExportTime() {
        return software.amazon.jsii.Kernel.get(this, "exportTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExportTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exportTime", java.util.Objects.requireNonNull(value, "exportTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExportType() {
        return software.amazon.jsii.Kernel.get(this, "exportType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExportType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exportType", java.util.Objects.requireNonNull(value, "exportType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Bucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Bucket", java.util.Objects.requireNonNull(value, "s3Bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3BucketOwner() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3BucketOwner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3BucketOwner", java.util.Objects.requireNonNull(value, "s3BucketOwner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Prefix() {
        return software.amazon.jsii.Kernel.get(this, "s3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Prefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Prefix", java.util.Objects.requireNonNull(value, "s3Prefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3SseAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "s3SseAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3SseAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3SseAlgorithm", java.util.Objects.requireNonNull(value, "s3SseAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3SseKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "s3SseKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3SseKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3SseKmsKeyId", java.util.Objects.requireNonNull(value, "s3SseKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTableArn() {
        return software.amazon.jsii.Kernel.get(this, "tableArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTableArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tableArn", java.util.Objects.requireNonNull(value, "tableArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.dynamodb_table_export.DynamodbTableExport}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.dynamodb_table_export.DynamodbTableExport> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.dynamodb_table_export.DynamodbTableExportConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.dynamodb_table_export.DynamodbTableExportConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_bucket DynamodbTableExport#s3_bucket}.
         * <p>
         * @return {@code this}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_bucket DynamodbTableExport#s3_bucket}. This parameter is required.
         */
        public Builder s3Bucket(final java.lang.String s3Bucket) {
            this.config.s3Bucket(s3Bucket);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#table_arn DynamodbTableExport#table_arn}.
         * <p>
         * @return {@code this}
         * @param tableArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#table_arn DynamodbTableExport#table_arn}. This parameter is required.
         */
        public Builder tableArn(final java.lang.String tableArn) {
            this.config.tableArn(tableArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_format DynamodbTableExport#export_format}.
         * <p>
         * @return {@code this}
         * @param exportFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_format DynamodbTableExport#export_format}. This parameter is required.
         */
        public Builder exportFormat(final java.lang.String exportFormat) {
            this.config.exportFormat(exportFormat);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_time DynamodbTableExport#export_time}.
         * <p>
         * @return {@code this}
         * @param exportTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_time DynamodbTableExport#export_time}. This parameter is required.
         */
        public Builder exportTime(final java.lang.String exportTime) {
            this.config.exportTime(exportTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_type DynamodbTableExport#export_type}.
         * <p>
         * @return {@code this}
         * @param exportType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#export_type DynamodbTableExport#export_type}. This parameter is required.
         */
        public Builder exportType(final java.lang.String exportType) {
            this.config.exportType(exportType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#id DynamodbTableExport#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#id DynamodbTableExport#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * incremental_export_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#incremental_export_specification DynamodbTableExport#incremental_export_specification}
         * <p>
         * @return {@code this}
         * @param incrementalExportSpecification incremental_export_specification block. This parameter is required.
         */
        public Builder incrementalExportSpecification(final imports.aws.dynamodb_table_export.DynamodbTableExportIncrementalExportSpecification incrementalExportSpecification) {
            this.config.incrementalExportSpecification(incrementalExportSpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_bucket_owner DynamodbTableExport#s3_bucket_owner}.
         * <p>
         * @return {@code this}
         * @param s3BucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_bucket_owner DynamodbTableExport#s3_bucket_owner}. This parameter is required.
         */
        public Builder s3BucketOwner(final java.lang.String s3BucketOwner) {
            this.config.s3BucketOwner(s3BucketOwner);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_prefix DynamodbTableExport#s3_prefix}.
         * <p>
         * @return {@code this}
         * @param s3Prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_prefix DynamodbTableExport#s3_prefix}. This parameter is required.
         */
        public Builder s3Prefix(final java.lang.String s3Prefix) {
            this.config.s3Prefix(s3Prefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_sse_algorithm DynamodbTableExport#s3_sse_algorithm}.
         * <p>
         * @return {@code this}
         * @param s3SseAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_sse_algorithm DynamodbTableExport#s3_sse_algorithm}. This parameter is required.
         */
        public Builder s3SseAlgorithm(final java.lang.String s3SseAlgorithm) {
            this.config.s3SseAlgorithm(s3SseAlgorithm);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_sse_kms_key_id DynamodbTableExport#s3_sse_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param s3SseKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#s3_sse_kms_key_id DynamodbTableExport#s3_sse_kms_key_id}. This parameter is required.
         */
        public Builder s3SseKmsKeyId(final java.lang.String s3SseKmsKeyId) {
            this.config.s3SseKmsKeyId(s3SseKmsKeyId);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dynamodb_table_export#timeouts DynamodbTableExport#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.dynamodb_table_export.DynamodbTableExportTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.dynamodb_table_export.DynamodbTableExport}.
         */
        @Override
        public imports.aws.dynamodb_table_export.DynamodbTableExport build() {
            return new imports.aws.dynamodb_table_export.DynamodbTableExport(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
