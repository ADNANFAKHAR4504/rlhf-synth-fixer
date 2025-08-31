package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration.Jsii$Proxy.class)
public interface ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template_id ImagebuilderDistributionConfiguration#launch_template_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLaunchTemplateId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#account_id ImagebuilderDistributionConfiguration#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#default ImagebuilderDistributionConfiguration#default}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDefaultValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration> {
        java.lang.String launchTemplateId;
        java.lang.String accountId;
        java.lang.Object defaultValue;

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration#getLaunchTemplateId}
         * @param launchTemplateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#launch_template_id ImagebuilderDistributionConfiguration#launch_template_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder launchTemplateId(java.lang.String launchTemplateId) {
            this.launchTemplateId = launchTemplateId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#account_id ImagebuilderDistributionConfiguration#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration#getDefaultValue}
         * @param defaultValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#default ImagebuilderDistributionConfiguration#default}.
         * @return {@code this}
         */
        public Builder defaultValue(java.lang.Boolean defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration#getDefaultValue}
         * @param defaultValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#default ImagebuilderDistributionConfiguration#default}.
         * @return {@code this}
         */
        public Builder defaultValue(com.hashicorp.cdktf.IResolvable defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration {
        private final java.lang.String launchTemplateId;
        private final java.lang.String accountId;
        private final java.lang.Object defaultValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.launchTemplateId = software.amazon.jsii.Kernel.get(this, "launchTemplateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultValue = software.amazon.jsii.Kernel.get(this, "default", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.launchTemplateId = java.util.Objects.requireNonNull(builder.launchTemplateId, "launchTemplateId is required");
            this.accountId = builder.accountId;
            this.defaultValue = builder.defaultValue;
        }

        @Override
        public final java.lang.String getLaunchTemplateId() {
            return this.launchTemplateId;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.Object getDefaultValue() {
            return this.defaultValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("launchTemplateId", om.valueToTree(this.getLaunchTemplateId()));
            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getDefaultValue() != null) {
                data.set("default", om.valueToTree(this.getDefaultValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration.Jsii$Proxy that = (ImagebuilderDistributionConfigurationDistributionLaunchTemplateConfiguration.Jsii$Proxy) o;

            if (!launchTemplateId.equals(that.launchTemplateId)) return false;
            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            return this.defaultValue != null ? this.defaultValue.equals(that.defaultValue) : that.defaultValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.launchTemplateId.hashCode();
            result = 31 * result + (this.accountId != null ? this.accountId.hashCode() : 0);
            result = 31 * result + (this.defaultValue != null ? this.defaultValue.hashCode() : 0);
            return result;
        }
    }
}
