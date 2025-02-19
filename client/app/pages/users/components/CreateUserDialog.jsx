import React, { useState, useEffect, useCallback } from "react";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Alert from "antd/lib/alert";

import i18next from "i18next";

import DynamicForm from "@/components/dynamic-form/DynamicForm";
import { wrap as wrapDialog, DialogPropType } from "@/components/DialogWrapper";
import recordEvent from "@/services/recordEvent";
import { useUniqueId } from "@/lib/hooks/useUniqueId";
import axios from "axios";

function CreateUserDialog({ dialog }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    recordEvent("view", "page", "users/new");

    axios
      .get("/api/groups")
      .then(response => {
        const groupOptions = response.data.map(group => ({ name: group.name, value: group.id }));
        setGroups(groupOptions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Dynamically update the form fields with the fetched groups
  const formFields = [
    { required: true, name: "name", title: "Name", type: "text", autoFocus: true },
    { required: true, name: "email", title: "Email", type: "email" },
    {
      required: true,
      name: "group_id",
      title: "Group",
      type: "select",
      options: groups, // Now it updates when groups change
    },
  ];

  const handleSubmit = useCallback(values => dialog.close(values).catch(setError), [dialog]);
  const formId = useUniqueId("userForm");

  return (
    <Modal
      {...dialog.props}
      title={i18next.t("Users:Create a New User")}
      footer={[
        <Button key="cancel" {...dialog.props.cancelButtonProps} onClick={dialog.dismiss}>
          {i18next.t("Cancel")}
        </Button>,
        <Button
          key="submit"
          {...dialog.props.okButtonProps}
          htmlType="submit"
          type="primary"
          form={formId}
          data-test="SaveUserButton">
          {i18next.t("Create")}
        </Button>,
      ]}
      wrapProps={{
        "data-test": "CreateUserDialog",
      }}>
      {!loading ? (
        <DynamicForm id={formId} fields={formFields} onSubmit={handleSubmit} hideSubmitButton />
      ) : (
        <p>Loading groups...</p>
      )}
      {error && <Alert message={error.message} type="error" showIcon data-test="CreateUserErrorAlert" />}
    </Modal>
  );
}

CreateUserDialog.propTypes = {
  dialog: DialogPropType.isRequired,
};

export default wrapDialog(CreateUserDialog);
