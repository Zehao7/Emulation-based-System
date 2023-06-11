import React, { Component } from 'react';
import Modal from './modal';
import TriggerButton from './triggerButton';


export class Container extends Component {
  state = { isShown: false };
  showModal = () => {
    this.props.setVisible();
    this.setState({ isShown: true }, () => {
      this.closeButton.focus();
    });
    this.toggleScrollLock();
  };
  closeModal = () => {
    this.props.setInvisible();
    this.setState({ isShown: false });
    this.TriggerButton.focus();
    this.toggleScrollLock();
  };
  onClickOutside = (event) => {
    if (this.modal && this.modal.contains(event.target)) return;
    this.closeModal();
  };

  toggleScrollLock = () => {
    document.querySelector('html').classList.toggle('scroll-lock');
  };
  render() {
    return (
      <React.Fragment>
        <TriggerButton
          showModal={this.showModal}
          buttonRef={(n) => (this.TriggerButton = n)}
          triggerText={this.props.triggerText}
        />
        {this.props.visibility ? (
          <Modal
            Form={this.props.form}
            onSubmit={this.props.onSubmit}
            modalRef={(n) => (this.modal = n)}
            buttonRef={(n) => (this.closeButton = n)}
            closeModal={this.closeModal}
            onClickOutside={this.onClickOutside}
          />
        ) : null}
      </React.Fragment>
    );
  }
}

export default Container;
