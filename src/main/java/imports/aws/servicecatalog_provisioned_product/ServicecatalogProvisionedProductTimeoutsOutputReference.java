package imports.aws.servicecatalog_provisioned_product;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.437Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.servicecatalogProvisionedProduct.ServicecatalogProvisionedProductTimeoutsOutputReference")
public class ServicecatalogProvisionedProductTimeoutsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ServicecatalogProvisionedProductTimeoutsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ServicecatalogProvisionedProductTimeoutsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ServicecatalogProvisionedProductTimeoutsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCreate() {
        software.amazon.jsii.Kernel.call(this, "resetCreate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDelete() {
        software.amazon.jsii.Kernel.call(this, "resetDelete", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRead() {
        software.amazon.jsii.Kernel.call(this, "resetRead", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdate() {
        software.amazon.jsii.Kernel.call(this, "resetUpdate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCreateInput() {
        return software.amazon.jsii.Kernel.get(this, "createInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeleteInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReadInput() {
        return software.amazon.jsii.Kernel.get(this, "readInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUpdateInput() {
        return software.amazon.jsii.Kernel.get(this, "updateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreate() {
        return software.amazon.jsii.Kernel.get(this, "create", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCreate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "create", java.util.Objects.requireNonNull(value, "create is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDelete() {
        return software.amazon.jsii.Kernel.get(this, "delete", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDelete(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "delete", java.util.Objects.requireNonNull(value, "delete is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRead() {
        return software.amazon.jsii.Kernel.get(this, "read", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRead(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "read", java.util.Objects.requireNonNull(value, "read is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUpdate() {
        return software.amazon.jsii.Kernel.get(this, "update", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUpdate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "update", java.util.Objects.requireNonNull(value, "update is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.servicecatalog_provisioned_product.ServicecatalogProvisionedProductTimeouts value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
