package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.434Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexCapacityUnitsOutputReference")
public class KendraIndexCapacityUnitsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraIndexCapacityUnitsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraIndexCapacityUnitsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraIndexCapacityUnitsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetQueryCapacityUnits() {
        software.amazon.jsii.Kernel.call(this, "resetQueryCapacityUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageCapacityUnits() {
        software.amazon.jsii.Kernel.call(this, "resetStorageCapacityUnits", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getQueryCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "queryCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getStorageCapacityUnitsInput() {
        return software.amazon.jsii.Kernel.get(this, "storageCapacityUnitsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getQueryCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "queryCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setQueryCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "queryCapacityUnits", java.util.Objects.requireNonNull(value, "queryCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getStorageCapacityUnits() {
        return software.amazon.jsii.Kernel.get(this, "storageCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setStorageCapacityUnits(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "storageCapacityUnits", java.util.Objects.requireNonNull(value, "storageCapacityUnits is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexCapacityUnits getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexCapacityUnits.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexCapacityUnits value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
