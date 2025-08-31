package imports.aws.networkmanager_device;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.970Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerDevice.NetworkmanagerDeviceAwsLocation")
@software.amazon.jsii.Jsii.Proxy(NetworkmanagerDeviceAwsLocation.Jsii$Proxy.class)
public interface NetworkmanagerDeviceAwsLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#subnet_arn NetworkmanagerDevice#subnet_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#zone NetworkmanagerDevice#zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getZone() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkmanagerDeviceAwsLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkmanagerDeviceAwsLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkmanagerDeviceAwsLocation> {
        java.lang.String subnetArn;
        java.lang.String zone;

        /**
         * Sets the value of {@link NetworkmanagerDeviceAwsLocation#getSubnetArn}
         * @param subnetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#subnet_arn NetworkmanagerDevice#subnet_arn}.
         * @return {@code this}
         */
        public Builder subnetArn(java.lang.String subnetArn) {
            this.subnetArn = subnetArn;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerDeviceAwsLocation#getZone}
         * @param zone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_device#zone NetworkmanagerDevice#zone}.
         * @return {@code this}
         */
        public Builder zone(java.lang.String zone) {
            this.zone = zone;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkmanagerDeviceAwsLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkmanagerDeviceAwsLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkmanagerDeviceAwsLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkmanagerDeviceAwsLocation {
        private final java.lang.String subnetArn;
        private final java.lang.String zone;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.subnetArn = software.amazon.jsii.Kernel.get(this, "subnetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.zone = software.amazon.jsii.Kernel.get(this, "zone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.subnetArn = builder.subnetArn;
            this.zone = builder.zone;
        }

        @Override
        public final java.lang.String getSubnetArn() {
            return this.subnetArn;
        }

        @Override
        public final java.lang.String getZone() {
            return this.zone;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSubnetArn() != null) {
                data.set("subnetArn", om.valueToTree(this.getSubnetArn()));
            }
            if (this.getZone() != null) {
                data.set("zone", om.valueToTree(this.getZone()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkmanagerDevice.NetworkmanagerDeviceAwsLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkmanagerDeviceAwsLocation.Jsii$Proxy that = (NetworkmanagerDeviceAwsLocation.Jsii$Proxy) o;

            if (this.subnetArn != null ? !this.subnetArn.equals(that.subnetArn) : that.subnetArn != null) return false;
            return this.zone != null ? this.zone.equals(that.zone) : that.zone == null;
        }

        @Override
        public final int hashCode() {
            int result = this.subnetArn != null ? this.subnetArn.hashCode() : 0;
            result = 31 * result + (this.zone != null ? this.zone.hashCode() : 0);
            return result;
        }
    }
}
