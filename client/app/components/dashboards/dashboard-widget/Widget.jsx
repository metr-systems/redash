import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { isEmpty, isEqual, map } from "lodash";
import Dropdown from "antd/lib/dropdown";
import Modal from "antd/lib/modal";
import Menu from "antd/lib/menu";
import recordEvent from "@/services/recordEvent";
import { Moment } from "@/components/proptypes";
import PlainButton from "@/components/PlainButton";
import { WidgetTagsControl } from "@/components/tags-control/TagsControl";
import getTags from "@/services/getTags";
import "./Widget.less";

function WidgetDropdownButton({ extraOptions, showDeleteOption, onDelete }) {
  const WidgetMenu = (
    <Menu data-test="WidgetDropdownButtonMenu">
      {extraOptions}
      {showDeleteOption && extraOptions && <Menu.Divider />}
      {showDeleteOption && <Menu.Item onClick={onDelete}>Remove from Dashboard</Menu.Item>}
    </Menu>
  );

  return (
    <div className="widget-menu-regular">
      <Dropdown overlay={WidgetMenu} placement="bottomRight" trigger={["click"]}>
        <PlainButton className="action p-l-15 p-r-15" data-test="WidgetDropdownButton" aria-label="More options">
          <i className="zmdi zmdi-more-vert" aria-hidden="true" />
        </PlainButton>
      </Dropdown>
    </div>
  );
}

WidgetDropdownButton.propTypes = {
  extraOptions: PropTypes.node,
  showDeleteOption: PropTypes.bool,
  onDelete: PropTypes.func,
};

WidgetDropdownButton.defaultProps = {
  extraOptions: null,
  showDeleteOption: false,
  onDelete: () => {},
};

function WidgetDeleteButton({ onClick }) {
  return (
    <div className="widget-menu-remove">
      <PlainButton
        className="action"
        title="Remove From Dashboard"
        onClick={onClick}
        data-test="WidgetDeleteButton"
        aria-label="Close">
        <i className="zmdi zmdi-close" aria-hidden="true" />
      </PlainButton>
    </div>
  );
}

WidgetDeleteButton.propTypes = { onClick: PropTypes.func };
WidgetDeleteButton.defaultProps = { onClick: () => {} };

class Widget extends React.Component {
  static propTypes = {
    widget: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    className: PropTypes.string,
    children: PropTypes.node,
    header: PropTypes.node,
    footer: PropTypes.node,
    canEdit: PropTypes.bool,
    isPublic: PropTypes.bool,
    refreshStartedAt: Moment,
    menuOptions: PropTypes.node,
    tileProps: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    onDelete: PropTypes.func,
  };

  static defaultProps = {
    className: "",
    children: null,
    header: null,
    footer: null,
    canEdit: false,
    isPublic: false,
    refreshStartedAt: null,
    menuOptions: null,
    tileProps: {},
    onDelete: () => {},
  };

  constructor(props) {
    super(props);
    this.state = { tags: props.widget.tags };
  }

  componentDidMount() {
    const { widget } = this.props;
    recordEvent("view", "widget", widget.id);
  }


  handleUpdateTags = (newTags) => {
    const { widget } = this.props;
    const { tags: currentTags } = this.state;
    const id = widget.id;

    // Check if the new tags are different from the current tags
    // then update the tags and save the widget in backend
    if (!isEqual(newTags, currentTags)) {
      widget.save_tags(newTags);
      widget.tags = newTags;
      this.setState({ tags: newTags }); 
    }
  };
  
  deleteWidget = () => {
    const { widget, onDelete } = this.props;

    Modal.confirm({
      title: "Delete Widget",
      content: "Are you sure you want to remove this widget from the dashboard?",
      okText: "Delete",
      okType: "danger",
      onOk: () => widget.delete().then(onDelete),
      maskClosable: true,
      autoFocusButton: null,
    });
  };


  render() {
    const { tags } = this.state;
    const { className, children, header, footer, canEdit, isEditing, isPublic, menuOptions, tileProps } = this.props;
    const showDropdownButton = !isPublic && (canEdit || !isEmpty(menuOptions));
    return (
      <div className="widget-wrapper">
        <div className={cx("tile body-container", className)} {...tileProps}>
          <div className="widget-actions">
            {showDropdownButton && (
              <WidgetDropdownButton
                extraOptions={menuOptions}
                showDeleteOption={canEdit}
                onDelete={this.deleteWidget}
              />
            )}
            {canEdit && <WidgetDeleteButton onClick={this.deleteWidget} />}
          </div>
          <div className="body-row widget-header">{header}</div>
          {children}
          {canEdit && isEditing && <WidgetTagsControl
            className="d-block"
            tags={tags}
            canEdit={canEdit && isEditing}
            getAvailableTags={tags}
            onEdit={tags => this.handleUpdateTags(tags)}
            tagsExtra={null}
          />}
          {footer && <div className="body-row tile__bottom-control">{footer}</div>}
        </div>
      </div>
    );
  }
}

export default Widget;
