"use client";
import React, { useState, useEffect } from "react";
import Lightbox from "yet-another-react-lightbox";
import {
  Download,
  Fullscreen,
  Zoom,
  Thumbnails,
} from "yet-another-react-lightbox/plugins";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import {
  Backdrop,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Select,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import Link from "next/link";
import styled from "styled-components";
import apiHandler from "@/RESTAPIs/helper";
import Image from "next/image"; 
import PhotoModal from "@/components/PhotoModal"; 
import CopyToClipboard from "react-copy-to-clipboard";
import UpdatePhotoModal from "@/components/updatephoto";

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const res = await apiHandler("GET", "/photo", true);
        if (res.data && res.data.photo) {
          setImages(
            res.data.photo.map((item, index) => ({
              id: index + 1,
              src: item.photoLink,
              albumId: item.photoType[0]?._id,
              width: 800,
              height: 900,
              publish: item.publish || false,
              position: item.position || "",
              photoId: item._id || ""
            }))
          );
        }
        if (res.data && res.data.photoType) {
          const typeName = res.data.photoType;
          setAlbums(typeName);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching images:", error);
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleAlbumChange = (event) => {
    setSelectedAlbum(event.target.value);
  };

  const filteredImages = selectedAlbum
    ? images.filter((image) => image.albumId === selectedAlbum)
    : images;

  const handleUpdatePhoto = async (updatedData) => {
    if (selectedPhoto) {
      try {
        const photoId = selectedPhoto.photoId; 
        const response = await apiHandler(
          "patch", 
          `/photo/${photoId}`,
          true,
          false,
          {
            photoType: updatedData.photoType,
            publish: updatedData.publish,
            position: updatedData.position
          },
          null
        );
         
        if (response.status === 200) {
          // Update the local state directly
          setImages(prevImages => 
            prevImages.map(img => 
              img.photoId === photoId 
                ? { 
                    ...img, 
                    albumId: updatedData.photoType,
                    publish: updatedData.publish,
                    position: updatedData.position
                  }
                : img
            )
          );
          
          // Show success notification
          setNotification({
            show: true,
            message: "Photo updated successfully!",
            type: "success"
          });
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setNotification({ show: false, message: "", type: "" });
          }, 3000);
          
          // Close the modal
          setUpdateModalOpen(false);
        }
      } catch (error) {
        console.error("Error updating photo:", error);
        // Show error notification
        setNotification({
          show: true,
          message: "Failed to update photo. Please try again.",
          type: "error"
        });
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification({ show: false, message: "", type: "" });
        }, 3000);
        
        throw error; // Propagate error to be handled by the modal
      }
    }
  };

  // Add this function at the beginning of your component to determine colors based on photo type
  const getPhotoStatusColor = (image, albums) => {
    // First determine if image is published
    if (image.publish === false) {
      return {
        filter: "grayscale(80%)",
        badgeText: "Unpublished",
        badgeColor: "rgba(244, 67, 54, 0.85)" // Red for unpublished
      };
    }
    
    // For published images, determine color by photo type/album
    const albumType = albums.find(album => album._id === image.albumId);
    const typeName = albumType?.name?.toLowerCase() || "";
    
    switch (typeName) {
      case "Gallery":
        return { 
          filter: "none", 
          badgeText: "Normal",
          badgeColor: "rgba(76, 175, 80, 0.85)" // Green
        };
      
      default:
        return { 
          filter: "none", 
          badgeText: albumType?.name || "Other",
          badgeColor: "rgba(158, 158, 158, 0.85)" // Gray for other/unknown types
        };
    }
  };

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <GalleryContainer>
      <CustomBreadcrumbs
        title={"Gallery"}
        links={[
          {
            path: "/gallery",
            title: "Gallery",
            active: true,
          },
        ]}
      />
      {isLoading ? (
        <Backdrop
          sx={{
            color: "#fff",
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
          open={isLoading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      ) : (
        <>
          <Grid
            container
            justifyContent="flex-end"
            mb={2}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <Grid item xs={12} sm={6}>
              <Select
                value={selectedAlbum}
                onChange={handleAlbumChange}
                displayEmpty
                fullWidth
                sx={{ marginBottom: 2 }}
              >
                <MenuItem value="" disabled>
                  Select an album
                </MenuItem>
                <MenuItem value="">Show All</MenuItem>
                {albums.map((album) => (
                  <MenuItem key={album._id} value={album._id}>
                    {album.name}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Link passHref href="/gallery/add">
              <Button variant="contained">+ Add Photo</Button>
            </Link>
          </Grid>
        </>
      )}
      <GalleryWrapper>
        <ImageGrid>
          {filteredImages.map((image, index) => {
            const { filter, badgeText, badgeColor } = getPhotoStatusColor(image, albums);
            
            return (
              <ImageItem key={index} onClick={() => setSelectedImageIndex(index)}>
                <div className="image-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image
                    src={image.src}
                    alt={`Image ${index + 1}`}
                    width={image.width}
                    height={image.height}
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover",
                      filter: filter
                    }}
                  />
                  <StatusBadge style={{ backgroundColor: badgeColor }}>
                    {badgeText}
                  </StatusBadge>
                </div>

                <EditButton
                  className="edit-button-container"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(image);
                    setUpdateModalOpen(true);
                  }}
                >
                  <EditIcon />
                </EditButton>
              </ImageItem>
            );
          })}
        </ImageGrid>
      </GalleryWrapper>
      <Lightbox
        plugins={[Download, Fullscreen, Zoom, Thumbnails]}
        index={selectedImageIndex}
        open={selectedImageIndex >= 0}
        slides={images.map((image) => ({
          src: image.src,
          loading: "lazy",
        }))}
        close={() => setSelectedImageIndex(-1)}
      />

      {notification.show && (
        <NotificationBar type={notification.type}>
          {notification.message}
        </NotificationBar>
      )}

      <UpdatePhotoModal
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        photo={selectedPhoto}
        photoTypes={albums}
        onSubmit={handleUpdatePhoto}
      />
    </GalleryContainer>
  );
};

const GalleryContainer = styled.div` 
  margin: 20px;
  color: black;
`;

const GalleryWrapper = styled.div`
  padding: 20px;
  border-radius: 10px;
  @media (max-width: 768px) {
    padding: 0px;
  }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: masonry;
  gap: 10px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ImageItem = styled.div`
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  
  &:hover {
    .edit-button-container {
      opacity: 1;
    }
  }
`;

const EditButton = styled(Button)`
  background-color: rgba(255, 255, 255, 0.8);
  color: #333;
  min-width: unset;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
  position: absolute;
  top: 10px;
  left: 10px;
  opacity: 0.7;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: rgba(255, 255, 255, 0.95);
    transform: scale(1.05);
    opacity: 1;
  }
`;

const NotificationBar = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: ${props => props.type === 'success' ? '#4caf50' : '#f44336'};
  color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const StatusBadge = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 5;
`;

export default GalleryPage;
