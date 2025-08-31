package imports.aws.verifiedaccess_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.574Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessGroup.VerifiedaccessGroupSseConfiguration")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessGroupSseConfiguration.Jsii$Proxy.class)
public interface VerifiedaccessGroupSseConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_group#customer_managed_key_enabled VerifiedaccessGroup#customer_managed_key_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomerManagedKeyEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_group#kms_key_arn VerifiedaccessGroup#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessGroupSseConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessGroupSseConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessGroupSseConfiguration> {
        java.lang.Object customerManagedKeyEnabled;
        java.lang.String kmsKeyArn;

        /**
         * Sets the value of {@link VerifiedaccessGroupSseConfiguration#getCustomerManagedKeyEnabled}
         * @param customerManagedKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_group#customer_managed_key_enabled VerifiedaccessGroup#customer_managed_key_enabled}.
         * @return {@code this}
         */
        public Builder customerManagedKeyEnabled(java.lang.Boolean customerManagedKeyEnabled) {
            this.customerManagedKeyEnabled = customerManagedKeyEnabled;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessGroupSseConfiguration#getCustomerManagedKeyEnabled}
         * @param customerManagedKeyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_group#customer_managed_key_enabled VerifiedaccessGroup#customer_managed_key_enabled}.
         * @return {@code this}
         */
        public Builder customerManagedKeyEnabled(com.hashicorp.cdktf.IResolvable customerManagedKeyEnabled) {
            this.customerManagedKeyEnabled = customerManagedKeyEnabled;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessGroupSseConfiguration#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_group#kms_key_arn VerifiedaccessGroup#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedaccessGroupSseConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessGroupSseConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessGroupSseConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessGroupSseConfiguration {
        private final java.lang.Object customerManagedKeyEnabled;
        private final java.lang.String kmsKeyArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customerManagedKeyEnabled = software.amazon.jsii.Kernel.get(this, "customerManagedKeyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customerManagedKeyEnabled = builder.customerManagedKeyEnabled;
            this.kmsKeyArn = builder.kmsKeyArn;
        }

        @Override
        public final java.lang.Object getCustomerManagedKeyEnabled() {
            return this.customerManagedKeyEnabled;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomerManagedKeyEnabled() != null) {
                data.set("customerManagedKeyEnabled", om.valueToTree(this.getCustomerManagedKeyEnabled()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedaccessGroup.VerifiedaccessGroupSseConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessGroupSseConfiguration.Jsii$Proxy that = (VerifiedaccessGroupSseConfiguration.Jsii$Proxy) o;

            if (this.customerManagedKeyEnabled != null ? !this.customerManagedKeyEnabled.equals(that.customerManagedKeyEnabled) : that.customerManagedKeyEnabled != null) return false;
            return this.kmsKeyArn != null ? this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customerManagedKeyEnabled != null ? this.customerManagedKeyEnabled.hashCode() : 0;
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            return result;
        }
    }
}
