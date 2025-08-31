package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerLakeFormationConfiguration")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerLakeFormationConfiguration.Jsii$Proxy.class)
public interface GlueCrawlerLakeFormationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#account_id GlueCrawler#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#use_lake_formation_credentials GlueCrawler#use_lake_formation_credentials}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseLakeFormationCredentials() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerLakeFormationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerLakeFormationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerLakeFormationConfiguration> {
        java.lang.String accountId;
        java.lang.Object useLakeFormationCredentials;

        /**
         * Sets the value of {@link GlueCrawlerLakeFormationConfiguration#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#account_id GlueCrawler#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerLakeFormationConfiguration#getUseLakeFormationCredentials}
         * @param useLakeFormationCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#use_lake_formation_credentials GlueCrawler#use_lake_formation_credentials}.
         * @return {@code this}
         */
        public Builder useLakeFormationCredentials(java.lang.Boolean useLakeFormationCredentials) {
            this.useLakeFormationCredentials = useLakeFormationCredentials;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerLakeFormationConfiguration#getUseLakeFormationCredentials}
         * @param useLakeFormationCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#use_lake_formation_credentials GlueCrawler#use_lake_formation_credentials}.
         * @return {@code this}
         */
        public Builder useLakeFormationCredentials(com.hashicorp.cdktf.IResolvable useLakeFormationCredentials) {
            this.useLakeFormationCredentials = useLakeFormationCredentials;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerLakeFormationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerLakeFormationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerLakeFormationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerLakeFormationConfiguration {
        private final java.lang.String accountId;
        private final java.lang.Object useLakeFormationCredentials;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.useLakeFormationCredentials = software.amazon.jsii.Kernel.get(this, "useLakeFormationCredentials", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountId = builder.accountId;
            this.useLakeFormationCredentials = builder.useLakeFormationCredentials;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.Object getUseLakeFormationCredentials() {
            return this.useLakeFormationCredentials;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getUseLakeFormationCredentials() != null) {
                data.set("useLakeFormationCredentials", om.valueToTree(this.getUseLakeFormationCredentials()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerLakeFormationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerLakeFormationConfiguration.Jsii$Proxy that = (GlueCrawlerLakeFormationConfiguration.Jsii$Proxy) o;

            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            return this.useLakeFormationCredentials != null ? this.useLakeFormationCredentials.equals(that.useLakeFormationCredentials) : that.useLakeFormationCredentials == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accountId != null ? this.accountId.hashCode() : 0;
            result = 31 * result + (this.useLakeFormationCredentials != null ? this.useLakeFormationCredentials.hashCode() : 0);
            return result;
        }
    }
}
