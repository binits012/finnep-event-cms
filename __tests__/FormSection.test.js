import { render, screen } from "@testing-library/react";
import FormSection from "@/components/FormSection";

describe("FormSection", () => {
  it("renders title correctly", () => {
    render(<FormSection title="Test Title" showSection={false} />);
    const test = screen.getByRole("button", { name: / title/i });
    expect(test).toBeInTheDocument();
  });
});
