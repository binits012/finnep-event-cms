"use client";
import InnerLayout from "@/components/InnerLayout";
import store from "@/store/store";
import { Provider } from "react-redux";
const layout = ({ children }) => {
  return (
    <Provider store={store}>
      <InnerLayout>{children}</InnerLayout>
    </Provider>
  );
};

export default layout;
