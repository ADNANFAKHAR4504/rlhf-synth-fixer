package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.909Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess")
@software.amazon.jsii.Jsii.Proxy(MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess.Jsii$Proxy.class)
public interface MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#type MskCluster#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess> {
        java.lang.String type;

        /**
         * Sets the value of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#type MskCluster#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess {
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess.Jsii$Proxy that = (MskClusterBrokerNodeGroupInfoConnectivityInfoPublicAccess.Jsii$Proxy) o;

            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type != null ? this.type.hashCode() : 0;
            return result;
        }
    }
}
