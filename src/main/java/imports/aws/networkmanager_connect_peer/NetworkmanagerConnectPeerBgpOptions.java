package imports.aws.networkmanager_connect_peer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.965Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerConnectPeer.NetworkmanagerConnectPeerBgpOptions")
@software.amazon.jsii.Jsii.Proxy(NetworkmanagerConnectPeerBgpOptions.Jsii$Proxy.class)
public interface NetworkmanagerConnectPeerBgpOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#peer_asn NetworkmanagerConnectPeer#peer_asn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPeerAsn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkmanagerConnectPeerBgpOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkmanagerConnectPeerBgpOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkmanagerConnectPeerBgpOptions> {
        java.lang.Number peerAsn;

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerBgpOptions#getPeerAsn}
         * @param peerAsn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#peer_asn NetworkmanagerConnectPeer#peer_asn}.
         * @return {@code this}
         */
        public Builder peerAsn(java.lang.Number peerAsn) {
            this.peerAsn = peerAsn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkmanagerConnectPeerBgpOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkmanagerConnectPeerBgpOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkmanagerConnectPeerBgpOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkmanagerConnectPeerBgpOptions {
        private final java.lang.Number peerAsn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.peerAsn = software.amazon.jsii.Kernel.get(this, "peerAsn", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.peerAsn = builder.peerAsn;
        }

        @Override
        public final java.lang.Number getPeerAsn() {
            return this.peerAsn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPeerAsn() != null) {
                data.set("peerAsn", om.valueToTree(this.getPeerAsn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkmanagerConnectPeer.NetworkmanagerConnectPeerBgpOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkmanagerConnectPeerBgpOptions.Jsii$Proxy that = (NetworkmanagerConnectPeerBgpOptions.Jsii$Proxy) o;

            return this.peerAsn != null ? this.peerAsn.equals(that.peerAsn) : that.peerAsn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.peerAsn != null ? this.peerAsn.hashCode() : 0;
            return result;
        }
    }
}
