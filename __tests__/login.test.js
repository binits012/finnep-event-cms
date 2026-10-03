import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import Login from "@/components/Login";
import configureStore from "redux-mock-store";
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const mockStore = configureStore([]);
describe("renders button on home page", () => {
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

  //   const { getByText } =
});
