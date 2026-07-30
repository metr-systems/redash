import { get, find, toUpper } from "lodash";
import React from "react";
import PropTypes from "prop-types";

import Modal from "antd/lib/modal";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import navigateTo from "@/components/ApplicationArea/navigateTo";
import EditInPlace from "@/components/EditInPlace";
import LoadingState from "@/components/items-list/components/LoadingState";
import DynamicForm from "@/components/dynamic-form/DynamicForm";
import helper from "@/components/dynamic-form/dynamicFormHelper";
import HelpTrigger, { TYPES as HELP_TRIGGER_TYPES } from "@/components/HelpTrigger";
import wrapSettingsTab from "@/components/SettingsWrapper";

import { axios } from "@/services/axios";
import DataSource, { IMG_ROOT } from "@/services/data-source";
import notification from "@/services/notification";
import recordEvent from "@/services/recordEvent";
import routes from "@/services/routes";

import i18next from "i18next";

class EditDataSource extends React.Component {
  static propTypes = {
    dataSourceId: PropTypes.string.isRequired,
    onError: PropTypes.func,
  };

  static defaultProps = {
    onError: () => {},
  };

  state = {
    dataSource: null,
    type: null,
    loading: true,
  };

  componentDidMount() {
    DataSource.get({ id: this.props.dataSourceId })
      .then((dataSource) => {
        const { type } = dataSource;
        this.setState({ dataSource });
        DataSource.types().then((types) => this.setState({ type: find(types, { type }), loading: false }));
      })
      .catch((error) => this.props.onError(error));
  }

  saveDataSource = (values, successCallback, errorCallback) => {
    const { dataSource } = this.state;
    helper.updateTargetWithValues(dataSource, values);
    DataSource.save(dataSource)
      .then(() => successCallback("Saved."))
      .catch((error) => {
        const message = get(error, "response.data.message", "Failed saving.");
        errorCallback(message);
      });
  };

  // Mirrors useUpdateQueryIdentifier: validate first, only then save. Written as
  // a method rather than a hook because this page is a class component.
  updateDataSourceIdentifier = async (dataSourceIdentifier) => {
    const { dataSource } = this.state;
    recordEvent("edit_data_source_identifier", "datasource", dataSource.id);

    // skip validation if empty value
    if (dataSourceIdentifier) {
      try {
        const response = await axios.post(`api/data_sources/${dataSource.id}/data_source_identifier/validate`, {
          data_source_identifier: dataSourceIdentifier,
        });
        if (!response.valid) {
          if (response.errors) {
            response.errors.forEach((error) => notification.error(error));
          }
          return;
        }
      } catch (error) {
        notification.error(i18next.t("DataSources:Failed to validate data source identifier"));
        return;
      }
    }

    try {
      const saved = await DataSource.save({ ...dataSource, data_source_identifier: dataSourceIdentifier });
      // Merge rather than replace: the POST response has no view_only, which the
      // GET that populated this page does provide.
      this.setState({ dataSource: { ...dataSource, ...saved } });
    } catch (error) {
      notification.error(get(error, "response.data.message", "Failed saving."));
    }
  };

  deleteDataSource = (callback) => {
    const { dataSource } = this.state;

    const doDelete = () => {
      DataSource.delete(dataSource)
        .then(() => {
          notification.success("Data source deleted successfully.");
          navigateTo("data_sources");
        })
        .catch(() => {
          callback();
        });
    };

    Modal.confirm({
      title: i18next.t("DataSources:Delete Data Source"),
      content: i18next.t("DataSources:Are you sure you want to delete this data source?"),
      okText: i18next.t("Delete"),
      okType: "danger",
      onOk: doDelete,
      onCancel: callback,
      maskClosable: true,
      autoFocusButton: null,
    });
  };

  testConnection = (callback) => {
    const { dataSource } = this.state;
    DataSource.test({ id: dataSource.id })
      .then((httpResponse) => {
        if (httpResponse.ok) {
          notification.success("Success");
        } else {
          notification.error("Connection Test Failed:", httpResponse.message, { duration: 10 });
        }
        callback();
      })
      .catch(() => {
        notification.error(
          "Connection Test Failed:",
          "Unknown error occurred while performing connection test. Please try again later.",
          { duration: 10 }
        );
        callback();
      });
  };

  renderForm() {
    const { dataSource, type } = this.state;
    const fields = helper.getFields(type, dataSource);
    const helpTriggerType = `DS_${toUpper(type.type)}`;
    const formProps = {
      fields,
      type,
      actions: [
        { name: "Delete", type: "danger", callback: this.deleteDataSource },
        { name: "Test Connection", pullRight: true, callback: this.testConnection, disableWhenDirty: true },
      ],
      onSubmit: this.saveDataSource,
      feedbackIcons: true,
      defaultShowExtraFields: helper.hasFilledExtraField(type, dataSource),
    };

    return (
      <div className="row" data-test="DataSource">
        <div className="text-right m-r-10">
          {HELP_TRIGGER_TYPES[helpTriggerType] && (
            <HelpTrigger className="f-13" type={helpTriggerType}>
              {i18next.t("DataSources:Setup Instructions")} <i className="fa fa-question-circle" aria-hidden="true" />
              <span className="sr-only">{"(" + i18next.t("help") + ")"}</span>
            </HelpTrigger>
          )}
        </div>
        <div className="text-center m-b-10">
          <img className="p-5" src={`${IMG_ROOT}/${type.type}.png`} alt={type.name} width="64" />
          <h3 className="m-0">{type.name}</h3>
          <div className="data-source-identifier">
            <span className="data-source-identifier-label">{i18next.t("DataSources:Identifier:")}</span>{" "}
            <EditInPlace
              isEditable={!dataSource.data_source_identifier}
              onDone={this.updateDataSourceIdentifier}
              value={dataSource.data_source_identifier || ""}
              placeholder={i18next.t("DataSources:Set data source identifier")}
            />
          </div>
        </div>
        <div className="col-md-4 col-md-offset-4 m-b-10">
          <DynamicForm {...formProps} />
        </div>
      </div>
    );
  }

  render() {
    return this.state.loading ? <LoadingState className="" /> : this.renderForm();
  }
}

const EditDataSourcePage = wrapSettingsTab("DataSources.Edit", null, EditDataSource);

routes.register(
  "DataSources.Edit",
  routeWithUserSession({
    path: "/data_sources/:dataSourceId",
    title: i18next.t("DataSources:Data Sources"),
    render: (pageProps) => <EditDataSourcePage {...pageProps} />,
  })
);
