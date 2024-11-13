import React from "react";
import PropTypes from "prop-types";

import { useTranslation } from "react-i18next";

import BigMessage from "@/components/BigMessage";
import { TagsControl } from "@/components/tags-control/TagsControl";

export default function NoTaggedObjectsFound({ objectType, tags }) {
  const { t } = useTranslation();
  return (
    <BigMessage icon="fa-tags">
      {t("Tags:No {{objectType}} found tagged with&nbsp;",{objectType})}
      <TagsControl className="inline-tags-control" tags={Array.from(tags)} tagSeparator={"+"} />.
    </BigMessage>
  );
}

NoTaggedObjectsFound.propTypes = {
  objectType: PropTypes.string.isRequired,
  tags: PropTypes.oneOfType([PropTypes.array, PropTypes.objectOf(Set)]).isRequired,
};
