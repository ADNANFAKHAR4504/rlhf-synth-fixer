package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.826Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies")
@software.amazon.jsii.Jsii.Proxy(LightsailDistributionCacheBehaviorSettingsForwardedCookies.Jsii$Proxy.class)
public interface LightsailDistributionCacheBehaviorSettingsForwardedCookies extends software.amazon.jsii.JsiiSerializable {

    /**
     * The specific cookies to forward to your distribution's origin.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cookies_allow_list LightsailDistribution#cookies_allow_list}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCookiesAllowList() {
        return null;
    }

    /**
     * Specifies which cookies to forward to the distribution's origin for a cache behavior: all, none, or allow-list to forward only the cookies specified in the cookiesAllowList parameter.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOption() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailDistributionCacheBehaviorSettingsForwardedCookies}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailDistributionCacheBehaviorSettingsForwardedCookies}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailDistributionCacheBehaviorSettingsForwardedCookies> {
        java.util.List<java.lang.String> cookiesAllowList;
        java.lang.String option;

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettingsForwardedCookies#getCookiesAllowList}
         * @param cookiesAllowList The specific cookies to forward to your distribution's origin.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cookies_allow_list LightsailDistribution#cookies_allow_list}
         * @return {@code this}
         */
        public Builder cookiesAllowList(java.util.List<java.lang.String> cookiesAllowList) {
            this.cookiesAllowList = cookiesAllowList;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettingsForwardedCookies#getOption}
         * @param option Specifies which cookies to forward to the distribution's origin for a cache behavior: all, none, or allow-list to forward only the cookies specified in the cookiesAllowList parameter.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
         * @return {@code this}
         */
        public Builder option(java.lang.String option) {
            this.option = option;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailDistributionCacheBehaviorSettingsForwardedCookies}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailDistributionCacheBehaviorSettingsForwardedCookies build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailDistributionCacheBehaviorSettingsForwardedCookies}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailDistributionCacheBehaviorSettingsForwardedCookies {
        private final java.util.List<java.lang.String> cookiesAllowList;
        private final java.lang.String option;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cookiesAllowList = software.amazon.jsii.Kernel.get(this, "cookiesAllowList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.option = software.amazon.jsii.Kernel.get(this, "option", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cookiesAllowList = builder.cookiesAllowList;
            this.option = builder.option;
        }

        @Override
        public final java.util.List<java.lang.String> getCookiesAllowList() {
            return this.cookiesAllowList;
        }

        @Override
        public final java.lang.String getOption() {
            return this.option;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCookiesAllowList() != null) {
                data.set("cookiesAllowList", om.valueToTree(this.getCookiesAllowList()));
            }
            if (this.getOption() != null) {
                data.set("option", om.valueToTree(this.getOption()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailDistributionCacheBehaviorSettingsForwardedCookies.Jsii$Proxy that = (LightsailDistributionCacheBehaviorSettingsForwardedCookies.Jsii$Proxy) o;

            if (this.cookiesAllowList != null ? !this.cookiesAllowList.equals(that.cookiesAllowList) : that.cookiesAllowList != null) return false;
            return this.option != null ? this.option.equals(that.option) : that.option == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cookiesAllowList != null ? this.cookiesAllowList.hashCode() : 0;
            result = 31 * result + (this.option != null ? this.option.hashCode() : 0);
            return result;
        }
    }
}
