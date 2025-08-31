package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.235Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicySecurityServicePolicyData")
@software.amazon.jsii.Jsii.Proxy(FmsPolicySecurityServicePolicyData.Jsii$Proxy.class)
public interface FmsPolicySecurityServicePolicyData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#type FmsPolicy#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#managed_service_data FmsPolicy#managed_service_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getManagedServiceData() {
        return null;
    }

    /**
     * policy_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#policy_option FmsPolicy#policy_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOption getPolicyOption() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FmsPolicySecurityServicePolicyData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FmsPolicySecurityServicePolicyData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FmsPolicySecurityServicePolicyData> {
        java.lang.String type;
        java.lang.String managedServiceData;
        imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOption policyOption;

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyData#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#type FmsPolicy#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyData#getManagedServiceData}
         * @param managedServiceData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#managed_service_data FmsPolicy#managed_service_data}.
         * @return {@code this}
         */
        public Builder managedServiceData(java.lang.String managedServiceData) {
            this.managedServiceData = managedServiceData;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyData#getPolicyOption}
         * @param policyOption policy_option block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#policy_option FmsPolicy#policy_option}
         * @return {@code this}
         */
        public Builder policyOption(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOption policyOption) {
            this.policyOption = policyOption;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FmsPolicySecurityServicePolicyData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FmsPolicySecurityServicePolicyData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FmsPolicySecurityServicePolicyData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FmsPolicySecurityServicePolicyData {
        private final java.lang.String type;
        private final java.lang.String managedServiceData;
        private final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOption policyOption;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.managedServiceData = software.amazon.jsii.Kernel.get(this, "managedServiceData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policyOption = software.amazon.jsii.Kernel.get(this, "policyOption", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOption.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.managedServiceData = builder.managedServiceData;
            this.policyOption = builder.policyOption;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getManagedServiceData() {
            return this.managedServiceData;
        }

        @Override
        public final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOption getPolicyOption() {
            return this.policyOption;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getManagedServiceData() != null) {
                data.set("managedServiceData", om.valueToTree(this.getManagedServiceData()));
            }
            if (this.getPolicyOption() != null) {
                data.set("policyOption", om.valueToTree(this.getPolicyOption()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fmsPolicy.FmsPolicySecurityServicePolicyData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FmsPolicySecurityServicePolicyData.Jsii$Proxy that = (FmsPolicySecurityServicePolicyData.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.managedServiceData != null ? !this.managedServiceData.equals(that.managedServiceData) : that.managedServiceData != null) return false;
            return this.policyOption != null ? this.policyOption.equals(that.policyOption) : that.policyOption == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.managedServiceData != null ? this.managedServiceData.hashCode() : 0);
            result = 31 * result + (this.policyOption != null ? this.policyOption.hashCode() : 0);
            return result;
        }
    }
}
