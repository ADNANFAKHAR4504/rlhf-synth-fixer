package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.850Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd")
@software.amazon.jsii.Jsii.Proxy(Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd.Jsii$Proxy.class)
public interface Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd extends software.amazon.jsii.JsiiSerializable {

    /**
     * simple_scope_term block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#simple_scope_term Macie2ClassificationJob#simple_scope_term}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTerm getSimpleScopeTerm() {
        return null;
    }

    /**
     * tag_scope_term block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tag_scope_term Macie2ClassificationJob#tag_scope_term}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTerm getTagScopeTerm() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd> {
        imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTerm simpleScopeTerm;
        imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTerm tagScopeTerm;

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd#getSimpleScopeTerm}
         * @param simpleScopeTerm simple_scope_term block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#simple_scope_term Macie2ClassificationJob#simple_scope_term}
         * @return {@code this}
         */
        public Builder simpleScopeTerm(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTerm simpleScopeTerm) {
            this.simpleScopeTerm = simpleScopeTerm;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd#getTagScopeTerm}
         * @param tagScopeTerm tag_scope_term block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tag_scope_term Macie2ClassificationJob#tag_scope_term}
         * @return {@code this}
         */
        public Builder tagScopeTerm(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTerm tagScopeTerm) {
            this.tagScopeTerm = tagScopeTerm;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd {
        private final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTerm simpleScopeTerm;
        private final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTerm tagScopeTerm;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.simpleScopeTerm = software.amazon.jsii.Kernel.get(this, "simpleScopeTerm", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTerm.class));
            this.tagScopeTerm = software.amazon.jsii.Kernel.get(this, "tagScopeTerm", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTerm.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.simpleScopeTerm = builder.simpleScopeTerm;
            this.tagScopeTerm = builder.tagScopeTerm;
        }

        @Override
        public final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndSimpleScopeTerm getSimpleScopeTerm() {
            return this.simpleScopeTerm;
        }

        @Override
        public final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingIncludesAndTagScopeTerm getTagScopeTerm() {
            return this.tagScopeTerm;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSimpleScopeTerm() != null) {
                data.set("simpleScopeTerm", om.valueToTree(this.getSimpleScopeTerm()));
            }
            if (this.getTagScopeTerm() != null) {
                data.set("tagScopeTerm", om.valueToTree(this.getTagScopeTerm()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd.Jsii$Proxy that = (Macie2ClassificationJobS3JobDefinitionScopingIncludesAnd.Jsii$Proxy) o;

            if (this.simpleScopeTerm != null ? !this.simpleScopeTerm.equals(that.simpleScopeTerm) : that.simpleScopeTerm != null) return false;
            return this.tagScopeTerm != null ? this.tagScopeTerm.equals(that.tagScopeTerm) : that.tagScopeTerm == null;
        }

        @Override
        public final int hashCode() {
            int result = this.simpleScopeTerm != null ? this.simpleScopeTerm.hashCode() : 0;
            result = 31 * result + (this.tagScopeTerm != null ? this.tagScopeTerm.hashCode() : 0);
            return result;
        }
    }
}
