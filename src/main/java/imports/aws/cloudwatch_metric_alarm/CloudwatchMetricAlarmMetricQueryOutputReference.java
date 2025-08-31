package imports.aws.cloudwatch_metric_alarm;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.290Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchMetricAlarm.CloudwatchMetricAlarmMetricQueryOutputReference")
public class CloudwatchMetricAlarmMetricQueryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchMetricAlarmMetricQueryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchMetricAlarmMetricQueryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudwatchMetricAlarmMetricQueryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putMetric(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetric value) {
        software.amazon.jsii.Kernel.call(this, "putMetric", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExpression() {
        software.amazon.jsii.Kernel.call(this, "resetExpression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLabel() {
        software.amazon.jsii.Kernel.call(this, "resetLabel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetric() {
        software.amazon.jsii.Kernel.call(this, "resetMetric", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReturnData() {
        software.amazon.jsii.Kernel.call(this, "resetReturnData", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetricOutputReference getMetric() {
        return software.amazon.jsii.Kernel.get(this, "metric", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetricOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "expressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "labelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetric getMetricInput() {
        return software.amazon.jsii.Kernel.get(this, "metricInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryMetric.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "periodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReturnDataInput() {
        return software.amazon.jsii.Kernel.get(this, "returnDataInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountId() {
        return software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountId", java.util.Objects.requireNonNull(value, "accountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExpression() {
        return software.amazon.jsii.Kernel.get(this, "expression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "expression", java.util.Objects.requireNonNull(value, "expression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLabel() {
        return software.amazon.jsii.Kernel.get(this, "label", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "label", java.util.Objects.requireNonNull(value, "label is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPeriod() {
        return software.amazon.jsii.Kernel.get(this, "period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "period", java.util.Objects.requireNonNull(value, "period is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReturnData() {
        return software.amazon.jsii.Kernel.get(this, "returnData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReturnData(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "returnData", java.util.Objects.requireNonNull(value, "returnData is required"));
    }

    public void setReturnData(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "returnData", java.util.Objects.requireNonNull(value, "returnData is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQuery value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
