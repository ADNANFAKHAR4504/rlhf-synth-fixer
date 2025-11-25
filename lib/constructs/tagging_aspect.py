from cdktf import IAspect
from constructs import IConstruct
from typing import Dict


class TaggingAspect(IAspect):
    """
    CDKTF aspect to enforce tagging standards across all resources.
    Automatically applies cost allocation and FinOps tags.
    """

    def __init__(self, tags: Dict[str, str]):
        self.tags = tags

    def visit(self, node: IConstruct) -> None:
        """
        Visit each construct and apply tags if it supports tagging.
        """
        # Check if the construct has a tags attribute
        if hasattr(node, 'tags') and isinstance(node.tags, dict):
            # Apply all tags
            for key, value in self.tags.items():
                if key not in node.tags:
                    node.tags[key] = value
        elif hasattr(node, 'tags_input') and isinstance(node.tags_input, dict):
            # Some resources use tags_input
            for key, value in self.tags.items():
                if key not in node.tags_input:
                    node.tags_input[key] = value
