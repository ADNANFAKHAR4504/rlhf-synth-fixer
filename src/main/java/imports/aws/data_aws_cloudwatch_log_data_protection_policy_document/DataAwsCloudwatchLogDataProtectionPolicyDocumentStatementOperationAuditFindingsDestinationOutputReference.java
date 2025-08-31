package imports.aws.data_aws_cloudwatch_log_data_protection_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.513Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudwatchLogDataProtectionPolicyDocument.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationOutputReference")
public class DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLogs(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationCloudwatchLogs value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFirehose(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose value) {
        software.amazon.jsii.Kernel.call(this, "putFirehose", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogs() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirehose() {
        software.amazon.jsii.Kernel.call(this, "resetFirehose", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3() {
        software.amazon.jsii.Kernel.call(this, "resetS3", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationCloudwatchLogsOutputReference getCloudwatchLogs() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationCloudwatchLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehoseOutputReference getFirehose() {
        return software.amazon.jsii.Kernel.get(this, "firehose", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehoseOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3OutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationCloudwatchLogs getCloudwatchLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationCloudwatchLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose getFirehoseInput() {
        return software.amazon.jsii.Kernel.get(this, "firehoseInput", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationFirehose.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestinationS3.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudwatch_log_data_protection_policy_document.DataAwsCloudwatchLogDataProtectionPolicyDocumentStatementOperationAuditFindingsDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
