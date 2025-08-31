package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.473Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersOutputReference")
public class Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCsvMappingParameters(final @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersCsvMappingParameters value) {
        software.amazon.jsii.Kernel.call(this, "putCsvMappingParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJsonMappingParameters(final @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersJsonMappingParameters value) {
        software.amazon.jsii.Kernel.call(this, "putJsonMappingParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCsvMappingParameters() {
        software.amazon.jsii.Kernel.call(this, "resetCsvMappingParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJsonMappingParameters() {
        software.amazon.jsii.Kernel.call(this, "resetJsonMappingParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersCsvMappingParametersOutputReference getCsvMappingParameters() {
        return software.amazon.jsii.Kernel.get(this, "csvMappingParameters", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersCsvMappingParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersJsonMappingParametersOutputReference getJsonMappingParameters() {
        return software.amazon.jsii.Kernel.get(this, "jsonMappingParameters", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersJsonMappingParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersCsvMappingParameters getCsvMappingParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "csvMappingParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersCsvMappingParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersJsonMappingParameters getJsonMappingParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "jsonMappingParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParametersJsonMappingParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchemaRecordFormatMappingParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
