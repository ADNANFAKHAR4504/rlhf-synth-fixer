package imports.aws.ssmcontacts_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.508Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsPlan.SsmcontactsPlanStageTargetContactTargetInfoOutputReference")
public class SsmcontactsPlanStageTargetContactTargetInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmcontactsPlanStageTargetContactTargetInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmcontactsPlanStageTargetContactTargetInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SsmcontactsPlanStageTargetContactTargetInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetContactId() {
        software.amazon.jsii.Kernel.call(this, "resetContactId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContactIdInput() {
        return software.amazon.jsii.Kernel.get(this, "contactIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIsEssentialInput() {
        return software.amazon.jsii.Kernel.get(this, "isEssentialInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContactId() {
        return software.amazon.jsii.Kernel.get(this, "contactId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContactId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contactId", java.util.Objects.requireNonNull(value, "contactId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIsEssential() {
        return software.amazon.jsii.Kernel.get(this, "isEssential", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIsEssential(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "isEssential", java.util.Objects.requireNonNull(value, "isEssential is required"));
    }

    public void setIsEssential(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "isEssential", java.util.Objects.requireNonNull(value, "isEssential is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
