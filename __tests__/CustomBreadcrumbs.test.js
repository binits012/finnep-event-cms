import { render, screen } from "@testing-library/react";
import CustomBreadcrumbs from "../src/components/CustomBreadcrumbs";

describe("CustomBreadcrumbs", () => {
  it("renders a heading", () => {
    render(<CustomBreadcrumbs />);
    const heading = screen.getAllByDisplayValue("heading", {
      name: /custom breadcrumbs/i,
    });
    expect(heading).toBeInTheDocument();
  });
});
