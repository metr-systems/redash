import React from "react";

import { useTranslation, Trans } from "react-i18next";

import { UserProfile } from "@/components/proptypes";
import UserGroups from "@/components/UserGroups";

import useUserGroups from "../hooks/useUserGroups";

export default function ReadOnlyUserProfile({ user }) {
  const { t } = useTranslation("Users");
  const { groups, isLoading: isLoadingGroups } = useUserGroups(user);

  return (
    <div className="col-md-4 col-md-offset-4 profile__container">
      <img alt="profile" src={user.profileImageUrl} className="profile__image" width="40" />
      <h3 className="profile__h3">{user.name}</h3>
      <hr />
      <dl className="profile__dl">
        <dt>
          <Trans i18nKey="Users:Name_">Name:</Trans>
        </dt>
        <dd>{user.name}</dd>
        <dt>
          <Trans i18nKey="Users:Email_">Email:</Trans>
        </dt>
        <dd>{user.email}</dd>
        <dt className="m-b-5">
          <Trans i18nKey="Users:Groups_">Groups:</Trans>
        </dt>
        <dd>{isLoadingGroups ? t("Loading...") : <UserGroups groups={groups} />}</dd>
      </dl>
    </div>
  );
}

ReadOnlyUserProfile.propTypes = {
  user: UserProfile.isRequired,
};
