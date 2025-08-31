package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.447Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesOutputReference")
public class KinesisAnalyticsApplicationReferenceDataSourcesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisAnalyticsApplicationReferenceDataSourcesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisAnalyticsApplicationReferenceDataSourcesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisAnalyticsApplicationReferenceDataSourcesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSchema(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema value) {
        software.amazon.jsii.Kernel.call(this, "putSchema", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3OutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaOutputReference getSchema() {
        return software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesS3.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema getSchemaInput() {
        return software.amazon.jsii.Kernel.get(this, "schemaInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchema.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTableNameInput() {
        return software.amazon.jsii.Kernel.get(this, "tableNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTableName() {
        return software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTableName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tableName", java.util.Objects.requireNonNull(value, "tableName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSources getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSources.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSources value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
