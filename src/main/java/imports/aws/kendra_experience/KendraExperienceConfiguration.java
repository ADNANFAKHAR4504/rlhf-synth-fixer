package imports.aws.kendra_experience;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.432Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraExperience.KendraExperienceConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraExperienceConfiguration.Jsii$Proxy.class)
public interface KendraExperienceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * content_source_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#content_source_configuration KendraExperience#content_source_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_experience.KendraExperienceConfigurationContentSourceConfiguration getContentSourceConfiguration() {
        return null;
    }

    /**
     * user_identity_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#user_identity_configuration KendraExperience#user_identity_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_experience.KendraExperienceConfigurationUserIdentityConfiguration getUserIdentityConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraExperienceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraExperienceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraExperienceConfiguration> {
        imports.aws.kendra_experience.KendraExperienceConfigurationContentSourceConfiguration contentSourceConfiguration;
        imports.aws.kendra_experience.KendraExperienceConfigurationUserIdentityConfiguration userIdentityConfiguration;

        /**
         * Sets the value of {@link KendraExperienceConfiguration#getContentSourceConfiguration}
         * @param contentSourceConfiguration content_source_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#content_source_configuration KendraExperience#content_source_configuration}
         * @return {@code this}
         */
        public Builder contentSourceConfiguration(imports.aws.kendra_experience.KendraExperienceConfigurationContentSourceConfiguration contentSourceConfiguration) {
            this.contentSourceConfiguration = contentSourceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraExperienceConfiguration#getUserIdentityConfiguration}
         * @param userIdentityConfiguration user_identity_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#user_identity_configuration KendraExperience#user_identity_configuration}
         * @return {@code this}
         */
        public Builder userIdentityConfiguration(imports.aws.kendra_experience.KendraExperienceConfigurationUserIdentityConfiguration userIdentityConfiguration) {
            this.userIdentityConfiguration = userIdentityConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraExperienceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraExperienceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraExperienceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraExperienceConfiguration {
        private final imports.aws.kendra_experience.KendraExperienceConfigurationContentSourceConfiguration contentSourceConfiguration;
        private final imports.aws.kendra_experience.KendraExperienceConfigurationUserIdentityConfiguration userIdentityConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.contentSourceConfiguration = software.amazon.jsii.Kernel.get(this, "contentSourceConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_experience.KendraExperienceConfigurationContentSourceConfiguration.class));
            this.userIdentityConfiguration = software.amazon.jsii.Kernel.get(this, "userIdentityConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_experience.KendraExperienceConfigurationUserIdentityConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.contentSourceConfiguration = builder.contentSourceConfiguration;
            this.userIdentityConfiguration = builder.userIdentityConfiguration;
        }

        @Override
        public final imports.aws.kendra_experience.KendraExperienceConfigurationContentSourceConfiguration getContentSourceConfiguration() {
            return this.contentSourceConfiguration;
        }

        @Override
        public final imports.aws.kendra_experience.KendraExperienceConfigurationUserIdentityConfiguration getUserIdentityConfiguration() {
            return this.userIdentityConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContentSourceConfiguration() != null) {
                data.set("contentSourceConfiguration", om.valueToTree(this.getContentSourceConfiguration()));
            }
            if (this.getUserIdentityConfiguration() != null) {
                data.set("userIdentityConfiguration", om.valueToTree(this.getUserIdentityConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraExperience.KendraExperienceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraExperienceConfiguration.Jsii$Proxy that = (KendraExperienceConfiguration.Jsii$Proxy) o;

            if (this.contentSourceConfiguration != null ? !this.contentSourceConfiguration.equals(that.contentSourceConfiguration) : that.contentSourceConfiguration != null) return false;
            return this.userIdentityConfiguration != null ? this.userIdentityConfiguration.equals(that.userIdentityConfiguration) : that.userIdentityConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.contentSourceConfiguration != null ? this.contentSourceConfiguration.hashCode() : 0;
            result = 31 * result + (this.userIdentityConfiguration != null ? this.userIdentityConfiguration.hashCode() : 0);
            return result;
        }
    }
}
