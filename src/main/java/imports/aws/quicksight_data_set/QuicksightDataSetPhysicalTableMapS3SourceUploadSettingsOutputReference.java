package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference")
public class QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetPhysicalTableMapS3SourceUploadSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetContainsHeader() {
        software.amazon.jsii.Kernel.call(this, "resetContainsHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDelimiter() {
        software.amazon.jsii.Kernel.call(this, "resetDelimiter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFormat() {
        software.amazon.jsii.Kernel.call(this, "resetFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartFromRow() {
        software.amazon.jsii.Kernel.call(this, "resetStartFromRow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTextQualifier() {
        software.amazon.jsii.Kernel.call(this, "resetTextQualifier", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContainsHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "containsHeaderInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "delimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "formatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getStartFromRowInput() {
        return software.amazon.jsii.Kernel.get(this, "startFromRowInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTextQualifierInput() {
        return software.amazon.jsii.Kernel.get(this, "textQualifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getContainsHeader() {
        return software.amazon.jsii.Kernel.get(this, "containsHeader", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setContainsHeader(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "containsHeader", java.util.Objects.requireNonNull(value, "containsHeader is required"));
    }

    public void setContainsHeader(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "containsHeader", java.util.Objects.requireNonNull(value, "containsHeader is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "delimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "delimiter", java.util.Objects.requireNonNull(value, "delimiter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFormat() {
        return software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "format", java.util.Objects.requireNonNull(value, "format is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getStartFromRow() {
        return software.amazon.jsii.Kernel.get(this, "startFromRow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setStartFromRow(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "startFromRow", java.util.Objects.requireNonNull(value, "startFromRow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTextQualifier() {
        return software.amazon.jsii.Kernel.get(this, "textQualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTextQualifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "textQualifier", java.util.Objects.requireNonNull(value, "textQualifier is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapS3SourceUploadSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
