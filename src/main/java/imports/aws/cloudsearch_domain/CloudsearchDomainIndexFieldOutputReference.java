package imports.aws.cloudsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.260Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudsearchDomain.CloudsearchDomainIndexFieldOutputReference")
public class CloudsearchDomainIndexFieldOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudsearchDomainIndexFieldOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudsearchDomainIndexFieldOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudsearchDomainIndexFieldOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAnalysisScheme() {
        software.amazon.jsii.Kernel.call(this, "resetAnalysisScheme", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultValue() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFacet() {
        software.amazon.jsii.Kernel.call(this, "resetFacet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHighlight() {
        software.amazon.jsii.Kernel.call(this, "resetHighlight", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReturn() {
        software.amazon.jsii.Kernel.call(this, "resetReturn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSearch() {
        software.amazon.jsii.Kernel.call(this, "resetSearch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSort() {
        software.amazon.jsii.Kernel.call(this, "resetSort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceFields() {
        software.amazon.jsii.Kernel.call(this, "resetSourceFields", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAnalysisSchemeInput() {
        return software.amazon.jsii.Kernel.get(this, "analysisSchemeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultValueInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFacetInput() {
        return software.amazon.jsii.Kernel.get(this, "facetInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHighlightInput() {
        return software.amazon.jsii.Kernel.get(this, "highlightInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReturnInput() {
        return software.amazon.jsii.Kernel.get(this, "returnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSearchInput() {
        return software.amazon.jsii.Kernel.get(this, "searchInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSortInput() {
        return software.amazon.jsii.Kernel.get(this, "sortInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceFieldsInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceFieldsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAnalysisScheme() {
        return software.amazon.jsii.Kernel.get(this, "analysisScheme", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAnalysisScheme(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "analysisScheme", java.util.Objects.requireNonNull(value, "analysisScheme is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultValue() {
        return software.amazon.jsii.Kernel.get(this, "defaultValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultValue", java.util.Objects.requireNonNull(value, "defaultValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFacet() {
        return software.amazon.jsii.Kernel.get(this, "facet", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFacet(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "facet", java.util.Objects.requireNonNull(value, "facet is required"));
    }

    public void setFacet(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "facet", java.util.Objects.requireNonNull(value, "facet is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getHighlight() {
        return software.amazon.jsii.Kernel.get(this, "highlight", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setHighlight(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "highlight", java.util.Objects.requireNonNull(value, "highlight is required"));
    }

    public void setHighlight(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "highlight", java.util.Objects.requireNonNull(value, "highlight is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReturnValue() {
        return software.amazon.jsii.Kernel.get(this, "return", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReturnValue(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "return", java.util.Objects.requireNonNull(value, "return is required"));
    }

    public void setReturnValue(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "return", java.util.Objects.requireNonNull(value, "return is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSearch() {
        return software.amazon.jsii.Kernel.get(this, "search", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSearch(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "search", java.util.Objects.requireNonNull(value, "search is required"));
    }

    public void setSearch(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "search", java.util.Objects.requireNonNull(value, "search is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSort() {
        return software.amazon.jsii.Kernel.get(this, "sort", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSort(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sort", java.util.Objects.requireNonNull(value, "sort is required"));
    }

    public void setSort(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sort", java.util.Objects.requireNonNull(value, "sort is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceFields() {
        return software.amazon.jsii.Kernel.get(this, "sourceFields", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceFields(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceFields", java.util.Objects.requireNonNull(value, "sourceFields is required"));
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

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudsearch_domain.CloudsearchDomainIndexField value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
