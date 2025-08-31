package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.847Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinition")
@software.amazon.jsii.Jsii.Proxy(Macie2ClassificationJobS3JobDefinition.Jsii$Proxy.class)
public interface Macie2ClassificationJobS3JobDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * bucket_criteria block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#bucket_criteria Macie2ClassificationJob#bucket_criteria}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria getBucketCriteria() {
        return null;
    }

    /**
     * bucket_definitions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#bucket_definitions Macie2ClassificationJob#bucket_definitions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBucketDefinitions() {
        return null;
    }

    /**
     * scoping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#scoping Macie2ClassificationJob#scoping}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScoping getScoping() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2ClassificationJobS3JobDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2ClassificationJobS3JobDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2ClassificationJobS3JobDefinition> {
        imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria bucketCriteria;
        java.lang.Object bucketDefinitions;
        imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScoping scoping;

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinition#getBucketCriteria}
         * @param bucketCriteria bucket_criteria block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#bucket_criteria Macie2ClassificationJob#bucket_criteria}
         * @return {@code this}
         */
        public Builder bucketCriteria(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria bucketCriteria) {
            this.bucketCriteria = bucketCriteria;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinition#getBucketDefinitions}
         * @param bucketDefinitions bucket_definitions block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#bucket_definitions Macie2ClassificationJob#bucket_definitions}
         * @return {@code this}
         */
        public Builder bucketDefinitions(com.hashicorp.cdktf.IResolvable bucketDefinitions) {
            this.bucketDefinitions = bucketDefinitions;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinition#getBucketDefinitions}
         * @param bucketDefinitions bucket_definitions block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#bucket_definitions Macie2ClassificationJob#bucket_definitions}
         * @return {@code this}
         */
        public Builder bucketDefinitions(java.util.List<? extends imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketDefinitions> bucketDefinitions) {
            this.bucketDefinitions = bucketDefinitions;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinition#getScoping}
         * @param scoping scoping block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#scoping Macie2ClassificationJob#scoping}
         * @return {@code this}
         */
        public Builder scoping(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScoping scoping) {
            this.scoping = scoping;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2ClassificationJobS3JobDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2ClassificationJobS3JobDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2ClassificationJobS3JobDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2ClassificationJobS3JobDefinition {
        private final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria bucketCriteria;
        private final java.lang.Object bucketDefinitions;
        private final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScoping scoping;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketCriteria = software.amazon.jsii.Kernel.get(this, "bucketCriteria", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria.class));
            this.bucketDefinitions = software.amazon.jsii.Kernel.get(this, "bucketDefinitions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scoping = software.amazon.jsii.Kernel.get(this, "scoping", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScoping.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketCriteria = builder.bucketCriteria;
            this.bucketDefinitions = builder.bucketDefinitions;
            this.scoping = builder.scoping;
        }

        @Override
        public final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteria getBucketCriteria() {
            return this.bucketCriteria;
        }

        @Override
        public final java.lang.Object getBucketDefinitions() {
            return this.bucketDefinitions;
        }

        @Override
        public final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScoping getScoping() {
            return this.scoping;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBucketCriteria() != null) {
                data.set("bucketCriteria", om.valueToTree(this.getBucketCriteria()));
            }
            if (this.getBucketDefinitions() != null) {
                data.set("bucketDefinitions", om.valueToTree(this.getBucketDefinitions()));
            }
            if (this.getScoping() != null) {
                data.set("scoping", om.valueToTree(this.getScoping()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2ClassificationJobS3JobDefinition.Jsii$Proxy that = (Macie2ClassificationJobS3JobDefinition.Jsii$Proxy) o;

            if (this.bucketCriteria != null ? !this.bucketCriteria.equals(that.bucketCriteria) : that.bucketCriteria != null) return false;
            if (this.bucketDefinitions != null ? !this.bucketDefinitions.equals(that.bucketDefinitions) : that.bucketDefinitions != null) return false;
            return this.scoping != null ? this.scoping.equals(that.scoping) : that.scoping == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketCriteria != null ? this.bucketCriteria.hashCode() : 0;
            result = 31 * result + (this.bucketDefinitions != null ? this.bucketDefinitions.hashCode() : 0);
            result = 31 * result + (this.scoping != null ? this.scoping.hashCode() : 0);
            return result;
        }
    }
}
