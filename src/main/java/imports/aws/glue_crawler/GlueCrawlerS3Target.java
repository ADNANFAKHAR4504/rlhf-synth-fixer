package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerS3Target")
@software.amazon.jsii.Jsii.Proxy(GlueCrawlerS3Target.Jsii$Proxy.class)
public interface GlueCrawlerS3Target extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#path GlueCrawler#path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#dlq_event_queue_arn GlueCrawler#dlq_event_queue_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDlqEventQueueArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#event_queue_arn GlueCrawler#event_queue_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventQueueArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#exclusions GlueCrawler#exclusions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExclusions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#sample_size GlueCrawler#sample_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSampleSize() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCrawlerS3Target}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCrawlerS3Target}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCrawlerS3Target> {
        java.lang.String path;
        java.lang.String connectionName;
        java.lang.String dlqEventQueueArn;
        java.lang.String eventQueueArn;
        java.util.List<java.lang.String> exclusions;
        java.lang.Number sampleSize;

        /**
         * Sets the value of {@link GlueCrawlerS3Target#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#path GlueCrawler#path}. This parameter is required.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerS3Target#getConnectionName}
         * @param connectionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#connection_name GlueCrawler#connection_name}.
         * @return {@code this}
         */
        public Builder connectionName(java.lang.String connectionName) {
            this.connectionName = connectionName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerS3Target#getDlqEventQueueArn}
         * @param dlqEventQueueArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#dlq_event_queue_arn GlueCrawler#dlq_event_queue_arn}.
         * @return {@code this}
         */
        public Builder dlqEventQueueArn(java.lang.String dlqEventQueueArn) {
            this.dlqEventQueueArn = dlqEventQueueArn;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerS3Target#getEventQueueArn}
         * @param eventQueueArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#event_queue_arn GlueCrawler#event_queue_arn}.
         * @return {@code this}
         */
        public Builder eventQueueArn(java.lang.String eventQueueArn) {
            this.eventQueueArn = eventQueueArn;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerS3Target#getExclusions}
         * @param exclusions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#exclusions GlueCrawler#exclusions}.
         * @return {@code this}
         */
        public Builder exclusions(java.util.List<java.lang.String> exclusions) {
            this.exclusions = exclusions;
            return this;
        }

        /**
         * Sets the value of {@link GlueCrawlerS3Target#getSampleSize}
         * @param sampleSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_crawler#sample_size GlueCrawler#sample_size}.
         * @return {@code this}
         */
        public Builder sampleSize(java.lang.Number sampleSize) {
            this.sampleSize = sampleSize;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCrawlerS3Target}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCrawlerS3Target build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCrawlerS3Target}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCrawlerS3Target {
        private final java.lang.String path;
        private final java.lang.String connectionName;
        private final java.lang.String dlqEventQueueArn;
        private final java.lang.String eventQueueArn;
        private final java.util.List<java.lang.String> exclusions;
        private final java.lang.Number sampleSize;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectionName = software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dlqEventQueueArn = software.amazon.jsii.Kernel.get(this, "dlqEventQueueArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventQueueArn = software.amazon.jsii.Kernel.get(this, "eventQueueArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exclusions = software.amazon.jsii.Kernel.get(this, "exclusions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sampleSize = software.amazon.jsii.Kernel.get(this, "sampleSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.path = java.util.Objects.requireNonNull(builder.path, "path is required");
            this.connectionName = builder.connectionName;
            this.dlqEventQueueArn = builder.dlqEventQueueArn;
            this.eventQueueArn = builder.eventQueueArn;
            this.exclusions = builder.exclusions;
            this.sampleSize = builder.sampleSize;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        public final java.lang.String getConnectionName() {
            return this.connectionName;
        }

        @Override
        public final java.lang.String getDlqEventQueueArn() {
            return this.dlqEventQueueArn;
        }

        @Override
        public final java.lang.String getEventQueueArn() {
            return this.eventQueueArn;
        }

        @Override
        public final java.util.List<java.lang.String> getExclusions() {
            return this.exclusions;
        }

        @Override
        public final java.lang.Number getSampleSize() {
            return this.sampleSize;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("path", om.valueToTree(this.getPath()));
            if (this.getConnectionName() != null) {
                data.set("connectionName", om.valueToTree(this.getConnectionName()));
            }
            if (this.getDlqEventQueueArn() != null) {
                data.set("dlqEventQueueArn", om.valueToTree(this.getDlqEventQueueArn()));
            }
            if (this.getEventQueueArn() != null) {
                data.set("eventQueueArn", om.valueToTree(this.getEventQueueArn()));
            }
            if (this.getExclusions() != null) {
                data.set("exclusions", om.valueToTree(this.getExclusions()));
            }
            if (this.getSampleSize() != null) {
                data.set("sampleSize", om.valueToTree(this.getSampleSize()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCrawler.GlueCrawlerS3Target"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCrawlerS3Target.Jsii$Proxy that = (GlueCrawlerS3Target.Jsii$Proxy) o;

            if (!path.equals(that.path)) return false;
            if (this.connectionName != null ? !this.connectionName.equals(that.connectionName) : that.connectionName != null) return false;
            if (this.dlqEventQueueArn != null ? !this.dlqEventQueueArn.equals(that.dlqEventQueueArn) : that.dlqEventQueueArn != null) return false;
            if (this.eventQueueArn != null ? !this.eventQueueArn.equals(that.eventQueueArn) : that.eventQueueArn != null) return false;
            if (this.exclusions != null ? !this.exclusions.equals(that.exclusions) : that.exclusions != null) return false;
            return this.sampleSize != null ? this.sampleSize.equals(that.sampleSize) : that.sampleSize == null;
        }

        @Override
        public final int hashCode() {
            int result = this.path.hashCode();
            result = 31 * result + (this.connectionName != null ? this.connectionName.hashCode() : 0);
            result = 31 * result + (this.dlqEventQueueArn != null ? this.dlqEventQueueArn.hashCode() : 0);
            result = 31 * result + (this.eventQueueArn != null ? this.eventQueueArn.hashCode() : 0);
            result = 31 * result + (this.exclusions != null ? this.exclusions.hashCode() : 0);
            result = 31 * result + (this.sampleSize != null ? this.sampleSize.hashCode() : 0);
            return result;
        }
    }
}
