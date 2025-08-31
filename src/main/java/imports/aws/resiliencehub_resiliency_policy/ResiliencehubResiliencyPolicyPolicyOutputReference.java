package imports.aws.resiliencehub_resiliency_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicyOutputReference")
public class ResiliencehubResiliencyPolicyPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ResiliencehubResiliencyPolicyPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ResiliencehubResiliencyPolicyPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ResiliencehubResiliencyPolicyPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAz(final @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyAz value) {
        software.amazon.jsii.Kernel.call(this, "putAz", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHardware(final @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyHardware value) {
        software.amazon.jsii.Kernel.call(this, "putHardware", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRegion(final @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyRegion value) {
        software.amazon.jsii.Kernel.call(this, "putRegion", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSoftwareAttribute(final @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftware value) {
        software.amazon.jsii.Kernel.call(this, "putSoftwareAttribute", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRegion() {
        software.amazon.jsii.Kernel.call(this, "resetRegion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyAzOutputReference getAz() {
        return software.amazon.jsii.Kernel.get(this, "az", software.amazon.jsii.NativeType.forClass(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyAzOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyHardwareOutputReference getHardware() {
        return software.amazon.jsii.Kernel.get(this, "hardware", software.amazon.jsii.NativeType.forClass(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyHardwareOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyRegionOutputReference getRegion() {
        return software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyRegionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftwareOutputReference getSoftwareAttribute() {
        return software.amazon.jsii.Kernel.get(this, "softwareAttribute", software.amazon.jsii.NativeType.forClass(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftwareOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAzInput() {
        return software.amazon.jsii.Kernel.get(this, "azInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHardwareInput() {
        return software.amazon.jsii.Kernel.get(this, "hardwareInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "regionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSoftwareAttributeInput() {
        return software.amazon.jsii.Kernel.get(this, "softwareAttributeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
