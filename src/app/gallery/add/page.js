"use client";
import apiHandler from "@/RESTAPIs/helper";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import FormSection from "@/components/FormSection";
import TextEditor from "@/components/TextEditor";
import {
  Grid,
  Typography,
  FormLabel,
  TextField,
  Button,
  Select,
  MenuItem,
} from "@mui/material";
import { useFormik } from "formik";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { toast } from "react-toastify";

import styled from "styled-components";
import { useParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { BsUpload } from "react-icons/bs";
import { GrDocumentExcel, GrTrash } from "react-icons/gr";
import { FaImages } from "react-icons/fa6";
import {
  AddAPhotoRounded,
  PlusOne,
  PlusOneOutlined,
} from "@mui/icons-material";
import { IoAdd } from "react-icons/io5";

const AddPhotoPage = ({}) => {
  const [images, setImages] = useState([]);
  const onDrop = useCallback(
    (acceptedFiles) => {
      //   // console.log(acceptedFiles, "check");
      setImages([
        ...images,
        ...acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        ),
      ]);

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
          // setImages([
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
    [setImages]
  );
  const onDropRejected = useCallback((err) => {
    console.log("seee", err, err[0].errors[0].message);
    toast.error(`Error: ${err[0].errors[0].message} !!!!`);
  }, []);
  const { acceptedFiles, getRootProps, getInputProps, ...rest } = useDropzone({
    onDrop,
    onDropRejected,
    maxFiles: 10,

    accept: {
      "image/*": [],
    },
  });
  const uploadPhotos = async (e) => {
    const formData = new FormData();
    formData.append("file", images[0]);
    try {
      const response = await apiHandler("POST", `photo`, true, true, formData);
      setImages([]);
      toast.success(`Photos uploaded!`);
      getEventTickets();
    } catch (err) {
      toast.error("Error uploading photos!");
    }
  };
  console.log(images, "check");
  return (
    <div style={{ width: "100%", height: "100%" }}>
      {images.length < 1 ? (
        <div
          {...getRootProps()}
          style={{
            height: 500,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "1px dashed black",
            cursor: "pointer",
            borderRadius: 6,
          }}
        >
          <input {...getInputProps()} />
          <FaImages size={256} color="green" />
          {/* <p>Drag 'n' drop some files here, or click to select files</p> */}
          <Typography variant="p">Drag and drop</Typography>
          <Typography variant="p">or</Typography>
          <Typography variant="p">Select Excel Files</Typography>
        </div>
      ) : (
        <div
          style={{
            // height: 100,
            display: "flex",
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          {images.map((image, i) => (
            <div
              key={i}
              style={{
                margin: 10,
                border: "1px solid #08080889",
                borderRadius: 8,
                maxWidth: 1000,
                overflowX: "scroll",
              }}
            >
              <Link href={image.preview} target="_blank" passHref>
                <img src={image.preview} alt={image.path} height={300} />
              </Link>
              {/* <span>{image.path}</span> */}
              <span>{(image.size / 1024).toFixed(2)} KB</span>
              <GrTrash
                onClick={(e) =>
                  setImages(images.filter((x, index) => index !== i))
                }
                size={24}
                color={"crimson"}
                style={{
                  cursor: "pointer",
                }}
              />
            </div>
          ))}
          <div
            style={{
              margin: 10,
              border: "1px solid #08080889",
              borderRadius: 8,
              height: 100,
              width: 200,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <IoAdd size={100} />
          </div>
        </div>
      )}
      <Grid item container md={2.5} direction="column">
        <Button
          variant="contained"
          onClick={uploadPhotos}
          disabled={!images.length}
          sx={{ height: 50 }}
        >
          Upload Photos
        </Button>
      </Grid>
    </div>
  );
};

export default AddPhotoPage;
