package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.827Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings")
@software.amazon.jsii.Jsii.Proxy(LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings.Jsii$Proxy.class)
public interface LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Indicates whether the distribution forwards and caches based on query strings.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOption() {
        return null;
    }

    /**
     * The specific query strings that the distribution forwards to the origin.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#query_strings_allowed_list LightsailDistribution#query_strings_allowed_list}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getQueryStringsAllowedList() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings> {
        java.lang.Object option;
        java.util.List<java.lang.String> queryStringsAllowedList;

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings#getOption}
         * @param option Indicates whether the distribution forwards and caches based on query strings.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
         * @return {@code this}
         */
        public Builder option(java.lang.Boolean option) {
            this.option = option;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings#getOption}
         * @param option Indicates whether the distribution forwards and caches based on query strings.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
         * @return {@code this}
         */
        public Builder option(com.hashicorp.cdktf.IResolvable option) {
            this.option = option;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings#getQueryStringsAllowedList}
         * @param queryStringsAllowedList The specific query strings that the distribution forwards to the origin.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#query_strings_allowed_list LightsailDistribution#query_strings_allowed_list}
         * @return {@code this}
         */
        public Builder queryStringsAllowedList(java.util.List<java.lang.String> queryStringsAllowedList) {
            this.queryStringsAllowedList = queryStringsAllowedList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings {
        private final java.lang.Object option;
        private final java.util.List<java.lang.String> queryStringsAllowedList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.option = software.amazon.jsii.Kernel.get(this, "option", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.queryStringsAllowedList = software.amazon.jsii.Kernel.get(this, "queryStringsAllowedList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.option = builder.option;
            this.queryStringsAllowedList = builder.queryStringsAllowedList;
        }

        @Override
        public final java.lang.Object getOption() {
            return this.option;
        }

        @Override
        public final java.util.List<java.lang.String> getQueryStringsAllowedList() {
            return this.queryStringsAllowedList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOption() != null) {
                data.set("option", om.valueToTree(this.getOption()));
            }
            if (this.getQueryStringsAllowedList() != null) {
                data.set("queryStringsAllowedList", om.valueToTree(this.getQueryStringsAllowedList()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings.Jsii$Proxy that = (LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings.Jsii$Proxy) o;

            if (this.option != null ? !this.option.equals(that.option) : that.option != null) return false;
            return this.queryStringsAllowedList != null ? this.queryStringsAllowedList.equals(that.queryStringsAllowedList) : that.queryStringsAllowedList == null;
        }

        @Override
        public final int hashCode() {
            int result = this.option != null ? this.option.hashCode() : 0;
            result = 31 * result + (this.queryStringsAllowedList != null ? this.queryStringsAllowedList.hashCode() : 0);
            return result;
        }
    }
}
