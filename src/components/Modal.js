import React from "react";
import { IoClose } from "react-icons/io5";
import styled from "styled-components";

const Modal = ({ isVisible, onClose, children }) => {
  if (!isVisible) return null;
  const handleClose = (e) => {
    if (e.target.id === "modal") onClose();
  };
  return (
    <StyleModal>
      <div className="modal" id="modal" onClick={handleClose}>
        <div className="box">
          <IoClose size={24} className="close" onClick={onClose} />
          <div className="content">{children}</div>
        </div>
      </div>
    </StyleModal>
  );
};

export default Modal;
const StyleModal = styled.div`
  .modal {
    position: fixed;
    inset: 0;
    background-color: transparent;
    backdrop-filter: blur(2px);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .box {
    display: flex;
    width: 80%;
    height: 100%;
    opacity: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
  }
  .close {
    cursor: pointer;
    align-self: flex-end;
    width: 100%;
    color: red;
  }
  .content {
    background-color: white;
    padding: 20px;
    opacity: 100%;
    border-radius: 10px;
    width: 100%;
    height: 90%;
    overflow-y: auto;
  }
`;
