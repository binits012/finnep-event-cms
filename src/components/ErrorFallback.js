"use client";
import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  background-color: #f8d7da;
  color: #721c24;
  padding: 20px;
  box-sizing: border-box;

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  p {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
  button {
    background-color: #f8d7da;
    color: #721c24;
    border: none;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    &:hover {
      background-color: #721c24;
      color: #f8d7da;
    }
  }
`;

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <Wrapper>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Home</button>
    </Wrapper>
  );
};

export default ErrorFallback;
