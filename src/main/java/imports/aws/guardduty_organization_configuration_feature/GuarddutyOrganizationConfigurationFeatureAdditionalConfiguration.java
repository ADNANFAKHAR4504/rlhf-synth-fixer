package imports.aws.guardduty_organization_configuration_feature;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.326Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyOrganizationConfigurationFeature.GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration")
@software.amazon.jsii.Jsii.Proxy(GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration.Jsii$Proxy.class)
public interface GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#auto_enable GuarddutyOrganizationConfigurationFeature#auto_enable}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAutoEnable();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#name GuarddutyOrganizationConfigurationFeature#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * @return a {@link Builder} of {@link GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration> {
        java.lang.String autoEnable;
        java.lang.String name;

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration#getAutoEnable}
         * @param autoEnable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#auto_enable GuarddutyOrganizationConfigurationFeature#auto_enable}. This parameter is required.
         * @return {@code this}
         */
        public Builder autoEnable(java.lang.String autoEnable) {
            this.autoEnable = autoEnable;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_organization_configuration_feature#name GuarddutyOrganizationConfigurationFeature#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration {
        private final java.lang.String autoEnable;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.autoEnable = software.amazon.jsii.Kernel.get(this, "autoEnable", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.autoEnable = java.util.Objects.requireNonNull(builder.autoEnable, "autoEnable is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
        }

        @Override
        public final java.lang.String getAutoEnable() {
            return this.autoEnable;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("autoEnable", om.valueToTree(this.getAutoEnable()));
            data.set("name", om.valueToTree(this.getName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.guarddutyOrganizationConfigurationFeature.GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration.Jsii$Proxy that = (GuarddutyOrganizationConfigurationFeatureAdditionalConfiguration.Jsii$Proxy) o;

            if (!autoEnable.equals(that.autoEnable)) return false;
            return this.name.equals(that.name);
        }

        @Override
        public final int hashCode() {
            int result = this.autoEnable.hashCode();
            result = 31 * result + (this.name.hashCode());
            return result;
        }
    }
}
