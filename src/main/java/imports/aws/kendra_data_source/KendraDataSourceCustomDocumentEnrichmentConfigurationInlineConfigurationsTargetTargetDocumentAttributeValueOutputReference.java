package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValueOutputReference")
public class KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValueOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValueOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValueOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValueOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDateValue() {
        software.amazon.jsii.Kernel.call(this, "resetDateValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLongValue() {
        software.amazon.jsii.Kernel.call(this, "resetLongValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringListValue() {
        software.amazon.jsii.Kernel.call(this, "resetStringListValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringValue() {
        software.amazon.jsii.Kernel.call(this, "resetStringValue", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDateValueInput() {
        return software.amazon.jsii.Kernel.get(this, "dateValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLongValueInput() {
        return software.amazon.jsii.Kernel.get(this, "longValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStringListValueInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "stringListValueInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStringValueInput() {
        return software.amazon.jsii.Kernel.get(this, "stringValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDateValue() {
        return software.amazon.jsii.Kernel.get(this, "dateValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDateValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dateValue", java.util.Objects.requireNonNull(value, "dateValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLongValue() {
        return software.amazon.jsii.Kernel.get(this, "longValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLongValue(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "longValue", java.util.Objects.requireNonNull(value, "longValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStringListValue() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "stringListValue", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setStringListValue(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "stringListValue", java.util.Objects.requireNonNull(value, "stringListValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStringValue() {
        return software.amazon.jsii.Kernel.get(this, "stringValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStringValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stringValue", java.util.Objects.requireNonNull(value, "stringValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
