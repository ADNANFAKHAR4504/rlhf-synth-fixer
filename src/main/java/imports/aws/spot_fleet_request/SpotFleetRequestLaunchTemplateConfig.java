package imports.aws.spot_fleet_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.485Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotFleetRequest.SpotFleetRequestLaunchTemplateConfig")
@software.amazon.jsii.Jsii.Proxy(SpotFleetRequestLaunchTemplateConfig.Jsii$Proxy.class)
public interface SpotFleetRequestLaunchTemplateConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * launch_template_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_template_specification SpotFleetRequest#launch_template_specification}
     */
    @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigLaunchTemplateSpecification getLaunchTemplateSpecification();

    /**
     * overrides block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#overrides SpotFleetRequest#overrides}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOverrides() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SpotFleetRequestLaunchTemplateConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SpotFleetRequestLaunchTemplateConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SpotFleetRequestLaunchTemplateConfig> {
        imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigLaunchTemplateSpecification launchTemplateSpecification;
        java.lang.Object overrides;

        /**
         * Sets the value of {@link SpotFleetRequestLaunchTemplateConfig#getLaunchTemplateSpecification}
         * @param launchTemplateSpecification launch_template_specification block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#launch_template_specification SpotFleetRequest#launch_template_specification}
         * @return {@code this}
         */
        public Builder launchTemplateSpecification(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigLaunchTemplateSpecification launchTemplateSpecification) {
            this.launchTemplateSpecification = launchTemplateSpecification;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestLaunchTemplateConfig#getOverrides}
         * @param overrides overrides block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#overrides SpotFleetRequest#overrides}
         * @return {@code this}
         */
        public Builder overrides(com.hashicorp.cdktf.IResolvable overrides) {
            this.overrides = overrides;
            return this;
        }

        /**
         * Sets the value of {@link SpotFleetRequestLaunchTemplateConfig#getOverrides}
         * @param overrides overrides block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_fleet_request#overrides SpotFleetRequest#overrides}
         * @return {@code this}
         */
        public Builder overrides(java.util.List<? extends imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverrides> overrides) {
            this.overrides = overrides;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SpotFleetRequestLaunchTemplateConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SpotFleetRequestLaunchTemplateConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SpotFleetRequestLaunchTemplateConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SpotFleetRequestLaunchTemplateConfig {
        private final imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigLaunchTemplateSpecification launchTemplateSpecification;
        private final java.lang.Object overrides;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.launchTemplateSpecification = software.amazon.jsii.Kernel.get(this, "launchTemplateSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigLaunchTemplateSpecification.class));
            this.overrides = software.amazon.jsii.Kernel.get(this, "overrides", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.launchTemplateSpecification = java.util.Objects.requireNonNull(builder.launchTemplateSpecification, "launchTemplateSpecification is required");
            this.overrides = builder.overrides;
        }

        @Override
        public final imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigLaunchTemplateSpecification getLaunchTemplateSpecification() {
            return this.launchTemplateSpecification;
        }

        @Override
        public final java.lang.Object getOverrides() {
            return this.overrides;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("launchTemplateSpecification", om.valueToTree(this.getLaunchTemplateSpecification()));
            if (this.getOverrides() != null) {
                data.set("overrides", om.valueToTree(this.getOverrides()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.spotFleetRequest.SpotFleetRequestLaunchTemplateConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SpotFleetRequestLaunchTemplateConfig.Jsii$Proxy that = (SpotFleetRequestLaunchTemplateConfig.Jsii$Proxy) o;

            if (!launchTemplateSpecification.equals(that.launchTemplateSpecification)) return false;
            return this.overrides != null ? this.overrides.equals(that.overrides) : that.overrides == null;
        }

        @Override
        public final int hashCode() {
            int result = this.launchTemplateSpecification.hashCode();
            result = 31 * result + (this.overrides != null ? this.overrides.hashCode() : 0);
            return result;
        }
    }
}
