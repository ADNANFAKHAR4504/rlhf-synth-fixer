package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointKinesisSettingsOutputReference")
public class DmsEndpointKinesisSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DmsEndpointKinesisSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsEndpointKinesisSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DmsEndpointKinesisSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIncludeControlDetails() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeControlDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeNullAndEmpty() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeNullAndEmpty", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludePartitionValue() {
        software.amazon.jsii.Kernel.call(this, "resetIncludePartitionValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeTableAlterOperations() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeTableAlterOperations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeTransactionDetails() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeTransactionDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessageFormat() {
        software.amazon.jsii.Kernel.call(this, "resetMessageFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPartitionIncludeSchemaTable() {
        software.amazon.jsii.Kernel.call(this, "resetPartitionIncludeSchemaTable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceAccessRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetServiceAccessRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStreamArn() {
        software.amazon.jsii.Kernel.call(this, "resetStreamArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseLargeIntegerValue() {
        software.amazon.jsii.Kernel.call(this, "resetUseLargeIntegerValue", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeControlDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeControlDetailsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeNullAndEmptyInput() {
        return software.amazon.jsii.Kernel.get(this, "includeNullAndEmptyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludePartitionValueInput() {
        return software.amazon.jsii.Kernel.get(this, "includePartitionValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTableAlterOperationsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeTableAlterOperationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTransactionDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeTransactionDetailsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "messageFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPartitionIncludeSchemaTableInput() {
        return software.amazon.jsii.Kernel.get(this, "partitionIncludeSchemaTableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceAccessRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStreamArnInput() {
        return software.amazon.jsii.Kernel.get(this, "streamArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseLargeIntegerValueInput() {
        return software.amazon.jsii.Kernel.get(this, "useLargeIntegerValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeControlDetails() {
        return software.amazon.jsii.Kernel.get(this, "includeControlDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeControlDetails(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeControlDetails", java.util.Objects.requireNonNull(value, "includeControlDetails is required"));
    }

    public void setIncludeControlDetails(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeControlDetails", java.util.Objects.requireNonNull(value, "includeControlDetails is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeNullAndEmpty() {
        return software.amazon.jsii.Kernel.get(this, "includeNullAndEmpty", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeNullAndEmpty(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeNullAndEmpty", java.util.Objects.requireNonNull(value, "includeNullAndEmpty is required"));
    }

    public void setIncludeNullAndEmpty(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeNullAndEmpty", java.util.Objects.requireNonNull(value, "includeNullAndEmpty is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludePartitionValue() {
        return software.amazon.jsii.Kernel.get(this, "includePartitionValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludePartitionValue(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includePartitionValue", java.util.Objects.requireNonNull(value, "includePartitionValue is required"));
    }

    public void setIncludePartitionValue(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includePartitionValue", java.util.Objects.requireNonNull(value, "includePartitionValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeTableAlterOperations() {
        return software.amazon.jsii.Kernel.get(this, "includeTableAlterOperations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeTableAlterOperations(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeTableAlterOperations", java.util.Objects.requireNonNull(value, "includeTableAlterOperations is required"));
    }

    public void setIncludeTableAlterOperations(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeTableAlterOperations", java.util.Objects.requireNonNull(value, "includeTableAlterOperations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeTransactionDetails() {
        return software.amazon.jsii.Kernel.get(this, "includeTransactionDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeTransactionDetails(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeTransactionDetails", java.util.Objects.requireNonNull(value, "includeTransactionDetails is required"));
    }

    public void setIncludeTransactionDetails(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeTransactionDetails", java.util.Objects.requireNonNull(value, "includeTransactionDetails is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageFormat() {
        return software.amazon.jsii.Kernel.get(this, "messageFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageFormat", java.util.Objects.requireNonNull(value, "messageFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPartitionIncludeSchemaTable() {
        return software.amazon.jsii.Kernel.get(this, "partitionIncludeSchemaTable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPartitionIncludeSchemaTable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "partitionIncludeSchemaTable", java.util.Objects.requireNonNull(value, "partitionIncludeSchemaTable is required"));
    }

    public void setPartitionIncludeSchemaTable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "partitionIncludeSchemaTable", java.util.Objects.requireNonNull(value, "partitionIncludeSchemaTable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceAccessRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceAccessRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceAccessRoleArn", java.util.Objects.requireNonNull(value, "serviceAccessRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreamArn() {
        return software.amazon.jsii.Kernel.get(this, "streamArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStreamArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "streamArn", java.util.Objects.requireNonNull(value, "streamArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseLargeIntegerValue() {
        return software.amazon.jsii.Kernel.get(this, "useLargeIntegerValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseLargeIntegerValue(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useLargeIntegerValue", java.util.Objects.requireNonNull(value, "useLargeIntegerValue is required"));
    }

    public void setUseLargeIntegerValue(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useLargeIntegerValue", java.util.Objects.requireNonNull(value, "useLargeIntegerValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointKinesisSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointKinesisSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointKinesisSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
