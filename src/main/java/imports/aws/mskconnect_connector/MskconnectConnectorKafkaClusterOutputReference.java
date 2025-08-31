package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.920Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorKafkaClusterOutputReference")
public class MskconnectConnectorKafkaClusterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskconnectConnectorKafkaClusterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskconnectConnectorKafkaClusterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskconnectConnectorKafkaClusterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putApacheKafkaCluster(final @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterApacheKafkaCluster value) {
        software.amazon.jsii.Kernel.call(this, "putApacheKafkaCluster", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterApacheKafkaClusterOutputReference getApacheKafkaCluster() {
        return software.amazon.jsii.Kernel.get(this, "apacheKafkaCluster", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterApacheKafkaClusterOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterApacheKafkaCluster getApacheKafkaClusterInput() {
        return software.amazon.jsii.Kernel.get(this, "apacheKafkaClusterInput", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaClusterApacheKafkaCluster.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorKafkaCluster value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
