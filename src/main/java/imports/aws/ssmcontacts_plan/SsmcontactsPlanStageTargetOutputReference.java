package imports.aws.ssmcontacts_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.508Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsPlan.SsmcontactsPlanStageTargetOutputReference")
public class SsmcontactsPlanStageTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmcontactsPlanStageTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmcontactsPlanStageTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SsmcontactsPlanStageTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putChannelTargetInfo(final @org.jetbrains.annotations.NotNull imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo value) {
        software.amazon.jsii.Kernel.call(this, "putChannelTargetInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putContactTargetInfo(final @org.jetbrains.annotations.NotNull imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo value) {
        software.amazon.jsii.Kernel.call(this, "putContactTargetInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetChannelTargetInfo() {
        software.amazon.jsii.Kernel.call(this, "resetChannelTargetInfo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContactTargetInfo() {
        software.amazon.jsii.Kernel.call(this, "resetContactTargetInfo", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfoOutputReference getChannelTargetInfo() {
        return software.amazon.jsii.Kernel.get(this, "channelTargetInfo", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfoOutputReference getContactTargetInfo() {
        return software.amazon.jsii.Kernel.get(this, "contactTargetInfo", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo getChannelTargetInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "channelTargetInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo getContactTargetInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "contactTargetInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetContactTargetInfo.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
