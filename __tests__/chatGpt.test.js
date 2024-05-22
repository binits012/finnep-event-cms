import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { useRouter } from "next/router";
import Login from "@/components/Login";
import Dashboard from "@/app";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";

jest.mock("axios");

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));
const mockStore = configureStore([]);

describe("Login Flow", () => {
  it("renders button on home page", () => {
    const store = mockStore({});
    render(
      <Provider store={store}>
        <Login />
      </Provider>
    );
    const buttonElement = screen.getByRole("button", { name: /Login/i });
    expect(buttonElement).toBeInTheDocument();
  });

  const mockPush = jest.fn();
  const handleLogin = jest.fn((data) => {
    if (
      data.username === "yellowBridge" &&
      data.password === "yellowBridge2024#"
    ) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  });

  beforeEach(() => {
    useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render login form and submit successfully", async () => {
    const store = mockStore({});
    render(
      <Provider store={store}>
        <Login onLogin={handleLogin} />
      </Provider>
    );

    // Verify initial render
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();

    // Simulate user input
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "yellowBridge" },
    });
    expect(screen.getByLabelText(/Username/i).value).toBe("yellowBridge");

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "yellowBridge2024#" },
    });

    const buttonElement = screen.getByRole("button", { name: /Login/i });
    expect(buttonElement).toBeInTheDocument();

    // Simulate form submission
    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    // Verify handleLogin was called with correct values
    // expect(handleLogin).toHaveBeenCalledWith({
    //   username: "yellowBridge",
    //   password: "yellowBridge2024#",
    // });

    // Wait for async actions
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith({
        method: "POST",
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        url: "auth/user/login",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          username: "yellowBridge",
          password: "yellowBridge2024#",
        },
      });

      // Verify localStorage updates
      expect(localStorage.getItem("auth")).toBe(
        JSON.stringify(mockResponse.data)
      );
      expect(localStorage.getItem("accessToken")).toBe(mockResponse.data.token);
      expect(localStorage.getItem("stamp")).toBe(moment().toISOString());
    });
    // // Wait for navigation
    // await waitFor(() => {
    //   expect(mockPush).toHaveBeenCalledWith("/dashboard");
    // });
  });

  //   it("should render dashboard with sidebar after login", async () => {
  //     render(<Dashboard />);

  //     // Verify dashboard and sidebar are rendered
  //     expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  //     expect(screen.getByText(/sidebar/i)).toBeInTheDocument();
  //   });
});
