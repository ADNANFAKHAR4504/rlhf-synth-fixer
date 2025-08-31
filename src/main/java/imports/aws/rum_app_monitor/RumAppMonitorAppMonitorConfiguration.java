package imports.aws.rum_app_monitor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.238Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rumAppMonitor.RumAppMonitorAppMonitorConfiguration")
@software.amazon.jsii.Jsii.Proxy(RumAppMonitorAppMonitorConfiguration.Jsii$Proxy.class)
public interface RumAppMonitorAppMonitorConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#allow_cookies RumAppMonitor#allow_cookies}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowCookies() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#enable_xray RumAppMonitor#enable_xray}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableXray() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#excluded_pages RumAppMonitor#excluded_pages}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludedPages() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#favorite_pages RumAppMonitor#favorite_pages}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFavoritePages() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#guest_role_arn RumAppMonitor#guest_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGuestRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#identity_pool_id RumAppMonitor#identity_pool_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentityPoolId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#included_pages RumAppMonitor#included_pages}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludedPages() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#session_sample_rate RumAppMonitor#session_sample_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSessionSampleRate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#telemetries RumAppMonitor#telemetries}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTelemetries() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RumAppMonitorAppMonitorConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RumAppMonitorAppMonitorConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RumAppMonitorAppMonitorConfiguration> {
        java.lang.Object allowCookies;
        java.lang.Object enableXray;
        java.util.List<java.lang.String> excludedPages;
        java.util.List<java.lang.String> favoritePages;
        java.lang.String guestRoleArn;
        java.lang.String identityPoolId;
        java.util.List<java.lang.String> includedPages;
        java.lang.Number sessionSampleRate;
        java.util.List<java.lang.String> telemetries;

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getAllowCookies}
         * @param allowCookies Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#allow_cookies RumAppMonitor#allow_cookies}.
         * @return {@code this}
         */
        public Builder allowCookies(java.lang.Boolean allowCookies) {
            this.allowCookies = allowCookies;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getAllowCookies}
         * @param allowCookies Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#allow_cookies RumAppMonitor#allow_cookies}.
         * @return {@code this}
         */
        public Builder allowCookies(com.hashicorp.cdktf.IResolvable allowCookies) {
            this.allowCookies = allowCookies;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getEnableXray}
         * @param enableXray Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#enable_xray RumAppMonitor#enable_xray}.
         * @return {@code this}
         */
        public Builder enableXray(java.lang.Boolean enableXray) {
            this.enableXray = enableXray;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getEnableXray}
         * @param enableXray Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#enable_xray RumAppMonitor#enable_xray}.
         * @return {@code this}
         */
        public Builder enableXray(com.hashicorp.cdktf.IResolvable enableXray) {
            this.enableXray = enableXray;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getExcludedPages}
         * @param excludedPages Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#excluded_pages RumAppMonitor#excluded_pages}.
         * @return {@code this}
         */
        public Builder excludedPages(java.util.List<java.lang.String> excludedPages) {
            this.excludedPages = excludedPages;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getFavoritePages}
         * @param favoritePages Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#favorite_pages RumAppMonitor#favorite_pages}.
         * @return {@code this}
         */
        public Builder favoritePages(java.util.List<java.lang.String> favoritePages) {
            this.favoritePages = favoritePages;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getGuestRoleArn}
         * @param guestRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#guest_role_arn RumAppMonitor#guest_role_arn}.
         * @return {@code this}
         */
        public Builder guestRoleArn(java.lang.String guestRoleArn) {
            this.guestRoleArn = guestRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getIdentityPoolId}
         * @param identityPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#identity_pool_id RumAppMonitor#identity_pool_id}.
         * @return {@code this}
         */
        public Builder identityPoolId(java.lang.String identityPoolId) {
            this.identityPoolId = identityPoolId;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getIncludedPages}
         * @param includedPages Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#included_pages RumAppMonitor#included_pages}.
         * @return {@code this}
         */
        public Builder includedPages(java.util.List<java.lang.String> includedPages) {
            this.includedPages = includedPages;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getSessionSampleRate}
         * @param sessionSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#session_sample_rate RumAppMonitor#session_sample_rate}.
         * @return {@code this}
         */
        public Builder sessionSampleRate(java.lang.Number sessionSampleRate) {
            this.sessionSampleRate = sessionSampleRate;
            return this;
        }

        /**
         * Sets the value of {@link RumAppMonitorAppMonitorConfiguration#getTelemetries}
         * @param telemetries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rum_app_monitor#telemetries RumAppMonitor#telemetries}.
         * @return {@code this}
         */
        public Builder telemetries(java.util.List<java.lang.String> telemetries) {
            this.telemetries = telemetries;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RumAppMonitorAppMonitorConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RumAppMonitorAppMonitorConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RumAppMonitorAppMonitorConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RumAppMonitorAppMonitorConfiguration {
        private final java.lang.Object allowCookies;
        private final java.lang.Object enableXray;
        private final java.util.List<java.lang.String> excludedPages;
        private final java.util.List<java.lang.String> favoritePages;
        private final java.lang.String guestRoleArn;
        private final java.lang.String identityPoolId;
        private final java.util.List<java.lang.String> includedPages;
        private final java.lang.Number sessionSampleRate;
        private final java.util.List<java.lang.String> telemetries;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowCookies = software.amazon.jsii.Kernel.get(this, "allowCookies", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableXray = software.amazon.jsii.Kernel.get(this, "enableXray", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.excludedPages = software.amazon.jsii.Kernel.get(this, "excludedPages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.favoritePages = software.amazon.jsii.Kernel.get(this, "favoritePages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.guestRoleArn = software.amazon.jsii.Kernel.get(this, "guestRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identityPoolId = software.amazon.jsii.Kernel.get(this, "identityPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includedPages = software.amazon.jsii.Kernel.get(this, "includedPages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sessionSampleRate = software.amazon.jsii.Kernel.get(this, "sessionSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.telemetries = software.amazon.jsii.Kernel.get(this, "telemetries", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowCookies = builder.allowCookies;
            this.enableXray = builder.enableXray;
            this.excludedPages = builder.excludedPages;
            this.favoritePages = builder.favoritePages;
            this.guestRoleArn = builder.guestRoleArn;
            this.identityPoolId = builder.identityPoolId;
            this.includedPages = builder.includedPages;
            this.sessionSampleRate = builder.sessionSampleRate;
            this.telemetries = builder.telemetries;
        }

        @Override
        public final java.lang.Object getAllowCookies() {
            return this.allowCookies;
        }

        @Override
        public final java.lang.Object getEnableXray() {
            return this.enableXray;
        }

        @Override
        public final java.util.List<java.lang.String> getExcludedPages() {
            return this.excludedPages;
        }

        @Override
        public final java.util.List<java.lang.String> getFavoritePages() {
            return this.favoritePages;
        }

        @Override
        public final java.lang.String getGuestRoleArn() {
            return this.guestRoleArn;
        }

        @Override
        public final java.lang.String getIdentityPoolId() {
            return this.identityPoolId;
        }

        @Override
        public final java.util.List<java.lang.String> getIncludedPages() {
            return this.includedPages;
        }

        @Override
        public final java.lang.Number getSessionSampleRate() {
            return this.sessionSampleRate;
        }

        @Override
        public final java.util.List<java.lang.String> getTelemetries() {
            return this.telemetries;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowCookies() != null) {
                data.set("allowCookies", om.valueToTree(this.getAllowCookies()));
            }
            if (this.getEnableXray() != null) {
                data.set("enableXray", om.valueToTree(this.getEnableXray()));
            }
            if (this.getExcludedPages() != null) {
                data.set("excludedPages", om.valueToTree(this.getExcludedPages()));
            }
            if (this.getFavoritePages() != null) {
                data.set("favoritePages", om.valueToTree(this.getFavoritePages()));
            }
            if (this.getGuestRoleArn() != null) {
                data.set("guestRoleArn", om.valueToTree(this.getGuestRoleArn()));
            }
            if (this.getIdentityPoolId() != null) {
                data.set("identityPoolId", om.valueToTree(this.getIdentityPoolId()));
            }
            if (this.getIncludedPages() != null) {
                data.set("includedPages", om.valueToTree(this.getIncludedPages()));
            }
            if (this.getSessionSampleRate() != null) {
                data.set("sessionSampleRate", om.valueToTree(this.getSessionSampleRate()));
            }
            if (this.getTelemetries() != null) {
                data.set("telemetries", om.valueToTree(this.getTelemetries()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rumAppMonitor.RumAppMonitorAppMonitorConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RumAppMonitorAppMonitorConfiguration.Jsii$Proxy that = (RumAppMonitorAppMonitorConfiguration.Jsii$Proxy) o;

            if (this.allowCookies != null ? !this.allowCookies.equals(that.allowCookies) : that.allowCookies != null) return false;
            if (this.enableXray != null ? !this.enableXray.equals(that.enableXray) : that.enableXray != null) return false;
            if (this.excludedPages != null ? !this.excludedPages.equals(that.excludedPages) : that.excludedPages != null) return false;
            if (this.favoritePages != null ? !this.favoritePages.equals(that.favoritePages) : that.favoritePages != null) return false;
            if (this.guestRoleArn != null ? !this.guestRoleArn.equals(that.guestRoleArn) : that.guestRoleArn != null) return false;
            if (this.identityPoolId != null ? !this.identityPoolId.equals(that.identityPoolId) : that.identityPoolId != null) return false;
            if (this.includedPages != null ? !this.includedPages.equals(that.includedPages) : that.includedPages != null) return false;
            if (this.sessionSampleRate != null ? !this.sessionSampleRate.equals(that.sessionSampleRate) : that.sessionSampleRate != null) return false;
            return this.telemetries != null ? this.telemetries.equals(that.telemetries) : that.telemetries == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowCookies != null ? this.allowCookies.hashCode() : 0;
            result = 31 * result + (this.enableXray != null ? this.enableXray.hashCode() : 0);
            result = 31 * result + (this.excludedPages != null ? this.excludedPages.hashCode() : 0);
            result = 31 * result + (this.favoritePages != null ? this.favoritePages.hashCode() : 0);
            result = 31 * result + (this.guestRoleArn != null ? this.guestRoleArn.hashCode() : 0);
            result = 31 * result + (this.identityPoolId != null ? this.identityPoolId.hashCode() : 0);
            result = 31 * result + (this.includedPages != null ? this.includedPages.hashCode() : 0);
            result = 31 * result + (this.sessionSampleRate != null ? this.sessionSampleRate.hashCode() : 0);
            result = 31 * result + (this.telemetries != null ? this.telemetries.hashCode() : 0);
            return result;
        }
    }
}
