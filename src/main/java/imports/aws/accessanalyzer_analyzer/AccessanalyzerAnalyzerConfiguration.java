package imports.aws.accessanalyzer_analyzer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.882Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfiguration")
@software.amazon.jsii.Jsii.Proxy(AccessanalyzerAnalyzerConfiguration.Jsii$Proxy.class)
public interface AccessanalyzerAnalyzerConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * unused_access block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#unused_access AccessanalyzerAnalyzer#unused_access}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess getUnusedAccess() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AccessanalyzerAnalyzerConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AccessanalyzerAnalyzerConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AccessanalyzerAnalyzerConfiguration> {
        imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess unusedAccess;

        /**
         * Sets the value of {@link AccessanalyzerAnalyzerConfiguration#getUnusedAccess}
         * @param unusedAccess unused_access block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/accessanalyzer_analyzer#unused_access AccessanalyzerAnalyzer#unused_access}
         * @return {@code this}
         */
        public Builder unusedAccess(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess unusedAccess) {
            this.unusedAccess = unusedAccess;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AccessanalyzerAnalyzerConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AccessanalyzerAnalyzerConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AccessanalyzerAnalyzerConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AccessanalyzerAnalyzerConfiguration {
        private final imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess unusedAccess;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.unusedAccess = software.amazon.jsii.Kernel.get(this, "unusedAccess", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.unusedAccess = builder.unusedAccess;
        }

        @Override
        public final imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess getUnusedAccess() {
            return this.unusedAccess;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getUnusedAccess() != null) {
                data.set("unusedAccess", om.valueToTree(this.getUnusedAccess()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AccessanalyzerAnalyzerConfiguration.Jsii$Proxy that = (AccessanalyzerAnalyzerConfiguration.Jsii$Proxy) o;

            return this.unusedAccess != null ? this.unusedAccess.equals(that.unusedAccess) : that.unusedAccess == null;
        }

        @Override
        public final int hashCode() {
            int result = this.unusedAccess != null ? this.unusedAccess.hashCode() : 0;
            return result;
        }
    }
}
