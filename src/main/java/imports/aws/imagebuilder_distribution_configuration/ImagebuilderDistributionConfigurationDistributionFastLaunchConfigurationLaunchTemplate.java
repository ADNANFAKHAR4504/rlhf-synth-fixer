package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate.Jsii$Proxy.class)
public interface ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template_id ImagebuilderDistributionConfiguration#launch_template_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template_name ImagebuilderDistributionConfiguration#launch_template_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template_version ImagebuilderDistributionConfiguration#launch_template_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchTemplateVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate> {
        java.lang.String launchTemplateId;
        java.lang.String launchTemplateName;
        java.lang.String launchTemplateVersion;

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate#getLaunchTemplateId}
         * @param launchTemplateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template_id ImagebuilderDistributionConfiguration#launch_template_id}.
         * @return {@code this}
         */
        public Builder launchTemplateId(java.lang.String launchTemplateId) {
            this.launchTemplateId = launchTemplateId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate#getLaunchTemplateName}
         * @param launchTemplateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template_name ImagebuilderDistributionConfiguration#launch_template_name}.
         * @return {@code this}
         */
        public Builder launchTemplateName(java.lang.String launchTemplateName) {
            this.launchTemplateName = launchTemplateName;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate#getLaunchTemplateVersion}
         * @param launchTemplateVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template_version ImagebuilderDistributionConfiguration#launch_template_version}.
         * @return {@code this}
         */
        public Builder launchTemplateVersion(java.lang.String launchTemplateVersion) {
            this.launchTemplateVersion = launchTemplateVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate {
        private final java.lang.String launchTemplateId;
        private final java.lang.String launchTemplateName;
        private final java.lang.String launchTemplateVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.launchTemplateId = software.amazon.jsii.Kernel.get(this, "launchTemplateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchTemplateName = software.amazon.jsii.Kernel.get(this, "launchTemplateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchTemplateVersion = software.amazon.jsii.Kernel.get(this, "launchTemplateVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.launchTemplateId = builder.launchTemplateId;
            this.launchTemplateName = builder.launchTemplateName;
            this.launchTemplateVersion = builder.launchTemplateVersion;
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
        public final java.lang.String getLaunchTemplateVersion() {
            return this.launchTemplateVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLaunchTemplateId() != null) {
                data.set("launchTemplateId", om.valueToTree(this.getLaunchTemplateId()));
            }
            if (this.getLaunchTemplateName() != null) {
                data.set("launchTemplateName", om.valueToTree(this.getLaunchTemplateName()));
            }
            if (this.getLaunchTemplateVersion() != null) {
                data.set("launchTemplateVersion", om.valueToTree(this.getLaunchTemplateVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate.Jsii$Proxy that = (ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationLaunchTemplate.Jsii$Proxy) o;

            if (this.launchTemplateId != null ? !this.launchTemplateId.equals(that.launchTemplateId) : that.launchTemplateId != null) return false;
            if (this.launchTemplateName != null ? !this.launchTemplateName.equals(that.launchTemplateName) : that.launchTemplateName != null) return false;
            return this.launchTemplateVersion != null ? this.launchTemplateVersion.equals(that.launchTemplateVersion) : that.launchTemplateVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.launchTemplateId != null ? this.launchTemplateId.hashCode() : 0;
            result = 31 * result + (this.launchTemplateName != null ? this.launchTemplateName.hashCode() : 0);
            result = 31 * result + (this.launchTemplateVersion != null ? this.launchTemplateVersion.hashCode() : 0);
            return result;
        }
    }
}
