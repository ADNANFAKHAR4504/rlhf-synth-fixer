package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetOutputReference")
public class KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putTargetDocumentAttributeValue(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue value) {
        software.amazon.jsii.Kernel.call(this, "putTargetDocumentAttributeValue", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetTargetDocumentAttributeKey() {
        software.amazon.jsii.Kernel.call(this, "resetTargetDocumentAttributeKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetDocumentAttributeValue() {
        software.amazon.jsii.Kernel.call(this, "resetTargetDocumentAttributeValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetDocumentAttributeValueDeletion() {
        software.amazon.jsii.Kernel.call(this, "resetTargetDocumentAttributeValueDeletion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValueOutputReference getTargetDocumentAttributeValue() {
        return software.amazon.jsii.Kernel.get(this, "targetDocumentAttributeValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValueOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetDocumentAttributeKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "targetDocumentAttributeKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetDocumentAttributeValueDeletionInput() {
        return software.amazon.jsii.Kernel.get(this, "targetDocumentAttributeValueDeletionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue getTargetDocumentAttributeValueInput() {
        return software.amazon.jsii.Kernel.get(this, "targetDocumentAttributeValueInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetTargetDocumentAttributeValue.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetDocumentAttributeKey() {
        return software.amazon.jsii.Kernel.get(this, "targetDocumentAttributeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetDocumentAttributeKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetDocumentAttributeKey", java.util.Objects.requireNonNull(value, "targetDocumentAttributeKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTargetDocumentAttributeValueDeletion() {
        return software.amazon.jsii.Kernel.get(this, "targetDocumentAttributeValueDeletion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTargetDocumentAttributeValueDeletion(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "targetDocumentAttributeValueDeletion", java.util.Objects.requireNonNull(value, "targetDocumentAttributeValueDeletion is required"));
    }

    public void setTargetDocumentAttributeValueDeletion(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "targetDocumentAttributeValueDeletion", java.util.Objects.requireNonNull(value, "targetDocumentAttributeValueDeletion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
