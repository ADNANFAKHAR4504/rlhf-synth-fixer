package imports.aws.batch_scheduling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.137Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchSchedulingPolicy.BatchSchedulingPolicyFairSharePolicyShareDistributionOutputReference")
public class BatchSchedulingPolicyFairSharePolicyShareDistributionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchSchedulingPolicyFairSharePolicyShareDistributionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchSchedulingPolicyFairSharePolicyShareDistributionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BatchSchedulingPolicyFairSharePolicyShareDistributionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetWeightFactor() {
        software.amazon.jsii.Kernel.call(this, "resetWeightFactor", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getShareIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "shareIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getWeightFactorInput() {
        return software.amazon.jsii.Kernel.get(this, "weightFactorInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getShareIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "shareIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setShareIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "shareIdentifier", java.util.Objects.requireNonNull(value, "shareIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getWeightFactor() {
        return software.amazon.jsii.Kernel.get(this, "weightFactor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setWeightFactor(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "weightFactor", java.util.Objects.requireNonNull(value, "weightFactor is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_scheduling_policy.BatchSchedulingPolicyFairSharePolicyShareDistribution value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
