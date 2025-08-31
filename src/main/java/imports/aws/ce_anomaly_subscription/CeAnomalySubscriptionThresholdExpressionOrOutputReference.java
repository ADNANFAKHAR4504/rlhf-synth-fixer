package imports.aws.ce_anomaly_subscription;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.191Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceAnomalySubscription.CeAnomalySubscriptionThresholdExpressionOrOutputReference")
public class CeAnomalySubscriptionThresholdExpressionOrOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CeAnomalySubscriptionThresholdExpressionOrOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CeAnomalySubscriptionThresholdExpressionOrOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CeAnomalySubscriptionThresholdExpressionOrOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCostCategory(final @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrCostCategory value) {
        software.amazon.jsii.Kernel.call(this, "putCostCategory", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDimension(final @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrDimension value) {
        software.amazon.jsii.Kernel.call(this, "putDimension", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTags(final @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrTags value) {
        software.amazon.jsii.Kernel.call(this, "putTags", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCostCategory() {
        software.amazon.jsii.Kernel.call(this, "resetCostCategory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDimension() {
        software.amazon.jsii.Kernel.call(this, "resetDimension", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrCostCategoryOutputReference getCostCategory() {
        return software.amazon.jsii.Kernel.get(this, "costCategory", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrCostCategoryOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrDimensionOutputReference getDimension() {
        return software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrDimensionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrTagsOutputReference getTags() {
        return software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrTagsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrCostCategory getCostCategoryInput() {
        return software.amazon.jsii.Kernel.get(this, "costCategoryInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrCostCategory.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrDimension getDimensionInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrDimension.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrTags getTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOrTags.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionOr value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
