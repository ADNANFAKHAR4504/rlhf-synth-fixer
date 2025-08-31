package imports.aws.dms_s3_endpoint;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint aws_dms_s3_endpoint}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.019Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsS3Endpoint.DmsS3Endpoint")
public class DmsS3Endpoint extends com.hashicorp.cdktf.TerraformResource {

    protected DmsS3Endpoint(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsS3Endpoint(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.dms_s3_endpoint.DmsS3Endpoint.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint aws_dms_s3_endpoint} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DmsS3Endpoint(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.dms_s3_endpoint.DmsS3EndpointConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DmsS3Endpoint resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DmsS3Endpoint to import. This parameter is required.
     * @param importFromId The id of the existing DmsS3Endpoint that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DmsS3Endpoint to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dms_s3_endpoint.DmsS3Endpoint.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DmsS3Endpoint resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DmsS3Endpoint to import. This parameter is required.
     * @param importFromId The id of the existing DmsS3Endpoint that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dms_s3_endpoint.DmsS3Endpoint.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.dms_s3_endpoint.DmsS3EndpointTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAddColumnName() {
        software.amazon.jsii.Kernel.call(this, "resetAddColumnName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAddTrailingPaddingCharacter() {
        software.amazon.jsii.Kernel.call(this, "resetAddTrailingPaddingCharacter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucketFolder() {
        software.amazon.jsii.Kernel.call(this, "resetBucketFolder", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCannedAclForObjects() {
        software.amazon.jsii.Kernel.call(this, "resetCannedAclForObjects", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCdcInsertsAndUpdates() {
        software.amazon.jsii.Kernel.call(this, "resetCdcInsertsAndUpdates", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCdcInsertsOnly() {
        software.amazon.jsii.Kernel.call(this, "resetCdcInsertsOnly", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCdcMaxBatchInterval() {
        software.amazon.jsii.Kernel.call(this, "resetCdcMaxBatchInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCdcMinFileSize() {
        software.amazon.jsii.Kernel.call(this, "resetCdcMinFileSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCdcPath() {
        software.amazon.jsii.Kernel.call(this, "resetCdcPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCompressionType() {
        software.amazon.jsii.Kernel.call(this, "resetCompressionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCsvDelimiter() {
        software.amazon.jsii.Kernel.call(this, "resetCsvDelimiter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCsvNoSupValue() {
        software.amazon.jsii.Kernel.call(this, "resetCsvNoSupValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCsvNullValue() {
        software.amazon.jsii.Kernel.call(this, "resetCsvNullValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCsvRowDelimiter() {
        software.amazon.jsii.Kernel.call(this, "resetCsvRowDelimiter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataFormat() {
        software.amazon.jsii.Kernel.call(this, "resetDataFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataPageSize() {
        software.amazon.jsii.Kernel.call(this, "resetDataPageSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatePartitionDelimiter() {
        software.amazon.jsii.Kernel.call(this, "resetDatePartitionDelimiter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatePartitionEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetDatePartitionEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatePartitionSequence() {
        software.amazon.jsii.Kernel.call(this, "resetDatePartitionSequence", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatePartitionTimezone() {
        software.amazon.jsii.Kernel.call(this, "resetDatePartitionTimezone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDetachTargetOnLobLookupFailureParquet() {
        software.amazon.jsii.Kernel.call(this, "resetDetachTargetOnLobLookupFailureParquet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDictPageSizeLimit() {
        software.amazon.jsii.Kernel.call(this, "resetDictPageSizeLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableStatistics() {
        software.amazon.jsii.Kernel.call(this, "resetEnableStatistics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncodingType() {
        software.amazon.jsii.Kernel.call(this, "resetEncodingType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionMode() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpectedBucketOwner() {
        software.amazon.jsii.Kernel.call(this, "resetExpectedBucketOwner", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExternalTableDefinition() {
        software.amazon.jsii.Kernel.call(this, "resetExternalTableDefinition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGlueCatalogGeneration() {
        software.amazon.jsii.Kernel.call(this, "resetGlueCatalogGeneration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIgnoreHeaderRows() {
        software.amazon.jsii.Kernel.call(this, "resetIgnoreHeaderRows", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeOpForFullLoad() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeOpForFullLoad", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxFileSize() {
        software.amazon.jsii.Kernel.call(this, "resetMaxFileSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParquetTimestampInMillisecond() {
        software.amazon.jsii.Kernel.call(this, "resetParquetTimestampInMillisecond", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParquetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetParquetVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreserveTransactions() {
        software.amazon.jsii.Kernel.call(this, "resetPreserveTransactions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRfc4180() {
        software.amazon.jsii.Kernel.call(this, "resetRfc4180", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRowGroupLength() {
        software.amazon.jsii.Kernel.call(this, "resetRowGroupLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerSideEncryptionKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetServerSideEncryptionKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslMode() {
        software.amazon.jsii.Kernel.call(this, "resetSslMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimestampColumnName() {
        software.amazon.jsii.Kernel.call(this, "resetTimestampColumnName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseCsvNoSupValue() {
        software.amazon.jsii.Kernel.call(this, "resetUseCsvNoSupValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseTaskStartTimeForFullLoadTimestamp() {
        software.amazon.jsii.Kernel.call(this, "resetUseTaskStartTimeForFullLoadTimestamp", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointArn() {
        return software.amazon.jsii.Kernel.get(this, "endpointArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "engineDisplayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExternalId() {
        return software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dms_s3_endpoint.DmsS3EndpointTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dms_s3_endpoint.DmsS3EndpointTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAddColumnNameInput() {
        return software.amazon.jsii.Kernel.get(this, "addColumnNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAddTrailingPaddingCharacterInput() {
        return software.amazon.jsii.Kernel.get(this, "addTrailingPaddingCharacterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketFolderInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketFolderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCannedAclForObjectsInput() {
        return software.amazon.jsii.Kernel.get(this, "cannedAclForObjectsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCdcInsertsAndUpdatesInput() {
        return software.amazon.jsii.Kernel.get(this, "cdcInsertsAndUpdatesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCdcInsertsOnlyInput() {
        return software.amazon.jsii.Kernel.get(this, "cdcInsertsOnlyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCdcMaxBatchIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "cdcMaxBatchIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCdcMinFileSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "cdcMinFileSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCdcPathInput() {
        return software.amazon.jsii.Kernel.get(this, "cdcPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCompressionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "compressionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCsvDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "csvDelimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCsvNoSupValueInput() {
        return software.amazon.jsii.Kernel.get(this, "csvNoSupValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCsvNullValueInput() {
        return software.amazon.jsii.Kernel.get(this, "csvNullValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCsvRowDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "csvRowDelimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "dataFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDataPageSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "dataPageSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatePartitionDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionDelimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDatePartitionEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatePartitionSequenceInput() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionSequenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatePartitionTimezoneInput() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionTimezoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDetachTargetOnLobLookupFailureParquetInput() {
        return software.amazon.jsii.Kernel.get(this, "detachTargetOnLobLookupFailureParquetInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDictPageSizeLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "dictPageSizeLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableStatisticsInput() {
        return software.amazon.jsii.Kernel.get(this, "enableStatisticsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncodingTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "encodingTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncryptionModeInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointIdInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExpectedBucketOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "expectedBucketOwnerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExternalTableDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "externalTableDefinitionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGlueCatalogGenerationInput() {
        return software.amazon.jsii.Kernel.get(this, "glueCatalogGenerationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIgnoreHeaderRowsInput() {
        return software.amazon.jsii.Kernel.get(this, "ignoreHeaderRowsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeOpForFullLoadInput() {
        return software.amazon.jsii.Kernel.get(this, "includeOpForFullLoadInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxFileSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxFileSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getParquetTimestampInMillisecondInput() {
        return software.amazon.jsii.Kernel.get(this, "parquetTimestampInMillisecondInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParquetVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "parquetVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPreserveTransactionsInput() {
        return software.amazon.jsii.Kernel.get(this, "preserveTransactionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRfc4180Input() {
        return software.amazon.jsii.Kernel.get(this, "rfc4180Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRowGroupLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "rowGroupLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServerSideEncryptionKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryptionKmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslModeInput() {
        return software.amazon.jsii.Kernel.get(this, "sslModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimestampColumnNameInput() {
        return software.amazon.jsii.Kernel.get(this, "timestampColumnNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseCsvNoSupValueInput() {
        return software.amazon.jsii.Kernel.get(this, "useCsvNoSupValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseTaskStartTimeForFullLoadTimestampInput() {
        return software.amazon.jsii.Kernel.get(this, "useTaskStartTimeForFullLoadTimestampInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAddColumnName() {
        return software.amazon.jsii.Kernel.get(this, "addColumnName", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAddColumnName(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "addColumnName", java.util.Objects.requireNonNull(value, "addColumnName is required"));
    }

    public void setAddColumnName(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "addColumnName", java.util.Objects.requireNonNull(value, "addColumnName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAddTrailingPaddingCharacter() {
        return software.amazon.jsii.Kernel.get(this, "addTrailingPaddingCharacter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAddTrailingPaddingCharacter(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "addTrailingPaddingCharacter", java.util.Objects.requireNonNull(value, "addTrailingPaddingCharacter is required"));
    }

    public void setAddTrailingPaddingCharacter(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "addTrailingPaddingCharacter", java.util.Objects.requireNonNull(value, "addTrailingPaddingCharacter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketFolder() {
        return software.amazon.jsii.Kernel.get(this, "bucketFolder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketFolder(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketFolder", java.util.Objects.requireNonNull(value, "bucketFolder is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCannedAclForObjects() {
        return software.amazon.jsii.Kernel.get(this, "cannedAclForObjects", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCannedAclForObjects(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cannedAclForObjects", java.util.Objects.requireNonNull(value, "cannedAclForObjects is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCdcInsertsAndUpdates() {
        return software.amazon.jsii.Kernel.get(this, "cdcInsertsAndUpdates", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCdcInsertsAndUpdates(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cdcInsertsAndUpdates", java.util.Objects.requireNonNull(value, "cdcInsertsAndUpdates is required"));
    }

    public void setCdcInsertsAndUpdates(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cdcInsertsAndUpdates", java.util.Objects.requireNonNull(value, "cdcInsertsAndUpdates is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCdcInsertsOnly() {
        return software.amazon.jsii.Kernel.get(this, "cdcInsertsOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCdcInsertsOnly(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cdcInsertsOnly", java.util.Objects.requireNonNull(value, "cdcInsertsOnly is required"));
    }

    public void setCdcInsertsOnly(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cdcInsertsOnly", java.util.Objects.requireNonNull(value, "cdcInsertsOnly is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCdcMaxBatchInterval() {
        return software.amazon.jsii.Kernel.get(this, "cdcMaxBatchInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCdcMaxBatchInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cdcMaxBatchInterval", java.util.Objects.requireNonNull(value, "cdcMaxBatchInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCdcMinFileSize() {
        return software.amazon.jsii.Kernel.get(this, "cdcMinFileSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCdcMinFileSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cdcMinFileSize", java.util.Objects.requireNonNull(value, "cdcMinFileSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCdcPath() {
        return software.amazon.jsii.Kernel.get(this, "cdcPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCdcPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cdcPath", java.util.Objects.requireNonNull(value, "cdcPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "certificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateArn", java.util.Objects.requireNonNull(value, "certificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompressionType() {
        return software.amazon.jsii.Kernel.get(this, "compressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCompressionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "compressionType", java.util.Objects.requireNonNull(value, "compressionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCsvDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "csvDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCsvDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "csvDelimiter", java.util.Objects.requireNonNull(value, "csvDelimiter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCsvNoSupValue() {
        return software.amazon.jsii.Kernel.get(this, "csvNoSupValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCsvNoSupValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "csvNoSupValue", java.util.Objects.requireNonNull(value, "csvNoSupValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCsvNullValue() {
        return software.amazon.jsii.Kernel.get(this, "csvNullValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCsvNullValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "csvNullValue", java.util.Objects.requireNonNull(value, "csvNullValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCsvRowDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "csvRowDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCsvRowDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "csvRowDelimiter", java.util.Objects.requireNonNull(value, "csvRowDelimiter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataFormat() {
        return software.amazon.jsii.Kernel.get(this, "dataFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataFormat", java.util.Objects.requireNonNull(value, "dataFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDataPageSize() {
        return software.amazon.jsii.Kernel.get(this, "dataPageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDataPageSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "dataPageSize", java.util.Objects.requireNonNull(value, "dataPageSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatePartitionDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatePartitionDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "datePartitionDelimiter", java.util.Objects.requireNonNull(value, "datePartitionDelimiter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDatePartitionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDatePartitionEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "datePartitionEnabled", java.util.Objects.requireNonNull(value, "datePartitionEnabled is required"));
    }

    public void setDatePartitionEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "datePartitionEnabled", java.util.Objects.requireNonNull(value, "datePartitionEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatePartitionSequence() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionSequence", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatePartitionSequence(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "datePartitionSequence", java.util.Objects.requireNonNull(value, "datePartitionSequence is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatePartitionTimezone() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionTimezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatePartitionTimezone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "datePartitionTimezone", java.util.Objects.requireNonNull(value, "datePartitionTimezone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDetachTargetOnLobLookupFailureParquet() {
        return software.amazon.jsii.Kernel.get(this, "detachTargetOnLobLookupFailureParquet", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDetachTargetOnLobLookupFailureParquet(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "detachTargetOnLobLookupFailureParquet", java.util.Objects.requireNonNull(value, "detachTargetOnLobLookupFailureParquet is required"));
    }

    public void setDetachTargetOnLobLookupFailureParquet(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "detachTargetOnLobLookupFailureParquet", java.util.Objects.requireNonNull(value, "detachTargetOnLobLookupFailureParquet is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDictPageSizeLimit() {
        return software.amazon.jsii.Kernel.get(this, "dictPageSizeLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDictPageSizeLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "dictPageSizeLimit", java.util.Objects.requireNonNull(value, "dictPageSizeLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableStatistics() {
        return software.amazon.jsii.Kernel.get(this, "enableStatistics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableStatistics(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableStatistics", java.util.Objects.requireNonNull(value, "enableStatistics is required"));
    }

    public void setEnableStatistics(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableStatistics", java.util.Objects.requireNonNull(value, "enableStatistics is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncodingType() {
        return software.amazon.jsii.Kernel.get(this, "encodingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncodingType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encodingType", java.util.Objects.requireNonNull(value, "encodingType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncryptionMode() {
        return software.amazon.jsii.Kernel.get(this, "encryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncryptionMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encryptionMode", java.util.Objects.requireNonNull(value, "encryptionMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointId() {
        return software.amazon.jsii.Kernel.get(this, "endpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointId", java.util.Objects.requireNonNull(value, "endpointId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointType() {
        return software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpointType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpointType", java.util.Objects.requireNonNull(value, "endpointType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExpectedBucketOwner() {
        return software.amazon.jsii.Kernel.get(this, "expectedBucketOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExpectedBucketOwner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "expectedBucketOwner", java.util.Objects.requireNonNull(value, "expectedBucketOwner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExternalTableDefinition() {
        return software.amazon.jsii.Kernel.get(this, "externalTableDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExternalTableDefinition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "externalTableDefinition", java.util.Objects.requireNonNull(value, "externalTableDefinition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getGlueCatalogGeneration() {
        return software.amazon.jsii.Kernel.get(this, "glueCatalogGeneration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setGlueCatalogGeneration(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "glueCatalogGeneration", java.util.Objects.requireNonNull(value, "glueCatalogGeneration is required"));
    }

    public void setGlueCatalogGeneration(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "glueCatalogGeneration", java.util.Objects.requireNonNull(value, "glueCatalogGeneration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIgnoreHeaderRows() {
        return software.amazon.jsii.Kernel.get(this, "ignoreHeaderRows", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIgnoreHeaderRows(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ignoreHeaderRows", java.util.Objects.requireNonNull(value, "ignoreHeaderRows is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeOpForFullLoad() {
        return software.amazon.jsii.Kernel.get(this, "includeOpForFullLoad", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeOpForFullLoad(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeOpForFullLoad", java.util.Objects.requireNonNull(value, "includeOpForFullLoad is required"));
    }

    public void setIncludeOpForFullLoad(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeOpForFullLoad", java.util.Objects.requireNonNull(value, "includeOpForFullLoad is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyArn", java.util.Objects.requireNonNull(value, "kmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxFileSize() {
        return software.amazon.jsii.Kernel.get(this, "maxFileSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxFileSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxFileSize", java.util.Objects.requireNonNull(value, "maxFileSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getParquetTimestampInMillisecond() {
        return software.amazon.jsii.Kernel.get(this, "parquetTimestampInMillisecond", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setParquetTimestampInMillisecond(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "parquetTimestampInMillisecond", java.util.Objects.requireNonNull(value, "parquetTimestampInMillisecond is required"));
    }

    public void setParquetTimestampInMillisecond(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "parquetTimestampInMillisecond", java.util.Objects.requireNonNull(value, "parquetTimestampInMillisecond is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParquetVersion() {
        return software.amazon.jsii.Kernel.get(this, "parquetVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParquetVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parquetVersion", java.util.Objects.requireNonNull(value, "parquetVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPreserveTransactions() {
        return software.amazon.jsii.Kernel.get(this, "preserveTransactions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPreserveTransactions(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "preserveTransactions", java.util.Objects.requireNonNull(value, "preserveTransactions is required"));
    }

    public void setPreserveTransactions(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "preserveTransactions", java.util.Objects.requireNonNull(value, "preserveTransactions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRfc4180() {
        return software.amazon.jsii.Kernel.get(this, "rfc4180", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRfc4180(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "rfc4180", java.util.Objects.requireNonNull(value, "rfc4180 is required"));
    }

    public void setRfc4180(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "rfc4180", java.util.Objects.requireNonNull(value, "rfc4180 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRowGroupLength() {
        return software.amazon.jsii.Kernel.get(this, "rowGroupLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRowGroupLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "rowGroupLength", java.util.Objects.requireNonNull(value, "rowGroupLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServerSideEncryptionKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryptionKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServerSideEncryptionKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serverSideEncryptionKmsKeyId", java.util.Objects.requireNonNull(value, "serverSideEncryptionKmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceAccessRoleArn", java.util.Objects.requireNonNull(value, "serviceAccessRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslMode() {
        return software.amazon.jsii.Kernel.get(this, "sslMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslMode", java.util.Objects.requireNonNull(value, "sslMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimestampColumnName() {
        return software.amazon.jsii.Kernel.get(this, "timestampColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimestampColumnName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timestampColumnName", java.util.Objects.requireNonNull(value, "timestampColumnName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseCsvNoSupValue() {
        return software.amazon.jsii.Kernel.get(this, "useCsvNoSupValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseCsvNoSupValue(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useCsvNoSupValue", java.util.Objects.requireNonNull(value, "useCsvNoSupValue is required"));
    }

    public void setUseCsvNoSupValue(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useCsvNoSupValue", java.util.Objects.requireNonNull(value, "useCsvNoSupValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseTaskStartTimeForFullLoadTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "useTaskStartTimeForFullLoadTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseTaskStartTimeForFullLoadTimestamp(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useTaskStartTimeForFullLoadTimestamp", java.util.Objects.requireNonNull(value, "useTaskStartTimeForFullLoadTimestamp is required"));
    }

    public void setUseTaskStartTimeForFullLoadTimestamp(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useTaskStartTimeForFullLoadTimestamp", java.util.Objects.requireNonNull(value, "useTaskStartTimeForFullLoadTimestamp is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.dms_s3_endpoint.DmsS3Endpoint}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.dms_s3_endpoint.DmsS3Endpoint> {
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
        private final imports.aws.dms_s3_endpoint.DmsS3EndpointConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.dms_s3_endpoint.DmsS3EndpointConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#bucket_name DmsS3Endpoint#bucket_name}.
         * <p>
         * @return {@code this}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#bucket_name DmsS3Endpoint#bucket_name}. This parameter is required.
         */
        public Builder bucketName(final java.lang.String bucketName) {
            this.config.bucketName(bucketName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#endpoint_id DmsS3Endpoint#endpoint_id}.
         * <p>
         * @return {@code this}
         * @param endpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#endpoint_id DmsS3Endpoint#endpoint_id}. This parameter is required.
         */
        public Builder endpointId(final java.lang.String endpointId) {
            this.config.endpointId(endpointId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#endpoint_type DmsS3Endpoint#endpoint_type}.
         * <p>
         * @return {@code this}
         * @param endpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#endpoint_type DmsS3Endpoint#endpoint_type}. This parameter is required.
         */
        public Builder endpointType(final java.lang.String endpointType) {
            this.config.endpointType(endpointType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#service_access_role_arn DmsS3Endpoint#service_access_role_arn}.
         * <p>
         * @return {@code this}
         * @param serviceAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#service_access_role_arn DmsS3Endpoint#service_access_role_arn}. This parameter is required.
         */
        public Builder serviceAccessRoleArn(final java.lang.String serviceAccessRoleArn) {
            this.config.serviceAccessRoleArn(serviceAccessRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_column_name DmsS3Endpoint#add_column_name}.
         * <p>
         * @return {@code this}
         * @param addColumnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_column_name DmsS3Endpoint#add_column_name}. This parameter is required.
         */
        public Builder addColumnName(final java.lang.Boolean addColumnName) {
            this.config.addColumnName(addColumnName);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_column_name DmsS3Endpoint#add_column_name}.
         * <p>
         * @return {@code this}
         * @param addColumnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_column_name DmsS3Endpoint#add_column_name}. This parameter is required.
         */
        public Builder addColumnName(final com.hashicorp.cdktf.IResolvable addColumnName) {
            this.config.addColumnName(addColumnName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_trailing_padding_character DmsS3Endpoint#add_trailing_padding_character}.
         * <p>
         * @return {@code this}
         * @param addTrailingPaddingCharacter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_trailing_padding_character DmsS3Endpoint#add_trailing_padding_character}. This parameter is required.
         */
        public Builder addTrailingPaddingCharacter(final java.lang.Boolean addTrailingPaddingCharacter) {
            this.config.addTrailingPaddingCharacter(addTrailingPaddingCharacter);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_trailing_padding_character DmsS3Endpoint#add_trailing_padding_character}.
         * <p>
         * @return {@code this}
         * @param addTrailingPaddingCharacter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#add_trailing_padding_character DmsS3Endpoint#add_trailing_padding_character}. This parameter is required.
         */
        public Builder addTrailingPaddingCharacter(final com.hashicorp.cdktf.IResolvable addTrailingPaddingCharacter) {
            this.config.addTrailingPaddingCharacter(addTrailingPaddingCharacter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#bucket_folder DmsS3Endpoint#bucket_folder}.
         * <p>
         * @return {@code this}
         * @param bucketFolder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#bucket_folder DmsS3Endpoint#bucket_folder}. This parameter is required.
         */
        public Builder bucketFolder(final java.lang.String bucketFolder) {
            this.config.bucketFolder(bucketFolder);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#canned_acl_for_objects DmsS3Endpoint#canned_acl_for_objects}.
         * <p>
         * @return {@code this}
         * @param cannedAclForObjects Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#canned_acl_for_objects DmsS3Endpoint#canned_acl_for_objects}. This parameter is required.
         */
        public Builder cannedAclForObjects(final java.lang.String cannedAclForObjects) {
            this.config.cannedAclForObjects(cannedAclForObjects);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_and_updates DmsS3Endpoint#cdc_inserts_and_updates}.
         * <p>
         * @return {@code this}
         * @param cdcInsertsAndUpdates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_and_updates DmsS3Endpoint#cdc_inserts_and_updates}. This parameter is required.
         */
        public Builder cdcInsertsAndUpdates(final java.lang.Boolean cdcInsertsAndUpdates) {
            this.config.cdcInsertsAndUpdates(cdcInsertsAndUpdates);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_and_updates DmsS3Endpoint#cdc_inserts_and_updates}.
         * <p>
         * @return {@code this}
         * @param cdcInsertsAndUpdates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_and_updates DmsS3Endpoint#cdc_inserts_and_updates}. This parameter is required.
         */
        public Builder cdcInsertsAndUpdates(final com.hashicorp.cdktf.IResolvable cdcInsertsAndUpdates) {
            this.config.cdcInsertsAndUpdates(cdcInsertsAndUpdates);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_only DmsS3Endpoint#cdc_inserts_only}.
         * <p>
         * @return {@code this}
         * @param cdcInsertsOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_only DmsS3Endpoint#cdc_inserts_only}. This parameter is required.
         */
        public Builder cdcInsertsOnly(final java.lang.Boolean cdcInsertsOnly) {
            this.config.cdcInsertsOnly(cdcInsertsOnly);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_only DmsS3Endpoint#cdc_inserts_only}.
         * <p>
         * @return {@code this}
         * @param cdcInsertsOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_inserts_only DmsS3Endpoint#cdc_inserts_only}. This parameter is required.
         */
        public Builder cdcInsertsOnly(final com.hashicorp.cdktf.IResolvable cdcInsertsOnly) {
            this.config.cdcInsertsOnly(cdcInsertsOnly);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_max_batch_interval DmsS3Endpoint#cdc_max_batch_interval}.
         * <p>
         * @return {@code this}
         * @param cdcMaxBatchInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_max_batch_interval DmsS3Endpoint#cdc_max_batch_interval}. This parameter is required.
         */
        public Builder cdcMaxBatchInterval(final java.lang.Number cdcMaxBatchInterval) {
            this.config.cdcMaxBatchInterval(cdcMaxBatchInterval);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_min_file_size DmsS3Endpoint#cdc_min_file_size}.
         * <p>
         * @return {@code this}
         * @param cdcMinFileSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_min_file_size DmsS3Endpoint#cdc_min_file_size}. This parameter is required.
         */
        public Builder cdcMinFileSize(final java.lang.Number cdcMinFileSize) {
            this.config.cdcMinFileSize(cdcMinFileSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_path DmsS3Endpoint#cdc_path}.
         * <p>
         * @return {@code this}
         * @param cdcPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#cdc_path DmsS3Endpoint#cdc_path}. This parameter is required.
         */
        public Builder cdcPath(final java.lang.String cdcPath) {
            this.config.cdcPath(cdcPath);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#certificate_arn DmsS3Endpoint#certificate_arn}.
         * <p>
         * @return {@code this}
         * @param certificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#certificate_arn DmsS3Endpoint#certificate_arn}. This parameter is required.
         */
        public Builder certificateArn(final java.lang.String certificateArn) {
            this.config.certificateArn(certificateArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#compression_type DmsS3Endpoint#compression_type}.
         * <p>
         * @return {@code this}
         * @param compressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#compression_type DmsS3Endpoint#compression_type}. This parameter is required.
         */
        public Builder compressionType(final java.lang.String compressionType) {
            this.config.compressionType(compressionType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_delimiter DmsS3Endpoint#csv_delimiter}.
         * <p>
         * @return {@code this}
         * @param csvDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_delimiter DmsS3Endpoint#csv_delimiter}. This parameter is required.
         */
        public Builder csvDelimiter(final java.lang.String csvDelimiter) {
            this.config.csvDelimiter(csvDelimiter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_no_sup_value DmsS3Endpoint#csv_no_sup_value}.
         * <p>
         * @return {@code this}
         * @param csvNoSupValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_no_sup_value DmsS3Endpoint#csv_no_sup_value}. This parameter is required.
         */
        public Builder csvNoSupValue(final java.lang.String csvNoSupValue) {
            this.config.csvNoSupValue(csvNoSupValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_null_value DmsS3Endpoint#csv_null_value}.
         * <p>
         * @return {@code this}
         * @param csvNullValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_null_value DmsS3Endpoint#csv_null_value}. This parameter is required.
         */
        public Builder csvNullValue(final java.lang.String csvNullValue) {
            this.config.csvNullValue(csvNullValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_row_delimiter DmsS3Endpoint#csv_row_delimiter}.
         * <p>
         * @return {@code this}
         * @param csvRowDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#csv_row_delimiter DmsS3Endpoint#csv_row_delimiter}. This parameter is required.
         */
        public Builder csvRowDelimiter(final java.lang.String csvRowDelimiter) {
            this.config.csvRowDelimiter(csvRowDelimiter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#data_format DmsS3Endpoint#data_format}.
         * <p>
         * @return {@code this}
         * @param dataFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#data_format DmsS3Endpoint#data_format}. This parameter is required.
         */
        public Builder dataFormat(final java.lang.String dataFormat) {
            this.config.dataFormat(dataFormat);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#data_page_size DmsS3Endpoint#data_page_size}.
         * <p>
         * @return {@code this}
         * @param dataPageSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#data_page_size DmsS3Endpoint#data_page_size}. This parameter is required.
         */
        public Builder dataPageSize(final java.lang.Number dataPageSize) {
            this.config.dataPageSize(dataPageSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_delimiter DmsS3Endpoint#date_partition_delimiter}.
         * <p>
         * @return {@code this}
         * @param datePartitionDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_delimiter DmsS3Endpoint#date_partition_delimiter}. This parameter is required.
         */
        public Builder datePartitionDelimiter(final java.lang.String datePartitionDelimiter) {
            this.config.datePartitionDelimiter(datePartitionDelimiter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_enabled DmsS3Endpoint#date_partition_enabled}.
         * <p>
         * @return {@code this}
         * @param datePartitionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_enabled DmsS3Endpoint#date_partition_enabled}. This parameter is required.
         */
        public Builder datePartitionEnabled(final java.lang.Boolean datePartitionEnabled) {
            this.config.datePartitionEnabled(datePartitionEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_enabled DmsS3Endpoint#date_partition_enabled}.
         * <p>
         * @return {@code this}
         * @param datePartitionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_enabled DmsS3Endpoint#date_partition_enabled}. This parameter is required.
         */
        public Builder datePartitionEnabled(final com.hashicorp.cdktf.IResolvable datePartitionEnabled) {
            this.config.datePartitionEnabled(datePartitionEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_sequence DmsS3Endpoint#date_partition_sequence}.
         * <p>
         * @return {@code this}
         * @param datePartitionSequence Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_sequence DmsS3Endpoint#date_partition_sequence}. This parameter is required.
         */
        public Builder datePartitionSequence(final java.lang.String datePartitionSequence) {
            this.config.datePartitionSequence(datePartitionSequence);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_timezone DmsS3Endpoint#date_partition_timezone}.
         * <p>
         * @return {@code this}
         * @param datePartitionTimezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#date_partition_timezone DmsS3Endpoint#date_partition_timezone}. This parameter is required.
         */
        public Builder datePartitionTimezone(final java.lang.String datePartitionTimezone) {
            this.config.datePartitionTimezone(datePartitionTimezone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#detach_target_on_lob_lookup_failure_parquet DmsS3Endpoint#detach_target_on_lob_lookup_failure_parquet}.
         * <p>
         * @return {@code this}
         * @param detachTargetOnLobLookupFailureParquet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#detach_target_on_lob_lookup_failure_parquet DmsS3Endpoint#detach_target_on_lob_lookup_failure_parquet}. This parameter is required.
         */
        public Builder detachTargetOnLobLookupFailureParquet(final java.lang.Boolean detachTargetOnLobLookupFailureParquet) {
            this.config.detachTargetOnLobLookupFailureParquet(detachTargetOnLobLookupFailureParquet);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#detach_target_on_lob_lookup_failure_parquet DmsS3Endpoint#detach_target_on_lob_lookup_failure_parquet}.
         * <p>
         * @return {@code this}
         * @param detachTargetOnLobLookupFailureParquet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#detach_target_on_lob_lookup_failure_parquet DmsS3Endpoint#detach_target_on_lob_lookup_failure_parquet}. This parameter is required.
         */
        public Builder detachTargetOnLobLookupFailureParquet(final com.hashicorp.cdktf.IResolvable detachTargetOnLobLookupFailureParquet) {
            this.config.detachTargetOnLobLookupFailureParquet(detachTargetOnLobLookupFailureParquet);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#dict_page_size_limit DmsS3Endpoint#dict_page_size_limit}.
         * <p>
         * @return {@code this}
         * @param dictPageSizeLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#dict_page_size_limit DmsS3Endpoint#dict_page_size_limit}. This parameter is required.
         */
        public Builder dictPageSizeLimit(final java.lang.Number dictPageSizeLimit) {
            this.config.dictPageSizeLimit(dictPageSizeLimit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#enable_statistics DmsS3Endpoint#enable_statistics}.
         * <p>
         * @return {@code this}
         * @param enableStatistics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#enable_statistics DmsS3Endpoint#enable_statistics}. This parameter is required.
         */
        public Builder enableStatistics(final java.lang.Boolean enableStatistics) {
            this.config.enableStatistics(enableStatistics);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#enable_statistics DmsS3Endpoint#enable_statistics}.
         * <p>
         * @return {@code this}
         * @param enableStatistics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#enable_statistics DmsS3Endpoint#enable_statistics}. This parameter is required.
         */
        public Builder enableStatistics(final com.hashicorp.cdktf.IResolvable enableStatistics) {
            this.config.enableStatistics(enableStatistics);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#encoding_type DmsS3Endpoint#encoding_type}.
         * <p>
         * @return {@code this}
         * @param encodingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#encoding_type DmsS3Endpoint#encoding_type}. This parameter is required.
         */
        public Builder encodingType(final java.lang.String encodingType) {
            this.config.encodingType(encodingType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#encryption_mode DmsS3Endpoint#encryption_mode}.
         * <p>
         * @return {@code this}
         * @param encryptionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#encryption_mode DmsS3Endpoint#encryption_mode}. This parameter is required.
         */
        public Builder encryptionMode(final java.lang.String encryptionMode) {
            this.config.encryptionMode(encryptionMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#expected_bucket_owner DmsS3Endpoint#expected_bucket_owner}.
         * <p>
         * @return {@code this}
         * @param expectedBucketOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#expected_bucket_owner DmsS3Endpoint#expected_bucket_owner}. This parameter is required.
         */
        public Builder expectedBucketOwner(final java.lang.String expectedBucketOwner) {
            this.config.expectedBucketOwner(expectedBucketOwner);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#external_table_definition DmsS3Endpoint#external_table_definition}.
         * <p>
         * @return {@code this}
         * @param externalTableDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#external_table_definition DmsS3Endpoint#external_table_definition}. This parameter is required.
         */
        public Builder externalTableDefinition(final java.lang.String externalTableDefinition) {
            this.config.externalTableDefinition(externalTableDefinition);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#glue_catalog_generation DmsS3Endpoint#glue_catalog_generation}.
         * <p>
         * @return {@code this}
         * @param glueCatalogGeneration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#glue_catalog_generation DmsS3Endpoint#glue_catalog_generation}. This parameter is required.
         */
        public Builder glueCatalogGeneration(final java.lang.Boolean glueCatalogGeneration) {
            this.config.glueCatalogGeneration(glueCatalogGeneration);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#glue_catalog_generation DmsS3Endpoint#glue_catalog_generation}.
         * <p>
         * @return {@code this}
         * @param glueCatalogGeneration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#glue_catalog_generation DmsS3Endpoint#glue_catalog_generation}. This parameter is required.
         */
        public Builder glueCatalogGeneration(final com.hashicorp.cdktf.IResolvable glueCatalogGeneration) {
            this.config.glueCatalogGeneration(glueCatalogGeneration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#id DmsS3Endpoint#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#id DmsS3Endpoint#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#ignore_header_rows DmsS3Endpoint#ignore_header_rows}.
         * <p>
         * @return {@code this}
         * @param ignoreHeaderRows Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#ignore_header_rows DmsS3Endpoint#ignore_header_rows}. This parameter is required.
         */
        public Builder ignoreHeaderRows(final java.lang.Number ignoreHeaderRows) {
            this.config.ignoreHeaderRows(ignoreHeaderRows);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#include_op_for_full_load DmsS3Endpoint#include_op_for_full_load}.
         * <p>
         * @return {@code this}
         * @param includeOpForFullLoad Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#include_op_for_full_load DmsS3Endpoint#include_op_for_full_load}. This parameter is required.
         */
        public Builder includeOpForFullLoad(final java.lang.Boolean includeOpForFullLoad) {
            this.config.includeOpForFullLoad(includeOpForFullLoad);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#include_op_for_full_load DmsS3Endpoint#include_op_for_full_load}.
         * <p>
         * @return {@code this}
         * @param includeOpForFullLoad Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#include_op_for_full_load DmsS3Endpoint#include_op_for_full_load}. This parameter is required.
         */
        public Builder includeOpForFullLoad(final com.hashicorp.cdktf.IResolvable includeOpForFullLoad) {
            this.config.includeOpForFullLoad(includeOpForFullLoad);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#kms_key_arn DmsS3Endpoint#kms_key_arn}.
         * <p>
         * @return {@code this}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#kms_key_arn DmsS3Endpoint#kms_key_arn}. This parameter is required.
         */
        public Builder kmsKeyArn(final java.lang.String kmsKeyArn) {
            this.config.kmsKeyArn(kmsKeyArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#max_file_size DmsS3Endpoint#max_file_size}.
         * <p>
         * @return {@code this}
         * @param maxFileSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#max_file_size DmsS3Endpoint#max_file_size}. This parameter is required.
         */
        public Builder maxFileSize(final java.lang.Number maxFileSize) {
            this.config.maxFileSize(maxFileSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_timestamp_in_millisecond DmsS3Endpoint#parquet_timestamp_in_millisecond}.
         * <p>
         * @return {@code this}
         * @param parquetTimestampInMillisecond Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_timestamp_in_millisecond DmsS3Endpoint#parquet_timestamp_in_millisecond}. This parameter is required.
         */
        public Builder parquetTimestampInMillisecond(final java.lang.Boolean parquetTimestampInMillisecond) {
            this.config.parquetTimestampInMillisecond(parquetTimestampInMillisecond);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_timestamp_in_millisecond DmsS3Endpoint#parquet_timestamp_in_millisecond}.
         * <p>
         * @return {@code this}
         * @param parquetTimestampInMillisecond Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_timestamp_in_millisecond DmsS3Endpoint#parquet_timestamp_in_millisecond}. This parameter is required.
         */
        public Builder parquetTimestampInMillisecond(final com.hashicorp.cdktf.IResolvable parquetTimestampInMillisecond) {
            this.config.parquetTimestampInMillisecond(parquetTimestampInMillisecond);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_version DmsS3Endpoint#parquet_version}.
         * <p>
         * @return {@code this}
         * @param parquetVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#parquet_version DmsS3Endpoint#parquet_version}. This parameter is required.
         */
        public Builder parquetVersion(final java.lang.String parquetVersion) {
            this.config.parquetVersion(parquetVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#preserve_transactions DmsS3Endpoint#preserve_transactions}.
         * <p>
         * @return {@code this}
         * @param preserveTransactions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#preserve_transactions DmsS3Endpoint#preserve_transactions}. This parameter is required.
         */
        public Builder preserveTransactions(final java.lang.Boolean preserveTransactions) {
            this.config.preserveTransactions(preserveTransactions);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#preserve_transactions DmsS3Endpoint#preserve_transactions}.
         * <p>
         * @return {@code this}
         * @param preserveTransactions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#preserve_transactions DmsS3Endpoint#preserve_transactions}. This parameter is required.
         */
        public Builder preserveTransactions(final com.hashicorp.cdktf.IResolvable preserveTransactions) {
            this.config.preserveTransactions(preserveTransactions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#rfc_4180 DmsS3Endpoint#rfc_4180}.
         * <p>
         * @return {@code this}
         * @param rfc4180 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#rfc_4180 DmsS3Endpoint#rfc_4180}. This parameter is required.
         */
        public Builder rfc4180(final java.lang.Boolean rfc4180) {
            this.config.rfc4180(rfc4180);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#rfc_4180 DmsS3Endpoint#rfc_4180}.
         * <p>
         * @return {@code this}
         * @param rfc4180 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#rfc_4180 DmsS3Endpoint#rfc_4180}. This parameter is required.
         */
        public Builder rfc4180(final com.hashicorp.cdktf.IResolvable rfc4180) {
            this.config.rfc4180(rfc4180);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#row_group_length DmsS3Endpoint#row_group_length}.
         * <p>
         * @return {@code this}
         * @param rowGroupLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#row_group_length DmsS3Endpoint#row_group_length}. This parameter is required.
         */
        public Builder rowGroupLength(final java.lang.Number rowGroupLength) {
            this.config.rowGroupLength(rowGroupLength);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#server_side_encryption_kms_key_id DmsS3Endpoint#server_side_encryption_kms_key_id}.
         * <p>
         * @return {@code this}
         * @param serverSideEncryptionKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#server_side_encryption_kms_key_id DmsS3Endpoint#server_side_encryption_kms_key_id}. This parameter is required.
         */
        public Builder serverSideEncryptionKmsKeyId(final java.lang.String serverSideEncryptionKmsKeyId) {
            this.config.serverSideEncryptionKmsKeyId(serverSideEncryptionKmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#ssl_mode DmsS3Endpoint#ssl_mode}.
         * <p>
         * @return {@code this}
         * @param sslMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#ssl_mode DmsS3Endpoint#ssl_mode}. This parameter is required.
         */
        public Builder sslMode(final java.lang.String sslMode) {
            this.config.sslMode(sslMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#tags DmsS3Endpoint#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#tags DmsS3Endpoint#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#tags_all DmsS3Endpoint#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#tags_all DmsS3Endpoint#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#timeouts DmsS3Endpoint#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.dms_s3_endpoint.DmsS3EndpointTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#timestamp_column_name DmsS3Endpoint#timestamp_column_name}.
         * <p>
         * @return {@code this}
         * @param timestampColumnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#timestamp_column_name DmsS3Endpoint#timestamp_column_name}. This parameter is required.
         */
        public Builder timestampColumnName(final java.lang.String timestampColumnName) {
            this.config.timestampColumnName(timestampColumnName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_csv_no_sup_value DmsS3Endpoint#use_csv_no_sup_value}.
         * <p>
         * @return {@code this}
         * @param useCsvNoSupValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_csv_no_sup_value DmsS3Endpoint#use_csv_no_sup_value}. This parameter is required.
         */
        public Builder useCsvNoSupValue(final java.lang.Boolean useCsvNoSupValue) {
            this.config.useCsvNoSupValue(useCsvNoSupValue);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_csv_no_sup_value DmsS3Endpoint#use_csv_no_sup_value}.
         * <p>
         * @return {@code this}
         * @param useCsvNoSupValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_csv_no_sup_value DmsS3Endpoint#use_csv_no_sup_value}. This parameter is required.
         */
        public Builder useCsvNoSupValue(final com.hashicorp.cdktf.IResolvable useCsvNoSupValue) {
            this.config.useCsvNoSupValue(useCsvNoSupValue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_task_start_time_for_full_load_timestamp DmsS3Endpoint#use_task_start_time_for_full_load_timestamp}.
         * <p>
         * @return {@code this}
         * @param useTaskStartTimeForFullLoadTimestamp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_task_start_time_for_full_load_timestamp DmsS3Endpoint#use_task_start_time_for_full_load_timestamp}. This parameter is required.
         */
        public Builder useTaskStartTimeForFullLoadTimestamp(final java.lang.Boolean useTaskStartTimeForFullLoadTimestamp) {
            this.config.useTaskStartTimeForFullLoadTimestamp(useTaskStartTimeForFullLoadTimestamp);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_task_start_time_for_full_load_timestamp DmsS3Endpoint#use_task_start_time_for_full_load_timestamp}.
         * <p>
         * @return {@code this}
         * @param useTaskStartTimeForFullLoadTimestamp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_s3_endpoint#use_task_start_time_for_full_load_timestamp DmsS3Endpoint#use_task_start_time_for_full_load_timestamp}. This parameter is required.
         */
        public Builder useTaskStartTimeForFullLoadTimestamp(final com.hashicorp.cdktf.IResolvable useTaskStartTimeForFullLoadTimestamp) {
            this.config.useTaskStartTimeForFullLoadTimestamp(useTaskStartTimeForFullLoadTimestamp);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.dms_s3_endpoint.DmsS3Endpoint}.
         */
        @Override
        public imports.aws.dms_s3_endpoint.DmsS3Endpoint build() {
            return new imports.aws.dms_s3_endpoint.DmsS3Endpoint(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
