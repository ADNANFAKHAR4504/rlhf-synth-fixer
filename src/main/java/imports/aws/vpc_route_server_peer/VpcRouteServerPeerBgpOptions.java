package imports.aws.vpc_route_server_peer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.611Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcRouteServerPeer.VpcRouteServerPeerBgpOptions")
@software.amazon.jsii.Jsii.Proxy(VpcRouteServerPeerBgpOptions.Jsii$Proxy.class)
public interface VpcRouteServerPeerBgpOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_route_server_peer#peer_asn VpcRouteServerPeer#peer_asn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPeerAsn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_route_server_peer#peer_liveness_detection VpcRouteServerPeer#peer_liveness_detection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPeerLivenessDetection() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcRouteServerPeerBgpOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcRouteServerPeerBgpOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcRouteServerPeerBgpOptions> {
        java.lang.Number peerAsn;
        java.lang.String peerLivenessDetection;

        /**
         * Sets the value of {@link VpcRouteServerPeerBgpOptions#getPeerAsn}
         * @param peerAsn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_route_server_peer#peer_asn VpcRouteServerPeer#peer_asn}. This parameter is required.
         * @return {@code this}
         */
        public Builder peerAsn(java.lang.Number peerAsn) {
            this.peerAsn = peerAsn;
            return this;
        }

        /**
         * Sets the value of {@link VpcRouteServerPeerBgpOptions#getPeerLivenessDetection}
         * @param peerLivenessDetection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_route_server_peer#peer_liveness_detection VpcRouteServerPeer#peer_liveness_detection}.
         * @return {@code this}
         */
        public Builder peerLivenessDetection(java.lang.String peerLivenessDetection) {
            this.peerLivenessDetection = peerLivenessDetection;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpcRouteServerPeerBgpOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcRouteServerPeerBgpOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcRouteServerPeerBgpOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcRouteServerPeerBgpOptions {
        private final java.lang.Number peerAsn;
        private final java.lang.String peerLivenessDetection;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.peerAsn = software.amazon.jsii.Kernel.get(this, "peerAsn", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.peerLivenessDetection = software.amazon.jsii.Kernel.get(this, "peerLivenessDetection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.peerAsn = java.util.Objects.requireNonNull(builder.peerAsn, "peerAsn is required");
            this.peerLivenessDetection = builder.peerLivenessDetection;
        }

        @Override
        public final java.lang.Number getPeerAsn() {
            return this.peerAsn;
        }

        @Override
        public final java.lang.String getPeerLivenessDetection() {
            return this.peerLivenessDetection;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("peerAsn", om.valueToTree(this.getPeerAsn()));
            if (this.getPeerLivenessDetection() != null) {
                data.set("peerLivenessDetection", om.valueToTree(this.getPeerLivenessDetection()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpcRouteServerPeer.VpcRouteServerPeerBgpOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcRouteServerPeerBgpOptions.Jsii$Proxy that = (VpcRouteServerPeerBgpOptions.Jsii$Proxy) o;

            if (!peerAsn.equals(that.peerAsn)) return false;
            return this.peerLivenessDetection != null ? this.peerLivenessDetection.equals(that.peerLivenessDetection) : that.peerLivenessDetection == null;
        }

        @Override
        public final int hashCode() {
            int result = this.peerAsn.hashCode();
            result = 31 * result + (this.peerLivenessDetection != null ? this.peerLivenessDetection.hashCode() : 0);
            return result;
        }
    }
}
