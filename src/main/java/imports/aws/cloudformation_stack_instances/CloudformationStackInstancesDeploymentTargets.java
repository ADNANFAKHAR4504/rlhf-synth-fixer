package imports.aws.cloudformation_stack_instances;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.219Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackInstances.CloudformationStackInstancesDeploymentTargets")
@software.amazon.jsii.Jsii.Proxy(CloudformationStackInstancesDeploymentTargets.Jsii$Proxy.class)
public interface CloudformationStackInstancesDeploymentTargets extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#account_filter_type CloudformationStackInstances#account_filter_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountFilterType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccounts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts_url CloudformationStackInstances#accounts_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountsUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#organizational_unit_ids CloudformationStackInstances#organizational_unit_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOrganizationalUnitIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudformationStackInstancesDeploymentTargets}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudformationStackInstancesDeploymentTargets}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudformationStackInstancesDeploymentTargets> {
        java.lang.String accountFilterType;
        java.util.List<java.lang.String> accounts;
        java.lang.String accountsUrl;
        java.util.List<java.lang.String> organizationalUnitIds;

        /**
         * Sets the value of {@link CloudformationStackInstancesDeploymentTargets#getAccountFilterType}
         * @param accountFilterType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#account_filter_type CloudformationStackInstances#account_filter_type}.
         * @return {@code this}
         */
        public Builder accountFilterType(java.lang.String accountFilterType) {
            this.accountFilterType = accountFilterType;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackInstancesDeploymentTargets#getAccounts}
         * @param accounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts CloudformationStackInstances#accounts}.
         * @return {@code this}
         */
        public Builder accounts(java.util.List<java.lang.String> accounts) {
            this.accounts = accounts;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackInstancesDeploymentTargets#getAccountsUrl}
         * @param accountsUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#accounts_url CloudformationStackInstances#accounts_url}.
         * @return {@code this}
         */
        public Builder accountsUrl(java.lang.String accountsUrl) {
            this.accountsUrl = accountsUrl;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackInstancesDeploymentTargets#getOrganizationalUnitIds}
         * @param organizationalUnitIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_instances#organizational_unit_ids CloudformationStackInstances#organizational_unit_ids}.
         * @return {@code this}
         */
        public Builder organizationalUnitIds(java.util.List<java.lang.String> organizationalUnitIds) {
            this.organizationalUnitIds = organizationalUnitIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudformationStackInstancesDeploymentTargets}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudformationStackInstancesDeploymentTargets build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudformationStackInstancesDeploymentTargets}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudformationStackInstancesDeploymentTargets {
        private final java.lang.String accountFilterType;
        private final java.util.List<java.lang.String> accounts;
        private final java.lang.String accountsUrl;
        private final java.util.List<java.lang.String> organizationalUnitIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountFilterType = software.amazon.jsii.Kernel.get(this, "accountFilterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accounts = software.amazon.jsii.Kernel.get(this, "accounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.accountsUrl = software.amazon.jsii.Kernel.get(this, "accountsUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.organizationalUnitIds = software.amazon.jsii.Kernel.get(this, "organizationalUnitIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountFilterType = builder.accountFilterType;
            this.accounts = builder.accounts;
            this.accountsUrl = builder.accountsUrl;
            this.organizationalUnitIds = builder.organizationalUnitIds;
        }

        @Override
        public final java.lang.String getAccountFilterType() {
            return this.accountFilterType;
        }

        @Override
        public final java.util.List<java.lang.String> getAccounts() {
            return this.accounts;
        }

        @Override
        public final java.lang.String getAccountsUrl() {
            return this.accountsUrl;
        }

        @Override
        public final java.util.List<java.lang.String> getOrganizationalUnitIds() {
            return this.organizationalUnitIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccountFilterType() != null) {
                data.set("accountFilterType", om.valueToTree(this.getAccountFilterType()));
            }
            if (this.getAccounts() != null) {
                data.set("accounts", om.valueToTree(this.getAccounts()));
            }
            if (this.getAccountsUrl() != null) {
                data.set("accountsUrl", om.valueToTree(this.getAccountsUrl()));
            }
            if (this.getOrganizationalUnitIds() != null) {
                data.set("organizationalUnitIds", om.valueToTree(this.getOrganizationalUnitIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudformationStackInstances.CloudformationStackInstancesDeploymentTargets"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudformationStackInstancesDeploymentTargets.Jsii$Proxy that = (CloudformationStackInstancesDeploymentTargets.Jsii$Proxy) o;

            if (this.accountFilterType != null ? !this.accountFilterType.equals(that.accountFilterType) : that.accountFilterType != null) return false;
            if (this.accounts != null ? !this.accounts.equals(that.accounts) : that.accounts != null) return false;
            if (this.accountsUrl != null ? !this.accountsUrl.equals(that.accountsUrl) : that.accountsUrl != null) return false;
            return this.organizationalUnitIds != null ? this.organizationalUnitIds.equals(that.organizationalUnitIds) : that.organizationalUnitIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accountFilterType != null ? this.accountFilterType.hashCode() : 0;
            result = 31 * result + (this.accounts != null ? this.accounts.hashCode() : 0);
            result = 31 * result + (this.accountsUrl != null ? this.accountsUrl.hashCode() : 0);
            result = 31 * result + (this.organizationalUnitIds != null ? this.organizationalUnitIds.hashCode() : 0);
            return result;
        }
    }
}
