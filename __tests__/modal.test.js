import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Modal from "@/components/Modal";
import moment from "moment";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import styled from "styled-components";

const mockStore = configureStore([]);
const Styled = styled.div`
  .content {
    display: flex;
    flex-direction: row;
    padding: 20px;
    /* border: none; */
  }
  .info {
    padding-left: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
    h1 {
      align-self: center;
      font-size: 45px;
      margin-bottom: 20px;
      font-weight: bolder;
      justify-content: center;
      text-decoration: underline;
    }
    .description {
      font-size: 16px;
      margin-bottom: 5px;
      font-weight: bolder;
      display: flex;
      flex-direction: column;
      span {
        margin-top: 5px;
        border-radius: 5px;
        border: 1px solid #4c4c4c;
        padding: 5px;
        font-weight: normal;
      }
    }
    .date-time {
      display: flex;
      justify-content: flex-start;
      flex-direction: row;
      margin-bottom: 20px;
      margin-top: 10px;
      .time {
        display: flex;
        flex-direction: column;
        padding-right: 20px;
      }
      .date {
        display: flex;
        flex-direction: column;
        padding-left: 20px;
      }
      p {
        font-weight: bolder;
        padding: 5px;
      }
      span {
        margin-top: 5px;
        border-radius: 5px;
        border: 1px solid #4c4c4c;
        padding: 5px;
      }
    }
    .price-ocupancy {
      display: flex;
      justify-content: flex-start;
      flex-direction: row;
      margin-bottom: 20px;
      margin-top: 10px;
      .price {
        display: flex;
        flex-direction: column;
        padding-right: 20px;
      }
      .occupancy {
        display: flex;
        flex-direction: column;
        padding-left: 20px;
      }
      p {
        font-weight: bolder;
        padding: 5px;
      }
      span {
        margin-top: 5px;
        border-radius: 5px;
        border: 1px solid #4c4c4c;
        padding: 5px;
        font-weight: normal;
      }
    }
    .address-loaction {
      display: flex;
      justify-content: flex-start;
      flex-direction: row;
      margin-bottom: 20px;
      margin-top: 10px;
      .address {
        display: flex;
        flex-direction: column;
        padding-right: 20px;
      }
      .location {
        display: flex;
        flex-direction: column;
        padding-left: 20px;
      }
      p {
        font-weight: bolder;
        padding: 5px;
      }
      span {
        margin-top: 5px;
        border-radius: 5px;
        border: 1px solid #4c4c4c;
        padding: 5px;
        font-weight: normal;
      }
    }
  }
`;

describe("Modal Component", () => {
  const selectedEvent = {
    eventPromotionPhoto: "http://example.com/photo.jpg",
    eventTitle: "Sample Event",
    eventDescription: "This is a sample event description.",
    eventTime: "10:00 AM",
    eventDate: "2023-05-20T00:00:00Z",
    eventPrice: { $numberDecimal: "15.99" },
    occupancy: 100,
    eventLocationAddress: "123 Main St, Anytown, USA",
    eventLocationGeoCode: "40.712776, -74.005974",
  };

  it("should display the correct values when the modal is visible", () => {
    const store = mockStore({});

    render(
      <Provider store={store}>
        <Modal isVisible={true} onClose={() => {}}>
          <Styled>
            <div className="content">
              <div className="img">
                <img
                  src={selectedEvent.eventPromotionPhoto}
                  alt={selectedEvent.eventTitle}
                  width={500}
                  height={600}
                />
              </div>
              <div className="info">
                <h1>{selectedEvent.eventTitle}</h1>
                <p className="description">
                  Description <span>{selectedEvent.eventDescription}</span>
                </p>
                <div className="date-time">
                  <p className="time">
                    Time <span>{selectedEvent.eventTime}</span>
                  </p>
                  <p className="date">
                    Date
                    <span>
                      {moment(selectedEvent.eventDate).format("MMM DD YYYY")}
                    </span>
                  </p>
                </div>
                <div className="price-ocupancy">
                  <p className="price">
                    Price
                    <span>${selectedEvent.eventPrice["$numberDecimal"]} </span>
                  </p>
                  <p className="occupancy">
                    Occupancy <span>{selectedEvent.occupancy}</span>
                  </p>
                </div>
                <div className="address-loaction">
                  <p className="address">
                    Address
                    <span>{selectedEvent.eventLocationAddress}</span>
                  </p>
                  <p className="location">
                    Location <span>{selectedEvent.eventLocationGeoCode}</span>
                  </p>
                </div>
              </div>
            </div>
          </Styled>
        </Modal>
      </Provider>
    );

    // Verify the modal content
    expect(screen.getByAltText("Sample Event")).toHaveAttribute(
      "src",
      "http://example.com/photo.jpg"
    );
    expect(screen.getByText("Sample Event")).toBeInTheDocument();
    expect(
      screen.getByText("This is a sample event description.")
    ).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();
    expect(screen.getByText("May 20 2023")).toBeInTheDocument();
    expect(screen.getByText("$15.99")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("123 Main St, Anytown, USA")).toBeInTheDocument();
    expect(screen.getByText("40.712776, -74.005974")).toBeInTheDocument();
  });
});
