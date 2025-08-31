package imports.aws.cloudwatch_metric_alarm;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm aws_cloudwatch_metric_alarm}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.289Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm")
public class CloudwatchMetricAlarm extends com.hashicorp.cdktf.TerraformResource {

    protected CloudwatchMetricAlarm(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchMetricAlarm(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm aws_cloudwatch_metric_alarm} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudwatchMetricAlarm(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudwatchMetricAlarm resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudwatchMetricAlarm to import. This parameter is required.
     * @param importFromId The id of the existing CloudwatchMetricAlarm that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudwatchMetricAlarm to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudwatchMetricAlarm resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudwatchMetricAlarm to import. This parameter is required.
     * @param importFromId The id of the existing CloudwatchMetricAlarm that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putMetricQuery(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQuery>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQuery> __cast_cd4240 = (java.util.List<imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQuery>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQuery __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMetricQuery", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActionsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetActionsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAlarmActions() {
        software.amazon.jsii.Kernel.call(this, "resetAlarmActions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAlarmDescription() {
        software.amazon.jsii.Kernel.call(this, "resetAlarmDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatapointsToAlarm() {
        software.amazon.jsii.Kernel.call(this, "resetDatapointsToAlarm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDimensions() {
        software.amazon.jsii.Kernel.call(this, "resetDimensions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEvaluateLowSampleCountPercentiles() {
        software.amazon.jsii.Kernel.call(this, "resetEvaluateLowSampleCountPercentiles", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExtendedStatistic() {
        software.amazon.jsii.Kernel.call(this, "resetExtendedStatistic", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInsufficientDataActions() {
        software.amazon.jsii.Kernel.call(this, "resetInsufficientDataActions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricName() {
        software.amazon.jsii.Kernel.call(this, "resetMetricName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricQuery() {
        software.amazon.jsii.Kernel.call(this, "resetMetricQuery", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamespace() {
        software.amazon.jsii.Kernel.call(this, "resetNamespace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOkActions() {
        software.amazon.jsii.Kernel.call(this, "resetOkActions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatistic() {
        software.amazon.jsii.Kernel.call(this, "resetStatistic", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThresholdMetricId() {
        software.amazon.jsii.Kernel.call(this, "resetThresholdMetricId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTreatMissingData() {
        software.amazon.jsii.Kernel.call(this, "resetTreatMissingData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnit() {
        software.amazon.jsii.Kernel.call(this, "resetUnit", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryList getMetricQuery() {
        return software.amazon.jsii.Kernel.get(this, "metricQuery", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQueryList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getActionsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "actionsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAlarmActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "alarmActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlarmDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlarmNameInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComparisonOperatorInput() {
        return software.amazon.jsii.Kernel.get(this, "comparisonOperatorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDatapointsToAlarmInput() {
        return software.amazon.jsii.Kernel.get(this, "datapointsToAlarmInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getDimensionsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "dimensionsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEvaluateLowSampleCountPercentilesInput() {
        return software.amazon.jsii.Kernel.get(this, "evaluateLowSampleCountPercentilesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getEvaluationPeriodsInput() {
        return software.amazon.jsii.Kernel.get(this, "evaluationPeriodsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExtendedStatisticInput() {
        return software.amazon.jsii.Kernel.get(this, "extendedStatisticInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInsufficientDataActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "insufficientDataActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMetricNameInput() {
        return software.amazon.jsii.Kernel.get(this, "metricNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMetricQueryInput() {
        return software.amazon.jsii.Kernel.get(this, "metricQueryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamespaceInput() {
        return software.amazon.jsii.Kernel.get(this, "namespaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOkActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "okActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "periodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatisticInput() {
        return software.amazon.jsii.Kernel.get(this, "statisticInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "thresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThresholdMetricIdInput() {
        return software.amazon.jsii.Kernel.get(this, "thresholdMetricIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTreatMissingDataInput() {
        return software.amazon.jsii.Kernel.get(this, "treatMissingDataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "unitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getActionsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "actionsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setActionsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "actionsEnabled", java.util.Objects.requireNonNull(value, "actionsEnabled is required"));
    }

    public void setActionsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "actionsEnabled", java.util.Objects.requireNonNull(value, "actionsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAlarmActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "alarmActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAlarmActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "alarmActions", java.util.Objects.requireNonNull(value, "alarmActions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlarmDescription() {
        return software.amazon.jsii.Kernel.get(this, "alarmDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlarmDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alarmDescription", java.util.Objects.requireNonNull(value, "alarmDescription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlarmName() {
        return software.amazon.jsii.Kernel.get(this, "alarmName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlarmName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alarmName", java.util.Objects.requireNonNull(value, "alarmName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComparisonOperator() {
        return software.amazon.jsii.Kernel.get(this, "comparisonOperator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComparisonOperator(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "comparisonOperator", java.util.Objects.requireNonNull(value, "comparisonOperator is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDatapointsToAlarm() {
        return software.amazon.jsii.Kernel.get(this, "datapointsToAlarm", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDatapointsToAlarm(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "datapointsToAlarm", java.util.Objects.requireNonNull(value, "datapointsToAlarm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getDimensions() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "dimensions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDimensions(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "dimensions", java.util.Objects.requireNonNull(value, "dimensions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEvaluateLowSampleCountPercentiles() {
        return software.amazon.jsii.Kernel.get(this, "evaluateLowSampleCountPercentiles", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEvaluateLowSampleCountPercentiles(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "evaluateLowSampleCountPercentiles", java.util.Objects.requireNonNull(value, "evaluateLowSampleCountPercentiles is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEvaluationPeriods() {
        return software.amazon.jsii.Kernel.get(this, "evaluationPeriods", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setEvaluationPeriods(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "evaluationPeriods", java.util.Objects.requireNonNull(value, "evaluationPeriods is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExtendedStatistic() {
        return software.amazon.jsii.Kernel.get(this, "extendedStatistic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExtendedStatistic(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "extendedStatistic", java.util.Objects.requireNonNull(value, "extendedStatistic is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInsufficientDataActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "insufficientDataActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInsufficientDataActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "insufficientDataActions", java.util.Objects.requireNonNull(value, "insufficientDataActions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMetricName() {
        return software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMetricName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "metricName", java.util.Objects.requireNonNull(value, "metricName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamespace() {
        return software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamespace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namespace", java.util.Objects.requireNonNull(value, "namespace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOkActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "okActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOkActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "okActions", java.util.Objects.requireNonNull(value, "okActions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPeriod() {
        return software.amazon.jsii.Kernel.get(this, "period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "period", java.util.Objects.requireNonNull(value, "period is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatistic() {
        return software.amazon.jsii.Kernel.get(this, "statistic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatistic(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statistic", java.util.Objects.requireNonNull(value, "statistic is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getThreshold() {
        return software.amazon.jsii.Kernel.get(this, "threshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "threshold", java.util.Objects.requireNonNull(value, "threshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getThresholdMetricId() {
        return software.amazon.jsii.Kernel.get(this, "thresholdMetricId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThresholdMetricId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "thresholdMetricId", java.util.Objects.requireNonNull(value, "thresholdMetricId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTreatMissingData() {
        return software.amazon.jsii.Kernel.get(this, "treatMissingData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTreatMissingData(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "treatMissingData", java.util.Objects.requireNonNull(value, "treatMissingData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUnit() {
        return software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "unit", java.util.Objects.requireNonNull(value, "unit is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#alarm_name CloudwatchMetricAlarm#alarm_name}.
         * <p>
         * @return {@code this}
         * @param alarmName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#alarm_name CloudwatchMetricAlarm#alarm_name}. This parameter is required.
         */
        public Builder alarmName(final java.lang.String alarmName) {
            this.config.alarmName(alarmName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#comparison_operator CloudwatchMetricAlarm#comparison_operator}.
         * <p>
         * @return {@code this}
         * @param comparisonOperator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#comparison_operator CloudwatchMetricAlarm#comparison_operator}. This parameter is required.
         */
        public Builder comparisonOperator(final java.lang.String comparisonOperator) {
            this.config.comparisonOperator(comparisonOperator);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#evaluation_periods CloudwatchMetricAlarm#evaluation_periods}.
         * <p>
         * @return {@code this}
         * @param evaluationPeriods Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#evaluation_periods CloudwatchMetricAlarm#evaluation_periods}. This parameter is required.
         */
        public Builder evaluationPeriods(final java.lang.Number evaluationPeriods) {
            this.config.evaluationPeriods(evaluationPeriods);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#actions_enabled CloudwatchMetricAlarm#actions_enabled}.
         * <p>
         * @return {@code this}
         * @param actionsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#actions_enabled CloudwatchMetricAlarm#actions_enabled}. This parameter is required.
         */
        public Builder actionsEnabled(final java.lang.Boolean actionsEnabled) {
            this.config.actionsEnabled(actionsEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#actions_enabled CloudwatchMetricAlarm#actions_enabled}.
         * <p>
         * @return {@code this}
         * @param actionsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#actions_enabled CloudwatchMetricAlarm#actions_enabled}. This parameter is required.
         */
        public Builder actionsEnabled(final com.hashicorp.cdktf.IResolvable actionsEnabled) {
            this.config.actionsEnabled(actionsEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#alarm_actions CloudwatchMetricAlarm#alarm_actions}.
         * <p>
         * @return {@code this}
         * @param alarmActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#alarm_actions CloudwatchMetricAlarm#alarm_actions}. This parameter is required.
         */
        public Builder alarmActions(final java.util.List<java.lang.String> alarmActions) {
            this.config.alarmActions(alarmActions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#alarm_description CloudwatchMetricAlarm#alarm_description}.
         * <p>
         * @return {@code this}
         * @param alarmDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#alarm_description CloudwatchMetricAlarm#alarm_description}. This parameter is required.
         */
        public Builder alarmDescription(final java.lang.String alarmDescription) {
            this.config.alarmDescription(alarmDescription);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#datapoints_to_alarm CloudwatchMetricAlarm#datapoints_to_alarm}.
         * <p>
         * @return {@code this}
         * @param datapointsToAlarm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#datapoints_to_alarm CloudwatchMetricAlarm#datapoints_to_alarm}. This parameter is required.
         */
        public Builder datapointsToAlarm(final java.lang.Number datapointsToAlarm) {
            this.config.datapointsToAlarm(datapointsToAlarm);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#dimensions CloudwatchMetricAlarm#dimensions}.
         * <p>
         * @return {@code this}
         * @param dimensions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#dimensions CloudwatchMetricAlarm#dimensions}. This parameter is required.
         */
        public Builder dimensions(final java.util.Map<java.lang.String, java.lang.String> dimensions) {
            this.config.dimensions(dimensions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#evaluate_low_sample_count_percentiles CloudwatchMetricAlarm#evaluate_low_sample_count_percentiles}.
         * <p>
         * @return {@code this}
         * @param evaluateLowSampleCountPercentiles Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#evaluate_low_sample_count_percentiles CloudwatchMetricAlarm#evaluate_low_sample_count_percentiles}. This parameter is required.
         */
        public Builder evaluateLowSampleCountPercentiles(final java.lang.String evaluateLowSampleCountPercentiles) {
            this.config.evaluateLowSampleCountPercentiles(evaluateLowSampleCountPercentiles);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#extended_statistic CloudwatchMetricAlarm#extended_statistic}.
         * <p>
         * @return {@code this}
         * @param extendedStatistic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#extended_statistic CloudwatchMetricAlarm#extended_statistic}. This parameter is required.
         */
        public Builder extendedStatistic(final java.lang.String extendedStatistic) {
            this.config.extendedStatistic(extendedStatistic);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#id CloudwatchMetricAlarm#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#id CloudwatchMetricAlarm#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#insufficient_data_actions CloudwatchMetricAlarm#insufficient_data_actions}.
         * <p>
         * @return {@code this}
         * @param insufficientDataActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#insufficient_data_actions CloudwatchMetricAlarm#insufficient_data_actions}. This parameter is required.
         */
        public Builder insufficientDataActions(final java.util.List<java.lang.String> insufficientDataActions) {
            this.config.insufficientDataActions(insufficientDataActions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#metric_name CloudwatchMetricAlarm#metric_name}.
         * <p>
         * @return {@code this}
         * @param metricName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#metric_name CloudwatchMetricAlarm#metric_name}. This parameter is required.
         */
        public Builder metricName(final java.lang.String metricName) {
            this.config.metricName(metricName);
            return this;
        }

        /**
         * metric_query block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#metric_query CloudwatchMetricAlarm#metric_query}
         * <p>
         * @return {@code this}
         * @param metricQuery metric_query block. This parameter is required.
         */
        public Builder metricQuery(final com.hashicorp.cdktf.IResolvable metricQuery) {
            this.config.metricQuery(metricQuery);
            return this;
        }
        /**
         * metric_query block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#metric_query CloudwatchMetricAlarm#metric_query}
         * <p>
         * @return {@code this}
         * @param metricQuery metric_query block. This parameter is required.
         */
        public Builder metricQuery(final java.util.List<? extends imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarmMetricQuery> metricQuery) {
            this.config.metricQuery(metricQuery);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#namespace CloudwatchMetricAlarm#namespace}.
         * <p>
         * @return {@code this}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#namespace CloudwatchMetricAlarm#namespace}. This parameter is required.
         */
        public Builder namespace(final java.lang.String namespace) {
            this.config.namespace(namespace);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#ok_actions CloudwatchMetricAlarm#ok_actions}.
         * <p>
         * @return {@code this}
         * @param okActions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#ok_actions CloudwatchMetricAlarm#ok_actions}. This parameter is required.
         */
        public Builder okActions(final java.util.List<java.lang.String> okActions) {
            this.config.okActions(okActions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#period CloudwatchMetricAlarm#period}.
         * <p>
         * @return {@code this}
         * @param period Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#period CloudwatchMetricAlarm#period}. This parameter is required.
         */
        public Builder period(final java.lang.Number period) {
            this.config.period(period);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#statistic CloudwatchMetricAlarm#statistic}.
         * <p>
         * @return {@code this}
         * @param statistic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#statistic CloudwatchMetricAlarm#statistic}. This parameter is required.
         */
        public Builder statistic(final java.lang.String statistic) {
            this.config.statistic(statistic);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#tags CloudwatchMetricAlarm#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#tags CloudwatchMetricAlarm#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#tags_all CloudwatchMetricAlarm#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#tags_all CloudwatchMetricAlarm#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#threshold CloudwatchMetricAlarm#threshold}.
         * <p>
         * @return {@code this}
         * @param threshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#threshold CloudwatchMetricAlarm#threshold}. This parameter is required.
         */
        public Builder threshold(final java.lang.Number threshold) {
            this.config.threshold(threshold);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#threshold_metric_id CloudwatchMetricAlarm#threshold_metric_id}.
         * <p>
         * @return {@code this}
         * @param thresholdMetricId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#threshold_metric_id CloudwatchMetricAlarm#threshold_metric_id}. This parameter is required.
         */
        public Builder thresholdMetricId(final java.lang.String thresholdMetricId) {
            this.config.thresholdMetricId(thresholdMetricId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#treat_missing_data CloudwatchMetricAlarm#treat_missing_data}.
         * <p>
         * @return {@code this}
         * @param treatMissingData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#treat_missing_data CloudwatchMetricAlarm#treat_missing_data}. This parameter is required.
         */
        public Builder treatMissingData(final java.lang.String treatMissingData) {
            this.config.treatMissingData(treatMissingData);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#unit CloudwatchMetricAlarm#unit}.
         * <p>
         * @return {@code this}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_alarm#unit CloudwatchMetricAlarm#unit}. This parameter is required.
         */
        public Builder unit(final java.lang.String unit) {
            this.config.unit(unit);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm}.
         */
        @Override
        public imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm build() {
            return new imports.aws.cloudwatch_metric_alarm.CloudwatchMetricAlarm(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
