package imports.aws.ce_anomaly_subscription;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.190Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceAnomalySubscription.CeAnomalySubscriptionThresholdExpressionNotOutputReference")
public class CeAnomalySubscriptionThresholdExpressionNotOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CeAnomalySubscriptionThresholdExpressionNotOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CeAnomalySubscriptionThresholdExpressionNotOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CeAnomalySubscriptionThresholdExpressionNotOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCostCategory(final @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotCostCategory value) {
        software.amazon.jsii.Kernel.call(this, "putCostCategory", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDimension(final @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotDimension value) {
        software.amazon.jsii.Kernel.call(this, "putDimension", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTags(final @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotTags value) {
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

    public @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotCostCategoryOutputReference getCostCategory() {
        return software.amazon.jsii.Kernel.get(this, "costCategory", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotCostCategoryOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotDimensionOutputReference getDimension() {
        return software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotDimensionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotTagsOutputReference getTags() {
        return software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotTagsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotCostCategory getCostCategoryInput() {
        return software.amazon.jsii.Kernel.get(this, "costCategoryInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotCostCategory.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotDimension getDimensionInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotDimension.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotTags getTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNotTags.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNot getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNot.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ce_anomaly_subscription.CeAnomalySubscriptionThresholdExpressionNot value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
