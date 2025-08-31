package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.431Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsOutputReference")
public class KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCondition(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition value) {
        software.amazon.jsii.Kernel.call(this, "putCondition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTarget(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget value) {
        software.amazon.jsii.Kernel.call(this, "putTarget", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCondition() {
        software.amazon.jsii.Kernel.call(this, "resetCondition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocumentContentDeletion() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentContentDeletion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTarget() {
        software.amazon.jsii.Kernel.call(this, "resetTarget", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionOutputReference getCondition() {
        return software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsConditionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetOutputReference getTarget() {
        return software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTargetOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition getConditionInput() {
        return software.amazon.jsii.Kernel.get(this, "conditionInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsCondition.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDocumentContentDeletionInput() {
        return software.amazon.jsii.Kernel.get(this, "documentContentDeletionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget getTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "targetInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurationsTarget.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDocumentContentDeletion() {
        return software.amazon.jsii.Kernel.get(this, "documentContentDeletion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDocumentContentDeletion(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "documentContentDeletion", java.util.Objects.requireNonNull(value, "documentContentDeletion is required"));
    }

    public void setDocumentContentDeletion(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "documentContentDeletion", java.util.Objects.requireNonNull(value, "documentContentDeletion is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceCustomDocumentEnrichmentConfigurationInlineConfigurations value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
