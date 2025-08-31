package imports.aws.securityhub_configuration_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.387Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubConfigurationPolicy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration")
@software.amazon.jsii.Jsii.Proxy(SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration.Jsii$Proxy.class)
public interface SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#disabled_control_identifiers SecurityhubConfigurationPolicy#disabled_control_identifiers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDisabledControlIdentifiers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#enabled_control_identifiers SecurityhubConfigurationPolicy#enabled_control_identifiers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledControlIdentifiers() {
        return null;
    }

    /**
     * security_control_custom_parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#security_control_custom_parameter SecurityhubConfigurationPolicy#security_control_custom_parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSecurityControlCustomParameter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration> {
        java.util.List<java.lang.String> disabledControlIdentifiers;
        java.util.List<java.lang.String> enabledControlIdentifiers;
        java.lang.Object securityControlCustomParameter;

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration#getDisabledControlIdentifiers}
         * @param disabledControlIdentifiers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#disabled_control_identifiers SecurityhubConfigurationPolicy#disabled_control_identifiers}.
         * @return {@code this}
         */
        public Builder disabledControlIdentifiers(java.util.List<java.lang.String> disabledControlIdentifiers) {
            this.disabledControlIdentifiers = disabledControlIdentifiers;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration#getEnabledControlIdentifiers}
         * @param enabledControlIdentifiers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#enabled_control_identifiers SecurityhubConfigurationPolicy#enabled_control_identifiers}.
         * @return {@code this}
         */
        public Builder enabledControlIdentifiers(java.util.List<java.lang.String> enabledControlIdentifiers) {
            this.enabledControlIdentifiers = enabledControlIdentifiers;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration#getSecurityControlCustomParameter}
         * @param securityControlCustomParameter security_control_custom_parameter block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#security_control_custom_parameter SecurityhubConfigurationPolicy#security_control_custom_parameter}
         * @return {@code this}
         */
        public Builder securityControlCustomParameter(com.hashicorp.cdktf.IResolvable securityControlCustomParameter) {
            this.securityControlCustomParameter = securityControlCustomParameter;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration#getSecurityControlCustomParameter}
         * @param securityControlCustomParameter security_control_custom_parameter block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#security_control_custom_parameter SecurityhubConfigurationPolicy#security_control_custom_parameter}
         * @return {@code this}
         */
        public Builder securityControlCustomParameter(java.util.List<? extends imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameter> securityControlCustomParameter) {
            this.securityControlCustomParameter = securityControlCustomParameter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration {
        private final java.util.List<java.lang.String> disabledControlIdentifiers;
        private final java.util.List<java.lang.String> enabledControlIdentifiers;
        private final java.lang.Object securityControlCustomParameter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.disabledControlIdentifiers = software.amazon.jsii.Kernel.get(this, "disabledControlIdentifiers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.enabledControlIdentifiers = software.amazon.jsii.Kernel.get(this, "enabledControlIdentifiers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityControlCustomParameter = software.amazon.jsii.Kernel.get(this, "securityControlCustomParameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.disabledControlIdentifiers = builder.disabledControlIdentifiers;
            this.enabledControlIdentifiers = builder.enabledControlIdentifiers;
            this.securityControlCustomParameter = builder.securityControlCustomParameter;
        }

        @Override
        public final java.util.List<java.lang.String> getDisabledControlIdentifiers() {
            return this.disabledControlIdentifiers;
        }

        @Override
        public final java.util.List<java.lang.String> getEnabledControlIdentifiers() {
            return this.enabledControlIdentifiers;
        }

        @Override
        public final java.lang.Object getSecurityControlCustomParameter() {
            return this.securityControlCustomParameter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDisabledControlIdentifiers() != null) {
                data.set("disabledControlIdentifiers", om.valueToTree(this.getDisabledControlIdentifiers()));
            }
            if (this.getEnabledControlIdentifiers() != null) {
                data.set("enabledControlIdentifiers", om.valueToTree(this.getEnabledControlIdentifiers()));
            }
            if (this.getSecurityControlCustomParameter() != null) {
                data.set("securityControlCustomParameter", om.valueToTree(this.getSecurityControlCustomParameter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubConfigurationPolicy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration.Jsii$Proxy that = (SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration.Jsii$Proxy) o;

            if (this.disabledControlIdentifiers != null ? !this.disabledControlIdentifiers.equals(that.disabledControlIdentifiers) : that.disabledControlIdentifiers != null) return false;
            if (this.enabledControlIdentifiers != null ? !this.enabledControlIdentifiers.equals(that.enabledControlIdentifiers) : that.enabledControlIdentifiers != null) return false;
            return this.securityControlCustomParameter != null ? this.securityControlCustomParameter.equals(that.securityControlCustomParameter) : that.securityControlCustomParameter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.disabledControlIdentifiers != null ? this.disabledControlIdentifiers.hashCode() : 0;
            result = 31 * result + (this.enabledControlIdentifiers != null ? this.enabledControlIdentifiers.hashCode() : 0);
            result = 31 * result + (this.securityControlCustomParameter != null ? this.securityControlCustomParameter.hashCode() : 0);
            return result;
        }
    }
}
