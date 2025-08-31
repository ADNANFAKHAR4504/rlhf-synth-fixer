package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.434Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexDocumentMetadataConfigurationUpdatesOutputReference")
public class KendraIndexDocumentMetadataConfigurationUpdatesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraIndexDocumentMetadataConfigurationUpdatesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraIndexDocumentMetadataConfigurationUpdatesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public KendraIndexDocumentMetadataConfigurationUpdatesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putRelevance(final @org.jetbrains.annotations.NotNull imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance value) {
        software.amazon.jsii.Kernel.call(this, "putRelevance", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSearch(final @org.jetbrains.annotations.NotNull imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch value) {
        software.amazon.jsii.Kernel.call(this, "putSearch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRelevance() {
        software.amazon.jsii.Kernel.call(this, "resetRelevance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSearch() {
        software.amazon.jsii.Kernel.call(this, "resetSearch", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevanceOutputReference getRelevance() {
        return software.amazon.jsii.Kernel.get(this, "relevance", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevanceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearchOutputReference getSearch() {
        return software.amazon.jsii.Kernel.get(this, "search", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearchOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance getRelevanceInput() {
        return software.amazon.jsii.Kernel.get(this, "relevanceInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesRelevance.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch getSearchInput() {
        return software.amazon.jsii.Kernel.get(this, "searchInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdates value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
