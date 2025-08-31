package imports.aws.keyspaces_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.441Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.keyspacesTable.KeyspacesTableCapacitySpecificationOutputReference")
public class KeyspacesTableCapacitySpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KeyspacesTableCapacitySpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KeyspacesTableCapacitySpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KeyspacesTableCapacitySpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetReadCapacityUnits() {
        software.amazon.jsii.Kernel.call(this, "resetReadCapacityUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThroughputMode() {
        software.amazon.jsii.Kernel.call(this, "resetThroughputMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWriteCapacityUnits() {
        software.amazon.jsii.Kernel.call(this, "resetWriteCapacityUnits", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getReadCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "readCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThroughputModeInput() {
        return software.amazon.jsii.Kernel.get(this, "throughputModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWriteCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "writeCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getReadCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "readCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setReadCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "readCapacityUnits", java.util.Objects.requireNonNull(value, "readCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getThroughputMode() {
        return software.amazon.jsii.Kernel.get(this, "throughputMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThroughputMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "throughputMode", java.util.Objects.requireNonNull(value, "throughputMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWriteCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "writeCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWriteCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "writeCapacityUnits", java.util.Objects.requireNonNull(value, "writeCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableCapacitySpecification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableCapacitySpecification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableCapacitySpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
