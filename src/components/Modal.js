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
          <div className="content">
            <div>{children}</div>
          </div>
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
  }
  .box {
    display: flex;
    width: 80%;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
  .close {
    cursor: pointer;
    align-self: flex-end;
    margin-top: 20;
    color: black;
    transition: 0.5s ease-in-out;
    &:hover {
      color: red;
      transform: scale(1.5);
    }
  }
  .content {
    background-color: white;
    padding: 20px;
    opacity: 100%;
    border-radius: 10px;
    width: 100%;
    height: 90%;
    overflow-y: auto;
    border: 2px solid black;
    div {
      border: none;
    }
  }
  .content::-webkit-scrollbar {
    width: 10px; /* Width of the scrollbar */
  }

  .content::-webkit-scrollbar-track {
    background: #f1f1f1; /* Color of the track */
    border-radius: 5px; /* Roundness of the track */
  }

  .content::-webkit-scrollbar-thumb {
    background: #888; /* Color of the thumb */
    border-radius: 5px; /* Roundness of the thumb */
  }

  .content::-webkit-scrollbar-thumb:hover {
    background: #555; /* Color of the thumb on hover */
  }
`;
