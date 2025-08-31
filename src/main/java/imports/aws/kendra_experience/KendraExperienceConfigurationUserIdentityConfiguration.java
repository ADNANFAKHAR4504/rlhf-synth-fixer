package imports.aws.kendra_experience;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.433Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraExperience.KendraExperienceConfigurationUserIdentityConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraExperienceConfigurationUserIdentityConfiguration.Jsii$Proxy.class)
public interface KendraExperienceConfigurationUserIdentityConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#identity_attribute_name KendraExperience#identity_attribute_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentityAttributeName();

    /**
     * @return a {@link Builder} of {@link KendraExperienceConfigurationUserIdentityConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraExperienceConfigurationUserIdentityConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraExperienceConfigurationUserIdentityConfiguration> {
        java.lang.String identityAttributeName;

        /**
         * Sets the value of {@link KendraExperienceConfigurationUserIdentityConfiguration#getIdentityAttributeName}
         * @param identityAttributeName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_experience#identity_attribute_name KendraExperience#identity_attribute_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder identityAttributeName(java.lang.String identityAttributeName) {
            this.identityAttributeName = identityAttributeName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraExperienceConfigurationUserIdentityConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraExperienceConfigurationUserIdentityConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraExperienceConfigurationUserIdentityConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraExperienceConfigurationUserIdentityConfiguration {
        private final java.lang.String identityAttributeName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.identityAttributeName = software.amazon.jsii.Kernel.get(this, "identityAttributeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.identityAttributeName = java.util.Objects.requireNonNull(builder.identityAttributeName, "identityAttributeName is required");
        }

        @Override
        public final java.lang.String getIdentityAttributeName() {
            return this.identityAttributeName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("identityAttributeName", om.valueToTree(this.getIdentityAttributeName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraExperience.KendraExperienceConfigurationUserIdentityConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraExperienceConfigurationUserIdentityConfiguration.Jsii$Proxy that = (KendraExperienceConfigurationUserIdentityConfiguration.Jsii$Proxy) o;

            return this.identityAttributeName.equals(that.identityAttributeName);
        }

        @Override
        public final int hashCode() {
            int result = this.identityAttributeName.hashCode();
            return result;
        }
    }
}
