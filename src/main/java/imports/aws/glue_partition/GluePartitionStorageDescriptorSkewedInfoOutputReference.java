package imports.aws.glue_partition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.299Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gluePartition.GluePartitionStorageDescriptorSkewedInfoOutputReference")
public class GluePartitionStorageDescriptorSkewedInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GluePartitionStorageDescriptorSkewedInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GluePartitionStorageDescriptorSkewedInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GluePartitionStorageDescriptorSkewedInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSkewedColumnNames() {
        software.amazon.jsii.Kernel.call(this, "resetSkewedColumnNames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkewedColumnValueLocationMaps() {
        software.amazon.jsii.Kernel.call(this, "resetSkewedColumnValueLocationMaps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkewedColumnValues() {
        software.amazon.jsii.Kernel.call(this, "resetSkewedColumnValues", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSkewedColumnNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "skewedColumnNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getSkewedColumnValueLocationMapsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "skewedColumnValueLocationMapsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSkewedColumnValuesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "skewedColumnValuesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSkewedColumnNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "skewedColumnNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSkewedColumnNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "skewedColumnNames", java.util.Objects.requireNonNull(value, "skewedColumnNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getSkewedColumnValueLocationMaps() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "skewedColumnValueLocationMaps", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSkewedColumnValueLocationMaps(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "skewedColumnValueLocationMaps", java.util.Objects.requireNonNull(value, "skewedColumnValueLocationMaps is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSkewedColumnValues() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "skewedColumnValues", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSkewedColumnValues(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "skewedColumnValues", java.util.Objects.requireNonNull(value, "skewedColumnValues is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_partition.GluePartitionStorageDescriptorSkewedInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_partition.GluePartitionStorageDescriptorSkewedInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_partition.GluePartitionStorageDescriptorSkewedInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
