"use client";
import apiHandler from "@/RESTAPIs/helper";
import React, { useState, useEffect } from "react";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginImageEdit from "filepond-plugin-image-edit";
import FilePondPluginImageTransform from "filepond-plugin-image-transform";
import "react-toastify/dist/ReactToastify.css";
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

registerPlugin(
  FilePondPluginImagePreview,
  FilePondPluginImageEdit,
  FilePondPluginImageTransform
);

const AddPhotoPage = ({ onClose }) => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await apiHandler("GET", "/photo", true);
        setAlbums(response.data.photoType);
      } catch (error) {
        toast.error("Failed to fetch albums.");
      }
    };

    fetchAlbums();
  }, []);

  const uploadImage = async (file) => {
    if (!selectedAlbumId) {
      toast.error("Please select an album first.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64data = reader.result.split(",")[1];
      try {
        const response = await apiHandler("post", "/photo", true, false, {
          position: 1,
          image: `data:image/png;base64,${base64data}`,
          photoType: selectedAlbumId,
        });
        toast.success("Your image has been uploaded successfully");
        router.back();
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Something went wrong");
      } finally {
        setIsUploading(false);
      }
    };
  };

  const handleProcessFile = (error, file) => {
    if (error) {
      console.error("File processing error:", error);
      return;
    }
    setIsUploading(true);
    uploadImage(file.file);
  };

  const handleUploadClick = () => {
    if (files.length > 0) {
      handleProcessFile(null, { file: files[0].file });
    } else {
      console.error("No file selected");
    }
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 20px 10px" }}>Upload Image</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <FilePond
          files={files}
          onupdatefiles={setFiles}
          allowMultiple={false}
          name="file"
          labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
          stylePanelAspectRatio={0.65}
          styleItemPanelAspectRatio={0.58}
        />

        <FormControl style={{ marginBottom: "20px", width: "50%" }}>
          <InputLabel id="album-select-label">Select Album</InputLabel>
          <Select
            labelId="album-select-label"
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
          >
            {albums.map((album) => (
              <MenuItem key={album._id} value={album._id}>
                {album.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Grid>
          <Button
            variant="contained"
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            style={{
              justifyContent: "center",
              placeContent: "center",
              placeItems: "center",
              marginRight: "10px",
            }}
          >
            {isUploading ? "Uploading..." : "Upload Photo"}
          </Button>
          <Button
            variant="outlined"
            type="button"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </Grid>
      </form>
    </div>
  );
};

export default AddPhotoPage;
