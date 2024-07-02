import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddEvent from "@/components/forms/AddEvent";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { toast } from "react-toastify";

// Mock the necessary modules
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../src/RESTAPIs/events", () => ({
  addEvent: jest.fn(),
  updateEvent: jest.fn(),
}));

jest.mock("../src/RESTAPIs/helper", () => jest.fn());

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "test-event-id" }),
  useRouter: () => ({ push: jest.fn() }),
}));

// Render the AddEvent component wrapped with necessary providers
const renderComponent = (editMode = false) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AddEvent editMode={editMode} />
    </LocalizationProvider>
  );
};

describe("AddEvent Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders AddEvent component", () => {
    renderComponent();
    expect(screen.getByText(/Add New Event/i)).toBeInTheDocument();
  });

  test("renders EditEvent component", () => {
    renderComponent(true);
    expect(screen.getByText(/Edit Event/i)).toBeInTheDocument();
  });

  test("submits the form successfully", async () => {
    renderComponent();

    // Fill in the form fields
    fireEvent.change(screen.getByPlaceholderText(/Event Title/i), {
      target: { value: "Test Event" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Event Description/i), {
      target: { value: "This is a test event." },
    });
    fireEvent.change(screen.getByPlaceholderText(/Ticket Price/i), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Occupancy/i), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Address Details/i), {
      target: { value: "123 Test St." },
    });
    fireEvent.change(screen.getByPlaceholderText(/Geo Code/i), {
      target: { value: "12.34, 56.78" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Facebook Link/i), {
      target: { value: "http://facebook.com/test" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Instagram Link/i), {
      target: { value: "http://instagram.com/test" },
    });
    fireEvent.change(screen.getByPlaceholderText(/X \(Twitter\) Link/i), {
      target: { value: "http://twitter.com/test" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Transport Link/i), {
      target: { value: "http://transport.com/test" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Order of event/i), {
      target: { value: "1" },
    });

    // Mocking DateTimePicker interaction
    fireEvent.click(screen.getByLabelText(/Event Date\/ Time/i));
    // Assuming you're using a date/time picker library that allows you to set date directly
    fireEvent.change(screen.getByPlaceholderText(/mm\/dd\/yyyy, hh:mm/i), {
      target: { value: new Date() },
    });

    // Submit the form
    fireEvent.click(screen.getByText(/Add Event/i));

    // Assert the toast success message is called
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Event Added!!");
    });
  });

  test("shows error toast on submission failure", async () => {
    const { addEvent, updateEvent } = require("@/RESTAPIs/events");
    addEvent.mockRejectedValueOnce(new Error("Submission failed"));

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/Event Title/i), {
      target: { value: "Test Event" },
    });
    fireEvent.click(screen.getByText(/Add Event/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error creating event!!");
    });
  });
});
