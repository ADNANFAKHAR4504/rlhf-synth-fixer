package imports.aws.vpc_ipam_resource_discovery;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.603Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcIpamResourceDiscovery.VpcIpamResourceDiscoveryOperatingRegions")
@software.amazon.jsii.Jsii.Proxy(VpcIpamResourceDiscoveryOperatingRegions.Jsii$Proxy.class)
public interface VpcIpamResourceDiscoveryOperatingRegions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_resource_discovery#region_name VpcIpamResourceDiscovery#region_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegionName();

    /**
     * @return a {@link Builder} of {@link VpcIpamResourceDiscoveryOperatingRegions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcIpamResourceDiscoveryOperatingRegions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcIpamResourceDiscoveryOperatingRegions> {
        java.lang.String regionName;

        /**
         * Sets the value of {@link VpcIpamResourceDiscoveryOperatingRegions#getRegionName}
         * @param regionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_resource_discovery#region_name VpcIpamResourceDiscovery#region_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder regionName(java.lang.String regionName) {
            this.regionName = regionName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpcIpamResourceDiscoveryOperatingRegions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcIpamResourceDiscoveryOperatingRegions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcIpamResourceDiscoveryOperatingRegions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcIpamResourceDiscoveryOperatingRegions {
        private final java.lang.String regionName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.regionName = software.amazon.jsii.Kernel.get(this, "regionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.regionName = java.util.Objects.requireNonNull(builder.regionName, "regionName is required");
        }

        @Override
        public final java.lang.String getRegionName() {
            return this.regionName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("regionName", om.valueToTree(this.getRegionName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpcIpamResourceDiscovery.VpcIpamResourceDiscoveryOperatingRegions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcIpamResourceDiscoveryOperatingRegions.Jsii$Proxy that = (VpcIpamResourceDiscoveryOperatingRegions.Jsii$Proxy) o;

            return this.regionName.equals(that.regionName);
        }

        @Override
        public final int hashCode() {
            int result = this.regionName.hashCode();
            return result;
        }
    }
}
