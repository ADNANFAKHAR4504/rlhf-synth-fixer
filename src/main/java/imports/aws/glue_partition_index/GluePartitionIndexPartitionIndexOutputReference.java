package imports.aws.glue_partition_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.299Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gluePartitionIndex.GluePartitionIndexPartitionIndexOutputReference")
public class GluePartitionIndexPartitionIndexOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GluePartitionIndexPartitionIndexOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GluePartitionIndexPartitionIndexOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GluePartitionIndexPartitionIndexOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIndexName() {
        software.amazon.jsii.Kernel.call(this, "resetIndexName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeys() {
        software.amazon.jsii.Kernel.call(this, "resetKeys", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIndexStatus() {
        return software.amazon.jsii.Kernel.get(this, "indexStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIndexNameInput() {
        return software.amazon.jsii.Kernel.get(this, "indexNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getKeysInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "keysInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIndexName() {
        return software.amazon.jsii.Kernel.get(this, "indexName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIndexName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "indexName", java.util.Objects.requireNonNull(value, "indexName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getKeys() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "keys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setKeys(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "keys", java.util.Objects.requireNonNull(value, "keys is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_partition_index.GluePartitionIndexPartitionIndex getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_partition_index.GluePartitionIndexPartitionIndex.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_partition_index.GluePartitionIndexPartitionIndex value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
