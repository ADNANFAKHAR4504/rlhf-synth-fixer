package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.447Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesSchemaOutputReference")
public class KinesisAnalyticsApplicationReferenceDataSourcesSchemaOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisAnalyticsApplicationReferenceDataSourcesSchemaOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisAnalyticsApplicationReferenceDataSourcesSchemaOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisAnalyticsApplicationReferenceDataSourcesSchemaOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRecordColumns(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordColumns>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordColumns> __cast_cd4240 = (java.util.List<imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordColumns>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordColumns __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRecordColumns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRecordFormat(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat value) {
        software.amazon.jsii.Kernel.call(this, "putRecordFormat", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRecordEncoding() {
        software.amazon.jsii.Kernel.call(this, "resetRecordEncoding", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordColumnsList getRecordColumns() {
        return software.amazon.jsii.Kernel.get(this, "recordColumns", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordColumnsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatOutputReference getRecordFormat() {
        return software.amazon.jsii.Kernel.get(this, "recordFormat", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRecordColumnsInput() {
        return software.amazon.jsii.Kernel.get(this, "recordColumnsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecordEncodingInput() {
        return software.amazon.jsii.Kernel.get(this, "recordEncodingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat getRecordFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "recordFormatInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordEncoding() {
        return software.amazon.jsii.Kernel.get(this, "recordEncoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecordEncoding(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recordEncoding", java.util.Objects.requireNonNull(value, "recordEncoding is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
