package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.547Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryOutputReference")
public class TimestreamqueryScheduledQueryLastRunSummaryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TimestreamqueryScheduledQueryLastRunSummaryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TimestreamqueryScheduledQueryLastRunSummaryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public TimestreamqueryScheduledQueryLastRunSummaryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putErrorReportLocation(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putErrorReportLocation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExecutionStats(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryExecutionStats>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryExecutionStats> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryExecutionStats>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryExecutionStats __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putExecutionStats", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putQueryInsightsResponse(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putQueryInsightsResponse", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetErrorReportLocation() {
        software.amazon.jsii.Kernel.call(this, "resetErrorReportLocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecutionStats() {
        software.amazon.jsii.Kernel.call(this, "resetExecutionStats", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQueryInsightsResponse() {
        software.amazon.jsii.Kernel.call(this, "resetQueryInsightsResponse", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationList getErrorReportLocation() {
        return software.amazon.jsii.Kernel.get(this, "errorReportLocation", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsList getExecutionStats() {
        return software.amazon.jsii.Kernel.get(this, "executionStats", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryExecutionStatsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFailureReason() {
        return software.amazon.jsii.Kernel.get(this, "failureReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInvocationTime() {
        return software.amazon.jsii.Kernel.get(this, "invocationTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseList getQueryInsightsResponse() {
        return software.amazon.jsii.Kernel.get(this, "queryInsightsResponse", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRunStatus() {
        return software.amazon.jsii.Kernel.get(this, "runStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTriggerTime() {
        return software.amazon.jsii.Kernel.get(this, "triggerTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getErrorReportLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "errorReportLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExecutionStatsInput() {
        return software.amazon.jsii.Kernel.get(this, "executionStatsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getQueryInsightsResponseInput() {
        return software.amazon.jsii.Kernel.get(this, "queryInsightsResponseInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummary value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
