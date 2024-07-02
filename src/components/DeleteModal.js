import React from "react";
import styled from "styled-components";

const DeleteModal = ({ isVisible, onClose, children }) => {
  if (!isVisible) return null;
  const handleClose = (e) => {
    if (e.target.id === "modal") onClose();
  };
  return (
    <StyleModal>
      <div className="modal" id="modal" onClick={handleClose}>
        <div className="box">
          <div className="content">
            <div>{children}</div>
          </div>
        </div>
      </div>
    </StyleModal>
  );
};

export default DeleteModal;
const StyleModal = styled.div`
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(2px);
  }
  .box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 55%;
    height: auto;
    max-height: 80vh;
    padding: 20px;
    // background-color: white;
    border-radius: 10px;
    // box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .close {
    cursor: pointer;
    align-self: flex-end;
    margin-top: 20px;
    color: black;
    transition: 0.5s ease-in-out;
    &:hover {
      color: red;
      transform: scale(1.5);
    }
  }
  .content {
    width: 100%;
    height: 90%;
    background-color: white;
    overflow-y: auto;
    border: 2px solid black;
    padding: 20px;
    border-radius: 10px;
    div {
      border: none;
    }
  }
  .content::-webkit-scrollbar {
    width: 10px;
  }
  .content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
  }
  .content::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 5px;
  }
  .content::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  @media (max-width: 600px) {
    .box {
      width: 95%; // Adjusted for smaller screens
      max-height: 70vh; // Adjusted for smaller screens
    }
    .content {
      width: auto;
      height: auto;
      padding: 10px;
    }
    .close {
      margin-top: 10px;
    }
  }
`;
