package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.434Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexDocumentMetadataConfigurationUpdatesSearchOutputReference")
public class KendraIndexDocumentMetadataConfigurationUpdatesSearchOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraIndexDocumentMetadataConfigurationUpdatesSearchOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraIndexDocumentMetadataConfigurationUpdatesSearchOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraIndexDocumentMetadataConfigurationUpdatesSearchOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDisplayable() {
        software.amazon.jsii.Kernel.call(this, "resetDisplayable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFacetable() {
        software.amazon.jsii.Kernel.call(this, "resetFacetable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSearchable() {
        software.amazon.jsii.Kernel.call(this, "resetSearchable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSortable() {
        software.amazon.jsii.Kernel.call(this, "resetSortable", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisplayableInput() {
        return software.amazon.jsii.Kernel.get(this, "displayableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFacetableInput() {
        return software.amazon.jsii.Kernel.get(this, "facetableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSearchableInput() {
        return software.amazon.jsii.Kernel.get(this, "searchableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSortableInput() {
        return software.amazon.jsii.Kernel.get(this, "sortableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisplayable() {
        return software.amazon.jsii.Kernel.get(this, "displayable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisplayable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "displayable", java.util.Objects.requireNonNull(value, "displayable is required"));
    }

    public void setDisplayable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "displayable", java.util.Objects.requireNonNull(value, "displayable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFacetable() {
        return software.amazon.jsii.Kernel.get(this, "facetable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFacetable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "facetable", java.util.Objects.requireNonNull(value, "facetable is required"));
    }

    public void setFacetable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "facetable", java.util.Objects.requireNonNull(value, "facetable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSearchable() {
        return software.amazon.jsii.Kernel.get(this, "searchable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSearchable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "searchable", java.util.Objects.requireNonNull(value, "searchable is required"));
    }

    public void setSearchable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "searchable", java.util.Objects.requireNonNull(value, "searchable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSortable() {
        return software.amazon.jsii.Kernel.get(this, "sortable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSortable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sortable", java.util.Objects.requireNonNull(value, "sortable is required"));
    }

    public void setSortable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sortable", java.util.Objects.requireNonNull(value, "sortable is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdatesSearch value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
