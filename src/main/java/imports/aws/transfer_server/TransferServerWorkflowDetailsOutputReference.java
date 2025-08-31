package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerWorkflowDetailsOutputReference")
public class TransferServerWorkflowDetailsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TransferServerWorkflowDetailsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TransferServerWorkflowDetailsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public TransferServerWorkflowDetailsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putOnPartialUpload(final @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUpload value) {
        software.amazon.jsii.Kernel.call(this, "putOnPartialUpload", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOnUpload(final @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload value) {
        software.amazon.jsii.Kernel.call(this, "putOnUpload", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetOnPartialUpload() {
        software.amazon.jsii.Kernel.call(this, "resetOnPartialUpload", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnUpload() {
        software.amazon.jsii.Kernel.call(this, "resetOnUpload", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUploadOutputReference getOnPartialUpload() {
        return software.amazon.jsii.Kernel.get(this, "onPartialUpload", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUploadOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.transfer_server.TransferServerWorkflowDetailsOnUploadOutputReference getOnUpload() {
        return software.amazon.jsii.Kernel.get(this, "onUpload", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetailsOnUploadOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUpload getOnPartialUploadInput() {
        return software.amazon.jsii.Kernel.get(this, "onPartialUploadInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUpload.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload getOnUploadInput() {
        return software.amazon.jsii.Kernel.get(this, "onUploadInput", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetails getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetails.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetails value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
