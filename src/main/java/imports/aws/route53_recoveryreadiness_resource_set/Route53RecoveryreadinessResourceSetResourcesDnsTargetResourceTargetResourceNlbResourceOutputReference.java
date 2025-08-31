package imports.aws.route53_recoveryreadiness_resource_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResourceOutputReference")
public class Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetArn() {
        software.amazon.jsii.Kernel.call(this, "resetArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArnInput() {
        return software.amazon.jsii.Kernel.get(this, "arnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "arn", java.util.Objects.requireNonNull(value, "arn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
