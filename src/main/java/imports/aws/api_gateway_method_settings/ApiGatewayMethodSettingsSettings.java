package imports.aws.api_gateway_method_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.950Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayMethodSettings.ApiGatewayMethodSettingsSettings")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayMethodSettingsSettings.Jsii$Proxy.class)
public interface ApiGatewayMethodSettingsSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#cache_data_encrypted ApiGatewayMethodSettings#cache_data_encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCacheDataEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#cache_ttl_in_seconds ApiGatewayMethodSettings#cache_ttl_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCacheTtlInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#caching_enabled ApiGatewayMethodSettings#caching_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCachingEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#data_trace_enabled ApiGatewayMethodSettings#data_trace_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataTraceEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#logging_level ApiGatewayMethodSettings#logging_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLoggingLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#metrics_enabled ApiGatewayMethodSettings#metrics_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMetricsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#require_authorization_for_cache_control ApiGatewayMethodSettings#require_authorization_for_cache_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireAuthorizationForCacheControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#throttling_burst_limit ApiGatewayMethodSettings#throttling_burst_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThrottlingBurstLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#throttling_rate_limit ApiGatewayMethodSettings#throttling_rate_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThrottlingRateLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#unauthorized_cache_control_header_strategy ApiGatewayMethodSettings#unauthorized_cache_control_header_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnauthorizedCacheControlHeaderStrategy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayMethodSettingsSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayMethodSettingsSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayMethodSettingsSettings> {
        java.lang.Object cacheDataEncrypted;
        java.lang.Number cacheTtlInSeconds;
        java.lang.Object cachingEnabled;
        java.lang.Object dataTraceEnabled;
        java.lang.String loggingLevel;
        java.lang.Object metricsEnabled;
        java.lang.Object requireAuthorizationForCacheControl;
        java.lang.Number throttlingBurstLimit;
        java.lang.Number throttlingRateLimit;
        java.lang.String unauthorizedCacheControlHeaderStrategy;

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getCacheDataEncrypted}
         * @param cacheDataEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#cache_data_encrypted ApiGatewayMethodSettings#cache_data_encrypted}.
         * @return {@code this}
         */
        public Builder cacheDataEncrypted(java.lang.Boolean cacheDataEncrypted) {
            this.cacheDataEncrypted = cacheDataEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getCacheDataEncrypted}
         * @param cacheDataEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#cache_data_encrypted ApiGatewayMethodSettings#cache_data_encrypted}.
         * @return {@code this}
         */
        public Builder cacheDataEncrypted(com.hashicorp.cdktf.IResolvable cacheDataEncrypted) {
            this.cacheDataEncrypted = cacheDataEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getCacheTtlInSeconds}
         * @param cacheTtlInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#cache_ttl_in_seconds ApiGatewayMethodSettings#cache_ttl_in_seconds}.
         * @return {@code this}
         */
        public Builder cacheTtlInSeconds(java.lang.Number cacheTtlInSeconds) {
            this.cacheTtlInSeconds = cacheTtlInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getCachingEnabled}
         * @param cachingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#caching_enabled ApiGatewayMethodSettings#caching_enabled}.
         * @return {@code this}
         */
        public Builder cachingEnabled(java.lang.Boolean cachingEnabled) {
            this.cachingEnabled = cachingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getCachingEnabled}
         * @param cachingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#caching_enabled ApiGatewayMethodSettings#caching_enabled}.
         * @return {@code this}
         */
        public Builder cachingEnabled(com.hashicorp.cdktf.IResolvable cachingEnabled) {
            this.cachingEnabled = cachingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getDataTraceEnabled}
         * @param dataTraceEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#data_trace_enabled ApiGatewayMethodSettings#data_trace_enabled}.
         * @return {@code this}
         */
        public Builder dataTraceEnabled(java.lang.Boolean dataTraceEnabled) {
            this.dataTraceEnabled = dataTraceEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getDataTraceEnabled}
         * @param dataTraceEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#data_trace_enabled ApiGatewayMethodSettings#data_trace_enabled}.
         * @return {@code this}
         */
        public Builder dataTraceEnabled(com.hashicorp.cdktf.IResolvable dataTraceEnabled) {
            this.dataTraceEnabled = dataTraceEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getLoggingLevel}
         * @param loggingLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#logging_level ApiGatewayMethodSettings#logging_level}.
         * @return {@code this}
         */
        public Builder loggingLevel(java.lang.String loggingLevel) {
            this.loggingLevel = loggingLevel;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getMetricsEnabled}
         * @param metricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#metrics_enabled ApiGatewayMethodSettings#metrics_enabled}.
         * @return {@code this}
         */
        public Builder metricsEnabled(java.lang.Boolean metricsEnabled) {
            this.metricsEnabled = metricsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getMetricsEnabled}
         * @param metricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#metrics_enabled ApiGatewayMethodSettings#metrics_enabled}.
         * @return {@code this}
         */
        public Builder metricsEnabled(com.hashicorp.cdktf.IResolvable metricsEnabled) {
            this.metricsEnabled = metricsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getRequireAuthorizationForCacheControl}
         * @param requireAuthorizationForCacheControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#require_authorization_for_cache_control ApiGatewayMethodSettings#require_authorization_for_cache_control}.
         * @return {@code this}
         */
        public Builder requireAuthorizationForCacheControl(java.lang.Boolean requireAuthorizationForCacheControl) {
            this.requireAuthorizationForCacheControl = requireAuthorizationForCacheControl;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getRequireAuthorizationForCacheControl}
         * @param requireAuthorizationForCacheControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#require_authorization_for_cache_control ApiGatewayMethodSettings#require_authorization_for_cache_control}.
         * @return {@code this}
         */
        public Builder requireAuthorizationForCacheControl(com.hashicorp.cdktf.IResolvable requireAuthorizationForCacheControl) {
            this.requireAuthorizationForCacheControl = requireAuthorizationForCacheControl;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getThrottlingBurstLimit}
         * @param throttlingBurstLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#throttling_burst_limit ApiGatewayMethodSettings#throttling_burst_limit}.
         * @return {@code this}
         */
        public Builder throttlingBurstLimit(java.lang.Number throttlingBurstLimit) {
            this.throttlingBurstLimit = throttlingBurstLimit;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getThrottlingRateLimit}
         * @param throttlingRateLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#throttling_rate_limit ApiGatewayMethodSettings#throttling_rate_limit}.
         * @return {@code this}
         */
        public Builder throttlingRateLimit(java.lang.Number throttlingRateLimit) {
            this.throttlingRateLimit = throttlingRateLimit;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodSettingsSettings#getUnauthorizedCacheControlHeaderStrategy}
         * @param unauthorizedCacheControlHeaderStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_settings#unauthorized_cache_control_header_strategy ApiGatewayMethodSettings#unauthorized_cache_control_header_strategy}.
         * @return {@code this}
         */
        public Builder unauthorizedCacheControlHeaderStrategy(java.lang.String unauthorizedCacheControlHeaderStrategy) {
            this.unauthorizedCacheControlHeaderStrategy = unauthorizedCacheControlHeaderStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApiGatewayMethodSettingsSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayMethodSettingsSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayMethodSettingsSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayMethodSettingsSettings {
        private final java.lang.Object cacheDataEncrypted;
        private final java.lang.Number cacheTtlInSeconds;
        private final java.lang.Object cachingEnabled;
        private final java.lang.Object dataTraceEnabled;
        private final java.lang.String loggingLevel;
        private final java.lang.Object metricsEnabled;
        private final java.lang.Object requireAuthorizationForCacheControl;
        private final java.lang.Number throttlingBurstLimit;
        private final java.lang.Number throttlingRateLimit;
        private final java.lang.String unauthorizedCacheControlHeaderStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cacheDataEncrypted = software.amazon.jsii.Kernel.get(this, "cacheDataEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cacheTtlInSeconds = software.amazon.jsii.Kernel.get(this, "cacheTtlInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cachingEnabled = software.amazon.jsii.Kernel.get(this, "cachingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataTraceEnabled = software.amazon.jsii.Kernel.get(this, "dataTraceEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.loggingLevel = software.amazon.jsii.Kernel.get(this, "loggingLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricsEnabled = software.amazon.jsii.Kernel.get(this, "metricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requireAuthorizationForCacheControl = software.amazon.jsii.Kernel.get(this, "requireAuthorizationForCacheControl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.throttlingBurstLimit = software.amazon.jsii.Kernel.get(this, "throttlingBurstLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.throttlingRateLimit = software.amazon.jsii.Kernel.get(this, "throttlingRateLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.unauthorizedCacheControlHeaderStrategy = software.amazon.jsii.Kernel.get(this, "unauthorizedCacheControlHeaderStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cacheDataEncrypted = builder.cacheDataEncrypted;
            this.cacheTtlInSeconds = builder.cacheTtlInSeconds;
            this.cachingEnabled = builder.cachingEnabled;
            this.dataTraceEnabled = builder.dataTraceEnabled;
            this.loggingLevel = builder.loggingLevel;
            this.metricsEnabled = builder.metricsEnabled;
            this.requireAuthorizationForCacheControl = builder.requireAuthorizationForCacheControl;
            this.throttlingBurstLimit = builder.throttlingBurstLimit;
            this.throttlingRateLimit = builder.throttlingRateLimit;
            this.unauthorizedCacheControlHeaderStrategy = builder.unauthorizedCacheControlHeaderStrategy;
        }

        @Override
        public final java.lang.Object getCacheDataEncrypted() {
            return this.cacheDataEncrypted;
        }

        @Override
        public final java.lang.Number getCacheTtlInSeconds() {
            return this.cacheTtlInSeconds;
        }

        @Override
        public final java.lang.Object getCachingEnabled() {
            return this.cachingEnabled;
        }

        @Override
        public final java.lang.Object getDataTraceEnabled() {
            return this.dataTraceEnabled;
        }

        @Override
        public final java.lang.String getLoggingLevel() {
            return this.loggingLevel;
        }

        @Override
        public final java.lang.Object getMetricsEnabled() {
            return this.metricsEnabled;
        }

        @Override
        public final java.lang.Object getRequireAuthorizationForCacheControl() {
            return this.requireAuthorizationForCacheControl;
        }

        @Override
        public final java.lang.Number getThrottlingBurstLimit() {
            return this.throttlingBurstLimit;
        }

        @Override
        public final java.lang.Number getThrottlingRateLimit() {
            return this.throttlingRateLimit;
        }

        @Override
        public final java.lang.String getUnauthorizedCacheControlHeaderStrategy() {
            return this.unauthorizedCacheControlHeaderStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCacheDataEncrypted() != null) {
                data.set("cacheDataEncrypted", om.valueToTree(this.getCacheDataEncrypted()));
            }
            if (this.getCacheTtlInSeconds() != null) {
                data.set("cacheTtlInSeconds", om.valueToTree(this.getCacheTtlInSeconds()));
            }
            if (this.getCachingEnabled() != null) {
                data.set("cachingEnabled", om.valueToTree(this.getCachingEnabled()));
            }
            if (this.getDataTraceEnabled() != null) {
                data.set("dataTraceEnabled", om.valueToTree(this.getDataTraceEnabled()));
            }
            if (this.getLoggingLevel() != null) {
                data.set("loggingLevel", om.valueToTree(this.getLoggingLevel()));
            }
            if (this.getMetricsEnabled() != null) {
                data.set("metricsEnabled", om.valueToTree(this.getMetricsEnabled()));
            }
            if (this.getRequireAuthorizationForCacheControl() != null) {
                data.set("requireAuthorizationForCacheControl", om.valueToTree(this.getRequireAuthorizationForCacheControl()));
            }
            if (this.getThrottlingBurstLimit() != null) {
                data.set("throttlingBurstLimit", om.valueToTree(this.getThrottlingBurstLimit()));
            }
            if (this.getThrottlingRateLimit() != null) {
                data.set("throttlingRateLimit", om.valueToTree(this.getThrottlingRateLimit()));
            }
            if (this.getUnauthorizedCacheControlHeaderStrategy() != null) {
                data.set("unauthorizedCacheControlHeaderStrategy", om.valueToTree(this.getUnauthorizedCacheControlHeaderStrategy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apiGatewayMethodSettings.ApiGatewayMethodSettingsSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayMethodSettingsSettings.Jsii$Proxy that = (ApiGatewayMethodSettingsSettings.Jsii$Proxy) o;

            if (this.cacheDataEncrypted != null ? !this.cacheDataEncrypted.equals(that.cacheDataEncrypted) : that.cacheDataEncrypted != null) return false;
            if (this.cacheTtlInSeconds != null ? !this.cacheTtlInSeconds.equals(that.cacheTtlInSeconds) : that.cacheTtlInSeconds != null) return false;
            if (this.cachingEnabled != null ? !this.cachingEnabled.equals(that.cachingEnabled) : that.cachingEnabled != null) return false;
            if (this.dataTraceEnabled != null ? !this.dataTraceEnabled.equals(that.dataTraceEnabled) : that.dataTraceEnabled != null) return false;
            if (this.loggingLevel != null ? !this.loggingLevel.equals(that.loggingLevel) : that.loggingLevel != null) return false;
            if (this.metricsEnabled != null ? !this.metricsEnabled.equals(that.metricsEnabled) : that.metricsEnabled != null) return false;
            if (this.requireAuthorizationForCacheControl != null ? !this.requireAuthorizationForCacheControl.equals(that.requireAuthorizationForCacheControl) : that.requireAuthorizationForCacheControl != null) return false;
            if (this.throttlingBurstLimit != null ? !this.throttlingBurstLimit.equals(that.throttlingBurstLimit) : that.throttlingBurstLimit != null) return false;
            if (this.throttlingRateLimit != null ? !this.throttlingRateLimit.equals(that.throttlingRateLimit) : that.throttlingRateLimit != null) return false;
            return this.unauthorizedCacheControlHeaderStrategy != null ? this.unauthorizedCacheControlHeaderStrategy.equals(that.unauthorizedCacheControlHeaderStrategy) : that.unauthorizedCacheControlHeaderStrategy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cacheDataEncrypted != null ? this.cacheDataEncrypted.hashCode() : 0;
            result = 31 * result + (this.cacheTtlInSeconds != null ? this.cacheTtlInSeconds.hashCode() : 0);
            result = 31 * result + (this.cachingEnabled != null ? this.cachingEnabled.hashCode() : 0);
            result = 31 * result + (this.dataTraceEnabled != null ? this.dataTraceEnabled.hashCode() : 0);
            result = 31 * result + (this.loggingLevel != null ? this.loggingLevel.hashCode() : 0);
            result = 31 * result + (this.metricsEnabled != null ? this.metricsEnabled.hashCode() : 0);
            result = 31 * result + (this.requireAuthorizationForCacheControl != null ? this.requireAuthorizationForCacheControl.hashCode() : 0);
            result = 31 * result + (this.throttlingBurstLimit != null ? this.throttlingBurstLimit.hashCode() : 0);
            result = 31 * result + (this.throttlingRateLimit != null ? this.throttlingRateLimit.hashCode() : 0);
            result = 31 * result + (this.unauthorizedCacheControlHeaderStrategy != null ? this.unauthorizedCacheControlHeaderStrategy.hashCode() : 0);
            return result;
        }
    }
}
