import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { usePathname } from "next/navigation";
import SideBar from "@/components/dashboard/SideBar/SideBar";

// Mock the usePathname hook
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("SideBar Component", () => {
  beforeEach(() => {
    // Default mock implementation for usePathname
    usePathname.mockReturnValue("/dashboard");
  });

  it("renders the sidebar correctly", () => {
    render(<SideBar />);

    // Check if the sidebar and user section are rendered
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();

    // Check if all menu items are rendered
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Front Page Details")).toBeInTheDocument();
    expect(screen.getByText("Event")).toBeInTheDocument();
    expect(screen.getByText("Tickets")).toBeInTheDocument();
    expect(screen.getByText("Gallery")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("applies active class based on pathname", () => {
    usePathname.mockReturnValue("/events");
    render(<SideBar />);

    // Check if the "Event" item has the active class
    const eventItem = screen.getByText("Event").closest(".item-container");
    expect(eventItem).toHaveClass("active");

    // Other items should not have the active class
    const dashboardItem = screen
      .getByText("Dashboard")
      .closest(".item-container");
    expect(dashboardItem).not.toHaveClass("active");
  });
});
