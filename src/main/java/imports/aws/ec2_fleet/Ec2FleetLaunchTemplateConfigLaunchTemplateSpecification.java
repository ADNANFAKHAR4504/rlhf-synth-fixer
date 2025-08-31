package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.075Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification.Jsii$Proxy.class)
public interface Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#version Ec2Fleet#version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_id Ec2Fleet#launch_template_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_name Ec2Fleet#launch_template_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification> {
        java.lang.String version;
        java.lang.String launchTemplateId;
        java.lang.String launchTemplateName;

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#version Ec2Fleet#version}. This parameter is required.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification#getLaunchTemplateId}
         * @param launchTemplateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_id Ec2Fleet#launch_template_id}.
         * @return {@code this}
         */
        public Builder launchTemplateId(java.lang.String launchTemplateId) {
            this.launchTemplateId = launchTemplateId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification#getLaunchTemplateName}
         * @param launchTemplateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#launch_template_name Ec2Fleet#launch_template_name}.
         * @return {@code this}
         */
        public Builder launchTemplateName(java.lang.String launchTemplateName) {
            this.launchTemplateName = launchTemplateName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification {
        private final java.lang.String version;
        private final java.lang.String launchTemplateId;
        private final java.lang.String launchTemplateName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchTemplateId = software.amazon.jsii.Kernel.get(this, "launchTemplateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchTemplateName = software.amazon.jsii.Kernel.get(this, "launchTemplateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.version = java.util.Objects.requireNonNull(builder.version, "version is required");
            this.launchTemplateId = builder.launchTemplateId;
            this.launchTemplateName = builder.launchTemplateName;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        public final java.lang.String getLaunchTemplateId() {
            return this.launchTemplateId;
        }

        @Override
        public final java.lang.String getLaunchTemplateName() {
            return this.launchTemplateName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("version", om.valueToTree(this.getVersion()));
            if (this.getLaunchTemplateId() != null) {
                data.set("launchTemplateId", om.valueToTree(this.getLaunchTemplateId()));
            }
            if (this.getLaunchTemplateName() != null) {
                data.set("launchTemplateName", om.valueToTree(this.getLaunchTemplateName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification.Jsii$Proxy that = (Ec2FleetLaunchTemplateConfigLaunchTemplateSpecification.Jsii$Proxy) o;

            if (!version.equals(that.version)) return false;
            if (this.launchTemplateId != null ? !this.launchTemplateId.equals(that.launchTemplateId) : that.launchTemplateId != null) return false;
            return this.launchTemplateName != null ? this.launchTemplateName.equals(that.launchTemplateName) : that.launchTemplateName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.version.hashCode();
            result = 31 * result + (this.launchTemplateId != null ? this.launchTemplateId.hashCode() : 0);
            result = 31 * result + (this.launchTemplateName != null ? this.launchTemplateName.hashCode() : 0);
            return result;
        }
    }
}
