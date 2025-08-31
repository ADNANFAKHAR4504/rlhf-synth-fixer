package imports.aws.route53_recoveryreadiness_resource_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoveryreadinessResourceSet.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceOutputReference")
public class Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putTargetResource(final @org.jetbrains.annotations.NotNull imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource value) {
        software.amazon.jsii.Kernel.call(this, "putTargetResource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHostedZoneArn() {
        software.amazon.jsii.Kernel.call(this, "resetHostedZoneArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordSetId() {
        software.amazon.jsii.Kernel.call(this, "resetRecordSetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordType() {
        software.amazon.jsii.Kernel.call(this, "resetRecordType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetResource() {
        software.amazon.jsii.Kernel.call(this, "resetTargetResource", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceOutputReference getTargetResource() {
        return software.amazon.jsii.Kernel.get(this, "targetResource", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResourceOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostedZoneArnInput() {
        return software.amazon.jsii.Kernel.get(this, "hostedZoneArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecordSetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "recordSetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecordTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "recordTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource getTargetResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "targetResourceInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResourceTargetResource.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainName() {
        return software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainName", java.util.Objects.requireNonNull(value, "domainName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostedZoneArn() {
        return software.amazon.jsii.Kernel.get(this, "hostedZoneArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostedZoneArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostedZoneArn", java.util.Objects.requireNonNull(value, "hostedZoneArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordSetId() {
        return software.amazon.jsii.Kernel.get(this, "recordSetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecordSetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recordSetId", java.util.Objects.requireNonNull(value, "recordSetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecordType() {
        return software.amazon.jsii.Kernel.get(this, "recordType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecordType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recordType", java.util.Objects.requireNonNull(value, "recordType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_recoveryreadiness_resource_set.Route53RecoveryreadinessResourceSetResourcesDnsTargetResource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
