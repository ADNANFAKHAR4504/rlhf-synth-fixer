package imports.aws.glue_trigger;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueTrigger.GlueTriggerPredicateConditions")
@software.amazon.jsii.Jsii.Proxy(GlueTriggerPredicateConditions.Jsii$Proxy.class)
public interface GlueTriggerPredicateConditions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#crawler_name GlueTrigger#crawler_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCrawlerName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#crawl_state GlueTrigger#crawl_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCrawlState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#job_name GlueTrigger#job_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getJobName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#logical_operator GlueTrigger#logical_operator}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogicalOperator() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#state GlueTrigger#state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getState() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueTriggerPredicateConditions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueTriggerPredicateConditions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueTriggerPredicateConditions> {
        java.lang.String crawlerName;
        java.lang.String crawlState;
        java.lang.String jobName;
        java.lang.String logicalOperator;
        java.lang.String state;

        /**
         * Sets the value of {@link GlueTriggerPredicateConditions#getCrawlerName}
         * @param crawlerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#crawler_name GlueTrigger#crawler_name}.
         * @return {@code this}
         */
        public Builder crawlerName(java.lang.String crawlerName) {
            this.crawlerName = crawlerName;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerPredicateConditions#getCrawlState}
         * @param crawlState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#crawl_state GlueTrigger#crawl_state}.
         * @return {@code this}
         */
        public Builder crawlState(java.lang.String crawlState) {
            this.crawlState = crawlState;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerPredicateConditions#getJobName}
         * @param jobName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#job_name GlueTrigger#job_name}.
         * @return {@code this}
         */
        public Builder jobName(java.lang.String jobName) {
            this.jobName = jobName;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerPredicateConditions#getLogicalOperator}
         * @param logicalOperator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#logical_operator GlueTrigger#logical_operator}.
         * @return {@code this}
         */
        public Builder logicalOperator(java.lang.String logicalOperator) {
            this.logicalOperator = logicalOperator;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerPredicateConditions#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#state GlueTrigger#state}.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueTriggerPredicateConditions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueTriggerPredicateConditions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueTriggerPredicateConditions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueTriggerPredicateConditions {
        private final java.lang.String crawlerName;
        private final java.lang.String crawlState;
        private final java.lang.String jobName;
        private final java.lang.String logicalOperator;
        private final java.lang.String state;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.crawlerName = software.amazon.jsii.Kernel.get(this, "crawlerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.crawlState = software.amazon.jsii.Kernel.get(this, "crawlState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jobName = software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logicalOperator = software.amazon.jsii.Kernel.get(this, "logicalOperator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.crawlerName = builder.crawlerName;
            this.crawlState = builder.crawlState;
            this.jobName = builder.jobName;
            this.logicalOperator = builder.logicalOperator;
            this.state = builder.state;
        }

        @Override
        public final java.lang.String getCrawlerName() {
            return this.crawlerName;
        }

        @Override
        public final java.lang.String getCrawlState() {
            return this.crawlState;
        }

        @Override
        public final java.lang.String getJobName() {
            return this.jobName;
        }

        @Override
        public final java.lang.String getLogicalOperator() {
            return this.logicalOperator;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCrawlerName() != null) {
                data.set("crawlerName", om.valueToTree(this.getCrawlerName()));
            }
            if (this.getCrawlState() != null) {
                data.set("crawlState", om.valueToTree(this.getCrawlState()));
            }
            if (this.getJobName() != null) {
                data.set("jobName", om.valueToTree(this.getJobName()));
            }
            if (this.getLogicalOperator() != null) {
                data.set("logicalOperator", om.valueToTree(this.getLogicalOperator()));
            }
            if (this.getState() != null) {
                data.set("state", om.valueToTree(this.getState()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueTrigger.GlueTriggerPredicateConditions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueTriggerPredicateConditions.Jsii$Proxy that = (GlueTriggerPredicateConditions.Jsii$Proxy) o;

            if (this.crawlerName != null ? !this.crawlerName.equals(that.crawlerName) : that.crawlerName != null) return false;
            if (this.crawlState != null ? !this.crawlState.equals(that.crawlState) : that.crawlState != null) return false;
            if (this.jobName != null ? !this.jobName.equals(that.jobName) : that.jobName != null) return false;
            if (this.logicalOperator != null ? !this.logicalOperator.equals(that.logicalOperator) : that.logicalOperator != null) return false;
            return this.state != null ? this.state.equals(that.state) : that.state == null;
        }

        @Override
        public final int hashCode() {
            int result = this.crawlerName != null ? this.crawlerName.hashCode() : 0;
            result = 31 * result + (this.crawlState != null ? this.crawlState.hashCode() : 0);
            result = 31 * result + (this.jobName != null ? this.jobName.hashCode() : 0);
            result = 31 * result + (this.logicalOperator != null ? this.logicalOperator.hashCode() : 0);
            result = 31 * result + (this.state != null ? this.state.hashCode() : 0);
            return result;
        }
    }
}
