package imports.aws.cognito_risk_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.348Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoRiskConfiguration.CognitoRiskConfigurationRiskExceptionConfiguration")
@software.amazon.jsii.Jsii.Proxy(CognitoRiskConfigurationRiskExceptionConfiguration.Jsii$Proxy.class)
public interface CognitoRiskConfigurationRiskExceptionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#blocked_ip_range_list CognitoRiskConfiguration#blocked_ip_range_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getBlockedIpRangeList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#skipped_ip_range_list CognitoRiskConfiguration#skipped_ip_range_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSkippedIpRangeList() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoRiskConfigurationRiskExceptionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoRiskConfigurationRiskExceptionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoRiskConfigurationRiskExceptionConfiguration> {
        java.util.List<java.lang.String> blockedIpRangeList;
        java.util.List<java.lang.String> skippedIpRangeList;

        /**
         * Sets the value of {@link CognitoRiskConfigurationRiskExceptionConfiguration#getBlockedIpRangeList}
         * @param blockedIpRangeList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#blocked_ip_range_list CognitoRiskConfiguration#blocked_ip_range_list}.
         * @return {@code this}
         */
        public Builder blockedIpRangeList(java.util.List<java.lang.String> blockedIpRangeList) {
            this.blockedIpRangeList = blockedIpRangeList;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationRiskExceptionConfiguration#getSkippedIpRangeList}
         * @param skippedIpRangeList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#skipped_ip_range_list CognitoRiskConfiguration#skipped_ip_range_list}.
         * @return {@code this}
         */
        public Builder skippedIpRangeList(java.util.List<java.lang.String> skippedIpRangeList) {
            this.skippedIpRangeList = skippedIpRangeList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoRiskConfigurationRiskExceptionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoRiskConfigurationRiskExceptionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoRiskConfigurationRiskExceptionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoRiskConfigurationRiskExceptionConfiguration {
        private final java.util.List<java.lang.String> blockedIpRangeList;
        private final java.util.List<java.lang.String> skippedIpRangeList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.blockedIpRangeList = software.amazon.jsii.Kernel.get(this, "blockedIpRangeList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.skippedIpRangeList = software.amazon.jsii.Kernel.get(this, "skippedIpRangeList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.blockedIpRangeList = builder.blockedIpRangeList;
            this.skippedIpRangeList = builder.skippedIpRangeList;
        }

        @Override
        public final java.util.List<java.lang.String> getBlockedIpRangeList() {
            return this.blockedIpRangeList;
        }

        @Override
        public final java.util.List<java.lang.String> getSkippedIpRangeList() {
            return this.skippedIpRangeList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBlockedIpRangeList() != null) {
                data.set("blockedIpRangeList", om.valueToTree(this.getBlockedIpRangeList()));
            }
            if (this.getSkippedIpRangeList() != null) {
                data.set("skippedIpRangeList", om.valueToTree(this.getSkippedIpRangeList()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoRiskConfiguration.CognitoRiskConfigurationRiskExceptionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoRiskConfigurationRiskExceptionConfiguration.Jsii$Proxy that = (CognitoRiskConfigurationRiskExceptionConfiguration.Jsii$Proxy) o;

            if (this.blockedIpRangeList != null ? !this.blockedIpRangeList.equals(that.blockedIpRangeList) : that.blockedIpRangeList != null) return false;
            return this.skippedIpRangeList != null ? this.skippedIpRangeList.equals(that.skippedIpRangeList) : that.skippedIpRangeList == null;
        }

        @Override
        public final int hashCode() {
            int result = this.blockedIpRangeList != null ? this.blockedIpRangeList.hashCode() : 0;
            result = 31 * result + (this.skippedIpRangeList != null ? this.skippedIpRangeList.hashCode() : 0);
            return result;
        }
    }
}
