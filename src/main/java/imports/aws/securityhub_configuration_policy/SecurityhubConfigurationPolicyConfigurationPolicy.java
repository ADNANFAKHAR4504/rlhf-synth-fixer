package imports.aws.securityhub_configuration_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.387Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubConfigurationPolicy.SecurityhubConfigurationPolicyConfigurationPolicy")
@software.amazon.jsii.Jsii.Proxy(SecurityhubConfigurationPolicyConfigurationPolicy.Jsii$Proxy.class)
public interface SecurityhubConfigurationPolicyConfigurationPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#service_enabled SecurityhubConfigurationPolicy#service_enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getServiceEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#enabled_standard_arns SecurityhubConfigurationPolicy#enabled_standard_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledStandardArns() {
        return null;
    }

    /**
     * security_controls_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#security_controls_configuration SecurityhubConfigurationPolicy#security_controls_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration getSecurityControlsConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityhubConfigurationPolicyConfigurationPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubConfigurationPolicyConfigurationPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubConfigurationPolicyConfigurationPolicy> {
        java.lang.Object serviceEnabled;
        java.util.List<java.lang.String> enabledStandardArns;
        imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration securityControlsConfiguration;

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicy#getServiceEnabled}
         * @param serviceEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#service_enabled SecurityhubConfigurationPolicy#service_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceEnabled(java.lang.Boolean serviceEnabled) {
            this.serviceEnabled = serviceEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicy#getServiceEnabled}
         * @param serviceEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#service_enabled SecurityhubConfigurationPolicy#service_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceEnabled(com.hashicorp.cdktf.IResolvable serviceEnabled) {
            this.serviceEnabled = serviceEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicy#getEnabledStandardArns}
         * @param enabledStandardArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#enabled_standard_arns SecurityhubConfigurationPolicy#enabled_standard_arns}.
         * @return {@code this}
         */
        public Builder enabledStandardArns(java.util.List<java.lang.String> enabledStandardArns) {
            this.enabledStandardArns = enabledStandardArns;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubConfigurationPolicyConfigurationPolicy#getSecurityControlsConfiguration}
         * @param securityControlsConfiguration security_controls_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_configuration_policy#security_controls_configuration SecurityhubConfigurationPolicy#security_controls_configuration}
         * @return {@code this}
         */
        public Builder securityControlsConfiguration(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration securityControlsConfiguration) {
            this.securityControlsConfiguration = securityControlsConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubConfigurationPolicyConfigurationPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubConfigurationPolicyConfigurationPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubConfigurationPolicyConfigurationPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubConfigurationPolicyConfigurationPolicy {
        private final java.lang.Object serviceEnabled;
        private final java.util.List<java.lang.String> enabledStandardArns;
        private final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration securityControlsConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.serviceEnabled = software.amazon.jsii.Kernel.get(this, "serviceEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enabledStandardArns = software.amazon.jsii.Kernel.get(this, "enabledStandardArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityControlsConfiguration = software.amazon.jsii.Kernel.get(this, "securityControlsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.serviceEnabled = java.util.Objects.requireNonNull(builder.serviceEnabled, "serviceEnabled is required");
            this.enabledStandardArns = builder.enabledStandardArns;
            this.securityControlsConfiguration = builder.securityControlsConfiguration;
        }

        @Override
        public final java.lang.Object getServiceEnabled() {
            return this.serviceEnabled;
        }

        @Override
        public final java.util.List<java.lang.String> getEnabledStandardArns() {
            return this.enabledStandardArns;
        }

        @Override
        public final imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfiguration getSecurityControlsConfiguration() {
            return this.securityControlsConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("serviceEnabled", om.valueToTree(this.getServiceEnabled()));
            if (this.getEnabledStandardArns() != null) {
                data.set("enabledStandardArns", om.valueToTree(this.getEnabledStandardArns()));
            }
            if (this.getSecurityControlsConfiguration() != null) {
                data.set("securityControlsConfiguration", om.valueToTree(this.getSecurityControlsConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubConfigurationPolicy.SecurityhubConfigurationPolicyConfigurationPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubConfigurationPolicyConfigurationPolicy.Jsii$Proxy that = (SecurityhubConfigurationPolicyConfigurationPolicy.Jsii$Proxy) o;

            if (!serviceEnabled.equals(that.serviceEnabled)) return false;
            if (this.enabledStandardArns != null ? !this.enabledStandardArns.equals(that.enabledStandardArns) : that.enabledStandardArns != null) return false;
            return this.securityControlsConfiguration != null ? this.securityControlsConfiguration.equals(that.securityControlsConfiguration) : that.securityControlsConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.serviceEnabled.hashCode();
            result = 31 * result + (this.enabledStandardArns != null ? this.enabledStandardArns.hashCode() : 0);
            result = 31 * result + (this.securityControlsConfiguration != null ? this.securityControlsConfiguration.hashCode() : 0);
            return result;
        }
    }
}
