package imports.aws.opsworks_java_app_layer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.018Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksJavaAppLayer.OpsworksJavaAppLayerCloudwatchConfigurationLogStreamsOutputReference")
public class OpsworksJavaAppLayerCloudwatchConfigurationLogStreamsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpsworksJavaAppLayerCloudwatchConfigurationLogStreamsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksJavaAppLayerCloudwatchConfigurationLogStreamsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public OpsworksJavaAppLayerCloudwatchConfigurationLogStreamsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetBatchCount() {
        software.amazon.jsii.Kernel.call(this, "resetBatchCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBatchSize() {
        software.amazon.jsii.Kernel.call(this, "resetBatchSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBufferDuration() {
        software.amazon.jsii.Kernel.call(this, "resetBufferDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatetimeFormat() {
        software.amazon.jsii.Kernel.call(this, "resetDatetimeFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncoding() {
        software.amazon.jsii.Kernel.call(this, "resetEncoding", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileFingerprintLines() {
        software.amazon.jsii.Kernel.call(this, "resetFileFingerprintLines", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitialPosition() {
        software.amazon.jsii.Kernel.call(this, "resetInitialPosition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultilineStartPattern() {
        software.amazon.jsii.Kernel.call(this, "resetMultilineStartPattern", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeZone() {
        software.amazon.jsii.Kernel.call(this, "resetTimeZone", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBatchCountInput() {
        return software.amazon.jsii.Kernel.get(this, "batchCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBatchSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "batchSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufferDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatetimeFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "datetimeFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncodingInput() {
        return software.amazon.jsii.Kernel.get(this, "encodingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileFingerprintLinesInput() {
        return software.amazon.jsii.Kernel.get(this, "fileFingerprintLinesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileInput() {
        return software.amazon.jsii.Kernel.get(this, "fileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInitialPositionInput() {
        return software.amazon.jsii.Kernel.get(this, "initialPositionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogGroupNameInput() {
        return software.amazon.jsii.Kernel.get(this, "logGroupNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMultilineStartPatternInput() {
        return software.amazon.jsii.Kernel.get(this, "multilineStartPatternInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimeZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "timeZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBatchCount() {
        return software.amazon.jsii.Kernel.get(this, "batchCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBatchCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "batchCount", java.util.Objects.requireNonNull(value, "batchCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBatchSize() {
        return software.amazon.jsii.Kernel.get(this, "batchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBatchSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "batchSize", java.util.Objects.requireNonNull(value, "batchSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBufferDuration() {
        return software.amazon.jsii.Kernel.get(this, "bufferDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBufferDuration(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bufferDuration", java.util.Objects.requireNonNull(value, "bufferDuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatetimeFormat() {
        return software.amazon.jsii.Kernel.get(this, "datetimeFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatetimeFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "datetimeFormat", java.util.Objects.requireNonNull(value, "datetimeFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncoding() {
        return software.amazon.jsii.Kernel.get(this, "encoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncoding(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encoding", java.util.Objects.requireNonNull(value, "encoding is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFile() {
        return software.amazon.jsii.Kernel.get(this, "file", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFile(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "file", java.util.Objects.requireNonNull(value, "file is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileFingerprintLines() {
        return software.amazon.jsii.Kernel.get(this, "fileFingerprintLines", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileFingerprintLines(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileFingerprintLines", java.util.Objects.requireNonNull(value, "fileFingerprintLines is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInitialPosition() {
        return software.amazon.jsii.Kernel.get(this, "initialPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInitialPosition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "initialPosition", java.util.Objects.requireNonNull(value, "initialPosition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogGroupName() {
        return software.amazon.jsii.Kernel.get(this, "logGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogGroupName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logGroupName", java.util.Objects.requireNonNull(value, "logGroupName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMultilineStartPattern() {
        return software.amazon.jsii.Kernel.get(this, "multilineStartPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMultilineStartPattern(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "multilineStartPattern", java.util.Objects.requireNonNull(value, "multilineStartPattern is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimeZone() {
        return software.amazon.jsii.Kernel.get(this, "timeZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimeZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timeZone", java.util.Objects.requireNonNull(value, "timeZone is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opsworks_java_app_layer.OpsworksJavaAppLayerCloudwatchConfigurationLogStreams value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
