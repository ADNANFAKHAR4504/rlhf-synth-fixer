package imports.aws.networkmanager_site;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.973Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerSite.NetworkmanagerSiteLocation")
@software.amazon.jsii.Jsii.Proxy(NetworkmanagerSiteLocation.Jsii$Proxy.class)
public interface NetworkmanagerSiteLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_site#address NetworkmanagerSite#address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_site#latitude NetworkmanagerSite#latitude}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLatitude() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_site#longitude NetworkmanagerSite#longitude}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLongitude() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkmanagerSiteLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkmanagerSiteLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkmanagerSiteLocation> {
        java.lang.String address;
        java.lang.String latitude;
        java.lang.String longitude;

        /**
         * Sets the value of {@link NetworkmanagerSiteLocation#getAddress}
         * @param address Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_site#address NetworkmanagerSite#address}.
         * @return {@code this}
         */
        public Builder address(java.lang.String address) {
            this.address = address;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerSiteLocation#getLatitude}
         * @param latitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_site#latitude NetworkmanagerSite#latitude}.
         * @return {@code this}
         */
        public Builder latitude(java.lang.String latitude) {
            this.latitude = latitude;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerSiteLocation#getLongitude}
         * @param longitude Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_site#longitude NetworkmanagerSite#longitude}.
         * @return {@code this}
         */
        public Builder longitude(java.lang.String longitude) {
            this.longitude = longitude;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkmanagerSiteLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkmanagerSiteLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkmanagerSiteLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkmanagerSiteLocation {
        private final java.lang.String address;
        private final java.lang.String latitude;
        private final java.lang.String longitude;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.address = software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.latitude = software.amazon.jsii.Kernel.get(this, "latitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.longitude = software.amazon.jsii.Kernel.get(this, "longitude", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.address = builder.address;
            this.latitude = builder.latitude;
            this.longitude = builder.longitude;
        }

        @Override
        public final java.lang.String getAddress() {
            return this.address;
        }

        @Override
        public final java.lang.String getLatitude() {
            return this.latitude;
        }

        @Override
        public final java.lang.String getLongitude() {
            return this.longitude;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAddress() != null) {
                data.set("address", om.valueToTree(this.getAddress()));
            }
            if (this.getLatitude() != null) {
                data.set("latitude", om.valueToTree(this.getLatitude()));
            }
            if (this.getLongitude() != null) {
                data.set("longitude", om.valueToTree(this.getLongitude()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkmanagerSite.NetworkmanagerSiteLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkmanagerSiteLocation.Jsii$Proxy that = (NetworkmanagerSiteLocation.Jsii$Proxy) o;

            if (this.address != null ? !this.address.equals(that.address) : that.address != null) return false;
            if (this.latitude != null ? !this.latitude.equals(that.latitude) : that.latitude != null) return false;
            return this.longitude != null ? this.longitude.equals(that.longitude) : that.longitude == null;
        }

        @Override
        public final int hashCode() {
            int result = this.address != null ? this.address.hashCode() : 0;
            result = 31 * result + (this.latitude != null ? this.latitude.hashCode() : 0);
            result = 31 * result + (this.longitude != null ? this.longitude.hashCode() : 0);
            return result;
        }
    }
}
