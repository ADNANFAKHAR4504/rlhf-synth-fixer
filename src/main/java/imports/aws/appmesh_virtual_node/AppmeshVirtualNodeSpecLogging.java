package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.048Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecLogging")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecLogging.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecLogging extends software.amazon.jsii.JsiiSerializable {

    /**
     * access_log block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#access_log AppmeshVirtualNode#access_log}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLog getAccessLog() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecLogging}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecLogging}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecLogging> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLog accessLog;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecLogging#getAccessLog}
         * @param accessLog access_log block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#access_log AppmeshVirtualNode#access_log}
         * @return {@code this}
         */
        public Builder accessLog(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLog accessLog) {
            this.accessLog = accessLog;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecLogging}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecLogging build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecLogging}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecLogging {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLog accessLog;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessLog = software.amazon.jsii.Kernel.get(this, "accessLog", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLog.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessLog = builder.accessLog;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLog getAccessLog() {
            return this.accessLog;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccessLog() != null) {
                data.set("accessLog", om.valueToTree(this.getAccessLog()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecLogging"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecLogging.Jsii$Proxy that = (AppmeshVirtualNodeSpecLogging.Jsii$Proxy) o;

            return this.accessLog != null ? this.accessLog.equals(that.accessLog) : that.accessLog == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accessLog != null ? this.accessLog.hashCode() : 0;
            return result;
        }
    }
}
