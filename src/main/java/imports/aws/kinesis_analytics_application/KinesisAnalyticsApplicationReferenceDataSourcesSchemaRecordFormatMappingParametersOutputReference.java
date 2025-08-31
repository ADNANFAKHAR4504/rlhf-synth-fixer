package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.448Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersOutputReference")
public class KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCsv(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsv value) {
        software.amazon.jsii.Kernel.call(this, "putCsv", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJson(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson value) {
        software.amazon.jsii.Kernel.call(this, "putJson", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCsv() {
        software.amazon.jsii.Kernel.call(this, "resetCsv", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJson() {
        software.amazon.jsii.Kernel.call(this, "resetJson", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsvOutputReference getCsv() {
        return software.amazon.jsii.Kernel.get(this, "csv", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsvOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJsonOutputReference getJson() {
        return software.amazon.jsii.Kernel.get(this, "json", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJsonOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsv getCsvInput() {
        return software.amazon.jsii.Kernel.get(this, "csvInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsv.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson getJsonInput() {
        return software.amazon.jsii.Kernel.get(this, "jsonInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
