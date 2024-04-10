import React from "react";
import "react-quill/dist/quill.snow.css";
import styled from "styled-components";
import { Stack } from "@mui/material";
import dynamic from "next/dynamic";
// import { fileUpload } from "../../RESTAPIs/fileUpload";
import { useRef } from "react";

const modules = {
  toolbar: [
    [{ header: "1" }, { header: "2" }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    // ["link", "image"],
  ],
};

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const TextEditor = ({
  label,
  value,
  handleChange,
  required = false,
  setImageId,
}) => {
  const editorRef = useRef(null);
  const handleEditorChange = async (content) => {
    handleChange(content);

    // Check if an image is present in the content
    // const imageRegex = /<img.*?src=['"](.*?)['"].*?>/g;
    // const matches = content.match(imageRegex);

    // if (matches) {
    //   for (const match of matches) {
    //     const imageUrl = match.match(/src=['"](.*?)['"]/)[1];

    //     try {
    //       // Upload the image file
    //       const formData = new FormData();
    //       const response = await fetch(imageUrl);
    //       const blob = await response.blob();
    //       formData.append("file", blob, "image.png");

    //       // Call your fileUpload API here with the FormData
    //       const uploadResponse = await fileUpload(formData);
    //       setImageId(uploadResponse?.data?.result?.url);

    //       // Replace the image URL in the content with the uploaded image URL
    //       if (
    //         uploadResponse &&
    //         uploadResponse.data?.result?.url &&
    //         editorRef.current
    //       ) {
    //         content = content.replace(
    //           imageUrl,
    //           uploadResponse.data?.result?.url
    //         );
    //         editorRef.current.getEditor().setContents(content);
    //       }
    //     } catch (error) {
    //       console.error("Error uploading image:", error);
    //     }
    //   }
    // } else {
    //   setImageId(null);
    // }
  };

  return (
    <Stack>
      {!!label && (
        <StyleLabel>
          {label}
          {required && <span className="required-symbol">*</span>}
        </StyleLabel>
      )}
      {ReactQuill ? (
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={value}
          onChange={handleEditorChange}
          modules={{
            ...modules,
          }}
        />
      ) : (
        <p>Loading editor...</p>
      )}
    </Stack>
  );
};
export default TextEditor;
const StyleLabel = styled.label`
  line-height: 25px;
  font-weight: bold;

  span {
    color: red;
  }
  .required-symbol {
    color: red;
    margin-left: 4px;
    font-size: large;
  }
`;
