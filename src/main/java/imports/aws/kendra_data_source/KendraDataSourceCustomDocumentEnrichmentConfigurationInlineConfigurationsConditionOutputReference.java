package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionOutputReference")
public class KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putConditionOnValue(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionConditionOnValue value) {
        software.amazon.jsii.Kernel.call(this, "putConditionOnValue", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConditionOnValue() {
        software.amazon.jsii.Kernel.call(this, "resetConditionOnValue", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionConditionOnValueOutputReference getConditionOnValue() {
        return software.amazon.jsii.Kernel.get(this, "conditionOnValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionConditionOnValueOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConditionDocumentAttributeKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "conditionDocumentAttributeKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionConditionOnValue getConditionOnValueInput() {
        return software.amazon.jsii.Kernel.get(this, "conditionOnValueInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionConditionOnValue.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOperatorInput() {
        return software.amazon.jsii.Kernel.get(this, "operatorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConditionDocumentAttributeKey() {
        return software.amazon.jsii.Kernel.get(this, "conditionDocumentAttributeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConditionDocumentAttributeKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "conditionDocumentAttributeKey", java.util.Objects.requireNonNull(value, "conditionDocumentAttributeKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOperator() {
        return software.amazon.jsii.Kernel.get(this, "operator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOperator(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "operator", java.util.Objects.requireNonNull(value, "operator is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
