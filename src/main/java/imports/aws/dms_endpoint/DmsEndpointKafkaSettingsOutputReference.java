package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointKafkaSettingsOutputReference")
public class DmsEndpointKafkaSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DmsEndpointKafkaSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsEndpointKafkaSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DmsEndpointKafkaSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIncludeControlDetails() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeControlDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeNullAndEmpty() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeNullAndEmpty", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludePartitionValue() {
        software.amazon.jsii.Kernel.call(this, "resetIncludePartitionValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeTableAlterOperations() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeTableAlterOperations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeTransactionDetails() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeTransactionDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessageFormat() {
        software.amazon.jsii.Kernel.call(this, "resetMessageFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessageMaxBytes() {
        software.amazon.jsii.Kernel.call(this, "resetMessageMaxBytes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNoHexPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNoHexPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPartitionIncludeSchemaTable() {
        software.amazon.jsii.Kernel.call(this, "resetPartitionIncludeSchemaTable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSaslMechanism() {
        software.amazon.jsii.Kernel.call(this, "resetSaslMechanism", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSaslPassword() {
        software.amazon.jsii.Kernel.call(this, "resetSaslPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSaslUsername() {
        software.amazon.jsii.Kernel.call(this, "resetSaslUsername", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslCaCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetSslCaCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslClientCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetSslClientCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslClientKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetSslClientKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslClientKeyPassword() {
        software.amazon.jsii.Kernel.call(this, "resetSslClientKeyPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTopic() {
        software.amazon.jsii.Kernel.call(this, "resetTopic", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBrokerInput() {
        return software.amazon.jsii.Kernel.get(this, "brokerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeControlDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeControlDetailsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeNullAndEmptyInput() {
        return software.amazon.jsii.Kernel.get(this, "includeNullAndEmptyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludePartitionValueInput() {
        return software.amazon.jsii.Kernel.get(this, "includePartitionValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTableAlterOperationsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeTableAlterOperationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTransactionDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeTransactionDetailsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "messageFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMessageMaxBytesInput() {
        return software.amazon.jsii.Kernel.get(this, "messageMaxBytesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoHexPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "noHexPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPartitionIncludeSchemaTableInput() {
        return software.amazon.jsii.Kernel.get(this, "partitionIncludeSchemaTableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSaslMechanismInput() {
        return software.amazon.jsii.Kernel.get(this, "saslMechanismInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSaslPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "saslPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSaslUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "saslUsernameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "securityProtocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslCaCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sslCaCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslClientCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sslClientCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslClientKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sslClientKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSslClientKeyPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "sslClientKeyPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTopicInput() {
        return software.amazon.jsii.Kernel.get(this, "topicInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBroker() {
        return software.amazon.jsii.Kernel.get(this, "broker", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBroker(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "broker", java.util.Objects.requireNonNull(value, "broker is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeControlDetails() {
        return software.amazon.jsii.Kernel.get(this, "includeControlDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeControlDetails(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeControlDetails", java.util.Objects.requireNonNull(value, "includeControlDetails is required"));
    }

    public void setIncludeControlDetails(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeControlDetails", java.util.Objects.requireNonNull(value, "includeControlDetails is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeNullAndEmpty() {
        return software.amazon.jsii.Kernel.get(this, "includeNullAndEmpty", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeNullAndEmpty(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeNullAndEmpty", java.util.Objects.requireNonNull(value, "includeNullAndEmpty is required"));
    }

    public void setIncludeNullAndEmpty(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeNullAndEmpty", java.util.Objects.requireNonNull(value, "includeNullAndEmpty is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludePartitionValue() {
        return software.amazon.jsii.Kernel.get(this, "includePartitionValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludePartitionValue(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includePartitionValue", java.util.Objects.requireNonNull(value, "includePartitionValue is required"));
    }

    public void setIncludePartitionValue(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includePartitionValue", java.util.Objects.requireNonNull(value, "includePartitionValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeTableAlterOperations() {
        return software.amazon.jsii.Kernel.get(this, "includeTableAlterOperations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeTableAlterOperations(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeTableAlterOperations", java.util.Objects.requireNonNull(value, "includeTableAlterOperations is required"));
    }

    public void setIncludeTableAlterOperations(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeTableAlterOperations", java.util.Objects.requireNonNull(value, "includeTableAlterOperations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeTransactionDetails() {
        return software.amazon.jsii.Kernel.get(this, "includeTransactionDetails", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeTransactionDetails(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeTransactionDetails", java.util.Objects.requireNonNull(value, "includeTransactionDetails is required"));
    }

    public void setIncludeTransactionDetails(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeTransactionDetails", java.util.Objects.requireNonNull(value, "includeTransactionDetails is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageFormat() {
        return software.amazon.jsii.Kernel.get(this, "messageFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageFormat", java.util.Objects.requireNonNull(value, "messageFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMessageMaxBytes() {
        return software.amazon.jsii.Kernel.get(this, "messageMaxBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMessageMaxBytes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "messageMaxBytes", java.util.Objects.requireNonNull(value, "messageMaxBytes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getNoHexPrefix() {
        return software.amazon.jsii.Kernel.get(this, "noHexPrefix", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setNoHexPrefix(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "noHexPrefix", java.util.Objects.requireNonNull(value, "noHexPrefix is required"));
    }

    public void setNoHexPrefix(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "noHexPrefix", java.util.Objects.requireNonNull(value, "noHexPrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPartitionIncludeSchemaTable() {
        return software.amazon.jsii.Kernel.get(this, "partitionIncludeSchemaTable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPartitionIncludeSchemaTable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "partitionIncludeSchemaTable", java.util.Objects.requireNonNull(value, "partitionIncludeSchemaTable is required"));
    }

    public void setPartitionIncludeSchemaTable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "partitionIncludeSchemaTable", java.util.Objects.requireNonNull(value, "partitionIncludeSchemaTable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSaslMechanism() {
        return software.amazon.jsii.Kernel.get(this, "saslMechanism", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSaslMechanism(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "saslMechanism", java.util.Objects.requireNonNull(value, "saslMechanism is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSaslPassword() {
        return software.amazon.jsii.Kernel.get(this, "saslPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSaslPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "saslPassword", java.util.Objects.requireNonNull(value, "saslPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSaslUsername() {
        return software.amazon.jsii.Kernel.get(this, "saslUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSaslUsername(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "saslUsername", java.util.Objects.requireNonNull(value, "saslUsername is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityProtocol() {
        return software.amazon.jsii.Kernel.get(this, "securityProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityProtocol", java.util.Objects.requireNonNull(value, "securityProtocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslCaCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "sslCaCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslCaCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslCaCertificateArn", java.util.Objects.requireNonNull(value, "sslCaCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslClientCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "sslClientCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslClientCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslClientCertificateArn", java.util.Objects.requireNonNull(value, "sslClientCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslClientKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "sslClientKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslClientKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslClientKeyArn", java.util.Objects.requireNonNull(value, "sslClientKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslClientKeyPassword() {
        return software.amazon.jsii.Kernel.get(this, "sslClientKeyPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSslClientKeyPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sslClientKeyPassword", java.util.Objects.requireNonNull(value, "sslClientKeyPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTopic() {
        return software.amazon.jsii.Kernel.get(this, "topic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTopic(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "topic", java.util.Objects.requireNonNull(value, "topic is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointKafkaSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointKafkaSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointKafkaSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
