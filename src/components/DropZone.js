import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import styled from "styled-components";

// import Text from "./Text";
import { BsUpload } from "react-icons/bs";
import { Typography } from "@mui/material";
import { IoCloseCircle } from "react-icons/io5";
// Pintura Image Editor
import "@pqina/pintura/pintura.module.css";
import { openDefaultEditor } from "@pqina/pintura";
import { toast } from "react-toastify";

const Container = styled.section`
  width: 60%;
  background: #fff000;
  /* muted-color */
  min-height: 100px;
  border: 1px dashed #bdbdbd;
  box-sizing: border-box;
  border-radius: 4px;
  /* display: flex;
  flex-direction: column;
  align-items: center; */
  display: flex;
  justify-content: center;
  align-content: center;

  .dropzone {
    width: 100%;
    height: 70vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    padding: 20px 0;
  }
  border: 1px dashed #090909;
  aside {
    margin: 30px;
    display: flex;

    .file-uploaded {
      position: relative;
      margin: 10px;
      .remove-pic {
        position: absolute;
        top: -20px;
        right: -20px;
        cursor: pointer;
      }
      img {
        border-radius: 5px;
      }
    }
  }
`;

const DropZone = ({ files, setFiles, ...props }) => {
  const [tempImages, setTempImages] = useState([]);
  // Based on the default React Dropzone image thumbnail example

  // This function is called when the user taps the edit button.
  // It opens the editor and returns the modified file when done

  const onDrop = useCallback(
    (acceptedFiles) => {
      //   // console.log(acceptedFiles, "check");
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );

      acceptedFiles.forEach((file) => {
        const reader = new FileReader();

        reader.onabort = () => console.log("file reading was aborted");
        reader.onerror = () => console.log("file reading has failed");
        reader.onload = (event) => {
          // Do whatever you want with the file contents
          const image = new Image();
          const binaryStr = reader.result;
          // console.log(binaryStr);
          image.src = event.target.result;
          // console.log(image, "check imagess");
          // image.onload = () => {
          //   console.log(
          //     // reader,
          //     image.width,
          //     image.height,
          //     image,
          //     "chck onload",
          //     file
          //   );
          // };
          // setFiles([
          //   {
          //     ...file,
          //     preview: reader.result,
          //     preview: URL.createObjectURL(file),
          //   },
          //   ...files,
          // ]);
        };
        reader.readAsArrayBuffer(file);
      });
    },
    [setFiles]
  );
  const onDropRejected = useCallback((err) => {
    console.log(err[0].errors[0].message);
    toast.error(`Error: ${err[0].errors[0].message} !!!!`);
  }, []);
  const { acceptedFiles, getRootProps, getInputProps, ...rest } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/*": [],
    },
    ...props,
  });
  // console.log(rest, "check rest props");
  useEffect(() => {}, [files]);
  return (
    <Container className="container">
      {files.length < 1 && (
        <div {...getRootProps({ className: "dropzone" })}>
          <input {...getInputProps()} />
          <BsUpload size={24} color="var(--primary)" />
          {/* <p>Drag 'n' drop some files here, or click to select files</p> */}
          <Typography variant="p">Drag and drop</Typography>
          <Typography variant="p">or</Typography>
          <Typography variant="p">Select Images</Typography>
        </div>
      )}
      {files.length > 0 && (
        <aside>
          {/* <h4>Files</h4> */}
          {/* <ul>
            {files?.map((file) => (
              <li key={file.path}>
                {file.path} - {file.size} bytes
              </li>
            ))}
          </ul> */}
          {files.map((file) => (
            <div key={file.path} className="file-uploaded">
              <IoCloseCircle
                className="remove-pic"
                size={24}
                color={"#f70909"}
                onClick={(e) =>
                  setFiles(files.filter((f) => f.path !== file.path))
                }
              />
              <img
                alt={file.name}
                src={file.preview}
                height={400}
                width={300}
              />
            </div>
          ))}
        </aside>
      )}
    </Container>
  );
};

export default DropZone;

// The `thumbButton` style positions the edit button in the bottom right corner of the thumbnail
const thumbsContainer = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 16,
  padding: 20,
};

const thumb = {
  position: "relative",
  display: "inline-flex",
  borderRadius: 2,
  border: "1px solid #eaeaea",
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: "border-box",
};

const thumbInner = {
  display: "flex",
  minWidth: 0,
  overflow: "hidden",
};

const img = {
  display: "block",
  width: "auto",
  height: "100%",
};

const thumbButton = {
  position: "absolute",
  right: 10,
  bottom: 10,
};

/******
 * 
 * 
 * 
 * const editImage = (image, done) => {
    const imageFile = image.pintura ? image.pintura.file : image;
    const imageState = image.pintura ? image.pintura.data : {};

    const editor = openDefaultEditor({
      src: imageFile,
      imageState,
    });

    editor.on("close", () => {
      // the user cancelled editing the image
    });

    editor.on("process", ({ dest, imageState }) => {
      Object.assign(dest, {
        pintura: { file: imageFile, data: imageState },
      });
      done(dest);
    });
  };
 * 
 * editImage(file, (images) => {
            console.log(acceptedFiles, "check");
            setFiles(
              acceptedFiles.map((file) =>
                Object.assign(file, {
                  preview: URL.createObjectURL(file),
                })
              )
            );
            console.log(images);
          });
 * 
 * 
 * // editImage(acceptedFiles[0], (acceptedFiles) => {
      //   // console.log(acceptedFiles, "check");
      //   setFiles(
      //     acceptedFiles.map((file) =>
      //       Object.assign(file, {
      //         preview: URL.createObjectURL(file),
      //       })
      //     )
      //   );
 * 
 */
