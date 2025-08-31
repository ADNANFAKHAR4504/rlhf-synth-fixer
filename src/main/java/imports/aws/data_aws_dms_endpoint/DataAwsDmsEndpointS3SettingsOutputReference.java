package imports.aws.data_aws_dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.555Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsDmsEndpoint.DataAwsDmsEndpointS3SettingsOutputReference")
public class DataAwsDmsEndpointS3SettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsDmsEndpointS3SettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsDmsEndpointS3SettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsDmsEndpointS3SettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getAddColumnName() {
        return software.amazon.jsii.Kernel.get(this, "addColumnName", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketFolder() {
        return software.amazon.jsii.Kernel.get(this, "bucketFolder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCannedAclForObjects() {
        return software.amazon.jsii.Kernel.get(this, "cannedAclForObjects", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getCdcInsertsAndUpdates() {
        return software.amazon.jsii.Kernel.get(this, "cdcInsertsAndUpdates", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getCdcInsertsOnly() {
        return software.amazon.jsii.Kernel.get(this, "cdcInsertsOnly", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCdcMaxBatchInterval() {
        return software.amazon.jsii.Kernel.get(this, "cdcMaxBatchInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCdcMinFileSize() {
        return software.amazon.jsii.Kernel.get(this, "cdcMinFileSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCdcPath() {
        return software.amazon.jsii.Kernel.get(this, "cdcPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCompressionType() {
        return software.amazon.jsii.Kernel.get(this, "compressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCsvDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "csvDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCsvNoSupValue() {
        return software.amazon.jsii.Kernel.get(this, "csvNoSupValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCsvNullValue() {
        return software.amazon.jsii.Kernel.get(this, "csvNullValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCsvRowDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "csvRowDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataFormat() {
        return software.amazon.jsii.Kernel.get(this, "dataFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDataPageSize() {
        return software.amazon.jsii.Kernel.get(this, "dataPageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatePartitionDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getDatePartitionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatePartitionSequence() {
        return software.amazon.jsii.Kernel.get(this, "datePartitionSequence", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDictPageSizeLimit() {
        return software.amazon.jsii.Kernel.get(this, "dictPageSizeLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getEnableStatistics() {
        return software.amazon.jsii.Kernel.get(this, "enableStatistics", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncodingType() {
        return software.amazon.jsii.Kernel.get(this, "encodingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncryptionMode() {
        return software.amazon.jsii.Kernel.get(this, "encryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExternalTableDefinition() {
        return software.amazon.jsii.Kernel.get(this, "externalTableDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getGlueCatalogGeneration() {
        return software.amazon.jsii.Kernel.get(this, "glueCatalogGeneration", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIgnoreHeaderRows() {
        return software.amazon.jsii.Kernel.get(this, "ignoreHeaderRows", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIgnoreHeadersRow() {
        return software.amazon.jsii.Kernel.get(this, "ignoreHeadersRow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getIncludeOpForFullLoad() {
        return software.amazon.jsii.Kernel.get(this, "includeOpForFullLoad", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxFileSize() {
        return software.amazon.jsii.Kernel.get(this, "maxFileSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getParquetTimestampInMillisecond() {
        return software.amazon.jsii.Kernel.get(this, "parquetTimestampInMillisecond", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParquetVersion() {
        return software.amazon.jsii.Kernel.get(this, "parquetVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getPreserveTransactions() {
        return software.amazon.jsii.Kernel.get(this, "preserveTransactions", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getRfc4180() {
        return software.amazon.jsii.Kernel.get(this, "rfc4180", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRowGroupLength() {
        return software.amazon.jsii.Kernel.get(this, "rowGroupLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServerSideEncryptionKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "serverSideEncryptionKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimestampColumnName() {
        return software.amazon.jsii.Kernel.get(this, "timestampColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getUseCsvNoSupValue() {
        return software.amazon.jsii.Kernel.get(this, "useCsvNoSupValue", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getUseTaskStartTimeForFullLoadTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "useTaskStartTimeForFullLoadTimestamp", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_dms_endpoint.DataAwsDmsEndpointS3Settings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_dms_endpoint.DataAwsDmsEndpointS3Settings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_dms_endpoint.DataAwsDmsEndpointS3Settings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
