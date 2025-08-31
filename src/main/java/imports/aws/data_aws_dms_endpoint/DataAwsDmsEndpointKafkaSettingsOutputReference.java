package imports.aws.data_aws_dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.554Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsDmsEndpoint.DataAwsDmsEndpointKafkaSettingsOutputReference")
public class DataAwsDmsEndpointKafkaSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsDmsEndpointKafkaSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsDmsEndpointKafkaSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsDmsEndpointKafkaSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBroker() {
        return software.amazon.jsii.Kernel.get(this, "broker", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getIncludeControlDetails() {
        return software.amazon.jsii.Kernel.get(this, "includeControlDetails", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getIncludeNullAndEmpty() {
        return software.amazon.jsii.Kernel.get(this, "includeNullAndEmpty", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getIncludePartitionValue() {
        return software.amazon.jsii.Kernel.get(this, "includePartitionValue", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getIncludeTableAlterOperations() {
        return software.amazon.jsii.Kernel.get(this, "includeTableAlterOperations", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getIncludeTransactionDetails() {
        return software.amazon.jsii.Kernel.get(this, "includeTransactionDetails", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageFormat() {
        return software.amazon.jsii.Kernel.get(this, "messageFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMessageMaxBytes() {
        return software.amazon.jsii.Kernel.get(this, "messageMaxBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getNoHexPrefix() {
        return software.amazon.jsii.Kernel.get(this, "noHexPrefix", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getPartitionIncludeSchemaTable() {
        return software.amazon.jsii.Kernel.get(this, "partitionIncludeSchemaTable", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSaslMechanism() {
        return software.amazon.jsii.Kernel.get(this, "saslMechanism", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSaslPassword() {
        return software.amazon.jsii.Kernel.get(this, "saslPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSaslUsername() {
        return software.amazon.jsii.Kernel.get(this, "saslUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityProtocol() {
        return software.amazon.jsii.Kernel.get(this, "securityProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslCaCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "sslCaCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslClientCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "sslClientCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslClientKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "sslClientKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSslClientKeyPassword() {
        return software.amazon.jsii.Kernel.get(this, "sslClientKeyPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTopic() {
        return software.amazon.jsii.Kernel.get(this, "topic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_dms_endpoint.DataAwsDmsEndpointKafkaSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_dms_endpoint.DataAwsDmsEndpointKafkaSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_dms_endpoint.DataAwsDmsEndpointKafkaSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
