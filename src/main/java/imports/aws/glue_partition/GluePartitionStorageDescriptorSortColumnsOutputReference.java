package imports.aws.glue_partition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.299Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gluePartition.GluePartitionStorageDescriptorSortColumnsOutputReference")
public class GluePartitionStorageDescriptorSortColumnsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GluePartitionStorageDescriptorSortColumnsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GluePartitionStorageDescriptorSortColumnsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GluePartitionStorageDescriptorSortColumnsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getColumnInput() {
        return software.amazon.jsii.Kernel.get(this, "columnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSortOrderInput() {
        return software.amazon.jsii.Kernel.get(this, "sortOrderInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getColumn() {
        return software.amazon.jsii.Kernel.get(this, "column", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setColumn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "column", java.util.Objects.requireNonNull(value, "column is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSortOrder() {
        return software.amazon.jsii.Kernel.get(this, "sortOrder", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSortOrder(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sortOrder", java.util.Objects.requireNonNull(value, "sortOrder is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_partition.GluePartitionStorageDescriptorSortColumns value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
