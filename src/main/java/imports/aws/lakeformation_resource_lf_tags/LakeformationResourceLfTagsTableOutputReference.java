package imports.aws.lakeformation_resource_lf_tags;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.497Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationResourceLfTags.LakeformationResourceLfTagsTableOutputReference")
public class LakeformationResourceLfTagsTableOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LakeformationResourceLfTagsTableOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LakeformationResourceLfTagsTableOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LakeformationResourceLfTagsTableOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCatalogId() {
        software.amazon.jsii.Kernel.call(this, "resetCatalogId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWildcard() {
        software.amazon.jsii.Kernel.call(this, "resetWildcard", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCatalogIdInput() {
        return software.amazon.jsii.Kernel.get(this, "catalogIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWildcardInput() {
        return software.amazon.jsii.Kernel.get(this, "wildcardInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCatalogId() {
        return software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCatalogId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "catalogId", java.util.Objects.requireNonNull(value, "catalogId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseName", java.util.Objects.requireNonNull(value, "databaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getWildcard() {
        return software.amazon.jsii.Kernel.get(this, "wildcard", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWildcard(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "wildcard", java.util.Objects.requireNonNull(value, "wildcard is required"));
    }

    public void setWildcard(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "wildcard", java.util.Objects.requireNonNull(value, "wildcard is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lakeformation_resource_lf_tags.LakeformationResourceLfTagsTable getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lakeformation_resource_lf_tags.LakeformationResourceLfTagsTable.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lakeformation_resource_lf_tags.LakeformationResourceLfTagsTable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
