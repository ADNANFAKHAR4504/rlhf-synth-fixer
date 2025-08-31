package imports.aws.timestreamquery_scheduled_query;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query aws_timestreamquery_scheduled_query}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.545Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQuery")
public class TimestreamqueryScheduledQuery extends com.hashicorp.cdktf.TerraformResource {

    protected TimestreamqueryScheduledQuery(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TimestreamqueryScheduledQuery(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQuery.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query aws_timestreamquery_scheduled_query} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public TimestreamqueryScheduledQuery(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a TimestreamqueryScheduledQuery resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the TimestreamqueryScheduledQuery to import. This parameter is required.
     * @param importFromId The id of the existing TimestreamqueryScheduledQuery that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the TimestreamqueryScheduledQuery to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQuery.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a TimestreamqueryScheduledQuery resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the TimestreamqueryScheduledQuery to import. This parameter is required.
     * @param importFromId The id of the existing TimestreamqueryScheduledQuery that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQuery.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putErrorReportConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryErrorReportConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryErrorReportConfiguration> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryErrorReportConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryErrorReportConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putErrorReportConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLastRunSummary(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummary>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummary> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummary>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummary __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLastRunSummary", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNotificationConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryNotificationConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryNotificationConfiguration> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryNotificationConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryNotificationConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNotificationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRecentlyFailedRuns(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRuns>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRuns> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRuns>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRuns __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRecentlyFailedRuns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScheduleConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryScheduleConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryScheduleConfiguration> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryScheduleConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryScheduleConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putScheduleConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfiguration> __cast_cd4240 = (java.util.List<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargetConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetErrorReportConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetErrorReportConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastRunSummary() {
        software.amazon.jsii.Kernel.call(this, "resetLastRunSummary", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecentlyFailedRuns() {
        software.amazon.jsii.Kernel.call(this, "resetRecentlyFailedRuns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduleConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTargetConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetTargetConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCreationTime() {
        return software.amazon.jsii.Kernel.get(this, "creationTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryErrorReportConfigurationList getErrorReportConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "errorReportConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryErrorReportConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryList getLastRunSummary() {
        return software.amazon.jsii.Kernel.get(this, "lastRunSummary", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNextInvocationTime() {
        return software.amazon.jsii.Kernel.get(this, "nextInvocationTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryNotificationConfigurationList getNotificationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "notificationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryNotificationConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreviousInvocationTime() {
        return software.amazon.jsii.Kernel.get(this, "previousInvocationTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRunsList getRecentlyFailedRuns() {
        return software.amazon.jsii.Kernel.get(this, "recentlyFailedRuns", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRunsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryScheduleConfigurationList getScheduleConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "scheduleConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryScheduleConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationList getTargetConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "targetConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getErrorReportConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "errorReportConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLastRunSummaryInput() {
        return software.amazon.jsii.Kernel.get(this, "lastRunSummaryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNotificationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQueryStringInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRecentlyFailedRunsInput() {
        return software.amazon.jsii.Kernel.get(this, "recentlyFailedRunsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getScheduleConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "targetConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "executionRoleArn", java.util.Objects.requireNonNull(value, "executionRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQueryString() {
        return software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQueryString(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "queryString", java.util.Objects.requireNonNull(value, "queryString is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQuery}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQuery> {
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
        private final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_role_arn TimestreamqueryScheduledQuery#execution_role_arn}.
         * <p>
         * @return {@code this}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_role_arn TimestreamqueryScheduledQuery#execution_role_arn}. This parameter is required.
         */
        public Builder executionRoleArn(final java.lang.String executionRoleArn) {
            this.config.executionRoleArn(executionRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_string TimestreamqueryScheduledQuery#query_string}.
         * <p>
         * @return {@code this}
         * @param queryString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_string TimestreamqueryScheduledQuery#query_string}. This parameter is required.
         */
        public Builder queryString(final java.lang.String queryString) {
            this.config.queryString(queryString);
            return this;
        }

        /**
         * error_report_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_configuration TimestreamqueryScheduledQuery#error_report_configuration}
         * <p>
         * @return {@code this}
         * @param errorReportConfiguration error_report_configuration block. This parameter is required.
         */
        public Builder errorReportConfiguration(final com.hashicorp.cdktf.IResolvable errorReportConfiguration) {
            this.config.errorReportConfiguration(errorReportConfiguration);
            return this;
        }
        /**
         * error_report_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_configuration TimestreamqueryScheduledQuery#error_report_configuration}
         * <p>
         * @return {@code this}
         * @param errorReportConfiguration error_report_configuration block. This parameter is required.
         */
        public Builder errorReportConfiguration(final java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryErrorReportConfiguration> errorReportConfiguration) {
            this.config.errorReportConfiguration(errorReportConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#kms_key_id TimestreamqueryScheduledQuery#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#kms_key_id TimestreamqueryScheduledQuery#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * last_run_summary block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#last_run_summary TimestreamqueryScheduledQuery#last_run_summary}
         * <p>
         * @return {@code this}
         * @param lastRunSummary last_run_summary block. This parameter is required.
         */
        public Builder lastRunSummary(final com.hashicorp.cdktf.IResolvable lastRunSummary) {
            this.config.lastRunSummary(lastRunSummary);
            return this;
        }
        /**
         * last_run_summary block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#last_run_summary TimestreamqueryScheduledQuery#last_run_summary}
         * <p>
         * @return {@code this}
         * @param lastRunSummary last_run_summary block. This parameter is required.
         */
        public Builder lastRunSummary(final java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummary> lastRunSummary) {
            this.config.lastRunSummary(lastRunSummary);
            return this;
        }

        /**
         * notification_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#notification_configuration TimestreamqueryScheduledQuery#notification_configuration}
         * <p>
         * @return {@code this}
         * @param notificationConfiguration notification_configuration block. This parameter is required.
         */
        public Builder notificationConfiguration(final com.hashicorp.cdktf.IResolvable notificationConfiguration) {
            this.config.notificationConfiguration(notificationConfiguration);
            return this;
        }
        /**
         * notification_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#notification_configuration TimestreamqueryScheduledQuery#notification_configuration}
         * <p>
         * @return {@code this}
         * @param notificationConfiguration notification_configuration block. This parameter is required.
         */
        public Builder notificationConfiguration(final java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryNotificationConfiguration> notificationConfiguration) {
            this.config.notificationConfiguration(notificationConfiguration);
            return this;
        }

        /**
         * recently_failed_runs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#recently_failed_runs TimestreamqueryScheduledQuery#recently_failed_runs}
         * <p>
         * @return {@code this}
         * @param recentlyFailedRuns recently_failed_runs block. This parameter is required.
         */
        public Builder recentlyFailedRuns(final com.hashicorp.cdktf.IResolvable recentlyFailedRuns) {
            this.config.recentlyFailedRuns(recentlyFailedRuns);
            return this;
        }
        /**
         * recently_failed_runs block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#recently_failed_runs TimestreamqueryScheduledQuery#recently_failed_runs}
         * <p>
         * @return {@code this}
         * @param recentlyFailedRuns recently_failed_runs block. This parameter is required.
         */
        public Builder recentlyFailedRuns(final java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRuns> recentlyFailedRuns) {
            this.config.recentlyFailedRuns(recentlyFailedRuns);
            return this;
        }

        /**
         * schedule_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_configuration TimestreamqueryScheduledQuery#schedule_configuration}
         * <p>
         * @return {@code this}
         * @param scheduleConfiguration schedule_configuration block. This parameter is required.
         */
        public Builder scheduleConfiguration(final com.hashicorp.cdktf.IResolvable scheduleConfiguration) {
            this.config.scheduleConfiguration(scheduleConfiguration);
            return this;
        }
        /**
         * schedule_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_configuration TimestreamqueryScheduledQuery#schedule_configuration}
         * <p>
         * @return {@code this}
         * @param scheduleConfiguration schedule_configuration block. This parameter is required.
         */
        public Builder scheduleConfiguration(final java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryScheduleConfiguration> scheduleConfiguration) {
            this.config.scheduleConfiguration(scheduleConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#tags TimestreamqueryScheduledQuery#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#tags TimestreamqueryScheduledQuery#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * target_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_configuration TimestreamqueryScheduledQuery#target_configuration}
         * <p>
         * @return {@code this}
         * @param targetConfiguration target_configuration block. This parameter is required.
         */
        public Builder targetConfiguration(final com.hashicorp.cdktf.IResolvable targetConfiguration) {
            this.config.targetConfiguration(targetConfiguration);
            return this;
        }
        /**
         * target_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_configuration TimestreamqueryScheduledQuery#target_configuration}
         * <p>
         * @return {@code this}
         * @param targetConfiguration target_configuration block. This parameter is required.
         */
        public Builder targetConfiguration(final java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfiguration> targetConfiguration) {
            this.config.targetConfiguration(targetConfiguration);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#timeouts TimestreamqueryScheduledQuery#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQuery}.
         */
        @Override
        public imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQuery build() {
            return new imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQuery(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
