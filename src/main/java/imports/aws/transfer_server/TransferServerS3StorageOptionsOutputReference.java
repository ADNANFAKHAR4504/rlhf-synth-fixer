package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerS3StorageOptionsOutputReference")
public class TransferServerS3StorageOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TransferServerS3StorageOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TransferServerS3StorageOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public TransferServerS3StorageOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDirectoryListingOptimization() {
        software.amazon.jsii.Kernel.call(this, "resetDirectoryListingOptimization", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDirectoryListingOptimizationInput() {
        return software.amazon.jsii.Kernel.get(this, "directoryListingOptimizationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryListingOptimization() {
        return software.amazon.jsii.Kernel.get(this, "directoryListingOptimization", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDirectoryListingOptimization(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "directoryListingOptimization", java.util.Objects.requireNonNull(value, "directoryListingOptimization is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerS3StorageOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerS3StorageOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerS3StorageOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
