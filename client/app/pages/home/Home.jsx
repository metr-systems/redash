import { includes } from "lodash";
import React, { useEffect } from "react";

import Alert from "antd/lib/alert";

import { Trans, useTranslation } from "react-i18next";

import Link from "@/components/Link";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import EmptyState, { EmptyStateHelpMessage } from "@/components/empty-state/EmptyState";
import DynamicComponent from "@/components/DynamicComponent";
import PlainButton from "@/components/PlainButton";

import { axios } from "@/services/axios";
import recordEvent from "@/services/recordEvent";
import { messages } from "@/services/auth";
import notification from "@/services/notification";
import routes from "@/services/routes";

import { DashboardAndQueryFavoritesList } from "./components/FavoritesList";

import "./Home.less";

function DeprecatedEmbedFeatureAlert() {
  const { t } = useTranslation("Home");
  return (
    <Alert
      className="m-b-15"
      type="warning"
      message={
        <>
          <Trans i18nKey="deprecated_embed_feature_alert">
            You have enabled <code>ALLOW_PARAMETERS_IN_EMBEDS</code>. This setting is now deprecated and should be
            turned off. Parameters in embeds are supported by default.
          </Trans>{" "}
          <Link
            href="https://discuss.redash.io/t/support-for-parameters-in-embedded-visualizations/3337"
            target="_blank"
            rel="noopener noreferrer">
            {t("Read more")}
          </Link>
          .
        </>
      }
    />
  );
}

function EmailNotVerifiedAlert() {
  const { t } = useTranslation("Home");
  const verifyEmail = () => {
    axios.post("verification_email/").then(data => {
      notification.success(data.message);
    });
  };

  return (
    <Alert
      className="m-b-15"
      type="warning"
      message={
        <>
          <Trans i18nKey="email_not_verified_alert">
            We have sent an email with a confirmation link to your email address. Please follow the link to verify your
            email address.
          </Trans>{" "}
          <PlainButton type="link" onClick={verifyEmail}>
            {t("Resend email")}
          </PlainButton>
          .
        </>
      }
    />
  );
}

export default function Home() {
  const { t } = useTranslation("Home");
  useEffect(() => {
    recordEvent("view", "page", "personal_homepage");
  }, []);

  return (
    <div className="home-page">
      <div className="container">
        {includes(messages, "using-deprecated-embed-feature") && <DeprecatedEmbedFeatureAlert />}
        {includes(messages, "email-not-verified") && <EmailNotVerifiedAlert />}
        <DynamicComponent name="Home.EmptyState">
          <EmptyState
            header={t("Welcome to Redash 👋")}
            description={t("Connect to any data source, easily visualize and share your data")}
            illustration="dashboard"
            helpMessage={<EmptyStateHelpMessage helpTriggerType="GETTING_STARTED" />}
            showDashboardStep
            showInviteStep
            onboardingMode
          />
        </DynamicComponent>
        <DynamicComponent name="HomeExtra" />
        <DashboardAndQueryFavoritesList />
      </div>
    </div>
  );
}

routes.register(
  "Home",
  routeWithUserSession({
    path: "/",
    title: "Redash",
    render: pageProps => <Home {...pageProps} />,
  })
);
