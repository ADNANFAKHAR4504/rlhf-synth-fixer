package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDomainSettingsDockerSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDomainSettingsDockerSettings.Jsii$Proxy.class)
public interface SagemakerDomainDomainSettingsDockerSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#enable_docker_access SagemakerDomain#enable_docker_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEnableDockerAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#vpc_only_trusted_accounts SagemakerDomain#vpc_only_trusted_accounts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcOnlyTrustedAccounts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDomainSettingsDockerSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDomainSettingsDockerSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDomainSettingsDockerSettings> {
        java.lang.String enableDockerAccess;
        java.util.List<java.lang.String> vpcOnlyTrustedAccounts;

        /**
         * Sets the value of {@link SagemakerDomainDomainSettingsDockerSettings#getEnableDockerAccess}
         * @param enableDockerAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#enable_docker_access SagemakerDomain#enable_docker_access}.
         * @return {@code this}
         */
        public Builder enableDockerAccess(java.lang.String enableDockerAccess) {
            this.enableDockerAccess = enableDockerAccess;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDomainSettingsDockerSettings#getVpcOnlyTrustedAccounts}
         * @param vpcOnlyTrustedAccounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#vpc_only_trusted_accounts SagemakerDomain#vpc_only_trusted_accounts}.
         * @return {@code this}
         */
        public Builder vpcOnlyTrustedAccounts(java.util.List<java.lang.String> vpcOnlyTrustedAccounts) {
            this.vpcOnlyTrustedAccounts = vpcOnlyTrustedAccounts;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDomainSettingsDockerSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDomainSettingsDockerSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDomainSettingsDockerSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDomainSettingsDockerSettings {
        private final java.lang.String enableDockerAccess;
        private final java.util.List<java.lang.String> vpcOnlyTrustedAccounts;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enableDockerAccess = software.amazon.jsii.Kernel.get(this, "enableDockerAccess", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcOnlyTrustedAccounts = software.amazon.jsii.Kernel.get(this, "vpcOnlyTrustedAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enableDockerAccess = builder.enableDockerAccess;
            this.vpcOnlyTrustedAccounts = builder.vpcOnlyTrustedAccounts;
        }

        @Override
        public final java.lang.String getEnableDockerAccess() {
            return this.enableDockerAccess;
        }

        @Override
        public final java.util.List<java.lang.String> getVpcOnlyTrustedAccounts() {
            return this.vpcOnlyTrustedAccounts;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnableDockerAccess() != null) {
                data.set("enableDockerAccess", om.valueToTree(this.getEnableDockerAccess()));
            }
            if (this.getVpcOnlyTrustedAccounts() != null) {
                data.set("vpcOnlyTrustedAccounts", om.valueToTree(this.getVpcOnlyTrustedAccounts()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDomainSettingsDockerSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDomainSettingsDockerSettings.Jsii$Proxy that = (SagemakerDomainDomainSettingsDockerSettings.Jsii$Proxy) o;

            if (this.enableDockerAccess != null ? !this.enableDockerAccess.equals(that.enableDockerAccess) : that.enableDockerAccess != null) return false;
            return this.vpcOnlyTrustedAccounts != null ? this.vpcOnlyTrustedAccounts.equals(that.vpcOnlyTrustedAccounts) : that.vpcOnlyTrustedAccounts == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enableDockerAccess != null ? this.enableDockerAccess.hashCode() : 0;
            result = 31 * result + (this.vpcOnlyTrustedAccounts != null ? this.vpcOnlyTrustedAccounts.hashCode() : 0);
            return result;
        }
    }
}
