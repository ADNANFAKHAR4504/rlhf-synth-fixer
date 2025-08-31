package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.827Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders")
@software.amazon.jsii.Jsii.Proxy(LightsailDistributionCacheBehaviorSettingsForwardedHeaders.Jsii$Proxy.class)
public interface LightsailDistributionCacheBehaviorSettingsForwardedHeaders extends software.amazon.jsii.JsiiSerializable {

    /**
     * The specific headers to forward to your distribution's origin.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#headers_allow_list LightsailDistribution#headers_allow_list}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHeadersAllowList() {
        return null;
    }

    /**
     * The headers that you want your distribution to forward to your origin and base caching on.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOption() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailDistributionCacheBehaviorSettingsForwardedHeaders}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailDistributionCacheBehaviorSettingsForwardedHeaders}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailDistributionCacheBehaviorSettingsForwardedHeaders> {
        java.util.List<java.lang.String> headersAllowList;
        java.lang.String option;

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettingsForwardedHeaders#getHeadersAllowList}
         * @param headersAllowList The specific headers to forward to your distribution's origin.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#headers_allow_list LightsailDistribution#headers_allow_list}
         * @return {@code this}
         */
        public Builder headersAllowList(java.util.List<java.lang.String> headersAllowList) {
            this.headersAllowList = headersAllowList;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettingsForwardedHeaders#getOption}
         * @param option The headers that you want your distribution to forward to your origin and base caching on.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#option LightsailDistribution#option}
         * @return {@code this}
         */
        public Builder option(java.lang.String option) {
            this.option = option;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailDistributionCacheBehaviorSettingsForwardedHeaders}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailDistributionCacheBehaviorSettingsForwardedHeaders build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailDistributionCacheBehaviorSettingsForwardedHeaders}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailDistributionCacheBehaviorSettingsForwardedHeaders {
        private final java.util.List<java.lang.String> headersAllowList;
        private final java.lang.String option;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.headersAllowList = software.amazon.jsii.Kernel.get(this, "headersAllowList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.option = software.amazon.jsii.Kernel.get(this, "option", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.headersAllowList = builder.headersAllowList;
            this.option = builder.option;
        }

        @Override
        public final java.util.List<java.lang.String> getHeadersAllowList() {
            return this.headersAllowList;
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

            if (this.getHeadersAllowList() != null) {
                data.set("headersAllowList", om.valueToTree(this.getHeadersAllowList()));
            }
            if (this.getOption() != null) {
                data.set("option", om.valueToTree(this.getOption()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailDistributionCacheBehaviorSettingsForwardedHeaders.Jsii$Proxy that = (LightsailDistributionCacheBehaviorSettingsForwardedHeaders.Jsii$Proxy) o;

            if (this.headersAllowList != null ? !this.headersAllowList.equals(that.headersAllowList) : that.headersAllowList != null) return false;
            return this.option != null ? this.option.equals(that.option) : that.option == null;
        }

        @Override
        public final int hashCode() {
            int result = this.headersAllowList != null ? this.headersAllowList.hashCode() : 0;
            result = 31 * result + (this.option != null ? this.option.hashCode() : 0);
            return result;
        }
    }
}
