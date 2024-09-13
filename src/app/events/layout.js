"use client";
import InnerLayout from "@/components/InnerLayout";
import store from "@/store/store";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
const layout = ({ children }) => {
  return (
    <Provider store={store}>
      <Toaster position="top-right" reverseOrder={false} />
      <InnerLayout>{children}</InnerLayout>
    </Provider>
  );
};

export default layout;
