package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.075Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetLaunchTemplateConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetLaunchTemplateConfig.Jsii$Proxy.class)
public interface Ec2FleetLaunchTemplateConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * launch_template_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_specification Ec2Fleet#launch_template_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification getLaunchTemplateSpecification() {
        return null;
    }

    /**
     * override block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#override Ec2Fleet#override}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOverride() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetLaunchTemplateConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetLaunchTemplateConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetLaunchTemplateConfig> {
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification launchTemplateSpecification;
        java.lang.Object override;

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfig#getLaunchTemplateSpecification}
         * @param launchTemplateSpecification launch_template_specification block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_specification Ec2Fleet#launch_template_specification}
         * @return {@code this}
         */
        public Builder launchTemplateSpecification(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification launchTemplateSpecification) {
            this.launchTemplateSpecification = launchTemplateSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfig#getOverride}
         * @param override override block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#override Ec2Fleet#override}
         * @return {@code this}
         */
        public Builder override(com.hashicorp.cdktf.IResolvable override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfig#getOverride}
         * @param override override block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#override Ec2Fleet#override}
         * @return {@code this}
         */
        public Builder override(java.util.List<? extends imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverride> override) {
            this.override = override;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetLaunchTemplateConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetLaunchTemplateConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetLaunchTemplateConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetLaunchTemplateConfig {
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification launchTemplateSpecification;
        private final java.lang.Object override;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.launchTemplateSpecification = software.amazon.jsii.Kernel.get(this, "launchTemplateSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification.class));
            this.override = software.amazon.jsii.Kernel.get(this, "override", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.launchTemplateSpecification = builder.launchTemplateSpecification;
            this.override = builder.override;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification getLaunchTemplateSpecification() {
            return this.launchTemplateSpecification;
        }

        @Override
        public final java.lang.Object getOverride() {
            return this.override;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLaunchTemplateSpecification() != null) {
                data.set("launchTemplateSpecification", om.valueToTree(this.getLaunchTemplateSpecification()));
            }
            if (this.getOverride() != null) {
                data.set("override", om.valueToTree(this.getOverride()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetLaunchTemplateConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetLaunchTemplateConfig.Jsii$Proxy that = (Ec2FleetLaunchTemplateConfig.Jsii$Proxy) o;

            if (this.launchTemplateSpecification != null ? !this.launchTemplateSpecification.equals(that.launchTemplateSpecification) : that.launchTemplateSpecification != null) return false;
            return this.override != null ? this.override.equals(that.override) : that.override == null;
        }

        @Override
        public final int hashCode() {
            int result = this.launchTemplateSpecification != null ? this.launchTemplateSpecification.hashCode() : 0;
            result = 31 * result + (this.override != null ? this.override.hashCode() : 0);
            return result;
        }
    }
}
