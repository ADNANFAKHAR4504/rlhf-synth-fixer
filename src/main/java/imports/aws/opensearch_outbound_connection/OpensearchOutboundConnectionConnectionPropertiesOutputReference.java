package imports.aws.opensearch_outbound_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionPropertiesOutputReference")
public class OpensearchOutboundConnectionConnectionPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpensearchOutboundConnectionConnectionPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpensearchOutboundConnectionConnectionPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpensearchOutboundConnectionConnectionPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCrossClusterSearch(final @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch value) {
        software.amazon.jsii.Kernel.call(this, "putCrossClusterSearch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCrossClusterSearch() {
        software.amazon.jsii.Kernel.call(this, "resetCrossClusterSearch", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference getCrossClusterSearch() {
        return software.amazon.jsii.Kernel.get(this, "crossClusterSearch", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch getCrossClusterSearchInput() {
        return software.amazon.jsii.Kernel.get(this, "crossClusterSearchInput", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
