package imports.aws.ssoadmin_permissions_boundary_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.526Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminPermissionsBoundaryAttachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryOutputReference")
public class SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCustomerManagedPolicyReference(final @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReference value) {
        software.amazon.jsii.Kernel.call(this, "putCustomerManagedPolicyReference", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomerManagedPolicyReference() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerManagedPolicyReference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManagedPolicyArn() {
        software.amazon.jsii.Kernel.call(this, "resetManagedPolicyArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReferenceOutputReference getCustomerManagedPolicyReference() {
        return software.amazon.jsii.Kernel.get(this, "customerManagedPolicyReference", software.amazon.jsii.NativeType.forClass(imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReferenceOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReference getCustomerManagedPolicyReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "customerManagedPolicyReferenceInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundaryCustomerManagedPolicyReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getManagedPolicyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "managedPolicyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getManagedPolicyArn() {
        return software.amazon.jsii.Kernel.get(this, "managedPolicyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setManagedPolicyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "managedPolicyArn", java.util.Objects.requireNonNull(value, "managedPolicyArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundary getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundary.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssoadmin_permissions_boundary_attachment.SsoadminPermissionsBoundaryAttachmentPermissionsBoundary value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
