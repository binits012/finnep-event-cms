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
import Link from "next/link";
import styled from "styled-components";
import apiHandler from "@/RESTAPIs/helper";
import Image from "next/image";

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

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
              albumId: item.photoType[0]._id,
              width: 800,
              height: 900,
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
          {filteredImages.map((image, index) => (
            <ImageItem key={index} onClick={() => setSelectedImageIndex(index)}>
              <Image
                src={image.src}
                alt={`Image ${index + 1}`}
                width={image.width}
                height={image.height}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </ImageItem>
          ))}
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
    </GalleryContainer>
  );
};

const GalleryContainer = styled.div``;

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
`;

export default GalleryPage;
