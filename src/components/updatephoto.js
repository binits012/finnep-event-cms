"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const UpdatePhotoModal = ({ open, onClose, photo, photoTypes, onSubmit }) => {
  const [formValues, setFormValues] = useState({
    photoType: "",
    publish: false,
    position: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (open && photo) {
      setFormValues({
        photoType: photo.albumId || "",
        publish: photo.publish || false,
        position: photo.position || "",
      });
    }
  }, [open, photo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(formValues);
      onClose();
    } catch (error) {
      setError("Failed to update photo details. Please try again.");
      console.error("Failed to submit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const photoTypeOptions = photoTypes || [];

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          width: 400,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h5">Update Photo</Typography>
          <IconButton onClick={onClose} sx={{ color: "gray" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <form>
          <TextField
            label="Position"
            type="number"
            name="position"
            value={formValues.position}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Photo Type"
            name="photoType"
            value={formValues.photoType}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            select
          >
            {photoTypeOptions.length === 0 ? (
              <MenuItem value="">No photo types available</MenuItem>
            ) : (
              photoTypeOptions.map((type) => (
                <MenuItem key={type._id} value={type._id}>
                  {type.name}
                </MenuItem>
              ))
            )}
          </TextField>

          <TextField
            label="Status"
            name="publish"
            value={formValues.publish}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            select
          >
            <MenuItem value={true}>Publish</MenuItem>
            <MenuItem value={false}>Unpublish</MenuItem>
          </TextField>

          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </form>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Modal>
  );
};

export default UpdatePhotoModal;
