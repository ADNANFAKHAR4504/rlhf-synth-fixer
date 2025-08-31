package imports.aws.cloudsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.260Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudsearchDomain.CloudsearchDomainScalingParametersOutputReference")
public class CloudsearchDomainScalingParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudsearchDomainScalingParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudsearchDomainScalingParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudsearchDomainScalingParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDesiredInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDesiredPartitionCount() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredPartitionCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDesiredReplicationCount() {
        software.amazon.jsii.Kernel.call(this, "resetDesiredReplicationCount", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDesiredInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredInstanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDesiredPartitionCountInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredPartitionCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDesiredReplicationCountInput() {
        return software.amazon.jsii.Kernel.get(this, "desiredReplicationCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDesiredInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "desiredInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDesiredInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "desiredInstanceType", java.util.Objects.requireNonNull(value, "desiredInstanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDesiredPartitionCount() {
        return software.amazon.jsii.Kernel.get(this, "desiredPartitionCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDesiredPartitionCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "desiredPartitionCount", java.util.Objects.requireNonNull(value, "desiredPartitionCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDesiredReplicationCount() {
        return software.amazon.jsii.Kernel.get(this, "desiredReplicationCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDesiredReplicationCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "desiredReplicationCount", java.util.Objects.requireNonNull(value, "desiredReplicationCount is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
