import { render, screen } from "@testing-library/react";
import Home from "../src/app/page";
import "@testing-library/jest-dom";

describe("Home Page", () => {
  //   it("renders a heading", () => {
  //     render(<Home />);

  //     const heading = screen.getByRole("heading", {
  //       name: /welcome to next\.js!/i,
  //     });

  //     expect(heading).toBeInTheDocument();
  //   });

  it("renders the description text", () => {
    render(<Home />);

    const description = screen.getByText(
      /Enter your email and password to login/i
    );

    expect(description).toBeInTheDocument();
  });
});
