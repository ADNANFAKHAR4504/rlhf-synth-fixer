package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersOutputReference")
public class SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchConfig(final @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNotificationConfig(final @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putNotificationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putParameter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersParameter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersParameter> __cast_cd4240 = (java.util.List<imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersParameter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersParameter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putParameter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComment() {
        software.amazon.jsii.Kernel.call(this, "resetComment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocumentHash() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentHash", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocumentHashType() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentHashType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocumentVersion() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputS3Bucket() {
        software.amazon.jsii.Kernel.call(this, "resetOutputS3Bucket", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputS3KeyPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetOutputS3KeyPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameter() {
        software.amazon.jsii.Kernel.call(this, "resetParameter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetServiceRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfigOutputReference getCloudwatchConfig() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchConfig", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfigOutputReference getNotificationConfig() {
        return software.amazon.jsii.Kernel.get(this, "notificationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersParameterList getParameter() {
        return software.amazon.jsii.Kernel.get(this, "parameter", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersParameterList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig getCloudwatchConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCommentInput() {
        return software.amazon.jsii.Kernel.get(this, "commentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDocumentHashInput() {
        return software.amazon.jsii.Kernel.get(this, "documentHashInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDocumentHashTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "documentHashTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDocumentVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "documentVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig getNotificationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "outputS3BucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputS3KeyPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "outputS3KeyPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getParameterInput() {
        return software.amazon.jsii.Kernel.get(this, "parameterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComment() {
        return software.amazon.jsii.Kernel.get(this, "comment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "comment", java.util.Objects.requireNonNull(value, "comment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDocumentHash() {
        return software.amazon.jsii.Kernel.get(this, "documentHash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDocumentHash(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "documentHash", java.util.Objects.requireNonNull(value, "documentHash is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDocumentHashType() {
        return software.amazon.jsii.Kernel.get(this, "documentHashType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDocumentHashType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "documentHashType", java.util.Objects.requireNonNull(value, "documentHashType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDocumentVersion() {
        return software.amazon.jsii.Kernel.get(this, "documentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDocumentVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "documentVersion", java.util.Objects.requireNonNull(value, "documentVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "outputS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputS3Bucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputS3Bucket", java.util.Objects.requireNonNull(value, "outputS3Bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputS3KeyPrefix() {
        return software.amazon.jsii.Kernel.get(this, "outputS3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputS3KeyPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputS3KeyPrefix", java.util.Objects.requireNonNull(value, "outputS3KeyPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceRoleArn", java.util.Objects.requireNonNull(value, "serviceRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "timeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutSeconds", java.util.Objects.requireNonNull(value, "timeoutSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
