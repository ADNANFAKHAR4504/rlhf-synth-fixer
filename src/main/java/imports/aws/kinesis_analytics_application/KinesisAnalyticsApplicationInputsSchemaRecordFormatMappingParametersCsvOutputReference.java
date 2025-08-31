package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.444Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsvOutputReference")
public class KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsvOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsvOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsvOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsvOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecordColumnDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "recordColumnDelimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecordRowDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "recordRowDelimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordColumnDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "recordColumnDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecordColumnDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recordColumnDelimiter", java.util.Objects.requireNonNull(value, "recordColumnDelimiter is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordRowDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "recordRowDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecordRowDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recordRowDelimiter", java.util.Objects.requireNonNull(value, "recordRowDelimiter is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsv getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsv.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsv value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
