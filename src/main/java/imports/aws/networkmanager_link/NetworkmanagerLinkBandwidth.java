package imports.aws.networkmanager_link;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.972Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerLink.NetworkmanagerLinkBandwidth")
@software.amazon.jsii.Jsii.Proxy(NetworkmanagerLinkBandwidth.Jsii$Proxy.class)
public interface NetworkmanagerLinkBandwidth extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_link#download_speed NetworkmanagerLink#download_speed}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDownloadSpeed() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_link#upload_speed NetworkmanagerLink#upload_speed}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUploadSpeed() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkmanagerLinkBandwidth}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkmanagerLinkBandwidth}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkmanagerLinkBandwidth> {
        java.lang.Number downloadSpeed;
        java.lang.Number uploadSpeed;

        /**
         * Sets the value of {@link NetworkmanagerLinkBandwidth#getDownloadSpeed}
         * @param downloadSpeed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_link#download_speed NetworkmanagerLink#download_speed}.
         * @return {@code this}
         */
        public Builder downloadSpeed(java.lang.Number downloadSpeed) {
            this.downloadSpeed = downloadSpeed;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerLinkBandwidth#getUploadSpeed}
         * @param uploadSpeed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_link#upload_speed NetworkmanagerLink#upload_speed}.
         * @return {@code this}
         */
        public Builder uploadSpeed(java.lang.Number uploadSpeed) {
            this.uploadSpeed = uploadSpeed;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkmanagerLinkBandwidth}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkmanagerLinkBandwidth build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkmanagerLinkBandwidth}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkmanagerLinkBandwidth {
        private final java.lang.Number downloadSpeed;
        private final java.lang.Number uploadSpeed;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.downloadSpeed = software.amazon.jsii.Kernel.get(this, "downloadSpeed", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.uploadSpeed = software.amazon.jsii.Kernel.get(this, "uploadSpeed", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.downloadSpeed = builder.downloadSpeed;
            this.uploadSpeed = builder.uploadSpeed;
        }

        @Override
        public final java.lang.Number getDownloadSpeed() {
            return this.downloadSpeed;
        }

        @Override
        public final java.lang.Number getUploadSpeed() {
            return this.uploadSpeed;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDownloadSpeed() != null) {
                data.set("downloadSpeed", om.valueToTree(this.getDownloadSpeed()));
            }
            if (this.getUploadSpeed() != null) {
                data.set("uploadSpeed", om.valueToTree(this.getUploadSpeed()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkmanagerLink.NetworkmanagerLinkBandwidth"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkmanagerLinkBandwidth.Jsii$Proxy that = (NetworkmanagerLinkBandwidth.Jsii$Proxy) o;

            if (this.downloadSpeed != null ? !this.downloadSpeed.equals(that.downloadSpeed) : that.downloadSpeed != null) return false;
            return this.uploadSpeed != null ? this.uploadSpeed.equals(that.uploadSpeed) : that.uploadSpeed == null;
        }

        @Override
        public final int hashCode() {
            int result = this.downloadSpeed != null ? this.downloadSpeed.hashCode() : 0;
            result = 31 * result + (this.uploadSpeed != null ? this.uploadSpeed.hashCode() : 0);
            return result;
        }
    }
}
