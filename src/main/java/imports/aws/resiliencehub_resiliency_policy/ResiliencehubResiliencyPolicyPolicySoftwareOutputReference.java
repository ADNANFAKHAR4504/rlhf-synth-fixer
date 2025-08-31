package imports.aws.resiliencehub_resiliency_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.187Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicySoftwareOutputReference")
public class ResiliencehubResiliencyPolicyPolicySoftwareOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ResiliencehubResiliencyPolicyPolicySoftwareOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ResiliencehubResiliencyPolicyPolicySoftwareOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ResiliencehubResiliencyPolicyPolicySoftwareOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRpoInput() {
        return software.amazon.jsii.Kernel.get(this, "rpoInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRtoInput() {
        return software.amazon.jsii.Kernel.get(this, "rtoInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRpo() {
        return software.amazon.jsii.Kernel.get(this, "rpo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRpo(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rpo", java.util.Objects.requireNonNull(value, "rpo is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRto() {
        return software.amazon.jsii.Kernel.get(this, "rto", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRto(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rto", java.util.Objects.requireNonNull(value, "rto is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftware value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
