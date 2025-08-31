package imports.aws.accessanalyzer_analyzer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.883Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion")
@software.amazon.jsii.Jsii.Proxy(AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion.Jsii$Proxy.class)
public interface AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#account_ids AccessanalyzerAnalyzer#account_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccountIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#resource_tags AccessanalyzerAnalyzer#resource_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResourceTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion> {
        java.util.List<java.lang.String> accountIds;
        java.lang.Object resourceTags;

        /**
         * Sets the value of {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion#getAccountIds}
         * @param accountIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#account_ids AccessanalyzerAnalyzer#account_ids}.
         * @return {@code this}
         */
        public Builder accountIds(java.util.List<java.lang.String> accountIds) {
            this.accountIds = accountIds;
            return this;
        }

        /**
         * Sets the value of {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion#getResourceTags}
         * @param resourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#resource_tags AccessanalyzerAnalyzer#resource_tags}.
         * @return {@code this}
         */
        public Builder resourceTags(com.hashicorp.cdktf.IResolvable resourceTags) {
            this.resourceTags = resourceTags;
            return this;
        }

        /**
         * Sets the value of {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion#getResourceTags}
         * @param resourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#resource_tags AccessanalyzerAnalyzer#resource_tags}.
         * @return {@code this}
         */
        public Builder resourceTags(java.util.List<? extends java.util.Map<java.lang.String, java.lang.String>> resourceTags) {
            this.resourceTags = resourceTags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion {
        private final java.util.List<java.lang.String> accountIds;
        private final java.lang.Object resourceTags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountIds = software.amazon.jsii.Kernel.get(this, "accountIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceTags = software.amazon.jsii.Kernel.get(this, "resourceTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountIds = builder.accountIds;
            this.resourceTags = builder.resourceTags;
        }

        @Override
        public final java.util.List<java.lang.String> getAccountIds() {
            return this.accountIds;
        }

        @Override
        public final java.lang.Object getResourceTags() {
            return this.resourceTags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccountIds() != null) {
                data.set("accountIds", om.valueToTree(this.getAccountIds()));
            }
            if (this.getResourceTags() != null) {
                data.set("resourceTags", om.valueToTree(this.getResourceTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion.Jsii$Proxy that = (AccessanalyzerAnalyzerConfigurationUnusedAccessAnalysisRuleExclusion.Jsii$Proxy) o;

            if (this.accountIds != null ? !this.accountIds.equals(that.accountIds) : that.accountIds != null) return false;
            return this.resourceTags != null ? this.resourceTags.equals(that.resourceTags) : that.resourceTags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accountIds != null ? this.accountIds.hashCode() : 0;
            result = 31 * result + (this.resourceTags != null ? this.resourceTags.hashCode() : 0);
            return result;
        }
    }
}
