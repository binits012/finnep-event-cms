"use client";
import React, { useEffect } from "react";
import apiHandler from "@/RESTAPIs/helper";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import FormSection from "@/components/FormSection";
import { Button, FormLabel, Grid, TextField } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import { useFormik } from "formik";
import * as Yup from "yup";

// Yup schema to validate the form
const schema = Yup.object().shape({
  name: Yup.string().required(),
  emailAddress: Yup.string().required().email(),
  phoneNumber: Yup.number().required().min(10),
});
const page = () => {
  const [show, setShow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [users, setUsers] = useState([]);
  const handleSubmit = async (values) => {
    try {
      const res = await apiHandler(
        "POST",
        "auth/user/changePassword",
        true,
        false,
        {
          ...values,
          username: values.username,
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }
      );
      console.log(res, "check res");
      toast.success("Password Changed!!");
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    }
  };

  const formik = useFormik({
    initialValues: {
      username: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: (values) => handleSubmit(values),
  });

  // const getContact = async () => {
  //   try {
  //     const res = await apiHandler(
  //       "GET",
  //       `user/${users.id}/contact`,
  //       true,
  //       false
  //     );
  //     setUsers(res.data.data || []);
  //     console.log(res, "check res");
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  const createContact = async () => {
    try {
      const res = await apiHandler(
        "POST",
        `user/${users.id}/contact`,
        true,
        false
      );
      console.log(res, "check res");
    } catch (err) {
      console.log(err);
    }
  };

  const contactFormik = useFormik({
    initialValues: {
      streetName: "",
      emailAddress: "",
      phoneNumber: "",
    },
    validationSchema: schema,
    onSubmit: (values) => {
      // console.log(values);
      createContact(values);
    },
  });
  console.log(contactFormik.values, "valuesss");

  return (
    <>
      <form>
        <FormSection title="Change Password" showSection>
          <Grid container spacing={2} direction={"column"}>
            {/* <Grid item container md={5} direction={"column"}>
              <FormLabel htmlFor="oldPassword" className="label">
                User
              </FormLabel>
              <TextField
                id="username"
                name="username"
                value={formik.values.username}
                placeholder="User Name"
                disabled
                type="text"
                // InputProps={{
                //   endAdornment: !!show ? (
                //     <VisibilityOffIcon
                //       onClick={() => {
                //         setShow(false);
                //       }}
                //       size={12}
                //       style={{ cursor: "pointer" }}
                //     />
                //   ) : (
                //     <VisibilityIcon
                //       size={12}
                //       onClick={() => {
                //         setShow(true);
                //       }}
                //       style={{ cursor: "pointer" }}
                //     />
                //   ),
                // }}
              />
            </Grid> */}
            <Grid item container md={5} direction={"column"}>
              <FormLabel htmlFor="oldPassword" className="label">
                Old Password
              </FormLabel>
              <TextField
                id="oldPassword"
                name="oldPassword"
                value={formik.values.oldPassword}
                onChange={formik.handleChange}
                placeholder="Old Password"
                type={!!show ? "text" : "password"}
                InputProps={{
                  endAdornment: !!show ? (
                    <VisibilityOffIcon
                      onClick={() => {
                        setShow(false);
                      }}
                      size={12}
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <VisibilityIcon
                      size={12}
                      onClick={() => {
                        setShow(true);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  ),
                }}
              />
            </Grid>
            <Grid item container md={15} direction={"column"}>
              <FormLabel htmlFor="newPassword" className="label">
                New Password
              </FormLabel>
              <TextField
                id="newPassword"
                name="newPassword"
                placeholder="New Password"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                fullWidth
                type={!!showPassword ? "text" : "password"}
                InputProps={{
                  endAdornment: !!showPassword ? (
                    <VisibilityOffIcon
                      onClick={() => {
                        setShowPassword(false);
                      }}
                      size={12}
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <VisibilityIcon
                      size={12}
                      onClick={() => {
                        setShowPassword(true);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  ),
                }}
              />
            </Grid>
            <Grid item container md={15} direction={"column"}>
              <FormLabel htmlFor="newPassword" className="label">
                Confirm Password
              </FormLabel>
              <TextField
                id="newPassword"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                // value={setOldPassword}
                fullWidth
                type={!!showPassword ? "text" : "password"}
                InputProps={{
                  endAdornment: !!showPassword ? (
                    <VisibilityOffIcon
                      onClick={() => {
                        setShowPassword(false);
                      }}
                      size={12}
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <VisibilityIcon
                      size={12}
                      onClick={() => {
                        setShowPassword(true);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  ),
                }}
              />
            </Grid>
          </Grid>
          <Grid container justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              type="button"
              onClick={formik.handleSubmit}>
              Change Password
            </Button>
          </Grid>
        </FormSection>
      </form>
      <form>
        <FormSection title="Contact Details" showSection>
          <Grid item container md={8} direction={"column"} mt={2}>
            <FormLabel htmlFor="Contact" className="label">
              Street Name
            </FormLabel>
            <TextField
              id="streetName"
              name="streetName"
              placeholder="Street Name"
              value={contactFormik.values.streetName}
              onChange={contactFormik.handleChange}
              fullWidth
            />
          </Grid>
          <Grid item container md={8} direction={"column"} mt={2}>
            <FormLabel htmlFor="Contact" className="label">
              Phone
            </FormLabel>
            <TextField
              id="phoneNumber"
              name="phoneNumber"
              placeholder="Phone Number"
              value={contactFormik.values.phoneNumber}
              onChange={contactFormik.handleChange}
              fullWidth
            />
          </Grid>
          <Grid item container md={8} direction={"column"} mt={2}>
            <FormLabel htmlFor="Contact" className="label">
              Email
            </FormLabel>
            <TextField
              id="emailAddress"
              name="emailAddress"
              placeholder="Email Address"
              value={contactFormik.values.emailAddress}
              onChange={contactFormik.handleChange}
              fullWidth
            />
          </Grid>

          <Grid container justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              type="button"
              onClick={() => {
                createContact();
              }}>
              Submit
            </Button>
          </Grid>
        </FormSection>
      </form>
    </>
  );
};

export default page;
// / inline // <div className="App">
//   <h1>Pintura Image Editor</h1>
//   <br />
//   <h2>Inline</h2>
//   <br />

//   <div style={{ height: "90vh" }}>
//     <PinturaEditor
//       {...editorDefaults}
//       className={`${pintura} ${pinturaTheme}`}
//       src={"./Image-1.jpg"}
//       onLoad={(res) => {
//         console.log("load inline image", res);
//       }}
//       onProcess={({ dest }) => {
//         setInlineResult(URL.createObjectURL(dest));
//       }}
//     />
//   </div>

//   {!!inlineResult.length && (
//     <p>
//       <img src={inlineResult} alt="" />
//     </p>
//   )}

//   {/* <h2>Modal</h2>

//   <p>
//     <button onClick={() => setModalVisible(true)}>Open editor</button>
//   </p>
//   {modalVisible && (
//     <PinturaEditorModal
//       {...editorDefaults}
//       className={pintura}
//       src={"./Image-1.jpg"}
//       onLoad={(res) => console.log("load modal image", res)}
//       onHide={() => setModalVisible(false)}
//       onProcess={({ dest }) => setModalResult(URL.createObjectURL(dest))}
//     />
//   )}
//   {!!modalResult.length && (
//     <p>
//       <img src={modalResult} alt="" />
//     </p>
//   )} */}

//   <h2>Overlay</h2>

//   <p>
//     {!overlayVisible && (
//       <button onClick={() => setOverlayVisible(true)}>Edit image</button>
//     )}
//     {overlayVisible && (
//       <button onClick={() => setOverlayVisible(false)}>Close editor</button>
//     )}
//   </p>

//   {!overlayVisible && (
//     <p>
//       <img
//         width="512"
//         height="256"
//         src={overlayResult.imagePreview}
//         alt=""
//       />
//     </p>
//   )}
//   {overlayVisible && (
//     <div style={{ width: "512px", height: "256px" }}>
//       <PinturaEditorOverlay
//         src={"./Image-1.jpg"}
//         {...editorDefaults}
//         className={pintura}
//         imageState={overlayResult.imageState}
//         onLoad={(res) => console.log("load overlay image", res)}
//         onProcess={({ dest, imageState }) => {
//           setOverlayResult({
//             imagePreview: URL.createObjectURL(dest),
//             imageState: imageState,
//           });
//           setOverlayVisible(false);
//         }}
//       />
//     </div>
//   )}
// </div>

// const [inlineResult, setInlineResult] = useState("");

// // modal
// // const [modalVisible, setModalVisible] = useState(false);
// // const [modalResult, setModalResult] = useState("");

// // overlay
// const [overlayVisible, setOverlayVisible] = useState(false);
// const [overlayResult, setOverlayResult] = useState({
//   imagePreview: "./Image-1.jpg",
//   imageState: undefined,
// });
// const username = "yellowBridge";
// const oldPassword = "yellowBridge2024#";
// const newPassword = "yellowBridge2024";

// import { pintura } from "@pqina/pintura/pintura.module.css";
// import { index as pinturaTheme } from "./index.module.css";

// // react-pintura
// import {
//   PinturaEditor,
//   PinturaEditorModal,
//   PinturaEditorOverlay,
// } from "@pqina/react-pintura";

// // pintura
// import {
//   // editor
//   locale_en_gb,
//   createDefaultImageReader,
//   createDefaultImageWriter,
//   createDefaultShapePreprocessor,

//   // plugins
//   setPlugins,
//   plugin_crop,
//   plugin_crop_locale_en_gb,
//   plugin_finetune,
//   plugin_finetune_locale_en_gb,
//   plugin_finetune_defaults,
//   plugin_filter,
//   plugin_filter_locale_en_gb,
//   plugin_filter_defaults,
//   plugin_annotate,
//   plugin_annotate_locale_en_gb,
//   markup_editor_defaults,
//   markup_editor_locale_en_gb,
//   plugin_sticker_locale_en_gb,
// } from "@pqina/pintura";
// setPlugins(plugin_crop, plugin_finetune, plugin_filter, plugin_annotate);

// const editorDefaults = {
//   imageReader: createDefaultImageReader(),
//   imageWriter: createDefaultImageWriter(),
//   shapePreprocessor: createDefaultShapePreprocessor(),
//   ...plugin_finetune_defaults,
//   ...plugin_filter_defaults,
//   ...markup_editor_defaults,
//   locale: {
//     ...locale_en_gb,
//     ...plugin_crop_locale_en_gb,
//     ...plugin_finetune_locale_en_gb,
//     ...plugin_filter_locale_en_gb,
//     ...plugin_sticker_locale_en_gb,
//     ...plugin_annotate_locale_en_gb,
//     ...markup_editor_locale_en_gb,
//   },
// };
