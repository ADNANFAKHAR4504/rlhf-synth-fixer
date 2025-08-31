package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerWorkflowDetailsOnUploadOutputReference")
public class TransferServerWorkflowDetailsOnUploadOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TransferServerWorkflowDetailsOnUploadOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TransferServerWorkflowDetailsOnUploadOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public TransferServerWorkflowDetailsOnUploadOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWorkflowIdInput() {
        return software.amazon.jsii.Kernel.get(this, "workflowIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRole() {
        return software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRole", java.util.Objects.requireNonNull(value, "executionRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWorkflowId() {
        return software.amazon.jsii.Kernel.get(this, "workflowId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWorkflowId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "workflowId", java.util.Objects.requireNonNull(value, "workflowId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
