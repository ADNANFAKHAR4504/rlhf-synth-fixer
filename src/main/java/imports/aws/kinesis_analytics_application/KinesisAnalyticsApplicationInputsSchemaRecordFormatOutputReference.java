package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.444Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputsSchemaRecordFormatOutputReference")
public class KinesisAnalyticsApplicationInputsSchemaRecordFormatOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisAnalyticsApplicationInputsSchemaRecordFormatOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisAnalyticsApplicationInputsSchemaRecordFormatOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisAnalyticsApplicationInputsSchemaRecordFormatOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMappingParameters(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters value) {
        software.amazon.jsii.Kernel.call(this, "putMappingParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMappingParameters() {
        software.amazon.jsii.Kernel.call(this, "resetMappingParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersOutputReference getMappingParameters() {
        return software.amazon.jsii.Kernel.get(this, "mappingParameters", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordFormatType() {
        return software.amazon.jsii.Kernel.get(this, "recordFormatType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters getMappingParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "mappingParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormat getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormat.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormat value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
