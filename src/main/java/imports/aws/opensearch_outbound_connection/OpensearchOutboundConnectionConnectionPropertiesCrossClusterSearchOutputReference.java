package imports.aws.opensearch_outbound_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference")
public class OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSkipUnavailable() {
        software.amazon.jsii.Kernel.call(this, "resetSkipUnavailable", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSkipUnavailableInput() {
        return software.amazon.jsii.Kernel.get(this, "skipUnavailableInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSkipUnavailable() {
        return software.amazon.jsii.Kernel.get(this, "skipUnavailable", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSkipUnavailable(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "skipUnavailable", java.util.Objects.requireNonNull(value, "skipUnavailable is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opensearch_outbound_connection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
