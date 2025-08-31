package imports.aws.data_aws_batch_scheduling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.477Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsBatchSchedulingPolicy.DataAwsBatchSchedulingPolicyFairSharePolicyOutputReference")
public class DataAwsBatchSchedulingPolicyFairSharePolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsBatchSchedulingPolicyFairSharePolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsBatchSchedulingPolicyFairSharePolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsBatchSchedulingPolicyFairSharePolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getComputeReservation() {
        return software.amazon.jsii.Kernel.get(this, "computeReservation", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getShareDecaySeconds() {
        return software.amazon.jsii.Kernel.get(this, "shareDecaySeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_batch_scheduling_policy.DataAwsBatchSchedulingPolicyFairSharePolicyShareDistributionList getShareDistribution() {
        return software.amazon.jsii.Kernel.get(this, "shareDistribution", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_scheduling_policy.DataAwsBatchSchedulingPolicyFairSharePolicyShareDistributionList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_batch_scheduling_policy.DataAwsBatchSchedulingPolicyFairSharePolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_batch_scheduling_policy.DataAwsBatchSchedulingPolicyFairSharePolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_batch_scheduling_policy.DataAwsBatchSchedulingPolicyFairSharePolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
