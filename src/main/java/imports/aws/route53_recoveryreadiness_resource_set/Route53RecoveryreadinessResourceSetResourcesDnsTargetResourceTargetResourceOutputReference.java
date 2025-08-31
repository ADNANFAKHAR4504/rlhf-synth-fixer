package imports.aws.route53_recoveryreadiness_resource_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceOutputReference")
public class Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putNlbResource(final @org.jetbrains.annotations.NotNull imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource value) {
        software.amazon.jsii.Kernel.call(this, "putNlbResource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putR53Resource(final @org.jetbrains.annotations.NotNull imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource value) {
        software.amazon.jsii.Kernel.call(this, "putR53Resource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetNlbResource() {
        software.amazon.jsii.Kernel.call(this, "resetNlbResource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetR53Resource() {
        software.amazon.jsii.Kernel.call(this, "resetR53Resource", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResourceOutputReference getNlbResource() {
        return software.amazon.jsii.Kernel.get(this, "nlbResource", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResourceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53ResourceOutputReference getR53Resource() {
        return software.amazon.jsii.Kernel.get(this, "r53Resource", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53ResourceOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource getNlbResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "nlbResourceInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceNlbResource.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource getR53ResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "r53ResourceInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceR53Resource.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
